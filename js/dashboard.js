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
  
  /**
   * Inicializa o dashboard
   */
  function initialize() {
    console.log("Dashboard.initialize() chamado");
    
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
    if (currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath.includes('dashboard')) {
      console.log("Estamos na página de dashboard - garantindo carregamento de dados");
      // Pequeno delay para garantir que DOM esteja pronto
      setTimeout(() => {
        if (!dashboardData) {
          console.log("Forçando carregamento de dados do dashboard...");
          loadDashboardData('current-month');
        }
      }, 500);
    }
  }
  
  /**
   * Configura os botões de período
   */
  function setupPeriodButtons() {
    const periodButtons = document.querySelectorAll('.period-btn');
    if (periodButtons.length === 0) {
      console.warn("Botões de período não encontrados!");
      return;
    }
    
    periodButtons.forEach(button => {
      button.addEventListener('click', function() {
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
        loadDashboardData(period);
      });
    });
    
    // Ativar botão do mês atual por padrão
    const defaultButton = document.querySelector('.period-btn[data-period="current-month"]');
    if (defaultButton) {
      defaultButton.classList.add('active');
    }
  }
  
  /**
   * Configura botão de atualização manual
   */
  function setupRefreshButton() {
    const refreshButton = document.getElementById('refresh-dashboard');
    if (refreshButton) {
      refreshButton.addEventListener('click', function() {
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
        
        // Carregar dados
        loadDashboardData(period);
      } else {
        console.log("Usando dados existentes do dashboard");
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
          if (response && response.success) {
            console.log("Dados do dashboard recebidos com sucesso");
            
            // Armazenar dados e atualizar timestamp
            dashboardData = response.data;
            lastLoadTime = currentTime;
            
            // Renderizar dados
            renderDashboard(dashboardData);
          } else {
            console.error("Erro ao carregar dados do dashboard:", response);
            showLoadingError("Erro ao carregar dados. Tente novamente mais tarde.");
          }
        })
        .catch(error => {
          console.error("Falha ao buscar dados do dashboard:", error);
          showLoadingError("Falha na comunicação com o servidor. Verifique sua conexão.");
        })
        .finally(() => {
          // Esconder indicador de carregamento
          showLoading(false);
        });
    } else {
      console.error("API.getDashboardData não disponível");
      
      // Dados de exemplo para testes quando API não está disponível
      setTimeout(() => {
        console.log("Usando dados de exemplo para o dashboard (API indisponível)");
        const mockData = generateMockDashboardData();
        dashboardData = mockData;
        lastLoadTime = currentTime;
        renderDashboard(mockData);
        showLoading(false);
      }, 1000);
    }
  }
  
  /**
   * Renderiza o dashboard com os dados recebidos
   * @param {Object} data - Dados do dashboard
   */
  function renderDashboard(data) {
    if (!data) {
      console.error("Sem dados para renderizar dashboard");
      return;
    }
    
    console.log("Renderizando dashboard com dados:", data);
    
    // Renderizar cartões de sumário
    renderSummaryCards(data.summary);
    
    // Renderizar gráficos
    renderCharts(data);
    
    // Renderizar tabela de últimas manutenções
    renderRecentMaintenances(data.recentMaintenances);
    
    // Mostrar o dashboard agora que está carregado
    const dashboardContent = document.getElementById('dashboard-content');
    if (dashboardContent) {
      dashboardContent.style.opacity = '1';
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
    
    // Atualizar cada cartão
    Object.entries(cardMap).forEach(([cardId, data]) => {
      const cardElement = document.getElementById(cardId);
      if (cardElement) {
        const countElement = cardElement.querySelector('.card-count');
        const labelElement = cardElement.querySelector('.card-label');
        
        if (countElement) countElement.textContent = data.count;
        if (labelElement) labelElement.textContent = data.label;
      }
    });
  }
  
  /**
   * Renderiza gráficos
   * @param {Object} data - Dados completos do dashboard
   */
  function renderCharts(data) {
    if (!data || !data.charts) {
      console.warn("Sem dados de gráficos para renderizar");
      return;
    }
    
    // Renderizar gráfico de status
    renderStatusChart(data.charts.status);
    
    // Renderizar gráfico de categorias de problema
    renderProblemCategoriesChart(data.charts.problemCategories);
    
    // Renderizar gráfico de tendência mensal
    renderMonthlyTrendChart(data.charts.monthlyTrend);
    
    // Renderizar gráfico de distribuição por área
    renderAreaDistributionChart(data.charts.areaDistribution);
  }
  
  /**
   * Renderiza gráfico de distribuição por status
   * @param {Array} statusData - Dados de status
   */
  function renderStatusChart(statusData) {
    const chartCanvas = document.getElementById('status-chart');
    if (!chartCanvas || !statusData) return;
    
    // Destruir instância anterior se existir
    if (chartInstances.statusChart) {
      chartInstances.statusChart.destroy();
    }
    
    // Preparar dados
    const labels = statusData.map(item => item.label);
    const counts = statusData.map(item => item.count);
    const colors = ['#4CAF50', '#FFC107', '#2196F3', '#F44336'];
    
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
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            boxWidth: 12
          }
        },
        cutoutPercentage: 65,
        animation: {
          animateScale: true
        }
      }
    });
  }
  
  /**
   * Renderiza gráfico de categorias de problema
   * @param {Array} categoryData - Dados de categorias
   */
  function renderProblemCategoriesChart(categoryData) {
    const chartCanvas = document.getElementById('problem-categories-chart');
    if (!chartCanvas || !categoryData) return;
    
    // Destruir instância anterior se existir
    if (chartInstances.categoryChart) {
      chartInstances.categoryChart.destroy();
    }
    
    // Filtrar para mostrar apenas as 6 principais categorias + "Outros"
    let filteredData = [...categoryData];
    if (filteredData.length > 6) {
      const topCategories = filteredData.slice(0, 5);
      const otherCategories = filteredData.slice(5);
      
      const otherCount = otherCategories.reduce((sum, item) => sum + item.count, 0);
      filteredData = [
        ...topCategories,
        { label: 'Outros', count: otherCount }
      ];
    }
    
    // Preparar dados
    const labels = filteredData.map(item => item.label);
    const counts = filteredData.map(item => item.count);
    
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
        legend: {
          display: false
        },
        scales: {
          xAxes: [{
            gridLines: {
              display: false
            }
          }],
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }]
        }
      }
    });
  }
  
  /**
   * Renderiza gráfico de tendência mensal
   * @param {Array} trendData - Dados de tendência
   */
  function renderMonthlyTrendChart(trendData) {
    const chartCanvas = document.getElementById('monthly-trend-chart');
    if (!chartCanvas || !trendData) return;
    
    // Destruir instância anterior se existir
    if (chartInstances.trendChart) {
      chartInstances.trendChart.destroy();
    }
    
    // Preparar dados
    const labels = trendData.map(item => item.label);
    const counts = trendData.map(item => item.count);
    
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
        legend: {
          display: false
        },
        scales: {
          xAxes: [{
            gridLines: {
              display: false
            }
          }],
          yAxes: [{
            ticks: {
              beginAtZero: true,
              precision: 0
            }
          }]
        }
      }
    });
  }
  
  /**
   * Renderiza gráfico de distribuição por área
   * @param {Array} areaData - Dados de áreas
   */
  function renderAreaDistributionChart(areaData) {
    const chartCanvas = document.getElementById('area-distribution-chart');
    if (!chartCanvas || !areaData) return;
    
    // Destruir instância anterior se existir
    if (chartInstances.areaChart) {
      chartInstances.areaChart.destroy();
    }
    
    // Preparar dados
    const labels = areaData.map(item => item.label);
    const counts = areaData.map(item => item.count);
    
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
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            boxWidth: 12
          }
        },
        animation: {
          animateRotate: true
        }
      }
    });
  }
  
  /**
   * Renderiza lista de manutenções recentes
   * @param {Array} maintenances - Lista de manutenções recentes
   */
  function renderRecentMaintenances(maintenances) {
    const tableBody = document.getElementById('recent-maintenances-tbody');
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
    const loader = document.getElementById('dashboard-loader');
    const contentContainer = document.getElementById('dashboard-content');
    const loaderMessage = document.getElementById('dashboard-loader-message');
    
    if (loader) {
      loader.style.display = show ? 'flex' : 'none';
      
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
    const errorContainer = document.getElementById('dashboard-error');
    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.style.display = 'block';
      
      // Esconder após alguns segundos
      setTimeout(() => {
        errorContainer.style.display = 'none';
      }, 5000);
    } else {
      console.error("Erro de carregamento:", message);
    }
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
    Dashboard.initialize();
  }
};
