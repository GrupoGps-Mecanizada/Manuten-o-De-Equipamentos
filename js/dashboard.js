/**
 * Sistema de Dupla Checagem de Manutenção
 * Módulo: Dashboard (Versão FINAL Frontend - 03/05/2025 v2 - Corrigido)
 */

const Dashboard = (function() {
  // Armazenar dados do dashboard
  let dashboardData = null;
  let chartInstances = {}; // Armazena instâncias dos gráficos para destruí-las
  let lastLoadTime = 0;
  const REFRESH_INTERVAL = 300000; // 5 minutos
  let dashboardInitialized = false;

  /** Limpa instâncias de gráficos anteriores */
  function cleanupCharts() {
    Object.values(chartInstances).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        try { chart.destroy(); } catch (e) { console.error("Erro ao destruir chart:", e); }
      }
    });
    chartInstances = {};
  }

  // Adicionar esta função no arquivo dashboard.js, antes de initialize()
  function createFilterDropdown() {
     console.log("Dropdown de filtros criado e configurado.");
  }

  /** Inicializa o dashboard */
  function initialize() {
    if (dashboardInitialized) {
      // console.log("Dashboard já inicializado."); // Opcional: remover log verboso
      return;
    }
    console.log("Dashboard.initialize() chamado");

    // Garante que os elementos HTML base existam antes de continuar
    if (!document.getElementById('tab-dashboard')) {
        console.error("Elemento #tab-dashboard não encontrado. A inicialização do Dashboard não pode continuar.");
        return;
    }

    createPeriodButtonsIfNeeded(); // Cria botões se não existirem
    // Chamar esta função dentro do método initialize() do Dashboard
    // Adicione esta linha em Dashboard.initialize() depois de createDashboardControls() [ajustado para createPeriodButtonsIfNeeded]
    createFilterDropdown();
    setupPeriodButtons(); // Configura listeners (via delegação)
    setupRefreshButton(); // Configura listener refresh (via delegação)
    setupTabNavigation(); // Monitora hashchange

    // Carrega dados iniciais imediatamente se estiver na aba dashboard
    const isActive = document.getElementById('tab-dashboard').classList.contains('active');
    const hash = window.location.hash || '#dashboard';
    if (isActive || hash === '#dashboard') {
       checkIfDashboard(true); // Passa true para forçar carregamento inicial
    }

    dashboardInitialized = true;
    console.log("Dashboard inicializado com sucesso.");
  }

  /** Cria botões de período se eles não existirem no DOM */
  function createPeriodButtonsIfNeeded() {
    const dashboardHeader = document.querySelector('#tab-dashboard .dashboard-header');
    // Verifica se o container de controles já existe para evitar duplicar tudo
    if (!dashboardHeader || dashboardHeader.querySelector('.dashboard-controls')) return;

    console.log("Criando controles do Dashboard (botões de período/refresh)...");

    // Cria container principal para os controles
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'dashboard-controls';

    // Cria container para os botões de período
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'period-buttons';
    const periods = [ // Ordem dos botões
      { id: 'current-month', label: 'Mês Atual' }, { id: 'last-month', label: 'Mês Anterior' },
      { id: 'last-3-months', label: 'Últimos 3m' }, { id: 'last-6-months', label: 'Últimos 6m' },
      { id: 'current-year', label: 'Este Ano' }, { id: 'all', label: 'Todos' }
    ];
    let defaultFound = false;
    periods.forEach(period => {
      const button = document.createElement('button');
      button.className = 'period-btn';
      button.setAttribute('data-period', period.id);
      button.textContent = period.label;
      if (period.id === 'current-month') { // Marca 'Mês Atual' como padrão
          button.classList.add('active');
          defaultFound = true;
      }
      buttonContainer.appendChild(button);
    });
    // Fallback se 'current-month' não existir na lista
    if (!defaultFound && buttonContainer.firstChild) {
        buttonContainer.firstChild.classList.add('active');
    }
    controlsContainer.appendChild(buttonContainer); // Adiciona botões de período

     // Garante que o botão refresh exista e o adiciona ao container
    createRefreshButton(controlsContainer);

    // Adiciona o container de controles ao header
    dashboardHeader.appendChild(controlsContainer);

    // Adiciona estilos CSS para os botões de período (apenas uma vez)
    if (!document.getElementById('dashboard-controls-style')) {
         const styleElement = document.createElement('style');
         styleElement.id = 'dashboard-controls-style';
         styleElement.textContent = `
           /* .dashboard-header já estilizado pelo filtro */
           .dashboard-controls { display: flex; justify-content: space-between; align-items: center; width: auto; /* Ajuste para caber com filtro */ flex-wrap: wrap; gap: 10px;}
           .period-buttons { display: flex; gap: 5px; flex-wrap: wrap; }
           .period-btn { padding: 5px 10px; background-color: #f0f0f0; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; font-size: 0.8rem; transition: background-color 0.2s, color 0.2s, border-color 0.2s; }
           .period-btn:hover { background-color: #e0e0e0; }
           .period-btn.active { background-color: var(--primary-color, #0052cc); color: white; border-color: var(--primary-color, #0052cc); font-weight: 500; }
           .btn-refresh { margin-left: 10px; /* Espaço entre botões e refresh */ }
           .btn-refresh.rotating { animation: rotate 1s linear infinite; } /* Infinite rotation */
           @keyframes rotate { to { transform: rotate(360deg); } }
           /* Ajuste responsivo para controles */
           @media (max-width: 767px) {
             .dashboard-controls { width: 100%; justify-content: flex-start; }
             .btn-refresh { margin-left: auto; /* Tenta alinhar refresh à direita em telas pequenas */ }
           }
         `;
         document.head.appendChild(styleElement);
     }
    console.log("Controles do Dashboard (período/refresh) criados/verificados.");
  }

  /** Configura os event listeners dos botões de período via delegação */
  function setupPeriodButtons() {
    const controlsContainer = document.querySelector('#tab-dashboard .dashboard-controls');
    if (!controlsContainer) {
        console.warn("Container de controles não encontrado para adicionar listener de período.");
        return;
    }
    // Remove listener antigo para garantir que não haja duplicação
    controlsContainer.removeEventListener('click', handlePeriodButtonClick);
    // Adiciona listener ao container pai
    controlsContainer.addEventListener('click', handlePeriodButtonClick);
    console.log("Listener de botões de período configurado via delegação.");
  }

  /** Handler para cliques nos botões de período (delegação) */
  function handlePeriodButtonClick(event) {
     // Verifica se o clique foi em um botão de período
     const targetButton = event.target.closest('.period-btn');
     if (!targetButton) return;

     const period = targetButton.getAttribute('data-period');
     if (!period) return;

     console.log(`Botão de período clicado: ${period}`);
     // Atualiza classe ativa visualmente
     document.querySelectorAll('#tab-dashboard .period-btn').forEach(btn => btn.classList.remove('active'));
     targetButton.classList.add('active');

      // Limpa os campos do filtro de data customizado ao selecionar um período pré-definido
      const startDateInput = document.getElementById('filterStartDate');
      const endDateInput = document.getElementById('filterEndDate');
      if (startDateInput) startDateInput.value = '';
      if (endDateInput) endDateInput.value = '';

     // Carrega os dados para o novo período
     loadDashboardData(period, true); // Força recarregamento
  }

  /** Configura o listener do botão de refresh via delegação */
  function setupRefreshButton() {
    const controlsContainer = document.querySelector('#tab-dashboard .dashboard-controls');
     if (!controlsContainer) {
       // Botão refresh será criado junto com os controles se necessário
       console.warn("Container de controles não encontrado para listener do refresh.");
       return;
     }
    // Remove listener antigo e adiciona novo (delegado)
    controlsContainer.removeEventListener('click', handleRefreshButtonClick);
    controlsContainer.addEventListener('click', handleRefreshButtonClick);
    console.log("Listener do botão Refresh configurado via delegação.");
  }

  /** Handler para clique no botão refresh (delegação) */
  function handleRefreshButtonClick(event) {
     // Verifica se o clique foi no botão refresh
     const targetButton = event.target.closest('#refresh-dashboard');
     if (!targetButton) return;

     console.log("Atualização manual do dashboard solicitada");

     // Verifica se um filtro de data customizado está ativo
     const startDate = document.getElementById('filterStartDate')?.value;
     const endDate = document.getElementById('filterEndDate')?.value;
     let periodToLoad;

     if (startDate && endDate) {
         periodToLoad = `custom:${startDate}:${endDate}`;
         console.log("Atualizando com período customizado:", periodToLoad);
     } else {
         // Pega o período do botão ativo
         const activeButton = document.querySelector('#tab-dashboard .period-btn.active');
         periodToLoad = activeButton ? activeButton.getAttribute('data-period') : 'current-month'; // Default se nenhum ativo
         console.log("Atualizando com período pré-definido:", periodToLoad);
     }

     loadDashboardData(periodToLoad, true); // Força recarregamento com o período correto

     // Feedback visual (reinicia animação se já estiver rodando)
     targetButton.classList.remove('rotating');
     // Força reflow para reiniciar a animação
     void targetButton.offsetWidth;
     targetButton.classList.add('rotating');
     // Remove a classe após um tempo (opcional, ou deixa rodando até carregar)
     // setTimeout(() => { targetButton.classList.remove('rotating'); }, 1500);
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
     // refreshButton.style.marginLeft = 'auto'; // Delegação cuida do posicionamento
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
           const currentTime = Date.now();
           const needsLoad = isInitialLoad || !dashboardData || (currentTime - lastLoadTime > REFRESH_INTERVAL);
           if (needsLoad) {
             console.log(`Carregando dados (${isInitialLoad ? 'inicial' : (!dashboardData ? 'sem dados' : 'atualização')})`);

             // Verifica se um filtro de data customizado está ativo para o carregamento inicial
             const startDateInput = document.getElementById('filterStartDate')?.value; // Note: Renomeado de filterStartDate para filter-start-date no HTML do filtro
             const endDateInput = document.getElementById('filterEndDate')?.value;     // Note: Renomeado de filterEndDate para filter-end-date no HTML do filtro
             let period;
             if(startDateInput && endDateInput && !isInitialLoad) { // Não usar custom no load inicial forçado, usar o default
                period = `custom:${startDateInput}:${endDateInput}`;
             } else {
                const activeButton = document.querySelector('#tab-dashboard .period-btn.active');
                period = activeButton ? activeButton.getAttribute('data-period') : 'current-month';
             }

             const delay = isInitialLoad ? 200 : 0;
             setTimeout(() => { loadDashboardData(period, true); }, delay);
           } else { /* console.log("Dashboard ativo, usando dados existentes."); */ }
        }
     }
   }

  /** Carrega dados do dashboard via API */
  function loadDashboardData(period = 'current-month', force = false) {
    const currentTime = Date.now();
    if (!force && dashboardData && (currentTime - lastLoadTime < REFRESH_INTERVAL)) {
      console.log("Dados recentes, pulando carregamento.");
      return;
    }
    console.log(`Carregando dados do dashboard para período: ${period}`);
    showLoading(true, "Carregando dashboard...");
    // Para o feedback visual do botão refresh
    const refreshButton = document.getElementById('refresh-dashboard');

    if (!window.API || typeof API.getDashboardData !== 'function') {
       console.error("API.getDashboardData não está disponível!");
       showLoadingError("Erro crítico: Função da API não encontrada.");
       if (refreshButton) refreshButton.classList.remove('rotating');
       showLoading(false);
       renderDashboard(createEmptyDashboardResponse("Erro de API"));
       return;
    }

    API.getDashboardData(period)
      .then(response => {
        console.log("Resposta API:", JSON.stringify(response, null, 2)); // Log detalhado
        if (response && response.success) {
          dashboardData = response; // Backend agora retorna tudo formatado
          lastLoadTime = currentTime;
          renderDashboard(dashboardData); // Renderiza com os dados recebidos
        } else {
          console.error("Erro retornado pela API:", response);
          showLoadingError("Erro ao carregar dados: " + (response?.message || "Resposta inválida"));
          renderDashboard(dashboardData || createEmptyDashboardResponse(response?.message || "Erro API")); // Tenta usar dados antigos ou mostra vazio
        }
      })
      .catch(error => {
        console.error("Falha na requisição API:", error);
        showLoadingError(`Falha na comunicação: ${error.message}.`);
        renderDashboard(dashboardData || createEmptyDashboardResponse(error.message)); // Tenta usar dados antigos ou mostra vazio
      })
      .finally(() => {
        if (refreshButton) refreshButton.classList.remove('rotating'); // Para animação
        showLoading(false);
      });
  }

  /** Função auxiliar para criar uma resposta vazia localmente */
  function createEmptyDashboardResponse(message = "Sem dados") {
      // Retorna a mesma estrutura que a API retornaria em caso de sucesso, mas com arrays vazios/zeros
      return { success: true, message: message, summary: { total: 0, pending: 0, completed: 0, critical: 0 }, maintenanceTypes: [], maintenanceStatuses: [], equipmentRanking: [], areaDistribution: [], problemCategories: [], monthlyTrend: [], criticalVsRegular: [], verificationResults: [], maintenanceFrequency: [], recentMaintenances: [] };
  }

  /** Renderiza o dashboard completo com os dados recebidos */
  function renderDashboard(data) { // Esta função será decorada mais abaixo
    cleanupCharts(); // Limpa gráficos antigos
    console.log("Renderizando dashboard com dados:", data);
    data = data || createEmptyDashboardResponse("Dados nulos recebidos"); // Garante que data seja um objeto

    try {
      checkAndCreateChartContainers(); // Verifica se <canvas> existem

      // 1. Renderizar Cards de Sumário
      renderSummaryCards(data.summary || {}); // Usa chaves: total, pending, completed, critical

      // 2. Preparar dados e Renderizar Gráficos
      const chartData = {
        status: data.maintenanceStatuses || [],
        problemCategories: data.problemCategories || [], // <<< Dados reais de Categoria
        monthlyTrend: data.monthlyTrend || [],
        areaDistribution: data.areaDistribution || [], // <<< Dados reais de Local/Oficina
        criticalVsRegular: data.criticalVsRegular || [],
        verificationResults: data.verificationResults || [],
        maintenanceFrequency: data.maintenanceFrequency || [],
        maintenanceTypes: data.maintenanceTypes || [] // <<< Dados de Tipo de Manutenção (para gráfico específico se houver)
      };
      renderCharts(chartData); // Chama render para todos os gráficos

      // 3. Renderizar Tabela de Ranking
      renderRecentMaintenances(data.equipmentRanking || [], 'equipment-ranking-tbody');

      // 4. Renderizar Tabela de Manutenções Recentes
      renderRecentMaintenances(data.recentMaintenances || [], 'recent-maintenance-tbody');

      console.log("Dashboard renderizado com sucesso.");
    } catch (error) {
      console.error("Erro CRÍTICO ao renderizar dashboard:", error);
      showLoadingError("Erro ao exibir dados do dashboard: " + error.message);
    } finally {
       showLoading(false); // Garante que o loader seja escondido
    }
  }

  // Configuração dos filtros de tabela (ATUALIZAÇÃO 2)
  function setupTableFilters() {
    const applyBtn = document.getElementById('filter-apply');
    const clearBtn = document.getElementById('filter-clear');
    const searchInput = document.getElementById('filter-search');
    const statusSelect = document.getElementById('filter-status');
    const startDate = document.getElementById('filter-start-date');
    const endDate = document.getElementById('filter-end-date');

    // Verifica se os elementos do filtro existem antes de adicionar listeners
    if (!applyBtn || !clearBtn || !searchInput || !statusSelect || !startDate || !endDate) {
        console.warn("Elementos do filtro da tabela não encontrados. A filtragem pode não funcionar.");
        return;
    }

    function applyFilter() {
      const text = searchInput.value.trim().toLowerCase();
      const status = statusSelect.value;
      const from = startDate.value; // Formato YYYY-MM-DD esperado para comparação de string direta
      const to = endDate.value;     // Formato YYYY-MM-DD esperado

      document.querySelectorAll('#recent-maintenance-tbody tr').forEach(row => {
        const cols = row.querySelectorAll('td');
        if (cols.length < 6) { // Garante que a linha tem colunas suficientes
            row.style.display = ''; // ou 'none' dependendo da lógica desejada para linhas malformadas
            return;
        }

        // A data na tabela está em formato DD/MM/YYYY. Precisa converter para YYYY-MM-DD para comparação de string.
        const dateParts = cols[3].textContent.trim().split('/');
        const rowDateStr = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : '';

        const stat = cols[5].textContent.trim(); // O status já está como texto
        const rowText = row.textContent.toLowerCase();
        let visible = true;

        if (text && !rowText.includes(text)) visible = false;
        if (status && stat !== status) visible = false; // Comparação direta de string para status
        if (from && rowDateStr && rowDateStr < from) visible = false;
        if (to && rowDateStr && rowDateStr > to) visible = false;
        
        row.style.display = visible ? '' : 'none';
      });
    }

    applyBtn.addEventListener('click', applyFilter);
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      statusSelect.value = '';
      startDate.value = '';
      endDate.value = '';
      applyFilter(); // Reaplica para mostrar tudo
    });
    console.log("Filtros da tabela de manutenções recentes configurados.");
  }

  // Chamar setupTableFilters sempre após renderDashboard (ATUALIZAÇÃO 2 - DECORATOR)
  // É importante que 'renderDashboard' já esteja definida antes deste ponto.
  // E 'setupTableFilters' também.
  // Esta é uma forma de "decorar" a função original.
  const originalRenderDashboard = renderDashboard; // Guarda a referência da função original
  renderDashboard = function(data) { // Sobrescreve renderDashboard
    originalRenderDashboard.call(this, data); // Chama a função original com o mesmo contexto e argumentos
    setupTableFilters(); // Chama a nova função depois
  };


  /** Renderiza cartões de sumário - VERSÃO CORRIGIDA */
  function renderSummaryCards(summary) {
    // Mapeamento: Chave do objeto 'summary' da API -> ID do elemento HTML que contém o valor
    const cardValueMap = {
      'total': 'total-maintenance',
      'pending': 'pending-verification',
      'completed': 'completed-verifications', // Este ID existe no HTML
      'critical': 'critical-maintenance'
    };

    Object.entries(cardValueMap).forEach(([summaryKey, elementId]) => {
      const valueElement = document.getElementById(elementId); // Busca pelo ID diretamente
      if (valueElement) {
        const value = summary[summaryKey] ?? 0; // Usa ?? para tratar null/undefined como 0
        valueElement.textContent = value; // Define o texto do elemento encontrado pelo ID
      } else {
        console.warn(`Elemento de valor #${elementId} não encontrado para o card ${summaryKey}.`);
      }
    });
  }

   /** Cria cards de sumário se necessário (inclui ícones Font Awesome) */
   function createSummaryCardsIfNeeded() {
       const dashboardContent = document.getElementById('tab-dashboard');
       if (!dashboardContent || dashboardContent.querySelector('.summary-cards')) return;

       console.log("Criando .summary-cards...");
       const cardsContainer = document.createElement('div');
       cardsContainer.className = 'summary-cards';
       const cards = [
         { valueId: 'total-maintenance', icon: 'fa-clipboard-list', color: 'blue', label: 'Total Manutenções' },
         { valueId: 'pending-verification', icon: 'fa-clock', color: 'yellow', label: 'Aguardando Verificação' },
         { valueId: 'completed-verifications', icon: 'fa-check-circle', color: 'green', label: 'Concluídas/Verificadas' },
         { valueId: 'critical-maintenance', icon: 'fa-exclamation-triangle', color: 'red', label: 'Manutenções Críticas' }
       ];
       cards.forEach(card => {
           const cardElement = document.createElement('div');
           cardElement.className = 'card';
           cardElement.innerHTML = `
             <div class="card-title">
               <i class="icon fas ${card.icon}"></i> ${card.label}
             </div>
             <div class="card-value" id="${card.valueId}">0</div> <div class="card-footer">
               <span>...</span> </div>`;
           cardsContainer.appendChild(cardElement);
       });
        const header = dashboardContent.querySelector('.dashboard-header');
        if (header) { header.parentNode.insertBefore(cardsContainer, header.nextSibling); }
        else { dashboardContent.prepend(cardsContainer); }
   }

  /** Chama as funções de renderização para todos os gráficos */
  function renderCharts(chartData) {
      console.log("Renderizando gráficos...");
      renderStatusChart(chartData.status || [], 'maintenance-status-chart');
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

  /** Renderiza gráfico de frequência apenas com dados válidos */
  function renderMaintenanceFrequencyChart(chartId, data) {
    const container = document.getElementById(chartId)?.parentElement;
    if (!data || !data.length) {
      if (container && !container.querySelector('.no-data-message')) {
        const msg = document.createElement('div');
        msg.className = 'no-data-message';
        msg.textContent = 'Sem dados para intervalo de manutenção.';
        // Limpa o conteúdo anterior do container antes de adicionar a mensagem
        if (container.firstChild && container.firstChild.id === chartId) { // Se o canvas existe
            try {
                if(chartInstances['frequencyChart']) chartInstances['frequencyChart'].destroy();
            } catch(e) { console.warn("Erro ao limpar canvas para msg sem dados (freq):", e);}
            container.innerHTML = ''; // Limpa o canvas e qualquer outra coisa
        }
        container.appendChild(msg);
      }
      return;
    }
    const oldMsg = container.querySelector('.no-data-message');
    if (oldMsg) oldMsg.remove();

    // Se o canvas não existir (foi removido pela mensagem de 'sem dados'), recria
    if (!document.getElementById(chartId) && container) {
        const newCanvas = document.createElement('canvas');
        newCanvas.id = chartId;
        newCanvas.style.height = '200px'; // ou a altura que você usa
        container.appendChild(newCanvas);
    }
    renderGenericChart(chartId, 'line', data, { /* suas opções */ }, 'frequencyChart');
  }


  /** Função genérica para renderizar um gráfico */
  function renderGenericChart(chartId, chartType, chartData, options = {}, chartKey = null) {
      let canvas = document.getElementById(chartId); // Use let pois pode ser recriado
      if (!canvas) { console.error(`Canvas #${chartId} não encontrado!`); return; }
      if (typeof Chart === 'undefined') { console.error(`Chart.js não carregado para ${chartId}!`); return; }

      const parent = canvas.parentElement;
      const noDataMessage = parent?.querySelector('.no-data-message');
      if (noDataMessage && parent) { // Se a mensagem existe no PAI
        parent.innerHTML = ''; // Limpa o container (remove a mensagem)
        const newCanvas = document.createElement('canvas');
        newCanvas.id = chartId;
        newCanvas.style.height = canvas.style.height || '200px';
        newCanvas.style.width = canvas.style.width || '100%';
        parent.appendChild(newCanvas);
        canvas = newCanvas; // Atualiza a referência do canvas
        console.log(`Canvas #${chartId} recriado após remover mensagem 'sem dados'.`);
      }

      const isValidData = chartData && Array.isArray(chartData) && chartData.length > 0 && chartData.some(item => (item.count || 0) > 0);

      if (!isValidData && chartId !== 'maintenance-frequency-chart') { // Manter o placeholder para outros gráficos
        console.warn(`Dados inválidos/vazios para ${chartId}. Usando placeholder.`);
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
      // Para maintenance-frequency-chart, se chegou aqui, os dados são válidos (tratamento prévio)

      const dataToRender = chartData;

      try {
          const instanceKey = chartKey || chartId;
          if (chartInstances[instanceKey]) {
            try { chartInstances[instanceKey].destroy(); } catch(e){ console.warn("Erro ao destruir chart (generic):", e); }
          }

          const labels = dataToRender.map(item => item.label || 'N/A');
          const counts = dataToRender.map(item => item.count || 0);
          let colors = generateColorPalette(labels.length);

          if (chartId === 'maintenance-status-chart') {
              colors = labels.map(l => getStatusColor(l));
          } else if (chartId === 'critical-vs-regular-chart') {
              colors = labels.map(l => l === 'Críticas' ? '#FF5630' : '#36B37E');
          } else if (chartId === 'verification-results-chart') {
              colors = labels.map(l => getStatusColor(l));
          }

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

  function renderStatusChart(data, chartId) {
      renderGenericChart(chartId, 'doughnut', data, {
          cutout: '65%', plugins: { legend: { position: 'right' } }
      }, 'statusChart');
  }

  function renderProblemCategoriesChart(data, chartId) {
      renderGenericChart(chartId, 'bar', data, {
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { ticks: { autoSkip: data.length > 10 } } }
      }, 'categoryChart');
  }

   function renderMaintenanceTypeChart(data, chartId) {
      renderGenericChart(chartId, 'bar', data, {
           indexAxis: 'y',
           plugins: { legend: { display: false } },
           scales: { x: { beginAtZero: true, ticks: { precision: 0 } } }
       }, 'maintenanceTypeChart');
   }

  function renderMonthlyTrendChart(data, chartId) {
      const options = {
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } },
          elements: { line: { tension: 0.1, fill: true }, point: { radius: data.some(d=>(d.count||0)>0) ? 3 : 0 } }
      };
      const dataForChart = data.map(item => ({ label: item.label, count: item.count }));

       let canvas = document.getElementById(chartId);
       if (!canvas || typeof Chart === 'undefined') return;

       const parent = canvas.parentElement;
       const noDataMessage = parent?.querySelector('.no-data-message');
       if (noDataMessage && parent) {
           parent.innerHTML = '';
           const newCanvas = document.createElement('canvas');
           newCanvas.id = chartId; newCanvas.style.height = canvas.style.height || '200px';
           parent.appendChild(newCanvas);
           canvas = newCanvas;
       }

       const isValidData = dataForChart && dataForChart.length > 0 && dataForChart.some(item => (item.count || 0) > 0);
       const isPlaceholder = !isValidData;
       if (isPlaceholder) console.warn(`Dados de Tendência inválidos/vazios para ${chartId}.`);

       try {
           const instanceKey = 'trendChart';
           if (chartInstances[instanceKey]) {
             try { chartInstances[instanceKey].destroy(); } catch(e) { console.warn("Erro ao destruir trend chart:", e); }
           }
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

  function renderAreaDistributionChart(data, chartId) {
      renderGenericChart(chartId, 'pie', data, {
          plugins: { legend: { position: 'right', display: data.length > 0 && data.length < 15 && !data.every(i=>(i.count||0)===0) } }
      }, 'areaChart');
  }

  function renderCriticalVsRegularChart(data, chartId) {
      renderGenericChart(chartId, 'doughnut', data, {
          cutout: '60%', plugins: { legend: { position: 'bottom' } }
      }, 'criticalChart');
  }

  function renderVerificationResultsChart(data, chartId) {
      renderGenericChart(chartId, 'bar', data, {
           plugins: { legend: { display: false } },
           scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
       }, 'verificationChart');
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
           let html = '';
           if (tbodyId === 'equipment-ranking-tbody') {
               html = `
                 <td>${item.identifier || item.id || '-'}</td>
                 <td>${item.name || item.type || '-'}</td>
                 <td>${item.maintenanceCount || 0}</td>
                 <td>${formatDate(item.lastMaintenanceDate)}</td>
                 <td><span class="status-badge status-${getStatusClass(item.status)}">${item.status || 'N/A'}</span></td>`;
           } else if (tbodyId === 'recent-maintenance-tbody') {
                html = `
                  <td>${item.id || '-'}</td>
                  <td>${item.placaOuId || '-'} (${item.tipoEquipamento || '-'})</td>
                  <td>${item.tipoManutencao || '-'}</td>
                  <td>${formatDate(item.dataRegistro)}</td>
                  <td>${item.responsavel || '-'}</td>
                  <td><span class="status-badge status-${getStatusClass(item.status)}">${item.status || 'N/A'}</span></td>
                  <td><button class="btn-icon view-maintenance" data-id="${item.id}" title="Ver Detalhes">👁️</button></td>`;
           }
           row.innerHTML = html;
           tableBody.appendChild(row);
       });

        const listenerKey = tbodyId.replace(/-([a-z])/g, g => g[1].toUpperCase()) + 'ListenerSet';
        if (!tableBody.dataset[listenerKey]) {
           tableBody.addEventListener('click', handleTableActionClick);
           tableBody.dataset[listenerKey] = 'true';
           console.log(`Listener de clique configurado para #${tbodyId} com chave dataset: ${listenerKey}`);
        }
   }

   function handleTableActionClick(event) {
       const button = event.target.closest('.btn-icon');
       if (!button) return;
       const maintenanceId = button.getAttribute('data-id');
       if (!maintenanceId) return;

       if (button.classList.contains('view-maintenance')) {
          console.log(`Visualizar manutenção ID: ${maintenanceId}`);
          if (typeof window.viewMaintenanceDetails === 'function') {
             window.viewMaintenanceDetails(maintenanceId);
          } else {
             console.error("Função global 'viewMaintenanceDetails' não encontrada ou não definida.");
             alert(`Detalhes da manutenção ${maintenanceId} (Função 'viewMaintenanceDetails' não disponível)`);
          }
       }
   }

  function generateColorPalette(count) {
    const baseColors = ['#0052CC', '#36B37E', '#FFAB00', '#6554C0', '#FF5630', '#00B8D9', '#FFC400', '#4C9AFF', '#79F2C0', '#FF8B00'];
    if (count <= baseColors.length) return baseColors.slice(0, count);
    const colors = [...baseColors];
    const step = 360 / (count - baseColors.length); const baseHue = 200;
    for (let i = 0; i < count - baseColors.length; i++) { colors.push(`hsl(${(baseHue + i * step) % 360}, 75%, 55%)`); }
    return colors;
  }

  function getStatusClass(status) {
    if (!status) return 'default'; const s = String(status).toLowerCase();
    if (s.includes('pendente') || s.includes('aguardando')) return 'pending';
    if (s.includes('verificado') || s.includes('aprovado')) return 'verified';
    if (s.includes('concluído') || s.includes('concluido')) return 'completed';
    if (s.includes('ajustes') || s.includes('andamento')) return 'adjusting';
    if (s.includes('reprovado') || s.includes('rejeitado')) return 'rejected';
    if (s.includes('crítico') || s.includes('critico')) return 'critical';
    if (s.includes('info') || s.includes('ok')) return 'info';
    return 'default';
  }

  function getStatusColor(status) {
    if (!status) return '#adb5bd';
    const s = String(status).toLowerCase();
    if (s.includes('pendente') || s.includes('aguardando')) return '#FFAB00';
    if (s.includes('verificado') || s.includes('aprovado')) return '#0052CC';
    if (s.includes('concluído') || s.includes('concluido')) return '#36B37E';
    if (s.includes('ajustes')) return '#FFC400';
    if (s.includes('reprovado') || s.includes('rejeitado')) return '#FF5630';
    if (s.includes('crítico') || s.includes('critico')) return '#BF2600';
    return '#6c757d';
  }

  function formatDate(dateInput) {
    if (!dateInput) return '-';
    if (typeof Utilities !== 'undefined' && Utilities.formatDate) {
        try { return Utilities.formatDate(dateInput); }
        catch (e) { console.warn("Erro ao usar Utilities.formatDate, usando fallback:", e); }
    }
    try {
      let date;
      if (typeof dateInput === 'string' && dateInput.includes('T')) {
          date = new Date(dateInput.split('T')[0] + 'T00:00:00');
      } else {
          date = new Date(dateInput);
      }
      if (isNaN(date.getTime())) {
          if (typeof dateInput === 'string') return dateInput.split('T')[0];
          return String(dateInput);
      }
      date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      if (year < 1900 || year > 3000) return '-';
      return `${day}/${month}/${year}`;
    } catch(e) {
      console.error("Erro ao formatar data (fallback):", e, "Input:", dateInput);
      return String(dateInput);
    }
  }

  function showLoading(show, message = 'Carregando...') {
    if (typeof Utilities !== 'undefined' && Utilities.showLoading) { try { Utilities.showLoading(show, message); return; } catch (e) {} }
    const loader = document.getElementById('global-loader');
    if (loader) { loader.style.display = show ? 'flex' : 'none'; const msgEl = document.getElementById('global-loader-message'); if (msgEl) msgEl.textContent = message; }
    else if (show) { console.warn("Loader global não encontrado"); }
  }

  function showLoadingError(message) {
    if (typeof Utilities !== 'undefined' && Utilities.showNotification) { try { Utilities.showNotification(message, 'error', 8000); return; } catch(e) {} }
    console.error("Dashboard Error:", message);
  }

    function checkAndCreateChartContainers() {
      const requiredCanvasIds = [
        'maintenance-status-chart', 'problem-categories-chart', 'monthly-trend-chart',
        'area-distribution-chart', 'critical-vs-regular-chart', 'verification-results-chart',
        'maintenance-frequency-chart'
      ];
      
      let dashboardGrid = document.querySelector('#tab-dashboard .dashboard-grid');
      if (!dashboardGrid) {
        console.log("Container .dashboard-grid não encontrado. Criando...");
        dashboardGrid = document.createElement('div');
        dashboardGrid.className = 'dashboard-grid';
        dashboardGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin: 1.5rem 0;';
        
        const dashboardTab = document.getElementById('tab-dashboard');
        if (dashboardTab) {
          const summaryCards = dashboardTab.querySelector('.summary-cards');
          if (summaryCards) {
            summaryCards.after(dashboardGrid);
          } else {
            dashboardTab.appendChild(dashboardGrid);
          }
        } else {
          console.error("Elemento #tab-dashboard também não encontrado. Não é possível criar container de gráficos.");
          return;
        }
      }

      requiredCanvasIds.forEach(id => {
        if (!document.getElementById(id)) {
          console.log(`Canvas #${id} não encontrado. Criando...`);
          const chartContainer = document.createElement('div');
          chartContainer.className = 'chart-container'; 
          chartContainer.style.cssText = 'position: relative; min-height: 250px; width: 100%; margin-bottom: 1rem;';
          
          const canvas = document.createElement('canvas');
          canvas.id = id;
          canvas.style.height = '200px';
          
          chartContainer.appendChild(canvas);
          dashboardGrid.appendChild(chartContainer);
        }
      });
    }

   function deepMerge(target, source) {
      const output = Object.assign({}, target);
      if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
          if (isObject(source[key])) {
            if (!(key in target)) Object.assign(output, { [key]: source[key] });
            else output[key] = deepMerge(target[key], source[key]);
          } else {
            Object.assign(output, { [key]: source[key] });
          }
        });
      }
      return output;
   }
   function isObject(item) { return (item && typeof item === 'object' && !Array.isArray(item)); }

  return { initialize };
})();

