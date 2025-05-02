const Maintenance = (() => {
  // Estado do formulário
  let formData = {
    equipmentType: '',
    equipmentId: '',
    otherEquipment: '',
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
    loadEquipmentTypes();
    loadProblemCategories();
    // Adicionar carregamento de placas/IDs se necessário aqui ou dinamicamente
    // loadEquipmentIds();
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

    // Campos condicionais (Outro equipamento/categoria)
    const equipmentTypeSelect = document.getElementById('equipment-type');
    if (equipmentTypeSelect) equipmentTypeSelect.addEventListener('change', handleEquipmentTypeChange);

    const problemCategorySelect = document.getElementById('problem-category');
    if (problemCategorySelect) problemCategorySelect.addEventListener('change', handleProblemCategoryChange);

    // Listener para o select de Tipo de Equipamento para carregar IDs
    if (equipmentTypeSelect) equipmentTypeSelect.addEventListener('change', loadEquipmentIds);

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
          populateFormForEdit(dataToEdit);
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
  }

   function populateFormForEdit(data) {
       // Preencher campos da Etapa 1
       setSelectValue('equipment-type', data.tipoEquipamento);
       // Carregar IDs baseado no tipo e então selecionar o ID
       loadEquipmentIds().then(() => {
            setSelectValue('equipment-id', data.placaOuId);
       });
       // Se for 'Outro', preencher o campo texto
       if (data.tipoEquipamento === 'Outro') {
           document.getElementById('other-equipment').value = data.placaOuId || '';
           document.getElementById('other-equipment-field').style.display = 'block';
       } else {
           document.getElementById('other-equipment-field').style.display = 'none';
       }
       document.getElementById('technician-name').value = data.responsavel || '';
       document.getElementById('maintenance-date').value = data.dataManutencao || '';
       setSelectValue('area', data.area);
       document.getElementById('office').value = data.localOficina || '';
       setSelectValue('maintenance-type', data.tipoManutencao);
       document.getElementById('is-critical').checked = data.eCritico || false;

       // Preencher campos da Etapa 2 (salvar em formData temporário ou direto nos campos)
       // É melhor salvar no formData e chamar saveStep1Data/saveStep2Data adaptados
       formData = { ...formData, ...data }; // Atualiza formData com dados existentes
       setSelectValue('problem-category', data.categoriaProblema);
       if (data.categoriaProblema === 'Outro') {
            document.getElementById('other-category').value = data.categoriaProblema; // Ou o campo que guarda o valor de "outro"
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
            const optionExists = Array.from(select.options).some(opt => opt.value === value);
            if (optionExists) {
                select.value = value;
            } else {
                console.warn(`Valor "${value}" não encontrado no select "${selectId}".`);
                select.value = ""; // Define como vazio ou outra opção padrão
            }
             // Disparar evento change para atualizar dependências (como campo 'outro' ou carregar IDs)
             select.dispatchEvent(new Event('change'));
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
      equipmentType: '', equipmentId: '', otherEquipment: '', technician: '',
      date: '', area: '', office: '', maintenanceType: '', isCritical: false,
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

    // Redefinir bordas de validação
    document.querySelectorAll('#maintenance-form .form-control, #maintenance-form .form-check input').forEach(el => {
        if(el.style) el.style.borderColor = ''; // Resetar borda
        // Poderia remover classes de erro também
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

  function loadEquipmentTypes() {
    // Usar cache simples para evitar recargas repetidas
    if (loadEquipmentTypes.loaded) return Promise.resolve(); // Já carregado

    return API.getEquipmentTypes()
      .then(response => {
        if (response && response.success && Array.isArray(response.types)) {
          const select = document.getElementById('equipment-type');
          if (!select) return;

          select.innerHTML = '<option value="">Selecione o tipo...</option>'; // Opção padrão

          response.types.forEach(type => {
            if(type) { // Evitar adicionar opções vazias
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                select.appendChild(option);
            }
          });
          // Adicionar opção "Outro" se necessário
          const otherOption = document.createElement('option');
          otherOption.value = 'Outro';
          otherOption.textContent = 'Outro (Especificar)';
          select.appendChild(otherOption);

          loadEquipmentTypes.loaded = true; // Marcar como carregado
        } else {
          console.error("Resposta inválida ao carregar tipos de equipamento:", response);
           showNotification("Não foi possível carregar os tipos de equipamento.", "warning");
        }
      })
      .catch(error => {
        console.error("Erro na API ao carregar tipos de equipamento:", error);
        showNotification("Erro ao buscar tipos de equipamento: " + error.message, "error");
         // Limpar select em caso de erro? Ou manter vazio?
         const select = document.getElementById('equipment-type');
         if(select) select.innerHTML = '<option value="">Erro ao carregar</option>';
      });
  }
  loadEquipmentTypes.loaded = false; // Inicializar flag de cache

  // Função para carregar IDs/Placas baseado no tipo selecionado
  function loadEquipmentIds() {
      const typeSelect = document.getElementById('equipment-type');
      const idSelect = document.getElementById('equipment-id');
      if (!typeSelect || !idSelect) return Promise.resolve();

      const selectedType = typeSelect.value;
      idSelect.innerHTML = '<option value="">Carregando...</option>'; // Feedback visual
      idSelect.disabled = true;

      // Não carregar se for "Outro" ou vazio
      if (!selectedType || selectedType === 'Outro') {
          idSelect.innerHTML = '<option value="">Selecione o tipo primeiro</option>';
          idSelect.disabled = true;
          return Promise.resolve();
      }

      return API.getEquipmentIdsByType(selectedType) // Assumindo que existe essa função na API
          .then(response => {
              if (response && response.success && Array.isArray(response.ids)) {
                  idSelect.innerHTML = '<option value="">Selecione a placa/ID...</option>';
                  response.ids.forEach(id => {
                      if(id) {
                          const option = document.createElement('option');
                          option.value = id;
                          option.textContent = id;
                          idSelect.appendChild(option);
                      }
                  });
              } else {
                  idSelect.innerHTML = '<option value="">Nenhum encontrado</option>';
                  console.warn("Resposta inválida ou sem IDs para o tipo:", selectedType, response);
              }
          })
          .catch(error => {
              console.error(`Erro ao carregar IDs para o tipo ${selectedType}:`, error);
              idSelect.innerHTML = '<option value="">Erro ao carregar</option>';
              showNotification(`Erro ao buscar placas/IDs para ${selectedType}.`, "error");
          })
          .finally(() => {
              idSelect.disabled = false;
          });
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
                   String(item.placaOuId || '').toLowerCase().includes(searchTerm) ||
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
            const equipment = item.placaOuId || '-';
            const maintenanceType = item.tipoManutencao || '-';
             // Usar formatDate global ou local
            const regDateStr = item.dataRegistro || item.registrationDate || item.dataManutencao;
            const regDate = typeof formatDate === 'function' ? formatDate(regDateStr, true) : (regDateStr ? new Date(regDateStr).toLocaleString('pt-BR') : '-');

            const responsible = item.responsavel || '-';
            const area = item.area || '-';
            const office = item.localOficina || '-';
            const problem = item.categoriaProblema || '-'; // Simplificado, pode mostrar detalhes no tooltip ou modal
            const status = item.status || 'Pendente';
            const statusClass = typeof getStatusClass === 'function' ? getStatusClass(status) : status.toLowerCase();
             const allowVerification = ['pendente', 'aguardando verificação'].includes(status.toLowerCase());
             const allowEdit = ['pendente', 'aguardando verificação'].includes(status.toLowerCase()); // Permitir edição apenas se pendente?

            row.innerHTML = `
                <td>${id}</td>
                <td>${equipment} (${item.tipoEquipamento || 'N/A'})</td>
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
      // Validação final pode ser adicionada aqui, embora as etapas já validem
      submitMaintenance();
  }

  function handleEquipmentTypeChange(event) {
      const otherField = document.getElementById('other-equipment-field');
      const idSelectField = document.getElementById('equipment-id'); // O select de ID
      if (!otherField || !idSelectField) return;

      if (event.target.value === 'Outro') {
          otherField.style.display = 'block';
          idSelectField.value = ''; // Limpa a seleção de ID
          idSelectField.disabled = true; // Desabilita o select de ID
          document.getElementById('other-equipment').required = true; // Torna o campo texto obrigatório
          idSelectField.required = false;
      } else {
          otherField.style.display = 'none';
          document.getElementById('other-equipment').value = ''; // Limpa o campo texto
          idSelectField.disabled = false; // Habilita o select de ID
          document.getElementById('other-equipment').required = false;
          idSelectField.required = true; // Torna o select ID obrigatório (se tipo não for vazio)
          // Disparar loadEquipmentIds se já não foi feito pelo listener de change separado
          // loadEquipmentIds(); // Cuidado com chamadas duplas se já houver outro listener
      }
  }

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

        // Encontrar os dados da linha correspondente
        const maintenanceData = findMaintenanceByIdInList(maintenanceId);

        if (button.classList.contains('view-maintenance')) {
            if (typeof viewMaintenanceDetails === 'function') {
                viewMaintenanceDetails(maintenanceId, maintenanceData); // Passa os dados se encontrados
            } else {
                 console.error("Função viewMaintenanceDetails não encontrada.");
                 alert(`Visualizar ID: ${maintenanceId}`);
            }
        } else if (button.classList.contains('verify-maintenance')) {
            if (typeof Verification !== 'undefined' && Verification.openVerificationForm) {
                Verification.openVerificationForm(maintenanceId, maintenanceData);
            } else {
                 console.error("Módulo/Função de Verificação não encontrado.");
                 alert(`Verificar ID: ${maintenanceId}`);
            }
        } else if (button.classList.contains('edit-maintenance')) {
             openMaintenanceForm(maintenanceId, maintenanceData); // Abre o form em modo de edição
        } else if (button.classList.contains('delete-maintenance')) {
             handleDeleteMaintenance(maintenanceId);
        }
    }

    // Função auxiliar para buscar dados na lista carregada
    function findMaintenanceByIdInList(id) {
        return fullMaintenanceList.find(item => String(item.id) === String(id)) || null;
    }

     // Handler para exclusão (exemplo)
     function handleDeleteMaintenance(id) {
         const maintenanceData = findMaintenanceByIdInList(id);
         const message = `Tem certeza que deseja excluir a manutenção ${id} (${maintenanceData?.placaOuId || ''})? Esta ação não pode ser desfeita.`;

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

      // Campos obrigatórios básicos
      const requiredFields = [
          { id: 'equipment-type', name: 'Tipo de Equipamento' },
          { id: 'technician-name', name: 'Responsável pelo Relatório' },
          { id: 'maintenance-date', name: 'Data da Manutenção' },
          { id: 'area', name: 'Área' },
          // { id: 'office', name: 'Local/Oficina' }, // Oficina é obrigatória? Verificar requisito.
          { id: 'maintenance-type', name: 'Tipo de Manutenção' }
      ];

       // Validação condicional de Equipamento (ID vs Outro)
       const equipType = document.getElementById('equipment-type').value;
       if (equipType && equipType !== 'Outro') {
           requiredFields.push({ id: 'equipment-id', name: 'Placa ou ID' });
       } else if (equipType === 'Outro') {
           requiredFields.push({ id: 'other-equipment', name: 'Especificar Equipamento' });
       } else if (!equipType) { // Se tipo não foi selecionado, já é inválido
           isValid = false;
           const fieldElement = document.getElementById('equipment-type');
            markFieldError(fieldElement, 'Tipo de Equipamento é obrigatório.');
            if (!firstInvalidElement) firstInvalidElement = fieldElement;
       }

        // Validar Local/Oficina se for obrigatório
        const officeField = document.getElementById('office');
        if (officeField && !officeField.value.trim()) { // Exemplo: Tornando obrigatório
             requiredFields.push({ id: 'office', name: 'Local/Oficina' });
        }


      // Iterar e validar campos
      requiredFields.forEach(fieldInfo => {
          const element = document.getElementById(fieldInfo.id);
          if (element && !element.value.trim()) {
              isValid = false;
              markFieldError(element, `${fieldInfo.name} é obrigatório.`);
              if (!firstInvalidElement) firstInvalidElement = element;
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
            if (element && !element.value.trim()) {
                isValid = false;
                 markFieldError(element, `${fieldInfo.name} é obrigatório.`);
                 if (!firstInvalidElement) firstInvalidElement = element;
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
        // Opcional: Adicionar mensagem de erro perto do campo
        const errorSpanId = element.id + '-error';
        let errorSpan = document.getElementById(errorSpanId);
        if (!errorSpan) {
            errorSpan = document.createElement('span');
            errorSpan.id = errorSpanId;
            errorSpan.className = 'error-message-field'; // Classe para estilização
            // Inserir após o elemento ou seu container
            element.parentNode.insertBefore(errorSpan, element.nextSibling);
        }
        errorSpan.textContent = message;
        errorSpan.style.display = 'block';
    }

    // Função auxiliar para limpar erros de validação de uma etapa
    function clearValidationErrors(step) {
        const stepContent = document.getElementById(`step-${step}-content`);
        if (!stepContent) return;

        stepContent.querySelectorAll('.form-control, .form-check input').forEach(el => {
            el.style.borderColor = ''; // Resetar borda
        });
        stepContent.querySelectorAll('.error-message-field').forEach(span => {
            span.textContent = ''; // Limpar mensagem
            span.style.display = 'none'; // Esconder span
        });
    }

  // Salva os dados da etapa 1 no estado 'formData'
  function saveStep1Data() {
    formData.equipmentType = document.getElementById('equipment-type')?.value || '';
    formData.equipmentId = document.getElementById('equipment-id')?.value || '';
    formData.otherEquipment = document.getElementById('other-equipment')?.value || '';
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
    formData.otherCategory = document.getElementById('other-category')?.value || '';
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

      // Equipamento
      let equipmentDisplay = '-';
      const equipType = formData.equipmentType;
      if (equipType === 'Outro') {
          equipmentDisplay = formData.otherEquipment || '(Não especificado)';
      } else if (equipType) {
          const typeText = getSelectText('equipment-type');
           // Buscar texto do ID selecionado se for select, senão usar valor direto
           const idTextOrValue = getSelectText('equipment-id') !== '-' ? getSelectText('equipment-id') : (formData.equipmentId || 'Sem ID');
          equipmentDisplay = `${typeText} (${idTextOrValue})`;
      }
       document.getElementById('summary-equipment').textContent = equipmentDisplay;

      // Responsável
      document.getElementById('summary-technician').textContent = formData.technician || '-';

      // Data
      let formattedDate = '-';
       if(formData.date) {
           if (typeof formatDate === 'function') {
                formattedDate = formatDate(formData.date); // Sem hora para o resumo
           } else {
                try { formattedDate = new Date(formData.date).toLocaleDateString('pt-BR'); } catch(e){}
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
          categoryDisplay = formData.otherCategory || '(Não especificada)';
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
      const apiData = {
          tipoEquipamento: formData.equipmentType,
          // Se for 'Outro', placaOuId recebe o texto de otherEquipment, senão recebe o ID selecionado
          placaOuId: formData.equipmentType === 'Outro' ? formData.otherEquipment : formData.equipmentId,
          responsavel: formData.technician,
          dataManutencao: formData.date,
          area: formData.area,
          localOficina: formData.office,
          tipoManutencao: formData.maintenanceType,
          eCritico: formData.isCritical,
          // Se for 'Outro', categoriaProblema recebe o texto de otherCategory, senão a categoria selecionada
          categoriaProblema: formData.problemCategory === 'Outro' ? formData.otherCategory : formData.problemCategory,
          detalhesproblema: formData.problemDescription, // Corrigir nome da chave se necessário
          observacoes: formData.additionalNotes,
          status: 'Pendente' // Status inicial ou manter o status se for edição? Verificar regra de negócio.
          // Adicionar ID se for edição
          // id: isEditMode ? editingMaintenanceId : undefined
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
                      : `Manutenção registrada com sucesso! ID: ${response.id || editingMaintenanceId}`; // Usa ID retornado ou o de edição
                  showNotification(successMessage, 'success');
                  document.getElementById('maintenance-form-overlay').style.display = 'none';
                   resetForm(); // Limpa o formulário após sucesso

                  // Atualizar a lista na aba Manutenções se ela estiver ativa
                  if (document.getElementById('tab-maintenance')?.classList.contains('active')) {
                      loadMaintenanceList(); // Recarrega a lista para refletir a mudança
                  }
                  // Atualizar o dashboard se estiver ativo
                  if (document.getElementById('tab-dashboard')?.classList.contains('active')) {
                      if (typeof Dashboard !== 'undefined' && Dashboard.loadDashboardData) {
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
              showNotification(`${failureMessage}: ${error.message}. Verifique sua conexão ou contate o suporte.`, 'error');
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

     // --- Funções Globais Auxiliares (se não existirem em utilities.js) ---
     // Mover para utilities.js se possível
     function showLoading(show, message = 'Carregando...') { /* ... implementação ... */ }
     function showNotification(message, type = 'info') { /* ... implementação ... */ }
     function showConfirmation(message, onConfirm, onCancel) { /* ... implementação ... */ }
     function formatDate(dateString, includeTime = false) { /* ... implementação ... */ }
     function getStatusClass(status) { /* ... implementação ... */ }
     // --- Fim Funções Globais Auxiliares ---


  // Expor funções públicas do módulo
  return {
    initialize,
    openMaintenanceForm, // Expor para ser chamada por botões de editar
    loadMaintenanceList // Expor para ser chamada ao mudar para a aba
  };
})();

// Inicializar o módulo Maintenance quando o DOM estiver pronto
// Garantir que API.js e Utilities.js já foram carregados
document.addEventListener('DOMContentLoaded', function() {
   if (typeof API === 'undefined' || typeof Utilities === 'undefined') {
        console.error("Erro: Dependências API.js ou Utilities.js não carregadas antes de maintenance.js");
        alert("Erro crítico na inicialização da aplicação (Maintenance). Verifique o console.");
        return;
   }
  Maintenance.initialize();

  // Carregar a lista de manutenções se a aba de manutenção for a ativa inicialmente
  if (document.getElementById('tab-maintenance')?.classList.contains('active')) {
      Maintenance.loadMaintenanceList();
  }
});
