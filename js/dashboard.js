/**
 * Sistema de Dupla Checagem de Manutenção
 * Módulo: Dashboard (Versão FINAL Frontend - 03/05/2025 v2 - Corrigido e Atualizado com Novos Filtros)
 */

const Dashboard = (function() {
  // Armazenar dados do dashboard
  let dashboardData = null;
  let chartInstances = {}; // Armazena instâncias dos gráficos para destruí-las
  let lastLoadTime = 0;
  const REFRESH_INTERVAL = 300000; // 5 minutos
  let dashboardInitialized = false;

  // Constantes para os tipos de filtro (adaptadas para os data-period existentes)
  const FILTER_TYPES = {
    CURRENT_MONTH: 'current-month',
    LAST_MONTH: 'last-month',
    LAST_3_MONTHS: 'last-3-months',
    LAST_6_MONTHS: 'last-6-months',
    CURRENT_YEAR: 'current-year',
    ALL: 'all'
  };

  // Estado inicial do filtro
  let currentFilter = FILTER_TYPES.CURRENT_MONTH; // Padrão corresponde ao botão 'Mês Atual'


  /** Limpa instâncias de gráficos anteriores */
  function cleanupCharts() {
    if (chartInstances) {
      Object.values(chartInstances).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
          try { chart.destroy(); } catch (e) { console.error("Erro ao destruir chart:", e); }
        }
      });
    }
    chartInstances = {};
  }

  // Função createFilterDropdown original era apenas um log, removida da inicialização pois
  // a nova lógica de filtros não a utiliza e sua implementação não foi fornecida na atualização.
  // function createFilterDropdown() {
  //    console.log("Dropdown de filtros criado e configurado.");
  // }

  /** Inicializa o dashboard */
  function initialize() {
    if (dashboardInitialized) {
      return;
    }
    console.log("Dashboard.initialize() chamado");

    if (!document.getElementById('tab-dashboard')) {
        console.error("Elemento #tab-dashboard não encontrado. A inicialização do Dashboard não pode continuar.");
        return;
    }

    createPeriodButtonsIfNeeded(); // Cria botões de período/filtro se não existirem
    initializeFilters();         // Configura os novos listeners de filtro
    setupRefreshButton();        // Configura listener do botão refresh
    setupTabNavigation();        // Monitora hashchange

    const isActive = document.getElementById('tab-dashboard').classList.contains('active');
    const hash = window.location.hash || '#dashboard';
    if (isActive || hash === '#dashboard') {
       checkIfDashboard(true); // Passa true para forçar carregamento inicial
    }

    dashboardInitialized = true;
    console.log("Dashboard inicializado com sucesso.");
  }

  /** Cria botões de período (que agora funcionam como botões de filtro) se eles não existirem no DOM */
  function createPeriodButtonsIfNeeded() {
    const dashboardHeader = document.querySelector('#tab-dashboard .dashboard-header');
    if (!dashboardHeader || dashboardHeader.querySelector('.dashboard-controls .period-buttons')) return; // Verifica se os botões já existem

    console.log("Criando controles do Dashboard (botões de filtro/refresh)...");

    let controlsContainer = dashboardHeader.querySelector('.dashboard-controls');
    if (!controlsContainer) {
        controlsContainer = document.createElement('div');
        controlsContainer.className = 'dashboard-controls';
        dashboardHeader.appendChild(controlsContainer);
    }
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'period-buttons'; // Usado como seletor para filtros
    const periods = [
      { id: FILTER_TYPES.CURRENT_MONTH, label: 'Mês Atual' }, { id: FILTER_TYPES.LAST_MONTH, label: 'Mês Anterior' },
      { id: FILTER_TYPES.LAST_3_MONTHS, label: 'Últimos 3m' }, { id: FILTER_TYPES.LAST_6_MONTHS, label: 'Últimos 6m' },
      { id: FILTER_TYPES.CURRENT_YEAR, label: 'Este Ano' }, { id: FILTER_TYPES.ALL, label: 'Todos' }
    ];
    
    periods.forEach(period => {
      const button = document.createElement('button');
      // Adiciona classe 'filter-button' para consistência se necessário, mas a lógica de filtro usa '.period-btn'
      button.className = 'period-btn'; // Esta classe é usada pelos seletores de filtro
      button.setAttribute('data-filter', period.id); // Usa 'data-filter' como na atualização
      button.setAttribute('data-period', period.id); // Mantém 'data-period' por compatibilidade se houver
      button.textContent = period.label;
      if (period.id === currentFilter) { // Marca o filtro padrão como ativo
          button.classList.add('active');
      }
      buttonContainer.appendChild(button);
    });
    controlsContainer.prepend(buttonContainer); // Adiciona botões de filtro no início dos controles

    createRefreshButton(controlsContainer);

    if (!document.getElementById('dashboard-controls-style')) {
         const styleElement = document.createElement('style');
         styleElement.id = 'dashboard-controls-style';
         styleElement.textContent = `
           .dashboard-controls { display: flex; justify-content: space-between; align-items: center; width: auto; flex-wrap: wrap; gap: 10px;}
           .period-buttons { display: flex; gap: 5px; flex-wrap: wrap; }
           .period-btn { padding: 5px 10px; background-color: #f0f0f0; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; font-size: 0.8rem; transition: background-color 0.2s, color 0.2s, border-color 0.2s; }
           .period-btn:hover { background-color: #e0e0e0; }
           .period-btn.active { background-color: var(--primary-color, #0052cc); color: white; border-color: var(--primary-color, #0052cc); font-weight: 500; }
           .btn-refresh { margin-left: 10px; }
           .btn-refresh.rotating { animation: rotate 1s linear infinite; }
           @keyframes rotate { to { transform: rotate(360deg); } }
           @media (max-width: 767px) {
             .dashboard-controls { width: 100%; justify-content: flex-start; }
             .btn-refresh { margin-left: auto; }
           }
         `;
         document.head.appendChild(styleElement);
     }
    console.log("Controles do Dashboard (filtros/refresh) criados/verificados.");
  }

  /** Função para inicializar os filtros (configurar listeners) */
  function initializeFilters() {
    const filterButtonsContainer = document.querySelector('#tab-dashboard .period-buttons');
    if (!filterButtonsContainer) {
        console.warn("Container de botões de filtro (.period-buttons) não encontrado para adicionar listener.");
        return;
    }
    
    // Adicionar evento de clique DELEGADO ao container dos botões de filtro
    filterButtonsContainer.removeEventListener('click', handleFilterClick); // Garante que não haja duplicatas
    filterButtonsContainer.addEventListener('click', handleFilterClick);
    console.log("Listeners dos botões de filtro configurados via delegação em .period-buttons.");

    // Ativar o filtro padrão visualmente (já feito em createPeriodButtonsIfNeeded e currentFilter já definido)
    // activateFilter(currentFilter); // Assegura o estado visual correto

    // O carregamento inicial de dados é tratado por checkIfDashboard -> loadDashboardData
    // loadDashboardData(currentFilter, true); // Não carregar aqui, checkIfDashboard fará.
  }

  /** Função para lidar com cliques nos botões de filtro (delegação) */
  function handleFilterClick(e) {
    const targetButton = e.target.closest('.period-btn'); // Botões de período agora são botões de filtro
    if (!targetButton) return;

    const filterType = targetButton.dataset.filter; // Usar data-filter
    if (!filterType) return;
    
    if (filterType === currentFilter && targetButton.classList.contains('active')) {
      // Se o filtro já estiver ativo e o botão clicado é o ativo, não faz nada
      // (útil se o clique não for necessariamente para mudar)
      // Para forçar recarga no mesmo filtro, usar o botão refresh.
      return;
    }
    
    activateFilter(filterType); // Ativa o novo filtro (estado e visual)
    loadDashboardData(filterType, true); // Carrega dados com o novo filtro, forçando a atualização
  }

  /** Função para ativar visualmente um filtro e atualizar o estado */
  function activateFilter(filterType) {
    console.log("Ativando filtro:", filterType);
    currentFilter = filterType; // Atualiza o filtro atual no estado do módulo
    
    const filterButtons = document.querySelectorAll('#tab-dashboard .period-btn');
    filterButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    const activeButton = document.querySelector(`.period-btn[data-filter="${filterType}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    } else {
        console.warn(`Botão de filtro para '${filterType}' não encontrado para ativar visualmente.`);
    }

    // Limpar campos de filtro de data customizado (se existirem no HTML)
    // A atualização não implementa filtro customizado, mas esta é uma boa prática.
    const startDateInput = document.getElementById('filterStartDate');
    const endDateInput = document.getElementById('filterEndDate');
    if (startDateInput) startDateInput.value = '';
    if (endDateInput) endDateInput.value = '';
  }

  /** Configura o listener do botão de refresh via delegação */
  function setupRefreshButton() {
    const controlsContainer = document.querySelector('#tab-dashboard .dashboard-controls');
     if (!controlsContainer) {
       console.warn("Container de controles não encontrado para listener do refresh.");
       return;
     }
    controlsContainer.removeEventListener('click', handleRefreshButtonClick); // Evita duplicatas
    controlsContainer.addEventListener('click', handleRefreshButtonClick);
    console.log("Listener do botão Refresh configurado via delegação.");
  }

  /** Handler para clique no botão refresh (delegação) */
  function handleRefreshButtonClick(event) {
     const targetButton = event.target.closest('#refresh-dashboard');
     if (!targetButton) return;

     console.log("Atualização manual do dashboard solicitada");
     
     // A lógica de filtro de data customizado foi removida daqui pois a atualização foca em filtros pré-definidos.
     // O refresh agora usa o currentFilter ativo.
     console.log("Atualizando com filtro pré-definido:", currentFilter);
     loadDashboardData(currentFilter, true); // Força recarregamento com o filtro ATUAL

     targetButton.classList.remove('rotating');
     void targetButton.offsetWidth;
     targetButton.classList.add('rotating');
  }

  /** Cria um botão de atualização se não existir */
  function createRefreshButton(parentContainer) {
     if (document.getElementById('refresh-dashboard') || !parentContainer) return;
     console.log("Criando botão Refresh...");
     const refreshButton = document.createElement('button');
     refreshButton.id = 'refresh-dashboard';
     refreshButton.className = 'btn-icon btn-refresh';
     refreshButton.innerHTML = '↻';
     refreshButton.title = 'Atualizar Dashboard';
     refreshButton.style.fontSize = '1.2rem';
     parentContainer.appendChild(refreshButton);
     console.log("Botão Refresh criado.");
  }

   /** Configura monitoramento de hashchange */
   function setupTabNavigation() {
     window.addEventListener('hashchange', () => checkIfDashboard(false), false);
   }

   /** Verifica se a aba Dashboard está ativa e carrega/atualiza dados */
   function checkIfDashboard(isInitialLoad = false) {
     const hash = window.location.hash || '#dashboard';
     const dashboardTabElement = document.getElementById('tab-dashboard');

     if (hash === '#dashboard' && dashboardTabElement) {
        const isActive = dashboardTabElement.classList.contains('active');
        if (isActive) {
           console.log("Verificando aba Dashboard (ativa)...");
           // A lógica de decidir se carrega ou não (baseada em REFRESH_INTERVAL)
           // está agora dentro de loadDashboardData.
           // isInitialLoad é passado como 'force' para loadDashboardData.
           const filterToLoad = currentFilter; // Carrega com o filtro atualmente selecionado/padrão
           const delay = isInitialLoad ? 200 : 0;
           setTimeout(() => { loadDashboardData(filterToLoad, isInitialLoad); }, delay);
        }
     }
   }


  /** Função para calcular intervalo de datas com base no filtro */
  function calculateDateRange(filterType) {
    const now = new Date();
    let startDate;
    // Define endDate como o final do dia atual por padrão para a maioria dos filtros.
    let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    switch (filterType) {
        case FILTER_TYPES.CURRENT_MONTH:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case FILTER_TYPES.LAST_MONTH:
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999); // Último dia do mês anterior
            break;
        case FILTER_TYPES.LAST_3_MONTHS:
            startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            break;
        case FILTER_TYPES.LAST_6_MONTHS:
            startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
            break;
        case FILTER_TYPES.CURRENT_YEAR:
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        case FILTER_TYPES.ALL:
        default:
            startDate = new Date(2000, 0, 1); // Data bem antiga para "Todos"
            break;
    }
    // Garante que startDate seja o início do dia.
    if (startDate) {
        startDate.setHours(0, 0, 0, 0);
    }
    return { startDate, endDate };
  }

  /** Função auxiliar para formatar data como yyyy-mm-dd para a API */
  function formatDateForAPI(date) {
    if (!date || !(date instanceof Date) || isNaN(date)) return ''; // Retorna string vazia se data inválida
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /** Função para buscar dados do dashboard da API com base no intervalo de datas */
  function fetchDashboardData(startDate, endDate) {
    const formattedStartDate = formatDateForAPI(startDate);
    const formattedEndDate = formatDateForAPI(endDate);
    
    // API_URL deve estar definida globalmente ou ser acessível (ex: const API_URL = "/api/main.php";)
    if (typeof API_URL === 'undefined') {
        console.error("API_URL não está definida. Não é possível buscar dados do dashboard.");
        return Promise.resolve({ success: false, message: "API_URL não configurada." });
    }

    let url = `${API_URL}?action=getDashboardData`;
    if (formattedStartDate) url += `&startDate=${formattedStartDate}`;
    if (formattedEndDate) url += `&endDate=${formattedEndDate}`;

    console.log("Buscando dados do dashboard da API:", url);
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                // Tenta pegar uma mensagem de erro do corpo da resposta, se houver
                return response.text().then(text => {
                    try {
                        const errData = JSON.parse(text);
                        throw new Error(errData.message || `Erro HTTP: ${response.status}`);
                    } catch (e) {
                        throw new Error(text || `Erro HTTP: ${response.status}`);
                    }
                });
            }
            return response.json();
        })
        .catch(error => {
            console.error('Erro em fetchDashboardData:', error);
            return { success: false, message: error.message || "Erro ao buscar dados do dashboard via API." };
        });
  }

  /** Carrega dados do dashboard via API (AGORA USANDO FILTROS DE DATA) */
  function loadDashboardData(filterType = currentFilter, force = false) {
    const currentTime = Date.now();
    // Se não for forçado, e os dados existem, e o intervalo de refresh não passou, E o filtro é o mesmo: não carrega.
    if (!force && dashboardData && (currentTime - lastLoadTime < REFRESH_INTERVAL) && filterType === currentFilter) {
      console.log("Dados recentes para o filtro atual, pulando carregamento.");
      // Se o dashboard já estiver renderizado com esses dados, não precisa fazer nada.
      // Se precisar garantir que está renderizado, descomente:
      // renderDashboard(dashboardData); 
      return;
    }

    console.log(`Carregando dados do dashboard para filtro: ${filterType}`);
    showLoading(true, "Carregando dashboard...");
    const refreshButton = document.getElementById('refresh-dashboard');

    const dateRange = calculateDateRange(filterType);
    
    fetchDashboardData(dateRange.startDate, dateRange.endDate)
      .then(response => { // 'response' é o objeto JSON da API
        console.log("Resposta API (filtrada):", JSON.stringify(response, null, 2));
        if (response && response.success === true) {
          dashboardData = response; // Armazena toda a resposta da API
          lastLoadTime = currentTime;
          // currentFilter já foi atualizado por activateFilter ANTES de chamar loadDashboardData
          renderDashboard(dashboardData);
        } else {
          console.error("Erro retornado pela API (filtrada) ou resposta não sucedida:", response);
          showLoadingError("Erro ao carregar dados: " + (response?.message || "Resposta inválida da API"));
          renderDashboard(createEmptyDashboardResponse(response?.message || "Erro ao obter dados da API"));
        }
      })
      .catch(error => { // Este catch pode ser redundante se fetchDashboardData já tratar e retornar um objeto de erro.
        console.error("Falha crítica na requisição API (filtrada):", error);
        showLoadingError(`Falha na comunicação com a API: ${error.message}.`);
        renderDashboard(createEmptyDashboardResponse(error.message));
      })
      .finally(() => {
        if (refreshButton) refreshButton.classList.remove('rotating');
        showLoading(false);
      });
  }

  /** Função auxiliar para criar uma resposta vazia localmente */
  function createEmptyDashboardResponse(message = "Sem dados") {
      return { success: true, message: message, summary: { total: 0, pending: 0, completed: 0, critical: 0 }, maintenanceTypes: [], maintenanceStatuses: [], equipmentRanking: [], areaDistribution: [], problemCategories: [], monthlyTrend: [], criticalVsRegular: [], verificationResults: [], maintenanceFrequency: [], recentMaintenances: [] };
  }

  /** Renderiza o dashboard completo com os dados recebidos */
  function renderDashboard(data) {
    cleanupCharts();
    console.log("Renderizando dashboard com dados:", data);
    data = data || createEmptyDashboardResponse("Dados nulos recebidos para renderização");

    try {
      checkAndCreateChartContainers();
      renderSummaryCards(data.summary || {});
      
      // A função renderCharts espera o objeto de dados completo.
      // O backend deve retornar os dados para os gráficos nas chaves que renderCharts espera
      // (ex: data.maintenanceStatuses, data.problemCategories, etc.)
      renderCharts(data); 

      renderRecentMaintenances(data.equipmentRanking || [], 'equipment-ranking-tbody');
      renderRecentMaintenances(data.recentMaintenances || [], 'recent-maintenance-tbody');

      console.log("Dashboard renderizado com sucesso.");
    } catch (error) {
      console.error("Erro CRÍTICO ao renderizar dashboard:", error);
      showLoadingError("Erro ao exibir dados do dashboard: " + error.message);
    } finally {
       showLoading(false);
    }
  }

  /** Renderiza cartões de sumário */
  function renderSummaryCards(summary) {
    const cardValueMap = {
      'total': 'total-maintenance', 'pending': 'pending-verification',
      'completed': 'completed-verifications', 'critical': 'critical-maintenance'
    };
    Object.entries(cardValueMap).forEach(([summaryKey, elementId]) => {
      const valueElement = document.getElementById(elementId);
      if (valueElement) {
        valueElement.textContent = summary[summaryKey] ?? 0;
      } else {
        console.warn(`Elemento de valor #${elementId} não encontrado para o card ${summaryKey}.`);
      }
    });
  }

   /** Cria cards de sumário se necessário (chamado no initialize original, mas pode não ser mais preciso se o HTML for fixo) */
   function createSummaryCardsIfNeeded() {
       const dashboardContent = document.getElementById('tab-dashboard');
       if (!dashboardContent || dashboardContent.querySelector('.summary-cards')) return;
       console.log("Criando .summary-cards...");
       const cardsContainer = document.createElement('div');
       cardsContainer.className = 'summary-cards';
       const cards = [
         { valueId: 'total-maintenance', icon: 'fa-clipboard-list', label: 'Total Manutenções' },
         { valueId: 'pending-verification', icon: 'fa-clock', label: 'Aguardando Verificação' },
         { valueId: 'completed-verifications', icon: 'fa-check-circle', label: 'Concluídas/Verificadas' },
         { valueId: 'critical-maintenance', icon: 'fa-exclamation-triangle', label: 'Manutenções Críticas' }
       ];
       cards.forEach(card => {
           const cardElement = document.createElement('div');
           cardElement.className = 'card';
           cardElement.innerHTML = `
             <div class="card-title"><i class="icon fas ${card.icon}"></i> ${card.label}</div>
             <div class="card-value" id="${card.valueId}">0</div> <div class="card-footer"><span>...</span></div>`;
           cardsContainer.appendChild(cardElement);
       });
        const header = dashboardContent.querySelector('.dashboard-header');
        if (header) { header.parentNode.insertBefore(cardsContainer, header.nextSibling); }
        else { dashboardContent.prepend(cardsContainer); }
   }

  /** Chama as funções de renderização para todos os gráficos */
  function renderCharts(chartData) { // chartData aqui é o objeto 'data' completo da API
      console.log("Renderizando gráficos...");
      renderStatusChart(chartData.maintenanceStatuses || [], 'maintenance-status-chart');
      renderProblemCategoriesChart(chartData.problemCategories || [], 'problem-categories-chart');
      renderMonthlyTrendChart(chartData.monthlyTrend || [], 'monthly-trend-chart');
      renderAreaDistributionChart(chartData.areaDistribution || [], 'area-distribution-chart');
      renderCriticalVsRegularChart(chartData.criticalVsRegular || [], 'critical-vs-regular-chart');
      renderVerificationResultsChart(chartData.verificationResults || [], 'verification-results-chart');
      renderMaintenanceFrequencyChart('maintenance-frequency-chart', chartData.maintenanceFrequency || []);

      if(document.getElementById('maintenance-type-chart')) {
          renderMaintenanceTypeChart(chartData.maintenanceTypes || [], 'maintenance-type-chart');
      }
      console.log("Chamadas de renderização de gráficos concluídas.");
  }


  // ===========================================================
  // FUNÇÕES DE RENDERIZAÇÃO DE GRÁFICOS (Refatoradas para reutilização)
  // ===========================================================
  function renderGenericChart(chartId, chartType, chartData, options = {}, chartKey = null) {
      const canvas = document.getElementById(chartId);
      if (!canvas) { console.error(`Canvas #${chartId} não encontrado!`); return; }
      if (typeof Chart === 'undefined') { console.error(`Chart.js não carregado para ${chartId}!`); return; }

      const parent = canvas.parentElement;
      const noDataMessage = parent?.querySelector('.no-data-message');
      if (noDataMessage) {
        parent.innerHTML = ''; 
        const newCanvas = document.createElement('canvas');
        newCanvas.id = chartId;
        newCanvas.style.height = canvas.style.height || '200px';
        newCanvas.style.width = canvas.style.width || '100%';
        parent.appendChild(newCanvas);
        canvas = newCanvas;
        console.log(`Canvas #${chartId} recriado após remover mensagem 'sem dados'.`);
      }

      const isValidData = chartData && Array.isArray(chartData) && chartData.length > 0 && chartData.some(item => (item.count || 0) > 0);
      
      if (!isValidData && chartId !== 'maintenance-frequency-chart') { // Frequency chart tem seu próprio handler de no-data
        console.warn(`Dados inválidos/vazios para ${chartId}. Exibindo placeholder.`);
        const ctx = canvas.getContext('2d');
        canvas.height = 150; 
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#6c757d';
        ctx.textAlign = 'center';
        ctx.font = '14px Arial';
        ctx.fillText('Sem dados para exibir', canvas.width / 2, canvas.height / 2);
         const instanceKey = chartKey || chartId;
         if (chartInstances[instanceKey]) {
             try { chartInstances[instanceKey].destroy(); } catch(e){}
             delete chartInstances[instanceKey];
         }
        return;
      }
      const dataToRender = chartData;

      try {
          const instanceKey = chartKey || chartId;
          if (chartInstances[instanceKey]) chartInstances[instanceKey].destroy();

          const labels = dataToRender.map(item => item.label || 'N/A');
          const counts = dataToRender.map(item => item.count || 0);
          let colors = generateColorPalette(labels.length);

          if (chartId === 'maintenance-status-chart') colors = labels.map(l => getStatusColor(l));
          else if (chartId === 'critical-vs-regular-chart') colors = labels.map(l => l === 'Críticas' ? '#FF5630' : '#36B37E');
          else if (chartId === 'verification-results-chart') colors = labels.map(l => getStatusColor(l));

          const defaultOptions = {
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: true }, tooltip: { enabled: true } }
          };
          if (chartType === 'doughnut' || chartType === 'pie') {
             defaultOptions.plugins.legend.position = 'right';
             if(labels.length > 10) defaultOptions.plugins.legend.display = false;
          }
          if (chartType === 'bar') {
             defaultOptions.plugins.legend.display = false;
             defaultOptions.scales = { y: { beginAtZero: true, ticks: { precision: 0 } } };
             if (options?.indexAxis === 'y') {
                 defaultOptions.scales = { x: { beginAtZero: true, ticks: { precision: 0 } } };
                 delete defaultOptions.scales.y;
             }
          }
          if (chartType === 'line') {
              defaultOptions.plugins.legend.display = false;
              defaultOptions.scales = { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } };
              defaultOptions.elements = { line: { tension: 0.1, fill: true }, point: { radius: 3 } };
          }
          const mergedOptions = deepMerge(defaultOptions, options);

          chartInstances[instanceKey] = new Chart(canvas.getContext('2d'), {
              type: chartType,
              data: { labels, datasets: [{ data: counts, backgroundColor: colors, borderWidth: (chartType === 'pie' || chartType === 'doughnut') ? 0 : 1 }] },
              options: mergedOptions
          });
          console.log(`${chartId} (${chartType}) renderizado.`);
      } catch (error) { console.error(`Erro ao renderizar ${chartId}:`, error); }
  }

  function renderStatusChart(data, chartId) { renderGenericChart(chartId, 'doughnut', data, { cutout: '65%', plugins: { legend: { position: 'right' } } }, 'statusChart'); }
  function renderProblemCategoriesChart(data, chartId) { renderGenericChart(chartId, 'bar', data, { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { ticks: { autoSkip: data.length > 10 } } } }, 'categoryChart'); }
  function renderMaintenanceTypeChart(data, chartId) { renderGenericChart(chartId, 'bar', data, { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 } } } }, 'maintenanceTypeChart'); }
  
  function renderMonthlyTrendChart(data, chartId) {
      const options = {
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } },
          elements: { line: { tension: 0.1, fill: true }, point: { radius: data.some(d=>(d.count||0)>0) ? 3 : 0 } }
      };
      const dataForChart = data.map(item => ({ label: item.label, count: item.count }));

       const canvas = document.getElementById(chartId);
       if (!canvas || typeof Chart === 'undefined') return;
       const parent = canvas.parentElement;
       const noDataMessage = parent?.querySelector('.no-data-message');
       if (noDataMessage) {
           parent.innerHTML = '';
           const newCanvas = document.createElement('canvas');
           newCanvas.id = chartId; newCanvas.style.height = canvas.style.height || '200px';
           parent.appendChild(newCanvas);
           canvas = newCanvas;
       }

       const isValidData = data && Array.isArray(data) && data.length > 0 && data.some(item => (item.count || 0) > 0);
       const isPlaceholder = !isValidData;
       if (isPlaceholder) console.warn(`Dados de Tendência inválidos/vazios para ${chartId}.`);

       try {
           const instanceKey = 'trendChart';
           if (chartInstances[instanceKey]) chartInstances[instanceKey].destroy();
           const labels = dataForChart.map(item => item.label || '');
           const counts = dataForChart.map(item => item.count || 0);
           chartInstances[instanceKey] = new Chart(canvas.getContext('2d'), {
               type: 'line',
               data: { labels, datasets: [{ label: 'Manutenções', data: counts, borderColor: isPlaceholder ? '#cccccc' : '#3f51b5', backgroundColor: isPlaceholder ? 'transparent' : 'rgba(63, 81, 181, 0.1)', borderWidth: 2, pointRadius: isPlaceholder ? 0 : 3, fill: !isPlaceholder, tension: 0.1 }] },
               options: options
           });
           console.log(`${chartId} (line) renderizado.`);
       } catch (error) { console.error(`Erro ao renderizar ${chartId}:`, error); }
  }

  function renderAreaDistributionChart(data, chartId) { renderGenericChart(chartId, 'pie', data, { plugins: { legend: { position: 'right', display: data.length > 0 && data.length < 15 && !data.every(i=>(i.count||0)===0) } } }, 'areaChart'); }
  function renderCriticalVsRegularChart(data, chartId) { renderGenericChart(chartId, 'doughnut', data, { cutout: '60%', plugins: { legend: { position: 'bottom' } } }, 'criticalChart'); }
  function renderVerificationResultsChart(data, chartId) { renderGenericChart(chartId, 'bar', data, { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }, 'verificationChart'); }
  
  function renderMaintenanceFrequencyChart(containerId, data) {
    const canvas = document.getElementById(containerId);
    if (!canvas) { console.error(`Canvas #${containerId} não encontrado!`); return; }
    const parent = canvas.parentElement;
    if (!parent) { console.error(`Elemento pai do canvas #${containerId} não encontrado!`); return; }
  
    const instanceKey = 'frequencyChart';
    if (chartInstances[instanceKey]) {
      try { chartInstances[instanceKey].destroy(); } catch (e) { console.warn("Erro ao destruir gráfico anterior:", e); }
      delete chartInstances[instanceKey];
    }
    parent.innerHTML = '';
  
    let chartData = [];
    if (Array.isArray(data)) {
      chartData = data.filter(item => (item.count || 0) > 0);
    } else if (data && typeof data === 'object') {
      chartData = Object.entries(data).map(([key, value]) => ({ label: key, count: value })).filter(item => item.count > 0);
    }
  
    if (!chartData || chartData.length === 0) {
      console.warn(`Não há dados para o gráfico ${containerId}`);
      const noDataElement = document.createElement('div');
      noDataElement.className = 'no-data-message';
      noDataElement.style.cssText = `display:flex; flex-direction:column; align-items:center; justify-content:center; height:150px; background-color:#f8f9fa; border-radius:6px; padding:20px; text-align:center;`;
      noDataElement.innerHTML = `<i class="fas fa-info-circle" style="font-size:24px; color:var(--primary-color, #0052cc); margin-bottom:15px;"></i> <p style="margin:0; color:var(--text-light, #6c757d); font-size:14px;">Não há dados suficientes para calcular o intervalo entre manutenções.</p> <p style="margin:5px 0 0; color:var(--text-light, #6c757d); font-size:13px;">Registre mais manutenções para o mesmo equipamento para ver esta análise.</p>`;
      parent.appendChild(noDataElement);
      return;
    }
  
    const newCanvas = document.createElement('canvas');
    newCanvas.id = containerId; newCanvas.style.height = '200px';
    parent.appendChild(newCanvas);
    chartData.sort((a, b) => a.count - b.count);
  
    renderGenericChart(containerId, 'bar', chartData, {
      indexAxis: 'y', plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `Intervalo Médio: ${ctx.parsed.x} dias` } } },
      scales: { x: { beginAtZero: true, title: { display: true, text: 'Intervalo Médio (dias)'}, ticks: { precision: 0 } }, y: { ticks: { autoSkip: false } } }
    }, instanceKey);
  }

  // ===========================================================
  // FUNÇÃO PARA RENDERIZAR TABELAS (Ranking e Recentes)
  // ===========================================================
   function renderRecentMaintenances(items, tbodyId) {
       const tableBody = document.getElementById(tbodyId);
       if (!tableBody) { console.warn(`Tbody #${tbodyId} não encontrado!`); return; }
       tableBody.innerHTML = ''; 

       const thead = tableBody.previousElementSibling;
       const colspan = thead?.rows?.[0]?.cells?.length || 5;

       if (!items || items.length === 0) {
         tableBody.innerHTML = `<tr><td colspan="${colspan}" class="text-center" style="padding: 20px; color: #6c757d;">Nenhum dado encontrado para este período.</td></tr>`;
         return;
       }

       items.forEach(item => {
           const row = document.createElement('tr');
           row.dataset.id = item.id; // Adiciona ID ao TR para consistência com `e.currentTarget.closest('tr').dataset.id;`
           let html = '';
           if (tbodyId === 'equipment-ranking-tbody') {
               html = `<td>${item.identifier || item.id || '-'}</td> <td>${item.name || item.type || '-'}</td> <td>${item.maintenanceCount || 0}</td> <td>${formatDate(item.lastMaintenanceDate)}</td> <td><span class="status-badge status-${getStatusClass(item.status)}">${item.status || 'N/A'}</span></td>`;
           } else if (tbodyId === 'recent-maintenance-tbody') {
                html = `<td>${item.id || '-'}</td> <td>${item.placaOuId || '-'} (${item.tipoEquipamento || '-'})</td> <td>${item.tipoManutencao || '-'}</td> <td>${formatDate(item.dataRegistro)}</td> <td>${item.responsavel || '-'}</td> <td><span class="status-badge status-${getStatusClass(item.status)}">${item.status || 'N/A'}</span></td> <td><button class="btn-icon view-maintenance" data-id="${item.id}" title="Ver Detalhes">👁️</button></td>`;
           }
           row.innerHTML = html;
           tableBody.appendChild(row);
       });

        const listenerKey = tbodyId.replace(/-([a-z])/g, g => g[1].toUpperCase()) + 'ListenerSet';
        if (!tableBody.dataset[listenerKey]) {
           tableBody.addEventListener('click', handleTableActionClick); // Agora chama a handleTableActionClick atualizada
           tableBody.dataset[listenerKey] = 'true';
           console.log(`Listener de clique configurado para #${tbodyId} com chave dataset: ${listenerKey}`);
        }
   }

   /** Handler DELEGADO para cliques nos botões de ação das tabelas (ATUALIZADO) */
    function handleTableActionClick(e) {
        // O clique pode ser no ícone dentro do botão, então .closest() é importante.
        const button = e.target.closest('.view-maintenance'); // Foca no botão de visualização
        if (!button) return; // Se não for o botão de visualização, ignora por enquanto

        // A atualização original sugeria e.currentTarget.closest('tr').dataset.id;
        // Mas o data-id já está no botão, que é mais direto.
        const id = button.dataset.id; 
        if (!id) {
            // Fallback para pegar do TR se o botão não tiver o ID (mas deveria ter)
            const trId = e.target.closest('tr')?.dataset.id;
            if (!trId) {
                console.warn("Não foi possível obter o ID da manutenção para visualização.");
                return;
            }
            id = trId;
        }
        
        console.log(`Visualizar manutenção ID: ${id}`);
        
        // Lógica da atualização para chamar viewMaintenanceDetails ou o modal
        if (typeof window.viewMaintenanceDetails === 'function') {
            window.viewMaintenanceDetails(id);
        } else if (typeof viewMaintenanceDetails === 'function') { // Pouco provável de ser diferente de window.
            viewMaintenanceDetails(id);
        } else {
            console.log("Função viewMaintenanceDetails não encontrada globalmente, usando modal fallback.");
            showMaintenanceDetailsModal(id); // Fallback para o novo modal
        }
        // Se houver outros botões de ação (editar, excluir), adicionar lógica aqui com `else if (e.target.closest('.edit-maintenance'))` etc.
    }

  // ==================================================================
  // NOVAS FUNÇÕES PARA MODAL DE DETALHES DA MANUTENÇÃO (DA ATUALIZAÇÃO)
  // ==================================================================

  /** Exibe um modal com os detalhes da manutenção (fallback) */
  function showMaintenanceDetailsModal(id) {
    fetchMaintenanceDetails(id) // Nova função para buscar detalhes específicos
        .then(data => {
            if (data && data.success && data.details) { // Assumindo que a API retorna { success: true, details: {...} }
                const modalContent = createMaintenanceDetailsContent(data.details);
                // showModal é uma função global/utilitária esperada (ex: Utilities.showModal)
                if (typeof Utilities !== 'undefined' && Utilities.showModal) {
                    Utilities.showModal(`Detalhes da Manutenção ${id}`, modalContent, null, { large: true });
                } else if (typeof showModal === 'function') {
                    showModal(`Detalhes da Manutenção ${id}`, modalContent);
                } else {
                    console.error("Função showModal não encontrada para exibir detalhes.");
                    alert("Detalhes:\n" + JSON.stringify(data.details, null, 2)); // Fallback muito simples
                }
            } else {
                console.error("Erro ao buscar detalhes ou dados inválidos:", data);
                showNotification(data?.message || "Não foi possível obter os detalhes da manutenção.", "error");
            }
        })
        .catch(error => {
            console.error("Erro na promessa ao buscar detalhes:", error);
            showNotification("Erro crítico ao buscar detalhes da manutenção.", "error");
        });
  }

  /** Cria o conteúdo HTML para o modal de detalhes da manutenção */
  function createMaintenanceDetailsContent(maintenance) {
    const content = document.createElement('div');
    content.className = 'maintenance-details-modal-content'; // Classe para estilização
    // Estilos básicos inline para o modal (idealmente, isso estaria no CSS)
    content.style.cssText = `
        font-size: 0.9rem;
        line-height: 1.6;
    `;
    
    content.innerHTML = `
        <style>
            .maintenance-details-modal-content .detail-row { margin-bottom: 8px; display: flex; }
            .maintenance-details-modal-content .detail-label { font-weight: bold; min-width: 120px; color: #333; }
            .maintenance-details-modal-content .detail-value { color: #555; }
            .maintenance-details-modal-content .status-badge-modal { padding: 3px 8px; border-radius: 4px; color: white; font-size: 0.85em; }
            /* Cores de status para o modal (exemplo, alinhar com getStatusClass) */
            .status-badge-modal.status-pending { background-color: #FFAB00; }
            .status-badge-modal.status-verified { background-color: #0052CC; }
            .status-badge-modal.status-completed { background-color: #36B37E; }
            .status-badge-modal.status-adjusting { background-color: #FFC400; }
            .status-badge-modal.status-rejected { background-color: #FF5630; }
            .status-badge-modal.status-critical { background-color: #BF2600; }
            .status-badge-modal.status-default { background-color: #6c757d; }
        </style>
        <div class="detail-row">
            <span class="detail-label">ID:</span>
            <span class="detail-value">${maintenance.id || '-'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Equipamento:</span>
            <span class="detail-value">${maintenance.equipment_identifier || maintenance.equipment || '-'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Tipo Manut.:</span>
            <span class="detail-value">${maintenance.maintenance_type || maintenance.type || '-'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Responsável:</span>
            <span class="detail-value">${maintenance.responsible_name || maintenance.responsible || '-'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Data Agendada:</span>
            <span class="detail-value">${maintenance.scheduled_date ? formatDate(maintenance.scheduled_date) : '-'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Data Conclusão:</span>
            <span class="detail-value">${maintenance.completion_date ? formatDate(maintenance.completion_date) : '-'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value">
                <span class="status-badge-modal status-${getStatusClass(maintenance.status)}">
                    ${maintenance.status || '-'}
                </span>
            </span>
        </div>
        <div class="detail-row" style="flex-direction: column;">
            <span class="detail-label" style="margin-bottom: 4px;">Descrição:</span>
            <span class="detail-value" style="white-space: pre-wrap; background: #f9f9f9; padding: 5px; border-radius:3px;">${maintenance.description || '-'}</span>
        </div>
        ${maintenance.notes ? `
        <div class="detail-row" style="flex-direction: column; margin-top: 10px;">
            <span class="detail-label" style="margin-bottom: 4px;">Observações da Verificação:</span>
            <span class="detail-value" style="white-space: pre-wrap; background: #f9f9f9; padding: 5px; border-radius:3px;">${maintenance.notes}</span>
        </div>` : ''}
    `;
    // Adaptei os nomes dos campos (ex: maintenance.equipment_identifier) para um formato mais comum de API.
    // Ajuste conforme a sua API de detalhes retorna.
    return content;
  }

  /** Função para buscar detalhes de uma manutenção específica via API */
  function fetchMaintenanceDetails(id) {
    // API_URL deve estar definida globalmente ou ser acessível
    if (typeof API_URL === 'undefined') {
        console.error("API_URL não está definida. Não é possível buscar detalhes da manutenção.");
        return Promise.resolve({ success: false, message: "API_URL não configurada." });
    }

    const url = `${API_URL}?action=getMaintenanceDetails&id=${id}`;
    console.log("Buscando detalhes da manutenção da API:", url);

    return fetch(url)
        .then(response => {
            if (!response.ok) {
                // Tenta pegar uma mensagem de erro do corpo da resposta
                return response.text().then(text => {
                    try {
                        const errData = JSON.parse(text);
                        throw new Error(errData.message || `Erro HTTP: ${response.status}`);
                    } catch (e) { // Se não for JSON
                        throw new Error(text || `Erro HTTP: ${response.status}`);
                    }
                });
            }
            return response.json(); // Espera-se { success: true, details: { ... } }
        })
        .catch(error => {
            console.error('Erro em fetchMaintenanceDetails:', error);
            return { success: false, message: error.message || "Erro ao buscar detalhes da manutenção via API." };
        });
  }


  // ===========================================================
  // FUNÇÕES UTILITÁRIAS INTERNAS E GLOBAIS
  // ===========================================================
  function generateColorPalette(count) { /* ... (código original mantido) ... */ const baseColors = ['#0052CC', '#36B37E', '#FFAB00', '#6554C0', '#FF5630', '#00B8D9', '#FFC400', '#4C9AFF', '#79F2C0', '#FF8B00']; if (count <= baseColors.length) return baseColors.slice(0, count); const colors = [...baseColors]; const step = 360 / (count - baseColors.length); const baseHue = 200; for (let i = 0; i < count - baseColors.length; i++) { colors.push(`hsl(${(baseHue + i * step) % 360}, 75%, 55%)`); } return colors; }
  function getStatusClass(status) { /* ... (código original mantido) ... */ if (!status) return 'default'; const s = String(status).toLowerCase(); if (s.includes('pendente') || s.includes('aguardando')) return 'pending'; if (s.includes('verificado') || s.includes('aprovado')) return 'verified'; if (s.includes('concluído') || s.includes('concluido')) return 'completed'; if (s.includes('ajustes') || s.includes('andamento')) return 'adjusting'; if (s.includes('reprovado') || s.includes('rejeitado')) return 'rejected'; if (s.includes('crítico') || s.includes('critico')) return 'critical'; if (s.includes('info') || s.includes('ok')) return 'info'; return 'default'; }
  function getStatusColor(status) { /* ... (código original mantido) ... */ if (!status) return '#adb5bd'; const s = String(status).toLowerCase(); if (s.includes('pendente') || s.includes('aguardando')) return '#FFAB00'; if (s.includes('verificado') || s.includes('aprovado')) return '#0052CC'; if (s.includes('concluído') || s.includes('concluido')) return '#36B37E'; if (s.includes('ajustes')) return '#FFC400'; if (s.includes('reprovado') || s.includes('rejeitado')) return '#FF5630'; if (s.includes('crítico') || s.includes('critico')) return '#BF2600'; return '#6c757d'; }
  
  /** Formata uma data (DD/MM/YYYY) - Função original mantida para exibição */
  function formatDate(dateInput) {
    if (!dateInput) return '-';
    if (typeof Utilities !== 'undefined' && Utilities.formatDate) {
        try { return Utilities.formatDate(dateInput); } catch (e) { console.warn("Erro ao usar Utilities.formatDate, usando fallback:", e); }
    }
    try {
      let date;
      if (typeof dateInput === 'string' && dateInput.includes('T')) { date = new Date(dateInput.split('T')[0] + 'T00:00:00'); } 
      else { date = new Date(dateInput); }
      if (isNaN(date.getTime())) { if (typeof dateInput === 'string') return dateInput.split('T')[0]; return String(dateInput); }
      date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      if (year < 1900 || year > 3000) return '-';
      return `${day}/${month}/${year}`;
    } catch(e) { console.error("Erro ao formatar data (fallback):", e, "Input:", dateInput); return String(dateInput); }
  }

  function showLoading(show, message = 'Carregando...') { /* ... (código original mantido) ... */ if (typeof Utilities !== 'undefined' && Utilities.showLoading) { try { Utilities.showLoading(show, message); return; } catch (e) {} } const loader = document.getElementById('global-loader'); if (loader) { loader.style.display = show ? 'flex' : 'none'; const msgEl = document.getElementById('global-loader-message'); if (msgEl) msgEl.textContent = message; } else if (show) { console.warn("Loader global não encontrado"); } }
  function showLoadingError(message) { /* ... (código original mantido) ... */ if (typeof Utilities !== 'undefined' && Utilities.showNotification) { try { Utilities.showNotification(message, 'error', 8000); return; } catch(e) {} } console.error("Dashboard Error:", message); }
  
  function checkAndCreateChartContainers() { /* ... (código original mantido) ... */ const requiredCanvasIds = [ 'maintenance-status-chart', 'problem-categories-chart', 'monthly-trend-chart', 'area-distribution-chart', 'critical-vs-regular-chart', 'verification-results-chart', 'maintenance-frequency-chart' ]; let dashboardGrid = document.querySelector('#tab-dashboard .dashboard-grid'); if (!dashboardGrid) { console.log("Container .dashboard-grid não encontrado. Criando..."); dashboardGrid = document.createElement('div'); dashboardGrid.className = 'dashboard-grid'; dashboardGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin: 1.5rem 0;'; const dashboardTab = document.getElementById('tab-dashboard'); if (dashboardTab) { const summaryCards = dashboardTab.querySelector('.summary-cards'); if (summaryCards) { summaryCards.after(dashboardGrid); } else { dashboardTab.appendChild(dashboardGrid); } } else { console.error("Elemento #tab-dashboard também não encontrado. Não é possível criar container de gráficos."); return; } } requiredCanvasIds.forEach(id => { if (!document.getElementById(id)) { console.log(`Canvas #${id} não encontrado. Criando...`); const chartContainer = document.createElement('div'); chartContainer.className = 'chart-container'; chartContainer.style.cssText = 'position: relative; min-height: 250px; width: 100%; margin-bottom: 1rem;'; const canvas = document.createElement('canvas'); canvas.id = id; canvas.style.height = '200px'; chartContainer.appendChild(canvas); dashboardGrid.appendChild(chartContainer); } }); }
  function deepMerge(target, source) { /* ... (código original mantido) ... */ const output = Object.assign({}, target); if (isObject(target) && isObject(source)) { Object.keys(source).forEach(key => { if (isObject(source[key])) { if (!(key in target)) Object.assign(output, { [key]: source[key] }); else output[key] = deepMerge(target[key], source[key]); } else { Object.assign(output, { [key]: source[key] }); } }); } return output; }
  function isObject(item) { /* ... (código original mantido) ... */ return (item && typeof item === 'object' && !Array.isArray(item)); }

  // API pública do módulo
  return { initialize };
})();

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', function() {
  // Assume-se que API_URL está definida globalmente antes deste script, ex:
  // <script> const API_URL = "/api/seu_endpoint.php"; </script>
  // Ou definida em api.js se este for carregado antes.
  if (typeof API_URL === 'undefined') {
      console.warn("AVISO: A constante global API_URL não está definida. As chamadas de API para filtros e detalhes de manutenção podem falhar.");
      // Poderia até mesmo definir um valor padrão se apropriado, mas é melhor que seja explícito.
      // window.API_URL = "/api/default_api_endpoint.php"; // Exemplo de fallback
  }

  if (typeof Chart === 'undefined') {
     console.error("FATAL: Chart.js não foi carregado. Os gráficos do Dashboard não funcionarão.");
     const dashboardTab = document.getElementById('tab-dashboard');
     if(dashboardTab) dashboardTab.innerHTML = '<div class="alert alert-danger">Erro Crítico: Biblioteca de gráficos (Chart.js) não carregada. O Dashboard não pode ser exibido.</div>';
  } else if (typeof Utilities === 'undefined') {
      console.error("FATAL: utilities.js não foi carregado. Funções essenciais do Dashboard podem falhar.");
      const dashboardTab = document.getElementById('tab-dashboard');
      if(dashboardTab) dashboardTab.innerHTML = '<div class="alert alert-danger">Erro Crítico: Biblioteca de utilidades (utilities.js) não carregada. O Dashboard pode não funcionar corretamente.</div>';
  }
  else if (typeof Dashboard !== 'undefined' && Dashboard.initialize) {
     console.log("DOM carregado, inicializando Dashboard...");
     setTimeout(Dashboard.initialize, 150);
  } else {
     console.error("Módulo Dashboard ou Dashboard.initialize não encontrado!");
      const dashboardTab = document.getElementById('tab-dashboard');
      if(dashboardTab) dashboardTab.innerHTML = '<div class="alert alert-danger">Erro Crítico: Script do Dashboard (dashboard.js) não carregado ou inválido.</div>';
  }
});
