// 차트 관리 - Chart.js를 이용한 데이터 시각화

class ChartManager {
    constructor() {
        this.categoryChart = null;
        this.statusChart = null;
    }

    // 차트 초기화
    initCharts(stats) {
        // 기존 차트 파괴
        if (this.categoryChart) {
            this.categoryChart.destroy();
        }
        if (this.statusChart) {
            this.statusChart.destroy();
        }

        // 문의 유형별 통계 차트
        this.initCategoryChart(stats.categoryStats);
        
        // 처리 현황 차트  
        this.initStatusChart(stats);
    }

    // 문의 유형별 통계 도넛 차트
    initCategoryChart(categoryStats) {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        const colors = [
            '#FF6B6B', // 배송 - 빨강
            '#4ECDC4', // 환불 - 청록
            '#45B7D1', // 제품 - 파랑  
            '#96CEB4'  // 일반 - 초록
        ];

        this.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categoryStats.map(stat => stat.name),
                datasets: [{
                    data: categoryStats.map(stat => stat.count),
                    backgroundColor: colors,
                    borderColor: colors.map(color => color + '80'),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed}건 (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // 처리 현황 막대 차트
    initStatusChart(stats) {
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;

        const statusData = [
            { label: '승인', count: stats.approval.approved, color: '#10B981' },
            { label: '거부', count: stats.approval.rejected, color: '#EF4444' },
            { label: '대기', count: stats.approval.pending, color: '#F59E0B' }
        ];

        this.statusChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: statusData.map(item => item.label),
                datasets: [{
                    label: '문의 수',
                    data: statusData.map(item => item.count),
                    backgroundColor: statusData.map(item => item.color + '20'),
                    borderColor: statusData.map(item => item.color),
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        },
                        grid: {
                            color: '#F3F4F6'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed.y}건`;
                            }
                        }
                    }
                }
            }
        });
    }

    // 차트 업데이트
    updateCharts(stats) {
        if (this.categoryChart) {
            this.categoryChart.data.datasets[0].data = stats.categoryStats.map(stat => stat.count);
            this.categoryChart.update();
        }

        if (this.statusChart) {
            const statusData = [stats.approval.approved, stats.approval.rejected, stats.approval.pending];
            this.statusChart.data.datasets[0].data = statusData;
            this.statusChart.update();
        }
    }

    // 차트 리사이즈
    resizeCharts() {
        if (this.categoryChart) {
            this.categoryChart.resize();
        }
        if (this.statusChart) {
            this.statusChart.resize();
        }
    }
}

// 글로벌 인스턴스
window.chartManager = new ChartManager();