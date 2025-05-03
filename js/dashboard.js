/**
 * Sistema de Dupla Checagem de Manutenção
 * Módulo: Dashboard (Versão FINAL Frontend - 03/05/2025 v2)
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
    if (chartInstances) {
      Object.values(chartInstances).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
          try { chart.destroy(); } catch (e) { console.error("Erro ao destruir chart:", e); }
        }
      });
    }
    chartInstances = {};
    // console.log("Instâncias de gráficos limpas."); // Opcional: remover log verboso
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
           .dashboard-header { display: flex; flex-direction: column; align-items: flex-start; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #eee; }
           .dashboard-header h2 { width: 100%; margin-bottom: 10px; }
           .dashboard-controls { display: flex; justify-content: space-between; align-items: center; width: 100%; flex-wrap: wrap; gap: 10px;}
           .period-buttons { display: flex; gap: 5px; flex-wrap: wrap; }
           .period-btn { padding: 5px 10px; background-color: #f0f0f0; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; font-size: 0.8rem; transition: background-color 0.2s, color 0.2s, border-color 0.2s; }
           .period-btn:hover { background-color: #e0e0e0; }
           .period-btn.active { background-color: var(--primary-color, #0052cc); color: white; border-color: var(--primary-color, #0052cc); font-weight: 500; }
           .btn-refresh { margin-left: auto; /* Tenta alinhar à direita */ }
           .btn-refresh.rotating { animation: rotate 1s linear infinite; } /* Infinite rotation */
           @keyframes rotate { to { transform: rotate(360deg); } }
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
     const activeButton = document.querySelector('#tab-dashboard .period-btn.active');
     const period = activeButton ? activeButton.getAttribute('data-period') : 'current-month';
     loadDashboardData(period, true); // Força recarregamento

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
             const activeButton = document.querySelector('#tab-dashboard .period-btn.active');
             const period = activeButton ? activeButton.getAttribute('data-period') : 'current-month';
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
  function renderDashboard(data) {
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


  /** Renderiza cartões de sumário */
  function renderSummaryCards(summary) {
    // Mapeamento: Chave do objeto 'summary' da API -> ID do elemento HTML
    const cardMap = {
      'total': 'total-maintenance',
      'pending': 'pending-verification',
      'completed': 'completed-verifications',
      'critical': 'critical-maintenance'
    };
    createSummaryCardsIfNeeded(); // Garante que os elementos HTML existam

    Object.entries(cardMap).forEach(([summaryKey, elementId]) => {
      const cardElement = document.getElementById(elementId);
      if (cardElement) {
        const countElement = cardElement.querySelector('.card-count');
        const value = summary[summaryKey] ?? 0; // Usa ?? para tratar null/undefined como 0
        if (countElement) {
            countElement.textContent = value;
        } else { console.warn(`.card-count não encontrado em #${elementId}`); }
      } else { console.warn(`Card #${elementId} não encontrado.`); }
    });
     // console.log("Cards de sumário renderizados com:", summary); // Opcional: Log verboso
  }

   /** Cria cards de sumário se necessário (inclui ícones Font Awesome) */
   function createSummaryCardsIfNeeded() {
       const dashboardContent = document.getElementById('tab-dashboard');
       if (!dashboardContent || dashboardContent.querySelector('.summary-cards')) return;

       console.log("Criando .summary-cards...");
       const cardsContainer = document.createElement('div');
       cardsContainer.className = 'summary-cards';
       const cards = [
         { id: 'total-maintenance', icon: 'fa-clipboard-list', color: 'blue', label: 'Total Manutenções' },
         { id: 'pending-verification', icon: 'fa-clock', color: 'yellow', label: 'Aguardando Verificação' },
         { id: 'completed-verifications', icon: 'fa-check-circle', color: 'green', label: 'Concluídas/Verificadas' },
         { id: 'critical-maintenance', icon: 'fa-exclamation-triangle', color: 'red', label: 'Manutenções Críticas' }
       ];
       cards.forEach(card => {
           const cardElement = document.createElement('div');
           cardElement.className = 'summary-card';
           cardElement.id = card.id;
           // Garante que as classes de ícone e cor existam no CSS
           cardElement.innerHTML = `
             <div class="card-icon card-icon-${card.color}">
               <i class="fas ${card.icon}"></i>
             </div>
             <div class="card-content">
               <div class="card-count">0</div>
               <div class="card-label">${card.label}</div>
             </div>`;
           cardsContainer.appendChild(cardElement);
       });
        const header = dashboardContent.querySelector('.dashboard-header');
        if (header) { header.parentNode.insertBefore(cardsContainer, header.nextSibling); }
        else { dashboardContent.prepend(cardsContainer); }
   }

  /** Chama as funções de renderização para todos os gráficos */
  function renderCharts(chartData) {
      console.log("Renderizando gráficos...");
      // IDs dos Canvas conforme HTML
      renderStatusChart(chartData.status || [], 'maintenance-status-chart');
      renderProblemCategoriesChart(chartData.problemCategories || [], 'problem-categories-chart'); // <<< Usa dados de Categoria
      renderMonthlyTrendChart(chartData.monthlyTrend || [], 'monthly-trend-chart');
      renderAreaDistributionChart(chartData.areaDistribution || [], 'area-distribution-chart'); // <<< Usa dados de Local/Oficina
      renderCriticalVsRegularChart(chartData.criticalVsRegular || [], 'critical-vs-regular-chart');
      renderVerificationResultsChart(chartData.verificationResults || [], 'verification-results-chart');
      renderMaintenanceFrequencyChart(chartData.maintenanceFrequency || [], 'maintenance-frequency-chart');

      // Gráfico Opcional: Manutenções por TIPO (se o canvas 'maintenance-type-chart' existir)
      if(document.getElementById('maintenance-type-chart')) {
          renderMaintenanceTypeChart(chartData.maintenanceTypes || [], 'maintenance-type-chart');
      }
      console.log("Chamadas de renderização de gráficos concluídas.");
  }

  // ===========================================================
  // FUNÇÕES DE RENDERIZAÇÃO DE GRÁFICOS (Refatoradas para reutilização)
  // ===========================================================

  /** Função genérica para renderizar um gráfico */
  function renderGenericChart(chartId, chartType, chartData, options = {}, chartKey = null) {
      const canvas = document.getElementById(chartId);
      if (!canvas) { console.error(`Canvas #${chartId} não encontrado!`); return; }
      if (typeof Chart === 'undefined') { console.error(`Chart.js não carregado para ${chartId}!`); return; }

      const isValidData = chartData && Array.isArray(chartData) && chartData.length > 0 && chartData.some(item => (item.count || 0) > 0);
      const dataToRender = isValidData ? chartData : [{ label: 'Sem Dados', count: 1 }];
      const isPlaceholder = !isValidData;
      if (isPlaceholder) console.warn(`Dados inválidos/vazios para ${chartId}. Usando placeholder.`);

      try {
          // Usa uma chave única para a instância do gráfico
          const instanceKey = chartKey || chartId;
          if (chartInstances[instanceKey]) chartInstances[instanceKey].destroy();

          const labels = dataToRender.map(item => item.label || 'N/A');
          const counts = dataToRender.map(item => item.count || 0);
          let colors = isPlaceholder ? ['#E0E0E0'] : generateColorPalette(labels.length);

          // Personaliza cores para tipos específicos
          if (chartId === 'maintenance-status-chart') {
              colors = isPlaceholder ? ['#E0E0E0'] : labels.map(l => getStatusColor(l));
          } else if (chartId === 'critical-vs-regular-chart') {
              colors = isPlaceholder ? ['#E0E0E0', '#D3D3D3'] : labels.map(l => l === 'Críticas' ? '#FF5630' : '#36B37E'); // Danger e Success
          } else if (chartId === 'verification-results-chart') {
              colors = isPlaceholder ? ['#E0E0E0'] : labels.map(l => getStatusColor(l)); // Reutiliza cores de status
          }

          // Configurações padrão e específicas do tipo
          const defaultOptions = {
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: !isPlaceholder }, tooltip: { enabled: !isPlaceholder } }
          };
          const mergedOptions = deepMerge(defaultOptions, options); // Combina opções padrão com específicas

          // Cria o gráfico
          chartInstances[instanceKey] = new Chart(canvas.getContext('2d'), {
              type: chartType,
              data: { labels, datasets: [{ data: counts, backgroundColor: colors, borderWidth: (chartType === 'pie' || chartType === 'doughnut') ? 0 : 1 }] },
              options: mergedOptions
          });
          console.log(`${chartId} (${chartType}) renderizado.`);

      } catch (error) { console.error(`Erro ao renderizar ${chartId}:`, error); }
  }

  /** Renderiza gráfico de Status das Manutenções */
  function renderStatusChart(data, chartId) {
      renderGenericChart(chartId, 'doughnut', data, {
          cutout: '65%', plugins: { legend: { position: 'right' } }
      }, 'statusChart');
  }

  /** Renderiza gráfico de Categorias de Problemas (TOP 10 + Outros) */
  function renderProblemCategoriesChart(data, chartId) {
      renderGenericChart(chartId, 'bar', data, { // Barras verticais
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { ticks: { autoSkip: data.length > 10 } } }
      }, 'categoryChart');
  }

   /** Renderiza gráfico Opcional: Manutenções por TIPO */
   function renderMaintenanceTypeChart(data, chartId) {
      renderGenericChart(chartId, 'bar', data, { // Barras verticais
           indexAxis: 'y', // Barras Horizontais para Tipos
           plugins: { legend: { display: false } },
           scales: { x: { beginAtZero: true, ticks: { precision: 0 } } } // Eixo X é a contagem
       }, 'maintenanceTypeChart');
   }

  /** Renderiza gráfico de Tendência Mensal */
  function renderMonthlyTrendChart(data, chartId) {
      const options = {
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } },
          elements: { line: { tension: 0.1, fill: true }, point: { radius: data.some(d=>(d.count||0)>0) ? 3 : 0 } } // Mostra pontos só se houver dados
      };
      // Passa dados diretamente para genérico, que cuidará dos datasets
      const dataForChart = data.map(item => ({ label: item.label, count: item.count })); // Garante formato

       // Sobrescreve a criação do dataset para linha
       const canvas = document.getElementById(chartId);
       if (!canvas || typeof Chart === 'undefined') return;
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

  /** Renderiza gráfico de Distribuição por Local/Oficina */
  function renderAreaDistributionChart(data, chartId) {
      renderGenericChart(chartId, 'pie', data, {
          plugins: { legend: { position: 'right', display: data.length > 0 && data.length < 15 && !data.every(i=>(i.count||0)===0) } } // Legenda otimizada
      }, 'areaChart');
  }

  /** Renderiza gráfico de Manutenções Críticas vs Regulares */
  function renderCriticalVsRegularChart(data, chartId) {
      renderGenericChart(chartId, 'doughnut', data, {
          cutout: '60%', plugins: { legend: { position: 'bottom' } }
      }, 'criticalChart');
  }

  /** Renderiza gráfico de Resultados das Verificações */
  function renderVerificationResultsChart(data, chartId) {
      renderGenericChart(chartId, 'bar', data, {
           plugins: { legend: { display: false } },
           scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
       }, 'verificationChart');
  }

  /** Renderiza gráfico de Frequência Média de Manutenções */
  function renderMaintenanceFrequencyChart(data, chartId) {
      renderGenericChart(chartId, 'bar', data, {
          indexAxis: 'y', // Barras horizontais
          plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: ctx => `Intervalo Médio: ${ctx.parsed.x} dias` } }
          },
          scales: { x: { beginAtZero: true, title: { display: true, text: 'Intervalo Médio (dias)'}, ticks: { precision: 0 } }, y: { ticks: { autoSkip: false } } }
      }, 'frequencyChart');
  }


  // ===========================================================
  // FUNÇÃO PARA RENDERIZAR TABELAS (Ranking e Recentes)
  // ===========================================================

   /** Renderiza tabela de ranking OU recentes. */
   function renderRecentMaintenances(items, tbodyId) {
       const tableBody = document.getElementById(tbodyId);
       if (!tableBody) { console.warn(`Tbody #${tbodyId} não encontrado!`); return; }
       tableBody.innerHTML = ''; // Limpa

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
               // Colunas: Equipamento(ID), Tipo, Total Manutenções, Última Manutenção, Status
               html = `
                 <td>${item.identifier || item.id || '-'}</td>
                 <td>${item.name || item.type || '-'}</td>
                 <td>${item.maintenanceCount || 0}</td>
                 <td>${formatDate(item.lastMaintenanceDate)}</td>
                 <td><span class="status-badge status-${getStatusClass(item.status)}">${item.status || 'N/A'}</span></td>`;
           } else if (tbodyId === 'recent-maintenance-tbody') {
                // Colunas: ID, Equipamento(placa+tipo), TipoManut, Data Registro, Responsável, Status, Ações
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
       // console.log(`Tabela #${tbodyId} renderizada.`); // Log opcional

        // Adiciona listener DELEGADO ao tbody (se ainda não tiver)
        const listenerId = `${tbodyId}-listener`;
        if (!tableBody.dataset[listenerId]) {
           tableBody.addEventListener('click', handleTableActionClick);
           tableBody.dataset[listenerId] = 'true';
        }
   }

   /** Handler DELEGADO para cliques nos botões de ação das tabelas */
   function handleTableActionClick(event) {
       const button = event.target.closest('.btn-icon');
       if (!button) return;
       const maintenanceId = button.getAttribute('data-id');
       if (!maintenanceId) return;

       if (button.classList.contains('view-maintenance')) {
          console.log(`Visualizar manutenção ID: ${maintenanceId}`);
          if (typeof window.viewMaintenanceDetails === 'function') {
             window.viewMaintenanceDetails(maintenanceId); // Chama função global
          } else { console.error("Função global 'viewMaintenanceDetails' não encontrada."); }
       }
   }

  // ===========================================================
  // FUNÇÕES UTILITÁRIAS INTERNAS E GLOBAIS (Se não vierem de utilities.js)
  // ===========================================================

  /** Gera uma paleta de cores */
  function generateColorPalette(count) {
    const baseColors = ['#0052CC', '#36B37E', '#FFAB00', '#6554C0', '#FF5630', '#00B8D9', '#FFC400', '#4C9AFF', '#79F2C0', '#FF8B00'];
    if (count <= baseColors.length) return baseColors.slice(0, count);
    const colors = [...baseColors];
    const step = 360 / (count - baseColors.length); const baseHue = 200;
    for (let i = 0; i < count - baseColors.length; i++) { colors.push(`hsl(${(baseHue + i * step) % 360}, 75%, 55%)`); }
    return colors;
  }

  /** Retorna classe CSS para status */
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

  /** Retorna cor HSL para status (exemplo) */
  function getStatusColor(status) {
    if (!status) return '#adb5bd'; // Cinza default
    const s = String(status).toLowerCase();
    if (s.includes('pendente') || s.includes('aguardando')) return '#FFAB00'; // warning
    if (s.includes('verificado') || s.includes('aprovado')) return '#0052CC'; // primary
    if (s.includes('concluído') || s.includes('concluido')) return '#36B37E'; // success
    if (s.includes('ajustes')) return '#FFC400'; // Amarelo mais claro
    if (s.includes('reprovado') || s.includes('rejeitado')) return '#FF5630'; // danger
    if (s.includes('crítico') || s.includes('critico')) return '#BF2600'; // danger mais escuro
    return '#6c757d'; // secondary
  }


  /** Formata uma data (DD/MM/YYYY) */
  function formatDate(dateInput) {
    if (!dateInput) return '-';
    if (typeof Utilities !== 'undefined' && Utilities.formatDate) { try { return Utilities.formatDate(dateInput); } catch (e) {} }
    try {
      const date = new Date(dateInput); if (isNaN(date.getTime())) return String(dateInput).split('T')[0];
      const day = String(date.getDate()).padStart(2, '0'); const month = String(date.getMonth() + 1).padStart(2, '0'); const year = date.getFullYear();
      if (year < 1900 || year > 3000) return '-'; return `${day}/${month}/${year}`;
    } catch(e) { return String(dateInput); }
  }

  /** Mostra/esconde loader global */
  function showLoading(show, message = 'Carregando...') {
    if (typeof Utilities !== 'undefined' && Utilities.showLoading) { try { Utilities.showLoading(show, message); return; } catch (e) {} }
    const loader = document.getElementById('global-loader');
    if (loader) { loader.style.display = show ? 'flex' : 'none'; const msgEl = document.getElementById('global-loader-message'); if (msgEl) msgEl.textContent = message; }
    else if (show) { console.warn("Loader global não encontrado"); }
  }

  /** Mostra notificação de erro */
  function showLoadingError(message) {
    if (typeof Utilities !== 'undefined' && Utilities.showNotification) { try { Utilities.showNotification(message, 'error', 8000); return; } catch(e) {} }
    console.error("Dashboard Error:", message);
  }

   /** Verifica se containers dos gráficos existem */
   function checkAndCreateChartContainers() { /* ... (código anterior, apenas para verificar/avisar) ... */ }

   /** Função utilitária para merge profundo de objetos (para opções de gráfico) */
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


  // API pública do módulo
  return { initialize }; // Expor apenas initialize, o resto é interno
})();

// --- Inicialização ---
// É crucial que API.js e utilities.js sejam carregados ANTES deste script.
// O ScriptLoader no index.html deve garantir isso.
document.addEventListener('DOMContentLoaded', function() {
  // Verifica se Chart.js está carregado ANTES de inicializar
  if (typeof Chart === 'undefined') {
     console.error("FATAL: Chart.js não foi carregado. Os gráficos do Dashboard não funcionarão.");
     // Opcional: Exibir mensagem para o usuário aqui
  } else if (typeof Dashboard !== 'undefined' && Dashboard.initialize) {
     console.log("DOM carregado, inicializando Dashboard...");
     // Pequeno delay para garantir que tudo esteja pronto
     setTimeout(Dashboard.initialize, 100);
  } else {
     console.error("Módulo Dashboard ou Dashboard.initialize não encontrado!");
  }
});
