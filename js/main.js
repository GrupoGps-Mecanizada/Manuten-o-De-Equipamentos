// Verificar se as dependências necessárias estão carregadas
// Nota: A verificação inicial pode ser simplificada ou removida, pois o ScriptLoader gerencia isso.
// Mas manter não prejudica.
if (!window.API || !window.API_LOADED || !window.UTILITIES_LOADED) {
  console.error("Erro: Dependências API.js ou Utilities.js não carregadas antes de main.js");
} else {
  console.log("Main.js - Dependências carregadas corretamente (verificação inicial).");
}

// Variável global para rastrear se o sistema já foi inicializado
let isSystemInitialized = false;

/**
 * Inicializa o sistema (CHAMADO PELO SCRIPTLOADER)
 */
function initializeApp() {
  // Verificar se já inicializou antes
  if (isSystemInitialized) {
    console.log("Sistema já inicializado anteriormente. Ignorando chamada repetida.");
    return;
  }
  console.log("Iniciando initializeApp em main.js..."); // Log para confirmação
  isSystemInitialized = true; // Marcar como inicializado AQUI

  // Configurar navegação por tabs
  setupTabNavigation();

  // Configurar modais (sem setupMaintenanceButtons)
  setupModals();

  // Verificar configuração do sistema
  checkSystemConfiguration();

  // *** PARTE MODIFICADA: Inicializar os Módulos ***
  console.log("Chamando inicialização dos módulos a partir de main.js...");
  try {
    // Garantir que API e Utilities estejam realmente carregadas antes de prosseguir
    if (typeof API === 'undefined' || typeof Utilities === 'undefined') {
       throw new Error("Dependências API ou Utilities não estão disponíveis no momento da inicialização dos módulos.");
    }

    if (typeof Dashboard !== 'undefined' && typeof Dashboard.initialize === 'function') {
        console.log("Inicializando Dashboard...");
        Dashboard.initialize();
    } else {
        console.warn("Módulo Dashboard ou Dashboard.initialize não encontrado.");
    }

    if (typeof Maintenance !== 'undefined' && typeof Maintenance.initialize === 'function') {
        console.log("Inicializando Maintenance...");
        Maintenance.initialize();
    } else {
        console.warn("Módulo Maintenance ou Maintenance.initialize não encontrado.");
    }

    if (typeof Verification !== 'undefined' && typeof Verification.initialize === 'function') {
        console.log("Inicializando Verification...");
        Verification.initialize();
    } else {
        console.warn("Módulo Verification ou Verification.initialize não encontrado.");
    }

    if (typeof Reports !== 'undefined' && typeof Reports.initialize === 'function') {
        console.log("Inicializando Reports...");
        Reports.initialize();
    } else {
        console.warn("Módulo Reports ou Reports.initialize não encontrado.");
    }
    console.log("Inicialização dos módulos (tentativa) concluída.");

  } catch (moduleInitError) {
    console.error("Erro durante a inicialização de um módulo:", moduleInitError);
    // Usar showNotification de Utilities se disponível
    if (typeof Utilities !== 'undefined' && typeof Utilities.showNotification === 'function') {
        Utilities.showNotification("Erro crítico ao inicializar um componente da aplicação.", "error");
    } else {
        alert("Erro crítico ao inicializar um componente da aplicação.");
    }
  }
  // *** FIM DA PARTE MODIFICADA ***

  // Atualizar rodapé
  // Mover para cá garante que Utilities.formatDate esteja disponível
  if (typeof Utilities !== 'undefined' && typeof Utilities.formatDate === 'function') {
      const lastUpdateEl = document.getElementById('last-update');
      // Verifica se o elemento existe e se o conteúdo parece não ser uma data válida
      if(lastUpdateEl && (!lastUpdateEl.textContent || lastUpdateEl.textContent === 'Carregando...')) {
          lastUpdateEl.textContent = Utilities.formatDate(new Date(), true);
          console.log("Data de atualização definida dentro de initializeApp.");
      }
      // Atualizar desenvolvedor no rodapé
      const footerDeveloper = document.querySelector('.developer-credit');
      if (footerDeveloper && (!footerDeveloper.textContent || footerDeveloper.textContent !== 'Desenvolvido por Warlison Abreu')) {
        footerDeveloper.textContent = 'Desenvolvido por Warlison Abreu';
      }
  } else {
     console.warn("Utilities.formatDate não disponível para atualizar rodapé.");
  }


  // Ativar a primeira tab APÓS inicializar os módulos
  // Isso garante que os listeners das tabelas (configurados nos módulos) existam antes do conteúdo ser carregado
  if (!document.querySelector('.tab.active')) {
      const defaultTab = document.querySelector('.tab[data-tab="dashboard"]') || document.querySelector('.tab');
      if (defaultTab) {
          console.log("Ativando tab padrão (Dashboard) no final de initializeApp...");
          defaultTab.click(); // Isto chamará loadTabContent para 'dashboard'
      }
  } else {
       console.log("Uma tab já está ativa, não ativando a padrão.");
       // Considerar recarregar o conteúdo da tab ativa se a inicialização falhou antes
       // loadTabContent(document.querySelector('.tab.active').getAttribute('data-tab'));
  }

  console.log("initializeApp em main.js concluído.");
}


