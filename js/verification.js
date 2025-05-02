// Verificar dependências
if (!window.API || !window.Utilities) {
  console.error("Erro CRÍTICO: Dependências API ou Utilities não carregadas antes de verification.js");
} else {
  console.log("Verification.js - Dependências parecem carregadas.");
}

const Verification = (() => {
  // ... (todo o código interno do módulo Verification permanece o mesmo) ...
  let verificationList = [];
  let currentFilter = 'all';
  let searchTerm = '';
  let selectedMaintenanceId = null;

  function initialize() {
    console.log("Verification.initialize() chamado."); // Log
    setupEventListeners();
    // Não carrega dados aqui, loadTabContent fará isso
  }

   function setupEventListeners() { /* ... código inalterado ... */
        // Filtros
        document.querySelectorAll('#tab-verification .filter-item').forEach(filter => {
             filter.removeEventListener('click', handleFilterClick); // Prevenir duplicação
             filter.addEventListener('click', handleFilterClick);
        });
        // Busca
        const searchInput = document.getElementById('verification-search');
        if (searchInput) {
             const debouncedHandler = typeof Utilities !== 'undefined' ? Utilities.debounce(handleSearchInput, 300) : debounce(handleSearchInput, 300);
             searchInput.removeEventListener('input', debouncedHandler);
             searchInput.addEventListener('input', debouncedHandler);
        }
        // Botão Refresh
        document.getElementById('refresh-verification-list')?.removeEventListener('click', () => loadVerificationData(true));
        document.getElementById('refresh-verification-list')?.addEventListener('click', () => loadVerificationData(true));
        // Submit Formulário
        document.getElementById('verification-form')?.removeEventListener('submit', handleFormSubmit);
        document.getElementById('verification-form')?.addEventListener('submit', handleFormSubmit);
        // Fechar/Cancelar Formulário
        document.getElementById('close-verification-form')?.removeEventListener('click', handleCloseForm);
        document.getElementById('close-verification-form')?.addEventListener('click', handleCloseForm);
        document.getElementById('cancel-verification')?.removeEventListener('click', handleCloseForm);
        document.getElementById('cancel-verification')?.addEventListener('click', handleCloseForm);
   }

   // --- Handlers para listeners ---
   function handleFilterClick() { /* 'this' refere-se ao elemento clicado */
        const filterItems = this.parentElement.querySelectorAll('.filter-item');
        filterItems.forEach(f => f.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.getAttribute('data-filter');
        updateVerificationList();
   }
   function handleSearchInput() { /* 'this' refere-se ao input */
        searchTerm = this.value;
        updateVerificationList();
   }
   function handleFormSubmit(e) {
        e.preventDefault();
        if (validateVerificationForm()) { submitVerification(); }
   }
   function handleCloseForm() {
        if (hasUnsavedChanges() && !confirm('Dados não salvos. Deseja cancelar?')) { return; }
        closeVerificationForm();
   }
   // --- Fim Handlers ---


   function loadVerificationData(forceReload = false) { /* ... código inalterado ... */
        if(typeof Utilities !== 'undefined') Utilities.showLoading(true, 'Carregando verificações...'); else console.log("Carregando verificações...");
        // Depende da API.getVerificationList()
        API.getVerificationList()
          .then(response => {
            if (response.success && Array.isArray(response.maintenances)) {
              verificationList = response.maintenances; console.log(`${verificationList.length} manutenções para verificação carregadas.`); updateVerificationList();
            } else { console.error("Erro carregar verificações:", response); if(typeof Utilities !== 'undefined') Utilities.showNotification("Erro carregar verificações: " + (response.message || "Inválido"), "error"); verificationList = []; updateVerificationList(); }
          })
          .catch(error => { console.error("Falha requisição verificações:", error); if(typeof Utilities !== 'undefined') Utilities.showNotification("Falha buscar verificações: " + error.message, "error"); verificationList = []; updateVerificationList(); })
          .finally(() => { if(typeof Utilities !== 'undefined') Utilities.showLoading(false); });
   }

   function updateVerificationList() { /* ... código inalterado (com addActionButtonListeners) ... */
        const tbody = document.getElementById('verification-tbody'); if(!tbody) return; tbody.innerHTML = '';
        const filtered = filterVerifications(verificationList, currentFilter, searchTerm);
        if (filtered.length === 0) { let message = "Nenhuma manutenção para verificação"; /* ... mensagem ... */ tbody.innerHTML = `<tr><td colspan="9" style="text-align: center;">${message}.</td></tr>`; return; }
        filtered.forEach(item => {
            const id = item.id || 'N/A'; const equipmentId = item.placaOuId || item.equipmentId || '-'; const type = item.tipoEquipamento || item.equipmentType || '-';
            const maintDate = typeof Utilities !== 'undefined' ? Utilities.formatDate(item.dataManutencao || item.date || '-') : (item.dataManutencao || item.date || '-');
            const resp = item.responsavel || item.technician || '-'; const area = item.area || '-'; const local = item.localOficina || item.location || '-';
            const status = item.status || 'Pendente'; const statusClass = typeof Utilities !== 'undefined' ? Utilities.getStatusClass(status) : status.toLowerCase();
            const row = document.createElement('tr');
            row.innerHTML = `<td>${id}</td><td>${equipmentId}</td><td>${type}</td><td>${maintDate}</td><td>${resp}</td><td>${area}</td><td>${local}</td><td><span class="status-badge status-${statusClass}">${status}</span></td><td><button class="btn-icon view-maintenance" data-id="${id}" title="Ver detalhes">👁️</button>${status === 'Pendente' ? `<button class="btn-icon verify-maintenance" data-id="${id}" title="Verificar">✓</button>` : ''}</td>`;
            tbody.appendChild(row);
        });
        addActionButtonListeners(tbody); // Adiciona listeners após popular
   }

   function filterVerifications(list, filter, search) { /* ... código inalterado ... */
       if (!Array.isArray(list)) return []; const searchLower = search ? search.toLowerCase().trim() : '';
       return list.filter(item => {
           let statusMatch = false; const status = (item.status || 'Pendente').toLowerCase();
           switch (filter) {
               case 'pending': statusMatch = status === 'pendente'; break;
               case 'verified': /* ... lógica filtro verificados hoje ... */
                    if (['verificado', 'aprovado', 'ajustes', 'reprovado'].includes(status)) { statusMatch = true; /* Simplificado - verificar data se necessário */ } else { statusMatch = false; } break;
               case 'completed': statusMatch = ['concluído', 'concluido'].includes(status); break;
               case 'all': default: statusMatch = true; break;
           }
           if (!statusMatch) return false;
           if (searchLower) { /* ... lógica de busca ... */
               const idMatch = String(item.id || '').toLowerCase().includes(searchLower); const equipMatch = (item.placaOuId || item.equipmentId || '').toLowerCase().includes(searchLower); const respMatch = (item.responsavel || item.technician || '').toLowerCase().includes(searchLower); const typeMatch = (item.tipoEquipamento || item.equipmentType || '').toLowerCase().includes(searchLower); const areaMatch = (item.area || '').toLowerCase().includes(searchLower); const localMatch = (item.localOficina || item.location || '').toLowerCase().includes(searchLower);
               return idMatch || equipMatch || respMatch || typeMatch || areaMatch || localMatch;
           }
           return true;
       });
   }

   function addActionButtonListeners(container) { /* ... código inalterado ... */
        if (!container) return;
        // Remover listeners antigos para evitar duplicação se a função for chamada múltiplas vezes
        // Uma forma é clonar o container, mas isso pode ter efeitos colaterais.
        // Melhor usar uma flag ou garantir que só seja chamado uma vez após limpar.
        if (container.dataset.listenerAttached === 'true') return; // Já tem listener

        container.addEventListener('click', function(event) {
            const target = event.target.closest('.btn-icon'); if (!target) return;
            const id = target.getAttribute('data-id'); if (!id) return;
            if (target.classList.contains('view-maintenance')) { viewMaintenanceDetails(id); } // Chama função global ou Utilities
            else if (target.classList.contains('verify-maintenance')) { openVerificationForm(id); } // Chama função deste módulo
        });
        container.dataset.listenerAttached = 'true'; // Marcar que o listener foi adicionado
   }

   function openVerificationForm(id) { /* ... código inalterado ... */
       selectedMaintenanceId = id; if(typeof Utilities !== 'undefined') Utilities.showLoading(true, 'Carregando dados...');
       API.getMaintenanceDetails(id)
         .then(response => { // API retorna { success: true, maintenance: {...} }
           if (!response || !response.success || !response.maintenance) { throw new Error(response?.message || 'Manutenção não encontrada'); }
           const maintenance = response.maintenance;
           document.getElementById('verification-id').value = maintenance.id || id;
           document.getElementById('verification-equipment').value = maintenance.placaOuId || maintenance.equipmentId || '-';
           document.getElementById('verification-type').value = maintenance.tipoManutencao || maintenance.maintenanceType || '-';
           document.getElementById('verifier-name').value = ''; document.getElementById('verification-approved').checked = false; document.getElementById('verification-adjustments').checked = false; document.getElementById('verification-rejected').checked = false; document.getElementById('verification-comments').value = '';
           document.getElementById('verification-form-overlay').style.display = 'block';
         })
         .catch(error => { console.error("Erro abrir form verificação:", error); if(typeof Utilities !== 'undefined') Utilities.showNotification("Erro carregar dados: " + error.message, "error"); })
         .finally(() => { if(typeof Utilities !== 'undefined') Utilities.showLoading(false); });
   }

   function closeVerificationForm() { /* ... código inalterado ... */
        document.getElementById('verification-form-overlay').style.display = 'none'; selectedMaintenanceId = null;
   }

   function hasUnsavedChanges() { /* ... código inalterado ... */
        const verifierName = document.getElementById('verifier-name').value; const comments = document.getElementById('verification-comments').value; const resultSelected = document.querySelector('input[name="verification-result"]:checked');
        return verifierName.trim() !== '' || comments.trim() !== '' || resultSelected !== null;
   }

   function validateVerificationForm() { /* ... código inalterado ... */
        let isValid = true; let firstInvalidField = null;
        const fieldsToValidate = [ { element: document.getElementById('verifier-name'), name: 'Nome Verificador' }, { element: document.getElementById('verification-comments'), name: 'Comentários' } ];
        fieldsToValidate.forEach(field => { if (!field.element.value.trim()) { field.element.style.borderColor = 'red'; if (!firstInvalidField) { firstInvalidField = field.element; } isValid = false; } else { field.element.style.borderColor = ''; } });
        const resultSelected = document.querySelector('input[name="verification-result"]:checked');
        const resultLabel = document.querySelector('label[for="verification-approved"]')?.parentElement?.querySelector('label'); // Label principal do grupo
        if (!resultSelected) { if(resultLabel) resultLabel.style.color = 'red'; isValid = false; if (!firstInvalidField) { firstInvalidField = document.getElementById('verification-approved'); } }
        else { if(resultLabel) resultLabel.style.color = ''; }
        if (!isValid) { if(typeof Utilities !== 'undefined') Utilities.showNotification("Preencha campos obrigatórios.", "error"); if (firstInvalidField) { firstInvalidField.focus(); } }
        return isValid;
   }

   function submitVerification() { /* ... código inalterado ... */
       if (!selectedMaintenanceId) { if(typeof Utilities !== 'undefined') Utilities.showNotification("ID manutenção não identificado.", "error"); return; }
       if(typeof Utilities !== 'undefined') Utilities.showLoading(true, 'Enviando...');
       const data = { maintenanceId: selectedMaintenanceId, verifier: document.getElementById('verifier-name').value, result: document.querySelector('input[name="verification-result"]:checked').value, comments: document.getElementById('verification-comments').value };
       API.saveVerification(data)
         .then(response => {
           if (response.success) { if(typeof Utilities !== 'undefined') Utilities.showNotification("Verificação realizada!", "success"); closeVerificationForm(); loadVerificationData(true); if (typeof Dashboard !== 'undefined' && Dashboard.loadDashboardData) { Dashboard.loadDashboardData(); } }
           else { console.error("Erro salvar verificação:", response); if(typeof Utilities !== 'undefined') Utilities.showNotification("Erro salvar verificação: " + (response.message || "Erro"), "error"); }
         })
         .catch(error => { console.error("Erro enviar verificação:", error); if(typeof Utilities !== 'undefined') Utilities.showNotification("Erro salvar verificação: " + error.message, "error"); })
         .finally(() => { if(typeof Utilities !== 'undefined') Utilities.showLoading(false); });
   }

   function viewMaintenanceDetails(id) { /* ... código inalterado (usa função global) ... */
        // Idealmente chamar Utilities.viewMaintenanceDetails(id)
        if (typeof Utilities !== 'undefined' && Utilities.viewMaintenanceDetails) {
            Utilities.viewMaintenanceDetails(id);
        } else {
            console.error("Função Utilities.viewMaintenanceDetails não encontrada.");
            alert(`Visualizar detalhes ID ${id} (implementar fallback)`);
        }
   }

  // ... (renderMaintenanceDetails não precisa estar aqui, deve ser global/utility) ...

  // API pública
  return {
    initialize,
    loadVerificationData,
    openVerificationForm,
    closeVerificationForm
    // Não precisa expor as outras funções internas
  };
})();

// REMOVER O LISTENER ABAIXO:
/*
document.addEventListener('DOMContentLoaded', function() {
  Verification.initialize();
});
*/