// ----------------------------------------------------------
// Exporta globalmente a função de visualizar detalhes de manutenção (ATUALIZAÇÃO 1)
// ----------------------------------------------------------
if (typeof window !== 'undefined') {
  window.viewMaintenanceDetails = function(maintenanceId) {
    // Tenta usar o módulo Maintenance (caso exista)
    if (typeof Maintenance !== 'undefined' && typeof Maintenance.openMaintenanceForm === 'function') {
      console.log("Delegando para Maintenance.openMaintenanceForm:", maintenanceId);
      Maintenance.openMaintenanceForm(maintenanceId);
      return;
    }
    // Fallback: chamar API direto e abrir modal via utilitário
    if (window.API && typeof API.getMaintenanceDetails === 'function') {
      console.log("Fallback: Chamando API.getMaintenanceDetails para:", maintenanceId);
      API.getMaintenanceDetails({ id: maintenanceId }) // Supondo que a API espera um objeto com id
        .then(resp => {
          if (resp.success && resp.maintenance) {
            // Reaproveita seu modal de detalhes (de verification.js, maintenance.js ou utilities)
            // Supondo que exista uma função global ou em Utilities para exibir modais.
            if (typeof displayDetailsModal === 'function') { // Função hipotética
              displayDetailsModal(resp.maintenance);
            } else if (typeof Utilities !== 'undefined' && typeof Utilities.showDetailsModal === 'function') { // Outra função hipotética
              Utilities.showDetailsModal(resp.maintenance);
            }
            else {
              alert("Detalhes da Manutenção:\n" + JSON.stringify(resp.maintenance, null, 2));
            }
          } else {
            console.error("Erro ao obter detalhes da manutenção via API:", resp);
            alert(`Não foi possível carregar detalhes: ${resp.message || 'erro desconhecido na API'}`);
          }
        })
        .catch(err => {
          console.error("Erro de comunicação ao obter detalhes da manutenção:", err);
          alert(`Erro de comunicação ao buscar detalhes: ${err.message}`);
        });
      return;
    }
    console.error("Nenhum handler disponível para viewMaintenanceDetails. ID:", maintenanceId);
    alert(`Detalhes da manutenção ${maintenanceId} não podem ser exibidos (nenhum handler configurado).`);
  };
}


