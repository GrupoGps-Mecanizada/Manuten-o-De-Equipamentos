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
   * Limpa instâncias de gráficos anteriores
   */
  function cleanupCharts() {
    // Destroi instâncias de gráficos existentes para evitar conflitos
    if (chartInstances) {
      Object.values(chartInstances).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
          chart.destroy();
        }
      });
    }
    // Reinicializa o objeto
    chartInstances = {};
  }

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

              // Usar os dados diretamente do objeto raiz
              dashboardData = response;
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
    cleanupCharts(); // Chamar a limpeza no início
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

      // MODIFICAÇÃO: Usar maintenanceTypes e maintenanceStatuses para gráficos
      if (data.maintenanceTypes || data.maintenanceStatuses || data.equipmentRanking) {
        // Criar objeto charts com os dados disponíveis
        const chartsData = {
          status: data.maintenanceStatuses ? data.maintenanceStatuses.map(status => ({
            label: status.name,
            count: status.count
          })) : [],
          problemCategories: data.maintenanceTypes ? data.maintenanceTypes.map(type => ({
            label: type.name,
            count: type.count
          })) : [],
          areaDistribution: data.areaDistribution || [] // Mantém área se existir
          // Você pode adicionar mais gráficos aqui se necessário (ex: monthlyTrend)
        };

        // Tenta renderizar com os dados de 'charts' se existirem também
        if (data.charts && data.charts.monthlyTrend) {
            chartsData.monthlyTrend = data.charts.monthlyTrend;
        }
        if (data.charts && data.charts.areaDistribution && chartsData.areaDistribution.length === 0) {
            chartsData.areaDistribution = data.charts.areaDistribution;
        }


        renderCharts(chartsData);
      } else if (data.charts) {
        // Fallback para a estrutura antiga 'charts' se as novas não existirem
        renderCharts(data.charts);
      } else {
        console.warn("Dados de gráficos não encontrados");
        renderCharts({}); // Renderiza gráficos vazios ou com placeholders
      }

      // MODIFICAÇÃO: Usar equipmentRanking para manutenções recentes
      if (data.equipmentRanking) {
        // Adaptar equipmentRanking para o formato esperado por renderRecentMaintenances
        // Assumindo que equipmentRanking tem uma estrutura similar à de recentMaintenances
        // Se a estrutura for diferente, será necessário adaptar aqui.
        // Exemplo de adaptação (ajuste conforme a estrutura real de equipmentRanking):
        const adaptedRecentMaintenances = data.equipmentRanking.map(item => ({
            id: item.id || '-', // Precisa de um ID ou chave única
            tipoEquipamento: item.name || 'Equipamento', // Nome do equipamento
            placaOuId: item.identifier || '-', // Placa ou ID
            dataManutencao: item.lastMaintenanceDate || new Date().toISOString(), // Data da última manutenção ou data relevante
            tipoManutencao: item.maintenanceType || 'Recente', // Tipo da manutenção
            responsavel: item.responsible || '-', // Responsável
            status: item.status || 'Info', // Status
            eCritico: item.isCritical || false // Criticidade
        })).slice(0, 5); // Limitar a 5 itens

        renderRecentMaintenances(adaptedRecentMaintenances);
      } else if (data.recentMaintenances) {
        // Fallback para a estrutura antiga 'recentMaintenances'
        renderRecentMaintenances(data.recentMaintenances);
      } else {
        console.warn("Dados de manutenções recentes não encontrados");
        renderRecentMaintenances([]); // Renderiza tabela vazia
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
      'pending-verification': { count: summary.pending || 0, label: 'Aguardando Verificação' }, // Mudou de pending-maintenance
      'completed-verifications': { count: summary.completed || 0, label: 'Verificações Concluídas' }, // Mudou de completed-maintenance
      'critical-maintenance': { count: summary.critical || 0, label: 'Manutenções Críticas' }
    };

    // Verificar se os cartões existem, caso contrário, criá-los
    const cardsContainer = document.querySelector('.summary-cards');
    if (!cardsContainer) {
      console.warn("Container de cartões de sumário não encontrado, tentando criar...");
      // Chama a função para criar os cards com os IDs *originais* se eles não existirem.
      // A atualização dos IDs/Labels será feita logo abaixo.
      createSummaryCardsIfNeeded();
    }

    // Atualizar cada cartão (usando os IDs do cardMap)
    Object.entries(cardMap).forEach(([cardId, data]) => {
      const cardElement = document.getElementById(cardId);
      if (cardElement) {
        const countElement = cardElement.querySelector('.card-count');
        const labelElement = cardElement.querySelector('.card-label');

        if (countElement) countElement.textContent = data.count;
        if (labelElement) labelElement.textContent = data.label;
      } else {
        // Se o card não foi encontrado, pode ser que `createSummaryCardsIfNeeded`
        // precise ser ajustado para criar cards com os novos IDs, ou que o HTML
        // base precise ser atualizado para conter os novos IDs.
        // Por enquanto, apenas logamos o aviso.
        console.warn(`Cartão ${cardId} não encontrado no DOM. Verifique o HTML ou a função createSummaryCardsIfNeeded.`);
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

    // Definir cards com os *NOVOS* IDs conforme a atualização
    const cards = [
      { id: 'total-maintenance', icon: 'clipboard-list', color: 'blue', label: 'Total de Manutenções', count: 0 },
      { id: 'pending-verification', icon: 'clock', color: 'yellow', label: 'Aguardando Verificação', count: 0 },
      { id: 'completed-verifications', icon: 'check-circle', color: 'green', label: 'Verificações Concluídas', count: 0 },
      { id: 'critical-maintenance', icon: 'exclamation-triangle', color: 'red', label: 'Manutenções Críticas', count: 0 }
    ];

    // Criar cada card
    cards.forEach(card => {
      const cardElement = document.createElement('div');
      cardElement.className = 'summary-card';
      cardElement.id = card.id; // Usando o ID correto

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
      chartData = {}; // Garante que chartData seja um objeto
    }

    // Verificar se os contêineres de gráficos existem
    checkAndCreateChartContainers();

    // Renderizar gráfico de status se dados existirem
    if (chartData.status && Array.isArray(chartData.status)) {
      renderStatusChart(chartData.status);
    } else {
      console.warn("Dados de status não encontrados ou não são um array. Renderizando gráfico vazio.");
      renderStatusChart([]); // Renderiza gráfico vazio ou com placeholder
    }

    // Renderizar gráfico de categorias de problema
    if (chartData.problemCategories && Array.isArray(chartData.problemCategories)) {
      renderProblemCategoriesChart(chartData.problemCategories);
    } else {
      console.warn("Dados de categorias de problema não encontrados ou não são um array. Renderizando gráfico vazio.");
      renderProblemCategoriesChart([]); // Renderiza gráfico vazio ou com placeholder
    }

    // Renderizar gráfico de tendência mensal
    if (chartData.monthlyTrend && Array.isArray(chartData.monthlyTrend)) {
      renderMonthlyTrendChart(chartData.monthlyTrend);
    } else {
      console.warn("Dados de tendência mensal não encontrados ou não são um array. Renderizando gráfico vazio.");
       renderMonthlyTrendChart([]); // Renderiza gráfico vazio ou com placeholder
    }

    // Renderizar gráfico de distribuição por área
    if (chartData.areaDistribution && Array.isArray(chartData.areaDistribution)) {
      renderAreaDistributionChart(chartData.areaDistribution);
    } else {
      console.warn("Dados de distribuição por área não encontrados ou não são um array. Renderizando gráfico vazio.");
       renderAreaDistributionChart([]); // Renderiza gráfico vazio ou com placeholder
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
      { row: 2, id: 'problem-categories-container', title: 'Tipos de Manutenção', canvas: 'problem-categories-chart', type: 'bar' }, // Título pode precisar de ajuste dependendo do dado real
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
        min-height: 350px; /* Ajuste para acomodar gráficos */
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
        height: 300px; /* Altura padrão do corpo do gráfico */
        position: relative;
      }
      .chart-loading-message {
        text-align: center;
        padding: 20px;
        background: #f8f9fa;
        margin-bottom: 20px;
        border-radius: 8px;
      }

      @media (max-width: 992px) { /* Ajuste breakpoint */
         .charts-row {
            flex-direction: column;
         }
         .chart-box {
             min-height: 300px; /* Reduz altura em telas menores */
         }
         .chart-body {
             height: 250px; /* Reduz altura do canvas */
         }
      }
       @media (max-width: 768px) {
         .chart-box {
             min-height: 280px;
         }
         .chart-body {
             height: 230px;
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
     const defaultData = [{label: 'Nenhum dado', count: 1}];
    if (!statusData || !Array.isArray(statusData) || statusData.length === 0) {
      console.warn("Dados de status inválidos ou vazios:", statusData);
      statusData = defaultData; // Usa dados padrão para renderizar algo
    }

    const chartCanvas = document.getElementById('status-chart');
    if (!chartCanvas) {
      console.warn("Canvas #status-chart não encontrado!");
      return;
    }

    // Verificar se Chart.js está disponível
    if (typeof Chart === 'undefined') {
      console.warn("Chart.js não está disponível!");
      // Opcional: exibir mensagem no canvas
      const ctx = chartCanvas.getContext('2d');
      ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
      ctx.textAlign = 'center';
      ctx.fillText('Biblioteca de gráficos não carregada.', chartCanvas.width / 2, chartCanvas.height / 2);
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
      const colors = statusData === defaultData ? ['#dddddd'] : generateColorPalette(labels.length); // Cinza para dados padrão

      // Criar nova instância
      const ctx = chartCanvas.getContext('2d');
      chartInstances.statusChart = new Chart(ctx, {
        type: 'doughnut',
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
              position: 'bottom',
              labels: {
                padding: 15, // Reduz padding
                boxWidth: 10 // Reduz tamanho do box
              },
               // Esconder legenda se for dado padrão
              display: statusData !== defaultData
            },
            tooltip: {
                enabled: statusData !== defaultData // Desabilitar tooltip para dados padrão
            }
          },
          cutout: '65%',
          animation: {
            animateScale: true
          }
        }
      });

      console.log("Gráfico de status renderizado.");
    } catch (error) {
      console.error("Erro ao renderizar gráfico de status:", error);
    }
  }

  /**
   * Renderiza gráfico de categorias de problema (ou Tipos de Manutenção)
   * @param {Array} categoryData - Dados de categorias/tipos
   */
  function renderProblemCategoriesChart(categoryData) {
    const defaultData = [{label: 'Nenhum dado', count: 1}];
    if (!categoryData || !Array.isArray(categoryData) || categoryData.length === 0) {
      console.warn("Dados de categorias/tipos inválidos ou vazios:", categoryData);
      categoryData = defaultData;
    }

    const chartCanvas = document.getElementById('problem-categories-chart');
    if (!chartCanvas) {
      console.warn("Canvas #problem-categories-chart não encontrado!");
      return;
    }

    if (typeof Chart === 'undefined') {
      console.warn("Chart.js não está disponível!");
       const ctx = chartCanvas.getContext('2d');
       ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
       ctx.textAlign = 'center';
       ctx.fillText('Biblioteca de gráficos não carregada.', chartCanvas.width / 2, chartCanvas.height / 2);
      return;
    }

    try {
      if (chartInstances.categoryChart) {
        chartInstances.categoryChart.destroy();
      }

      // Filtrar para mostrar apenas as N principais categorias + "Outros" se necessário
      let filteredData = [...categoryData];
      const maxBars = 6; // Número máximo de barras a exibir
      if (filteredData.length > maxBars && categoryData !== defaultData) {
          filteredData.sort((a, b) => (b.count || 0) - (a.count || 0)); // Ordena por contagem desc
          const topCategories = filteredData.slice(0, maxBars - 1);
          const otherCategories = filteredData.slice(maxBars - 1);
          const otherCount = otherCategories.reduce((sum, item) => sum + (item.count || 0), 0);

          if (otherCount > 0) {
              filteredData = [
                  ...topCategories,
                  { label: 'Outros', count: otherCount }
              ];
          } else {
              // Se a contagem de 'Outros' for 0, mostra as N primeiras
               filteredData = filteredData.slice(0, maxBars);
          }
      }

      const labels = filteredData.map(item => item.label || 'Desconhecido');
      const counts = filteredData.map(item => item.count || 0);
      const colors = categoryData === defaultData ? ['#dddddd'] : generateColorPalette(labels.length);

      const ctx = chartCanvas.getContext('2d');
      chartInstances.categoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            data: counts,
            backgroundColor: colors,
            borderWidth: 0,
            barPercentage: 0.6, // Ajusta largura das barras
            categoryPercentage: 0.7 // Ajusta espaçamento entre categorias
          }]
        },
        options: {
          indexAxis: 'y', // Barras horizontais podem ser melhores para muitos labels
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false // Sem legenda para gráfico de barras
            },
             tooltip: {
                enabled: categoryData !== defaultData
            }
          },
          scales: {
            x: { // Eixo X (valores)
              beginAtZero: true,
               grid: {
                    display: true, // Linhas de grade no eixo X
                    drawBorder: false
                },
                ticks: {
                    precision: 0 // Garante números inteiros no eixo
                }
            },
            y: { // Eixo Y (labels)
              grid: {
                display: false // Sem linhas de grade no eixo Y
              },
              ticks: {
                  autoSkip: false // Mostra todos os labels
              }
            }
          }
        }
      });

      console.log("Gráfico de categorias/tipos renderizado.");
    } catch (error) {
      console.error("Erro ao renderizar gráfico de categorias/tipos:", error);
    }
  }


  /**
   * Renderiza gráfico de tendência mensal
   * @param {Array} trendData - Dados de tendência
   */
  function renderMonthlyTrendChart(trendData) {
    const defaultData = [{label: 'Mês', count: 0}]; // Placeholder
    if (!trendData || !Array.isArray(trendData) || trendData.length === 0) {
        console.warn("Dados de tendência inválidos ou vazios:", trendData);
        // Tenta gerar dados padrão para os últimos 6 meses se vazio
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const today = new Date();
        trendData = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            trendData.push({
                label: months[date.getMonth()],
                count: 0
            });
        }
        // Se ainda assim estiver vazio (caso extremo), usar defaultData
        if (trendData.length === 0) trendData = defaultData;
    }

    const chartCanvas = document.getElementById('monthly-trend-chart');
    if (!chartCanvas) {
      console.warn("Canvas #monthly-trend-chart não encontrado!");
      return;
    }

    if (typeof Chart === 'undefined') {
      console.warn("Chart.js não está disponível!");
       const ctx = chartCanvas.getContext('2d');
       ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
       ctx.textAlign = 'center';
       ctx.fillText('Biblioteca de gráficos não carregada.', chartCanvas.width / 2, chartCanvas.height / 2);
      return;
    }

    try {
      if (chartInstances.trendChart) {
        chartInstances.trendChart.destroy();
      }

      const labels = trendData.map(item => item.label || '');
      const counts = trendData.map(item => item.count || 0);
      const isDefault = trendData === defaultData || trendData.every(d => d.count === 0); // Verifica se são dados padrão ou zerados

      const ctx = chartCanvas.getContext('2d');
      chartInstances.trendChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Manutenções',
            data: counts,
            borderColor: isDefault ? '#cccccc' : '#3f51b5',
            backgroundColor: isDefault ? 'rgba(204, 204, 204, 0.1)' : 'rgba(63, 81, 181, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: isDefault ? '#cccccc' : '#3f51b5',
            pointRadius: isDefault ? 0 : 4, // Sem pontos se for padrão
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false // Esconde a legenda do dataset
            },
             tooltip: {
                enabled: !isDefault // Desabilita tooltip se for padrão
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
              grid: {
                  drawBorder: false
              },
              ticks: {
                precision: 0 // Números inteiros
              }
            }
          }
        }
      });

      console.log("Gráfico de tendência mensal renderizado.");
    } catch (error) {
      console.error("Erro ao renderizar gráfico de tendência mensal:", error);
    }
  }

  /**
   * Renderiza gráfico de distribuição por área
   * @param {Array} areaData - Dados de áreas
   */
  function renderAreaDistributionChart(areaData) {
    const defaultData = [{label: 'Nenhuma dado', count: 1}];
    if (!areaData || !Array.isArray(areaData) || areaData.length === 0) {
      console.warn("Dados de área inválidos ou vazios:", areaData);
      areaData = defaultData;
    }

    const chartCanvas = document.getElementById('area-distribution-chart');
    if (!chartCanvas) {
      console.warn("Canvas #area-distribution-chart não encontrado!");
      return;
    }

    if (typeof Chart === 'undefined') {
      console.warn("Chart.js não está disponível!");
       const ctx = chartCanvas.getContext('2d');
       ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
       ctx.textAlign = 'center';
       ctx.fillText('Biblioteca de gráficos não carregada.', chartCanvas.width / 2, chartCanvas.height / 2);
      return;
    }

    try {
      if (chartInstances.areaChart) {
        chartInstances.areaChart.destroy();
      }

      const labels = areaData.map(item => item.label || 'Não especificado');
      const counts = areaData.map(item => item.count || 0);
       // Usa cores padrão ou cinza se for dado padrão
      const colors = areaData === defaultData ? ['#dddddd'] : generateColorPalette(labels.length);


      const ctx = chartCanvas.getContext('2d');
      chartInstances.areaChart = new Chart(ctx, {
        type: 'pie',
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
              position: 'bottom',
              labels: {
                padding: 15,
                boxWidth: 10
              },
              display: areaData !== defaultData // Esconder legenda se for dado padrão
            },
             tooltip: {
                enabled: areaData !== defaultData
            }
          },
          animation: {
            animateRotate: true
          }
        }
      });

      console.log("Gráfico de distribuição por área renderizado.");
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
          <h2>Manutenções Recentes / Ranking Equipamentos</h2> <!-- Título ajustado -->
          <a href="#maintenance" class="view-all-link">Ver todas</a>
        </div>
        <div class="table-container">
          <table class="recent-maintenances-table">
            <thead>
              <tr>
                <th>Equipamento (ID/Placa)</th> <!-- Coluna ajustada -->
                <th>Data Ref.</th> <!-- Coluna ajustada -->
                <th>Tipo/Info</th> <!-- Coluna ajustada -->
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
          font-size: 14px; /* Tamanho de fonte menor para mais info */
        }
        .recent-maintenances-table th,
        .recent-maintenances-table td {
          padding: 8px 10px; /* Padding ajustado */
          text-align: left;
          border-bottom: 1px solid #eee;
          white-space: nowrap; /* Evita quebra de linha por padrão */
        }
        .recent-maintenances-table th {
          color: #666;
          font-weight: 500;
           background-color: #f8f9fa; /* Fundo leve para header */
        }
        .recent-maintenances-table tr:last-child td {
          border-bottom: none;
        }
         .recent-maintenances-table tr:hover {
            background-color: #f1f1f1; /* Highlight ao passar o mouse */
         }
        .text-center {
          text-align: center !important;
          white-space: normal; /* Permite quebra de linha na mensagem */
        }
        .status-badge {
          display: inline-block;
          padding: 3px 6px; /* Badge menor */
          border-radius: 4px;
          font-size: 11px; /* Fonte menor no badge */
          font-weight: 500;
          text-transform: capitalize; /* Capitaliza status */
        }
        .status-pending { background: #FFF3CD; color: #856404; } /* Amarelo */
        .status-completed { background: #D4EDDA; color: #155724; } /* Verde */
        .status-verified { background: #CCE5FF; color: #004085; } /* Azul */
        .status-adjusting { background: #FFF3CD; color: #856404; } /* Amarelo */
        .status-rejected { background: #F8D7DA; color: #721C24; } /* Vermelho */
        .status-info { background: #e2e6ea; color: #383d41; } /* Cinza para 'Info' ou outros */
        .status-default { background: #E2E3E5; color: #383D41; } /* Cinza Padrão */

        .critical-badge {
          margin-left: 5px;
          font-size: 12px;
           color: #dc3545; /* Cor vermelha para criticidade */
           display: inline-block;
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
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum dado recente encontrado.</td></tr>';
      return;
    }

    // Renderizar cada linha (limitado a 5 ou o que vier)
    const itemsToDisplay = maintenances.slice(0, 5);
    itemsToDisplay.forEach(item => {
      const row = document.createElement('tr');

      // Determinar classe de status
      const statusClass = getStatusClass(item.status);

      // Formatar data
      const formattedDate = formatDate(item.dataManutencao || item.dataRegistro || item.date); // Tenta várias chaves de data

      // Gerar HTML da linha - Ajustado para as novas colunas
      row.innerHTML = `
        <td>${item.tipoEquipamento || item.name || '-'} (${item.placaOuId || item.identifier || '-'})</td>
        <td>${formattedDate}</td>
        <td>${item.tipoManutencao || item.maintenanceType || item.info || '-'} ${item.eCritico || item.isCritical ? '<span class="critical-badge" title="Crítico">⚠️</span>' : ''}</td>
        <td>${item.responsavel || item.responsible || '-'}</td>
        <td><span class="status-badge status-${statusClass}" title="Status: ${item.status || 'N/A'}">${item.status || 'N/A'}</span></td>
      `;

      tableBody.appendChild(row);
    });

    console.log("Tabela de manutenções/ranking recentes renderizada com sucesso");
  }


  /**
   * Gera uma paleta de cores para os gráficos
   * @param {number} count - Número de cores necessárias
   * @returns {Array} Array de cores
   */
  function generateColorPalette(count) {
    // Cores base
    const baseColors = [
      '#2196F3', // azul
      '#4CAF50', // verde
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
      // Gerar cores adicionais de forma mais previsível (evita cores muito parecidas)
       const colors = [...baseColors];
       const step = 360 / (count - baseColors.length); // Distribui matizes
       const baseHue = 180; // Começa de um matiz diferente das bases

       for (let i = 0; i < count - baseColors.length; i++) {
            const hue = (baseHue + i * step) % 360;
            const saturation = 70 + Math.floor(Math.random() * 15); // 70-85%
            const lightness = 50 + Math.floor(Math.random() * 10); // 50-60%
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

    const statusLower = String(status).toLowerCase(); // Garante que seja string

    if (statusLower.includes('pendente') || statusLower.includes('aguardando') || statusLower.includes('aberto')) {
      return 'pending';
    } else if (statusLower.includes('verificado') || statusLower.includes('aprovado')) {
      return 'verified';
    } else if (statusLower.includes('concluído') || statusLower.includes('concluido') || statusLower.includes('fechado')) {
      return 'completed';
    } else if (statusLower.includes('ajustes') || statusLower.includes('ajustando') || statusLower.includes('em andamento')) {
        return 'adjusting'; // Reutilizando 'pending' visualmente ou criar uma classe nova
    } else if (statusLower.includes('reprovado') || statusLower.includes('rejeitado')) {
      return 'rejected';
    } else if (statusLower.includes('info')) { // Status genérico para ranking
        return 'info';
    } else {
      // Tenta mapear outras palavras comuns
      if (statusLower.includes('critico')) return 'rejected'; // Visual de alerta
      if (statusLower.includes('normal') || statusLower.includes('ok')) return 'completed'; // Visual de concluído
      return 'default'; // Fallback
    }
  }


  /**
   * Formata uma data para exibição
   * @param {string|Date} dateInput - String da data ou objeto Date
   * @returns {string} Data formatada (DD/MM/YYYY) ou '-'
   */
  function formatDate(dateInput) {
    if (!dateInput) return '-';

    // Usar Utilities se disponível
    if (typeof Utilities !== 'undefined' && Utilities.formatDate) {
      // Garante que a data seja passada no formato esperado por Utilities.formatDate
      try {
         return Utilities.formatDate(dateInput);
      } catch (e) {
         console.warn("Erro ao usar Utilities.formatDate, usando fallback:", e);
         // Continua para a implementação básica
      }
    }

    // Implementação básica de fallback
    try {
      let date;
      if (dateInput instanceof Date && !isNaN(dateInput)) {
         date = dateInput;
      } else {
         // Tenta converter string para Data, incluindo formatos comuns
         date = new Date(dateInput);
      }

      if (isNaN(date.getTime())) {
          console.warn("Não foi possível parsear a data:", dateInput);
          // Se for uma string, retorna a própria string (pode já estar formatada)
          return typeof dateInput === 'string' ? dateInput.split('T')[0] : '-'; // Pega apenas a parte da data se for ISO
      }

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Mês é 0-indexado
      const year = date.getFullYear();

      // Verifica se a data é válida (ex: evita 00/00/0000)
      if (year < 1900 || year > 3000) return '-';

      return `${day}/${month}/${year}`;
    } catch(e) {
      console.error("Erro ao formatar data:", e, "Input:", dateInput);
      // Retorna a string original se houver erro ou '-'
      return typeof dateInput === 'string' ? dateInput : '-';
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
       try {
          Utilities.showLoading(show, message);
          return;
       } catch (e) {
          console.warn("Erro ao usar Utilities.showLoading:", e);
          // Continua para implementação básica
       }
    }

    // Implementação básica
    let loader = document.getElementById('dashboard-loader');
    const contentContainer = document.getElementById('dashboard-content'); // Container específico do dashboard

    // Criar loader se não existir
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'dashboard-loader';
      loader.style.position = 'absolute'; // Posiciona relativo ao container pai se ele for 'relative'
      loader.style.top = '0';
      loader.style.left = '0';
      loader.style.width = '100%';
      loader.style.height = '100%';
      loader.style.backgroundColor = 'rgba(255, 255, 255, 0.85)'; // Fundo semi-transparente
      loader.style.display = 'flex';
      loader.style.flexDirection = 'column';
      loader.style.alignItems = 'center';
      loader.style.justifyContent = 'center';
      loader.style.zIndex = '10'; // Abaixo de modais, mas acima do conteúdo
      loader.style.visibility = 'hidden'; // Começa escondido
      loader.style.opacity = '0';
      loader.style.transition = 'opacity 0.3s ease, visibility 0.3s ease'; // Transição suave

      loader.innerHTML = `
        <div class="loader-spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1.5s linear infinite; margin-bottom: 15px;"></div>
        <div id="dashboard-loader-message" style="color: #333; font-size: 16px;">${message}</div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;

      // Anexa ao container do dashboard se existir, senão ao body
      const parentContainer = contentContainer || document.body;
       // Garante que o container pai tenha position relative/absolute/fixed para o loader absoluto funcionar bem
       if (contentContainer && getComputedStyle(contentContainer).position === 'static') {
           contentContainer.style.position = 'relative';
       }
      parentContainer.appendChild(loader);
    }

     // Controla visibilidade e mensagem
     const loaderMessageEl = document.getElementById('dashboard-loader-message');
     if (loaderMessageEl) {
        loaderMessageEl.textContent = message;
     }

     if (show) {
        loader.style.visibility = 'visible';
        loader.style.opacity = '1';
        if (contentContainer) contentContainer.style.pointerEvents = 'none'; // Impede interação com conteúdo atrás
     } else {
        loader.style.opacity = '0';
        loader.style.visibility = 'hidden';
        if (contentContainer) contentContainer.style.pointerEvents = 'auto'; // Permite interação novamente
     }

    // Ajusta opacidade do conteúdo do dashboard para feedback visual
    if (contentContainer) {
      contentContainer.style.opacity = show ? '0.6' : '1';
      contentContainer.style.transition = 'opacity 0.3s ease';
    }
  }


  /**
   * Mostra mensagem de erro de carregamento
   * @param {string} message - Mensagem de erro
   */
  function showLoadingError(message) {
     // Usar Utilities.showNotification se disponível
    if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
       try {
          Utilities.showNotification(message, 'error');
          return;
       } catch(e) {
          console.warn("Erro ao usar Utilities.showNotification:", e);
          // Continua para implementação básica
       }
    }

    // Implementação básica (adiciona ao topo do dashboard-content)
    let errorContainer = document.getElementById('dashboard-error-message');
    const dashboardContent = document.getElementById('dashboard-content');

    if (!dashboardContent) {
        console.error("Container #dashboard-content não encontrado para exibir erro.");
        alert("Erro no Dashboard: " + message); // Fallback para alert
        return;
    }

    if (!errorContainer) {
      errorContainer = document.createElement('div');
      errorContainer.id = 'dashboard-error-message';
      errorContainer.style.backgroundColor = '#f8d7da';
      errorContainer.style.color = '#721c24';
      errorContainer.style.padding = '12px 20px';
      errorContainer.style.marginBottom = '20px';
      errorContainer.style.borderRadius = '4px';
      errorContainer.style.border = '1px solid #f5c6cb';
      errorContainer.style.display = 'none'; // Começa escondido
      errorContainer.style.opacity = '0';
      errorContainer.style.transition = 'opacity 0.5s ease';

      dashboardContent.insertBefore(errorContainer, dashboardContent.firstChild); // Insere no topo
    }

    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    setTimeout(() => errorContainer.style.opacity = '1', 50); // Delay para transição

    // Esconder após alguns segundos
    setTimeout(() => {
        errorContainer.style.opacity = '0';
        setTimeout(() => errorContainer.style.display = 'none', 500); // Esconde após transição
    }, 6000); // Tempo de exibição aumentado
  }


  /**
   * Gera dados de exemplo para o dashboard (para testes)
   * @returns {Object} Dados mock para o dashboard
   */
  function generateMockDashboardData() {
    // Estrutura mais alinhada com as atualizações
    return {
      summary: {
        total: Math.floor(Math.random() * 100) + 20, // 20-120
        pending: Math.floor(Math.random() * 30) + 5,  // 5-35
        completed: Math.floor(Math.random() * 60) + 10, // 10-70
        critical: Math.floor(Math.random() * 15) + 2 // 2-17
      },
      // Novos campos prioritários
      maintenanceStatuses: [
        { name: 'Pendente', count: Math.floor(Math.random() * 20) + 5 },
        { name: 'Concluído', count: Math.floor(Math.random() * 40) + 10 },
        { name: 'Verificado', count: Math.floor(Math.random() * 15) + 3 },
        { name: 'Reprovado', count: Math.floor(Math.random() * 5) + 1 },
        { name: 'Em Andamento', count: Math.floor(Math.random() * 10) }
      ],
      maintenanceTypes: [
        { name: 'Preventiva', count: Math.floor(Math.random() * 30) + 10 },
        { name: 'Corretiva', count: Math.floor(Math.random() * 25) + 8 },
        { name: 'Preditiva', count: Math.floor(Math.random() * 15) + 5 },
        { name: 'Melhoria', count: Math.floor(Math.random() * 10) + 3 },
        { name: 'Inspeção', count: Math.floor(Math.random() * 20) + 7 }
      ],
      equipmentRanking: [ // Exemplo de ranking (top 5 mais manutenções)
        { id: 'EQP-001', name: 'Prensa Hidráulica PH-100', identifier: 'PH-100', count: 15, lastMaintenanceDate: new Date(Date.now() - 86400000 * 2).toISOString(), status: 'Ok', isCritical: false },
        { id: 'EQP-005', name: 'Compressor CompX', identifier: 'CPX-A', count: 12, lastMaintenanceDate: new Date(Date.now() - 86400000 * 5).toISOString(), status: 'Atenção', isCritical: true },
        { id: 'EQP-002', name: 'Esteira Transportadora ET-50', identifier: 'ET-50', count: 10, lastMaintenanceDate: new Date(Date.now() - 86400000 * 1).toISOString(), status: 'Ok', isCritical: false },
        { id: 'EQP-008', name: 'Motor Elétrico MTR-Z', identifier: 'MTR-Z', count: 8, lastMaintenanceDate: new Date(Date.now() - 86400000 * 10).toISOString(), status: 'Crítico', isCritical: true },
        { id: 'EQP-003', name: 'Robô de Solda RWS-3', identifier: 'RWS-3', count: 7, lastMaintenanceDate: new Date(Date.now() - 86400000 * 3).toISOString(), status: 'Ok', isCritical: false }
      ],
      areaDistribution: [ // Exemplo de distribuição por área
         { name: 'Produção A', count: 35 },
         { name: 'Produção B', count: 28 },
         { name: 'Almoxarifado', count: 15 },
         { name: 'Utilidades', count: 22 }
      ],
      // Dados antigos (podem coexistir ou ser derivados dos novos)
      charts: {
         // Status e ProblemCategories podem ser derivados acima
         status: [], // Derivado de maintenanceStatuses
         problemCategories: [], // Derivado de maintenanceTypes
         monthlyTrend: (() => { // Gera tendência para últimos 6 meses
              const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
              const today = new Date();
              const trend = [];
              for (let i = 5; i >= 0; i--) {
                const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
                trend.push({
                  label: months[date.getMonth()],
                  count: Math.floor(Math.random() * 20) + 5 // 5-25
                });
              }
              return trend;
         })(),
         areaDistribution: [] // Derivado de areaDistribution
      },
      recentMaintenances: [] // Derivado de equipmentRanking ou outra fonte
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
  console.log("DOM carregado - Tentando inicializar Dashboard");

  // Verifica se o elemento principal do dashboard existe na página atual
  // Isso evita inicializar em páginas que não têm o dashboard.
  const dashboardElement = document.getElementById('dashboard-content') || document.querySelector('.dashboard-container'); // Adapte o seletor se necessário

  if (dashboardElement) {
      console.log("Elemento do Dashboard encontrado. Agendando inicialização.");
    // Inicializar com pequeno atraso para garantir que API e outros scripts possam ter carregado
    setTimeout(() => {
      if (typeof Dashboard !== 'undefined') {
        Dashboard.initialize();
      } else {
        console.error("Módulo Dashboard não foi definido ou carregado a tempo!");
      }
    }, 300); // Aumentou ligeiramente o delay
  } else {
      console.log("Elemento do Dashboard não encontrado nesta página. Inicialização pulada.");
  }
});

// Evento de mudança de rota SPA (para aplicações de página única)
window.addEventListener('hashchange', function() {
  const hash = window.location.hash || '#dashboard';
  const dashboardElement = document.getElementById('dashboard-content') || document.querySelector('.dashboard-container');

  // Só atualiza se estiver na página do dashboard (verificado pelo hash E pela existência do elemento)
  if (hash === '#dashboard' && dashboardElement && typeof Dashboard !== 'undefined') {
    console.log("Navegação para dashboard detectada via hash. Atualizando...");
     // Chama refreshDashboard que força o recarregamento com o período atual
     Dashboard.refreshDashboard();
  }
});

// Fallback (menos confiável, mas pode ajudar em alguns casos)
window.addEventListener('load', function() {
  // Verifica se o dashboard existe E se ainda não foi inicializado
   const dashboardElement = document.getElementById('dashboard-content') || document.querySelector('.dashboard-container');
   if (dashboardElement && window.Dashboard && !Dashboard.initialized) { // 'initialized' precisa ser exposto ou verificado internamente
     console.warn("Fallback - Dashboard detectado mas não inicializado. Tentando inicializar em window.onload.");
     setTimeout(() => {
       Dashboard.initialize();
     }, 500);
   }
});
