import { createFileRoute } from "@tanstack/solid-router";
import {
  createSignal,
  createEffect,
  Show,
  onCleanup,
} from "solid-js";
import { Html5QrcodeScanner } from "html5-qrcode";
import QRCode from "qrcode";
import { ledgerStore } from "~/stores/ledgerStore";
import { coreDb } from "~/db/schema";
import { CreateLedgerModal } from "~/components/ledger/CreateLedgerModal";

export const Route = createFileRoute("/(protected)/ledgers")({
  component: LedgersPage,
});

function LedgersPage() {
  const [qrDataUrl, setQrDataUrl] = createSignal<string>("");
  const [isScanning, setIsScanning] = createSignal(false);
  const [copied, setCopied] = createSignal(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = createSignal(false);
  let scanner: Html5QrcodeScanner | null = null;

  createEffect(async () => {
    const ledger = ledgerStore.activeLedger();
    if (ledger) {
      const payload = JSON.stringify({
        type: 'LEDGER_INVITE',
        ledgerId: ledger.id,
        ledgerKey: ledger.key,
        name: ledger.name
      });
      const url = await QRCode.toDataURL(payload);
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
      async (decodedText) => {
        try {
          const payload = JSON.parse(decodedText);
          if (payload.type === 'LEDGER_INVITE') {
            const existing = await coreDb.ledgers.get(payload.ledgerId);
            if (!existing) {
              await coreDb.ledgers.add({
                id: payload.ledgerId,
                name: payload.name,
                key: payload.ledgerKey,
                themeColor: '#10B981',
                createdAt: Date.now(),
                updatedAt: Date.now()
              });
              await ledgerStore.switchLedger(payload.ledgerId);
              alert(`Berhasil bergabung ke ledger ${payload.name}!`);
            } else {
              alert(`Anda sudah memiliki akses ke ledger ${payload.name}`);
            }
          }
        } catch (err) {
          console.warn("Invalid QR", err);
          alert("QR Code tidak valid atau bukan undangan Ledger.");
        }
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

  const handleCopyInvite = () => {
    const ledger = ledgerStore.activeLedger();
    if (ledger) {
      const payload = JSON.stringify({
        type: 'LEDGER_INVITE',
        ledgerId: ledger.id,
        ledgerKey: ledger.key,
        name: ledger.name
      });
      // Convert to base64 so it can be pasted easily
      const encoded = btoa(payload);
      navigator.clipboard.writeText(encoded);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePasteInvite = async () => {
    const text = prompt("Masukkan kode undangan (Base64):");
    if (!text) return;
    try {
      const decoded = atob(text);
      const payload = JSON.parse(decoded);
      if (payload.type === 'LEDGER_INVITE') {
        const existing = await coreDb.ledgers.get(payload.ledgerId);
        if (!existing) {
          await coreDb.ledgers.add({
            id: payload.ledgerId,
            name: payload.name,
            key: payload.ledgerKey,
            themeColor: '#10B981',
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
          await ledgerStore.switchLedger(payload.ledgerId);
          alert(`Berhasil bergabung ke ledger ${payload.name}!`);
        } else {
          alert(`Anda sudah memiliki akses ke ledger ${payload.name}`);
        }
      }
    } catch (err) {
      alert("Kode undangan tidak valid.");
    }
  };

  return (
    <div class="flex flex-col gap-6 pb-24">
      <header class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Manajemen Ledger</h1>
          <p class="text-sm text-gray-500">
            Kelola ruang kerja keuangan Anda.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors shadow-sm"
        >
          <div class="i-lucide-plus text-xl" />
        </button>
      </header>

      {/* Info Card */}
      <section class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <div class="i-lucide-network text-xl" />
          </div>
          <div>
            <h2 class="font-semibold text-gray-900">Status Sinkronisasi</h2>
            <p class="text-xs text-gray-500">
              {ledgerStore.connectedPeers()} perangkat saat ini terhubung ke ledger <b>{ledgerStore.activeLedger()?.name}</b>.
            </p>
          </div>
        </div>
      </section>

      {/* Invite QR */}
      <section class="flex flex-col gap-4 mt-2">
        <h2 class="text-lg font-bold text-gray-900 px-1">Undang ke {ledgerStore.activeLedger()?.name}</h2>

        <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-6">
          <div class="flex flex-col items-center gap-4">
            <div class="flex items-center gap-2 self-start text-xs font-bold text-gray-400 uppercase tracking-widest">
              <div class="i-lucide-qr-code" />
              Kode QR Undangan
            </div>

            <Show
              when={qrDataUrl()}
              fallback={
                <div class="w-48 h-48 bg-gray-50 rounded-xl animate-pulse" />
              }
            >
              <img
                src={qrDataUrl()}
                alt="QR Code Invite"
                class="w-48 h-48 border-4 border-white shadow-sm"
              />
            </Show>
            <p class="text-xs text-center text-gray-500 max-w-[200px]">
              Minta anggota keluarga untuk memindai QR ini dari perangkat mereka.
            </p>

            <button
              onClick={handleCopyInvite}
              class="px-5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <div class={copied() ? "i-lucide-check text-green-500" : "i-lucide-copy"} />
              <span class="text-xs font-semibold">
                {copied() ? "Kode Tersalin" : "Salin Kode Undangan"}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Join Ledger */}
      <section class="flex flex-col gap-4 mt-2">
        <h2 class="text-lg font-bold text-gray-900 px-1">Bergabung ke Ledger Lain</h2>
        <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
          <Show when={!isScanning()}>
            <button
              onClick={startScanner}
              class="w-full py-4 bg-gray-900 text-white rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-98 transition-transform"
            >
              <div class="i-lucide-scan text-lg" />
              Buka Scanner QR
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

          <div class="flex items-center gap-3 py-2">
            <div class="flex-1 h-px bg-gray-100" />
            <span class="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
              Atau
            </span>
            <div class="flex-1 h-px bg-gray-100" />
          </div>

          <button
            onClick={handlePasteInvite}
            class="w-full py-3 bg-gray-50 text-gray-600 border border-gray-200 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-98 transition-transform"
          >
            <div class="i-lucide-clipboard-paste text-lg" />
            Tempel Kode Undangan
          </button>
        </div>
      </section>

      <CreateLedgerModal 
        isOpen={isCreateModalOpen()} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}
