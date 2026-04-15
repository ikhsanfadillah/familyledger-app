import Peer, { type DataConnection } from 'peerjs'
import { createSignal } from 'solid-js'
import { db } from '~/db/schema'
import { getDeviceId } from '~/db/queries'
import { nanoid } from 'nanoid'

export type SyncPayload = {
  type: 'SYNC_REQUEST' | 'SYNC_DATA' | 'HI'
  senderId: string
  deviceName: string
  data?: {
    transactions: any[]
    budgets: any[]
  }
  timestamp: number
}

type LeaderMessage =
  | { type: 'LEADER_PING' }
  | { type: 'LEADER_PONG'; id: string }
  | { type: 'LEADER_CLAIM'; id: string }
  | { type: 'LEADER_RETIRED'; id: string }

class SyncService {
  private peer: Peer | null = null
  private connections: Map<string, DataConnection> = new Map()
  private channel: BroadcastChannel | null = null
  private tabId = nanoid(4)

  private _peerId = createSignal<string | null>(null)
  private _deviceName = createSignal<string>('Perangkat Baru')
  private _status = createSignal<'offline' | 'connecting' | 'online' | 'standby'>('offline')
  private _activePeers = createSignal<string[]>([])
  private _isLeader = createSignal<boolean>(false)

  constructor() { }

  async init() {
    if (this._status[0]() !== 'offline') return

    // Setup multi-tab coordination
    this.setupLeaderElection()
  }

  private async setupLeaderElection() {
    this.channel = new BroadcastChannel('familyledger_sync')

    this.channel.onmessage = (event: MessageEvent<LeaderMessage>) => {
      const msg = event.data
      switch (msg.type) {
        case 'LEADER_PING':
          if (this._isLeader[0]()) {
            this.channel?.postMessage({ type: 'LEADER_PONG', id: this.tabId })
          }
          break
        case 'LEADER_PONG':
        case 'LEADER_CLAIM':
          if (msg.id !== this.tabId) {
            this.setStandby()
          }
          break
        case 'LEADER_RETIRED':
          this.contestLeadership()
          break
      }
    }

    window.addEventListener('beforeunload', () => {
      if (this._isLeader[0]()) {
        this.channel?.postMessage({ type: 'LEADER_RETIRED', id: this.tabId })
      }
    })

    this.contestLeadership()
  }

  private async contestLeadership() {
    this._status[1]('connecting')

    // Ask if there's a leader
    this.channel?.postMessage({ type: 'LEADER_PING' })

    // Wait for pong
    let leaderFound = false
    const timeout = setTimeout(() => {
      if (!leaderFound) {
        this.claimLeadership()
      }
    }, 1000)

    const pongHandler = (event: MessageEvent<LeaderMessage>) => {
      if (event.data.type === 'LEADER_PONG' || event.data.type === 'LEADER_CLAIM') {
        leaderFound = true
        clearTimeout(timeout)
        this.setStandby()
        this.channel?.removeEventListener('message', pongHandler)
      }
    }
    this.channel?.addEventListener('message', pongHandler)
  }

  private async claimLeadership() {
    console.log(`Tab ${this.tabId} claiming leadership`)
    this._isLeader[1](true)
    this.channel?.postMessage({ type: 'LEADER_CLAIM', id: this.tabId })
    await this.startPeerJS()
  }

  private setStandby() {
    console.log(`Tab ${this.tabId} entering standby`)
    this._isLeader[1](false)
    this._status[1]('standby')
    this.stopPeerJS()
  }

  private async startPeerJS() {
    if (this.peer) return

    const deviceId = await getDeviceId()
    const device = await db.devices.get(deviceId)
    if (device) {
      this._deviceName[1](device.name)
    }

    this.peer = new Peer(deviceId)

    this.peer.on('open', (id) => {
      console.log('PeerJS open with ID:', id)
      this._peerId[1](id)
      this._status[1]('online')
      this.autoConnect()
    })

    this.peer.on('connection', (conn) => {
      this.setupConnection(conn)
    })

    this.peer.on('error', (err) => {
      console.error('PeerJS error:', err)
      if (err.type === 'unavailable-id') {
        console.warn('ID already taken, likely another tab. Re-contesting...')
        this.setStandby()
        this.contestLeadership()
      } else {
        this._status[1]('offline')
      }
    })

    this.peer.on('disconnected', () => {
      if (this._isLeader[0]()) {
        this._status[1]('offline')
        this.peer?.reconnect()
      }
    })
  }

