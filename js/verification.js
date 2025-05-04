// Verificar dependências
if (!window.API || !window.Utilities) {
    console.error("Erro CRÍTICO: Dependências API ou Utilities não carregadas antes de verification.js");
    // Considerar lançar um erro ou parar a execução se as dependências são essenciais
    // throw new Error("Dependências não carregadas para verification.js");
} else {
    console.log("Verification.js - Dependências parecem carregadas.");
}

const Verification = (() => {
    let verificationList = []; // Lista completa de manutenções para verificação
    let searchTerm = ''; // Termo de busca atual
    // selectedMaintenanceId é usado pelo formulário de verificação
    let selectedMaintenanceId = null;

    // --- START: Funções dos Filtros Inteligentes ---

    function createVerificationFilters() {
        const filterContainer = document.getElementById('verification-filter-buttons'); // Container para os botões/filtros
        const searchContainer = document.getElementById('verification-search-container'); // Container da barra de busca (opcional, para posicionamento)

        if (!filterContainer) {
            console.warn("Container de filtros '#verification-filter-buttons' não encontrado. Filtros inteligentes não serão criados.");
            return;
        }

        // Limpa container antigo (caso haja algo, como os botões de filtro antigos)
        filterContainer.innerHTML = '';

        // Cria o novo container para os filtros inteligentes
        const smartFilterDiv = document.createElement('div');
        smartFilterDiv.className = 'smart-filter-container'; // Classe para estilização geral
        smartFilterDiv.innerHTML = `
            <div class="filter-group">
                <label for="verification-status-filter" class="filter-label"><i class="fas fa-filter filter-icon"></i>Status:</label>
                <select id="verification-status-filter" class="filter-dropdown">
                    <option value="all">Todos</option>
                    <option value="pending" selected>Pendentes</option> {/* Default: Pendentes */}
                    <option value="verified">Verificados</option>
                    <option value="completed">Concluídos</option>
                </select>
            </div>

            <div class="filter-group">
                <label for="verification-type-filter" class="filter-label"><i class="fas fa-tools filter-icon"></i>Tipo:</label>
                <select id="verification-type-filter" class="filter-dropdown">
                    <option value="all">Todos os Tipos</option>
                    <option value="preventiva">Preventiva</option>
                    <option value="corretiva">Corretiva</option>
                    <option value="emergencial">Emergencial</option>
                    {/* Adicionar outros tipos se necessário */}
                </select>
            </div>

            <div class="date-filter-group filter-group">
                <label class="filter-label"><i class="fas fa-calendar-alt filter-icon"></i>Período:</label>
                <input type="date" id="verification-date-from" class="filter-dropdown" aria-label="Data De">
                <span class="date-separator">até</span>
                <input type="date" id="verification-date-to" class="filter-dropdown" aria-label="Data Até">
            </div>

            <div class="filter-actions">
                <button id="apply-verification-filter" class="smart-filter-button apply-button" title="Aplicar filtros selecionados">
                    <i class="fas fa-search"></i> Filtrar
                </button>
                <button id="reset-verification-filter" class="smart-filter-button reset-button" title="Limpar filtros e redefinir para pendentes">
                    <i class="fas fa-undo"></i> Limpar
                </button>
            </div>
        `;

        // Adiciona os filtros antes ou depois da busca, dependendo do layout desejado
        // Exemplo: Adiciona antes da busca se o container da busca existir
        if (searchContainer && searchContainer.parentNode === filterContainer.parentNode) {
             filterContainer.parentNode.insertBefore(smartFilterDiv, searchContainer);
        } else {
            // Se não houver container de busca ou estiver em local diferente, apenas adiciona no container de filtros
            filterContainer.appendChild(smartFilterDiv);
        }


        // Configurar listeners para os botões dos filtros
        setupVerificationFilterListeners();
    }

    function setupVerificationFilterListeners() {
        const applyBtn = document.getElementById('apply-verification-filter');
        const resetBtn = document.getElementById('reset-verification-filter');

        if (applyBtn) {
            // Remover listener antigo para evitar duplicação se a função for chamada novamente
            applyBtn.removeEventListener('click', handleApplyFilterClick);
            applyBtn.addEventListener('click', handleApplyFilterClick);
        }

        if (resetBtn) {
            // Remover listener antigo
            resetBtn.removeEventListener('click', handleResetFilterClick);
            resetBtn.addEventListener('click', handleResetFilterClick);
        }

        // Opcional: Adicionar listeners para Enter nos inputs de data para aplicar filtro
        const dateFromInput = document.getElementById('verification-date-from');
        const dateToInput = document.getElementById('verification-date-to');
        if(dateFromInput) dateFromInput.addEventListener('keypress', handleDateInputKeyPress);
        if(dateToInput) dateToInput.addEventListener('keypress', handleDateInputKeyPress);
    }

    function handleApplyFilterClick() {
        applyFiltersAndRender(); // Aplica os filtros atuais e renderiza

        // Feedback visual (opcional)
        const applyBtn = document.getElementById('apply-verification-filter');
        if(applyBtn){
            const originalText = '<i class="fas fa-search"></i> Filtrar';
            applyBtn.innerHTML = '<i class="fas fa-check"></i> Aplicado';
            applyBtn.disabled = true;
            setTimeout(() => {
                applyBtn.innerHTML = originalText;
                applyBtn.disabled = false;
            }, 1500);
        }
    }

    function handleResetFilterClick() {
        // Resetar valores dos controles para o padrão
        const statusFilter = document.getElementById('verification-status-filter');
        const typeFilter = document.getElementById('verification-type-filter');
        const dateFrom = document.getElementById('verification-date-from');
        const dateTo = document.getElementById('verification-date-to');
        const searchInput = document.getElementById('verification-search'); // Resetar busca também

        if (statusFilter) statusFilter.value = 'pending'; // Padrão é 'pendentes'
        if (typeFilter) typeFilter.value = 'all';
        if (dateFrom) dateFrom.value = '';
        if (dateTo) dateTo.value = '';
        if (searchInput) searchInput.value = ''; // Limpa o campo de busca
        searchTerm = ''; // Limpa a variável de busca interna

        // Aplicar os filtros padrão e renderizar
        applyFiltersAndRender();

        // Feedback visual (opcional)
        const resetBtn = document.getElementById('reset-verification-filter');
        if(resetBtn){
            const originalText = '<i class="fas fa-undo"></i> Limpar';
            resetBtn.innerHTML = '<i class="fas fa-check"></i> Limpo';
            resetBtn.disabled = true;
            setTimeout(() => {
                resetBtn.innerHTML = originalText;
                resetBtn.disabled = false;
            }, 1500);
        }
    }

     function handleDateInputKeyPress(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevenir submit de formulário se houver
            handleApplyFilterClick(); // Aplicar filtros ao pressionar Enter
        }
    }


    /**
     * Função central que lê todos os filtros (status, tipo, data, busca)
     * e aplica-os à lista completa (verificationList), depois atualiza a Tabela.
     */
    function applyFiltersAndRender() {
        // Ler valores atuais dos filtros
        const statusFilter = document.getElementById('verification-status-filter')?.value || 'all';
        const typeFilter = document.getElementById('verification-type-filter')?.value || 'all';
        const dateFrom = document.getElementById('verification-date-from')?.value || '';
        const dateTo = document.getElementById('verification-date-to')?.value || '';
        // A variável searchTerm já é atualizada pelo handleSearchInput (debounced)

        console.log(`Aplicando filtros: Status=${statusFilter}, Tipo=${typeFilter}, De=${dateFrom}, Até=${dateTo}, Busca=${searchTerm}`);

        let filteredList = verificationList; // Começa com a lista completa

        // 1. Filtrar por Status
        if (statusFilter && statusFilter !== 'all') {
            filteredList = filteredList.filter(item => {
                const itemStatus = (item.status || 'Pendente').toLowerCase().trim();
                // Mapeamento mais robusto de status
                switch (statusFilter) {
                    case 'pending':
                        // Considerar variações como 'aguardando verificação', etc.
                        return ['pendente', 'aguardando verificação'].includes(itemStatus);
                    case 'verified':
                        // Status que indicam que *houve* uma verificação (aprovado, reprovado, ajustes)
                        return ['verificado', 'aprovado', 'reprovado', 'ajustes necessários', 'ajustes'].includes(itemStatus);
                    case 'completed':
                        // Status finais após verificação e possíveis ajustes
                        return ['concluído', 'concluido', 'finalizado'].includes(itemStatus);
                    default:
                        return true; // Caso 'all' ou inesperado
                }
            });
        }

        // 2. Filtrar por Tipo de Manutenção
        if (typeFilter && typeFilter !== 'all') {
            filteredList = filteredList.filter(item => {
                const itemType = (item.tipoManutencao || '').toLowerCase().trim();
                // Usar includes para permitir correspondências parciais se necessário, ou === para exato
                return itemType === typeFilter.toLowerCase();
                // Ou: return itemType.includes(typeFilter.toLowerCase());
            });
        }

        // 3. Filtrar por Período (Data da Manutenção)
        if (dateFrom || dateTo) {
            const fromDate = dateFrom ? new Date(dateFrom + 'T00:00:00') : null; // Adiciona hora para evitar problemas de fuso
            const toDate = dateTo ? new Date(dateTo + 'T23:59:59.999') : null; // Inclui todo o dia final

             if (fromDate && isNaN(fromDate.getTime())) { console.warn("Data 'De' inválida:", dateFrom); }
             if (toDate && isNaN(toDate.getTime())) { console.warn("Data 'Até' inválida:", dateTo); }


            filteredList = filteredList.filter(item => {
                // Tentar várias datas possíveis se a estrutura variar
                const itemDateStr = item.dataManutencao || item.dataRegistro || item.date;
                if (!itemDateStr) return false; // Sem data, não pode ser filtrado por período

                try {
                     // Tentar parsear a data. Ajustar formato se necessário.
                     // Assumindo formato 'YYYY-MM-DD' ou que new Date() consegue parsear
                    const itemDate = new Date(itemDateStr);
                     if (isNaN(itemDate.getTime())) { return false; } // Data inválida no item

                    let match = true;
                    if (fromDate && !isNaN(fromDate.getTime()) && itemDate < fromDate) {
                        match = false;
                    }
                    if (match && toDate && !isNaN(toDate.getTime()) && itemDate > toDate) {
                        match = false;
                    }
                    return match;

                } catch (e) {
                    console.error("Erro ao parsear data do item:", itemDateStr, e);
                    return false; // Se der erro, exclui do filtro de data
                }
            });
        }

        // 4. Filtrar por Termo de Busca (aplicado sobre o resultado dos filtros anteriores)
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase().trim();
            filteredList = filteredList.filter(item => {
                // Incluir campos relevantes na busca
                const idMatch = String(item.id || '').toLowerCase().includes(searchLower);
                const equipMatch = (item.placaOuId || item.equipmentId || '').toLowerCase().includes(searchLower);
                const respMatch = (item.responsavel || item.technician || '').toLowerCase().includes(searchLower);
                const typeMatch = (item.tipoEquipamento || item.equipmentType || '').toLowerCase().includes(searchLower); // Tipo do Equipamento
                const maintTypeMatch = (item.tipoManutencao || '').toLowerCase().includes(searchLower); // Tipo da Manutenção
                const areaMatch = (item.area || '').toLowerCase().includes(searchLower);
                const localMatch = (item.localOficina || item.location || '').toLowerCase().includes(searchLower);
                const statusMatch = (item.status || '').toLowerCase().includes(searchLower);

                return idMatch || equipMatch || respMatch || typeMatch || maintTypeMatch || areaMatch || localMatch || statusMatch;
            });
        }

        // Renderizar a lista final filtrada
        renderVerificationTable(filteredList);
    }

    // --- END: Funções dos Filtros Inteligentes ---

    function initialize() {
        console.log("Verification.initialize() chamado.");
        // 1. Criar os filtros inteligentes na interface
        createVerificationFilters();
        // 2. Configurar outros event listeners (busca, botões de ação, formulário)
        setupEventListeners();
        // 3. Carregar os dados iniciais (será filtrado para 'pendentes' por padrão)
        loadVerificationData(); // Não força reload aqui, deixa o loadTabContent decidir
    }

    function setupEventListeners() {
        // --- REMOVIDO: Listeners para os filtros antigos ---
        /*
        document.querySelectorAll('#tab-verification .filter-item').forEach(filter => {
             filter.removeEventListener('click', handleFilterClick); // Prevenir duplicação
             // filter.addEventListener('click', handleFilterClick); // NÃO ADICIONAR MAIS
        });
        */

        // Busca (agora integrada com os filtros inteligentes)
        const searchInput = document.getElementById('verification-search');
        if (searchInput) {
            // Usar debounce para performance
            const debouncedHandler = typeof Utilities !== 'undefined' ? Utilities.debounce(handleSearchInput, 350) : (fn, delay) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), delay)} }; // Fallback debounce
            const debouncedSearch = debouncedHandler(() => {
                searchTerm = searchInput.value; // Atualiza a variável global de busca
                applyFiltersAndRender(); // Aplica TODOS os filtros + busca e renderiza
            }, 350);

            searchInput.removeEventListener('input', debouncedSearch); // Garante limpeza
            searchInput.addEventListener('input', debouncedSearch);
        }

        // Botão Refresh (recarrega TUDO da API e aplica filtros)
        const refreshButton = document.getElementById('refresh-verification-list');
         if(refreshButton) {
             refreshButton.removeEventListener('click', refreshData); // Limpa listener antigo
             refreshButton.addEventListener('click', refreshData);
         }

        // Submit Formulário de Verificação
        const verificationForm = document.getElementById('verification-form');
        if(verificationForm) {
            verificationForm.removeEventListener('submit', handleFormSubmit); // Limpa listener antigo
            verificationForm.addEventListener('submit', handleFormSubmit);
        }

        // Botões de Fechar/Cancelar Formulário
         const closeFormButton = document.getElementById('close-verification-form');
         const cancelFormButton = document.getElementById('cancel-verification');
         if (closeFormButton) {
              closeFormButton.removeEventListener('click', handleCloseForm);
              closeFormButton.addEventListener('click', handleCloseForm);
         }
         if (cancelFormButton) {
             cancelFormButton.removeEventListener('click', handleCloseForm);
             cancelFormButton.addEventListener('click', handleCloseForm);
         }

        // Listener para botões na tabela (delegação de eventos)
        // É adicionado/removido dentro de renderVerificationTable para garantir que funcione após cada renderização
        setupTableActionListeners();

    }

     function setupTableActionListeners() {
        const tbody = document.getElementById('verification-tbody');
        if (!tbody) return;

        // Remover listener antigo do container para evitar duplicação
        tbody.removeEventListener('click', handleTableButtonClick);

        // Adicionar novo listener usando delegação
        tbody.addEventListener('click', handleTableButtonClick);
    }

    function handleTableButtonClick(event) {
        const target = event.target.closest('.btn-icon'); // Achar o botão mais próximo que foi clicado
        if (!target) return; // Sai se o clique não foi em um botão com a classe btn-icon

        const id = target.getAttribute('data-id');
        if (!id) return; // Sai se o botão não tem data-id

        if (target.classList.contains('view-maintenance')) {
            // Usar a função global/utility para ver detalhes
            if (typeof Utilities !== 'undefined' && Utilities.viewMaintenanceDetails) {
                Utilities.viewMaintenanceDetails(id);
            } else {
                console.error("Função Utilities.viewMaintenanceDetails não encontrada.");
                alert(`Visualizar detalhes para ID ${id} (Função não encontrada)`);
            }
        } else if (target.classList.contains('verify-maintenance')) {
            openVerificationForm(id); // Abrir o formulário de verificação para este item
        }
    }


    // --- Handlers para listeners (exceto filtros já tratados) ---
     function handleSearchInput() {
        // Esta função é chamada pelo debounce
        const searchInput = document.getElementById('verification-search');
        searchTerm = searchInput ? searchInput.value : '';
        applyFiltersAndRender(); // Re-aplica todos os filtros incluindo a nova busca
     }

    function handleFormSubmit(e) {
        e.preventDefault();
        if (validateVerificationForm()) {
            submitVerification();
        }
    }

    function handleCloseForm() {
        if (hasUnsavedChanges() && !confirm('Você possui dados não salvos neste formulário. Deseja realmente fechar?')) {
            return; // Não fecha se tem alterações e o usuário cancela
        }
        closeVerificationForm();
    }

     function refreshData() {
        // Força o reload da API e depois aplica os filtros atuais
        loadVerificationData(true);
     }

    // --- Fim Handlers ---


    /**
     * Carrega os dados da API.
     * @param {boolean} forceReload - Se true, ignora cache e busca da API novamente.
     */
    function loadVerificationData(forceReload = false) {
        // O parâmetro forceReload não é usado diretamente aqui, mas pode ser útil
        // se houvesse lógica de cache. A chamada à API sempre ocorre.
        console.log("loadVerificationData chamado. forceReload:", forceReload);
        if (typeof Utilities !== 'undefined') Utilities.showLoading(true, 'Carregando verificações...');
        else console.log("Carregando verificações...");

        // Limpar tabela existente enquanto carrega
        const tbody = document.getElementById('verification-tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Carregando...</td></tr>';

        API.getVerificationList()
            .then(response => {
                if (response.success && Array.isArray(response.maintenances)) {
                    verificationList = response.maintenances; // Armazena a lista completa
                    console.log(`${verificationList.length} manutenções para verificação carregadas.`);
                    // Após carregar, aplica os filtros que estão selecionados na UI
                    applyFiltersAndRender();
                } else {
                    console.error("Erro ao carregar lista de verificações:", response);
                    if (typeof Utilities !== 'undefined') Utilities.showNotification("Erro ao carregar verificações: " + (response.message || "Formato de resposta inválido."), "error");
                    verificationList = []; // Limpa a lista em caso de erro
                    applyFiltersAndRender(); // Renderiza a tabela vazia com mensagem
                }
            })
            .catch(error => {
                console.error("Falha na requisição da lista de verificações:", error);
                if (typeof Utilities !== 'undefined') Utilities.showNotification("Falha ao buscar verificações: " + error.message, "error");
                verificationList = [];
                applyFiltersAndRender(); // Renderiza a tabela vazia com mensagem
            })
            .finally(() => {
                if (typeof Utilities !== 'undefined') Utilities.showLoading(false);
            });
    }

    /**
     * Renderiza a tabela HTML com base na lista fornecida.
     * @param {Array} listToRender - A lista de itens (já filtrada) a ser exibida.
     */
    function renderVerificationTable(listToRender) {
        const tbody = document.getElementById('verification-tbody');
        if (!tbody) {
            console.error("Elemento tbody '#verification-tbody' não encontrado para renderizar.");
            return;
        }
        tbody.innerHTML = ''; // Limpa conteúdo anterior

        if (!Array.isArray(listToRender) || listToRender.length === 0) {
            // Nenhuma verificação encontrada após aplicar filtros
            let message = "Nenhuma manutenção encontrada para os filtros aplicados.";
            // Opcional: Mensagem mais específica baseada nos filtros, mas pode ser complexo
            // Ex: Se o filtro de status for 'pending' e a lista vazia: "Nenhuma manutenção pendente encontrada."
            tbody.innerHTML = `<tr><td colspan="9" style="text-align: center;">${message}</td></tr>`;
            return;
        }

        // Cria as linhas da tabela
        listToRender.forEach(item => {
            if (!item) return; // Pular itens nulos ou indefinidos

            const id = item.id || 'N/A';
            const equipmentId = item.placaOuId || item.equipmentId || '-';
            const equipmentType = item.tipoEquipamento || item.equipmentType || '-'; // Tipo do Equipamento
            // Usar helper de data se disponível
            const maintDate = typeof Utilities !== 'undefined' ? Utilities.formatDate(item.dataManutencao || item.date) : (item.dataManutencao || item.date || '-');
            const resp = item.responsavel || item.technician || '-';
            const area = item.area || '-';
            const local = item.localOficina || item.location || '-';
            const status = item.status || 'Pendente';
            // Usar helper de classe de status se disponível
            const statusClass = typeof Utilities !== 'undefined' ? Utilities.getStatusClass(status) : status.toLowerCase().replace(/\s+/g, '-'); // Fallback simples

            const row = document.createElement('tr');
            row.setAttribute('data-item-id', id); // Adiciona ID à linha para referência futura se necessário

            // Colunas da tabela: ID, Equipamento, Tipo Equip., Data Mnt., Responsável, Área, Local, Status, Ações
            row.innerHTML = `
                <td>${id}</td>
                <td>${equipmentId}</td>
                <td>${equipmentType}</td>
                <td>${maintDate}</td>
                <td>${resp}</td>
                <td>${area}</td>
                <td>${local}</td>
                <td><span class="status-badge status-${statusClass}">${Utilities.capitalizeFirstLetter(status)}</span></td>
                <td>
                    <button class="btn-icon view-maintenance" data-id="${id}" title="Ver detalhes da Manutenção ${id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${/* Adiciona botão de verificar APENAS se o status for 'Pendente' */ ''}
                    ${status.toLowerCase() === 'pendente' ?
                        `<button class="btn-icon verify-maintenance" data-id="${id}" title="Iniciar Verificação da Manutenção ${id}">
                            <i class="fas fa-check-circle"></i>
                         </button>` :
                         ''
                    }
                </td>
            `;
            tbody.appendChild(row);
        });

         // Re-adiciona listeners de botão após renderizar (a função setupTableActionListeners já garante que não duplique)
         // Isso não é mais necessário aqui se o listener estiver no tbody e usar delegação.
         // setupTableActionListeners(); // <- Chamada removida daqui, é chamada uma vez em setupEventListeners
    }

    // --- Funções do Formulário de Verificação (sem alterações significativas na lógica interna) ---

    function openVerificationForm(id) {
        console.log(`Abrindo formulário de verificação para ID: ${id}`);
        selectedMaintenanceId = id;
        if (typeof Utilities !== 'undefined') Utilities.showLoading(true, 'Carregando dados da manutenção...');
        else console.log("Carregando dados...");

        // Limpar formulário antes de carregar
        resetVerificationFormFields();

        API.getMaintenanceDetails(id)
            .then(response => {
                if (!response || !response.success || !response.maintenance) {
                    throw new Error(response?.message || 'Detalhes da manutenção não encontrados ou formato inválido.');
                }
                const maintenance = response.maintenance;

                // Preencher campos informativos (não editáveis pelo verificador)
                document.getElementById('verification-id').value = maintenance.id || id;
                document.getElementById('verification-equipment').value = maintenance.placaOuId || maintenance.equipmentId || '-';
                document.getElementById('verification-type').value = maintenance.tipoManutencao || maintenance.maintenanceType || '-';
                // Adicionar mais campos informativos se necessário (e se existirem no HTML)
                // document.getElementById('verification-date-info').textContent = Utilities.formatDateTime(maintenance.dataManutencao);
                // document.getElementById('verification-tech-info').textContent = maintenance.responsavel || '-';

                // Exibir o overlay/modal do formulário
                const formOverlay = document.getElementById('verification-form-overlay');
                 if(formOverlay) formOverlay.style.display = 'flex'; // Usar flex para centralizar, ou 'block'


                // Focar no primeiro campo editável
                const verifierNameInput = document.getElementById('verifier-name');
                if(verifierNameInput) verifierNameInput.focus();


            })
            .catch(error => {
                console.error("Erro ao abrir formulário de verificação:", error);
                if (typeof Utilities !== 'undefined') Utilities.showNotification("Erro ao carregar dados para verificação: " + error.message, "error");
                selectedMaintenanceId = null; // Reseta ID se falhar
            })
            .finally(() => {
                if (typeof Utilities !== 'undefined') Utilities.showLoading(false);
            });
    }

     function resetVerificationFormFields() {
        const form = document.getElementById('verification-form');
        if (form) form.reset(); // Método nativo para limpar campos do form

        // Garantir limpeza de campos que o form.reset() pode não pegar (ex: valores setados via JS)
        const idField = document.getElementById('verification-id');
        const equipField = document.getElementById('verification-equipment');
        const typeField = document.getElementById('verification-type');
        const verifierName = document.getElementById('verifier-name');
        const comments = document.getElementById('verification-comments');
        const resultRadios = document.querySelectorAll('input[name="verification-result"]');
        const errorMessages = form.querySelectorAll('.error-message'); // Limpar mensagens de erro

         if(idField) idField.value = '';
         if(equipField) equipField.value = '-';
         if(typeField) typeField.value = '-';
         if(verifierName) verifierName.value = '';
         if(comments) comments.value = '';
         resultRadios.forEach(radio => radio.checked = false);
         errorMessages.forEach(msg => msg.textContent = ''); // Limpa textos de erro
         form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid')); // Remove classes de erro
    }

    function closeVerificationForm() {
        const formOverlay = document.getElementById('verification-form-overlay');
        if (formOverlay) formOverlay.style.display = 'none';
        resetVerificationFormFields(); // Limpa o formulário ao fechar
        selectedMaintenanceId = null; // Limpa o ID selecionado
        console.log("Formulário de verificação fechado.");
    }

    function hasUnsavedChanges() {
        // Verifica se algum campo editável foi preenchido ou selecionado
        const verifierName = document.getElementById('verifier-name')?.value || '';
        const comments = document.getElementById('verification-comments')?.value || '';
        const resultSelected = document.querySelector('input[name="verification-result"]:checked');

        return verifierName.trim() !== '' || comments.trim() !== '' || resultSelected !== null;
    }

    function validateVerificationForm() {
        let isValid = true;
        let firstInvalidField = null;
        const form = document.getElementById('verification-form');
        if(!form) return false;

        // Limpar erros anteriores
        form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        form.querySelectorAll('.error-message').forEach(el => el.textContent = '');

        // 1. Validar Nome do Verificador
        const verifierNameInput = document.getElementById('verifier-name');
        if (!verifierNameInput || !verifierNameInput.value.trim()) {
            isValid = false;
            verifierNameInput?.classList.add('is-invalid');
            document.getElementById('verifier-name-error')?.textContent = 'Nome do verificador é obrigatório.';
            if (!firstInvalidField) firstInvalidField = verifierNameInput;
        }

        // 2. Validar Seleção de Resultado (Aprovado/Ajustes/Reprovado)
        const resultSelected = document.querySelector('input[name="verification-result"]:checked');
        const resultGroup = document.querySelector('.verification-result-group'); // Container dos radios
        if (!resultSelected) {
            isValid = false;
            resultGroup?.classList.add('is-invalid'); // Indicar erro no grupo
             document.getElementById('verification-result-error')?.textContent = 'Selecione um resultado para a verificação.';
            // Define o foco no primeiro radio do grupo se for o primeiro erro
            if (!firstInvalidField) firstInvalidField = document.getElementById('verification-approved');
        } else {
            resultGroup?.classList.remove('is-invalid'); // Remove erro do grupo se selecionado
             document.getElementById('verification-result-error').textContent = '';
        }


        // 3. Validar Comentários (Obrigatório se Reprovado ou Ajustes?) - Ajustar regra conforme necessário
        const commentsInput = document.getElementById('verification-comments');
         const selectedValue = resultSelected?.value;
         // Exemplo: Comentário obrigatório se 'ajustes' ou 'reprovado'
         if ((selectedValue === 'ajustes' || selectedValue === 'reprovado') && (!commentsInput || !commentsInput.value.trim())) {
               isValid = false;
               commentsInput?.classList.add('is-invalid');
               document.getElementById('verification-comments-error')?.textContent = 'Comentários são obrigatórios para "Ajustes" ou "Reprovado".';
               if (!firstInvalidField) firstInvalidField = commentsInput;
         }


        if (!isValid) {
            if (typeof Utilities !== 'undefined') Utilities.showNotification("Por favor, corrija os campos indicados.", "warning");
            if (firstInvalidField) {
                firstInvalidField.focus(); // Foca no primeiro campo inválido
                 // Opcional: Scroll para o campo se estiver fora da tela
                 // firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        return isValid;
    }

    function submitVerification() {
        if (!selectedMaintenanceId) {
            if (typeof Utilities !== 'undefined') Utilities.showNotification("ID da manutenção não encontrado. Não foi possível salvar.", "error");
            return;
        }

        if (typeof Utilities !== 'undefined') Utilities.showLoading(true, 'Salvando verificação...');
        else console.log("Salvando verificação...");

        // Coletar dados do formulário
        const verifierName = document.getElementById('verifier-name').value;
        const resultRadio = document.querySelector('input[name="verification-result"]:checked');
        const resultValue = resultRadio ? resultRadio.value : null; // Ex: 'aprovado', 'ajustes', 'reprovado'
        const comments = document.getElementById('verification-comments').value;

         // Verificar se o resultado foi selecionado (embora a validação já devesse pegar)
         if (!resultValue) {
              if (typeof Utilities !== 'undefined') {
                   Utilities.showNotification("Resultado da verificação não selecionado.", "error");
                   Utilities.showLoading(false);
              }
              return;
         }

        const verificationData = {
            maintenanceId: selectedMaintenanceId,
            verifier: verifierName,
            result: resultValue, // 'aprovado', 'ajustes', 'reprovado'
            comments: comments,
            verificationDate: new Date().toISOString() // Adiciona data/hora da verificação
        };

        console.log("Enviando dados da verificação:", verificationData);

        API.saveVerification(verificationData)
            .then(response => {
                if (response.success) {
                    if (typeof Utilities !== 'undefined') Utilities.showNotification("Verificação salva com sucesso!", "success");
                    closeVerificationForm(); // Fecha o formulário
                    loadVerificationData(true); // Recarrega a lista para refletir a mudança de status
                    // Opcional: Atualizar outros componentes (ex: Dashboard) se necessário
                    if (typeof Dashboard !== 'undefined' && Dashboard.loadDashboardData) {
                        console.log("Atualizando dados do Dashboard após verificação.");
                        Dashboard.loadDashboardData();
                    }
                } else {
                    console.error("Erro ao salvar verificação (API):", response);
                    if (typeof Utilities !== 'undefined') Utilities.showNotification("Erro ao salvar verificação: " + (response.message || "Erro desconhecido da API."), "error");
                }
            })
            .catch(error => {
                console.error("Falha na requisição para salvar verificação:", error);
                if (typeof Utilities !== 'undefined') Utilities.showNotification("Falha ao conectar com o servidor para salvar: " + error.message, "error");
            })
            .finally(() => {
                if (typeof Utilities !== 'undefined') Utilities.showLoading(false);
            });
    }

    // --- Fim Funções do Formulário ---


    // --- API Pública do Módulo ---
    return {
        initialize: initialize,           // Para ser chamado quando a aba é carregada
        loadVerificationData: loadVerificationData // Pode ser chamado externamente para recarregar
        // Não é necessário expor open/close/submit do form, pois são acionados internamente por botões
        // Não precisa expor as funções de filtro, são internas
    };
})();

// --- IMPORTANTE ---
// REMOVER a inicialização automática no DOMContentLoaded.
// A inicialização deve ser feita pelo script principal que gerencia as abas,
// tipicamente quando a aba "Verificações" é clicada/ativada.
/*
document.addEventListener('DOMContentLoaded', function() {
  // Verification.initialize(); // <<< REMOVER ESTA LINHA >>>
});
*/

console.log("Módulo Verification carregado e pronto.");
