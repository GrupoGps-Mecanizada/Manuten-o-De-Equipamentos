// Verificar se as dependências necessárias estão carregadas
if (!window.API || !window.Utilities) {
  console.error("Erro CRÍTICO: Dependências API ou Utilities não carregadas antes de dashboard.js");
} else {
  console.log("Dashboard.js - Dependências parecem carregadas.");
}

const Dashboard = (() => {
  // ... (todo o código interno do módulo Dashboard permanece o mesmo) ...
  let charts = {};
  let dashboardData = null;

  function initialize() {
    console.log("Dashboard.initialize() chamado."); // Log de verificação
    setupEventListeners();
    setupPeriodFilter();
    // Não carregar dados aqui, loadTabContent fará isso quando a tab for ativada
    // loadDashboardData(); // Removido daqui
  }

  function setupEventListeners() {
    // ... (código dos listeners permanece o mesmo) ...
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
      // { id: 'refresh-recent-maintenance', handler: () => renderRecentMaintenances(true) } // Se existir
    ];

     refreshButtons.forEach(btnInfo => {
        const button = document.getElementById(btnInfo.id);
        if (button) {
            // Remover listener antigo para segurança (cloneNode/replaceChild é mais robusto)
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            newButton.addEventListener('click', btnInfo.handler);
        } else {
            // console.warn(`Botão de atualização não encontrado no Dashboard: ${btnInfo.id}`);
        }
    });

    // Filtro de período
    const periodFilter = document.getElementById('period-filter');
    if (periodFilter) {
        // Remover listener antigo antes de adicionar novo
        periodFilter.removeEventListener('change', loadDashboardData); // Assume que loadDashboardData era o handler antigo
        periodFilter.addEventListener('change', loadDashboardData); // Adiciona o handler correto
    } else {
        console.warn('Elemento de filtro de período não encontrado no Dashboard: period-filter');
    }

    // Adicionar listeners para botões de ação nas tabelas (delegação)
    const recentTableBody = document.getElementById('recent-maintenance-tbody');
    if (recentTableBody) {
        // Limpar listeners antigos se esta função puder ser chamada múltiplas vezes
        // A forma mais segura é clonar o tbody ou usar uma flag
        // Mas como initialize é chamado uma vez, podemos apenas adicionar
        if (!recentTableBody.dataset.listenerAttached) { // Evitar múltiplos listeners
             addActionButtonListeners(recentTableBody);
             recentTableBody.dataset.listenerAttached = 'true';
        }
    } else {
        console.warn('Tbody da tabela de recentes não encontrado no Dashboard: recent-maintenance-tbody');
    }
  }

  function setupPeriodFilter() {
    const periodFilter = document.getElementById('period-filter');
    if (!periodFilter) return; // Sai se o elemento não existe

    // Definir período padrão para mês atual (se ainda não tiver valor)
    if (!periodFilter.value) {
       periodFilter.value = 'current-month';
    }
  }

  // Flag para evitar carregamentos múltiplos
  let isLoadingData = false;

  function loadDashboardData(forceReload = false) {
      // Evitar recargas múltiplas se já estiver carregando
      if (isLoadingData && !forceReload) {
          console.log("Dashboard data load already in progress. Skipping.");
          return;
      }
      isLoadingData = true;
      console.log("Iniciando loadDashboardData...");

      // Usar Utilities.showLoading
      if (typeof Utilities !== 'undefined' && Utilities.showLoading) {
        Utilities.showLoading(true, 'Carregando dados do dashboard...');
      }

      const period = document.getElementById('period-filter')?.value || 'current-month';

      Promise.all([
          API.getMaintenanceList(),
          API.getVerificationList() // Assumindo que retorna { success: true, verifications: [] }
      ])
      .then(([maintenanceResponse, verificationResponse]) => {
          console.log("Respostas API recebidas:", maintenanceResponse, verificationResponse);

          if (!maintenanceResponse || typeof maintenanceResponse !== 'object' || !verificationResponse || typeof verificationResponse !== 'object') {
              throw new Error('Respostas inválidas das APIs');
          }
          if (!maintenanceResponse.success) {
              throw new Error(`API de Manutenção falhou: ${maintenanceResponse.message || 'Erro desconhecido'}`);
          }
           if (!verificationResponse.success) {
              console.warn(`API de Verificação falhou: ${verificationResponse.message || 'Erro desconhecido'}. Continuando com verificações vazias.`);
              // Não lançar erro fatal, apenas usar array vazio
              verificationResponse.verifications = [];
          }

          const maintenances = maintenanceResponse.maintenances || [];
          // Corrigido: Usar a chave correta retornada pela API de verificação
          // Se a API retorna {maintenances: [...]}, usar isso. Se retorna {verifications: [...]}, usar isso.
          // Vamos assumir que getVerificationList retorna manutenções PENDENTES de verificação.
          // Se precisar de verificações JÁ FEITAS, a API precisa mudar ou uma nova API é necessária.
          // Por agora, vamos assumir que getVerificationList é para itens PENDENTES.
          // O cálculo de 'Verificações Concluídas' precisa de outra fonte de dados ou ajuste na API.
          const pendingVerifications = verificationResponse.maintenances || verificationResponse.verifications || [];

          const filteredMaintenances = filterByPeriod(maintenances, period);
          // Filtrar também as pendentes de verificação pelo período da *manutenção* original
          const filteredPendingVerifications = filterByPeriod(pendingVerifications, period);

          // TODO: Ajustar a lógica de 'dashboardData.verifications'
          // Se a intenção é mostrar verificações CONCLUÍDAS, a API precisa fornecer isso.
          // Vamos usar um array vazio por enquanto para evitar erros.
          const completedVerificationsData = []; // Substituir pela chamada API correta se existir

          dashboardData = {
              maintenances: filteredMaintenances,
              verifications: completedVerificationsData, // Dados das verificações CONCLUÍDAS
              pendingVerifications: filteredPendingVerifications, // Manutenções PENDENTES
              allMaintenances: maintenances,
              allVerifications: pendingVerifications, // Guardar as pendentes aqui por enquanto
              period: period
          };
          console.log("Dados do Dashboard processados:", dashboardData);
          updateDashboard();
      })
      .catch(error => {
          console.error("Erro GERAL ao carregar dados do dashboard:", error);
          if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
              Utilities.showNotification("Erro ao carregar dashboard: " + error.message, "error");
          }
          dashboardData = { maintenances: [], verifications: [], pendingVerifications: [], period: period, allMaintenances: [], allVerifications: [] };
          updateDashboard(); // Atualiza com dados vazios
      })
      .finally(() => {
          console.log("loadDashboardData finalizado.");
          isLoadingData = false;
          if (typeof Utilities !== 'undefined' && Utilities.showLoading) {
              Utilities.showLoading(false);
          }
      });
  }


  // ... (Restante das funções: filterByPeriod, updateDashboard, updateSummaryCards, clearCharts, clearTables, calculateVerificationTrend, render...Chart, addActionButtonListeners, findMaintenanceById)
  // Nenhuma mudança estrutural necessária nessas funções internas, mas garantir que usem 'Utilities.' para funções globais.
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
        console.warn(`Período de filtro inválido: ${period}. Retornando todos os dados.`);
        return data;
    }

    startDate.setHours(0, 0, 0, 0);


    return data.filter(item => {
      const dateStrToParse = dateField ? item[dateField] : (item.dataManutencao || item.dataRegistro || item.date || item.registrationDate);

      if (!dateStrToParse) return false;

      let itemDate;
      try {
        itemDate = new Date(dateStrToParse);
        if (isNaN(itemDate.getTime())) throw new Error('Data inválida');
        itemDate.setHours(0, 0, 0, 0);
      } catch (e) {
        // console.warn(`Data inválida no item ${item.id}: ${dateStrToParse}`);
        return false;
      }
      return itemDate >= startDate && itemDate <= endDate;
    });
  }

  function updateDashboard() {
    if (!dashboardData) {
        console.warn("Tentando atualizar dashboard sem dados.");
        updateSummaryCards();
        clearCharts();
        clearTables();
        return;
    }
    updateSummaryCards();
    renderMaintenanceTypeChart();
    renderStatusChart();
    renderAreaDistributionChart();
    renderProblemCategoriesChart();
    renderMonthlyTrendChart();
    renderCriticalVsRegularChart();
    renderVerificationResultsChart();
    renderMaintenanceFrequencyChart();
    renderEquipmentRanking();
    renderRecentMaintenances();
  }

  function updateSummaryCards() {
    const maintenances = dashboardData?.maintenances || [];
    // Usar 'pendingVerifications' para o card de pendentes
    const pendingVerificationsList = dashboardData?.pendingVerifications || [];
    // Usar 'verifications' (que são as concluídas) para o card de concluídas
    const completedVerificationsList = dashboardData?.verifications || [];
    const allMaintenances = dashboardData?.allMaintenances || [];

    document.getElementById('total-maintenance').textContent = maintenances.length;
    document.getElementById('pending-verification').textContent = pendingVerificationsList.length; // Contagem de itens pendentes
    document.getElementById('completed-verifications').textContent = completedVerificationsList.length; // Contagem de verificações concluídas
    const critical = maintenances.filter(m => m.eCritico || m.isCritical).length;
    document.getElementById('critical-maintenance').textContent = critical;

    const trendElement = document.getElementById('verification-trend');
    const trend = calculateVerificationTrend(); // Implementar lógica real se necessário
    trendElement.textContent = `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`;
    trendElement.className = 'card-trend';
    if (trend > 0) trendElement.classList.add('trend-up');
    if (trend < 0) trendElement.classList.add('trend-down');
  }

  function clearCharts() {
      Object.keys(charts).forEach(canvasId => {
          const canvas = document.getElementById(canvasId);
          const ctx = canvas?.getContext('2d');
          if (charts[canvasId]) {
              charts[canvasId].destroy();
              charts[canvasId] = null;
          }
          if(ctx) {
             ctx.clearRect(0, 0, canvas.width, canvas.height);
             ctx.save();
             ctx.textAlign = 'center';
             ctx.fillStyle = '#aaa';
             ctx.font = '14px Arial';
             ctx.fillText('Sem dados para exibir', canvas.width / 2, canvas.height / 2);
             ctx.restore();
          }
      });
  }

  function clearTables() {
      const rankingBody = document.getElementById('equipment-ranking-tbody');
      if (rankingBody) rankingBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Sem dados</td></tr>';
      const recentBody = document.getElementById('recent-maintenance-tbody');
      if (recentBody) recentBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Sem dados</td></tr>';
  }

  function calculateVerificationTrend() {
     // Placeholder - precisa de lógica real com dados do período anterior
    return 0.0;
  }


  function renderMaintenanceTypeChart(forceUpdate = false) {
    const canvasId = 'maintenance-type-chart';
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if ((forceUpdate || !dashboardData?.maintenances?.length) && charts[canvasId]) {
        charts[canvasId].destroy();
        charts[canvasId] = null;
    }

    if (!dashboardData?.maintenances?.length) {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpa
        return;
    }

    const maintenances = dashboardData.maintenances;
    const typeCount = {};
    maintenances.forEach(m => {
        const type = m.tipoManutencao || m.maintenanceType || 'Não especificado';
        typeCount[type] = (typeCount[type] || 0) + 1;
    });

    const labels = Object.keys(typeCount);
    const data = labels.map(label => typeCount[label]);
    const colors = ['#0052cc', '#6554c0', '#ff5630', '#ffab00', '#36b37e', '#00b8d9', '#996f2b', '#ff8b3d', '#2684FF', '#5243AA'];
    const options = { /* ... opções do gráfico ... */
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { position: 'right', labels: { boxWidth: 12, padding: 15, font: { size: 10 } } },
            tooltip: { callbacks: { label: context => {
                const label = context.label || ''; const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total === 0 ? 0 : ((value / total) * 100);
                return `${label}: ${value} (${percentage.toFixed(1)}%)`;
            }}},
            title: { display: true, text: 'Manutenções por Tipo', font: { size: 14 }, padding: { top: 10, bottom: 10 } }
        }
    };

    if (!charts[canvasId] && data.length > 0) {
        charts[canvasId] = new Chart(ctx, {
            type: 'pie',
            data: { labels: labels, datasets: [{ data: data, backgroundColor: labels.map((_, i) => colors[i % colors.length]) }] },
            options: options
        });
    } else if (charts[canvasId]) {
        charts[canvasId].data.labels = labels;
        charts[canvasId].data.datasets[0].data = data;
        charts[canvasId].data.datasets[0].backgroundColor = labels.map((_, i) => colors[i % colors.length]);
        charts[canvasId].update();
    } else {
         ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpa se não há dados
    }
  }

  function renderStatusChart(forceUpdate = false) {
    const canvasId = 'maintenance-status-chart';
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if ((forceUpdate || !dashboardData?.maintenances?.length) && charts[canvasId]) {
        charts[canvasId].destroy();
        charts[canvasId] = null;
    }
    if (!dashboardData?.maintenances?.length) {
        ctx.clearRect(0, 0, canvas.width, canvas.height); return;
    }

    const maintenances = dashboardData.maintenances;
    const statusCount = { 'Pendente': 0, 'Verificado': 0, 'Concluído': 0, 'Reprovado': 0, 'Outro': 0 };
    const statusMap = { /* ... mapeamento ... */
        'pendente': 'Pendente', 'aguardando verificacao': 'Pendente', 'aguardando verificação': 'Pendente',
        'verificado': 'Verificado', 'aprovado': 'Verificado', 'ajustes': 'Verificado',
        'concluido': 'Concluído', 'concluído': 'Concluído', 'reprovado': 'Reprovado',
    };
    maintenances.forEach(m => {
        let rawStatus = (m.status || 'Pendente').toLowerCase().trim();
        let mappedStatus = statusMap[rawStatus] || 'Outro';
        statusCount[mappedStatus]++;
    });

    const labels = Object.keys(statusCount).filter(key => statusCount[key] > 0);
    const data = labels.map(label => statusCount[label]);
    const colors = { 'Pendente': '#ffab00', 'Verificado': '#0052cc', 'Concluído': '#36b37e', 'Reprovado': '#ff5630', 'Outro': '#6B778C' };
    const backgroundColors = labels.map(label => colors[label] || '#6B778C');
    const options = { /* ... opções ... */
        responsive: true, maintainAspectRatio: false, cutout: '60%',
        plugins: {
            legend: { position: 'right', labels: { boxWidth: 12, padding: 15, font: { size: 10 } } },
            tooltip: { callbacks: { label: context => {
                 const label = context.label || ''; const value = context.parsed || 0;
                 const total = context.dataset.data.reduce((a, b) => a + b, 0);
                 const percentage = total === 0 ? 0 : ((value / total) * 100);
                 return `${label}: ${value} (${percentage.toFixed(1)}%)`;
            }}},
            title: { display: true, text: 'Status das Manutenções', font: { size: 14 }, padding: { top: 10, bottom: 10 } }
        }
    };

    if (!charts[canvasId] && data.length > 0) {
        charts[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: labels, datasets: [{ data: data, backgroundColor: backgroundColors }] },
            options: options
        });
    } else if (charts[canvasId]) {
        charts[canvasId].data.labels = labels;
        charts[canvasId].data.datasets[0].data = data;
        charts[canvasId].data.datasets[0].backgroundColor = backgroundColors;
        charts[canvasId].update();
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function renderAreaDistributionChart(forceUpdate = false) {
      const canvasId = 'area-distribution-chart';
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      if ((forceUpdate || !dashboardData?.maintenances?.length) && charts[canvasId]) {
          charts[canvasId].destroy(); charts[canvasId] = null;
      }
      if (!dashboardData?.maintenances?.length) {
          ctx.clearRect(0, 0, canvas.width, canvas.height); return;
      }

      const maintenances = dashboardData.maintenances;
      const areaCount = {};
      maintenances.forEach(m => {
          const area = m.area || m.localOficina || m.office || 'Não especificado';
          areaCount[area] = (areaCount[area] || 0) + 1;
      });

      const labels = Object.keys(areaCount).filter(key => areaCount[key] > 0);
      const data = labels.map(label => areaCount[label]);
      const colors = ['#00c7e6', '#ff5630', '#6554c0', '#36b37e', '#ffab00', '#0052cc', '#996f2b', '#ff8b3d', '#2684FF', '#5243AA'];
      const options = { /* ... opções ... */
          responsive: true, maintainAspectRatio: false,
          plugins: {
              legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15, font: { size: 10 } } },
              title: { display: true, text: 'Local de Manutenção', font: { size: 14 }, padding: { top: 10, bottom: 10 } },
              tooltip: { callbacks: { label: context => { /* ... callback ... */
                   const label = context.label || ''; const value = context.parsed || 0;
                   const total = context.dataset.data.reduce((a, b) => a + b, 0);
                   const percentage = total === 0 ? 0 : ((value / total) * 100);
                   return `${label}: ${value} (${percentage.toFixed(1)}%)`;
              }}}
          }
      };

      if (!charts[canvasId] && data.length > 0) {
          charts[canvasId] = new Chart(ctx, {
              type: 'pie',
              data: { labels: labels, datasets: [{ data: data, backgroundColor: labels.map((_, i) => colors[i % colors.length]) }] },
              options: options
          });
      } else if (charts[canvasId]) {
          charts[canvasId].data.labels = labels;
          charts[canvasId].data.datasets[0].data = data;
          charts[canvasId].data.datasets[0].backgroundColor = labels.map((_, i) => colors[i % colors.length]);
          charts[canvasId].update();
      } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
  }

  function renderProblemCategoriesChart(forceUpdate = false) {
      const canvasId = 'problem-categories-chart';
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      if ((forceUpdate || !dashboardData?.maintenances?.length) && charts[canvasId]) {
          charts[canvasId].destroy(); charts[canvasId] = null;
      }
      if (!dashboardData?.maintenances?.length) {
          ctx.clearRect(0, 0, canvas.width, canvas.height); return;
      }

      const maintenances = dashboardData.maintenances;
      const categoryCount = {};
      maintenances.forEach(m => {
          const category = m.categoriaProblema || m.problemCategory || 'Não especificado';
          categoryCount[category] = (categoryCount[category] || 0) + 1;
      });

      const sortedCategories = Object.entries(categoryCount)
          .filter(entry => entry[1] > 0)
          .sort(([, countA], [, countB]) => countB - countA)
          .slice(0, 10);
      const labels = sortedCategories.map(item => item[0]);
      const data = sortedCategories.map(item => item[1]);
      const colors = ['#0052cc', '#ff5630', '#ffab00', '#36b37e', '#6554c0', '#00b8d9', '#996f2b', '#ff8b3d', '#2684FF', '#5243AA'];
      const options = { /* ... opções ... */
          responsive: true, maintainAspectRatio: false, indexAxis: 'y',
          plugins: {
              legend: { display: false },
              title: { display: true, text: 'Top 10 Categorias de Problemas', font: { size: 14 }, padding: { top: 10, bottom: 20 } },
              tooltip: { callbacks: { label: context => ` ${context.parsed.x} ocorrências` } }
          },
          scales: {
              x: { beginAtZero: true, title: { display: true, text: 'Número de Ocorrências', font: { size: 12 } }, ticks: { precision: 0 } },
              y: { ticks: { font: { size: 10 } } }
          }
      };

      if (!charts[canvasId] && data.length > 0) {
          charts[canvasId] = new Chart(ctx, {
              type: 'bar',
              data: { labels: labels, datasets: [{ label: 'Ocorrências', data: data, backgroundColor: labels.map((_, i) => colors[i % colors.length]), borderWidth: 0, borderRadius: 4 }] },
              options: options
          });
      } else if (charts[canvasId]) {
          charts[canvasId].data.labels = labels;
          charts[canvasId].data.datasets[0].data = data;
          charts[canvasId].data.datasets[0].backgroundColor = labels.map((_, i) => colors[i % colors.length]);
          charts[canvasId].update();
      } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
  }

  function renderMonthlyTrendChart(forceUpdate = false) {
      const canvasId = 'monthly-trend-chart';
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      if ((forceUpdate || !dashboardData?.maintenances?.length) && charts[canvasId]) {
          charts[canvasId].destroy(); charts[canvasId] = null;
      }
      if (!dashboardData?.maintenances?.length) {
          ctx.clearRect(0, 0, canvas.width, canvas.height); return;
      }

      const maintenances = dashboardData.maintenances; // Usar dados filtrados pelo período
      const monthlyData = {};
      maintenances.forEach(m => {
          const dateStr = m.dataManutencao || m.dataRegistro || m.date || m.registrationDate;
          if (!dateStr) return;
          try {
              const date = new Date(dateStr); if (isNaN(date.getTime())) return;
              const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
          } catch (e) {}
      });

      const sortedKeys = Object.keys(monthlyData).sort();
      const labels = sortedKeys.map(key => {
          const [year, month] = key.split('-');
          const date = new Date(year, month - 1, 1);
          return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      });
      const data = sortedKeys.map(key => monthlyData[key]);
      const options = { /* ... opções ... */
          responsive: true, maintainAspectRatio: false,
          plugins: {
              legend: { display: false },
              title: { display: true, text: 'Tendência Mensal (Período Selecionado)', font: { size: 14 }, padding: { top: 10, bottom: 10 } },
              tooltip: { mode: 'index', intersect: false }
          },
          scales: {
              y: { beginAtZero: true, title: { display: true, text: 'Quantidade', font: { size: 12 } }, ticks: { precision: 0 } },
              x: { grid: { display: false }, title: { display: true, text: 'Mês', font: { size: 12 } } }
          },
          interaction: { mode: 'nearest', axis: 'x', intersect: false }
      };

      if (!charts[canvasId] && data.length > 0) {
          charts[canvasId] = new Chart(ctx, {
              type: 'line',
              data: { labels: labels, datasets: [{ label: 'Manutenções', data: data, borderColor: '#36b37e', backgroundColor: 'rgba(54, 179, 126, 0.1)', fill: true, tension: 0.3, borderWidth: 2, pointBackgroundColor: '#36b37e', pointRadius: 3, pointHoverRadius: 5 }] },
              options: options
          });
      } else if (charts[canvasId]) {
          charts[canvasId].data.labels = labels;
          charts[canvasId].data.datasets[0].data = data;
          charts[canvasId].update();
      } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
  }

  function renderCriticalVsRegularChart(forceUpdate = false) {
      const canvasId = 'critical-vs-regular-chart';
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      if ((forceUpdate || !dashboardData?.maintenances?.length) && charts[canvasId]) {
          charts[canvasId].destroy(); charts[canvasId] = null;
      }
      if (!dashboardData?.maintenances?.length) {
          ctx.clearRect(0, 0, canvas.width, canvas.height); return;
      }

      const maintenances = dashboardData.maintenances;
      let criticalCount = 0;
      maintenances.forEach(m => { if (m.eCritico === true || m.isCritical === true) { criticalCount++; } });
      const regularCount = maintenances.length - criticalCount;
      const data = [criticalCount, regularCount];
      const labels = ['Críticas', 'Regulares'];
      const colors = ['#ff5630', '#0052cc'];

      if (criticalCount === 0 && regularCount === 0) {
          if (charts[canvasId]) { charts[canvasId].destroy(); charts[canvasId] = null; }
          ctx.clearRect(0, 0, canvas.width, canvas.height); return;
      }

      const options = { /* ... opções ... */
          responsive: true, maintainAspectRatio: false, cutout: '70%',
          plugins: {
              legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15, font: { size: 11 } } },
              title: { display: true, text: 'Críticas vs Regulares', font: { size: 14 }, padding: { top: 10, bottom: 10 } },
              tooltip: { callbacks: { label: context => { /* ... callback ... */
                   const label = context.label || ''; const value = context.parsed || 0;
                   const total = context.dataset.data.reduce((a, b) => a + b, 0);
                   const percentage = total === 0 ? 0 : ((value / total) * 100);
                   return `${label}: ${value} (${percentage.toFixed(1)}%)`;
              }}}
          }
      };

      if (!charts[canvasId]) {
          charts[canvasId] = new Chart(ctx, {
              type: 'doughnut',
              data: { labels: labels, datasets: [{ data: data, backgroundColor: colors }] },
              options: options
          });
      } else if (charts[canvasId]) {
          charts[canvasId].data.labels = labels;
          charts[canvasId].data.datasets[0].data = data;
          charts[canvasId].update();
      }
  }

  function renderVerificationResultsChart(forceUpdate = false) {
      const canvasId = 'verification-results-chart';
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      // USA dashboardData.verifications (verificações CONCLUÍDAS)
      const completedVerifications = dashboardData?.verifications || [];

      if ((forceUpdate || !completedVerifications.length) && charts[canvasId]) {
          charts[canvasId].destroy(); charts[canvasId] = null;
      }
      if (!completedVerifications.length) {
          ctx.clearRect(0, 0, canvas.width, canvas.height); return;
      }

      const resultCounts = { 'Aprovado': 0, 'Ajustes': 0, 'Reprovado': 0, 'Outro': 0 };
      const resultMap = { /* ... mapeamento ... */
          'aprovado': 'Aprovado', 'aprovado - manutenção correta': 'Aprovado',
          'ajustes': 'Ajustes', 'necessita ajustes menores': 'Ajustes',
          'reprovado': 'Reprovado', 'reprovado - precisa de nova manutenção': 'Reprovado',
      };
      completedVerifications.forEach(v => {
          const rawResult = (v.result || v.resultado || 'Outro').toLowerCase().trim();
          const mappedResult = resultMap[rawResult] || 'Outro';
          resultCounts[mappedResult]++;
      });

      const labels = Object.keys(resultCounts).filter(key => resultCounts[key] > 0);
      const data = labels.map(key => resultCounts[key]);
      const colors = { 'Aprovado': '#36b37e', 'Ajustes': '#ffab00', 'Reprovado': '#ff5630', 'Outro': '#6B778C' };
      const backgroundColors = labels.map(label => colors[label] || '#6B778C');
      const options = { /* ... opções ... */
          responsive: true, maintainAspectRatio: false,
          plugins: {
              legend: { display: false },
              title: { display: true, text: 'Resultados das Verificações', font: { size: 14 }, padding: { top: 10, bottom: 10 } },
              tooltip: { callbacks: { title: () => null, label: context => ` ${context.parsed.y} verificações` } }
          },
          scales: {
              y: { beginAtZero: true, title: { display: true, text: 'Quantidade', font: { size: 12 } }, ticks: { precision: 0 } },
              x: { title: { display: true, text: 'Resultado', font: { size: 12 } } }
          }
      };

      if (!charts[canvasId] && data.length > 0) {
          charts[canvasId] = new Chart(ctx, {
              type: 'bar',
              data: { labels: labels, datasets: [{ label: 'Verificações', data: data, backgroundColor: backgroundColors, borderWidth: 0, borderRadius: 4, barPercentage: 0.6, categoryPercentage: 0.7 }] },
              options: options
          });
      } else if (charts[canvasId]) {
          charts[canvasId].data.labels = labels;
          charts[canvasId].data.datasets[0].data = data;
          charts[canvasId].data.datasets[0].backgroundColor = backgroundColors;
          charts[canvasId].update();
      } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
  }

  function renderMaintenanceFrequencyChart(forceUpdate = false) {
      const canvasId = 'maintenance-frequency-chart';
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      // Usar TODOS os dados para frequência
      const allMaintenances = dashboardData?.allMaintenances || [];

      if ((forceUpdate || !allMaintenances.length) && charts[canvasId]) {
          charts[canvasId].destroy(); charts[canvasId] = null;
      }
      if (!allMaintenances.length) {
          ctx.clearRect(0, 0, canvas.width, canvas.height); return;
      }

      const equipmentGroups = {};
      allMaintenances.forEach(m => { /* ... agrupar por equipamento ... */
          const id = m.placaOuId || m.equipmentId || 'Não especificado';
          if (id === 'Não especificado') return;
          if (!equipmentGroups[id]) { equipmentGroups[id] = { type: m.tipoEquipamento || m.equipmentType || 'Tipo não especificado', dates: [] }; }
          const dateStr = m.dataManutencao || m.dataRegistro || m.date || m.registrationDate;
          if (!dateStr) return;
          try { const date = new Date(dateStr); if (!isNaN(date.getTime())) equipmentGroups[id].dates.push(date); } catch (e) {}
      });

      const intervalDataByType = {};
      for (const id in equipmentGroups) { /* ... calcular intervalos ... */
          const group = equipmentGroups[id];
          const dates = group.dates.sort((a, b) => a - b);
          if (dates.length < 2) continue;
          let totalDaysSum = 0, intervalCount = 0;
          for (let i = 1; i < dates.length; i++) {
              const diffTime = Math.abs(dates[i] - dates[i - 1]);
              const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays > 0) { totalDaysSum += diffDays; intervalCount++; }
          }
          if (intervalCount > 0) {
              const avgDaysForEquipment = totalDaysSum / intervalCount;
              const equipmentType = group.type;
              if (!intervalDataByType[equipmentType]) { intervalDataByType[equipmentType] = { totalAvgDaysSum: 0, equipmentCount: 0 }; }
              intervalDataByType[equipmentType].totalAvgDaysSum += avgDaysForEquipment;
              intervalDataByType[equipmentType].equipmentCount++;
          }
      }

      const typesWithAvgData = [];
      for (const type in intervalDataByType) { /* ... calcular média final ... */
          const data = intervalDataByType[type];
          if (data.equipmentCount > 0) { typesWithAvgData.push({ type: type, avgDays: data.totalAvgDaysSum / data.equipmentCount }); }
      }
      typesWithAvgData.sort((a, b) => a.avgDays - b.avgDays);
      const labels = typesWithAvgData.map(d => d.type);
      const data = typesWithAvgData.map(d => d.avgDays.toFixed(1));
      const options = { /* ... opções ... */
          responsive: true, maintainAspectRatio: false,
          plugins: {
              legend: { display: false },
              title: { display: true, text: 'Intervalo Médio entre Manutenções (dias)', font: { size: 14 }, padding: { top: 10, bottom: 10 } },
              tooltip: { callbacks: { title: (tooltipItems) => tooltipItems[0].label, label: context => ` Média: ${context.parsed.y} dias` } }
          },
          scales: {
              y: { beginAtZero: true, title: { display: true, text: 'Dias (Média)', font: { size: 12 } } },
              x: { title: { display: true, text: 'Tipo de Equipamento', font: { size: 12 } }, ticks: { font: { size: 10 } } }
          }
      };

      if (!charts[canvasId] && data.length > 0) {
          charts[canvasId] = new Chart(ctx, {
              type: 'bar',
              data: { labels: labels, datasets: [{ label: 'Intervalo Médio (dias)', data: data, backgroundColor: '#ffab00', borderWidth: 0, borderRadius: 4, barPercentage: 0.6, categoryPercentage: 0.7 }] },
              options: options
          });
      } else if (charts[canvasId]) {
          charts[canvasId].data.labels = labels;
          charts[canvasId].data.datasets[0].data = data;
          charts[canvasId].update();
      } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
  }

  function renderEquipmentRanking(forceUpdate = false) {
      const tbody = document.getElementById('equipment-ranking-tbody');
      if (!tbody) return;
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Carregando ranking...</td></tr>';

      const maintenances = dashboardData?.maintenances || []; // Usar dados do período
      if (maintenances.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Sem dados no período.</td></tr>'; return;
      }

      const equipmentStats = {};
      maintenances.forEach(m => { /* ... agrupar e contar ... */
          const id = m.placaOuId || m.equipmentId || 'Não especificado'; if (id === 'Não especificado') return;
          if (!equipmentStats[id]) { equipmentStats[id] = { type: m.tipoEquipamento || m.equipmentType || 'Não especificado', count: 0, lastMaintenanceDate: null, lastStatus: 'N/A' }; }
          equipmentStats[id].count++;
          const dateStr = m.dataManutencao || m.dataRegistro || m.date || m.registrationDate;
          if (dateStr) {
              try {
                  const currentDate = new Date(dateStr); if (isNaN(currentDate.getTime())) return;
                  if (!equipmentStats[id].lastMaintenanceDate || currentDate > equipmentStats[id].lastMaintenanceDate) {
                      equipmentStats[id].lastMaintenanceDate = currentDate;
                      equipmentStats[id].lastStatus = m.status || 'Pendente';
                  }
              } catch (e) {}
          }
      });

      const equipmentRanking = Object.entries(equipmentStats)
          .map(([id, data]) => ({ id: id, type: data.type, count: data.count, lastDate: data.lastMaintenanceDate, status: data.lastStatus }))
          .sort((a, b) => b.count - a.count).slice(0, 10);

      tbody.innerHTML = ''; // Limpar
      if (equipmentRanking.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum equipamento encontrado.</td></tr>'; return;
      }

      equipmentRanking.forEach(equip => { /* ... preencher tabela ... */
          let formattedDate = '-';
          if (equip.lastDate) { formattedDate = (typeof Utilities !== 'undefined' && Utilities.formatDate) ? Utilities.formatDate(equip.lastDate) : equip.lastDate.toLocaleDateString('pt-BR'); }
          const statusClass = (typeof Utilities !== 'undefined' && Utilities.getStatusClass) ? Utilities.getStatusClass(equip.status) : (equip.status || 'pendente').toLowerCase();
          const row = document.createElement('tr');
          row.innerHTML = `<td>${equip.id}</td><td>${equip.type}</td><td style="text-align: center;">${equip.count}</td><td>${formattedDate}</td><td><span class="status-badge status-${statusClass}">${equip.status || 'N/A'}</span></td>`;
          tbody.appendChild(row);
      });
  }

  function renderRecentMaintenances() {
      const tbody = document.getElementById('recent-maintenance-tbody');
      if (!tbody) return;
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Carregando recentes...</td></tr>';

      const maintenances = dashboardData?.maintenances || []; // Usar dados do período
      if (maintenances.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Sem dados no período.</td></tr>'; return;
      }

      const recentMaintenances = [...maintenances].sort((a, b) => { /* ... ordenar por data ... */
          const dateAStr = a.dataRegistro || a.registrationDate || a.dataManutencao || a.date || 0;
          const dateBStr = b.dataRegistro || b.registrationDate || b.dataManutencao || b.date || 0;
          let dateA, dateB; try { dateA = new Date(dateAStr); if (isNaN(dateA.getTime())) dateA = new Date(0); } catch (e) { dateA = new Date(0); }
          try { dateB = new Date(dateBStr); if (isNaN(dateB.getTime())) dateB = new Date(0); } catch (e) { dateB = new Date(0); }
          return dateB - dateA;
      }).slice(0, 5);

      tbody.innerHTML = ''; // Limpar
      if (recentMaintenances.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhuma manutenção recente.</td></tr>'; return;
      }

      recentMaintenances.forEach(item => { /* ... preencher tabela ... */
          const id = item.id || 'N/A';
          const equipmentId = item.placaOuId || item.equipmentId || '-';
          const maintenanceType = item.tipoManutencao || item.maintenanceType || 'N/A';
          let regDate = '-'; const dateStr = item.dataRegistro || item.registrationDate || item.dataManutencao || item.date;
          if (dateStr) { regDate = (typeof Utilities !== 'undefined' && Utilities.formatDate) ? Utilities.formatDate(dateStr, true) : new Date(dateStr).toLocaleString('pt-BR'); }
          const resp = item.responsavel || item.technicianName || item.technician || '-';
          const status = item.status || 'Pendente';
          const statusClass = typeof Utilities !== 'undefined' ? Utilities.getStatusClass(status) : status.toLowerCase();
          const allowVerification = ['pendente', 'aguardando verificação'].includes(status.toLowerCase());
          const row = document.createElement('tr'); row.setAttribute('data-maintenance-id', id);
          row.innerHTML = `<td>${id}</td><td>${equipmentId}</td><td>${maintenanceType}</td><td>${regDate}</td><td>${resp}</td><td><span class="status-badge status-${statusClass}">${status}</span></td><td class="action-buttons"><button class="btn-icon view-maintenance" data-id="${id}" title="Ver detalhes">👁️</button>${allowVerification ? `<button class="btn-icon verify-maintenance" data-id="${id}" title="Verificar">✓</button>` : ''}</td>`;
          tbody.appendChild(row);
      });
       // Listeners são adicionados via delegação no setupEventListeners
  }

  function addActionButtonListeners(container) {
      // Usar delegação de eventos
      container.addEventListener('click', function(event) {
          const targetButton = event.target.closest('.btn-icon');
          if (!targetButton) return;
          const maintenanceId = targetButton.getAttribute('data-id');
          if (!maintenanceId) return;

          if (targetButton.classList.contains('view-maintenance')) {
              // Usar função global de Utilities
              if (typeof Utilities !== 'undefined' && Utilities.viewMaintenanceDetails) {
                   Utilities.viewMaintenanceDetails(maintenanceId); // Chama a função que busca e renderiza
              } else {
                   console.error('Função Utilities.viewMaintenanceDetails não definida.');
                   alert(`Detalhes ID: ${maintenanceId}`);
              }
          } else if (targetButton.classList.contains('verify-maintenance')) {
               // Chamar módulo Verification
               if (typeof Verification !== 'undefined' && Verification.openVerificationForm) {
                  Verification.openVerificationForm(maintenanceId);
               } else {
                  console.error('Função Verification.openVerificationForm não definida.');
                   alert(`Verificar ID: ${maintenanceId}`);
               }
          } else if (targetButton.classList.contains('edit-maintenance')) {
               // Chamar módulo Maintenance
               if (typeof Maintenance !== 'undefined' && Maintenance.openMaintenanceForm) {
                    // Precisa buscar os dados para editar
                    const maintenanceData = findMaintenanceById(maintenanceId);
                    if (maintenanceData) {
                         Maintenance.openMaintenanceForm(maintenanceId, maintenanceData); // Passa ID e dados
                    } else {
                         if(typeof Utilities !== 'undefined') Utilities.showNotification("Erro: Não foi possível carregar dados para edição.", "error");
                    }
               } else {
                    console.error('Função Maintenance.openMaintenanceForm não definida.');
                    alert(`Editar ID: ${maintenanceId}`);
               }
          }
      });
  }


  function findMaintenanceById(id) {
      if (!dashboardData || !dashboardData.allMaintenances) return null;
      const stringId = String(id); // Comparar como string
      let maintenance = dashboardData.maintenances?.find(m => String(m.id) === stringId);
      if (!maintenance) {
          maintenance = dashboardData.allMaintenances.find(m => String(m.id) === stringId);
      }
      return maintenance || null;
  }

  // API pública do módulo Dashboard
  return {
    initialize,
    loadDashboardData
  };
})();

// REMOVER O LISTENER ABAIXO:
/*
document.addEventListener('DOMContentLoaded', function() {
  // ... (verificação de dependências) ...
  Dashboard.initialize();
});
*/
