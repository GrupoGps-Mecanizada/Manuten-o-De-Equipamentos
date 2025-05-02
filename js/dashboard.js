const Dashboard = (() => {
  // Armazenar gráficos para atualização
  let charts = {};
  
  // Dados do dashboard
  let dashboardData = null;
  
  function initialize() {
    setupEventListeners();
    setupPeriodFilter();
  }
  
  function setupEventListeners() {
    // Botões de atualização
    document.getElementById('refresh-type-chart').addEventListener('click', function() {
      renderMaintenanceTypeChart(true);
    });
    
    document.getElementById('refresh-status-chart').addEventListener('click', function() {
      renderStatusChart(true);
    });
    
    document.getElementById('refresh-area-chart').addEventListener('click', function() {
      renderAreaDistributionChart(true);
    });
    
    document.getElementById('refresh-problem-chart').addEventListener('click', function() {
      renderProblemCategoriesChart(true);
    });
    
    document.getElementById('refresh-trend-chart').addEventListener('click', function() {
      renderMonthlyTrendChart(true);
    });
    
    document.getElementById('refresh-critical-chart').addEventListener('click', function() {
      renderCriticalVsRegularChart(true);
    });
    
    document.getElementById('refresh-verification-chart').addEventListener('click', function() {
      renderVerificationResultsChart(true);
    });
    
    document.getElementById('refresh-frequency-chart').addEventListener('click', function() {
      renderMaintenanceFrequencyChart(true);
    });
    
    document.getElementById('refresh-equipment-ranking').addEventListener('click', function() {
      renderEquipmentRanking(true);
    });
    
    // Filtro de período
    document.getElementById('period-filter').addEventListener('change', function() {
      loadDashboardData();
    });
  }
  
  function setupPeriodFilter() {
    const periodFilter = document.getElementById('period-filter');
    const today = new Date();
    
    // Definir período padrão para mês atual
    periodFilter.value = 'current-month';
  }
  
  function loadDashboardData(forceReload = false) {
    showLoading(true, 'Carregando dados do dashboard...');
    
    const period = document.getElementById('period-filter').value;
    
    // Buscar todos os dados necessários
    Promise.all([
      API.getMaintenanceList(),
      API.getVerificationList()
    ])
      .then(([maintenanceResponse, verificationResponse]) => {
        if (!maintenanceResponse.success || !verificationResponse.success) {
          throw new Error('Falha ao carregar dados');
        }
        
        // Processar e formatar dados
        const maintenances = maintenanceResponse.maintenances || [];
        const verifications = verificationResponse.verifications || [];
        
        // Filtrar por período se necessário
        const filteredMaintenances = filterByPeriod(maintenances, period);
        const filteredVerifications = filterByPeriod(verifications, period);
        
        // Armazenar dados processados
        dashboardData = {
          maintenances: filteredMaintenances,
          verifications: filteredVerifications,
          period: period
        };
        
        // Atualizar dashboard
        updateDashboard();
      })
      .catch(error => {
        console.error("Erro ao carregar dados do dashboard:", error);
        showNotification("Erro ao carregar dashboard: " + error.message, "error");
      })
      .finally(() => {
        showLoading(false);
      });
  }
  
  function filterByPeriod(data, period) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    let startDate, endDate;
    
    switch (period) {
      case 'current-month':
        startDate = startOfMonth;
        endDate = endOfMonth;
        break;
      case 'last-month':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'last-3-months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
        endDate = endOfMonth;
        break;
      case 'last-6-months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 6, 1);
        endDate = endOfMonth;
        break;
      case 'current-year':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31);
        break;
      default:
        // Todos os dados (sem filtro)
        return data;
    }
    
    return data.filter(item => {
      const itemDate = new Date(item.dataManutencao || item.dataRegistro || item.date || item.registrationDate);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }
  
  function updateDashboard() {
    if (!dashboardData) return;
    
    // Atualizar cards de resumo
    updateSummaryCards();
    
    // Renderizar ou atualizar gráficos
    renderMaintenanceTypeChart();
    renderStatusChart();
    renderAreaDistributionChart();
    renderProblemCategoriesChart();
    renderMonthlyTrendChart();
    renderCriticalVsRegularChart();
    renderVerificationResultsChart();
    renderMaintenanceFrequencyChart();
    
    // Atualizar rankings e listas
    renderEquipmentRanking();
    renderRecentMaintenances();
  }
  
  function updateSummaryCards() {
    const maintenances = dashboardData.maintenances;
    const verifications = dashboardData.verifications;
    
    // Total de manutenções
    document.getElementById('total-maintenance').textContent = maintenances.length;
    
    // Manutenções pendentes
    const pending = maintenances.filter(m => (m.status || '').toLowerCase() === 'pendente').length;
    document.getElementById('pending-verification').textContent = pending;
    
    // Verificações concluídas
    const completed = verifications.length;
    document.getElementById('completed-verifications').textContent = completed;
    
    // Manutenções críticas
    const critical = maintenances.filter(m => m.eCritico || m.isCritical).length;
    document.getElementById('critical-maintenance').textContent = critical;
    
    // Tendência de verificações (comparação com período anterior)
    const trend = calculateVerificationTrend();
    const trendElement = document.getElementById('verification-trend');
    trendElement.textContent = trend > 0 ? `+${trend.toFixed(1)}%` : `${trend.toFixed(1)}%`;
    trendElement.className = trend >= 0 ? 'card-trend trend-up' : 'card-trend trend-down';
  }
  
  function calculateVerificationTrend() {
    // Simplificação: apenas para demonstração, retorna um valor entre -5 e +15
    return Math.floor(Math.random() * 20) - 5;
  }
  
  function renderMaintenanceTypeChart(forceUpdate = false) {
    const canvasId = 'maintenance-type-chart';
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    // Destruir gráfico existente se forçar atualização
    if (forceUpdate && charts[canvasId]) {
      charts[canvasId].destroy();
      charts[canvasId] = null;
    }
    
    // Dados para o gráfico
    const maintenances = dashboardData.maintenances;
    const typeCount = {};
    
    maintenances.forEach(m => {
      const type = m.tipoManutencao || m.maintenanceType || 'Não especificado';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    const labels = Object.keys(typeCount);
    const data = labels.map(label => typeCount[label]);
    
    // Cores para o gráfico
    const colors = [
      '#0052cc', // Azul primário
      '#6554c0', // Roxo
      '#ff5630', // Laranja
      '#ffab00', // Amarelo
      '#36b37e', // Verde
      '#00b8d9'  // Ciano
    ];
    
    // Opções do gráfico
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12,
            padding: 20
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    };
    
    // Criar ou atualizar gráfico
    if (!charts[canvasId]) {
      const ctx = canvas.getContext('2d');
      charts[canvasId] = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors
          }]
        },
        options: options
      });
    } else {
      // Atualizar dados existentes
      charts[canvasId].data.labels = labels;
      charts[canvasId].data.datasets[0].data = data;
      charts[canvasId].update();
    }
  }
  
  function renderStatusChart(forceUpdate = false) {
    const canvasId = 'maintenance-status-chart';
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    // Destruir gráfico existente se forçar atualização
    if (forceUpdate && charts[canvasId]) {
      charts[canvasId].destroy();
      charts[canvasId] = null;
    }
    
    // Dados para o gráfico
    const maintenances = dashboardData.maintenances;
    const statusCount = {};
    
    // Garantir que todos os status sejam exibidos de forma padronizada
    maintenances.forEach(m => {
      let status = (m.status || 'Pendente').toLowerCase();
      
      // Padronizar nomes de status
      if (['verificado', 'aprovado', 'ajustes'].includes(status)) {
        status = 'Verificado';
      } else if (['concluído', 'concluido'].includes(status)) {
        status = 'Concluído';
      } else if (['pendente'].includes(status)) {
        status = 'Pendente'; 
      } else if (['reprovado'].includes(status)) {
        status = 'Reprovado';
      } else {
        status = 'Outro';
      }
      
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    const labels = Object.keys(statusCount);
    const data = labels.map(label => statusCount[label]);
    
    // Cores para o gráfico
    const colors = {
      'Pendente': '#ffab00',
      'Verificado': '#0052cc',
      'Concluído': '#36b37e',
      'Reprovado': '#ff5630',
      'Outro': '#6B778C'
    };
    
    const backgroundColors = labels.map(label => colors[label] || '#6B778C');
    
    // Opções do gráfico
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '50%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12,
            padding: 20
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    };
    
    // Criar ou atualizar gráfico
    if (!charts[canvasId]) {
      const ctx = canvas.getContext('2d');
      charts[canvasId] = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: backgroundColors
          }]
        },
        options: options
      });
    } else {
      // Atualizar dados existentes
      charts[canvasId].data.labels = labels;
      charts[canvasId].data.datasets[0].data = data;
      charts[canvasId].data.datasets[0].backgroundColor = backgroundColors;
      charts[canvasId].update();
    }
  }
  
  function renderAreaDistributionChart(forceUpdate = false) {
    const canvasId = 'area-distribution-chart';
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    // Destruir gráfico existente se forçar atualização
    if (forceUpdate && charts[canvasId]) {
      charts[canvasId].destroy();
      charts[canvasId] = null;
    }
    
    // Dados para o gráfico
    const maintenances = dashboardData.maintenances;
    const areaCount = {};
    
    maintenances.forEach(m => {
      const area = m.area || 'Não especificada';
      areaCount[area] = (areaCount[area] || 0) + 1;
    });
    
    const labels = Object.keys(areaCount);
    const data = labels.map(label => areaCount[label]);
    
    // Cores para o gráfico
    const colors = [
      '#00c7e6',  // Turquesa
      '#ff5630',  // Vermelho
      '#6554c0',  // Roxo
      '#36b37e',  // Verde
      '#ffab00'   // Amarelo
    ];
    
    // Opções do gráfico
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 20
          }
        },
        title: {
          display: true,
          text: 'Distribuição por Área (Interna/Externa)',
          font: {
            size: 14
          }
        }
      }
    };
    
    // Criar ou atualizar gráfico
    if (!charts[canvasId]) {
      const ctx = canvas.getContext('2d');
      charts[canvasId] = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors
          }]
        },
        options: options
      });
    } else {
      // Atualizar dados existentes
      charts[canvasId].data.labels = labels;
      charts[canvasId].data.datasets[0].data = data;
      charts[canvasId].update();
    }
  }
  
  function renderProblemCategoriesChart(forceUpdate = false) {
    const canvasId = 'problem-categories-chart';
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    // Destruir gráfico existente se forçar atualização
    if (forceUpdate && charts[canvasId]) {
      charts[canvasId].destroy();
      charts[canvasId] = null;
    }
    
    // Dados para o gráfico
    const maintenances = dashboardData.maintenances;
    const categoryCount = {};
    
    maintenances.forEach(m => {
      const category = m.categoriaProblema || m.problemCategory || 'Não especificado';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    
    // Ordenar por frequência
    const sortedCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Limitar a 10 categorias
    
    const labels = sortedCategories.map(item => item[0]);
    const data = sortedCategories.map(item => item[1]);
    
    // Cores para o gráfico
    const colors = [
      '#0052cc', // Azul
      '#ff5630', // Vermelho
      '#ffab00', // Amarelo
      '#36b37e', // Verde
      '#6554c0', // Roxo
      '#00b8d9', // Ciano
      '#6B778C', // Cinza
      '#4C9AFF', // Azul claro
      '#FF8F73', // Laranja claro
      '#79E2F2'  // Ciano claro
    ];
    
    // Opções do gráfico
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Categorias de Problemas mais Frequentes',
          font: {
            size: 14
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Número de Ocorrências'
          }
        }
      }
    };
    
    // Criar ou atualizar gráfico
    if (!charts[canvasId]) {
      const ctx = canvas.getContext('2d');
      charts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: labels.map((_, i) => colors[i % colors.length]),
            borderWidth: 0,
            borderRadius: 4
          }]
        },
        options: options
      });
    } else {
      // Atualizar dados existentes
      charts[canvasId].data.labels = labels;
      charts[canvasId].data.datasets[0].data = data;
      charts[canvasId].data.datasets[0].backgroundColor = labels.map((_, i) => colors[i % colors.length]);
      charts[canvasId].update();
    }
  }
  
  function renderMonthlyTrendChart(forceUpdate = false) {
    const canvasId = 'monthly-trend-chart';
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    // Destruir gráfico existente se forçar atualização
    if (forceUpdate && charts[canvasId]) {
      charts[canvasId].destroy();
      charts[canvasId] = null;
    }
    
    // Dados para o gráfico
    const maintenances = dashboardData.maintenances;
    
    // Criar mapa de contagem por mês
    const monthlyData = {};
    const today = new Date();
    
    // Inicializar com os últimos 12 meses
    for (let i = 0; i < 12; i++) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = `${month.getFullYear()}-${month.getMonth() + 1}`;
      const monthLabel = month.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      monthlyData[monthKey] = { label: monthLabel, count: 0 };
    }
    
    // Contar manutenções por mês
    maintenances.forEach(m => {
      const date = new Date(m.dataManutencao || m.dataRegistro || m.date || m.registrationDate);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].count += 1;
      }
    });
    
    // Converter para arrays para o gráfico
    const sortedMonths = Object.keys(monthlyData)
      .sort()
      .map(key => monthlyData[key]);
    
    const labels = sortedMonths.map(m => m.label);
    const data = sortedMonths.map(m => m.count);
    
    // Opções do gráfico
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        title: {
          display: true,
          text: 'Tendência Mensal de Manutenções',
          font: {
            size: 14
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Quantidade'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    };
    
    // Criar ou atualizar gráfico
    if (!charts[canvasId]) {
      const ctx = canvas.getContext('2d');
      charts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Manutenções',
            data: data,
            borderColor: '#36b37e',
            backgroundColor: 'rgba(54, 179, 126, 0.1)',
            fill: true,
            tension: 0.3,
            borderWidth: 2,
            pointBackgroundColor: '#36b37e'
          }]
        },
        options: options
      });
    } else {
      // Atualizar dados existentes
      charts[canvasId].data.labels = labels;
      charts[canvasId].data.datasets[0].data = data;
      charts[canvasId].update();
    }
  }
  
  function renderCriticalVsRegularChart(forceUpdate = false) {
    const canvasId = 'critical-vs-regular-chart';
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    // Destruir gráfico existente se forçar atualização
    if (forceUpdate && charts[canvasId]) {
      charts[canvasId].destroy();
      charts[canvasId] = null;
    }
    
    // Dados para o gráfico
    const maintenances = dashboardData.maintenances;
    
    // Contar críticas vs regulares
    const criticalCount = maintenances.filter(m => m.eCritico || m.isCritical).length;
    const regularCount = maintenances.length - criticalCount;
    
    const data = [criticalCount, regularCount];
    const labels = ['Críticas', 'Regulares'];
    const colors = ['#ff5630', '#0052cc'];
    
    // Opções do gráfico
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 20
          }
        },
        title: {
          display: true,
          text: 'Manutenções Críticas vs Regulares',
          font: {
            size: 14
          }
        }
      }
    };
    
    // Criar ou atualizar gráfico
    if (!charts[canvasId]) {
      const ctx = canvas.getContext('2d');
      charts[canvasId] = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors
          }]
        },
        options: options
      });
    } else {
      // Atualizar dados existentes
      charts[canvasId].data.datasets[0].data = data;
      charts[canvasId].update();
    }
  }
  
  function renderVerificationResultsChart(forceUpdate = false) {
    const canvasId = 'verification-results-chart';
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    // Destruir gráfico existente se forçar atualização
    if (forceUpdate && charts[canvasId]) {
      charts[canvasId].destroy();
      charts[canvasId] = null;
    }
    
    // Dados para o gráfico
    const verifications = dashboardData.verifications;
    
    // Contar por resultado
    const resultCounts = {
      'Aprovado': 0,
      'Ajustes': 0,
      'Reprovado': 0,
      'Outro': 0
    };
    
    verifications.forEach(v => {
      const result = v.result || v.resultado || 'Outro';
      if (resultCounts[result] !== undefined) {
        resultCounts[result] += 1;
      } else {
        resultCounts['Outro'] += 1;
      }
    });
    
    const labels = Object.keys(resultCounts);
    const data = labels.map(key => resultCounts[key]);
    
    // Cores para o gráfico
    const colors = {
      'Aprovado': '#36b37e', // Verde
      'Ajustes': '#ffab00',  // Amarelo
      'Reprovado': '#ff5630', // Vermelho
      'Outro': '#6B778C'    // Cinza
    };
    
    const backgroundColors = labels.map(label => colors[label]);
    
    // Opções do gráfico
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12,
            padding: 20
          }
        },
        title: {
          display: true,
          text: 'Resultados de Verificações',
          font: {
            size: 14
          }
        }
      }
    };
    
    // Criar ou atualizar gráfico
    if (!charts[canvasId]) {
      const ctx = canvas.getContext('2d');
      charts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: backgroundColors,
            borderWidth: 0,
            borderRadius: 4
          }]
        },
        options: options
      });
    } else {
      // Atualizar dados existentes
      charts[canvasId].data.datasets[0].data = data;
      charts[canvasId].update();
    }
  }
  
  function renderMaintenanceFrequencyChart(forceUpdate = false) {
    const canvasId = 'maintenance-frequency-chart';
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    // Destruir gráfico existente se forçar atualização
    if (forceUpdate && charts[canvasId]) {
      charts[canvasId].destroy();
      charts[canvasId] = null;
    }
    
    // Dados para o gráfico
    const maintenances = dashboardData.maintenances;
    
    // Agrupar por equipamento
    const equipmentGroups = {};
    
    maintenances.forEach(m => {
      const id = m.placaOuId || m.equipmentId || 'Não especificado';
      if (!equipmentGroups[id]) {
        equipmentGroups[id] = {
          type: m.tipoEquipamento || m.equipmentType || 'Não especificado',
          dates: []
        };
      }
      
      const date = new Date(m.dataManutencao || m.dataRegistro || m.date || m.registrationDate);
      equipmentGroups[id].dates.push(date);
    });
    
    // Calcular intervalos médios
    const intervalData = {};
    
    for (const id in equipmentGroups) {
      const dates = equipmentGroups[id].dates.sort((a, b) => a - b);
      if (dates.length < 2) continue;
      
      let totalDays = 0;
      let intervals = 0;
      
      for (let i = 1; i < dates.length; i++) {
        const days = Math.round((dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24));
        if (days > 0) {
          totalDays += days;
          intervals++;
        }
      }
      
      if (intervals > 0) {
        const avgDays = totalDays / intervals;
        const type = equipmentGroups[id].type;
        
        if (!intervalData[type]) {
          intervalData[type] = {
            count: 0,
            totalDays: 0
          };
        }
        
        intervalData[type].count++;
        intervalData[type].totalDays += avgDays;
      }
    }
    
    // Calcular média por tipo
    const typesWithData = [];
    
    for (const type in intervalData) {
      if (intervalData[type].count > 0) {
        typesWithData.push({
          type: type,
          avgDays: intervalData[type].totalDays / intervalData[type].count
        });
      }
    }
    
    // Ordenar por intervalo médio
    typesWithData.sort((a, b) => b.avgDays - a.avgDays);
    
    const labels = typesWithData.map(d => d.type);
    const data = typesWithData.map(d => d.avgDays);
    
    // Opções do gráfico
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Intervalo Médio entre Manutenções (em dias)',
          font: {
            size: 14
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Dias'
          }
        }
      }
    };
    
    // Criar ou atualizar gráfico
    if (!charts[canvasId]) {
      const ctx = canvas.getContext('2d');
      charts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: '#ffab00',
            borderWidth: 0,
            borderRadius: 4
          }]
        },
        options: options
      });
    } else {
      // Atualizar dados existentes
      charts[canvasId].data.labels = labels;
      charts[canvasId].data.datasets[0].data = data;
      charts[canvasId].update();
    }
  }
  
  function renderEquipmentRanking(forceUpdate = false) {
    const tbody = document.getElementById('equipment-ranking-tbody');
    if (!tbody) return;
    
    // Dados para a tabela
    const maintenances = dashboardData.maintenances;
    
    // Agrupar por equipamento
    const equipmentCount = {};
    
    maintenances.forEach(m => {
      const id = m.placaOuId || m.equipmentId || 'Não especificado';
      
      if (!equipmentCount[id]) {
        equipmentCount[id] = {
          type: m.tipoEquipamento || m.equipmentType || 'Não especificado',
          count: 0,
          lastMaintenance: null,
          status: null
        };
      }
      
      equipmentCount[id].count++;
      
      const date = new Date(m.dataManutencao || m.dataRegistro || m.date || m.registrationDate);
      
      if (!equipmentCount[id].lastMaintenance || date > equipmentCount[id].lastMaintenance.date) {
        equipmentCount[id].lastMaintenance = {
          date: date,
          status: m.status || 'Pendente'
        };
      }
    });
    
    // Converter para array e ordenar
    const equipmentRanking = Object.entries(equipmentCount)
      .map(([id, data]) => ({
        id: id,
        type: data.type,
        count: data.count,
        lastDate: data.lastMaintenance ? data.lastMaintenance.date : null,
        status: data.lastMaintenance ? data.lastMaintenance.status : null
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10
    
    // Limpar tabela
    tbody.innerHTML = '';
    
    // Se não houver dados
    if (equipmentRanking.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Sem dados para exibir</td></tr>';
      return;
    }
    
    // Preencher tabela
    equipmentRanking.forEach(equip => {
      const formattedDate = equip.lastDate ? formatDate(equip.lastDate) : '-';
      const status = equip.status || 'Não definido';
      const statusClass = getStatusClass(status);
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${equip.id}</td>
        <td>${equip.type}</td>
        <td>${equip.count}</td>
        <td>${formattedDate}</td>
        <td><span class="status-badge status-${statusClass}">${status}</span></td>
      `;
      
      tbody.appendChild(row);
    });
  }
  
  function renderRecentMaintenances() {
    const tbody = document.getElementById('recent-maintenance-tbody');
    if (!tbody) return;
    
    // Dados para a tabela
    const maintenances = [...dashboardData.maintenances]
      .sort((a, b) => {
        const dateA = new Date(a.dataRegistro || a.registrationDate || a.date || 0);
        const dateB = new Date(b.dataRegistro || b.registrationDate || b.date || 0);
        return dateB - dateA;
      })
      .slice(0, 5); // Mostrar apenas os 5 mais recentes
    
    // Limpar tabela
    tbody.innerHTML = '';
    
    // Se não houver dados
    if (maintenances.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Sem manutenções recentes</td></tr>';
      return;
    }
    
    // Preencher tabela
    maintenances.forEach(item => {
      const id = item.id || 'N/A';
      const equipmentId = item.placaOuId || item.equipmentId || '-';
      const type = item.tipoEquipamento || item.equipmentType || 'N/A';
      const regDate = formatDate(item.dataRegistro || item.registrationDate, true);
      const resp = item.responsavel || item.technician || '-';
      const status = item.status || 'Pendente';
      const statusClass = getStatusClass(status);
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${id}</td>
        <td>${equipmentId}</td>
        <td>${type}</td>
        <td>${regDate}</td>
        <td>${resp}</td>
        <td><span class="status-badge status-${statusClass}">${status}</span></td>
        <td>
          <button class="btn-icon view-maintenance" data-id="${id}" title="Ver detalhes">👁️</button>
          ${status === 'Pendente' ? `<button class="btn-icon verify-maintenance" data-id="${id}" title="Verificar">✓</button>` : ''}
        </td>
      `;
      
      tbody.appendChild(row);
    });
    
    // Adicionar event listeners
    addActionButtonListeners(tbody);
  }
  
  function addActionButtonListeners(container) {
    // Usar delegação de eventos
    container.addEventListener('click', function(event) {
      const target = event.target.closest('.btn-icon');
      if (!target) return;
      
      const id = target.getAttribute('data-id');
      if (!id) return;
      
      if (target.classList.contains('view-maintenance')) {
        viewMaintenanceDetails(id);
      } else if (target.classList.contains('verify-maintenance')) {
        if (typeof Verification !== 'undefined' && Verification.openVerificationForm) {
          Verification.openVerificationForm(id);
        } else {
          openVerificationForm(id);
        }
      }
    });
  }
  
  // API pública
  return {
    initialize,
    loadDashboardData
  };
})();

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  Dashboard.initialize();
});
