// Verificar se as dependências necessárias estão carregadas
// NOTA: Esta verificação assume a existência de variáveis globais como API_LOADED e UTILITIES_LOADED.
// Se essas variáveis não forem definidas por API.js ou Utilities.js, ajuste a condição
// ou confie na verificação dentro do DOMContentLoaded abaixo.
if (!window.API /* || !window.API_LOADED || !window.UTILITIES_LOADED */) {
  console.error("Erro: Dependências API.js ou Utilities.js não carregadas (verificação inicial).");
  // Poderia adicionar um alerta ou desabilitar funcionalidades aqui se necessário
} else {
  console.log("Maintenance.js - Dependências parecem carregadas (verificação inicial).");
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

  function initialize() {
    setupEventListeners();
    loadDropdownData(); // Carrega ambos os dropdowns
    setupMaintenanceListListeners(); // Listeners para a lista/tabela de manutenções
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
        newMaintenanceButton.addEventListener('click', () => openMaintenanceForm());
    }

    // Botões de navegação do formulário
    const nextToStep2 = document.getElementById('next-to-step-2');
    if (nextToStep2) nextToStep2.addEventListener('click', handleNextToStep2);

    const backToStep1 = document.getElementById('back-to-step-1');
    if (backToStep1) backToStep1.addEventListener('click', () => showStep(1));

    const nextToStep3 = document.getElementById('next-to-step-3');
    if (nextToStep3) nextToStep3.addEventListener('click', handleNextToStep3);

    const backToStep2 = document.getElementById('back-to-step-2');
    if (backToStep2) backToStep2.addEventListener('click', () => showStep(2));

    // Fechar/Cancelar formulário
    const closeFormButton = document.getElementById('close-maintenance-form');
    if (closeFormButton) closeFormButton.addEventListener('click', closeForm);

    const cancelFormButton = document.getElementById('cancel-maintenance'); // Botão dentro da Etapa 1
    if (cancelFormButton) cancelFormButton.addEventListener('click', closeForm);

    // Submit do formulário
    const maintenanceForm = document.getElementById('maintenance-form');
    if (maintenanceForm) maintenanceForm.addEventListener('submit', handleFormSubmit);

    // Listener para o select de Categoria de Problema (campo Outro)
    const problemCategorySelect = document.getElementById('problem-category');
    if (problemCategorySelect) problemCategorySelect.addEventListener('change', handleProblemCategoryChange);

    // Listener para o select de Tipo de Equipamento para carregar IDs
    // A função setupEquipmentTypeEvents também adiciona um listener de change, mas este
    // é específico para carregar os IDs via loadEquipmentIds QUANDO um tipo padrão é selecionado.
    const equipmentTypeSelect = document.getElementById('equipment-type');
    if (equipmentTypeSelect) {
        equipmentTypeSelect.addEventListener('change', () => {
            const selectedType = equipmentTypeSelect.value;
            // Só carrega IDs se for um tipo padrão (não Outro, não Aspirador, não Poliguindaste)
            if (selectedType && selectedType !== 'Outro' && selectedType !== 'Aspirador' && selectedType !== 'Poliguindaste') {
                loadEquipmentIds();
            } else {
                // Para tipos especiais, pode ser útil limpar o select de IDs, embora loadEquipmentIds já o faça.
                 const idSelect = document.getElementById('equipment-id');
                 if(idSelect) {
                      idSelect.innerHTML = `<option value="">${selectedType ? 'Não aplicável para este tipo' : 'Selecione o tipo primeiro'}</option>`;
                      idSelect.disabled = true;
                 }
            }
        });
    }


    // Listener para o botão de refresh da lista de manutenções (se existir na aba Manutenções)
    const refreshListButton = document.getElementById('refresh-maintenance-list');
    if (refreshListButton) refreshListButton.addEventListener('click', () => loadMaintenanceList());

    // Listeners para filtros e busca na aba Manutenções
    const searchInput = document.getElementById('maintenance-search');
    if (searchInput) searchInput.addEventListener('input', debounce(handleSearchInput, 300)); // Aplica debounce

    const filterItems = document.querySelectorAll('#tab-maintenance .filter-container .filter-item'); // Escopo para aba Manutenção
    filterItems.forEach(item => {
        item.addEventListener('click', handleFilterClick);
    });

  }

   // Adiciona listeners à tabela de manutenção (usando delegação)
  function setupMaintenanceListListeners() {
      const tableBody = document.getElementById('maintenance-tbody');
      if (tableBody) {
          tableBody.addEventListener('click', handleTableActionClick);
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
          // Para novo form, garantir que os dropdowns estejam carregados (se ainda não estiverem)
          // loadDropdownData(); // Pode causar recargas desnecessárias se já carregado
           // Assegurar que o estado visual inicial dos campos de equipamento esteja correto
           const typeSelect = document.getElementById('equipment-type');
           if(typeSelect) {
               typeSelect.dispatchEvent(new Event('change')); // Dispara evento para ajustar visibilidade inicial
           }
      }
      showStep(1); // Começa sempre na etapa 1
      const overlay = document.getElementById('maintenance-form-overlay');
      if(overlay) overlay.style.display = 'block';
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
       document.getElementById('maintenance-date').value = data.dataManutencao ? data.dataManutencao.split('T')[0] : ''; // Formato YYYY-MM-DD
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

     // Garantir que o dropdown de ID padrão esteja potencialmente visível (dependerá do tipo selecionado depois)
     const equipIdSelectContainer = document.getElementById('equipment-id')?.parentElement;
     if (equipIdSelectContainer) {
        // Inicialmente escondido, pois nenhum tipo está selecionado
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
      showLoading(true, 'Carregando tipos de equipamento...');
      // Tenta usar a API primeiro (assumindo que API.getMaintenanceFormData retorna os tipos)
      // Se a API for diferente, ajuste a chamada. Ex: API.getEquipmentTypes()
      API.getMaintenanceFormData()
        .then(response => {
          if (response.success && response.formData) {
            const select = document.getElementById('equipment-type');
            if (!select) return;

            select.innerHTML = '<option value="">Selecione o tipo...</option>';

            // Lista base de tipos
            let equipmentTypes = [];

            // Adicionar tipos da resposta da API (ajuste a chave se necessário, ex: response.formData.tiposEquipamento)
            const apiTypes = response.formData.opcoesTipoEquipe || response.formData.equipmentTypes;
            if (apiTypes && Array.isArray(apiTypes)) {
              apiTypes.forEach(type => {
                if (type && !equipmentTypes.includes(type)) {
                  equipmentTypes.push(type);
                }
              });
            } else {
               console.warn("API retornou sucesso, mas os tipos de equipamento não foram encontrados ou não são um array na resposta:", response.formData);
            }

            // Garantir que os novos tipos ('Aspirador', 'Poliguindaste') estejam incluídos
            const requiredTypes = ['Aspirador', 'Poliguindaste'];
            requiredTypes.forEach(type => {
              if (!equipmentTypes.includes(type)) {
                equipmentTypes.push(type);
              }
            });

            // Opcional: Ordenar alfabeticamente
            // equipmentTypes.sort((a, b) => a.localeCompare(b));

            // Adicionar todos os tipos (combinados e únicos) ao select
            equipmentTypes.forEach(type => {
              const option = document.createElement('option');
              option.value = type;
              option.textContent = type;
              select.appendChild(option);
            });

            // Adicionar opção "Outro" no final, garantindo que não esteja duplicada
            if (!equipmentTypes.includes('Outro')) {
                 const otherOption = document.createElement('option');
                 otherOption.value = 'Outro';
                 otherOption.textContent = 'Outro';
                 select.appendChild(otherOption);
            } else {
                 // Se 'Outro' já veio da API, mover para o final se necessário
                 const outroOpt = Array.from(select.options).find(opt => opt.value === 'Outro');
                 if (outroOpt && outroOpt !== select.options[select.options.length - 1]) {
                      select.appendChild(outroOpt); // Move para o fim
                 }
            }

            // Configurar eventos DEPOIS de popular o select
            setupEquipmentTypeEvents();

          } else {
             // A API retornou sucesso=false ou formData inválido
             console.error("Erro reportado pela API ou dados inválidos:", response?.message || "Dados do formulário inválidos");
             throw new Error(response?.message || "Dados do formulário inválidos"); // Joga erro para o catch
          }
        })
        .catch(error => {
          // Erro na chamada API ou erro jogado do .then()
          console.error("Erro ao carregar tipos de equipamento via API:", error);
          showNotification("Falha ao buscar tipos de equipamento. Usando lista padrão.", "warning");
          // Em caso de erro, carregue os tipos padrão
          loadDefaultEquipmentTypes();
           // Configurar eventos mesmo com fallback
           setupEquipmentTypeEvents();
        })
        .finally(() => {
           showLoading(false);
        });
    } catch (e) {
       // Erro síncrono (raro aqui, mas possível)
      console.error("Erro inesperado ao iniciar carregamento de tipos de equipamento:", e);
       showNotification("Erro interno ao carregar tipos. Usando lista padrão.", "error");
      loadDefaultEquipmentTypes();
       setupEquipmentTypeEvents();
       showLoading(false);
    }
  }

  // Função para carregar tipos padrão quando a API falha ou não está disponível
  function loadDefaultEquipmentTypes() {
    const select = document.getElementById('equipment-type');
    if (!select) return;

    select.innerHTML = '<option value="">Selecione o tipo...</option>';

    // Lista padrão incluindo os novos tipos
    const defaultTypes = [
      'Alta Pressão',
      'Auto Vácuo / Hiper Vácuo',
      'Aspirador',
      'Poliguindaste',
      'Outro' // Garantir que 'Outro' esteja aqui
    ];

    defaultTypes.forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = type;
      select.appendChild(option);
    });

     // setupEquipmentTypeEvents será chamado no final de loadEquipmentTypes (no catch/finally)
  }

  // Função para configurar eventos relacionados ao tipo de equipamento (mostrar/esconder campos)
  function setupEquipmentTypeEvents() {
    const typeSelect = document.getElementById('equipment-type');
    if (!typeSelect) {
       console.warn("Select 'equipment-type' não encontrado para configurar eventos.");
       return;
    }

     // Usar uma função nomeada para poder remover o listener se necessário
    const handleTypeChangeLogic = function() {
      const selectedType = this.value;
      const equipIdSelectContainer = document.getElementById('equipment-id')?.parentElement; // Div que contém o select padrão
      const equipIdSelect = document.getElementById('equipment-id');
      const otherEquipField = document.getElementById('other-equipment-field'); // Div do campo 'Outro'
      const customEquipFieldId = 'custom-equipment-id-field'; // ID da div para o campo customizado
      const customEquipInputId = 'custom-equipment-id'; // ID do input dentro da div customizada
      let customEquipField = document.getElementById(customEquipFieldId);

      // 1. Lógica para Campo "Outro Equipamento"
      if (otherEquipField) {
        otherEquipField.style.display = selectedType === 'Outro' ? 'block' : 'none';
         const otherInput = otherEquipField.querySelector('input');
         if(otherInput) otherInput.required = (selectedType === 'Outro');
      }

      // 2. Lógica para Tipos Especiais (Aspirador, Poliguindaste)
      if (selectedType === 'Aspirador' || selectedType === 'Poliguindaste') {
        // Esconder o dropdown de equipamento padrão
        if (equipIdSelectContainer) {
          equipIdSelectContainer.style.display = 'none';
        }
        if(equipIdSelect) equipIdSelect.required = false;

        // Mostrar/Criar campo de ID personalizado
        if (!customEquipField) {
          // Criar a div se não existir
          customEquipField = document.createElement('div');
          customEquipField.id = customEquipFieldId;
          customEquipField.className = 'form-group'; // Usar a mesma classe dos outros campos

          customEquipField.innerHTML = `
            <label for="${customEquipInputId}">Identificação do ${selectedType} <span class="form-required">*</span></label>
            <input type="text" class="form-control" id="${customEquipInputId}" name="${customEquipInputId}" required>
          `;

          // Inserir o novo campo no DOM
          // Tenta inserir após o campo 'other-equipment-field' se ele existir, senão após o dropdown de tipo.
          const referenceNode = otherEquipField || typeSelect?.parentElement;
          if (referenceNode && referenceNode.parentElement) {
              // Insere DEPOIS do nó de referência
               referenceNode.parentElement.insertBefore(customEquipField, referenceNode.nextSibling);
          } else {
               console.error("Não foi possível determinar onde inserir o campo de ID customizado.");
               // Fallback: inserir no final da etapa 1
               document.getElementById('step-1-content')?.appendChild(customEquipField);
          }
        } else {
          // Se já existe, apenas atualiza o label e garante a visibilidade
          const label = customEquipField.querySelector('label');
          if (label) {
            label.innerHTML = `Identificação do ${selectedType} <span class="form-required">*</span>`;
          }
          customEquipField.style.display = 'block'; // Garante que está visível
        }
         // Garante que o input dentro do campo customizado seja obrigatório
         const customInput = document.getElementById(customEquipInputId);
         if(customInput) customInput.required = true;

      } else {
        // 3. Lógica para Tipos Padrão ou Seleção Vazia
        // Esconder o campo de ID personalizado
        if (customEquipField) {
          customEquipField.style.display = 'none';
           const customInput = document.getElementById(customEquipInputId);
           if(customInput) customInput.required = false;
        }

        // Mostrar/Esconder o dropdown de equipamento padrão
        if (equipIdSelectContainer) {
           // Mostrar APENAS se um tipo for selecionado E não for 'Outro'
           const shouldShowStandardSelect = selectedType && selectedType !== 'Outro';
           equipIdSelectContainer.style.display = shouldShowStandardSelect ? 'block' : 'none';
           if(equipIdSelect) equipIdSelect.required = shouldShowStandardSelect;
        }
      }

       // 4. Limpar valores de campos irrelevantes ao mudar o tipo
       if (selectedType !== 'Outro') {
           const otherInput = document.getElementById('other-equipment');
           if (otherInput) otherInput.value = '';
       }
       if (selectedType !== 'Aspirador' && selectedType !== 'Poliguindaste') {
           const customInput = document.getElementById(customEquipInputId);
           if (customInput) customInput.value = '';
       }
       if (selectedType === 'Outro' || selectedType === 'Aspirador' || selectedType === 'Poliguindaste') {
           if (equipIdSelect) equipIdSelect.value = ''; // Limpa seleção do dropdown padrão
       }
    };

     // Remover listener antigo para evitar duplicação
     typeSelect.removeEventListener('change', handleTypeChangeLogic);
     // Adicionar o novo listener
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

      // Não carregar se tipo for vazio ou especial (Outro, Aspirador, Poliguindaste)
      if (!selectedType || selectedType === 'Outro' || selectedType === 'Aspirador' || selectedType === 'Poliguindaste') {
          idSelect.innerHTML = `<option value="">${selectedType ? 'Não aplicável' : 'Selecione o tipo'}</option>`;
          // Container já deve estar escondido por setupEquipmentTypeEvents
          return Promise.resolve();
      }

      // Chamar a API para buscar os IDs (ajuste o nome da função API se necessário)
      return API.getEquipmentIdsByType(selectedType) // Ex: API.getPlacasPorTipo(selectedType)
          .then(response => {
              if (response && response.success && Array.isArray(response.ids)) {
                  idSelect.innerHTML = '<option value="">Selecione a placa/ID...</option>';
                  if (response.ids.length === 0) {
                      idSelect.innerHTML = '<option value="">Nenhum ID encontrado para este tipo</option>';
                      idSelect.disabled = true;
                  } else {
                      response.ids.forEach(id => {
                          if (id !== null && id !== undefined) { // Checa se ID não é nulo/undefined
                              const option = document.createElement('option');
                              option.value = id;
                              option.textContent = id;
                              idSelect.appendChild(option);
                          }
                      });
                      idSelect.disabled = false; // Habilita após carregar
                  }
              } else {
                  console.warn("Resposta da API inválida ou sem sucesso para IDs:", selectedType, response);
                  idSelect.innerHTML = '<option value="">Nenhum ID encontrado</option>';
                  idSelect.disabled = true;
              }
          })
          .catch(error => {
              console.error(`Erro ao carregar IDs para o tipo ${selectedType}:`, error);
              idSelect.innerHTML = '<option value="">Erro ao carregar IDs</option>';
              showNotification(`Erro ao buscar placas/IDs para ${selectedType}.`, "error");
              idSelect.disabled = true;
               return Promise.reject(error); // Propaga o erro se necessário
          });
  }


  function loadProblemCategories() {
    // Usar cache simples para evitar recargas
    if (loadProblemCategories.loaded) return Promise.resolve();

    return API.getProblemCategories() // Ajuste se o método API for diferente
      .then(response => {
        if (response && response.success && Array.isArray(response.categories)) {
          const select = document.getElementById('problem-category');
           if (!select) return;

          select.innerHTML = '<option value="">Selecione a categoria...</option>';

          response.categories.forEach(category => {
             if(category) { // Ignora categorias vazias/nulas
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                select.appendChild(option);
             }
          });
          // Adicionar opção "Outro" no final
           const otherOption = document.createElement('option');
           otherOption.value = 'Outro';
           otherOption.textContent = 'Outro (Especificar)';
           select.appendChild(otherOption);

           loadProblemCategories.loaded = true; // Marca como carregado
        } else {
             console.error("Resposta inválida ou sem sucesso ao carregar categorias de problema:", response);
              showNotification("Não foi possível carregar as categorias de problema.", "warning");
        }
      })
      .catch(error => {
        console.error("Erro na API ao carregar categorias de problema:", error);
         showNotification("Erro ao buscar categorias: " + (error.message || 'Erro desconhecido'), "error");
          const select = document.getElementById('problem-category');
          if(select) select.innerHTML = '<option value="">Erro ao carregar</option>';
      });
  }
   loadProblemCategories.loaded = false; // Inicializar flag de cache

   // Estado para guardar a lista completa e os filtros/busca
   let fullMaintenanceList = [];
   let currentFilter = 'all';
   let currentSearchTerm = '';

   // Carrega a lista completa de manutenções da API
   function loadMaintenanceList() {
       const tableBody = document.getElementById('maintenance-tbody');
       if (!tableBody) return;

       showLoading(true, 'Carregando lista de manutenções...');
       tableBody.innerHTML = '<tr><td colspan="10" class="text-center loading-message">Carregando manutenções...</td></tr>'; // Colspan ajustado para 10 colunas

       API.getMaintenanceList() // Ajuste se o método API for diferente
           .then(response => {
               if (response && response.success && Array.isArray(response.maintenances)) {
                   fullMaintenanceList = response.maintenances;
                   filterAndRenderList(); // Aplica filtros e renderiza
               } else {
                   console.error("Resposta inválida ou sem sucesso da API de manutenções:", response);
                   showNotification("Não foi possível carregar a lista de manutenções.", "error");
                   tableBody.innerHTML = '<tr><td colspan="10" class="text-center error-message">Erro ao carregar dados. Verifique o console.</td></tr>';
               }
           })
           .catch(error => {
               console.error("Erro ao buscar lista de manutenções:", error);
               showNotification("Erro ao buscar manutenções: " + (error.message || 'Erro desconhecido'), "error");
               tableBody.innerHTML = `<tr><td colspan="10" class="text-center error-message">Falha ao conectar com o servidor (${error.message || ''}). Tente novamente.</td></tr>`;
           })
           .finally(() => {
               showLoading(false);
           });
   }

   // Filtra a lista baseado no termo de busca e filtro de status
   function filterAndRenderList() {
       let filteredList = [...fullMaintenanceList]; // Cria cópia para não modificar a original

       // 1. Filtrar por Status (currentFilter)
       if (currentFilter !== 'all') {
           filteredList = filteredList.filter(item => {
               const status = (item.status || 'pendente').toLowerCase().trim(); // Normaliza status
               // Mapeamento flexível de status para filtros
               switch (currentFilter) {
                   case 'pending':
                       return ['pendente', 'aguardando verificacao', 'aguardando verificação'].includes(status);
                   case 'verified':
                       // 'Verificados' pode incluir 'Aprovado', 'Ajustes', 'Reprovado' (status PÓS verificação)
                       return ['verificado', 'aprovado', 'ajustes', 'reprovado'].includes(status);
                   case 'completed':
                       // 'Concluído' é status final
                       return ['concluído', 'concluido', 'completed'].includes(status);
                   case 'critical':
                       // Filtrar por flag de crítico
                       return item.eCritico || item.isCritical;
                   default:
                       return true; // Caso 'all' ou filtro desconhecido
               }
           });
       }


       // 2. Filtrar por Termo de Busca (currentSearchTerm)
       const searchTerm = currentSearchTerm.toLowerCase().trim();
       if (searchTerm) {
           filteredList = filteredList.filter(item => {
                // Função auxiliar para verificar se algum valor do item contém o termo
               const includesTerm = (...values) => values.some(val => String(val || '').toLowerCase().includes(searchTerm));

               return includesTerm(
                   item.id,
                   item.placaOuId, // ID/Placa/Texto
                   item.tipoEquipamento,
                   item.responsavel,
                   item.area,
                   item.localOficina,
                   item.tipoManutencao,
                   item.categoriaProblema,
                   item.categoriaProblemaOutro, // Incluir busca no texto de 'Outro'
                   item.status,
                   item.detalhesproblema // Buscar também nos detalhes? Pode ser útil.
               );
           });
       }

       // 3. Renderizar a lista filtrada
       renderMaintenanceTable(filteredList);
   }

    // Renderiza as linhas da tabela de manutenção
    function renderMaintenanceTable(maintenanceList) {
        const tableBody = document.getElementById('maintenance-tbody');
        if (!tableBody) return;

        tableBody.innerHTML = ''; // Limpa antes de adicionar

        if (maintenanceList.length === 0) {
            const message = currentSearchTerm || currentFilter !== 'all'
                ? 'Nenhuma manutenção encontrada com os filtros aplicados.'
                : 'Nenhuma manutenção registrada ainda.';
            tableBody.innerHTML = `<tr><td colspan="10" class="text-center no-data-message">${message}</td></tr>`;
            return;
        }

        maintenanceList.forEach(item => {
            const row = document.createElement('tr');
            row.setAttribute('data-maintenance-id', item.id); // Adiciona ID à linha para referência futura

            const id = item.id || 'N/A';
            const equipmentId = item.placaOuId || '-'; // Este é o ID/Placa/Texto do equipamento
            const equipmentType = item.tipoEquipamento || 'N/A';
             // Combina ID/Texto e Tipo para exibição, tratando tipos especiais
             let equipmentDisplay = `${equipmentType}`;
             if (equipmentId !== '-') {
                 equipmentDisplay += ` (${equipmentId})`; // Ex: "Aspirador (ASP-001)" ou "Alta Pressão (ABC-1234)" ou "Outro (Nome do Equipamento)"
             }

            const maintenanceType = item.tipoManutencao || '-';
            const regDateStr = item.dataRegistro || item.registrationDate || item.dataManutencao; // Usa data da manutenção como fallback
            const regDate = typeof Utilities !== 'undefined' && Utilities.formatDate ? Utilities.formatDate(regDateStr, false) : formatDate(regDateStr, false); // Usa função global ou local

            const responsible = item.responsavel || '-';
            const area = item.area || '-';
            const office = item.localOficina || '-';
            // Mostrar categoria: usar texto de 'Outro' se aplicável
            const problemCat = item.categoriaProblema === 'Outro' ? (item.categoriaProblemaOutro || 'Outro (não especificado)') : item.categoriaProblema;
            const problem = problemCat || '-';

            const status = item.status || 'Pendente';
            const statusClass = typeof Utilities !== 'undefined' && Utilities.getStatusClass ? Utilities.getStatusClass(status) : getStatusClass(status); // Usa função global ou local
            const isCritical = item.eCritico || item.isCritical || false;

            // Define quais ações são permitidas baseado no status
            const lowerStatus = status.toLowerCase().trim();
            const allowVerification = ['pendente', 'aguardando verificacao', 'aguardando verificação'].includes(lowerStatus);
            const allowEdit = ['pendente', 'aguardando verificacao', 'aguardando verificação', 'ajustes'].includes(lowerStatus); // Permitir editar se pendente ou precisar ajustes
            // const allowDelete = true; // Ou baseado em permissões/status

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
                    <!-- Adicionar botão de excluir se necessário -->
                    <!-- ${allowDelete ? `<button class="btn-icon delete-maintenance" data-id="${id}" title="Excluir Manutenção">🗑️</button>` : ''} -->
                </td>
            `;
            tableBody.appendChild(row);
        });
         // Reaplicar tooltips ou outros plugins após renderizar
         // Exemplo com Tippy.js (se estiver usando)
         if (typeof tippy === 'function') {
             tippy('#maintenance-tbody .btn-icon[title]');
             tippy('#maintenance-tbody .critical-indicator[title]');
             tippy('#maintenance-tbody [title]'); // Tooltip genérico para o problema
         }
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
      event.preventDefault(); // Previne o submit padrão do HTML
      // A validação final deveria ser na etapa 3, mas como não há campos,
      // podemos assumir que se chegou aqui, as etapas anteriores são válidas.
      // Revalidar a etapa 2 como garantia antes de submeter.
      if (validateStep2()) {
          saveStep2Data(); // Garante que os últimos dados foram salvos
          submitMaintenance();
      } else {
          showStep(2); // Volta para a etapa 2 se inválida
          showNotification("Verifique os campos obrigatórios na Etapa 2 antes de finalizar.", "warning");
      }
  }

  // Handler para mudança na categoria de problema (mostrar/esconder campo 'Outro')
  function handleProblemCategoryChange(event) {
      const otherField = document.getElementById('other-category-field');
      const otherInput = document.getElementById('other-category');
       if (!otherField || !otherInput) return;

      if (event.target.value === 'Outro') {
          otherField.style.display = 'block';
          otherInput.required = true;
          otherInput.focus(); // Foco no campo quando ele aparece
      } else {
          otherField.style.display = 'none';
           otherInput.value = ''; // Limpa o campo
           otherInput.required = false;
      }
  }

  // Handler para input de busca
  function handleSearchInput(event) {
      currentSearchTerm = event.target.value || '';
      filterAndRenderList(); // Aplica busca e filtros atuais
  }


  // Handler para cliques nos filtros de status
   function handleFilterClick(event) {
       const target = event.currentTarget; // O div.filter-item clicado
       currentFilter = target.getAttribute('data-filter') || 'all';

       // Atualizar classe 'active' visualmente
       document.querySelectorAll('#tab-maintenance .filter-container .filter-item').forEach(item => {
           item.classList.remove('active');
       });
       target.classList.add('active');

       // Reaplicar filtros e renderizar a lista
       filterAndRenderList();
   }

    // Handler para cliques nos botões de ação da tabela
    function handleTableActionClick(event) {
        const button = event.target.closest('.btn-icon'); // Encontra o botão mais próximo clicado
        if (!button) return; // Sai se o clique não foi em um botão

        const maintenanceId = button.getAttribute('data-id');
        if (!maintenanceId) {
             console.warn("Botão de ação clicado não possui data-id.");
             return;
        }

        // Buscar os dados completos da manutenção clicada na lista local
        const maintenanceData = findMaintenanceByIdInList(maintenanceId);
        if (!maintenanceData) {
            console.error(`Dados completos para manutenção ID ${maintenanceId} não encontrados na lista local.`);
            showNotification(`Não foi possível encontrar os detalhes completos da manutenção ${maintenanceId}. Tente atualizar a lista.`, "warning");
            // Poderia tentar buscar da API aqui como fallback? API.getMaintenanceDetails(maintenanceId)
            return; // Impede a ação se os dados não forem encontrados localmente
        }

        // Executa a ação baseada na classe do botão
        if (button.classList.contains('view-maintenance')) {
            // Tenta chamar função global ou do módulo Details
            if (typeof viewMaintenanceDetails === 'function') {
                viewMaintenanceDetails(maintenanceId, maintenanceData); // Passa os dados completos
            } else if (typeof Details !== 'undefined' && Details.openDetailsModal) {
                 Details.openDetailsModal(maintenanceId, maintenanceData);
            } else {
                 console.error("Função para visualizar detalhes não encontrada (viewMaintenanceDetails ou Details.openDetailsModal).");
                 alert(`Visualizar ID: ${maintenanceId}\n\n${JSON.stringify(maintenanceData, null, 2)}`); // Fallback
            }
        } else if (button.classList.contains('verify-maintenance')) {
             // Tenta chamar função do módulo Verification
            if (typeof Verification !== 'undefined' && Verification.openVerificationForm) {
                Verification.openVerificationForm(maintenanceId, maintenanceData);
            } else {
                 console.error("Módulo/Função de Verificação não encontrado (Verification.openVerificationForm).");
                 alert(`Verificar ID: ${maintenanceId}`); // Fallback
            }
        } else if (button.classList.contains('edit-maintenance')) {
             openMaintenanceForm(maintenanceId, maintenanceData); // Abre o form de manutenção em modo de edição
        } else if (button.classList.contains('delete-maintenance')) {
             handleDeleteMaintenance(maintenanceId, maintenanceData); // Passa dados para mensagem de confirmação
        }
    }

    // Função auxiliar para buscar dados na lista carregada (fullMaintenanceList)
    function findMaintenanceByIdInList(id) {
        // Converte ambos para string para comparação segura, caso ID venha como número
        const stringId = String(id);
        return fullMaintenanceList.find(item => String(item.id) === stringId) || null;
    }

     // Handler para exclusão (se implementado)
     function handleDeleteMaintenance(id, maintenanceData) {
          // Extrair informações para a mensagem de confirmação
         const equipDisplay = maintenanceData?.tipoEquipamento
             ? `${maintenanceData.tipoEquipamento} (${maintenanceData.placaOuId || 'ID desconhecido'})`
             : `ID ${id}`;
         const message = `Tem certeza que deseja excluir a manutenção para ${equipDisplay}? Esta ação não pode ser desfeita.`;

         const confirmCallback = () => {
             showLoading(true, `Excluindo manutenção ${id}...`);
             API.deleteMaintenance(id) // Assumindo que existe API.deleteMaintenance(id)
                 .then(response => {
                     if (response && response.success) {
                         showNotification(`Manutenção ${id} excluída com sucesso.`, 'success');
                         // Remover da lista local e rerenderizar a tabela
                         fullMaintenanceList = fullMaintenanceList.filter(item => String(item.id) !== String(id));
                         filterAndRenderList();
                         // Atualizar contadores/gráficos do dashboard
                         if (typeof Dashboard !== 'undefined' && Dashboard.loadDashboardData) {
                             Dashboard.loadDashboardData(true); // Força recarga do dashboard
                         }
                     } else {
                          console.error(`Erro ao excluir manutenção ${id} (API):`, response);
                         showNotification(`Erro ao excluir manutenção ${id}: ${response?.message || 'Erro desconhecido da API'}.`, 'error');
                     }
                 })
                 .catch(error => {
                     console.error(`Erro de rede/conexão ao excluir manutenção ${id}:`, error);
                     showNotification(`Falha na comunicação ao excluir manutenção ${id}: ${error.message || 'Erro de rede'}.`, 'error');
                 })
                 .finally(() => {
                     showLoading(false);
                 });
         };

         // Usa função de confirmação global ou fallback
          if (typeof Utilities !== 'undefined' && Utilities.showConfirmation) {
             Utilities.showConfirmation(message, confirmCallback);
         } else {
              if(confirm(message)) {
                 confirmCallback();
              }
         }
     }


  // --- Funções de Navegação, Validação e Persistência ---

  function showStep(step) {
    // Atualizar indicadores visuais das etapas (bolinhas/números)
    document.querySelectorAll('.form-steps .form-step').forEach((el) => {
        const stepNumber = parseInt(el.getAttribute('data-step'), 10);
        if (stepNumber == step) {
            el.classList.add('active');
             el.classList.remove('completed'); // Remove completed se voltamos para a etapa
        } else if (stepNumber < step) {
             el.classList.remove('active');
             el.classList.add('completed'); // Marca etapas anteriores como completas
        } else {
             el.classList.remove('active');
             el.classList.remove('completed'); // Garante que etapas futuras não estejam ativas/completas
        }
    });

    // Mostrar/Esconder conteúdo das etapas
    document.querySelectorAll('.form-step-content').forEach(el => {
      el.style.display = 'none';
    });
    const currentStepContent = document.getElementById(`step-${step}-content`);
    if (currentStepContent) {
        currentStepContent.style.display = 'block';
    } else {
        console.error(`Conteúdo da etapa ${step} (ID: step-${step}-content) não encontrado.`);
    }
  }

  // ================================================================
  // === INÍCIO: CÓDIGO ATUALIZADO PARA VALIDAÇÃO E SALVAMENTO    ===
  // ================================================================
  // Valida os campos obrigatórios da etapa 1
  function validateStep1() {
    let isValid = true;
    let firstInvalid = null;

     // Limpar erros anteriores da Etapa 1
     clearValidationErrors(1);

    // Lista base de campos obrigatórios
    const requiredFields = [
      { id: 'equipment-type', name: 'Tipo de Equipamento' },
      { id: 'technician-name', name: 'Responsável pelo Relatório' }, // Nome do campo pode variar
      { id: 'maintenance-date', name: 'Data da Manutenção' },
      { id: 'area', name: 'Área' },
      { id: 'office', name: 'Local/Oficina' },
      { id: 'maintenance-type', name: 'Tipo de Manutenção' }
    ];

    // Verificar tipo de equipamento para adicionar validação do campo de ID correto
    const equipType = document.getElementById('equipment-type').value;

    if (equipType === 'Outro') {
      requiredFields.push({ id: 'other-equipment', name: 'Especificar Equipamento' });
    }
    // Validar o campo customizado para Aspirador/Poliguindaste
    else if (equipType === 'Aspirador' || equipType === 'Poliguindaste') {
      // Usa o ID do input customizado que foi criado dinamicamente
      requiredFields.push({ id: 'custom-equipment-id', name: `Identificação do ${equipType}` });
    }
    // Para outros tipos (exceto vazio), validar o dropdown padrão
    else if (equipType) {
      requiredFields.push({ id: 'equipment-id', name: 'Placa ou ID' });
    }
     // Se equipType for vazio, o próprio 'equipment-type' será marcado como inválido abaixo

    // Iterar e validar
    requiredFields.forEach(field => {
      const element = document.getElementById(field.id);
      let isFieldValid = false;

      if (element) {
           // Checa se o valor existe e não é apenas espaços em branco
           // Para selects, value vazio ('') significa que nenhuma opção válida foi selecionada
           if (element.value && element.value.trim() !== '') {
               isFieldValid = true;
           }
      } else {
         console.warn(`Elemento de validação não encontrado: #${field.id} (Campo: ${field.name})`);
          // Considera inválido se o elemento esperado não existe
      }

      if (!isFieldValid) {
          isValid = false;
          // Marcar erro visualmente no campo (se existir)
          if (element) {
               markFieldError(element, `${field.name} é obrigatório.`);
               if (!firstInvalid) firstInvalid = element; // Guarda o primeiro campo inválido para focar
          } else {
              // Se o campo não existe, mostrar um erro mais genérico ou logar
              console.error(`Campo obrigatório "${field.name}" (ID: ${field.id}) não está presente no formulário.`);
               // Opcional: Marcar erro em um campo relacionado, ex: o tipo de equipamento
               const typeSelect = document.getElementById('equipment-type');
               if(typeSelect && field.id !== 'equipment-type') {
                    markFieldError(typeSelect, `Erro: ${field.name} não encontrado.`);
                    if (!firstInvalid) firstInvalid = typeSelect;
               }
          }
      }
    });

    if (!isValid) {
      showNotification("Por favor, preencha todos os campos obrigatórios da Etapa 1.", "warning");
      if (firstInvalid) {
          // Scroll para o elemento e foca nele
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstInvalid.focus();
      }
    }

    return isValid;
  }


    // Valida os campos obrigatórios da etapa 2
    function validateStep2() {
        let isValid = true;
        let firstInvalidElement = null;

         // Limpar erros anteriores da Etapa 2
         clearValidationErrors(2);

        // Campos obrigatórios
        const requiredFields = [
            { id: 'problem-category', name: 'Categoria do Problema' },
            { id: 'problem-description', name: 'Detalhes do Problema' } // Textarea
        ];

         // Validação condicional para 'Outra Categoria'
         const categoryValue = document.getElementById('problem-category')?.value;
         if (categoryValue === 'Outro') {
             requiredFields.push({ id: 'other-category', name: 'Especificar Categoria' });
         }

        // Iterar e validar
        requiredFields.forEach(fieldInfo => {
            const element = document.getElementById(fieldInfo.id);
            let isFieldValid = false;
             if (element) {
                  if (element.value && element.value.trim() !== '') {
                      isFieldValid = true;
                  }
             } else {
                  console.warn(`Elemento de validação não encontrado: #${fieldInfo.id} (Campo: ${fieldInfo.name})`);
             }

             if (!isFieldValid) {
                  isValid = false;
                  if(element) {
                      markFieldError(element, `${fieldInfo.name} é obrigatório.`);
                      if (!firstInvalidElement) firstInvalidElement = element;
                  } else {
                       console.error(`Campo obrigatório "${fieldInfo.name}" (ID: ${fieldInfo.id}) não está presente na Etapa 2.`);
                       const fallbackElement = document.getElementById('problem-category');
                       if(fallbackElement) {
                           markFieldError(fallbackElement, `Erro: ${fieldInfo.name} não encontrado.`);
                           if (!firstInvalidElement) firstInvalidElement = fallbackElement;
                       }
                  }
             }
        });

        if (!isValid) {
            showNotification("Por favor, preencha todos os campos obrigatórios da Etapa 2.", "warning");
             if (firstInvalidElement) {
                 firstInvalidElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                 firstInvalidElement.focus();
             }
        }
        return isValid;
    }

    // Função auxiliar para marcar erro em um campo
    function markFieldError(element, message) {
        if (!element) return;
        element.style.borderColor = 'red';
        element.setAttribute('aria-invalid', 'true'); // Para acessibilidade

        // Encontrar ou criar span de erro associado
        const errorSpanId = element.id + '-error';
        let errorSpan = document.getElementById(errorSpanId);
        const parent = element.parentElement; // Assume que o span deve ir dentro do mesmo container

        if (!errorSpan && parent) {
            errorSpan = document.createElement('span');
            errorSpan.id = errorSpanId;
            errorSpan.className = 'error-message-field'; // Classe para estilização CSS
            errorSpan.setAttribute('role', 'alert'); // Acessibilidade
            errorSpan.style.display = 'none'; // Começa escondido
             // Inserir após o elemento ou no final do pai
             parent.appendChild(errorSpan); // Mais simples
        }
         if(errorSpan) {
            errorSpan.textContent = message;
            errorSpan.style.display = 'block'; // Torna visível
            // Estilos básicos (idealmente via CSS)
            errorSpan.style.color = '#d93025'; // Vermelho erro
            errorSpan.style.fontSize = '0.8em';
            errorSpan.style.marginTop = '4px';
         }
    }

    // Função auxiliar para limpar erros de validação de uma etapa
    function clearValidationErrors(step) {
        const stepContent = document.getElementById(`step-${step}-content`);
        if (!stepContent) return;

        stepContent.querySelectorAll('[aria-invalid="true"]').forEach(el => {
            if(el.style) el.style.borderColor = ''; // Resetar borda
            el.removeAttribute('aria-invalid');
            const errorSpan = document.getElementById(el.id + '-error');
            if (errorSpan) {
                errorSpan.textContent = ''; // Limpar mensagem
                errorSpan.style.display = 'none'; // Esconder span
            }
        });
         // Limpa também spans de erro que possam ter ficado órfãos
         stepContent.querySelectorAll('.error-message-field').forEach(span => {
             if (!document.getElementById(span.id.replace('-error', ''))?.hasAttribute('aria-invalid')) {
                 span.textContent = '';
                 span.style.display = 'none';
             }
         });
    }

  // Salva os dados da etapa 1 no estado 'formData'
  function saveStep1Data() {
    formData.equipmentType = document.getElementById('equipment-type')?.value || '';

    // Capturar o ID apropriado com base no tipo de equipamento selecionado
    if (formData.equipmentType === 'Aspirador' || formData.equipmentType === 'Poliguindaste') {
      // Pega o valor do campo de input customizado
      const customIdInput = document.getElementById('custom-equipment-id');
      formData.customEquipmentId = customIdInput ? customIdInput.value.trim() : ''; // Salva no campo customizado
      formData.equipmentId = ''; // Limpa o campo de ID padrão
      formData.otherEquipment = ''; // Limpa o campo 'Outro'
    } else if (formData.equipmentType === 'Outro') {
      // Pega o valor do campo 'Especificar Equipamento'
      formData.otherEquipment = document.getElementById('other-equipment')?.value.trim() || '';
      formData.equipmentId = ''; // Limpa o campo de ID padrão
      formData.customEquipmentId = ''; // Limpa o campo customizado
    } else {
      // Pega o valor do dropdown de ID padrão
      formData.equipmentId = document.getElementById('equipment-id')?.value || '';
      formData.otherEquipment = ''; // Limpa o campo 'Outro'
      formData.customEquipmentId = ''; // Limpa o campo customizado
    }

    // Salva os demais campos da Etapa 1
    formData.technician = document.getElementById('technician-name')?.value.trim() || '';
    formData.date = document.getElementById('maintenance-date')?.value || '';
    formData.area = document.getElementById('area')?.value || '';
    formData.office = document.getElementById('office')?.value.trim() || '';
    formData.maintenanceType = document.getElementById('maintenance-type')?.value || '';
    formData.isCritical = document.getElementById('is-critical')?.checked || false;
  }

  // Salva os dados da etapa 2 no estado 'formData'
  function saveStep2Data() {
    formData.problemCategory = document.getElementById('problem-category')?.value || '';
    // Salva o valor de 'Outro' apenas se for a categoria selecionada
    if (formData.problemCategory === 'Outro') {
        formData.otherCategory = document.getElementById('other-category')?.value.trim() || '';
    } else {
        formData.otherCategory = ''; // Limpa se não for 'Outro'
    }
    formData.problemDescription = document.getElementById('problem-description')?.value.trim() || '';
    formData.additionalNotes = document.getElementById('additional-notes')?.value.trim() || '';
  }

   // Atualiza o resumo na etapa 3 com os dados do 'formData'
  function updateSummary() {
      // Função auxiliar para buscar texto de um select, tratando caso não ache
      const getSelectText = (id) => {
          const select = document.getElementById(id);
          if (select && select.selectedIndex >= 0) {
              // Verifica se a opção selecionada tem um valor (não é o placeholder)
               if (select.value) {
                   return select.options[select.selectedIndex].text;
               }
          }
          return '-'; // Retorna '-' se select não encontrado, sem seleção ou seleção de placeholder
      };

      // Equipamento (lógica atualizada para mostrar o ID correto)
      let equipmentDisplay = '-';
      const equipType = formData.equipmentType;
      const typeText = getSelectText('equipment-type');

      if (equipType === 'Outro') {
          equipmentDisplay = `${typeText}: ${formData.otherEquipment || '(Não especificado)'}`;
      } else if (equipType === 'Aspirador' || equipType === 'Poliguindaste') {
          equipmentDisplay = `${typeText} (${formData.customEquipmentId || 'ID não informado'})`;
      } else if (equipType) {
           const idText = getSelectText('equipment-id');
           // Se o texto do ID for '-', usar o valor do formData.equipmentId como fallback
           const detail = (idText !== '-') ? idText : (formData.equipmentId || 'ID não selecionado');
           equipmentDisplay = `${typeText} (${detail})`;
      }
       document.getElementById('summary-equipment').textContent = equipmentDisplay;

      // Responsável
      document.getElementById('summary-technician').textContent = formData.technician || '-';

      // Data
       const formattedDate = (typeof Utilities !== 'undefined' && Utilities.formatDate)
            ? Utilities.formatDate(formData.date, false)
            : formatDate(formData.date, false); // Usa função global ou local
      document.getElementById('summary-date').textContent = formattedDate;

      // Local (Área / Oficina)
      const areaText = getSelectText('area');
      const location = `${areaText !== '-' ? areaText : (formData.area || 'Área não informada')} / ${formData.office || 'Oficina não informada'}`;
      document.getElementById('summary-location').textContent = location;

      // Tipo Manutenção
      document.getElementById('summary-type').textContent = getSelectText('maintenance-type');

      // É Crítica
      document.getElementById('summary-critical').textContent = formData.isCritical ? 'Sim' : 'Não';

      // Categoria de Problema
      let categoryDisplay = '-';
      const problemCat = formData.problemCategory;
      if (problemCat === 'Outro') {
          categoryDisplay = `Outro: ${formData.otherCategory || '(Não especificada)'}`;
      } else if (problemCat) {
          categoryDisplay = getSelectText('problem-category');
      }
      document.getElementById('summary-category').textContent = categoryDisplay;

      // Detalhes do Problema
      document.getElementById('summary-problem').textContent = formData.problemDescription || '-';

      // Observações
      document.getElementById('summary-notes').textContent = formData.additionalNotes || '-';
  }

  // Envia os dados para a API (criação ou atualização)
  function submitMaintenance() {
      const loadingMessage = isEditMode ? `Atualizando manutenção ${editingMaintenanceId}...` : 'Registrando nova manutenção...';
      showLoading(true, loadingMessage);

      // Construir o payload final para a API a partir do formData
      // Decidir qual campo de ID/nome enviar para a API
      let finalEquipmentIdentifier = '';
      if (formData.equipmentType === 'Outro') {
          finalEquipmentIdentifier = formData.otherEquipment; // Enviar o texto digitado
      } else if (formData.equipmentType === 'Aspirador' || formData.equipmentType === 'Poliguindaste') {
          finalEquipmentIdentifier = formData.customEquipmentId; // Enviar o ID customizado
      } else {
          finalEquipmentIdentifier = formData.equipmentId; // Enviar o ID do dropdown
      }

      // Lógica para categoria de problema
       let finalProblemCategory = formData.problemCategory;
       let finalOtherCategoryValue = null; // Campo para enviar o texto 'Outro' separadamente se necessário
       if (formData.problemCategory === 'Outro') {
           // Opção 1: API espera 'Outro' na categoria e o texto em outro campo
           finalOtherCategoryValue = formData.otherCategory;
           // Opção 2: API espera apenas o texto digitado no campo categoria principal
           // finalProblemCategory = formData.otherCategory;
       }

      // Mapear formData para o formato esperado pela API
      // Atenção aos nomes das chaves esperadas pela API!
      const apiData = {
          tipoEquipamento: formData.equipmentType,
          placaOuId: finalEquipmentIdentifier, // Nome da chave pode variar
          // Se a API diferenciar o tipo de ID:
          // equipamentoId: formData.equipmentId,
          // equipamentoOutroNome: formData.otherEquipment,
          // equipamentoCustomId: formData.customEquipmentId,
          responsavel: formData.technician,
          dataManutencao: formData.date,
          area: formData.area,
          localOficina: formData.office,
          tipoManutencao: formData.maintenanceType,
          eCritico: formData.isCritical, // Nome da chave pode ser isCritical
          categoriaProblema: finalProblemCategory,
          // Se a API espera o texto 'Outro' separado:
          // categoriaProblemaOutro: finalOtherCategoryValue,
          detalhesproblema: formData.problemDescription, // Nome da chave pode variar
          observacoes: formData.additionalNotes,
          // Se for edição, pode ser necessário enviar o status atual ou deixar a API definir
          // status: isEditMode ? formData.status : 'Pendente' // Exemplo
      };

       // Escolher a função da API correta (salvar vs atualizar)
       const apiCall = isEditMode
           ? API.updateMaintenance(editingMaintenanceId, apiData) // Assumindo API.updateMaintenance(id, data)
           : API.saveMaintenance(apiData); // Assumindo API.saveMaintenance(data)

      apiCall
          .then(response => {
              if (response && response.success) {
                  const successMessage = isEditMode
                      ? `Manutenção ${editingMaintenanceId} atualizada com sucesso!`
                      : `Manutenção registrada com sucesso! ID: ${response.id || '(sem ID)'}`; // Usa o ID retornado pela API se houver
                  showNotification(successMessage, 'success');
                  document.getElementById('maintenance-form-overlay').style.display = 'none';
                  resetForm(); // Limpa o formulário

                  // Atualizar a lista de manutenções e o dashboard
                  loadMaintenanceList();
                  if (typeof Dashboard !== 'undefined' && Dashboard.loadDashboardData) {
                       Dashboard.loadDashboardData(true); // Força recarga do dashboard
                  }

              } else {
                   // API retornou sucesso=false
                  console.error("Erro retornado pela API ao salvar/atualizar:", response);
                  const errorMessage = isEditMode ? 'Erro ao atualizar manutenção' : 'Erro ao salvar manutenção';
                  // Tenta usar a mensagem da API, senão uma genérica
                  showNotification(`${errorMessage}: ${response?.message || 'Verifique os dados e tente novamente.'}.`, 'error');
              }
          })
          .catch(error => {
               // Erro de rede, conexão ou exceção não tratada
              console.error("Erro na requisição API:", error);
               const failureMessage = isEditMode ? 'Falha ao comunicar com o servidor para atualizar' : 'Falha ao comunicar com o servidor para registrar';
               // Tenta extrair detalhes do erro
               let detail = error.message || 'Erro desconhecido';
               if (error.response && error.response.data && error.response.data.message) {
                   detail = error.response.data.message; // Se a API retornar JSON com erro
               }
              showNotification(`${failureMessage}: ${detail}. Verifique sua conexão ou contate o suporte.`, 'error');
          })
          .finally(() => {
              showLoading(false); // Esconde o indicador de loading
          });
  }
  // ================================================================
  // === FIM: CÓDIGO ATUALIZADO PARA VALIDAÇÃO E SALVAMENTO       ===
  // ================================================================


  // --- Funções Auxiliares (Podem ir para utilities.js) ---
   // Mover debounce para utilities.js se possível
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const context = this; // Preserva o contexto original
            const later = () => {
                timeout = null; // Limpa timeout antes de executar
                func.apply(context, args); // Usa apply para manter contexto e argumentos
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

     // --- Funções Globais Auxiliares (Esperadas de utilities.js ou global) ---
     // Implementações de exemplo (DEVEM existir em outro lugar ou em Utilities)
     function showLoading(show, message = 'Carregando...') {
          // Idealmente chamar Utilities.showLoading(show, message);
         const loader = document.getElementById('global-loader');
         const loaderMessage = document.getElementById('global-loader-message');
         if (loader) {
             loader.style.display = show ? 'flex' : 'none';
             if (show && loaderMessage) {
                 loaderMessage.textContent = message;
             }
         } else if (show) {
             console.log("Loading indicator not found. Message:", message);
         }
     }
     function showNotification(message, type = 'info') {
          // Idealmente chamar Utilities.showNotification(message, type);
         if (typeof Utilities !== 'undefined' && Utilities.showToast) {
             Utilities.showToast(message, type);
         } else {
              console.log(`[${type.toUpperCase()}] Notification: ${message}`);
              alert(`[${type.toUpperCase()}] ${message}`); // Fallback muito básico
         }
     }
     function showConfirmation(message, onConfirm, onCancel = null) {
          // Idealmente chamar Utilities.showConfirmation(message, onConfirm, onCancel);
         if (confirm(message)) { // Fallback básico
             if (typeof onConfirm === 'function') onConfirm();
         } else {
             if (typeof onCancel === 'function') onCancel();
         }
     }
     // Função formatDate movida para utilities.js idealmente, mas mantida aqui como fallback
     function formatDate(dateString, includeTime = false) {
         if (!dateString) return '-';
         try {
             // Tenta analisar a string. Date.parse é mais robusto.
             const timestamp = Date.parse(dateString);
             if (isNaN(timestamp)) {
                  // Se falhar, pode ser um formato inesperado. Retorna original.
                  console.warn(`Formato de data inválido encontrado: ${dateString}`);
                  return dateString;
             }
             const date = new Date(timestamp);

             const optionsDate = { day: '2-digit', month: '2-digit', year: 'numeric' }; // Ex: 15/07/2024
             const optionsTime = { hour: '2-digit', minute: '2-digit' }; // Ex: 14:30

             let formatted = date.toLocaleDateString('pt-BR', optionsDate);
             if (includeTime) {
                  // Adiciona hora apenas se a data original provavelmente continha hora
                  const originalHasTime = /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(dateString);
                  if (originalHasTime || (date.getHours() !== 0 || date.getMinutes() !== 0)) {
                      formatted += ' ' + date.toLocaleTimeString('pt-BR', optionsTime);
                  }
             }
             return formatted;
         } catch (e) {
             console.error("Erro ao formatar data:", dateString, e);
             return dateString; // Retorna original em caso de erro
         }
     }
     // Função getStatusClass movida para utilities.js idealmente, mas mantida aqui como fallback
     function getStatusClass(status) {
          if (!status) return 'pendente';
          // Converte para minúsculas, remove acentos, substitui espaços e caracteres não alfanuméricos
          return status.toLowerCase()
                     .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                     .replace(/[^a-z0-9]+/g, '-') // Substitui sequências de não-alfanuméricos por hífen
                     .replace(/^-+|-+$/g, ''); // Remove hífens no início/fim
     }
     // --- Fim Funções Globais Auxiliares ---


  // Expor funções públicas necessárias para interação externa (ex: botões, outras tabs)
  return {
    initialize,
    openMaintenanceForm, // Para botão "Nova Manutenção" e botão "Editar"
    loadMaintenanceList // Para refresh manual ou ao ativar a aba
  };
})();

