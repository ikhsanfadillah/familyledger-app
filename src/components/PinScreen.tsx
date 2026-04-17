import { createSignal, Show, type Component } from "solid-js";
import { initDb } from "~/db/schema";
import { ledgerStore } from "~/stores/ledgerStore";

export const PinScreen: Component = () => {
  const [pin, setPin] = createSignal("");
  const [error, setError] = createSignal("");
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (pin().length !== 6) {
      setError("PIN must be 6 digits");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    try {
      await initDb(pin());
      await ledgerStore.unlockDb();
    } catch (err) {
      console.error(err);
      setError("Failed to unlock database. Incorrect PIN or corrupted data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNuke = async () => {
    if (confirm("Are you sure you want to nuke all databases? This will delete EVERYTHING.")) {
      try {
        const dbs = await indexedDB.databases();
        for (const db of dbs) {
          if (db.name?.startsWith('FamilyLedger') || db.name?.startsWith('yjs-ledger')) {
            indexedDB.deleteDatabase(db.name);
          }
        }
        alert("Databases nuked. Refreshing...");
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert("Failed to nuke databases");
      }
    }
  };

  return (
    <div class="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            <div class="i-lucide-lock" />
          </div>
          <h1 class="text-2xl font-bold text-slate-800">Unlock Ledger</h1>
          <p class="text-sm text-slate-500 mt-2">Enter your 6-digit PIN to decrypt your secure local database.</p>
        </div>

        <form onSubmit={handleSubmit} class="space-y-6">
          <div>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pin()}
              onInput={(e) => setPin(e.currentTarget.value)}
              placeholder="••••••"
              class="w-full text-center text-3xl tracking-[1em] p-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-colors"
              disabled={isSubmitting()}
            />
          </div>
          
          <Show when={error()}>
            <p class="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded-lg">{error()}</p>
          </Show>

          <button
            type="submit"
            disabled={pin().length !== 6 || isSubmitting()}
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting() ? (
              <div class="i-lucide-loader-2 animate-spin text-xl" />
            ) : (
              "Unlock Database"
            )}
          </button>
        </form>

        <div class="mt-8 border-t border-red-100 pt-6">
          <button
            type="button"
            onClick={handleNuke}
            class="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
          >
            <div class="i-lucide-skull" />
            Nuke Database (Dev Only)
          </button>
        </div>
      </div>
    </div>
  );
};
