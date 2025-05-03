/**
 * Sistema de Dupla Checagem de Manutenção
 * Módulo: Relatórios Avançados
 * 
 * Este módulo implementa recursos avançados de relatórios:
 * - Relatórios personalizáveis com múltiplos filtros
 * - Exportação em diversos formatos (PDF, Excel, CSV)
 * - Relatórios automatizados programados
 * - Visualizações avançadas de dados
 */

const AdvancedReports = (function() {
  // Configurações do módulo
  const config = {
    defaultDateRange: 30, // Dias para o relatório padrão
    maxExportLimit: 5000, // Limite de registros para exportação
    autoSaveInterval: 60000, // Intervalo para auto-salvar (ms)
    defaultChartColors: [
      '#1a5fb4', '#2b9348', '#f0ad4e', '#cc0000', '#0066cc',
      '#6554c0', '#ff5630', '#00b8d9', '#ffc400', '#4c9aff'
    ],
    exportFormats: {
      pdf: { label: 'PDF', icon: '📄' },
      xlsx: { label: 'Excel', icon: '📊' },
      csv: { label: 'CSV', icon: '📋' },
      json: { label: 'JSON', icon: '📝' }
    }
  };

  // Estado interno
  let currentReport = null;
  let savedReports = [];
  let scheduledReports = [];
  let isInitialized = false;

  /**
   * Inicializa o módulo de relatórios avançados
   */
  function initialize() {
    if (isInitialized) {
      console.log("Módulo de relatórios avançados já inicializado.");
      return;
    }

    console.log("Inicializando módulo de relatórios avançados...");
    
    // Carregar relatórios salvos
    loadSavedReports();
    
    // Adicionar botão de relatórios avançados
    createReportsButton();
    
    // Configurar handlers de eventos
    setupEventListeners();
    
    // Substituir ou extender o módulo de relatórios existente se necessário
    extendExistingReportsModule();
    
    isInitialized = true;
    console.log("Módulo de relatórios avançados inicializado com sucesso.");
  }

  /**
   * Cria o botão para relatórios avançados
   */
  function createReportsButton() {
    const reportsTab = document.querySelector('.tab[data-tab="reports"]');
    if (!reportsTab) return;
    
    // Verificar se o botão já existe
    if (document.getElementById('advanced-reports-button')) return;
    
    // Obter o container de relatórios
    const reportsContent = document.getElementById('tab-reports');
    if (!reportsContent) return;
    
    // Adicionar botão para relatórios avançados
    const advancedButton = document.createElement('button');
    advancedButton.id = 'advanced-reports-button';
    advancedButton.className = 'btn btn-primary';
    advancedButton.innerHTML = '<span style="margin-right:8px;">📈</span> Relatórios Avançados';
    advancedButton.style.marginTop = '20px';
    
    // Encontrar onde colocar o botão
    const reportSection = reportsContent.querySelector('.section');
    if (reportSection) {
      // Adicionar após o botão "Gerar Relatório" existente
      const generateButton = reportSection.querySelector('#generate-report');
      if (generateButton) {
        // Adicionar ao lado do botão existente
        generateButton.parentNode.insertBefore(advancedButton, generateButton.nextSibling);
        // Adicionar um pouco de espaço entre os botões
        generateButton.style.marginRight = '10px';
      } else {
        // Adicionar ao final da seção
        reportSection.appendChild(advancedButton);
      }
    }
  }

  /**
   * Configura listeners de eventos
   */
  function setupEventListeners() {
    // Listener para o botão de relatórios avançados
    const advancedButton = document.getElementById('advanced-reports-button');
    if (advancedButton) {
      advancedButton.addEventListener('click', openAdvancedReportsPanel);
    }
    
    // Adicionar outros listeners conforme necessário
    document.addEventListener('click', function(event) {
      // Delegar eventos para elementos que podem não existir ainda
      const target = event.target;
      
      // Manipular clique em botões de exportação
      if (target.classList.contains('export-report-btn')) {
        const format = target.getAttribute('data-format');
        if (format) {
          event.preventDefault();
          exportReport(format);
        }
      }
      
      // Manipular clique em botões de salvar relatório
      if (target.id === 'save-report-btn') {
        event.preventDefault();
        saveCurrentReport();
      }
      
      // Manipular clique em botões de carregar relatório
      if (target.classList.contains('load-report-btn')) {
        const reportId = target.getAttribute('data-id');
        if (reportId) {
          event.preventDefault();
          loadReport(reportId);
        }
      }
      
      // Manipular clique em botões de agendar relatório
      if (target.id === 'schedule-report-btn') {
        event.preventDefault();
        openScheduleReportModal();
      }
    });
  }

  /**
   * Estende o módulo de relatórios existente
   */
  function extendExistingReportsModule() {
    // Verificar se o módulo Reports existe
    if (typeof Reports !== 'undefined') {
      console.log("Estendendo módulo de relatórios existente...");
      
      // Salvar referência ao método original de geração de relatórios
      const originalGenerateReport = Reports.generateReport;
      
      // Sobrescrever o método para melhorar suas capacidades
      Reports.generateReport = function(...args) {
        // Chamar o método original
        const result = originalGenerateReport.apply(this, args);
        
        // Adicionar botão de exportação avançada se não existir
        addAdvancedExportButtons();
        
        return result;
      };
      
      // Adicionar novos métodos ao módulo Reports
      Reports.createAdvancedReport = createAdvancedReport;
      Reports.exportAdvanced = exportReport;
      
      console.log("Módulo de relatórios estendido com sucesso.");
    } else {
      console.warn("Módulo Reports não encontrado. Funcionando de forma independente.");
    }
  }

  /**
   * Adiciona botões avançados de exportação
   */
  function addAdvancedExportButtons() {
    // Verificar se já existem botões de exportação avançada
    if (document.querySelector('.advanced-export-button')) return;
    
    // Encontrar a div com os botões de exportação existentes
    const exportDiv = document.querySelector('.btn-action-group');
    if (!exportDiv) return;
    
    // Adicionar botão de exportação avançada
    const advancedExportBtn = document.createElement('button');
    advancedExportBtn.className = 'btn advanced-export-button';
    advancedExportBtn.innerHTML = '<span style="margin-right:5px;">🚀</span> Exportação Avançada';
    advancedExportBtn.style.backgroundColor = '#1a5fb4';
    
    // Adicionar ao container
    exportDiv.appendChild(advancedExportBtn);
    
    // Configurar evento
    advancedExportBtn.addEventListener('click', openAdvancedExportModal);
  }

  /**
   * Abre o painel de relatórios avançados
   */
  function openAdvancedReportsPanel() {
    console.log("Abrindo painel de relatórios avançados...");
    
    // Verificar se já existe um painel aberto
    let panel = document.getElementById('advanced-reports-panel');
    if (panel) {
      panel.style.display = 'block';
      return;
    }
    
    // Criar o painel
    panel = document.createElement('div');
    panel.id = 'advanced-reports-panel';
    panel.className = 'advanced-reports-panel';
    panel.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(245, 247, 250, 0.98);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;
    
    // Adicionar cabeçalho
    const header = document.createElement('div');
    header.className = 'advanced-reports-header';
    header.style.cssText = `
      padding: 15px 20px;
      background: linear-gradient(135deg, var(--primary-color, #1a5fb4) 0%, var(--primary-dark, #15487d) 100%);
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      z-index: 1;
    `;
    
    header.innerHTML = `
      <div class="header-title">
        <h2 style="margin: 0; font-size: 1.5rem; font-weight: 600;">Relatórios Avançados</h2>
        <p style="margin: 5px 0 0 0; font-size: 0.9rem; opacity: 0.9;">Crie, salve e agende relatórios personalizados</p>
      </div>
      <div class="header-actions">
        <button id="close-reports-panel" class="btn-icon" style="background-color: rgba(255,255,255,0.2); color: white; width: 36px; height: 36px;">×</button>
      </div>
    `;
    
    // Adicionar layout principal
    const content = document.createElement('div');
    content.className = 'advanced-reports-content';
    content.style.cssText = `
      display: flex;
      flex: 1;
      overflow: hidden;
    `;
    
    // Painel esquerdo (configuração)
    const leftPanel = document.createElement('div');
    leftPanel.className = 'reports-config-panel';
    leftPanel.style.cssText = `
      width: 320px;
      background-color: white;
      border-right: 1px solid rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;
    
    // Conteúdo do painel esquerdo
    leftPanel.innerHTML = `
      <div class="panel-tabs" style="display: flex; border-bottom: 1px solid rgba(0,0,0,0.05);">
        <div class="panel-tab active" data-tab="new" style="flex: 1; padding: 15px; text-align: center; font-weight: 500; cursor: pointer; border-bottom: 2px solid var(--primary-color, #1a5fb4); color: var(--primary-color, #1a5fb4);">Novo Relatório</div>
        <div class="panel-tab" data-tab="saved" style="flex: 1; padding: 15px; text-align: center; font-weight: 500; cursor: pointer; color: var(--text-light, #5e6c84);">Salvos</div>
        <div class="panel-tab" data-tab="scheduled" style="flex: 1; padding: 15px; text-align: center; font-weight: 500; cursor: pointer; color: var(--text-light, #5e6c84);">Agendados</div>
      </div>
      <div class="panel-content" style="flex: 1; overflow: auto; padding: 20px;">
        <!-- Conteúdo do painel de configuração será inserido aqui -->
      </div>
      <div class="panel-footer" style="padding: 15px; border-top: 1px solid rgba(0,0,0,0.05); display: flex; justify-content: space-between;">
        <button id="export-report-btn" class="btn btn-secondary" style="padding: 8px 15px; font-size: 0.9rem;">Exportar</button>
        <button id="generate-advanced-report-btn" class="btn" style="padding: 8px 15px; font-size: 0.9rem; background-color: var(--primary-color, #1a5fb4);">Gerar Relatório</button>
      </div>
    `;
    
    // Painel direito (visualização)
    const rightPanel = document.createElement('div');
    rightPanel.className = 'reports-preview-panel';
    rightPanel.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;
    
    // Conteúdo do painel direito
    rightPanel.innerHTML = `
      <div class="preview-toolbar" style="padding: 10px 20px; border-bottom: 1px solid rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; font-size: 1.2rem; font-weight: 500;">Visualização do Relatório</h3>
        <div class="toolbar-actions">
          <button id="save-report-btn" class="btn" style="padding: 5px 10px; font-size: 0.85rem; margin-right: 10px; background-color: var(--status-completed, #2b9348);">Salvar Relatório</button>
          <button id="schedule-report-btn" class="btn" style="padding: 5px 10px; font-size: 0.85rem; background-color: var(--status-verification, #0066cc);">Agendar</button>
        </div>
      </div>
      <div class="preview-content" style="flex: 1; overflow: auto; padding: 20px; background-color: rgba(245, 247, 250, 0.5);">
        <div id="report-preview-container" style="background: white; border-radius: 8px; box-shadow: 0 1px 5px rgba(0,0,0,0.05); min-height: 500px; padding: 20px;">
          <div class="empty-report-message" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; color: var(--text-light, #5e6c84);">
            <div style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;">📊</div>
            <h3 style="margin: 0; font-size: 1.2rem; font-weight: 500;">Nenhum relatório gerado</h3>
            <p style="margin: 10px 0 0 0; font-size: 0.9rem; opacity: 0.7; text-align: center;">Configure os parâmetros no painel à esquerda<br>e clique em "Gerar Relatório"</p>
          </div>
        </div>
      </div>
    `;
    
    // Adicionar os painéis ao conteúdo
    content.appendChild(leftPanel);
    content.appendChild(rightPanel);
    
    // Compor o painel completo
    panel.appendChild(header);
    panel.appendChild(content);
    
    // Adicionar ao body
    document.body.appendChild(panel);
    
    // Adicionar estilos globais para o painel de relatórios
    addReportsPanelStyles();
    
    // Configurar eventos para o painel
    setupReportsPanelEvents(panel);
    
    // Carregar o conteúdo inicial do painel de configuração
    loadNewReportPanel();
  }

  /**
   * Adiciona estilos globais para o painel de relatórios
   */
  function addReportsPanelStyles() {
    // Verificar se os estilos já foram adicionados
    if (document.getElementById('advanced-reports-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'advanced-reports-styles';
    
    style.textContent = `
      /* Estilos para o seletor de data */
      .date-range-selector {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 20px;
      }
      
      .date-range-option {
        padding: 8px 12px;
        font-size: 0.85rem;
        background-color: rgba(0, 0, 0, 0.03);
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .date-range-option:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }
      
      .date-range-option.active {
        background-color: var(--primary-color, #1a5fb4);
        color: white;
        border-color: var(--primary-color, #1a5fb4);
      }
      
      /* Estilos para a seleção de filtros */
      .filter-section {
        margin-bottom: 20px;
      }
      
      .filter-section h4 {
        font-size: 0.95rem;
        margin: 0 0 10px 0;
        font-weight: 500;
        color: var(--text-dark, #333333);
        display: flex;
        align-items: center;
      }
      
      .filter-section h4::before {
        content: '';
        display: inline-block;
        width: 4px;
        height: 14px;
        background-color: var(--primary-color, #1a5fb4);
        margin-right: 8px;
        border-radius: 2px;
      }
      
      /* Estilos para o seletor de visualização */
      .visualization-selector {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 10px;
      }
      
      .visualization-option {
        width: 80px;
        height: 70px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: white;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .visualization-option:hover {
        border-color: var(--primary-color, #1a5fb4);
        background-color: rgba(26, 95, 180, 0.03);
      }
      
      .visualization-option.active {
        border-color: var(--primary-color, #1a5fb4);
        background-color: rgba(26, 95, 180, 0.05);
        box-shadow: 0 0 0 2px rgba(26, 95, 180, 0.2);
      }
      
      .visualization-icon {
        font-size: 1.5rem;
        margin-bottom: 5px;
      }
      
      .visualization-name {
        font-size: 0.7rem;
        text-align: center;
      }
      
      /* Estilos para relatórios salvos */
      .saved-report-item {
        background-color: white;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .saved-report-item:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }
      
      .saved-report-title {
        font-weight: 500;
        font-size: 1rem;
        margin: 0 0 5px 0;
        color: var(--primary-color, #1a5fb4);
      }
      
      .saved-report-date {
        font-size: 0.8rem;
        color: var(--text-light, #5e6c84);
        margin: 0 0 10px 0;
      }
      
      .saved-report-desc {
        font-size: 0.85rem;
        color: var(--text-dark, #333333);
        margin: 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      /* Estilos para relatórios agendados */
      .scheduled-report-item {
        background-color: white;
        border-left: 4px solid var(--status-verification, #0066cc);
        border-radius: 4px;
        padding: 15px;
        margin-bottom: 15px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      }
      
      .scheduled-report-title {
        font-weight: 500;
        font-size: 1rem;
        margin: 0 0 5px 0;
        color: var(--text-dark, #333333);
      }
      
      .scheduled-report-schedule {
        font-size: 0.85rem;
        color: var(--status-verification, #0066cc);
        margin: 0 0 10px 0;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      
      .scheduled-report-status {
        display: inline-block;
        padding: 3px 8px;
        font-size: 0.75rem;
        border-radius: 12px;
        background-color: rgba(0, 102, 204, 0.1);
        color: var(--status-verification, #0066cc);
      }
      
      /* Estilos para campos de formulário */
      .form-label {
        display: block;
        margin-bottom: 5px;
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--text-dark, #333333);
      }
      
      .form-input {
        width: 100%;
        padding: 8px 10px;
        font-size: 0.9rem;
        border: 1px solid rgba(0, 0, 0, 0.15);
        border-radius: 4px;
        margin-bottom: 15px;
      }
      
      .form-input:focus {
        outline: none;
        border-color: var(--primary-color, #1a5fb4);
        box-shadow: 0 0 0 2px rgba(26, 95, 180, 0.1);
      }
      
      .form-select {
        width: 100%;
        padding: 8px 10px;
        font-size: 0.9rem;
        border: 1px solid rgba(0, 0, 0, 0.15);
        border-radius: 4px;
        margin-bottom: 15px;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%235e6c84' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 8px center;
        background-size: 16px;
        padding-right: 30px;
      }
      
      .form-checkbox {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
        cursor: pointer;
      }
      
      .form-checkbox input {
        margin-right: 8px;
      }
      
      /* Animações */
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .fade-in {
        animation: fadeIn 0.3s ease-in-out forwards;
      }
      
      /* Estilos para o modal de agendamento */
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease-in-out forwards;
      }
      
      .modal-container {
        width: 450px;
        max-width: 90%;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
        animation: modalSlideIn 0.3s ease-out forwards;
        overflow: hidden;
      }
      
      @keyframes modalSlideIn {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .modal-header {
        background-color: var(--primary-color, #1a5fb4);
        color: white;
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .modal-title {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 500;
      }
      
      .modal-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.2);
      }
      
      .modal-body {
        padding: 20px;
      }
      
      .modal-footer {
        padding: 15px 20px;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        border-top: 1px solid rgba(0, 0, 0, 0.05);
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Configura eventos para o painel de relatórios
   * @param {HTMLElement} panel - Elemento do painel
   */
  function setupReportsPanelEvents(panel) {
    // Botão de fechar
    const closeButton = panel.querySelector('#close-reports-panel');
    if (closeButton) {
      closeButton.addEventListener('click', function() {
        panel.style.display = 'none';
      });
    }
    
    // Alternar entre abas
    const tabs = panel.querySelectorAll('.panel-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        // Remover classe ativa de todas as abas
        tabs.forEach(t => {
          t.classList.remove('active');
          t.style.borderBottom = 'none';
          t.style.color = 'var(--text-light, #5e6c84)';
        });
        
        // Adicionar classe ativa à aba clicada
        this.classList.add('active');
        this.style.borderBottom = '2px solid var(--primary-color, #1a5fb4)';
        this.style.color = 'var(--primary-color, #1a5fb4)';
        
        // Carregar conteúdo da aba
        const tabName = this.getAttribute('data-tab');
        switch (tabName) {
          case 'new':
            loadNewReportPanel();
            break;
          case 'saved':
            loadSavedReportsPanel();
            break;
          case 'scheduled':
            loadScheduledReportsPanel();
            break;
        }
      });
    });
    
    // Botão de gerar relatório
    const generateButton = panel.querySelector('#generate-advanced-report-btn');
    if (generateButton) {
      generateButton.addEventListener('click', generateAdvancedReport);
    }
    
    // Botão de exportação
    const exportButton = panel.querySelector('#export-report-btn');
    if (exportButton) {
      exportButton.addEventListener('click', openExportOptionsModal);
    }
  }

  /**
   * Carrega o painel de novo relatório
   */
  function loadNewReportPanel() {
    const panelContent = document.querySelector('.panel-content');
    if (!panelContent) return;
    
    // Conteúdo do painel de novo relatório
    panelContent.innerHTML = `
      <div class="new-report-config">
        <div class="form-group">
          <label class="form-label">Título do Relatório</label>
          <input type="text" id="report-title" class="form-input" placeholder="Relatório de Manutenções">
        </div>
        
        <div class="filter-section">
          <h4>Período</h4>
          <div class="date-range-selector">
            <div class="date-range-option active" data-range="30">30 dias</div>
            <div class="date-range-option" data-range="90">90 dias</div>
            <div class="date-range-option" data-range="180">6 meses</div>
            <div class="date-range-option" data-range="365">1 ano</div>
            <div class="date-range-option" data-range="custom">Personalizado</div>
          </div>
          
          <div id="custom-date-range" style="display: none; margin-top: 10px;">
            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
              <div style="flex: 1;">
                <label class="form-label">Data Inicial</label>
                <input type="date" id="report-start-date" class="form-input" style="margin-bottom: 0;">
              </div>
              <div style="flex: 1;">
                <label class="form-label">Data Final</label>
                <input type="date" id="report-end-date" class="form-input" style="margin-bottom: 0;">
              </div>
            </div>
          </div>
        </div>
        
        <div class="filter-section">
          <h4>Filtros</h4>
          
          <div class="form-group">
            <label class="form-label">Tipo de Manutenção</label>
            <select id="filter-maintenance-type" class="form-select">
              <option value="">Todos os tipos</option>
              <option value="Preventiva">Preventiva</option>
              <option value="Corretiva">Corretiva</option>
              <option value="Emergencial">Emergencial</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Status</label>
            <select id="filter-status" class="form-select">
              <option value="">Todos os status</option>
              <option value="Pendente">Pendente</option>
              <option value="Verificado">Verificado</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Reprovado">Reprovado</option>
              <option value="Concluído">Concluído</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Tipo de Equipamento</label>
            <select id="filter-equipment-type" class="form-select">
              <option value="">Todos os equipamentos</option>
              <option value="Alta Pressão">Alta Pressão</option>
              <option value="Auto Vácuo / Hiper Vácuo">Auto Vácuo / Hiper Vácuo</option>
              <option value="Aspirador">Aspirador</option>
              <option value="Poliguindaste">Poliguindaste</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Área</label>
            <select id="filter-area" class="form-select">
              <option value="">Todas as áreas</option>
              <option value="Área Interna Usiminas">Área Interna Usiminas</option>
              <option value="Área Externa Usiminas">Área Externa Usiminas</option>
            </select>
          </div>
          
          <div class="form-checkbox">
            <input type="checkbox" id="filter-critical" value="1">
            <label for="filter-critical">Apenas Manutenções Críticas</label>
          </div>
        </div>
        
        <div class="filter-section">
          <h4>Visualização</h4>
          <p style="margin: 0 0 10px 0; font-size: 0.85rem; color: var(--text-light, #5e6c84);">Selecione os gráficos que deseja incluir no relatório</p>
          
          <div class="visualization-selector">
            <div class="visualization-option active" data-viz="summary">
              <div class="visualization-icon">📊</div>
              <div class="visualization-name">Resumo</div>
            </div>
            <div class="visualization-option active" data-viz="status">
              <div class="visualization-icon">🔄</div>
              <div class="visualization-name">Status</div>
            </div>
            <div class="visualization-option active" data-viz="type">
              <div class="visualization-icon">🔧</div>
              <div class="visualization-name">Tipos</div>
            </div>
            <div class="visualization-option active" data-viz="area">
              <div class="visualization-icon">📍</div>
              <div class="visualization-name">Áreas</div>
            </div>
            <div class="visualization-option" data-viz="timeline">
              <div class="visualization-icon">📅</div>
              <div class="visualization-name">Linha do Tempo</div>
            </div>
            <div class="visualization-option" data-viz="table">
              <div class="visualization-icon">📋</div>
              <div class="visualization-name">Tabela</div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Configurar eventos para os elementos do formulário
    setupNewReportEvents();
  }

  /**
   * Configura eventos para o formulário de novo relatório
   */
  function setupNewReportEvents() {
    // Seletor de período
    const dateOptions = document.querySelectorAll('.date-range-option');
    const customDateRange = document.getElementById('custom-date-range');
    
    dateOptions.forEach(option => {
      option.addEventListener('click', function() {
        // Remover classe ativa de todas as opções
        dateOptions.forEach(o => o.classList.remove('active'));
        
        // Adicionar classe ativa à opção clicada
        this.classList.add('active');
        
        // Mostrar/esconder seletor de data personalizado
        if (this.getAttribute('data-range') === 'custom') {
          customDateRange.style.display = 'block';
        } else {
          customDateRange.style.display = 'none';
        }
      });
    });
    
    // Definir datas padrão para o seletor personalizado
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 30); // 30 dias atrás
    
    const reportStartDate = document.getElementById('report-start-date');
    const reportEndDate = document.getElementById('report-end-date');
    
    if (reportStartDate) {
      reportStartDate.valueAsDate = startDate;
    }
    
    if (reportEndDate) {
      reportEndDate.valueAsDate = today;
    }
    
    // Seletor de visualização
    const vizOptions = document.querySelectorAll('.visualization-option');
    
    vizOptions.forEach(option => {
      option.addEventListener('click', function() {
        // Alternar classe ativa
        this.classList.toggle('active');
      });
    });
  }

  /**
   * Carrega o painel de relatórios salvos
   */
  function loadSavedReportsPanel() {
    const panelContent = document.querySelector('.panel-content');
    if (!panelContent) return;
    
    // Verificar se há relatórios salvos
    if (savedReports.length === 0) {
      panelContent.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 30px 0;">
          <div style="font-size: 3rem; margin-bottom: 20px; color: var(--text-lighter, #97a0af);">📂</div>
          <h3 style="margin: 0; font-size: 1.1rem; font-weight: 500; color: var(--text-dark, #333333);">Nenhum relatório salvo</h3>
          <p style="margin: 10px 0 0 0; font-size: 0.9rem; color: var(--text-light, #5e6c84);">Crie e salve relatórios para acessá-los rapidamente</p>
        </div>
      `;
      return;
    }
    
    // Criar HTML para cada relatório salvo
    let reportsHtml = '<div class="saved-reports-list">';
    
    savedReports.forEach(report => {
      const date = new Date(report.createdAt || Date.now());
      const formattedDate = date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      reportsHtml += `
        <div class="saved-report-item" data-id="${report.id}">
          <h3 class="saved-report-title">${report.title || 'Relatório sem título'}</h3>
          <p class="saved-report-date">Criado em ${formattedDate}</p>
          <p class="saved-report-desc">${report.description || 'Sem descrição'}</p>
        </div>
      `;
    });
    
    reportsHtml += '</div>';
    panelContent.innerHTML = reportsHtml;
    
    // Configurar eventos para os itens de relatório
    const reportItems = document.querySelectorAll('.saved-report-item');
    
    reportItems.forEach(item => {
      item.addEventListener('click', function() {
        const reportId = this.getAttribute('data-id');
        if (reportId) {
          loadReport(reportId);
        }
      });
    });
  }

  /**
   * Carrega o painel de relatórios agendados
   */
  function loadScheduledReportsPanel() {
    const panelContent = document.querySelector('.panel-content');
    if (!panelContent) return;
    
    // Verificar se há relatórios agendados
    if (scheduledReports.length === 0) {
      panelContent.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 30px 0;">
          <div style="font-size: 3rem; margin-bottom: 20px; color: var(--text-lighter, #97a0af);">🗓️</div>
          <h3 style="margin: 0; font-size: 1.1rem; font-weight: 500; color: var(--text-dark, #333333);">Nenhum relatório agendado</h3>
          <p style="margin: 10px 0 0 0; font-size: 0.9rem; color: var(--text-light, #5e6c84);">Agende relatórios para envio automático</p>
        </div>
      `;
      return;
    }
    
    // Criar HTML para cada relatório agendado
    let reportsHtml = '<div class="scheduled-reports-list">';
    
    scheduledReports.forEach(report => {
      const nextRunDate = new Date(report.nextRun || Date.now());
      const formattedNextRun = nextRunDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const frequency = getScheduleFrequencyText(report.frequency);
      
      reportsHtml += `
        <div class="scheduled-report-item" data-id="${report.id}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <h3 class="scheduled-report-title">${report.title || 'Relatório sem título'}</h3>
            <span class="scheduled-report-status">${report.active ? 'Ativo' : 'Inativo'}</span>
          </div>
          <p class="scheduled-report-schedule">
            <span style="display: inline-block; width: 18px; height: 18px; text-align: center; line-height: 18px;">🔄</span>
            ${frequency}
          </p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
            <span style="font-size: 0.85rem; color: var(--text-light, #5e6c84);">Próximo envio: ${formattedNextRun}</span>
            <div>
              <button class="btn-icon edit-schedule-btn" data-id="${report.id}" title="Editar agendamento" style="margin-right: 5px; font-size: 0.85rem;">✏️</button>
              <button class="btn-icon delete-schedule-btn" data-id="${report.id}" title="Excluir agendamento" style="font-size: 0.85rem;">🗑️</button>
            </div>
          </div>
        </div>
      `;
    });
    
    reportsHtml += '</div>';
    panelContent.innerHTML = reportsHtml;
    
    // Configurar eventos para os botões de edição e exclusão
    document.querySelectorAll('.edit-schedule-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const reportId = this.getAttribute('data-id');
        editScheduledReport(reportId);
      });
    });
    
    document.querySelectorAll('.delete-schedule-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const reportId = this.getAttribute('data-id');
        deleteScheduledReport(reportId);
      });
    });
    
    // Configurar eventos para os itens de relatório
    document.querySelectorAll('.scheduled-report-item').forEach(item => {
      item.addEventListener('click', function() {
        const reportId = this.getAttribute('data-id');
        const scheduledReport = scheduledReports.find(r => r.id === reportId);
        
        if (scheduledReport && scheduledReport.reportId) {
          loadReport(scheduledReport.reportId);
        }
      });
    });
  }

  /**
   * Gera um texto amigável para a frequência de agendamento
   * @param {string} frequency - Frequência de agendamento
   * @returns {string} Texto descritivo
   */
  function getScheduleFrequencyText(frequency) {
    switch (frequency) {
      case 'daily':
        return 'Diariamente';
      case 'weekly':
        return 'Semanalmente';
      case 'monthly':
        return 'Mensalmente';
      case 'quarterly':
        return 'Trimestralmente';
      default:
        return 'Personalizado';
    }
  }

  /**
   * Gera um relatório avançado com base nas configurações
   */
  function generateAdvancedReport() {
    console.log("Gerando relatório avançado...");
    
    // Coletar configurações do relatório
    const config = collectReportConfig();
    
    // Validar configurações
    if (!config) {
      console.error("Configurações de relatório inválidas");
      return;
    }
    
    // Mostrar indicador de carregamento
    showLoading(true, "Gerando relatório...");
    
    // Simular chamada à API
    setTimeout(() => {
      // Criar relatório de exemplo
      currentReport = createSampleReport(config);
      
      // Renderizar relatório na pré-visualização
      renderReportPreview(currentReport);
      
      // Esconder indicador de carregamento
      showLoading(false);
    }, 1500);
  }

  /**
   * Coleta as configurações do relatório do formulário
   * @returns {Object|null} Configurações ou null se inválido
   */
  function collectReportConfig() {
    // Obter título do relatório
    const title = document.getElementById('report-title').value || 'Relatório de Manutenções';
    
    // Obter período
    let startDate, endDate;
    const selectedRange = document.querySelector('.date-range-option.active');
    
    if (selectedRange) {
      const range = selectedRange.getAttribute('data-range');
      
      if (range === 'custom') {
        // Usar datas personalizadas
        const startInput = document.getElementById('report-start-date');
        const endInput = document.getElementById('report-end-date');
        
        if (startInput && endInput && startInput.value && endInput.value) {
          startDate = new Date(startInput.value);
          endDate = new Date(endInput.value);
        } else {
          // Datas personalizadas inválidas
          if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
            Utilities.showNotification("Por favor, selecione datas válidas.", "warning");
          } else {
            alert("Por favor, selecione datas válidas.");
          }
          return null;
        }
      } else {
        // Usar período predefinido
        const days = parseInt(range, 10);
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(endDate.getDate() - days);
      }
    } else {
      // Nenhum período selecionado, usar padrão
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(endDate.getDate() - config.defaultDateRange);
    }
    
    // Formatar datas para ISO string
    const startDateString = startDate.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];
    
    // Obter filtros
    const filters = {
      maintenanceType: document.getElementById('filter-maintenance-type').value,
      status: document.getElementById('filter-status').value,
      equipmentType: document.getElementById('filter-equipment-type').value,
      area: document.getElementById('filter-area').value,
      critical: document.getElementById('filter-critical').checked
    };
    
    // Obter visualizações selecionadas
    const visualizations = [];
    document.querySelectorAll('.visualization-option.active').forEach(viz => {
      visualizations.push(viz.getAttribute('data-viz'));
    });
    
    return {
      title,
      period: {
        startDate: startDateString,
        endDate: endDateString,
        label: selectedRange ? selectedRange.textContent : `${config.defaultDateRange} dias`
      },
      filters,
      visualizations,
      id: 'report-' + Date.now(),
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Cria um relatório de exemplo para demonstração
   * @param {Object} config - Configurações do relatório
   * @returns {Object} Dados do relatório
   */
  function createSampleReport(config) {
    // Criar dados de exemplo para o relatório
    return {
      ...config,
      summary: {
        total: 157,
        completed: 89,
        pending: 42,
        critical: 26
      },
      charts: {
        status: [
          { label: 'Concluído', count: 89 },
          { label: 'Pendente', count: 42 },
          { label: 'Verificado', count: 18 },
          { label: 'Reprovado', count: 8 }
        ],
        type: [
          { label: 'Preventiva', count: 78 },
          { label: 'Corretiva', count: 53 },
          { label: 'Emergencial', count: 26 }
        ],
        area: [
          { label: 'Área Interna Usiminas', count: 92 },
          { label: 'Área Externa Usiminas', count: 65 }
        ],
        timeline: [
          { label: 'Jan', count: 12 },
          { label: 'Fev', count: 15 },
          { label: 'Mar', count: 18 },
          { label: 'Abr', count: 22 },
          { label: 'Mai', count: 19 },
          { label: 'Jun', count: 28 },
          { label: 'Jul', count: 20 },
          { label: 'Ago', count: 23 }
        ]
      },
      items: generateSampleItems(157)
    };
  }

  /**
   * Gera itens de exemplo para o relatório
   * @param {number} count - Quantidade de itens
   * @returns {Array} Itens gerados
   */
  function generateSampleItems(count) {
    const items = [];
    const equipmentTypes = ['Alta Pressão', 'Auto Vácuo / Hiper Vácuo', 'Aspirador', 'Poliguindaste', 'Outro'];
    const maintenanceTypes = ['Preventiva', 'Corretiva', 'Emergencial'];
    const statuses = ['Pendente', 'Verificado', 'Aprovado', 'Reprovado', 'Concluído'];
    const areas = ['Área Interna Usiminas', 'Área Externa Usiminas'];
    
    // Gerar IDs de exemplo
    const equipmentIds = [];
    for (let i = 0; i < 20; i++) {
      const prefix = ['PUB', 'LUX', 'EZS', 'EOF', 'DSY'][Math.floor(Math.random() * 5)];
      const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      equipmentIds.push(`${prefix}-${suffix}`);
    }
    
    // Gerar nomes de responsáveis
    const technicians = [
      'Carlos Silva', 'Ana Oliveira', 'Roberto Santos', 'Mariana Lima',
      'Paulo Souza', 'Fernanda Costa', 'Lucas Pereira', 'Juliana Almeida'
    ];
    
    // Gerar itens
    for (let i = 0; i < count; i++) {
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 180)); // Até 180 dias atrás
      
      const critical = Math.random() < 0.2; // 20% críticos
      
      items.push({
        id: `MAINT-${1000 + i}`,
        equipmentType: equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)],
        equipmentId: equipmentIds[Math.floor(Math.random() * equipmentIds.length)],
        maintenanceType: maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        technician: technicians[Math.floor(Math.random() * technicians.length)],
        area: areas[Math.floor(Math.random() * areas.length)],
        date: createdDate.toISOString().split('T')[0],
        critical
      });
    }
    
    return items;
  }

  /**
   * Renderiza a pré-visualização do relatório
   * @param {Object} report - Dados do relatório
   */
  function renderReportPreview(report) {
    const previewContainer = document.getElementById('report-preview-container');
    if (!previewContainer) return;
    
    const startDate = new Date(report.period.startDate);
    const endDate = new Date(report.period.endDate);
    
    // Formatar datas para exibição
    const formatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    const startDateFormatted = startDate.toLocaleDateString('pt-BR', formatOptions);
    const endDateFormatted = endDate.toLocaleDateString('pt-BR', formatOptions);
    
    // Criar HTML do relatório
    let html = `
      <div class="report-preview">
        <div class="report-header" style="margin-bottom: 20px; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 15px;">
          <h2 style="margin: 0 0 5px 0; font-size: 1.5rem; color: var(--primary-color, #1a5fb4);">${report.title}</h2>
          <p style="margin: 0; font-size: 0.9rem; color: var(--text-light, #5e6c84);">Período: ${startDateFormatted} até ${endDateFormatted}</p>
          
          <div style="margin-top: 15px; font-size: 0.85rem; color: var(--text-light, #5e6c84);">
            <strong>Filtros aplicados:</strong>
            <ul style="margin: 5px 0 0 0; padding-left: 20px;">
              ${report.filters.maintenanceType ? `<li>Tipo de Manutenção: ${report.filters.maintenanceType}</li>` : ''}
              ${report.filters.status ? `<li>Status: ${report.filters.status}</li>` : ''}
              ${report.filters.equipmentType ? `<li>Tipo de Equipamento: ${report.filters.equipmentType}</li>` : ''}
              ${report.filters.area ? `<li>Área: ${report.filters.area}</li>` : ''}
              ${report.filters.critical ? `<li>Apenas Manutenções Críticas</li>` : ''}
              ${!report.filters.maintenanceType && !report.filters.status && !report.filters.equipmentType && !report.filters.area && !report.filters.critical ? '<li>Nenhum filtro aplicado</li>' : ''}
            </ul>
          </div>
        </div>
    `;
    
    // Adicionar seções conforme visualizações selecionadas
    if (report.visualizations.includes('summary')) {
      html += renderSummarySection(report);
    }
    
    // Adicionar gráficos em grid
    const charts = [];
    
    if (report.visualizations.includes('status')) {
      charts.push({
        title: 'Status das Manutenções',
        id: 'report-status-chart',
        type: 'doughnut',
        data: report.charts.status
      });
    }
    
    if (report.visualizations.includes('type')) {
      charts.push({
        title: 'Tipos de Manutenção',
        id: 'report-type-chart',
        type: 'bar',
        data: report.charts.type
      });
    }
    
    if (report.visualizations.includes('area')) {
      charts.push({
        title: 'Distribuição por Área',
        id: 'report-area-chart',
        type: 'pie',
        data: report.charts.area
      });
    }
    
    if (report.visualizations.includes('timeline')) {
      charts.push({
        title: 'Linha do Tempo',
        id: 'report-timeline-chart',
        type: 'line',
        data: report.charts.timeline
      });
    }
    
    if (charts.length > 0) {
      html += `<div class="report-charts-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px;">`;
      
      charts.forEach(chart => {
        html += `
          <div class="chart-container" style="background-color: white; border-radius: 8px; padding: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <h3 style="margin: 0 0 15px 0; font-size: 1rem; color: var(--text-dark, #333333);">${chart.title}</h3>
            <div style="height: 250px; position: relative;">
              <canvas id="${chart.id}"></canvas>
            </div>
          </div>
        `;
      });
      
      html += `</div>`;
    }
    
    // Adicionar tabela de dados se selecionada
    if (report.visualizations.includes('table')) {
      html += renderDataTable(report);
    }
    
    html += `</div>`;
    
    // Atualizar conteúdo
    previewContainer.innerHTML = html;
    
    // Renderizar gráficos
    renderReportCharts(charts, report);
  }

  /**
   * Renderiza a seção de resumo do relatório
   * @param {Object} report - Dados do relatório
   * @returns {string} HTML da seção
   */
  function renderSummarySection(report) {
    return `
      <div class="report-summary" style="margin-bottom: 30px;">
        <h3 style="margin: 0 0 15px 0; font-size: 1.1rem; color: var(--text-dark, #333333);">Resumo do Período</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          <div style="background-color: rgba(26, 95, 180, 0.05); border-radius: 8px; padding: 15px; border-left: 4px solid var(--primary-color, #1a5fb4);">
            <div style="font-size: 0.85rem; color: var(--text-light, #5e6c84); margin-bottom: 5px;">Total de Manutenções</div>
            <div style="font-size: 1.8rem; font-weight: 600; color: var(--text-dark, #333333);">${report.summary.total}</div>
          </div>
          <div style="background-color: rgba(43, 147, 72, 0.05); border-radius: 8px; padding: 15px; border-left: 4px solid var(--status-completed, #2b9348);">
            <div style="font-size: 0.85rem; color: var(--text-light, #5e6c84); margin-bottom: 5px;">Concluídas</div>
            <div style="font-size: 1.8rem; font-weight: 600; color: var(--status-completed, #2b9348);">${report.summary.completed}</div>
          </div>
          <div style="background-color: rgba(240, 173, 78, 0.05); border-radius: 8px; padding: 15px; border-left: 4px solid var(--status-pending, #f0ad4e);">
            <div style="font-size: 0.85rem; color: var(--text-light, #5e6c84); margin-bottom: 5px;">Pendentes</div>
            <div style="font-size: 1.8rem; font-weight: 600; color: var(--status-pending, #f0ad4e);">${report.summary.pending}</div>
          </div>
          <div style="background-color: rgba(204, 0, 0, 0.05); border-radius: 8px; padding: 15px; border-left: 4px solid var(--status-danger, #cc0000);">
            <div style="font-size: 0.85rem; color: var(--text-light, #5e6c84); margin-bottom: 5px;">Críticas</div>
            <div style="font-size: 1.8rem; font-weight: 600; color: var(--status-danger, #cc0000);">${report.summary.critical}</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza uma tabela de dados para o relatório
   * @param {Object} report - Dados do relatório
   * @returns {string} HTML da tabela
   */
  function renderDataTable(report) {
    // Limitar a 10 itens para visualização
    const items = report.items.slice(0, 10);
    
    let html = `
      <div class="report-data-table" style="margin-bottom: 30px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-dark, #333333);">Dados Detalhados</h3>
          <span style="font-size: 0.85rem; color: var(--text-light, #5e6c84);">Mostrando 10 de ${report.items.length} registros</span>
        </div>
        
        <div style="overflow-x: auto; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <table style="width: 100%; border-collapse: collapse; background-color: white;">
            <thead>
              <tr>
                <th style="padding: 12px 15px; text-align: left; border-bottom: 1px solid rgba(0,0,0,0.1); font-size: 0.85rem; font-weight: 600; color: var(--text-dark, #333333);">ID</th>
                <th style="padding: 12px 15px; text-align: left; border-bottom: 1px solid rgba(0,0,0,0.1); font-size: 0.85rem; font-weight: 600; color: var(--text-dark, #333333);">Equipamento</th>
                <th style="padding: 12px 15px; text-align: left; border-bottom: 1px solid rgba(0,0,0,0.1); font-size: 0.85rem; font-weight: 600; color: var(--text-dark, #333333);">Tipo</th>
                <th style="padding: 12px 15px; text-align: left; border-bottom: 1px solid rgba(0,0,0,0.1); font-size: 0.85rem; font-weight: 600; color: var(--text-dark, #333333);">Data</th>
                <th style="padding: 12px 15px; text-align: left; border-bottom: 1px solid rgba(0,0,0,0.1); font-size: 0.85rem; font-weight: 600; color: var(--text-dark, #333333);">Responsável</th>
                <th style="padding: 12px 15px; text-align: left; border-bottom: 1px solid rgba(0,0,0,0.1); font-size: 0.85rem; font-weight: 600; color: var(--text-dark, #333333);">Status</th>
                <th style="padding: 12px 15px; text-align: left; border-bottom: 1px solid rgba(0,0,0,0.1); font-size: 0.85rem; font-weight: 600; color: var(--text-dark, #333333);">Área</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    if (items.length === 0) {
      html += `
        <tr>
          <td colspan="7" style="padding: 15px; text-align: center; color: var(--text-light, #5e6c84);">Nenhum dado encontrado.</td>
        </tr>
      `;
    } else {
      items.forEach((item, index) => {
        const rowStyle = index % 2 === 0 ? 'background-color: rgba(0,0,0,0.02);' : '';
        
        // Definir cor do status
        let statusColor;
        switch (item.status.toLowerCase()) {
          case 'concluído':
          case 'concluido':
            statusColor = 'var(--status-completed, #2b9348)';
            break;
          case 'pendente':
            statusColor = 'var(--status-pending, #f0ad4e)';
            break;
          case 'verificado':
          case 'aprovado':
            statusColor = 'var(--status-verification, #0066cc)';
            break;
          case 'reprovado':
            statusColor = 'var(--status-danger, #cc0000)';
            break;
          default:
            statusColor = 'var(--text-light, #5e6c84)';
        }
        
        // Formatar data
        const date = new Date(item.date);
        const formattedDate = date.toLocaleDateString('pt-BR');
        
        html += `
          <tr style="${rowStyle}">
            <td style="padding: 12px 15px; border-bottom: 1px solid rgba(0,0,0,0.05); font-size: 0.85rem;">${item.id}</td>
            <td style="padding: 12px 15px; border-bottom: 1px solid rgba(0,0,0,0.05); font-size: 0.85rem;">${item.equipmentId}</td>
            <td style="padding: 12px 15px; border-bottom: 1px solid rgba(0,0,0,0.05); font-size: 0.85rem;">
              ${item.maintenanceType}
              ${item.critical ? '<span style="color: var(--status-danger, #cc0000); margin-left: 5px;">⚠️</span>' : ''}
            </td>
            <td style="padding: 12px 15px; border-bottom: 1px solid rgba(0,0,0,0.05); font-size: 0.85rem;">${formattedDate}</td>
            <td style="padding: 12px 15px; border-bottom: 1px solid rgba(0,0,0,0.05); font-size: 0.85rem;">${item.technician}</td>
            <td style="padding: 12px 15px; border-bottom: 1px solid rgba(0,0,0,0.05); font-size: 0.85rem;">
              <span style="display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; background-color: ${statusColor}20; color: ${statusColor};">
                ${item.status}
              </span>
            </td>
            <td style="padding: 12px 15px; border-bottom: 1px solid rgba(0,0,0,0.05); font-size: 0.85rem;">${item.area}</td>
          </tr>
        `;
      });
    }
    
    html += `
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    return html;
  }

  /**
   * Renderiza os gráficos do relatório
   * @param {Array} charts - Configurações dos gráficos
   * @param {Object} report - Dados do relatório
   */
  function renderReportCharts(charts, report) {
    if (!charts || charts.length === 0) return;
    
    // Verificar se Chart.js está disponível
    if (typeof Chart === 'undefined') {
      console.error("Chart.js não está disponível!");
      return;
    }
    
    // Renderizar cada gráfico
    charts.forEach(chart => {
      const canvas = document.getElementById(chart.id);
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      
      // Preparar dados
      const labels = chart.data.map(item => item.label);
      const data = chart.data.map(item => item.count);
      
      // Configurações específicas por tipo
      let chartConfig;
      
      switch (chart.type) {
        case 'doughnut':
          chartConfig = {
            type: 'doughnut',
            data: {
              labels: labels,
              datasets: [{
                data: data,
                backgroundColor: config.defaultChartColors,
                borderWidth: 0
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right',
                  labels: {
                    boxWidth: 12,
                    padding: 15,
                    font: {
                      size: 11
                    }
                  }
                }
              },
              cutout: '60%'
            }
          };
          break;
          
        case 'pie':
          chartConfig = {
            type: 'pie',
            data: {
              labels: labels,
              datasets: [{
                data: data,
                backgroundColor: config.defaultChartColors,
                borderWidth: 0
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right',
                  labels: {
                    boxWidth: 12,
                    padding: 15,
                    font: {
                      size: 11
                    }
                  }
                }
              }
            }
          };
          break;
          
        case 'bar':
          chartConfig = {
            type: 'bar',
            data: {
              labels: labels,
              datasets: [{
                label: 'Quantidade',
                data: data,
                backgroundColor: config.defaultChartColors.slice(0, data.length),
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
                y: {
                  beginAtZero: true,
                  ticks: {
                    precision: 0
                  }
                }
              }
            }
          };
          break;
          
        case 'line':
          chartConfig = {
            type: 'line',
            data: {
              labels: labels,
              datasets: [{
                label: 'Manutenções',
                data: data,
                fill: true,
                backgroundColor: 'rgba(26, 95, 180, 0.1)',
                borderColor: 'rgba(26, 95, 180, 0.8)',
                tension: 0.3
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
                y: {
                  beginAtZero: true,
                  ticks: {
                    precision: 0
                  }
                }
              }
            }
          };
          break;
          
        default:
          console.warn(`Tipo de gráfico não suportado: ${chart.type}`);
          return;
      }
      
      // Criar gráfico
      new Chart(ctx, chartConfig);
    });
  }

  /**
   * Mostra um indicador de carregamento global
   * @param {boolean} show - Mostrar ou esconder
   * @param {string} message - Mensagem a ser exibida
   */
  function showLoading(show, message = 'Carregando...') {
    // Usar a função do Utilities se disponível
    if (typeof Utilities !== 'undefined' && Utilities.showLoading) {
      Utilities.showLoading(show, message);
      return;
    }
    
    // Implementação fallback
    let loader = document.getElementById('global-loader');
    if (!loader) {
      // Criar loader se não existir
      loader = document.createElement('div');
      loader.id = 'global-loader';
      loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.8);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      `;
      
      const spinner = document.createElement('div');
      spinner.className = 'loader-spinner';
      spinner.style.cssText = `
        width: 50px;
        height: 50px;
        border: 5px solid rgba(26, 95, 180, 0.2);
        border-radius: 50%;
        border-top-color: var(--primary-color, #1a5fb4);
        animation: spin 1s ease-in-out infinite;
      `;
      
      const messageEl = document.createElement('div');
      messageEl.id = 'global-loader-message';
      messageEl.style.cssText = `
        margin-top: 15px;
        color: var(--primary-color, #1a5fb4);
        font-weight: 500;
      `;
      
      loader.appendChild(spinner);
      loader.appendChild(messageEl);
      document.body.appendChild(loader);
      
      // Adicionar animação se não existir
      if (!document.getElementById('loader-animation')) {
        const style = document.createElement('style');
        style.id = 'loader-animation';
        style.textContent = `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }
    }
    
    // Atualizar e mostrar/esconder o loader
    const messageEl = document.getElementById('global-loader-message');
    if (messageEl) {
      messageEl.textContent = message;
    }
    
    loader.style.display = show ? 'flex' : 'none';
  }

  /**
   * Abre o modal de opções de exportação
   */
  function openExportOptionsModal() {
    // Verificar se o modal já existe
    let modal = document.getElementById('export-options-modal');
    if (modal) {
      modal.parentNode.style.display = 'flex';
      return;
    }
    
    // Criar overlay para o modal
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'export-options-overlay';
    
    // Criar o modal
    modal = document.createElement('div');
    modal.className = 'modal-container';
    modal.id = 'export-options-modal';
    
    // Conteúdo do modal
    modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">Exportar Relatório</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <p style="margin-top: 0; color: var(--text-light, #5e6c84); font-size: 0.9rem;">Selecione o formato para exportar o relatório atual:</p>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 20px;">
    `;
    
    // Adicionar opções de exportação
    Object.entries(config.exportFormats).forEach(([format, info]) => {
      modal.querySelector('.modal-body').innerHTML += `
        <div class="export-option" data-format="${format}" style="background-color: white; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; padding: 15px; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center;">
          <div style="font-size: 1.5rem; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin-right: 10px;">${info.icon}</div>
          <div>
            <div style="font-weight: 500; color: var(--text-dark, #333333); font-size: 0.95rem;">${info.label}</div>
            <div style="font-size: 0.8rem; color: var(--text-light, #5e6c84); margin-top: 2px;">Exportar como ${info.label}</div>
          </div>
        </div>
      `;
    });
    
    modal.querySelector('.modal-body').innerHTML += `
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary cancel-export-btn" style="background-color: var(--text-light, #5e6c84);">Cancelar</button>
      </div>
    `;
    
    // Adicionar o modal ao overlay
    overlay.appendChild(modal);
    
    // Adicionar ao body
    document.body.appendChild(overlay);
    
    // Configurar eventos
    modal.querySelector('.modal-close').addEventListener('click', () => {
      overlay.style.display = 'none';
    });
    
    modal.querySelector('.cancel-export-btn').addEventListener('click', () => {
      overlay.style.display = 'none';
    });
    
    // Fechar ao clicar fora do modal
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.style.display = 'none';
      }
    });
    
    // Configurar eventos para as opções de exportação
    modal.querySelectorAll('.export-option').forEach(option => {
      option.addEventListener('click', () => {
        const format = option.getAttribute('data-format');
        exportReport(format);
        overlay.style.display = 'none';
      });
      
      // Adicionar hover effect
      option.addEventListener('mouseover', () => {
        option.style.borderColor = 'var(--primary-color, #1a5fb4)';
        option.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
        option.style.backgroundColor = 'rgba(26, 95, 180, 0.02)';
      });
      
      option.addEventListener('mouseout', () => {
        option.style.borderColor = 'rgba(0,0,0,0.1)';
        option.style.boxShadow = 'none';
        option.style.backgroundColor = 'white';
      });
    });
  }

  /**
   * Exporta o relatório atual para o formato especificado
   * @param {string} format - Formato de exportação (pdf, xlsx, csv, json)
   */
  function exportReport(format) {
    // Verificar se há um relatório ativo
    if (!currentReport) {
      if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
        Utilities.showNotification("Nenhum relatório para exportar. Gere um relatório primeiro.", "warning");
      } else {
        alert("Nenhum relatório para exportar. Gere um relatório primeiro.");
      }
      return;
    }
    
    // Verificar se o formato é válido
    if (!Object.keys(config.exportFormats).includes(format)) {
      console.error(`Formato de exportação inválido: ${format}`);
      return;
    }
    
    // Mostrar indicador de carregamento
    showLoading(true, `Exportando relatório como ${config.exportFormats[format].label}...`);
    
    // Simular processamento
    setTimeout(() => {
      // Esconder indicador de carregamento
      showLoading(false);
      
      // Mostrar mensagem de sucesso
      if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
        Utilities.showNotification(`Relatório exportado com sucesso como ${config.exportFormats[format].label}.`, "success");
      } else {
        alert(`Relatório exportado com sucesso como ${config.exportFormats[format].label}.`);
      }
      
      // Aqui você integraria com API.exportData()
      // No futuro, quando a API estiver pronta, você usaria:
      // API.exportData(currentReport.period.startDate, currentReport.period.endDate, format)
      // .then(response => { ... })
    }, 2000);
  }

  /**
   * Salva o relatório atual para uso futuro
   */
  function saveCurrentReport() {
    if (!currentReport) {
      if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
        Utilities.showNotification("Nenhum relatório para salvar. Gere um relatório primeiro.", "warning");
      } else {
        alert("Nenhum relatório para salvar. Gere um relatório primeiro.");
      }
      return;
    }
    
    // Abrir modal para confirmar salvamento
    openSaveReportModal();
  }

  /**
   * Abre o modal para salvar um relatório
   */
  function openSaveReportModal() {
    // Criar overlay para o modal
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    // Criar o modal
    const modal = document.createElement('div');
    modal.className = 'modal-container';
    
    // Conteúdo do modal
    modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">Salvar Relatório</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Título do Relatório</label>
          <input type="text" id="save-report-title" class="form-input" value="${currentReport.title || 'Relatório de Manutenções'}">
        </div>
        <div class="form-group">
          <label class="form-label">Descrição</label>
          <textarea id="save-report-description" class="form-input" rows="3" placeholder="Descrição opcional do relatório..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary cancel-save-btn">Cancelar</button>
        <button class="btn confirm-save-btn" style="background-color: var(--status-completed, #2b9348);">Salvar</button>
      </div>
    `;
    
    // Adicionar o modal ao overlay
    overlay.appendChild(modal);
    
    // Adicionar ao body
    document.body.appendChild(overlay);
    
    // Configurar eventos
    modal.querySelector('.modal-close').addEventListener('click', () => {
      overlay.remove();
    });
    
    modal.querySelector('.cancel-save-btn').addEventListener('click', () => {
      overlay.remove();
    });
    
    // Fechar ao clicar fora do modal
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
    
    // Configurar evento para o botão de salvar
    modal.querySelector('.confirm-save-btn').addEventListener('click', () => {
      const title = document.getElementById('save-report-title').value;
      const description = document.getElementById('save-report-description').value;
      
      if (!title) {
        if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
          Utilities.showNotification("Por favor, insira um título para o relatório.", "warning");
        } else {
          alert("Por favor, insira um título para o relatório.");
        }
        return;
      }
      
      // Salvar o relatório
      const savedReport = {
        ...currentReport,
        title,
        description,
        id: 'report-' + Date.now(),
        createdAt: new Date().toISOString()
      };
      
      // Adicionar ao array de relatórios salvos
      savedReports.push(savedReport);
      
      // Salvar no localStorage
      saveReports();
      
      // Fechar o modal
      overlay.remove();
      
      // Mostrar mensagem de sucesso
      if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
        Utilities.showNotification("Relatório salvo com sucesso!", "success");
      } else {
        alert("Relatório salvo com sucesso!");
      }
      
      // Atualizar painel de relatórios salvos se estiver visível
      const activeTab = document.querySelector('.panel-tab.active');
      if (activeTab && activeTab.getAttribute('data-tab') === 'saved') {
        loadSavedReportsPanel();
      }
    });
  }

  /**
   * Carrega um relatório salvo
   * @param {string} id - ID do relatório
   */
  function loadReport(id) {
    const report = savedReports.find(r => r.id === id);
    
    if (!report) {
      if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
        Utilities.showNotification("Relatório não encontrado.", "error");
      } else {
        alert("Relatório não encontrado.");
      }
      return;
    }
    
    // Definir como relatório atual
    currentReport = report;
    
    // Renderizar relatório
    renderReportPreview(currentReport);
    
    // Atualizar painel de configuração
    updateConfigPanelFromReport(report);
    
    // Mostrar mensagem de sucesso
    if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
      Utilities.showNotification("Relatório carregado com sucesso.", "success");
    }
    
    // Mudar para a aba de novo relatório
    const newReportTab = document.querySelector('.panel-tab[data-tab="new"]');
    if (newReportTab) {
      newReportTab.click();
    }
  }

  /**
   * Atualiza o painel de configuração com base em um relatório carregado
   * @param {Object} report - Relatório carregado
   */
  function updateConfigPanelFromReport(report) {
    // Atualizar título
    const titleInput = document.getElementById('report-title');
    if (titleInput) {
      titleInput.value = report.title || '';
    }
    
    // Atualizar período
    const startDate = new Date(report.period.startDate);
    const endDate = new Date(report.period.endDate);
    const reportStartDate = document.getElementById('report-start-date');
    const reportEndDate = document.getElementById('report-end-date');
    
    // Determinar qual opção de período selecionar
    const diffDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
    let periodOption;
    
    if (diffDays <= 32) {
      periodOption = '30';
    } else if (diffDays <= 92) {
      periodOption = '90';
    } else if (diffDays <= 183) {
      periodOption = '180';
    } else if (diffDays <= 366) {
      periodOption = '365';
    } else {
      periodOption = 'custom';
    }
    
    // Atualizar opção de período
    const dateOptions = document.querySelectorAll('.date-range-option');
    dateOptions.forEach(option => {
      option.classList.remove('active');
      if (option.getAttribute('data-range') === periodOption) {
        option.classList.add('active');
      }
    });
    
    // Atualizar datas personalizadas
    if (reportStartDate) {
      reportStartDate.valueAsDate = startDate;
    }
    
    if (reportEndDate) {
      reportEndDate.valueAsDate = endDate;
    }
    
    // Mostrar/esconder seletor de data personalizado
    const customDateRange = document.getElementById('custom-date-range');
    if (customDateRange) {
      customDateRange.style.display = periodOption === 'custom' ? 'block' : 'none';
    }
    
    // Atualizar filtros
    const filters = report.filters || {};
    
    if (filters.maintenanceType) {
      const maintenanceTypeSelect = document.getElementById('filter-maintenance-type');
      if (maintenanceTypeSelect) {
        maintenanceTypeSelect.value = filters.maintenanceType;
      }
    }
    
    if (filters.status) {
      const statusSelect = document.getElementById('filter-status');
      if (statusSelect) {
        statusSelect.value = filters.status;
      }
    }
    
    if (filters.equipmentType) {
      const equipmentTypeSelect = document.getElementById('filter-equipment-type');
      if (equipmentTypeSelect) {
        equipmentTypeSelect.value = filters.equipmentType;
      }
    }
    
    if (filters.area) {
      const areaSelect = document.getElementById('filter-area');
      if (areaSelect) {
        areaSelect.value = filters.area;
      }
    }
    
    const criticalCheckbox = document.getElementById('filter-critical');
    if (criticalCheckbox) {
      criticalCheckbox.checked = !!filters.critical;
    }
    
    // Atualizar visualizações
    const visualizations = report.visualizations || [];
    document.querySelectorAll('.visualization-option').forEach(option => {
      const vizType = option.getAttribute('data-viz');
      option.classList.toggle('active', visualizations.includes(vizType));
    });
  }

  /**
   * Abre o modal para agendar um relat