// Inicializar o módulo Maintenance quando o DOM estiver pronto e dependências carregadas
document.addEventListener('DOMContentLoaded', function() {
   // Verificação robusta de dependências essenciais (API)
   if (typeof API === 'undefined' || typeof API.getMaintenanceFormData !== 'function' /* adicione outras funções API essenciais */) {
        console.error("Erro CRÍTICO: O módulo API ou suas funções essenciais não estão disponíveis. O módulo Maintenance não pode ser inicializado.");
        // Mostrar mensagem de erro para o usuário e desabilitar funcionalidades
        const errorMsg = "Falha ao carregar componentes essenciais (API). Funcionalidades de manutenção estão indisponíveis.";
        showNotification(errorMsg, 'error');
         // Desabilitar botão de nova manutenção, etc.
         const newMaintButton = document.getElementById('new-maintenance');
         if(newMaintButton) {
             newMaintButton.disabled = true;
             newMaintButton.title = errorMsg;
         }
         // Poderia esconder a tab inteira ou mostrar uma mensagem nela
        return; // Impede a inicialização do módulo
   }

   // Verificar dependências opcionais (Utilities)
   if (typeof Utilities === 'undefined') {
        console.warn("Aviso: Módulo Utilities não encontrado. Funções auxiliares como notificações e formatação podem usar fallbacks básicos.");
   }

  // Se as dependências essenciais estão OK, inicializar
  console.log("DOM carregado. Inicializando módulo Maintenance...");
  try {
     Maintenance.initialize();
  } catch(initError) {
       console.error("Erro fatal durante a inicialização do módulo Maintenance:", initError);
       showNotification("Erro crítico ao iniciar o módulo de Manutenção. Verifique o console.", "error");
       // Desabilitar funcionalidades aqui também
       const newMaintButton = document.getElementById('new-maintenance');
       if(newMaintButton) newMaintButton.disabled = true;
       return;
  }

  // Carregar a lista de manutenções se a aba correspondente estiver ativa
  // (Assumindo que existe um sistema de abas e a função 'getCurrentActiveTab' ou similar)
   const maintenanceTab = document.getElementById('tab-maintenance');
   // Verifica se a aba existe E está ativa OU se não há sistema de abas detectado (ex: maintenanceTab é null mas a tabela existe)
   const maintenanceTableBody = document.getElementById('maintenance-tbody');
   if (maintenanceTableBody && (!maintenanceTab || maintenanceTab.classList.contains('active'))) {
        console.log("Carregando lista de manutenções na inicialização (Tab ativa ou sem sistema de tabs).");
       Maintenance.loadMaintenanceList();
   } else {
        console.log("Lista de manutenções não será carregada na inicialização (Tab inativa ou tabela não encontrada).");
   }
});
