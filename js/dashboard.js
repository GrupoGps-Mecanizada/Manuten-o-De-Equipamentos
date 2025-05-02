const Dashboard = (() => {
  // Armazenar gráficos para atualização
  let charts = {};

  // Dados do dashboard
  let dashboardData = null;

  function initialize() {
    setupEventListeners();
    setupPeriodFilter();
    // Carga inicial dos dados
    loadDashboardData(); // Adicionado para carregar os dados na inicialização
  }

  function setupEventListeners() {
    // Botões de atualização
    const refreshButtons = [
      { id: 'refresh-type-chart', handler: () => renderMaintenanceTypeChart(true) },
      { id: 'refresh-status-chart', handler: () => renderStatusChart(true) },
      { id: 'refresh-area-chart', handler: () => renderAreaDistributionChart(true) },
      { id: 'refresh-problem-chart', handler: () => renderProblemCategoriesChart(true) },
      { id: 'refresh-trend-chart', handler: () => renderMonthlyTrendChart(true) },
      { id: 'refresh-critical-chart', handler: () => renderCriticalVsRegularChart(true) },
      { id: 'refresh-verification-chart', handler: () => renderVerificationResultsChart(true) },
      { id: 'refresh-frequency-chart', handler: () => renderMaintenanceFrequencyChart(true) },
      { id: 'refresh-equipment-ranking', handler: () => renderEquipmentRanking(true) },
      // Assumindo que existe um botão para recarregar a lista de recentes no dashboard
      // Se não existir, este listener não fará nada.
      // { id: 'refresh-recent-maintenance', handler: () => renderRecentMaintenances(true) }
    ];

    refreshButtons.forEach(btnInfo => {
        const button = document.getElementById(btnInfo.id);
        if (button) {
            button.addEventListener('click', btnInfo.handler);
        } else {
            console.warn(`Botão de atualização não encontrado: ${btnInfo.id}`);
        }
    });

    // Filtro de período
    const periodFilter = document.getElementById('period-filter');
    if (periodFilter) {
      periodFilter.addEventListener('change', function() {
        loadDashboardData();
      });
    } else {
        console.warn('Elemento de filtro de período não encontrado: period-filter');
    }

    // Adicionar listeners para botões de ação nas tabelas (delegação)
    const recentTableBody = document.getElementById('recent-maintenance-tbody');
    if (recentTableBody) {
        addActionButtonListeners(recentTableBody);
    } else {
        console.warn('Tbody da tabela de recentes não encontrado: recent-maintenance-tbody');
    }
  }

  function setupPeriodFilter() {
    const periodFilter = document.getElementById('period-filter');
    if (!periodFilter) return; // Sai se o elemento não existe

    const today = new Date();

    // Definir período padrão para mês atual
    periodFilter.value = 'current-month';
  }

  function loadDashboardData(forceReload = false) {
    // Evitar recargas múltiplas se já estiver carregando
    if (document.getElementById('global-loader')?.style.display !== 'none' && !forceReload) {
      console.log("Dashboard data load already in progress.");
      return;
    }

    showLoading(true, 'Carregando dados do dashboard...');

    const period = document.getElementById('period-filter')?.value || 'current-month';

    // Buscar todos os dados necessários
    Promise.all([
      API.getMaintenanceList(),
      API.getVerificationList() // Assumindo que esta API existe e retorna verificações
      // Adicionar outras chamadas API se necessário (ex: equipamentos)
    ])
      .then(([maintenanceResponse, verificationResponse]) => {
        // Verificar se as respostas são válidas e contêm os dados esperados
        if (!maintenanceResponse || typeof maintenanceResponse !== 'object') {
             throw new Error('Resposta inválida da API de Manutenções');
        }
         if (!verificationResponse || typeof verificationResponse !== 'object') {
             throw new Error('Resposta inválida da API de Verificações');
        }

        // Usar || [] para garantir que sejam arrays, mesmo se a API retornar null/undefined
        const maintenances = maintenanceResponse.maintenances || [];
        const verifications = verificationResponse.verifications || [];

        // Filtrar por período se necessário
        const filteredMaintenances = filterByPeriod(maintenances, period);
        const filteredVerifications = filterByPeriod(verifications, period, 'verificationDate'); // Usar campo de data correto para verificações

        // Armazenar dados processados
        dashboardData = {
          maintenances: filteredMaintenances,
          verifications: filteredVerifications,
          allMaintenances: maintenances, // Guardar todos para cálculos de tendência, se necessário
          allVerifications: verifications, // Guardar todos para cálculos de tendência, se necessário
          period: period
        };

        // Atualizar dashboard
        updateDashboard();
      })
      .catch(error => {
        console.error("Erro ao carregar dados do dashboard:", error);
        // Usar a função global showNotification se disponível
        if (typeof showNotification === 'function') {
            showNotification("Erro ao carregar dashboard: " + error.message, "error");
        } else {
            alert("Erro ao carregar dashboard: " + error.message);
        }
        // Limpar dados para evitar mostrar informações desatualizadas
        dashboardData = { maintenances: [], verifications: [], period: period, allMaintenances: [], allVerifications: [] };
        updateDashboard(); // Tenta atualizar com dados vazios
      })
      .finally(() => {
        // Usar a função global showLoading se disponível
        if (typeof showLoading === 'function') {
            showLoading(false);
        } else {
             const loader = document.getElementById('global-loader');
             if(loader) loader.style.display = 'none';
        }
      });
  }

  function filterByPeriod(data, period, dateField = null) {
    if (!Array.isArray(data)) {
        console.warn("filterByPeriod recebeu dados inválidos:", data);
        return [];
    }
    if (period === 'all') {
      return data; // Retorna todos se o período for "all"
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar para o início do dia

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999); // Normalizar para o fim do dia

    let startDate, endDate;

    switch (period) {
      case 'current-month':
        startDate = startOfMonth;
        endDate = endOfMonth;
        break;
      case 'last-month':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last-3-months':
        // Cuidado: getMonth() - 3 pode dar negativo. new Date() lida com isso.
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
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        // Se um período inválido for passado, retorna todos para evitar erros
        console.warn(`Período de filtro inválido: ${period}. Retornando todos os dados.`);
        return data;
    }

    // Normalizar datas de início/fim para evitar problemas de fuso horário/hora
    startDate.setHours(0, 0, 0, 0);


    return data.filter(item => {
      // Determinar qual campo de data usar
      const dateStrToParse = dateField ? item[dateField] : (item.dataManutencao || item.dataRegistro || item.date || item.registrationDate || item.verificationDate);

      if (!dateStrToParse) {
        // Se não houver data, não incluir no filtro por período
        return false;
      }

      let itemDate;
      try {
        // Tentar criar a data. Se for inválida, o catch tratará.
        itemDate = new Date(dateStrToParse);
        if (isNaN(itemDate.getTime())) { // Checa se a data é inválida
             throw new Error('Data inválida');
        }
        itemDate.setHours(0, 0, 0, 0); // Normalizar data do item
      } catch (e) {
        console.warn(`Data inválida encontrada no item ${item.id}: ${dateStrToParse}`);
        return false; // Não incluir item com data inválida
      }

      // Comparar as datas
      return itemDate >= startDate && itemDate <= endDate;
    });
  }

  function updateDashboard() {
    if (!dashboardData) {
        console.warn("Tentando atualizar dashboard sem dados.");
        // Poderia limpar os campos ou mostrar uma mensagem
        updateSummaryCards(); // Atualiza para zeros ou 'N/A'
        clearCharts(); // Limpa os gráficos existentes
        clearTables(); // Limpa as tabelas
        return;
    }

    // Atualizar cards de resumo
    updateSummaryCards();

    // Renderizar ou atualizar gráficos
    renderMaintenanceTypeChart();
    renderStatusChart();
    renderAreaDistributionChart(); // Função atualizada será chamada aqui
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
    const maintenances = dashboardData?.maintenances || [];
    const verifications = dashboardData?.verifications || [];
    const allMaintenances = dashboardData?.allMaintenances || []; // Para cálculo de tendência

    // Total de manutenções no período
    document.getElementById('total-maintenance').textContent = maintenances.length;

    // Manutenções pendentes de verificação no período
    // Ajustar a lógica de status conforme necessário
    const pending = maintenances.filter(m => (m.status || '').toLowerCase() === 'pendente' || (m.status || '').toLowerCase() === 'aguardando verificação').length;
    document.getElementById('pending-verification').textContent = pending;

    // Verificações concluídas no período
    // Considerar o que significa "concluída" (aprovada, ajustes, reprovada?)
    const completedVerificationsCount = verifications.filter(v => ['aprovado', 'ajustes', 'reprovado'].includes((v.resultado || v.result || '').toLowerCase())).length;
    document.getElementById('completed-verifications').textContent = completedVerificationsCount;

    // Manutenções críticas no período
    const critical = maintenances.filter(m => m.eCritico || m.isCritical).length;
    document.getElementById('critical-maintenance').textContent = critical;

    // Tendência de verificações (comparação com período anterior - mais complexo)
    // const trend = calculateVerificationTrend(); // Implementar lógica real se necessário
    const trendElement = document.getElementById('verification-trend');
    // Placeholder simples por enquanto
    trendElement.textContent = `-`; // Ou pode ser calculado com dados anteriores
    trendElement.className = 'card-trend'; // Remover classes up/down se não houver cálculo real

  }

  // Função placeholder para limpar gráficos se os dados falharem
  function clearCharts() {
      Object.keys(charts).forEach(canvasId => {
          if (charts[canvasId]) {
              charts[canvasId].destroy();
              charts[canvasId] = null;
              const canvas = document.getElementById(canvasId);
              if(canvas) {
                   const ctx = canvas.getContext('2d');
                   ctx.clearRect(0, 0, canvas.width, canvas.height);
                   // Opcional: Mostrar mensagem no canvas
                   // ctx.textAlign = 'center';
                   // ctx.fillText('Sem dados para exibir', canvas.width / 2, canvas.height / 2);
              }
          }
      });
  }

  // Função placeholder para limpar tabelas
  function clearTables() {
      const rankingBody = document.getElementById('equipment-ranking-tbody');
      if (rankingBody) rankingBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Carregando...</td></tr>';
      const recentBody = document.getElementById('recent-maintenance-tbody');
      if (recentBody) recentBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Carregando...</td></tr>';
  }


  function calculateVerificationTrend() {
      // Lógica de exemplo MUITO SIMPLIFICADA. Precisa ser adaptada.
      // Requer dados do período anterior para comparação real.
      if (!dashboardData || !dashboardData.allVerifications || !dashboardData.verifications) return 0;

      const currentPeriodCount = dashboardData.verifications.length;

      // Tentar obter dados do período anterior (requer lógica adicional em loadDashboardData/filterByPeriod)
      // const previousPeriodVerifications = getPreviousPeriodData(dashboardData.allVerifications, dashboardData.period);
      // const previousPeriodCount = previousPeriodVerifications.length;

      // if (previousPeriodCount === 0) {
      //     return currentPeriodCount > 0 ? 100 : 0; // Crescimento infinito ou 0%
      // }

      // const trend = ((currentPeriodCount - previousPeriodCount) / previousPeriodCount) * 100;
      // return trend;

      // Placeholder aleatório enquanto a lógica real não é implementada:
      return (Math.random() * 20) - 10; // Valor aleatório entre -10% e +10%
  }


  function renderMaintenanceTypeChart(forceUpdate = false) {
    const canvasId = 'maintenance-type-chart';
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Destruir gráfico existente se forçar atualização ou se não houver dados
    if ((forceUpdate || !dashboardData?.maintenances?.length) && charts[canvasId]) {
      charts[canvasId].destroy();
      charts[canvasId] = null;
    }

    // Se não houver dados, limpar e sair
    if (!dashboardData?.maintenances?.length) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Opcional: ctx.fillText('Sem dados', canvas.width/2, canvas.height/2);
        return;
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
      '#ff5630', // Laranja/Vermelho
      '#ffab00', // Amarelo
      '#36b37e', // Verde
      '#00b8d9',  // Ciano
      '#996f2b', // Marrom claro
      '#ff8b3d', // Laranja claro
      '#2684FF', // Azul claro
      '#5243AA' // Roxo escuro
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
            padding: 15, // Reduzir padding se necessário
             font: { size: 10 } // Diminuir fonte da legenda se houver muitos itens
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total === 0 ? 0 : ((value / total) * 100);
              return `${label}: ${value} (${percentage.toFixed(1)}%)`;
            }
          }
        },
         title: { // Adicionando título ao gráfico de pizza/doughnut
            display: true,
            text: 'Manutenções por Tipo',
            font: { size: 14 },
            padding: { top: 10, bottom: 10 }
        }
      }
    };

    // Criar ou atualizar gráfico
    if (!charts[canvasId]) {
      const ctx = canvas.getContext('2d');
      charts[canvasId] = new Chart(ctx, {
        type: 'pie', // Pode ser 'pie' ou 'doughnut'
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: labels.map((_, i) => colors[i % colors.length]) // Rotacionar cores
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

  function renderStatusChart(forceUpdate = false) {
    const canvasId = 'maintenance-status-chart';
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Destruir gráfico existente
    if ((forceUpdate || !dashboardData?.maintenances?.length) && charts[canvasId]) {
      charts[canvasId].destroy();
      charts[canvasId] = null;
    }

     if (!dashboardData?.maintenances?.length) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    // Dados para o gráfico
    const maintenances = dashboardData.maintenances;
    const statusCount = {
        'Pendente': 0,
        'Verificado': 0,
        'Concluído': 0,
        'Reprovado': 0,
        'Outro': 0 // Incluir outros status se necessário
    };

    // Mapeamento de status (ajustar conforme os valores reais no seu backend/API)
    const statusMap = {
        'pendente': 'Pendente',
        'aguardando verificacao': 'Pendente', // Exemplo
        'aguardando verificação': 'Pendente', // Exemplo
        'verificado': 'Verificado',
        'aprovado': 'Verificado', // Ou poderia ser um status separado
        'ajustes': 'Verificado',   // Ou poderia ser um status separado
        'concluido': 'Concluído',
        'concluído': 'Concluído',
        'reprovado': 'Reprovado',
        // Adicione outros mapeamentos se houver mais status
    };


    maintenances.forEach(m => {
      let rawStatus = (m.status || 'Pendente').toLowerCase().trim();
      let mappedStatus = statusMap[rawStatus] || 'Outro'; // Mapeia ou classifica como 'Outro'
      statusCount[mappedStatus]++;
    });

    // Remover categorias com contagem zero para um gráfico mais limpo
    const labels = Object.keys(statusCount).filter(key => statusCount[key] > 0);
    const data = labels.map(label => statusCount[label]);

    // Cores para o gráfico (associadas aos status padronizados)
    const colors = {
      'Pendente': '#ffab00',  // Amarelo/Laranja
      'Verificado': '#0052cc', // Azul
      'Concluído': '#36b37e', // Verde
      'Reprovado': '#ff5630', // Vermelho
      'Outro': '#6B778C'     // Cinza
    };

    const backgroundColors = labels.map(label => colors[label] || '#6B778C');

    // Opções do gráfico
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%', // Para gráfico de doughnut
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12,
            padding: 15,
            font: { size: 10 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total === 0 ? 0 : ((value / total) * 100);
              return `${label}: ${value} (${percentage.toFixed(1)}%)`;
            }
          }
        },
        title: {
            display: true,
            text: 'Status das Manutenções',
            font: { size: 14 },
            padding: { top: 10, bottom: 10 }
        }
      }
    };

    // Criar ou atualizar gráfico
    if (!charts[canvasId] && data.length > 0) { // Só cria se houver dados
      const ctx = canvas.getContext('2d');
      charts[canvasId] = new Chart(ctx, {
        type: 'doughnut', // Ou 'pie'
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: backgroundColors
          }]
        },
        options: options
      });
    } else if (charts[canvasId]) { // Atualiza se já existir
      charts[canvasId].data.labels = labels;
      charts[canvasId].data.datasets[0].data = data;
      charts[canvasId].data.datasets[0].backgroundColor = backgroundColors;
      charts[canvasId].update();
    }
  }

  // ==============================================================
  // == Função renderAreaDistributionChart ATUALIZADA ABAIXO ==
  // ==============================================================
  function renderAreaDistributionChart(forceUpdate = false) {
    const canvasId = 'area-distribution-chart';
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Destruir gráfico existente se forçar atualização ou se não houver dados
    if ((forceUpdate || !dashboardData?.maintenances?.length) && charts[canvasId]) {
        charts[canvasId].destroy();
        charts[canvasId] = null;
    }

    if (!dashboardData?.maintenances?.length) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    // Dados para o gráfico
    const maintenances = dashboardData.maintenances;
    const areaCount = {};

    maintenances.forEach(m => {
        // Usar 'area' OU 'localOficina' OU 'office', o que estiver disponível
        const area = m.area || m.localOficina || m.office || 'Não especificado';
        areaCount[area] = (areaCount[area] || 0) + 1;
    });

    const labels = Object.keys(areaCount).filter(key => areaCount[key] > 0); // Filtrar vazios
    const data = labels.map(label => areaCount[label]);


    // Cores para o gráfico
    const colors = [
        '#00c7e6',  // Turquesa
        '#ff5630',  // Vermelho/Laranja
        '#6554c0',  // Roxo
        '#36b37e',  // Verde
        '#ffab00',  // Amarelo
        '#0052cc',  // Azul
        '#996f2b',  // Marrom claro
        '#ff8b3d',  // Laranja claro
        '#2684FF',  // Azul claro
        '#5243AA'   // Roxo escuro
    ];

    // Opções do gráfico - Alterado o título aqui
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
        legend: {
            position: 'bottom',
            labels: {
            boxWidth: 12,
            padding: 15,
            font: { size: 10 }
            }
        },
        title: {
            display: true,
            text: 'Local de Manutenção', // TÍTULO ATUALIZADO
            font: {
            size: 14
            },
             padding: { top: 10, bottom: 10 }
        },
        tooltip: {
            callbacks: {
                label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total === 0 ? 0 : ((value / total) * 100);
                return `${label}: ${value} (${percentage.toFixed(1)}%)`;
                }
            }
          }
        }
    };

    // Criar ou atualizar gráfico
    if (!charts[canvasId] && data.length > 0) {
        const ctx = canvas.getContext('2d');
        charts[canvasId] = new Chart(ctx, {
        type: 'pie', // Ou 'doughnut'
        data: {
            labels: labels,
            datasets: [{
            data: data,
            backgroundColor: labels.map((_, i) => colors[i % colors.length])
            }]
        },
        options: options
        });
    } else if (charts[canvasId]) {
        // Atualizar dados existentes
        charts[canvasId].data.labels = labels;
        charts[canvasId].data.datasets[0].data = data;
        charts[canvasId].data.datasets[0].backgroundColor = labels.map((_, i) => colors[i % colors.length]);
        charts[canvasId].update();
    }
  }
  // ==============================================================
  // == Fim da função renderAreaDistributionChart ATUALIZADA ==
  // ==============================================================


  function renderProblemCategoriesChart(forceUpdate = false) {
    const canvasId = 'problem-categories-chart';
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Destruir gráfico existente
     if ((forceUpdate || !dashboardData?.maintenances?.length) && charts[canvasId]) {
        charts[canvasId].destroy();
        charts[canvasId] = null;
    }

     if (!dashboardData?.maintenances?.length) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    // Dados para o gráfico
    const maintenances = dashboardData.maintenances;
    const categoryCount = {};

    maintenances.forEach(m => {
      const category = m.categoriaProblema || m.problemCategory || 'Não especificado';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    // Ordenar por frequência e limitar (ex: top 10)
    const sortedCategories = Object.entries(categoryCount)
      .filter(entry => entry[1] > 0) // Remover categorias com 0 ocorrências
      .sort(([, countA], [, countB]) => countB - countA) // Ordenar decrescente pela contagem
      .slice(0, 10); // Pegar os top 10

    const labels = sortedCategories.map(item => item[0]);
    const data = sortedCategories.map(item => item[1]);

    // Cores para o gráfico de barras
    const colors = [
      '#0052cc', '#ff5630', '#ffab00', '#36b37e', '#6554c0',
      '#00b8d9', '#996f2b', '#ff8b3d', '#2684FF', '#5243AA'
    ];

    // Opções do gráfico
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y', // Barras horizontais para melhor leitura das categorias
      plugins: {
        legend: {
          display: false // Legenda geralmente não é necessária para barras com labels diretos
        },
        title: {
          display: true,
          text: 'Top 10 Categorias de Problemas',
          font: { size: 14 },
          padding: { top: 10, bottom: 20 } // Aumentar espaço inferior
        },
        tooltip: {
            callbacks: {
                label: function(context) {
                    return ` ${context.parsed.x} ocorrências`; // Mostrar apenas o valor no tooltip
                }
            }
        }
      },
      scales: {
        x: { // Eixo X (valores)
          beginAtZero: true,
          title: {
            display: true,
            text: 'Número de Ocorrências',
             font: { size: 12 }
          },
           ticks: { // Garantir que ticks sejam inteiros se aplicável
                stepSize: 1, // Ou deixar automático dependendo da escala
                precision: 0
            }
        },
        y: { // Eixo Y (categorias)
             ticks: {
                font: { size: 10 } // Ajustar tamanho da fonte das categorias se necessário
            }
        }
      }
    };

    // Criar ou atualizar gráfico
    if (!charts[canvasId] && data.length > 0) {
      const ctx = canvas.getContext('2d');
      charts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Ocorrências', // Adicionar um label ao dataset
            data: data,
            backgroundColor: labels.map((_, i) => colors[i % colors.length]),
            borderWidth: 0,
            borderRadius: 4
          }]
        },
        options: options
      });
    } else if (charts[canvasId]) {
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

    // Destruir gráfico existente
    if ((forceUpdate || !dashboardData?.maintenances?.length) && charts[canvasId]) {
        charts[canvasId].destroy();
        charts[canvasId] = null;
    }

     if (!dashboardData?.maintenances?.length) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    // Dados para o gráfico (usar TODOS os dados, não apenas os filtrados pelo período selecionado, para mostrar a tendência real)
    // Ou ajustar para mostrar tendência DENTRO do período selecionado, se essa for a intenção.
    // Usaremos os dados filtrados pelo período selecionado no dashboard por enquanto.
    const maintenances = dashboardData.maintenances;

    // Criar mapa de contagem por mês/ano DENTRO do período filtrado
    const monthlyData = {};

    maintenances.forEach(m => {
      const dateStr = m.dataManutencao || m.dataRegistro || m.date || m.registrationDate;
      if (!dateStr) return;

      try {
        const date = new Date(dateStr);
         if (isNaN(date.getTime())) return; // Pular datas inválidas

        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // Formato YYYY-MM
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;

      } catch (e) {
        console.warn(`Erro ao processar data para gráfico de tendência: ${dateStr}`);
      }
    });

    // Ordenar as chaves (meses) cronologicamente
    const sortedKeys = Object.keys(monthlyData).sort();

    // Criar labels e dados ordenados
    const labels = sortedKeys.map(key => {
        const [year, month] = key.split('-');
        // Formatar para exibição (ex: Jan/23)
        const date = new Date(year, month - 1, 1);
        return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    });
    const data = sortedKeys.map(key => monthlyData[key]);

    // Opções do gráfico
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false // Geralmente uma linha só não precisa de legenda
        },
        title: {
          display: true,
          text: 'Tendência Mensal de Manutenções (Período Selecionado)',
          font: { size: 14 },
          padding: { top: 10, bottom: 10 }
        },
        tooltip: {
             mode: 'index', // Mostrar tooltip para todos os pontos no mesmo índice X
             intersect: false,
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Quantidade',
             font: { size: 12 }
          },
           ticks: { precision: 0 } // Inteiros no eixo Y
        },
        x: {
          grid: {
            display: false // Linhas de grade verticais podem poluir
          },
          title: {
            display: true,
            text: 'Mês',
            font: { size: 12 }
          }
        }
      },
      interaction: { // Melhora a interatividade com o tooltip
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    };

    // Criar ou atualizar gráfico
    if (!charts[canvasId] && data.length > 0) {
      const ctx = canvas.getContext('2d');
      charts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Manutenções', // Label do dataset (aparece no tooltip)
            data: data,
            borderColor: '#36b37e', // Cor da linha (verde)
            backgroundColor: 'rgba(54, 179, 126, 0.1)', // Área abaixo da linha
            fill: true, // Preencher área abaixo da linha
            tension: 0.3, // Suavizar a linha
            borderWidth: 2,
            pointBackgroundColor: '#36b37e', // Cor dos pontos
            pointRadius: 3, // Tamanho dos pontos
            pointHoverRadius: 5 // Tamanho dos pontos ao passar o mouse
          }]
        },
        options: options
      });
    } else if (charts[canvasId]) {
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

     // Destruir gráfico existente
     if ((forceUpdate || !dashboardData?.maintenances?.length) && charts[canvasId]) {
        charts[canvasId].destroy();
        charts[canvasId] = null;
    }

     if (!dashboardData?.maintenances?.length) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    // Dados para o gráfico
    const maintenances = dashboardData.maintenances;

    // Contar críticas vs regulares
    let criticalCount = 0;
    maintenances.forEach(m => {
        if (m.eCritico === true || m.isCritical === true || String(m.eCritico).toLowerCase() === 'true' || String(m.isCritical).toLowerCase() === 'true') {
            criticalCount++;
        }
    });
    const regularCount = maintenances.length - criticalCount;

    const data = [criticalCount, regularCount];
    const labels = ['Críticas', 'Regulares'];
    const colors = ['#ff5630', '#0052cc']; // Vermelho para críticas, Azul para regulares

    // Não renderizar se não houver dados
    if (criticalCount === 0 && regularCount === 0) {
         if (charts[canvasId]) charts[canvasId].destroy();
         charts[canvasId] = null;
         const ctx = canvas.getContext('2d');
         ctx.clearRect(0, 0, canvas.width, canvas.height);
         return;
    }


    // Opções do gráfico
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%', // Doughnut
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 15,
             font: { size: 11 }
          }
        },
        title: {
          display: true,
          text: 'Manutenções Críticas vs Regulares',
          font: { size: 14 },
           padding: { top: 10, bottom: 10 }
        },
         tooltip: {
            callbacks: {
                label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total === 0 ? 0 : ((value / total) * 100);
                return `${label}: ${value} (${percentage.toFixed(1)}%)`;
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
            backgroundColor: colors
          }]
        },
        options: options
      });
    } else {
      // Atualizar dados existentes
      charts[canvasId].data.labels = labels; // Garantir que os labels também sejam atualizados
      charts[canvasId].data.datasets[0].data = data;
      charts[canvasId].update();
    }
  }

  function renderVerificationResultsChart(forceUpdate = false) {
    const canvasId = 'verification-results-chart';
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

     // Destruir gráfico existente
     if ((forceUpdate || !dashboardData?.verifications?.length) && charts[canvasId]) {
        charts[canvasId].destroy();
        charts[canvasId] = null;
    }

     if (!dashboardData?.verifications?.length) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    // Dados para o gráfico
    const verifications = dashboardData.verifications;

    // Contar por resultado (padronizar chaves)
    const resultCounts = {
      'Aprovado': 0,
      'Ajustes': 0,
      'Reprovado': 0,
      'Outro': 0 // Para casos não mapeados
    };

     // Mapeamento de resultados (ajustar conforme os valores reais no seu backend/API)
    const resultMap = {
        'aprovado': 'Aprovado',
        'aprovado - manutenção correta': 'Aprovado',
        'ajustes': 'Ajustes',
        'necessita ajustes menores': 'Ajustes',
        'reprovado': 'Reprovado',
        'reprovado - precisa de nova manutenção': 'Reprovado',
        // Adicione outros mapeamentos se houver mais resultados
    };

    verifications.forEach(v => {
      const rawResult = (v.result || v.resultado || 'Outro').toLowerCase().trim();
      const mappedResult = resultMap[rawResult] || 'Outro';
      resultCounts[mappedResult]++;
    });

    const labels = Object.keys(resultCounts).filter(key => resultCounts[key] > 0); // Remover zerados
    const data = labels.map(key => resultCounts[key]);

    // Cores para o gráfico (associadas aos resultados padronizados)
    const colors = {
      'Aprovado': '#36b37e', // Verde
      'Ajustes': '#ffab00',  // Amarelo
      'Reprovado': '#ff5630', // Vermelho
      'Outro': '#6B778C'    // Cinza
    };

    const backgroundColors = labels.map(label => colors[label] || '#6B778C');

    // Opções do gráfico (usando barras verticais como exemplo)
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false // Legenda não necessária para barras com cores distintas por categoria
        },
        title: {
          display: true,
          text: 'Resultados das Verificações',
          font: { size: 14 },
           padding: { top: 10, bottom: 10 }
        },
        tooltip: {
            callbacks: {
                 title: () => null, // Remover título do tooltip (já está no label)
                 label: function(context) {
                    return ` ${context.parsed.y} verificações`;
                }
            }
        }
      },
      scales: {
         y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Quantidade',
             font: { size: 12 }
          },
           ticks: { precision: 0 }
        },
         x: {
             title: {
                display: true,
                text: 'Resultado',
                 font: { size: 12 }
            }
         }
      }
    };

    // Criar ou atualizar gráfico
    if (!charts[canvasId] && data.length > 0) {
      const ctx = canvas.getContext('2d');
      charts[canvasId] = new Chart(ctx, {
        type: 'bar', // Barras verticais
        data: {
          labels: labels,
          datasets: [{
            label: 'Verificações', // Label do dataset
            data: data,
            backgroundColor: backgroundColors,
            borderWidth: 0,
            borderRadius: 4,
            barPercentage: 0.6, // Ajustar largura das barras
            categoryPercentage: 0.7 // Ajustar espaçamento entre barras
          }]
        },
        options: options
      });
    } else if (charts[canvasId]) {
        // Atualizar dados existentes
        charts[canvasId].data.labels = labels;
        charts[canvasId].data.datasets[0].data = data;
        charts[canvasId].data.datasets[0].backgroundColor = backgroundColors;
        charts[canvasId].update();
    }
  }

  function renderMaintenanceFrequencyChart(forceUpdate = false) {
    const canvasId = 'maintenance-frequency-chart';
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

     // Destruir gráfico existente
     if ((forceUpdate || !dashboardData?.maintenances?.length) && charts[canvasId]) {
        charts[canvasId].destroy();
        charts[canvasId] = null;
    }

     // Usar TODOS os dados de manutenção para calcular frequência, não apenas do período
     const allMaintenances = dashboardData?.allMaintenances || [];

     if (!allMaintenances.length) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    // Agrupar por equipamento
    const equipmentGroups = {};

    allMaintenances.forEach(m => {
      const id = m.placaOuId || m.equipmentId || 'Não especificado';
      if (id === 'Não especificado') return; // Ignorar sem ID

      if (!equipmentGroups[id]) {
        equipmentGroups[id] = {
          type: m.tipoEquipamento || m.equipmentType || 'Tipo não especificado',
          dates: []
        };
      }

      const dateStr = m.dataManutencao || m.dataRegistro || m.date || m.registrationDate;
      if (!dateStr) return;

      try {
          const date = new Date(dateStr);
           if (isNaN(date.getTime())) return; // Pular inválidas
           equipmentGroups[id].dates.push(date);
      } catch(e) { /* Ignorar datas inválidas */ }
    });

    // Calcular intervalos médios por TIPO de equipamento
    const intervalDataByType = {};

    for (const id in equipmentGroups) {
      const group = equipmentGroups[id];
      const dates = group.dates.sort((a, b) => a - b); // Ordenar datas

      if (dates.length < 2) continue; // Precisa de pelo menos 2 manutenções

      let totalDaysSum = 0;
      let intervalCount = 0;

      for (let i = 1; i < dates.length; i++) {
        const diffTime = Math.abs(dates[i] - dates[i-1]);
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); // Diferença em dias

        // Considerar um intervalo mínimo? Ex: ignorar manutenções no mesmo dia
        if (diffDays > 0) {
          totalDaysSum += diffDays;
          intervalCount++;
        }
      }

      if (intervalCount > 0) {
        const avgDaysForEquipment = totalDaysSum / intervalCount;
        const equipmentType = group.type;

        if (!intervalDataByType[equipmentType]) {
          intervalDataByType[equipmentType] = {
            totalAvgDaysSum: 0,
            equipmentCount: 0
          };
        }

        intervalDataByType[equipmentType].totalAvgDaysSum += avgDaysForEquipment;
        intervalDataByType[equipmentType].equipmentCount++;
      }
    }

    // Calcular média final por tipo
    const typesWithAvgData = [];
    for (const type in intervalDataByType) {
      const data = intervalDataByType[type];
      if (data.equipmentCount > 0) {
        typesWithAvgData.push({
          type: type,
          avgDays: data.totalAvgDaysSum / data.equipmentCount
        });
      }
    }

    // Ordenar por intervalo médio (opcional, ex: menor intervalo primeiro)
    typesWithAvgData.sort((a, b) => a.avgDays - b.avgDays);

    const labels = typesWithAvgData.map(d => d.type);
    const data = typesWithAvgData.map(d => d.avgDays.toFixed(1)); // Média com 1 casa decimal

    // Opções do gráfico (barras verticais)
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: 'Intervalo Médio entre Manutenções por Tipo (dias)',
          font: { size: 14 },
           padding: { top: 10, bottom: 10 }
        },
        tooltip: {
            callbacks: {
                title: (tooltipItems) => tooltipItems[0].label, // Título é o tipo
                label: function(context) {
                    return ` Média: ${context.parsed.y} dias`;
                }
            }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Dias (Média)',
             font: { size: 12 }
          }
        },
        x: {
             title: {
                display: true,
                text: 'Tipo de Equipamento',
                 font: { size: 12 }
            },
             ticks: {
                 font: { size: 10 },
                 // Rotacionar labels se forem muitos
                 // maxRotation: 45,
                 // minRotation: 45
             }
        }
      }
    };

    // Criar ou atualizar gráfico
    if (!charts[canvasId] && data.length > 0) {
      const ctx = canvas.getContext('2d');
      charts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Intervalo Médio (dias)',
            data: data,
            backgroundColor: '#ffab00', // Amarelo
            borderWidth: 0,
            borderRadius: 4,
             barPercentage: 0.6,
            categoryPercentage: 0.7
          }]
        },
        options: options
      });
    } else if (charts[canvasId]) {
      charts[canvasId].data.labels = labels;
      charts[canvasId].data.datasets[0].data = data;
      charts[canvasId].update();
    }
  }

  function renderEquipmentRanking(forceUpdate = false) {
    const tbody = document.getElementById('equipment-ranking-tbody');
    if (!tbody) return;

    // Limpar tabela antes de popular ou mostrar mensagem
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Carregando ranking...</td></tr>';

    // Usar dados do período selecionado para o ranking
    const maintenances = dashboardData?.maintenances || [];

    if (maintenances.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Sem dados de manutenção no período selecionado.</td></tr>';
        return;
    }

    // Agrupar por equipamento ID (placaOuId ou equipmentId)
    const equipmentStats = {};

    maintenances.forEach(m => {
      const id = m.placaOuId || m.equipmentId || 'Não especificado';
      if (id === 'Não especificado') return;

      if (!equipmentStats[id]) {
        equipmentStats[id] = {
          type: m.tipoEquipamento || m.equipmentType || 'Não especificado',
          count: 0,
          lastMaintenanceDate: null,
          lastStatus: 'N/A'
        };
      }

      equipmentStats[id].count++;

      const dateStr = m.dataManutencao || m.dataRegistro || m.date || m.registrationDate;
       if(dateStr) {
           try {
                const currentDate = new Date(dateStr);
                 if (!isNaN(currentDate.getTime())) {
                    if (!equipmentStats[id].lastMaintenanceDate || currentDate > equipmentStats[id].lastMaintenanceDate) {
                        equipmentStats[id].lastMaintenanceDate = currentDate;
                        equipmentStats[id].lastStatus = m.status || 'Pendente'; // Usar o status da última manutenção
                    }
                 }
           } catch(e) { /* Ignorar datas inválidas */ }
       }
    });

    // Converter para array, ordenar por contagem (desc) e pegar top 10
    const equipmentRanking = Object.entries(equipmentStats)
      .map(([id, data]) => ({
        id: id,
        type: data.type,
        count: data.count,
        lastDate: data.lastMaintenanceDate,
        status: data.lastStatus
      }))
      .sort((a, b) => b.count - a.count) // Ordena por mais manutenções
      .slice(0, 10); // Limita aos 10 primeiros

    // Limpar tabela novamente antes de preencher
    tbody.innerHTML = '';

    if (equipmentRanking.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum equipamento com manutenção no período.</td></tr>';
      return;
    }

    // Preencher tabela
    equipmentRanking.forEach(equip => {
      // Formatar data usando a função global formatDate (se existir) ou de forma simples
      let formattedDate = '-';
      if (equip.lastDate) {
          if (typeof formatDate === 'function') {
              formattedDate = formatDate(equip.lastDate); // Sem hora
          } else {
              formattedDate = equip.lastDate.toLocaleDateString('pt-BR');
          }
      }

      // Obter classe CSS para o status usando a função global getStatusClass (se existir)
      let statusClass = 'default';
      if (typeof getStatusClass === 'function') {
          statusClass = getStatusClass(equip.status);
      } else {
          // Fallback simples
          statusClass = (equip.status || 'pendente').toLowerCase();
      }

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${equip.id}</td>
        <td>${equip.type}</td>
        <td style="text-align: center;">${equip.count}</td>
        <td>${formattedDate}</td>
        <td><span class="status-badge status-${statusClass}">${equip.status || 'N/A'}</span></td>
      `;
      tbody.appendChild(row);
    });
  }

  function renderRecentMaintenances() {
    const tbody = document.getElementById('recent-maintenance-tbody');
    if (!tbody) return;

    // Limpar tabela
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Carregando manutenções recentes...</td></tr>';

    // Usar dados do período selecionado
    const maintenances = dashboardData?.maintenances || [];

     if (maintenances.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Sem manutenções no período selecionado.</td></tr>';
        return;
    }

    // Ordenar por data de registro (mais recente primeiro) e pegar os 5 primeiros
    const recentMaintenances = [...maintenances] // Criar cópia para não alterar o original
      .sort((a, b) => {
        // Priorizar data de registro, mas usar outras se não existir
        const dateAStr = a.dataRegistro || a.registrationDate || a.dataManutencao || a.date || 0;
        const dateBStr = b.dataRegistro || b.registrationDate || b.dataManutencao || b.date || 0;
        let dateA, dateB;
        try { dateA = new Date(dateAStr); if(isNaN(dateA.getTime())) dateA = new Date(0); } catch(e){ dateA = new Date(0); }
        try { dateB = new Date(dateBStr); if(isNaN(dateB.getTime())) dateB = new Date(0); } catch(e){ dateB = new Date(0); }
        return dateB - dateA; // Decrescente
      })
      .slice(0, 5); // Limitar aos 5 mais recentes

    // Limpar tabela novamente
    tbody.innerHTML = '';

    if (recentMaintenances.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhuma manutenção recente encontrada.</td></tr>';
      return;
    }

    // Preencher tabela
    recentMaintenances.forEach(item => {
      const id = item.id || 'N/A'; // Assumindo que cada manutenção tem um 'id' único
      const equipmentId = item.placaOuId || item.equipmentId || '-';
      // Usar tipo de MANUTENÇÃO aqui, não de equipamento
      const maintenanceType = item.tipoManutencao || item.maintenanceType || 'N/A';
      let regDate = '-';
      const dateStr = item.dataRegistro || item.registrationDate || item.dataManutencao || item.date;
       if (dateStr) {
           if (typeof formatDate === 'function') {
                regDate = formatDate(dateStr, true); // Incluir hora se disponível e a função suportar
           } else {
                try {
                   regDate = new Date(dateStr).toLocaleString('pt-BR');
                } catch(e) { regDate = '-'; }
           }
       }

      const resp = item.responsavel || item.technicianName || item.technician || '-'; // Usar technicianName do formulário se disponível
      const status = item.status || 'Pendente';
      const statusClass = typeof getStatusClass === 'function' ? getStatusClass(status) : status.toLowerCase();

       // Verificar se o status permite verificação
       const allowVerification = ['pendente', 'aguardando verificação'].includes(status.toLowerCase());

      const row = document.createElement('tr');
       // Adicionar data-id ao TR para facilitar a busca de dados se necessário
       row.setAttribute('data-maintenance-id', id);
      row.innerHTML = `
        <td>${id}</td>
        <td>${equipmentId}</td>
        <td>${maintenanceType}</td>
        <td>${regDate}</td>
        <td>${resp}</td>
        <td><span class="status-badge status-${statusClass}">${status}</span></td>
        <td class="action-buttons">
          <button class="btn-icon view-maintenance" data-id="${id}" title="Ver detalhes">👁️</button>
          ${allowVerification ? `<button class="btn-icon verify-maintenance" data-id="${id}" title="Verificar">✓</button>` : ''}
          <!-- Adicionar botão de editar se fizer sentido -->
          <!-- <button class="btn-icon edit-maintenance" data-id="${id}" title="Editar">✏️</button> -->
        </td>
      `;

      tbody.appendChild(row);
      // Os listeners são adicionados uma vez no setupEventListeners usando delegação
    });
  }

  function addActionButtonListeners(container) {
    // Usar delegação de eventos no tbody
    container.addEventListener('click', function(event) {
      const targetButton = event.target.closest('.btn-icon'); // Achar o botão clicado
      if (!targetButton) return; // Sai se não clicou em um botão

      const maintenanceId = targetButton.getAttribute('data-id');
      if (!maintenanceId) return; // Sai se o botão não tem data-id

      if (targetButton.classList.contains('view-maintenance')) {
        // Chamar a função global para ver detalhes (definida em main.js ou outro lugar)
        if (typeof viewMaintenanceDetails === 'function') {
          viewMaintenanceDetails(maintenanceId);
        } else {
          console.error('Função viewMaintenanceDetails não definida.');
          alert(`Detalhes para ID: ${maintenanceId} (implementar visualização)`);
        }
      } else if (targetButton.classList.contains('verify-maintenance')) {
        // Chamar a função global para abrir formulário de verificação
         if (typeof Verification !== 'undefined' && typeof Verification.openVerificationForm === 'function') {
             // Tenta buscar os dados da manutenção correspondente para pré-preencher
             const maintenanceData = findMaintenanceById(maintenanceId);
             Verification.openVerificationForm(maintenanceId, maintenanceData);
         } else if (typeof openVerificationForm === 'function') { // Fallback para função global simples
            openVerificationForm(maintenanceId);
         } else {
           console.error('Função para abrir verificação não definida.');
           alert(`Verificar ID: ${maintenanceId} (implementar formulário)`);
         }
      }
      // Adicionar 'else if' para outros botões (editar, excluir, etc.)
       else if (targetButton.classList.contains('edit-maintenance')) {
           if (typeof Maintenance !== 'undefined' && typeof Maintenance.openMaintenanceFormForEdit === 'function') {
               const maintenanceData = findMaintenanceById(maintenanceId);
               Maintenance.openMaintenanceFormForEdit(maintenanceId, maintenanceData);
           } else {
               console.error('Função para abrir edição não definida.');
               alert(`Editar ID: ${maintenanceId} (implementar formulário)`);
           }
       }
    });
  }

  // Função auxiliar para encontrar dados de uma manutenção pelo ID
  function findMaintenanceById(id) {
      if (!dashboardData || !dashboardData.allMaintenances) return null;
      // Procurar tanto nas filtradas quanto em todas, caso necessário
      let maintenance = dashboardData.maintenances?.find(m => String(m.id) === String(id));
      if (!maintenance) {
          maintenance = dashboardData.allMaintenances.find(m => String(m.id) === String(id));
      }
      return maintenance || null;
  }


  // --- Funções Globais Auxiliares (se não existirem em utilities.js) ---
   // Mover para utilities.js se possível

   function formatDate(dateString, includeTime = false) {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '-'; // Data inválida

            const optionsDate = { day: '2-digit', month: '2-digit', year: 'numeric' };
            const optionsTime = { hour: '2-digit', minute: '2-digit' };

            let formatted = date.toLocaleDateString('pt-BR', optionsDate);
            if (includeTime) {
                formatted += ' ' + date.toLocaleTimeString('pt-BR', optionsTime);
            }
            return formatted;
        } catch (e) {
            console.error("Erro ao formatar data:", dateString, e);
            return '-';
        }
    }

   function getStatusClass(status) {
        const normalizedStatus = String(status || 'pendente').toLowerCase().trim();
        switch (normalizedStatus) {
            case 'pendente':
            case 'aguardando verificação':
                return 'pending';
            case 'verificado':
            case 'aprovado':
            case 'ajustes':
                return 'verified';
            case 'concluído':
            case 'concluido':
                return 'completed';
            case 'reprovado':
                return 'rejected';
             case 'crítico': // Se houver um status específico para crítico
             case 'critico':
                 return 'critical';
            default:
                return 'default'; // Uma classe padrão
        }
    }

    function showLoading(show, message = 'Carregando...') {
        const loader = document.getElementById('global-loader');
        const loaderMessage = document.getElementById('global-loader-message');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
            if (show && loaderMessage) {
                loaderMessage.textContent = message;
            }
        }
    }
   // --- Fim Funções Globais Auxiliares ---


  // API pública do módulo Dashboard
  return {
    initialize,
    loadDashboardData,
    // Expor outras funções se precisarem ser chamadas de fora
    renderAreaDistributionChart // Expondo para possível chamada externa, se necessário
  };
})();

// Inicializar o módulo Dashboard quando o DOM estiver pronto
// Garantir que utilities.js e api.js sejam carregados ANTES deste script
document.addEventListener('DOMContentLoaded', function() {
  // Verificar se as dependências (API, Utilities) estão carregadas
  if (typeof API === 'undefined' || typeof Utilities === 'undefined') {
      console.error("Erro: Dependências API.js ou Utilities.js não carregadas antes de dashboard.js");
      // Poderia mostrar uma mensagem de erro para o usuário
      alert("Erro crítico na inicialização da aplicação. Verifique o console.");
      return;
  }
  Dashboard.initialize();
});
