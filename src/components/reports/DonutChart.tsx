import { type Component, onMount, onCleanup, createEffect } from "solid-js";
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from "chart.js";
import type { CategoryTotal } from "~/db/queries";
import { formatCurrency } from "~/utils/currency";

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

interface Props {
  data: CategoryTotal[] | undefined;
  totalExpense: number;
}

const DonutChart: Component<Props> = (props) => {
  let canvasRef: HTMLCanvasElement | undefined;
  let chartInstance: Chart | undefined;

  onMount(() => {
    if (!canvasRef) return;
    createChart();
  });

  createEffect(() => {
    const cats = props.data;
    if (chartInstance && cats) {
      chartInstance.data.labels = cats.map((c) => `${c.icon} ${c.name}`);
      chartInstance.data.datasets![0]!.data = cats.map((c) => c.amount);
      (chartInstance.data.datasets![0]!.backgroundColor as string[]) = cats.map((c) => c.color);
      chartInstance.update("none");
    }
  });

  onCleanup(() => {
    chartInstance?.destroy();
  });

  function createChart() {
    if (!canvasRef) return;
    const cats = props.data ?? [];

    chartInstance = new Chart(canvasRef, {
      type: "doughnut",
      data: {
        labels: cats.map((c) => `${c.icon} ${c.name}`),
        datasets: [
          {
            data: cats.map((c) => c.amount),
            backgroundColor: cats.map((c) => c.color),
            borderWidth: 2,
            borderColor: "#fff",
            borderRadius: 4,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: "65%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed;
                return ` ${formatCurrency(val)}`;
              },
            },
            backgroundColor: "#1E293B",
            bodyColor: "#fff",
            bodyFont: { weight: "bold" },
            cornerRadius: 8,
            padding: 10,
          },
        },
      },
    });
  }

  return (
    <div class="relative" style={{ width: "200px", height: "200px", margin: "0 auto" }}>
      <canvas ref={canvasRef} />
      {/* Center label */}
      <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span class="text-xs text-gray-400">Total</span>
        <span class="text-base font-bold text-gray-800 tabular-nums">
          {formatCurrency(props.totalExpense)}
        </span>
      </div>
    </div>
  );
};

export default DonutChart;