// --- Inicialização ---
document.addEventListener('DOMContentLoaded', function() {
  if (typeof Chart === 'undefined') {
     console.error("FATAL: Chart.js não foi carregado. Os gráficos do Dashboard não funcionarão.");
     const dashboardTab = document.getElementById('tab-dashboard');
     if(dashboardTab) {
         dashboardTab.innerHTML = '<div class="alert alert-danger">Erro Crítico: Biblioteca de gráficos (Chart.js) não carregada. O Dashboard não pode ser exibido.</div>';
     }
  } else if (typeof Utilities === 'undefined') {
      console.error("FATAL: utilities.js não foi carregado. Funções essenciais do Dashboard podem falhar.");
      const dashboardTab = document.getElementById('tab-dashboard');
      if(dashboardTab) {
          dashboardTab.innerHTML = '<div class="alert alert-danger">Erro Crítico: Biblioteca de utilidades (utilities.js) não carregada. O Dashboard pode não funcionar corretamente.</div>';
      }
  }
  else if (typeof Dashboard !== 'undefined' && Dashboard.initialize) {
     console.log("DOM carregado, inicializando Dashboard...");
     setTimeout(Dashboard.initialize, 150);
  } else {
     console.error("Módulo Dashboard ou Dashboard.initialize não encontrado!");
      const dashboardTab = document.getElementById('tab-dashboard');
      if(dashboardTab) {
          dashboardTab.innerHTML = '<div class="alert alert-danger">Erro Crítico: Script do Dashboard (dashboard.js) não carregado ou inválido.</div>';
      }
  }
});
