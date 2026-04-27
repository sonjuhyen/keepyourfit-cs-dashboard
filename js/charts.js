// Chart.js 래퍼 — 주간 처리량 + 카테고리 분포
class ChartManager {
  constructor() {
    this.weekChart = null;
    this.categoryChart = null;
  }

  drawWeek(week) {
    const ctx = document.getElementById('weekChart');
    if (!ctx) return;
    if (this.weekChart) this.weekChart.destroy();
    const labels = Object.keys(week || {});
    const auto = labels.map(d => week[d].auto || 0);
    const manual = labels.map(d => week[d].manualSent || 0);
    this.weekChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.map(l => l.slice(5)),
        datasets: [
          { label: '자동', data: auto, backgroundColor: '#10B981' },
          { label: '수동', data: manual, backgroundColor: '#3B82F6' }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } } },
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  drawCategory(autoLogs) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    if (this.categoryChart) this.categoryChart.destroy();
    const counts = {};
    for (const l of autoLogs || []) {
      const k = l.category || 'unknown';
      counts[k] = (counts[k] || 0) + 1;
    }
    const labels = Object.keys(counts);
    const data = labels.map(l => counts[l]);
    this.categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFD93D', '#A78BFA', '#F472B6'].slice(0, labels.length || 1) }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label(ctx) {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0) || 1;
                const pct = ((ctx.parsed / total) * 100).toFixed(1);
                return `${ctx.label}: ${ctx.parsed}건 (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }
}

window.chartManager = new ChartManager();
