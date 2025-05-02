// Verificar dependências
if (!window.API || !window.Utilities || typeof Chart === 'undefined') {
  console.error("Erro CRÍTICO: Dependências API, Utilities ou Chart.js não carregadas antes de reports.js");
} else {
  console.log("Reports.js - Dependências parecem carregadas.");
}


const Reports = (() => {
  // ... (todo o código interno do módulo Reports permanece o mesmo) ...
  let reportData = null;
  let reportCharts = {}; // Usar ID do canvas como chave

  function initialize() {
    console.log("Reports.initialize() chamado."); // Log
    setupEventListeners();
    setupInitialDates();
    // Não gera relatório automaticamente
  }

  function setupEventListeners() { /* ... código inalterado ... */
      document.getElementById('generate-report')?.removeEventListener('click', generateReport);
      document.getElementById('generate-report')?.addEventListener('click', generateReport);
      document.getElementById('export-excel')?.removeEventListener('click', () => exportData('excel'));
      document.getElementById('export-excel')?.addEventListener('click', () => exportData('excel'));
      document.getElementById('export-pdf')?.removeEventListener('click', () => exportData('pdf'));
      document.getElementById('export-pdf')?.addEventListener('click', () => exportData('pdf'));
      document.getElementById('print-report')?.removeEventListener('click', () => window.print());
      document.getElementById('print-report')?.addEventListener('click', () => window.print());
  }

  function setupInitialDates() { /* ... código inalterado ... */
       const today = new Date(); const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
       const startDateInput = document.getElementById('report-start-date'); const endDateInput = document.getElementById('report-end-date');
       if (startDateInput && !startDateInput.value) { startDateInput.valueAsDate = firstDay; }
       if (endDateInput && !endDateInput.value) { endDateInput.valueAsDate = today; }
  }

  function generateReport() { /* ... código inalterado ... */
       const startDate = document.getElementById('report-start-date').value; const endDate = document.getElementById('report-end-date').value;
       if (!startDate || !endDate) { if(typeof Utilities !== 'undefined') Utilities.showNotification('Selecione as datas.', 'error'); return; }
       const start = new Date(startDate); const end = new Date(endDate);
       if (isNaN(start.getTime()) || isNaN(end.getTime())) { if(typeof Utilities !== 'undefined') Utilities.showNotification('Datas inválidas.', 'error'); return; }
       if (end < start) { if(typeof Utilities !== 'undefined') Utilities.showNotification('Data final anterior à inicial.', 'error'); return; }

       if(typeof Utilities !== 'undefined') Utilities.showLoading(true, 'Gerando relatório...'); else console.log("Gerando relatório...");
       API.generateReport(startDate, endDate)
         .then(data => {
           if (!data || !data.success) { throw new Error(data?.message || 'Erro ao gerar relatório'); }
           reportData = data; updateReportView();
         })
         .catch(error => { console.error("Erro gerar relatório:", error); if(typeof Utilities !== 'undefined') Utilities.showNotification("Erro gerar relatório: " + error.message, "error"); document.getElementById('report-content').style.display = 'none'; })
         .finally(() => { if(typeof Utilities !== 'undefined') Utilities.showLoading(false); });
  }

  function updateReportView() { /* ... código inalterado ... */
       document.getElementById('report-content').style.display = 'block';
       updateReportSummary(); renderReportCharts();
  }

  function updateReportSummary() { /* ... código inalterado ... */
       if (!reportData || !reportData.summary) { return; } const summary = reportData.summary;
       document.getElementById('report-total').textContent = summary.total || 0; document.getElementById('report-completed').textContent = summary.completed || 0; document.getElementById('report-pending').textContent = summary.pending || 0; document.getElementById('report-verified').textContent = summary.verified || 0;
  }

  function renderReportCharts() { /* ... código inalterado ... */
       if (!reportData) { return; }
       renderProblemCategoryChart(); renderAreaChart(); renderMonthlyChart();
  }

  function renderProblemCategoryChart() { /* ... código inalterado ... */
      const canvasId = 'report-problem-chart'; const canvas = document.getElementById(canvasId); if (!canvas || !reportData.analysis?.byProblemCategory) { return; }
      if (reportCharts[canvasId]) { reportCharts[canvasId].destroy(); reportCharts[canvasId] = null; }
      const ctx = canvas.getContext('2d'); const problemData = reportData.analysis.byProblemCategory;
      const topCategories = problemData.sort((a, b) => b.count - a.count).slice(0, 10);
      const labels = topCategories.map(item => item.name); const data = topCategories.map(item => item.count);
      const colors = ['#3366CC', '#DC3912', '#FF9900', '#109618', '#990099', '#0099C6', '#DD4477', '#66AA00', '#B82E2E', '#316395'];
      const options = { /* ... opções ... */
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, title: { display: true, text: 'Categorias de Problemas', font: { size: 16 } } },
            scales: { x: { beginAtZero: true, title: { display: true, text: 'Quantidade' } } }
      };
      if(data.length > 0) { // Só cria se houver dados
          reportCharts[canvasId] = new Chart(ctx, { type: 'bar', data: { labels: labels, datasets: [{ label: 'Ocorrências', data: data, backgroundColor: labels.map((_, index) => colors[index % colors.length]), borderWidth: 1 }] }, options: options });
      } else { ctx.clearRect(0,0, canvas.width, canvas.height); }
  }

  function renderAreaChart() { /* ... código inalterado ... */
       const canvasId = 'report-area-chart'; const canvas = document.getElementById(canvasId); if (!canvas || !reportData.analysis?.byArea) { return; }
       if (reportCharts[canvasId]) { reportCharts[canvasId].destroy(); reportCharts[canvasId] = null; }
       const ctx = canvas.getContext('2d'); const areaData = reportData.analysis.byArea;
       const labels = areaData.map(item => item.name); const data = areaData.map(item => item.count);
       const options = { /* ... opções ... */
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { boxWidth: 15 } }, title: { display: true, text: 'Manutenções por Área', font: { size: 16 } } }
       };
       if(data.length > 0) {
          reportCharts[canvasId] = new Chart(ctx, { type: 'pie', data: { labels: labels, datasets: [{ data: data, backgroundColor: ['#4ECDC4', '#FF6B6B', '#F7B801', '#A5A58D', '#7B68EE'], borderWidth: 1 }] }, options: options });
       } else { ctx.clearRect(0,0, canvas.width, canvas.height); }
  }

  function renderMonthlyChart() { /* ... código inalterado ... */
       const canvasId = 'report-monthly-chart'; const canvas = document.getElementById(canvasId); if (!canvas || !reportData.analysis?.byMonth) { return; }
       if (reportCharts[canvasId]) { reportCharts[canvasId].destroy(); reportCharts[canvasId] = null; }
       const ctx = canvas.getContext('2d'); const monthlyData = reportData.analysis.byMonth;
       const labels = monthlyData.map(item => item.name); const data = monthlyData.map(item => item.count);
       const options = { /* ... opções ... */
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: true }, title: { display: true, text: 'Manutenções por Mês', font: { size: 16 } } },
            scales: { y: { beginAtZero: true, title: { display: true, text: 'Quantidade' } } }
       };
       if(data.length > 0) {
          reportCharts[canvasId] = new Chart(ctx, { type: 'line', data: { labels: labels, datasets: [{ label: 'Manutenções', data: data, borderColor: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.1)', fill: true, tension: 0.2 }] }, options: options });
       } else { ctx.clearRect(0,0, canvas.width, canvas.height); }
  }

  function exportData(format) { /* ... código inalterado ... */
      const startDate = document.getElementById('report-start-date').value; const endDate = document.getElementById('report-end-date').value;
      if (!startDate || !endDate) { if(typeof Utilities !== 'undefined') Utilities.showNotification('Selecione datas para exportar.', 'error'); return; }
      const start = new Date(startDate); const end = new Date(endDate); if (isNaN(start.getTime()) || isNaN(end.getTime())) { if(typeof Utilities !== 'undefined') Utilities.showNotification('Datas inválidas.', 'error'); return; } if (end < start) { if(typeof Utilities !== 'undefined') Utilities.showNotification('Data final anterior à inicial.', 'error'); return; }

      if(typeof Utilities !== 'undefined') Utilities.showLoading(true, `Preparando ${format.toUpperCase()}...`); else console.log("Preparando exportação...");
      API.exportData(startDate, endDate, format)
        .then(response => {
          if (!response.success || !response.url) { throw new Error(response.message || 'URL não gerada'); }
          if(typeof Utilities !== 'undefined') Utilities.showNotification(`Arquivo ${response.fileName} pronto.`, 'success');
          window.open(response.url, '_blank');
        })
        .catch(error => { console.error(`Erro exportar ${format}:`, error); if(typeof Utilities !== 'undefined') Utilities.showNotification(`Erro exportar ${format.toUpperCase()}: ${error.message}`, 'error'); })
        .finally(() => { if(typeof Utilities !== 'undefined') Utilities.showLoading(false); });
  }

  // API pública
  return {
    initialize,
    generateReport,
    exportData
  };
})();

// REMOVER O LISTENER ABAIXO:
/*
document.addEventListener('DOMContentLoaded', function() {
  Reports.initialize();
});
*/
