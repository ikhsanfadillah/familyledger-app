import { createFileRoute, useNavigate } from "@tanstack/solid-router";
import { createSignal, For, onMount, Show } from "solid-js";
import { createUser, getUser, saveCategories } from "~/db/queries";
import { DEFAULT_CATEGORIES } from "~/constants/categories";
import { Button } from "~/components/ui/button";
import { useStep } from "~/hooks/use-step";
import { Card, CardContent } from "~/components/ui/card";

export const Route = createFileRoute("/")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  // Using our custom useStep hook, expecting 3 steps
  const [currentStep, { goToNextStep, goToPrevStep }] = useStep({
    startStep: 3,
    maxStep: 3,
  });

  // Identity Form State
  const [fullName, setFullName] = createSignal("");
  const [gender, setGender] = createSignal("male");

  // Categories Form State
  const [selectedCategories, setSelectedCategories] = createSignal<Set<string>>(
    new Set(DEFAULT_CATEGORIES.map((c) => c.id)),
  );

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleFinish = async () => {
    if (fullName().trim() === "") return;

    // 1. Create User
    await createUser(fullName().trim(), gender());

    // 2. Save Selected Categories
    const categoriesToSave = DEFAULT_CATEGORIES.filter((c) =>
      selectedCategories().has(c.id),
    );
    await saveCategories(categoriesToSave);

    // 3. Navigate to Dashboard123
    navigate({ to: "/dashboard" });
  };

  onMount(async () => {
    const user = await getUser();
    if (user) {
      navigate({ to: "/dashboard" });
    }
  });

  return (
    <div class="relative overflow-hidden flex flex-col min-h-dvh bg-card">
      <Show when={currentStep() > 1}>
        <div class="flex items-center justify-between p-6">
          <div class="flex items-center gap-2">
            <div
              class={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-colors ${
                currentStep() >= 2
                  ? "bg-primary text-primary-foreground"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              1
            </div>
            <div
              class={`h-1 w-12 rounded-full transition-colors ${
                currentStep() >= 3 ? "bg-primary" : "bg-gray-100"
              }`}
            />
            <div
              class={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-colors ${
                currentStep() >= 3
                  ? "bg-primary text-primary-foreground"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              2
            </div>
          </div>
          <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Langkah {currentStep() - 1} dari 2
          </span>
        </div>
      </Show>

      {/* STEP 1: Introduction */}
      <Show when={currentStep() === 1}>
        <div class="flex flex-col justify-between flex-1 items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div class="w-full h-auto mb-8 rounded flex items-center justify-center overflow-hidden relative border border-blue-100/50">
            {/* Using the generated image */}
            <img
              src="onboarding-hero.png"
              alt="FamilyLedger Welcome"
              class="w-full h-full object"
            />
          </div>
          <div>
            <h1 class="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Selamat Datang di <br />{" "}
              <span class="text-primary">FamilyLedger</span>
            </h1>
            <p class="text-base text-gray-500 mb-10 leading-relaxed px-6 mx-auto">
              Aplikasi pencatatan keuangan yang fokus pada privasi. Sepenuhnya
              offline dan aman.
            </p>
          </div>
          <div class="w-full p-6">
            <Button size="xl" class="w-full h-13" onClick={goToNextStep}>
              Mulai Sekarang
            </Button>
          </div>
        </div>
      </Show>

      {/* STEP 2: Profile Registration */}
      <Show when={currentStep() === 2}>
        <div class="animate-in p-6 fade-in slide-in-from-right-4 duration-500 flex-1 flex flex-col">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">
            Pendaftaran Profil
          </h1>
          <p class="text-sm text-gray-500 mb-8">
            Masukkan nama Anda untuk memulai.
          </p>

          <div class="space-y-6 flex-1">
            <div class="flex flex-col gap-2">
              <label class="text-sm font-semibold text-gray-700">
                Nama Panggilan
              </label>
              <input
                type="text"
                value={fullName()}
                onInput={(e) => setFullName(e.currentTarget.value)}
                placeholder="Misal: Ayah"
                class="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-gray-400 text-gray-900"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-semibold text-gray-700">
                Jenis Kelamin
              </label>
              <div class="flex w-full gap-4">
                <button
                  onClick={() => setGender("male")}
                  class={`flex-1 h-12 rounded-xl border transition-all font-medium flex items-center justify-center gap-2 ${
                    gender() === "male"
                      ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                      : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <div class="i-lucide-user text-lg" />
                  Laki-laki
                </button>
                <button
                  onClick={() => setGender("female")}
                  class={`flex-1 h-12 rounded-xl border transition-all font-medium flex items-center justify-center gap-2 ${
                    gender() === "female"
                      ? "border-accent bg-accent/10 text-accent ring-2 ring-accent/20"
                      : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <div class="i-lucide-user text-lg" />
                  Perempuan
                </button>
              </div>
            </div>
          </div>

          <div class="flex gap-4 mt-10">
            <Button
              variant="outline"
              onClick={goToPrevStep}
              class="flex-1 h-13 "
            >
              Kembali
            </Button>
            <Button
              disabled={fullName().trim() === ""}
              onClick={goToNextStep}
              class="flex-1 h-13"
            >
              Lanjutkan
            </Button>
          </div>
        </div>
      </Show>

      {/* STEP 3: Category Selection */}
      <Show when={currentStep() === 3}>
        <div class="p-6 animate-in fade-in slide-in-from-right-4 duration-500 flex-1 flex flex-col">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Pilih Kategori</h1>
          <p class="text-sm text-gray-500 mb-8">
            Pilih setidaknya satu kategori keuangan Anda.
          </p>

          <div
            class="grid grid-cols-2 gap-3 mb-8 max-h-[45vh] overflow-y-auto w-full p-1"
            style="box-sizing: border-box;"
          >
            <For each={DEFAULT_CATEGORIES}>
              {(cat) => {
                const isSelected = () => selectedCategories().has(cat.id);
                return (
                  <button
                    onClick={() => toggleCategory(cat.id)}
                    class={`flex items-center gap-3 p-3 rounded border transition-all text-left ${
                      isSelected()
                        ? "border-primary bg-blue-50/50 shadow-sm"
                        : "border-gray-100 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div
                      class="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-white shadow-sm border border-black/5"
                      style={{ color: cat.color }}
                    >
                      {cat.icon}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-xs font-semibold text-gray-900 truncate">
                        {cat.name}
                      </div>
                      <div class="text-[0.65rem] text-gray-500 capitalize">
                        {cat.type === "expense"
                          ? "Pengeluaran"
                          : cat.type === "income"
                            ? "Pemasukan"
                            : "Lainnya"}
                      </div>
                    </div>
                    <div
                      class={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected()
                          ? "bg-primary border-primary"
                          : "border-gray-300"
                      }`}
                    >
                      <Show when={isSelected()}>
                        <div class="w-1.5 h-1.5 bg-white rounded-full" />
                      </Show>
                    </div>
                  </button>
                );
              }}
            </For>
          </div>

          <div class="flex gap-4 mt-auto">
            <Button
              variant="outline"
              size="xl"
              onClick={goToPrevStep}
              class="flex-1 h-13"
            >
              Kembali
            </Button>
            <Button
              disabled={selectedCategories().size === 0}
              onClick={handleFinish}
              size="xl"
              class="flex-1 h-13"
            >
              Selesai
            </Button>
          </div>
        </div>
      </Show>
      {/* Stepper Header (Hidden on Step 1 Intro) */}
    </div>
  );
}
