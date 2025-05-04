/**
 * Sistema de Dupla Checagem de Manutenção
 * Módulo: Relatórios Avançados
 *
 * Este módulo implementa recursos avançados de relatórios:
 * - Relatórios personalizáveis com múltiplos filtros
 * - Exportação em diversos formatos (PDF, Excel, CSV, JSON)
 * - Relatórios automatizados programados
 * - Visualizações avançadas de dados (usando Chart.js)
 *
 * Dependências Opcionais:
 * - Chart.js: Necessário para renderizar gráficos.
 * - Módulo 'Reports': O módulo de relatórios existente que pode ser estendido.
 * - Módulo 'Utilities': Para notificações, loading indicators, e confirmações. Fallbacks são implementados.
 */

const AdvancedReports = (function() {
  // --- Configurações ---
  const config = {
    defaultDateRange: 30, // Dias para o relatório padrão
    maxExportLimit: 5000, // Limite de registros para exportação (informativo, não implementado na lógica de exportação de exemplo)
    // autoSaveInterval: 60000, // Intervalo para auto-salvar (ms) - Funcionalidade não implementada no código fornecido
    defaultChartColors: [
      '#1a5fb4', '#2b9348', '#f0ad4e', '#cc0000', '#0066cc',
      '#6554c0', '#ff5630', '#00b8d9', '#ffc400', '#4c9aff'
    ],
    exportFormats: {
      pdf: { label: 'PDF', icon: '📄' },
      xlsx: { label: 'Excel', icon: '📊' },
      csv: { label: 'CSV', icon: '📋' },
      json: { label: 'JSON', icon: '📝' }
    },
    localStorageKeys: {
        saved: 'advanced-reports-saved',
        scheduled: 'advanced-reports-scheduled'
    }
  };

  // --- Estado Interno ---
  let currentReport = null;
  let savedReports = [];
  let scheduledReports = [];
  let isInitialized = false;
  let chartInstances = {}; // Para manter referência das instâncias Chart.js e destruí-las

  // --- Funções Utilitárias Internas ---

  /**
   * Mostra uma notificação ao usuário. Usa Utilities.showNotification se disponível.
   * @param {string} message - A mensagem a ser exibida.
   * @param {'info'|'success'|'warning'|'error'} type - O tipo de notificação.
   */
  function notify(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`); // Log de fallback
    if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
      Utilities.showNotification(message, type);
    } else {
      // Fallback simples
      alert(`[${type.toUpperCase()}] ${message}`);
    }
  }

  /**
   * Mostra/Esconde um indicador de carregamento global. Usa Utilities.showLoading se disponível.
   * @param {boolean} show - Mostrar (true) ou esconder (false).
   * @param {string} message - Mensagem a ser exibida durante o carregamento.
   */
  function showLoading(show, message = 'Carregando...') {
    if (typeof Utilities !== 'undefined' && Utilities.showLoading) {
      Utilities.showLoading(show, message);
      return;
    }

    // Implementação fallback
    const LOADER_ID = 'advanced-reports-global-loader';
    let loader = document.getElementById(LOADER_ID);

    if (show) {
      if (!loader) {
        loader = document.createElement('div');
        loader.id = LOADER_ID;
        loader.style.cssText = `
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background-color: rgba(255, 255, 255, 0.85);
          display: flex; flex-direction: column; justify-content: center; align-items: center;
          z-index: 10001; font-family: sans-serif;
        `;
        loader.innerHTML = `
          <div style="width: 50px; height: 50px; border: 5px solid rgba(26, 95, 180, 0.2); border-radius: 50%; border-top-color: #1a5fb4; animation: adv-report-spin 1s ease-in-out infinite;"></div>
          <div style="margin-top: 15px; color: #1a5fb4; font-weight: 500;"></div>
        `;
        document.body.appendChild(loader);

        // Adicionar animação se não existir
        if (!document.getElementById('adv-report-loader-anim')) {
          const style = document.createElement('style');
          style.id = 'adv-report-loader-anim';
          style.textContent = `@keyframes adv-report-spin { to { transform: rotate(360deg); } }`;
          document.head.appendChild(style);
        }
      }
      loader.querySelector('div:last-child').textContent = message;
      loader.style.display = 'flex';
    } else if (loader) {
      loader.style.display = 'none';
    }
  }

   /**
   * Pede confirmação ao usuário. Usa Utilities.showConfirmation se disponível.
   * @param {string} message - A mensagem de confirmação.
   * @param {function} onConfirm - Callback a ser executado se o usuário confirmar.
   */
    function confirmAction(message, onConfirm) {
        if (typeof Utilities !== 'undefined' && Utilities.showConfirmation) {
            Utilities.showConfirmation(message, onConfirm);
        } else {
            // Fallback simples
            if (confirm(message)) {
                onConfirm();
            }
        }
    }

  // --- Funções Principais ---

  /**
   * Inicializa o módulo de relatórios avançados.
   */
  function initialize() {
    if (isInitialized) {
      console.log("Módulo de relatórios avançados já inicializado.");
      return;
    }
    console.log("Inicializando módulo de relatórios avançados...");

    loadPersistedData();
    createReportsButton(); // Tenta adicionar o botão à UI existente
    setupEventListeners(); // Configura listeners globais
    extendExistingReportsModule(); // Tenta estender o módulo base

    isInitialized = true;
    console.log("Módulo de relatórios avançados inicializado com sucesso.");
  }

  /**
   * Cria o botão "Relatórios Avançados" na interface, se possível.
   */
  function createReportsButton() {
    // Depende da estrutura HTML do sistema principal
    const reportsContent = document.getElementById('tab-reports'); // Assumindo que a aba de relatórios tem este ID
    if (!reportsContent) {
        console.warn("Container de relatórios (#tab-reports) não encontrado. Botão de Relatórios Avançados não será adicionado.");
        return;
    }

    if (document.getElementById('advanced-reports-button')) {
        console.log("Botão de Relatórios Avançados já existe.");
        return; // Já existe
    }

    const advancedButton = document.createElement('button');
    advancedButton.id = 'advanced-reports-button';
    advancedButton.className = 'btn btn-primary'; // Usar classes consistentes
    advancedButton.innerHTML = `<span style="margin-right:8px;">📈</span> Relatórios Avançados`;
    advancedButton.style.marginTop = '20px';
    advancedButton.addEventListener('click', openAdvancedReportsPanel);

    // Tenta inserir próximo ao botão de gerar relatório existente
    const reportSection = reportsContent.querySelector('.section'); // Tenta encontrar uma seção
    const generateButton = reportSection ? reportSection.querySelector('#generate-report') : null; // Botão padrão

    if (generateButton && generateButton.parentNode) {
        generateButton.parentNode.insertBefore(advancedButton, generateButton.nextSibling);
        generateButton.style.marginRight = '10px'; // Adiciona espaço
        console.log("Botão de Relatórios Avançados adicionado ao lado do botão existente.");
    } else if (reportSection) {
        reportSection.appendChild(advancedButton); // Fallback: adiciona ao final da seção
         console.log("Botão de Relatórios Avançados adicionado ao final da seção de relatórios.");
    } else {
         reportsContent.appendChild(advancedButton); // Fallback: adiciona diretamente ao container
         console.log("Botão de Relatórios Avançados adicionado ao container de relatórios.");
    }
  }

  /**
   * Configura listeners de eventos globais (delegação).
   */
  function setupEventListeners() {
    // Usar delegação para elementos criados dinamicamente dentro dos modais/painéis
    document.addEventListener('click', function(event) {
      const target = event.target;
      const targetClosest = (selector) => target.closest(selector); // Helper

      // Botões de Exportação (no modal simples)
      const exportBtn = targetClosest('.export-report-btn');
      if (exportBtn) {
        const format = exportBtn.dataset.format;
        if (format) {
          event.preventDefault();
          exportReport(format);
          // Fechar modal se existir (assumindo que está dentro de um modal com overlay)
          const modalOverlay = targetClosest('.modal-overlay');
          if (modalOverlay) modalOverlay.style.display = 'none';
        }
      }

      // Botão Salvar Relatório (no painel principal)
      if (target.id === 'save-report-btn') {
        event.preventDefault();
        saveCurrentReport();
      }

      // Botão Carregar Relatório (na lista de salvos)
      const loadBtn = targetClosest('.load-report-btn'); // Assumindo que botões de carregar terão essa classe
       if (!loadBtn) { // Check if it's the whole item click
           const savedItem = targetClosest('.saved-report-item');
           if (savedItem && savedItem.dataset.id) {
               event.preventDefault();
               loadReport(savedItem.dataset.id);
           }
       } else if (loadBtn.dataset.id) {
           event.preventDefault();
           loadReport(loadBtn.dataset.id);
       }


      // Botão Agendar Relatório (no painel principal)
      if (target.id === 'schedule-report-btn') {
        event.preventDefault();
        openScheduleReportModal();
      }

      // Botão Editar Agendamento (na lista de agendados)
      const editScheduleBtn = targetClosest('.edit-schedule-btn');
      if (editScheduleBtn && editScheduleBtn.dataset.id) {
          event.preventDefault();
          event.stopPropagation(); // Evita que o clique no item seja acionado
          editScheduledReport(editScheduleBtn.dataset.id);
      }

      // Botão Excluir Agendamento (na lista de agendados)
       const deleteScheduleBtn = targetClosest('.delete-schedule-btn');
       if (deleteScheduleBtn && deleteScheduleBtn.dataset.id) {
           event.preventDefault();
           event.stopPropagation(); // Evita que o clique no item seja acionado
           deleteScheduledReport(deleteScheduleBtn.dataset.id);
       }

       // Carregar relatório a partir de um agendamento clicado
       const scheduledItem = targetClosest('.scheduled-report-item');
       if (scheduledItem && !editScheduleBtn && !deleteScheduleBtn && scheduledItem.dataset.id) {
            const scheduleId = scheduledItem.dataset.id;
            const scheduledReport = scheduledReports.find(r => r.id === scheduleId);
            if (scheduledReport && scheduledReport.reportId) {
                 event.preventDefault();
                 loadReport(scheduledReport.reportId);
            }
       }

       // Botão Exportação Avançada (na UI principal, se adicionado)
        const advancedExportBtn = targetClosest('.advanced-export-button');
        if(advancedExportBtn) {
            event.preventDefault();
            openAdvancedExportModal();
        }

    });
  }

  /**
   * Estende ou modifica o módulo de relatórios base ('Reports'), se existir.
   */
  function extendExistingReportsModule() {
    if (typeof Reports !== 'undefined' && Reports.generateReport) {
      console.log("Estendendo módulo de relatórios existente...");

      // Guarda referência ao método original
      const originalGenerateReport = Reports.generateReport;

      // Sobrescreve o método original
      Reports.generateReport = function(...args) {
        console.log("Chamando Reports.generateReport original e adicionando extras...");
        // Chama o método original
        const result = originalGenerateReport.apply(this, args);

        // Poderia adicionar funcionalidades extras aqui após o relatório base ser gerado
        addAdvancedExportButtons(); // Tenta adicionar botão de exportação avançada

        return result;
      };

      // Adiciona novos métodos ao módulo Reports
      Reports.createAdvancedReport = createAdvancedReport; // Permite criação programática
      Reports.exportAdvanced = exportReportAdvanced; // Expõe exportação avançada

      console.log("Módulo de relatórios estendido com sucesso.");
    } else {
      console.warn("Módulo 'Reports' ou 'Reports.generateReport' não encontrado. O módulo avançado funcionará de forma independente.");
    }
  }

  /**
   * Adiciona botões de exportação avançada à interface principal, se possível.
   */
  function addAdvancedExportButtons() {
    // Verifica se já existe
    if (document.querySelector('.advanced-export-button')) return;

    // Tenta encontrar um grupo de botões de ação (seletor pode precisar de ajuste)
    const exportDiv = document.querySelector('.report-actions .btn-action-group'); // Exemplo de seletor mais específico
    if (!exportDiv) {
        console.warn("Container para botões de exportação avançada não encontrado.");
        return;
    }

    const advancedExportBtn = document.createElement('button');
    advancedExportBtn.className = 'btn advanced-export-button'; // Classe específica
    advancedExportBtn.innerHTML = `<span style="margin-right:5px;">🚀</span> Exportação Avançada`;
    advancedExportBtn.style.backgroundColor = '#1a5fb4'; // Pode ser melhor usar classes CSS
    advancedExportBtn.style.color = 'white';
    advancedExportBtn.style.marginLeft = '10px';

    exportDiv.appendChild(advancedExportBtn);
    // O listener já é tratado pela delegação em setupEventListeners
  }

  /**
   * Abre o painel principal de Relatórios Avançados.
   */
  function openAdvancedReportsPanel() {
    console.log("Abrindo painel de relatórios avançados...");
    let panel = document.getElementById('advanced-reports-panel');

    if (panel) {
      panel.style.display = 'flex'; // Reexibe se já existir
      return;
    }

    // --- Criação do Painel ---
    panel = document.createElement('div');
    panel.id = 'advanced-reports-panel';
    panel.className = 'advanced-reports-panel'; // Para CSS externo, se houver
    panel.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background-color: rgba(245, 247, 250, 0.98); /* Fundo ligeiramente opaco */
      z-index: 9998; /* Abaixo de modais, talvez? */
      display: flex; flex-direction: column; overflow: hidden;
      font-family: sans-serif; /* Estilo base */
    `;

    // Cabeçalho
    const header = document.createElement('div');
    header.className = 'advanced-reports-header';
    header.style.cssText = `
      padding: 15px 20px;
      background: linear-gradient(135deg, #1a5fb4 0%, #15487d 100%);
      color: white; display: flex; justify-content: space-between; align-items: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); z-index: 1; flex-shrink: 0;
    `;
    header.innerHTML = `
      <div>
        <h2 style="margin: 0; font-size: 1.5rem; font-weight: 600;">Relatórios Avançados</h2>
        <p style="margin: 5px 0 0 0; font-size: 0.9rem; opacity: 0.9;">Crie, salve e agende relatórios personalizados</p>
      </div>
      <button id="close-reports-panel" class="btn-icon" style="background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 50%; width: 36px; height: 36px; font-size: 1.5rem; cursor: pointer; line-height: 36px; text-align: center;">&times;</button>
    `;

    // Conteúdo Principal (Layout Flex)
    const content = document.createElement('div');
    content.className = 'advanced-reports-content';
    content.style.cssText = `display: flex; flex: 1; overflow: hidden;`;

    // Painel Esquerdo (Configuração)
    const leftPanel = document.createElement('div');
    leftPanel.className = 'reports-config-panel';
    leftPanel.style.cssText = `
      width: 350px; background-color: #ffffff; border-right: 1px solid #e0e0e0;
      display: flex; flex-direction: column; overflow: hidden; flex-shrink: 0;
    `;
    leftPanel.innerHTML = `
      <div class="panel-tabs" style="display: flex; border-bottom: 1px solid #e0e0e0; flex-shrink: 0;">
        <div class="panel-tab active" data-tab="new" style="flex: 1; padding: 15px; text-align: center; font-weight: 500; cursor: pointer; border-bottom: 3px solid #1a5fb4; color: #1a5fb4;">Novo Relatório</div>
        <div class="panel-tab" data-tab="saved" style="flex: 1; padding: 15px; text-align: center; font-weight: 500; cursor: pointer; color: #5e6c84; border-bottom: 3px solid transparent;">Salvos</div>
        <div class="panel-tab" data-tab="scheduled" style="flex: 1; padding: 15px; text-align: center; font-weight: 500; cursor: pointer; color: #5e6c84; border-bottom: 3px solid transparent;">Agendados</div>
      </div>
      <div class="panel-content" style="flex: 1; overflow-y: auto; padding: 20px;">
        <!-- Conteúdo da aba será carregado aqui -->
      </div>
      <div class="panel-footer" style="padding: 15px; border-top: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items:center; flex-shrink: 0; background-color: #f8f9fa;">
        <button id="export-report-btn" class="btn btn-secondary" style="padding: 8px 15px; font-size: 0.9rem; cursor: pointer;">Exportar</button>
        <button id="generate-advanced-report-btn" class="btn" style="padding: 8px 15px; font-size: 0.9rem; background-color: #1a5fb4; color: white; border: none; border-radius: 4px; cursor: pointer;">Gerar Relatório</button>
      </div>
    `;

    // Painel Direito (Visualização)
    const rightPanel = document.createElement('div');
    rightPanel.className = 'reports-preview-panel';
    rightPanel.style.cssText = `flex: 1; display: flex; flex-direction: column; overflow: hidden;`;
    rightPanel.innerHTML = `
      <div class="preview-toolbar" style="padding: 10px 20px; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; background-color: #ffffff; flex-shrink: 0;">
        <h3 style="margin: 0; font-size: 1.2rem; font-weight: 500; color: #333;">Visualização do Relatório</h3>
        <div class="toolbar-actions">
          <button id="save-report-btn" class="btn" style="padding: 6px 12px; font-size: 0.85rem; margin-right: 10px; background-color: #2b9348; color: white; border: none; border-radius: 4px; cursor: pointer;">Salvar Relatório</button>
          <button id="schedule-report-btn" class="btn" style="padding: 6px 12px; font-size: 0.85rem; background-color: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer;">Agendar</button>
        </div>
      </div>
      <div class="preview-content" style="flex: 1; overflow-y: auto; padding: 20px; background-color: #f0f2f5;">
        <div id="report-preview-container" style="background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); min-height: 500px; padding: 25px;">
          <div class="empty-report-message" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; color: #5e6c84; text-align: center;">
            <div style="font-size: 3.5rem; margin-bottom: 20px; opacity: 0.5;">📊</div>
            <h3 style="margin: 0; font-size: 1.3rem; font-weight: 500;">Nenhum relatório gerado</h3>
            <p style="margin: 10px 0 0 0; font-size: 0.95rem; opacity: 0.8;">Configure os parâmetros no painel à esquerda<br>e clique em "Gerar Relatório".</p>
          </div>
        </div>
      </div>
    `;

    // Montagem
    content.appendChild(leftPanel);
    content.appendChild(rightPanel);
    panel.appendChild(header);
    panel.appendChild(content);
    document.body.appendChild(panel);

    addReportsPanelStyles(); // Adiciona estilos CSS necessários
    setupReportsPanelEvents(panel); // Configura eventos específicos do painel
    loadNewReportPanel(); // Carrega o conteúdo da aba inicial
  }

  /**
   * Adiciona estilos CSS para o painel de relatórios.
   */
  function addReportsPanelStyles() {
    const STYLE_ID = 'advanced-reports-styles';
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    // Usando CSS real para melhor manutenibilidade
    style.textContent = `
      .advanced-reports-panel .form-label {
        display: block; margin-bottom: 6px; font-size: 0.88rem; font-weight: 500; color: #333;
      }
      .advanced-reports-panel .form-input,
      .advanced-reports-panel .form-select {
        width: 100%; padding: 9px 12px; font-size: 0.9rem; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 15px; box-sizing: border-box;
      }
      .advanced-reports-panel .form-input:focus,
      .advanced-reports-panel .form-select:focus {
        outline: none; border-color: #1a5fb4; box-shadow: 0 0 0 2px rgba(26, 95, 180, 0.2);
      }
      .advanced-reports-panel .form-select {
        appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%235e6c84' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
        background-repeat: no-repeat; background-position: right 10px center; background-size: 16px; padding-right: 35px;
      }
      .advanced-reports-panel .form-checkbox {
        display: flex; align-items: center; margin-bottom: 12px; cursor: pointer;
      }
      .advanced-reports-panel .form-checkbox input { margin-right: 8px; }
      .advanced-reports-panel .form-checkbox label { margin-bottom: 0; font-weight: normal; }

      .advanced-reports-panel .date-range-selector { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 15px; }
      .advanced-reports-panel .date-range-option {
        padding: 7px 11px; font-size: 0.85rem; background-color: #f0f0f0; border: 1px solid #ddd;
        border-radius: 4px; cursor: pointer; transition: all 0.2s ease; user-select: none;
      }
      .advanced-reports-panel .date-range-option:hover { background-color: #e8e8e8; }
      .advanced-reports-panel .date-range-option.active { background-color: #1a5fb4; color: white; border-color: #1a5fb4; }

      .advanced-reports-panel .filter-section { margin-bottom: 25px; }
      .advanced-reports-panel .filter-section h4 {
        font-size: 1rem; margin: 0 0 12px 0; font-weight: 600; color: #333; display: flex; align-items: center;
        border-bottom: 1px solid #eee; padding-bottom: 8px;
      }
       /* .advanced-reports-panel .filter-section h4::before { // Alternativa de estilo
         content: ''; display: inline-block; width: 4px; height: 16px; background-color: #1a5fb4; margin-right: 8px; border-radius: 2px;
       } */

      .advanced-reports-panel .visualization-selector { display: grid; grid-template-columns: repeat(auto-fit, minmax(85px, 1fr)); gap: 12px; margin-top: 10px; }
      .advanced-reports-panel .visualization-option {
         height: 75px; display: flex; flex-direction: column; align-items: center; justify-content: center;
         background-color: white; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; text-align: center; padding: 5px;
      }
      .advanced-reports-panel .visualization-option:hover { border-color: #1a5fb4; background-color: #f8faff; }
      .advanced-reports-panel .visualization-option.active {
        border-color: #1a5fb4; background-color: #e8f0fe; box-shadow: 0 0 0 2px rgba(26, 95, 180, 0.3);
      }
      .advanced-reports-panel .visualization-icon { font-size: 1.8rem; margin-bottom: 5px; line-height: 1; }
      .advanced-reports-panel .visualization-name { font-size: 0.75rem; color: #333; }

      .advanced-reports-panel .saved-report-item {
        background-color: #fff; border: 1px solid #e0e0e0; border-left: 4px solid #1a5fb4;
        border-radius: 6px; padding: 15px; margin-bottom: 15px; cursor: pointer; transition: all 0.2s ease;
      }
      .advanced-reports-panel .saved-report-item:hover { box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08); transform: translateY(-2px); border-left-color: #15487d; }
      .advanced-reports-panel .saved-report-title { font-weight: 600; font-size: 1rem; margin: 0 0 5px 0; color: #1a5fb4; }
      .advanced-reports-panel .saved-report-date { font-size: 0.8rem; color: #5e6c84; margin: 0 0 10px 0; }
      .advanced-reports-panel .saved-report-desc {
         font-size: 0.85rem; color: #444; margin: 0; line-height: 1.4;
         display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
      }

       .advanced-reports-panel .scheduled-report-item {
         background-color: #fff; border: 1px solid #e0e0e0; border-left: 4px solid #0066cc;
         border-radius: 6px; padding: 15px; margin-bottom: 15px; transition: all 0.2s ease;
       }
       .advanced-reports-panel .scheduled-report-item:hover { box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08); }
       .advanced-reports-panel .scheduled-report-title { font-weight: 600; font-size: 1rem; margin: 0 0 5px 0; color: #333; }
       .advanced-reports-panel .scheduled-report-schedule { font-size: 0.85rem; color: #0066cc; margin: 0 0 10px 0; display: flex; align-items: center; gap: 6px; }
       .advanced-reports-panel .scheduled-report-schedule svg { width: 16px; height: 16px; } /* Placeholder for icon */
       .advanced-reports-panel .scheduled-report-status {
         display: inline-block; padding: 3px 10px; font-size: 0.75rem; border-radius: 12px; font-weight: 500;
       }
       .advanced-reports-panel .scheduled-report-status.active { background-color: rgba(43, 147, 72, 0.1); color: #2b9348; }
       .advanced-reports-panel .scheduled-report-status.inactive { background-color: rgba(94, 108, 132, 0.1); color: #5e6c84; }
       .advanced-reports-panel .scheduled-report-actions button {
           background: none; border: none; cursor: pointer; padding: 5px; opacity: 0.7; transition: opacity 0.2s; font-size: 0.9rem;
       }
       .advanced-reports-panel .scheduled-report-actions button:hover { opacity: 1; color: #1a5fb4; }

      .modal-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5);
        z-index: 10000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.3s ease-in-out forwards;
      }
      .modal-container {
        width: 90%; max-width: 500px; background-color: white; border-radius: 8px;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2); animation: modalSlideIn 0.3s ease-out forwards; overflow: hidden;
        display: flex; flex-direction: column; max-height: 90vh;
      }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes modalSlideIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }

      .modal-header {
        background-color: #1a5fb4; color: white; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;
      }
      .modal-title { margin: 0; font-size: 1.2rem; font-weight: 500; }
      .modal-close {
        background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; padding: 0 5px;
        line-height: 1; opacity: 0.8; transition: opacity 0.2s;
      }
      .modal-close:hover { opacity: 1; }
      .modal-body { padding: 25px; overflow-y: auto; }
      .modal-footer {
        padding: 15px 20px; display: flex; justify-content: flex-end; gap: 10px;
        border-top: 1px solid #e0e0e0; background-color: #f8f9fa; flex-shrink: 0;
      }
      .modal-footer .btn { padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; font-size: 0.9rem; }
      .modal-footer .btn-secondary { background-color: #6c757d; color: white; }
      .modal-footer .btn-primary { background-color: #1a5fb4; color: white; } /* Generic primary */
      .modal-footer .btn-confirm-save { background-color: #2b9348; color: white; }
      .modal-footer .btn-confirm-schedule { background-color: #0066cc; color: white; }
      .modal-footer .btn-confirm-export { background-color: #1a5fb4; color: white; }

      .report-preview .report-header { margin-bottom: 25px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
      .report-preview .report-header h2 { margin: 0 0 8px 0; font-size: 1.6rem; color: #1a5fb4; }
      .report-preview .report-header p { margin: 0; font-size: 0.95rem; color: #555; }
      .report-preview .report-header strong { font-weight: 600; }
      .report-preview .report-header ul { margin: 8px 0 0 0; padding-left: 20px; font-size: 0.9rem; color: #666; list-style-type: disc; }
      .report-preview .report-header li { margin-bottom: 4px; }

      .report-preview .report-summary { margin-bottom: 30px; }
      .report-preview .report-summary h3 { margin: 0 0 15px 0; font-size: 1.2rem; color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; }
      .report-preview .report-summary > div { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; }
      .report-preview .summary-card { background-color: #f8f9fa; border-radius: 8px; padding: 18px; border-left: 5px solid; }
      .report-preview .summary-card-title { font-size: 0.9rem; color: #5e6c84; margin-bottom: 8px; }
      .report-preview .summary-card-value { font-size: 2rem; font-weight: 600; color: #333; line-height: 1.1; }

      .report-preview .report-charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 25px; margin-bottom: 30px; }
      .report-preview .chart-container { background-color: white; border-radius: 8px; padding: 20px; box-shadow: 0 1px 5px rgba(0,0,0,0.07); }
      .report-preview .chart-container h3 { margin: 0 0 15px 0; font-size: 1.05rem; color: #444; font-weight: 600; }
      .report-preview .chart-container canvas { max-height: 280px; } /* Limit chart height */

      .report-preview .report-data-table h3 { margin: 0 0 15px 0; font-size: 1.2rem; color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; }
      .report-preview .report-data-table table { width: 100%; border-collapse: collapse; background-color: white; font-size: 0.88rem; }
      .report-preview .report-data-table th, .report-preview .report-data-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #eee; }
      .report-preview .report-data-table th { background-color: #f8f9fa; font-weight: 600; color: #333; }
      .report-preview .report-data-table tr:last-child td { border-bottom: none; }
      .report-preview .report-data-table tr:hover td { background-color: #f5f5f5; }
      .report-preview .report-data-table .status-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }

      /* Estilos para o modal de exportação simples */
      .export-option { background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 8px; padding: 15px; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 15px; }
      .export-option:hover { border-color: #1a5fb4; box-shadow: 0 2px 5px rgba(0,0,0,0.1); background-color: #f0f5ff; }
      .export-option-icon { font-size: 1.8rem; width: 40px; text-align: center; }
      .export-option-label { font-weight: 500; color: #333; font-size: 0.95rem; }
      .export-option-desc { font-size: 0.8rem; color: #5e6c84; margin-top: 2px; }
    `;
    document.head.appendChild(style);
  }

  /**
   * Configura eventos específicos do painel de relatórios (abas, botões internos).
   * @param {HTMLElement} panel - O elemento do painel principal.
   */
  function setupReportsPanelEvents(panel) {
    const closeButton = panel.querySelector('#close-reports-panel');
    const tabsContainer = panel.querySelector('.panel-tabs');
    const generateButton = panel.querySelector('#generate-advanced-report-btn');
    const exportButton = panel.querySelector('#export-report-btn'); // Botão de exportar simples no rodapé

    // Botão de fechar
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        panel.style.display = 'none';
        destroyAllCharts(); // Limpa gráficos ao fechar
      });
    } else {
        console.error("Botão de fechar painel não encontrado.");
    }

    // Abas (Novo, Salvos, Agendados)
    if (tabsContainer) {
        tabsContainer.addEventListener('click', (event) => {
            const tab = event.target.closest('.panel-tab');
            if (!tab || tab.classList.contains('active')) return; // Ignora se não for tab ou já ativa

            // Remove ativação de todas
            tabsContainer.querySelectorAll('.panel-tab').forEach(t => {
                t.classList.remove('active');
                t.style.borderBottomColor = 'transparent';
                t.style.color = '#5e6c84'; // Cor inativa
            });

            // Ativa a clicada
            tab.classList.add('active');
            tab.style.borderBottomColor = '#1a5fb4'; // Cor ativa
            tab.style.color = '#1a5fb4'; // Cor ativa

            // Carrega conteúdo da aba
            const tabName = tab.dataset.tab;
            switch (tabName) {
                case 'new': loadNewReportPanel(); break;
                case 'saved': loadSavedReportsPanel(); break;
                case 'scheduled': loadScheduledReportsPanel(); break;
                default: console.warn("Aba desconhecida:", tabName);
            }
             destroyAllCharts(); // Limpa gráficos ao trocar de aba
        });
    } else {
        console.error("Container de abas não encontrado.");
    }


    // Botão Gerar Relatório
    if (generateButton) {
      generateButton.addEventListener('click', generateAdvancedReport);
    } else {
        console.error("Botão de gerar relatório não encontrado.");
    }

    // Botão Exportar (simples, no rodapé)
    if (exportButton) {
      exportButton.addEventListener('click', openExportOptionsModal); // Abre o modal simples
    } else {
         console.error("Botão de exportar (rodapé) não encontrado.");
    }
  }

  /**
   * Carrega o formulário de configuração para um novo relatório.
   */
  function loadNewReportPanel() {
    const panelContent = document.querySelector('#advanced-reports-panel .panel-content');
    if (!panelContent) {
        console.error("Container de conteúdo do painel esquerdo não encontrado.");
        return;
    }

    // Usando template literal para o HTML
    panelContent.innerHTML = `
      <div class="new-report-config fade-in">
        <div class="form-group">
          <label for="report-title" class="form-label">Título do Relatório</label>
          <input type="text" id="report-title" class="form-input" placeholder="Ex: Manutenções Mensais Críticas">
        </div>

        <div class="filter-section">
          <h4>Período</h4>
          <div class="date-range-selector">
            <div class="date-range-option active" data-range="30">Últimos 30 dias</div>
            <div class="date-range-option" data-range="90">Últimos 90 dias</div>
            <div class="date-range-option" data-range="180">Últimos 6 meses</div>
            <div class="date-range-option" data-range="365">Último ano</div>
            <div class="date-range-option" data-range="custom">Personalizado</div>
          </div>
          <div id="custom-date-range" style="display: none; margin-top: 10px; background-color: #f8f9fa; padding: 15px; border-radius: 4px; border: 1px solid #eee;">
             <div style="display: flex; gap: 15px; margin-bottom: 0;">
               <div style="flex: 1;">
                 <label for="report-start-date" class="form-label">Data Inicial</label>
                 <input type="date" id="report-start-date" class="form-input" style="margin-bottom: 0;">
               </div>
               <div style="flex: 1;">
                 <label for="report-end-date" class="form-label">Data Final</label>
                 <input type="date" id="report-end-date" class="form-input" style="margin-bottom: 0;">
               </div>
             </div>
           </div>
        </div>

        <div class="filter-section">
          <h4>Filtros de Manutenção</h4>
          <div class="form-group">
            <label for="filter-maintenance-type" class="form-label">Tipo de Manutenção</label>
            <select id="filter-maintenance-type" class="form-select">
              <option value="">Todos os tipos</option>
              <option value="Preventiva">Preventiva</option>
              <option value="Corretiva">Corretiva</option>
              <option value="Emergencial">Emergencial</option>
              <option value="Preditiva">Preditiva</option> <!-- Exemplo adicional -->
            </select>
          </div>
          <div class="form-group">
            <label for="filter-status" class="form-label">Status</label>
            <select id="filter-status" class="form-select">
              <option value="">Todos os status</option>
              <option value="Pendente">Pendente</option>
              <option value="Em Andamento">Em Andamento</option>
              <option value="Aguardando Peças">Aguardando Peças</option>
              <option value="Verificado">Verificado</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Reprovado">Reprovado</option>
              <option value="Concluído">Concluído</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
          <div class="form-group">
            <label for="filter-equipment-type" class="form-label">Tipo de Equipamento</label>
            <select id="filter-equipment-type" class="form-select">
              <option value="">Todos os equipamentos</option>
              <option value="Alta Pressão">Alta Pressão</option>
              <option value="Auto Vácuo / Hiper Vácuo">Auto Vácuo / Hiper Vácuo</option>
              <option value="Aspirador">Aspirador</option>
              <option value="Poliguindaste">Poliguindaste</option>
              <option value="Bomba">Bomba</option>
              <option value="Motor">Motor</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
           <div class="form-group">
            <label for="filter-area" class="form-label">Área</label>
            <select id="filter-area" class="form-select">
              <option value="">Todas as áreas</option>
              <option value="Área Interna Usiminas">Área Interna Usiminas</option>
              <option value="Área Externa Usiminas">Área Externa Usiminas</option>
              <option value="Oficina">Oficina</option>
            </select>
          </div>
          <div class="form-checkbox">
            <input type="checkbox" id="filter-critical" value="1">
            <label for="filter-critical">Apenas Manutenções Críticas</label>
          </div>
        </div>

        <div class="filter-section">
          <h4>Visualização do Relatório</h4>
          <p style="margin: -5px 0 15px 0; font-size: 0.85rem; color: #5e6c84;">Selecione os elementos a incluir:</p>
          <div class="visualization-selector">
            <div class="visualization-option active" data-viz="summary">
              <div class="visualization-icon">📊</div> <div class="visualization-name">Resumo</div>
            </div>
            <div class="visualization-option active" data-viz="status">
              <div class="visualization-icon">🔄</div> <div class="visualization-name">Por Status</div>
            </div>
            <div class="visualization-option active" data-viz="type">
              <div class="visualization-icon">🔧</div> <div class="visualization-name">Por Tipo</div>
            </div>
            <div class="visualization-option active" data-viz="area">
              <div class="visualization-icon">📍</div> <div class="visualization-name">Por Área</div>
            </div>
            <div class="visualization-option" data-viz="equipment">
              <div class="visualization-icon">⚙️</div> <div class="visualization-name">Por Equip.</div>
            </div>
            <div class="visualization-option" data-viz="timeline">
              <div class="visualization-icon">📅</div> <div class="visualization-name">Linha Tempo</div>
            </div>
             <div class="visualization-option active" data-viz="table">
              <div class="visualization-icon">📋</div> <div class="visualization-name">Tabela Dados</div>
            </div>
          </div>
        </div>
      </div>
    `;

    setupNewReportEvents(); // Configura listeners para os controles do formulário
  }

  /**
   * Configura eventos para os controles do formulário de novo relatório.
   */
  function setupNewReportEvents() {
    const panel = document.querySelector('#advanced-reports-panel');
    if (!panel) return;

    // Seletor de período
    const dateOptions = panel.querySelectorAll('.date-range-option');
    const customDateRangeDiv = panel.querySelector('#custom-date-range');
    if (dateOptions.length > 0 && customDateRangeDiv) {
        dateOptions.forEach(option => {
            option.addEventListener('click', function() {
                dateOptions.forEach(o => o.classList.remove('active'));
                this.classList.add('active');
                customDateRangeDiv.style.display = (this.dataset.range === 'custom') ? 'block' : 'none';
            });
        });
    } else {
        console.warn("Elementos do seletor de data não encontrados.");
    }


    // Definir datas padrão para o seletor personalizado
    const today = new Date();
    const startDateDefault = new Date();
    startDateDefault.setDate(today.getDate() - config.defaultDateRange);

    const reportStartDateInput = panel.querySelector('#report-start-date');
    const reportEndDateInput = panel.querySelector('#report-end-date');

    if (reportStartDateInput) reportStartDateInput.valueAsDate = startDateDefault;
    if (reportEndDateInput) reportEndDateInput.valueAsDate = today;

    // Seletor de visualização
    const vizOptions = panel.querySelectorAll('.visualization-option');
    if (vizOptions.length > 0) {
        vizOptions.forEach(option => {
            option.addEventListener('click', function() {
                this.classList.toggle('active');
            });
        });
    } else {
        console.warn("Opções de visualização não encontradas.");
    }

  }

  /**
   * Carrega a lista de relatórios salvos no painel esquerdo.
   */
  function loadSavedReportsPanel() {
    const panelContent = document.querySelector('#advanced-reports-panel .panel-content');
     if (!panelContent) return;

    if (savedReports.length === 0) {
      panelContent.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 40px 20px; color: #777;">
          <div style="font-size: 3rem; margin-bottom: 15px;">📂</div>
          <h3 style="margin: 0 0 10px 0; font-size: 1.1rem; font-weight: 500;">Nenhum relatório salvo</h3>
          <p style="margin: 0; font-size: 0.9rem;">Crie e salve relatórios na aba "Novo Relatório" para acesso rápido.</p>
        </div>
      `;
      return;
    }

    let reportsHtml = '<div class="saved-reports-list fade-in">';
    // Ordenar por data de criação, mais recente primeiro
    savedReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(report => {
        const date = new Date(report.createdAt || Date.now());
        const formattedDate = date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const description = report.description || 'Sem descrição.';

        reportsHtml += `
            <div class="saved-report-item" data-id="${report.id}" title="Clique para carregar este relatório">
                <h3 class="saved-report-title">${report.title || 'Relatório Sem Título'}</h3>
                <p class="saved-report-date">Salvo em: ${formattedDate}</p>
                <p class="saved-report-desc">${description}</p>
                <!-- Poderia adicionar botão de excluir aqui -->
            </div>
        `;
    });
    reportsHtml += '</div>';
    panelContent.innerHTML = reportsHtml;

    // Event listeners para carregar são tratados por delegação em setupEventListeners
  }

  /**
   * Carrega a lista de relatórios agendados no painel esquerdo.
   */
  function loadScheduledReportsPanel() {
    const panelContent = document.querySelector('#advanced-reports-panel .panel-content');
    if (!panelContent) return;

    if (scheduledReports.length === 0) {
      panelContent.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 40px 20px; color: #777;">
          <div style="font-size: 3rem; margin-bottom: 15px;">🗓️</div>
          <h3 style="margin: 0 0 10px 0; font-size: 1.1rem; font-weight: 500;">Nenhum relatório agendado</h3>
          <p style="margin: 0; font-size: 0.9rem;">Gere um relatório e clique em "Agendar" para configurar envios automáticos.</p>
        </div>
      `;
      return;
    }

    let reportsHtml = '<div class="scheduled-reports-list fade-in">';
     // Ordenar por próxima execução
    scheduledReports.sort((a, b) => new Date(a.nextRun) - new Date(b.nextRun)).forEach(schedule => {
      const nextRunDate = new Date(schedule.nextRun || Date.now());
      const formattedNextRun = nextRunDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const frequencyText = getScheduleFrequencyText(schedule.frequency);
      const statusClass = schedule.active ? 'active' : 'inactive';
      const statusText = schedule.active ? 'Ativo' : 'Inativo';

      // Ícone de repetição SVG
      const repeatIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`;

      reportsHtml += `
        <div class="scheduled-report-item" data-id="${schedule.id}" title="Clique para carregar o relatório base deste agendamento">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <h3 class="scheduled-report-title">${schedule.title || 'Agendamento Sem Título'}</h3>
            <span class="scheduled-report-status ${statusClass}">${statusText}</span>
          </div>
          <p class="scheduled-report-schedule">
             ${repeatIcon}
            <span>${frequencyText}</span>
          </p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; font-size: 0.85rem; color: #5e6c84;">
            <span>Próximo envio: ${formattedNextRun}</span>
            <div class="scheduled-report-actions">
              <button class="btn-icon edit-schedule-btn" data-id="${schedule.id}" title="Editar agendamento">✏️</button>
              <button class="btn-icon delete-schedule-btn" data-id="${schedule.id}" title="Excluir agendamento">🗑️</button>
            </div>
          </div>
        </div>
      `;
    });
    reportsHtml += '</div>';
    panelContent.innerHTML = reportsHtml;

    // Event listeners para editar/excluir são tratados por delegação
  }

  /**
   * Retorna um texto descritivo para a frequência de agendamento.
   * @param {string} frequency - Código da frequência ('daily', 'weekly', etc.).
   * @returns {string} Texto legível.
   */
  function getScheduleFrequencyText(frequency) {
    switch (frequency) {
      case 'daily': return 'Diariamente';
      case 'weekly': return 'Semanalmente';
      case 'monthly': return 'Mensalmente';
      case 'quarterly': return 'Trimestralmente';
      default: return frequency || 'Desconhecido';
    }
  }

  /**
   * Gera um relatório avançado com base na configuração atual do painel.
   */
  function generateAdvancedReport() {
    console.log("Gerando relatório avançado...");
    destroyAllCharts(); // Limpa gráficos antigos antes de gerar novo

    const reportConfig = collectReportConfig();
    if (!reportConfig) {
      notify("Não foi possível coletar a configuração do relatório.", "warning");
      return;
    }

    showLoading(true, "Gerando relatório...");

    // Simulação de busca de dados e processamento
    // Em um caso real, aqui ocorreria uma chamada API:
    // API.generateReportData(reportConfig).then(reportData => { ... }).catch(err => { ... });
    setTimeout(() => {
      try {
        // Cria dados de exemplo baseados na configuração
        const reportData = createSampleReport(reportConfig);
        currentReport = reportData; // Armazena o relatório gerado

        renderReportPreview(currentReport);
        showLoading(false);
        notify("Relatório gerado com sucesso.", "success");
      } catch (error) {
          console.error("Erro ao gerar ou renderizar relatório de exemplo:", error);
          notify("Ocorreu um erro ao gerar o relatório.", "error");
          showLoading(false);
          // Limpar preview em caso de erro
          const previewContainer = document.getElementById('report-preview-container');
           if (previewContainer) {
               previewContainer.innerHTML = `<div style="color: red; text-align: center; padding: 20px;">Erro ao gerar relatório: ${error.message}</div>`;
           }
      }
    }, 1500); // Simula 1.5s de processamento
  }

  /**
   * Coleta as configurações do relatório a partir do formulário no painel esquerdo.
   * @returns {Object|null} Objeto de configuração ou null em caso de erro.
   */
  function collectReportConfig() {
    const panel = document.querySelector('#advanced-reports-panel');
    if (!panel) return null;

    try {
        const title = panel.querySelector('#report-title')?.value || 'Relatório de Manutenções';

        // Período
        let startDate, endDate, periodLabel;
        const activeRangeOption = panel.querySelector('.date-range-option.active');
        const rangeType = activeRangeOption ? activeRangeOption.dataset.range : String(config.defaultDateRange);

        if (rangeType === 'custom') {
            const startInput = panel.querySelector('#report-start-date');
            const endInput = panel.querySelector('#report-end-date');
            if (!startInput?.value || !endInput?.value) {
                notify("Datas personalizadas inválidas. Por favor, selecione data inicial e final.", "warning");
                return null;
            }
            startDate = new Date(startInput.value + 'T00:00:00'); // Garante início do dia
            endDate = new Date(endInput.value + 'T23:59:59');   // Garante fim do dia
             if (startDate > endDate) {
                 notify("Data inicial não pode ser posterior à data final.", "warning");
                 return null;
             }
             periodLabel = `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`;
        } else {
            const days = parseInt(rangeType, 10);
            endDate = new Date(); // Hoje, fim do dia
             endDate.setHours(23, 59, 59, 999);
            startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - days + 1); // +1 porque inclui o dia de hoje
             startDate.setHours(0, 0, 0, 0); // Início do primeiro dia
             periodLabel = activeRangeOption?.textContent || `Últimos ${days} dias`;
        }

        // Filtros
        const filters = {
            maintenanceType: panel.querySelector('#filter-maintenance-type')?.value || '',
            status: panel.querySelector('#filter-status')?.value || '',
            equipmentType: panel.querySelector('#filter-equipment-type')?.value || '',
            area: panel.querySelector('#filter-area')?.value || '',
            critical: panel.querySelector('#filter-critical')?.checked || false
        };

        // Visualizações
        const visualizations = Array.from(panel.querySelectorAll('.visualization-option.active'))
                                   .map(el => el.dataset.viz);


        return {
            title,
            period: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                label: periodLabel
            },
            filters,
            visualizations,
            // Metadados gerados internamente
            id: 'report-' + Date.now(),
            createdAt: new Date().toISOString()
        };
    } catch (error) {
        console.error("Erro ao coletar configuração do relatório:", error);
        notify("Erro ao ler as configurações do formulário.", "error");
        return null;
    }
  }

  /**
   * Cria dados de exemplo para um relatório, baseado na configuração.
   * @param {Object} reportConfig - A configuração coletada.
   * @returns {Object} Objeto completo do relatório com dados de exemplo.
   */
  function createSampleReport(reportConfig) {
    // Simula a geração de dados que corresponderiam aos filtros e período
    // Em um sistema real, esses dados viriam de uma API filtrada
    const totalItems = Math.floor(Math.random() * 150) + 50; // Ex: 50 a 200 itens
    const sampleItems = generateSampleItems(totalItems, reportConfig.period.startDate, reportConfig.period.endDate, reportConfig.filters);

    // Calcula resumos e dados para gráficos a partir dos itens filtrados
    const summary = { total: sampleItems.length, completed: 0, pending: 0, critical: 0 };
    const statusCounts = {};
    const typeCounts = {};
    const areaCounts = {};
    const equipmentCounts = {};
    const timelineCounts = {}; // Por mês ou dia, dependendo do período

    const statusLabels = ['Pendente', 'Em Andamento', 'Aguardando Peças', 'Verificado', 'Aprovado', 'Reprovado', 'Concluído', 'Cancelado'];
    const typeLabels = ['Preventiva', 'Corretiva', 'Emergencial', 'Preditiva'];
    const areaLabels = ['Área Interna Usiminas', 'Área Externa Usiminas', 'Oficina'];
    const equipmentLabels = ['Alta Pressão', 'Auto Vácuo / Hiper Vácuo', 'Aspirador', 'Poliguindaste', 'Bomba', 'Motor', 'Outro'];

    // Inicializa contadores
    statusLabels.forEach(s => statusCounts[s] = 0);
    typeLabels.forEach(t => typeCounts[t] = 0);
    areaLabels.forEach(a => areaCounts[a] = 0);
    equipmentLabels.forEach(e => equipmentCounts[e] = 0);

    sampleItems.forEach(item => {
      // Summary
      if (item.status === 'Concluído') summary.completed++;
      if (item.status === 'Pendente') summary.pending++; // Simplificado
      if (item.critical) summary.critical++;

      // Chart Counts
      if (statusCounts.hasOwnProperty(item.status)) statusCounts[item.status]++;
      if (typeCounts.hasOwnProperty(item.maintenanceType)) typeCounts[item.maintenanceType]++;
      if (areaCounts.hasOwnProperty(item.area)) areaCounts[item.area]++;
      if (equipmentCounts.hasOwnProperty(item.equipmentType)) equipmentCounts[item.equipmentType]++;

      // Timeline (exemplo simples por mês)
      const itemMonth = new Date(item.date).toLocaleDateString('pt-BR', { year: '2-digit', month: 'short' });
      timelineCounts[itemMonth] = (timelineCounts[itemMonth] || 0) + 1;
    });

    // Formata dados para Chart.js
    const formatChartData = (counts) => Object.entries(counts)
                                              .filter(([label, count]) => count > 0) // Mostra apenas categorias com dados
                                              .map(([label, count]) => ({ label, count }))
                                              .sort((a, b) => b.count - a.count); // Ordena por contagem

     // Formata dados de timeline
     const sortedTimeline = Object.entries(timelineCounts)
                                 .map(([label, count]) => ({ label, count, date: new Date(label.split('/')[1], label.split('/')[0]-1) })) // Converte label em data para ordenação
                                 .sort((a, b) => a.date - b.date) // Ordena por data
                                 .map(({ label, count }) => ({ label, count })); // Remove data auxiliar


    return {
      ...reportConfig, // Mantém a configuração original
      summary,
      charts: {
        status: formatChartData(statusCounts),
        type: formatChartData(typeCounts),
        area: formatChartData(areaCounts),
        equipment: formatChartData(equipmentCounts),
        timeline: sortedTimeline
      },
      items: sampleItems // Dados brutos (ou uma amostra deles)
    };
  }

  /**
   * Gera itens de manutenção de exemplo dentro de um período e respeitando filtros (simulado).
   * @param {number} count - Número máximo de itens a gerar.
   * @param {string} startDateISO - Data inicial ISO.
   * @param {string} endDateISO - Data final ISO.
   * @param {Object} filters - Filtros aplicados.
   * @returns {Array} Array de objetos de manutenção.
   */
  function generateSampleItems(count, startDateISO, endDateISO, filters) {
    const items = [];
    const equipmentTypes = ['Alta Pressão', 'Auto Vácuo / Hiper Vácuo', 'Aspirador', 'Poliguindaste', 'Bomba', 'Motor', 'Outro'];
    const maintenanceTypes = ['Preventiva', 'Corretiva', 'Emergencial', 'Preditiva'];
    const statuses = ['Pendente', 'Em Andamento', 'Aguardando Peças', 'Verificado', 'Aprovado', 'Reprovado', 'Concluído', 'Cancelado'];
    const areas = ['Área Interna Usiminas', 'Área Externa Usiminas', 'Oficina'];
    const technicians = ['Carlos Silva', 'Ana Oliveira', 'Roberto Santos', 'Mariana Lima', 'Paulo Souza', 'Fernanda Costa', 'Lucas Pereira', 'Juliana Almeida'];
    const equipmentPrefixes = ['PUB', 'LUX', 'EZS', 'EOF', 'DSY', 'BMB', 'MTR'];

    const startDate = new Date(startDateISO);
    const endDate = new Date(endDateISO);
    const timeDiff = endDate.getTime() - startDate.getTime();

    for (let i = 0; i < count; i++) {
        const randomTime = startDate.getTime() + Math.random() * timeDiff;
        const itemDate = new Date(randomTime);

        const item = {
            id: `MAINT-${1000 + i}`,
            equipmentType: equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)],
            equipmentId: `${equipmentPrefixes[Math.floor(Math.random() * equipmentPrefixes.length)]}-${Math.floor(Math.random() * 9000) + 1000}`,
            maintenanceType: maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            technician: technicians[Math.floor(Math.random() * technicians.length)],
            area: areas[Math.floor(Math.random() * areas.length)],
            date: itemDate.toISOString().split('T')[0],
            critical: Math.random() < 0.15 // 15% de chance de ser crítica
        };

        // Simula aplicação de filtros (poderia ser mais complexo)
        let passesFilter = true;
        if (filters.maintenanceType && item.maintenanceType !== filters.maintenanceType) passesFilter = false;
        if (filters.status && item.status !== filters.status) passesFilter = false;
        if (filters.equipmentType && item.equipmentType !== filters.equipmentType) passesFilter = false;
        if (filters.area && item.area !== filters.area) passesFilter = false;
        if (filters.critical && !item.critical) passesFilter = false;

        if (passesFilter) {
            items.push(item);
        }
    }
    // Limita ao máximo se a filtragem for muito restritiva (apenas para exemplo)
    return items.slice(0, config.maxExportLimit);
  }

  /**
   * Renderiza a visualização do relatório no painel direito.
   * @param {Object} report - O objeto de relatório completo.
   */
  function renderReportPreview(report) {
    const previewContainer = document.getElementById('report-preview-container');
    if (!previewContainer) {
        console.error("Container de preview não encontrado.");
        return;
    }
     destroyAllCharts(); // Garante limpeza antes de renderizar

    const startDate = new Date(report.period.startDate);
    const endDate = new Date(report.period.endDate);
    const formatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    const startDateFormatted = startDate.toLocaleDateString('pt-BR', formatOptions);
    const endDateFormatted = endDate.toLocaleDateString('pt-BR', formatOptions);

    let html = `<div class="report-preview fade-in">`;

    // Cabeçalho
    html += `
      <div class="report-header">
        <h2>${report.title}</h2>
        <p>Período: ${startDateFormatted} a ${endDateFormatted} (${report.period.label})</p>
        <div style="margin-top: 15px; font-size: 0.9rem;">
          <strong>Filtros Aplicados:</strong>
          <ul>`;
    let hasFilters = false;
    if (report.filters.maintenanceType) { html += `<li>Tipo de Manutenção: ${report.filters.maintenanceType}</li>`; hasFilters = true; }
    if (report.filters.status) { html += `<li>Status: ${report.filters.status}</li>`; hasFilters = true; }
    if (report.filters.equipmentType) { html += `<li>Tipo de Equipamento: ${report.filters.equipmentType}</li>`; hasFilters = true; }
    if (report.filters.area) { html += `<li>Área: ${report.filters.area}</li>`; hasFilters = true; }
    if (report.filters.critical) { html += `<li>Apenas Manutenções Críticas</li>`; hasFilters = true; }
    if (!hasFilters) { html += `<li>Nenhum filtro aplicado</li>`; }
    html += `
          </ul>
        </div>
      </div>`;

    // Seção de Resumo
    if (report.visualizations.includes('summary') && report.summary) {
      html += renderSummarySection(report.summary);
    }

    // Grid de Gráficos
    const chartsToRender = [];
    if (report.visualizations.includes('status') && report.charts?.status?.length > 0) {
      chartsToRender.push({ title: 'Manutenções por Status', id: 'report-status-chart', type: 'doughnut', data: report.charts.status });
    }
    if (report.visualizations.includes('type') && report.charts?.type?.length > 0) {
      chartsToRender.push({ title: 'Manutenções por Tipo', id: 'report-type-chart', type: 'bar', data: report.charts.type });
    }
    if (report.visualizations.includes('area') && report.charts?.area?.length > 0) {
      chartsToRender.push({ title: 'Manutenções por Área', id: 'report-area-chart', type: 'pie', data: report.charts.area });
    }
     if (report.visualizations.includes('equipment') && report.charts?.equipment?.length > 0) {
      chartsToRender.push({ title: 'Manutenções por Equipamento', id: 'report-equipment-chart', type: 'bar', data: report.charts.equipment });
    }
    if (report.visualizations.includes('timeline') && report.charts?.timeline?.length > 0) {
      chartsToRender.push({ title: 'Manutenções ao Longo do Tempo', id: 'report-timeline-chart', type: 'line', data: report.charts.timeline });
    }

    if (chartsToRender.length > 0) {
      html += `<div class="report-charts-grid">`;
      chartsToRender.forEach(chart => {
        html += `
          <div class="chart-container">
            <h3>${chart.title}</h3>
            <div style="position: relative; height: 280px;"> <!-- Altura fixa para consistência -->
              <canvas id="${chart.id}"></canvas>
            </div>
          </div>`;
      });
      html += `</div>`;
    }

    // Tabela de Dados
    if (report.visualizations.includes('table') && report.items?.length > 0) {
      html += renderDataTable(report.items, 15); // Mostra os primeiros 15 na preview
    } else if (report.visualizations.includes('table')) {
        html += `<div class="report-data-table"><p style="text-align:center; color: #777; margin-top: 20px;">Nenhum dado detalhado para exibir com os filtros selecionados.</p></div>`;
    }

    html += `</div>`; // Fim de .report-preview
    previewContainer.innerHTML = html;

    // Renderiza os gráficos após o HTML estar no DOM
    renderReportCharts(chartsToRender);
  }

  /**
   * Renderiza a seção de resumo com cards.
   * @param {Object} summary - Objeto com dados de resumo.
   * @returns {string} HTML da seção de resumo.
   */
  function renderSummarySection(summary) {
    return `
      <div class="report-summary">
        <h3>Resumo do Período</h3>
        <div>
          <div class="summary-card" style="border-color: #1a5fb4;">
            <div class="summary-card-title">Total de Manutenções</div>
            <div class="summary-card-value" style="color: #1a5fb4;">${summary.total}</div>
          </div>
          <div class="summary-card" style="border-color: #2b9348;">
            <div class="summary-card-title">Concluídas</div>
            <div class="summary-card-value" style="color: #2b9348;">${summary.completed}</div>
          </div>
          <div class="summary-card" style="border-color: #f0ad4e;">
            <div class="summary-card-title">Pendentes (Exemplo)</div>
            <div class="summary-card-value" style="color: #f0ad4e;">${summary.pending}</div>
          </div>
          <div class="summary-card" style="border-color: #cc0000;">
            <div class="summary-card-title">Críticas</div>
            <div class="summary-card-value" style="color: #cc0000;">${summary.critical}</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza uma tabela HTML com os dados detalhados.
   * @param {Array} items - Array de itens de manutenção.
   * @param {number} limit - Número máximo de itens a exibir na tabela.
   * @returns {string} HTML da tabela.
   */
  function renderDataTable(items, limit = 10) {
    const itemsToShow = items.slice(0, limit);

    let html = `
      <div class="report-data-table" style="margin-top: 30px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3>Dados Detalhados</h3>
          <span style="font-size: 0.85rem; color: #5e6c84;">Mostrando ${itemsToShow.length} de ${items.length} registros</span>
        </div>
        <div style="overflow-x: auto; border: 1px solid #eee; border-radius: 8px; background-color: white;">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Equipamento</th>
                <th>Tipo Equip.</th>
                <th>Tipo Manut.</th>
                <th>Data</th>
                <th>Responsável</th>
                <th>Status</th>
                <th>Área</th>
                <th>Crítica</th>
              </tr>
            </thead>
            <tbody>
    `;

    if (itemsToShow.length === 0) {
      html += `<tr><td colspan="9" style="text-align: center; padding: 20px; color: #777;">Nenhum dado encontrado para esta seleção.</td></tr>`;
    } else {
      itemsToShow.forEach(item => {
        const statusStyle = getStatusStyle(item.status);
        const formattedDate = new Date(item.date + 'T00:00:00').toLocaleDateString('pt-BR'); // Adiciona T00:00 para evitar problemas de timezone na formatação simples

        html += `
          <tr>
            <td>${item.id}</td>
            <td>${item.equipmentId}</td>
            <td>${item.equipmentType}</td>
            <td>${item.maintenanceType}</td>
            <td>${formattedDate}</td>
            <td>${item.technician}</td>
            <td><span class="status-badge" style="background-color: ${statusStyle.bgColor}; color: ${statusStyle.color};">${item.status}</span></td>
            <td>${item.area}</td>
            <td style="text-align: center;">${item.critical ? '<span title="Manutenção Crítica" style="color: #cc0000; font-weight: bold;">⚠️</span>' : 'Não'}</td>
          </tr>
        `;
      });
    }

    html += `
            </tbody>
          </table>
        </div>
      </div>`;
    return html;
  }

   /**
    * Retorna cores de estilo para diferentes status.
    * @param {string} status - O status da manutenção.
    * @returns {{color: string, bgColor: string}} - Cores de texto e fundo.
    */
   function getStatusStyle(status) {
        const styles = {
            'Concluído': { color: '#2b9348', bgColor: 'rgba(43, 147, 72, 0.1)' },
            'Aprovado': { color: '#2b9348', bgColor: 'rgba(43, 147, 72, 0.1)' },
            'Pendente': { color: '#f0ad4e', bgColor: 'rgba(240, 173, 78, 0.1)' },
            'Aguardando Peças': { color: '#f0ad4e', bgColor: 'rgba(240, 173, 78, 0.1)' },
            'Em Andamento': { color: '#0066cc', bgColor: 'rgba(0, 102, 204, 0.1)' },
            'Verificado': { color: '#0066cc', bgColor: 'rgba(0, 102, 204, 0.1)' },
            'Reprovado': { color: '#cc0000', bgColor: 'rgba(204, 0, 0, 0.1)' },
            'Cancelado': { color: '#5e6c84', bgColor: 'rgba(94, 108, 132, 0.1)' }
        };
        return styles[status] || { color: '#5e6c84', bgColor: 'rgba(94, 108, 132, 0.1)' }; // Default
    }


  /**
   * Renderiza os gráficos usando Chart.js.
   * @param {Array} chartsToRender - Array com configurações dos gráficos a serem renderizados.
   */
  function renderReportCharts(chartsToRender) {
    if (typeof Chart === 'undefined') {
      console.error("Chart.js não está carregado. Não é possível renderizar gráficos.");
      // Opcional: Mostrar mensagem na UI
       chartsToRender.forEach(chartConfig => {
           const canvasContainer = document.getElementById(chartConfig.id)?.parentElement;
           if (canvasContainer) {
               canvasContainer.innerHTML = `<p style='color: red; font-size: 0.8rem; text-align: center;'>Chart.js não carregado.</p>`;
           }
       });
      return;
    }

    chartsToRender.forEach(chartConfig => {
      const canvas = document.getElementById(chartConfig.id);
      if (!canvas) {
        console.warn(`Canvas com ID '${chartConfig.id}' não encontrado para o gráfico '${chartConfig.title}'.`);
        return;
      }
      const ctx = canvas.getContext('2d');
       if (!ctx) {
            console.error(`Não foi possível obter o contexto 2D para o canvas '${chartConfig.id}'.`);
            return;
        }

      // Destruir gráfico anterior no mesmo canvas, se existir
      if (chartInstances[chartConfig.id]) {
          chartInstances[chartConfig.id].destroy();
      }

      const labels = chartConfig.data.map(item => item.label);
      const data = chartConfig.data.map(item => item.count);
      const backgroundColors = config.defaultChartColors.slice(0, labels.length); // Adapta cores ao número de labels

      let chartOptions = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
              legend: {
                  position: 'bottom', // Padrão, pode ser sobrescrito
                  labels: { boxWidth: 12, padding: 15, font: { size: 11 } }
              },
              tooltip: {
                  callbacks: {
                      label: function(context) {
                          let label = context.dataset.label || context.label || '';
                          if (label) { label += ': '; }
                          if (context.parsed !== null) {
                              // Formata números inteiros sem decimais
                              const value = context.parsed.y ?? context.parsed; // Para bar/line (y) ou pie/doughnut (parsed)
                              label += Number.isInteger(value) ? value : value.toFixed(2);
                          }
                          return label;
                      }
                  }
              }
          }
      };

      let chartTypeConfig;

      switch (chartConfig.type) {
        case 'doughnut':
        case 'pie':
          chartOptions.plugins.legend.position = 'right'; // Melhor para rosca/pizza
          chartTypeConfig = {
            type: chartConfig.type,
            data: { labels, datasets: [{ data, backgroundColor: backgroundColors, borderWidth: 1, borderColor: '#fff' }] },
            options: { ...chartOptions, cutout: chartConfig.type === 'doughnut' ? '60%' : '0%' }
          };
          break;
        case 'bar':
           chartOptions.plugins.legend.display = false; // Geralmente desnecessário para barra única
           chartTypeConfig = {
                type: 'bar',
                data: { labels, datasets: [{ label: 'Quantidade', data, backgroundColor: backgroundColors }] },
                options: { ...chartOptions, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
            };
            // Opcional: Gráfico de barras horizontal se muitos labels
            if (labels.length > 8) {
                chartTypeConfig.options.indexAxis = 'y';
                chartTypeConfig.options.scales = { x: { beginAtZero: true, ticks: { precision: 0 } } }; // Inverte eixos
                delete chartTypeConfig.options.scales.y; // Remove escala y
            }
          break;
        case 'line':
           chartOptions.plugins.legend.display = false;
           chartTypeConfig = {
                type: 'line',
                data: { labels, datasets: [{ label: 'Manutenções', data, fill: true, backgroundColor: 'rgba(26, 95, 180, 0.1)', borderColor: '#1a5fb4', tension: 0.3 }] },
                options: { ...chartOptions, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
            };
          break;
        default:
          console.warn(`Tipo de gráfico não suportado: ${chartConfig.type}`);
          return;
      }

      try {
            chartInstances[chartConfig.id] = new Chart(ctx, chartTypeConfig);
      } catch (error) {
            console.error(`Erro ao criar gráfico ${chartConfig.id}:`, error);
             if (canvas.parentElement) {
                 canvas.parentElement.innerHTML = `<p style='color: orange; font-size: 0.8rem; text-align: center;'>Erro ao renderizar gráfico.</p>`;
             }
      }

    });
  }

  /**
   * Destrói todas as instâncias de Chart.js ativas para liberar memória.
   */
    function destroyAllCharts() {
        Object.keys(chartInstances).forEach(chartId => {
            if (chartInstances[chartId]) {
                chartInstances[chartId].destroy();
                delete chartInstances[chartId];
            }
        });
        // console.log("Gráficos anteriores destruídos.");
    }


  /**
   * Abre um modal simples para seleção do formato de exportação.
   */
  function openExportOptionsModal() {
    if (!currentReport) {
      notify("Nenhum relatório ativo para exportar. Gere um relatório primeiro.", "warning");
      return;
    }

    const modalId = 'export-options-modal';
    let modal = document.getElementById(modalId);
     if (modal) {
         // Se já existe, apenas remove e recria para garantir estado limpo
         modal.parentElement.remove(); // Remove o overlay
     }


    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    modal = document.createElement('div');
    modal.className = 'modal-container';
    modal.id = modalId;
    modal.style.maxWidth = '450px'; // Tamanho menor para este modal

    let optionsHtml = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 10px;">';
    Object.entries(config.exportFormats).forEach(([format, info]) => {
      optionsHtml += `
        <div class="export-option export-report-btn" data-format="${format}" role="button" tabindex="0">
           <div class="export-option-icon">${info.icon}</div>
           <div>
             <div class="export-option-label">${info.label}</div>
             <div class="export-option-desc">Exportar como ${info.label}</div>
           </div>
         </div>
      `;
    });
    optionsHtml += `</div>`;


    modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">Exportar Relatório</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <p style="margin-top: 0; color: #5e6c84; font-size: 0.9rem;">Selecione o formato desejado:</p>
        ${optionsHtml}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary cancel-export-btn">Cancelar</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Eventos do modal
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('.cancel-export-btn');
    const closeAction = () => overlay.remove();

    closeBtn?.addEventListener('click', closeAction);
    cancelBtn?.addEventListener('click', closeAction);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAction();
    });
    // Listeners para as opções de formato são tratados por delegação
  }

  /**
   * Executa a exportação simples do relatório atual.
   * @param {string} format - Formato de exportação ('pdf', 'xlsx', etc.).
   */
  function exportReport(format) {
    if (!currentReport) {
      notify("Nenhum relatório ativo para exportar.", "warning");
      return;
    }
    if (!config.exportFormats[format]) {
      console.error(`Formato de exportação inválido: ${format}`);
      notify("Formato de exportação inválido selecionado.", "error");
      return;
    }

    const formatLabel = config.exportFormats[format].label;
    showLoading(true, `Exportando como ${formatLabel}...`);
    console.log(`Iniciando exportação do relatório ID ${currentReport.id} como ${format}...`);

    // --- Simulação de Exportação ---
    // Em um sistema real, aqui ocorreria uma chamada API
    // Ex: API.exportReport(currentReport.id, format).then(fileData => { ... download file ... });
    setTimeout(() => {
      showLoading(false);
      notify(`Relatório exportado com sucesso como ${formatLabel}. (Simulação)`, "success");
      // Simular download
       try {
            const filename = `${currentReport.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'relatorio'}_${new Date().toISOString().split('T')[0]}.${format}`;
            const content = format === 'json' ? JSON.stringify(currentReport, null, 2) : `Conteúdo de exemplo para ${filename}`;
            const mimeType = { pdf: 'application/pdf', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', csv: 'text/csv', json: 'application/json' }[format];
            const blob = new Blob([content], { type: mimeType });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link); // Necessário para Firefox
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error("Erro ao simular download:", error);
            notify("Ocorreu um erro durante a simulação de download.", "error");
        }
    }, 2000);
  }

  /**
   * Inicia o processo de salvar o relatório atual (abre modal de confirmação/nome).
   */
  function saveCurrentReport() {
    if (!currentReport) {
      notify("Nenhum relatório ativo para salvar. Gere um relatório primeiro.", "warning");
      return;
    }
    openSaveReportModal();
  }

  /**
   * Abre o modal para nomear e descrever o relatório antes de salvar.
   */
  function openSaveReportModal() {
     const modalId = 'save-report-modal';
     let modal = document.getElementById(modalId);
      if (modal) {
          modal.parentElement.remove(); // Remove o overlay se já existir
      }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    modal = document.createElement('div');
    modal.className = 'modal-container';
    modal.id = modalId;

    modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">Salvar Relatório</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label for="save-report-title" class="form-label">Título do Relatório Salvo</label>
          <input type="text" id="save-report-title" class="form-input" value="${currentReport.title || 'Relatório Personalizado'}" required>
        </div>
        <div class="form-group">
          <label for="save-report-description" class="form-label">Descrição (Opcional)</label>
          <textarea id="save-report-description" class="form-input" rows="3" placeholder="Adicione uma breve descrição sobre este relatório..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary cancel-save-btn">Cancelar</button>
        <button class="btn btn-confirm-save confirm-save-btn">Salvar</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Eventos do modal
    const titleInput = modal.querySelector('#save-report-title');
    const descInput = modal.querySelector('#save-report-description');
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('.cancel-save-btn');
    const confirmBtn = modal.querySelector('.confirm-save-btn');
    const closeAction = () => overlay.remove();

    closeBtn?.addEventListener('click', closeAction);
    cancelBtn?.addEventListener('click', closeAction);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAction();
    });

    confirmBtn?.addEventListener('click', () => {
      const title = titleInput.value.trim();
      if (!title) {
        notify("O título do relatório é obrigatório.", "warning");
        titleInput.focus();
        titleInput.style.borderColor = 'red'; // Feedback visual
        return;
      }
       titleInput.style.borderColor = ''; // Reseta feedback

      const description = descInput.value.trim();
      const savedReport = {
        ...currentReport, // Copia toda a configuração e dados do relatório atual
        title,           // Sobrescreve com o título fornecido
        description,
        // Garante um ID único e data de salvamento, diferente do relatório original gerado
        id: 'saved-' + Date.now(),
        savedAt: new Date().toISOString() // Diferente de createdAt (geração)
      };

      // Adiciona ao início da lista (mais recentes primeiro)
      savedReports.unshift(savedReport);
      persistData(); // Salva no localStorage
      closeAction(); // Fecha o modal
      notify("Relatório salvo com sucesso!", "success");

      // Atualiza o painel de salvos se estiver visível
      const activeTab = document.querySelector('#advanced-reports-panel .panel-tab.active');
      if (activeTab && activeTab.dataset.tab === 'saved') {
        loadSavedReportsPanel();
      }
    });
  }

  /**
   * Carrega um relatório salvo na área de visualização e configuração.
   * @param {string} reportId - O ID do relatório salvo.
   */
  function loadReport(reportId) {
    const reportToLoad = savedReports.find(r => r.id === reportId);

    if (!reportToLoad) {
      notify(`Relatório salvo com ID ${reportId} não encontrado.`, "error");
      return;
    }

    console.log(`Carregando relatório salvo: ${reportToLoad.title} (ID: ${reportId})`);
     destroyAllCharts(); // Limpa gráficos antes de carregar

    currentReport = { ...reportToLoad }; // Define como relatório atual (cria cópia para evitar mutação acidental do salvo)

    // Renderiza na preview
    renderReportPreview(currentReport);

    // Tenta atualizar o painel de configuração (se a aba 'new' estiver ativa ou for selecionada)
    // É mais seguro atualizar o painel apenas se a aba 'new' for explicitamente selecionada após o load.
    // Por enquanto, apenas carregamos e renderizamos. O usuário pode gerar de novo se quiser.

    notify(`Relatório "${currentReport.title}" carregado.`, "success");

    // Opcional: Mudar para a aba 'Novo Relatório' para permitir re-geração/ajustes
    const newReportTab = document.querySelector('#advanced-reports-panel .panel-tab[data-tab="new"]');
    if (newReportTab && !newReportTab.classList.contains('active')) {
         // Simula clique para também carregar o painel de configuração e atualizar os controles
         newReportTab.click();
         // Atraso pequeno para garantir que o painel foi carregado antes de atualizar
         setTimeout(() => updateConfigPanelFromReport(currentReport), 100);
    } else if (newReportTab) {
        // Se a aba 'Novo' já estava ativa, apenas atualiza o painel
        updateConfigPanelFromReport(currentReport);
    }
  }

  /**
   * Atualiza os controles do formulário no painel esquerdo com base em um relatório carregado.
   * @param {Object} report - O objeto de relatório carregado.
   */
  function updateConfigPanelFromReport(report) {
     const panel = document.querySelector('#advanced-reports-panel .new-report-config');
     if (!panel) {
         console.warn("Painel de configuração de novo relatório não encontrado para atualização.");
         return;
     }
     console.log("Atualizando painel de configuração com dados do relatório carregado.");

    try {
        // Título
        const titleInput = panel.querySelector('#report-title');
        if (titleInput) titleInput.value = report.title || '';

        // Período
        const startDate = new Date(report.period.startDate);
        const endDate = new Date(report.period.endDate);
        const reportStartDateInput = panel.querySelector('#report-start-date');
        const reportEndDateInput = panel.querySelector('#report-end-date');
        const dateOptions = panel.querySelectorAll('.date-range-option');
        const customDateRangeDiv = panel.querySelector('#custom-date-range');

        if (reportStartDateInput) reportStartDateInput.valueAsDate = startDate;
        if (reportEndDateInput) reportEndDateInput.valueAsDate = endDate;

        // Tenta encontrar a opção de range correspondente (lógica simplificada)
        // A melhor abordagem seria armazenar o 'data-range' original no relatório salvo
        let matchedRange = 'custom'; // Assume personalizado como fallback
        if (report.period.label.includes('30 dias')) matchedRange = '30';
        else if (report.period.label.includes('90 dias')) matchedRange = '90';
        else if (report.period.label.includes('6 meses')) matchedRange = '180';
        else if (report.period.label.includes('1 ano')) matchedRange = '365';

        dateOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.range === matchedRange);
        });
         if (customDateRangeDiv) {
             customDateRangeDiv.style.display = (matchedRange === 'custom') ? 'block' : 'none';
         }


        // Filtros
        const setSelectValue = (id, value) => {
            const select = panel.querySelector(`#${id}`);
            if (select) select.value = value || '';
        };
        setSelectValue('filter-maintenance-type', report.filters.maintenanceType);
        setSelectValue('filter-status', report.filters.status);
        setSelectValue('filter-equipment-type', report.filters.equipmentType);
        setSelectValue('filter-area', report.filters.area);

        const criticalCheckbox = panel.querySelector('#filter-critical');
        if (criticalCheckbox) criticalCheckbox.checked = report.filters.critical || false;

        // Visualizações
        const visualizations = report.visualizations || [];
        panel.querySelectorAll('.visualization-option').forEach(option => {
            option.classList.toggle('active', visualizations.includes(option.dataset.viz));
        });

        console.log("Painel de configuração atualizado.");

    } catch (error) {
        console.error("Erro ao atualizar painel de configuração:", error);
        notify("Erro ao preencher o formulário com os dados do relatório carregado.", "error");
    }
  }

  /**
   * Abre o modal para configurar o agendamento do relatório atual.
   */
  function openScheduleReportModal() {
    if (!currentReport) {
      notify("Gere ou carregue um relatório antes de agendar.", "warning");
      return;
    }
     if (!currentReport.id.startsWith('saved-')) {
        // Melhor prática: Agendar apenas relatórios que foram salvos explicitamente
        confirmAction(
            "É recomendado salvar este relatório antes de agendar para garantir que a configuração seja preservada. Deseja salvar agora?",
            () => {
                openSaveReportModal(); // Abre o modal de salvar
                // O usuário precisará clicar em Agendar novamente após salvar.
            }
        );
        // Ou permitir agendar na hora, mas salvar uma cópia interna?
        // Decisão: Exigir salvamento primeiro para clareza.
        // notify("Por favor, salve este relatório antes de agendar.", "warning");
         return; // Impede o agendamento se não estiver salvo
     }

    const modalId = 'schedule-report-modal';
     let modal = document.getElementById(modalId);
      if (modal) {
          modal.parentElement.remove();
      }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    modal = document.createElement('div');
    modal.className = 'modal-container';
    modal.id = modalId;

    modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">Agendar Relatório: ${currentReport.title}</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label for="schedule-title" class="form-label">Título do Agendamento</label>
          <input type="text" id="schedule-title" class="form-input" value="Agendamento - ${currentReport.title}" placeholder="Identificação do agendamento" required>
        </div>
        <div class="form-group">
          <label for="schedule-frequency" class="form-label">Frequência de Envio</label>
          <select id="schedule-frequency" class="form-select">
            <option value="daily">Diariamente</option>
            <option value="weekly" selected>Semanalmente (Segunda-feira)</option>
            <option value="monthly">Mensalmente (Dia 1)</option>
            <option value="quarterly">Trimestralmente (Início Trimestre)</option>
          </select>
        </div>
        <div class="form-group">
          <label for="schedule-recipients" class="form-label">Destinatários (e-mails)</label>
          <input type="email" id="schedule-recipients" class="form-input" multiple placeholder="email1@exemplo.com, email2@exemplo.com" required>
          <small style="font-size: 0.8rem; color: #666;">Separe múltiplos e-mails por vírgula.</small>
        </div>
        <div class="form-group">
          <label for="schedule-format" class="form-label">Formato do Anexo</label>
          <select id="schedule-format" class="form-select">
            <option value="pdf">PDF</option>
            <option value="xlsx" selected>Excel (XLSX)</option>
            <option value="csv">CSV</option>
          </select>
        </div>
        <div class="form-checkbox" style="margin-top: 20px;">
          <input type="checkbox" id="schedule-active" checked>
          <label for="schedule-active">Ativar este agendamento</label>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary cancel-schedule-btn">Cancelar</button>
        <button class="btn btn-confirm-schedule confirm-schedule-btn">Agendar</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Eventos
    const titleInput = modal.querySelector('#schedule-title');
    const freqSelect = modal.querySelector('#schedule-frequency');
    const recipInput = modal.querySelector('#schedule-recipients');
    const formatSelect = modal.querySelector('#schedule-format');
    const activeCheck = modal.querySelector('#schedule-active');
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('.cancel-schedule-btn');
    const confirmBtn = modal.querySelector('.confirm-schedule-btn');
    const closeAction = () => overlay.remove();


    closeBtn?.addEventListener('click', closeAction);
    cancelBtn?.addEventListener('click', closeAction);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeAction(); });

    confirmBtn?.addEventListener('click', () => {
        const title = titleInput.value.trim();
        const recipients = recipInput.value.trim();
        const frequency = freqSelect.value;
        const format = formatSelect.value;
        const active = activeCheck.checked;

        // Validação
        if (!title) { notify("Título do agendamento é obrigatório.", "warning"); titleInput.focus(); return; }
        if (!recipients) { notify("Pelo menos um destinatário é obrigatório.", "warning"); recipInput.focus(); return; }
        // Validação simples de e-mail (pode ser melhorada)
        const emails = recipients.split(',').map(e => e.trim()).filter(e => e);
        if (emails.some(e => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))) {
             notify("Um ou mais e-mails parecem inválidos.", "warning"); recipInput.focus(); return;
        }

        const newSchedule = {
            id: 'sched-' + Date.now(),
            reportId: currentReport.id, // ID do relatório SALVO
            title,
            frequency,
            recipients: emails.join(','), // Salva emails limpos
            format,
            active,
            createdAt: new Date().toISOString(),
            lastRun: null,
            nextRun: calculateNextRun(frequency) // Calcula a próxima execução
        };

        scheduledReports.unshift(newSchedule); // Adiciona no início
        persistData();
        closeAction();
        notify("Relatório agendado com sucesso!", "success");

         // Atualiza o painel de agendados se estiver visível
        const activeTab = document.querySelector('#advanced-reports-panel .panel-tab.active');
        if (activeTab && activeTab.dataset.tab === 'scheduled') {
            loadScheduledReportsPanel();
        }
    });
  }

  /**
   * Calcula a próxima data/hora de execução baseada na frequência.
   * @param {string} frequency - 'daily', 'weekly', 'monthly', 'quarterly'.
   * @returns {string} Data ISO da próxima execução (ex: 8:00 AM do dia relevante).
   */
  function calculateNextRun(frequency) {
    const now = new Date();
    let nextRun = new Date(now);
    nextRun.setHours(8, 0, 0, 0); // Padrão: 8:00 AM

    switch (frequency) {
      case 'daily':
        nextRun.setDate(now.getDate() + 1);
        break;
      case 'weekly': // Próxima Segunda-feira
        const daysUntilMonday = (1 - now.getDay() + 7) % 7;
        nextRun.setDate(now.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday)); // Se hoje é segunda, vai para a próxima
        break;
      case 'monthly': // Próximo dia 1º
        nextRun.setDate(1);
        nextRun.setMonth(now.getMonth() + 1);
        break;
      case 'quarterly': // Próximo início de trimestre (Jan 1, Apr 1, Jul 1, Oct 1)
        const currentMonth = now.getMonth(); // 0-11
        const nextQuarterMonth = (Math.floor(currentMonth / 3) + 1) * 3; // Mês inicial do próximo trimestre (0, 3, 6, 9)
        nextRun.setDate(1);
        nextRun.setMonth(nextQuarterMonth);
        // Se o próximo trimestre for no ano seguinte
        if (nextQuarterMonth >= 12) {
            nextRun.setFullYear(now.getFullYear() + 1);
            nextRun.setMonth(0); // Janeiro
        }
        break;
      default: // Fallback para diário
        console.warn(`Frequência de agendamento desconhecida: ${frequency}. Usando diário.`);
        nextRun.setDate(now.getDate() + 1);
    }
    // Se a data calculada já passou hoje (ex: agendou semanal às 9h, mas já são 10h), avança mais um ciclo
     if (nextRun <= now) {
         console.log("Data calculada já passou, avançando um ciclo.");
         // Recalcula com base na data já avançada (lógica pode precisar refinar dependendo do caso exato)
          const tempDateForRecalc = new Date(nextRun); // Usa a data já avançada como base
          switch (frequency) {
              case 'daily': nextRun.setDate(tempDateForRecalc.getDate() + 1); break;
              case 'weekly': nextRun.setDate(tempDateForRecalc.getDate() + 7); break;
              case 'monthly': nextRun.setMonth(tempDateForRecalc.getMonth() + 1); break;
              case 'quarterly': nextRun.setMonth(tempDateForRecalc.getMonth() + 3); break;
          }
     }


    return nextRun.toISOString();
  }

  /**
   * Abre o modal para editar um agendamento existente.
   * @param {string} scheduleId - O ID do agendamento a editar.
   */
  function editScheduledReport(scheduleId) {
    const schedule = scheduledReports.find(s => s.id === scheduleId);
    if (!schedule) {
      notify(`Agendamento ID ${scheduleId} não encontrado.`, "error");
      return;
    }

    const modalId = 'edit-schedule-modal-' + scheduleId;
    let modal = document.getElementById(modalId);
     if (modal) {
         modal.parentElement.remove();
     }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    modal = document.createElement('div');
    modal.className = 'modal-container';
    modal.id = modalId;

    // Pré-seleciona as opções
    const freqOptions = ['daily', 'weekly', 'monthly', 'quarterly'];
    const formatOptions = ['pdf', 'xlsx', 'csv'];

    modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">Editar Agendamento</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label for="edit-schedule-title-${scheduleId}" class="form-label">Título do Agendamento</label>
          <input type="text" id="edit-schedule-title-${scheduleId}" class="form-input" value="${schedule.title || ''}" required>
        </div>
        <div class="form-group">
          <label for="edit-schedule-frequency-${scheduleId}" class="form-label">Frequência</label>
          <select id="edit-schedule-frequency-${scheduleId}" class="form-select">
            ${freqOptions.map(f => `<option value="${f}" ${schedule.frequency === f ? 'selected' : ''}>${getScheduleFrequencyText(f)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="edit-schedule-recipients-${scheduleId}" class="form-label">Destinatários</label>
          <input type="email" id="edit-schedule-recipients-${scheduleId}" class="form-input" multiple value="${schedule.recipients || ''}" placeholder="email1, email2" required>
        </div>
        <div class="form-group">
          <label for="edit-schedule-format-${scheduleId}" class="form-label">Formato</label>
          <select id="edit-schedule-format-${scheduleId}" class="form-select">
             ${formatOptions.map(f => `<option value="${f}" ${schedule.format === f ? 'selected' : ''}>${f.toUpperCase()}</option>`).join('')}
          </select>
        </div>
        <div class="form-checkbox" style="margin-top: 20px;">
          <input type="checkbox" id="edit-schedule-active-${scheduleId}" ${schedule.active ? 'checked' : ''}>
          <label for="edit-schedule-active-${scheduleId}">Agendamento Ativo</label>
        </div>
        <p style="font-size: 0.8rem; color: #666; margin-top: 15px;">Relatório associado: ${schedule.reportId}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary cancel-edit-btn">Cancelar</button>
        <button class="btn btn-confirm-schedule confirm-edit-btn">Salvar Alterações</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Eventos
    const titleInput = modal.querySelector(`#edit-schedule-title-${scheduleId}`);
    const freqSelect = modal.querySelector(`#edit-schedule-frequency-${scheduleId}`);
    const recipInput = modal.querySelector(`#edit-schedule-recipients-${scheduleId}`);
    const formatSelect = modal.querySelector(`#edit-schedule-format-${scheduleId}`);
    const activeCheck = modal.querySelector(`#edit-schedule-active-${scheduleId}`);
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('.cancel-edit-btn');
    const confirmBtn = modal.querySelector('.confirm-edit-btn');
    const closeAction = () => overlay.remove();

    closeBtn?.addEventListener('click', closeAction);
    cancelBtn?.addEventListener('click', closeAction);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeAction(); });

    confirmBtn?.addEventListener('click', () => {
         const title = titleInput.value.trim();
        const recipients = recipInput.value.trim();
        const frequency = freqSelect.value;
        const format = formatSelect.value;
        const active = activeCheck.checked;

        if (!title) { notify("Título é obrigatório.", "warning"); titleInput.focus(); return; }
        if (!recipients) { notify("Destinatários são obrigatórios.", "warning"); recipInput.focus(); return; }
        const emails = recipients.split(',').map(e => e.trim()).filter(e => e);
        if (emails.some(e => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))) {
             notify("Um ou mais e-mails parecem inválidos.", "warning"); recipInput.focus(); return;
        }

        // Encontra o índice para atualizar
        const index = scheduledReports.findIndex(s => s.id === scheduleId);
        if (index !== -1) {
            const originalFrequency = scheduledReports[index].frequency;
            scheduledReports[index] = {
                ...schedule, // Mantém IDs, reportId, createdAt
                title,
                frequency,
                recipients: emails.join(','),
                format,
                active,
                // Recalcula nextRun apenas se a frequência mudou ou se estava inativo e foi ativado
                nextRun: (frequency !== originalFrequency || (!schedule.active && active)) ? calculateNextRun(frequency) : schedule.nextRun
            };
            persistData();
            closeAction();
            notify("Agendamento atualizado com sucesso!", "success");
            loadScheduledReportsPanel(); // Recarrega a lista
        } else {
             notify("Erro: Agendamento não encontrado para atualização.", "error");
             closeAction();
        }
    });
  }

  /**
   * Exclui um agendamento após confirmação.
   * @param {string} scheduleId - O ID do agendamento a excluir.
   */
  function deleteScheduledReport(scheduleId) {
    const schedule = scheduledReports.find(s => s.id === scheduleId);
    if (!schedule) {
      notify(`Agendamento ID ${scheduleId} não encontrado para exclusão.`, "error");
      return;
    }

    confirmAction(
      `Tem certeza que deseja excluir o agendamento "${schedule.title}"?`,
      () => {
        scheduledReports = scheduledReports.filter(s => s.id !== scheduleId);
        persistData();
        notify("Agendamento excluído com sucesso.", "success");
        loadScheduledReportsPanel(); // Recarrega a lista
      }
    );
  }

   /**
   * Carrega dados salvos (relatórios e agendamentos) do localStorage.
   */
   function loadPersistedData() {
       try {
           const savedStr = localStorage.getItem(config.localStorageKeys.saved);
           if (savedStr) {
               savedReports = JSON.parse(savedStr);
               console.log(`${savedReports.length} relatórios salvos carregados.`);
           } else {
               savedReports = [];
           }

           const scheduledStr = localStorage.getItem(config.localStorageKeys.scheduled);
           if (scheduledStr) {
               scheduledReports = JSON.parse(scheduledStr);
                console.log(`${scheduledReports.length} agendamentos carregados.`);
           } else {
               scheduledReports = [];
           }
       } catch (e) {
           console.error("Erro ao carregar dados do localStorage:", e);
           notify("Não foi possível carregar dados salvos. Iniciando com dados limpos.", "warning");
           savedReports = [];
           scheduledReports = [];
           // Limpar localStorage se estiver corrompido? Pode ser arriscado.
           // localStorage.removeItem(config.localStorageKeys.saved);
           // localStorage.removeItem(config.localStorageKeys.scheduled);
       }
   }

   /**
    * Salva os arrays `savedReports` e `scheduledReports` no localStorage.
    */
   function persistData() {
       try {
           localStorage.setItem(config.localStorageKeys.saved, JSON.stringify(savedReports));
           localStorage.setItem(config.localStorageKeys.scheduled, JSON.stringify(scheduledReports));
           // console.log("Dados persistidos no localStorage.");
           return true;
       } catch (e) {
           console.error("Erro ao salvar dados no localStorage:", e);
           let message = "Erro ao salvar dados.";
           if (e.name === 'QuotaExceededError') {
                message = "Erro: Limite de armazenamento do navegador excedido. Não foi possível salvar.";
           }
           notify(message, "error");
           return false;
       }
   }

  /**
   * Abre o modal de opções avançadas de exportação.
   */
  function openAdvancedExportModal() {
     if (!currentReport) {
       notify("Gere ou carregue um relatório para usar a exportação avançada.", "warning");
       return;
     }

      const modalId = 'advanced-export-modal';
     let modal = document.getElementById(modalId);
      if (modal) {
          modal.parentElement.remove();
      }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    modal = document.createElement('div');
    modal.className = 'modal-container';
    modal.id = modalId;

    const formatOptions = Object.entries(config.exportFormats)
                               .map(([f, info]) => `<option value="${f}">${info.label}</option>`).join('');

    modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">Exportação Avançada: ${currentReport.title}</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label for="adv-export-format" class="form-label">Formato</label>
          <select id="adv-export-format" class="form-select">${formatOptions}</select>
        </div>

        <div class="form-group">
          <label class="form-label">Incluir no Arquivo</label>
          <div class="form-checkbox">
            <input type="checkbox" id="adv-export-summary" checked> <label for="adv-export-summary">Resumo Geral</label>
          </div>
          <div class="form-checkbox">
            <input type="checkbox" id="adv-export-charts" checked> <label for="adv-export-charts">Gráficos (como imagem/dados)</label>
          </div>
          <div class="form-checkbox">
            <input type="checkbox" id="adv-export-table" checked> <label for="adv-export-table">Tabela de Dados Completa</label>
          </div>
        </div>

         <div class="form-group">
          <label class="form-label">Opções Adicionais</label>
          <div class="form-checkbox">
            <input type="checkbox" id="adv-export-filename">
            <label for="adv-export-filename">Nome de arquivo personalizado</label>
          </div>
          <input type="text" id="adv-export-custom-filename" class="form-input" style="display: none; margin-top: -5px; margin-bottom: 10px;" value="${currentReport.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'relatorio'}.[ext]">

           <!-- Opções de servidor não implementadas na simulação -->
           <!--
           <div class="form-checkbox">
             <input type="checkbox" id="export-save-copy" disabled> <label for="export-save-copy" style="color: #999;">Salvar cópia no servidor (Indisponível)</label>
           </div>
           -->
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary cancel-adv-export-btn">Cancelar</button>
        <button class="btn btn-confirm-export confirm-adv-export-btn">Exportar</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Eventos
    const filenameCheck = modal.querySelector('#adv-export-filename');
    const filenameInput = modal.querySelector('#adv-export-custom-filename');
    const formatSelect = modal.querySelector('#adv-export-format');
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('.cancel-adv-export-btn');
    const confirmBtn = modal.querySelector('.confirm-adv-export-btn');
    const closeAction = () => overlay.remove();

    closeBtn?.addEventListener('click', closeAction);
    cancelBtn?.addEventListener('click', closeAction);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeAction(); });

    // Toggle nome de arquivo personalizado
    filenameCheck?.addEventListener('change', () => {
        if (filenameInput) filenameInput.style.display = filenameCheck.checked ? 'block' : 'none';
        if (filenameCheck.checked && filenameInput) {
             filenameInput.value = filenameInput.value.replace('[ext]', formatSelect.value); // Atualiza extensão inicial
             filenameInput.focus();
        }
    });
     formatSelect?.addEventListener('change', () => {
         if (filenameCheck.checked && filenameInput) {
              filenameInput.value = filenameInput.value.replace(/\.[a-z0-9]+$/i, `.${formatSelect.value}`); // Atualiza extensão ao mudar formato
         }
     });


    confirmBtn?.addEventListener('click', () => {
      const format = formatSelect.value;
      const exportConfig = {
        format,
        includeSummary: modal.querySelector('#adv-export-summary').checked,
        includeCharts: modal.querySelector('#adv-export-charts').checked,
        includeTable: modal.querySelector('#adv-export-table').checked,
        customFilename: filenameCheck.checked ? filenameInput.value.trim() : null
        // saveCopy: modal.querySelector('#export-save-copy').checked // Se implementado
      };

      // Validação básica do nome do arquivo
       if (exportConfig.customFilename && !exportConfig.customFilename.includes(`.${format}`)) {
           notify(`Nome de arquivo personalizado inválido. Deve terminar com '.${format}'`, "warning");
           filenameInput.focus();
           return;
       }
        if (exportConfig.customFilename && exportConfig.customFilename.length < 5) { // Mínimo como 'a.pdf'
            notify(`Nome de arquivo personalizado muito curto.`, "warning");
            filenameInput.focus();
            return;
        }

      closeAction();
      exportReportAdvanced(exportConfig);
    });
  }

  /**
   * Executa a exportação avançada com base nas opções fornecidas.
   * @param {Object} exportConfig - Objeto com as opções de exportação.
   */
  function exportReportAdvanced(exportConfig) {
    if (!currentReport) {
      notify("Relatório atual não encontrado para exportação avançada.", "error");
      return;
    }

    const formatLabel = config.exportFormats[exportConfig.format]?.label || exportConfig.format.toUpperCase();
    showLoading(true, `Preparando exportação avançada como ${formatLabel}...`);
    console.log("Exportando relatório com configurações avançadas:", exportConfig);

    // --- Simulação de Exportação Avançada ---
    // Aqui, a lógica seria mais complexa:
    // 1. Coletar dados base (currentReport.items, summary, chart data)
    // 2. Filtrar o que incluir baseado em exportConfig (includeSummary, etc.)
    // 3. Gerar o arquivo no formato desejado (PDF pode precisar de lib como jsPDF, XLSX de SheetJS, etc.)
    //    - Para PDF/XLSX com gráficos, seria preciso renderizar os gráficos (talvez offscreen) e incluir como imagem.
    //    - Para CSV/JSON, incluiria apenas dados tabulares e talvez resumo/config.
    // 4. Iniciar download.
    setTimeout(() => {
        showLoading(false);
        notify(`Exportação avançada como ${formatLabel} concluída. (Simulação)`, "success");

        // Simular download com nome de arquivo
        try {
            let filename = exportConfig.customFilename;
            if (!filename) {
                filename = `${currentReport.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'relatorio'}_${new Date().toISOString().split('T')[0]}.${exportConfig.format}`;
            }
            // Gera conteúdo de exemplo baseado nas opções
            let contentParts = [];
             if (exportConfig.includeSummary) contentParts.push("--- RESUMO ---\n" + JSON.stringify(currentReport.summary, null, 2));
             if (exportConfig.includeCharts) contentParts.push("\n\n--- DADOS DOS GRÁFICOS (Exemplo) ---\n" + JSON.stringify(currentReport.charts, null, 2));
             if (exportConfig.includeTable && currentReport.items) {
                 const tableData = exportConfig.format === 'csv'
                    ? itemsToCsv(currentReport.items)
                    : JSON.stringify(currentReport.items, null, 2);
                 contentParts.push("\n\n--- DADOS DETALHADOS ---\n" + tableData);
             }
             if (contentParts.length === 0) contentParts.push("Nenhum conteúdo selecionado para exportar.");

            const content = contentParts.join('\n');
            const mimeType = { pdf: 'application/pdf', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', csv: 'text/csv', json: 'application/json' }[exportConfig.format] || 'application/octet-stream';
            const blob = new Blob([content], { type: mimeType });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error("Erro ao simular download avançado:", error);
            notify("Ocorreu um erro durante a simulação de download avançado.", "error");
        }

    }, 2500); // Simula processamento mais longo
  }

    /**
     * Converte um array de objetos para string CSV (simplificado).
     * @param {Array<Object>} items - Os itens a converter.
     * @returns {string} String no formato CSV.
     */
    function itemsToCsv(items) {
        if (!items || items.length === 0) return "";
        const headers = Object.keys(items[0]);
        const csvRows = [
            headers.join(','), // Cabeçalho
            ...items.map(row =>
                headers.map(header =>
                    JSON.stringify(row[header] ?? '', (key, value) => value ?? '') // Trata null/undefined e strings com vírgula
                ).join(',')
            )
        ];
        return csvRows.join('\n');
    }

  /**
   * Cria um relatório avançado programaticamente (para uso externo).
   * @param {Object} externalConfig - Configurações fornecidas externamente.
   * @returns {Promise<Object>} Promessa que resolve com os dados do relatório gerado.
   */
  function createAdvancedReport(externalConfig) {
    console.log("Criando relatório avançado programaticamente com config:", externalConfig);

    // Validação básica da configuração externa
    if (!externalConfig || !externalConfig.startDate || !externalConfig.endDate) {
        return Promise.reject(new Error("Configuração externa inválida: startDate e endDate são obrigatórios."));
    }

    showLoading(true, "Gerando relatório programático...");

    // Simula a lógica de geração de relatório, mas usando a config externa
    const reportConfig = {
        title: externalConfig.title || "Relatório Programático",
        period: {
            startDate: externalConfig.startDate,
            endDate: externalConfig.endDate,
            label: externalConfig.periodLabel || "Período Personalizado"
        },
        filters: externalConfig.filters || {},
        visualizations: externalConfig.visualizations || ['summary', 'table'], // Padrão diferente talvez
        // Metadados
        id: 'prog-' + Date.now(),
        createdAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      // Simulação de API ou processamento
      setTimeout(() => {
        try {
          const reportData = createSampleReport(reportConfig); // Reusa a lógica de geração de exemplo
          showLoading(false);
          notify(`Relatório programático "${reportData.title}" gerado.`, "success");
          resolve(reportData); // Resolve a promessa com os dados
        } catch (error) {
          console.error("Erro ao gerar relatório programático:", error);
          showLoading(false);
          notify("Erro ao gerar relatório programático.", "error");
          reject(error); // Rejeita a promessa
        }
      }, 1800);
    });
  }

  // --- API Pública do Módulo ---
  return {
    initialize, // Para iniciar o módulo explicitamente, se necessário
    openAdvancedReportsPanel, // Para abrir o painel manualmente
    // Funções que podem ser chamadas por outros módulos (se o objeto AdvancedReports for exposto)
    createAdvancedReport,
    exportReport: exportReportAdvanced // Expor a versão avançada como padrão? Ou manter ambas? Decidi expor a avançada.
    // Poderia expor também: getCurrentReport, loadReportById, etc., se necessário
  };
})();

// --- Inicialização Automática ---
// Verifica se o DOM está pronto e inicializa o módulo.
// A verificação interna em initialize() previne múltiplas inicializações.
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM carregado, tentando inicializar AdvancedReports...");
    AdvancedReports.initialize();
});
