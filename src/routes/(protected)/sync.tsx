import { createFileRoute } from "@tanstack/solid-router";
import { createSignal, onMount, createEffect, For, Show, onCleanup } from "solid-js";
import { syncService } from "~/services/sync.service";
import { Html5QrcodeScanner } from "html5-qrcode";
import QRCode from "qrcode";

export const Route = createFileRoute("/(protected)/sync")({
  component: SyncPage,
});

function SyncPage() {
  const [qrDataUrl, setQrDataUrl] = createSignal<string>("");
  const [isScanning, setIsScanning] = createSignal(false);
  const [manualPeerId, setManualPeerId] = createSignal("");
  const [tempName, setTempName] = createSignal(syncService.deviceName);
  const [copied, setCopied] = createSignal(false);
  let scanner: Html5QrcodeScanner | null = null;

  createEffect(async () => {
    const id = syncService.peerId;
    if (id) {
      const url = await QRCode.toDataURL(id);
      setQrDataUrl(url);
    }
  });

  onCleanup(() => {
    if (scanner) {
      scanner.clear().catch(console.error);
    }
  });

  const startScanner = () => {
    setIsScanning(true);
    scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false,
    );
    scanner.render(
      (decodedText) => {
        syncService.connectToPeer(decodedText);
        stopScanner();
      },
      (error) => {
        // console.warn(error)
      },
    );
  };

  const stopScanner = () => {
    if (scanner) {
      scanner
        .clear()
        .then(() => {
          setIsScanning(false);
        })
        .catch(console.error);
    } else {
      setIsScanning(false);
    }
  };

  const handleSaveName = () => {
    syncService.updateDeviceName(tempName());
  };

  const handleManualConnect = () => {
    const id = manualPeerId().trim();
    if (id) {
      syncService.connectToPeer(id);
      setManualPeerId("");
    }
  };

  const handleCopy = () => {
    const id = syncService.peerId;
    if (id) {
      navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div class="flex flex-col gap-6 pb-20">
      <header class="flex flex-col gap-1">
        <h1 class="text-2xl font-bold text-gray-900">Sinkronisasi P2P</h1>
        <p class="text-sm text-gray-500">
          Hubungkan perangkat untuk berbagi data tanpa cloud.
        </p>
      </header>

      {/* Device Info */}
      <section class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <label class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Nama Perangkat
          </label>
          <div class="flex gap-2">
            <input
              type="text"
              value={tempName()}
              onInput={(e) => setTempName(e.currentTarget.value)}
              class="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              onClick={handleSaveName}
              class="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium active:scale-95 transition-transform"
            >
              Simpan
            </button>
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            ID Perangkat (Peer ID)
          </label>
          <div class="flex gap-2">
            <code class="flex-1 text-xs bg-gray-50 p-3 rounded-xl break-all border border-gray-200 text-gray-600">
              {syncService.peerId || "Loading..."}
            </code>
            <button
              onClick={handleCopy}
              disabled={!syncService.peerId}
              class="px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <div class={copied() ? "i-lucide-check text-green-500" : "i-lucide-copy"} />
              <span class="text-xs font-semibold">{copied() ? "Tersalin" : "Salin"}</span>
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div
            class={`w-2 h-2 rounded-full ${
              syncService.status === "online" ? "bg-green-500" : 
              syncService.status === "standby" ? "bg-amber-500" : "bg-red-500"
            }`}
          />
          <span class="text-sm font-medium text-gray-700 capitalize">
            Status: {syncService.status === "standby" ? "Standby (Tab Lain Aktif)" : syncService.status}
          </span>
        </div>

        <Show when={syncService.status === "standby"}>
          <div class="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3 mt-2">
            <div class="i-lucide-info text-amber-600 mt-0.5" />
            <p class="text-[11px] text-amber-800 leading-relaxed">
              Sinkronisasi sedang dikelola oleh tab lain. Tutup tab ini atau tab lainnya untuk beralih kontrol.
            </p>
          </div>
        </Show>
      </section>

      {/* Actions */}
      <div class="grid grid-cols-2 gap-3">
        <button
          onClick={() => {}} // Download backup
          class="flex flex-col items-center gap-2 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm active:bg-gray-50 transition-colors"
        >
          <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <div class="i-lucide-download text-xl" />
          </div>
          <span class="text-sm font-semibold">Ekspor Data</span>
        </button>

        <button
          onClick={() => syncService.notifyChange()}
          disabled={!syncService.isLeader}
          class="flex flex-col items-center gap-2 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm active:bg-gray-50 transition-colors disabled:opacity-50 disabled:grayscale"
        >
          <div class="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <div class="i-lucide-refresh-cw text-xl" />
          </div>
          <span class="text-sm font-semibold">Sinkron Sekarang</span>
        </button>
      </div>

      {/* Pairing */}
      <section class="flex flex-col gap-4">
        <h2 class="text-lg font-bold text-gray-900 px-1">Tambah Perangkat</h2>

        <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-6">
          {/* Method 1: QR Code */}
          <div class="flex flex-col items-center gap-4">
            <div class="flex items-center gap-2 self-start text-xs font-bold text-gray-400 uppercase tracking-widest">
              <div class="i-lucide-qr-code" />
              Metode 1: Scan QR
            </div>
            
            <Show when={syncService.isLeader} fallback={
              <div class="py-10 text-center flex flex-col items-center gap-3">
                <div class="i-lucide-lock text-gray-300 text-3xl" />
                <p class="text-xs text-gray-400 px-4">Scanner hanya aktif di tab utama.</p>
              </div>
            }>
              <Show
                when={qrDataUrl()}
                fallback={
                  <div class="w-48 h-48 bg-gray-50 rounded-xl animate-pulse" />
                }
              >
                <img
                  src={qrDataUrl()}
                  alt="QR Code"
                  class="w-48 h-48 border-4 border-white shadow-sm"
                />
              </Show>
              <p class="text-xs text-center text-gray-500 max-w-[200px]">
                Tampilkan QR ini ke perangkat lain atau scan perangkat lawan.
              </p>

              <Show when={!isScanning()}>
                <button
                  onClick={startScanner}
                  class="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-98 transition-transform"
                >
                  <div class="i-lucide-scan text-lg" />
                  Buka Kamera Scanner
                </button>
              </Show>

              <Show when={isScanning()}>
                <div
                  id="reader"
                  class="w-full overflow-hidden rounded-xl border border-gray-200"
                />
                <button
                  onClick={stopScanner}
                  class="w-full py-3 bg-red-50 text-red-600 rounded-xl font-semibold active:scale-98 transition-transform"
                >
                  Batal Scan
                </button>
              </Show>
            </Show>
          </div>

          <div class="flex items-center gap-3">
            <div class="flex-1 h-px bg-gray-100" />
            <span class="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Atau</span>
            <div class="flex-1 h-px bg-gray-100" />
          </div>

          {/* Method 2: Manual Input */}
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
              <div class="i-lucide-keyboard" />
              Metode 2: Input Manual
            </div>
            <div class="flex gap-2">
              <input
                type="text"
                placeholder="Masukkan Peer ID..."
                value={manualPeerId()}
                onInput={(e) => setManualPeerId(e.currentTarget.value)}
                disabled={!syncService.isLeader}
                class="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
              />
              <button
                onClick={handleManualConnect}
                disabled={!manualPeerId().trim() || !syncService.isLeader}
                class="px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50 active:scale-95 transition-transform"
              >
                Hubungkan
              </button>
            </div>
            <p class="text-[11px] text-gray-400 leading-relaxed italic">
              Peer ID perangkat lain bisa ditemukan di bagian "Informasi Perangkat" pada halaman Sinkron mereka.
            </p>
          </div>
        </div>
      </section>

      {/* Active Peers */}
      <section class="flex flex-col gap-3">
        <h2 class="text-lg font-bold text-gray-900 px-1">
          Perangkat Terhubung
        </h2>
        <div class="flex flex-col gap-2">
          <For
            each={syncService.activePeers}
            fallback={
              <div class="p-8 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 italic text-gray-400 text-sm">
                Belum ada perangkat yang terhubung.
              </div>
            }
          >
            {(peerId) => (
              <div class="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <div class="i-lucide-smartphone text-lg" />
                  </div>
                  <div class="flex flex-col">
                    <span class="font-semibold text-gray-900">
                      ID: {peerId.slice(0, 8)}...
                    </span>
                    <span class="text-xs text-green-500 font-medium">
                      Terhubung
                    </span>
                  </div>
                </div>
                <div class="i-lucide-more-horizontal text-gray-400" />
              </div>
            )}
          </For>
        </div>
      </section>
    </div>
  );
}
