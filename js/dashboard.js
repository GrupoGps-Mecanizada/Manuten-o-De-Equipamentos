/**
 * Sistema de Dupla Checagem de Manutenção
 * Módulo: Dashboard (Versão FINAL Frontend - Atualizado com filtros e modal de detalhes globais)
 */

const Dashboard = (function() {
  // Armazenar dados do dashboard
  let dashboardData = null;
  let chartInstances = {}; // Armazena instâncias dos gráficos para destruí-las
  let lastLoadTime = 0;
  const REFRESH_INTERVAL = 300000; // 5 minutos
  let dashboardInitialized = false;

  // Substitua as constantes FILTER_TYPES existentes por:
  const FILTER_TYPES = {
      CURRENT_MONTH: 'current-month',
      LAST_MONTH: 'last-month',
      LAST_3_MONTHS: 'last-3-months',
      LAST_6_MONTHS: 'last-6-months',
      CURRENT_YEAR: 'current-year',
      ALL: 'all'
  };

  // Estado inicial do filtro
  let currentFilter = FILTER_TYPES.CURRENT_MONTH;

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

  // Substitua ou modifique a função initialize atual
  function initialize() {
      if (dashboardInitialized) {
          return;
      }
      console.log("Dashboard.initialize() chamado");

      if (!document.getElementById('tab-dashboard')) {
          console.error("Elemento #tab-dashboard não encontrado. A inicialização do Dashboard não pode continuar.");
          return;
      }

      // Usar a nova função setupFilters em vez das funções antigas
      createPeriodButtonsIfNeeded(); // Garante que os botões de filtro/período existam
      setupFilters();                // Configura os filtros e carrega dados iniciais
      setupRefreshButton();          // Configura o botão de refresh
      setupTabNavigation();          // Monitora a navegação por hash

      // checkIfDashboard agora é mais para sincronizar com a aba ativa/hash e pode não precisar
      // forçar o carregamento se setupFilters já o fez. A lógica de lastLoadTime deve cobrir isso.
      const isActive = document.getElementById('tab-dashboard').classList.contains('active');
      const hash = window.location.hash || '#dashboard';
      if (isActive || hash === '#dashboard') {
         // setupFilters já chama loadDashboardData, então checkIfDashboard aqui
         // só precisa garantir que o estado da aba está correto, e não necessariamente recarregar.
         // Passar false para não forçar recarga se já carregado.
         checkIfDashboard(false);
      }

      dashboardInitialized = true;
      console.log("Dashboard inicializado com sucesso.");
  }


  /** Cria botões de período (que agora funcionam como botões de filtro) se eles não existirem no DOM */
  function createPeriodButtonsIfNeeded() {
    const dashboardHeader = document.querySelector('#tab-dashboard .dashboard-header');
    if (!dashboardHeader || dashboardHeader.querySelector('.dashboard-controls .period-buttons')) return;

    console.log("Criando controles do Dashboard (botões de filtro/refresh)...");

    let controlsContainer = dashboardHeader.querySelector('.dashboard-controls');
    if (!controlsContainer) {
        controlsContainer = document.createElement('div');
        controlsContainer.className = 'dashboard-controls';
        dashboardHeader.appendChild(controlsContainer);
    }
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'period-buttons';
    // Usa os valores de FILTER_TYPES para criar os botões
    const periods = [
      { id: FILTER_TYPES.CURRENT_MONTH, label: 'Mês Atual' }, { id: FILTER_TYPES.LAST_MONTH, label: 'Mês Anterior' },
      { id: FILTER_TYPES.LAST_3_MONTHS, label: 'Últimos 3m' }, { id: FILTER_TYPES.LAST_6_MONTHS, label: 'Últimos 6m' },
      { id: FILTER_TYPES.CURRENT_YEAR, label: 'Este Ano' }, { id: FILTER_TYPES.ALL, label: 'Todos' }
    ];
    
    periods.forEach(period => {
      const button = document.createElement('button');
      button.className = 'period-btn';
      button.setAttribute('data-filter', period.id);
      button.textContent = period.label;
      // O filtro ativo será definido por setupFilters -> activateFilter
      buttonContainer.appendChild(button);
    });
    controlsContainer.prepend(buttonContainer);

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

  // Função para inicializar os filtros (use esta função em vez de initializeFilters ou createFilterDropdown)
  function setupFilters() {
      console.log("Configurando sistema de filtros do dashboard...");
      
      // Garantir que apenas existe um conjunto de botões de filtro
      const filterButtons = document.querySelectorAll('.period-btn');
      if (filterButtons.length === 0) {
          console.error("Botões de filtro não encontrados! Verifique o HTML.");
          return;
      }
      
      // Remover listeners anteriores para evitar duplicação e adicionar o novo
      filterButtons.forEach(button => {
          button.removeEventListener('click', handleFilterClick); // Remove listener específico
          button.addEventListener('click', handleFilterClick);
      });
      
      // Aplicar visual correto ao filtro ativo (currentFilter é o padrão no início)
      activateFilter(currentFilter);
      
      // Iniciar carregamento de dados com o filtro atual
      // A flag 'true' força o carregamento, mesmo que os dados existam,
      // útil para a carga inicial ou se a lógica de `lastLoadTime` não for suficiente.
      loadDashboardData(currentFilter, true); 
      
      console.log("Sistema de filtros configurado com sucesso.");
  }

  // Substitua a função handleFilterClick existente
  function handleFilterClick(e) {
      // O target do evento é o próprio botão, já que o listener é nele
      if (!e.target.classList.contains('period-btn')) return; // Segurança extra
      
      const filterType = e.target.dataset.filter;
      // Se não há tipo de filtro ou é o mesmo que já está ativo, não faz nada.
      // Para recarregar o mesmo filtro, o usuário deve usar o botão de refresh.
      if (!filterType || filterType === currentFilter) return;
      
      console.log(`Filtro alterado para: ${filterType}`);
      activateFilter(filterType);
      loadDashboardData(filterType, true); // Força o recarregamento com o novo filtro
  }

  // Substitua a função activateFilter existente
  function activateFilter(filterType) {
      if (!filterType) return;
      
      currentFilter = filterType; // Atualiza o estado do filtro atual
      document.querySelectorAll('.period-btn').forEach(button => {
          button.classList.remove('active');
      });
      
      const activeButton = document.querySelector(`.period-btn[data-filter="${filterType}"]`);
      if (activeButton) {
          activeButton.classList.add('active');
      } else {
          console.warn(`Botão para o filtro "${filterType}" não encontrado.`);
          // Se o botão não for encontrado, talvez ativar o primeiro como fallback ou logar erro
          // Por ora, apenas loga um aviso.
      }
  }

  /** Configura o listener do botão de refresh via delegação */
  function setupRefreshButton() {
    const controlsContainer = document.querySelector('#tab-dashboard .dashboard-controls');
     if (!controlsContainer) {
       console.warn("Container de controles não encontrado para listener do refresh.");
       return;
     }
    // Listener delegado ao container de controles
    controlsContainer.removeEventListener('click', handleRefreshButtonClick);
    controlsContainer.addEventListener('click', handleRefreshButtonClick);
    console.log("Listener do botão Refresh configurado via delegação.");
  }

  /** Handler para clique no botão refresh (delegação) */
  function handleRefreshButtonClick(event) {
     const targetButton = event.target.closest('#refresh-dashboard');
     if (!targetButton) return;

     console.log("Atualização manual do dashboard solicitada via botão refresh");
     console.log("Atualizando com filtro pré-definido:", currentFilter);
     loadDashboardData(currentFilter, true); 

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

   /** Verifica se a aba Dashboard está ativa e carrega/atualiza dados se necessário */
   function checkIfDashboard(isInitialLoadDueToHash = false) {
     const hash = window.location.hash || '#dashboard';
     const dashboardTabElement = document.getElementById('tab-dashboard');

     if (hash === '#dashboard' && dashboardTabElement) {
        const isActive = dashboardTabElement.classList.contains('active');
        if (isActive) {
           console.log("Verificando aba Dashboard (ativa)...");
           const currentTime = Date.now();
           // Se for uma carga inicial devido ao hash (ex: refresh da página na aba) E os dados já foram
           // carregados por setupFilters (lastLoadTime > 0 e recente), não precisa recarregar.
           const dataJustLoadedBySetup = lastLoadTime > 0 && (currentTime - lastLoadTime < 1000); // Pequena margem

           const needsLoad = (isInitialLoadDueToHash && !dataJustLoadedBySetup) || // Carga inicial se não acabou de carregar
                             !dashboardData || // Sem dados
                             (currentTime - lastLoadTime > REFRESH_INTERVAL); // Intervalo de refresh passou

           if (needsLoad) {
             console.log(`Carregando dados em checkIfDashboard (${isInitialLoadDueToHash ? 'hash inicial' : (!dashboardData ? 'sem dados' : 'refresh interval')}) para filtro: ${currentFilter}`);
             // A flag 'true' para force em loadDashboardData será baseada em 'needsLoad' implicando uma necessidade.
             loadDashboardData(currentFilter, true);
           } else {
             console.log("Dashboard ativo, usando dados existentes ou recém-carregados por setupFilters.");
           }
        }
     }
   }


  /** Função para calcular intervalo de datas com base no filtro */
  function calculateDateRange(filterType) {
    const now = new Date();
    let startDate;
    let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    switch (filterType) {
        case FILTER_TYPES.CURRENT_MONTH:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case FILTER_TYPES.LAST_MONTH:
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            break;
        case FILTER_TYPES.LAST_3_MONTHS:
            startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1); // Mês atual (M) - 2 = M-2. Ex: Maio(4) - 2 = Março(2). Mês 2, 3, 4.
            break;
        case FILTER_TYPES.LAST_6_MONTHS:
            startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1); // Mês atual (M) - 5 = M-5.
            break;
        case FILTER_TYPES.CURRENT_YEAR:
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        case FILTER_TYPES.ALL:
        default:
            startDate = new Date(2000, 0, 1);
            break;
    }
    if (startDate) {
        startDate.setHours(0, 0, 0, 0);
    }
    return { startDate, endDate };
  }

  /** Função auxiliar para formatar data como yyyy-mm-dd para a API */
  function formatDateForAPI(date) {
    if (!date || !(date instanceof Date) || isNaN(date)) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /** Função para buscar dados do dashboard da API com base no intervalo de datas */
  function fetchDashboardData(startDate, endDate) {
    const formattedStartDate = formatDateForAPI(startDate);
    const formattedEndDate = formatDateForAPI(endDate);
    
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
                return response.text().then(text => {
                    try { const errData = JSON.parse(text); throw new Error(errData.message || `Erro HTTP: ${response.status}`); }
                    catch (e) { throw new Error(text || `Erro HTTP: ${response.status}`); }
                });
            }
            return response.json();
        })
        .catch(error => {
            console.error('Erro em fetchDashboardData:', error);
            return { success: false, message: error.message || "Erro ao buscar dados do dashboard via API." };
        });
  }

  /** Carrega dados do dashboard via API */
  function loadDashboardData(filterType = currentFilter, force = false) {
    const currentTime = Date.now();
    if (!force && dashboardData && (currentTime - lastLoadTime < REFRESH_INTERVAL) && filterType === currentFilter) {
      console.log("Dados recentes para o filtro atual, pulando carregamento.");
      return;
    }

    console.log(`Carregando dados do dashboard para filtro: ${filterType}`);
    showLoading(true, "Carregando dashboard...");
    const refreshButton = document.getElementById('refresh-dashboard');

    const dateRange = calculateDateRange(filterType);
    
    fetchDashboardData(dateRange.startDate, dateRange.endDate)
      .then(response => {
        console.log("Resposta API (filtrada):", JSON.stringify(response, null, 2));
        if (response && response.success === true) {
          dashboardData = response;
          lastLoadTime = currentTime;
          renderDashboard(dashboardData);
        } else {
          console.error("Erro retornado pela API (filtrada) ou resposta não sucedida:", response);
          showLoadingError("Erro ao carregar dados: " + (response?.message || "Resposta inválida da API"));
          renderDashboard(createEmptyDashboardResponse(response?.message || "Erro ao obter dados da API"));
        }
      })
      .catch(error => {
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
  function renderCharts(chartData) {
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
      }

      const isValidData = chartData && Array.isArray(chartData) && chartData.length > 0 && chartData.some(item => (item.count || 0) > 0);
      
      if (!isValidData && chartId !== 'maintenance-frequency-chart') {
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
          // Usa a getStatusColor global agora
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
      // Usa a getStatusClass global
      scales: { x: { beginAtZero: true, title: { display: true, text: 'Intervalo Médio (dias)'}, ticks: { precision: 0 } }, y: { ticks: { autoSkip: false } } }
    }, instanceKey);
  }

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
           row.dataset.id = item.id;
           let html = '';
           // Usar as funções globais formatDate e getStatusClass
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
           tableBody.addEventListener('click', handleTableActionClick);
           tableBody.dataset[listenerKey] = 'true';
        }
   }

   /** Handler DELEGADO para cliques nos botões de ação das tabelas (SIMPLIFICADO) */
    function handleTableActionClick(e) {
        const button = e.target.closest('.view-maintenance');
        if (!button) return;

        const id = button.dataset.id || e.target.closest('tr')?.dataset.id;
        if (!id) {
            console.warn("Não foi possível obter o ID da manutenção para visualização.");
            return;
        }
        
        console.log(`Chamando window.viewMaintenanceDetails para ID: ${id}`);
        // Chama a função global diretamente.
        // O fallback para showMaintenanceDetailsModal interno foi removido, pois
        // window.viewMaintenanceDetails agora gerencia isso.
        if (typeof window.viewMaintenanceDetails === 'function') {
            window.viewMaintenanceDetails(id);
        } else {
            console.error("Função global 'window.viewMaintenanceDetails' não encontrada.");
            alert(`Erro: Função de visualização de detalhes (ID: ${id}) não está disponível.`);
        }
    }

  function generateColorPalette(count) { const baseColors = ['#0052CC', '#36B37E', '#FFAB00', '#6554C0', '#FF5630', '#00B8D9', '#FFC400', '#4C9AFF', '#79F2C0', '#FF8B00']; if (count <= baseColors.length) return baseColors.slice(0, count); const colors = [...baseColors]; const step = 360 / (count - baseColors.length); const baseHue = 200; for (let i = 0; i < count - baseColors.length; i++) { colors.push(`hsl(${(baseHue + i * step) % 360}, 75%, 55%)`); } return colors; }
  // getStatusClass e formatDate foram movidas para o escopo global
  
  function showLoading(show, message = 'Carregando...') { if (typeof Utilities !== 'undefined' && Utilities.showLoading) { try { Utilities.showLoading(show, message); return; } catch (e) {} } const loader = document.getElementById('global-loader'); if (loader) { loader.style.display = show ? 'flex' : 'none'; const msgEl = document.getElementById('global-loader-message'); if (msgEl) msgEl.textContent = message; } else if (show) { console.warn("Loader global não encontrado"); } }
  function showLoadingError(message) { if (typeof Utilities !== 'undefined' && Utilities.showNotification) { try { Utilities.showNotification(message, 'error', 8000); return; } catch(e) {} } console.error("Dashboard Error:", message); }
  
  function checkAndCreateChartContainers() { const requiredCanvasIds = [ 'maintenance-status-chart', 'problem-categories-chart', 'monthly-trend-chart', 'area-distribution-chart', 'critical-vs-regular-chart', 'verification-results-chart', 'maintenance-frequency-chart' ]; let dashboardGrid = document.querySelector('#tab-dashboard .dashboard-grid'); if (!dashboardGrid) { dashboardGrid = document.createElement('div'); dashboardGrid.className = 'dashboard-grid'; dashboardGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin: 1.5rem 0;'; const dashboardTab = document.getElementById('tab-dashboard'); if (dashboardTab) { const summaryCards = dashboardTab.querySelector('.summary-cards'); if (summaryCards) { summaryCards.after(dashboardGrid); } else { dashboardTab.appendChild(dashboardGrid); } } else { console.error("Elemento #tab-dashboard também não encontrado."); return; } } requiredCanvasIds.forEach(id => { if (!document.getElementById(id)) { const chartContainer = document.createElement('div'); chartContainer.className = 'chart-container'; chartContainer.style.cssText = 'position: relative; min-height: 250px; width: 100%; margin-bottom: 1rem;'; const canvas = document.createElement('canvas'); canvas.id = id; canvas.style.height = '200px'; chartContainer.appendChild(canvas); dashboardGrid.appendChild(chartContainer); } }); }
  function deepMerge(target, source) { const output = Object.assign({}, target); if (isObject(target) && isObject(source)) { Object.keys(source).forEach(key => { if (isObject(source[key])) { if (!(key in target)) Object.assign(output, { [key]: source[key] }); else output[key] = deepMerge(target[key], source[key]); } else { Object.assign(output, { [key]: source[key] }); } }); } return output; }
  function isObject(item) { return (item && typeof item === 'object' && !Array.isArray(item)); }

  // API pública do módulo
  return { initialize };
})();


