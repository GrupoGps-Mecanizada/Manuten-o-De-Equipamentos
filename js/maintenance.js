/ Verificar dependências no início
if (!window.API || !window.Utilities) {
  console.error("Erro CRÍTICO: Dependências API ou Utilities não carregadas antes de maintenance.js");
} else {
  console.log("Maintenance.js - Dependências API e Utilities parecem carregadas.");
}

// Definir o módulo Maintenance com funcionalidade adaptada para o HTML existente
const Maintenance = (() => {
  // --- Listas de Equipamentos Completas ---
  // REMOVIDO: const EQUIPMENT_IDS = { ... } conforme a atualização

  // Lista de categorias de problemas padrão
  const DEFAULT_PROBLEM_CATEGORIES = [
    "Motor Estacionário", "Motor Principal", "Tanque", "Válvulas", "Bomba de Água",
    "Sistema Hidráulico", "Sistema Elétrico", "Painel de Comando", "Freios", "Suspensão",
    "Pneus", "Transmissão", "Documentação", "Sinalização", "Carroceria", "Outros"
  ];

  let formData = {};
  let isEditMode = false;
  let editingMaintenanceId = null;
  let fullMaintenanceList = [];

  // --- Função de Inicialização ---
  function initialize() {
    console.log("Maintenance.initialize() chamado.");

    // Adicionar filtros inteligentes
    createMaintenanceFilters(); // Cria a UI dos filtros

    // Carregar dados iniciais para os dropdowns
    loadInitialData();

    // Configurar listeners básicos (formulário, navegação, etc.)
    setupBasicListeners();

    // Carregar lista inicial de manutenções
    loadMaintenanceList(); // Carrega a lista completa inicialmente
  }


  // --- Carregamento de Dados Iniciais ---
  function loadInitialData() {
    // Preencher dropdown de tipos de equipamento
    populateEquipmentTypes();

    // Preencher dropdown de categorias de problema
    populateProblemCategories();

    // Definir data atual no campo de data
    setCurrentDate();
  }

  function populateEquipmentTypes() {
    const select = document.getElementById('equipment-type');
    if (!select) {
      console.error("Elemento select #equipment-type não encontrado!");
      return;
    }

    // Limpar opções existentes (mantendo a primeira)
    select.innerHTML = '<option value="">Selecione o tipo...</option>';

    // Tipos que usarão a API para buscar equipamentos
    const apiDrivenTypes = ['Alta Pressão', 'Auto Vácuo / Hiper Vácuo'];

    apiDrivenTypes.forEach(type => {
        const option = document.createElement('option');
        const typeSlug = type.toLowerCase().replace(/ /g, '-').replace(/\//g, '-');
        option.value = typeSlug;
        option.textContent = type;
        select.appendChild(option);
    });

    // Adiciona 'Aspirador', 'Poliguindaste', 'Outro' explicitamente, garantindo o value correto
    // Estes tipos não buscarão equipamentos de uma lista, mas sim um campo de texto.
    ['Aspirador', 'Poliguindaste', 'Outro'].forEach(typeName => {
        const typeKey = typeName.toLowerCase(); // ex: 'aspirador'
        const option = document.createElement('option');
        option.value = typeKey;
        option.textContent = typeName;
        select.appendChild(option);
    });

    console.log(`Dropdown de tipos de equipamento preenchido.`);
  }


  function populateProblemCategories() {
    // ID Corrigido: 'problem-category-select'
    const select = document.getElementById('problem-category-select');
    if (!select) {
      // Mensagem Corrigida
      console.error("Elemento select #problem-category-select não encontrado!");
      return;
    }

    // Limpar opções existentes (mantendo a primeira)
    select.innerHTML = '<option value="">Selecione a categoria...</option>';

    // Adicionar categorias padrão
    DEFAULT_PROBLEM_CATEGORIES.forEach(category => {
      const option = document.createElement('option');
      option.value = category; // Usar a própria string como valor
      option.textContent = category;
      select.appendChild(option);
    });

    console.log(`Dropdown de categorias de problema preenchido com ${DEFAULT_PROBLEM_CATEGORIES.length} opções`);
  }

  function setCurrentDate() {
    const dateInput = document.getElementById('maintenance-date');
    if (dateInput) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');

      dateInput.value = `${year}-${month}-${day}`;
    } else {
        console.warn("Campo de data #maintenance-date não encontrado para definir data atual.");
    }
  }

  // --- Configuração de Listeners ---
  function setupBasicListeners() {
    console.log("Configurando listeners básicos do módulo Maintenance...");

    // Botão para abrir formulário
    addSafeListener('new-maintenance', 'click', () => {
      openMaintenanceForm();
    });

    // Botões de navegação entre etapas (usa a função atualizada abaixo)
    setupNavigationListeners();

    // Botões de fechar modal
    setupCloseModalListeners();

    // Eventos para campos dinâmicos (usa a função atualizada abaixo)
    setupDynamicFieldListeners(); // Controla visibilidade de ID vs Outro

    // Listener para campo de categoria (movido para setupDynamicFieldListeners na versão original, mas mantido aqui para clareza separeted)
    setupProblemCategoryListener(); // Configura o listener para Categoria de Problema ('Outros')

    // Form submit (usa a função atualizada abaixo)
    setupFormSubmitListener();

    // Listeners dos filtros (criados por createMaintenanceFilters)
    setupMaintenanceFilterListeners(); // Configura os botões Aplicar/Limpar dos filtros
  }

  function setupNavigationListeners() {
    // Botão "Próximo para Etapa 2"
    addSafeListener('next-to-step-2', 'click', function() {
      if (validateStep1()) { // Valida campos da etapa 1
        saveStep1Data(); // Salva os dados antes de avançar
        showStep(2); // Avança para a etapa 2
      } else {
        console.warn("Validação da etapa 1 falhou.");
        showNotification("Verifique os campos obrigatórios da Etapa 1.", "warning");
      }
    });

    // Botão "Próximo para Etapa 3"
    addSafeListener('next-to-step-3', 'click', function() {
      console.log("Botão para próxima etapa (2->3) clicado");
      if (validateStep2()) { // Valida campos da etapa 2
        saveStep2Data(); // Salva dados da etapa 2
        updateSummary(); // Atualiza o resumo na etapa 3
        showStep(3); // Avança para a etapa 3
      } else {
        console.warn("Validação da etapa 2 falhou.");
        showNotification("Verifique os campos obrigatórios da Etapa 2.", "warning");
      }
    });

    // Botões de voltar
    addSafeListener('back-to-step-1', 'click', function() {
      showStep(1);
    });

    addSafeListener('back-to-step-2', 'click', function() {
      showStep(2);
    });
  }

  function setupCloseModalListeners() {
    const closeButtons = [
      'close-maintenance-form',
      'cancel-maintenance'
    ];

    closeButtons.forEach(id => {
      addSafeListener(id, 'click', closeForm);
    });
     // Fechar clicando fora do modal (no overlay)
    const overlay = document.getElementById('maintenance-form-overlay');
    if (overlay) {
        // Usar um listener seguro também
        const newOverlay = overlay.cloneNode(false); // Clone raso para não clonar o modal interno
        overlay.parentNode.replaceChild(newOverlay, overlay);
        newOverlay.addEventListener('click', function(event) {
            if (event.target === newOverlay) { // Clicou no próprio overlay?
                closeForm();
            }
        });
    }
  }

  // =========================================================================
  // == INÍCIO DA FUNÇÃO SUBSTITUÍDA PELA ATUALIZAÇÃO B =======================
  // =========================================================================
  // ARQUIVO: maintenance.js
  // FUNÇÃO: setupDynamicFieldListeners
  function setupDynamicFieldListeners() {
    console.log("### Configurando listeners de campos dinâmicos ###");
    const equipmentTypeSelect = document.getElementById('equipment-type');

    if (!equipmentTypeSelect) {
      console.error("ERRO: Select #equipment-type não encontrado!");
      // Se o elemento não existir, podemos verificar se o formulário está realmente carregado
      const formModal = document.getElementById('maintenance-form-modal');
      if (!formModal) {
        console.error("Formulário ainda não foi carregado corretamente no DOM");
      }
      return;
    }

    // Identificando os containers dos campos
    const equipmentIdContainer = document.getElementById('equipment-id')?.closest('.form-col');
    const otherEquipmentField = document.getElementById('other-equipment-field');

    if (!equipmentIdContainer || !otherEquipmentField) {
      console.error("ERRO: Containers #equipment-id (.form-col) ou #other-equipment-field não encontrados!");
      return;
    }

    // Definir estado inicial: esconder ambos os campos
    equipmentIdContainer.style.display = 'none';
    otherEquipmentField.style.display = 'none';

    // Remover listener antigo para evitar duplicação
    const newEquipmentTypeSelect = equipmentTypeSelect.cloneNode(true);
    equipmentTypeSelect.parentNode.replaceChild(newEquipmentTypeSelect, equipmentTypeSelect);

    // Adicionar listener ao novo select
    newEquipmentTypeSelect.addEventListener('change', function() {
      const selectedValue = this.value; // O valor (slug): 'alta-pressao', 'aspirador', 'outro', etc.
      const selectedText = this.options[this.selectedIndex]?.textContent || ''; // O texto exibido: 'Alta Pressão', 'Aspirador', 'Outro'
      console.log(`Tipo selecionado: "${selectedText}" (valor: "${selectedValue}")`);

      // Mostrar indicador de loading enquanto processa
      showLoading(true, "Carregando opções...");

      // Esconder ambos os campos antes de decidir qual mostrar
      equipmentIdContainer.style.display = 'none';
      otherEquipmentField.style.display = 'none';

      // Resetar os campos para evitar dados incorretos
      const equipmentIdSelect = document.getElementById('equipment-id');
      const otherEquipmentInput = document.getElementById('other-equipment');

      if (equipmentIdSelect) {
        equipmentIdSelect.innerHTML = '<option value="">Selecione o equipamento...</option>';
        equipmentIdSelect.disabled = true;
        equipmentIdSelect.removeAttribute('required');
      }

      if (otherEquipmentInput) {
        otherEquipmentInput.value = '';
        otherEquipmentInput.removeAttribute('required');
      }

      // Decidir qual campo mostrar
      if (selectedValue === 'aspirador' || selectedValue === 'poliguindaste' || selectedValue === 'outro') {
        // Mostrar campo de texto para 'Aspirador', 'Poliguindaste' ou 'Outro'
        console.log("Mostrando campo 'other-equipment-field'");
        otherEquipmentField.style.display = 'block';

        if (otherEquipmentInput) {
          otherEquipmentInput.setAttribute('required', 'required');
          setTimeout(() => otherEquipmentInput.focus(), 50);
        }
        
        showLoading(false); // Esconde loading para estes casos
      }
      else if (selectedValue && selectedText) {
        // Mostrar select de equipamentos para tipos pré-definidos
        console.log("Mostrando lista de equipamentos para:", selectedText);
        equipmentIdContainer.style.display = 'block';

        if (equipmentIdSelect) {
          equipmentIdSelect.setAttribute('required', 'required');
          
          // Usar a função que agora busca do backend via API
          populateEquipmentSelect(selectedText, equipmentIdSelect);
        }
        
        // O loading será escondido dentro da função populateEquipmentSelect após o carregamento
      } else {
        // Se selectedValue for vazio, ambos os campos permanecem escondidos
        showLoading(false);
      }
    });

    console.log("Listener 'change' configurado para #equipment-type com sucesso.");
  }
  // =========================================================================
  // == FIM DA FUNÇÃO SUBSTITUÍDA PELA ATUALIZAÇÃO B =========================
  // =========================================================================

  // Listener separado para o campo de Categoria de Problema
 function setupProblemCategoryListener() {
      addSafeListener('problem-category-select', 'change', function(event) {
        const selectedCategory = this.value; // O valor é a própria string da categoria
        console.log(`Categoria de problema alterada para: ${selectedCategory}`);

        const otherCategoryField = document.getElementById('other-category-field');
        const otherCategoryInput = document.getElementById('other-category');

        if (otherCategoryField && otherCategoryInput) {
            if (selectedCategory === 'Outros') { // Verifica se a string selecionada é 'Outros'
                otherCategoryField.style.display = 'block'; // Ou 'flex'
                otherCategoryInput.setAttribute('required', 'required');
            } else {
                otherCategoryField.style.display = 'none';
                otherCategoryInput.removeAttribute('required');
                otherCategoryInput.value = ''; // Limpa o valor se não for 'Outros'
            }
        } else {
            console.warn("Campos #other-category-field ou #other-category não encontrados.");
        }
    });
 }


  // =========================================================================
  // == INÍCIO DA FUNÇÃO MODIFICADA PELA ATUALIZAÇÃO C =======================
  // =========================================================================
  // ARQUIVO: maintenance.js
  // FUNÇÃO: populateEquipmentSelect
  function populateEquipmentSelect(equipmentTypeText, selectElement) {
    console.log(`Iniciando populateEquipmentSelect para tipo: "${equipmentTypeText}"`);

    if (!selectElement) {
      console.error("Erro: selectElement não fornecido para populateEquipmentSelect");
      return;
    }

    // Mostra mensagem de carregamento
    selectElement.innerHTML = '<option value="">Carregando equipamentos...</option>';
    selectElement.disabled = true;

    // Mostrar indicador de loading
    showLoading(true, `Carregando equipamentos de ${equipmentTypeText}...`);

    // Listas de equipamentos hardcoded para fallback se a API falhar
    const equipmentFallbackLists = {
      "Alta Pressão": [
        "PUB-2G02", "LUX-3201", "FLX7617", "EZS-8765", "EZS-8764", "EVK-0291", 
        "EOF-5C06", "EOF-5208", "EGC-2989", "EGC-2985", "EGC-2983", "EGC-2978", 
        "EAM-3262", "EAM-3256", "EAM-3255", "EAM-3253", "EAM-3010", "DSY-6475", 
        "DSY-6474", "DSY-6472", "CZC-0453"
      ],
      "Auto Vácuo / Hiper Vácuo": [
        "PUB-2F80", "NFF-0235", "HJS-1097", "FSA-3D71", "EGC-2993", "EGC-2979", 
        "EAM-3257", "EAM-3251", "DYB-7210", "DSY-6577", "DSY-6473", "CUB-0763", 
        "ANF-2676", "FTW-4D99", "FTD-6368", "FMD-2200", "FHD-9264", "EZS-9753"
      ]
    };

    // Buscar equipamentos do backend via API
    API.callFunction('obterEquipamentosPorTipo', { tipoEquipamento: equipmentTypeText })
      .then(response => {
        // Limpa e adiciona a opção padrão
        selectElement.innerHTML = '<option value="">Selecione o equipamento...</option>';

        // Populando o select com os dados
        if (response && response.success && response.equipamentos && response.equipamentos.length > 0) {
          console.log(`Populando ${response.equipamentos.length} equipamentos para "${equipmentTypeText}"`);

          response.equipamentos.forEach(item => {
            const option = document.createElement('option');
            option.value = item; // O ID/Placa é o valor
            option.textContent = item; // E também o texto
            selectElement.appendChild(option);
          });

          selectElement.disabled = false; // Habilita para seleção
          console.log(`Select populado com sucesso: ${response.equipamentos.length} equipamentos`);
        } else {
          // Tenta usar as listas fallback se não houver dados da API
          const fallbackList = equipmentFallbackLists[equipmentTypeText] || [];
          if (fallbackList.length > 0) {
            console.log(`Usando lista fallback com ${fallbackList.length} equipamentos para ${equipmentTypeText}`);
            fallbackList.forEach(item => {
              const option = document.createElement('option');
              option.value = item;
              option.textContent = item;
              selectElement.appendChild(option);
            });
            selectElement.disabled = false;
          } else {
            console.warn(`Nenhum equipamento encontrado para o tipo "${equipmentTypeText}"`);
            selectElement.innerHTML += '<option value="" disabled>Nenhum equipamento na lista</option>';
            // Mantém desabilitado
            selectElement.disabled = true;
          }
        }
      })
      .catch(error => {
        console.error(`Erro ao carregar equipamentos para tipo ${equipmentTypeText}:`, error);
        
        // Tenta usar as listas fallback
        const fallbackList = equipmentFallbackLists[equipmentTypeText] || [];
        if (fallbackList.length > 0) {
          console.log(`Usando lista fallback após erro para ${equipmentTypeText}`);
          selectElement.innerHTML = '<option value="">Selecione o equipamento...</option>';
          fallbackList.forEach(item => {
            const option = document.createElement('option');
            option.value = item;
            option.textContent = item;
            selectElement.appendChild(option);
          });
          selectElement.disabled = false;
        } else {
          selectElement.innerHTML = '<option value="">Erro ao carregar</option>';
          selectElement.disabled = true;
        }
        
        // Mostrar notificação do erro
        showNotification(`Erro ao carregar lista de equipamentos: ${error}`, "error");
      })
      .finally(() => {
        showLoading(false);
      });
  }
  // =======================================================================
  // == FIM DA FUNÇÃO MODIFICADA PELA ATUALIZAÇÃO C =======================
  // =======================================================================

  // Função original loadEquipmentsForType - Pode ser removida se populateEquipmentSelect a substitui completamente.
  // Mantida por segurança caso haja alguma chamada inesperada a ela.
  function loadEquipmentsForType(typeSlug, selectElement) {
     console.warn("loadEquipmentsForType chamada, mas populateEquipmentSelect é preferível.", typeSlug);
     // Para compatibilidade, tentar mapear slug de volta para texto
     const equipTypeSelect = document.getElementById('equipment-type');
     let typeText = typeSlug; // Fallback
     if (equipTypeSelect) {
         const option = Array.from(equipTypeSelect.options).find(opt => opt.value === typeSlug);
         if (option) {
             typeText = option.textContent;
         }
     }
     // Chamar a nova função
     populateEquipmentSelect(typeText, selectElement);
     // Poderia adicionar lógica de API aqui se necessário como fallback
  }

  function setupFormSubmitListener() {
    addSafeListener('maintenance-form', 'submit', function(event) {
      event.preventDefault();
      console.log("Formulário submetido (submit event)");

      // Garante que os dados da última etapa visível foram salvos
      // (Embora saveStep1Data e saveStep2Data já devam ter sido chamados ao navegar)
      // saveStep1Data(); // Redundante se a navegação funcionou
      // saveStep2Data(); // Redundante se a navegação funcionou
      // updateSummary(); // Redundante se chegou na etapa 3

      // Valida todas as etapas antes de enviar
      if (validateAllSteps()) {
        submitMaintenance(); // Chama a função de envio (Atualização 4)
      } else {
        showNotification("Por favor, verifique o preenchimento de todos os campos obrigatórios em todas as etapas.", "warning");
        // Tenta levar o usuário para a primeira etapa com erro
        if (!validateStep1(false)) { // Passa false para não mostrar notificação repetida
            showStep(1);
        } else if (!validateStep2(false)) { // Passa false
            showStep(2);
        }
      }
    });
  }

  // Função auxiliar para adicionar listeners de forma segura
  function addSafeListener(elementId, eventType, handler) {
    const element = document.getElementById(elementId);
    if (element) {
      const newElement = element.cloneNode(true); // Clona para remover listeners antigos
      element.parentNode.replaceChild(newElement, element);
      newElement.addEventListener(eventType, handler);
      console.log(`Listener ${eventType} adicionado com segurança para #${elementId}`);
      return true;
    } else {
      // Não exibir warning se o elemento for parte de um formulário que ainda não foi carregado.
      // A nova openMaintenanceForm cuida disso.
      // console.warn(`Elemento #${elementId} não encontrado para adicionar listener de ${eventType}.`);
      return false;
    }
  }

  // --- Funções de UI ---
  function showStep(step) {
    console.log(`Tentando mostrar etapa ${step}`);

    const stepsContent = [
      document.getElementById('step-1-content'),
      document.getElementById('step-2-content'),
      document.getElementById('step-3-content')
    ];

    if (stepsContent.some(s => !s)) {
      // Se os elementos da etapa não existirem (ex: HTML do form não carregado), não fazer nada.
      // A nova openMaintenanceForm vai chamar showStep(1) depois do HTML estar pronto.
      console.warn("Um ou mais containers de etapa (step-X-content) não foram encontrados. A etapa não será mostrada agora.");
      return;
    }

    // Esconder todas as etapas
    stepsContent.forEach(s => {
      if (s) s.style.display = 'none';
    });

    // Mostrar a etapa correta
    if (step >= 1 && step <= 3 && stepsContent[step - 1]) {
      stepsContent[step - 1].style.display = 'block'; // Ou 'flex', etc.
      console.log(`Etapa ${step} mostrada com sucesso`);
      updateStepIndicators(step);
    } else {
      console.error(`Etapa inválida solicitada: ${step}`);
    }
  }

  function updateStepIndicators(currentStep) {
      const stepsIndicators = document.querySelectorAll('#maintenance-form-modal .form-step');
      if(stepsIndicators.length === 0) return;

      stepsIndicators.forEach((indicator, index) => {
          const stepNumber = index + 1;
          indicator.classList.remove('active', 'completed');
          if (stepNumber === currentStep) {
              indicator.classList.add('active');
          } else if (stepNumber < currentStep) {
              indicator.classList.add('completed');
          }
      });
  }

  // =========================================================================
  // == INÍCIO DA FUNÇÃO ATUALIZADA ==========================================
  // =========================================================================
  // ARQUIVO: maintenance.js
  // FUNÇÃO: openMaintenanceForm
  function openMaintenanceForm(maintenanceId = null, data = null) {
    console.log("Abrindo formulário de manutenção", maintenanceId ? `para edição (ID: ${maintenanceId})` : "para novo registro");

    // Verificar se o container do formulário existe, criar se não existir
    let container = document.getElementById('maintenance-form-container');
    if (!container) {
      console.log("Container #maintenance-form-container não encontrado, criando um novo...");
      container = document.createElement('div');
      container.id = 'maintenance-form-container';
      document.body.appendChild(container);
    }

    // Mostrar loading enquanto carregamos
    showLoading(true, "Carregando formulário...");

    // Se o formulário modal já existe, limpar ouvintes e exibí-lo
    const existingForm = document.getElementById('maintenance-form-modal');
    if (existingForm) {
      console.log("Formulário já existe no DOM, reaproveitando...");
      const modal = document.getElementById('maintenance-form-overlay');
      if (modal) {
        // Configurar formulário
        setupFormAfterLoad();
        modal.style.display = 'flex';
        showLoading(false);
        return;
      }
    }

    // Carregar o formulário se não existir
    if (window.API && typeof API.loadMaintenanceForm === 'function') {
      API.loadMaintenanceForm()
        .then(() => {
          console.log("HTML do formulário carregado com sucesso");
          
          // Verificar se o formulário agora existe no DOM
          if (!document.getElementById('maintenance-form-modal')) {
            console.error("Formulário não encontrado no DOM após loadMaintenanceForm()");
            showNotification("Erro ao carregar formulário. Elemento não encontrado.", "error");
            showLoading(false);
            return;
          }
          
          // Popular os dropdowns
          populateEquipmentTypes();
          populateProblemCategories();
          
          // Aguardar um pouco para garantir que o DOM está atualizado
          setTimeout(() => {
            setupFormAfterLoad();
          }, 200);
        })
        .catch(error => {
          console.error("Falha ao carregar HTML do formulário:", error);
          showNotification("Erro ao carregar formulário. Por favor, recarregue a página e tente novamente.", "error");
        })
        .finally(() => {
          showLoading(false);
        });
    } else {
      console.error("API.loadMaintenanceForm não é uma função ou API não está disponível.");
      showNotification("Erro crítico: API não disponível. Recarregue a página.", "error");
      showLoading(false);
    }

    // Função para configurar o formulário após o carregamento
    function setupFormAfterLoad() {
      resetForm(); // Garante um estado limpo
      
      // Verificar se o modal foi carregado
      const modal = document.getElementById('maintenance-form-overlay');
      const formTitle = document.querySelector('#maintenance-form-modal .form-title');
      const submitButton = document.getElementById('submit-maintenance');
      
      if (!modal) {
        console.error("Modal #maintenance-form-overlay não encontrado!");
        showNotification("Erro: Modal do formulário não encontrado.", "error");
        return;
      }
      
      if (maintenanceId && data) {
        // Modo Edição
        isEditMode = true;
        editingMaintenanceId = maintenanceId;
        populateFormForEdit(data);
        if (formTitle) formTitle.textContent = 'Editar Manutenção';
        if (submitButton) submitButton.textContent = 'Atualizar Manutenção';
      } else {
        // Modo Novo Registro
        isEditMode = false;
        editingMaintenanceId = null;
        if (formTitle) formTitle.textContent = 'Registrar Nova Manutenção';
        if (submitButton) submitButton.textContent = 'Registrar Manutenção';
        setCurrentDate(); // Define a data atual apenas para novos registros
      }

      // Mostrar o modal
      modal.style.display = 'flex';
      console.log("Modal de manutenção aberto com sucesso");

      // Garantir que comece na primeira etapa
      showStep(1);
      
      // Inicializar todos os listeners após o HTML estar pronto
      setTimeout(() => {
        console.log("Configurando listeners do formulário...");
        setupDynamicFieldListeners();
        setupNavigationListeners();
        setupProblemCategoryListener();
        setupFormSubmitListener();
        setupCloseModalListeners();
      }, 300); // Atraso maior para garantir que o DOM está pronto
    }
  }
  // =========================================================================
  // == FIM DA FUNÇÃO ATUALIZADA =============================================
  // =========================================================================


  function populateFormForEdit(data) {
    console.log("Populando formulário para edição:", data);

    // --- Etapa 1 ---
    let equipmentTypeValueOrText = data.tipoEquipamento;
    let isManualType = false;

    // Normalizar o tipo para encontrar o 'value' (slug) correto no select
    const equipTypeSelect = document.getElementById('equipment-type');
    const typeOption = Array.from(equipTypeSelect.options).find(opt =>
        opt.textContent === data.tipoEquipamento || opt.value === data.tipoEquipamento?.toLowerCase().replace(/ /g, '-').replace(/\//g, '-')
    );

    if (typeOption) {
        equipmentTypeValueOrText = typeOption.value; // Usa o VALUE (slug) da opção encontrada
        isManualType = ['aspirador', 'poliguindaste', 'outro'].includes(equipmentTypeValueOrText);
        console.log(`Tipo encontrado no select: Texto='${typeOption.textContent}', Valor='${equipmentTypeValueOrText}', É manual=${isManualType}`);
        setSelectValue('equipment-type', equipmentTypeValueOrText); // Define o select pelo VALOR
    } else {
        console.warn(`Tipo de equipamento "${data.tipoEquipamento}" dos dados não encontrado no select. Tentando usar como está.`);
        // Se não encontrou, pode ser um tipo antigo ou erro. Tentar definir mesmo assim.
        setSelectValue('equipment-type', data.tipoEquipamento); // Tenta pelo texto/valor original
        isManualType = ['aspirador', 'poliguindaste', 'outro'].includes(data.tipoEquipamento?.toLowerCase());
    }


    // A função setSelectValue dispara 'change'. Esperar um pouco para a UI atualizar (campos ID/Outro)
    setTimeout(() => {
      const currentSelectedTypeValue = document.getElementById('equipment-type').value; // Pega o valor (slug) que ESTÁ selecionado AGORA
      const isNowManual = ['aspirador', 'poliguindaste', 'outro'].includes(currentSelectedTypeValue);

      console.log("Após timeout, tipo realmente selecionado (valor/slug):", currentSelectedTypeValue, `É manual: ${isNowManual}`);

      // Popula o campo correto (ID ou Outro) baseado no tipo ATUALMENTE selecionado
      if (isNowManual) {
        console.log("Populando #other-equipment com:", data.placaOuId || data.equipamentoOutro || '');
        setInputValue('other-equipment', data.placaOuId || data.equipamentoOutro || '');
      } else if (currentSelectedTypeValue) { // É um tipo com select de ID
        const equipmentIdSelect = document.getElementById('equipment-id');
        // A função populateEquipmentSelect já foi chamada pelo 'change' (se não for manual).
        // Agora, apenas tentamos selecionar o valor correto.
        // Para API.getEquipmentsByType, pode precisar de um delay maior se a API for lenta.
        setTimeout(() => {
            console.log("Populando #equipment-id com:", data.placaOuId);
            if (!setSelectValue('equipment-id', data.placaOuId)) {
                console.warn(`Falha ao selecionar "${data.placaOuId}" no select #equipment-id. Verificando se opção existe...`);
                const exists = Array.from(equipmentIdSelect.options).some(opt => opt.value === data.placaOuId);
                // Se a opção realmente não existe na lista carregada, adiciona-a dinamicamente
                if (!exists && data.placaOuId) {
                    console.log(`Opção "${data.placaOuId}" não encontrada. Adicionando dinamicamente.`);
                    const option = document.createElement('option');
                    option.value = data.placaOuId;
                    option.textContent = data.placaOuId;
                    option.selected = true; // Já a define como selecionada
                    equipmentIdSelect.appendChild(option);
                    equipmentIdSelect.disabled = false; // Garante que esteja habilitado
                }
            }
        }, 300); // Pequeno delay extra para garantir que as opções do populateEquipmentSelect (via API) foram adicionadas
      }

      // Preencher o restante dos campos da etapa 1
      setInputValue('technician-name', data.responsavel);
      setInputValue('maintenance-date', formatDateForInput(data.dataRegistro)); // Formata YYYY-MM-DD
      setSelectValue('area', data.area);
      setInputValue('office', data.localOficina);
      setSelectValue('maintenance-type-select', data.tipoManutencao); // Usa ID correto
      setCheckboxValue('is-critical', data.eCritico);

      // --- Etapa 2 ---
      setSelectValue('problem-category-select', data.categoriaProblema); // Usa ID correto
      // Disparar 'change' manualmente para garantir que o campo 'Outros' apareça se necessário
      const categorySelect = document.getElementById('problem-category-select');
      if(categorySelect) {
           // Espera um pouco antes de disparar o change para garantir que o valor foi setado
           setTimeout(() => {
               categorySelect.dispatchEvent(new Event('change'));
               // Se for 'Outros', preenche o campo específico APÓS o change ter tornado visível
               if (data.categoriaProblema === 'Outros') {
                    setInputValue('other-category', data.categoriaProblemaOutro);
               }
           }, 50);
      }
      setInputValue('problem-description', data.detalhesproblema);
      setInputValue('additional-notes', data.observacoes);

      console.log("Formulário populado para edição (fim).");

    }, 200); // Delay inicial para processar a mudança do tipo de equipamento
  }


  function setSelectValue(id, valueToSet) {
    const element = document.getElementById(id);
    if (!element || element.tagName !== 'SELECT') {
        console.warn(`Elemento select #${id} não encontrado ou não é um select.`);
        return false;
    }
    if (valueToSet === undefined || valueToSet === null) {
        element.selectedIndex = 0; // Seleciona a primeira opção (geralmente "Selecione...")
        return false;
    }

    const valueStr = String(valueToSet);
    let found = false;

    // 1. Tentar pelo VALOR da opção
    for (let i = 0; i < element.options.length; i++) {
      if (String(element.options[i].value) === valueStr) {
        element.selectedIndex = i;
        found = true;
        break;
      }
    }

    // 2. Se não encontrou pelo valor, tentar pelo TEXTO da opção (como fallback)
    if (!found) {
      for (let i = 0; i < element.options.length; i++) {
        // Comparar textos removendo espaços extras
        if (element.options[i].textContent.trim() === valueStr.trim()) {
          element.selectedIndex = i;
          found = true;
          console.log(`Valor/Texto "${valueToSet}" encontrado pelo TEXTO em #${id}`);
          break;
        }
      }
    }

    if (found) {
      console.log(`Valor/Texto "${valueToSet}" definido com sucesso para #${id}`);
      // Disparar evento 'change' de forma assíncrona para permitir que a UI reaja
      setTimeout(() => {
        const event = new Event('change', { bubbles: true });
        element.dispatchEvent(event);
        console.log(`Evento 'change' disparado para #${id}`);
      }, 0);
      return true;
    } else {
      console.warn(`Valor/Texto "${valueToSet}" não encontrado nas opções de #${id}. Opções disponíveis (valores):`, Array.from(element.options).map(opt => opt.value));
      element.selectedIndex = 0; // Deixa no "Selecione..." se não encontrar
      return false;
    }
  }


  function setInputValue(id, value) {
    const element = document.getElementById(id);
    if (element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')) {
      element.value = (value !== undefined && value !== null) ? value : '';
      return true;
    }
    if(element) console.warn(`Elemento #${id} não é INPUT ou TEXTAREA.`);
    else console.warn(`Elemento #${id} não encontrado para setInputValue.`);
    return false;
  }

  function setCheckboxValue(id, value) {
    const element = document.getElementById(id);
    if (element && element.type === 'checkbox') {
      element.checked = !!value; // Converte para booleano (true/false)
      return true;
    }
     if(element) console.warn(`Elemento #${id} não é checkbox.`);
     else console.warn(`Elemento #${id} não encontrado para setCheckboxValue.`);
    return false;
  }

  // Formata data (de API/dados) para o formato YYYY-MM-DD do input type="date"
  function formatDateForInput(dateString) {
    if (!dateString) return '';

    try {
      let date;
      // Tentar detectar formatos comuns (ISO, YYYY-MM-DD, DD/MM/YYYY)
      if (/\d{4}-\d{2}-\d{2}/.test(dateString)) { // Formato YYYY-MM-DD (já correto ou com T...)
          date = new Date(dateString.split('T')[0] + 'T00:00:00Z'); // Usa UTC para evitar timezone shifts
      } else if (/\d{2}\/\d{2}\/\d{4}/.test(dateString)) { // Formato DD/MM/YYYY
          const parts = dateString.split('/');
          date = new Date(Date.UTC(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])));
      } else {
           // Tentar parse genérico (pode ser ISO 8601 completo)
           date = new Date(dateString);
      }

      // Verificar se o parse resultou em uma data válida
      if (!date || isNaN(date.getTime())) {
          console.warn("Data inválida ou formato não reconhecido para formatar para input:", dateString);
          return ''; // Retorna vazio se inválida
      }

      // Extrair partes UTC para garantir consistência
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    } catch (e) {
      console.error("Erro ao formatar data para input:", dateString, e);
      return ''; // Retorna vazio em caso de erro
    }
  }

  function closeForm() {
    console.log("Fechando formulário");
    const modal = document.getElementById('maintenance-form-overlay');
    if (modal) {
      modal.style.display = 'none';
      resetForm(); // Limpa e reseta o formulário ao fechar
      console.log("Modal de manutenção fechado.");
    } else {
      console.error("Modal #maintenance-form-overlay não encontrado ao tentar fechar.");
    }
  }

  function resetForm() {
    const form = document.getElementById('maintenance-form');
    if (form) {
      form.reset(); // Reseta valores dos campos
      console.log("Formulário HTML resetado.");
      // Limpar validações visuais
      form.querySelectorAll('.is-invalid').forEach(el => clearFieldValidation(el));
      form.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
      form.querySelectorAll('.error-message').forEach(el => el.remove());
    } else {
      // Se o formulário não existe no DOM (ainda não carregado), não há o que resetar.
      console.log("Formulário #maintenance-form não encontrado para reset. Pode não ter sido carregado ainda.");
    }

    // Limpar estados internos do módulo
    isEditMode = false;
    editingMaintenanceId = null;
    formData = {}; // Limpa dados coletados

    // Resetar campos dinâmicos/condicionais para o estado inicial (escondidos)
    // Esses elementos podem não existir se o formulário não foi carregado
    const equipmentTypeSelect = document.getElementById('equipment-type');
    if(equipmentTypeSelect) {
        equipmentTypeSelect.selectedIndex = 0; // Volta para "Selecione o tipo"
        equipmentTypeSelect.dispatchEvent(new Event('change'));
    }
    const problemCategorySelect = document.getElementById('problem-category-select');
    if(problemCategorySelect) {
        problemCategorySelect.selectedIndex = 0; // Volta para "Selecione a categoria"
        problemCategorySelect.dispatchEvent(new Event('change'));
    }

    // setCurrentDate() será chamado em openMaintenanceForm se for novo registro.

    // Voltar para primeira etapa e resetar indicadores visuais
    showStep(1);

    // Resetar título e botão de submit para "Novo"
    const formTitle = document.querySelector('#maintenance-form-modal .form-title');
    if (formTitle) formTitle.textContent = 'Registrar Nova Manutenção';
    const submitButton = document.getElementById('submit-maintenance');
    if(submitButton) submitButton.textContent = 'Registrar Manutenção';

    console.log("Estado do formulário completamente resetado.");
  }


  // --- Validação e Coleta de Dados ---

  // Valida os campos da Etapa 1
  function validateStep1(showNotify = true) {
    console.log("Validando etapa 1...");
    // Garante que os elementos existem antes de tentar acessá-los
    const equipmentTypeElement = document.getElementById('equipment-type');
    if (!equipmentTypeElement) {
        console.warn("Elemento #equipment-type não encontrado para validação da Etapa 1.");
        if (showNotify) showNotification("Erro: Formulário não carregado corretamente.", "error");
        return false;
    }

    const fieldsToValidate = [
        { id: 'equipment-type', name: 'Tipo de Equipamento' },
        { id: 'technician-name', name: 'Responsável pelo Relatório' },
        { id: 'maintenance-date', name: 'Data da Manutenção' },
        { id: 'area', name: 'Área' },
        { id: 'office', name: 'Local/Oficina' },
        { id: 'maintenance-type-select', name: 'Tipo de Manutenção' } // ID corrigido
    ];

    const equipmentType = equipmentTypeElement.value; // Valor (slug)
    const equipmentIdElement = document.getElementById('equipment-id');
    const otherEquipmentElement = document.getElementById('other-equipment');

    // Adiciona validação condicional para ID ou Outro, baseado no tipo SELECIONADO
    if (equipmentType === 'aspirador' || equipmentType === 'poliguindaste' || equipmentType === 'outro') {
        // Se o campo 'other-equipment' está visível (seu container)
        if (otherEquipmentElement && isElementVisible(otherEquipmentElement)) {
             fieldsToValidate.push({ id: 'other-equipment', name: 'Identificação/Descrição do Equipamento' });
             // Garante que o atributo required está presente se visível
             if(!otherEquipmentElement.hasAttribute('required')) otherEquipmentElement.setAttribute('required', 'required');
        } else {
             // Se não estiver visível, remove o required (caso tenha ficado de antes)
             if(otherEquipmentElement) otherEquipmentElement.removeAttribute('required');
        }
    } else if (equipmentType) { // Se for um tipo que usa o select de ID
        // Se o campo 'equipment-id' está visível (seu container)
        if (equipmentIdElement && isElementVisible(equipmentIdElement)) {
             fieldsToValidate.push({ id: 'equipment-id', name: 'Placa ou ID do Equipamento' });
             // Garante que o atributo required está presente se visível
             if(!equipmentIdElement.hasAttribute('required')) equipmentIdElement.setAttribute('required', 'required');
        } else {
             // Se não estiver visível, remove o required
             if(equipmentIdElement) equipmentIdElement.removeAttribute('required');
        }
    } else {
         // Se nenhum tipo está selecionado, os campos condicionais não são required
         if(equipmentIdElement) equipmentIdElement.removeAttribute('required');
         if(otherEquipmentElement) otherEquipmentElement.removeAttribute('required');
    }

    // Chama a função de validação genérica (Atualização 5)
    return validateFields(fieldsToValidate, showNotify);
  }

  // Valida os campos da Etapa 2
  function validateStep2(showNotify = true) {
    console.log("Validando etapa 2...");
    const problemCategoryElement = document.getElementById('problem-category-select');
    if (!problemCategoryElement) {
        console.warn("Elemento #problem-category-select não encontrado para validação da Etapa 2.");
        if (showNotify) showNotification("Erro: Formulário não carregado corretamente.", "error");
        return false;
    }

    const requiredFields = [
      { id: 'problem-category-select', name: 'Categoria do Problema' }, // ID corrigido
      { id: 'problem-description', name: 'Detalhes do Problema' }
    ];

    const problemCategory = problemCategoryElement.value;
    const otherCategoryInput = document.getElementById('other-category');

    // Adiciona validação condicional para o campo 'Outra Categoria'
    if (problemCategory === 'Outros') {
       // Se o campo 'other-category' está visível
       if (otherCategoryInput && isElementVisible(otherCategoryInput)) {
          requiredFields.push({ id: 'other-category', name: 'Especificar Categoria' });
          // Garante que o atributo required está presente se visível
          if(!otherCategoryInput.hasAttribute('required')) otherCategoryInput.setAttribute('required', 'required');
       } else {
           // Se não estiver visível, remove o required
           if(otherCategoryInput) otherCategoryInput.removeAttribute('required');
       }
    } else {
        // Se não for 'Outros', garante que não é required
        if(otherCategoryInput) otherCategoryInput.removeAttribute('required');
    }

    // Chama a função de validação genérica (Atualização 5)
    return validateFields(requiredFields, showNotify);
  }

  function validateAllSteps(showNotify = true) {
    console.log("Validando todas as etapas...");
    // Chama as validações de cada etapa. O '&&' garante que só continua se a anterior for válida.
    const isStep1Valid = validateStep1(showNotify);
    // Só valida a etapa 2 se a 1 estiver OK (ou valida todas independentemente?)
    // Validar todas ajuda a marcar todos os erros de uma vez.
    const isStep2Valid = validateStep2(showNotify);
    console.log(`Resultado Validação - Etapa 1: ${isStep1Valid}, Etapa 2: ${isStep2Valid}`);
    return isStep1Valid && isStep2Valid;
  }

  // =========================================================================
  // == FUNÇÃO SUBSTITUÍDA PELA ATUALIZAÇÃO 5 (Integrada aqui) =================
  // =========================================================================
  // Função genérica para validar um conjunto de campos
  function validateFields(fields, showNotify = true) {
    let isValid = true;
    let firstInvalidField = null;
    let errorMessages = [];

    fields.forEach(field => {
      const element = document.getElementById(field.id);
      if (!element) {
        console.warn(`Campo de validação ${field.id} não encontrado no DOM!`);
        return; // Pula este campo se não existe
      }

      // 1. Verificar se o elemento está VISÍVEL antes de validar
      if (!isElementVisible(element)) {
        clearFieldValidation(element); // Limpa validação se estava inválido mas ficou invisível
        return; // Não validar campos invisíveis
      }

      // 2. Verificar se o campo é OBRIGATÓRIO (pelo atributo 'required')
      //    A validação só se aplica a campos visíveis e requeridos.
      const isRequired = element.hasAttribute('required');
      if (!isRequired) {
        clearFieldValidation(element); // Limpa se não for obrigatório
        return; // Pula campos não obrigatórios
      }

      // 3. Obter o valor e validar (considerando o tipo)
      let fieldValue = element.value;
      let fieldValid = false;

      if (element.tagName === 'SELECT') {
        // Select é válido se um valor não vazio foi selecionado
        fieldValid = fieldValue && fieldValue !== '';
      } else if (element.type === 'checkbox') {
        // Checkbox obrigatório? Geralmente não se usa 'required' em checkbox único.
        // Se fosse um grupo, a lógica seria diferente. Assumindo que required não se aplica bem aqui.
        fieldValid = true; // Considerar válido a menos que haja regra específica
      } else { // Inputs (text, date, textarea, etc.)
        // Válido se não for nulo/undefined e não for apenas espaços em branco
        fieldValid = fieldValue && String(fieldValue).trim() !== '';
      }

      // 4. Marcar como inválido ou limpar validação
      if (!fieldValid) {
        isValid = false;
        const errorMsg = field.errorMsg || `${field.name || 'Este campo'} é obrigatório.`;
        markFieldAsInvalid(element, errorMsg);
        errorMessages.push(errorMsg);

        // Guarda o primeiro campo inválido para focar nele depois
        if (!firstInvalidField) {
          firstInvalidField = element;
        }
      } else {
        clearFieldValidation(element); // Limpa a marcação se o campo for válido
      }
    });

    // Focar no primeiro campo inválido encontrado
    if (firstInvalidField) {
      firstInvalidField.focus();
      console.warn("Validação falhou. Focando no primeiro campo inválido:", firstInvalidField.id);
    }

    // Mostrar uma única notificação geral se houver erros e showNotify for true
    if (!isValid && showNotify) {
        // const summaryMessage = "Por favor, corrija os campos marcados."; // Mensagem genérica
        const summaryMessage = errorMessages[0] || "Por favor, corrija os campos obrigatórios."; // Mensagem do primeiro erro
        showNotification(summaryMessage, 'warning');
    }

    return isValid;
  }

  // Função auxiliar para verificar se um elemento está realmente visível na página
  function isElementVisible(element) {
    if (!element) return false;
    // Verifica o próprio elemento e seus pais até o body
    // offsetWidth/offsetHeight verifica se o elemento ocupa espaço
    // getClientRects().length verifica se o elemento é renderizado (não display: none)
    // window.getComputedStyle(element).visibility verifica a propriedade visibility
    return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length) && window.getComputedStyle(element).visibility !== 'hidden';
  }
  // =========================================================================
  // == FIM DA FUNÇÃO SUBSTITUÍDA/ADICIONADA PELA ATUALIZAÇÃO 5 ==============
  // =========================================================================


  function markFieldAsInvalid(element, message) {
    if (!element) return;
    element.classList.add('is-invalid'); // Classe do Bootstrap (ou customizada)

    // Tenta encontrar o container pai para adicionar a mensagem de erro
    const formGroup = element.closest('.form-group, .form-col, #other-equipment-field, #other-category-field, .radio-group-container'); // Adicione outros containers se necessário

    if (formGroup) {
      formGroup.classList.add('has-error'); // Classe auxiliar opcional
      let errorElement = formGroup.querySelector('.error-message');
      if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        // Estilos básicos (podem ser definidos no CSS)
        errorElement.style.color = '#dc3545'; // Cor de erro Bootstrap
        errorElement.style.fontSize = '0.875em';
        errorElement.style.marginTop = '0.25rem';
        errorElement.style.width = '100%';
        // Inserir após o elemento ou no final do grupo
        if(element.nextSibling) {
             formGroup.insertBefore(errorElement, element.nextSibling);
        } else {
             formGroup.appendChild(errorElement);
        }
      }
      errorElement.textContent = message;
      errorElement.style.display = 'block'; // Garante visibilidade
    } else {
        // Fallback se não encontrar container: adiciona após o próprio elemento
        console.warn("Não foi possível encontrar .form-group/.form-col para exibir mensagem de erro para:", element.id);
        let errorElement = element.nextElementSibling;
        if (!errorElement || !errorElement.classList.contains('error-message')) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.style.color = '#dc3545';
            errorElement.style.fontSize = '0.875em';
            errorElement.style.marginTop = '0.25rem';
            element.parentNode.insertBefore(errorElement, element.nextSibling);
        }
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
  }


  function clearFieldValidation(element) {
    if (!element) return;
    element.classList.remove('is-invalid');

    const formGroup = element.closest('.form-group, .form-col, #other-equipment-field, #other-category-field, .radio-group-container');

    if (formGroup) {
      formGroup.classList.remove('has-error');
      const errorElement = formGroup.querySelector('.error-message');
      if (errorElement) {
        errorElement.remove(); // Remove a mensagem de erro
      }
    } else {
        // Fallback: remove o próximo elemento se for a mensagem de erro
       const errorElement = element.nextElementSibling;
       if (errorElement && errorElement.classList.contains('error-message')) {
           errorElement.remove();
       }
    }
  }

  // =========================================================================
  // == FUNÇÃO SUBSTITUÍDA PELA ATUALIZAÇÃO 6 (Integrada aqui) =================
  // =========================================================================
  // Salva os dados da Etapa 1 no objeto formData
  function saveStep1Data() {
    console.log("Salvando dados da etapa 1...");
    // Verificar se os elementos existem antes de acessá-los
    const equipTypeSelect = document.getElementById('equipment-type');
    if (!equipTypeSelect) {
        console.error("Elemento #equipment-type não encontrado ao salvar dados da Etapa 1.");
        return; // Interrompe se o elemento principal não existe
    }

    const equipTypeValue = equipTypeSelect.value; // Valor/slug: 'alta-pressao', 'aspirador', etc.
    const equipTypeText = equipTypeSelect.selectedOptions[0]?.textContent || ''; // Texto exibido: 'Alta Pressão', 'Aspirador'

    // Priorizar o TEXTO do tipo selecionado para formData.tipoEquipamento
    formData.tipoEquipamento = equipTypeText;

    const equipmentIdContainer = document.getElementById('equipment-id')?.closest('.form-col'); // Ou .form-group
    const otherEquipmentField = document.getElementById('other-equipment-field');
    const equipmentIdSelect = document.getElementById('equipment-id');
    const otherEquipInput = document.getElementById('other-equipment');

    // Determinar placaOuId e equipamentoOutro baseado no campo visível
    formData.placaOuId = '';
    formData.equipamentoOutro = null; // Resetar

    if (equipTypeValue === 'aspirador' || equipTypeValue === 'poliguindaste' || equipTypeValue === 'outro') {
        // Se for tipo manual, pega valor do input 'Outro'
        if (otherEquipInput && isElementVisible(otherEquipInput)) {
            formData.placaOuId = otherEquipInput.value.trim();
            // Para esses tipos, equipamentoOutro pode ser o mesmo que placaOuId
            formData.equipamentoOutro = formData.placaOuId;
            // Caso especial: Se o tipo for 'Outro', o que foi digitado é o nome do tipo
            if (equipTypeValue === 'outro') {
                 formData.tipoEquipamento = formData.placaOuId || 'Outro (não especificado)';
            }
        } else {
             console.warn("Tipo manual selecionado, mas campo 'other-equipment' não está visível ou não encontrado.");
        }
    } else if (equipTypeValue) {
        // Se for tipo com select, pega valor do select 'ID'
        if (equipmentIdSelect && isElementVisible(equipmentIdSelect)) {
             formData.placaOuId = equipmentIdSelect.value;
             // Neste caso, equipamentoOutro é null
             formData.equipamentoOutro = null;
        } else {
            console.warn("Tipo com select de ID selecionado, mas campo 'equipment-id' não está visível ou não encontrado.");
        }
    } else {
        // Nenhum tipo selecionado
        console.log("Nenhum tipo de equipamento selecionado ao salvar etapa 1.");
    }

    // Salvar os outros campos da etapa 1
    formData.responsavel = document.getElementById('technician-name')?.value.trim() || '';
    formData.dataRegistro = document.getElementById('maintenance-date')?.value || ''; // Mantém YYYY-MM-DD
    formData.area = document.getElementById('area')?.value || '';
    formData.localOficina = document.getElementById('office')?.value.trim() || '';
    formData.tipoManutencao = document.getElementById('maintenance-type-select')?.value || ''; // ID corrigido
    formData.eCritico = document.getElementById('is-critical')?.checked || false;

    console.log("Dados da etapa 1 salvos em formData:", JSON.parse(JSON.stringify(formData))); // Log profundo
  }
  // =========================================================================
  // == FIM DA FUNÇÃO SUBSTITUÍDA PELA ATUALIZAÇÃO 6 =======================
  // =========================================================================

  // Salva os dados da Etapa 2 no objeto formData
  function saveStep2Data() {
    console.log("Salvando dados da etapa 2...");
    const problemCategorySelect = document.getElementById('problem-category-select'); // ID Corrigido
    if (!problemCategorySelect) {
        console.error("Elemento #problem-category-select não encontrado ao salvar dados da Etapa 2.");
        return;
    }
    formData.categoriaProblema = problemCategorySelect.value; // O valor é a string da categoria

    // Salvar o campo 'Outra Categoria' apenas se 'Outros' foi selecionado
    if (formData.categoriaProblema === 'Outros') {
      formData.categoriaProblemaOutro = document.getElementById('other-category')?.value.trim() || '';
    } else {
       formData.categoriaProblemaOutro = null; // Garante que está nulo se não for 'Outros'
    }

    formData.detalhesproblema = document.getElementById('problem-description')?.value.trim() || '';
    formData.observacoes = document.getElementById('additional-notes')?.value.trim() || '';

    console.log("Dados da etapa 2 salvos em formData:", JSON.parse(JSON.stringify(formData))); // Log profundo
  }

  // Atualiza a seção de Resumo (Etapa 3) com os dados coletados
  function updateSummary() {
    console.log("Atualizando resumo (Etapa 3)...");
    // Se o formulário não foi carregado, os elementos do resumo podem não existir.
    if (!document.getElementById('summary-equipment')) {
        console.warn("Elementos do resumo não encontrados. O resumo não será atualizado (formulário pode não estar carregado).");
        return;
    }

    // Construir o texto do equipamento para o resumo
    let equipmentSummary = formData.tipoEquipamento || '-';
    // Obter o valor do tipo de equipamento diretamente do select, caso tenha sido um 'Outro' personalizado
    const equipmentTypeSelect = document.getElementById('equipment-type');
    const currentEquipTypeValue = equipmentTypeSelect ? equipmentTypeSelect.value : '';


    if (formData.tipoEquipamento && formData.placaOuId) {
        if (currentEquipTypeValue === 'outro') {
            // Se o tipo selecionado FOI 'Outro', então tipoEquipamento já contém a descrição digitada
            equipmentSummary = formData.tipoEquipamento;
        } else if (formData.equipamentoOutro) {
            // Para tipos manuais (aspirador, poli) que não são 'Outro', placaOuId tem a descrição
            equipmentSummary = `${formData.tipoEquipamento} (${formData.placaOuId})`;
        } else {
            // Para tipos com select de ID
            equipmentSummary = `${formData.tipoEquipamento} (${formData.placaOuId})`;
        }
    }


    // Construir o texto da categoria para o resumo
    let categorySummary = formData.categoriaProblema || '-';
    if (formData.categoriaProblema === 'Outros' && formData.categoriaProblemaOutro) {
        categorySummary = `Outros (${formData.categoriaProblemaOutro})`;
    }

    // Mapear dados para elementos do resumo
    const summaryElements = {
      'summary-equipment': equipmentSummary,
      'summary-technician': formData.responsavel || '-',
      'summary-date': formatDate(formData.dataRegistro) || '-', // Formata para DD/MM/YYYY
      'summary-location': `${formData.area || '-'} / ${formData.localOficina || '-'}`,
      'summary-type': formData.tipoManutencao || '-',
      'summary-critical': formData.eCritico ? 'Sim ⚠️' : 'Não',
      'summary-category': categorySummary,
      'summary-problem': formData.detalhesproblema || '-',
      'summary-notes': formData.observacoes || 'Nenhuma'
    };

    // Atualizar o texto de cada elemento do resumo
    Object.entries(summaryElements).forEach(([elementId, value]) => {
      const element = document.getElementById(elementId);
      if (element) {
        // Usar textContent para evitar injeção de HTML, exceto onde necessário (critical badge)
        if(elementId === 'summary-critical' || elementId === 'summary-equipment') {
             element.innerHTML = value; // Permite o span/badge
        } else {
             element.textContent = value;
        }
      } else {
        console.warn(`Elemento de resumo #${elementId} não encontrado!`);
      }
    });

    console.log("Resumo atualizado com sucesso.");
  }


  // =========================================================================
  // == FUNÇÃO SUBSTITUÍDA PELA ATUALIZAÇÃO 4 (Integrada aqui) =================
  // =========================================================================
  // Função chamada ao submeter o formulário (após validação)
  function submitMaintenance() {
    const actionText = isEditMode ? 'Atualizando' : 'Criando nova';
    console.log(`${actionText} manutenção... Dados coletados:`, JSON.parse(JSON.stringify(formData)));

    // Revalidar TUDO uma última vez (redundante se a navegação forçou, mas seguro)
    if (!validateAllSteps(false)) { // showNotify = false
      console.error("Validação falhou no momento do envio final.");
      showNotification("Falha na validação final. Verifique os campos.", "error");
      // Tenta focar no erro
        if (!validateStep1(false)) { showStep(1); }
        else if (!validateStep2(false)) { showStep(2); }
      return;
    }

    // Mostrar indicador de loading
    showLoading(true, `${isEditMode ? 'Atualizando' : 'Registrando'} manutenção...`);

    // Preparar dados para envio à API (copiar de formData)
    const dataToSend = {
      // Etapa 1
      tipoEquipamento: formData.tipoEquipamento,
      placaOuId: formData.placaOuId,
      equipamentoOutro: formData.equipamentoOutro, // Pode ser null
      responsavel: formData.responsavel,
      dataRegistro: formData.dataRegistro, // Formato YYYY-MM-DD
      area: formData.area,
      localOficina: formData.localOficina,
      tipoManutencao: formData.tipoManutencao,
      eCritico: formData.eCritico,
      // Etapa 2
      categoriaProblema: formData.categoriaProblema,
      categoriaProblemaOutro: formData.categoriaProblemaOutro, // Pode ser null
      detalhesproblema: formData.detalhesproblema,
      observacoes: formData.observacoes,
      // Status: Definido como 'Pendente' para novos, não enviado para edição (API decide)
       status: isEditMode ? undefined : 'Pendente' // undefined será removido abaixo
    };

    // Adicionar ID se estiver no modo de edição
    if (isEditMode && editingMaintenanceId) {
      dataToSend.id = editingMaintenanceId;
    }

    // Remover chaves com valores undefined, null ou string vazia antes de enviar
    Object.keys(dataToSend).forEach(key => {
      if (dataToSend[key] === undefined || dataToSend[key] === null || dataToSend[key] === '') {
         // Exceção: não remover eCritico se for false (booleano)
         if (key !== 'eCritico' || dataToSend[key] !== false) {
              delete dataToSend[key];
         }
      }
    });

    console.log("Dados finais a serem enviados para a API:", dataToSend);

    // Verificar disponibilidade da API e das funções necessárias
    if (!window.API || !(isEditMode ? API.updateMaintenance : API.createMaintenance)) {
      console.error("API ou função necessária (create/updateMaintenance) não está disponível!");
      showNotification("Erro: Falha ao comunicar com o servidor (API indisponível). Recarregue a página.", "error");
      showLoading(false);
      return;
    }

    // Determinar qual função da API chamar
    const apiCall = isEditMode
      ? API.updateMaintenance(editingMaintenanceId, dataToSend)
      : API.createMaintenance(dataToSend);

    // Executar a chamada API
    apiCall
      .then(response => {
        let parsedResponse = response;
        // Tentar parsear se a resposta for string JSON
        if (typeof response === 'string') {
          try {
            parsedResponse = JSON.parse(response);
          } catch (e) {
            console.error("Erro ao parsear resposta JSON da API:", e, "Resposta original:", response);
            // Considerar como erro se não conseguir parsear
            parsedResponse = { success: false, message: "Resposta inválida do servidor." };
          }
        } else if (typeof response !== 'object' || response === null) {
             // Se não for string nem objeto, é inválido
             parsedResponse = { success: false, message: "Formato de resposta inesperado do servidor." };
        }


        // Verificar o sucesso na resposta parseada
        if (parsedResponse && parsedResponse.success) {
          console.log(`Manutenção ${isEditMode ? 'atualizada' : 'registrada'} com sucesso:`, parsedResponse);
          showNotification(
            isEditMode ? "Manutenção atualizada com sucesso!" : "Nova manutenção registrada com sucesso!",
            "success"
          );
          closeForm(); // Fecha o formulário
          loadMaintenanceList(); // Recarrega a lista na tabela
        } else {
          // API retornou erro ou formato inesperado
          console.error(`Erro retornado pela API ao ${isEditMode ? 'atualizar' : 'registrar'} manutenção:`, parsedResponse);
          const errorMsg = parsedResponse?.message || parsedResponse?.error || "Erro desconhecido retornado pelo servidor.";
          showNotification(`Erro: ${errorMsg}`, "error");
        }
      })
      .catch(error => {
        // Erro na comunicação (rede, etc.)
        console.error(`Erro na comunicação com API durante ${isEditMode ? 'update' : 'create'}:`, error);
        showNotification(`Falha na comunicação com o servidor: ${error.message || 'Verifique sua conexão.'}`, "error");
      })
      .finally(() => {
        // Esconder o loading independentemente do resultado
        showLoading(false);
      });
  }
  // =========================================================================
  // == FIM DA FUNÇÃO SUBSTITUÍDA PELA ATUALIZAÇÃO 4 =======================
  // =========================================================================


  // --- Funções de Dados e Tabela ---

  // Carrega a lista de manutenções (decide se usa filtros ou não)
  function loadMaintenanceList() {
      // Obter valores atuais dos filtros
      const statusFilter = document.getElementById('maintenance-status-filter')?.value;
      const typeFilter = document.getElementById('maintenance-type-filter')?.value;
      const dateFrom = document.getElementById('maintenance-date-from')?.value;
      const dateTo = document.getElementById('maintenance-date-to')?.value;

      // Verificar se algum filtro está ativo (diferente de 'all' ou datas preenchidas)
      const filtersActive = (statusFilter && statusFilter !== 'all') ||
                            (typeFilter && typeFilter !== 'all') ||
                            dateFrom || dateTo;

      if (filtersActive) {
          console.log("Recarregando lista COM filtros ativos.");
          loadMaintenanceListWithFilters(statusFilter, typeFilter, dateFrom, dateTo);
      } else {
          console.log("Carregando lista completa de manutenções (sem filtros ativos).");
          loadMaintenanceListWithoutFilters();
      }
  }


  // Carrega a lista COMPLETA (sem filtros) via API
  function loadMaintenanceListWithoutFilters() {
    console.log("Chamando API para carregar lista completa...");
    showLoading(true, "Carregando manutenções...");

    const tableBody = document.getElementById('maintenance-tbody');
    if (tableBody) {
      tableBody.innerHTML = '<tr><td colspan="10" class="text-center">Carregando...</td></tr>';
    }

    if (window.API && typeof API.getMaintenanceList === 'function') {
      API.getMaintenanceList()
        .then(response => handleApiResponse(response, tableBody)) // Processa a resposta
        .catch(error => handleApiError(error, tableBody))       // Trata erro de comunicação
        .finally(() => showLoading(false));                     // Esconde loading
    } else {
      handleApiError("Função API.getMaintenanceList não disponível.", tableBody);
      showLoading(false);
    }
  }

  // Carrega a lista FILTRADA via API
  function loadMaintenanceListWithFilters(status, type, dateFrom, dateTo) {
    console.log(`Chamando API para carregar lista filtrada: Status=${status || 'N/A'}, Tipo=${type || 'N/A'}, De=${dateFrom || 'N/A'}, Até=${dateTo || 'N/A'}`);
    showLoading(true, "Filtrando manutenções...");

    const tableBody = document.getElementById('maintenance-tbody');
      if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="10" class="text-center">Filtrando...</td></tr>';
      }

    // Montar objeto de parâmetros SÓ com filtros ativos
    const params = {};
    if (status && status !== 'all') params.status = status;
    if (type && type !== 'all') params.tipo = type; // Assumindo que a API espera 'tipo'
    if (dateFrom) params.dataInicio = dateFrom;     // Assumindo 'dataInicio'
    if (dateTo) params.dataFim = dateTo;           // Assumindo 'dataFim'

    // Tentar chamar a função específica de filtro primeiro
    if (window.API && typeof API.getMaintenanceListFiltered === 'function') {
        API.getMaintenanceListFiltered(params)
          .then(response => handleApiResponse(response, tableBody))
          .catch(error => handleApiError(error, tableBody))
          .finally(() => showLoading(false));
    }
    // Fallback: Tentar chamar a função geral com parâmetros (se a API suportar)
    else if (window.API && typeof API.getMaintenanceList === 'function') {
        console.warn("API.getMaintenanceListFiltered não encontrada. Usando API.getMaintenanceList com parâmetros como fallback.");
        API.getMaintenanceList(params) // Envia os parâmetros para a função geral
            .then(response => handleApiResponse(response, tableBody))
            .catch(error => handleApiError(error, tableBody))
            .finally(() => showLoading(false));
    }
    // Se nenhuma função estiver disponível
    else {
      handleApiError("Nenhuma função da API disponível para carregar/filtrar manutenções.", tableBody);
      showLoading(false);
    }
  }


  // Função unificada para processar a resposta da API (seja completa ou filtrada)
  function handleApiResponse(response, tableBody) {
      let parsedResponse = response;

      // Tenta parsear se for string
      if (typeof response === 'string') {
          try {
              parsedResponse = JSON.parse(response);
          } catch (e) {
              console.error("Erro ao parsear resposta da API (lista):", e, response);
              parsedResponse = { success: false, message: "Resposta inválida do servidor." };
          }
      } else if (typeof response !== 'object' || response === null) {
           parsedResponse = { success: false, message: "Formato de resposta inesperado do servidor." };
      }

      // Verifica se a resposta parseada indica sucesso e contém a lista
      // Adapte 'maintenances' se a API retornar a lista com outro nome (ex: 'data', 'list')
      if (parsedResponse && parsedResponse.success && Array.isArray(parsedResponse.maintenances)) {
        fullMaintenanceList = parsedResponse.maintenances; // Atualiza a lista local completa
        console.log(`Lista de manutenções recebida/filtrada com ${fullMaintenanceList.length} itens.`);
        renderMaintenanceTable(fullMaintenanceList); // Renderiza a tabela com os dados recebidos
      } else {
        // API retornou erro ou formato inválido
        console.error("Erro ao carregar/filtrar manutenções (resposta API):", parsedResponse);
        const errorMessage = parsedResponse?.message || parsedResponse?.error || 'Formato inválido ou nenhum dado retornado.';
        if (tableBody) {
          tableBody.innerHTML = `<tr><td colspan="10" class="text-center error-message">Erro ao carregar dados: ${errorMessage}</td></tr>`;
        }
        fullMaintenanceList = []; // Limpa a lista local em caso de erro
        renderMaintenanceTable(fullMaintenanceList); // Renderiza a tabela vazia (com mensagem)
      }
  }

  // Função unificada para tratar erros de comunicação com a API
  function handleApiError(error, tableBody) {
      console.error("Falha na comunicação com a API:", error);
      // Tenta extrair uma mensagem de erro significativa
      const errorMessage = error?.message || (typeof error === 'string' ? error : 'Falha ao conectar com o servidor.');
      if (tableBody) {
        // Exibe a mensagem de erro na tabela
        tableBody.innerHTML = `<tr><td colspan="10" class="text-center error-message">Erro de comunicação: ${errorMessage}. Tente novamente mais tarde.</td></tr>`;
      }
      fullMaintenanceList = []; // Limpa a lista local
      renderMaintenanceTable(fullMaintenanceList); // Renderiza a tabela vazia
      showNotification(`Erro de Rede: ${errorMessage}`, 'error'); // Notifica o usuário
  }


  // Renderiza os dados da manutenção na tabela HTML
  function renderMaintenanceTable(maintenances) {
    const tbody = document.getElementById('maintenance-tbody');
    if (!tbody) {
        console.error("Elemento #maintenance-tbody não encontrado para renderizar tabela.");
        return;
    }

    tbody.innerHTML = ''; // Limpa o conteúdo anterior

    // Verifica se a lista está vazia
    if (!maintenances || maintenances.length === 0) {
        // Verifica se filtros estão ativos para dar mensagem contextuaizada
        const statusFilter = document.getElementById('maintenance-status-filter')?.value;
        const typeFilter = document.getElementById('maintenance-type-filter')?.value;
        const dateFrom = document.getElementById('maintenance-date-from')?.value;
        const dateTo = document.getElementById('maintenance-date-to')?.value;
        const filtersActive = (statusFilter && statusFilter !== 'all') || (typeFilter && typeFilter !== 'all') || dateFrom || dateTo;

        const message = filtersActive ? "Nenhuma manutenção encontrada para os filtros aplicados." : "Nenhuma manutenção registrada.";
        tbody.innerHTML = `<tr><td colspan="10" class="text-center">${message}</td></tr>`; // Colspan=10 (ajuste se mudar colunas)
        return;
    }

    console.log(`Renderizando ${maintenances.length} manutenções na tabela.`);

    maintenances.forEach(maintenance => {
        const id = maintenance.id || '-';
        const tipoEquipamento = maintenance.tipoEquipamento || 'Não especificado';
        const placaOuId = maintenance.placaOuId || '-';
        // Monta display do equipamento (Tipo (ID) ou só Tipo)
        const equipamentoDisplay = (placaOuId !== '-' && tipoEquipamento !== placaOuId) ? `${tipoEquipamento} (${placaOuId})` : tipoEquipamento;

        const tipoManutencao = maintenance.tipoManutencao || '-';
        const dataRegistro = formatDate(maintenance.dataRegistro) || '-'; // Formata DD/MM/YYYY
        const responsavel = maintenance.responsavel || 'Não atribuído';
        const area = maintenance.area || 'Não espec.';
        const local = maintenance.localOficina || '-';
        const problemaRaw = maintenance.detalhesproblema || '-';
        // Escapar HTML para segurança (se Utilities.escapeHtml existir)
        const problema = (typeof Utilities !== 'undefined' && Utilities.escapeHtml)
                           ? Utilities.escapeHtml(problemaRaw)
                           : problemaRaw.replace(/</g, "&lt;").replace(/>/g, "&gt;"); // Fallback básico

        const status = maintenance.status || 'Pendente';
        const statusLower = status.toLowerCase();
        const statusClass = getStatusClass(status); // Obtém a classe CSS para o status

        const row = document.createElement('tr');
        row.dataset.id = id; // Adiciona ID da manutenção à linha para fácil acesso

        // Definir quais ações são permitidas baseado no status
        // Ajuste as strings de status conforme necessário
        const statusPermiteVerificar = ['pendente', 'aguardando verificacao', 'aguardando verificação'];
        const statusPermiteEditar = ['pendente', 'aguardando verificacao', 'aguardando verificação', 'ajustes', 'reprovado'];

        const canVerify = statusPermiteVerificar.includes(statusLower);
        const canEdit = statusPermiteEditar.includes(statusLower);

        // Montar o HTML da linha (use template literals para facilitar)
        // Ajuste as colunas (td) conforme a estrutura do seu HTML <th>
        row.innerHTML = `
          <td>${id}</td>
          <td>${equipamentoDisplay} ${maintenance.eCritico ? '<span class="critical-badge" title="Manutenção Crítica">⚠️</span>' : ''}</td>
          <td>${tipoManutencao}</td>
          <td>${dataRegistro}</td>
          <td>${responsavel}</td>
          <td>${area}</td>
          <td>${local}</td>
          <td title="${problemaRaw}">${problema.substring(0, 50)}${problema.length > 50 ? '...' : ''}</td>
          <td>
            <span class="status-badge status-${statusClass}" title="${status}">${status}</span>
          </td>
          <td class="action-buttons">
            <button class="btn-icon view-maintenance" title="Ver Detalhes" data-id="${id}">👁️</button>
            ${canEdit ? `<button class="btn-icon edit-maintenance" title="Editar" data-id="${id}">✏️</button>` : '<button class="btn-icon disabled" title="Edição não permitida neste status" disabled>✏️</button>'}
            ${canVerify ? `<button class="btn-icon verify-maintenance" title="Verificar" data-id="${id}">✔️</button>` : '<button class="btn-icon disabled" title="Verificação não permitida neste status" disabled>✔️</button>'}
            <!-- Adicione outros botões aqui se necessário -->
          </td>
        `;

        tbody.appendChild(row);
    });

    // Reconfigurar os listeners para os botões na tabela recém-renderizada
    setupTableActionListeners();
    console.log("Tabela renderizada e listeners de ação configurados.");
  }


  // Configura listeners para os botões de ação na tabela (usando delegação)
  function setupTableActionListeners() {
    const tableBody = document.getElementById('maintenance-tbody');
    if (!tableBody) return;

    // Usar cloneNode/replaceChild para garantir que listeners antigos sejam removidos antes de adicionar o novo
    const newTableBody = tableBody.cloneNode(true);
    tableBody.parentNode.replaceChild(newTableBody, tableBody);

    // Adicionar UM listener ao tbody que captura cliques nos botões internos
    newTableBody.addEventListener('click', function(event) {
      // Encontrar o botão que foi clicado (ou seu pai se clicou no ícone dentro do botão)
      const button = event.target.closest('.btn-icon[data-id]');

      // Se não clicou em um botão com data-id, ignorar
      if (!button || button.disabled) return; // Ignora botões desabilitados

      const maintenanceId = button.getAttribute('data-id');
      if (!maintenanceId) return;

      console.log(`Ação clicada: ${Array.from(button.classList).join(' ')}, ID: ${maintenanceId}`);

      // Chamar a função apropriada baseado na classe do botão
      if (button.classList.contains('view-maintenance')) {
        viewMaintenanceDetails(maintenanceId);
      } else if (button.classList.contains('edit-maintenance')) {
        editMaintenance(maintenanceId);
      } else if (button.classList.contains('verify-maintenance')) {
        verifyMaintenance(maintenanceId);
      }
      // Adicione outros 'else if' para botões diferentes (ex: delete, etc.)
    });
     console.log("Listeners de ação da tabela (re)configurados usando delegação.");
  }


  // Exibe os detalhes de uma manutenção (usando Utilities ou fallback)
  function viewMaintenanceDetails(id) {
      console.log(`Buscando detalhes para visualização da manutenção ID: ${id}`);
      const maintenanceData = findMaintenanceById(id);

      if (!maintenanceData) {
          showNotification(`Erro: Dados da manutenção ID ${id} não encontrados localmente.`, "error");
          console.error(`Manutenção com ID ${id} não encontrada em fullMaintenanceList.`);
          return;
      }

      console.log("Dados encontrados para visualização:", maintenanceData);

      // Tentar usar a função de visualização de Utilities, se existir
      if (typeof Utilities !== 'undefined' && Utilities.viewMaintenanceDetails) {
          console.log("Usando Utilities.viewMaintenanceDetails");
          // Preparar objeto de ações para passar para Utilities
          const statusLower = (maintenanceData.status || '').toLowerCase();
          const statusPermiteVerificar = ['pendente', 'aguardando verificacao', 'aguardando verificação'];
          const statusPermiteEditar = ['pendente', 'aguardando verificacao', 'aguardando verificação', 'ajustes', 'reprovado'];
          const actions = {
              canVerify: statusPermiteVerificar.includes(statusLower),
              canEdit: statusPermiteEditar.includes(statusLower),
              onVerify: () => verifyMaintenance(id), // Passa a função de verificação
              onEdit: () => editMaintenance(id)     // Passa a função de edição
              // Adicione outras ações se necessário (ex: onDelete)
          };
          Utilities.viewMaintenanceDetails(id, maintenanceData, actions);
      } else {
          // Fallback: Usar um modal/alerta simples se Utilities não estiver disponível
          console.warn("Utilities.viewMaintenanceDetails não encontrado. Usando modal de fallback.");

          // Procurar por elementos de um modal de detalhe fallback no HTML
          const detailOverlay = document.getElementById('detail-overlay'); // Assumindo que existe um overlay com este ID
          const detailContent = document.getElementById('maintenance-detail-content'); // E um container para o conteúdo

          if (detailOverlay && detailContent) {
              // Construir o HTML dos detalhes dinamicamente
              let htmlContent = `<h2>Detalhes da Manutenção #${maintenanceData.id || '-'}</h2>`;

              const equipamentoDisplayFallback = (maintenanceData.placaOuId && maintenanceData.tipoEquipamento !== maintenanceData.placaOuId) ? `${maintenanceData.tipoEquipamento || '-'} (${maintenanceData.placaOuId})` : (maintenanceData.tipoEquipamento || '-');
              let categoryDisplayFallback = maintenanceData.categoriaProblema || '-';
              if (maintenanceData.categoriaProblema === 'Outros' && maintenanceData.categoriaProblemaOutro) {
                    categoryDisplayFallback = `Outros (${maintenanceData.categoriaProblemaOutro})`;
              }

              const escapeIfNeeded = (text) => (typeof Utilities !== 'undefined' && Utilities.escapeHtml) ? Utilities.escapeHtml(text) : String(text).replace(/</g, "&lt;").replace(/>/g, "&gt;");

              const detailsMap = [
                  { label: 'Equipamento', value: escapeIfNeeded(equipamentoDisplayFallback) },
                  { label: 'Tipo Manut.', value: `${escapeIfNeeded(maintenanceData.tipoManutencao || '-')}${maintenanceData.eCritico ? ' <span class="critical-badge" title="Manutenção Crítica">⚠️ CRÍTICA</span>' : ''}` },
                  { label: 'Data Registro', value: formatDate(maintenanceData.dataRegistro) || '-' },
                  { label: 'Responsável', value: escapeIfNeeded(maintenanceData.responsavel || '-') },
                  { label: 'Local', value: `${escapeIfNeeded(maintenanceData.area || '-')} / ${escapeIfNeeded(maintenanceData.localOficina || '-')}` },
                  { label: 'Status', value: `<span class="status-badge status-${getStatusClass(maintenanceData.status)}">${escapeIfNeeded(maintenanceData.status || 'Pendente')}</span>` },
                  { label: 'Categoria Problema', value: escapeIfNeeded(categoryDisplayFallback) },
                  { label: 'Descrição Problema', value: escapeIfNeeded(maintenanceData.detalhesproblema || '-') },
                  { label: 'Observações', value: escapeIfNeeded(maintenanceData.observacoes || 'Nenhuma') },
              ];

               htmlContent += '<div class="details-grid">'; // Usar uma classe para estilizar
               detailsMap.forEach(item => {
                   // Permite HTML em 'value' se vier de fontes seguras (badge, tipo manut.)
                   const valueHtml = (item.label === 'Status' || item.label === 'Tipo Manut.') ? item.value : escapeIfNeeded(item.value);
                   htmlContent += `<div class="detail-item"><strong>${item.label}:</strong> <div>${valueHtml || '-'}</div></div>`;
               });
               htmlContent += '</div>';

              // Adicionar detalhes da verificação, se existirem
              if (maintenanceData.verificacao && typeof maintenanceData.verificacao === 'object' && Object.keys(maintenanceData.verificacao).length > 0) {
                   htmlContent += `<h3 style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">Informações da Verificação</h3>`;
                   const verificationMap = [
                       { label: 'Verificador', value: maintenanceData.verificacao.verifierName || maintenanceData.verificacao.verificador },
                       { label: 'Data Verificação', value: formatDate(maintenanceData.verificacao.verificationDate || maintenanceData.verificacao.data) },
                       { label: 'Resultado', value: maintenanceData.verificacao.result || maintenanceData.verificacao.resultado },
                       { label: 'Comentários', value: maintenanceData.verificacao.comments || maintenanceData.verificacao.comentarios },
                   ];
                    htmlContent += '<div class="details-grid">';
                    verificationMap.forEach(item => {
                         htmlContent += `<div class="detail-item"><strong>${item.label}:</strong> <div>${escapeIfNeeded(item.value || '-')}</div></div>`;
                    });
                    htmlContent += '</div>';
               }

              detailContent.innerHTML = htmlContent;

              // Adicionar botões de ação ao modal de fallback
              const detailActionsContainer = detailOverlay.querySelector('.modal-actions'); // Container para botões
              if (detailActionsContainer) {
                  detailActionsContainer.innerHTML = ''; // Limpar ações antigas

                  const statusLower = (maintenanceData.status || '').toLowerCase();
                  const statusPermiteVerificar = ['pendente', 'aguardando verificacao', 'aguardando verificação'];
                   const statusPermiteEditar = ['pendente', 'aguardando verificacao', 'aguardando verificação', 'ajustes', 'reprovado'];

                  // Botão Editar (se permitido)
                  if (statusPermiteEditar.includes(statusLower)) {
                      const editBtn = document.createElement('button');
                      editBtn.innerHTML = '✏️ Editar';
                      editBtn.className = 'btn btn-secondary'; // Use suas classes de botão
                      editBtn.onclick = () => {
                          detailOverlay.style.display = 'none'; // Fecha o modal de detalhes
                          editMaintenance(id); // Abre o formulário de edição
                      };
                      detailActionsContainer.appendChild(editBtn);
                  }

                  // Botão Verificar (se permitido)
                   if (statusPermiteVerificar.includes(statusLower)) {
                       const verifyBtn = document.createElement('button');
                       verifyBtn.innerHTML = '✔️ Verificar';
                       verifyBtn.className = 'btn btn-primary';
                       verifyBtn.onclick = () => {
                           detailOverlay.style.display = 'none'; // Fecha o modal de detalhes
                           verifyMaintenance(id); // Abre o formulário/modal de verificação
                       };
                       detailActionsContainer.appendChild(verifyBtn);
                   }

                  // Botão Fechar (sempre presente)
                  const closeBtn = document.createElement('button');
                  closeBtn.textContent = 'Fechar';
                  closeBtn.className = 'btn btn-light';
                  closeBtn.onclick = () => detailOverlay.style.display = 'none';
                  detailActionsContainer.appendChild(closeBtn);
              }

              // Exibir o modal de fallback
              detailOverlay.style.display = 'flex'; // Use 'flex' para centralizar

              // Configurar fechamento do modal de fallback
              detailOverlay.onclick = function(event) {
                  if (event.target === detailOverlay) { // Clicou no fundo?
                      detailOverlay.style.display = 'none';
                  }
              };
              // Botão de fechar 'X' dentro do modal fallback
              detailOverlay.querySelectorAll('.close-modal-btn').forEach(btn => {
                   // Remover listener antigo e adicionar novo
                   const newBtn = btn.cloneNode(true);
                   btn.parentNode.replaceChild(newBtn, btn);
                   newBtn.onclick = () => detailOverlay.style.display = 'none';
              });

          } else {
              // Fallback final: alert simples se nem o modal fallback existir
              console.warn("Modal de detalhe fallback (#detail-overlay, #maintenance-detail-content) não encontrado. Usando alert.");
              const alertMessage = `Detalhes Manutenção #${id}\n` +
                                   `Equipamento: ${maintenanceData.tipoEquipamento || '-'} (${maintenanceData.placaOuId || '-'})\n` +
                                   `Status: ${maintenanceData.status || '-'}\n` +
                                   `Responsável: ${maintenanceData.responsavel || '-'}\n`+
                                   `Data: ${formatDate(maintenanceData.dataRegistro) || '-'}\n`+
                                   `Problema: ${maintenanceData.detalhesproblema || '-'}`;
              alert(alertMessage);
          }
      }
  }


  // Inicia o processo de edição de uma manutenção
  function editMaintenance(id) {
    console.log(`Iniciando edição para manutenção ID: ${id}`);
    const maintenanceData = findMaintenanceById(id);

    if (!maintenanceData) {
      showNotification(`Erro: Dados da manutenção ID ${id} não encontrados para edição.`, "error");
      console.error(`Manutenção com ID ${id} não encontrada em fullMaintenanceList para edição.`);
      return;
    }

    console.log("Dados encontrados para edição:", maintenanceData);
    // Abre o formulário principal no modo de edição, passando o ID e os dados
    openMaintenanceForm(id, maintenanceData);
  }

  // Inicia o processo de verificação de uma manutenção
  function verifyMaintenance(id) {
      console.log(`Iniciando verificação para manutenção ID: ${id}`);
      const maintenanceData = findMaintenanceById(id);

      if (!maintenanceData) {
          showNotification(`Erro: Dados da manutenção ID ${id} não encontrados para verificação.`, "error");
          console.error(`Manutenção com ID ${id} não encontrada em fullMaintenanceList para verificação.`);
          return;
      }

      console.log("Dados encontrados para verificação:", maintenanceData);

      // Tentar usar o módulo global Verification, se existir
      if (typeof Verification !== 'undefined' && Verification.openVerificationForm) {
          console.log("Usando módulo global Verification.openVerificationForm");
          // Passar o ID e os dados da manutenção para o formulário de verificação
          Verification.openVerificationForm(id, maintenanceData);
      } else {
          // Fallback se o módulo Verification não estiver disponível
          console.warn("Módulo global Verification ou Verification.openVerificationForm não encontrado. Usando formulário de verificação de fallback (se existir).");

          const verificationOverlay = document.getElementById('verification-form-overlay-fallback'); // ID do overlay fallback
          const verificationForm = document.getElementById('verification-form-fallback'); // ID do form fallback

          if (verificationOverlay && verificationForm) {
               // Resetar e preparar o formulário de fallback
               verificationForm.reset();
               verificationForm.querySelectorAll('.is-invalid').forEach(el => clearFieldValidation(el));
               verificationForm.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
               verificationForm.querySelectorAll('.error-message').forEach(el => el.remove());

               // Preencher campos informativos do formulário fallback
               setInputValue('verification-id-fallback', id);
               const equipmentDisplayFallbackV = (maintenanceData.placaOuId && maintenanceData.tipoEquipamento !== maintenanceData.placaOuId) ? `${maintenanceData.tipoEquipamento || '-'} (${maintenanceData.placaOuId})` : (maintenanceData.tipoEquipamento || '-');
               setInputValue('verification-equipment-fallback', equipmentDisplayFallbackV);
               setInputValue('verification-type-fallback', maintenanceData.tipoManutencao || '-');
               // Exibir problema em um span/div, não input
               const problemDisplayFallback = document.getElementById('verification-problem-display-fallback');
               if(problemDisplayFallback) {
                   problemDisplayFallback.textContent = maintenanceData.detalhesproblema || '-';
               }

               // Exibir o modal de fallback
               verificationOverlay.style.display = 'flex';

               // Configurar botões de fechar/cancelar do fallback
               addSafeListener('close-verification-form-fallback', 'click', () => verificationOverlay.style.display = 'none');
               addSafeListener('cancel-verification-fallback', 'click', () => verificationOverlay.style.display = 'none');

               // Configurar botão de submissão do fallback
               addSafeListener('submit-verification-btn-fallback', 'click', function(event) {
                   event.preventDefault(); // Previne submissão HTML padrão

                   const verifierNameInput = document.getElementById('verifier-name-fallback');
                   const resultRadio = verificationForm.querySelector('input[name="verification-result-fallback"]:checked');
                   const commentsInput = document.getElementById('verification-comments-fallback');

                   // Coletar dados da verificação do formulário fallback
                   const verificationData = {
                       maintenanceId: id,
                       // Tentar pegar nome do usuário logado, senão pega do input fallback
                       verifierName: (typeof UserSession !== 'undefined' && UserSession.getUserName) ? UserSession.getUserName() : (verifierNameInput ? verifierNameInput.value.trim() : 'Verificador Fallback'),
                       result: resultRadio ? resultRadio.value : null, // 'Aprovado', 'Reprovado', 'Ajustes'
                       comments: commentsInput ? commentsInput.value.trim() : '',
                       verificationDate: new Date().toISOString().split('T')[0] // Data atual YYYY-MM-DD
                   };

                   // Validar campos do formulário fallback
                   let isVerificationValid = true;
                    // Validar nome do verificador (se o input estiver visível)
                    if (verifierNameInput && isElementVisible(verifierNameInput) && !verificationData.verifierName) {
                           markFieldAsInvalid(verifierNameInput, 'Nome do verificador é obrigatório.');
                           if(isVerificationValid) verifierNameInput.focus(); // Foca no primeiro erro
                           isVerificationValid = false;
                    } else if (verifierNameInput) {
                           clearFieldValidation(verifierNameInput);
                    }

                    // Validar resultado (radio button)
                    if (!verificationData.result) {
                        const radioGroupContainer = verificationForm.querySelector('input[name="verification-result-fallback"]')?.closest('.form-group, .radio-group-container'); // Container dos radios
                        if(radioGroupContainer) markFieldAsInvalid(radioGroupContainer, 'Selecione um resultado (Aprovado, Reprovado ou Ajustes).');
                         if(isVerificationValid) verificationForm.querySelector('input[name="verification-result-fallback"]')?.focus();
                        isVerificationValid = false;
                    } else {
                         const radioGroupContainer = verificationForm.querySelector('input[name="verification-result-fallback"]')?.closest('.form-group, .radio-group-container');
                         if(radioGroupContainer) clearFieldValidation(radioGroupContainer);
                    }

                    // Validar comentários (obrigatório se Reprovado ou Ajustes)
                    const isCommentRequired = ['Reprovado', 'Ajustes'].includes(verificationData.result);
                    if (isCommentRequired && !verificationData.comments) {
                        if(commentsInput) markFieldAsInvalid(commentsInput, 'Comentários são obrigatórios para este resultado.');
                         if(isVerificationValid) commentsInput.focus();
                        isVerificationValid = false;
                    } else {
                         if(commentsInput) clearFieldValidation(commentsInput);
                    }

                   if (!isVerificationValid) {
                       showNotification("Por favor, preencha os campos obrigatórios da verificação.", "warning");
                       return; // Interrompe se inválido
                   }

                   // Se válido, chamar a função de submissão para a API
                   submitVerification(verificationData);
               });

          } else {
               // Se nem o fallback existir
               alert(`Interface de verificação não encontrada. Não é possível verificar a manutenção #${id}. Contate o suporte.`);
               console.error("Elementos #verification-form-overlay-fallback ou #verification-form-fallback não encontrados.");
          }
      }
  }


  // Submete os dados da verificação para a API
  function submitVerification(data) {
    console.log("Submetendo dados da verificação para a API:", data);

    showLoading(true, "Registrando verificação...");

    // Verificar se a função da API existe
    if (window.API && typeof API.submitVerification === 'function') {
      API.submitVerification(data)
        .then(response => {
            // Processar resposta da API
            let parsedResponse = response;
            if (typeof response === 'string') {
                try { parsedResponse = JSON.parse(response); }
                catch (e) { parsedResponse = { success: false, message: "Resposta inválida." }; }
            } else if (typeof response !== 'object' || response === null) {
                 parsedResponse = { success: false, message: "Resposta inesperada." };
            }

            if (parsedResponse && parsedResponse.success) {
              console.log("Verificação registrada com sucesso:", parsedResponse);
              showNotification("Verificação registrada com sucesso!", "success");

              // Fechar o modal de verificação (seja o principal ou o fallback)
              const verificationOverlay = document.getElementById('verification-form-overlay') // Tenta o ID principal
                                         || document.getElementById('verification-form-overlay-fallback'); // Senão, tenta o fallback
              if (verificationOverlay) {
                verificationOverlay.style.display = 'none';
              }

              loadMaintenanceList(); // Recarrega a tabela para refletir o novo status
            } else {
              // API retornou erro
              console.error("Erro ao registrar verificação (API):", parsedResponse);
              const errorMessage = parsedResponse?.message || parsedResponse?.error || 'Erro desconhecido ao salvar.';
              showNotification(`Erro ao registrar verificação: ${errorMessage}`, "error");
            }
        })
        .catch(error => {
            // Erro de comunicação
            console.error("Falha na chamada da API ao registrar verificação:", error);
            const errorMessage = error?.message || 'Verifique sua conexão.';
            showNotification(`Falha de comunicação ao registrar verificação: ${errorMessage}`, "error");
        })
        .finally(() => {
            showLoading(false); // Esconde o loading
        });
    } else {
      console.error("API.submitVerification não disponível.");
      showNotification("Erro: Função da API para submeter verificação não encontrada.", "error");
      showLoading(false);
      // Tenta fechar o modal mesmo assim
       const verificationOverlay = document.getElementById('verification-form-overlay')
                                   || document.getElementById('verification-form-overlay-fallback');
       if (verificationOverlay) verificationOverlay.style.display = 'none';
    }
  }


  // Encontra uma manutenção na lista local pelo ID
  function findMaintenanceById(id) {
      if (!id || !Array.isArray(fullMaintenanceList)) {
          console.warn("ID não fornecido ou lista local (fullMaintenanceList) não é array.");
          return null;
      }
      const stringId = String(id); // Garante comparação de strings
      return fullMaintenanceList.find(item => String(item.id) === stringId);
  }

  // --- Funções Utilitárias ---

  // Formata data (ex: YYYY-MM-DD ou ISO) para DD/MM/YYYY
  function formatDate(dateString) {
    if (!dateString) return '-'; // Retorna hífen se data for nula/vazia

    // Tenta usar a função de Utilities se disponível
    if (typeof Utilities !== 'undefined' && Utilities.formatDate) {
      return Utilities.formatDate(dateString);
    }

    // Fallback de formatação
    try {
        let date;
         // Tenta criar o objeto Date. Date.parse é mais flexível.
         date = new Date(dateString);

         // Se for formato YYYY-MM-DD (sem T), o new Date pode interpretar como local.
         // Forçar UTC para evitar problemas de timezone ao extrair dia/mês/ano
         if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
             const parts = dateString.split('-');
             date = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
         }

        // Verifica se a data resultante é válida
        if (isNaN(date.getTime())) {
           console.warn(`Formato de data inválido ou não reconhecido no fallback: ${dateString}`);
           return dateString; // Retorna a string original se não conseguir parsear
        }

        // Extrai dia, mês e ano (UTC para consistência)
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Mês é 0-indexed
        const year = date.getUTCFullYear();

        return `${day}/${month}/${year}`;
    } catch(e) {
      console.error(`Erro ao formatar data "${dateString}" no fallback:`, e);
      return dateString; // Retorna original em caso de erro
    }
  }


  // Retorna uma classe CSS baseada no status da manutenção
  function getStatusClass(status) {
    if (!status) return 'default'; // Classe padrão se status for nulo/vazio

    const statusLower = status.toLowerCase();

    // Mapeamento de status (lowercase) para classes CSS
    const statusMap = {
        'pendente': 'pending',
        'aguardando verificação': 'pending',
        'aguardando verificacao': 'pending', // Variação sem acento
        'em análise': 'pending',             // Outro sinônimo
        'verificado': 'verified',
        'aprovado': 'verified',             // Sinônimo
        'concluído': 'completed',
        'concluido': 'completed',           // Variação sem acento
        'finalizado': 'completed',          // Sinônimo
        'ajustes': 'adjusting',
        'em andamento': 'progress',         // Para manutenções em execução (se aplicável)
        'reprovado': 'rejected',
        'cancelado': 'cancelled',
    };

    // Retorna a classe mapeada ou 'default' se não encontrar
    if (statusMap[statusLower]) {
        return statusMap[statusLower];
    }

    console.warn(`Status não mapeado para classe CSS: "${status}". Usando 'default'.`);
    return 'default';
  }


  // Exibe notificações (usando Utilities ou fallback)
  function showNotification(message, type = 'info') { // types: 'info', 'success', 'warning', 'error'
    // Tenta usar Utilities.showNotification
    if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
      Utilities.showNotification(message, type);
      return;
    }

    // Fallback de notificação
    console.log(`[Notification Fallback - ${type.toUpperCase()}] ${message}`);

    let container = document.getElementById('notification-container-fallback');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container-fallback';
        // Estilos básicos para o container (canto superior direito)
        Object.assign(container.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '1055', // Acima da maioria dos elementos
            width: '350px',
            maxWidth: '90%'
        });
        document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.className = `notification-fallback notification-${type}`; // Classe base e por tipo
    notification.setAttribute('role', 'alert');

    // Botão de fechar (simples '×')
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;'; // '×' HTML entity
    closeButton.setAttribute('aria-label', 'Fechar');
    Object.assign(closeButton.style, { // Estilos inline para o botão
        background: 'none', border: 'none', color: 'inherit',
        fontSize: '1.5em', position: 'absolute', top: '5px', right: '10px',
        cursor: 'pointer', lineHeight: '1', padding: '0'
    });

    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;

    notification.appendChild(messageSpan);
    notification.appendChild(closeButton);

    // Estilos inline para a notificação (cores baseadas no tipo)
    Object.assign(notification.style, {
        position: 'relative', padding: '15px 40px 15px 20px', // Espaço para botão
        marginBottom: '10px', borderRadius: '4px', color: '#fff',
        opacity: '0', transition: 'opacity 0.3s ease, transform 0.3s ease',
        transform: 'translateX(100%)', boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
        wordWrap: 'break-word', overflow: 'hidden'
    });

    switch (type) {
        case 'error': notification.style.backgroundColor = '#dc3545'; break; // Vermelho Bootstrap
        case 'success': notification.style.backgroundColor = '#28a745'; break; // Verde Bootstrap
        case 'warning': notification.style.backgroundColor = '#ffc107'; notification.style.color = '#212529'; break; // Amarelo Bootstrap (texto escuro)
        default: notification.style.backgroundColor = '#0dcaf0'; break; // Azul Info Bootstrap
    }

    // Adiciona a notificação no topo do container
    container.insertBefore(notification, container.firstChild);

    // Animação de entrada (fade in e slide)
    requestAnimationFrame(() => {
        notification.style.opacity = '0.95'; // Quase opaco
        notification.style.transform = 'translateX(0)';
    });

    // Função para remover a notificação
    const removeNotification = () => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(110%)'; // Slide para fora
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
                // Opcional: remover o container se estiver vazio
                // if (container.children.length === 0 && container.parentNode) {
                //     container.remove();
                // }
            }
        }, 300); // Tempo para animação de saída
    };

    // Auto-remover após alguns segundos (ex: 6 segundos)
    const removeTimeout = setTimeout(removeNotification, 6000);

    // Permitir fechar clicando no botão '×'
    closeButton.onclick = () => {
        clearTimeout(removeTimeout); // Cancela o auto-remove
        removeNotification();
    };
  }


  // Exibe indicador de loading (usando Utilities ou fallback)
  function showLoading(show, message = 'Carregando...') {
    // Tenta usar Utilities.showLoading
    if (typeof Utilities !== 'undefined' && Utilities.showLoading) {
      Utilities.showLoading(show, message);
      return;
    }

    // Fallback de loading overlay
    const loaderId = 'global-loader-fallback';
    let loader = document.getElementById(loaderId);

    if (show) {
        // Se o loader não existe, cria
        if (!loader) {
            loader = document.createElement('div');
            loader.id = loaderId;
            Object.assign(loader.style, { // Estilos para o overlay
                position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
                backgroundColor: 'rgba(40, 40, 40, 0.7)', // Fundo semi-transparente
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                zIndex: '1060', // Acima das notificações
                color: 'white', textAlign: 'center',
                transition: 'opacity 0.2s ease-in-out', opacity: '0' // Para fade in/out
            });

            // Spinner CSS simples
            const spinner = document.createElement('div');
            spinner.className = 'loader-spinner-fallback';
            Object.assign(spinner.style, {
                border: '4px solid rgba(255, 255, 255, 0.3)', borderTop: '4px solid #ffffff',
                borderRadius: '50%', width: '40px', height: '40px',
                animation: 'spinFallback 0.8s linear infinite', // Animação definida abaixo
                marginBottom: '15px'
            });

            // Elemento para a mensagem
            const loaderMessageElement = document.createElement('p');
            loaderMessageElement.id = 'global-loader-message-fallback';
            Object.assign(loaderMessageElement.style, { fontSize: '1em', margin: '0', padding: '0 10px' });

            loader.appendChild(spinner);
            loader.appendChild(loaderMessageElement);
            document.body.appendChild(loader);

            // Adicionar a animação do spinner ao head se ainda não existir
            if (!document.getElementById('spin-fallback-style')) {
                const style = document.createElement('style');
                style.id = 'spin-fallback-style';
                style.textContent = `
                    @keyframes spinFallback {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(style);
            }

            // Força reflow para garantir que a transição funcione
            void loader.offsetWidth;
             // Aplica opacidade para iniciar o fade in
             loader.style.opacity = '1';
        }
         // Define a mensagem
         const messageElement = loader.querySelector('#global-loader-message-fallback');
         if (messageElement) messageElement.textContent = message;
         loader.style.display = 'flex'; // Garante que está visível
    } else {
        // Esconder o loader
        if (loader) {
            loader.style.opacity = '0'; // Inicia fade out
            // Remove o elemento do DOM após a transição
             setTimeout(() => {
                 const currentLoader = document.getElementById(loaderId); // Busca novamente caso tenha sido removido
                 if (currentLoader && currentLoader.parentNode) {
                     currentLoader.remove();
                 }
             }, 200); // Tempo da transição de opacidade
        }
    }
  }

   // --- Filtros Inteligentes (UI e Listeners) ---

   // Cria os elementos HTML dos filtros
   function createMaintenanceFilters() {
        const filterContainer = document.getElementById('maintenance-filter-buttons'); // Container principal dos filtros
        if (!filterContainer) {
            console.warn("Container #maintenance-filter-buttons não encontrado. Filtros não serão criados.");
            return;
        }

        // HTML dos filtros (adapte classes e IDs conforme seu CSS/HTML)
        // Usando classes genéricas como 'filter-group', 'filter-label', 'filter-dropdown'
        const filterHTML = `
            <div class="smart-filter-container">
                <div class="filter-group">
                    <label for="maintenance-status-filter" class="filter-label">Status:</label>
                    <select id="maintenance-status-filter" class="filter-dropdown">
                        <option value="all">Todos os Status</option>
                        <option value="Pendente">Pendentes</option>
                        <option value="Aguardando Verificação">Aguardando Verificação</option>
                        <option value="Verificado">Verificados</option>
                        <option value="Aprovado">Aprovados</option>
                        <option value="Concluído">Concluídos</option>
                        <option value="Ajustes">Ajustes</option>
                        <option value="Reprovado">Reprovados</option>
                        <option value="Cancelado">Cancelados</option>
                         <!-- Adicione outros status se necessário -->
                    </select>
                </div>

                <div class="filter-group">
                    <label for="maintenance-type-filter" class="filter-label">Tipo:</label>
                    <select id="maintenance-type-filter" class="filter-dropdown">
                        <option value="all">Todos os Tipos</option>
                        <option value="Preventiva">Preventiva</option>
                        <option value="Corretiva">Corretiva</option>
                        <option value="Emergencial">Emergencial</option>
                        <option value="Melhoria">Melhoria</option>
                         <!-- Adicione outros tipos se necessário -->
                    </select>
                </div>

                <div class="date-filter-group">
                    <label for="maintenance-date-from" class="filter-label">Período:</label>
                    <input type="date" id="maintenance-date-from" class="filter-dropdown" title="Data de início">
                    <span class="filter-label date-separator">até</span>
                    <input type="date" id="maintenance-date-to" class="filter-dropdown" title="Data de fim">
                </div>

                <div class="filter-actions">
                    <button id="apply-maintenance-filter" class="smart-filter-toggle btn btn-primary">
                        <i class="fas fa-filter"></i> Filtrar <!-- Exemplo com FontAwesome -->
                    </button>
                    <button id="reset-maintenance-filter" class="smart-filter-toggle reset-button btn btn-secondary">
                        <i class="fas fa-eraser"></i> Limpar
                    </button>
                </div>
            </div>
        `;

        filterContainer.innerHTML = filterHTML;
        console.log("Filtros de manutenção criados no container.");

        // Adicionar estilos CSS se não existirem (opcional, melhor no CSS principal)
        addMaintenanceFilterStyles();
        // Configurar listeners para os botões recém-criados é feito em setupBasicListeners
   }

   // Configura os listeners para os botões de Filtrar e Limpar
   function setupMaintenanceFilterListeners() {
       // Usar addSafeListener para garantir que não haja duplicação
       addSafeListener('apply-maintenance-filter', 'click', function() {
           // Coleta os valores dos filtros
           const statusFilter = document.getElementById('maintenance-status-filter').value;
           const typeFilter = document.getElementById('maintenance-type-filter').value;
           const dateFrom = document.getElementById('maintenance-date-from').value;
           const dateTo = document.getElementById('maintenance-date-to').value;

           // Carrega a lista filtrada
           loadMaintenanceListWithFilters(statusFilter, typeFilter, dateFrom, dateTo);

           // Feedback visual no botão (opcional)
           const applyBtn = document.getElementById('apply-maintenance-filter');
           if(applyBtn) {
               const originalHTML = applyBtn.innerHTML;
               applyBtn.innerHTML = '<i class="fas fa-check"></i> Aplicado';
               applyBtn.disabled = true;
               setTimeout(() => {
                   applyBtn.innerHTML = originalHTML;
                   applyBtn.disabled = false;
               }, 1500); // Duração do feedback
           }
       });

       addSafeListener('reset-maintenance-filter', 'click', function() {
           // Resetar campos de filtro para o padrão
           document.getElementById('maintenance-status-filter').value = 'all';
           document.getElementById('maintenance-type-filter').value = 'all';
           document.getElementById('maintenance-date-from').value = '';
           document.getElementById('maintenance-date-to').value = '';

           // Recarregar lista completa (sem filtros)
           loadMaintenanceListWithoutFilters();

           // Feedback visual no botão (opcional)
            const resetBtn = document.getElementById('reset-maintenance-filter');
            if(resetBtn) {
                const originalHTML = resetBtn.innerHTML;
                resetBtn.innerHTML = '<i class="fas fa-check"></i> Limpo';
                resetBtn.disabled = true;
                setTimeout(() => {
                    resetBtn.innerHTML = originalHTML;
                    resetBtn.disabled = false;
                }, 1500);
            }
       });

       // Opcional: Listener para tecla Enter nos campos de data para aplicar filtro
       ['maintenance-date-from', 'maintenance-date-to'].forEach(id => {
           const input = document.getElementById(id);
           if(input) {
               // Usar addSafeListener individualmente para cada input de data
               addSafeListener(id, 'keypress', function(event) {
                   if (event.key === 'Enter') {
                       event.preventDefault(); // Evita submit de formulário (se houver)
                       // Simula clique no botão de aplicar filtro
                       document.getElementById('apply-maintenance-filter')?.click();
                   }
               });
           }
       });
   }

   // Adiciona estilos CSS para os filtros (melhor colocar no arquivo CSS principal)
   function addMaintenanceFilterStyles() {
       if (!document.getElementById('maintenance-filter-styles')) {
           const styleEl = document.createElement('style');
           styleEl.id = 'maintenance-filter-styles';
           styleEl.textContent = `
           .smart-filter-container { display: flex; flex-wrap: wrap; gap: 15px; background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; align-items: center; }
           .filter-group, .date-filter-group, .filter-actions { display: flex; align-items: center; gap: 8px; }
           .filter-label { font-weight: 500; font-size: 0.9em; color: #495057; margin-bottom: 0; }
           .filter-dropdown, .date-filter-group input[type="date"] { padding: 6px 10px; border: 1px solid #ced4da; border-radius: 4px; background-color: #fff; font-size: 0.9em; height: 38px; /* Alinhar altura com botões */ }
           .date-separator { margin: 0 2px; font-size: 0.9em; color: #6c757d; }
           .filter-actions { margin-left: auto; } /* Empurra botões para direita */
           .smart-filter-toggle { padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; transition: background-color 0.2s ease, opacity 0.2s ease; display: inline-flex; align-items: center; gap: 5px; height: 38px; }
           /* Estilos dos botões usando classes Bootstrap como exemplo */
           /* .smart-filter-toggle.btn-primary { background: #0052cc; color: white; } */
           /* .smart-filter-toggle.btn-primary:hover:not(:disabled) { background: #0041a3; } */
           /* .smart-filter-toggle.btn-secondary { background: #6c757d; color: white; } */
           /* .smart-filter-toggle.btn-secondary:hover:not(:disabled) { background: #5a6268; } */
           .smart-filter-toggle:disabled { opacity: 0.65; cursor: not-allowed; }
           /* Responsividade básica */
           @media (max-width: 992px) { .filter-actions { margin-left: 0; width: 100%; justify-content: flex-start; margin-top: 10px; } }
           @media (max-width: 768px) {
               .smart-filter-container { flex-direction: column; align-items: stretch; }
               .filter-group, .date-filter-group { flex-direction: column; align-items: stretch; }
               .filter-label { margin-bottom: 5px; }
               .filter-dropdown, .date-filter-group input[type="date"] { width: 100%; }
               .date-filter-group { gap: 5px; }
               .date-separator { text-align: center; margin: 5px 0; width: 100%; }
               .filter-actions { flex-direction: column; gap: 8px; width: 100%;}
               .smart-filter-toggle { width: 100%; justify-content: center; }
           }
           /* Estilos para badges (se não definidos globalmente) */
           .status-badge { padding: 3px 8px; border-radius: 12px; font-size: 0.8em; color: white; text-transform: capitalize; }
           .status-pending { background-color: #ffc107; color: #343a40; } /* Amarelo */
           .status-verified { background-color: #17a2b8; } /* Azul info */
           .status-completed { background-color: #28a745; } /* Verde */
           .status-adjusting { background-color: #fd7e14; } /* Laranja */
           .status-progress { background-color: #007bff; } /* Azul primário */
           .status-rejected { background-color: #dc3545; } /* Vermelho */
           .status-cancelled { background-color: #6c757d; } /* Cinza */
           .status-default { background-color: #adb5bd; } /* Cinza claro */
           .critical-badge { color: #dc3545; font-size: 1.1em; margin-left: 5px; cursor: help; }
           .action-buttons { white-space: nowrap; text-align: center; }
           .action-buttons .btn-icon { background: none; border: none; cursor: pointer; padding: 5px; font-size: 1.1em; margin: 0 2px; }
           .action-buttons .btn-icon:disabled { opacity: 0.4; cursor: not-allowed; }
           .action-buttons .view-maintenance { color: #17a2b8; }
           .action-buttons .edit-maintenance { color: #ffc107; }
           .action-buttons .verify-maintenance { color: #28a745; }
           /* Estilos para modal fallback */
           #detail-overlay, #verification-form-overlay-fallback { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.6); z-index: 1050; justify-content: center; align-items: center; padding: 20px; }
           .modal-content-fallback { background-color: #fff; padding: 25px; border-radius: 8px; max-width: 700px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative; box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
           .modal-content-fallback h2, .modal-content-fallback h3 { margin-top: 0; margin-bottom: 15px; color: #333; }
           .modal-content-fallback .close-modal-btn { position: absolute; top: 10px; right: 15px; font-size: 1.8em; background: none; border: none; cursor: pointer; color: #aaa; line-height: 1; padding: 0;}
           .modal-content-fallback .details-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px 20px; margin-top: 15px; }
           .modal-content-fallback .detail-item strong { display: block; color: #555; margin-bottom: 3px; font-size: 0.9em; }
           .modal-content-fallback .detail-item div { font-size: 1em; color: #333; }
           .modal-content-fallback .modal-actions { margin-top: 25px; padding-top: 15px; border-top: 1px solid #eee; display: flex; justify-content: flex-end; gap: 10px; }
           /* Estilos para validação (se não definidos globalmente) */
           .is-invalid { border-color: #dc3545 !important; }
           .has-error .error-message { display: block; }
           /* Outros estilos necessários */
           .text-center { text-align: center; }
           .error-message { color: #dc3545; font-size: 0.875em; margin-top: 0.25rem; width: 100%; }
           /* Ajustes para formulário dentro do modal */
            #maintenance-form-modal .form-step { margin-bottom: 15px; }
            #maintenance-form-modal .form-col { margin-bottom: 1rem; }
           `;
           document.head.appendChild(styleEl);
       }
   }


  // --- API Pública do Módulo ---
  // Expor as funções que precisam ser acessíveis de fora do módulo
  return {
    initialize, // Para iniciar o módulo
    openMaintenanceForm, // Para abrir o formulário (novo ou edição)
    loadMaintenanceList, // Para carregar/recarregar a lista principal
    // Funções chamadas pelos botões da tabela (se Utilities não existir)
    viewMaintenanceDetails,
    editMaintenance,
    verifyMaintenance,
     // Expor função de filtro explicitamente se necessário
     loadMaintenanceListWithFilters,
     // Expor submitVerification se for chamado de fora (ex: pelo módulo Verification)
     submitVerification 
  };
})(); // Fim do IIFE Maintenance

// --- INÍCIO DA FUNÇÃO MODIFICADA PELA ATUALIZAÇÃO D ---
// ARQUIVO: maintenance.js
// FUNÇÃO: initializeMaintenanceModule
function initializeMaintenanceModule() {
  // Verificar se já inicializou
  if (window.maintenanceModuleInitialized) {
    console.log("Módulo Maintenance já inicializado anteriormente. Ignorando nova chamada.");
    return;
  }

  const init = () => {
    console.log("Tentando inicializar o módulo Maintenance...");
    if (window.API && window.Utilities) {
      console.log("Dependências API e Utilities encontradas. Inicializando Maintenance.initialize()...");
      Maintenance.initialize();
      window.maintenanceModuleInitialized = true;
    } else {
      console.error("Falha na inicialização: Dependências API ou Utilities NÃO encontradas.");
      // Tentar novamente após um pequeno atraso?
      setTimeout(() => {
        console.warn("Tentando inicializar novamente após 500ms...");
        if (window.API && window.Utilities) {
          Maintenance.initialize();
          window.maintenanceModuleInitialized = true;
        } else {
          console.error("Dependências ainda não disponíveis após delay. A aplicação pode não funcionar corretamente.");
           // Mostrar mensagem para o usuário
           alert("Erro crítico ao carregar componentes da página (API/Utilities). Por favor, recarregue a página ou contate o suporte.");
        }
      }, 500);
    }
  };

  // Verificar se o DOM já está carregado ou esperar pelo evento
  if (document.readyState === 'loading') {
    console.log("DOM ainda carregando. Esperando por DOMContentLoaded...");
    document.addEventListener('DOMContentLoaded', init);
  } else {
    console.log("DOM já carregado. Iniciando imediatamente...");
    init();
  }
}
// --- FIM DA FUNÇÃO MODIFICADA PELA ATUALIZAÇÃO D ---

// Chamar a função de inicialização para começar tudo
initializeMaintenanceModule();
