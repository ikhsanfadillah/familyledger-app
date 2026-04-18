import { type Component, onMount, onCleanup, createEffect } from "solid-js";
import { Chart, DoughnutController, ArcElement, Tooltip } from "chart.js";
import type { MonthlyTotals } from "~/db/queries";

Chart.register(DoughnutController, ArcElement, Tooltip);

interface Props {
  totals: MonthlyTotals | undefined;
}

const SavingsRing: Component<Props> = (props) => {
  let _canvasRef: HTMLCanvasElement | undefined;
  let chartInstance: Chart | undefined;

  const savingsRate = () => {
    const t = props.totals;
    if (!t || t.income <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((t.balance / t.income) * 100)));
  };

  const ringColor = () => {
    const rate = savingsRate();
    if (rate >= 50) return "#10B981";
    if (rate >= 20) return "#F59E0B";
    return "#EF4444";
  };

  onMount(() => {
    if (!_canvasRef) return;
    createChart();
  });

  createEffect(() => {
    const rate = savingsRate();
    const color = ringColor();
    if (chartInstance) {
      chartInstance.data.datasets![0]!.data = [rate, 100 - rate];
      (chartInstance.data.datasets![0]!.backgroundColor as string[]) = [
        color,
        "rgba(229, 231, 235, 0.3)",
      ];
      chartInstance.update("none");
    }
  });

  onCleanup(() => {
    chartInstance?.destroy();
  });

  function createChart() {
    if (!_canvasRef) return;
    const rate = savingsRate();
    const color = ringColor();

    chartInstance = new Chart(_canvasRef, {
      type: "doughnut",
      data: {
        datasets: [
          {
            data: [rate, 100 - rate],
            backgroundColor: [color, "rgba(229, 231, 235, 0.3)"],
            borderWidth: 0,
            borderRadius: 12,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: "75%",
        plugins: {
          tooltip: { enabled: false },
        },
      },
    });
  }

  return (
    <div class="card p-4 flex items-center gap-4">
      <div class="relative" style={{ width: "80px", height: "80px", "flex-shrink": "0" }}>
        <canvas ref={_canvasRef} />
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-lg font-extrabold tabular-nums" style={{ color: ringColor() }}>
            {savingsRate()}%
          </span>
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-gray-700">Tingkat Tabungan</p>
        <p class="text-xs text-gray-400 mt-0.5">
          {savingsRate() >= 50
            ? "Hebat! Kamu menabung lebih dari setengah."
            : savingsRate() >= 20
              ? "Bagus! Terus tingkatkan."
              : "Ayo mulai menabung lebih banyak."}
        </p>
      </div>
    </div>
  );
};

export default SavingsRing;