// ==================================================================
// FUNÇÕES GLOBAIS PARA VISUALIZAÇÃO DE DETALHES DA MANUTENÇÃO
// (Adicionadas conforme a atualização)
// ==================================================================

/**
 * Função para visualizar detalhes de uma manutenção
 * Esta função deve estar no escopo global para ser acessível
 * @param {string} id - ID da manutenção a ser visualizada
 */
window.viewMaintenanceDetails = function(id) {
    if (!id) {
        console.error("ID da manutenção não fornecido para viewMaintenanceDetails");
        if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
             Utilities.showNotification("ID da manutenção não fornecido.", "error");
        }
        return;
    }
    
    console.log(`Visualizando detalhes da manutenção: ${id}`);
    
    if (typeof Utilities !== 'undefined' && Utilities.showLoading) {
        Utilities.showLoading(true, "Carregando detalhes...");
    }
    
    // API_URL deve estar definida globalmente
    if (typeof API_URL === 'undefined') {
        console.error("API_URL não está definida. Não é possível buscar detalhes.");
        if (typeof Utilities !== 'undefined' && Utilities.showLoading) Utilities.showLoading(false);
        if (typeof Utilities !== 'undefined' && Utilities.showNotification) Utilities.showNotification("Erro de configuração: API_URL não definida.", "error");
        return;
    }

    fetch(`${API_URL}?action=getMaintenanceDetails&id=${id}`)
        .then(response => {
            if (!response.ok) { // Verifica se a resposta da rede foi bem-sucedida
                // Tenta ler a mensagem de erro do corpo, se houver
                return response.json().catch(() => ({ // Se o corpo não for JSON ou estiver vazio
                    success: false, message: `Erro HTTP: ${response.status} ${response.statusText}`
                })).then(errData => {
                    throw new Error(errData.message || `Erro HTTP: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.details) {
                // A função showMaintenanceDetailsModal está definida abaixo neste escopo global
                showMaintenanceDetailsModal(data.details);
            } else {
                console.error("Erro ao obter detalhes:", data.message || "Resposta inválida da API.");
                if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
                    Utilities.showNotification(data.message || "Erro ao obter detalhes da manutenção", "error");
                }
            }
        })
        .catch(error => {
            console.error("Erro na requisição de detalhes da manutenção:", error);
            if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
                Utilities.showNotification(error.message || "Erro ao comunicar com o servidor para obter detalhes", "error");
            }
        })
        .finally(() => {
            if (typeof Utilities !== 'undefined' && Utilities.showLoading) {
                Utilities.showLoading(false);
            }
        });
};

/**
 * Exibe o modal com detalhes da manutenção
 * @param {Object} details - Detalhes da manutenção
 */
function showMaintenanceDetailsModal(details) {
    const overlay = document.getElementById('detail-overlay');
    if (!overlay) {
        console.error("Elemento #detail-overlay não encontrado no DOM.");
        if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
             Utilities.showNotification("Erro de interface: Modal de detalhes não encontrado.", "error");
        }
        return;
    }
    
    const contentElement = document.getElementById('maintenance-detail-content');
    if (!contentElement) {
        console.error("Elemento #maintenance-detail-content não encontrado no DOM.");
        if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
             Utilities.showNotification("Erro de interface: Conteúdo do modal não encontrado.", "error");
        }
        overlay.style.display = 'none'; // Esconde o overlay se o conteúdo não existir
        return;
    }
    
    // Construir o conteúdo HTML
    // Usar as funções globais formatDate e getStatusClass
    let html = `
        <div class="detail-header">
            <h3 class="detail-title">Manutenção ID: ${details.id || '-'}</h3>
            <span class="detail-subtitle">Registrado em ${formatDate(details.dataRegistro || details.registration_date || details.created_at) || '-'}</span>
        </div>
        
        <div class="detail-section">
            <h4 class="detail-section-title">Informações do Equipamento</h4>
            <div class="detail-grid">
                <div class="detail-field">
                    <div class="detail-label">Equipamento:</div>
                    <div class="detail-value">${details.placaOuId || details.equipment_identifier || details.equipment_name || '-'}</div>
                </div>
                <div class="detail-field">
                    <div class="detail-label">Tipo Eq.:</div>
                    <div class="detail-value">${details.tipoEquipamento || details.equipment_type || '-'}</div>
                </div>
                <div class="detail-field">
                    <div class="detail-label">Local/Oficina:</div>
                    <div class="detail-value">${details.local || details.oficina || details.location_name || '-'}</div>
                </div>
                <div class="detail-field">
                    <div class="detail-label">Área:</div>
                    <div class="detail-value">${details.area || details.area_name || '-'}</div>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h4 class="detail-section-title">Detalhes da Manutenção</h4>
            <div class="detail-grid">
                <div class="detail-field">
                    <div class="detail-label">Responsável:</div>
                    <div class="detail-value">${details.responsavel || details.responsible_name || '-'}</div>
                </div>
                <div class="detail-field">
                    <div class="detail-label">Tipo Manut.:</div>
                    <div class="detail-value">${details.tipoManutencao || details.maintenance_type || '-'}</div>
                </div>
                <div class="detail-field">
                    <div class="detail-label">Status Atual:</div>
                    <div class="detail-value">
                        <span class="status-badge status-${getStatusClass(details.status)}">${details.status || 'N/A'}</span>
                    </div>
                </div>
                <div class="detail-field">
                    <div class="detail-label">É Crítica:</div>
                    <div class="detail-value">${(details.critica || details.is_critical) ? 'Sim' : 'Não'}</div>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h4 class="detail-section-title">Problema</h4>
            <div class="detail-field">
                <div class="detail-label">Categoria:</div>
                <div class="detail-value">${details.categoriaProblem || details.problem_category || '-'}</div>
            </div>
            <div class="detail-field" style="grid-column: 1 / -1;">
                <div class="detail-label">Descrição do Problema:</div>
                <div class="detail-value problem-description">${details.descricao || details.description || '-'}</div>
            </div>
            <div class="detail-field" style="grid-column: 1 / -1;">
                <div class="detail-label">Observações Adicionais:</div>
                <div class="detail-value">${details.observacoes || details.notes || '-'}</div>
            </div>
        </div>
    `;
    
    if (details.verificacoes && details.verificacoes.length > 0) {
        html += `
            <div class="detail-section">
                <h4 class="detail-section-title">Histórico de Verificações</h4>
                <div class="timeline">
        `;
        
        details.verificacoes.forEach(verif => {
            const statusClass = getStatusClass(verif.resultado || verif.result); // Usa global getStatusClass
            html += `
                <div class="timeline-item">
                    <div class="timeline-dot ${statusClass}"></div>
                    <div class="timeline-content">
                        <div class="timeline-title">
                            ${verif.resultado || verif.result || 'Verificação'}
                            <span class="timeline-date">${formatDate(verif.data || verif.date) || '-'}</span>
                        </div>
                        <div class="timeline-description">
                            Verificador: ${verif.verificador || verif.verifier_name || '-'}<br>
                            ${verif.comentarios || verif.comments || ''}
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    contentElement.innerHTML = html;
    overlay.style.display = 'flex';
    
    const closeIconBtn = document.getElementById('close-detail'); // Botão X (ícone)
    const closeFooterBtn = document.getElementById('close-detail-btn'); // Botão "Fechar" no rodapé
    
    const closeFunction = function() {
        overlay.style.display = 'none';
    };

    if (closeIconBtn) {
        closeIconBtn.onclick = closeFunction;
    }
    if (closeFooterBtn) {
        closeFooterBtn.onclick = closeFunction;
    }
    
    const verifyBtn = document.getElementById('verify-maintenance-btn');
    if (verifyBtn) {
        const statusLower = (details.status || '').toLowerCase();
        if (statusLower === 'pendente' || statusLower === 'aguardando verificacao' || statusLower === 'aguardando verificação') {
            verifyBtn.style.display = 'inline-block'; // ou 'block' dependendo do estilo
            verifyBtn.onclick = function() {
                overlay.style.display = 'none'; // Fecha o modal de detalhes
                // Tenta chamar a função para abrir o formulário de verificação
                if (typeof openVerificationForm === 'function') {
                    openVerificationForm(details.id);
                } else if (typeof Verification !== 'undefined' && typeof Verification.openForm === 'function') { // Assumindo um módulo Verification
                    Verification.openForm(details.id);
                } else {
                    console.error("Função para abrir formulário de verificação não encontrada (openVerificationForm ou Verification.openForm)");
                    if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
                        Utilities.showNotification("Funcionalidade de verificação não disponível.", "warning");
                    }
                }
            };
        } else {
            verifyBtn.style.display = 'none';
        }
    }
}

// Função auxiliar global para formatar datas
function formatDate(dateStr) {
    if (!dateStr) return '-';
    
    if (typeof Utilities !== 'undefined' && typeof Utilities.formatDate === 'function') {
        try { return Utilities.formatDate(dateStr); }
        catch(e) { console.warn("Utilities.formatDate falhou, usando fallback.", e); }
    }
    
    try {
        const date = new Date(dateStr);
        // Verifica se a data é válida. Adiciona uma verificação de ano razoável.
        if (isNaN(date.getTime()) || date.getFullYear() < 1900 || date.getFullYear() > 2100) {
            // Se a string original parece uma data no formato YYYY-MM-DD, tenta formatá-la.
            if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
                const parts = dateStr.substring(0, 10).split('-');
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
            return dateStr; // Retorna a string original se não puder formatar
        }
        // Adiciona o fuso horário para exibir a data local corretamente, se necessário
        const adjustedDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
        return adjustedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
        console.error("Erro ao formatar data (global):", e, "Input:", dateStr);
        return dateStr; // Retorna a string original em caso de erro
    }
}

// Função auxiliar global para obter a classe CSS com base no status
function getStatusClass(status) {
    if (!status) return 'default';
    
    const s = String(status).toLowerCase();
    if (s.includes('pendente') || s.includes('aguardando')) return 'pending';
    if (s.includes('verificado') || s.includes('aprovado') || s.includes('confirmado')) return 'verified';
    if (s.includes('concluído') || s.includes('concluido') || s.includes('finalizado')) return 'completed';
    if (s.includes('ajustes') || s.includes('andamento') || s.includes('em progresso')) return 'adjustments'; // Alterado de adjusting
    if (s.includes('reprovado') || s.includes('rejeitado') || s.includes('cancelado')) return 'rejected';
    if (s.includes('crítico') || s.includes('critico') || s.includes('urgente')) return 'critical';
    return 'default';
}


// --- Inicialização do Dashboard ---
document.addEventListener('DOMContentLoaded', function() {
  if (typeof API_URL === 'undefined') {
      console.warn("AVISO: A constante global API_URL não está definida. As chamadas de API podem falhar.");
      // Exemplo: window.API_URL = "/api/main.php"; // Defina isso no seu HTML ou em um script carregado antes.
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
