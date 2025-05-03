/**
 * Sistema de Dupla Checagem de Manutenção
 * Módulo: Dashboard (Versão FINAL Frontend - 03/05/2025)
 */

const Dashboard = (function() {
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
  }

  /** Inicializa o dashboard */
  function initialize() {
    console.log("Dashboard.initialize() chamado");
    if (dashboardInitialized) return;

    createPeriodButtonsIfNeeded(); // Cria botões se não existirem
    setupPeriodButtons();
    setupRefreshButton();
    setupTabNavigation(); // Monitora hashchange

    // Carrega dados iniciais imediatamente se estiver na aba dashboard
    checkIfDashboard(true); // Passa true para forçar carregamento inicial

    dashboardInitialized = true;
  }

  /** Cria botões de período se eles não existirem no DOM */
  function createPeriodButtonsIfNeeded() {
    const periodButtonsContainer = document.querySelector('.period-buttons');
    if (periodButtonsContainer) return; // Já existe

    console.log("Container de botões de período não encontrado, criando...");
    const dashboardHeader = document.querySelector('#tab-dashboard .dashboard-header'); // Mais específico
    if (!dashboardHeader) { console.warn("Não foi possível encontrar .dashboard-header para criar botões"); return; }

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'period-buttons';
    const periods = [
      { id: 'current-month', label: 'Mês Atual' }, { id: 'last-month', label: 'Mês Anterior' },
      { id: 'last-3-months', label: 'Últimos 3 Meses'}, { id: 'last-6-months', label: 'Últimos 6 Meses'},
      { id: 'current-year', label: 'Este Ano' }, { id: 'all', label: 'Todos' }
    ];
    periods.forEach(period => {
      const button = document.createElement('button');
      button.className = 'period-btn';
      button.setAttribute('data-period', period.id);
      button.textContent = period.label;
      if (period.id === 'current-month') button.classList.add('active'); // Ativa o padrão
      buttonContainer.appendChild(button);
    });

     // Adiciona estilos CSS para os botões de período
     const styleElement = document.createElement('style');
     styleElement.textContent = `
       .dashboard-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 1rem; }
       .dashboard-header h2 { margin-bottom: 0; } /* Remove margem padrão do h2 */
       .period-buttons { display: flex; gap: 5px; margin-top: 10px; margin-bottom: 10px; flex-wrap: wrap; }
       .period-btn { padding: 6px 12px; background-color: #f0f0f0; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; font-size: 0.85rem; transition: background-color 0.2s, color 0.2s, border-color 0.2s; }
       .period-btn:hover { background-color: #e0e0e0; }
       .period-btn.active { background-color: var(--primary-color, #0052cc); color: white; border-color: var(--primary-color, #0052cc); font-weight: 500; }
       .btn-refresh { /* Estilo do botão refresh já deve existir em styles.css */ }
     `;
     document.head.appendChild(styleElement);

    // Insere os botões e o botão refresh (se não existir)
    dashboardHeader.appendChild(buttonContainer);
    createRefreshButton(); // Garante que o refresh exista também
  }

  /** Configura os event listeners dos botões de período */
  function setupPeriodButtons() {
    // Seleciona os botões dentro do contexto do dashboard para evitar conflitos
    document.querySelectorAll('#tab-dashboard .period-btn').forEach(button => {
      // Remove listeners antigos para evitar duplicações se a função for chamada múltiplas vezes
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);

      newButton.addEventListener('click', function() {
        const period = this.getAttribute('data-period');
        if (!period) return;
        document.querySelectorAll('#tab-dashboard .period-btn').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        loadDashboardData(period, true); // Força recarregamento ao clicar
      });
    });
  }

  /** Configura ou cria o botão de atualização manual */
  function setupRefreshButton() {
    const refreshButton = document.getElementById('refresh-dashboard');
    if (!refreshButton) {
       createRefreshButton(); // Cria se não existir
       return; // A criação chamará setupRefreshButton novamente
    }

    const newRefreshButton = refreshButton.cloneNode(true);
    refreshButton.parentNode.replaceChild(newRefreshButton, refreshButton);

    newRefreshButton.addEventListener('click', function() {
      console.log("Atualização manual do dashboard solicitada");
      const activeButton = document.querySelector('#tab-dashboard .period-btn.active');
      const period = activeButton ? activeButton.getAttribute('data-period') : 'current-month';
      loadDashboardData(period, true); // Força recarregamento
      this.classList.add('rotating'); // Feedback visual
      setTimeout(() => { this.classList.remove('rotating'); }, 1000);
    });
  }

  /** Cria um botão de atualização caso não exista */
  function createRefreshButton() {
     if (document.getElementById('refresh-dashboard')) return; // Já existe

     const dashboardHeader = document.querySelector('#tab-dashboard .dashboard-header');
     if (dashboardHeader) {
       const refreshButton = document.createElement('button');
       refreshButton.id = 'refresh-dashboard';
       refreshButton.className = 'btn-icon btn-refresh'; // Usa classe btn-icon existente
       refreshButton.innerHTML = '↻'; // Ícone simples
       refreshButton.title = 'Atualizar Dashboard';
       refreshButton.style.fontSize = '1.2rem'; // Ajusta tamanho do ícone se necessário
       refreshButton.style.marginLeft = '10px';

       // Adiciona ao header (pode ajustar a ordem se quiser)
       dashboardHeader.appendChild(refreshButton);

       // Adiciona estilos de animação se não existirem
       if (!document.getElementById('refresh-animation-style')) {
           const styleElement = document.createElement('style');
           styleElement.id = 'refresh-animation-style';
           styleElement.textContent = `
             .btn-refresh.rotating { animation: rotate 1s linear; }
             @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
           `;
           document.head.appendChild(styleElement);
       }
       // Reconfigura o listener após criar o botão
       setupRefreshButton();
     }
  }

   /** Configura navegação entre abas e detecção de hash */
   function setupTabNavigation() {
     window.addEventListener('hashchange', () => checkIfDashboard(false), false);
   }

   /** Verifica se estamos na aba de dashboard e carrega dados se necessário */
   function checkIfDashboard(isInitialLoad = false) {
     const hash = window.location.hash || '#dashboard'; // Default para dashboard

     if (hash === '#dashboard') {
       console.log("Verificando aba Dashboard...");
       const currentTime = Date.now();
       const needsRefresh = !dashboardData || (currentTime - lastLoadTime > REFRESH_INTERVAL);

       // Carrega se for carregamento inicial OU se os dados estiverem desatualizados
       if (isInitialLoad || needsRefresh) {
         console.log(`Carregando dados do dashboard (${isInitialLoad ? 'inicial' : 'atualização'})`);
         const activeButton = document.querySelector('#tab-dashboard .period-btn.active');
         const period = activeButton ? activeButton.getAttribute('data-period') : 'current-month';
         // Usar timeout apenas no carregamento inicial para garantir DOM
         const delay = isInitialLoad ? 300 : 0;
         setTimeout(() => { loadDashboardData(period, true); }, delay);
       } else {
         console.log("Dashboard na tela, usando dados existentes.");
         // Opcional: Re-renderizar com dados existentes se a aba for re-selecionada
         // renderDashboard(dashboardData);
       }
     }
   }

  /** Carrega dados do dashboard via API */
  function loadDashboardData(period = 'current-month', force = false) {
    console.log(`Carregando dados do dashboard para período: ${period}`);
    const currentTime = Date.now();
    if (!force && dashboardData && (currentTime - lastLoadTime < REFRESH_INTERVAL)) {
      console.log("Dados recentes, pulando carregamento.");
      return;
    }

    showLoading(true, "Carregando dashboard...");

    if (!window.API || typeof API.getDashboardData !== 'function') {
       console.error("API.getDashboardData não está disponível!");
       showLoadingError("Erro crítico: Função da API não encontrada.");
       showLoading(false);
       return;
    }

    API.getDashboardData(period)
      .then(response => {
        console.log("Resposta COMPLETA da API getDashboardData:", JSON.stringify(response, null, 2));

        if (response && response.success) {
          dashboardData = response; // Usa a resposta inteira (já formatada no backend)
          lastLoadTime = currentTime;
          renderDashboard(dashboardData);
        } else {
          console.error("Erro ao carregar dados do dashboard (API retornou erro):", response);
          showLoadingError("Erro ao carregar dados: " + (response?.message || "Resposta inválida da API"));
          // Tenta renderizar com dados antigos se existirem, senão mostra vazio
          if (dashboardData) renderDashboard(dashboardData);
          // else renderDashboard(createEmptyDashboardResponse()); // Opcional: Limpar explicitamente
        }
      })
      .catch(error => {
        console.error("Falha GERAL ao buscar dados do dashboard:", error);
        showLoadingError(`Falha na comunicação: ${error.message}. Verifique a conexão.`);
        if (dashboardData) renderDashboard(dashboardData);
        // else renderDashboard(createEmptyDashboardResponse());
      })
      .finally(() => {
        showLoading(false);
      });
  }


  /** Renderiza o dashboard completo com os dados recebidos */
  function renderDashboard(data) {
    cleanupCharts(); // Limpa gráficos antigos antes de desenhar
    console.log("Tentando renderizar dashboard com dados recebidos:", data);

    if (!data) {
        console.error("renderDashboard chamada sem dados.");
        showLoadingError("Não foi possível obter dados para exibir.");
        // Limpa as áreas para evitar mostrar dados antigos
        renderSummaryCards({});
        renderCharts({});
        renderRecentMaintenances([], 'equipment-ranking-tbody');
        renderRecentMaintenances([], 'recent-maintenance-tbody');
        return;
    }

    // Garante que containers dos gráficos existam (opcional, HTML deve tê-los)
    checkAndCreateChartContainers();

    // 1. Renderizar Cards de Sumário
    renderSummaryCards(data.summary || {}); // Passa objeto vazio se summary não existir

    // 2. Preparar dados e Renderizar Gráficos
    // As chaves aqui devem corresponder EXATAMENTE às retornadas pela API (dashboardLogic.gs)
    const chartData = {
      status: data.maintenanceStatuses || [],
      problemCategories: data.problemCategories || [], // <<< Dados reais de Categoria
      monthlyTrend: data.monthlyTrend || [],
      areaDistribution: data.areaDistribution || [], // <<< Dados reais de Local/Oficina
      criticalVsRegular: data.criticalVsRegular || [],
      verificationResults: data.verificationResults || [],
      maintenanceFrequency: data.maintenanceFrequency || []
    };
    renderCharts(chartData); // Função atualizada abaixo para chamar todos os renders

    // 3. Renderizar Tabela de Ranking
    renderRecentMaintenances(data.equipmentRanking || [], 'equipment-ranking-tbody');

    // 4. Renderizar Tabela de Manutenções Recentes
    renderRecentMaintenances(data.recentMaintenances || [], 'recent-maintenance-tbody'); // Usa a nova chave

    console.log("Dashboard renderizado com sucesso.");
  }


  /** Renderiza cartões de sumário */
  function renderSummaryCards(summary) {
    const cardMap = {
      'total': 'total-maintenance',
      'pending': 'pending-verification',
      'completed': 'completed-verifications',
      'critical': 'critical-maintenance'
    };
    createSummaryCardsIfNeeded(); // Garante que os elementos existam

    Object.entries(cardMap).forEach(([summaryKey, elementId]) => {
      const cardElement = document.getElementById(elementId);
      if (cardElement) {
        const countElement = cardElement.querySelector('.card-count');
        const value = summary[summaryKey] !== undefined ? summary[summaryKey] : 0;
        if (countElement) countElement.textContent = value;
      } else {
        console.warn(`Elemento do card #${elementId} não encontrado.`);
      }
    });
  }

   /** Cria cards de sumário se necessário */
  function createSummaryCardsIfNeeded() {
       const dashboardContent = document.getElementById('tab-dashboard'); // Target mais específico
       if (!dashboardContent || dashboardContent.querySelector('.summary-cards')) return; // Já existe

       const cardsContainer = document.createElement('div');
       cardsContainer.className = 'summary-cards';
       const cards = [
         // IDs correspondem aos usados em renderSummaryCards
         { id: 'total-maintenance', icon: 'clipboard-list', color: 'blue', label: 'Total de Manutenções', count: 0 },
         { id: 'pending-verification', icon: 'clock', color: 'yellow', label: 'Aguardando Verificação', count: 0 },
         { id: 'completed-verifications', icon: 'check-circle', color: 'green', label: 'Concluídas/Verificadas', count: 0 }, // Label ajustado
         { id: 'critical-maintenance', icon: 'exclamation-triangle', color: 'red', label: 'Manutenções Críticas', count: 0 }
       ];
       cards.forEach(card => { /* ... (código de criação do HTML do card como antes) ... */ });

       // Insere após o .dashboard-header
        const header = dashboardContent.querySelector('.dashboard-header');
        if (header && header.nextSibling) {
           header.parentNode.insertBefore(cardsContainer, header.nextSibling);
        } else if (header) {
           header.parentNode.appendChild(cardsContainer); // Adiciona no final se não houver irmão
        } else {
           dashboardContent.prepend(cardsContainer); // Adiciona no início se não achar header
        }
        // Adiciona estilos se não existirem (como antes)
   }

  /** Chama as funções de renderização para todos os gráficos */
  function renderCharts(chartData) {
      console.log("Renderizando gráficos com dados:", chartData);
      renderStatusChart(chartData.status || []);
      renderProblemCategoriesChart(chartData.problemCategories || []); // <<< Passa os dados de categoria
      renderMonthlyTrendChart(chartData.monthlyTrend || []);
      renderAreaDistributionChart(chartData.areaDistribution || []); // <<< Dados de Local/Oficina
      renderCriticalVsRegularChart(chartData.criticalVsRegular || []);
      renderVerificationResultsChart(chartData.verificationResults || []);
      renderMaintenanceFrequencyChart(chartData.maintenanceFrequency || []);
      console.log("Chamadas de renderização de gráficos concluídas.");
  }


  // ===========================================================
  // FUNÇÕES DE RENDERIZAÇÃO DE GRÁFICOS (Incluindo as 7)
  // ===========================================================

  /** Renderiza gráfico de Status das Manutenções */
  function renderStatusChart(statusData) {
     const chartId = 'maintenance-status-chart'; // ID correto do HTML
     const chartCanvas = document.getElementById(chartId);
     if (!chartCanvas) { console.error(`Canvas #${chartId} não encontrado!`); return; }
     if (typeof Chart === 'undefined') { console.error("Chart.js não carregado!"); return; }

     // Prepara dados ou usa placeholder
     const defaultData = [{label: 'Sem Dados', count: 1}];
     let dataToRender = statusData;
     if (!statusData || !Array.isArray(statusData) || statusData.length === 0) {
         console.warn("Dados de status inválidos/vazios. Usando placeholder.");
         dataToRender = defaultData;
     } else if (statusData.every(item => (item.count || 0) === 0)) {
         console.warn("Dados de status com contagem zero. Usando placeholder.");
         dataToRender = defaultData; // Mostra placeholder se tudo for zero
     }

     try {
       if (chartInstances.statusChart) chartInstances.statusChart.destroy();
       const labels = dataToRender.map(item => item.label || 'N/A');
       const counts = dataToRender.map(item => item.count || 0);
       const isPlaceholder = dataToRender === defaultData;
       const colors = isPlaceholder ? ['#E0E0E0'] : generateColorPalette(labels.length); // Cinza para placeholder

       const ctx = chartCanvas.getContext('2d');
       chartInstances.statusChart = new Chart(ctx, {
         type: 'doughnut',
         data: { labels: labels, datasets: [{ data: counts, backgroundColor: colors, borderWidth: 0 }] },
         options: {
           responsive: true, maintainAspectRatio: false, cutout: '65%',
           plugins: { legend: { position: 'bottom', display: !isPlaceholder }, tooltip: { enabled: !isPlaceholder } }
         }
       });
       console.log("Gráfico de Status renderizado.");
     } catch (error) { console.error(`Erro ao renderizar ${chartId}:`, error); }
   }

  /** Renderiza gráfico de Categorias de Problemas (TOP 10 + Outros) */
  function renderProblemCategoriesChart(categoryData) { // Recebe dados JÁ processados pelo backend
      const chartId = 'problem-categories-chart';
      const chartCanvas = document.getElementById(chartId);
      if (!chartCanvas) { console.error(`Canvas #${chartId} não encontrado!`); return; }
      if (typeof Chart === 'undefined') { console.error("Chart.js não carregado!"); return; }

      const defaultData = [{label: 'Sem Dados', count: 1}];
      let dataToRender = categoryData;
       if (!categoryData || !Array.isArray(categoryData) || categoryData.length === 0) {
           console.warn("Dados de Categoria Problema inválidos/vazios. Usando placeholder.");
           dataToRender = defaultData;
       } else if (categoryData.every(item => (item.count || 0) === 0)) {
            console.warn("Dados de Categoria Problema com contagem zero. Usando placeholder.");
           dataToRender = defaultData;
       }

      try {
          if (chartInstances.categoryChart) chartInstances.categoryChart.destroy();

          const labels = dataToRender.map(item => item.label || 'N/A');
          const data = dataToRender.map(item => item.count || 0);
          const isPlaceholder = dataToRender === defaultData;
          const colors = isPlaceholder ? ['#E0E0E0'] : generateColorPalette(labels.length);

          const ctx = chartCanvas.getContext('2d');
          chartInstances.categoryChart = new Chart(ctx, {
              type: 'bar', // Barras Verticais
              data: {
                  labels: labels,
                  datasets: [{ data: data, backgroundColor: colors, borderWidth: 0 }]
              },
              options: {
                  // indexAxis: 'y', // Remover para barras verticais
                  responsive: true, maintainAspectRatio: false,
                  plugins: { legend: { display: false }, tooltip: { enabled: !isPlaceholder } },
                  scales: {
                      y: { beginAtZero: true, grid: { drawBorder: false }, ticks: { precision: 0 } }, // Eixo Y é a contagem
                      x: { grid: { display: false }, ticks: { autoSkip: labels.length > 12 } } // Eixo X são as categorias
                  }
              }
          });
          console.log("Gráfico de Categorias de Problema renderizado.");
      } catch (error) { console.error(`Erro ao renderizar ${chartId}:`, error); }
    }

  /** Renderiza gráfico de Tendência Mensal */
  function renderMonthlyTrendChart(trendData) {
      const chartId = 'monthly-trend-chart';
      const chartCanvas = document.getElementById(chartId);
      if (!chartCanvas) { console.error(`Canvas #${chartId} não encontrado!`); return; }
      if (typeof Chart === 'undefined') { console.error("Chart.js não carregado!"); return; }

      const defaultData = [{label: 'Mês', count: 0}];
      let dataToRender = trendData;
       if (!trendData || !Array.isArray(trendData) || trendData.length === 0) {
           console.warn("Dados de Tendência inválidos/vazios. Usando placeholder.");
           dataToRender = defaultData;
       }
       // Verifica se TODOS os counts são zero, mesmo que haja labels
       const allZero = dataToRender.every(item => (item.count || 0) === 0);

      try {
        if (chartInstances.trendChart) chartInstances.trendChart.destroy();
        const labels = dataToRender.map(item => item.label || '');
        const counts = dataToRender.map(item => item.count || 0);
        const isPlaceholder = dataToRender === defaultData || allZero;

        const ctx = chartCanvas.getContext('2d');
        chartInstances.trendChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Manutenções', data: counts,
              borderColor: isPlaceholder ? '#cccccc' : '#3f51b5',
              backgroundColor: isPlaceholder ? 'rgba(204, 204, 204, 0.1)' : 'rgba(63, 81, 181, 0.1)',
              borderWidth: 2, pointRadius: isPlaceholder ? 0 : 3, fill: true, tension: 0.1
            }]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: !isPlaceholder } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } }
          }
        });
        console.log("Gráfico de Tendência Mensal renderizado.");
      } catch (error) { console.error(`Erro ao renderizar ${chartId}:`, error); }
    }

  /** Renderiza gráfico de Distribuição por Área (Local/Oficina) */
  function renderAreaDistributionChart(areaData) {
     const chartId = 'area-distribution-chart';
     const chartCanvas = document.getElementById(chartId);
     if (!chartCanvas) { console.error(`Canvas #${chartId} não encontrado!`); return; }
     if (typeof Chart === 'undefined') { console.error("Chart.js não carregado!"); return; }

     const defaultData = [{label: 'Sem Dados', count: 1}];
      let dataToRender = areaData;
       if (!areaData || !Array.isArray(areaData) || areaData.length === 0) {
           console.warn("Dados de Distribuição por Local inválidos/vazios. Usando placeholder.");
           dataToRender = defaultData;
       } else if (areaData.every(item => (item.count || 0) === 0)) {
           console.warn("Dados de Distribuição por Local com contagem zero. Usando placeholder.");
           dataToRender = defaultData;
       }

     try {
       if (chartInstances.areaChart) chartInstances.areaChart.destroy();
       const labels = dataToRender.map(item => item.label || 'N/A');
       const counts = dataToRender.map(item => item.count || 0);
       const isPlaceholder = dataToRender === defaultData;
       const colors = isPlaceholder ? ['#E0E0E0'] : generateColorPalette(labels.length);

       const ctx = chartCanvas.getContext('2d');
       chartInstances.areaChart = new Chart(ctx, {
         type: 'pie',
         data: { labels: labels, datasets: [{ data: counts, backgroundColor: colors, borderWidth: 1 }] },
         options: {
           responsive: true, maintainAspectRatio: false,
           plugins: { legend: { position: 'right', display: !isPlaceholder }, tooltip: { enabled: !isPlaceholder } }
         }
       });
       console.log("Gráfico de Distribuição por Local renderizado.");
     } catch (error) { console.error(`Erro ao renderizar ${chartId}:`, error); }
   }

  /** Renderiza gráfico de Manutenções Críticas vs Regulares */
  function renderCriticalVsRegularChart(criticalData) {
     const chartId = 'critical-vs-regular-chart';
     const chartCanvas = document.getElementById(chartId);
     if (!chartCanvas) { console.error(`Canvas #${chartId} não encontrado!`); return; }
     if (typeof Chart === 'undefined') { console.error("Chart.js não carregado!"); return; }

     const defaultData = [{label: 'Críticas', count: 0}, {label: 'Regulares', count: 0}];
      let dataToRender = criticalData;
       if (!criticalData || !Array.isArray(criticalData) || criticalData.length === 0) {
           dataToRender = defaultData;
       }
       const allZero = dataToRender.every(item => (item.count || 0) === 0);

     try {
       if (chartInstances.criticalChart) chartInstances.criticalChart.destroy();
       const labels = dataToRender.map(item => item.label || 'N/A');
       const counts = dataToRender.map(item => item.count || 0);
       const isPlaceholder = allZero;
       const colors = isPlaceholder ? ['#E0E0E0', '#D3D3D3'] : labels.map(l => l === 'Críticas' ? '#FF5630' : '#00B8D9'); // Danger e Info

       const ctx = chartCanvas.getContext('2d');
       chartInstances.criticalChart = new Chart(ctx, {
         type: 'doughnut', // Doughnut fica bom para 2 categorias
         data: { labels: labels, datasets: [{ data: counts, backgroundColor: colors, borderWidth: 0 }] },
         options: {
           responsive: true, maintainAspectRatio: false, cutout: '60%',
           plugins: { legend: { position: 'bottom', display: !isPlaceholder }, tooltip: { enabled: !isPlaceholder } }
         }
       });
       console.log("Gráfico Críticas vs Regulares renderizado.");
     } catch (error) { console.error(`Erro ao renderizar ${chartId}:`, error); }
   }

  /** Renderiza gráfico de Resultados das Verificações */
  function renderVerificationResultsChart(resultsData) {
      const chartId = 'verification-results-chart';
      const chartCanvas = document.getElementById(chartId);
      if (!chartCanvas) { console.error(`Canvas #${chartId} não encontrado!`); return; }
      if (typeof Chart === 'undefined') { console.error("Chart.js não carregado!"); return; }

      const defaultData = [{label: 'Sem Dados', count: 1}];
      let dataToRender = resultsData;
       if (!resultsData || !Array.isArray(resultsData) || resultsData.length === 0) {
           dataToRender = defaultData;
       }
       const allZero = dataToRender.every(item => (item.count || 0) === 0);

      try {
        if (chartInstances.verificationChart) chartInstances.verificationChart.destroy();
        const labels = dataToRender.map(item => item.label || 'N/A');
        const counts = dataToRender.map(item => item.count || 0);
        const isPlaceholder = allZero || dataToRender === defaultData;
        const colors = isPlaceholder ? ['#E0E0E0'] : labels.map(l => {
            if (l === 'Aprovado') return '#36B37E'; // Success
            if (l === 'Reprovado') return '#FF5630'; // Danger
            if (l === 'Ajustes') return '#FFAB00'; // Warning
            return '#6c757d'; // Secondary (cinza) para outros
        });

        const ctx = chartCanvas.getContext('2d');
        chartInstances.verificationChart = new Chart(ctx, {
          type: 'bar',
          data: { labels: labels, datasets: [{ data: counts, backgroundColor: colors }] },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: !isPlaceholder } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
          }
        });
        console.log("Gráfico Resultados Verificações renderizado.");
      } catch (error) { console.error(`Erro ao renderizar ${chartId}:`, error); }
    }

  /** Renderiza gráfico de Frequência Média de Manutenções */
  function renderMaintenanceFrequencyChart(frequencyData) {
      const chartId = 'maintenance-frequency-chart';
      const chartCanvas = document.getElementById(chartId);
      if (!chartCanvas) { console.error(`Canvas #${chartId} não encontrado!`); return; }
      if (typeof Chart === 'undefined') { console.error("Chart.js não carregado!"); return; }

      const defaultData = [{label: 'Sem Dados', count: 0}];
      let dataToRender = frequencyData;
       if (!frequencyData || !Array.isArray(frequencyData) || frequencyData.length === 0) {
           dataToRender = defaultData;
       }
        const allZero = dataToRender.every(item => (item.count || 0) === 0);

      try {
        if (chartInstances.frequencyChart) chartInstances.frequencyChart.destroy();

        // Ordena do menor intervalo (mais frequente) para o maior
        dataToRender.sort((a, b) => (a.count || Infinity) - (b.count || Infinity));

        const labels = dataToRender.map(item => item.label || 'N/A');
        const counts = dataToRender.map(item => item.count || 0); // Dias
        const isPlaceholder = allZero || dataToRender === defaultData;
        const colors = isPlaceholder ? ['#E0E0E0'] : generateColorPalette(labels.length);

        const ctx = chartCanvas.getContext('2d');
        chartInstances.frequencyChart = new Chart(ctx, {
          type: 'bar',
          data: { labels: labels, datasets: [{ label: 'Intervalo Médio (dias)', data: counts, backgroundColor: colors }] },
          options: {
            responsive: true, maintainAspectRatio: false, indexAxis: 'y', // Barras horizontais
            plugins: {
              legend: { display: false },
              tooltip: {
                 enabled: !isPlaceholder,
                 callbacks: { label: ctx => `${ctx.dataset.label || ''}: ${ctx.parsed.x} dias` }
              }
            },
            scales: { x: { beginAtZero: true, title: { display: true, text: 'Intervalo Médio (dias)'}, ticks: { precision: 0 } }, y: { ticks: { autoSkip: false } } }
          }
        });
        console.log("Gráfico Frequência Manutenção renderizado.");
      } catch (error) { console.error(`Erro ao renderizar ${chartId}:`, error); }
    }

   /**
    * Renderiza tabela de ranking OU recentes.
    * @param {Array} items - Dados para a tabela (equipmentRanking ou recentMaintenances)
    * @param {string} tbodyId - ID do tbody onde renderizar
    */
   function renderRecentMaintenances(items, tbodyId) {
       const tableBody = document.getElementById(tbodyId);
       if (!tableBody) { console.warn(`Elemento tbody #${tbodyId} não encontrado!`); return; }
       tableBody.innerHTML = ''; // Limpa

       if (!items || items.length === 0) {
         const colspan = tableBody.previousElementSibling?.rows?.[0]?.cells?.length || 5; // Pega colspan do thead
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
               // Colunas: ID, Equipamento, Tipo, Data Registro, Responsável, Status, Ações
               html = `
                 <td>${item.id || '-'}</td>
                 <td>${item.placaOuId || '-'} (${item.tipoEquipamento || '-'})</td>
                 <td>${item.tipoManutencao || '-'}</td>
                 <td>${formatDate(item.dataRegistro)}</td>
                 <td>${item.responsavel || '-'}</td>
                 <td><span class="status-badge status-${getStatusClass(item.status)}">${item.status || 'N/A'}</span></td>
                 <td>
                    <button class="btn-icon view-maintenance" data-id="${item.id}" title="Ver Detalhes">👁️</button>
                    </td>`;
                 // Adicionar listeners para esses botões (pode ser no main.js ou aqui)
           }
           row.innerHTML = html;
           tableBody.appendChild(row);
       });
       console.log(`Tabela #${tbodyId} renderizada com ${items.length} itens.`);

        // Adiciona listener para botões de visualização na tabela de recentes (se aplicável)
        if (tbodyId === 'recent-maintenance-tbody') {
           addTableActionListeners(tableBody);
        }
   }

   /** Adiciona listeners para botões de ação em uma tabela */
   function addTableActionListeners(tbodyElement) {
      // Evita adicionar múltiplos listeners
      if (tbodyElement.dataset.listenerAttached === 'true') return;

      tbodyElement.addEventListener('click', function(event) {
         const button = event.target.closest('.btn-icon');
         if (!button) return;
         const maintenanceId = button.getAttribute('data-id');
         if (!maintenanceId) return;

         if (button.classList.contains('view-maintenance')) {
            console.log(`Visualizar manutenção recente: ${maintenanceId}`);
            // Chamar a função global de visualização (de utilities.js ou main.js)
            if (typeof viewMaintenanceDetails === 'function') {
               viewMaintenanceDetails(maintenanceId);
            } else {
               alert(`Função viewMaintenanceDetails não encontrada. ID: ${maintenanceId}`);
            }
         }
         // Adicionar Lógica para outros botões (editar, etc.) se existirem
      });
      tbodyElement.dataset.listenerAttached = 'true'; // Marca que o listener foi adicionado
   }

   // ... (Restante das funções: generateColorPalette, getStatusClass, formatDate, showLoading, showLoadingError, generateMockDashboardData) ...
   // Mantenha as implementações anteriores dessas funções


  // API pública do módulo
  return { initialize, loadDashboardData, refreshDashboard: (p) => loadDashboardData(p, true) };
})();

// Inicializa o Dashboard quando o DOM estiver pronto (código como antes)
// document.addEventListener('DOMContentLoaded', ...);
// window.addEventListener('hashchange', ...); // Já coberto pela initialize() e setupTabNavigation()
