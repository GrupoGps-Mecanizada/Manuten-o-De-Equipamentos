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

  function createFilterDropdown() {
     console.log("Dropdown de filtros criado e configurado.");
  }

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

    createPeriodButtonsIfNeeded();
    createFilterDropdown();
    setupPeriodButtons();
    setupRefreshButton();
    setupTabNavigation();

    const isActive = document.getElementById('tab-dashboard').classList.contains('active');
    const hash = window.location.hash || '#dashboard';
    if (isActive || hash === '#dashboard') {
       checkIfDashboard(true);
    }

    dashboardInitialized = true;
    console.log("Dashboard inicializado com sucesso.");
  }

  function createPeriodButtonsIfNeeded() {
    const dashboardHeader = document.querySelector('#tab-dashboard .dashboard-header');
    if (!dashboardHeader || dashboardHeader.querySelector('.dashboard-controls')) return;

    console.log("Criando controles do Dashboard (botões de período/refresh)...");
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'dashboard-controls';
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'period-buttons';
    const periods = [
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
      if (period.id === 'current-month') {
          button.classList.add('active');
          defaultFound = true;
      }
      buttonContainer.appendChild(button);
    });
    if (!defaultFound && buttonContainer.firstChild) {
        buttonContainer.firstChild.classList.add('active');
    }
    controlsContainer.appendChild(buttonContainer);
    createRefreshButton(controlsContainer);
    dashboardHeader.appendChild(controlsContainer);

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
    console.log("Controles do Dashboard (período/refresh) criados/verificados.");
  }

  function setupPeriodButtons() {
    const controlsContainer = document.querySelector('#tab-dashboard .dashboard-controls');
    if (!controlsContainer) {
        console.warn("Container de controles não encontrado para adicionar listener de período.");
        return;
    }
    controlsContainer.removeEventListener('click', handlePeriodButtonClick);
    controlsContainer.addEventListener('click', handlePeriodButtonClick);
    console.log("Listener de botões de período configurado via delegação.");
  }

  function handlePeriodButtonClick(event) {
     const targetButton = event.target.closest('.period-btn');
     if (!targetButton) return;
     const period = targetButton.getAttribute('data-period');
     if (!period) return;
     console.log(`Botão de período clicado: ${period}`);
     document.querySelectorAll('#tab-dashboard .period-btn').forEach(btn => btn.classList.remove('active'));
     targetButton.classList.add('active');
      const startDateInput = document.getElementById('filter-start-date');
      const endDateInput = document.getElementById('filter-end-date');
      if (startDateInput) startDateInput.value = '';
      if (endDateInput) endDateInput.value = '';
     loadDashboardData(period, true);
  }

  function setupRefreshButton() {
    const controlsContainer = document.querySelector('#tab-dashboard .dashboard-controls');
     if (!controlsContainer) {
       console.warn("Container de controles não encontrado para listener do refresh.");
       return;
     }
    controlsContainer.removeEventListener('click', handleRefreshButtonClick);
    controlsContainer.addEventListener('click', handleRefreshButtonClick);
    console.log("Listener do botão Refresh configurado via delegação.");
  }

  function handleRefreshButtonClick(event) {
     const targetButton = event.target.closest('#refresh-dashboard');
     if (!targetButton) return;
     console.log("Atualização manual do dashboard solicitada");
     const startDate = document.getElementById('filter-start-date')?.value;
     const endDate = document.getElementById('filter-end-date')?.value;
     let periodToLoad;
     if (startDate && endDate) {
         periodToLoad = `custom:${startDate}:${endDate}`;
         console.log("Atualizando com período customizado:", periodToLoad);
     } else {
         const activeButton = document.querySelector('#tab-dashboard .period-btn.active');
         periodToLoad = activeButton ? activeButton.getAttribute('data-period') : 'current-month';
         console.log("Atualizando com período pré-definido:", periodToLoad);
     }
     loadDashboardData(periodToLoad, true);
     targetButton.classList.remove('rotating');
     void targetButton.offsetWidth;
     targetButton.classList.add('rotating');
  }

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

   function setupTabNavigation() {
     window.addEventListener('hashchange', () => checkIfDashboard(false), false);
   }

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
             const startDateInput = document.getElementById('filter-start-date')?.value;
             const endDateInput = document.getElementById('filter-end-date')?.value;
             let period;
             if(startDateInput && endDateInput && !isInitialLoad) {
                period = `custom:${startDateInput}:${endDateInput}`;
             } else {
                const activeButton = document.querySelector('#tab-dashboard .period-btn.active');
                period = activeButton ? activeButton.getAttribute('data-period') : 'current-month';
             }
             const delay = isInitialLoad ? 200 : 0;
             setTimeout(() => { loadDashboardData(period, true); }, delay);
           }
        }
     }
   }

  function loadDashboardData(period = 'current-month', force = false) {
    const currentTime = Date.now();
    if (!force && dashboardData && (currentTime - lastLoadTime < REFRESH_INTERVAL)) {
      console.log("Dados recentes, pulando carregamento.");
      return;
    }
    console.log(`Carregando dados do dashboard para período: ${period}`);
    showLoading(true, "Carregando dashboard...");
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
        console.log("Resposta API:", JSON.stringify(response, null, 2));
        if (response && response.success) {
          dashboardData = response;
          lastLoadTime = currentTime;
          renderDashboard(dashboardData);
        } else {
          console.error("Erro retornado pela API:", response);
          showLoadingError("Erro ao carregar dados: " + (response?.message || "Resposta inválida"));
          renderDashboard(dashboardData || createEmptyDashboardResponse(response?.message || "Erro API"));
        }
      })
      .catch(error => {
        console.error("Falha na requisição API:", error);
        showLoadingError(`Falha na comunicação: ${error.message}.`);
        renderDashboard(dashboardData || createEmptyDashboardResponse(error.message));
      })
      .finally(() => {
        if (refreshButton) refreshButton.classList.remove('rotating');
        showLoading(false);
      });
  }

  function createEmptyDashboardResponse(message = "Sem dados") {
      return { success: true, message: message, summary: { total: 0, pending: 0, completed: 0, critical: 0 }, maintenanceTypes: [], maintenanceStatuses: [], equipmentRanking: [], areaDistribution: [], problemCategories: [], monthlyTrend: [], criticalVsRegular: [], verificationResults: [], maintenanceFrequency: [], recentMaintenances: [] };
  }

  // Função principal de renderização do Dashboard
  function renderDashboard(data) {
    cleanupCharts();
    console.log("Renderizando dashboard com dados:", data);
    data = data || createEmptyDashboardResponse("Dados nulos recebidos");

    try {
      checkAndCreateChartContainers();
      renderSummaryCards(data.summary || {});
      const chartData = {
        status: data.maintenanceStatuses || [],
        problemCategories: data.problemCategories || [],
        monthlyTrend: data.monthlyTrend || [],
        areaDistribution: data.areaDistribution || [],
        criticalVsRegular: data.criticalVsRegular || [],
        verificationResults: data.verificationResults || [],
        maintenanceFrequency: data.maintenanceFrequency || [],
        maintenanceTypes: data.maintenanceTypes || []
      };
      renderCharts(chartData);
      renderRecentMaintenances(data.equipmentRanking || [], 'equipment-ranking-tbody');
      renderRecentMaintenances(data.recentMaintenances || [], 'recent-maintenance-tbody');
      
      // Chamar applyGlobalFilter() logo após renderizar cada tabela (NOVA INSTRUÇÃO)
      // ou, mais apropriadamente, após todas as tabelas relevantes serem renderizadas.
      applyGlobalFilter();

      console.log("Dashboard renderizado com sucesso.");
    } catch (error) {
      console.error("Erro CRÍTICO ao renderizar dashboard:", error);
      showLoadingError("Erro ao exibir dados do dashboard: " + error.message);
    } finally {
       showLoading(false);
    }
  }

  function renderSummaryCards(summary) {
    const cardValueMap = {
      'total': 'total-maintenance',
      'pending': 'pending-verification',
      'completed': 'completed-verifications',
      'critical': 'critical-maintenance'
    };
    Object.entries(cardValueMap).forEach(([summaryKey, elementId]) => {
      const valueElement = document.getElementById(elementId);
      if (valueElement) {
        const value = summary[summaryKey] ?? 0;
        valueElement.textContent = value;
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

  function renderMaintenanceFrequencyChart(chartId, data) {
    const container = document.getElementById(chartId)?.parentElement;
    if (!data || !data.length) {
      if (container && !container.querySelector('.no-data-message')) {
        const msg = document.createElement('div');
        msg.className = 'no-data-message';
        msg.textContent = 'Sem dados para intervalo de manutenção.';
        if (container.firstChild && container.firstChild.id === chartId) {
            try {
                if(chartInstances['frequencyChart']) chartInstances['frequencyChart'].destroy();
            } catch(e) { console.warn("Erro ao limpar canvas para msg sem dados (freq):", e);}
            container.innerHTML = '';
        }
        container.appendChild(msg);
      }
      return;
    }
    const oldMsg = container.querySelector('.no-data-message');
    if (oldMsg) oldMsg.remove();
    if (!document.getElementById(chartId) && container) {
        const newCanvas = document.createElement('canvas');
        newCanvas.id = chartId;
        newCanvas.style.height = '200px';
        container.appendChild(newCanvas);
    }
    renderGenericChart(chartId, 'line', data, { /* suas opções */ }, 'frequencyChart');
  }

  function renderGenericChart(chartId, chartType, chartData, options = {}, chartKey = null) {
      let canvas = document.getElementById(chartId);
      if (!canvas) { console.error(`Canvas #${chartId} não encontrado!`); return; }
      if (typeof Chart === 'undefined') { console.error(`Chart.js não carregado para ${chartId}!`); return; }
      const parent = canvas.parentElement;
      const noDataMessage = parent?.querySelector('.no-data-message');
      if (noDataMessage && parent) {
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
      if (!isValidData && chartId !== 'maintenance-frequency-chart') {
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
           // Ajuste nas colunas para corresponder à lógica de applyGlobalFilter
           // A data (cols[3]) e status (cols[5]) são cruciais.
           if (tbodyId === 'equipment-ranking-tbody') { // Esta tabela pode não ser filtrada pelo applyGlobalFilter se não tiver data/status na mesma posição
               html = `
                 <td>${item.identifier || item.id || '-'}</td>
                 <td>${item.name || item.type || '-'}</td>
                 <td>${item.maintenanceCount || 0}</td>
                 <td>${formatDate(item.lastMaintenanceDate)}</td> 
                 <td><span class="status-badge status-${getStatusClass(item.status)}">${item.status || 'N/A'}</span></td>`;
           } else if (tbodyId === 'recent-maintenance-tbody') { // Esta é a principal tabela filtrada pelo dashboard.js
                html = `
                  <td>${item.id || '-'}</td>
                  <td>${item.placaOuId || '-'} (${item.tipoEquipamento || '-'})</td>
                  <td>${item.tipoManutencao || '-'}</td>
                  <td>${formatDate(item.dataRegistro)}</td> <!-- Data na coluna 3 (índice) -->
                  <td>${item.responsavel || '-'}</td>
                  <td><span class="status-badge status-${getStatusClass(item.status)}">${item.status || 'N/A'}</span></td> <!-- Status na coluna 5 (índice) -->
                  <td><button class="btn-icon view-maintenance" data-id="${item.id}" title="Ver Detalhes">👁️</button></td>`;
           } else if (tbodyId === 'maintenance-tbody' || tbodyId === 'verification-tbody') {
                // Adapte as colunas para estas tabelas se elas precisarem ser filtradas
                // Exemplo genérico, ajuste conforme a estrutura real dessas tabelas
                html = `
                  <td>${item.id || '-'}</td>
                  <td>${item.description || '-'}</td>
                  <td>${item.type || '-'}</td>
                  <td>${formatDate(item.date)}</td> <!-- Data na coluna 3 (índice) -->
                  <td>${item.user || '-'}</td>
                  <td><span class="status-badge status-${getStatusClass(item.status)}">${item.status || 'N/A'}</span></td> <!-- Status na coluna 5 (índice) -->
                  <td><button class="btn-icon view-details" data-id="${item.id}" title="Ver Detalhes">👁️</button></td>`;
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
       const button = event.target.closest('.btn-icon'); // Mais genérico que '.view-maintenance'
       if (!button) return;
       const maintenanceId = button.getAttribute('data-id');
       if (!maintenanceId) return;
       
       // Verifica se é um botão para ver detalhes (pode ser de qualquer tabela que use esta classe)
       if (button.classList.contains('view-maintenance') || button.classList.contains('view-details')) {
          console.log(`Visualizar detalhes para ID: ${maintenanceId}`);
          if (typeof window.viewMaintenanceDetails === 'function') {
             window.viewMaintenanceDetails(maintenanceId);
          } else {
             console.error("Função global 'viewMaintenanceDetails' não encontrada ou não definida.");
             alert(`Detalhes para ID ${maintenanceId} (Função 'viewMaintenanceDetails' não disponível)`);
          }
       }
   }

  // NOVA FUNÇÃO DE FILTRO GLOBAL E SEUS LISTENERS (dentro do IIFE)
  function applyGlobalFilter() {
    const searchInputEl = document.getElementById('filter-search');
    const statusSelectEl = document.getElementById('filter-status');
    const startDateEl = document.getElementById('filter-start-date');
    const endDateEl = document.getElementById('filter-end-date');

    // Garantir que os elementos de filtro existam
    if (!searchInputEl || !statusSelectEl || !startDateEl || !endDateEl) {
        console.warn("Elementos do formulário de filtro não encontrados. O filtro global não pode ser aplicado.");
        return;
    }

    const text = searchInputEl.value.trim().toLowerCase();
    const status = statusSelectEl.value; // O valor do select já é o texto do status desejado
    const from = startDateEl.value; // Formato YYYY-MM-DD
    const to = endDateEl.value;     // Formato YYYY-MM-DD

    // IDs das tabelas a serem filtradas
    const tablesToFilter = ['recent-maintenance-tbody', 'maintenance-tbody', 'verification-tbody'];

    tablesToFilter.forEach(tbodyId => {
      const tableBody = document.getElementById(tbodyId);
      if (!tableBody) {
        // console.warn(`Tabela com tbody ID #${tbodyId} não encontrada para filtragem.`);
        return; // Pula para a próxima tabela se esta não existir
      }

      tableBody.querySelectorAll('tr').forEach(row => {
        const cols = [...row.children].map(td => td.textContent.trim().toLowerCase());
        let visible = true;

        // Filtro por texto
        if (text && !cols.join(' ').includes(text)) {
          visible = false;
        }

        // Filtro por status (coluna 5, índice 5 para recent-maintenance-tbody)
        // A lógica de status precisa ser adaptada se a coluna for diferente ou se o status não for texto simples
        const statusTextInRow = (cols[5] || '').trim(); // Status na sexta coluna
        if (status && statusTextInRow !== status.toLowerCase()) {
          visible = false;
        }
        
        // Filtro por data (coluna 3, índice 3 para recent-maintenance-tbody)
        // A data na tabela (DD/MM/YYYY) precisa ser convertida para YYYY-MM-DD para comparação
        const dateInRowDDMMYYYY = (cols[3] || '').trim(); // Data na quarta coluna
        let dateInRowYYYYMMDD = '';
        if (dateInRowDDMMYYYY) {
            const parts = dateInRowDDMMYYYY.split('/');
            if (parts.length === 3) {
                dateInRowYYYYMMDD = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }

        if (from && dateInRowYYYYMMDD && dateInRowYYYYMMDD < from) {
          visible = false;
        }
        if (to && dateInRowYYYYMMDD && dateInRowYYYYMMDD > to) {
          visible = false;
        }

        row.style.display = visible ? '' : 'none';
      });
    });
    console.log("Filtro global aplicado.");
  }

  // Configurar listeners para os botões de filtro (garantir que os botões existam)
  const applyFilterButton = document.getElementById('filter-apply');
  const clearFilterButton = document.getElementById('filter-clear');

  if (applyFilterButton) {
    applyFilterButton.addEventListener('click', applyGlobalFilter);
  } else {
    console.warn("Botão 'filter-apply' não encontrado.");
  }

  if (clearFilterButton) {
    clearFilterButton.addEventListener('click', () => {
      ['filter-search','filter-status','filter-start-date','filter-end-date'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value='';
      });
      applyGlobalFilter(); // Reaplica o filtro (que agora mostrará tudo)
    });
  } else {
    console.warn("Botão 'filter-clear' não encontrado.");
  }
  // FIM DA NOVA FUNÇÃO DE FILTRO GLOBAL


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
})(); // FIM DO IIFE Dashboard

// NOVA IMPLEMENTAÇÃO PARA window.viewMaintenanceDetails (fora do IIFE)
// Colocado aqui conforme instrução "no final do IIFE, cole:" (interpretado como APÓS o IIFE)
// Se a intenção era "antes do return { initialize };", então deveria estar dentro.
// Mas a instrução anterior para applyGlobalFilter foi "Dentro do IIFE ... abaixo das funções de renderização"
// o que sugere uma distinção clara.
if (typeof window !== 'undefined') { // Adicionando verificação para evitar erro em ambientes não-browser
    window.viewMaintenanceDetails = function(id) {
        // Verifica se API e Maintenance estão disponíveis
        if (typeof API === 'undefined' || typeof API.getMaintenanceDetails !== 'function') {
            console.error("API.getMaintenanceDetails não está disponível.");
            alert('Erro: Função de API para obter detalhes não encontrada.');
            return;
        }
        if (typeof Maintenance === 'undefined' || typeof Maintenance.openMaintenanceForm !== 'function') {
            console.error("Maintenance.openMaintenanceForm não está disponível.");
            alert('Erro: Função para abrir formulário de manutenção não encontrada.');
            return;
        }

        API.getMaintenanceDetails({ id }).then(resp => {
            if (resp.success && resp.maintenance) {
                Maintenance.openMaintenanceForm(resp.maintenance.id, resp.maintenance);
            } else {
                alert('Detalhes não encontrados ou erro na resposta da API: ' + (resp.message || 'Erro desconhecido'));
                console.error("Falha ao obter detalhes da manutenção:", resp);
            }
        }).catch(err => {
            alert('Erro ao tentar obter detalhes da manutenção: ' + err.message);
            console.error("Erro na chamada API.getMaintenanceDetails:", err);
        });
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
