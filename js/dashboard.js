/**
 * Sistema de Dupla Checagem de Manutenção
 * Módulo: Dashboard
 */

const Dashboard = (function() {
  // Armazenar dados do dashboard
  let dashboardData = null;
  let chartInstances = {};
  let lastLoadTime = 0;
  const REFRESH_INTERVAL = 300000; // 5 minutos em ms
  let dashboardInitialized = false;
  
  /**
   * Inicializa o dashboard
   */
  function initialize() {
    console.log("Dashboard.initialize() chamado");
    
    if (dashboardInitialized) {
      console.log("Dashboard já inicializado, pulando...");
      return;
    }
    
    // Criação dos botões de período se não existirem
    createPeriodButtonsIfNeeded();
    
    // Adicionar event listeners para os botões de período
    setupPeriodButtons();
    
    // Adicionar listener para o botão de atualização manual
    setupRefreshButton();
    
    // Configurar navegação entre abas
    setupTabNavigation();
    
    // Carregar dados iniciais - IMPORTANTE: Isto foi corrigido para garantir o carregamento imediato
    loadDashboardData('current-month');
    
    // Verificar se estamos na aba de dashboard e forçar carregamento se necessário
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash || '#dashboard';
    
    if (currentPath.endsWith('index.html') || currentPath.endsWith('/') || 
        currentPath.includes('dashboard') || currentHash === '#dashboard') {
      console.log("Estamos na página de dashboard - garantindo carregamento de dados");
      // Pequeno delay para garantir que DOM esteja pronto
      setTimeout(() => {
        if (!dashboardData) {
          console.log("Forçando carregamento de dados do dashboard...");
          loadDashboardData('current-month', true);
        }
      }, 800);
    }
    
    dashboardInitialized = true;
  }
  
  /**
   * Cria botões de período se eles não existirem no DOM
   */
  function createPeriodButtonsIfNeeded() {
    const periodButtonsContainer = document.querySelector('.period-buttons');
    if (!periodButtonsContainer) {
      console.log("Container de botões de período não encontrado, criando...");
      
      // Encontrar onde inserir os botões
      const dashboardHeader = document.querySelector('.dashboard-header');
      if (!dashboardHeader) {
        console.warn("Não foi possível encontrar .dashboard-header para criar botões de período");
        return;
      }
      
      // Criar container de botões
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'period-buttons';
      
      // Definir períodos
      const periods = [
        { id: 'current-month', label: 'Mês Atual' },
        { id: 'last-month', label: 'Mês Anterior' },
        { id: 'year', label: 'Este Ano' },
        { id: 'all', label: 'Todos' }
      ];
      
      // Criar botões
      periods.forEach(period => {
        const button = document.createElement('button');
        button.className = 'period-btn';
        button.setAttribute('data-period', period.id);
        button.textContent = period.label;
        buttonContainer.appendChild(button);
      });
      
      // Inserir antes do primeiro filho do header ou no final se não houver filhos
      if (dashboardHeader.firstChild) {
        dashboardHeader.insertBefore(buttonContainer, dashboardHeader.firstChild);
      } else {
        dashboardHeader.appendChild(buttonContainer);
      }
      
      console.log("Botões de período criados com sucesso");
    }
  }
  
  /**
   * Configura os botões de período
   */
  function setupPeriodButtons() {
    const periodButtons = document.querySelectorAll('.period-btn');
    if (periodButtons.length === 0) {
      console.warn("Botões de período não encontrados!");
      createPeriodButtonsIfNeeded();
      
      // Tentar novamente após criar
      const newPeriodButtons = document.querySelectorAll('.period-btn');
      if (newPeriodButtons.length === 0) {
        console.error("Não foi possível criar botões de período!");
        return;
      }
      
      // Recursão para configurar os botões recém-criados
      return setupPeriodButtons();
    }
    
    periodButtons.forEach(button => {
      // Remover listeners anteriores para evitar duplicações
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      
      newButton.addEventListener('click', function() {
        const period = this.getAttribute('data-period');
        if (!period) {
          console.warn("Botão sem atributo data-period!");
          return;
        }
        
        // Remover classe ativa de todos os botões
        periodButtons.forEach(btn => btn.classList.remove('active'));
        // Adicionar classe ativa ao botão clicado
        this.classList.add('active');
        
        // Carregar dados para o período selecionado
        loadDashboardData(period, true);
      });
    });
    
    // Ativar botão do mês atual por padrão
    const defaultButton = document.querySelector('.period-btn[data-period="current-month"]');
    if (defaultButton) {
      defaultButton.classList.add('active');
    }
    
    console.log("Event listeners de botões de período configurados com sucesso");
  }
  
  /**
   * Configura botão de atualização manual
   */
  function setupRefreshButton() {
    const refreshButton = document.getElementById('refresh-dashboard');
    if (refreshButton) {
      // Clone para remover event listeners anteriores
      const newRefreshButton = refreshButton.cloneNode(true);
      refreshButton.parentNode.replaceChild(newRefreshButton, refreshButton);
      
      newRefreshButton.addEventListener('click', function() {
        console.log("Atualização manual do dashboard solicitada");
        
        // Obter período ativo
        const activeButton = document.querySelector('.period-btn.active');
        const period = activeButton ? activeButton.getAttribute('data-period') : 'current-month';
        
        // Forçar recarregamento
        loadDashboardData(period, true);
        
        // Feedback visual
        this.classList.add('rotating');
        setTimeout(() => {
          this.classList.remove('rotating');
        }, 1000);
      });
    } else {
      // Se o botão não existir, vamos criá-lo
      createRefreshButton();
    }
  }
  
  /**
   * Cria um botão de atualização caso não exista
   */
  function createRefreshButton() {
    const dashboardHeader = document.querySelector('.dashboard-header');
    if (dashboardHeader) {
      const refreshButton = document.createElement('button');
      refreshButton.id = 'refresh-dashboard';
      refreshButton.className = 'btn-refresh';
      refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i>';
      refreshButton.title = 'Atualizar Dashboard';
      
      // Adicionar à página
      dashboardHeader.appendChild(refreshButton);
      
      // Adicionar estilos CSS
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .btn-refresh {
          background: transparent;
          border: none;
          color: #007bff;
          cursor: pointer;
          font-size: 16px;
          margin-left: 10px;
          padding: 5px;
          transition: transform 0.3s ease;
        }
        .btn-refresh:hover {
          color: #0056b3;
        }
        .rotating {
          animation: rotate 1s linear;
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(styleElement);
      
      // Configurar event listener
      setupRefreshButton();
    }
  }
  
  /**
   * Configura navegação entre abas
   */
  function setupTabNavigation() {
    // Detectar mudanças na navegação
    window.addEventListener('hashchange', function() {
      checkIfDashboard();
    });
    
    // Verificar se estamos na aba de dashboard
    checkIfDashboard();
  }
  
  /**
   * Verifica se estamos na aba de dashboard e carrega dados se necessário
   */
  function checkIfDashboard() {
    const hash = window.location.hash || '#dashboard';
    
    if (hash === '#dashboard') {
      console.log("Navegou para a aba Dashboard");
      
      // Se os dados estiverem desatualizados ou não existirem, recarregar
      const currentTime = Date.now();
      if (!dashboardData || (currentTime - lastLoadTime > REFRESH_INTERVAL)) {
        console.log("Dados do dashboard desatualizados ou inexistentes - recarregando...");
        
        // Obter período ativo
        const activeButton = document.querySelector('.period-btn.active');
        const period = activeButton ? activeButton.getAttribute('data-period') : 'current-month';
        
        // Carregar dados com um pequeno delay para garantir que o DOM está pronto
        setTimeout(() => {
          loadDashboardData(period, true);
        }, 300);
      } else {
        console.log("Usando dados existentes do dashboard");
        // Forçar re-renderização com os dados existentes
        renderDashboard(dashboardData);
      }
    }
  }
  
  /**
   * Carrega dados do dashboard
   * @param {string} period - Período para filtrar dados (current-month, last-month, year, all)
   * @param {boolean} force - Forçar recarregamento mesmo se dados recentes existirem
   */
  function loadDashboardData(period = 'current-month', force = false) {
    console.log(`Carregando dados do dashboard para período: ${period}`);
    
    // Verificar se precisamos realmente carregar (evitar solicitações desnecessárias)
    const currentTime = Date.now();
    if (!force && dashboardData && (currentTime - lastLoadTime < REFRESH_INTERVAL)) {
      console.log("Dados do dashboard ainda estão atualizados - pulando carregamento");
      return;
    }
    
    // Mostrar indicador de carregamento
    showLoading(true, "Carregando dashboard...");
    
    // Chamar API para obter dados
    if (window.API && typeof API.getDashboardData === 'function') {
      API.getDashboardData(period)
        .then(response => {
          console.log("Resposta da API getDashboardData:", response);
          
          if (response && response.success) {
            console.log("Dados do dashboard recebidos com sucesso");
            
            // CORREÇÃO IMPORTANTE: Verificar se response.data existe
            if (!response.data) {
              console.warn("API retornou success=true mas sem dados no campo 'data'");
              
              // Tentar reestruturar a resposta se necessário
              // Algumas APIs podem retornar os dados diretamente no objeto raiz
              const possibleData = {};
              
              // Verificar campos esperados no objeto raiz da resposta
              if (response.summary) possibleData.summary = response.summary;
              if (response.charts) possibleData.charts = response.charts;
              if (response.recentMaintenances) possibleData.recentMaintenances = response.recentMaintenances;
              
              // Usar dados encontrados no objeto raiz ou gerar dados de exemplo
              if (Object.keys(possibleData).length > 0) {
                console.log("Encontrados dados no nível raiz da resposta, usando-os");
                dashboardData = possibleData;
              } else {
                console.log("Gerando dados de exemplo devido a resposta incompleta");
                dashboardData = generateMockDashboardData();
              }
            } else {
              // Resposta normal
              dashboardData = response.data;
            }
            
            // Atualizar timestamp
            lastLoadTime = currentTime;
            
            // Renderizar dados
            renderDashboard(dashboardData);
          } else {
            console.error("Erro ao carregar dados do dashboard:", response);
            showLoadingError("Erro ao carregar dados. Tentando usar cache ou dados de exemplo...");
            
            // Usar dados de exemplo se não houver dados em cache
            if (!dashboardData) {
              console.log("Usando dados de exemplo devido a falha na API");
              dashboardData = generateMockDashboardData();
              renderDashboard(dashboardData);
            } else {
              // Renderizar com dados de cache
              renderDashboard(dashboardData);
            }
          }
        })
        .catch(error => {
          console.error("Falha ao buscar dados do dashboard:", error);
          showLoadingError("Falha na comunicação com o servidor. Usando dados locais ou de exemplo.");
          
          // Usar dados de exemplo como fallback
          if (!dashboardData) {
            console.log("Usando dados de exemplo devido a falha na API");
            dashboardData = generateMockDashboardData();
            renderDashboard(dashboardData);
          } else {
            // Renderizar com dados de cache
            renderDashboard(dashboardData);
          }
        })
        .finally(() => {
          // Esconder indicador de carregamento
          showLoading(false);
        });
    } else {
      console.error("API.getDashboardData não disponível");
      
      // Verificar se conseguimos obter dados via outra função
      if (window.API && typeof API.getMaintenanceList === 'function') {
        console.log("Tentando obter dados via getMaintenanceList como alternativa");
        
        API.getMaintenanceList()
          .then(response => {
            if (response && response.success && response.maintenances) {
              console.log("Construindo dados do dashboard a partir de getMaintenanceList");
              dashboardData = buildDashboardFromMaintenances(response.maintenances, period);
              lastLoadTime = currentTime;
              renderDashboard(dashboardData);
            } else {
              console.error("Alternativa getMaintenanceList falhou:", response);
              useFallbackData();
            }
          })
          .catch(error => {
            console.error("Alternativa getMaintenanceList falhou com erro:", error);
            useFallbackData();
          })
          .finally(() => {
            showLoading(false);
          });
      } else {
        // Fallback completo para dados de exemplo
        useFallbackData();
        showLoading(false);
      }
    }
    
    // Função auxiliar para fallback
    function useFallbackData() {
      console.log("Usando dados de exemplo para o dashboard (API indisponível)");
      dashboardData = generateMockDashboardData();
      lastLoadTime = currentTime;
      renderDashboard(dashboardData);
    }
  }
  
  /**
   * Constrói dados do dashboard a partir de lista de manutenções
   * @param {Array} maintenances - Lista de manutenções
   * @param {string} period - Período de filtro
   * @returns {Object} Dados formatados para o dashboard
   */
  function buildDashboardFromMaintenances(maintenances, period) {
    console.log(`Construindo dashboard a partir de ${maintenances.length} manutenções`);
    
    // Filtrar por período se necessário
    let filteredMaintenances = [...maintenances];
    const now = new Date();
    
    if (period === 'current-month') {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      filteredMaintenances = maintenances.filter(m => {
        const date = new Date(m.dataManutencao || m.dataRegistro);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
    } else if (period === 'last-month') {
      const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const yearOfLastMonth = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      filteredMaintenances = maintenances.filter(m => {
        const date = new Date(m.dataManutencao || m.dataRegistro);
        return date.getMonth() === lastMonth && date.getFullYear() === yearOfLastMonth;
      });
    } else if (period === 'year') {
      const currentYear = now.getFullYear();
      filteredMaintenances = maintenances.filter(m => {
        const date = new Date(m.dataManutencao || m.dataRegistro);
        return date.getFullYear() === currentYear;
      });
    }
    
    // Calcular estatísticas
    const total = filteredMaintenances.length;
    const pending = filteredMaintenances.filter(m => m.status === 'Pendente').length;
    const completed = filteredMaintenances.filter(m => m.status === 'Concluído').length;
    const critical = filteredMaintenances.filter(m => m.eCritico).length;
    
    // Contagem por status
    const statusCounts = {};
    filteredMaintenances.forEach(m => {
      const status = m.status || 'Pendente';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    // Contagem por categoria de problema
    const categoryCounts = {};
    filteredMaintenances.forEach(m => {
      const category = m.categoriaProblema || 'Outro';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    // Contagem por área
    const areaCounts = {};
    filteredMaintenances.forEach(m => {
      const area = m.area || 'Não especificada';
      areaCounts[area] = (areaCounts[area] || 0) + 1;
    });
    
    // Tendência mensal
    const monthlyTrend = {};
    filteredMaintenances.forEach(m => {
      const date = new Date(m.dataManutencao || m.dataRegistro);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      if (!monthlyTrend[monthKey]) {
        monthlyTrend[monthKey] = { 
          label: monthName, 
          count: 0 
        };
      }
      monthlyTrend[monthKey].count++;
    });
    
    // Construir objeto de dados
    return {
      summary: {
        total,
        pending,
        completed,
        critical
      },
      charts: {
        status: Object.entries(statusCounts).map(([label, count]) => ({ label, count })),
        problemCategories: Object.entries(categoryCounts).map(([label, count]) => ({ label, count })),
        monthlyTrend: Object.values(monthlyTrend).sort((a, b) => a.month - b.month),
        areaDistribution: Object.entries(areaCounts).map(([label, count]) => ({ label, count }))
      },
      recentMaintenances: filteredMaintenances.sort((a, b) => {
        const dateA = new Date(a.dataManutencao || a.dataRegistro);
        const dateB = new Date(b.dataManutencao || b.dataRegistro);
        return dateB - dateA;
      }).slice(0, 5)
    };
  }
  
  /**
   * Renderiza o dashboard com os dados recebidos
   * @param {Object} data - Dados do dashboard
   */
  function renderDashboard(data) {
    console.log("Tentando renderizar dashboard com dados:", data);
    
    if (!data) {
      console.error("Sem dados para renderizar dashboard");
      showLoadingError("Não foi possível carregar dados para o dashboard");
      return;
    }
    
    try {
      // Renderizar cartões de sumário
      if (data.summary) {
        renderSummaryCards(data.summary);
      } else {
        console.warn("Dados de sumário não encontrados, usando valores padrão");
        renderSummaryCards({
          total: 0,
          pending: 0,
          completed: 0,
          critical: 0
        });
      }
      
      // Renderizar gráficos
      if (data.charts) {
        renderCharts(data.charts);
      } else {
        console.warn("Dados de gráficos não encontrados");
      }
      
      // Renderizar tabela de últimas manutenções
      if (data.recentMaintenances) {
        renderRecentMaintenances(data.recentMaintenances);
      } else {
        console.warn("Dados de manutenções recentes não encontrados");
        renderRecentMaintenances([]);
      }
      
      // Mostrar o dashboard agora que está carregado
      const dashboardContent = document.getElementById('dashboard-content');
      if (dashboardContent) {
        dashboardContent.style.opacity = '1';
      }
      
      console.log("Dashboard renderizado com sucesso");
    } catch (error) {
      console.error("Erro ao renderizar dashboard:", error);
      showLoadingError("Erro ao renderizar dashboard: " + error.message);
    }
  }
  
  /**
   * Renderiza cartões de sumário
   * @param {Object} summary - Dados de sumário
   */
  function renderSummaryCards(summary) {
    if (!summary) {
      console.warn("Sem dados de sumário para renderizar");
      return;
    }
    
    // Mapear IDs dos cartões para propriedades dos dados
    const cardMap = {
      'total-maintenance': { count: summary.total || 0, label: 'Total de Manutenções' },
      'pending-maintenance': { count: summary.pending || 0, label: 'Manutenções Pendentes' },
      'completed-maintenance': { count: summary.completed || 0, label: 'Manutenções Concluídas' },
      'critical-maintenance': { count: summary.critical || 0, label: 'Manutenções Críticas' }
    };
    
    // Verificar se os cartões existem, caso contrário, criá-los
    const cardsContainer = document.querySelector('.summary-cards');
    if (!cardsContainer) {
      console.warn("Container de cartões de sumário não encontrado, tentando criar...");
      createSummaryCardsIfNeeded();
    }
    
    // Atualizar cada cartão
    Object.entries(cardMap).forEach(([cardId, data]) => {
      const cardElement = document.getElementById(cardId);
      if (cardElement) {
        const countElement = cardElement.querySelector('.card-count');
        const labelElement = cardElement.querySelector('.card-label');
        
        if (countElement) countElement.textContent = data.count;
        if (labelElement) labelElement.textContent = data.label;
      } else {
        console.warn(`Cartão ${cardId} não encontrado no DOM`);
      }
    });
  }
  
  /**
   * Cria cards de sumário se necessário
   */
  function createSummaryCardsIfNeeded() {
    const dashboardContent = document.getElementById('dashboard-content');
    if (!dashboardContent) {
      console.error("Element #dashboard-content não encontrado!");
      return;
    }
    
    // Verificar se já existe container
    if (dashboardContent.querySelector('.summary-cards')) {
      return;
    }
    
    // Criar container
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'summary-cards';
    
    // Definir cards
    const cards = [
      { id: 'total-maintenance', icon: 'clipboard-list', color: 'blue', label: 'Total de Manutenções', count: 0 },
      { id: 'pending-maintenance', icon: 'clock', color: 'yellow', label: 'Manutenções Pendentes', count: 0 },
      { id: 'completed-maintenance', icon: 'check-circle', color: 'green', label: 'Manutenções Concluídas', count: 0 },
      { id: 'critical-maintenance', icon: 'exclamation-triangle', color: 'red', label: 'Manutenções Críticas', count: 0 }
    ];
    
    // Criar cada card
    cards.forEach(card => {
      const cardElement = document.createElement('div');
      cardElement.className = 'summary-card';
      cardElement.id = card.id;
      
      cardElement.innerHTML = `
        <div class="card-icon card-icon-${card.color}">
          <i class="fas fa-${card.icon}"></i>
        </div>
        <div class="card-content">
          <div class="card-count">${card.count}</div>
          <div class="card-label">${card.label}</div>
        </div>
      `;
      
      cardsContainer.appendChild(cardElement);
    });
    
    // Inserir no início do dashboard-content
    if (dashboardContent.firstChild) {
      dashboardContent.insertBefore(cardsContainer, dashboardContent.firstChild);
    } else {
      dashboardContent.appendChild(cardsContainer);
    }
    
    // Adicionar estilos necessários
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .summary-cards {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        margin-bottom: 30px;
      }
      .summary-card {
        display: flex;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        padding: 20px;
        min-width: 200px;
        flex: 1;
      }
      .card-icon {
        margin-right: 15px;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }
      .card-icon-blue { background: rgba(33, 150, 243, 0.2); color: #2196F3; }
      .card-icon-yellow { background: rgba(255, 193, 7, 0.2); color: #FFC107; }
      .card-icon-green { background: rgba(76, 175, 80, 0.2); color: #4CAF50; }
      .card-icon-red { background: rgba(244, 67, 54, 0.2); color: #F44336; }
      .card-content {
        display: flex;
        flex-direction: column;
      }
      .card-count {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 5px;
      }
      .card-label {
        color: #666;
        font-size: 14px;
      }
    `;
    document.head.appendChild(styleElement);
  }
  
  /**
   * Renderiza gráficos
   * @param {Object} chartData - Dados de gráficos
   */
  function renderCharts(chartData) {
    if (!chartData) {
      console.warn("Sem dados de gráficos para renderizar");
      return;
    }
    
    // Verificar se os contêineres de gráficos existem
    checkAndCreateChartContainers();
    
    // Renderizar gráfico de status se dados existirem
    if (chartData.status && Array.isArray(chartData.status)) {
      renderStatusChart(chartData.status);
    } else {
      console.warn("Dados de status não encontrados ou não são um array");
    }
    
    // Renderizar gráfico de categorias de problema
    if (chartData.problemCategories && Array.isArray(chartData.problemCategories)) {
      renderProblemCategoriesChart(chartData.problemCategories);
    } else {
      console.warn("Dados de categorias de problema não encontrados ou não são um array");
    }
    
    // Renderizar gráfico de tendência mensal
    if (chartData.monthlyTrend && Array.isArray(chartData.monthlyTrend)) {
      renderMonthlyTrendChart(chartData.monthlyTrend);
    } else {
      console.warn("Dados de tendência mensal não encontrados ou não são um array");
    }
    
    // Renderizar gráfico de distribuição por área
    if (chartData.areaDistribution && Array.isArray(chartData.areaDistribution)) {
      renderAreaDistributionChart(chartData.areaDistribution);
    } else {
      console.warn("Dados de distribuição por área não encontrados ou não são um array");
    }
  }
  
  /**
   * Verifica e cria contêineres de gráficos se necessário
   */
  function checkAndCreateChartContainers() {
    const dashboardContent = document.getElementById('dashboard-content');
    if (!dashboardContent) return;
    
    // Verificar se já existe a seção de gráficos
    if (dashboardContent.querySelector('.charts-container')) {
      return;
    }
    
    // Criar container de gráficos
    const chartsContainer = document.createElement('div');
    chartsContainer.className = 'charts-container';
    
    // Estrutura dos gráficos
    const chartStructure = [
      { row: 1, id: 'status-chart-container', title: 'Status de Manutenções', canvas: 'status-chart', type: 'doughnut' },
      { row: 1, id: 'area-distribution-container', title: 'Distribuição por Área', canvas: 'area-distribution-chart', type: 'pie' },
      { row: 2, id: 'problem-categories-container', title: 'Categorias de Problemas', canvas: 'problem-categories-chart', type: 'bar' },
      { row: 2, id: 'monthly-trend-container', title: 'Tendência Mensal', canvas: 'monthly-trend-chart', type: 'line' }
    ];
    
    // Criar estrutura HTML
    let currentRow = null;
    let lastRow = -1;
    
    chartStructure.forEach(chart => {
      // Criar nova linha se necessário
      if (chart.row !== lastRow) {
        currentRow = document.createElement('div');
        currentRow.className = 'charts-row';
        chartsContainer.appendChild(currentRow);
        lastRow = chart.row;
      }
      
      // Criar contêiner do gráfico
      const chartBox = document.createElement('div');
      chartBox.className = 'chart-box';
      chartBox.id = chart.id;
      
      chartBox.innerHTML = `
        <div class="chart-header">
          <h3>${chart.title}</h3>
        </div>
        <div class="chart-body">
          <canvas id="${chart.canvas}" width="400" height="300"></canvas>
        </div>
      `;
      
      currentRow.appendChild(chartBox);
    });
    
    // Verificar se existe a biblioteca Chart.js
    if (typeof Chart === 'undefined') {
      const chartScript = document.createElement('script');
      chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.7.1/dist/chart.min.js';
      document.head.appendChild(chartScript);
      
      // Adicionar mensagem aguardando carregamento
      const loadingMsg = document.createElement('div');
      loadingMsg.className = 'chart-loading-message';
      loadingMsg.textContent = 'Carregando gráficos...';
      chartsContainer.prepend(loadingMsg);
      
      // Tentar novamente quando Chart.js estiver carregado
      chartScript.onload = function() {
        console.log("Chart.js carregado com sucesso!");
        if (loadingMsg.parentNode) {
          loadingMsg.parentNode.removeChild(loadingMsg);
        }
        // Recarregar dados do dashboard
        setTimeout(() => {
          const activePeriod = document.querySelector('.period-btn.active')?.getAttribute('data-period') || 'current-month';
          loadDashboardData(activePeriod, true);
        }, 500);
      };
    }
    
    // Adicionar estilos
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .charts-container {
        margin-top: 20px;
      }
      .charts-row {
        display: flex;
        gap: 20px;
        margin-bottom: 20px;
      }
      .chart-box {
        flex: 1;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        padding: 15px;
        min-height: 350px;
      }
      .chart-header {
        margin-bottom: 15px;
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
      }
      .chart-header h3 {
        margin: 0;
        font-size: 16px;
        color: #333;
      }
      .chart-body {
        height: 300px;
        position: relative;
      }
      .chart-loading-message {
        text-align: center;
        padding: 20px;
        background: #f8f9fa;
        margin-bottom: 20px;
        border-radius: 8px;
      }
      
      @media (max-width: 768px) {
        .charts-row {
          flex-direction: column;
        }
      }
    `;
    document.head.appendChild(styleElement);
    
    // Adicionar ao DOM
    dashboardContent.appendChild(chartsContainer);
  }
  
  /**
   * Renderiza gráfico de distribuição por status
   * @param {Array} statusData - Dados de status
   */
  function renderStatusChart(statusData) {
    if (!statusData || !Array.isArray(statusData) || statusData.length === 0) {
      console.warn("Dados de status inválidos:", statusData);
      statusData = [
        {label: 'Pendente', count: 0},
        {label: 'Concluído', count: 0},
        {label: 'Verificado', count: 0}
      ];
    }
    
    const chartCanvas = document.getElementById('status-chart');
    if (!chartCanvas) {
      console.warn("Canvas #status-chart não encontrado!");
      return;
    }
    
    // Verificar se Chart.js está disponível
    if (typeof Chart === 'undefined') {
      console.warn("Chart.js não está disponível!");
      return;
    }
    
    try {
      // Destruir instância anterior se existir
      if (chartInstances.statusChart) {
        chartInstances.statusChart.destroy();
      }
      
      // Preparar dados
      const labels = statusData.map(item => item.label || 'Desconhecido');
      const counts = statusData.map(item => item.count || 0);
      const colors = ['#4CAF50', '#FFC107', '#2196F3', '#F44336', '#9C27B0', '#FF9800'];
      
      // Criar nova instância
      const ctx = chartCanvas.getContext('2d');
      chartInstances.statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: counts,
            backgroundColor: colors.slice(0, labels.length),
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                boxWidth: 12
              }
            }
          },
          cutout: '65%',
          animation: {
            animateScale: true
          }
        }
      });
      
      console.log("Gráfico de status renderizado com sucesso");
    } catch (error) {
      console.error("Erro ao renderizar gráfico de status:", error);
    }
  }
  
  /**
   * Renderiza gráfico de categorias de problema
   * @param {Array} categoryData - Dados de categorias
   */
  function renderProblemCategoriesChart(categoryData) {
    if (!categoryData || !Array.isArray(categoryData) || categoryData.length === 0) {
      console.warn("Dados de categorias inválidos:", categoryData);
      categoryData = [
        {label: 'Motor', count: 0},
        {label: 'Elétrico', count: 0},
        {label: 'Hidráulico', count: 0}
      ];
    }
    
    const chartCanvas = document.getElementById('problem-categories-chart');
    if (!chartCanvas) {
      console.warn("Canvas #problem-categories-chart não encontrado!");
      return;
    }
    
    // Verificar se Chart.js está disponível
    if (typeof Chart === 'undefined') {
      console.warn("Chart.js não está disponível!");
      return;
    }
    
    try {
      // Destruir instância anterior se existir
      if (chartInstances.categoryChart) {
        chartInstances.categoryChart.destroy();
      }
      
      // Filtrar para mostrar apenas as 6 principais categorias + "Outros"
      let filteredData = [...categoryData];
      if (filteredData.length > 6) {
        const topCategories = filteredData
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        
        const otherCategories = filteredData
          .sort((a, b) => b.count - a.count)
          .slice(5);
        
        const otherCount = otherCategories.reduce((sum, item) => sum + (item.count || 0), 0);
        filteredData = [
          ...topCategories,
          { label: 'Outros', count: otherCount }
        ];
      }
      
      // Preparar dados
      const labels = filteredData.map(item => item.label || 'Desconhecido');
      const counts = filteredData.map(item => item.count || 0);
      
      // Gerar cores para o gráfico
      const colors = generateColorPalette(labels.length);
      
      // Criar nova instância
      const ctx = chartCanvas.getContext('2d');
      chartInstances.categoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            data: counts,
            backgroundColor: colors,
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              }
            },
            y: {
              beginAtZero: true
            }
          }
        }
      });
      
      console.log("Gráfico de categorias renderizado com sucesso");
    } catch (error) {
      console.error("Erro ao renderizar gráfico de categorias:", error);
    }
  }
  
  /**
   * Renderiza gráfico de tendência mensal
   * @param {Array} trendData - Dados de tendência
   */
  function renderMonthlyTrendChart(trendData) {
    if (!trendData || !Array.isArray(trendData) || trendData.length === 0) {
      console.warn("Dados de tendência inválidos:", trendData);
      // Criar dados padrão para os últimos 6 meses
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const today = new Date();
      trendData = [];
      
      for (let i = 5; i >= 0; i--) {
        const month = (today.getMonth() - i + 12) % 12;
        trendData.push({
          label: months[month],
          count: 0
        });
      }
    }
    
    const chartCanvas = document.getElementById('monthly-trend-chart');
    if (!chartCanvas) {
      console.warn("Canvas #monthly-trend-chart não encontrado!");
      return;
    }
    
    // Verificar se Chart.js está disponível
    if (typeof Chart === 'undefined') {
      console.warn("Chart.js não está disponível!");
      return;
    }
    
    try {
      // Destruir instância anterior se existir
      if (chartInstances.trendChart) {
        chartInstances.trendChart.destroy();
      }
      
      // Preparar dados
      const labels = trendData.map(item => item.label || '');
      const counts = trendData.map(item => item.count || 0);
      
      // Criar nova instância
      const ctx = chartCanvas.getContext('2d');
      chartInstances.trendChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Manutenções',
            data: counts,
            borderColor: '#3f51b5',
            backgroundColor: 'rgba(63, 81, 181, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: '#3f51b5',
            pointRadius: 4,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0
              }
            }
          }
        }
      });
      
      console.log("Gráfico de tendência mensal renderizado com sucesso");
    } catch (error) {
      console.error("Erro ao renderizar gráfico de tendência mensal:", error);
    }
  }
  
  /**
   * Renderiza gráfico de distribuição por área
   * @param {Array} areaData - Dados de áreas
   */
  function renderAreaDistributionChart(areaData) {
    if (!areaData || !Array.isArray(areaData) || areaData.length === 0) {
      console.warn("Dados de área inválidos:", areaData);
      areaData = [
        {label: 'Área Interna', count: 0},
        {label: 'Área Externa', count: 0}
      ];
    }
    
    const chartCanvas = document.getElementById('area-distribution-chart');
    if (!chartCanvas) {
      console.warn("Canvas #area-distribution-chart não encontrado!");
      return;
    }
    
    // Verificar se Chart.js está disponível
    if (typeof Chart === 'undefined') {
      console.warn("Chart.js não está disponível!");
      return;
    }
    
    try {
      // Destruir instância anterior se existir
      if (chartInstances.areaChart) {
        chartInstances.areaChart.destroy();
      }
      
      // Preparar dados
      const labels = areaData.map(item => item.label || 'Não especificado');
      const counts = areaData.map(item => item.count || 0);
      
      // Criar nova instância
      const ctx = chartCanvas.getContext('2d');
      chartInstances.areaChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            data: counts,
            backgroundColor: ['#2196F3', '#FF9800'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                boxWidth: 12
              }
            }
          },
          animation: {
            animateRotate: true
          }
        }
      });
      
      console.log("Gráfico de distribuição por área renderizado com sucesso");
    } catch (error) {
      console.error("Erro ao renderizar gráfico de distribuição por área:", error);
    }
  }
  
  /**
   * Renderiza tabela de manutenções recentes e cria se necessário
   */
  function renderRecentMaintenances(maintenances) {
    // Verificar se a seção existe, caso contrário, criar
    const dashboardContent = document.getElementById('dashboard-content');
    if (!dashboardContent) return;
    
    let recentSection = document.querySelector('.recent-maintenances-section');
    let tableBody;
    
    if (!recentSection) {
      console.log("Criando seção de manutenções recentes");
      
      // Criar seção
      recentSection = document.createElement('div');
      recentSection.className = 'recent-maintenances-section';
      
      // Criar HTML da seção
      recentSection.innerHTML = `
        <div class="section-header">
          <h2>Manutenções Recentes</h2>
          <a href="#maintenance" class="view-all-link">Ver todas</a>
        </div>
        <div class="table-container">
          <table class="recent-maintenances-table">
            <thead>
              <tr>
                <th>Equipamento</th>
                <th>Data</th>
                <th>Tipo</th>
                <th>Responsável</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="recent-maintenances-tbody">
              <tr><td colspan="5" class="text-center">Carregando...</td></tr>
            </tbody>
          </table>
        </div>
      `;
      
      // Adicionar estilos
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .recent-maintenances-section {
          margin-top: 30px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          padding: 20px;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
        }
        .section-header h2 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }
        .view-all-link {
          color: #2196F3;
          text-decoration: none;
          font-size: 14px;
        }
        .view-all-link:hover {
          text-decoration: underline;
        }
        .table-container {
          overflow-x: auto;
        }
        .recent-maintenances-table {
          width: 100%;
          border-collapse: collapse;
        }
        .recent-maintenances-table th,
        .recent-maintenances-table td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        .recent-maintenances-table th {
          color: #666;
          font-weight: 500;
        }
        .recent-maintenances-table tr:last-child td {
          border-bottom: none;
        }
        .text-center {
          text-align: center;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        .status-pending { background: #FFF3CD; color: #856404; }
        .status-completed { background: #D4EDDA; color: #155724; }
        .status-verified { background: #CCE5FF; color: #004085; }
        .status-adjusting { background: #FFF3CD; color: #856404; }
        .status-rejected { background: #F8D7DA; color: #721C24; }
        .status-default { background: #E2E3E5; color: #383D41; }
        .critical-badge {
          margin-left: 5px;
        }
      `;
      document.head.appendChild(styleElement);
      
      // Adicionar ao DOM
      dashboardContent.appendChild(recentSection);
    }
    
    tableBody = document.getElementById('recent-maintenances-tbody');
    if (!tableBody) {
      console.warn("Elemento #recent-maintenances-tbody não encontrado!");
      return;
    }
    
    // Limpar tabela
    tableBody.innerHTML = '';
    
    // Se não há dados, mostrar mensagem
    if (!maintenances || maintenances.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma manutenção recente encontrada.</td></tr>';
      return;
    }
    
    // Renderizar cada linha (limitado a 5)
    const recentMaintenances = maintenances.slice(0, 5);
    recentMaintenances.forEach(item => {
      const row = document.createElement('tr');
      
      // Determinar classe de status
      const statusClass = getStatusClass(item.status);
      
      // Formatar data
      const formattedDate = formatDate(item.dataManutencao || item.dataRegistro);
      
      // Gerar HTML da linha
      row.innerHTML = `
        <td>${item.tipoEquipamento || '-'} (${item.placaOuId || '-'})</td>
        <td>${formattedDate}</td>
        <td>${item.tipoManutencao || '-'} ${item.eCritico ? '<span class="critical-badge">⚠️</span>' : ''}</td>
        <td>${item.responsavel || '-'}</td>
        <td><span class="status-badge status-${statusClass}">${item.status || 'Pendente'}</span></td>
      `;
      
      tableBody.appendChild(row);
    });
    
    console.log("Tabela de manutenções recentes renderizada com sucesso");
  }
  
  /**
   * Gera uma paleta de cores para os gráficos
   * @param {number} count - Número de cores necessárias
   * @returns {Array} Array de cores
   */
  function generateColorPalette(count) {
    // Cores base
    const baseColors = [
      '#4CAF50', // verde
      '#2196F3', // azul
      '#FF9800', // laranja
      '#9C27B0', // roxo
      '#F44336', // vermelho
      '#00BCD4', // ciano
      '#FFC107', // amarelo
      '#3F51B5', // indigo
      '#795548', // marrom
      '#607D8B'  // cinza azulado
    ];
    
    // Se precisarmos de mais cores que o array base
    if (count <= baseColors.length) {
      return baseColors.slice(0, count);
    } else {
      // Gerar cores adicionais
      const colors = [...baseColors];
      for (let i = baseColors.length; i < count; i++) {
        // Gerar cor aleatória
        const hue = Math.floor(Math.random() * 360);
        const saturation = 65 + Math.floor(Math.random() * 25); // 65-90%
        const lightness = 45 + Math.floor(Math.random() * 15); // 45-60%
        
        colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
      }
      return colors;
    }
  }
  
  /**
   * Determina a classe CSS para um status
   * @param {string} status - Status da manutenção
   * @returns {string} Classe CSS para o status
   */
  function getStatusClass(status) {
    if (!status) return 'default';
    
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('pendente') || statusLower.includes('aguardando')) {
      return 'pending';
    } else if (statusLower.includes('verificado')) {
      return 'verified';
    } else if (statusLower.includes('concluído') || statusLower.includes('concluido')) {
      return 'completed';
    } else if (statusLower.includes('ajustes')) {
      return 'adjusting';
    } else if (statusLower.includes('reprovado')) {
      return 'rejected';
    } else {
      return 'default';
    }
  }
  
  /**
   * Formata uma data para exibição
   * @param {string} dateString - String da data
   * @returns {string} Data formatada
   */
  function formatDate(dateString) {
    if (!dateString) return '-';
    
    // Usar Utilities se disponível
    if (typeof Utilities !== 'undefined' && Utilities.formatDate) {
      return Utilities.formatDate(dateString);
    }
    
    // Implementação básica
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch(e) {
      console.error("Erro ao formatar data:", e);
      return dateString;
    }
  }
  
  /**
   * Mostra ou esconde indicador de carregamento
   * @param {boolean} show - Se deve mostrar ou esconder
   * @param {string} message - Mensagem para exibir
   */
  function showLoading(show, message = 'Carregando...') {
    // Usar Utilities se disponível
    if (typeof Utilities !== 'undefined' && Utilities.showLoading) {
      Utilities.showLoading(show, message);
      return;
    }
    
    // Implementação básica
    let loader = document.getElementById('dashboard-loader');
    const contentContainer = document.getElementById('dashboard-content');
    
    // Criar loader se não existir
    if (!loader && show) {
      loader = document.createElement('div');
      loader.id = 'dashboard-loader';
      loader.innerHTML = `
        <div class="loader-spinner"></div>
        <div id="dashboard-loader-message">${message}</div>
      `;
      
      // Adicionar estilos
      const style = document.createElement('style');
      style.textContent = `
        #dashboard-loader {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        .loader-spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 2s linear infinite;
          margin-bottom: 15px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        #dashboard-loader-message {
          color: #333;
          font-size: 16px;
        }
      `;
      document.head.appendChild(style);
      
      document.body.appendChild(loader);
    } else if (loader) {
      loader.style.display = show ? 'flex' : 'none';
      
      const loaderMessage = document.getElementById('dashboard-loader-message');
      if (loaderMessage) {
        loaderMessage.textContent = message;
      }
    }
    
    if (contentContainer) {
      contentContainer.style.opacity = show ? '0.5' : '1';
    }
  }
  
  /**
   * Mostra mensagem de erro de carregamento
   * @param {string} message - Mensagem de erro
   */
  function showLoadingError(message) {
    let errorContainer = document.getElementById('dashboard-error');
    
    if (!errorContainer) {
      // Criar container de erro
      errorContainer = document.createElement('div');
      errorContainer.id = 'dashboard-error';
      errorContainer.className = 'dashboard-error';
      
      // Adicionar estilos
      const style = document.createElement('style');
      style.textContent = `
        .dashboard-error {
          background-color: #f8d7da;
          color: #721c24;
          padding: 12px 20px;
          margin-bottom: 20px;
          border-radius: 4px;
          border-left: 4px solid #f5c6cb;
          display: none;
        }
      `;
      document.head.appendChild(style);
      
      // Adicionar ao dashboard
      const dashboardContent = document.getElementById('dashboard-content');
      if (dashboardContent) {
        dashboardContent.prepend(errorContainer);
      } else {
        document.body.prepend(errorContainer);
      }
    }
    
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    
    // Esconder após alguns segundos
    setTimeout(() => {
      errorContainer.style.display = 'none';
    }, 5000);
  }
  
  /**
   * Gera dados de exemplo para o dashboard (para testes)
   * @returns {Object} Dados mock para o dashboard
   */
  function generateMockDashboardData() {
    return {
      summary: {
        total: 42,
        pending: 15,
        completed: 24,
        critical: 8
      },
      charts: {
        status: [
          {label: 'Concluído', count: 24},
          {label: 'Pendente', count: 15},
          {label: 'Verificado', count: 8},
          {label: 'Reprovado', count: 3}
        ],
        problemCategories: [
          {label: 'Motor Principal', count: 12},
          {label: 'Sistema Hidráulico', count: 8},
          {label: 'Válvulas', count: 7},
          {label: 'Suspensão', count: 5},
          {label: 'Sistema Elétrico', count: 4},
          {label: 'Outros', count: 6}
        ],
        monthlyTrend: [
          {label: 'Jan', count: 8},
          {label: 'Fev', count: 12},
          {label: 'Mar', count: 9},
          {label: 'Abr', count: 15},
          {label: 'Mai', count: 7},
          {label: 'Jun', count: 11}
        ],
        areaDistribution: [
          {label: 'Área Interna', count: 28},
          {label: 'Área Externa', count: 14}
        ]
      },
      recentMaintenances: [
        {
          id: 'M12345',
          tipoEquipamento: 'Alta Pressão',
          placaOuId: 'EAM-3262',
          dataManutencao: new Date().toISOString(),
          tipoManutencao: 'Preventiva',
          responsavel: 'João Silva',
          status: 'Pendente',
          eCritico: false
        },
        {
          id: 'M12346',
          tipoEquipamento: 'Auto Vácuo',
          placaOuId: 'FSA-3D71',
          dataManutencao: new Date(Date.now() - 86400000).toISOString(), // ontem
          tipoManutencao: 'Corretiva',
          responsavel: 'Carlos Santos',
          status: 'Concluído',
          eCritico: true
        },
        {
          id: 'M12347',
          tipoEquipamento: 'Alta Pressão',
          placaOuId: 'EGC-2978',
          dataManutencao: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
          tipoManutencao: 'Emergencial',
          responsavel: 'Maria Oliveira',
          status: 'Verificado',
          eCritico: true
        }
      ]
    };
  }
  
  // API pública do módulo
  return {
    initialize,
    loadDashboardData,
    refreshDashboard: function(period) {
      const activePeriod = period || document.querySelector('.period-btn.active')?.getAttribute('data-period') || 'current-month';
      loadDashboardData(activePeriod, true);
    }
  };
})();

// Inicializar o dashboard quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM carregado - Inicializando Dashboard");
  
  // Verificar se estamos em uma página que precisa do dashboard
  const currentPath = window.location.pathname;
  if (currentPath.endsWith('index.html') || currentPath.endsWith('/') || 
      currentPath.includes('dashboard') || !currentPath.includes('.')) {
    // Inicializar com pequeno atraso para garantir que API esteja carregada
    setTimeout(() => {
      if (typeof Dashboard !== 'undefined') {
        Dashboard.initialize();
      } else {
        console.error("Módulo Dashboard não encontrado!");
      }
    }, 200);
  }
});

// Evento de mudança de rota SPA (para aplicações de página única)
window.addEventListener('hashchange', function() {
  const hash = window.location.hash || '#dashboard';
  
  if (hash === '#dashboard' && typeof Dashboard !== 'undefined') {
    console.log("Navegação para dashboard detectada via hash");
    Dashboard.refreshDashboard();
  }
});

// Fallback para garantir que o dashboard seja inicializado
window.onload = function() {
  if (window.Dashboard && !Dashboard.initialized) {
    console.log("Fallback - Inicializando Dashboard em window.onload");
    setTimeout(() => {
      Dashboard.initialize();
    }, 500);
  }
};
