// Verificar dependências no início
if (!window.API || !window.Utilities) {
  console.error("Erro CRÍTICO: Dependências API ou Utilities não carregadas antes de maintenance.js");
} else {
  console.log("Maintenance.js - Dependências API e Utilities parecem carregadas.");
}

// Definir o módulo Maintenance com funcionalidade adaptada para o HTML existente
const Maintenance = (() => {
  // --- Listas de Equipamentos Completas ---
  const EQUIPMENT_IDS = {
    'Alta Pressão': ["PUB-2G02","LUX-3201","FLX7617","EZS-8765","EZS-8764","EVK-0291","EOF-5C06","EOF-5208","EGC-2989","EGC-2985","EGC-2983","EGC-2978","EAM-3262","EAM-3256","EAM-3255","EAM-3253","EAM-3010","DSY-6475","DSY-6474","DSY-6472","CZC-0453"],
    'Auto Vácuo / Hiper Vácuo': ["PUB-2F80","NFF-0235","HJS-1097","FSA-3D71","EGC-2993","EGC-2979","EAM-3257","EAM-3251","DYB-7210","DSY-6577","DSY-6473","CUB-0763","ANF-2676","FTW-4D99","FTD-6368","FMD-2200","FHD-9264","EZS-9753"],
    'Aspirador': [], // Array vazio, usuário insere ID manualmente
    'Poliguindaste': [], // Array vazio, usuário insere ID manualmente
    'Outro': [] // Array vazio, usuário insere o tipo manualmente
  };

  // Lista de categorias de problemas padrão
  const DEFAULT_PROBLEM_CATEGORIES = [
    "Motor Estacionário", "Motor Principal", "Tanque", "Válvulas", "Bomba de Água",
    "Sistema Hidráulico", "Sistema Elétrico", "Painel de Comando", "Freios", "Suspensão",
    "Pneus", "Transmissão", "Documentação", "Sinalização", "Carroceria", "Outros" // Nota: "Outros" com "s"
  ];

  let formData = {};
  let isEditMode = false;
  let editingMaintenanceId = null;
  let fullMaintenanceList = [];

  // --- Função de Inicialização ---
  function initialize() {
    console.log("Maintenance.initialize() chamado.");

    // Carregar dados iniciais para os dropdowns
    loadInitialData();

    // Configurar listeners básicos
    setupBasicListeners();

    // Carregar lista de manutenções
    loadMaintenanceList();
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

    // Adicionar opções com base nas chaves de EQUIPMENT_IDS
    Object.keys(EQUIPMENT_IDS).forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = type;
      select.appendChild(option);
    });

    console.log(`Dropdown de tipos de equipamento preenchido com ${Object.keys(EQUIPMENT_IDS).length} opções`);
  }

  function populateProblemCategories() {
    const select = document.getElementById('problem-category-select'); // ATUALIZADO (Item 2 da nova instrução)
    if (!select) {
      console.error("Elemento select #problem-category-select não encontrado!"); // ATUALIZADO (Item 2 da nova instrução)
      return;
    }

    // Limpar opções existentes (mantendo a primeira)
    select.innerHTML = '<option value="">Selecione a categoria...</option>';

    // Adicionar categorias padrão
    DEFAULT_PROBLEM_CATEGORIES.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
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
    }
  }

  // --- Configuração de Listeners ---
  function setupBasicListeners() {
    console.log("Configurando listeners básicos do módulo Maintenance...");

    // Botão para abrir formulário
    const newMaintenanceBtn = document.getElementById('new-maintenance');
    if (newMaintenanceBtn) {
      newMaintenanceBtn.addEventListener('click', function() {
        openMaintenanceForm();
      });
      console.log("Listener configurado para botão 'new-maintenance'");
    } else {
      console.warn("Botão 'new-maintenance' não encontrado no DOM!");
    }

    // Botões de navegação entre etapas
    setupNavigationListeners();

    // Botões de fechar modal
    setupCloseModalListeners();

    // Eventos para campos dinâmicos
    setupDynamicFieldListeners();

    // Form submit
    setupFormSubmitListener();
  }

  function setupNavigationListeners() {
    // Botões de próximo
    addSafeListener('next-to-step-2', 'click', function() {
      console.log("Botão para próxima etapa (1->2) clicado");
      if (validateStep1()) {
        saveStep1Data();
        showStep(2);
      } else {
        showNotification("Por favor, preencha todos os campos obrigatórios.", "warning");
      }
    });

    addSafeListener('next-to-step-3', 'click', function() {
      console.log("Botão para próxima etapa (2->3) clicado");
      if (validateStep2()) {
        saveStep2Data();
        updateSummary();
        showStep(3);
      } else {
        showNotification("Por favor, preencha todos os campos obrigatórios.", "warning");
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
    // Botões de fechar modal
    const closeButtons = [
      'close-maintenance-form',
      'cancel-maintenance'
    ];

    closeButtons.forEach(id => {
      addSafeListener(id, 'click', closeForm);
    });
  }

  function setupDynamicFieldListeners() {
    // Listener para alteração de tipo de equipamento
    addSafeListener('equipment-type', 'change', function(event) {
      const selectedType = this.value;
      console.log(`Tipo de equipamento alterado para: ${selectedType}`);

      handleEquipmentTypeChange(selectedType);
    });

    // Listener para categoria de problema
    addSafeListener('problem-category-select', 'change', function(event) { // ATUALIZADO (Item 4 da nova instrução)
      const selectedCategory = this.value;
      console.log(`Categoria de problema alterada para: ${selectedCategory}`);

      // Mostrar/esconder campo de "outro" baseado na seleção
      const otherCategoryField = document.getElementById('other-category-field');
      if (otherCategoryField) {
        // A categoria em DEFAULT_PROBLEM_CATEGORIES é "Outros"
        otherCategoryField.style.display = selectedCategory === 'Outros' ? 'block' : 'none'; // ATUALIZADO (Item 4 da nova instrução - "Outros")
      }
    });
  }

  function setupFormSubmitListener() {
    const form = document.getElementById('maintenance-form');
    if (form) {
      form.addEventListener('submit', function(event) {
        event.preventDefault();
        console.log("Formulário submetido");

        if (validateAllSteps()) {
          submitMaintenance();
        } else {
          showNotification("Por favor, verifique o preenchimento de todos os campos obrigatórios.", "warning");
        }
      });
    } else {
      console.warn("Formulário #maintenance-form não encontrado!");
    }
  }

  // Função auxiliar para adicionar listeners de forma segura (evita duplicação)
  function addSafeListener(elementId, eventType, handler) {
    const element = document.getElementById(elementId);
    if (element) {
      // Clone o elemento para remover todos os listeners antigos
      const newElement = element.cloneNode(true);
      element.parentNode.replaceChild(newElement, element);

      // Adicionar o novo listener
      newElement.addEventListener(eventType, handler);
      return true;
    } else {
      console.warn(`Elemento #${elementId} não encontrado para adicionar listener de ${eventType}.`);
      return false;
    }
  }

  function handleEquipmentTypeChange(selectedType) {
    console.log(`Manipulando mudança de tipo de equipamento para: ${selectedType}`);

    // Elementos que podem ser mostrados/escondidos
    const equipmentIdField = document.getElementById('equipment-id').closest('.form-col');
    const otherEquipmentField = document.getElementById('other-equipment-field');
    const customIdField = document.getElementById('custom-equipment-field');

    // Se qualquer um dos elementos não for encontrado, registre e retorne
    if (!equipmentIdField || !otherEquipmentField) {
      console.error("Elementos necessários para manipular tipo de equipamento não encontrados!");
      console.log("Elementos encontrados:", {
        equipmentIdField: !!equipmentIdField,
        otherEquipmentField: !!otherEquipmentField,
        customIdField: !!customIdField
      });
      return;
    }

    // Esconder todos os campos especiais primeiro
    equipmentIdField.style.display = 'none';
    otherEquipmentField.style.display = 'none';
    if (customIdField) customIdField.style.display = 'none';

    // Desabilitar select de equipments para evitar dados inválidos
    document.getElementById('equipment-id').disabled = true;

    // Mostrar campo apropriado baseado na seleção
    if (selectedType === 'Outro') {
      console.log("Mostrando campo para 'Outro' equipamento");
      otherEquipmentField.style.display = 'block';
    } else if (selectedType === 'Aspirador' || selectedType === 'Poliguindaste') {
      if (customIdField) {
        console.log(`Mostrando campo personalizado para ${selectedType}`);

        // Atualizar o label para refletir o tipo selecionado
        const label = customIdField.querySelector('label');
        if (label) label.textContent = `Identificação ${selectedType}:`;

        customIdField.style.display = 'block';
      } else {
        // Se não tiver o campo específico, mostrar o campo normal
        equipmentIdField.style.display = 'block';
      }
    } else if (selectedType) {
      console.log(`Mostrando dropdown de IDs para ${selectedType}`);
      equipmentIdField.style.display = 'block';

      // Carregar IDs específicos para o tipo selecionado
      populateEquipmentIds(selectedType);
    }
  }

  function populateEquipmentIds(selectedType) {
    console.log(`Populando IDs para tipo: ${selectedType}`);

    const select = document.getElementById('equipment-id');
    if (!select) {
      console.error("Elemento select #equipment-id não encontrado!");
      return;
    }

    // Limpar opções existentes
    select.innerHTML = '<option value="">Selecione o equipamento...</option>';

    // Se não há tipo selecionado ou é "Outro", parar aqui
    if (!selectedType || !EQUIPMENT_IDS[selectedType]) {
      select.disabled = true;
      console.warn(`Nenhum tipo válido selecionado ou tipo ${selectedType} não encontrado em EQUIPMENT_IDS`);
      return;
    }

    // Obter IDs para o tipo selecionado
    const ids = EQUIPMENT_IDS[selectedType] || [];

    if (ids.length > 0) {
      // Adicionar opções ao select
      ids.forEach(id => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = id;
        select.appendChild(option);
      });

      select.disabled = false;
      console.log(`${ids.length} IDs carregados para tipo ${selectedType}`);
    } else {
      console.warn(`Nenhum ID disponível para tipo: ${selectedType}`);
      select.disabled = true;
    }
  }

  // --- Funções de UI ---
  function showStep(step) {
    console.log(`Tentando mostrar etapa ${step}`);

    // Obter todas as etapas
    const steps = [
      document.getElementById('step-1-content'),
      document.getElementById('step-2-content'),
      document.getElementById('step-3-content')
    ];

    // Verificar se todas as etapas existem
    if (steps.some(s => !s)) {
      console.error("Um ou mais elementos de etapa não foram encontrados!");
      console.log("Etapas encontradas:", steps.map(s => s ? s.id : 'não encontrado'));
      return;
    }

    // Esconder todas as etapas
    steps.forEach(s => {
      if (s) s.style.display = 'none';
    });

    // Mostrar apenas a etapa solicitada
    if (step >= 1 && step <= 3 && steps[step - 1]) {
      steps[step - 1].style.display = 'block';
      console.log(`Etapa ${step} mostrada com sucesso`);

      // Atualizar indicadores de etapa
      updateStepIndicators(step);
    } else {
      console.error(`Etapa inválida: ${step}`);
    }
  }

  function updateStepIndicators(currentStep) {
    const indicators = document.querySelectorAll('.form-step');
    indicators.forEach((indicator, index) => {
      if (index + 1 === currentStep) {
        indicator.classList.add('active');
      } else {
        indicator.classList.remove('active');
      }
    });
  }

  function openMaintenanceForm(maintenanceId = null, data = null) {
      console.log("Abrindo formulário de manutenção");
  
      // Configurar modo de edição primeiro
      if (maintenanceId && data) {
          isEditMode = true;
          editingMaintenanceId = maintenanceId;
          // Não resetamos o formulário quando estamos editando
      } else {
          isEditMode = false;
          editingMaintenanceId = null;
          // Resetar apenas se for um novo registro
          resetForm();
      }
  
      // Para modo de edição, preencher o formulário com os dados
      if (isEditMode && data) {
          populateFormForEdit(data);
      }
  
      // Mostrar o modal
      const modal = document.getElementById('maintenance-form-overlay');
      if (modal) {
          modal.style.display = 'flex';
          console.log("Modal de manutenção aberto com sucesso");
      } else {
          console.error("Modal #maintenance-form-overlay não encontrado!");
      }
  
      // Garantir que comece na primeira etapa
      showStep(1);
  }

  function populateFormForEdit(data) {
    console.log("Populando formulário para edição:", data);

    // Campos da etapa 1
    setSelectValue('equipment-type', data.tipoEquipamento);
    setTimeout(() => {
      // Após o tipo de equipamento ser definido e causar alterações de visibilidade
      if (data.tipoEquipamento === 'Outro') {
        setInputValue('other-equipment', data.equipamentoOutro);
      } else if (['Aspirador', 'Poliguindaste'].includes(data.tipoEquipamento)) {
        setInputValue('custom-equipment-id', data.placaOuId);
      } else {
        setSelectValue('equipment-id', data.placaOuId);
      }

      setInputValue('technician-name', data.responsavel);
      setInputValue('maintenance-date', formatDateForInput(data.dataRegistro));
      setSelectValue('area', data.area);
      setInputValue('office', data.localOficina);
      setSelectValue('maintenance-type-select', data.tipoManutencao); // Ajustado para refletir a alteração em validateStep1
      setCheckboxValue('is-critical', data.eCritico);

      // Atualizar título do formulário
      const formTitle = document.querySelector('.form-title');
      if (formTitle) formTitle.textContent = 'Editar Manutenção';
    }, 100); // Pequeno delay para garantir que o DOM seja atualizado após o change de equipment-type
  }

  function setSelectValue(id, value) {
    const element = document.getElementById(id);
    if (element && value) {
      // Procurar a opção com o valor correspondente
      for (let i = 0; i < element.options.length; i++) {
        if (element.options[i].value === value) {
          element.selectedIndex = i;

          // Disparar evento de change para atualizar campos dependentes
          const event = new Event('change');
          element.dispatchEvent(event);
          return true;
        }
      }
      console.warn(`Valor "${value}" não encontrado nas opções de #${id}`);
      return false;
    }
    return false;
  }

  function setInputValue(id, value) {
    const element = document.getElementById(id);
    if (element && value !== undefined) {
      element.value = value;
      return true;
    }
    return false;
  }

  function setCheckboxValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.checked = !!value;
      return true;
    }
    return false;
  }

  function formatDateForInput(dateString) {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    } catch (e) {
      console.error("Erro ao formatar data:", e);
      return '';
    }
  }

  function closeForm() {
    console.log("Fechando formulário");

    const modal = document.getElementById('maintenance-form-overlay');
    if (modal) {
      modal.style.display = 'none';
      resetForm();
      console.log("Modal de manutenção fechado com sucesso");
    } else {
      console.error("Modal #maintenance-form-overlay não encontrado!");
    }
  }

  function resetForm() {
    // Reset básico do formulário
    const form = document.getElementById('maintenance-form');
    if (form) {
      form.reset();
      console.log("Formulário resetado");
    }

    // Limpar estados
    isEditMode = false;
    editingMaintenanceId = null;
    formData = {};

    // Esconder campos condicionais
    const otherEquipmentField = document.getElementById('other-equipment-field');
    if (otherEquipmentField) otherEquipmentField.style.display = 'none';

    const otherCategoryField = document.getElementById('other-category-field');
    if (otherCategoryField) otherCategoryField.style.display = 'none';

    // Desabilitar select de equipamento
    const equipmentIdSelect = document.getElementById('equipment-id');
    if (equipmentIdSelect) equipmentIdSelect.disabled = true;

    // Definir data atual novamente
    setCurrentDate();

    // Voltar para primeira etapa
    showStep(1);

    // Atualizar título do formulário para "Nova Manutenção"
    const formTitle = document.querySelector('.form-title');
    if (formTitle) formTitle.textContent = 'Registrar Nova Manutenção';
  }

  // --- Validação e Coleta de Dados ---
  function validateStep1() {
    console.log("Validando etapa 1...");

    const requiredFields = [
      { id: 'equipment-type', name: 'Tipo de Equipamento' }
    ];

    // Adicionar campos condicionais baseados no tipo de equipamento
    const equipType = document.getElementById('equipment-type').value;

    if (equipType === 'Outro') {
      requiredFields.push({ id: 'other-equipment', name: 'Especificar Equipamento' });
    } else if (equipType === 'Aspirador' || equipType === 'Poliguindaste') {
      if (document.getElementById('custom-equipment-id')) {
        requiredFields.push({ id: 'custom-equipment-id', name: 'Identificação' });
      } else {
        requiredFields.push({ id: 'equipment-id', name: 'Placa ou ID' });
      }
    } else if (equipType) {
      requiredFields.push({ id: 'equipment-id', name: 'Placa ou ID' });
    }

    // Adicionar outros campos obrigatórios da etapa 1
    requiredFields.push(
      { id: 'technician-name', name: 'Responsável pelo Relatório' },
      { id: 'maintenance-date', name: 'Data da Manutenção' },
      { id: 'area', name: 'Área' },
      { id: 'office', name: 'Local/Oficina' },
      { id: 'maintenance-type-select', name: 'Tipo de Manutenção' } // ATUALIZADO (Item 3 da nova instrução)
    );

    return validateFields(requiredFields);
  }

  function validateStep2() {
    console.log("Validando etapa 2...");

    const requiredFields = [
      { id: 'problem-category-select', name: 'Categoria do Problema' }, // Já estava correto ('problem-category-select')
      { id: 'problem-description', name: 'Detalhes do Problema' }
    ];

    // Verificar se "Outros" foi selecionado como categoria
    const problemCategoryValue = document.getElementById('problem-category-select').value; // Usando o ID correto
    if (problemCategoryValue === 'Outros') { // Comparando com "Outros" (conforme DEFAULT_PROBLEM_CATEGORIES)
      requiredFields.push({ id: 'other-category', name: 'Especificar Categoria' });
    }

    return validateFields(requiredFields);
  }

  function validateAllSteps() {
    return validateStep1() && validateStep2();
  }

  function validateFields(fields) {
    let isValid = true;
    let firstInvalidField = null;

    fields.forEach(field => {
      const element = document.getElementById(field.id);
      if (!element) {
        console.warn(`Campo ${field.id} não encontrado no DOM!`);
        return; // Pula para o próximo campo se não encontrar
      }

      let fieldValue = element.value.trim();
      let fieldValid = fieldValue !== '';

      // Se o campo é um select e está desabilitado, considerar válido
      // Isso é importante para o select de equipment-id que pode estar desabilitado
      if (element.tagName === 'SELECT' && element.disabled) {
        fieldValid = true;
      }

      if (!fieldValid) {
        isValid = false;
        markFieldAsInvalid(element, `${field.name} é obrigatório`);

        if (!firstInvalidField) {
          firstInvalidField = element;
        }
      } else {
        clearFieldValidation(element);
      }
    });

    // Focar no primeiro campo inválido
    if (firstInvalidField) {
      firstInvalidField.focus();
    }

    return isValid;
  }

  function markFieldAsInvalid(element, message) {
    // Adicionar classe de erro ao elemento
    element.classList.add('is-invalid');

    // Procurar o container pai (form-group ou form-col)
    const formGroup = element.closest('.form-group, .form-col');
    if (formGroup) {
      formGroup.classList.add('has-error');

      // Verificar se já existe mensagem de erro
      let errorElement = formGroup.querySelector('.error-message');
      if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        // Inserir após o elemento inválido
        element.parentNode.insertBefore(errorElement, element.nextSibling);
      }

      errorElement.textContent = message;
      errorElement.style.display = 'block'; // Garantir que esteja visível
    }
  }

  function clearFieldValidation(element) {
    // Remover classe de erro do elemento
    element.classList.remove('is-invalid');

    // Procurar o container pai (form-group ou form-col)
    const formGroup = element.closest('.form-group, .form-col');
    if (formGroup) {
      formGroup.classList.remove('has-error');

      // Remover mensagem de erro se existir
      const errorElement = formGroup.querySelector('.error-message');
      if (errorElement) {
        errorElement.remove(); // Ou errorElement.style.display = 'none';
      }
    }
  }

  function saveStep1Data() {
    console.log("Salvando dados da etapa 1...");

    // Capturar valores dos campos
    const equipType = document.getElementById('equipment-type').value;

    formData.tipoEquipamento = equipType;

    // Capturar ID baseado no tipo de equipamento
    if (equipType === 'Outro') {
      formData.equipamentoOutro = document.getElementById('other-equipment').value;
      formData.placaOuId = formData.equipamentoOutro;
    } else if (equipType === 'Aspirador' || equipType === 'Poliguindaste') {
      const customIdField = document.getElementById('custom-equipment-id');
      if (customIdField) {
        formData.placaOuId = customIdField.value;
      } else {
        formData.placaOuId = document.getElementById('equipment-id').value;
      }
    } else {
      formData.placaOuId = document.getElementById('equipment-id').value;
    }

    formData.responsavel = document.getElementById('technician-name').value;
    formData.dataRegistro = document.getElementById('maintenance-date').value;
    formData.area = document.getElementById('area').value;
    formData.localOficina = document.getElementById('office').value;
    formData.tipoManutencao = document.getElementById('maintenance-type-select').value; // Usando ID correto
    formData.eCritico = document.getElementById('is-critical').checked;

    console.log("Dados da etapa 1 salvos:", formData);
  }

  function saveStep2Data() {
    console.log("Salvando dados da etapa 2...");

    // Capturar valores dos campos
    const problemCategoryValue = document.getElementById('problem-category-select').value; // Usando ID correto

    formData.categoriaProblema = problemCategoryValue;

    // Se categoria for "Outros", salvar categoria específica
    if (problemCategoryValue === 'Outros') { // Comparando com "Outros"
      formData.categoriaProblemaOutro = document.getElementById('other-category').value;
    }

    formData.detalhesproblema = document.getElementById('problem-description').value;

    const additionalNotes = document.getElementById('additional-notes');
    if (additionalNotes) {
      formData.observacoes = additionalNotes.value;
    }

    console.log("Dados da etapa 2 salvos:", formData);
  }

  function updateSummary() {
    console.log("Atualizando resumo...");

    // Mapear IDs dos elementos de resumo para as propriedades de formData
    const summaryElements = {
      'summary-equipment': formData.tipoEquipamento === 'Outro' ?
                           formData.equipamentoOutro :
                           `${formData.tipoEquipamento} (${formData.placaOuId})`,
      'summary-technician': formData.responsavel,
      'summary-date': formatDate(formData.dataRegistro),
      'summary-location': `${formData.area} - ${formData.localOficina}`,
      'summary-type': formData.tipoManutencao,
      'summary-critical': formData.eCritico ? 'Sim' : 'Não',
      'summary-category': formData.categoriaProblema === 'Outros' ? // Comparando com "Outros"
                          formData.categoriaProblemaOutro :
                          formData.categoriaProblema,
      'summary-problem': formData.detalhesproblema,
      'summary-notes': formData.observacoes || 'Não informado'
    };

    // Atualizar elementos no DOM
    Object.entries(summaryElements).forEach(([elementId, value]) => {
      const element = document.getElementById(elementId);
      if (element) {
        element.textContent = value;
      } else {
        console.warn(`Elemento de resumo #${elementId} não encontrado!`);
      }
    });

    console.log("Resumo atualizado com sucesso");
  }

  function submitMaintenance() {
    console.log(`${isEditMode ? 'Atualizando' : 'Criando nova'} manutenção...`);

    // Mostrar indicador de carregamento
    showLoading(true, `${isEditMode ? 'Atualizando' : 'Registrando'} manutenção...`);

    // Preparar dados para envio
    const dataToSend = {
      ...formData,
      // Adicionar mapeamentos de campos para o backend (se necessário)
      equipmentId: formData.placaOuId,
      date: formData.dataRegistro,
      equipmentType: formData.tipoEquipamento,
      technician: formData.responsavel,
      location: formData.localOficina,
      maintenanceType: formData.tipoManutencao,
      isCritical: formData.eCritico,
      problemCategory: formData.categoriaProblema === 'Outros' ? formData.categoriaProblemaOutro : formData.categoriaProblema, // Enviar a categoria correta
      problemDescription: formData.detalhesproblema,
      additionalNotes: formData.observacoes
    };

    // Se estiver editando, incluir ID
    if (isEditMode && editingMaintenanceId) {
      dataToSend.id = editingMaintenanceId;
    } else if (isEditMode && !editingMaintenanceId) {
        console.error("Tentando editar sem um ID de manutenção!");
        showNotification("Erro: ID da manutenção não encontrado para edição.", "error");
        showLoading(false);
        return;
    }

    // Chamar API para salvar os dados
    const apiCall = isEditMode ?
      API.updateMaintenance(editingMaintenanceId, dataToSend) :
      API.createMaintenance(dataToSend);

    apiCall
      .then(response => {
        if (response && response.success) {
          console.log("Manutenção salva com sucesso:", response);

          // Mostrar notificação de sucesso
          const message = isEditMode ?
            "Manutenção atualizada com sucesso!" :
            "Nova manutenção registrada com sucesso!";

          showNotification(message, "success");

          // Fechar o formulário
          closeForm();

          // Recarregar a lista de manutenções
          loadMaintenanceList();
        } else {
          console.error("Erro ao salvar manutenção:", response);

          // Mostrar notificação de erro
          showNotification(`Erro ao ${isEditMode ? 'atualizar' : 'registrar'} manutenção: ${response?.message || 'Erro desconhecido'}`, "error");
        }
      })
      .catch(error => {
        console.error("Falha ao salvar manutenção:", error);

        // Mostrar notificação de erro
        showNotification(`Falha ao salvar dados: ${error.message || 'Erro desconhecido'}`, "error");
      })
      .finally(() => {
        // Esconder indicador de carregamento
        showLoading(false);
      });
  }

  // --- Funções de Dados ---
  function loadMaintenanceList() {
    console.log("Carregando lista de manutenções...");

    // Mostrar indicador de carregamento
    showLoading(true, "Carregando manutenções...");

    // Indicador de carregamento na tabela
    const tableBody = document.getElementById('maintenance-tbody');
    if (tableBody) {
      tableBody.innerHTML = '<tr><td colspan="10" class="text-center">Carregando...</td></tr>';
    }

    // Chamar API para obter dados
    if (window.API && typeof API.getMaintenanceList === 'function') {
      API.getMaintenanceList()
        .then(response => {
          if (response && response.success && Array.isArray(response.maintenances)) {
            fullMaintenanceList = response.maintenances;
            console.log("Lista de manutenções recebida:", fullMaintenanceList);
            renderMaintenanceTable(fullMaintenanceList);
          } else {
            console.error("Erro ao carregar manutenções:", response);
            if (tableBody) {
              tableBody.innerHTML = '<tr><td colspan="10" class="text-center error-message">Erro ao carregar dados.</td></tr>';
            }
            fullMaintenanceList = []; // Limpar a lista em caso de erro
          }
        })
        .catch(error => {
          console.error("Falha ao buscar manutenções:", error);
          if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="10" class="text-center error-message">Falha ao buscar dados.</td></tr>';
          }
          fullMaintenanceList = []; // Limpar a lista em caso de erro
        })
        .finally(() => {
          // Esconder indicador de carregamento
          showLoading(false);
        });
    } else {
      console.error("API.getMaintenanceList não disponível");
      if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="10" class="text-center error-message">API não disponível.</td></tr>';
      }
      showLoading(false);
      fullMaintenanceList = []; // Limpar a lista
    }
  }

  // >>> INÍCIO DA FUNÇÃO ATUALIZADA <<<
  function renderMaintenanceTable(maintenances) {
    console.log(`Renderizando tabela com ${maintenances?.length || 0} manutenções`);

    const tableBody = document.getElementById('maintenance-tbody');
    if (!tableBody) {
      console.error("Elemento #maintenance-tbody não encontrado!");
      return;
    }

    // Limpar tabela
    tableBody.innerHTML = '';

    // Se não há dados, mostrar mensagem
    if (!maintenances || maintenances.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="10" class="text-center">Nenhuma manutenção encontrada.</td></tr>';
      return;
    }

    // Renderizar cada linha
    maintenances.forEach(item => {
      const row = document.createElement('tr');
      row.dataset.id = item.id; // Adicionar ID à linha para referência futura

      // Determinar status e ações visíveis
      const status = item.status || 'Pendente'; // Default para 'Pendente' se não houver status
      const statusClass = getStatusClass(status);
      const statusLower = status.toLowerCase();

      // Determinar quais botões mostrar
      const showVerify = ['pendente', 'aguardando verificação', 'aguardando verificacao'].includes(statusLower);
      const showEdit = ['pendente', 'aguardando verificação', 'aguardando verificacao', 'ajustes'].includes(statusLower);

      // Compatibilidade com nomes de campos diferentes (novos e antigos)
      const tipoManutencao = item.tipoManutencao || item.tipoManutenO || '-';
      const responsavel = item.responsavel || item.responsVel || '-';
      const area = item.area || item.reaInternaExterna || '-';
      const eCritico = item.eCritico || item.crTico || false;

      // Determinar texto da categoria do problema
      const problemCategoryText = item.categoriaProblema === 'Outros'
        ? (item.categoriaProblemaOutro || 'Outro (não especificado)')
        : (item.categoriaProblema || '-');

      // Gerar HTML da linha
      row.innerHTML = `
        <td>${item.id || '-'}</td>
        <td>${item.tipoEquipamento || '-'} (${item.placaOuId || '-'})</td>
        <td>${tipoManutencao} ${eCritico ? '<span class="critical-badge" title="Manutenção Crítica">⚠️</span>' : ''}</td>
        <td>${formatDate(item.dataRegistro) || '-'}</td>
        <td>${responsavel}</td>
        <td>${area}</td>
        <td>${item.localOficina || '-'}</td>
        <td>${problemCategoryText}</td>
        <td><span class="status-badge status-${statusClass}">${status}</span></td>
        <td>
          <button class="btn-icon view-maintenance" data-id="${item.id}" title="Ver Detalhes">👁️</button>
          ${showEdit ? `<button class="btn-icon edit-maintenance" data-id="${item.id}" title="Editar">✏️</button>` : ''}
          ${showVerify ? `<button class="btn-icon verify-maintenance" data-id="${item.id}" title="Verificar">✔️</button>` : ''}
        </td>
      `;

      tableBody.appendChild(row);
    });

    // Configurar listeners para ações na tabela
    setupTableActionListeners();
  }
  // >>> FIM DA FUNÇÃO ATUALIZADA <<<

  function setupTableActionListeners() {
    const tableBody = document.getElementById('maintenance-tbody');
    if (!tableBody) return;

    // Usar delegação de eventos
    tableBody.addEventListener('click', function(event) {
      const button = event.target.closest('.btn-icon');
      if (!button) return; // Clique não foi em um botão

      const maintenanceId = button.getAttribute('data-id');
      if (!maintenanceId) return; // Botão sem data-id

      if (button.classList.contains('view-maintenance')) {
        console.log(`Visualizar manutenção: ${maintenanceId}`);
        viewMaintenanceDetails(maintenanceId);
      } else if (button.classList.contains('edit-maintenance')) {
        console.log(`Editar manutenção: ${maintenanceId}`);
        editMaintenance(maintenanceId);
      } else if (button.classList.contains('verify-maintenance')) {
        console.log(`Verificar manutenção: ${maintenanceId}`);
        verifyMaintenance(maintenanceId);
      }
    });
  }

  function viewMaintenanceDetails(id) {
    // Buscar dados da manutenção
    const maintenanceData = findMaintenanceById(id);

    if (!maintenanceData) {
      showNotification("Erro: Dados da manutenção não encontrados.", "error");
      return;
    }

    // Exibir detalhes usando o módulo Utilities ou fallback
    if (typeof Utilities !== 'undefined' && Utilities.viewMaintenanceDetails) {
      // Passar a função de verificação como callback para o Utilities
      Utilities.viewMaintenanceDetails(id, maintenanceData, () => verifyMaintenance(id));
    } else {
        console.warn("Módulo Utilities ou Utilities.viewMaintenanceDetails não encontrado. Usando fallback.");
        // Implementação básica de fallback
        const detailOverlay = document.getElementById('detail-overlay');
        const detailContent = document.getElementById('maintenance-detail-content');

        if (detailOverlay && detailContent) {
            const detailsMap = [
                { label: 'ID', value: maintenanceData.id },
                { label: 'Equipamento', value: `${maintenanceData.tipoEquipamento || '-'} (${maintenanceData.placaOuId || '-'})` },
                { label: 'Tipo de Manutenção', value: `${maintenanceData.tipoManutencao || '-'} ${maintenanceData.eCritico ? '⚠️ CRÍTICA' : ''}` },
                { label: 'Data de Registro', value: formatDate(maintenanceData.dataRegistro) },
                { label: 'Responsável', value: maintenanceData.responsavel },
                { label: 'Local', value: `${maintenanceData.area || '-'} - ${maintenanceData.localOficina || '-'}` },
                { label: 'Status', value: `<span class="status-badge status-${getStatusClass(maintenanceData.status)}">${maintenanceData.status || 'Pendente'}</span>` },
            ];

            const problemMap = [
                { label: 'Categoria', value: maintenanceData.categoriaProblema === 'Outros' ? maintenanceData.categoriaProblemaOutro : maintenanceData.categoriaProblema }, // Comparando com "Outros"
                { label: 'Detalhes', value: maintenanceData.detalhesproblema },
                { label: 'Observações', value: maintenanceData.observacoes },
            ];

            let html = '<div class="detail-section"><h3>Informações Básicas</h3>';
            detailsMap.forEach(item => {
                html += `<div class="detail-item"><strong>${item.label}:</strong> ${item.value || '-'}</div>`;
            });
            html += '</div>';

            html += '<div class="detail-section"><h3>Problema</h3>';
            problemMap.forEach(item => {
                html += `<div class="detail-item"><strong>${item.label}:</strong> ${item.value || '-'}</div>`;
            });
            html += '</div>';

            if (maintenanceData.verificacao) {
                const verificationMap = [
                    { label: 'Verificador', value: maintenanceData.verificacao.verificador },
                    { label: 'Data', value: formatDate(maintenanceData.verificacao.data) },
                    { label: 'Resultado', value: maintenanceData.verificacao.resultado },
                    { label: 'Comentários', value: maintenanceData.verificacao.comentarios },
                ];
                html += '<div class="detail-section"><h3>Verificação</h3>';
                verificationMap.forEach(item => {
                    html += `<div class="detail-item"><strong>${item.label}:</strong> ${item.value || '-'}</div>`;
                });
                html += '</div>';
            }

            detailContent.innerHTML = html;
            detailOverlay.style.display = 'flex';

            addSafeListener('close-detail', 'click', () => detailOverlay.style.display = 'none');
            addSafeListener('close-detail-btn', 'click', () => detailOverlay.style.display = 'none');

            const verifyBtn = document.getElementById('verify-maintenance-btn');
            if (verifyBtn) {
                const status = (maintenanceData.status || '').toLowerCase();
                const canVerify = ['pendente', 'aguardando verificacao', 'aguardando verificação'].includes(status);
                verifyBtn.style.display = canVerify ? 'inline-block' : 'none';
                if (canVerify) {
                    addSafeListener('verify-maintenance-btn', 'click', () => {
                        detailOverlay.style.display = 'none';
                        verifyMaintenance(id);
                    });
                }
            }
        } else {
          alert(`Detalhes da manutenção ${id}:\n\nTipo: ${maintenanceData.tipoEquipamento}\nResponsável: ${maintenanceData.responsavel}\nStatus: ${maintenanceData.status || 'Pendente'}`);
        }
    }
  }

  function editMaintenance(id) {
    const maintenanceData = findMaintenanceById(id);
    if (!maintenanceData) {
      showNotification("Erro: Dados da manutenção não encontrados para edição.", "error");
      return;
    }
    openMaintenanceForm(id, maintenanceData);
  }

  function verifyMaintenance(id) {
    const maintenanceData = findMaintenanceById(id);
    if (!maintenanceData) {
      showNotification("Erro: Dados da manutenção não encontrados para verificação.", "error");
      return;
    }

    if (typeof Verification !== 'undefined' && Verification.openVerificationForm) {
      Verification.openVerificationForm(id, maintenanceData);
    } else {
      console.warn("Módulo Verification não encontrado. Usando formulário de verificação interno/fallback.");
      const verificationOverlay = document.getElementById('verification-form-overlay');
      const verificationForm = document.getElementById('verification-form');

      if (verificationOverlay && verificationForm) {
        document.getElementById('verification-id').value = id;
        document.getElementById('verification-equipment').value = `${maintenanceData.tipoEquipamento} (${maintenanceData.placaOuId})`;
        document.getElementById('verification-type').value = maintenanceData.tipoManutencao;

        setInputValue('verifier-name', '');
        document.querySelectorAll('input[name="verification-result"]').forEach(radio => { radio.checked = false; });
        setInputValue('verification-comments', '');
        clearFieldValidation(document.getElementById('verifier-name'));
        clearFieldValidation(document.getElementById('verification-comments'));
        const radioContainer = document.querySelector('input[name="verification-result"]').closest('.form-group');
        if(radioContainer) clearFieldValidation(radioContainer);

        verificationOverlay.style.display = 'flex';

        addSafeListener('close-verification-form', 'click', () => verificationOverlay.style.display = 'none');
        addSafeListener('cancel-verification', 'click', () => verificationOverlay.style.display = 'none');

        addSafeListener('submit-verification-btn', 'click', function(event) {
           event.preventDefault();
           const verifierNameInput = document.getElementById('verifier-name');
           const resultRadio = document.querySelector('input[name="verification-result"]:checked');
           const commentsInput = document.getElementById('verification-comments');

           const verificationData = {
               maintenanceId: id,
               verifierName: verifierNameInput.value.trim(),
               result: resultRadio ? resultRadio.value : null,
               comments: commentsInput.value.trim()
           };

           let isVerificationValid = true;
           if (!verificationData.verifierName) {
               markFieldAsInvalid(verifierNameInput, 'Nome do verificador é obrigatório.');
               isVerificationValid = false;
           } else {
                clearFieldValidation(verifierNameInput);
           }
           if (!verificationData.result) {
               const radioGroup = document.querySelector('input[name="verification-result"]').closest('.form-group');
               if(radioGroup) markFieldAsInvalid(radioGroup, 'Selecione um resultado.');
               isVerificationValid = false;
           } else {
               const radioGroup = document.querySelector('input[name="verification-result"]').closest('.form-group');
               if(radioGroup) clearFieldValidation(radioGroup);
           }
            if (!verificationData.comments) {
               markFieldAsInvalid(commentsInput, 'Comentários são obrigatórios.');
               isVerificationValid = false;
           } else {
                clearFieldValidation(commentsInput);
           }

           if (!isVerificationValid) {
               showNotification("Por favor, preencha todos os campos obrigatórios da verificação.", "warning");
               return;
           }
           submitVerification(verificationData);
       });
      } else {
        alert(`Formulário de verificação para a manutenção ${id} não encontrado! Verifique os IDs 'verification-form-overlay' e 'verification-form'.`);
      }
    }
  }

  function submitVerification(data) {
    console.log("Submetendo verificação:", data);
    showLoading(true, "Registrando verificação...");

    if (window.API && typeof API.submitVerification === 'function') {
      API.submitVerification(data)
        .then(response => {
          if (response && response.success) {
            console.log("Verificação registrada com sucesso:", response);
            showNotification("Verificação registrada com sucesso!", "success");
            const verificationOverlay = document.getElementById('verification-form-overlay');
            if (verificationOverlay) {
              verificationOverlay.style.display = 'none';
            }
            loadMaintenanceList();
          } else {
            console.error("Erro ao registrar verificação:", response);
            showNotification(`Erro ao registrar verificação: ${response?.message || 'Erro desconhecido'}`, "error");
          }
        })
        .catch(error => {
          console.error("Falha ao registrar verificação:", error);
          showNotification(`Falha ao registrar verificação: ${error.message || 'Erro desconhecido'}`, "error");
        })
        .finally(() => {
          showLoading(false);
        });
    } else {
      console.error("API.submitVerification não disponível.");
      showNotification("Erro: Função da API para submeter verificação não encontrada.", "error");
      showLoading(false);
      const verificationOverlay = document.getElementById('verification-form-overlay');
      if (verificationOverlay) {
          verificationOverlay.style.display = 'none';
      }
    }
  }

  function findMaintenanceById(id) {
    return fullMaintenanceList.find(item => String(item.id) === String(id));
  }

  // --- Funções Utilitárias ---
  function formatDate(dateString) {
    if (!dateString) return '-';
    if (typeof Utilities !== 'undefined' && Utilities.formatDate) {
      return Utilities.formatDate(dateString);
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
          const parts = dateString.split('/');
          if (parts.length === 3) {
              const isoDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
              if (!isNaN(isoDate.getTime())) {
                  const day = String(isoDate.getDate()).padStart(2, '0');
                  const month = String(isoDate.getMonth() + 1).padStart(2, '0');
                  const year = isoDate.getFullYear();
                  return `${day}/${month}/${year}`;
              }
          }
          console.warn(`Formato de data inválido ou não reconhecido: ${dateString}`);
          return dateString;
      }
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch(e) {
      console.error("Erro ao formatar data:", e);
      return dateString;
    }
  }

  function getStatusClass(status) {
    if (!status) return 'default';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('pendente') || statusLower.includes('aguardando')) {
      return 'pending';
    } else if (statusLower.includes('verificado') && !statusLower.includes('reprovado')) {
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

  function showNotification(message, type = 'info') {
    if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
      Utilities.showNotification(message, type);
      return;
    }
    console.log(`[${type.toUpperCase()}] ${message}`);
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '1050';
        container.style.width = '300px';
        document.body.appendChild(container);
    }
    const notification = document.createElement('div');
    notification.classList.add('notification', `notification-${type}`);
    notification.textContent = message;
    notification.style.backgroundColor = type === 'error' ? '#f8d7da' : (type === 'success' ? '#d4edda' : '#cce5ff');
    notification.style.color = type === 'error' ? '#721c24' : (type === 'success' ? '#155724' : '#004085');
    notification.style.padding = '10px 15px';
    notification.style.marginBottom = '10px';
    notification.style.border = '1px solid transparent';
    notification.style.borderRadius = '4px';
    notification.style.opacity = '1';
    notification.style.transition = 'opacity 0.5s ease-out';
    container.appendChild(notification);
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        notification.remove();
        if (container.children.length === 0) {
            // container.remove();
        }
      }, 500);
    }, 4000);
  }

  function showLoading(show, message = 'Carregando...') {
    if (typeof Utilities !== 'undefined' && Utilities.showLoading) {
      Utilities.showLoading(show, message);
      return;
    }
    let loader = document.getElementById('global-loader');
    let loaderMessageElement = document.getElementById('global-loader-message');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.style.position = 'fixed';
        loader.style.top = '0';
        loader.style.left = '0';
        loader.style.width = '100%';
        loader.style.height = '100%';
        loader.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        loader.style.display = 'none';
        loader.style.justifyContent = 'center';
        loader.style.alignItems = 'center';
        loader.style.zIndex = '1060';
        const spinner = document.createElement('div');
        spinner.style.border = '4px solid #f3f3f3';
        spinner.style.borderTop = '4px solid #3498db';
        spinner.style.borderRadius = '50%';
        spinner.style.width = '40px';
        spinner.style.height = '40px';
        spinner.style.animation = 'spin 1s linear infinite';
        loaderMessageElement = document.createElement('p');
        loaderMessageElement.id = 'global-loader-message';
        loaderMessageElement.style.color = 'white';
        loaderMessageElement.style.marginLeft = '15px';
        loaderMessageElement.style.fontSize = '1.2em';
        loader.appendChild(spinner);
        loader.appendChild(loaderMessageElement);
        document.body.appendChild(loader);
        const styleSheet = document.styleSheets[0];
        try {
             if (styleSheet) {
                styleSheet.insertRule(`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `, styleSheet.cssRules.length);
            }
        } catch (e) {
            console.warn("Não foi possível inserir a regra @keyframes spin:", e);
        }
    }
    if (show) {
      if (loaderMessageElement) loaderMessageElement.textContent = message;
      loader.style.display = 'flex';
    } else {
      loader.style.display = 'none';
    }
  }

  // API pública do módulo
  return {
    initialize,
    openMaintenanceForm,
    loadMaintenanceList,
    viewMaintenanceDetails,
  };
})();

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM completamente carregado. Inicializando Maintenance...");
  Maintenance.initialize();
});
