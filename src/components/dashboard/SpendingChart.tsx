import { type Component, onMount, onCleanup, createEffect } from 'solid-js'
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from 'chart.js'
import type { DailySpending } from '~/db/queries'
import { shortDayLabel } from '~/utils/date'
import { formatCurrency } from '~/utils/currency'

// Register only what we need (tree-shakeable)
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip)

interface Props {
  data: DailySpending[] | undefined
}

const SpendingChart: Component<Props> = (props) => {
  let canvasRef: HTMLCanvasElement | undefined
  let chartInstance: Chart | undefined

  onMount(() => {
    if (!canvasRef) return
    createChart()
  })

  createEffect(() => {
    const spending = props.data
    if (chartInstance && spending) {
      chartInstance.data.labels = spending.map((d) => shortDayLabel(d.date))
      chartInstance.data.datasets![0]!.data = spending.map((d) => d.amount)
      chartInstance.update('none')
    }
  })

  onCleanup(() => {
    chartInstance?.destroy()
  })

  function createChart() {
    if (!canvasRef) return
    const spending = props.data ?? []

    chartInstance = new Chart(canvasRef, {
      type: 'bar',
      data: {
        labels: spending.map((d) => shortDayLabel(d.date)),
        datasets: [
          {
            data: spending.map((d) => d.amount),
            backgroundColor: spending.map((_, i) =>
              i === spending.length - 1
                ? 'rgba(59, 130, 246, 0.85)'
                : 'rgba(59, 130, 246, 0.25)',
            ),
            borderRadius: 8,
            borderSkipped: false,
            barPercentage: 0.6,
            categoryPercentage: 0.7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => formatCurrency(ctx.parsed.y ?? 0),
            },
            backgroundColor: '#1E293B',
            titleColor: '#94A3B8',
            bodyColor: '#fff',
            bodyFont: { weight: 'bold' },
            cornerRadius: 8,
            padding: 10,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: '#9CA3AF',
              font: { size: 10, weight: 500 },
            },
          },
          y: {
            display: false,
            beginAtZero: true,
          },
        },
      },
    })
  }

  return (
    <div class="card p-4">
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm font-semibold text-gray-700">
          Pengeluaran 7 Hari
        </span>
        <div class="i-lucide-bar-chart-3 text-primary-400 text-base" />
      </div>
      <div style={{ height: '140px' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}

export default SpendingChart