/**
 * Configurar navegação por tabs
 */
function setupTabNavigation() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const previouslyActiveTab = document.querySelector('.tab.active');
      const newTabId = this.getAttribute('data-tab');

      // Otimização: Não fazer nada se clicar na tab já ativa
      if (previouslyActiveTab === this) {
          console.log(`Tab ${newTabId} já está ativa.`);
          // Opcional: Forçar recarga se necessário
          // loadTabContent(newTabId);
          return;
      }

      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      this.classList.add('active');
      window.currentTab = newTabId; // Definir a tab atual globalmente (se necessário)
      const currentTabContent = document.getElementById(`tab-${window.currentTab}`);

      if (currentTabContent) {
        currentTabContent.classList.add('active');
      } else {
        console.error(`Conteúdo da tab ${window.currentTab} não encontrado!`);
      }

      // Carregar dados apropriados para a tab
      loadTabContent(window.currentTab);
    });
  });
}

/**
 * Carrega o conteúdo apropriado para a tab selecionada
 */
function loadTabContent(tab) {
  console.log(`Carregando conteúdo para a tab: ${tab}`);
  // Esconder indicador de loading antes de chamar funções específicas (elas mostrarão se precisarem)
  if (typeof Utilities !== 'undefined' && typeof Utilities.showLoading === 'function') {
      Utilities.showLoading(false);
  }

  switch (tab) {
    case 'dashboard':
      if (typeof Dashboard !== 'undefined' && Dashboard.loadDashboardData) {
        Dashboard.loadDashboardData(); // O próprio Dashboard gerencia o loading indicator
      } else {
        console.warn("Módulo Dashboard ou função loadDashboardData não encontrados.");
      }
      break;

    case 'maintenance':
      // A função loadMaintenanceList agora é parte do módulo Maintenance
      if (typeof Maintenance !== 'undefined' && Maintenance.loadMaintenanceList) {
          Maintenance.loadMaintenanceList(); // O próprio Maintenance gerencia o loading
      } else {
         console.warn("Módulo Maintenance ou função loadMaintenanceList não encontrados.");
      }
      break;

    case 'verification':
      if (typeof Verification !== 'undefined' && Verification.loadVerificationData) {
        Verification.loadVerificationData(); // O próprio Verification gerencia o loading
      } else {
         console.warn("Módulo Verification ou função loadVerificationData não encontrados.");
      }
      break;

    case 'reports':
      // Não carrega dados automaticamente, espera a ação do usuário.
      // Pode inicializar algo específico da interface se necessário.
      if (typeof Reports !== 'undefined' /* && Reports.prepareInterface */) {
          // Reports.prepareInterface(); // Exemplo
          console.log("Tab de Relatórios selecionada - aguardando ação do usuário.");
      } else {
         console.warn("Módulo Reports não encontrado.");
      }
      break;

    default:
      console.warn(`Nenhuma ação definida para carregar conteúdo da tab: ${tab}`);
  }
}

/**
 * Configurar comportamento dos modais
 */