  private stopPeerJS() {
    if (this.peer) {
      this.peer.destroy()
      this.peer = null
      this._peerId[1](null)
    }
  }

  // ... rest of the methods (getters and connection logic)
  get peerId() { return this._peerId[0]() }
  get deviceName() { return this._deviceName[0]() }
  get status() { return this._status[0]() }
  get activePeers() { return this._activePeers[0]() }
  get isLeader() { return this._isLeader[0]() }

  async updateDeviceName(name: string) {
    const id = await getDeviceId()
    await db.devices.update(id, { name })
    this._deviceName[1](name)
    if (this.isLeader) {
      this.broadcast({ type: 'HI', senderId: id, deviceName: name, timestamp: Date.now() })
    }
  }

  private setupConnection(conn: DataConnection) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn)
      this._activePeers[1](Array.from(this.connections.keys()))
      console.log('Connected to peer:', conn.peer)

      conn.send({
        type: 'HI',
        senderId: this.peerId,
        deviceName: this.deviceName,
        timestamp: Date.now()
      })

      this.requestSync(conn)
    })

    conn.on('data', (data: any) => {
      this.handleIncomingData(conn, data as SyncPayload)
    })

    conn.on('close', () => {
      this.connections.delete(conn.peer)
      this._activePeers[1](Array.from(this.connections.keys()))
    })

    conn.on('error', (err) => {
      console.error('Connection error:', err)
      this.connections.delete(conn.peer)
      this._activePeers[1](Array.from(this.connections.keys()))
    })
  }

  async connectToPeer(targetPeerId: string) {
    if (!this.isLeader) {
      console.warn('Cannot initiate connection from standby tab')
      return
    }
    if (!this.peer || this.connections.has(targetPeerId)) return
    const conn = this.peer.connect(targetPeerId)
    this.setupConnection(conn)

    const existing = await db.devices.get(targetPeerId)
    if (!existing) {
      await db.devices.add({
        id: targetPeerId,
        name: 'Peer ' + targetPeerId.slice(0, 4),
        role: 'client',
        lastSeen: Date.now()
      })
    }
  }

  private async autoConnect() {
    const devices = await db.devices.toArray()
    const myId = await getDeviceId()
    for (const device of devices) {
      if (device.id !== myId) {
        this.connectToPeer(device.id)
      }
    }
  }

  private async requestSync(conn: DataConnection) {
    conn.send({
      type: 'SYNC_REQUEST',
      senderId: this.peerId,
      deviceName: this.deviceName,
      timestamp: Date.now()
    })
  }

  private async handleIncomingData(conn: DataConnection, payload: SyncPayload) {
    switch (payload.type) {
      case 'HI':
        await db.devices.update(payload.senderId, {
          name: payload.deviceName,
          lastSeen: Date.now()
        })
        break

      case 'SYNC_REQUEST':
        const data = await this.exportSyncData()
        conn.send({
          type: 'SYNC_DATA',
          senderId: this.peerId,
          deviceName: this.deviceName,
          data,
          timestamp: Date.now()
        })
        break

      case 'SYNC_DATA':
        if (payload.data) {
          await this.importSyncData(payload.data)
        }
        break
    }
  }

  private async exportSyncData() {
    return {
      transactions: await db.transactions.toArray(),
      budgets: await db.budgets.toArray(),
    }
  }

  private async importSyncData(data: { transactions: any[], budgets: any[] }) {
    const merge = async (table: any, items: any[]) => {
      // Safely check if items is an array before iterating
      if (!Array.isArray(items)) return;
      for (const item of items) {
        const local = await table.get(item.id)
        if (!local || (item.updatedAt > local.updatedAt)) {
          await table.put(item)
        }
      }
    }
    await merge(db.transactions, data.transactions)
    await merge(db.budgets, data.budgets)
  }

  private broadcast(payload: any) {
    for (const conn of this.connections.values()) {
      if (conn.open) {
        conn.send(payload)
      }
    }
  }

  async notifyChange() {
    if (!this.isLeader) return
    const data = await this.exportSyncData()
    this.broadcast({
      type: 'SYNC_DATA',
      senderId: this.peerId,
      deviceName: this.deviceName,
      data,
      timestamp: Date.now()
    })
  }
}

export const syncService = new SyncService()
