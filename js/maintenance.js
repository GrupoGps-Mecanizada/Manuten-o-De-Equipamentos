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
  let formData = {};
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
      // Carregar lista de manutenções
      loadMaintenanceList();
  }

  // Carrega dados que dependem da API
  function loadDropdownData() {
    loadEquipmentTypes(); // Carrega lista de NOMES de tipos
    loadProblemCategories(); // Carrega lista de categorias
  }

  // Configura listeners para elementos FIXOS do formulário
  function setupFormEventListeners() {
    console.log("Configurando listeners do formulário...");

    // Usar função melhorada para adicionar listener de forma segura
    addSafeListener('new-maintenance', 'click', openMaintenanceForm);
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
        console.log("Listener de submit adicionado ao formulário");
    } else {
        console.warn("Elemento #maintenance-form não encontrado!");
    }

    const problemCategorySelect = document.getElementById('problem-category');
    if (problemCategorySelect) {
        problemCategorySelect.removeEventListener('change', handleProblemCategoryChange);
        problemCategorySelect.addEventListener('change', handleProblemCategoryChange);
    }

    const equipmentTypeSelect = document.getElementById('equipment-type');
    if (equipmentTypeSelect) {
        equipmentTypeSelect.removeEventListener('change', handleEquipmentTypeChange);
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
          const debouncedHandler = typeof Utilities !== 'undefined' && Utilities.debounce ? 
                                   Utilities.debounce(handleSearchInput, 300) : 
                                   debounce(handleSearchInput, 300);
          searchInput.removeEventListener('input', debouncedHandler); // Prevenir duplicação no input
          searchInput.addEventListener('input', debouncedHandler);
      }
      const filterItems = document.querySelectorAll('#tab-maintenance .filter-container .filter-item');
      filterItems.forEach(item => {
          // Remover listener existente antes de adicionar novo
          item.removeEventListener('click', handleFilterClick);
          item.addEventListener('click', handleFilterClick);
          console.log(`Listener de click configurado para filtro: ${item.textContent?.trim() || 'desconhecido'}`);
      });
  }

  // Função auxiliar para adicionar listeners de forma segura (evita duplicados)
  function addSafeListener(elementId, eventType, handler) {
      const element = document.getElementById(elementId);
      if (element) {
          // Remover explicitamente qualquer listener anterior
          element.removeEventListener(eventType, handler);
          // Adicionar o novo listener
          element.addEventListener(eventType, handler);
          console.log(`Listener '${eventType}' adicionado com segurança para #${elementId}`);
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

  // --- Funções de Abertura/Fechamento/Reset ---
  function openMaintenanceForm(maintenanceId = null, dataToEdit = null) {
    console.log(`Abrindo formulário de manutenção${maintenanceId ? ` para edição (ID: ${maintenanceId})` : ''}`);
    
    // Reset do formulário
    resetForm();
    
    // Preparar para edição se ID e dados fornecidos
    if (maintenanceId && dataToEdit) {
        isEditMode = true;
        editingMaintenanceId = maintenanceId;
        populateFormForEdit(dataToEdit);
    } else {
        isEditMode = false;
        editingMaintenanceId = null;
    }
    
    // Mostrar o formulário modal
    const formModal = document.getElementById('maintenance-form-modal');
    if (formModal) {
        formModal.style.display = 'block';
        // Animar entrada se necessário
        formModal.classList.add('active');
        // Focar no primeiro campo
        setTimeout(() => {
            document.getElementById('maintenance-type')?.focus();
        }, 100);
    } else {
        console.error("Elemento #maintenance-form-modal não encontrado!");
    }
    
    // Sempre iniciar na etapa 1
    showStep(1);
    
    // Atualizar título do formulário
    const formTitle = document.getElementById('maintenance-form-title');
    if (formTitle) {
        formTitle.textContent = isEditMode ? 'Editar Manutenção' : 'Nova Manutenção';
    }
  }

  function populateFormForEdit(data) {
    // Implementação da função para preencher formulário para edição
    console.log("Populando formulário para edição com dados:", data);
    
    // Preencher campos da Etapa 1
    setSelectValue('maintenance-type', data.tipoManutencao);
    setSelectValue('equipment-type', data.tipoEquipamento);
    
    // Aguardar para que o change event do tipo de equipamento seja processado
    setTimeout(() => {
        if (data.tipoEquipamento === 'Outro') {
            const otherEquipmentInput = document.getElementById('other-equipment');
            if (otherEquipmentInput) otherEquipmentInput.value = data.equipamentoOutro || '';
        } else if (['Aspirador', 'Poliguindaste'].includes(data.tipoEquipamento)) {
            const customIdInput = document.getElementById('custom-equipment-id');
            if (customIdInput) customIdInput.value = data.placaOuId || '';
        } else {
            setSelectValue('equipment-id', data.placaOuId);
        }
        
        // Demais campos da Etapa 1
        setSelectValue('maintenance-area', data.area);
        document.getElementById('maintenance-location')?.value = data.localOficina || '';
        document.getElementById('maintenance-responsible')?.value = data.responsavel || '';
        document.getElementById('is-critical')?.checked = data.eCritico || false;
        
        // Preencher campos da Etapa 2 (chamada após preenchimento da Etapa 1)
        setTimeout(() => {
            setSelectValue('problem-category', data.categoriaProblema);
            // Verificar se é "Outro" para preencher campo adicional
            if (data.categoriaProblema === 'Outro') {
                document.getElementById('other-problem-category')?.value = data.categoriaProblemaOutro || '';
            }
            document.getElementById('problem-details')?.value = data.detalhesproblema || '';
            document.getElementById('maintenance-notes')?.value = data.observacoes || '';
        }, 100);
        
    }, 100);
    
    // Armazenar dados para uso posterior
    formData = { ...data };
  }

  function setSelectValue(selectId, value) {
    const select = document.getElementById(selectId);
    if (!select) {
        console.warn(`Select #${selectId} não encontrado para definir valor ${value}`);
        return;
    }
    
    // Verificar se o valor existe nas opções
    let optionFound = false;
    for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value === value) {
            select.selectedIndex = i;
            optionFound = true;
            break;
        }
    }
    
    if (!optionFound && value) {
        console.warn(`Valor "${value}" não encontrado nas opções de #${selectId}`);
    }
    
    // Disparar evento change para atualizar dependências
    const event = new Event('change', { bubbles: true });
    select.dispatchEvent(event);
  }

  function closeForm() {
    console.log("Fechando formulário");
    const formModal = document.getElementById('maintenance-form-modal');
    if (formModal) {
        // Animar saída se necessário
        formModal.classList.remove('active');
        // Após animação, esconder
        setTimeout(() => {
            formModal.style.display = 'none';
            resetForm();
        }, 300);
    }
  }

  function resetForm() {
    console.log("Resetando formulário");
    
    // Limpar estados
    isEditMode = false;
    editingMaintenanceId = null;
    formData = {};
    
    // Resetar formulário HTML
    const form = document.getElementById('maintenance-form');
    if (form) form.reset();
    
    // Limpar campos específicos que podem não ser limpos pelo reset()
    document.querySelectorAll('#maintenance-form input[type="text"], #maintenance-form textarea').forEach(el => {
        el.value = '';
    });
    
    // Limpar validações
    clearValidationErrors(1);
    clearValidationErrors(2);
    
    // Resetar dropdowns específicos
    const equipmentIdSelect = document.getElementById('equipment-id');
    if (equipmentIdSelect) {
        equipmentIdSelect.innerHTML = '<option value="">Selecione</option>';
        equipmentIdSelect.disabled = true;
    }
    
    // Esconder elementos condicionais
    const otherEquipmentField = document.getElementById('other-equipment-field');
    if (otherEquipmentField) otherEquipmentField.style.display = 'none';
    
    const customEquipmentField = document.getElementById('custom-equipment-field');
    if (customEquipmentField) customEquipmentField.style.display = 'none';
    
    const otherProblemField = document.getElementById('other-problem-field');
    if (otherProblemField) otherProblemField.style.display = 'none';
    
    // Voltar para etapa 1
    showStep(1);
  }

  // --- Funções de Carregamento de Dados ---
  function loadEquipmentTypes() {
    console.log("Carregando tipos de equipamentos...");
    
    const select = document.getElementById('equipment-type');
    if (!select) {
        console.error("Elemento #equipment-type não encontrado!");
        return;
    }
    
    // Limpar opções existentes
    select.innerHTML = '<option value="">Selecione o Tipo</option>';
    
    // Tentar carregar da API
    if (window.API && typeof API.getEquipmentTypes === 'function') {
        API.getEquipmentTypes()
            .then(response => {
                if (response && response.success && Array.isArray(response.types)) {
                    // Adicionar opções retornadas pela API
                    response.types.forEach(type => {
                        const option = document.createElement('option');
                        option.value = type;
                        option.textContent = type;
                        select.appendChild(option);
                    });
                    console.log(`${response.types.length} tipos de equipamento carregados da API`);
                } else {
                    console.warn("Resposta da API inválida, usando fallback para tipos de equipamento");
                    loadDefaultEquipmentTypes();
                }
            })
            .catch(error => {
                console.error("Erro ao carregar tipos de equipamento:", error);
                loadDefaultEquipmentTypes();
            });
    } else {
        console.warn("API.getEquipmentTypes não disponível, usando fallback");
        loadDefaultEquipmentTypes();
    }
  }

  function loadDefaultEquipmentTypes() {
    // Lista padrão de tipos de equipamento
    const defaultTypes = [
        "Alta Pressão",
        "Auto Vácuo / Hiper Vácuo",
        "Aspirador",
        "Poliguindaste",
        "Outro"
    ];
    
    const select = document.getElementById('equipment-type');
    if (!select) {
        console.error("Elemento #equipment-type não encontrado!");
        return;
    }
    
    // Limpar e adicionar opções
    select.innerHTML = '<option value="">Selecione o Tipo</option>';
    defaultTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        select.appendChild(option);
    });
    
    console.log(`${defaultTypes.length} tipos de equipamento carregados (padrão)`);
  }

  function setupEquipmentTypeVisuals(selectedType) {
    console.log(`Configurando visuais para tipo de equipamento: "${selectedType}"`);
    
    const equipmentIdSelectField = document.getElementById('equipment-id-field');
    const otherEquipmentField = document.getElementById('other-equipment-field');
    const customEquipmentField = document.getElementById('custom-equipment-field');
    const equipmentIdSelect = document.getElementById('equipment-id');
    
    // Esconder todos os campos primeiro
    if (equipmentIdSelectField) equipmentIdSelectField.style.display = 'none';
    if (otherEquipmentField) otherEquipmentField.style.display = 'none';
    if (customEquipmentField) customEquipmentField.style.display = 'none';
    
    // Desabilitar select para evitar envio de dados inválidos
    if (equipmentIdSelect) equipmentIdSelect.disabled = true;
    
    // Mostrar campo apropriado baseado na seleção
    if (selectedType === 'Outro') {
        if (otherEquipmentField) {
            otherEquipmentField.style.display = 'block';
            // Focar no campo para entrada rápida
            setTimeout(() => document.getElementById('other-equipment')?.focus(), 100);
        }
    } else if (selectedType === 'Aspirador' || selectedType === 'Poliguindaste') {
        if (customEquipmentField) {
            // Atualizar label para refletir o tipo selecionado
            const label = customEquipmentField.querySelector('label');
            if (label) label.textContent = `Identificação ${selectedType}:`;
            
            customEquipmentField.style.display = 'block';
            // Focar no campo para entrada rápida
            setTimeout(() => document.getElementById('custom-equipment-id')?.focus(), 100);
        }
    } else if (selectedType) {
        // Para outros tipos com IDs pré-definidos
        if (equipmentIdSelectField) equipmentIdSelectField.style.display = 'block';
        if (equipmentIdSelect) equipmentIdSelect.disabled = false;
    }
  }

  function populateEquipmentIds(selectedType) {
    console.log(`Populando IDs para tipo de equipamento: "${selectedType}"`);
    
    const select = document.getElementById('equipment-id');
    if (!select) {
        console.error("Elemento #equipment-id não encontrado!");
        return;
    }
    
    // Limpar opções existentes
    select.innerHTML = '<option value="">Selecione o ID/Placa</option>';
    
    // Se não há tipo selecionado ou é tipo especial, desabilitar select
    if (!selectedType || selectedType === 'Outro' || selectedType === 'Aspirador' || selectedType === 'Poliguindaste') {
        select.disabled = true;
        return;
    }
    
    // Buscar IDs da lista local
    const ids = EQUIPMENT_IDS[selectedType] || [];
    
    if (ids.length > 0) {
        // Adicionar IDs ao select
        ids.forEach(id => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = id;
            select.appendChild(option);
        });
        select.disabled = false;
        console.log(`${ids.length} IDs carregados para tipo ${selectedType}`);
    } else {
        console.warn(`Nenhum ID encontrado para tipo ${selectedType}`);
        select.disabled = true;
    }
  }

  function loadProblemCategories() {
    console.log("Carregando categorias de problemas...");
    
    // Verificar se já carregado
    if (loadProblemCategories.loaded) {
        console.log("Categorias de problemas já carregadas anteriormente");
        return;
    }
    
    const select = document.getElementById('problem-category');
    if (!select) {
        console.error("Elemento #problem-category não encontrado!");
        return;
    }
    
    // Limpar opções existentes
    select.innerHTML = '<option value="">Selecione a Categoria</option>';
    
    // Lista padrão (fallback)
    const defaultCategories = [
        "Elétrico",
        "Mecânico",
        "Hidráulico",
        "Estrutural",
        "Software",
        "Operacional",
        "Outro"
    ];
    
    // Tentar carregar da API
    if (window.API && typeof API.getProblemCategories === 'function') {
        API.getProblemCategories()
            .then(response => {
                if (response && response.success && Array.isArray(response.categories)) {
                    // Adicionar opções retornadas pela API
                    response.categories.forEach(category => {
                        const option = document.createElement('option');
                        option.value = category;
                        option.textContent = category;
                        select.appendChild(option);
                    });
                    console.log(`${response.categories.length} categorias de problemas carregadas da API`);
                    loadProblemCategories.loaded = true;
                } else {
                    console.warn("Resposta da API inválida, usando categorias padrão");
                    // Usar fallback
                    defaultCategories.forEach(category => {
                        const option = document.createElement('option');
                        option.value = category;
                        option.textContent = category;
                        select.appendChild(option);
                    });
                    console.log(`${defaultCategories.length} categorias de problemas carregadas (padrão)`);
                    loadProblemCategories.loaded = true;
                }
            })
            .catch(error => {
                console.error("Erro ao carregar categorias de problemas:", error);
                // Usar fallback
                defaultCategories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    select.appendChild(option);
                });
                console.log(`${defaultCategories.length} categorias de problemas carregadas (padrão)`);
                loadProblemCategories.loaded = true;
            });
    } else {
        console.warn("API.getProblemCategories não disponível, usando categorias padrão");
        // Usar fallback
        defaultCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
        console.log(`${defaultCategories.length} categorias de problemas carregadas (padrão)`);
        loadProblemCategories.loaded = true;
    }
  }

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
       
       // Aplicar filtro por status
       if (currentFilter !== 'all') {
           const statusMap = {
               'pending': ['pendente', 'aguardando verificacao', 'aguardando verificação'],
               'verified': ['verificado'],
               'completed': ['concluído', 'concluido'],
               'critical': [] // Filtragem especial abaixo
           };
           
           if (currentFilter === 'critical') {
               // Filtrar itens críticos independente do status
               filteredList = filteredList.filter(item => item.eCritico || item.isCritical);
           } else if (statusMap[currentFilter]) {
               // Filtrar por status mapeado
               filteredList = filteredList.filter(item => {
                   const itemStatus = (item.status || '').toLowerCase().trim();
                   return statusMap[currentFilter].includes(itemStatus);
               });
           }
       }
       
       // Aplicar termo de busca
       if (currentSearchTerm) {
           const searchLower = currentSearchTerm.toLowerCase();
           filteredList = filteredList.filter(item => {
               // Buscar em campos relevantes
               return (
                   (item.id || '').toLowerCase().includes(searchLower) ||
                   (item.tipoEquipamento || '').toLowerCase().includes(searchLower) ||
                   (item.placaOuId || '').toLowerCase().includes(searchLower) ||
                   (item.responsavel || '').toLowerCase().includes(searchLower) ||
                   (item.area || '').toLowerCase().includes(searchLower) ||
                   (item.localOficina || '').toLowerCase().includes(searchLower) ||
                   (item.categoriaProblema || '').toLowerCase().includes(searchLower) ||
                   (item.detalhesproblema || '').toLowerCase().includes(searchLower)
               );
           });
       }
       
       // Renderizar lista filtrada
       renderMaintenanceTable(filteredList);
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
        console.log("Botão Próximo (Step 1) clicado. Validando Etapa 1...");
        
        // Adicionar try/catch para capturar erros na validação
        try {
            const isValid = validateStep1();
            console.log("Resultado da validação Etapa 1:", isValid);
            
            if (isValid) {
                console.log("Validação Etapa 1: OK");
                saveStep1Data();
                showStep(2);
                
                // Verificar se o elemento problem-category existe
                const problemCategory = document.getElementById('problem-category');
                if (problemCategory) {
                    problemCategory.focus();
                    console.log("Foco definido para problem-category");
                } else {
                    console.warn("Elemento problem-category não encontrado para definir foco");
                }
            } else {
                console.log("Validação Etapa 1: FALHOU");
                if(typeof Utilities !== 'undefined') {
                    Utilities.showNotification("Verifique os campos obrigatórios da Etapa 1.", "warning");
                }
            }
        } catch (error) {
            console.error("Erro ao validar Etapa 1:", error);
            if(typeof Utilities !== 'undefined') {
                Utilities.showNotification("Erro ao processar o formulário: " + error.message, "error");
            }
        }
   }

   function handleNextToStep3() {
        console.log("Botão Próximo (Step 2) clicado. Validando Etapa 2...");
        
        try {
            const isValid = validateStep2();
            console.log("Resultado da validação Etapa 2:", isValid);
            
            if (isValid) {
                console.log("Validação Etapa 2: OK");
                saveStep2Data();
                updateSummary();
                showStep(3);
                
                const submitButton = document.getElementById('submit-maintenance');
                if (submitButton) {
                    submitButton.focus();
                    console.log("Foco definido para submit-maintenance");
                } else {
                    console.warn("Elemento submit-maintenance não encontrado para definir foco");
                }
            } else {
                console.log("Validação Etapa 2: FALHOU");
                if(typeof Utilities !== 'undefined') {
                    Utilities.showNotification("Verifique os campos obrigatórios da Etapa 2.", "warning");
                }
            }
        } catch (error) {
            console.error("Erro ao validar Etapa 2:", error);
            if(typeof Utilities !== 'undefined') {
                Utilities.showNotification("Erro ao processar o formulário: " + error.message, "error");
            }
        }
   }

   function handleFormSubmit(event) {
       event.preventDefault();
       console.log("Formulário submetido. Enviando dados...");
       
       // Mostrar indicador de carregamento
       if(typeof Utilities !== 'undefined' && Utilities.showLoading) {
           Utilities.showLoading(true, 'Salvando manutenção...');
       }
       
       // Desabilitar botão de submit para evitar cliques duplos
       const submitButton = document.getElementById('submit-maintenance');
       if (submitButton) submitButton.disabled = true;
       
       // Tentar enviar
       submitMaintenance()
           .then(response => {
               console.log("Resposta do envio:", response);
               
               if (response && response.success) {
                   // Sucesso
                   if(typeof Utilities !== 'undefined') {
                       Utilities.showNotification(
                           isEditMode ? "Manutenção atualizada com sucesso!" : "Nova manutenção registrada com sucesso!", 
                           "success"
                       );
                   }
                   // Fechar formulário
                   closeForm();
                   // Recarregar lista
                   loadMaintenanceList();
               } else {
                   // Erro
                   console.error("Erro ao salvar manutenção:", response);
                   if(typeof Utilities !== 'undefined') {
                       Utilities.showNotification(
                           `Erro ao ${isEditMode ? 'atualizar' : 'registrar'} manutenção: ${response?.message || 'Erro desconhecido'}`, 
                           "error"
                       );
                   }
                   // Reabilitar botão
                   if (submitButton) submitButton.disabled = false;
               }
           })
           .catch(error => {
               // Erro na requisição
               console.error("Falha ao enviar manutenção:", error);
               if(typeof Utilities !== 'undefined') {
                   Utilities.showNotification(
                       `Falha ao enviar dados: ${error.message || 'Erro desconhecido'}`, 
                       "error"
                   );
               }
               // Reabilitar botão
               if (submitButton) submitButton.disabled = false;
           })
           .finally(() => {
               if(typeof Utilities !== 'undefined' && Utilities.showLoading) {
                   Utilities.showLoading(false);
               }
           });
   }

   function handleProblemCategoryChange(event) {
       const selectedCategory = event.target.value;
       const otherField = document.getElementById('other-problem-field');
       
       if (otherField) {
           if (selectedCategory === 'Outro') {
               otherField.style.display = 'block';
               setTimeout(() => document.getElementById('other-problem-category')?.focus(), 100);
           } else {
               otherField.style.display = 'none';
           }
       }
   }

   function handleSearchInput(event) {
       const searchTerm = event.target.value.trim();
       console.log(`Termo de busca alterado: "${searchTerm}"`);
       currentSearchTerm = searchTerm;
       filterAndRenderList();
   }

   function handleFilterClick(event) {
       const filterItem = event.currentTarget;
       if (!filterItem) return;
       
       const filterId = filterItem.getAttribute('data-filter') || 'all';
       console.log(`Filtro selecionado: ${filterId}`);
       
       // Atualizar UI
       document.querySelectorAll('#tab-maintenance .filter-container .filter-item').forEach(item => {
           item.classList.remove('active');
       });
       filterItem.classList.add('active');
       
       // Aplicar filtro
       currentFilter = filterId;
       filterAndRenderList();
   }

   // Handler DELEGADO para cliques na tabela
   function handleTableActionClick(event) {
       console.log("Clique detectado na tabela de manutenção.");
       const button = event.target.closest('.btn-icon');
       if (!button) { console.log("Clique não foi em um botão de ação."); return; }

       const maintenanceId = button.getAttribute('data-id');
       if (!maintenanceId) { console.warn("Botão sem data-id."); return; }

       console.log(`Botão '${button.className}' clicado para ID: ${maintenanceId}`);

       const maintenanceData = findMaintenanceByIdInList(maintenanceId);

       if (button.classList.contains('view-maintenance')) {
           if (typeof Utilities !== 'undefined' && Utilities.viewMaintenanceDetails) { Utilities.viewMaintenanceDetails(maintenanceId); }
           else { console.error("Função Utilities.viewMaintenanceDetails não encontrada."); alert(`Visualizar ID: ${maintenanceId}`); }
       } else if (button.classList.contains('verify-maintenance')) {
           if (typeof Verification !== 'undefined' && Verification.openVerificationForm) { Verification.openVerificationForm(maintenanceId, maintenanceData); }
           else { console.error("Módulo Verification não encontrado."); alert(`Verificar ID: ${maintenanceId}`); }
       } else if (button.classList.contains('edit-maintenance')) {
           if (maintenanceData) { openMaintenanceForm(maintenanceId, maintenanceData); }
           else { if(typeof Utilities !== 'undefined') Utilities.showNotification("Erro: Dados para edição não encontrados localmente.", "error"); }
       } else if (button.classList.contains('delete-maintenance')) {
            if (maintenanceData) { handleDeleteMaintenance(maintenanceId, maintenanceData); }
            else { if(typeof Utilities !== 'undefined') Utilities.showNotification("Erro: Dados para exclusão não encontrados.", "error"); }
       }
   }

   function findMaintenanceByIdInList(id) {
       return fullMaintenanceList.find(item => item.id === id);
   }

   function handleDeleteMaintenance(id, maintenanceData) {
       if (!id) return;
       
       // Confirmar exclusão
       if (!confirm(`Tem certeza que deseja excluir a manutenção ${id}?`)) {
           return;
       }
       
       // Mostrar loading
       if(typeof Utilities !== 'undefined' && Utilities.showLoading) {
           Utilities.showLoading(true, 'Excluindo manutenção...');
       }
       
       // Chamar API
       API.deleteMaintenance(id)
           .then(response => {
               if (response && response.success) {
                   // Sucesso
                   if(typeof Utilities !== 'undefined') {
                       Utilities.showNotification("Manutenção excluída com sucesso!", "success");
                   }
                   // Recarregar lista
                   loadMaintenanceList();
               } else {
                   // Erro
                   console.error("Erro ao excluir manutenção:", response);
                   if(typeof Utilities !== 'undefined') {
                       Utilities.showNotification(
                           `Erro ao excluir manutenção: ${response?.message || 'Erro desconhecido'}`, 
                           "error"
                       );
                   }
               }
           })
           .catch(error => {
               // Erro na requisição
               console.error("Falha ao excluir manutenção:", error);
               if(typeof Utilities !== 'undefined') {
                   Utilities.showNotification(
                       `Falha ao excluir: ${error.message || 'Erro desconhecido'}`, 
                       "error"
                   );
               }
           })
           .finally(() => {
               if(typeof Utilities !== 'undefined' && Utilities.showLoading) {
                   Utilities.showLoading(false);
               }
           });
   }

   // --- Funções de Navegação, Validação e Persistência ---
   function showStep(step) {
       console.log(`Tentando mostrar a etapa ${step}`);
       
       // Obter todos os elementos de etapa
       const step1 = document.getElementById('step-1');
       const step2 = document.getElementById('step-2');
       const step3 = document.getElementById('step-3');
       
       if (!step1 || !step2 || !step3) {
           console.error(`Elementos de etapa não encontrados. step-1: ${!!step1}, step-2: ${!!step2}, step-3: ${!!step3}`);
           return;
       }
       
       // Ocultar todas as etapas
       step1.style.display = 'none';
       step2.style.display = 'none';
       step3.style.display = 'none';
       
       // Mostrar a etapa selecionada
       if (step === 1) {
           step1.style.display = 'block';
           console.log("Etapa 1 mostrada");
       } else if (step === 2) {
           step2.style.display = 'block';
           console.log("Etapa 2 mostrada");
       } else if (step === 3) {
           step3.style.display = 'block';
           console.log("Etapa 3 mostrada");
       } else {
           console.error(`Etapa inválida: ${step}`);
           return;
       }
       
       // Atualizar indicadores de etapa, se existirem
       try {
           const indicators = document.querySelectorAll('.step-indicator');
           indicators.forEach((indicator, index) => {
               if (index + 1 === step) {
                   indicator.classList.add('active');
               } else {
                   indicator.classList.remove('active');
               }
           });
           console.log("Indicadores de etapa atualizados");
       } catch (error) {
           console.warn("Erro ao atualizar indicadores de etapa:", error);
       }
   }

   function validateStep1() {
        console.log("Executando validateStep1...");
        let isValid = true;
        let firstInvalid = null;
        clearValidationErrors(1);
        
        const requiredFields = [
            { id: 'maintenance-type', name: 'Tipo de Manutenção' },
            { id: 'equipment-type', name: 'Tipo de Equipamento' },
            { id: 'maintenance-area', name: 'Área' },
            { id: 'maintenance-location', name: 'Local/Oficina' },
            { id: 'maintenance-responsible', name: 'Responsável' }
        ];
        
        const equipType = document.getElementById('equipment-type')?.value;
        
        // Adicionar campos dinâmicos baseados no tipo de equipamento
        if (equipType === 'Outro') { 
            requiredFields.push({ id: 'other-equipment', name: 'Especificar Equipamento' }); 
        }
        else if (equipType === 'Aspirador' || equipType === 'Poliguindaste') { 
            requiredFields.push({ id: 'custom-equipment-id', name: `Identificação ${equipType}` }); 
        }
        else if (equipType) { 
            requiredFields.push({ id: 'equipment-id', name: 'Placa ou ID' }); 
        }

        console.log("Campos a validar (Etapa 1):", requiredFields.map(f=>f.id));

        requiredFields.forEach(field => {
            const element = document.getElementById(field.id);
            let isFieldValid = false;
            let elementValue = '';
            
            if (element) {
                elementValue = element.value;
                if (element.value && element.value.trim() !== '') { 
                    isFieldValid = true; 
                }
                // Ignora validação se select de ID está desabilitado
                if (element.tagName === 'SELECT' && element.disabled && element.id === 'equipment-id') { 
                    isFieldValid = true; 
                }
            }

            console.log(`Validando campo ${field.id}: Existe=${!!element}, Valor='${elementValue}', Válido=${isFieldValid}`);

            if (!isFieldValid) {
                isValid = false;
                if (element) { 
                    markFieldError(element, `${field.name} é obrigatório.`); 
                    if (!firstInvalid) firstInvalid = element; 
                }
                else { 
                    console.error(`Elemento obrigatório #${field.id} não encontrado no DOM!`); 
                }
            }
        });

        if (!isValid) {
            console.error("Falha na validação da Etapa 1.");
            if(typeof Utilities !== 'undefined') Utilities.showNotification("Preencha os campos obrigatórios da Etapa 1.", "warning");
            if (firstInvalid) { 
                try { 
                    firstInvalid.focus({ preventScroll: true }); 
                    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
                } catch(e){
                    console.error("Erro ao definir foco:", e);
                } 
            }
        }
        
        return isValid;
   }

   function validateStep2() {
       console.log("Executando validateStep2...");
       let isValid = true;
       let firstInvalid = null;
       clearValidationErrors(2);
       
       const requiredFields = [
           { id: 'problem-category', name: 'Categoria do Problema' },
           { id: 'problem-details', name: 'Detalhes do Problema' }
       ];
       
       // Campo condicional para 'Outro'
       const problemCategory = document.getElementById('problem-category')?.value;
       if (problemCategory === 'Outro') {
           requiredFields.push({ id: 'other-problem-category', name: 'Especificar Categoria' });
       }
       
       console.log("Campos a validar (Etapa 2):", requiredFields.map(f=>f.id));
       
       requiredFields.forEach(field => {
           const element = document.getElementById(field.id);
           let isFieldValid = false;
           let elementValue = '';
           
           if (element) {
               elementValue = element.value;
               if (element.value && element.value.trim() !== '') {
                   isFieldValid = true;
               }
           }
           
           console.log(`Validando campo ${field.id}: Existe=${!!element}, Valor='${elementValue}', Válido=${isFieldValid}`);
           
           if (!isFieldValid) {
               isValid = false;
               if (element) {
                   markFieldError(element, `${field.name} é obrigatório.`);
                   if (!firstInvalid) firstInvalid = element;
               }
               else {
                   console.error(`Elemento obrigatório #${field.id} não encontrado no DOM!`);
               }
           }
       });
       
       if (!isValid) {
           console.error("Falha na validação da Etapa 2.");
           if(typeof Utilities !== 'undefined') Utilities.showNotification("Preencha os campos obrigatórios da Etapa 2.", "warning");
           if (firstInvalid) {
               try {
                   firstInvalid.focus({ preventScroll: true });
                   firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
               } catch(e){
                   console.error("Erro ao definir foco:", e);
               }
           }
       }
       
       return isValid;
   }

   function markFieldError(element, message) {
       if (!element) return;
       
       // Adicionar classe de erro
       element.classList.add('is-invalid');
       
       // Buscar container pai (form-group)
       const formGroup = element.closest('.form-group');
       if (formGroup) {
           formGroup.classList.add('has-error');
           
           // Verificar se já existe mensagem de erro
           let errorElement = formGroup.querySelector('.error-message');
           if (!errorElement) {
               // Criar elemento de mensagem
               errorElement = document.createElement('div');
               errorElement.className = 'error-message';
               formGroup.appendChild(errorElement);
           }
           
           // Definir mensagem
           errorElement.textContent = message;
       }
   }

   function clearFieldError(element) {
       if (!element) return;
       
       // Remover classe de erro
       element.classList.remove('is-invalid');
       
       // Buscar container pai (form-group)
       const formGroup = element.closest('.form-group');
       if (formGroup) {
           formGroup.classList.remove('has-error');
           
           // Remover mensagem de erro
           const errorElement = formGroup.querySelector('.error-message');
           if (errorElement) {
               formGroup.removeChild(errorElement);
           }
       }
   }

   function clearValidationErrors(step) {
       console.log(`Limpando erros de validação da etapa ${step}`);
       
       let container;
       if (step === 1) {
           container = document.getElementById('step-1');
       } else if (step === 2) {
           container = document.getElementById('step-2');
       } else if (step === 3) {
           container = document.getElementById('step-3');
       } else {
           container = document.getElementById('maintenance-form');
       }
       
       if (container) {
           // Limpar classes de erro
           container.querySelectorAll('.is-invalid, .has-error').forEach(el => {
               el.classList.remove('is-invalid', 'has-error');
           });
           
           // Remover mensagens de erro
           container.querySelectorAll('.error-message').forEach(el => {
               el.parentNode.removeChild(el);
           });
       } else {
           console.warn(`Container para etapa ${step} não encontrado.`);
       }
   }

   function saveStep1Data() {
       console.log("Salvando dados da Etapa 1 para formData");
       
       formData.tipoManutencao = document.getElementById('maintenance-type')?.value || '';
       formData.tipoEquipamento = document.getElementById('equipment-type')?.value || '';
       
       // Salvar ID baseado no tipo de equipamento
       if (formData.tipoEquipamento === 'Outro') {
           formData.equipamentoOutro = document.getElementById('other-equipment')?.value || '';
           formData.placaOuId = formData.equipamentoOutro; // Usa o mesmo valor para placaOuId
       } else if (formData.tipoEquipamento === 'Aspirador' || formData.tipoEquipamento === 'Poliguindaste') {
           formData.placaOuId = document.getElementById('custom-equipment-id')?.value || '';
       } else {
           formData.placaOuId = document.getElementById('equipment-id')?.value || '';
       }
       
       formData.area = document.getElementById('maintenance-area')?.value || '';
       formData.localOficina = document.getElementById('maintenance-location')?.value || '';
       formData.responsavel = document.getElementById('maintenance-responsible')?.value || '';
       formData.eCritico = document.getElementById('is-critical')?.checked || false;
       
       console.log("Dados da Etapa 1 salvos:", formData);
   }

   function saveStep2Data() {
       console.log("Salvando dados da Etapa 2 para formData");
       
       formData.categoriaProblema = document.getElementById('problem-category')?.value || '';
       
       // Tratar categoria 'Outro'
       if (formData.categoriaProblema === 'Outro') {
           formData.categoriaProblemaOutro = document.getElementById('other-problem-category')?.value || '';
       } else {
           formData.categoriaProblemaOutro = '';
       }
       
       formData.detalhesproblema = document.getElementById('problem-details')?.value || '';
       formData.observacoes = document.getElementById('maintenance-notes')?.value || '';
       
       console.log("Dados da Etapa 2 salvos:", formData);
   }

   function updateSummary() {
       console.log("Atualizando resumo para revisão");
       
       const summaryElements = {
           'summary-maintenance-type': formData.tipoManutencao || '-',
           'summary-equipment-type': formData.tipoEquipamento || '-',
           'summary-equipment-id': formData.placaOuId || '-',
           'summary-area': formData.area || '-',
           'summary-location': formData.localOficina || '-',
           'summary-responsible': formData.responsavel || '-',
           'summary-is-critical': formData.eCritico ? 'Sim' : 'Não',
           'summary-problem-category': formData.categoriaProblema === 'Outro' ? 
                                      (formData.categoriaProblemaOutro || 'Outro') : 
                                      (formData.categoriaProblema || '-'),
           'summary-problem-details': formData.detalhesproblema || '-',
           'summary-notes': formData.observacoes || '-'
       };
       
       // Atualizar elementos no DOM
       Object.entries(summaryElements).forEach(([id, value]) => {
           const element = document.getElementById(id);
           if (element) {
               element.textContent = value;
           } else {
               console.warn(`Elemento #${id} não encontrado para atualizar resumo.`);
           }
       });
       
       console.log("Resumo atualizado com sucesso");
   }

   function submitMaintenance() {
       console.log(`${isEditMode ? 'Atualizando' : 'Enviando nova'} manutenção para API...`);
       
       // Preparar dados para envio
       const dataToSend = {
           ...formData,
           // Adicionar campos gerados automaticamente para novas manutenções
           ...(isEditMode ? { id: editingMaintenanceId } : { })
       };
       
       console.log("Dados a serem enviados:", dataToSend);
       
       // Chamar API apropriada
       if (isEditMode) {
           return API.updateMaintenance(editingMaintenanceId, dataToSend);
       } else {
           return API.createMaintenance(dataToSend);
       }
   }

   // --- Funções Auxiliares Locais ---
   function debounce(func, wait) {
       let timeout;
       return function executedFunction(...args) {
           const later = () => {
               clearTimeout(timeout);
               func(...args);
           };
           clearTimeout(timeout);
           timeout = setTimeout(later, wait);
       };
   }

   function formatDate(dateString, includeTime = false) {
       if (!dateString) return '-';
       
       try {
           const date = new Date(dateString);
           if (isNaN(date.getTime())) return dateString; // retorna original se inválido
           
           const day = date.getDate().toString().padStart(2, '0');
           const month = (date.getMonth() + 1).toString().padStart(2, '0');
           const year = date.getFullYear();
           
           let formattedDate = `${day}/${month}/${year}`;
           
           if (includeTime) {
               const hours = date.getHours().toString().padStart(2, '0');
               const minutes = date.getMinutes().toString().padStart(2, '0');
               formattedDate += ` ${hours}:${minutes}`;
           }
           
           return formattedDate;
       } catch (e) {
           console.error("Erro ao formatar data:", e);
           return dateString; // retorna original em caso de erro
       }
   }

   function getStatusClass(status) {
       if (!status) return 'default';
       
       const statusLower = status.toLowerCase().trim();
       
       if (statusLower.includes('pendente') || statusLower.includes('aguardando')) {
           return 'pending';
       } else if (statusLower.includes('verificado')) {
           return 'verified';
       } else if (statusLower.includes('ajuste')) {
           return 'adjusting';
       } else if (statusLower.includes('conclu')) {
           return 'completed';
       } else if (statusLower.includes('cancel')) {
           return 'cancelled';
       } else {
           return 'default';
       }
   }

  // API pública do módulo
  return {
    initialize,
    openMaintenanceForm,
    loadMaintenanceList
  };
})();