function setupModals() {
  // Fechar modais ao clicar no X
  document.querySelectorAll('.form-close').forEach(button => {
    button.addEventListener('click', function() {
      const overlay = this.closest('.form-overlay');
      if (overlay) {
        // Adicionar verificação de segurança antes de fechar? (ex: dados não salvos)
        // if (overlay.id === 'maintenance-form-overlay' && Maintenance.hasUnsavedChanges()) { ... }
        overlay.style.display = 'none';
      }
    });
  });

  // Fechar modais ao clicar fora deles (no backdrop)
  document.querySelectorAll('.form-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
      if (e.target === this) { // Clicou diretamente no overlay (fundo)
         // Adicionar verificação de segurança antes de fechar?
         this.style.display = 'none';
      }
    });
  });

  // Botões de fechar no rodapé dos modais (Exemplo para 'detail-overlay')
  const closeDetailBtn = document.getElementById('close-detail-btn');
  if (closeDetailBtn) {
      closeDetailBtn.addEventListener('click', function() {
          const detailOverlay = document.getElementById('detail-overlay');
          if (detailOverlay) {
              detailOverlay.style.display = 'none';
          }
      });
  }

  // Botão de verificar manutenção (Exemplo para 'detail-overlay')
  const verifyMaintenanceBtn = document.getElementById('verify-maintenance-btn');
   if (verifyMaintenanceBtn) {
      verifyMaintenanceBtn.addEventListener('click', function() {
        const maintenanceId = window.selectedMaintenanceId; // Assume ID global definido ao abrir detalhes
        if (maintenanceId) {
          const detailOverlay = document.getElementById('detail-overlay');
          if (detailOverlay) {
              detailOverlay.style.display = 'none'; // Fecha o modal de detalhes
          }

          // Abrir formulário de verificação com pequeno atraso para UI
          setTimeout(() => {
            // Chamar a função do MÓDULO Verification
            if (typeof Verification !== 'undefined' && Verification.openVerificationForm) {
              Verification.openVerificationForm(maintenanceId);
            } else {
              console.error("Módulo Verification ou Verification.openVerificationForm não encontrado.");
              if(typeof Utilities !== 'undefined') Utilities.showNotification("Erro: Função de verificação não disponível.", "error");
            }
          }, 100);
        } else {
            console.warn("ID da manutenção não selecionado para verificação a partir dos detalhes.");
             if(typeof Utilities !== 'undefined') Utilities.showNotification("ID da manutenção não encontrado.", "warning");
        }
      });
   }

   // **REMOVIDO**: setupMaintenanceButtons(); não é mais chamado aqui
}


/**
 * Verificar se o sistema está configurado adequadamente
 */
function checkSystemConfiguration() {
  if (!window.API || typeof API.ping !== 'function') {
    console.error("API não está definida ou incompleta!");
    if (typeof Utilities !== 'undefined') {
        Utilities.showNotification("Erro CRÍTICO ao carregar a API do sistema. Funcionalidades podem estar indisponíveis. Tente recarregar a página.", "error", 10000);
    }
    return;
  }

  console.log("Verificando conexão com a API...");
  API.ping()
    .then(response => {
      if (response.success) {
        console.log("Conexão com a API estabelecida com sucesso.");
        console.log("Versão da API:", response.version || "Desconhecida");
      } else {
        console.error("Falha na conexão com a API (API.ping retornou erro):", response);
        if (typeof Utilities !== 'undefined') {
            Utilities.showNotification(`Falha na conexão com o servidor: ${response.message || 'Erro desconhecido'}.`, "error");
        }
      }
    })
    .catch(error => {
      console.error("Erro GERAL ao testar conexão com a API:", error);
      if (typeof Utilities !== 'undefined') {
        Utilities.showNotification("Erro GERAL ao conectar ao servidor: " + error.message, "error");
      }
    });
}

// para serem chamadas pelos listeners de evento nos diferentes módulos (Dashboard, Maintenance, Verification).
// Garantir que elas estejam acessíveis globalmente ou via namespace (ex: Utilities.viewMaintenanceDetails).

// Expor initializeApp globalmente para ser chamado pelo ScriptLoader
window.initializeApp = initializeApp;
