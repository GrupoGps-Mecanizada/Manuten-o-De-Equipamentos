// Verificar dependências no início
if (!window.API || !window.Utilities) {
  console.error("Erro CRÍTICO: Dependências API ou Utilities não carregadas antes de maintenance.js");
  // Poderia até lançar um erro para parar a execução se forem essenciais
  // throw new Error("Dependências essenciais ausentes para Maintenance.js");
} else {
  console.log("Maintenance.js - Dependências API e Utilities parecem carregadas.");
}

const Maintenance = (() => {
  // --- Listas de Equipamentos Locais ---
  const EQUIPMENT_IDS = {
    'Alta Pressão': ["PUB-2G02","LUX-3201","FLX7617","EZS-8765","EZS-8764","EVK-0291","EOF-5C06","EOF-5208","EGC-2989","EGC-2985","EGC-2983","EGC-2978","EAM-3262","EAM-3256","EAM-3255","EAM-3253","EAM-3010","DSY-6475","DSY-6474","DSY-6472","CZC-0453"],
    'Auto Vácuo / Hiper Vácuo': ["PUB-2F80","NFF-0235","HJS-1097","FSA-3D71","EGC-2993","EGC-2979","EAM-3257","EAM-3251","DYB-7210","DSY-6577","DSY-6473","CUB-0763","ANF-2676","FTW-4D99","FTD-6368","FMD-2200","FHD-9264","EZS-9753"]
    // Adicionar outras listas se necessário
  };
  // ------------------------------------

  // Estado interno do módulo
  let formData = { /* ... campos ... */ };
  let isEditMode = false;
  let editingMaintenanceId = null;
  let fullMaintenanceList = [];
  let currentFilter = 'all';
  let currentSearchTerm = '';
  let isTableListenerAttached = false; // Flag para controle do listener da tabela

  // --- Inicialização ---
  function initialize() {
      console.log("Maintenance.initialize() chamado.");
      // Carrega dados de dropdowns que vêm da API
      loadDropdownData();
      // Configura listeners estáticos (botões do formulário, etc.)
      setupFormEventListeners();
      // Configura listener para a tabela (será ativado quando a tabela for renderizada)
      setupMaintenanceListListeners(); // Apenas prepara, não adiciona ainda se tbody não existe
  }

  // Carrega dados que dependem da API
  function loadDropdownData() {
    loadEquipmentTypes(); // Carrega lista de NOMES de tipos
    loadProblemCategories(); // Carrega lista de categorias
  }

  // Configura listeners para elementos FIXOS do formulário
  function setupFormEventListeners() {
    console.log("Configurando listeners do formulário...");

    // Usar função auxiliar para adicionar listener de forma segura
    addSafeListener('new-maintenance', 'click', () => openMaintenanceForm());
    addSafeListener('next-to-step-2', 'click', handleNextToStep2);
    addSafeListener('back-to-step-1', 'click', () => showStep(1));
    addSafeListener('next-to-step-3', 'click', handleNextToStep3);
    addSafeListener('back-to-step-2', 'click', () => showStep(2));
    addSafeListener('close-maintenance-form', 'click', closeForm);
    addSafeListener('cancel-maintenance', 'click', closeForm);

    const form = document.getElementById('maintenance-form');
    if (form) {
        form.removeEventListener('submit', handleFormSubmit); // Remove antes de adicionar
        form.addEventListener('submit', handleFormSubmit);
    }

    const problemCategorySelect = document.getElementById('problem-category');
    if (problemCategorySelect) {
        problemCategorySelect.removeEventListener('change', handleProblemCategoryChange);
        problemCategorySelect.addEventListener('change', handleProblemCategoryChange);
    }

    const equipmentTypeSelect = document.getElementById('equipment-type');
    if (equipmentTypeSelect) {
        equipmentTypeSelect.removeEventListener('change', handleEquipmentTypeChange); // Usar função nomeada
        equipmentTypeSelect.addEventListener('change', handleEquipmentTypeChange);
    }

     // Listeners da Lista (filtros e busca) - pertencem mais à interface da lista
     setupListControlsListeners(); // Função separada para clareza
  }

   // Configura listeners para os controles da lista (busca, filtro, refresh)
  function setupListControlsListeners() {
      const refreshListButton = document.getElementById('refresh-maintenance-list');
      if (refreshListButton) {
          addSafeListener('refresh-maintenance-list', 'click', loadMaintenanceList);
      }
      const searchInput = document.getElementById('maintenance-search');
      if (searchInput) {
          const debouncedHandler = typeof Utilities !== 'undefined' ? Utilities.debounce(handleSearchInput, 300) : debounce(handleSearchInput, 300);
          searchInput.removeEventListener('input', debouncedHandler); // Prevenir duplicação no input
          searchInput.addEventListener('input', debouncedHandler);
      }
      const filterItems = document.querySelectorAll('#tab-maintenance .filter-container .filter-item');
      filterItems.forEach(item => {
          // Não precisa remover/adicionar para múltiplos itens assim, apenas garantir que handleFilterClick funcione
           item.removeEventListener('click', handleFilterClick); // Garante limpeza
           item.addEventListener('click', handleFilterClick);
      });
  }

  // Função auxiliar para adicionar listeners de forma segura (evita duplicados)
  function addSafeListener(elementId, eventType, handler) {
      const element = document.getElementById(elementId);
      if (element) {
          // Técnica de clonagem para remover listeners antigos
          const newElement = element.cloneNode(true);
          element.parentNode.replaceChild(newElement, element);
          newElement.addEventListener(eventType, handler);
          // console.log(`Listener '${eventType}' adicionado com segurança para #${elementId}`);
      } else {
          console.warn(`Elemento #${elementId} não encontrado para adicionar listener.`);
      }
  }

  // Configura a delegação de eventos na tabela (chamado por initialize e renderMaintenanceTable)
  function setupMaintenanceListListeners() {
      const tableBody = document.getElementById('maintenance-tbody');
      if (tableBody && !isTableListenerAttached) { // Adiciona só uma vez
          console.log("Adicionando listener de clique delegado ao #maintenance-tbody");
          tableBody.addEventListener('click', handleTableActionClick);
          isTableListenerAttached = true; // Marca como adicionado
          // tableBody.dataset.listenerAttached = 'true'; // Alternativa usando dataset
      } else if (tableBody && isTableListenerAttached) {
          // console.log("Listener delegado para #maintenance-tbody já está anexado.");
      } else if (!tableBody) {
           console.warn("#maintenance-tbody não encontrado para anexar listener delegado.");
           isTableListenerAttached = false; // Reseta flag se tbody sumir
      }
  }

  // --- Handlers de Eventos ---
   function handleEquipmentTypeChange(event) {
        const selectedType = event.target.value;
        populateEquipmentIds(selectedType); // Popula dropdown de IDs (local)
        setupEquipmentTypeVisuals(selectedType); // Ajusta visibilidade dos campos
   }

  // --- Funções de Abertura/Fechamento/Reset (sem alterações significativas) ---
  function openMaintenanceForm(maintenanceId = null, dataToEdit = null) { /* ...código inalterado... */ }
  function populateFormForEdit(data) { /* ...código inalterado... */ }
  function setSelectValue(selectId, value) { /* ...código inalterado... */ }
  function closeForm() { /* ...código inalterado... */ }
  function resetForm() { /* ...código inalterado... */ }

  // --- Funções de Carregamento de Dados ---
  function loadEquipmentTypes() { /* ...código inalterado (carrega nomes dos tipos via API)... */ }
  function loadDefaultEquipmentTypes() { /* ...código inalterado (fallback)... */ }
  function setupEquipmentTypeVisuals(selectedType) { /* ...código inalterado (mostra/esconde campos)... */ }
  function populateEquipmentIds(selectedType) { /* ...código inalterado (usa listas locais)... */ }
  function loadProblemCategories() { /* ...código inalterado (carrega categorias via API)... */ }
  loadProblemCategories.loaded = false;

  // --- Funções da Lista de Manutenção ---
  function loadMaintenanceList() {
       // Chamar Utilities.showLoading se disponível
       if(typeof Utilities !== 'undefined' && Utilities.showLoading) Utilities.showLoading(true, 'Carregando manutenções...');
       else console.log("Carregando manutenções...");

       const tableBody = document.getElementById('maintenance-tbody');
       if (tableBody) tableBody.innerHTML = '<tr><td colspan="10" class="text-center loading-message">Carregando...</td></tr>'; // Colspan 10

       API.getMaintenanceList()
           .then(response => {
               if (response && response.success && Array.isArray(response.maintenances)) {
                   fullMaintenanceList = response.maintenances;
                   filterAndRenderList(); // Chama renderização
               } else {
                   console.error("Erro ao carregar lista:", response);
                   if(typeof Utilities !== 'undefined') Utilities.showNotification("Erro ao carregar lista.", "error");
                   fullMaintenanceList = [];
                   filterAndRenderList(); // Renderiza tabela vazia/com erro
               }
           })
           .catch(error => {
               console.error("Falha ao buscar lista:", error);
               if(typeof Utilities !== 'undefined') Utilities.showNotification("Falha ao buscar dados: " + error.message, "error");
               fullMaintenanceList = [];
               filterAndRenderList(); // Renderiza tabela vazia/com erro
           })
           .finally(() => {
               if(typeof Utilities !== 'undefined' && Utilities.showLoading) Utilities.showLoading(false);
           });
   }

   function filterAndRenderList() {
       // Filtra a lista local (fullMaintenanceList) baseado em currentFilter e currentSearchTerm
       let filteredList = [...fullMaintenanceList];
       if (currentFilter !== 'all') { /* ... lógica de filtro status ... */ }
       if (currentSearchTerm) { /* ... lógica de busca ... */ }
       renderMaintenanceTable(filteredList); // Renderiza o resultado
   }

   function renderMaintenanceTable(maintenanceListToRender) {
       const tableBody = document.getElementById('maintenance-tbody');
       if (!tableBody) {
           console.error("Elemento #maintenance-tbody não encontrado para renderizar tabela.");
           return;
       }
       tableBody.innerHTML = ''; // Limpa conteúdo anterior

       if (maintenanceListToRender.length === 0) {
           const message = currentSearchTerm || currentFilter !== 'all' ? 'Nenhuma manutenção encontrada com os filtros.' : 'Nenhuma manutenção registrada.';
           tableBody.innerHTML = `<tr><td colspan="10" class="text-center no-data-message">${message}</td></tr>`;
       } else {
           // Usar Utilities para formatação
           const safeFormatDate = (d, t) => (typeof Utilities !== 'undefined' && Utilities.formatDate) ? Utilities.formatDate(d, t) : String(d || '-');
           const safeGetStatusClass = (s) => (typeof Utilities !== 'undefined' && Utilities.getStatusClass) ? Utilities.getStatusClass(s) : String(s || 'default').toLowerCase();

           maintenanceListToRender.forEach(item => {
               const row = document.createElement('tr');
               row.setAttribute('data-maintenance-id', item.id);
               const isCritical = item.eCritico || item.isCritical || false;
               const status = item.status || 'Pendente';
               const statusClass = safeGetStatusClass(status);
               const lowerStatus = status.toLowerCase().trim();
               const allowVerification = ['pendente', 'aguardando verificacao', 'aguardando verificação'].includes(lowerStatus);
               const allowEdit = ['pendente', 'aguardando verificacao', 'aguardando verificação', 'ajustes'].includes(lowerStatus);

               row.innerHTML = `
                   <td>${item.id || 'N/A'}</td>
                   <td>${item.tipoEquipamento || 'N/A'} (${item.placaOuId || '-'})</td>
                   <td>${item.tipoManutencao || '-'} ${isCritical ? '<span class="critical-indicator" title="Crítica">❗️</span>' : ''}</td>
                   <td>${safeFormatDate(item.dataRegistro || item.registrationDate, false)}</td>
                   <td>${item.responsavel || '-'}</td>
                   <td>${item.area || '-'}</td>
                   <td>${item.localOficina || '-'}</td>
                   <td><span title="${item.detalhesproblema || ''}">${item.categoriaProblema === 'Outro' ? (item.categoriaProblemaOutro || 'Outro') : (item.categoriaProblema || '-')}</span></td>
                   <td><span class="status-badge status-${statusClass}">${status}</span></td>
                   <td class="action-buttons">
                       <button class="btn-icon view-maintenance" data-id="${item.id}" title="Ver Detalhes">👁️</button>
                       ${allowVerification ? `<button class="btn-icon verify-maintenance" data-id="${item.id}" title="Verificar">✔️</button>` : ''}
                       ${allowEdit ? `<button class="btn-icon edit-maintenance" data-id="${item.id}" title="Editar">✏️</button>` : ''}
                   </td>
               `;
               tableBody.appendChild(row);
           });
       }
        // Garante que o listener delegado esteja ativo após renderizar
        setupMaintenanceListListeners();
        // Aplica tooltips se a biblioteca estiver carregada
        if (typeof tippy === 'function') {
             tippy('#maintenance-tbody .btn-icon[title]');
             tippy('#maintenance-tbody .critical-indicator[title]');
             tippy('#maintenance-tbody td:nth-child(8) span[title]'); // Tooltip do problema
         }
   }

   // --- Funções de Manipulação de Eventos ---
   function handleNextToStep2() {
        console.log("Botão Próximo (Step 1) clicado. Validando Etapa 1..."); // Log
        if (validateStep1()) {
          console.log("Validação Etapa 1: OK");
          saveStep1Data();
          showStep(2);
          document.getElementById('problem-category')?.focus();
        } else {
           console.log("Validação Etapa 1: FALHOU"); // Log se falhar
        }
   }

   function handleNextToStep3() {
       console.log("Botão Próximo (Step 2) clicado. Validando Etapa 2..."); // Log
        if (validateStep2()) {
            console.log("Validação Etapa 2: OK");
            saveStep2Data();
            updateSummary();
            showStep(3);
            document.getElementById('submit-maintenance')?.focus();
        } else {
            console.log("Validação Etapa 2: FALHOU");
        }
   }

   function handleFormSubmit(event) { /* ...código inalterado... */ }
   function handleProblemCategoryChange(event) { /* ...código inalterado... */ }
   function handleSearchInput(event) { /* ...código inalterado... */ }
   function handleFilterClick(event) { /* ...código inalterado... */ }

   // Handler DELEGADO para cliques na tabela
   function handleTableActionClick(event) {
       console.log("Clique detectado na tabela de manutenção."); // Log
       const button = event.target.closest('.btn-icon');
       if (!button) { console.log("Clique não foi em um botão de ação."); return; }

       const maintenanceId = button.getAttribute('data-id');
       if (!maintenanceId) { console.warn("Botão sem data-id."); return; }

       console.log(`Botão '${button.className}' clicado para ID: ${maintenanceId}`); // Log da ação

       const maintenanceData = findMaintenanceByIdInList(maintenanceId);
       // Não buscar da API aqui, usar dados locais se disponíveis ou deixar as funções de destino buscarem se precisarem de mais

       if (button.classList.contains('view-maintenance')) {
           if (typeof Utilities !== 'undefined' && Utilities.viewMaintenanceDetails) { Utilities.viewMaintenanceDetails(maintenanceId); }
           else { console.error("Função Utilities.viewMaintenanceDetails não encontrada."); alert(`Visualizar ID: ${maintenanceId}`); }
       } else if (button.classList.contains('verify-maintenance')) {
           if (typeof Verification !== 'undefined' && Verification.openVerificationForm) { Verification.openVerificationForm(maintenanceId, maintenanceData); } // Passa dados locais
           else { console.error("Módulo Verification não encontrado."); alert(`Verificar ID: ${maintenanceId}`); }
       } else if (button.classList.contains('edit-maintenance')) {
           if (maintenanceData) { openMaintenanceForm(maintenanceId, maintenanceData); } // Abre form deste módulo
           else { if(typeof Utilities !== 'undefined') Utilities.showNotification("Erro: Dados para edição não encontrados localmente.", "error"); }
       } else if (button.classList.contains('delete-maintenance')) {
            if (maintenanceData) { handleDeleteMaintenance(maintenanceId, maintenanceData); }
            else { if(typeof Utilities !== 'undefined') Utilities.showNotification("Erro: Dados para exclusão não encontrados.", "error"); }
       }
   }

   function findMaintenanceByIdInList(id) { /* ...código inalterado... */ }
   function handleDeleteMaintenance(id, maintenanceData) { /* ...código inalterado... */ }

   // --- Funções de Navegação, Validação e Persistência ---
   function showStep(step) { /* ...código inalterado... */ }

   function validateStep1() {
        console.log("Executando validateStep1..."); // Log
        let isValid = true;
        let firstInvalid = null;
        clearValidationErrors(1);
        const requiredFields = [ /* ... */ ];
        const equipType = document.getElementById('equipment-type')?.value;
        // ... (lógica para adicionar campos dinâmicos a requiredFields) ...
        if (equipType === 'Outro') { requiredFields.push({ id: 'other-equipment', name: 'Especificar Equipamento' }); }
        else if (equipType === 'Aspirador' || equipType === 'Poliguindaste') { requiredFields.push({ id: 'custom-equipment-id', name: `Identificação ${equipType}` }); }
        else if (equipType) { requiredFields.push({ id: 'equipment-id', name: 'Placa ou ID' }); }

        console.log("Campos a validar (Etapa 1):", requiredFields.map(f=>f.id));

        requiredFields.forEach(field => {
            const element = document.getElementById(field.id);
            let isFieldValid = false;
            let elementValue = '';
            if (element) {
                elementValue = element.value;
                if (element.value && element.value.trim() !== '') { isFieldValid = true; }
                // Ignora validação se select de ID está desabilitado
                if (element.tagName === 'SELECT' && element.disabled && element.id === 'equipment-id') { isFieldValid = true; }
            }

            console.log(`Validando campo ${field.id}: Existe=${!!element}, Valor='${elementValue}', Válido=${isFieldValid}`); // Log detalhado

            if (!isFieldValid) {
                isValid = false;
                if (element) { markFieldError(element, `${field.name} é obrigatório.`); if (!firstInvalid) firstInvalid = element; }
                else { console.error(`Elemento obrigatório #${field.id} não encontrado no DOM!`); }
            }
        });

        if (!isValid) {
            console.error("Falha na validação da Etapa 1.");
            if(typeof Utilities !== 'undefined') Utilities.showNotification("Preencha os campos obrigatórios da Etapa 1.", "warning");
            if (firstInvalid) { try { firstInvalid.focus({ preventScroll: true }); firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch(e){} }
        }
        return isValid;
   }

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
    loadMaintenanceList // Necessário para ser chamado por main.js
  };
})();
