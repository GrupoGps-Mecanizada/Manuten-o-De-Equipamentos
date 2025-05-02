/**
 * Sistema de Dupla Checagem de Manutenção
 * Módulo: Relatórios
 */

const Reports = (() => {
  // Variáveis privadas
  let reportData = null;
  let reportCharts = {};
  
  // Inicialização
  function initialize() {
    setupEventListeners();
    setupInitialDates();
  }
  
  // Configurar event listeners
  function setupEventListeners() {
    // Gerar relatório
    document.getElementById('generate-report').addEventListener('click', generateReport);
    
    // Exportar dados
    document.getElementById('export-excel').addEventListener('click', function() {
      exportData('excel');
    });
    
    document.getElementById('export-pdf').addEventListener('click', function() {
      exportData('pdf');
    });
    
    document.getElementById('print-report').addEventListener('click', function() {
      window.print();
    });
  }
  
  // Configurar datas iniciais
  function setupInitialDates() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const startDateInput = document.getElementById('report-start-date');
    const endDateInput = document.getElementById('report-end-date');
    
    if (startDateInput) {
      startDateInput.valueAsDate = firstDay;
    }
    
    if (endDateInput) {
      endDateInput.valueAsDate = today;
    }
  }
  
  // Gerar relatório
  function generateReport() {
    const startDate = document.getElementById('report-start-date').value;
    const endDate = document.getElementById('report-end-date').value;
    
    // Validação das datas
    if (!startDate || !endDate) {
      showNotification('Por favor, selecione as datas inicial e final para o relatório.', 'error');
      return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      showNotification('Datas inválidas.', 'error');
      return;
    }
    
    if (end < start) {
      showNotification('A data final não pode ser anterior à data inicial.', 'error');
      return;
    }
    
    // Buscar dados do relatório
    showLoading(true, 'Gerando relatório...');
    
    API.generateReport(startDate, endDate)
      .then(data => {
        if (!data || !data.success) {
          throw new Error(data?.message || 'Erro ao gerar relatório');
        }
        
        reportData = data;
        updateReportView();
      })
      .catch(error => {
        console.error("Erro ao gerar relatório:", error);
        showNotification("Erro ao gerar relatório: " + error.message, "error");
        document.getElementById('report-content').style.display = 'none';
      })
      .finally(() => {
        showLoading(false);
      });
  }
  
  // Atualizar visualização do relatório
  function updateReportView() {
    // Mostrar área de conteúdo do relatório
    document.getElementById('report-content').style.display = 'block';
    
    // Atualizar cards de resumo
    updateReportSummary();
    
    // Renderizar gráficos
    renderReportCharts();
  }
  
  // Atualizar cards de resumo
  function updateReportSummary() {
    if (!reportData || !reportData.summary) {
      return;
    }
    
    const summary = reportData.summary;
    
    // Atualizar valores
    document.getElementById('report-total').textContent = summary.total || 0;
    document.getElementById('report-completed').textContent = summary.completed || 0;
    document.getElementById('report-pending').textContent = summary.pending || 0;
    document.getElementById('report-verified').textContent = summary.verified || 0;
  }
  
  // Renderizar gráficos do relatório
  function renderReportCharts() {
    if (!reportData) {
      return;
    }
    
    // Renderizar gráfico de problemas
    renderProblemCategoryChart();
    
    // Renderizar gráfico de área
    renderAreaChart();
    
    // Renderizar gráfico mensal
    renderMonthlyChart();
  }
  
  // Renderizar gráfico de categorias de problema
  function renderProblemCategoryChart() {
    const canvas = document.getElementById('report-problem-chart');
    if (!canvas || !reportData.analysis || !reportData.analysis.byProblemCategory) {
      return;
    }
    
    // Destruir gráfico anterior se existir
    if (reportCharts.problemChart) {
      reportCharts.problemChart.destroy();
      reportCharts.problemChart = null;
    }
    
    const ctx = canvas.getContext('2d');
    const problemData = reportData.analysis.byProblemCategory;
    
    // Limitando às 10 categorias mais frequentes
    const topCategories = problemData
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    const labels = topCategories.map(item => item.name);
    const data = topCategories.map(item => item.count);
    const colors = [
      '#3366CC', '#DC3912', '#FF9900', '#109618', 
      '#990099', '#0099C6', '#DD4477', '#66AA00', 
      '#B82E2E', '#316395'
    ];
    
    reportCharts.problemChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Ocorrências',
          data: data,
          backgroundColor: labels.map((_, index) => colors[index % colors.length]),
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Categorias de Problemas',
            font: { size: 16 }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Quantidade'
            }
          }
        }
      }
    });
  }
  
  // Renderizar gráfico de área
  function renderAreaChart() {
    const canvas = document.getElementById('report-area-chart');
    if (!canvas || !reportData.analysis || !reportData.analysis.byArea) {
      return;
    }
    
    // Destruir gráfico anterior se existir
    if (reportCharts.areaChart) {
      reportCharts.areaChart.destroy();
      reportCharts.areaChart = null;
    }
    
    const ctx = canvas.getContext('2d');
    const areaData = reportData.analysis.byArea;
    
    const labels = areaData.map(item => item.name);
    const data = areaData.map(item => item.count);
    
    reportCharts.areaChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: ['#4ECDC4', '#FF6B6B', '#F7B801', '#A5A58D', '#7B68EE'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { boxWidth: 15 }
          },
          title: {
            display: true,
            text: 'Manutenções por Área',
            font: { size: 16 }
          }
        }
      }
    });
  }
  
  // Renderizar gráfico mensal
  function renderMonthlyChart() {
    const canvas = document.getElementById('report-monthly-chart');
    if (!canvas || !reportData.analysis || !reportData.analysis.byMonth) {
      return;
    }
    
    // Destruir gráfico anterior se existir
    if (reportCharts.monthlyChart) {
      reportCharts.monthlyChart.destroy();
      reportCharts.monthlyChart = null;
    }
    
    const ctx = canvas.getContext('2d');
    const monthlyData = reportData.analysis.byMonth;
    
    const labels = monthlyData.map(item => item.name);
    const data = monthlyData.map(item => item.count);
    
    reportCharts.monthlyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Manutenções',
          data: data,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          fill: true,
          tension: 0.2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true },
          title: {
            display: true,
            text: 'Manutenções por Mês',
            font: { size: 16 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Quantidade'
            }
          }
        }
      }
    });
  }
  
  // Exportar dados
  function exportData(format) {
    const startDate = document.getElementById('report-start-date').value;
    const endDate = document.getElementById('report-end-date').value;
    
    // Validação das datas
    if (!startDate || !endDate) {
      showNotification('Por favor, selecione as datas para exportação.', 'error');
      return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      showNotification('Datas inválidas.', 'error');
      return;
    }
    
    if (end < start) {
      showNotification('A data final não pode ser anterior à data inicial.', 'error');
      return;
    }
    
    // Solicitar exportação
    showLoading(true, `Preparando exportação para ${format.toUpperCase()}...`);
    
    API.exportData(startDate, endDate, format)
      .then(response => {
        if (!response.success || !response.url) {
          throw new Error(response.message || 'URL de exportação não gerada');
        }
        
        showNotification(`Arquivo ${response.fileName} pronto para download.`, 'success');
        
        // Abrir URL para download
        window.open(response.url, '_blank');
      })
      .catch(error => {
        console.error(`Erro ao exportar para ${format}:`, error);
        showNotification(`Erro ao exportar para ${format.toUpperCase()}: ${error.message}`, 'error');
      })
      .finally(() => {
        showLoading(false);
      });
  }
  
  // API pública
  return {
    initialize,
    generateReport,
    exportData
  };
})();

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  Reports.initialize();
});
