/**
 * Sistema de Dupla Checagem de Manutenção
 * Módulo: Dashboard com gráficos avançados
 */

const Dashboard = (() => {
  // Variáveis privadas
  let dashboardData = null;
  let charts = {};
  
  // Inicializar dashboard
  function initialize() {
    setupEventListeners();
    loadDashboardData();
  }
  
  // Configurar event listeners
  function setupEventListeners() {
    // Filtro de período do Dashboard
    document.getElementById('period-filter').addEventListener('change', function() {
      loadDashboardData();
    });
    
    // Botões de refresh
    document.getElementById('refresh-type-chart').addEventListener('click', function() {
      if (dashboardData) renderMaintenanceTypeChart(); 
      else showNotification("Dados do dashboard ainda não carregados.", "info");
    });
    
    document.getElementById('refresh-status-chart').addEventListener('click', function() {
      if (dashboardData) renderMaintenanceStatusChart(); 
      else showNotification("Dados do dashboard ainda não carregados.", "info");
    });
    
    document.getElementById('refresh-equipment-ranking').addEventListener('click', function() {
      if (dashboardData) updateEquipmentRanking(); 
      else showNotification("Dados do dashboard ainda não carregados.", "info");
    });
    
    // Botões específicos para os novos gráficos
    document.getElementById('refresh-area-chart').addEventListener('click', function() {
      if (dashboardData) renderAreaDistributionChart(); 
      else showNotification("Dados do dashboard ainda não carregados.", "info");
    });
    
    document.getElementById('refresh-problem-chart').addEventListener('click', function() {
      if (dashboardData) renderProblemCategoriesChart(); 
      else showNotification("Dados do dashboard ainda não carregados.", "info");
    });
    
    document.getElementById('refresh-trend-chart').addEventListener('click', function() {
      if (dashboardData) renderMonthlyTrendChart(); 
      else showNotification("Dados do dashboard ainda não carregados.", "info");
    });
  }
  
  // Carregar dados do dashboard
  function loadDashboardData() {
    showLoading(true, 'Carregando dashboard...');
    const period = document.getElementById('period-filter').value;
    
    API.getDashboardData(period)
      .then(data => {
        if (!data || data.error) {
          console.error("Erro ao carregar dados do dashboard:", data);
          showNotification('Erro ao carregar dados do dashboard: ' + (data ? data.message : 'Resposta inválida'), 'error');
          dashboardData = {}; // Evitar erros em funções dependentes
          updateDashboardWithError();
        } else {
          dashboardData = data;
          updateDashboard();
        }
      })
      .catch(error => {
        console.error("Falha na requisição do dashboard:", error);
        showNotification('Falha ao buscar dados do dashboard: ' + error.message, 'error');
        dashboardData = {}; // Evitar erros
        updateDashboardWithError();
      })
      .finally(() => {
        showLoading(false);
      });
  }
  
  // Função para atualizar o dashboard em caso de erro no carregamento
  function updateDashboardWithError() {
    // Limpa os cards de resumo
    document.getElementById('total-maintenance').textContent = '-';
    document.getElementById('pending-verification').textContent = '-';
    document.getElementById('completed-verifications').textContent = '-';
    document.getElementById('critical-maintenance').textContent = '-';
    document.getElementById('verification-trend').textContent = '-';
    
    // Limpa tabelas e gráficos
    document.getElementById('equipment-ranking-tbody').innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--danger-color);">Erro ao carregar dados.</td></tr>';
    document.getElementById('recent-maintenance-tbody').innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--danger-color);">Erro ao carregar dados.</td></tr>';
    
    // Destruir ou limpar gráficos
    Object.values(charts).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
    
    // Reinicializar objeto de gráficos
    charts = {};
    
    // Mostrar mensagem de erro nos containers dos gráficos
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
      container.innerHTML = '<p style="text-align: center; color: var(--danger-color); padding: 20px;">Erro ao carregar gráfico.</p>';
    });
  }
  
  // Atualizar o dashboard com os dados carregados
  function updateDashboard() {
    if (!dashboardData || typeof dashboardData !== 'object') {
      console.warn("Tentando atualizar dashboard sem dados válidos.");
      updateDashboardWithError();
      return;
    }
    
    console.log("Atualizando dashboard com dados:", dashboardData);
    
    updateSummaryCards();
    updateEquipmentRanking();
    updateRecentMaintenanceTable();
    renderAllCharts();
  }
  
  // Atualizar cards de resumo
  function updateSummaryCards() {
    const summary = dashboardData.summary || {};
    document.getElementById('total-maintenance').textContent = summary.totalMaintenance?.toString() ?? '-';
    document.getElementById('pending-verification').textContent = summary.pendingVerification?.toString() ?? '-';
    document.getElementById('completed-verifications').textContent = summary.completed?.toString() ?? '-';
    document.getElementById('critical-maintenance').textContent = summary.criticalMaintenance?.toString() ?? '-';
    
    const trend = summary.verificationTrend; // Pode ser null ou undefined
    const trendElement = document.getElementById('verification-trend');
    if (typeof trend === 'number' && !isNaN(trend)) {
      trendElement.textContent = trend >= 0 ? `+${trend.toFixed(1)}%` : `${trend.toFixed(1)}%`;
      trendElement.className = 'card-trend ' + (trend >= 0 ? 'trend-up' : 'trend-down');
    } else {
      trendElement.textContent = '-';
      trendElement.className = 'card-trend';
    }
  }
  
  // Atualizar ranking de equipamentos
  function updateEquipmentRanking() {
    const tbody = document.getElementById('equipment-ranking-tbody');
    tbody.innerHTML = ''; // Limpa antes de preencher
    
    if (!dashboardData || !Array.isArray(dashboardData.equipmentRanking)) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Dados de ranking indisponíveis.</td></tr>';
      console.warn("Dados de ranking não encontrados em dashboardData");
      return;
    }
    
    const ranking = dashboardData.equipmentRanking;
    
    if (ranking.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum equipamento encontrado no período.</td></tr>';
      return;
    }
    
    // Limitar aos top 10
    const topRanking = ranking.slice(0, 10);
    
    topRanking.forEach(equipment => {
      // Validar dados de cada equipamento antes de usar
      const eqId = equipment.id || 'ID Desconhecido';
      const eqType = equipment.type || 'Tipo Desconhecido';
      const count = equipment.maintenanceCount || 0;
      const lastDate = formatDate(equipment.lastMaintenanceDate); // Formata ou retorna '-'
      const status = equipment.lastStatus || 'Status Desconhecido';
      const statusClass = getStatusClass(status);
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${eqId}</td>
        <td>${eqType}</td>
        <td>${count}</td>
        <td>${lastDate}</td>
        <td><span class="status-badge status-${statusClass}">${status}</span></td>
      `;
      tbody.appendChild(row);
    });
  }
  
  // Atualizar tabela de manutenções recentes
  function updateRecentMaintenanceTable() {
    // Implementar carregamento e exibição de manutenções recentes
    // usando API.getMaintenanceList() ou dados do dashboardData
    // [Código omitido por brevidade]
  }
  
  // Renderizar todos os gráficos
  function renderAllCharts() {
    // Renderizar gráficos básicos existentes
    renderMaintenanceTypeChart();
    renderMaintenanceStatusChart();
    
    // Renderizar novos gráficos avançados
    renderAreaDistributionChart();
    renderProblemCategoriesChart();
    renderMonthlyTrendChart();
    renderCriticalVsRegularChart();
    renderVerificationResultsChart();
    renderMaintenanceFrequencyChart();
  }
  
  // Renderizar gráfico de tipos de manutenção
  function renderMaintenanceTypeChart() {
    const canvas = document.getElementById('maintenance-type-chart');
    if (!canvas || !dashboardData || !Array.isArray(dashboardData.maintenanceTypes) || dashboardData.maintenanceTypes.length === 0) {
      console.warn("Não é possível renderizar gráfico de tipos: canvas não encontrado ou dados ausentes/vazios.");
      const container = canvas?.parentElement;
      if (container) container.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 20px;">Nenhum dado de tipo de manutenção para exibir.</p>';
      if (charts.maintenanceTypeChart) { 
        charts.maintenanceTypeChart.destroy(); 
        charts.maintenanceTypeChart = null;
      }
      return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Destroi gráfico anterior se existir
    if (charts.maintenanceTypeChart) {
      charts.maintenanceTypeChart.destroy();
      charts.maintenanceTypeChart = null;
    }
    
    // Processa os dados recebidos
    const typesData = {};
    dashboardData.maintenanceTypes.forEach(item => {
      if (item && typeof item.type === 'string' && typeof item.count === 'number') {
        typesData[item.type] = (typesData[item.type] || 0) + item.count;
      }
    });
    
    // Define cores padrão
    const defaultColors = ['#0d6efd', '#6f42c1', '#fd7e14', '#20c997', '#dc3545', '#ffc107', '#6c757d', '#17a2b8'];
    const labels = Object.keys(typesData);
    const dataValues = Object.values(typesData);
    const backgroundColors = labels.map((_, index) => defaultColors[index % defaultColors.length]);
    
    // Cria o novo gráfico
    charts.maintenanceTypeChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: dataValues,
          backgroundColor: backgroundColors,
          borderWidth: 1,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 12 } },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.label || '';
                if (label) { label += ': '; }
                if (context.parsed !== null) {
                  label += context.formattedValue;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) + '%' : '0%';
                  label += ` (${percentage})`;
                }
                return label;
              }
            }
          },
          title: {
            display: false,
          }
        }
      }
    });
  }
  
  // Renderizar gráfico de status das manutenções
  function renderMaintenanceStatusChart() {
    const canvas = document.getElementById('maintenance-status-chart');
    if (!canvas || !dashboardData || !Array.isArray(dashboardData.maintenanceStatuses) || dashboardData.maintenanceStatuses.length === 0) {
      console.warn("Não é possível renderizar gráfico de status: canvas não encontrado ou dados ausentes/vazios.");
      const container = canvas?.parentElement;
      if (container) container.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 20px;">Nenhum dado de status para exibir.</p>';
      if (charts.maintenanceStatusChart) { 
        charts.maintenanceStatusChart.destroy(); 
        charts.maintenanceStatusChart = null;
      }
      return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Destroi gráfico anterior
    if (charts.maintenanceStatusChart) {
      charts.maintenanceStatusChart.destroy();
      charts.maintenanceStatusChart = null;
    }
    
    // Processa dados
    const statusData = {};
    dashboardData.maintenanceStatuses.forEach(item => {
      if (item && typeof item.status === 'string' && typeof item.count === 'number') {
        // Normaliza status conhecidos para agrupamento (opcional)
        const normalizedStatus = normalizeStatus(item.status);
        statusData[normalizedStatus] = (statusData[normalizedStatus] || 0) + item.count;
      }
    });
    
    // Mapeamento de status para cores
    const statusColors = {
      'Pendente': '#ffc107', // Amarelo
      'Verificado': '#0d6efd', // Azul
      'Concluído': '#28a745', // Verde
      'Reprovado': '#dc3545', // Vermelho
      'Outro': '#6c757d' // Cinza
    };
    
    const labels = Object.keys(statusData);
    const dataValues = Object.values(statusData);
    // Obtem cores com base no status normalizado
    const backgroundColors = labels.map(label => statusColors[label] || statusColors['Outro']);
    
    // Cria novo gráfico
    charts.maintenanceStatusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: dataValues,
          backgroundColor: backgroundColors,
          borderWidth: 1,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 12 } },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.label || '';
                if (label) { label += ': '; }
                if (context.parsed !== null) {
                  label += context.formattedValue;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) + '%' : '0%';
                  label += ` (${percentage})`;
                }
                return label;
              }
            }
          },
          title: { display: false }
        }
      }
    });
  }
  
  // NOVOS GRÁFICOS AVANÇADOS
  
  // Renderizar gráfico de distribuição por área (interna/externa)
  function renderAreaDistributionChart() {
    const canvas = document.getElementById('area-distribution-chart');
    if (!canvas || !dashboardData || !dashboardData.advancedCharts || !dashboardData.advancedCharts.areaDistribution) {
      return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (charts.areaDistributionChart) {
      charts.areaDistributionChart.destroy();
      charts.areaDistributionChart = null;
    }
    
    const areaData = dashboardData.advancedCharts.areaDistribution;
    const labels = Object.keys(areaData);
    const data = Object.values(areaData);
    const backgroundColors = ['#4ECDC4', '#FF6B6B']; // Cores para áreas internas/externas
    
    charts.areaDistributionChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColors,
          borderWidth: 1,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          title: {
            display: true,
            text: 'Distribuição por Área (Interna/Externa)',
            font: { size: 16 }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const percentage = ((context.parsed / context.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                return `${context.label}: ${context.formattedValue} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }
  
  // Renderizar gráfico de categorias de problemas
  function renderProblemCategoriesChart() {
    const canvas = document.getElementById('problem-categories-chart');
    if (!canvas || !dashboardData || !dashboardData.advancedCharts || !dashboardData.advancedCharts.problemCategories) {
      return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (charts.problemCategoriesChart) {
      charts.problemCategoriesChart.destroy();
      charts.problemCategoriesChart = null;
    }
    
    const categoryData = dashboardData.advancedCharts.problemCategories;
    const sortedEntries = Object.entries(categoryData).sort((a, b) => b[1] - a[1]); // Ordenar por contagem
    const top8Categories = sortedEntries.slice(0, 8); // Pegar top 8
    
    // Se houver mais categorias, agrupar o restante como "Outros"
    let otherCount = 0;
    if (sortedEntries.length > 8) {
      sortedEntries.slice(8).forEach(entry => {
        otherCount += entry[1];
      });
      if (otherCount > 0) {
        top8Categories.push(['Outros', otherCount]);
      }
    }
    
    const labels = top8Categories.map(entry => entry[0]);
    const data = top8Categories.map(entry => entry[1]);
    
    // Definir cores para as categorias
    const colorPalette = [
      '#3366CC', '#DC3912', '#FF9900', '#109618', 
      '#990099', '#0099C6', '#DD4477', '#66AA00', '#B82E2E'
    ];
    
    charts.problemCategoriesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Ocorrências',
          data: data,
          backgroundColor: labels.map((_, index) => colorPalette[index % colorPalette.length]),
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y', // Barras horizontais para melhor visualização de muitas categorias
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Categorias de Problemas mais Frequentes',
            font: { size: 16 }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Número de Ocorrências'
            }
          }
        }
      }
    });
  }
  
  // Renderizar gráfico de tendência mensal
  function renderMonthlyTrendChart() {
    const canvas = document.getElementById('monthly-trend-chart');
    if (!canvas || !dashboardData || !dashboardData.advancedCharts || !dashboardData.advancedCharts.monthlyTrend) {
      return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (charts.monthlyTrendChart) {
      charts.monthlyTrendChart.destroy();
      charts.monthlyTrendChart = null;
    }
    
    const trendData = dashboardData.advancedCharts.monthlyTrend;
    const labels = Object.keys(trendData);
    const data = Object.values(trendData);
    
    charts.monthlyTrendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Manutenções',
          data: data,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderWidth: 2,
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
            text: 'Tendência Mensal de Manutenções',
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
  
  // Renderizar gráfico de manutenções críticas vs regulares
  function renderCriticalVsRegularChart() {
    const canvas = document.getElementById('critical-vs-regular-chart');
    if (!canvas || !dashboardData || !dashboardData.advancedCharts || !dashboardData.advancedCharts.criticalVsRegular) {
      return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (charts.criticalVsRegularChart) {
      charts.criticalVsRegularChart.destroy();
      charts.criticalVsRegularChart = null;
    }
    
    const criticalData = dashboardData.advancedCharts.criticalVsRegular;
    const labels = Object.keys(criticalData);
    const data = Object.values(criticalData);
    
    charts.criticalVsRegularChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: ['#F44336', '#2196F3'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          title: {
            display: true,
            text: 'Manutenções Críticas vs Regulares',
            font: { size: 16 }
          }
        }
      }
    });
  }
  
  // Renderizar gráfico de resultados de verificações
  function renderVerificationResultsChart() {
    const canvas = document.getElementById('verification-results-chart');
    if (!canvas || !dashboardData || !dashboardData.advancedCharts || !dashboardData.advancedCharts.verificationResults) {
      return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (charts.verificationResultsChart) {
      charts.verificationResultsChart.destroy();
      charts.verificationResultsChart = null;
    }
    
    const resultsData = dashboardData.advancedCharts.verificationResults;
    const labels = Object.keys(resultsData);
    const data = Object.values(resultsData);
    
    // Cores específicas para resultados
    const resultColors = {
      'Aprovado': '#4CAF50',
      'Reprovado': '#F44336',
      'Ajustes': '#FFC107',
      'Outro': '#9E9E9E'
    };
    
    const backgroundColors = labels.map(label => resultColors[label] || resultColors['Outro']);
    
    charts.verificationResultsChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right' },
          title: {
            display: true,
            text: 'Resultados de Verificações',
            font: { size: 16 }
          }
        }
      }
    });
  }
  
  // Renderizar gráfico de frequência de manutenções
  function renderMaintenanceFrequencyChart() {
    const canvas = document.getElementById('maintenance-frequency-chart');
    if (!canvas || !dashboardData || !dashboardData.advancedCharts || !dashboardData.advancedCharts.maintenanceFrequency) {
      return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (charts.maintenanceFrequencyChart) {
      charts.maintenanceFrequencyChart.destroy();
      charts.maintenanceFrequencyChart = null;
    }
    
    const frequencyData = dashboardData.advancedCharts.maintenanceFrequency;
    const entries = Object.entries(frequencyData);
    
    // Ordenar por intervalo (menores intervalos primeiro)
    entries.sort((a, b) => a[1] - b[1]);
    
    const labels = entries.map(entry => entry[0]);
    const data = entries.map(entry => entry[1]);
    
    charts.maintenanceFrequencyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Dias entre manutenções',
          data: data,
          backgroundColor: '#FF9800',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Intervalo Médio entre Manutenções (em dias)',
            font: { size: 16 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Dias'
            }
          },
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          }
        }
      }
    });
  }
  
  // Helper para normalizar status
  function normalizeStatus(status) {
    const lowerStatus = status ? status.toLowerCase() : 'pendente';
    
    if (['verificado', 'aprovado', 'ajustes'].includes(lowerStatus)) {
      return 'Verificado';
    }
    
    if (lowerStatus === 'concluido') {
      return 'Concluído';
    }
    
    if (lowerStatus === 'reprovado') {
      return 'Reprovado';
    }
    
    // Capitaliza a primeira letra para consistência
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }
  
  // Helper para formatar data
  function formatDate(dateStr, includeTime = false) {
    if (!dateStr) return '-';
    
    try {
      const date = new Date(dateStr);
      
      if (isNaN(date.getTime())) {
        return dateStr;
      }
      
      const options = { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      };
      
      if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.hour12 = false;
      }
      
      return new Intl.DateTimeFormat('pt-BR', options).format(date);
    } catch (e) {
      console.error("Erro ao formatar data:", e);
      return dateStr || '-';
    }
  }
  
  // Helper para obter classe de status
  function getStatusClass(status) {
    if (!status) return 'pending';
    
    const lowerStatus = status.toLowerCase();
    switch (lowerStatus) {
      case 'pendente': return 'pending';
      case 'verificado': case 'aprovado': case 'ajustes': return 'verification';
      case 'concluído': case 'concluido': return 'completed';
      case 'reprovado': return 'danger';
      default: return 'pending';
    }
  }
  
  // API pública
  return {
    initialize,
    loadDashboardData,
    getDashboardData: () => dashboardData
  };
})();

// Inicializar dashboard quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  Dashboard.initialize();
});
