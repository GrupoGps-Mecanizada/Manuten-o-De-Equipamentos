// Verificar dependências
if (!window.API || !window.Utilities) {
  console.error("Erro CRÍTICO: Dependências API ou Utilities não carregadas antes de maintenance.js");
} else {
  console.log("Maintenance.js - Dependências parecem carregadas.");
}

const Maintenance = (() => {
  // --- Listas de Equipamentos (Definidas no Frontend) ---
  // Copiadas da sua aba 'Configurações'
  const EQUIPMENT_IDS = {
    'Alta Pressão': ["PUB-2G02","LUX-3201","FLX7617","EZS-8765","EZS-8764","EVK-0291","EOF-5C06","EOF-5208","EGC-2989","EGC-2985","EGC-2983","EGC-2978","EAM-3262","EAM-3256","EAM-3255","EAM-3253","EAM-3010","DSY-6475","DSY-6474","DSY-6472","CZC-0453"],
    'Auto Vácuo / Hiper Vácuo': ["PUB-2F80","NFF-0235","HJS-1097","FSA-3D71","EGC-2993","EGC-2979","EAM-3257","EAM-3251","DYB-7210","DSY-6577","DSY-6473","CUB-0763","ANF-2676","FTW-4D99","FTD-6368","FMD-2200","FHD-9264","EZS-9753"]
    // Adicionar listas para 'Aspirador', 'Poliguindaste' se necessário, ou serão tratados como tipos sem lista pré-definida.
  };
  // -------------------------------------------------------

  // Estado do formulário
  let formData = { /* ... campos ... */ };
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

  // Carrega dados que AINDA VÊM da API (Tipos e Categorias)
  function loadDropdownData() {
    loadEquipmentTypes(); // Carrega os tipos de equipamento (ex: Alta Pressão, Outro...) da API
    loadProblemCategories(); // Carrega categorias de problema da API
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

    // Navegação e Ações do Formulário (sem alterações aqui)
    document.getElementById('next-to-step-2')?.addEventListener('click', handleNextToStep2);
    document.getElementById('back-to-step-1')?.addEventListener('click', () => showStep(1));
    document.getElementById('next-to-step-3')?.addEventListener('click', handleNextToStep3);
    document.getElementById('back-to-step-2')?.addEventListener('click', () => showStep(2));
    document.getElementById('close-maintenance-form')?.addEventListener('click', closeForm);
    document.getElementById('cancel-maintenance')?.addEventListener('click', closeForm);
    document.getElementById('maintenance-form')?.addEventListener('submit', handleFormSubmit);
    document.getElementById('problem-category')?.addEventListener('change', handleProblemCategoryChange);

    // *** Listener ATUALIZADO para Tipo de Equipamento ***
    // Agora chama a função local 'populateEquipmentIds' em vez de 'loadEquipmentIds' (que chamava a API)
    document.getElementById('equipment-type')?.addEventListener('change', (event) => {
        const selectedType = event.target.value;
        populateEquipmentIds(selectedType); // <<< MUDANÇA AQUI: Chama a função local
    });

   // Listeners da Lista (sem alterações)
    const refreshListButton = document.getElementById('refresh-maintenance-list');
    if (refreshListButton) { refreshListButton.removeEventListener('click', loadMaintenanceList); refreshListButton.addEventListener('click', loadMaintenanceList; }
    const searchInput = document.getElementById('maintenance-search');
    if (searchInput) { const debouncedHandler = typeof Utilities !== 'undefined' ? Utilities.debounce(handleSearchInput, 300) : debounce(handleSearchInput, 300); searchInput.removeEventListener('input', debouncedHandler); searchInput.addEventListener('input', debouncedHandler; }
    const filterItems = document.querySelectorAll('#tab-maintenance .filter-container .filter-item');
    filterItems.forEach(item => { item.removeEventListener('click', handleFilterClick); item.addEventListener('click', handleFilterClick; });
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
           populateFormForEdit(dataToEdit); // Popula o formulário
       } else {
           isEditMode = false; editingMaintenanceId = null;
           document.querySelector('#maintenance-form-overlay .form-title').textContent = 'Registrar Nova Manutenção';
           document.getElementById('submit-maintenance').textContent = 'Finalizar Registro';
           // Garante estado visual inicial correto disparando o evento change do tipo
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
       // 1. Define o tipo de equipamento
       setSelectValue('equipment-type', data.tipoEquipamento);
       // 2. Dispara o evento change para ajustar a UI (mostrar campos corretos)
       //    e para chamar populateEquipmentIds (que agora é síncrono)
       document.getElementById('equipment-type')?.dispatchEvent(new Event('change'));
       // 3. Define o valor do campo de ID correto (APÓS populate ter rodado)
       const selectedType = data.tipoEquipamento;
       if (selectedType === 'Outro') { document.getElementById('other-equipment').value = data.placaOuId || ''; }
       else if (selectedType === 'Aspirador' || selectedType === 'Poliguindaste') { document.getElementById('custom-equipment-id').value = data.placaOuId || ''; }
       else if (selectedType) { setSelectValue('equipment-id', data.placaOuId); } // O select #equipment-id já foi populado

       // Popula o resto do formulário
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

  // Carrega APENAS os Tipos de Equipamento (ex: Alta Pressão, Outro...) da API
  function loadEquipmentTypes() {
     // Este ainda usa a API para buscar a lista de TIPOS disponíveis
      try {
         if (typeof Utilities !== 'undefined') Utilities.showLoading(true, 'Carregando tipos...');
         API.getMaintenanceFormData() // Continua buscando os TIPOS da API/Config
         .then(response => {
             if (response.success && response.formData) {
                 const select = document.getElementById('equipment-type'); if (!select) return;
                 select.innerHTML = '<option value="">Selecione o tipo...</option>';
                 let equipmentTypes = [];
                 const apiTypes = response.formData.opcoesTipoEquipe || response.formData.equipmentTypes || ['Alta Pressão', 'Auto Vácuo / Hiper Vácuo', 'Aspirador', 'Poliguindaste']; // Adiciona um fallback
                 apiTypes.forEach(type => { if (type && !equipmentTypes.includes(type)) { equipmentTypes.push(type); } });
                 // Garantir 'Outro'
                 if (!equipmentTypes.includes('Outro')) equipmentTypes.push('Outro');
                 // Popular o select
                 equipmentTypes.forEach(type => { const option = document.createElement('option'); option.value = type; option.textContent = type; select.appendChild(option); });
                 // Mover 'Outro' para o final se necessário
                 const outroOpt = Array.from(select.options).find(opt => opt.value === 'Outro'); if (outroOpt && outroOpt !== select.options[select.options.length - 1]) { select.appendChild(outroOpt); }
                 setupEquipmentTypeEvents(); // Configura os eventos visuais
             } else { throw new Error(response?.message || "Dados inválidos (tipos)"); }
         })
         .catch(error => { /* ... tratamento de erro ... */ })
         .finally(() => { if (typeof Utilities !== 'undefined') Utilities.showLoading(false); });
     } catch (e) { /* ... tratamento de erro ... */ }
  }

  // *** NOVA FUNÇÃO: Popula o dropdown de IDs usando as listas locais ***
  function populateEquipmentIds(selectedType) {
      const idSelect = document.getElementById('equipment-id');
      if (!idSelect) return;

      idSelect.innerHTML = '<option value="">Selecione a placa/ID...</option>'; // Limpa opções antigas

      // Verifica se o tipo selecionado tem uma lista pré-definida em EQUIPMENT_IDS
      if (selectedType && EQUIPMENT_IDS[selectedType]) {
          const ids = EQUIPMENT_IDS[selectedType];
          if (ids.length === 0) {
              idSelect.innerHTML = '<option value="">Nenhum ID cadastrado para este tipo</option>';
              idSelect.disabled = true;
          } else {
              ids.forEach(id => {
                  if (id !== null && id !== undefined) {
                      const option = document.createElement('option');
                      option.value = id;
                      option.textContent = id;
                      idSelect.appendChild(option);
                  }
              });
              idSelect.disabled = false; // Habilita
          }
      } else {
          // Se o tipo for 'Outro', 'Aspirador', 'Poliguindaste' ou não tiver lista,
          // mantém o select desabilitado ou com mensagem apropriada.
          // A lógica em setupEquipmentTypeEvents já deve esconder este select nesses casos.
          idSelect.innerHTML = `<option value="">${selectedType ? 'Não aplicável ou sem lista' : 'Selecione o tipo'}</option>`;
          idSelect.disabled = true;
      }
  }

  // *** REMOVIDO: loadEquipmentIds não chama mais a API ***
  /*
  function loadEquipmentIds() {
      // ... código antigo que chamava API.getEquipmentIdsByType ...
  }
  */

  // Carrega Categorias de Problema da API (inalterado)
  function loadProblemCategories() { /* ... código inalterado ... */ }
   loadProblemCategories.loaded = false;

  // --- Funções da Lista de Manutenção ---
  // (loadMaintenanceList, filterAndRenderList, renderMaintenanceTable - sem alterações)
  function loadMaintenanceList() { /* ... código inalterado ... */ }
  function filterAndRenderList() { /* ... código inalterado ... */ }
  function renderMaintenanceTable(list) { /* ... código inalterado ... */ }

  // --- Funções de Manipulação de Eventos ---
  // (handle..., find..., handleDelete... - sem alterações)
  function handleNextToStep2() { /* ... código inalterado ... */ }
  function handleNextToStep3() { /* ... código inalterado ... */ }
  function handleFormSubmit(event) { /* ... código inalterado ... */ }
  function handleProblemCategoryChange(event) { /* ... código inalterado ... */ }
  function handleSearchInput(event) { /* ... código inalterado ... */ }
  function handleFilterClick(event) { /* ... código inalterado ... */ }
  function handleTableActionClick(event) { /* ... código inalterado ... */ }
  function findMaintenanceByIdInList(id) { /* ... código inalterado ... */ }
  function handleDeleteMaintenance(id, maintenanceData) { /* ... código inalterado ... */ }

  // --- Funções de Navegação, Validação e Persistência ---
  // (showStep, validateStep1, validateStep2, markFieldError, clearFieldError, clearValidationErrors - sem alterações)
   function showStep(step) { /* ... código inalterado ... */ }
   function validateStep1() { /* ... código inalterado ... */ }
   function validateStep2() { /* ... código inalterado ... */ }
   function markFieldError(element, message) { /* ... código inalterado ... */ }
   function clearFieldError(element) { /* ... código inalterado ... */ }
   function clearValidationErrors(step) { /* ... código inalterado (usar versão atualizada) ... */
        const stepContent = document.getElementById(`step-${step}-content`); if (!stepContent) return;
        const elementsWithError = stepContent.querySelectorAll('[aria-invalid="true"], .error-message-field');
        elementsWithError.forEach(el => { let inputElement = el; if (el.classList.contains('error-message-field')) { const inputId = el.id.replace('-error', ''); inputElement = document.getElementById(inputId); el.textContent = ''; el.style.display = 'none'; } if (inputElement && inputElement.hasAttribute('aria-invalid')) { if(inputElement.style) inputElement.style.borderColor = ''; inputElement.removeAttribute('aria-invalid'); const errorSpanAssociated = document.getElementById(inputElement.id + '-error'); if (errorSpanAssociated) { errorSpanAssociated.textContent = ''; errorSpanAssociated.style.display = 'none'; } } });
   }

   // (saveStep1Data, saveStep2Data, updateSummary - sem alterações)
   function saveStep1Data() { /* ... código inalterado ... */ }
   function saveStep2Data() { /* ... código inalterado ... */ }
   function updateSummary() { /* ... código inalterado ... */ }

   // (submitMaintenance - sem alterações, ainda usa API para salvar)
   function submitMaintenance() { /* ... código inalterado ... */ }


   // --- Funções Auxiliares Locais (Usar as de Utilities se possível) ---
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

// A inicialização ainda é feita pelo main.js
