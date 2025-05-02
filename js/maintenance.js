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
    equipmentId: '',
    otherEquipment: '',
    newEquipmentId: '', // Campo adicionado para Aspirador/Poliguindaste
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
    // loadEquipmentIds() é chamado via evento change do tipo de equipamento
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

    // Listener para o select de Tipo de Equipamento para carregar IDs (se necessário, pois setupEquipmentTypeEvents já faz)
    const equipmentTypeSelect = document.getElementById('equipment-type');
    // O listener principal para Tipo de Equipamento agora é setupEquipmentTypeEvents
    // Mas ainda podemos precisar carregar IDs *após* a seleção (se não for Outro/Aspirador/Poli)
    if (equipmentTypeSelect) {
        equipmentTypeSelect.addEventListener('change', () => {
            const selectedType = equipmentTypeSelect.value;
            // Só carrega IDs se não for um tipo especial que usa campo de texto
            if (selectedType && selectedType !== 'Outro' && selectedType !== 'Aspirador' && selectedType !== 'Poliguindaste') {
                loadEquipmentIds();
            }
        });
    }


    // Listener para o botão de refresh da lista de manutenções (se existir na aba Manutenções)
    const refreshListButton = document.getElementById('refresh-maintenance-list');
    if (refreshListButton) refreshListButton.addEventListener('click', () => loadMaintenanceList());

    // Listeners para filtros e busca na aba Manutenções
    const searchInput = document.getElementById('maintenance-search');
    if (searchInput) searchInput.addEventListener('input', debounce(filterAndRenderList, 300)); // Aplica debounce

    const filterItems = document.querySelectorAll('.filter-container .filter-item');
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
          populateFormForEdit(dataToEdit); // Popula antes de mostrar o overlay
          document.querySelector('#maintenance-form-overlay .form-title').textContent = 'Editar Manutenção';
           // Mudar texto do botão de submit
           const submitButton = document.getElementById('submit-maintenance');
           if(submitButton) submitButton.textContent = 'Salvar Alterações';
      } else {
          isEditMode = false;
          editingMaintenanceId = null;
          document.querySelector('#maintenance-form-overlay .form-title').textContent = 'Registrar Nova Manutenção';
           // Resetar texto do botão de submit
           const submitButton = document.getElementById('submit-maintenance');
           if(submitButton) submitButton.textContent = 'Finalizar Registro';
      }
      showStep(1); // Começa sempre na etapa 1
      const overlay = document.getElementById('maintenance-form-overlay');
      if(overlay) overlay.style.display = 'block';

       // Após popular e tornar visível, garantir que o estado visual dos campos de equipamento esteja correto
       const typeSelect = document.getElementById('equipment-type');
       if(typeSelect) {
           // Dispara manualmente o evento change para garantir que setupEquipmentTypeEvents seja executado
           // com os valores preenchidos do modo de edição.
           typeSelect.dispatchEvent(new Event('change'));
       }
  }

   function populateFormForEdit(data) {
       // Preencher campos da Etapa 1
       setSelectValue('equipment-type', data.tipoEquipamento);

       // Esperar o carregamento dos tipos (se necessário) e então definir o valor
       // O evento change disparado em openMaintenanceForm cuidará da lógica de exibição
       const selectedType = data.tipoEquipamento;
       if (selectedType === 'Outro') {
           document.getElementById('other-equipment').value = data.placaOuId || '';
       } else if (selectedType === 'Aspirador' || selectedType === 'Poliguindaste') {
            // O campo #new-equipment-id pode não existir ainda, setupEquipmentTypeEvents o criará
            // Precisamos definir o valor DEPOIS que o campo for criado pelo evento change
            // Solução: Armazenar temporariamente e definir no listener de change se estiver em modo de edição
            // OU chamar setupEquipmentTypeEvents aqui e então preencher
            setupEquipmentTypeEvents(); // Garante que o campo existe se necessário
            const newEquipInput = document.getElementById('new-equipment-id');
            if (newEquipInput) {
                 newEquipInput.value = data.placaOuId || '';
            } else {
                 console.warn("Campo new-equipment-id não encontrado após setupEquipmentTypeEvents.");
            }
            // Esconder dropdown padrão (o evento change fará isso)
       } else {
            // Tipo padrão, carregar IDs e selecionar
            loadEquipmentIds().then(() => {
                setSelectValue('equipment-id', data.placaOuId);
            });
       }

       document.getElementById('technician-name').value = data.responsavel || '';
       document.getElementById('maintenance-date').value = data.dataManutencao || '';
       setSelectValue('area', data.area);
       document.getElementById('office').value = data.localOficina || '';
       setSelectValue('maintenance-type', data.tipoManutencao);
       document.getElementById('is-critical').checked = data.eCritico || false;

       // Preencher campos da Etapa 2
       formData = { ...formData, ...data }; // Atualiza formData com dados existentes
       setSelectValue('problem-category', data.categoriaProblema);
        // Precisamos garantir que handleProblemCategoryChange seja chamado
        const categorySelect = document.getElementById('problem-category');
        if(categorySelect) categorySelect.dispatchEvent(new Event('change')); // Dispara o evento

       if (data.categoriaProblema === 'Outro') {
            document.getElementById('other-category').value = data.categoriaProblemaOutro || data.categoriaProblema; // Usa campo específico se houver
            document.getElementById('other-category-field').style.display = 'block';
       } else {
            document.getElementById('other-category-field').style.display = 'none';
       }
       document.getElementById('problem-description').value = data.detalhesproblema || '';
       document.getElementById('additional-notes').value = data.observacoes || '';
   }

    // Função auxiliar para definir valor de um select (tratando caso a option não exista)
    function setSelectValue(selectId, value) {
        const select = document.getElementById(selectId);
        if (select && value !== undefined && value !== null) {
            // Procurar pelo valor exato
            let optionExists = Array.from(select.options).some(opt => opt.value === value);

            if (optionExists) {
                select.value = value;
            } else {
                 // Tentar encontrar valor case-insensitive ou com espaços (flexibilidade)
                 const lowerValue = String(value).toLowerCase().trim();
                 const foundOption = Array.from(select.options).find(opt => opt.value.toLowerCase().trim() === lowerValue);
                 if (foundOption) {
                      select.value = foundOption.value; // Usa o valor original da option encontrada
                      optionExists = true;
                 }
            }

            if (!optionExists) {
                console.warn(`Valor "${value}" não encontrado no select "${selectId}". Verificando texto...`);
                 // Tentar encontrar pelo texto da option como fallback
                 const textValue = String(value).trim();
                 const foundOptionByText = Array.from(select.options).find(opt => opt.textContent.trim() === textValue);
                 if (foundOptionByText) {
                     select.value = foundOptionByText.value;
                     console.log(`Valor "${value}" encontrado pelo TEXTO no select "${selectId}". Usando value "${foundOptionByText.value}".`);
                     optionExists = true;
                 } else {
                    console.warn(`Valor "${value}" TAMBÉM não encontrado pelo TEXTO no select "${selectId}". Definindo como vazio.`);
                    select.value = ""; // Define como vazio ou outra opção padrão
                 }
            }
             // Disparar evento change é importante mas pode causar loops ou chamadas indesejadas
             // É melhor chamar explicitamente as funções que dependem dele após setar todos os valores.
             // select.dispatchEvent(new Event('change')); // CUIDADO com esta linha aqui
        } else if (select) {
             select.value = ""; // Define como vazio se o valor for nulo/undefined
        }
    }

  function closeForm() {
    // Usar uma função global de confirmação se existir
    const confirmationMessage = isEditMode ? 'Descartar alterações não salvas?' : 'Cancelar o registro da nova manutenção?';
     if (typeof showConfirmation === 'function') {
         showConfirmation(confirmationMessage, () => {
              document.getElementById('maintenance-form-overlay').style.display = 'none';
              resetForm(); // Limpa o formulário ao fechar
         });
     } else {
        if (confirm(confirmationMessage)) {
          document.getElementById('maintenance-form-overlay').style.display = 'none';
          resetForm();
        }
     }
  }

  function resetForm() {
    // Limpar dados do estado interno
    formData = {
      equipmentType: '', equipmentId: '', otherEquipment: '', newEquipmentId: '',
      technician: '', date: '', area: '', office: '', maintenanceType: '', isCritical: false,
      problemCategory: '', otherCategory: '', problemDescription: '', additionalNotes: ''
    };
    isEditMode = false;
    editingMaintenanceId = null;

    // Resetar campos do formulário HTML
    const form = document.getElementById('maintenance-form');
    if (form) form.reset();

    // Esconder campos condicionais
    const otherEquipField = document.getElementById('other-equipment-field');
    if (otherEquipField) otherEquipField.style.display = 'none';
    const otherCatField = document.getElementById('other-category-field');
    if (otherCatField) otherCatField.style.display = 'none';
    const newEquipField = document.getElementById('new-equipment-field'); // Campo para Aspirador/Poli
    if (newEquipField) newEquipField.style.display = 'none';

     // Garantir que o dropdown de ID padrão esteja visível
     const equipIdSelect = document.getElementById('equipment-id');
     if (equipIdSelect && equipIdSelect.parentElement) {
        equipIdSelect.parentElement.style.display = 'block'; // Ou 'flex' ou o que for apropriado
     }


    // Redefinir bordas de validação e mensagens de erro
    document.querySelectorAll('#maintenance-form .form-control, #maintenance-form .form-check input').forEach(el => {
        if(el.style) el.style.borderColor = ''; // Resetar borda
    });
    document.querySelectorAll('#maintenance-form .error-message-field').forEach(span => {
        span.textContent = '';
        span.style.display = 'none';
    });


     // Resetar título e botão de submit
     const titleElement = document.querySelector('#maintenance-form-overlay .form-title');
     if(titleElement) titleElement.textContent = 'Registrar Nova Manutenção';
     const submitButton = document.getElementById('submit-maintenance');
     if(submitButton) submitButton.textContent = 'Finalizar Registro';


    // Voltar para etapa 1
    showStep(1);
  }

  // --- Funções de Carregamento de Dados (Dropdowns, Lista) ---

  // === INÍCIO: CÓDIGO DA ATUALIZAÇÃO PARA loadEquipmentTypes ===
  // Modificação na função loadEquipmentTypes
    function loadEquipmentTypes() {
      // Usando a API correta - verificar se o método existe
      if (typeof API.getEquipmentTypes === 'function') {
        API.getEquipmentTypes()
          .then(response => {
            const select = document.getElementById('equipment-type');
            if (!select) return; // Sai se o select não existe

            select.innerHTML = '<option value="">Selecione o tipo...</option>';

            if (response.success) {
              // Tipos básicos a serem garantidos
              let combinedTypes = [];

              // Adicionar tipos da resposta da API, evitando duplicatas
              if (response.types && Array.isArray(response.types)) {
                response.types.forEach(type => {
                    // Normaliza para comparação (remove espaços extras, minúsculas)
                    const normalizedType = type ? String(type).trim().toLowerCase() : null;
                    if (normalizedType && !combinedTypes.some(t => String(t).trim().toLowerCase() === normalizedType)) {
                        combinedTypes.push(String(type).trim()); // Adiciona o tipo original trimado
                    }
                });
              } else {
                 console.warn("API.getEquipmentTypes retornou sucesso mas 'types' não é um array ou está ausente.");
              }

              // Garantir que os tipos necessários estão presentes (comparação case-insensitive)
              const requiredTypes = ['Alta Pressão', 'Auto Vácuo / Hiper Vácuo', 'Aspirador', 'Poliguindaste'];
              requiredTypes.forEach(reqType => {
                 const normalizedReqType = reqType.toLowerCase().trim();
                 if (!combinedTypes.some(t => String(t).toLowerCase().trim() === normalizedReqType)) {
                    combinedTypes.push(reqType); // Adiciona se não existir
                 }
              });

              // Ordenar alfabeticamente? Opcional.
              // combinedTypes.sort();

              // Adicionar tipos ao select
              combinedTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type; // Usar o valor como veio (com casing original)
                option.textContent = type;
                select.appendChild(option);
              });

              // Adicionar "Outro" no final
              const otherOption = document.createElement('option');
              otherOption.value = 'Outro';
              otherOption.textContent = 'Outro';
              select.appendChild(otherOption);

            } else {
                 console.error("Erro reportado pela API ao carregar tipos de equipamento:", response.message || "Erro desconhecido");
                 loadDefaultEquipmentTypes(); // Carrega padrões em caso de erro da API
            }
          })
          .catch(error => {
            console.error("Erro de rede/conexão ao carregar tipos de equipamento:", error);
            // Carregar tipos padrão em caso de erro de rede/conexão
            loadDefaultEquipmentTypes();
          })
          .finally(() => {
             // Configurar evento para mostrar/esconder campo de ID (sempre, após sucesso ou falha/fallback)
             // Isso garante que mesmo com fallback, a lógica de exibição funcione.
             setupEquipmentTypeEvents();
          });
      } else {
        console.error("API.getEquipmentTypes não está disponível. Usando valores padrão.");
        loadDefaultEquipmentTypes();
        // Configurar evento mesmo com fallback
        setupEquipmentTypeEvents();
      }
    }

    // Função para carregar tipos padrão em caso de erro
    function loadDefaultEquipmentTypes() {
      const select = document.getElementById('equipment-type');
      if (!select) return;

      select.innerHTML = '<option value="">Selecione o tipo...</option>';

      const defaultTypes = [
        'Alta Pressão',
        'Auto Vácuo / Hiper Vácuo',
        'Aspirador',
        'Poliguindaste',
        'Outro' // Outro já está aqui
      ];

      defaultTypes.forEach(type => {
        if (type) { // Adiciona verificação para evitar nulos/vazios
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            select.appendChild(option);
        }
      });

       // Não precisa chamar setupEquipmentTypeEvents aqui se for chamado no .finally ou no .catch de loadEquipmentTypes
    }

    // Configurar eventos para o campo de tipo de equipamento
    function setupEquipmentTypeEvents() {
      const typeSelect = document.getElementById('equipment-type');
      if (!typeSelect) return;

      // Remover listener antigo para evitar duplicação se esta função for chamada múltiplas vezes
      // typeSelect.removeEventListener('change', handleEquipmentTypeLogic); // Precisa de uma função nomeada

      // Usando uma função nomeada para poder remover depois se necessário
      const handleEquipmentTypeLogic = function() {
        const selectedType = this.value;
        const equipIdSelectContainer = document.getElementById('equipment-id')?.parentElement; // Container do select padrão
        const equipIdSelect = document.getElementById('equipment-id');
        const otherEquipField = document.getElementById('other-equipment-field');
        const newEquipFieldContainerId = 'new-equipment-field'; // ID do container do novo campo
        let newEquipFieldContainer = document.getElementById(newEquipFieldContainerId);
        const newEquipInputId = 'new-equipment-id'; // ID do input dentro do novo container


        // 1. Mostrar/esconder campo de texto "Outro Equipamento"
        if (otherEquipField) {
          otherEquipField.style.display = selectedType === 'Outro' ? 'block' : 'none';
          const otherInput = document.getElementById('other-equipment');
          if (otherInput) otherInput.required = (selectedType === 'Outro'); // Define required
        }

        // 2. Lógica para Aspirador e Poliguindaste (campo de texto customizado)
        if (selectedType === 'Aspirador' || selectedType === 'Poliguindaste') {
          // Esconder o dropdown de equipamentos padrão
          if (equipIdSelectContainer) {
            equipIdSelectContainer.style.display = 'none';
          }
           if (equipIdSelect) equipIdSelect.required = false; // Não é mais obrigatório

          // Verificar/criar campo para ID personalizado (#new-equipment-field)
          if (!newEquipFieldContainer) {
            // Criar novo campo
            newEquipFieldContainer = document.createElement('div');
            newEquipFieldContainer.id = newEquipFieldContainerId;
            newEquipFieldContainer.className = 'form-group form-col'; // Adiciona classes para layout
            newEquipFieldContainer.innerHTML = `
              <label for="${newEquipInputId}">Identificação do ${selectedType} <span class="form-required">*</span></label>
              <input type="text" class="form-control" id="${newEquipInputId}" name="${newEquipInputId}" required placeholder="Digite a identificação do equipamento">
            `;

            // Inserir após o dropdown de TIPO de equipamentos (ou onde fizer sentido no layout)
            const typeSelectContainer = typeSelect.parentElement; // Container do select de tipo
             if (typeSelectContainer && typeSelectContainer.parentElement) {
                // Insere DEPOIS do container do select de tipo
                typeSelectContainer.parentElement.insertBefore(newEquipFieldContainer, typeSelectContainer.nextElementSibling);
            } else {
                 console.error("Não foi possível encontrar o local para inserir o campo de ID customizado.");
                 // Fallback: Adicionar ao final do step-content?
                 document.getElementById('step-1-content')?.appendChild(newEquipFieldContainer);
            }

          } else {
            // Atualizar campo existente (label e visibilidade)
            const label = newEquipFieldContainer.querySelector('label');
            if (label) {
              label.innerHTML = `Identificação do ${selectedType} <span class="form-required">*</span>`; // Usa innerHTML para incluir o span
            }
            newEquipFieldContainer.style.display = 'block'; // Garante visibilidade
          }
          // Garantir que o input dentro do container seja obrigatório
          const newEquipInput = document.getElementById(newEquipInputId);
          if (newEquipInput) newEquipInput.required = true;

        } else {
          // 3. Para outros tipos (incluindo vazio e "Outro"), esconder campo personalizado e mostrar dropdown padrão
          if (newEquipFieldContainer) {
            newEquipFieldContainer.style.display = 'none';
            const newEquipInput = document.getElementById(newEquipInputId);
             if (newEquipInput) newEquipInput.required = false; // Não é obrigatório
          }

          // Mostrar o dropdown de equipamentos padrão (exceto se for "Outro")
          if (equipIdSelectContainer) {
               // Só mostrar se um tipo válido (não vazio e não 'Outro') for selecionado
               equipIdSelectContainer.style.display = (selectedType && selectedType !== 'Outro') ? 'block' : 'none';
          }
          if (equipIdSelect) {
               // Obrigatório apenas se um tipo for selecionado e não for 'Outro'
               equipIdSelect.required = (selectedType && selectedType !== 'Outro');
          }
        }

        // 4. Limpar campos não relevantes ao trocar o tipo
        if(selectedType !== 'Outro' && document.getElementById('other-equipment')) {
             document.getElementById('other-equipment').value = '';
        }
        if(selectedType !== 'Aspirador' && selectedType !== 'Poliguindaste' && document.getElementById(newEquipInputId)) {
             document.getElementById(newEquipInputId).value = '';
        }
        if((selectedType === 'Aspirador' || selectedType === 'Poliguindaste' || selectedType === 'Outro') && equipIdSelect) {
             equipIdSelect.value = ''; // Limpa seleção do dropdown padrão
        }

      };

       // Anexar o listener (removendo antes para segurança, caso seja chamada múltiplas vezes)
       typeSelect.removeEventListener('change', handleEquipmentTypeLogic); // Previne duplicatas
       typeSelect.addEventListener('change', handleEquipmentTypeLogic);

       // Disparar o evento uma vez na configuração inicial para garantir o estado correto
       // CUIDADO: Isso pode causar chamadas indesejadas se loadEquipmentTypes for chamado muitas vezes
       // typeSelect.dispatchEvent(new Event('change')); // Comentado por segurança, chamado em openMaintenanceForm se necessário
    }
  // === FIM: CÓDIGO DA ATUALIZAÇÃO PARA loadEquipmentTypes ===


  // Função para carregar IDs/Placas baseado no tipo selecionado
  function loadEquipmentIds() {
      const typeSelect = document.getElementById('equipment-type');
      const idSelect = document.getElementById('equipment-id');
      if (!typeSelect || !idSelect) return Promise.resolve();

      const selectedType = typeSelect.value;
      idSelect.innerHTML = '<option value="">Carregando...</option>'; // Feedback visual
      idSelect.disabled = true;

      // Não carregar se: tipo vazio, 'Outro', 'Aspirador' ou 'Poliguindaste'
      if (!selectedType || selectedType === 'Outro' || selectedType === 'Aspirador' || selectedType === 'Poliguindaste') {
          idSelect.innerHTML = `<option value="">${selectedType ? 'Não aplicável para este tipo' : 'Selecione o tipo primeiro'}</option>`;
          idSelect.disabled = true;
           // Garantir que o container do select esteja escondido se necessário (redundante c/ setupEvents?)
           if(idSelect.parentElement) idSelect.parentElement.style.display = 'none';
          return Promise.resolve();
      }

       // Garantir que o container do select esteja visível
       if(idSelect.parentElement) idSelect.parentElement.style.display = 'block';

      return API.getEquipmentIdsByType(selectedType) // Assumindo que existe essa função na API
          .then(response => {
              if (response && response.success && Array.isArray(response.ids)) {
                  idSelect.innerHTML = '<option value="">Selecione a placa/ID...</option>';
                  if (response.ids.length === 0) {
                      idSelect.innerHTML = '<option value="">Nenhum ID encontrado</option>';
                      idSelect.disabled = true; // Desabilitar se não há opções
                  } else {
                      response.ids.forEach(id => {
                          if(id) {
                              const option = document.createElement('option');
                              option.value = id;
                              option.textContent = id;
                              idSelect.appendChild(option);
                          }
                      });
                       idSelect.disabled = false; // Habilitar após carregar
                  }
              } else {
                  idSelect.innerHTML = '<option value="">Nenhum encontrado</option>';
                  console.warn("Resposta inválida ou sem IDs para o tipo:", selectedType, response);
                  idSelect.disabled = true;
              }
          })
          .catch(error => {
              console.error(`Erro ao carregar IDs para o tipo ${selectedType}:`, error);
              idSelect.innerHTML = '<option value="">Erro ao carregar</option>';
              showNotification(`Erro ao buscar placas/IDs para ${selectedType}.`, "error");
              idSelect.disabled = true;
          });
          // .finally(() => {
          //     // A lógica de enable/disable é mais complexa agora, feita dentro do then/catch
          // });
  }


  function loadProblemCategories() {
    // Usar cache simples
    if (loadProblemCategories.loaded) return Promise.resolve();

    return API.getProblemCategories()
      .then(response => {
        if (response && response.success && Array.isArray(response.categories)) {
          const select = document.getElementById('problem-category');
           if (!select) return;

          select.innerHTML = '<option value="">Selecione a categoria...</option>';

          response.categories.forEach(category => {
             if(category) {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                select.appendChild(option);
             }
          });
          // Adicionar opção "Outro"
           const otherOption = document.createElement('option');
           otherOption.value = 'Outro';
           otherOption.textContent = 'Outro (Especificar)';
           select.appendChild(otherOption);

           loadProblemCategories.loaded = true;
        } else {
             console.error("Resposta inválida ao carregar categorias:", response);
              showNotification("Não foi possível carregar as categorias de problema.", "warning");
        }
      })
      .catch(error => {
        console.error("Erro na API ao carregar categorias:", error);
         showNotification("Erro ao buscar categorias: " + error.message, "error");
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
       tableBody.innerHTML = '<tr><td colspan="10" class="text-center">Carregando...</td></tr>'; // Colspan ajustado para 10 colunas

       API.getMaintenanceList()
           .then(response => {
               if (response && response.success && Array.isArray(response.maintenances)) {
                   fullMaintenanceList = response.maintenances;
                   filterAndRenderList(); // Aplica filtros e renderiza
               } else {
                   console.error("Resposta inválida da API de manutenções:", response);
                   showNotification("Não foi possível carregar a lista de manutenções.", "error");
                   tableBody.innerHTML = '<tr><td colspan="10" class="text-center error-message">Erro ao carregar dados.</td></tr>';
               }
           })
           .catch(error => {
               console.error("Erro ao buscar lista de manutenções:", error);
               showNotification("Erro ao buscar manutenções: " + error.message, "error");
               tableBody.innerHTML = `<tr><td colspan="10" class="text-center error-message">Falha ao conectar com o servidor. Tente novamente.</td></tr>`;
           })
           .finally(() => {
               showLoading(false);
           });
   }

   // Filtra a lista baseado no termo de busca e filtro de status
   function filterAndRenderList() {
       let filteredList = [...fullMaintenanceList];

       // 1. Filtrar por Status (currentFilter)
       if (currentFilter !== 'all') {
           filteredList = filteredList.filter(item => {
               const status = (item.status || 'pendente').toLowerCase();
               // Mapeamento flexível de status para filtros
               switch (currentFilter) {
                   case 'pending':
                       return ['pendente', 'aguardando verificação'].includes(status);
                   case 'verified':
                       // 'Verificados' pode incluir 'Aprovado', 'Ajustes', 'Reprovado' após verificação
                       return ['verificado', 'aprovado', 'ajustes', 'reprovado'].includes(status);
                   case 'completed':
                       // 'Concluído' geralmente é um status final após verificação/aprovação
                       return ['concluído', 'concluido'].includes(status);
                   case 'critical':
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
               // Buscar em múltiplos campos
               return (
                   String(item.id || '').toLowerCase().includes(searchTerm) ||
                   String(item.placaOuId || '').toLowerCase().includes(searchTerm) || // ID/Placa
                   String(item.tipoEquipamento || '').toLowerCase().includes(searchTerm) ||
                   String(item.responsavel || '').toLowerCase().includes(searchTerm) ||
                   String(item.area || '').toLowerCase().includes(searchTerm) ||
                   String(item.localOficina || '').toLowerCase().includes(searchTerm) ||
                   String(item.tipoManutencao || '').toLowerCase().includes(searchTerm) ||
                   String(item.categoriaProblema || '').toLowerCase().includes(searchTerm) ||
                   String(item.status || '').toLowerCase().includes(searchTerm)
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
            row.setAttribute('data-maintenance-id', item.id); // Adiciona ID à linha

            const id = item.id || 'N/A';
            const equipmentId = item.placaOuId || '-'; // Este é o ID/Placa/Texto
            const equipmentType = item.tipoEquipamento || 'N/A';
            const equipmentDisplay = `${equipmentId} (${equipmentType})`; // Combina ID e Tipo

            const maintenanceType = item.tipoManutencao || '-';
             // Usar formatDate global ou local
            const regDateStr = item.dataRegistro || item.registrationDate || item.dataManutencao; // Data da manutenção é mais relevante?
            const regDate = typeof formatDate === 'function' ? formatDate(regDateStr, true) : (regDateStr ? new Date(regDateStr).toLocaleString('pt-BR') : '-');

            const responsible = item.responsavel || '-';
            const area = item.area || '-';
            const office = item.localOficina || '-';
            // Mostrar categoria principal, ou 'Outro' se for o caso
            const problemCat = item.categoriaProblema !== 'Outro' ? item.categoriaProblema : (item.categoriaProblemaOutro || 'Outro');
            const problem = problemCat || '-';

            const status = item.status || 'Pendente';
            const statusClass = typeof getStatusClass === 'function' ? getStatusClass(status) : status.toLowerCase().replace(/\s+/g, '-');
            const allowVerification = ['pendente', 'aguardando verificação'].includes(status.toLowerCase());
            const allowEdit = ['pendente', 'aguardando verificação', 'ajustes'].includes(status.toLowerCase()); // Permitir edição se pendente ou precisar ajustes?

            row.innerHTML = `
                <td>${id}</td>
                <td>${equipmentDisplay}</td>
                <td>${maintenanceType} ${item.eCritico ? '<span class="critical-indicator" title="Manutenção Crítica">!</span>' : ''}</td>
                <td>${regDate}</td>
                <td>${responsible}</td>
                <td>${area}</td>
                <td>${office}</td>
                <td>${problem}</td>
                <td><span class="status-badge status-${statusClass}">${status}</span></td>
                <td class="action-buttons">
                    <button class="btn-icon view-maintenance" data-id="${id}" title="Ver detalhes">👁️</button>
                    ${allowVerification ? `<button class="btn-icon verify-maintenance" data-id="${id}" title="Verificar">✓</button>` : ''}
                    ${allowEdit ? `<button class="btn-icon edit-maintenance" data-id="${id}" title="Editar">✏️</button>` : ''}
                    <!-- <button class="btn-icon delete-maintenance" data-id="${id}" title="Excluir">🗑️</button> -->
                </td>
            `;
            tableBody.appendChild(row);
        });
         // Reaplicar tooltips ou outros plugins se necessário após renderizar
         if (typeof tippy === 'function') { // Exemplo com Tippy.js
             tippy('#maintenance-tbody .btn-icon[title]');
             tippy('#maintenance-tbody .critical-indicator[title]');
         }
    }

  // --- Funções de Manipulação de Eventos (Handlers) ---

  function handleNextToStep2() {
    if (validateStep1()) {
      saveStep1Data();
      showStep(2);
    }
  }

  function handleNextToStep3() {
    if (validateStep2()) {
      saveStep2Data();
      updateSummary(); // Atualiza o resumo antes de mostrar
      showStep(3);
    }
  }

  function handleFormSubmit(event) {
      event.preventDefault(); // Previne o submit padrão do HTML
      // A validação final é feita implicitamente ao salvar os dados das etapas.
      // Garantir que os dados da última etapa (Etapa 2) sejam salvos antes do submit
      if (validateStep2()) { // Re-valida caso o usuário tenha voltado
          saveStep2Data();
          submitMaintenance();
      } else {
          showStep(2); // Volta para a etapa 2 se inválida
          showNotification("Verifique os campos obrigatórios na Etapa 2.", "warning");
      }
  }

  // REMOVIDO: handleEquipmentTypeChange original foi substituído pela lógica em setupEquipmentTypeEvents
  /*
  function handleEquipmentTypeChange(event) {
      // ... código antigo removido ...
  }
  */

  function handleProblemCategoryChange(event) {
      const otherField = document.getElementById('other-category-field');
      const otherInput = document.getElementById('other-category');
       if (!otherField || !otherInput) return;

      if (event.target.value === 'Outro') {
          otherField.style.display = 'block';
          otherInput.required = true;
      } else {
          otherField.style.display = 'none';
           otherInput.value = ''; // Limpa o campo
           otherInput.required = false;
      }
  }

  // Handler para cliques nos filtros de status
   function handleFilterClick(event) {
       const target = event.currentTarget; // O div.filter-item clicado
       currentFilter = target.getAttribute('data-filter') || 'all';

       // Atualizar classe 'active' visualmente
       document.querySelectorAll('.filter-container .filter-item').forEach(item => {
           item.classList.remove('active');
       });
       target.classList.add('active');

       // Reaplicar filtros e renderizar a lista
       filterAndRenderList();
   }

    // Handler para cliques nos botões de ação da tabela
    function handleTableActionClick(event) {
        const button = event.target.closest('.btn-icon'); // Encontra o botão clicado
        if (!button) return;

        const maintenanceId = button.getAttribute('data-id');
        if (!maintenanceId) return;

        // Encontrar os dados da linha correspondente na lista completa
        const maintenanceData = findMaintenanceByIdInList(maintenanceId);
        if (!maintenanceData) {
            console.error(`Dados para manutenção ID ${maintenanceId} não encontrados na lista local.`);
             showNotification(`Não foi possível encontrar os detalhes da manutenção ${maintenanceId}. Tente atualizar a lista.`, "warning");
            return; // Impede a ação se os dados não forem encontrados
        }


        if (button.classList.contains('view-maintenance')) {
            if (typeof viewMaintenanceDetails === 'function') {
                viewMaintenanceDetails(maintenanceId, maintenanceData); // Passa os dados encontrados
            } else {
                 console.error("Função viewMaintenanceDetails não encontrada.");
                 alert(`Visualizar ID: ${maintenanceId}\nDados:\n${JSON.stringify(maintenanceData, null, 2)}`);
            }
        } else if (button.classList.contains('verify-maintenance')) {
            if (typeof Verification !== 'undefined' && Verification.openVerificationForm) {
                Verification.openVerificationForm(maintenanceId, maintenanceData);
            } else {
                 console.error("Módulo/Função de Verificação não encontrado.");
                 alert(`Verificar ID: ${maintenanceId}`);
            }
        } else if (button.classList.contains('edit-maintenance')) {
             openMaintenanceForm(maintenanceId, maintenanceData); // Abre o form em modo de edição com os dados
        } else if (button.classList.contains('delete-maintenance')) {
             handleDeleteMaintenance(maintenanceId);
        }
    }

    // Função auxiliar para buscar dados na lista carregada
    function findMaintenanceByIdInList(id) {
        // Converte ambos para string para comparação segura, caso ID venha como número ou string
        return fullMaintenanceList.find(item => String(item.id) === String(id)) || null;
    }

     // Handler para exclusão (exemplo)
     function handleDeleteMaintenance(id) {
         const maintenanceData = findMaintenanceByIdInList(id);
         const message = `Tem certeza que deseja excluir a manutenção ${id} (${maintenanceData?.placaOuId || ''} - ${maintenanceData?.tipoEquipamento || ''})? Esta ação não pode ser desfeita.`;

         showConfirmation(message, () => {
             showLoading(true, `Excluindo manutenção ${id}...`);
             API.deleteMaintenance(id)
                 .then(response => {
                     if (response && response.success) {
                         showNotification(`Manutenção ${id} excluída com sucesso.`, 'success');
                         // Remover da lista local e rerenderizar
                         fullMaintenanceList = fullMaintenanceList.filter(item => String(item.id) !== String(id));
                         filterAndRenderList();
                         // Atualizar dashboard também
                         if (typeof Dashboard !== 'undefined' && Dashboard.loadDashboardData) {
                             Dashboard.loadDashboardData(true); // Força recarga do dashboard
                         }
                     } else {
                         showNotification(`Erro ao excluir manutenção ${id}: ${response?.message || 'Erro desconhecido'}.`, 'error');
                     }
                 })
                 .catch(error => {
                     console.error(`Erro ao excluir manutenção ${id}:`, error);
                     showNotification(`Falha na comunicação ao excluir manutenção ${id}.`, 'error');
                 })
                 .finally(() => {
                     showLoading(false);
                 });
         });
     }


  // --- Funções de Validação e Persistência ---

  function showStep(step) {
    // Atualizar indicadores visuais das etapas
    document.querySelectorAll('.form-steps .form-step').forEach((el, index) => {
      if ((index + 1) == step) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
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
        console.error(`Conteúdo da etapa ${step} não encontrado.`);
    }
  }

  // Valida os campos obrigatórios da etapa 1
  function validateStep1() {
      let isValid = true;
      let firstInvalidElement = null;

      // Limpar erros anteriores
      clearValidationErrors(1);

      // Campos obrigatórios básicos (sempre requeridos)
      const requiredFields = [
          { id: 'equipment-type', name: 'Tipo de Equipamento' },
          { id: 'technician-name', name: 'Responsável pelo Relatório' },
          { id: 'maintenance-date', name: 'Data da Manutenção' },
          { id: 'area', name: 'Área' },
          { id: 'office', name: 'Local/Oficina' }, // Tornando oficina obrigatória
          { id: 'maintenance-type', name: 'Tipo de Manutenção' }
      ];

       // Validação condicional de Equipamento baseado no tipo selecionado
       const equipType = document.getElementById('equipment-type')?.value;

       if (equipType === 'Outro') {
           requiredFields.push({ id: 'other-equipment', name: 'Especificar Equipamento' });
       } else if (equipType === 'Aspirador' || equipType === 'Poliguindaste') {
           requiredFields.push({ id: 'new-equipment-id', name: `Identificação do ${equipType}` });
       } else if (equipType) { // Tipo selecionado que não é especial (requer o dropdown de ID)
           requiredFields.push({ id: 'equipment-id', name: 'Placa ou ID' });
       }
       // Se equipType for vazio, o próprio campo 'equipment-type' será marcado como inválido na validação abaixo

      // Iterar e validar campos
      requiredFields.forEach(fieldInfo => {
          const element = document.getElementById(fieldInfo.id);
          // Checa se o elemento existe e se seu valor (trimado) é vazio ou se é um select não selecionado
          if (!element || !element.value || !element.value.trim()) {
              isValid = false;
               // Se o elemento não existir no DOM, logar um erro mais específico
               if (!element) {
                   console.error(`Elemento de formulário não encontrado para validação: #${fieldInfo.id}`);
                   // Marcar o campo relacionado (ex: tipo de equipamento se o ID não existe) pode ser um fallback
                   const relatedElement = document.getElementById('equipment-type'); // Exemplo
                   markFieldError(relatedElement, `Erro interno: Campo ${fieldInfo.name} não encontrado.`);
               } else {
                   markFieldError(element, `${fieldInfo.name} é obrigatório.`);
                   if (!firstInvalidElement) firstInvalidElement = element;
               }
          }
      });

      if (!isValid) {
          showNotification("Por favor, preencha todos os campos obrigatórios da Etapa 1.", "warning");
          if (firstInvalidElement) {
              firstInvalidElement.focus();
          }
      }

      return isValid;
  }

    // Valida os campos obrigatórios da etapa 2
    function validateStep2() {
        let isValid = true;
        let firstInvalidElement = null;

         // Limpar erros anteriores
         clearValidationErrors(2);

        // Campos obrigatórios
        const requiredFields = [
            { id: 'problem-category', name: 'Categoria do Problema' },
            { id: 'problem-description', name: 'Detalhes do Problema' }
        ];

         // Validação condicional de Categoria (Outro)
         const categoryValue = document.getElementById('problem-category').value;
         if (categoryValue === 'Outro') {
             requiredFields.push({ id: 'other-category', name: 'Especificar Categoria' });
         }

        // Iterar e validar
        requiredFields.forEach(fieldInfo => {
            const element = document.getElementById(fieldInfo.id);
             if (!element || !element.value || !element.value.trim()) {
                 isValid = false;
                  if (!element) {
                       console.error(`Elemento de formulário não encontrado para validação: #${fieldInfo.id}`);
                       const relatedElement = document.getElementById('problem-category');
                       markFieldError(relatedElement, `Erro interno: Campo ${fieldInfo.name} não encontrado.`);
                  } else {
                      markFieldError(element, `${fieldInfo.name} é obrigatório.`);
                      if (!firstInvalidElement) firstInvalidElement = element;
                  }
             }
        });

        if (!isValid) {
            showNotification("Por favor, preencha todos os campos obrigatórios da Etapa 2.", "warning");
             if (firstInvalidElement) {
                 firstInvalidElement.focus();
             }
        }
        return isValid;
    }

    // Função auxiliar para marcar erro em um campo
    function markFieldError(element, message) {
        if (!element) return;
        element.style.borderColor = 'red';
        // Adicionar mensagem de erro perto do campo
        const errorSpanId = element.id + '-error';
        let errorSpan = document.getElementById(errorSpanId);
        const parent = element.parentElement; // Container do campo

        if (!errorSpan && parent) { // Cria o span apenas se não existir e tiver um pai
            errorSpan = document.createElement('span');
            errorSpan.id = errorSpanId;
            errorSpan.className = 'error-message-field'; // Classe para estilização
            // Inserir após o elemento
             if (element.nextSibling) {
                parent.insertBefore(errorSpan, element.nextSibling);
             } else {
                parent.appendChild(errorSpan);
             }
        }
         if(errorSpan) {
            errorSpan.textContent = message;
            errorSpan.style.display = 'block';
            errorSpan.style.color = 'red'; // Estilo básico
            errorSpan.style.fontSize = '0.8em'; // Estilo básico
         }
    }

    // Função auxiliar para limpar erros de validação de uma etapa
    function clearValidationErrors(step) {
        const stepContent = document.getElementById(`step-${step}-content`);
        if (!stepContent) return;

        stepContent.querySelectorAll('.form-control, .form-check input, .form-select').forEach(el => {
            if(el.style) el.style.borderColor = ''; // Resetar borda
        });
        stepContent.querySelectorAll('.error-message-field').forEach(span => {
            span.textContent = ''; // Limpar mensagem
            span.style.display = 'none'; // Esconder span
        });
    }

  // Salva os dados da etapa 1 no estado 'formData'
  function saveStep1Data() {
    formData.equipmentType = document.getElementById('equipment-type')?.value || '';
    // Decide qual ID salvar baseado no tipo
    if (formData.equipmentType === 'Outro') {
        formData.equipmentId = ''; // ID padrão fica vazio
        formData.otherEquipment = document.getElementById('other-equipment')?.value || '';
        formData.newEquipmentId = ''; // ID customizado fica vazio
    } else if (formData.equipmentType === 'Aspirador' || formData.equipmentType === 'Poliguindaste') {
        formData.equipmentId = ''; // ID padrão fica vazio
        formData.otherEquipment = ''; // Outro fica vazio
        formData.newEquipmentId = document.getElementById('new-equipment-id')?.value || '';
    } else {
        formData.equipmentId = document.getElementById('equipment-id')?.value || '';
        formData.otherEquipment = ''; // Outro fica vazio
        formData.newEquipmentId = ''; // ID customizado fica vazio
    }
    formData.technician = document.getElementById('technician-name')?.value || '';
    formData.date = document.getElementById('maintenance-date')?.value || '';
    formData.area = document.getElementById('area')?.value || '';
    formData.office = document.getElementById('office')?.value || '';
    formData.maintenanceType = document.getElementById('maintenance-type')?.value || '';
    formData.isCritical = document.getElementById('is-critical')?.checked || false;
  }

  // Salva os dados da etapa 2 no estado 'formData'
  function saveStep2Data() {
    formData.problemCategory = document.getElementById('problem-category')?.value || '';
    // Salva o valor de 'Outro' apenas se for a categoria selecionada
    if (formData.problemCategory === 'Outro') {
        formData.otherCategory = document.getElementById('other-category')?.value || '';
    } else {
        formData.otherCategory = ''; // Limpa se não for 'Outro'
    }
    formData.problemDescription = document.getElementById('problem-description')?.value || '';
    formData.additionalNotes = document.getElementById('additional-notes')?.value || '';
  }

  // Atualiza o resumo na etapa 3 com os dados do 'formData'
  function updateSummary() {
      // Função auxiliar para buscar texto de um select
      const getSelectText = (id) => {
          const select = document.getElementById(id);
          return select ? (select.selectedIndex >= 0 ? select.options[select.selectedIndex].text : '-') : '-';
      };

      // Equipamento (lógica atualizada)
      let equipmentDisplay = '-';
      let equipmentDetail = '';
      const equipType = formData.equipmentType;
      const typeText = getSelectText('equipment-type'); // Pega o texto do tipo selecionado

      if (equipType === 'Outro') {
          equipmentDetail = formData.otherEquipment || '(Não especificado)';
          equipmentDisplay = `${typeText}: ${equipmentDetail}`;
      } else if (equipType === 'Aspirador' || equipType === 'Poliguindaste') {
          equipmentDetail = formData.newEquipmentId || '(ID não especificado)';
          equipmentDisplay = `${typeText} (${equipmentDetail})`;
      } else if (equipType) {
           equipmentDetail = formData.equipmentId ? getSelectText('equipment-id') : '(ID não selecionado)';
            // Se getSelectText retornar '-', usar o formData.equipmentId como fallback
           if (equipmentDetail === '-' && formData.equipmentId) {
               equipmentDetail = formData.equipmentId;
           }
           equipmentDisplay = `${typeText} (${equipmentDetail})`;
      }
       document.getElementById('summary-equipment').textContent = equipmentDisplay;

      // Responsável
      document.getElementById('summary-technician').textContent = formData.technician || '-';

      // Data
      let formattedDate = '-';
       if(formData.date) {
           // Tenta usar a função global primeiro
           if (typeof formatDate === 'function') {
                formattedDate = formatDate(formData.date); // Sem hora para o resumo
           } else {
                // Fallback para formatação básica
                try {
                     const dateObj = new Date(formData.date + 'T00:00:00'); // Assume input date é local
                     if (!isNaN(dateObj)) {
                         formattedDate = dateObj.toLocaleDateString('pt-BR');
                     }
                 } catch(e){ console.error("Erro ao formatar data:", e); }
           }
       }
      document.getElementById('summary-date').textContent = formattedDate;

      // Local
      const areaText = getSelectText('area');
      const location = `${areaText} / ${formData.office || '-'}`;
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

      // Construir o payload final para a API a partir do formData (lógica de ID atualizada)
      let finalEquipmentId = '';
      if (formData.equipmentType === 'Outro') {
          finalEquipmentId = formData.otherEquipment;
      } else if (formData.equipmentType === 'Aspirador' || formData.equipmentType === 'Poliguindaste') {
          finalEquipmentId = formData.newEquipmentId;
      } else {
          finalEquipmentId = formData.equipmentId;
      }

      // Construir categoria: se 'Outro', envia o texto, senão a categoria
       let finalProblemCategory = formData.problemCategory;
       let finalOtherCategory = ''; // Campo separado para o texto de 'Outro'
       if (formData.problemCategory === 'Outro') {
           // A API espera a categoria 'Outro' e o texto em um campo separado? Ou só o texto?
           // Assumindo que a API espera 'Outro' na categoria e o texto em outro campo (ex: categoriaProblemaOutro)
           finalProblemCategory = 'Outro';
           finalOtherCategory = formData.otherCategory;
           // Se a API espera SÓ o texto do 'Outro' no campo principal:
           // finalProblemCategory = formData.otherCategory;
       }


      const apiData = {
          tipoEquipamento: formData.equipmentType,
          placaOuId: finalEquipmentId, // Usa o ID correto baseado no tipo
          responsavel: formData.technician,
          dataManutencao: formData.date,
          area: formData.area,
          localOficina: formData.office,
          tipoManutencao: formData.maintenanceType,
          eCritico: formData.isCritical,
          categoriaProblema: finalProblemCategory,
          // Adicionar campo para texto 'Outro' se a API esperar separado:
          // categoriaProblemaOutro: finalOtherCategory,
          detalhesproblema: formData.problemDescription, // Verificar se o nome da chave na API está correto
          observacoes: formData.additionalNotes,
          // Status: Definir status inicial ou manter o atual em edições?
          // Se for edição e a API permitir, talvez enviar o status atual para não resetar.
          status: isEditMode ? (formData.status || 'Pendente') : 'Pendente' // Exemplo: mantém status se existir no formData (de populateFormForEdit)
      };

       // Escolher a função da API correta (salvar vs atualizar)
       const apiCall = isEditMode
           ? API.updateMaintenance(editingMaintenanceId, apiData) // Assumindo que existe API.updateMaintenance(id, data)
           : API.saveMaintenance(apiData);

      apiCall
          .then(response => {
              if (response && response.success) {
                  const successMessage = isEditMode
                      ? `Manutenção ${editingMaintenanceId} atualizada com sucesso!`
                      : `Manutenção registrada com sucesso! ID: ${response.id || '(sem ID retornado)'}`;
                  showNotification(successMessage, 'success');
                  document.getElementById('maintenance-form-overlay').style.display = 'none';
                   resetForm(); // Limpa o formulário após sucesso

                  // Atualizar a lista na aba Manutenções
                  loadMaintenanceList(); // Recarrega a lista para refletir a mudança

                  // Atualizar o dashboard se existir e estiver visível/ativo
                  if (typeof Dashboard !== 'undefined' && Dashboard.loadDashboardData) {
                     // Opcional: verificar se a tab do dashboard está ativa antes de recarregar
                      if (document.getElementById('tab-dashboard')?.classList.contains('active')) {
                           Dashboard.loadDashboardData(true); // Força recarga do dashboard
                      }
                  }

              } else {
                  console.error("Erro ao salvar/atualizar manutenção:", response);
                  const errorMessage = isEditMode ? 'Erro ao atualizar manutenção' : 'Erro ao salvar manutenção';
                  showNotification(`${errorMessage}: ${response?.message || 'Erro desconhecido da API'}. Verifique os dados e tente novamente.`, 'error');
              }
          })
          .catch(error => {
              console.error("Erro na requisição API:", error);
               const failureMessage = isEditMode ? 'Falha ao atualizar manutenção' : 'Falha ao registrar manutenção';
               // Tentar extrair mensagem de erro mais detalhada, se disponível
               let detail = error.message;
               if (error.response && error.response.data && error.response.data.message) {
                   detail = error.response.data.message; // Exemplo se a API retornar JSON com erro
               }
              showNotification(`${failureMessage}: ${detail}. Verifique sua conexão ou contate o suporte.`, 'error');
          })
          .finally(() => {
              showLoading(false);
          });
  }


  // --- Funções Auxiliares (Debounce, etc.) ---
   // Mover debounce para utilities.js se possível
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

     // --- Funções Globais Auxiliares (Esperadas de utilities.js ou globalmente) ---
     // Implementações de exemplo (DEVEM existir em outro lugar)
     function showLoading(show, message = 'Carregando...') {
         const loader = document.getElementById('global-loader'); // Exemplo de ID
         const loaderMessage = document.getElementById('global-loader-message');
         if (loader) {
             loader.style.display = show ? 'flex' : 'none';
             if (show && loaderMessage) {
                 loaderMessage.textContent = message;
             }
         } else if (show) {
             console.log("Loading:", message);
         }
     }
     function showNotification(message, type = 'info') {
         // Usar biblioteca como Toastify, Noty ou uma implementação customizada
         console.log(`[${type.toUpperCase()}] Notification: ${message}`);
         // Exemplo simples com alert (substituir por algo melhor)
         // alert(`[${type.toUpperCase()}] ${message}`);
         // Exemplo: Chamar uma função global se existir
         if (typeof Utilities !== 'undefined' && Utilities.showToast) {
             Utilities.showToast(message, type);
         } else {
              alert(`[${type.toUpperCase()}] ${message}`); // Fallback
         }
     }
     function showConfirmation(message, onConfirm, onCancel = null) {
         // Usar um modal de confirmação customizado ou a função confirm() do navegador
         if (confirm(message)) {
             if (typeof onConfirm === 'function') onConfirm();
         } else {
             if (typeof onCancel === 'function') onCancel();
         }
     }
     function formatDate(dateString, includeTime = false) {
         if (!dateString) return '-';
         try {
             // Tenta criar data, tratando strings de data e datetime
             const date = new Date(dateString);
             // Corrige problema de timezone assumindo que a string de data (YYYY-MM-DD) está no fuso local
             if (typeof dateString === 'string' && dateString.length === 10) {
                 const parts = dateString.split('-');
                 if (parts.length === 3) {
                      // Cria data com hora 00:00:00 no fuso local
                     date = new Date(parts[0], parts[1] - 1, parts[2]);
                 }
             }

             if (isNaN(date.getTime())) { // Verifica se a data é válida
                 return dateString; // Retorna a string original se inválida
             }

             const optionsDate = { day: '2-digit', month: '2-digit', year: 'numeric' };
             const optionsTime = { hour: '2-digit', minute: '2-digit' };

             let formatted = date.toLocaleDateString('pt-BR', optionsDate);
             if (includeTime) {
                 // Verifica se a data original tinha informação de hora relevante
                 // (não apenas 00:00:00 resultante da conversão de 'YYYY-MM-DD')
                 const hasTimeInfo = date.getUTCHours() !== 0 || date.getUTCMinutes() !== 0 || date.getUTCSeconds() !== 0;
                  if (hasTimeInfo || typeof dateString !== 'string' || dateString.includes('T') || dateString.includes(' ')) {
                     formatted += ' ' + date.toLocaleTimeString('pt-BR', optionsTime);
                 }
             }
             return formatted;
         } catch (e) {
             console.error("Erro ao formatar data:", dateString, e);
             return dateString; // Retorna original em caso de erro
         }
     }
     function getStatusClass(status) {
          if (!status) return 'pendente';
          // Converte para minúsculas e substitui espaços/acentos por hífens para usar como classe CSS
          return status.toLowerCase()
                     .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
                     .replace(/\s+/g, '-') // Substitui espaços por hífens
                     .replace(/[^a-z0-9-]/g, ''); // Remove caracteres não alfanuméricos (exceto hífen)
     }
     // --- Fim Funções Globais Auxiliares ---


  // Expor funções públicas do módulo
  return {
    initialize,
    openMaintenanceForm, // Expor para ser chamada por botões de editar/novo
    loadMaintenanceList // Expor para ser chamada ao mudar para a aba ou refresh
  };
})();

// Inicializar o módulo Maintenance quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
   // Verificação de dependências aprimorada
   let dependenciesLoaded = true;
   if (typeof API === 'undefined') {
        console.error("Erro CRÍTICO: API.js não carregado antes de maintenance.js");
        dependenciesLoaded = false;
   }
   if (typeof Utilities === 'undefined') {
        // Se Utilities for opcional ou algumas funções forem globais, este erro pode ser um aviso
        console.warn("Aviso: Utilities.js pode não ter sido carregado antes de maintenance.js. Funções auxiliares podem falhar.");
        // Se Utilities for essencial, mudar para console.error e dependenciesLoaded = false;
        // Exemplo: Se showNotification/showLoading/etc VEM de Utilities:
        // console.error("Erro CRÍTICO: Utilities.js não carregado antes de maintenance.js");
        // dependenciesLoaded = false;
   }

   if (!dependenciesLoaded) {
        alert("Erro crítico na inicialização da aplicação (Módulo Manutenção). Verifique o console.");
        // Desabilitar botões ou funcionalidades relacionadas à manutenção aqui
        const newMaintButton = document.getElementById('new-maintenance');
        if(newMaintButton) newMaintButton.disabled = true;
        return; // Impede a inicialização do módulo
   }

  // Se as dependências essenciais estão OK, inicializar
  console.log("DOM carregado. Inicializando Maintenance module...");
  Maintenance.initialize();

  // Carregar a lista de manutenções se a aba de manutenção for a ativa inicialmente
  // Ou se não houver sistema de abas e a lista deve sempre carregar no início
  const maintenanceListContainer = document.getElementById('maintenance-list-container'); // ID do container da lista/tabela
  const maintenanceTab = document.getElementById('tab-maintenance'); // ID da aba (se houver)

  if (maintenanceListContainer) { // Verifica se o container da lista existe na página atual
      if (maintenanceTab && maintenanceTab.classList.contains('active')) {
           console.log("Aba Manutenção ativa na inicialização. Carregando lista...");
          Maintenance.loadMaintenanceList();
      } else if (!maintenanceTab) {
          // Se não há sistema de abas e a lista está sempre presente, carregar
           console.log("Container da lista presente (sem abas detectadas). Carregando lista...");
           Maintenance.loadMaintenanceList();
      }
  } else {
      console.log("Container da lista de manutenção não encontrado no DOM inicial.");
  }
});
