// Verificar dependências
if (!window.API || !window.Utilities) {
  console.error("Erro CRÍTICO: Dependências API ou Utilities não carregadas antes de maintenance.js");
} else {
  console.log("Maintenance.js - Dependências parecem carregadas.");
}

const Maintenance = (() => {
  // --- Listas de Equipamentos (Definidas no Frontend) ---
  const EQUIPMENT_IDS = {
    'Alta Pressão': ["PUB-2G02","LUX-3201","FLX7617","EZS-8765","EZS-8764","EVK-0291","EOF-5C06","EOF-5208","EGC-2989","EGC-2985","EGC-2983","EGC-2978","EAM-3262","EAM-3256","EAM-3255","EAM-3253","EAM-3010","DSY-6475","DSY-6474","DSY-6472","CZC-0453"],
    'Auto Vácuo / Hiper Vácuo': ["PUB-2F80","NFF-0235","HJS-1097","FSA-3D71","EGC-2993","EGC-2979","EAM-3257","EAM-3251","DYB-7210","DSY-6577","DSY-6473","CUB-0763","ANF-2676","FTW-4D99","FTD-6368","FMD-2200","FHD-9264","EZS-9753"]
    // Adicionar listas para 'Aspirador', 'Poliguindaste' aqui se tiver IDs pré-definidos
    // 'Aspirador': ['ASP-001', 'ASP-002'],
    // 'Poliguindaste': ['POLI-A', 'POLI-B'],
  };
  // -------------------------------------------------------

  // Estado do formulário
  let formData = {
    equipmentType: '', equipmentId: '', otherEquipment: '', customEquipmentId: '',
    technician: '', date: '', area: '', office: '', maintenanceType: '', isCritical: false,
    problemCategory: '', otherCategory: '', problemDescription: '', additionalNotes: ''
  };
  let isEditMode = false;
  let editingMaintenanceId = null;
  let fullMaintenanceList = [];
  let currentFilter = 'all';
  let currentSearchTerm = '';

  function initialize() {
      console.log("Maintenance.initialize() chamado.");
      setupEventListeners();
      loadDropdownData(); // Carrega Tipos de Equipamento e Categorias de Problema da API
      setupMaintenanceListListeners();
  }

  function loadDropdownData() {
    loadEquipmentTypes();
    loadProblemCategories();
  }

  function setupEventListeners() {
    // Botão nova manutenção
    const newMaintenanceButton = document.getElementById('new-maintenance');
    if (newMaintenanceButton) {
        const newBtn = newMaintenanceButton.cloneNode(true);
        newMaintenanceButton.parentNode.replaceChild(newBtn, newMaintenanceButton);
        newBtn.addEventListener('click', () => openMaintenanceForm());
        console.log("Listener para #new-maintenance configurado.");
    } else {
        console.error("Botão #new-maintenance não encontrado!");
    }

    // Navegação e Ações do Formulário
    document.getElementById('next-to-step-2')?.addEventListener('click', handleNextToStep2);
    document.getElementById('back-to-step-1')?.addEventListener('click', () => showStep(1));
    document.getElementById('next-to-step-3')?.addEventListener('click', handleNextToStep3);
    document.getElementById('back-to-step-2')?.addEventListener('click', () => showStep(2));
    document.getElementById('close-maintenance-form')?.addEventListener('click', closeForm);
    document.getElementById('cancel-maintenance')?.addEventListener('click', closeForm);
    document.getElementById('maintenance-form')?.addEventListener('submit', handleFormSubmit);
    document.getElementById('problem-category')?.addEventListener('change', handleProblemCategoryChange);

    // Listener para Tipo de Equipamento
    document.getElementById('equipment-type')?.addEventListener('change', (event) => {
        const selectedType = event.target.value;
        populateEquipmentIds(selectedType); // Chama a função local
        // Ajusta a visibilidade dos campos de ID (Outro, Customizado, Padrão)
        setupEquipmentTypeVisuals(selectedType);
    });

   // Listeners da Lista
    const refreshListButton = document.getElementById('refresh-maintenance-list');
    if (refreshListButton) {
        refreshListButton.removeEventListener('click', loadMaintenanceList);
        refreshListButton.addEventListener('click', loadMaintenanceList); // Correção: ) faltando
    }
    const searchInput = document.getElementById('maintenance-search');
    if (searchInput) {
        const debouncedHandler = typeof Utilities !== 'undefined' ? Utilities.debounce(handleSearchInput, 300) : debounce(handleSearchInput, 300);
        searchInput.removeEventListener('input', debouncedHandler);
        searchInput.addEventListener('input', debouncedHandler); // Correção: ) faltando
    }
    const filterItems = document.querySelectorAll('#tab-maintenance .filter-container .filter-item');
    filterItems.forEach(item => {
        item.removeEventListener('click', handleFilterClick);
        item.addEventListener('click', handleFilterClick); // Correção: ) faltando
    });
  }

  function setupMaintenanceListListeners() {
      const tableBody = document.getElementById('maintenance-tbody');
      if (tableBody && !tableBody.dataset.listenerAttached) {
          tableBody.addEventListener('click', handleTableActionClick);
          tableBody.dataset.listenerAttached = 'true';
      }
  }

  // --- Funções de Abertura/Fechamento/Reset ---
  function openMaintenanceForm(maintenanceId = null, dataToEdit = null) {
       resetForm();
       if (maintenanceId && dataToEdit) {
           isEditMode = true; editingMaintenanceId = maintenanceId;
           document.querySelector('#maintenance-form-overlay .form-title').textContent = 'Editar Manutenção';
           document.getElementById('submit-maintenance').textContent = 'Salvar Alterações';
           populateFormForEdit(dataToEdit);
       } else {
           isEditMode = false; editingMaintenanceId = null;
           document.querySelector('#maintenance-form-overlay .form-title').textContent = 'Registrar Nova Manutenção';
           document.getElementById('submit-maintenance').textContent = 'Finalizar Registro';
           document.getElementById('equipment-type')?.dispatchEvent(new Event('change'));
       }
       showStep(1);
       const overlay = document.getElementById('maintenance-form-overlay');
       if(overlay) { overlay.style.display = 'block'; console.log("Formulário de manutenção aberto."); }
       else { console.error("Overlay #maintenance-form-overlay não encontrado!"); }
       document.getElementById('equipment-type')?.focus();
  }

   function populateFormForEdit(data) {
       formData = { ...formData, ...data };
       setSelectValue('equipment-type', data.tipoEquipamento);
       // Dispara change para popular IDs E ajustar visual
       document.getElementById('equipment-type')?.dispatchEvent(new Event('change'));
       // Define valor do ID correto APÓS o change ter rodado
       const selectedType = data.tipoEquipamento;
       if (selectedType === 'Outro') { document.getElementById('other-equipment').value = data.placaOuId || ''; }
       else if (selectedType === 'Aspirador' || selectedType === 'Poliguindaste') {
           const customInput = document.getElementById('custom-equipment-id'); // Tenta pegar o campo criado
           if (customInput) customInput.value = data.placaOuId || '';
           else console.warn("Campo #custom-equipment-id não encontrado para popular em edição.");
        }
       else if (selectedType) { setSelectValue('equipment-id', data.placaOuId); }

       // Popula resto
       document.getElementById('technician-name').value = data.responsavel || '';
       document.getElementById('maintenance-date').value = data.dataManutencao ? data.dataManutencao.split('T')[0] : '';
       setSelectValue('area', data.area);
       document.getElementById('office').value = data.localOficina || '';
       setSelectValue('maintenance-type', data.tipoManutencao);
       document.getElementById('is-critical').checked = data.eCritico || data.isCritical || false;
       setSelectValue('problem-category', data.categoriaProblema);
       const categorySelect = document.getElementById('problem-category');
       if(categorySelect) { categorySelect.dispatchEvent(new Event('change')); if (data.categoriaProblema === 'Outro') { document.getElementById('other-category').value = data.categoriaProblemaOutro || data.categoriaProblema || ''; } }
       document.getElementById('problem-description').value = data.detalhesproblema || data.problemDescription || '';
       document.getElementById('additional-notes').value = data.observacoes || data.additionalNotes || '';
   }

   function setSelectValue(selectId, value) { /* ...código inalterado... */ }
   function closeForm() { /* ...código inalterado... */ }
   function resetForm() { /* ...código inalterado... */ }

  // --- Funções de Carregamento de Dados ---

  // Carrega Tipos de Equipamento da API
  function loadEquipmentTypes() {
      try {
         if (typeof Utilities !== 'undefined') Utilities.showLoading(true, 'Carregando tipos...');
         API.getMaintenanceFormData()
         .then(response => {
             if (response.success && response.formData) {
                 const select = document.getElementById('equipment-type'); if (!select) return;
                 select.innerHTML = '<option value="">Selecione o tipo...</option>';
                 let equipmentTypes = [];
                 const apiTypes = response.formData.opcoesTipoEquipe || response.formData.equipmentTypes || ['Alta Pressão', 'Auto Vácuo / Hiper Vácuo', 'Aspirador', 'Poliguindaste', 'Outro']; // Fallback
                 apiTypes.forEach(type => { if (type && !equipmentTypes.includes(type)) { equipmentTypes.push(type); } });
                 if (!equipmentTypes.includes('Outro')) equipmentTypes.push('Outro');
                 equipmentTypes.forEach(type => { const option = document.createElement('option'); option.value = type; option.textContent = type; select.appendChild(option); });
                 const outroOpt = Array.from(select.options).find(opt => opt.value === 'Outro'); if (outroOpt && outroOpt !== select.options[select.options.length - 1]) { select.appendChild(outroOpt); }
                 // Não chama mais setupEquipmentTypeEvents aqui, é chamado no listener 'change'
             } else { throw new Error(response?.message || "Dados inválidos (tipos)"); }
         })
         .catch(error => {
            console.error("Erro ao carregar tipos de equipamento via API:", error);
            if(typeof Utilities !== 'undefined') Utilities.showNotification("Falha ao buscar tipos. Verifique o backend ou use valores padrão.", "warning");
            // Carregar tipos padrão como fallback
            loadDefaultEquipmentTypes();
         })
         .finally(() => { if (typeof Utilities !== 'undefined') Utilities.showLoading(false); });
     } catch (e) {
         console.error("Erro inesperado ao carregar tipos:", e);
         if(typeof Utilities !== 'undefined') Utilities.showNotification("Erro interno tipos. Usando lista padrão.", "error");
         loadDefaultEquipmentTypes(); // Fallback
         if (typeof Utilities !== 'undefined') Utilities.showLoading(false);
     }
  }

  // Fallback para tipos de equipamento se API falhar
  function loadDefaultEquipmentTypes() {
    const select = document.getElementById('equipment-type');
    if (!select) return;
    select.innerHTML = '<option value="">Selecione o tipo...</option>';
    const defaultTypes = ['Alta Pressão', 'Auto Vácuo / Hiper Vácuo', 'Aspirador', 'Poliguindaste', 'Outro'];
    defaultTypes.forEach(type => { const option = document.createElement('option'); option.value = type; option.textContent = type; select.appendChild(option); });
  }

  // Função para AJUSTAR VISUAL dos campos de ID (chamada no 'change' do tipo)
  function setupEquipmentTypeVisuals(selectedType) {
    const equipIdSelectContainer = document.getElementById('equipment-id')?.parentElement;
    const equipIdSelect = document.getElementById('equipment-id');
    const otherEquipField = document.getElementById('other-equipment-field');
    const customEquipFieldId = 'custom-equipment-id-field';
    const customEquipInputId = 'custom-equipment-id';
    let customEquipField = document.getElementById(customEquipFieldId);

    // Esconder todos por padrão, exceto o container do tipo
    if(equipIdSelectContainer) equipIdSelectContainer.style.display = 'none';
    if(otherEquipField) otherEquipField.style.display = 'none';
    if(customEquipField) customEquipField.style.display = 'none';

    // Limpar valores e erros dos campos escondidos
    if(equipIdSelect) { equipIdSelect.value = ''; clearFieldError(equipIdSelect); }
    const otherInput = document.getElementById('other-equipment'); if(otherInput) { otherInput.value = ''; clearFieldError(otherInput); }
    const customInput = document.getElementById(customEquipInputId); if(customInput) { customInput.value = ''; clearFieldError(customInput); }

    // Mostrar o campo apropriado
    if (selectedType === 'Outro') {
      if(otherEquipField) otherEquipField.style.display = 'block';
      if(otherInput) otherInput.required = true;
      if(equipIdSelect) equipIdSelect.required = false;
      if(customInput) customInput.required = false;
    } else if (selectedType === 'Aspirador' || selectedType === 'Poliguindaste') {
      if(equipIdSelect) equipIdSelect.required = false;
      if(otherInput) otherInput.required = false;
      // Cria ou mostra o campo customizado
      if (!customEquipField) {
        customEquipField = document.createElement('div'); customEquipField.id = customEquipFieldId; customEquipField.className = 'form-group';
        customEquipField.innerHTML = `<label for="${customEquipInputId}">Identificação do ${selectedType} <span class="form-required">*</span></label><input type="text" class="form-control" id="${customEquipInputId}" name="${customEquipInputId}" required>`;
        const referenceNode = document.getElementById('other-equipment-field') || document.getElementById('equipment-type')?.parentElement;
        if (referenceNode?.parentElement) { referenceNode.parentElement.insertBefore(customEquipField, referenceNode.nextSibling); }
        else { document.getElementById('step-1-content')?.appendChild(customEquipField); }
      } else {
        const label = customEquipField.querySelector('label'); if (label) label.innerHTML = `Identificação do ${selectedType} <span class="form-required">*</span>`;
        customEquipField.style.display = 'block';
      }
       if(customInput) customInput.required = true;
    } else if (selectedType) { // Tipo padrão selecionado
      if(equipIdSelectContainer) equipIdSelectContainer.style.display = 'block';
      if(equipIdSelect) equipIdSelect.required = true;
      if(otherInput) otherInput.required = false;
      if(customInput) customInput.required = false;
    } else { // Nenhum tipo selecionado
        if(equipIdSelect) equipIdSelect.required = false;
        if(otherInput) otherInput.required = false;
        if(customInput) customInput.required = false;
    }
  }


  // Popula o dropdown de IDs usando as listas locais
  function populateEquipmentIds(selectedType) {
      const idSelect = document.getElementById('equipment-id');
      if (!idSelect) return;

      idSelect.innerHTML = '<option value="">Selecione a placa/ID...</option>';

      if (selectedType && EQUIPMENT_IDS[selectedType]) { // Verifica se tipo existe nas listas locais
          const ids = EQUIPMENT_IDS[selectedType];
          if (ids.length === 0) {
              idSelect.innerHTML = '<option value="">Nenhum ID cadastrado localmente</option>';
              idSelect.disabled = true;
          } else {
              ids.forEach(id => {
                  if (id !== null && id !== undefined) {
                      const option = document.createElement('option');
                      option.value = id; option.textContent = id;
                      idSelect.appendChild(option);
                  }
              });
              idSelect.disabled = false;
          }
      } else {
          // Para tipos sem lista definida (inclui Outro, Aspirador, Poliguindaste se não adicionados em EQUIPMENT_IDS)
          idSelect.innerHTML = `<option value="">${selectedType ? 'Não aplicável ou sem lista local' : 'Selecione o tipo'}</option>`;
          idSelect.disabled = true;
      }
  }

  // Carrega Categorias de Problema da API
  function loadProblemCategories() {
       if (loadProblemCategories.loaded) return Promise.resolve();
       return API.getProblemCategories()
           .then(response => { /* ...código inalterado... */ })
           .catch(error => { /* ...código inalterado... */ });
   }
   loadProblemCategories.loaded = false;

   // --- Funções da Lista de Manutenção ---
   function loadMaintenanceList() { /* ...código inalterado... */ }
   function filterAndRenderList() { /* ...código inalterado... */ }
   function renderMaintenanceTable(list) { /* ...código inalterado... */ }

   // --- Funções de Manipulação de Eventos ---
   function handleNextToStep2() { /* ...código inalterado... */ }
   function handleNextToStep3() { /* ...código inalterado... */ }
   function handleFormSubmit(event) { /* ...código inalterado... */ }
   function handleProblemCategoryChange(event) { /* ...código inalterado... */ }
   function handleSearchInput(event) { /* ...código inalterado... */ }
   function handleFilterClick(event) { /* ...código inalterado... */ }
   function handleTableActionClick(event) { /* ...código inalterado... */ }
   function findMaintenanceByIdInList(id) { /* ...código inalterado... */ }
   function handleDeleteMaintenance(id, maintenanceData) { /* ...código inalterado... */ }

   // --- Funções de Navegação, Validação e Persistência ---
   function showStep(step) { /* ...código inalterado... */ }
   function validateStep1() { /* ...código inalterado... */ }
   function validateStep2() { /* ...código inalterado... */ }
   function markFieldError(element, message) { /* ...código inalterado... */ }
   function clearFieldError(element) { /* ...código inalterado... */ }
   function clearValidationErrors(step) { /* ...código inalterado (usar versão atualizada)... */ }
   function saveStep1Data() { /* ...código inalterado... */ }
   function saveStep2Data() { /* ...código inalterado... */ }
   function updateSummary() { /* ...código inalterado... */ }
   function submitMaintenance() { /* ...código inalterado (ainda usa API)... */ }

   // --- Funções Auxiliares Locais (Usar as de Utilities) ---
   function debounce(func, wait) { /* ... implementação ... */ }
   function formatDate(dateString, includeTime = false) { /* ... implementação ... */ }
   function getStatusClass(status) { /* ... implementação ... */ }

  // API pública do módulo
  return {
    initialize,
    openMaintenanceForm,
    loadMaintenanceList
  };
})();

// A inicialização continua sendo feita pelo main.js
