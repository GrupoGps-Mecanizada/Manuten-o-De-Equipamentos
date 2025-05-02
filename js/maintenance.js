// Verificar dependências
if (!window.API || !window.Utilities) {
  console.error("Erro CRÍTICO: Dependências API ou Utilities não carregadas antes de maintenance.js");
} else {
  console.log("Maintenance.js - Dependências parecem carregadas.");
}

const Maintenance = (() => {
  // ... (todo o código interno do módulo Maintenance permanece o mesmo) ...
   let formData = { /* ... campos ... */ };
   let isEditMode = false;
   let editingMaintenanceId = null;
   let fullMaintenanceList = [];
   let currentFilter = 'all';
   let currentSearchTerm = '';

   function initialize() {
       console.log("Maintenance.initialize() chamado."); // Log
       setupEventListeners();
       loadDropdownData();
       setupMaintenanceListListeners();
       // Não carregar a lista aqui, loadTabContent fará isso
       // loadMaintenanceList(); // Removido daqui
   }

   function loadDropdownData() { /* ... código inalterado ... */
       loadEquipmentTypes();
       loadProblemCategories();
   }

   function setupEventListeners() { /* ... código inalterado ... */
        // Botão nova manutenção
        const newMaintenanceButton = document.getElementById('new-maintenance');
        if (newMaintenanceButton) {
            // Limpar listeners antigos para garantir
            const newBtn = newMaintenanceButton.cloneNode(true);
            newMaintenanceButton.parentNode.replaceChild(newBtn, newMaintenanceButton);
            newBtn.addEventListener('click', () => openMaintenanceForm());
             console.log("Listener para #new-maintenance configurado.");
        } else {
            console.error("Botão #new-maintenance não encontrado em setupEventListeners!");
        }

        // Botões de navegação do formulário (exemplo)
        document.getElementById('next-to-step-2')?.addEventListener('click', handleNextToStep2);
        document.getElementById('back-to-step-1')?.addEventListener('click', () => showStep(1));
        document.getElementById('next-to-step-3')?.addEventListener('click', handleNextToStep3);
        document.getElementById('back-to-step-2')?.addEventListener('click', () => showStep(2));

        // Fechar/Cancelar formulário (exemplo)
        document.getElementById('close-maintenance-form')?.addEventListener('click', closeForm);
        document.getElementById('cancel-maintenance')?.addEventListener('click', closeForm); // Botão dentro da Etapa 1

        // Submit do formulário
        document.getElementById('maintenance-form')?.addEventListener('submit', handleFormSubmit);

        // Listener para Categoria de Problema
        document.getElementById('problem-category')?.addEventListener('change', handleProblemCategoryChange);

        // Listener para Tipo de Equipamento (para carregar IDs)
        document.getElementById('equipment-type')?.addEventListener('change', () => {
            const selectedType = document.getElementById('equipment-type').value;
            if (selectedType && selectedType !== 'Outro' && selectedType !== 'Aspirador' && selectedType !== 'Poliguindaste') {
                loadEquipmentIds();
            } else {
                 const idSelect = document.getElementById('equipment-id');
                 if(idSelect) {
                     idSelect.innerHTML = `<option value="">${selectedType ? 'Não aplicável' : 'Selecione o tipo'}</option>`;
                     idSelect.disabled = true;
                 }
            }
        });

       // Listener para refresh da lista
        const refreshListButton = document.getElementById('refresh-maintenance-list');
        if (refreshListButton) {
            // Prevenir múltiplos listeners
            refreshListButton.removeEventListener('click', loadMaintenanceList);
            refreshListButton.addEventListener('click', loadMaintenanceList);
        }

        // Listeners para filtros e busca
        const searchInput = document.getElementById('maintenance-search');
        if (searchInput) {
            // Usar debounce de Utilities
            const debouncedHandler = typeof Utilities !== 'undefined' ? Utilities.debounce(handleSearchInput, 300) : debounce(handleSearchInput, 300);
            searchInput.removeEventListener('input', debouncedHandler); // Remover antes de adicionar
            searchInput.addEventListener('input', debouncedHandler);
        }

        const filterItems = document.querySelectorAll('#tab-maintenance .filter-container .filter-item');
        filterItems.forEach(item => {
            item.removeEventListener('click', handleFilterClick); // Remover antes de adicionar
            item.addEventListener('click', handleFilterClick);
        });
   }

   function setupMaintenanceListListeners() { /* ... código inalterado ... */
       const tableBody = document.getElementById('maintenance-tbody');
       if (tableBody && !tableBody.dataset.listenerAttached) { // Evitar múltiplos listeners
           tableBody.addEventListener('click', handleTableActionClick);
           tableBody.dataset.listenerAttached = 'true';
       }
   }

   // --- Funções de Abertura/Fechamento/Reset ---
   function openMaintenanceForm(maintenanceId = null, dataToEdit = null) { /* ... código inalterado ... */
       resetForm();
       if (maintenanceId && dataToEdit) {
           isEditMode = true;
           editingMaintenanceId = maintenanceId;
           document.querySelector('#maintenance-form-overlay .form-title').textContent = 'Editar Manutenção';
           document.getElementById('submit-maintenance').textContent = 'Salvar Alterações';
           populateFormForEdit(dataToEdit);
       } else {
           isEditMode = false;
           editingMaintenanceId = null;
           document.querySelector('#maintenance-form-overlay .form-title').textContent = 'Registrar Nova Manutenção';
           document.getElementById('submit-maintenance').textContent = 'Finalizar Registro';
           const typeSelect = document.getElementById('equipment-type');
           if(typeSelect) typeSelect.dispatchEvent(new Event('change'));
       }
       showStep(1);
       const overlay = document.getElementById('maintenance-form-overlay');
       if(overlay) {
            overlay.style.display = 'block'; // Mudado para 'block'
            console.log("Formulário de manutenção aberto.");
       } else {
           console.error("Overlay #maintenance-form-overlay não encontrado!");
       }
       document.getElementById('equipment-type')?.focus();
   }

   function populateFormForEdit(data) { /* ... código inalterado ... */
       formData = { ...formData, ...data };
       setSelectValue('equipment-type', data.tipoEquipamento);
       const typeSelect = document.getElementById('equipment-type');
       if (typeSelect) {
           typeSelect.dispatchEvent(new Event('change'));
            const selectedType = data.tipoEquipamento;
            if (selectedType === 'Outro') { document.getElementById('other-equipment').value = data.placaOuId || ''; }
            else if (selectedType === 'Aspirador' || selectedType === 'Poliguindaste') {
                const customIdInput = document.getElementById('custom-equipment-id');
                if (customIdInput) { customIdInput.value = data.placaOuId || ''; }
            } else if (selectedType) {
                loadEquipmentIds().then(() => { setSelectValue('equipment-id', data.placaOuId); })
                               .catch(err => { console.error("Erro ao carregar IDs para edição:", err); setSelectValue('equipment-id', data.placaOuId); });
            }
       }
       document.getElementById('technician-name').value = data.responsavel || '';
       document.getElementById('maintenance-date').value = data.dataManutencao ? data.dataManutencao.split('T')[0] : '';
       setSelectValue('area', data.area);
       document.getElementById('office').value = data.localOficina || '';
       setSelectValue('maintenance-type', data.tipoManutencao);
       document.getElementById('is-critical').checked = data.eCritico || data.isCritical || false;
       setSelectValue('problem-category', data.categoriaProblema);
       const categorySelect = document.getElementById('problem-category');
       if(categorySelect) {
           categorySelect.dispatchEvent(new Event('change'));
           if (data.categoriaProblema === 'Outro') { document.getElementById('other-category').value = data.categoriaProblemaOutro || data.categoriaProblema || ''; }
       }
       document.getElementById('problem-description').value = data.detalhesproblema || data.problemDescription || '';
       document.getElementById('additional-notes').value = data.observacoes || data.additionalNotes || '';
    }

   function setSelectValue(selectId, value) { /* ... código inalterado ... */
        const select = document.getElementById(selectId); if (!select) return;
        if (value === undefined || value === null) { select.value = ""; return; }
        const stringValue = String(value);
        let optionExists = Array.from(select.options).some(opt => opt.value === stringValue);
        if (optionExists) { select.value = stringValue; }
        else {
            const lowerTrimmedValue = stringValue.toLowerCase().trim();
            const foundOptionByValue = Array.from(select.options).find(opt => opt.value.toLowerCase().trim() === lowerTrimmedValue);
            if (foundOptionByValue) { select.value = foundOptionByValue.value; optionExists = true; }
            else {
                 const trimmedTextValue = stringValue.trim();
                 const foundOptionByText = Array.from(select.options).find(opt => opt.textContent.trim() === trimmedTextValue);
                 if (foundOptionByText) { select.value = foundOptionByText.value; optionExists = true; }
            }
        }
        if (!optionExists) { console.warn(`Valor "${value}" não encontrado no select "${selectId}".`); select.value = ""; }
    }

   function closeForm() { /* ... código inalterado ... */
       const confirmationMessage = isEditMode ? 'Descartar alterações não salvas?' : 'Cancelar o registro da nova manutenção?';
        if (typeof Utilities !== 'undefined' && Utilities.showConfirmation) {
            Utilities.showConfirmation(confirmationMessage, () => {
                 document.getElementById('maintenance-form-overlay').style.display = 'none'; resetForm();
            });
        } else { if (confirm(confirmationMessage)) { document.getElementById('maintenance-form-overlay').style.display = 'none'; resetForm(); } }
   }

   function resetForm() { /* ... código inalterado ... */
       formData = { /* ... reset state ... */ }; isEditMode = false; editingMaintenanceId = null;
       document.getElementById('maintenance-form')?.reset();
       document.getElementById('other-equipment-field').style.display = 'none';
       document.getElementById('other-category-field').style.display = 'none';
       const customEquipField = document.getElementById('custom-equipment-id-field');
       if (customEquipField) { customEquipField.style.display = 'none'; document.getElementById('custom-equipment-id').value = ''; }
       const equipIdSelectContainer = document.getElementById('equipment-id')?.parentElement;
       if (equipIdSelectContainer) { equipIdSelectContainer.style.display = 'none'; }
       clearValidationErrors(1); clearValidationErrors(2); clearValidationErrors(3);
       document.querySelector('#maintenance-form-overlay .form-title').textContent = 'Registrar Nova Manutenção';
       document.getElementById('submit-maintenance').textContent = 'Finalizar Registro';
       showStep(1);
   }

   // --- Funções de Carregamento de Dados ---
   function loadEquipmentTypes() { /* ... código inalterado ... */
       try {
           if(typeof Utilities !== 'undefined') Utilities.showLoading(true, 'Carregando tipos...'); else console.log("Carregando tipos...");
           API.getMaintenanceFormData()
           .then(response => {
               if (response.success && response.formData) {
                   const select = document.getElementById('equipment-type'); if (!select) return; select.innerHTML = '<option value="">Selecione o tipo...</option>';
                   let equipmentTypes = [];
                   const apiTypes = response.formData.opcoesTipoEquipe || response.formData.equipmentTypes;
                   if (apiTypes && Array.isArray(apiTypes)) { apiTypes.forEach(type => { if (type && !equipmentTypes.includes(type)) { equipmentTypes.push(type); } }); }
                   const requiredTypes = ['Aspirador', 'Poliguindaste']; requiredTypes.forEach(type => { if (!equipmentTypes.includes(type)) { equipmentTypes.push(type); } });
                   equipmentTypes.forEach(type => { const option = document.createElement('option'); option.value = type; option.textContent = type; select.appendChild(option); });
                   if (!equipmentTypes.includes('Outro')) { const otherOption = document.createElement('option'); otherOption.value = 'Outro'; otherOption.textContent = 'Outro'; select.appendChild(otherOption); }
                   else { const outroOpt = Array.from(select.options).find(opt => opt.value === 'Outro'); if (outroOpt && outroOpt !== select.options[select.options.length - 1]) { select.appendChild(outroOpt); } }
                   setupEquipmentTypeEvents();
               } else { throw new Error(response?.message || "Dados do formulário inválidos"); }
           })
           .catch(error => { console.error("Erro ao carregar tipos via API:", error); if(typeof Utilities !== 'undefined') Utilities.showNotification("Falha ao buscar tipos. Usando lista padrão.", "warning"); loadDefaultEquipmentTypes(); setupEquipmentTypeEvents(); })
           .finally(() => { if(typeof Utilities !== 'undefined') Utilities.showLoading(false); });
       } catch (e) { console.error("Erro inesperado tipos:", e); if(typeof Utilities !== 'undefined') Utilities.showNotification("Erro interno tipos. Usando lista padrão.", "error"); loadDefaultEquipmentTypes(); setupEquipmentTypeEvents(); if(typeof Utilities !== 'undefined') Utilities.showLoading(false); }
   }

   function loadDefaultEquipmentTypes() { /* ... código inalterado ... */
       const select = document.getElementById('equipment-type'); if (!select) return; select.innerHTML = '<option value="">Selecione o tipo...</option>';
       const defaultTypes = ['Alta Pressão', 'Auto Vácuo / Hiper Vácuo', 'Aspirador', 'Poliguindaste', 'Outro'];
       defaultTypes.forEach(type => { const option = document.createElement('option'); option.value = type; option.textContent = type; select.appendChild(option); });
   }

   function setupEquipmentTypeEvents() { /* ... código inalterado (com a lógica de mostrar/esconder e criar campos) ... */
       const typeSelect = document.getElementById('equipment-type'); if (!typeSelect) return;
       const handleTypeChangeLogic = function() {
           const selectedType = this.value;
           const equipIdSelectContainer = document.getElementById('equipment-id')?.parentElement;
           const equipIdSelect = document.getElementById('equipment-id');
           const otherEquipField = document.getElementById('other-equipment-field');
           const customEquipFieldId = 'custom-equipment-id-field';
           const customEquipInputId = 'custom-equipment-id';
           let customEquipField = document.getElementById(customEquipFieldId);

           if (otherEquipField) { otherEquipField.style.display = selectedType === 'Outro' ? 'block' : 'none'; const otherInput = otherEquipField.querySelector('input'); if(otherInput) otherInput.required = (selectedType === 'Outro'); }

           if (selectedType === 'Aspirador' || selectedType === 'Poliguindaste') {
               if (equipIdSelectContainer) { equipIdSelectContainer.style.display = 'none'; } if(equipIdSelect) equipIdSelect.required = false;
               if (!customEquipField) {
                   customEquipField = document.createElement('div'); customEquipField.id = customEquipFieldId; customEquipField.className = 'form-group';
                   customEquipField.innerHTML = `<label for="${customEquipInputId}">Identificação do ${selectedType} <span class="form-required">*</span></label><input type="text" class="form-control" id="${customEquipInputId}" name="${customEquipInputId}" required>`;
                   const referenceNode = otherEquipField || typeSelect?.parentElement;
                   if (referenceNode && referenceNode.parentElement) { referenceNode.parentElement.insertBefore(customEquipField, referenceNode.nextSibling); }
                   else { document.getElementById('step-1-content')?.appendChild(customEquipField); }
               } else {
                   const label = customEquipField.querySelector('label'); if (label) { label.innerHTML = `Identificação do ${selectedType} <span class="form-required">*</span>`; } customEquipField.style.display = 'block';
               }
               const customInput = document.getElementById(customEquipInputId); if(customInput) customInput.required = true;
           } else {
               if (customEquipField) { customEquipField.style.display = 'none'; const customInput = document.getElementById(customEquipInputId); if(customInput) customInput.required = false; }
               if (equipIdSelectContainer) { const shouldShowStandardSelect = selectedType && selectedType !== 'Outro'; equipIdSelectContainer.style.display = shouldShowStandardSelect ? 'block' : 'none'; if(equipIdSelect) equipIdSelect.required = shouldShowStandardSelect; }
           }

           if (selectedType !== 'Outro') { const otherInput = document.getElementById('other-equipment'); if (otherInput) otherInput.value = ''; }
           if (selectedType !== 'Aspirador' && selectedType !== 'Poliguindaste') { const customInput = document.getElementById(customEquipInputId); if (customInput) customInput.value = ''; }
           if (selectedType === 'Outro' || selectedType === 'Aspirador' || selectedType === 'Poliguindaste') { if (equipIdSelect) equipIdSelect.value = ''; }
       };
       typeSelect.removeEventListener('change', handleTypeChangeLogic); typeSelect.addEventListener('change', handleTypeChangeLogic);
   }

   function loadEquipmentIds() { /* ... código inalterado ... */
        const typeSelect = document.getElementById('equipment-type'); const idSelect = document.getElementById('equipment-id'); if (!typeSelect || !idSelect) return Promise.resolve();
        const selectedType = typeSelect.value; idSelect.innerHTML = '<option value="">Carregando IDs...</option>'; idSelect.disabled = true;
        if (!selectedType || selectedType === 'Outro' || selectedType === 'Aspirador' || selectedType === 'Poliguindaste') { idSelect.innerHTML = `<option value="">${selectedType ? 'Não aplicável' : 'Selecione o tipo'}</option>`; return Promise.resolve(); }
        return API.getEquipmentIdsByType(selectedType)
            .then(response => {
                if (response && response.success && Array.isArray(response.ids)) {
                    idSelect.innerHTML = '<option value="">Selecione a placa/ID...</option>';
                    if (response.ids.length === 0) { idSelect.innerHTML = '<option value="">Nenhum ID encontrado</option>'; idSelect.disabled = true; }
                    else { response.ids.forEach(id => { if (id !== null && id !== undefined) { const option = document.createElement('option'); option.value = id; option.textContent = id; idSelect.appendChild(option); } }); idSelect.disabled = false; }
                } else { console.warn("Resposta inválida API IDs:", selectedType, response); idSelect.innerHTML = '<option value="">Nenhum ID encontrado</option>'; idSelect.disabled = true; }
            })
            .catch(error => { console.error(`Erro carregar IDs tipo ${selectedType}:`, error); idSelect.innerHTML = '<option value="">Erro ao carregar IDs</option>'; if(typeof Utilities !== 'undefined') Utilities.showNotification(`Erro buscar IDs para ${selectedType}.`, "error"); idSelect.disabled = true; return Promise.reject(error); });
   }

   function loadProblemCategories() { /* ... código inalterado ... */
       if (loadProblemCategories.loaded) return Promise.resolve();
       return API.getProblemCategories()
           .then(response => {
               if (response && response.success && Array.isArray(response.categories)) {
                   const select = document.getElementById('problem-category'); if (!select) return; select.innerHTML = '<option value="">Selecione a categoria...</option>';
                   response.categories.forEach(category => { if(category) { const option = document.createElement('option'); option.value = category; option.textContent = category; select.appendChild(option); } });
                   const otherOption = document.createElement('option'); otherOption.value = 'Outro'; otherOption.textContent = 'Outro (Especificar)'; select.appendChild(otherOption); loadProblemCategories.loaded = true;
               } else { console.error("Erro categorias:", response); if(typeof Utilities !== 'undefined') Utilities.showNotification("Não foi possível carregar categorias.", "warning"); }
           })
           .catch(error => { console.error("Erro API categorias:", error); if(typeof Utilities !== 'undefined') Utilities.showNotification("Erro buscar categorias: " + (error.message || 'Erro'), "error"); const select = document.getElementById('problem-category'); if(select) select.innerHTML = '<option value="">Erro ao carregar</option>'; });
   }
   loadProblemCategories.loaded = false;

   // --- Funções da Lista de Manutenção ---
   function loadMaintenanceList() { /* ... código inalterado (chama filterAndRenderList) ... */
       const tableBody = document.getElementById('maintenance-tbody'); if (!tableBody) return;
       if(typeof Utilities !== 'undefined') Utilities.showLoading(true, 'Carregando lista...'); else console.log("Carregando lista...");
       tableBody.innerHTML = '<tr><td colspan="10" class="text-center loading-message">Carregando manutenções...</td></tr>';
       API.getMaintenanceList()
           .then(response => {
               if (response && response.success && Array.isArray(response.maintenances)) { fullMaintenanceList = response.maintenances; filterAndRenderList(); }
               else { console.error("Erro API lista:", response); if(typeof Utilities !== 'undefined') Utilities.showNotification("Erro carregar lista.", "error"); tableBody.innerHTML = '<tr><td colspan="10" class="text-center error-message">Erro ao carregar.</td></tr>'; }
           })
           .catch(error => { console.error("Erro buscar lista:", error); if(typeof Utilities !== 'undefined') Utilities.showNotification("Erro buscar manutenções: " + (error.message || 'Erro'), "error"); tableBody.innerHTML = `<tr><td colspan="10" class="text-center error-message">Falha: ${error.message || ''}. Tente novamente.</td></tr>`; })
           .finally(() => { if(typeof Utilities !== 'undefined') Utilities.showLoading(false); });
   }

   function filterAndRenderList() { /* ... código inalterado (chama renderMaintenanceTable) ... */
       let filteredList = [...fullMaintenanceList];
       if (currentFilter !== 'all') { /* ... lógica de filtro de status ... */
           filteredList = filteredList.filter(item => {
               const status = (item.status || 'pendente').toLowerCase().trim();
               switch (currentFilter) {
                   case 'pending': return ['pendente', 'aguardando verificacao', 'aguardando verificação'].includes(status);
                   case 'verified': return ['verificado', 'aprovado', 'ajustes', 'reprovado'].includes(status);
                   case 'completed': return ['concluído', 'concluido', 'completed'].includes(status);
                   case 'critical': return item.eCritico || item.isCritical;
                   default: return true;
               }
           });
       }
       const searchTerm = currentSearchTerm.toLowerCase().trim();
       if (searchTerm) { /* ... lógica de busca ... */
            filteredList = filteredList.filter(item => {
               const includesTerm = (...values) => values.some(val => String(val || '').toLowerCase().includes(searchTerm));
               return includesTerm(item.id, item.placaOuId, item.tipoEquipamento, item.responsavel, item.area, item.localOficina, item.tipoManutencao, item.categoriaProblema, item.categoriaProblemaOutro, item.status, item.detalhesproblema);
            });
       }
       renderMaintenanceTable(filteredList);
   }

   function renderMaintenanceTable(list) { /* ... código inalterado (gera HTML da tabela) ... */
       const tableBody = document.getElementById('maintenance-tbody'); if (!tableBody) return; tableBody.innerHTML = '';
       if (list.length === 0) { const message = currentSearchTerm || currentFilter !== 'all' ? 'Nenhuma manutenção encontrada com os filtros.' : 'Nenhuma manutenção registrada.'; tableBody.innerHTML = `<tr><td colspan="10" class="text-center no-data-message">${message}</td></tr>`; return; }
       list.forEach(item => {
           const row = document.createElement('tr'); row.setAttribute('data-maintenance-id', item.id);
           const id = item.id || 'N/A'; const equipmentId = item.placaOuId || '-'; const equipmentType = item.tipoEquipamento || 'N/A';
           let equipmentDisplay = `${equipmentType}`; if (equipmentId !== '-') { equipmentDisplay += ` (${equipmentId})`; }
           const maintenanceType = item.tipoManutencao || '-'; const regDateStr = item.dataRegistro || item.registrationDate || item.dataManutencao;
           const regDate = typeof Utilities !== 'undefined' ? Utilities.formatDate(regDateStr, false) : formatDate(regDateStr, false); // Usa global ou local
           const responsible = item.responsavel || '-'; const area = item.area || '-'; const office = item.localOficina || '-';
           const problemCat = item.categoriaProblema === 'Outro' ? (item.categoriaProblemaOutro || 'Outro') : item.categoriaProblema; const problem = problemCat || '-';
           const status = item.status || 'Pendente'; const statusClass = typeof Utilities !== 'undefined' ? Utilities.getStatusClass(status) : getStatusClass(status); // Usa global ou local
           const isCritical = item.eCritico || item.isCritical || false;
           const lowerStatus = status.toLowerCase().trim();
           const allowVerification = ['pendente', 'aguardando verificacao', 'aguardando verificação'].includes(lowerStatus);
           const allowEdit = ['pendente', 'aguardando verificacao', 'aguardando verificação', 'ajustes'].includes(lowerStatus);
           row.innerHTML = `<td>${id}</td><td>${equipmentDisplay}</td><td>${maintenanceType} ${isCritical ? '<span class="critical-indicator" title="Crítica">❗️</span>' : ''}</td><td>${regDate}</td><td>${responsible}</td><td>${area}</td><td>${office}</td><td><span title="${item.detalhesproblema || ''}">${problem}</span></td><td><span class="status-badge status-${statusClass}">${status}</span></td><td class="action-buttons"><button class="btn-icon view-maintenance" data-id="${id}" title="Ver Detalhes">👁️</button>${allowVerification ? `<button class="btn-icon verify-maintenance" data-id="${id}" title="Verificar">✔️</button>` : ''}${allowEdit ? `<button class="btn-icon edit-maintenance" data-id="${id}" title="Editar">✏️</button>` : ''}</td>`;
           tableBody.appendChild(row);
       });
       if (typeof tippy === 'function') { tippy('#maintenance-tbody .btn-icon[title]'); tippy('#maintenance-tbody .critical-indicator[title]'); tippy('#maintenance-tbody [title]'); }
   }

   // --- Funções de Manipulação de Eventos ---
   function handleNextToStep2() { /* ... código inalterado ... */
       if (validateStep1()) { saveStep1Data(); showStep(2); document.getElementById('problem-category')?.focus(); }
   }
   function handleNextToStep3() { /* ... código inalterado ... */
       if (validateStep2()) { saveStep2Data(); updateSummary(); showStep(3); document.getElementById('submit-maintenance')?.focus(); }
   }
   function handleFormSubmit(event) { /* ... código inalterado ... */
       event.preventDefault();
       if (validateStep2()) { saveStep2Data(); submitMaintenance(); }
       else { showStep(2); if(typeof Utilities !== 'undefined') Utilities.showNotification("Verifique campos na Etapa 2.", "warning"); }
   }
   function handleProblemCategoryChange(event) { /* ... código inalterado ... */
       const otherField = document.getElementById('other-category-field'); const otherInput = document.getElementById('other-category'); if (!otherField || !otherInput) return;
       if (event.target.value === 'Outro') { otherField.style.display = 'block'; otherInput.required = true; otherInput.focus(); }
       else { otherField.style.display = 'none'; otherInput.value = ''; otherInput.required = false; }
   }
   function handleSearchInput(event) { /* ... código inalterado ... */
       currentSearchTerm = event.target.value || ''; filterAndRenderList();
   }
   function handleFilterClick(event) { /* ... código inalterado ... */
       const target = event.currentTarget; currentFilter = target.getAttribute('data-filter') || 'all';
       document.querySelectorAll('#tab-maintenance .filter-container .filter-item').forEach(item => item.classList.remove('active')); target.classList.add('active');
       filterAndRenderList();
   }
   function handleTableActionClick(event) { /* ... código inalterado (chama outras funções) ... */
       const button = event.target.closest('.btn-icon'); if (!button) return;
       const maintenanceId = button.getAttribute('data-id'); if (!maintenanceId) return;
       const maintenanceData = findMaintenanceByIdInList(maintenanceId);
       if (!maintenanceData) { console.error(`Dados para ${maintenanceId} não encontrados.`); if(typeof Utilities !== 'undefined') Utilities.showNotification(`Detalhes para ${maintenanceId} não encontrados. Atualize a lista.`, "warning"); return; }

       if (button.classList.contains('view-maintenance')) {
           if (typeof Utilities !== 'undefined' && Utilities.viewMaintenanceDetails) { Utilities.viewMaintenanceDetails(maintenanceId); } // Usa viewMaintenanceDetails global
           else { console.error("Função Utilities.viewMaintenanceDetails não encontrada."); alert(`Visualizar ID: ${maintenanceId}`); }
       } else if (button.classList.contains('verify-maintenance')) {
           if (typeof Verification !== 'undefined' && Verification.openVerificationForm) { Verification.openVerificationForm(maintenanceId, maintenanceData); }
           else { console.error("Módulo Verification não encontrado."); alert(`Verificar ID: ${maintenanceId}`); }
       } else if (button.classList.contains('edit-maintenance')) {
           openMaintenanceForm(maintenanceId, maintenanceData); // Chama a função deste módulo
       } else if (button.classList.contains('delete-maintenance')) {
           handleDeleteMaintenance(maintenanceId, maintenanceData);
       }
   }
   function findMaintenanceByIdInList(id) { /* ... código inalterado ... */
        const stringId = String(id); return fullMaintenanceList.find(item => String(item.id) === stringId) || null;
   }
   function handleDeleteMaintenance(id, maintenanceData) { /* ... código inalterado ... */
       const equipDisplay = maintenanceData?.tipoEquipamento ? `${maintenanceData.tipoEquipamento} (${maintenanceData.placaOuId || 'ID desc.'})` : `ID ${id}`;
       const message = `Tem certeza que deseja excluir a manutenção para ${equipDisplay}?`;
       const confirmCallback = () => { /* ... lógica de exclusão com API.deleteMaintenance ... */
            if(typeof Utilities !== 'undefined') Utilities.showLoading(true, `Excluindo ${id}...`); else console.log("Excluindo...");
            API.deleteMaintenance(id).then(response => {
                 if (response && response.success) { if(typeof Utilities !== 'undefined') Utilities.showNotification(`Manutenção ${id} excluída.`, 'success'); fullMaintenanceList = fullMaintenanceList.filter(item => String(item.id) !== String(id)); filterAndRenderList(); if (typeof Dashboard !== 'undefined' && Dashboard.loadDashboardData) { Dashboard.loadDashboardData(true); } }
                 else { console.error(`Erro excluir ${id} (API):`, response); if(typeof Utilities !== 'undefined') Utilities.showNotification(`Erro ao excluir ${id}: ${response?.message || 'Erro API'}.`, 'error'); }
            }).catch(error => { console.error(`Erro rede excluir ${id}:`, error); if(typeof Utilities !== 'undefined') Utilities.showNotification(`Falha comunicação ao excluir ${id}: ${error.message || 'Erro rede'}.`, 'error'); })
            .finally(() => { if(typeof Utilities !== 'undefined') Utilities.showLoading(false); });
       };
       if (typeof Utilities !== 'undefined' && Utilities.showConfirmation) { Utilities.showConfirmation(message, confirmCallback); } else { if(confirm(message)) { confirmCallback(); } }
   }

   // --- Funções de Navegação, Validação e Persistência ---
   function showStep(step) { /* ... código inalterado ... */
       document.querySelectorAll('.form-steps .form-step').forEach((el) => { const stepNumber = parseInt(el.getAttribute('data-step'), 10); if (stepNumber == step) { el.classList.add('active'); el.classList.remove('completed'); } else if (stepNumber < step) { el.classList.remove('active'); el.classList.add('completed'); } else { el.classList.remove('active'); el.classList.remove('completed'); } });
       document.querySelectorAll('.form-step-content').forEach(el => { el.style.display = 'none'; });
       const currentStepContent = document.getElementById(`step-${step}-content`); if (currentStepContent) { currentStepContent.style.display = 'block'; }
   }
   function validateStep1() { /* ... código inalterado (com validação condicional) ... */
       let isValid = true; let firstInvalid = null; clearValidationErrors(1);
       const requiredFields = [ { id: 'equipment-type', name: 'Tipo Equipamento' }, { id: 'technician-name', name: 'Responsável' }, { id: 'maintenance-date', name: 'Data Manutenção' }, { id: 'area', name: 'Área' }, { id: 'office', name: 'Local/Oficina' }, { id: 'maintenance-type', name: 'Tipo Manutenção' } ];
       const equipType = document.getElementById('equipment-type').value;
       if (equipType === 'Outro') { requiredFields.push({ id: 'other-equipment', name: 'Especificar Equipamento' }); }
       else if (equipType === 'Aspirador' || equipType === 'Poliguindaste') { requiredFields.push({ id: 'custom-equipment-id', name: `Identificação ${equipType}` }); }
       else if (equipType) { requiredFields.push({ id: 'equipment-id', name: 'Placa ou ID' }); }
       requiredFields.forEach(field => {
           const element = document.getElementById(field.id); let isFieldValid = false;
           if (element) { if (element.value && element.value.trim() !== '') { isFieldValid = true; } }
           if (!isFieldValid) { isValid = false; if (element) { markFieldError(element, `${field.name} é obrigatório.`); if (!firstInvalid) firstInvalid = element; } else { console.error(`Campo ${field.name} (#${field.id}) não encontrado.`); } }
       });
       if (!isValid) { if(typeof Utilities !== 'undefined') Utilities.showNotification("Preencha campos obrigatórios da Etapa 1.", "warning"); if (firstInvalid) { firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' }); firstInvalid.focus(); } }
       return isValid;
   }
   function validateStep2() { /* ... código inalterado ... */
        let isValid = true; let firstInvalidElement = null; clearValidationErrors(2);
        const requiredFields = [ { id: 'problem-category', name: 'Categoria Problema' }, { id: 'problem-description', name: 'Detalhes Problema' } ];
        const categoryValue = document.getElementById('problem-category')?.value; if (categoryValue === 'Outro') { requiredFields.push({ id: 'other-category', name: 'Especificar Categoria' }); }
        requiredFields.forEach(fieldInfo => {
            const element = document.getElementById(fieldInfo.id); let isFieldValid = false; if (element) { if (element.value && element.value.trim() !== '') { isFieldValid = true; } }
            if (!isFieldValid) { isValid = false; if(element) { markFieldError(element, `${fieldInfo.name} é obrigatório.`); if (!firstInvalidElement) firstInvalidElement = element; } else { console.error(`Campo ${fieldInfo.name} (#${fieldInfo.id}) não encontrado.`); } }
        });
        if (!isValid) { if(typeof Utilities !== 'undefined') Utilities.showNotification("Preencha campos obrigatórios da Etapa 2.", "warning"); if (firstInvalidElement) { firstInvalidElement.scrollIntoView({ behavior: 'smooth', block: 'center' }); firstInvalidElement.focus(); } }
        return isValid;
   }
   function markFieldError(element, message) { /* ... código inalterado ... */
        if (!element) return; element.style.borderColor = 'red'; element.setAttribute('aria-invalid', 'true');
        const errorSpanId = element.id + '-error'; let errorSpan = document.getElementById(errorSpanId); const parent = element.parentElement;
        if (!errorSpan && parent) { errorSpan = document.createElement('span'); errorSpan.id = errorSpanId; errorSpan.className = 'error-message-field'; errorSpan.setAttribute('role', 'alert'); errorSpan.style.display = 'none'; parent.appendChild(errorSpan); }
        if(errorSpan) { errorSpan.textContent = message; errorSpan.style.display = 'block'; errorSpan.style.color = '#d93025'; errorSpan.style.fontSize = '0.8em'; errorSpan.style.marginTop = '4px'; }
   }
   function clearValidationErrors(step) { /* ... código inalterado ... */
       const stepContent = document.getElementById(`step-${step}-content`); if (!stepContent) return;
       stepContent.querySelectorAll('[aria-invalid="true"]').forEach(el => { if(el.style) el.style.borderColor = ''; el.removeAttribute('aria-invalid'); const errorSpan = document.getElementById(el.id + '-error'); if (errorSpan) { errorSpan.textContent = ''; errorSpan.style.display = 'none'; } });
       stepContent.querySelectorAll('.error-message-field').forEach(span => { if (!document.getElementById(span.id.replace('-error', ''))?.hasAttribute('aria-invalid')) { span.textContent = ''; span.style.display = 'none'; } });
   }
   function saveStep1Data() { /* ... código inalterado (com lógica condicional de ID) ... */
       formData.equipmentType = document.getElementById('equipment-type')?.value || '';
       if (formData.equipmentType === 'Aspirador' || formData.equipmentType === 'Poliguindaste') { const customIdInput = document.getElementById('custom-equipment-id'); formData.customEquipmentId = customIdInput ? customIdInput.value.trim() : ''; formData.equipmentId = ''; formData.otherEquipment = ''; }
       else if (formData.equipmentType === 'Outro') { formData.otherEquipment = document.getElementById('other-equipment')?.value.trim() || ''; formData.equipmentId = ''; formData.customEquipmentId = ''; }
       else { formData.equipmentId = document.getElementById('equipment-id')?.value || ''; formData.otherEquipment = ''; formData.customEquipmentId = ''; }
       formData.technician = document.getElementById('technician-name')?.value.trim() || ''; formData.date = document.getElementById('maintenance-date')?.value || ''; formData.area = document.getElementById('area')?.value || ''; formData.office = document.getElementById('office')?.value.trim() || ''; formData.maintenanceType = document.getElementById('maintenance-type')?.value || ''; formData.isCritical = document.getElementById('is-critical')?.checked || false;
   }
   function saveStep2Data() { /* ... código inalterado ... */
       formData.problemCategory = document.getElementById('problem-category')?.value || '';
       if (formData.problemCategory === 'Outro') { formData.otherCategory = document.getElementById('other-category')?.value.trim() || ''; } else { formData.otherCategory = ''; }
       formData.problemDescription = document.getElementById('problem-description')?.value.trim() || ''; formData.additionalNotes = document.getElementById('additional-notes')?.value.trim() || '';
   }
   function updateSummary() { /* ... código inalterado (com lógica condicional de ID) ... */
        const getSelectText = (id) => { const select = document.getElementById(id); if (select && select.selectedIndex >= 0) { if (select.value) { return select.options[select.selectedIndex].text; } } return '-'; };
        let equipmentDisplay = '-'; const equipType = formData.equipmentType; const typeText = getSelectText('equipment-type');
        if (equipType === 'Outro') { equipmentDisplay = `${typeText}: ${formData.otherEquipment || '(Não especificado)'}`; }
        else if (equipType === 'Aspirador' || equipType === 'Poliguindaste') { equipmentDisplay = `${typeText} (${formData.customEquipmentId || 'ID não informado'})`; }
        else if (equipType) { const idText = getSelectText('equipment-id'); const detail = (idText !== '-') ? idText : (formData.equipmentId || 'ID não selecionado'); equipmentDisplay = `${typeText} (${detail})`; }
        document.getElementById('summary-equipment').textContent = equipmentDisplay;
        document.getElementById('summary-technician').textContent = formData.technician || '-';
        const formattedDate = (typeof Utilities !== 'undefined') ? Utilities.formatDate(formData.date, false) : formatDate(formData.date, false);
        document.getElementById('summary-date').textContent = formattedDate;
        const areaText = getSelectText('area'); const location = `${areaText !== '-' ? areaText : (formData.area || 'Área N/A')} / ${formData.office || 'Oficina N/A'}`; document.getElementById('summary-location').textContent = location;
        document.getElementById('summary-type').textContent = getSelectText('maintenance-type');
        document.getElementById('summary-critical').textContent = formData.isCritical ? 'Sim' : 'Não';
        let categoryDisplay = '-'; const problemCat = formData.problemCategory; if (problemCat === 'Outro') { categoryDisplay = `Outro: ${formData.otherCategory || '(N/A)'}`; } else if (problemCat) { categoryDisplay = getSelectText('problem-category'); } document.getElementById('summary-category').textContent = categoryDisplay;
        document.getElementById('summary-problem').textContent = formData.problemDescription || '-';
        document.getElementById('summary-notes').textContent = formData.additionalNotes || '-';
   }
   function submitMaintenance() { /* ... código inalterado (com mapeamento para API) ... */
       const loadingMessage = isEditMode ? `Atualizando ${editingMaintenanceId}...` : 'Registrando...'; if(typeof Utilities !== 'undefined') Utilities.showLoading(true, loadingMessage);
       let finalEquipmentIdentifier = ''; if (formData.equipmentType === 'Outro') { finalEquipmentIdentifier = formData.otherEquipment; } else if (formData.equipmentType === 'Aspirador' || formData.equipmentType === 'Poliguindaste') { finalEquipmentIdentifier = formData.customEquipmentId; } else { finalEquipmentIdentifier = formData.equipmentId; }
       let finalProblemCategory = formData.problemCategory; let finalOtherCategoryValue = null; if (formData.problemCategory === 'Outro') { finalOtherCategoryValue = formData.otherCategory; }
       const apiData = { tipoEquipamento: formData.equipmentType, placaOuId: finalEquipmentIdentifier, responsavel: formData.technician, dataManutencao: formData.date, area: formData.area, localOficina: formData.office, tipoManutencao: formData.maintenanceType, eCritico: formData.isCritical, categoriaProblema: finalProblemCategory, categoriaProblemaOutro: finalOtherCategoryValue, detalhesproblema: formData.problemDescription, observacoes: formData.additionalNotes };
       const apiCall = isEditMode ? API.updateMaintenance(editingMaintenanceId, apiData) : API.saveMaintenance(apiData);
       apiCall.then(response => {
           if (response && response.success) { const successMessage = isEditMode ? `Manutenção ${editingMaintenanceId} atualizada!` : `Manutenção registrada! ID: ${response.id || '(sem ID)'}`; if(typeof Utilities !== 'undefined') Utilities.showNotification(successMessage, 'success'); document.getElementById('maintenance-form-overlay').style.display = 'none'; resetForm(); loadMaintenanceList(); if (typeof Dashboard !== 'undefined') { Dashboard.loadDashboardData(true); } }
           else { console.error("Erro API salvar/atualizar:", response); const errorMessage = isEditMode ? 'Erro ao atualizar' : 'Erro ao salvar'; if(typeof Utilities !== 'undefined') Utilities.showNotification(`${errorMessage}: ${response?.message || 'Verifique os dados.'}.`, 'error'); }
       }).catch(error => { console.error("Erro requisição API:", error); const failureMessage = isEditMode ? 'Falha ao atualizar' : 'Falha ao registrar'; let detail = error.message || 'Erro desconhecido'; if (error.response?.data?.message) { detail = error.response.data.message; } if(typeof Utilities !== 'undefined') Utilities.showNotification(`${failureMessage}: ${detail}.`, 'error'); })
       .finally(() => { if(typeof Utilities !== 'undefined') Utilities.showLoading(false); });
   }

   // --- Funções Auxiliares Locais (manter se não estiverem em Utilities) ---
   // function debounce(...) { ... } // Mover para Utilities
   // function formatDate(...) { ... } // Mover para Utilities
   // function getStatusClass(...) { ... } // Mover para Utilities

  // API pública do módulo
  return {
    initialize,
    openMaintenanceForm,
    loadMaintenanceList,
    // Expor outras se necessário
    // hasUnsavedChanges // Exemplo se precisar verificar de fora
  };
})();

// REMOVER O LISTENER ABAIXO:
/*
document.addEventListener('DOMContentLoaded', function() {
    // ... verificações ...
    Maintenance.initialize();
    // ... carregar lista ...
});
*/
