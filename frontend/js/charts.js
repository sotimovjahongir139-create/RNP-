const Charts = {
  _instances: {},

  destroy(id) {
    if (this._instances[id]) {
      this._instances[id].destroy();
      delete this._instances[id];
    }
  },

  renderBar(canvasId, labels, values) {
    this.destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    this._instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: '#534AB7cc',
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  },

  renderLine(canvasId, labels, datasets) {
    this.destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    const colors = ['#534AB7', '#10b981', '#f59e0b', '#ef4444'];
    this._instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: datasets.map((d, i) => ({
          label: d.label,
          data: d.values,
          borderColor: colors[i % colors.length],
          backgroundColor: 'transparent',
          tension: 0.3,
          pointRadius: 4,
        }))
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
      }
    });
  },
};
