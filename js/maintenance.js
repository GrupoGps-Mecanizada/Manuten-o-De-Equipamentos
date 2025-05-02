// Verificar dependências
if (!window.API || !window.Utilities) {
  console.error("Erro CRÍTICO: Dependências API ou Utilities não carregadas antes de maintenance.js");
} else {
  console.log("Maintenance.js - Dependências parecem carregadas.");
}

const Maintenance = (() => {
  // Estado do formulário
  let formData = {
    equipmentType: '',
    equipmentId: '', // Para dropdown padrão
    otherEquipment: '', // Para tipo 'Outro'
    customEquipmentId: '', // Campo renomeado/clarificado para Aspirador/Poliguindaste
    technician: '',
    date: '',
    area: '',
    office: '',
    maintenanceType: '',
    isCritical: false,
    problemCategory: '',
    otherCategory: '',
    problemDescription: '',
    additionalNotes: ''
    // Adicionar status se for relevante manter em edição
    // status: ''
  };

  // Variável para controlar se é um formulário de edição
  let isEditMode = false;
  let editingMaintenanceId = null;
  let fullMaintenanceList = []; // Armazena a lista completa vinda da API
  let currentFilter = 'all';    // Filtro de status atual
  let currentSearchTerm = '';   // Termo de busca atual

  function initialize() {
      console.log("Maintenance.initialize() chamado."); // Log
      setupEventListeners();
      loadDropdownData();
      setupMaintenanceListListeners();
      // Não carrega a lista aqui, loadTabContent fará isso quando a aba for ativada
  }

  // Carrega dados iniciais para dropdowns
  function loadDropdownData() {
    loadEquipmentTypes(); // Esta função agora também chama setupEquipmentTypeEvents
    loadProblemCategories();
    // loadEquipmentIds() é chamado via evento change do tipo de equipamento (pelo listener em setupEventListeners)
  }

  function setupEventListeners() {
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
        // Só carrega IDs se for um tipo padrão (não Outro, não Aspirador, não Poliguindaste)
        if (selectedType && selectedType !== 'Outro' && selectedType !== 'Aspirador' && selectedType !== 'Poliguindaste') {
            loadEquipmentIds();
        } else {
            // Para tipos especiais, limpar o select de IDs padrão
             const idSelect = document.getElementById('equipment-id');
             if(idSelect) {
                  idSelect.innerHTML = `<option value="">${selectedType ? 'Não aplicável' : 'Selecione o tipo'}</option>`;
                  idSelect.disabled = true;
             }
        }
    });


    // Listener para o botão de refresh da lista de manutenções (se existir na aba Manutenções)
    const refreshListButton = document.getElementById('refresh-maintenance-list');
    if (refreshListButton) {
        // Prevenir múltiplos listeners
        refreshListButton.removeEventListener('click', loadMaintenanceList);
        refreshListButton.addEventListener('click', loadMaintenanceList);
    }

    // Listeners para filtros e busca na aba Manutenções
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

   // Adiciona listeners à tabela de manutenção (usando delegação)
  function setupMaintenanceListListeners() {
      const tableBody = document.getElementById('maintenance-tbody');
      if (tableBody && !tableBody.dataset.listenerAttached) { // Evitar múltiplos listeners
          tableBody.addEventListener('click', handleTableActionClick);
          tableBody.dataset.listenerAttached = 'true';
      }
  }

  // --- Funções de Abertura/Fechamento/Reset do Formulário ---

  function openMaintenanceForm(maintenanceId = null, dataToEdit = null) {
      resetForm(); // Sempre reseta ao abrir
      if (maintenanceId && dataToEdit) {
          isEditMode = true;
          editingMaintenanceId = maintenanceId;
          document.querySelector('#maintenance-form-overlay .form-title').textContent = 'Editar Manutenção';
           const submitButton = document.getElementById('submit-maintenance');
            if(submitButton) submitButton.textContent = 'Salvar Alterações';
          // Popula o formulário DEPOIS de definir o modo de edição
          populateFormForEdit(dataToEdit);
      } else {
          isEditMode = false;
          editingMaintenanceId = null;
          document.querySelector('#maintenance-form-overlay .form-title').textContent = 'Registrar Nova Manutenção';
          const submitButton = document.getElementById('submit-maintenance');
          if(submitButton) submitButton.textContent = 'Finalizar Registro';
           // Assegurar que o estado visual inicial dos campos de equipamento esteja correto
           const typeSelect = document.getElementById('equipment-type');
           if(typeSelect) {
               typeSelect.dispatchEvent(new Event('change')); // Dispara evento para ajustar visibilidade inicial
           }
      }
      showStep(1); // Começa sempre na etapa 1
      const overlay = document.getElementById('maintenance-form-overlay');
      if(overlay) {
            overlay.style.display = 'block'; // Mudado para 'block' para exibir o formulário
            console.log("Formulário de manutenção aberto.");
       } else {
           console.error("Overlay #maintenance-form-overlay não encontrado!");
       }
       document.getElementById('equipment-type')?.focus(); // Foco no primeiro campo
  }

   function populateFormForEdit(data) {
       // Pré-carrega o formData com os dados existentes para referência
       formData = { ...formData, ...data }; // Sobrescreve chaves existentes com dados da API

       // --- Etapa 1 ---
       // Tipo de Equipamento
       setSelectValue('equipment-type', data.tipoEquipamento);

       // Necessário disparar 'change' no tipo ANTES de definir os valores dos campos dependentes
       const typeSelect = document.getElementById('equipment-type');
       if (typeSelect) {
           // Disparar evento para que setupEquipmentTypeEvents ajuste a visibilidade dos campos
           typeSelect.dispatchEvent(new Event('change'));
           // Agora preencher o campo de ID correto que ficou visível
            const selectedType = data.tipoEquipamento;
            if (selectedType === 'Outro') {
                document.getElementById('other-equipment').value = data.placaOuId || '';
            } else if (selectedType === 'Aspirador' || selectedType === 'Poliguindaste') {
                // O campo #custom-equipment-id foi criado/tornado visível pelo evento 'change'
                const customIdInput = document.getElementById('custom-equipment-id');
                if (customIdInput) {
                     customIdInput.value = data.placaOuId || '';
                } else {
                     console.warn("Campo custom-equipment-id não encontrado após disparar 'change' no tipo.");
                }
            } else if (selectedType) {
                // Tipo padrão, carregar IDs e então selecionar o valor
                // É importante que loadEquipmentIds retorne uma Promise
                loadEquipmentIds().then(() => {
                    setSelectValue('equipment-id', data.placaOuId);
                }).catch(err => {
                     console.error("Erro ao carregar IDs para edição:", err);
                     // Mesmo com erro, tentar definir o valor (pode ser que já estivesse carregado)
                     setSelectValue('equipment-id', data.placaOuId);
                });
            }
       }

       // Outros campos da Etapa 1
       document.getElementById('technician-name').value = data.responsavel || '';
       document.getElementById('maintenance-date').value = data.dataManutencao ? data.dataManutencao.split('T')[0] : ''; // Formato yyyy-MM-dd
       setSelectValue('area', data.area);
       document.getElementById('office').value = data.localOficina || '';
       setSelectValue('maintenance-type', data.tipoManutencao);
       document.getElementById('is-critical').checked = data.eCritico || data.isCritical || false; // Compatibilidade de nomes

       // --- Etapa 2 ---
       // Categoria de Problema
       setSelectValue('problem-category', data.categoriaProblema);
       const categorySelect = document.getElementById('problem-category');
        if(categorySelect) {
             // Disparar evento para ajustar o campo 'Outro'
             categorySelect.dispatchEvent(new Event('change'));
              // Preencher campo 'Outro' SE A CATEGORIA FOR 'Outro'
              if (data.categoriaProblema === 'Outro') {
                   // A API pode retornar o texto no campo principal ou num campo 'categoriaProblemaOutro'
                   document.getElementById('other-category').value = data.categoriaProblemaOutro || data.categoriaProblema || '';
              }
        }

       document.getElementById('problem-description').value = data.detalhesproblema || data.problemDescription || '';
       document.getElementById('additional-notes').value = data.observacoes || data.additionalNotes || '';
   }

    // Função auxiliar para definir valor de um select (tratando caso a option não exista)
    function setSelectValue(selectId, value) {
        const select = document.getElementById(selectId);
        if (!select) {
             console.warn(`Select element with ID "${selectId}" not found.`);
             return;
        }
        if (value === undefined || value === null) {
             select.value = ""; // Define como vazio se o valor for nulo/undefined
             return;
        }

         const stringValue = String(value); // Trabalhar com string para consistência

        // Tenta encontrar pelo valor exato
        let optionExists = Array.from(select.options).some(opt => opt.value === stringValue);

        if (optionExists) {
            select.value = stringValue;
        } else {
            // Tenta encontrar valor case-insensitive ou com espaços
            const lowerTrimmedValue = stringValue.toLowerCase().trim();
            const foundOptionByValue = Array.from(select.options).find(opt => opt.value.toLowerCase().trim() === lowerTrimmedValue);
            if (foundOptionByValue) {
                select.value = foundOptionByValue.value; // Usa o valor original da option
                optionExists = true;
            } else {
                 // Tenta encontrar pelo texto da option como fallback
                 const trimmedTextValue = stringValue.trim();
                 const foundOptionByText = Array.from(select.options).find(opt => opt.textContent.trim() === trimmedTextValue);
                 if (foundOptionByText) {
                     select.value = foundOptionByText.value;
                     optionExists = true;
                     console.log(`Valor "${value}" encontrado pelo TEXTO no select "${selectId}". Usando value "${foundOptionByText.value}".`);
                 }
            }
        }

        if (!optionExists) {
            console.warn(`Valor "${value}" não encontrado no select "${selectId}". Definindo como vazio.`);
            select.value = ""; // Define como vazio ou outra opção padrão
        }
    }

  function closeForm() {
    // Usar uma função global de confirmação se existir
    const confirmationMessage = isEditMode ? 'Descartar alterações não salvas?' : 'Cancelar o registro da nova manutenção?';
     if (typeof Utilities !== 'undefined' && Utilities.showConfirmation) {
         Utilities.showConfirmation(confirmationMessage, () => {
              document.getElementById('maintenance-form-overlay').style.display = 'none';
              resetForm(); // Limpa o formulário ao fechar
         });
     } else {
        // Fallback para confirm padrão
        if (confirm(confirmationMessage)) {
          document.getElementById('maintenance-form-overlay').style.display = 'none';
          resetForm();
        }
     }
  }

  function resetForm() {
    // Limpar dados do estado interno
    formData = {
      equipmentType: '', equipmentId: '', otherEquipment: '', customEquipmentId: '',
      technician: '', date: '', area: '', office: '', maintenanceType: '', isCritical: false,
      problemCategory: '', otherCategory: '', problemDescription: '', additionalNotes: ''
    };
    isEditMode = false;
    editingMaintenanceId = null;

    // Resetar campos do formulário HTML
    const form = document.getElementById('maintenance-form');
    if (form) form.reset();

    // Esconder campos condicionais e remover os dinamicamente criados
    const otherEquipField = document.getElementById('other-equipment-field');
    if (otherEquipField) otherEquipField.style.display = 'none';
    const otherCatField = document.getElementById('other-category-field');
    if (otherCatField) otherCatField.style.display = 'none';
    const customEquipField = document.getElementById('custom-equipment-id-field'); // Campo customizado para Aspirador/Poli
    if (customEquipField) {
         // Remover o campo inteiro ou apenas esconder e limpar? Melhor esconder e limpar.
         customEquipField.style.display = 'none';
         const customInput = document.getElementById('custom-equipment-id');
         if(customInput) customInput.value = '';
    }

     // Garantir que o dropdown de ID padrão esteja escondido (dependerá do tipo selecionado depois)
     const equipIdSelectContainer = document.getElementById('equipment-id')?.parentElement;
     if (equipIdSelectContainer) {
        equipIdSelectContainer.style.display = 'none';
     }

    // Redefinir bordas de validação e mensagens de erro
    clearValidationErrors(1);
    clearValidationErrors(2);
    clearValidationErrors(3); // Limpar erros do resumo (se houver)

     // Resetar título e botão de submit
     const titleElement = document.querySelector('#maintenance-form-overlay .form-title');
     if(titleElement) titleElement.textContent = 'Registrar Nova Manutenção';
     const submitButton = document.getElementById('submit-maintenance');
     if(submitButton) submitButton.textContent = 'Finalizar Registro';

    // Voltar para etapa 1
    showStep(1);
  }

  // --- Funções de Carregamento de Dados (Dropdowns, Lista) ---

  // ================================================================
  // === INÍCIO: CÓDIGO ATUALIZADO PARA TIPOS DE EQUIPAMENTO      ===
  // ================================================================
  function loadEquipmentTypes() {
    try {
      // Usar Utilities.showLoading se disponível
      if (typeof Utilities !== 'undefined' && Utilities.showLoading) {
          Utilities.showLoading(true, 'Carregando tipos de equipamento...');
      } else {
          console.log('Carregando tipos de equipamento...');
      }

      API.getMaintenanceFormData()
        .then(response => {
          if (response.success && response.formData) {
            const select = document.getElementById('equipment-type');
            if (!select) return;

            select.innerHTML = '<option value="">Selecione o tipo...</option>';
            let equipmentTypes = [];
            const apiTypes = response.formData.opcoesTipoEquipe || response.formData.equipmentTypes;
            if (apiTypes && Array.isArray(apiTypes)) {
              apiTypes.forEach(type => { if (type && !equipmentTypes.includes(type)) { equipmentTypes.push(type); } });
            } else {
               console.warn("API retornou sucesso, mas tipos de equipamento não encontrados:", response.formData);
            }

            const requiredTypes = ['Aspirador', 'Poliguindaste'];
            requiredTypes.forEach(type => { if (!equipmentTypes.includes(type)) { equipmentTypes.push(type); } });

            equipmentTypes.forEach(type => { const option = document.createElement('option'); option.value = type; option.textContent = type; select.appendChild(option); });

            if (!equipmentTypes.includes('Outro')) {
                 const otherOption = document.createElement('option'); otherOption.value = 'Outro'; otherOption.textContent = 'Outro'; select.appendChild(otherOption);
            } else {
                 const outroOpt = Array.from(select.options).find(opt => opt.value === 'Outro');
                 if (outroOpt && outroOpt !== select.options[select.options.length - 1]) { select.appendChild(outroOpt); }
            }
            setupEquipmentTypeEvents(); // Configura eventos DEPOIS de popular
          } else {
             console.error("Erro API ou dados inválidos (tipos equip.):", response?.message || "Dados inválidos");
             throw new Error(response?.message || "Dados do formulário inválidos");
          }
        })
        .catch(error => {
          console.error("Erro ao carregar tipos de equipamento via API:", error);
           if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
              Utilities.showNotification("Falha ao buscar tipos. Usando lista padrão.", "warning");
           }
          loadDefaultEquipmentTypes();
          setupEquipmentTypeEvents(); // Configurar eventos mesmo com fallback
        })
        .finally(() => {
           if (typeof Utilities !== 'undefined' && Utilities.showLoading) {
              Utilities.showLoading(false);
           }
        });
    } catch (e) {
      console.error("Erro inesperado ao carregar tipos:", e);
       if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
         Utilities.showNotification("Erro interno tipos. Usando lista padrão.", "error");
       }
      loadDefaultEquipmentTypes();
       setupEquipmentTypeEvents();
       if (typeof Utilities !== 'undefined' && Utilities.showLoading) {
          Utilities.showLoading(false);
       }
    }
  }

  // Função para carregar tipos padrão quando a API falha
  function loadDefaultEquipmentTypes() {
    const select = document.getElementById('equipment-type');
    if (!select) return;
    select.innerHTML = '<option value="">Selecione o tipo...</option>';
    const defaultTypes = ['Alta Pressão', 'Auto Vácuo / Hiper Vácuo', 'Aspirador', 'Poliguindaste', 'Outro'];
    defaultTypes.forEach(type => { const option = document.createElement('option'); option.value = type; option.textContent = type; select.appendChild(option); });
  }

  // Função para configurar eventos relacionados ao tipo de equipamento
  function setupEquipmentTypeEvents() {
    const typeSelect = document.getElementById('equipment-type');
    if (!typeSelect) { console.warn("Select 'equipment-type' não encontrado."); return; }

    const handleTypeChangeLogic = function() {
      const selectedType = this.value;
      const equipIdSelectContainer = document.getElementById('equipment-id')?.parentElement;
      const equipIdSelect = document.getElementById('equipment-id');
      const otherEquipField = document.getElementById('other-equipment-field');
      const customEquipFieldId = 'custom-equipment-id-field';
      const customEquipInputId = 'custom-equipment-id';
      let customEquipField = document.getElementById(customEquipFieldId);

      // 1. Lógica para Campo "Outro Equipamento"
      if (otherEquipField) {
        otherEquipField.style.display = selectedType === 'Outro' ? 'block' : 'none';
         const otherInput = otherEquipField.querySelector('input');
         if(otherInput) otherInput.required = (selectedType === 'Outro');
         // Limpar erro se campo for escondido
         if (selectedType !== 'Outro' && otherInput) clearFieldError(otherInput);
      }

      // 2. Lógica para Tipos Especiais (Aspirador, Poliguindaste)
      if (selectedType === 'Aspirador' || selectedType === 'Poliguindaste') {
        if (equipIdSelectContainer) { equipIdSelectContainer.style.display = 'none'; }
        if(equipIdSelect) { equipIdSelect.required = false; clearFieldError(equipIdSelect); } // Limpa erro do select padrão

        if (!customEquipField) {
          customEquipField = document.createElement('div'); customEquipField.id = customEquipFieldId; customEquipField.className = 'form-group';
          customEquipField.innerHTML = `<label for="${customEquipInputId}">Identificação do ${selectedType} <span class="form-required">*</span></label><input type="text" class="form-control" id="${customEquipInputId}" name="${customEquipInputId}" required>`;
          const referenceNode = otherEquipField || typeSelect?.parentElement;
          if (referenceNode?.parentElement) { referenceNode.parentElement.insertBefore(customEquipField, referenceNode.nextSibling); }
          else { document.getElementById('step-1-content')?.appendChild(customEquipField); }
        } else {
          const label = customEquipField.querySelector('label'); if (label) { label.innerHTML = `Identificação do ${selectedType} <span class="form-required">*</span>`; } customEquipField.style.display = 'block';
        }
         const customInput = document.getElementById(customEquipInputId);
         if(customInput) customInput.required = true;

      } else {
        // 3. Lógica para Tipos Padrão ou Seleção Vazia
        // Esconder e limpar erro do campo customizado
        if (customEquipField) {
          customEquipField.style.display = 'none';
           const customInput = document.getElementById(customEquipInputId);
           if(customInput) { customInput.required = false; clearFieldError(customInput); }
        }

        // Mostrar/Esconder o dropdown padrão e limpar erro se escondido
        if (equipIdSelectContainer) {
           const shouldShowStandardSelect = selectedType && selectedType !== 'Outro';
           equipIdSelectContainer.style.display = shouldShowStandardSelect ? 'block' : 'none';
           if(equipIdSelect) {
               equipIdSelect.required = shouldShowStandardSelect;
               if (!shouldShowStandardSelect) clearFieldError(equipIdSelect);
           }
        }
      }

       // 4. Limpar valores de campos irrelevantes ao mudar o tipo
       if (selectedType !== 'Outro') { const otherInput = document.getElementById('other-equipment'); if (otherInput) otherInput.value = ''; }
       if (selectedType !== 'Aspirador' && selectedType !== 'Poliguindaste') { const customInput = document.getElementById(customEquipInputId); if (customInput) customInput.value = ''; }
       if (selectedType === 'Outro' || selectedType === 'Aspirador' || selectedType === 'Poliguindaste') { if (equipIdSelect) equipIdSelect.value = ''; } // Limpa seleção do dropdown padrão
    };

     typeSelect.removeEventListener('change', handleTypeChangeLogic);
     typeSelect.addEventListener('change', handleTypeChangeLogic);
  }
  // ================================================================
  // === FIM: CÓDIGO ATUALIZADO PARA TIPOS DE EQUIPAMENTO         ===
  // ================================================================


  // Função para carregar IDs/Placas baseado no tipo selecionado
  function loadEquipmentIds() {
      const typeSelect = document.getElementById('equipment-type');
      const idSelect = document.getElementById('equipment-id');
      if (!typeSelect || !idSelect) return Promise.resolve(); // Retorna promise resolvida se elementos não existem

      const selectedType = typeSelect.value;
      idSelect.innerHTML = '<option value="">Carregando IDs...</option>'; // Feedback
      idSelect.disabled = true;

      // Não carregar se tipo for vazio ou especial
      if (!selectedType || selectedType === 'Outro' || selectedType === 'Aspirador' || selectedType === 'Poliguindaste') {
          idSelect.innerHTML = `<option value="">${selectedType ? 'Não aplicável' : 'Selecione o tipo'}</option>`;
          return Promise.resolve();
      }

      // Chamar a API
      return API.getEquipmentIdsByType(selectedType)
          .then(response => {
              // Verificar resposta ANTES de tentar acessar 'ids'
              if (response && response.success && Array.isArray(response.ids)) {
                  idSelect.innerHTML = '<option value="">Selecione a placa/ID...</option>';
                  if (response.ids.length === 0) {
                      idSelect.innerHTML = '<option value="">Nenhum ID encontrado para este tipo</option>';
                      idSelect.disabled = true; // Manter desabilitado se não há opções
                      // Opcional: Mostrar notificação se não encontrou IDs
                      // if(typeof Utilities !== 'undefined') Utilities.showNotification(`Nenhum ID/Placa encontrado para ${selectedType}.`, "info");
                  } else {
                      response.ids.forEach(id => {
                          if (id !== null && id !== undefined) {
                              const option = document.createElement('option');
                              option.value = id;
                              option.textContent = id;
                              idSelect.appendChild(option);
                          }
                      });
                      idSelect.disabled = false; // Habilita após carregar
                  }
              } else {
                  // A API retornou success:false ou formato inesperado
                  console.warn(`Resposta da API inválida ou sem sucesso para IDs: ${selectedType}`, response);
                  idSelect.innerHTML = `<option value="">Falha ao carregar IDs</option>`;
                  idSelect.disabled = true;
                   if(typeof Utilities !== 'undefined') {
                       Utilities.showNotification(`Erro ao buscar placas/IDs para ${selectedType}: ${response?.message || 'Resposta inválida da API'}. Verifique o backend.`, "error");
                   }
              }
          })
          .catch(error => {
              // Erro na chamada da API (rede, etc.)
              console.error(`Erro CRÍTICO ao carregar IDs para o tipo ${selectedType}:`, error);
              idSelect.innerHTML = '<option value="">Erro ao carregar IDs</option>';
              idSelect.disabled = true;
               if(typeof Utilities !== 'undefined') {
                   Utilities.showNotification(`Erro de comunicação ao buscar IDs para ${selectedType}.`, "error");
               }
               return Promise.reject(error); // Propaga o erro
          });
  }


  function loadProblemCategories() {
    if (loadProblemCategories.loaded) return Promise.resolve(); // Cache simples

    return API.getProblemCategories()
      .then(response => {
        if (response && response.success && Array.isArray(response.categories)) {
          const select = document.getElementById('problem-category');
           if (!select) return;
          select.innerHTML = '<option value="">Selecione a categoria...</option>';
          response.categories.forEach(category => { if(category) { const option = document.createElement('option'); option.value = category; option.textContent = category; select.appendChild(option); } });
           const otherOption = document.createElement('option'); otherOption.value = 'Outro'; otherOption.textContent = 'Outro (Especificar)'; select.appendChild(otherOption);
           loadProblemCategories.loaded = true;
        } else {
             console.error("Resposta inválida ou sem sucesso ao carregar categorias:", response);
              if(typeof Utilities !== 'undefined') Utilities.showNotification("Não foi possível carregar categorias de problema.", "warning");
        }
      })
      .catch(error => {
        console.error("Erro na API ao carregar categorias:", error);
         if(typeof Utilities !== 'undefined') Utilities.showNotification("Erro ao buscar categorias: " + (error.message || 'Erro'), "error");
          const select = document.getElementById('problem-category'); if(select) select.innerHTML = '<option value="">Erro ao carregar</option>';
      });
  }
   loadProblemCategories.loaded = false; // Inicializar flag de cache

   // --- Funções da Lista de Manutenção ---
   function loadMaintenanceList() {
       const tableBody = document.getElementById('maintenance-tbody');
       if (!tableBody) return;
        if(typeof Utilities !== 'undefined') Utilities.showLoading(true, 'Carregando lista de manutenções...'); else console.log("Carregando lista...");

       tableBody.innerHTML = '<tr><td colspan="10" class="text-center loading-message">Carregando manutenções...</td></tr>'; // Colspan 10

       API.getMaintenanceList()
           .then(response => {
               if (response && response.success && Array.isArray(response.maintenances)) {
                   fullMaintenanceList = response.maintenances; // Armazena a lista completa
                   filterAndRenderList(); // Filtra e renderiza
               } else {
                   console.error("Resposta inválida ou sem sucesso da API de manutenções:", response);
                   if(typeof Utilities !== 'undefined') Utilities.showNotification("Não foi possível carregar a lista de manutenções.", "error");
                   tableBody.innerHTML = '<tr><td colspan="10" class="text-center error-message">Erro ao carregar dados. Verifique o console.</td></tr>';
                   fullMaintenanceList = []; // Limpa a lista local em caso de erro
               }
           })
           .catch(error => {
               console.error("Erro ao buscar lista de manutenções:", error);
               if(typeof Utilities !== 'undefined') Utilities.showNotification("Erro ao buscar manutenções: " + (error.message || 'Erro desconhecido'), "error");
               tableBody.innerHTML = `<tr><td colspan="10" class="text-center error-message">Falha ao conectar com o servidor (${error.message || ''}). Tente novamente.</td></tr>`;
               fullMaintenanceList = []; // Limpa a lista local
           })
           .finally(() => {
               if(typeof Utilities !== 'undefined') Utilities.showLoading(false);
           });
   }

   // Filtra a lista local (fullMaintenanceList) e chama renderMaintenanceTable
   function filterAndRenderList() {
       let filteredList = [...fullMaintenanceList]; // Usa a cópia da lista completa

       // 1. Filtrar por Status
       if (currentFilter !== 'all') {
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

       // 2. Filtrar por Termo de Busca
       const searchTerm = currentSearchTerm.toLowerCase().trim();
       if (searchTerm) {
            filteredList = filteredList.filter(item => {
               // Função auxiliar para verificar inclusão do termo
               const includesTerm = (...values) => values.some(val => String(val || '').toLowerCase().includes(searchTerm));
               // Campos para buscar
               return includesTerm(item.id, item.placaOuId, item.tipoEquipamento, item.responsavel, item.area, item.localOficina, item.tipoManutencao, item.categoriaProblema, item.categoriaProblemaOutro, item.status, item.detalhesproblema);
            });
       }

       // 3. Renderizar a lista filtrada
       renderMaintenanceTable(filteredList);
   }

    // Renderiza as linhas da tabela de manutenção com base na lista fornecida
    function renderMaintenanceTable(maintenanceListToRender) {
        const tableBody = document.getElementById('maintenance-tbody');
        if (!tableBody) return;

        tableBody.innerHTML = ''; // Limpa antes de adicionar

        if (maintenanceListToRender.length === 0) {
            const message = currentSearchTerm || currentFilter !== 'all'
                ? 'Nenhuma manutenção encontrada com os filtros aplicados.'
                : 'Nenhuma manutenção registrada ainda.';
            tableBody.innerHTML = `<tr><td colspan="10" class="text-center no-data-message">${message}</td></tr>`; // Colspan 10
            return;
        }

        // Usar Utilities para formatação e classes se disponível
        const safeFormatDate = (dateStr, includeTime = false) => (typeof Utilities !== 'undefined' && Utilities.formatDate) ? Utilities.formatDate(dateStr, includeTime) : formatDate(dateStr, includeTime);
        const safeGetStatusClass = (status) => (typeof Utilities !== 'undefined' && Utilities.getStatusClass) ? Utilities.getStatusClass(status) : getStatusClass(status);

        maintenanceListToRender.forEach(item => {
            const row = document.createElement('tr');
            row.setAttribute('data-maintenance-id', item.id);

            const id = item.id || 'N/A';
            const equipmentId = item.placaOuId || '-';
            const equipmentType = item.tipoEquipamento || 'N/A';
             let equipmentDisplay = `${equipmentType}`; if (equipmentId !== '-') { equipmentDisplay += ` (${equipmentId})`; }
            const maintenanceType = item.tipoManutencao || '-';
            const regDateStr = item.dataRegistro || item.registrationDate || item.dataManutencao;
            const regDate = safeFormatDate(regDateStr, false); // Sem hora na lista principal
            const responsible = item.responsavel || '-';
            const area = item.area || '-';
            const office = item.localOficina || '-';
            const problemCat = item.categoriaProblema === 'Outro' ? (item.categoriaProblemaOutro || 'Outro') : item.categoriaProblema;
            const problem = problemCat || '-';
            const status = item.status || 'Pendente';
            const statusClass = safeGetStatusClass(status);
            const isCritical = item.eCritico || item.isCritical || false;
            const lowerStatus = status.toLowerCase().trim();
            const allowVerification = ['pendente', 'aguardando verificacao', 'aguardando verificação'].includes(lowerStatus);
            const allowEdit = ['pendente', 'aguardando verificacao', 'aguardando verificação', 'ajustes'].includes(lowerStatus);

            // Construir HTML da linha
            row.innerHTML = `
                <td>${id}</td>
                <td>${equipmentDisplay}</td>
                <td>${maintenanceType} ${isCritical ? '<span class="critical-indicator" title="Manutenção Crítica">❗️</span>' : ''}</td>
                <td>${regDate}</td>
                <td>${responsible}</td>
                <td>${area}</td>
                <td>${office}</td>
                <td><span title="${item.detalhesproblema || ''}">${problem}</span></td>
                <td><span class="status-badge status-${statusClass}">${status}</span></td>
                <td class="action-buttons">
                    <button class="btn-icon view-maintenance" data-id="${id}" title="Ver Detalhes">👁️</button>
                    ${allowVerification ? `<button class="btn-icon verify-maintenance" data-id="${id}" title="Iniciar Verificação">✔️</button>` : ''}
                    ${allowEdit ? `<button class="btn-icon edit-maintenance" data-id="${id}" title="Editar Manutenção">✏️</button>` : ''}
                    </td>
            `;
            tableBody.appendChild(row);
        });
         // Reaplicar tooltips ou outros plugins após renderizar
         if (typeof tippy === 'function') {
             tippy('#maintenance-tbody .btn-icon[title]');
             tippy('#maintenance-tbody .critical-indicator[title]');
             tippy('#maintenance-tbody [title]'); // Tooltip genérico para o problema
         }
          // Listeners são adicionados via delegação em setupMaintenanceListListeners
    }

  // --- Funções de Manipulação de Eventos (Handlers) ---

  function handleNextToStep2() {
    if (validateStep1()) {
      saveStep1Data();
      showStep(2);
       document.getElementById('problem-category')?.focus(); // Foco no primeiro campo da etapa 2
    }
  }

  function handleNextToStep3() {
    if (validateStep2()) {
      saveStep2Data();
      updateSummary(); // Atualiza o resumo antes de mostrar
      showStep(3);
       document.getElementById('submit-maintenance')?.focus(); // Foco no botão de finalizar
    }
  }

  function handleFormSubmit(event) {
      event.preventDefault();
      // Revalidar a etapa 2 como garantia antes de submeter.
      if (validateStep2()) {
          saveStep2Data(); // Garante que os últimos dados foram salvos
          submitMaintenance();
      } else {
          showStep(2); // Volta para a etapa 2 se inválida
           if(typeof Utilities !== 'undefined') Utilities.showNotification("Verifique os campos obrigatórios na Etapa 2 antes de finalizar.", "warning");
      }
  }

  // Handler para mudança na categoria de problema
  function handleProblemCategoryChange(event) {
      const otherField = document.getElementById('other-category-field');
      const otherInput = document.getElementById('other-category');
       if (!otherField || !otherInput) return;

      if (event.target.value === 'Outro') {
          otherField.style.display = 'block';
          otherInput.required = true;
          otherInput.focus();
          clearFieldError(otherInput); // Limpar erro ao mostrar
      } else {
          otherField.style.display = 'none';
           otherInput.value = '';
           otherInput.required = false;
           clearFieldError(otherInput); // Limpar erro ao esconder
      }
  }

  // Handler para input de busca
  function handleSearchInput(event) {
      currentSearchTerm = event.target.value || '';
      filterAndRenderList(); // Aplica busca e filtros atuais
  }


  // Handler para cliques nos filtros de status
   function handleFilterClick(event) {
       const target = event.currentTarget;
       currentFilter = target.getAttribute('data-filter') || 'all';

       // Atualizar classe 'active' visualmente
       document.querySelectorAll('#tab-maintenance .filter-container .filter-item').forEach(item => {
           item.classList.remove('active');
       });
       target.classList.add('active');

       filterAndRenderList(); // Reaplicar filtros e renderizar
   }

    // Handler para cliques nos botões de ação da tabela
    function handleTableActionClick(event) {
        const button = event.target.closest('.btn-icon');
        if (!button) return;

        const maintenanceId = button.getAttribute('data-id');
        if (!maintenanceId) { console.warn("Botão sem data-id."); return; }

        const maintenanceData = findMaintenanceByIdInList(maintenanceId);
        if (!maintenanceData) {
            console.error(`Dados para ${maintenanceId} não encontrados na lista local.`);
            if(typeof Utilities !== 'undefined') Utilities.showNotification(`Não foi possível encontrar detalhes para ${maintenanceId}. Atualize a lista.`, "warning");
            return;
        }

        if (button.classList.contains('view-maintenance')) {
            // Usar função global de Utilities
            if (typeof Utilities !== 'undefined' && Utilities.viewMaintenanceDetails) {
                 Utilities.viewMaintenanceDetails(maintenanceId); // A função global busca os detalhes da API
            } else { console.error("Função Utilities.viewMaintenanceDetails não encontrada."); alert(`Visualizar ID: ${maintenanceId}`); }
        } else if (button.classList.contains('verify-maintenance')) {
             // Chamar módulo Verification
            if (typeof Verification !== 'undefined' && Verification.openVerificationForm) {
                Verification.openVerificationForm(maintenanceId, maintenanceData); // Passa ID e dados locais se necessário pré-preencher
            } else { console.error("Módulo Verification não encontrado."); alert(`Verificar ID: ${maintenanceId}`); }
        } else if (button.classList.contains('edit-maintenance')) {
             openMaintenanceForm(maintenanceId, maintenanceData); // Abre o form deste módulo em modo de edição
        } else if (button.classList.contains('delete-maintenance')) {
             handleDeleteMaintenance(maintenanceId, maintenanceData);
        }
    }

    // Função auxiliar para buscar dados na lista local (fullMaintenanceList)
    function findMaintenanceByIdInList(id) {
        const stringId = String(id);
        return fullMaintenanceList.find(item => String(item.id) === stringId) || null;
    }

     // Handler para exclusão
     function handleDeleteMaintenance(id, maintenanceData) {
         const equipDisplay = maintenanceData?.tipoEquipamento ? `${maintenanceData.tipoEquipamento} (${maintenanceData.placaOuId || 'ID desc.'})` : `ID ${id}`;
         const message = `Tem certeza que deseja excluir a manutenção para ${equipDisplay}? Esta ação não pode ser desfeita.`;

         const confirmCallback = () => {
              if(typeof Utilities !== 'undefined') Utilities.showLoading(true, `Excluindo ${id}...`); else console.log("Excluindo...");
             API.deleteMaintenance(id) // Assumindo que existe API.deleteMaintenance(id)
                 .then(response => {
                     if (response && response.success) {
                         if(typeof Utilities !== 'undefined') Utilities.showNotification(`Manutenção ${id} excluída com sucesso.`, 'success');
                         // Remover da lista local e rerenderizar a tabela
                         fullMaintenanceList = fullMaintenanceList.filter(item => String(item.id) !== String(id));
                         filterAndRenderList();
                         // Atualizar contadores/gráficos do dashboard
                         if (typeof Dashboard !== 'undefined' && Dashboard.loadDashboardData) {
                             Dashboard.loadDashboardData(true); // Força recarga do dashboard
                         }
                     } else {
                          console.error(`Erro ao excluir ${id} (API):`, response);
                         if(typeof Utilities !== 'undefined') Utilities.showNotification(`Erro ao excluir ${id}: ${response?.message || 'Erro desconhecido da API'}.`, 'error');
                     }
                 })
                 .catch(error => {
                     console.error(`Erro de rede/conexão ao excluir ${id}:`, error);
                     if(typeof Utilities !== 'undefined') Utilities.showNotification(`Falha na comunicação ao excluir ${id}: ${error.message || 'Erro de rede'}.`, 'error');
                 })
                 .finally(() => {
                     if(typeof Utilities !== 'undefined') Utilities.showLoading(false);
                 });
         };

         // Usa função de confirmação global ou fallback
          if (typeof Utilities !== 'undefined' && Utilities.showConfirmation) {
             Utilities.showConfirmation(message, confirmCallback);
         } else {
              if(confirm(message)) { confirmCallback(); }
         }
     }


  // --- Funções de Navegação, Validação e Persistência ---

  function showStep(step) {
    document.querySelectorAll('.form-steps .form-step').forEach((el) => {
        const stepNumber = parseInt(el.getAttribute('data-step'), 10);
        if (stepNumber == step) { el.classList.add('active'); el.classList.remove('completed'); }
        else if (stepNumber < step) { el.classList.remove('active'); el.classList.add('completed'); }
        else { el.classList.remove('active'); el.classList.remove('completed'); }
    });
    document.querySelectorAll('.form-step-content').forEach(el => { el.style.display = 'none'; });
    const currentStepContent = document.getElementById(`step-${step}-content`);
    if (currentStepContent) { currentStepContent.style.display = 'block'; }
    else { console.error(`Conteúdo da etapa ${step} não encontrado.`); }
  }

  // ================================================================
  // === INÍCIO: CÓDIGO ATUALIZADO PARA VALIDAÇÃO E SALVAMENTO    ===
  // ================================================================
  // Valida os campos obrigatórios da etapa 1
  function validateStep1() {
    let isValid = true;
    let firstInvalid = null;

     clearValidationErrors(1); // Limpar erros anteriores da Etapa 1

    // Lista base de campos obrigatórios
    const requiredFields = [
      { id: 'equipment-type', name: 'Tipo de Equipamento' },
      { id: 'technician-name', name: 'Responsável pelo Relatório' },
      { id: 'maintenance-date', name: 'Data da Manutenção' },
      { id: 'area', name: 'Área' },
      { id: 'office', name: 'Local/Oficina' },
      { id: 'maintenance-type', name: 'Tipo de Manutenção' }
    ];

    // Verificar tipo de equipamento para adicionar validação do campo de ID correto
    const equipType = document.getElementById('equipment-type')?.value;

    if (equipType === 'Outro') {
      requiredFields.push({ id: 'other-equipment', name: 'Especificar Equipamento' });
    }
    else if (equipType === 'Aspirador' || equipType === 'Poliguindaste') {
      requiredFields.push({ id: 'custom-equipment-id', name: `Identificação do ${equipType}` });
    }
    else if (equipType) { // Tipo padrão selecionado
      requiredFields.push({ id: 'equipment-id', name: 'Placa ou ID' });
    }
     // Se equipType for vazio, 'equipment-type' será marcado como inválido abaixo

    // Iterar e validar
    requiredFields.forEach(field => {
      const element = document.getElementById(field.id);
      let isFieldValid = false;

      if (element) {
           // Checa se o valor existe e não é apenas espaços em branco (para inputs e textareas)
           // Para selects, value vazio ('') significa que nenhuma opção válida foi selecionada
           if (element.value && element.value.trim() !== '') {
               isFieldValid = true;
           }
           // Se for o select de ID e estiver desabilitado (ex: erro ao carregar), não validar
           if (element.tagName === 'SELECT' && element.disabled && element.id === 'equipment-id') {
               isFieldValid = true; // Ignora validação se desabilitado por erro
               console.log("Ignorando validação do select de ID desabilitado.");
           }
      } else {
         // Apenas loga aviso se o campo não existe (pode ser o custom-id ainda não criado)
         if(field.id !== 'custom-equipment-id') {
             console.warn(`Elemento de validação não encontrado: #${field.id} (Campo: ${field.name})`);
         }
         // Considera inválido se o elemento esperado não existe (exceto custom-id)
         if(field.id !== 'custom-equipment-id') isValid = false;
      }

      if (!isFieldValid) {
          isValid = false;
          if (element) { // Marcar erro apenas se o elemento existir
               markFieldError(element, `${field.name} é obrigatório.`);
               if (!firstInvalid) firstInvalid = element;
          } else if (field.id === 'custom-equipment-id') {
               // Se o campo customizado é obrigatório mas não existe, marcar o tipo como erro
               const typeSelect = document.getElementById('equipment-type');
               if(typeSelect) {
                    markFieldError(typeSelect, `Identificação do ${equipType} é obrigatória.`);
                    if (!firstInvalid) firstInvalid = typeSelect;
               }
          }
      }
    });

    if (!isValid) {
      if(typeof Utilities !== 'undefined') Utilities.showNotification("Por favor, preencha todos os campos obrigatórios da Etapa 1.", "warning");
      if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          try { firstInvalid.focus(); } catch(e) {/* Ignora erro de foco em elementos não focáveis */}
      }
    }

    return isValid;
  }


    // Valida os campos obrigatórios da etapa 2
    function validateStep2() {
        let isValid = true;
        let firstInvalidElement = null;

         clearValidationErrors(2); // Limpar erros anteriores da Etapa 2

        // Campos obrigatórios
        const requiredFields = [
            { id: 'problem-category', name: 'Categoria do Problema' },
            { id: 'problem-description', name: 'Detalhes do Problema' }
        ];

         const categoryValue = document.getElementById('problem-category')?.value;
         if (categoryValue === 'Outro') {
             requiredFields.push({ id: 'other-category', name: 'Especificar Categoria' });
         }

        requiredFields.forEach(fieldInfo => {
            const element = document.getElementById(fieldInfo.id);
            let isFieldValid = false;
             if (element) {
                  if (element.value && element.value.trim() !== '') { isFieldValid = true; }
             } else { console.warn(`Elemento não encontrado: #${fieldInfo.id}`); }

             if (!isFieldValid) {
                  isValid = false;
                  if(element) {
                      markFieldError(element, `${fieldInfo.name} é obrigatório.`);
                      if (!firstInvalidElement) firstInvalidElement = element;
                  } else {
                       const fallbackElement = document.getElementById('problem-category');
                       if(fallbackElement) { markFieldError(fallbackElement, `Erro: ${fieldInfo.name} não encontrado.`); if (!firstInvalidElement) firstInvalidElement = fallbackElement; }
                  }
             }
        });

        if (!isValid) {
             if(typeof Utilities !== 'undefined') Utilities.showNotification("Preencha campos obrigatórios da Etapa 2.", "warning");
             if (firstInvalidElement) { firstInvalidElement.scrollIntoView({ behavior: 'smooth', block: 'center' }); try { firstInvalidElement.focus(); } catch(e){} }
        }
        return isValid;
    }

    // Função auxiliar para marcar erro em um campo
    function markFieldError(element, message) {
        if (!element) return;
        element.style.borderColor = 'red';
        element.setAttribute('aria-invalid', 'true');

        const errorSpanId = element.id + '-error';
        let errorSpan = document.getElementById(errorSpanId);
        const parent = element.parentElement;

        if (!errorSpan && parent) {
            errorSpan = document.createElement('span'); errorSpan.id = errorSpanId; errorSpan.className = 'error-message-field'; errorSpan.setAttribute('role', 'alert'); errorSpan.style.display = 'none';
            // Inserir após o elemento
            element.insertAdjacentElement('afterend', errorSpan);
        }
         if(errorSpan) {
            errorSpan.textContent = message; errorSpan.style.display = 'block';
         }
    }

    // Função auxiliar para limpar UM erro de validação específico
    function clearFieldError(element) {
        if (!element) return;
        element.style.borderColor = '';
        element.removeAttribute('aria-invalid');
        const errorSpan = document.getElementById(element.id + '-error');
        if (errorSpan) {
            errorSpan.textContent = '';
            errorSpan.style.display = 'none';
        }
    }

    // Função auxiliar para limpar erros de validação de uma etapa *** (NOVA VERSÃO) ***
    function clearValidationErrors(step) {
        const stepContent = document.getElementById(`step-${step}-content`);
        if (!stepContent) return;

        // Encontra todos os elementos que *tinham* erro ou spans de erro
        const elementsWithError = stepContent.querySelectorAll('[aria-invalid="true"], .error-message-field');

        elementsWithError.forEach(el => {
            let inputElement = el;
            // Se for o span de erro, pega o input associado
            if (el.classList.contains('error-message-field')) {
                const inputId = el.id.replace('-error', '');
                inputElement = document.getElementById(inputId);
                // Limpa e esconde o span
                el.textContent = '';
                el.style.display = 'none';
            }

            // Se for o input (ou foi encontrado a partir do span)
            if (inputElement && inputElement.hasAttribute('aria-invalid')) {
                if(inputElement.style) inputElement.style.borderColor = ''; // Resetar borda
                inputElement.removeAttribute('aria-invalid');
                // Tenta remover o span de erro associado também, caso não tenha sido pego acima
                const errorSpanAssociated = document.getElementById(inputElement.id + '-error');
                if (errorSpanAssociated) {
                     errorSpanAssociated.textContent = '';
                     errorSpanAssociated.style.display = 'none';
                }
            }
        });
    }


  // Salva os dados da etapa 1 no estado 'formData'
  function saveStep1Data() {
    formData.equipmentType = document.getElementById('equipment-type')?.value || '';
    if (formData.equipmentType === 'Aspirador' || formData.equipmentType === 'Poliguindaste') { const customIdInput = document.getElementById('custom-equipment-id'); formData.customEquipmentId = customIdInput ? customIdInput.value.trim() : ''; formData.equipmentId = ''; formData.otherEquipment = ''; }
    else if (formData.equipmentType === 'Outro') { formData.otherEquipment = document.getElementById('other-equipment')?.value.trim() || ''; formData.equipmentId = ''; formData.customEquipmentId = ''; }
    else { formData.equipmentId = document.getElementById('equipment-id')?.value || ''; formData.otherEquipment = ''; formData.customEquipmentId = ''; }
    formData.technician = document.getElementById('technician-name')?.value.trim() || ''; formData.date = document.getElementById('maintenance-date')?.value || ''; formData.area = document.getElementById('area')?.value || ''; formData.office = document.getElementById('office')?.value.trim() || ''; formData.maintenanceType = document.getElementById('maintenance-type')?.value || ''; formData.isCritical = document.getElementById('is-critical')?.checked || false;
  }

  // Salva os dados da etapa 2 no estado 'formData'
  function saveStep2Data() {
    formData.problemCategory = document.getElementById('problem-category')?.value || '';
    if (formData.problemCategory === 'Outro') { formData.otherCategory = document.getElementById('other-category')?.value.trim() || ''; } else { formData.otherCategory = ''; }
    formData.problemDescription = document.getElementById('problem-description')?.value.trim() || ''; formData.additionalNotes = document.getElementById('additional-notes')?.value.trim() || '';
  }

   // Atualiza o resumo na etapa 3
  function updateSummary() {
      const getSelectText = (id) => { const select = document.getElementById(id); if (select && select.selectedIndex >= 0) { if (select.value) { return select.options[select.selectedIndex].text; } } return '-'; };
      let equipmentDisplay = '-'; const equipType = formData.equipmentType; const typeText = getSelectText('equipment-type');
      if (equipType === 'Outro') { equipmentDisplay = `${typeText}: ${formData.otherEquipment || '(N/A)'}`; }
      else if (equipType === 'Aspirador' || equipType === 'Poliguindaste') { equipmentDisplay = `${typeText} (${formData.customEquipmentId || 'ID N/A'})`; }
      else if (equipType) { const idText = getSelectText('equipment-id'); const detail = (idText !== '-') ? idText : (formData.equipmentId || 'ID N/A'); equipmentDisplay = `${typeText} (${detail})`; }
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

  // Envia os dados para a API
  function submitMaintenance() {
      const loadingMessage = isEditMode ? `Atualizando manutenção ${editingMaintenanceId}...` : 'Registrando nova manutenção...';
      if(typeof Utilities !== 'undefined') Utilities.showLoading(true, loadingMessage); else console.log(loadingMessage);

      let finalEquipmentIdentifier = '';
      if (formData.equipmentType === 'Outro') { finalEquipmentIdentifier = formData.otherEquipment; }
      else if (formData.equipmentType === 'Aspirador' || formData.equipmentType === 'Poliguindaste') { finalEquipmentIdentifier = formData.customEquipmentId; }
      else { finalEquipmentIdentifier = formData.equipmentId; }

       let finalProblemCategory = formData.problemCategory;
       let finalOtherCategoryValue = null;
       if (formData.problemCategory === 'Outro') { finalOtherCategoryValue = formData.otherCategory; }

      const apiData = {
          tipoEquipamento: formData.equipmentType, placaOuId: finalEquipmentIdentifier, responsavel: formData.technician,
          dataManutencao: formData.date, area: formData.area, localOficina: formData.office, tipoManutencao: formData.maintenanceType,
          eCritico: formData.isCritical, categoriaProblema: finalProblemCategory, categoriaProblemaOutro: finalOtherCategoryValue,
          detalhesproblema: formData.problemDescription, observacoes: formData.additionalNotes
      };

       const apiCall = isEditMode ? API.updateMaintenance(editingMaintenanceId, apiData) : API.saveMaintenance(apiData);

      apiCall.then(response => {
              if (response && response.success) {
                  const successMessage = isEditMode ? `Manutenção ${editingMaintenanceId} atualizada!` : `Manutenção registrada! ID: ${response.id || '(sem ID)'}`;
                  if(typeof Utilities !== 'undefined') Utilities.showNotification(successMessage, 'success');
                  document.getElementById('maintenance-form-overlay').style.display = 'none';
                  resetForm();
                  loadMaintenanceList(); // Recarrega a lista nesta aba
                  if (typeof Dashboard !== 'undefined' && Dashboard.loadDashboardData) { Dashboard.loadDashboardData(true); } // Atualiza dashboard
              } else {
                  console.error("Erro API salvar/atualizar:", response);
                  const errorMessage = isEditMode ? 'Erro ao atualizar' : 'Erro ao salvar';
                  if(typeof Utilities !== 'undefined') Utilities.showNotification(`${errorMessage}: ${response?.message || 'Verifique os dados.'}.`, 'error');
              }
          }).catch(error => {
               console.error("Erro requisição API:", error);
               const failureMessage = isEditMode ? 'Falha ao atualizar' : 'Falha ao registrar';
               let detail = error.message || 'Erro desconhecido';
               if (error.response?.data?.message) { detail = error.response.data.message; }
               if(typeof Utilities !== 'undefined') Utilities.showNotification(`${failureMessage}: ${detail}.`, 'error');
          })
       .finally(() => { if(typeof Utilities !== 'undefined') Utilities.showLoading(false); });
  }
  // ================================================================
  // === FIM: CÓDIGO ATUALIZADO PARA VALIDAÇÃO E SALVAMENTO       ===
  // ================================================================

   // --- Funções Auxiliares Locais (Usar as de Utilities se possível) ---
   // Mover para utilities.js
    function debounce(func, wait) { /* ... implementação ... */
        let timeout; return function executedFunction(...args) { const context = this; const later = () => { timeout = null; func.apply(context, args); }; clearTimeout(timeout); timeout = setTimeout(later, wait); };
    }
    function formatDate(dateString, includeTime = false) { /* ... implementação ... */
        if (!dateString) return '-'; try { const timestamp = Date.parse(dateString); if (isNaN(timestamp)) return dateString; const date = new Date(timestamp); const optionsDate = { day: '2-digit', month: '2-digit', year: 'numeric' }; const optionsTime = { hour: '2-digit', minute: '2-digit' }; let formatted = date.toLocaleDateString('pt-BR', optionsDate); if (includeTime) { formatted += ' ' + date.toLocaleTimeString('pt-BR', optionsTime); } return formatted; } catch (e) { return dateString; }
    }
    function getStatusClass(status) { /* ... implementação ... */
        if (!status) return 'pendente'; return status.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

  // API pública do módulo
  return {
    initialize,
    openMaintenanceForm, // Para botão "Nova Manutenção" e botão "Editar"
    loadMaintenanceList // Para refresh manual ou ao ativar a aba
  };
})();

// O listener DOMContentLoaded foi removido daqui, a inicialização agora é feita pelo main.js
