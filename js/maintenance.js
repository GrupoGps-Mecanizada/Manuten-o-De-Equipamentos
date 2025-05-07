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

  // --- Função de Inicialização --- (VERSÃO ATUALIZADA)
  function initialize() {
    console.log("Maintenance.initialize() chamado.");
    
    // Carregar dados iniciais para os dropdowns
    loadInitialData();
    
    // Configurar listeners básicos
    setupBasicListeners();
    
    // Configurar listeners de filtro - remover a chamada do setupFilterToggle daqui
    setupFilterListeners();
    
    // Chamar setupFilterToggle separadamente
    setupFilterToggle();
    
    // Adicionar um listener para inicialização tardia (caso os elementos ainda não existam)
    setTimeout(setupFilterToggle, 500);
    
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
    const select = document.getElementById('problem-category-select');
    if (!select) {
      console.error("Elemento select #problem-category-select não encontrado!");
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
    addSafeListener('problem-category-select', 'change', function(event) {
      const selectedCategory = this.value;
      console.log(`Categoria de problema alterada para: ${selectedCategory}`);

      // Mostrar/esconder campo de "outro" baseado na seleção
      const otherCategoryField = document.getElementById('other-category-field');
      if (otherCategoryField) {
        otherCategoryField.style.display = selectedCategory === 'Outros' ? 'block' : 'none';
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
      const newElement = element.cloneNode(true);
      element.parentNode.replaceChild(newElement, element);
      newElement.addEventListener(eventType, handler);
      return true;
    } else {
      console.warn(`Elemento #${elementId} não encontrado para adicionar listener de ${eventType}.`);
      return false;
    }
  }

  function handleEquipmentTypeChange(selectedType) {
    console.log(`Manipulando mudança de tipo de equipamento para: ${selectedType}`);

    const equipmentIdField = document.getElementById('equipment-id').closest('.form-col');
    const otherEquipmentField = document.getElementById('other-equipment-field');
    const customIdField = document.getElementById('custom-equipment-field');

    if (!equipmentIdField || !otherEquipmentField) {
      console.error("Elementos necessários para manipular tipo de equipamento não encontrados!");
      console.log("Elementos encontrados:", {
        equipmentIdField: !!equipmentIdField,
        otherEquipmentField: !!otherEquipmentField,
        customIdField: !!customIdField
      });
      return;
    }

    equipmentIdField.style.display = 'none';
    otherEquipmentField.style.display = 'none';
    if (customIdField) customIdField.style.display = 'none';
    document.getElementById('equipment-id').disabled = true;

    if (selectedType === 'Outro') {
      console.log("Mostrando campo para 'Outro' equipamento");
      otherEquipmentField.style.display = 'block';
    } else if (selectedType === 'Aspirador' || selectedType === 'Poliguindaste') {
      if (customIdField) {
        console.log(`Mostrando campo personalizado para ${selectedType}`);
        const label = customIdField.querySelector('label');
        if (label) label.textContent = `Identificação ${selectedType}:`;
        customIdField.style.display = 'block';
      } else {
        equipmentIdField.style.display = 'block';
      }
    } else if (selectedType) {
      console.log(`Mostrando dropdown de IDs para ${selectedType}`);
      equipmentIdField.style.display = 'block';
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
    select.innerHTML = '<option value="">Selecione o equipamento...</option>';
    if (!selectedType || !EQUIPMENT_IDS[selectedType]) {
      select.disabled = true;
      console.warn(`Nenhum tipo válido selecionado ou tipo ${selectedType} não encontrado em EQUIPMENT_IDS`);
      return;
    }
    const ids = EQUIPMENT_IDS[selectedType] || [];
    if (ids.length > 0) {
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
    const steps = [
      document.getElementById('step-1-content'),
      document.getElementById('step-2-content'),
      document.getElementById('step-3-content')
    ];
    if (steps.some(s => !s)) {
      console.error("Um ou mais elementos de etapa não foram encontrados!");
      console.log("Etapas encontradas:", steps.map(s => s ? s.id : 'não encontrado'));
      return;
    }
    steps.forEach(s => {
      if (s) s.style.display = 'none';
    });
    if (step >= 1 && step <= 3 && steps[step - 1]) {
      steps[step - 1].style.display = 'block';
      console.log(`Etapa ${step} mostrada com sucesso`);
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
    if (maintenanceId && data) {
      isEditMode = true;
      editingMaintenanceId = maintenanceId;
    } else {
      isEditMode = false;
      editingMaintenanceId = null;
      resetForm();
    }
    if (isEditMode && data) {
      populateFormForEdit(data);
    }
    const modal = document.getElementById('maintenance-form-overlay');
    if (modal) {
      modal.style.display = 'flex';
      console.log("Modal de manutenção aberto com sucesso");
    } else {
      console.error("Modal #maintenance-form-overlay não encontrado!");
    }
    showStep(1);
  }

  function populateFormForEdit(data) {
    console.log("Populando formulário para edição:", data);
    setSelectValue('equipment-type', data.tipoEquipamento);
    setTimeout(() => {
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
      setSelectValue('maintenance-type-select', data.tipoManutencao);
      setCheckboxValue('is-critical', data.eCritico);
      const formTitle = document.querySelector('.form-title');
      if (formTitle) formTitle.textContent = 'Editar Manutenção';
    }, 100);
  }

  function setSelectValue(id, value) {
    const element = document.getElementById(id);
    if (element && value) {
      for (let i = 0; i < element.options.length; i++) {
        if (element.options[i].value === value) {
          element.selectedIndex = i;
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
    const form = document.getElementById('maintenance-form');
    if (form) {
      form.reset();
      console.log("Formulário resetado");
    }
    isEditMode = false;
    editingMaintenanceId = null;
    formData = {};
    const otherEquipmentField = document.getElementById('other-equipment-field');
    if (otherEquipmentField) otherEquipmentField.style.display = 'none';
    const otherCategoryField = document.getElementById('other-category-field');
    if (otherCategoryField) otherCategoryField.style.display = 'none';
    const equipmentIdSelect = document.getElementById('equipment-id');
    if (equipmentIdSelect) equipmentIdSelect.disabled = true;
    setCurrentDate();
    showStep(1);
    const formTitle = document.querySelector('.form-title');
    if (formTitle) formTitle.textContent = 'Registrar Nova Manutenção';
  }

  // --- Validação e Coleta de Dados ---
  function validateStep1() {
    console.log("Validando etapa 1...");
    const requiredFields = [{ id: 'equipment-type', name: 'Tipo de Equipamento' }];
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
    requiredFields.push(
      { id: 'technician-name', name: 'Responsável pelo Relatório' },
      { id: 'maintenance-date', name: 'Data da Manutenção' },
      { id: 'area', name: 'Área' },
      { id: 'office', name: 'Local/Oficina' },
      { id: 'maintenance-type-select', name: 'Tipo de Manutenção' }
    );
    return validateFields(requiredFields);
  }

  function validateStep2() {
    console.log("Validando etapa 2...");
    const requiredFields = [
      { id: 'problem-category-select', name: 'Categoria do Problema' },
      { id: 'problem-description', name: 'Detalhes do Problema' }
    ];
    const problemCategoryValue = document.getElementById('problem-category-select').value;
    if (problemCategoryValue === 'Outros') {
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
        return;
      }
      let fieldValue = element.value.trim();
      let fieldValid = fieldValue !== '';
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
    if (firstInvalidField) {
      firstInvalidField.focus();
    }
    return isValid;
  }

  function markFieldAsInvalid(element, message) {
    element.classList.add('is-invalid');
    const formGroup = element.closest('.form-group, .form-col');
    if (formGroup) {
      formGroup.classList.add('has-error');
      let errorElement = formGroup.querySelector('.error-message');
      if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        element.parentNode.insertBefore(errorElement, element.nextSibling);
      }
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  function clearFieldValidation(element) {
    element.classList.remove('is-invalid');
    const formGroup = element.closest('.form-group, .form-col');
    if (formGroup) {
      formGroup.classList.remove('has-error');
      const errorElement = formGroup.querySelector('.error-message');
      if (errorElement) {
        errorElement.remove();
      }
    }
  }

  function saveStep1Data() {
    console.log("Salvando dados da etapa 1...");
    const equipType = document.getElementById('equipment-type').value;
    formData.tipoEquipamento = equipType;
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
    formData.tipoManutencao = document.getElementById('maintenance-type-select').value;
    formData.eCritico = document.getElementById('is-critical').checked;
    console.log("Dados da etapa 1 salvos:", formData);
  }

  function saveStep2Data() {
    console.log("Salvando dados da etapa 2...");
    const problemCategoryValue = document.getElementById('problem-category-select').value;
    formData.categoriaProblema = problemCategoryValue;
    if (problemCategoryValue === 'Outros') {
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
    const summaryElements = {
      'summary-equipment': formData.tipoEquipamento === 'Outro' ?
                           formData.equipamentoOutro :
                           `${formData.tipoEquipamento} (${formData.placaOuId})`,
      'summary-technician': formData.responsavel,
      'summary-date': formatDate(formData.dataRegistro),
      'summary-location': `${formData.area} - ${formData.localOficina}`,
      'summary-type': formData.tipoManutencao,
      'summary-critical': formData.eCritico ? 'Sim' : 'Não',
      'summary-category': formData.categoriaProblema === 'Outros' ?
                          formData.categoriaProblemaOutro :
                          formData.categoriaProblema,
      'summary-problem': formData.detalhesproblema,
      'summary-notes': formData.observacoes || 'Não informado'
    };
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
    showLoading(true, `${isEditMode ? 'Atualizando' : 'Registrando'} manutenção...`);
    const dataToSend = {
      ...formData,
      equipmentId: formData.placaOuId,
      date: formData.dataRegistro,
      equipmentType: formData.tipoEquipamento,
      technician: formData.responsavel,
      location: formData.localOficina,
      maintenanceType: formData.tipoManutencao,
      isCritical: formData.eCritico,
      problemCategory: formData.categoriaProblema === 'Outros' ? formData.categoriaProblemaOutro : formData.categoriaProblema,
      problemDescription: formData.detalhesproblema,
      additionalNotes: formData.observacoes
    };
    if (isEditMode && editingMaintenanceId) {
      dataToSend.id = editingMaintenanceId;
    } else if (isEditMode && !editingMaintenanceId) {
      console.error("Tentando editar sem um ID de manutenção!");
      showNotification("Erro: ID da manutenção não encontrado para edição.", "error");
      showLoading(false);
      return;
    }
    const apiCall = isEditMode ?
      API.updateMaintenance(editingMaintenanceId, dataToSend) :
      API.createMaintenance(dataToSend);
    apiCall
      .then(response => {
        if (response && response.success) {
          console.log("Manutenção salva com sucesso:", response);
          const message = isEditMode ?
            "Manutenção atualizada com sucesso!" :
            "Nova manutenção registrada com sucesso!";
          showNotification(message, "success");
          closeForm();
          loadMaintenanceList();
        } else {
          console.error("Erro ao salvar manutenção:", response);
          showNotification(`Erro ao ${isEditMode ? 'atualizar' : 'registrar'} manutenção: ${response?.message || 'Erro desconhecido'}`, "error");
        }
      })
      .catch(error => {
        console.error("Falha ao salvar manutenção:", error);
        showNotification(`Falha ao salvar dados: ${error.message || 'Erro desconhecido'}`, "error");
      })
      .finally(() => {
        showLoading(false);
      });
  }

  // --- Funções de Dados ---
  function loadMaintenanceList() {
    console.log("Carregando lista de manutenções...");
    showLoading(true, "Carregando manutenções...");
    const tableBody = document.getElementById('maintenance-tbody');
    if (tableBody) {
      tableBody.innerHTML = '<tr><td colspan="10" class="text-center">Carregando...</td></tr>';
    }
    if (window.API && typeof API.getMaintenanceList === 'function') {
      API.getMaintenanceList()
        .then(response => {
          if (response && response.success && Array.isArray(response.maintenances)) {
            fullMaintenanceList = response.maintenances;
            console.log("Lista de manutenções recebida:", fullMaintenanceList);
            applyFilters();
          } else {
            console.error("Erro ao carregar manutenções:", response);
            if (tableBody) {
              tableBody.innerHTML = '<tr><td colspan="10" class="text-center error-message">Erro ao carregar dados.</td></tr>';
            }
            fullMaintenanceList = [];
            applyFilters();
          }
        })
        .catch(error => {
          console.error("Falha ao buscar manutenções:", error);
          if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="10" class="text-center error-message">Falha ao buscar dados.</td></tr>';
          }
          fullMaintenanceList = [];
          applyFilters();
        })
        .finally(() => {
          showLoading(false);
        });
    } else {
      console.error("API.getMaintenanceList não disponível");
      if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="10" class="text-center error-message">API não disponível.</td></tr>';
      }
      showLoading(false);
      fullMaintenanceList = [];
      applyFilters();
    }
  }

  function renderMaintenanceTable(maintenances) {
    console.log(`Renderizando tabela com ${maintenances?.length || 0} manutenções`);
    const tableBody = document.getElementById('maintenance-tbody');
    if (!tableBody) {
      console.error("Elemento #maintenance-tbody não encontrado!");
      return;
    }
    tableBody.innerHTML = '';
    if (!maintenances || maintenances.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="10" class="text-center">Nenhuma manutenção encontrada.</td></tr>';
      return;
    }
    maintenances.forEach(item => {
      const row = document.createElement('tr');
      row.dataset.id = item.id;
      const status = item.status || 'Pendente';
      const statusClass = getStatusClass(status);
      const statusLower = status.toLowerCase();
      const showVerify = ['pendente', 'aguardando verificação', 'aguardando verificacao'].includes(statusLower);
      const showEdit = ['pendente', 'aguardando verificação', 'aguardando verificacao', 'ajustes'].includes(statusLower);
      const tipoManutencao = item.tipoManutencao || item.tipoManutenO || '-';
      const responsavel = item.responsavel || item.responsVel || '-';
      const area = item.area || item.reaInternaExterna || '-';
      const eCritico = item.eCritico || item.crTico || false;
      const problemCategoryText = item.categoriaProblema === 'Outros'
        ? (item.categoriaProblemaOutro || 'Outro (não especificado)')
        : (item.categoriaProblema || '-');
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
    setupTableActionListeners();
  }

  function setupTableActionListeners() {
    const tableBody = document.getElementById('maintenance-tbody');
    if (!tableBody) return;
    tableBody.addEventListener('click', function(event) {
      const button = event.target.closest('.btn-icon');
      if (!button) return;
      const maintenanceId = button.getAttribute('data-id');
      if (!maintenanceId) return;
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
    const maintenanceData = findMaintenanceById(id);
    if (!maintenanceData) {
      showNotification("Erro: Dados da manutenção não encontrados.", "error");
      return;
    }
    if (typeof Utilities !== 'undefined' && Utilities.viewMaintenanceDetails) {
      Utilities.viewMaintenanceDetails(id, maintenanceData, () => verifyMaintenance(id));
    } else {
      console.warn("Módulo Utilities ou Utilities.viewMaintenanceDetails não encontrado. Usando fallback.");
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
          { label: 'Categoria', value: maintenanceData.categoriaProblema === 'Outros' ? maintenanceData.categoriaProblemaOutro : maintenanceData.categoriaProblema },
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
        if (radioContainer) clearFieldValidation(radioContainer);
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
            if (radioGroup) markFieldAsInvalid(radioGroup, 'Selecione um resultado.');
            isVerificationValid = false;
          } else {
            const radioGroup = document.querySelector('input[name="verification-result"]').closest('.form-group');
            if (radioGroup) clearFieldValidation(radioGroup);
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
    } catch (e) {
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

  // --- Sistema de Filtros ---
  let filters = {
    search: '',
    equipmentType: '',
    status: '',
    maintenanceType: '',
    problemCategory: ''
  };
  
  // Correção da função setupFilterToggle no arquivo maintenance.js (VERSÃO ATUALIZADA)
  function setupFilterToggle() {
    // Capturar o botão de filtro com seletor mais flexível (também pelo seletor de classe)
    const filterToggleBtn = document.querySelector('#toggle-filters-btn, .filter-toggle');
    const expandedFilters = document.getElementById('expanded-filters');
    
    console.log("Setup Filter Toggle: ", filterToggleBtn, expandedFilters); // Log para debug
    
    if (filterToggleBtn && expandedFilters) {
      // Função de toggle para melhor gerenciamento
      // Definir a função `toggleFilters` antes de usá-la no removeEventListener
      const toggleFiltersHandler = function() { // Renomeado para evitar conflito com a variável global se existisse
        console.log("Toggle filter clicked"); // Log para debug
        expandedFilters.classList.toggle('show');
        filterToggleBtn.classList.toggle('active');
        
        // Atualizar texto do botão
        if (filterToggleBtn.classList.contains('active')) {
          filterToggleBtn.innerHTML = '<i class="fas fa-times"></i> Fechar Filtros';
        } else {
          filterToggleBtn.innerHTML = '<i class="fas fa-filter"></i> Filtros';
        }
      };

      // Remover listener existente para evitar duplicação
      // Para remover, a função handler precisa ser a mesma referência.
      // Isso pode ser complexo se a função é anônima ou redefinida a cada chamada.
      // Uma abordagem é guardar a referência do handler ou usar uma propriedade no elemento.
      // Por simplicidade aqui, se a função é sempre a mesma, basta chamá-la.
      // Se `addSafeListener` já lida com isso, a remoção explícita aqui pode não ser necessária
      // ou pode ser feita de forma mais robusta.
      // A abordagem de clonar o nó em `addSafeListener` já remove todos os listeners antigos.
      // No entanto, `filterToggleBtn` não está usando `addSafeListener`.
      // Vamos assumir que podemos remover e adicionar diretamente aqui.
      // Para que removeEventListener funcione corretamente, a função precisa ser nomeada e a mesma referência.
      
      // Tentativa de remover um handler anterior, se existir e tiver sido adicionado com este nome.
      // Isso é um pouco problemático se o handler exato não for conhecido.
      // A melhor abordagem seria usar o addSafeListener, mas seguindo a instrução:
      if (filterToggleBtn._toggleFiltersHandler) { // Se já tivermos um handler anexado
          filterToggleBtn.removeEventListener('click', filterToggleBtn._toggleFiltersHandler);
      }
      
      // Adicionar novo listener
      filterToggleBtn.addEventListener('click', toggleFiltersHandler);
      filterToggleBtn._toggleFiltersHandler = toggleFiltersHandler; // Guardar referência para remoção futura
      
    } else {
      console.warn("Elementos de filtro não encontrados:", {
        botão: filterToggleBtn,
        container: expandedFilters
      });
    }
  }

  function setupFilterListeners() {
    // Campo de busca
    const searchInput = document.getElementById('maintenance-search');
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        filters.search = this.value.toLowerCase().trim();
        applyFilters();
      });
    }
    
    // Filtros de dropdown
    const equipmentTypeFilter = document.getElementById('equipment-type-filter');
    const statusFilter = document.getElementById('status-filter');
    const maintenanceTypeFilter = document.getElementById('maintenance-type-filter');
    const problemCategoryFilter = document.getElementById('problem-category-filter');
    
    if (equipmentTypeFilter) {
      equipmentTypeFilter.addEventListener('change', function() {
        filters.equipmentType = this.value;
        applyFilters();
      });
    }
    
    if (statusFilter) {
      statusFilter.addEventListener('change', function() {
        filters.status = this.value;
        applyFilters();
      });
    }
    
    if (maintenanceTypeFilter) {
      maintenanceTypeFilter.addEventListener('change', function() {
        filters.maintenanceType = this.value;
        applyFilters();
      });
    }
    
    if (problemCategoryFilter) {
      problemCategoryFilter.addEventListener('change', function() {
        filters.problemCategory = this.value;
        applyFilters();
      });
    }
    
    // Botão para limpar filtros
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', function() {
        resetFilters();
      });
    }
    
    // Preencher categorias de problema dinamicamente
    populateProblemCategoryFilter();
    // A chamada para setupFilterToggle foi removida daqui, conforme instrução.
  }

  function resetFilters() {
    filters = {
      search: '',
      equipmentType: '',
      status: '',
      maintenanceType: '',
      problemCategory: ''
    };
    
    const elements = [
      'maintenance-search',
      'equipment-type-filter',
      'status-filter',
      'maintenance-type-filter',
      'problem-category-filter'
    ];
    
    elements.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        if (element.tagName === 'INPUT') {
          element.value = '';
        } else if (element.tagName === 'SELECT') {
          element.selectedIndex = 0;
        }
      }
    });
    
    const expandedFilters = document.getElementById('expanded-filters');
    const filterToggleBtn = document.querySelector('#toggle-filters-btn, .filter-toggle'); // Usando seletor flexível
    
    if (expandedFilters && expandedFilters.classList.contains('show')) {
      expandedFilters.classList.remove('show');
      if (filterToggleBtn) {
        filterToggleBtn.classList.remove('active');
        filterToggleBtn.innerHTML = '<i class="fas fa-filter"></i> Filtros';
      }
    }
    applyFilters();
  }

  function populateProblemCategoryFilter() {
    const filterSelect = document.getElementById('problem-category-filter');
    if (!filterSelect) return;
    while (filterSelect.options.length > 1) {
      filterSelect.remove(1);
    }
    DEFAULT_PROBLEM_CATEGORIES.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      filterSelect.appendChild(option);
    });
  }

  function applyFilters() {
    if (!fullMaintenanceList || !Array.isArray(fullMaintenanceList)) {
      console.error("Lista de manutenções não disponível para filtrar");
      renderMaintenanceTable([]);
      updateFilterResultsCount(0, 0);
      return;
    }
    const filteredList = fullMaintenanceList.filter(item => {
      if (filters.search) {
        const searchTerms = [
          item.id,
          item.placaOuId,
          item.responsavel,
          item.tipoEquipamento,
          item.localOficina
        ];
        const matchesSearch = searchTerms.some(term =>
          term && String(term).toLowerCase().includes(filters.search)
        );
        if (!matchesSearch) return false;
      }
      if (filters.equipmentType && item.tipoEquipamento !== filters.equipmentType) {
        return false;
      }
      if (filters.status && item.status !== filters.status) {
        return false;
      }
      if (filters.maintenanceType && item.tipoManutencao !== filters.maintenanceType) {
        return false;
      }
      if (filters.problemCategory) {
        if (filters.problemCategory === 'Outros') {
          if (item.categoriaProblema !== 'Outros') return false;
        } else {
          const problemCategoryText = item.categoriaProblema === 'Outros'
            ? item.categoriaProblemaOutro
            : item.categoriaProblema;
          if (problemCategoryText !== filters.problemCategory) return false;
        }
      }
      return true;
    });
    renderMaintenanceTable(filteredList);
    updateFilterResultsCount(filteredList.length, fullMaintenanceList.length);
  }

  function updateFilterResultsCount(filteredCount, totalCount) {
    const filterCountElement = document.getElementById('filter-results-count');
    if (!filterCountElement) {
      const countDisplay = document.createElement('div');
      countDisplay.id = 'filter-results-count';
      countDisplay.className = 'filter-results-info';
      const filtersContainer = document.querySelector('.filters-container');
      if (filtersContainer) {
        filtersContainer.appendChild(countDisplay);
      } else {
        const toggleBtnContainer = document.querySelector('#toggle-filters-btn, .filter-toggle')?.parentElement;
        if (toggleBtnContainer) {
            toggleBtnContainer.insertAdjacentElement('afterend', countDisplay);
             console.warn("Contêiner de filtros '.filters-container' não encontrado. 'filter-results-count' adicionado após o botão de toggle.");
        } else {
            console.warn("Contêiner de filtros '.filters-container' e botão de toggle não encontrados para adicionar 'filter-results-count'. Adicionando ao body.");
            document.body.appendChild(countDisplay);
        }
      }
    }
    const elementToUpdate = document.getElementById('filter-results-count');
    if (elementToUpdate) {
      if (filteredCount < totalCount && totalCount > 0) {
        elementToUpdate.textContent = `Mostrando ${filteredCount} de ${totalCount} manutenções`;
        elementToUpdate.style.display = 'block';
      } else {
        elementToUpdate.textContent = '';
        elementToUpdate.style.display = 'none';
      }
    }
  }

  // Também podemos adicionar isto na função de troca de abas (se existir) (ADICIONADA)
  function onTabChange(tabId) {
    if (tabId === 'maintenance') {
      setTimeout(setupFilterToggle, 100);
    }
  }

  // API pública do módulo
  return {
    initialize,
    openMaintenanceForm,
    loadMaintenanceList,
    viewMaintenanceDetails,
    fullMaintenanceList,
    onTabChange // Expor se necessário ser chamada de fora do módulo
  };
})();

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM completamente carregado. Inicializando Maintenance...");
  Maintenance.initialize();
});

// Torna os dados de manutenções acessíveis globalmente
window.maintenanceDataShared = {
  getMaintenanceById: function(id) {
    if (Maintenance && Maintenance.fullMaintenanceList) {
      return Maintenance.fullMaintenanceList.find(item => String(item.id) === String(id));
    }
    return null;
  }
};
