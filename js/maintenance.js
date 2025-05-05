// Verificar dependências no início
if (!window.API || !window.Utilities) {
  console.error("Erro CRÍTICO: Dependências API ou Utilities não carregadas antes de maintenance.js");
} else {
  console.log("Maintenance.js - Dependências API e Utilities parecem carregadas.");
}

// Definir o módulo Maintenance com funcionalidade adaptada para o HTML existente
const Maintenance = (() => {
  // --- Listas de Equipamentos Completas ---
  const EQUIPMENT_IDS = {
    'Alta Pressão': ["PUB-2G02","LUX-3201","FLX7617","EZS-8765","EZS-8764","EVK-0291","EOF-5C06","EOF-5208","EGC-2989","EGC-2985","EGC-2983","EGC-2978","EAM-3262","EAM-3256","EAM-3255","EAM-3253","EAM-3010","DSY-6475","DSY-6474","DSY-6472","CZC-0453"],
    'Auto Vácuo / Hiper Vácuo': ["PUB-2F80","NFF-0235","HJS-1097","FSA-3D71","EGC-2993","EGC-2979","EAM-3257","EAM-3251","DYB-7210","DSY-6577","DSY-6473","CUB-0763","ANF-2676","FTW-4D99","FTD-6368","FMD-2200","FHD-9264","EZS-9753"],
    // 'Aspirador': [], // Removido daqui, será tratado pelo listener
    // 'Poliguindaste': [], // Removido daqui, será tratado pelo listener
    // 'Outro': [] // Removido daqui, será tratado pelo listener
  };

  // Lista de categorias de problemas padrão
  const DEFAULT_PROBLEM_CATEGORIES = [
    "Motor Estacionário", "Motor Principal", "Tanque", "Válvulas", "Bomba de Água",
    "Sistema Hidráulico", "Sistema Elétrico", "Painel de Comando", "Freios", "Suspensão",
    "Pneus", "Transmissão", "Documentação", "Sinalização", "Carroceria", "Outros"
  ];

  let formData = {};
  let isEditMode = false;
  let editingMaintenanceId = null;
  let fullMaintenanceList = [];

  // --- Função de Inicialização ---
  function initialize() {
    console.log("Maintenance.initialize() chamado.");

    // Adicionar filtros inteligentes (Deve ser chamado ANTES de carregar a lista inicial se os filtros devem estar presentes desde o início)
    createMaintenanceFilters(); // Função atualizada será chamada aqui

    // Carregar dados iniciais para os dropdowns
    loadInitialData();

    // Configurar listeners básicos
    setupBasicListeners();

    // Carregar lista de manutenções (agora pode usar filtros se já estiverem configurados e aplicados)
    loadMaintenanceList(); // Considerar se deve carregar com filtros default ou não
  }


  // --- Carregamento de Dados Iniciais ---
  function loadInitialData() {
    // Preencher dropdown de tipos de equipamento
    populateEquipmentTypes();

    // Preencher dropdown de categorias de problema
    populateProblemCategories();

    // Definir data atual no campo de data
    setCurrentDate();
  }

  function populateEquipmentTypes() {
    const select = document.getElementById('equipment-type');
    if (!select) {
      console.error("Elemento select #equipment-type não encontrado!");
      return;
    }

    // Limpar opções existentes (mantendo a primeira)
    select.innerHTML = '<option value="">Selecione o tipo...</option>';

    // Adicionar opções com base nas chaves de EQUIPMENT_IDS
    Object.keys(EQUIPMENT_IDS).forEach(type => {
      const option = document.createElement('option');
      // Usar o nome original como texto e um valor normalizado (slug)
      const typeSlug = type.toLowerCase().replace(/ /g, '-').replace(/\//g, '-');
      option.value = typeSlug;
      option.textContent = type;
      select.appendChild(option);
    });

     // Adiciona 'Aspirador', 'Poliguindaste', 'Outro' explicitamente, garantindo o value correto
    ['Aspirador', 'Poliguindaste', 'Outro'].forEach(typeName => {
        const typeKey = typeName.toLowerCase(); // ex: 'aspirador'
         const option = document.createElement('option');
         option.value = typeKey;
         option.textContent = typeName;
         select.appendChild(option);
    });


    console.log(`Dropdown de tipos de equipamento preenchido.`);
  }


  function populateProblemCategories() {
    // Linha original:
    // const select = document.getElementById('problem-category');
    // Linha corrigida:
    const select = document.getElementById('problem-category-select');
    if (!select) {
      // Linha original:
      // console.error("Elemento select #problem-category não encontrado!");
      // Linha corrigida:
      console.error("Elemento select #problem-category-select não encontrado!");
      return;
    }

    // Limpar opções existentes (mantendo a primeira)
    select.innerHTML = '<option value="">Selecione a categoria...</option>';

    // Adicionar categorias padrão
    DEFAULT_PROBLEM_CATEGORIES.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      select.appendChild(option);
    });

    console.log(`Dropdown de categorias de problema preenchido com ${DEFAULT_PROBLEM_CATEGORIES.length} opções`);
  }

  function setCurrentDate() {
    const dateInput = document.getElementById('maintenance-date');
    if (dateInput) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');

      dateInput.value = `${year}-${month}-${day}`;
    }
  }

  // --- Configuração de Listeners ---
  function setupBasicListeners() {
    console.log("Configurando listeners básicos do módulo Maintenance...");

    // Botão para abrir formulário
    const newMaintenanceBtn = document.getElementById('new-maintenance');
    if (newMaintenanceBtn) {
      newMaintenanceBtn.addEventListener('click', function() {
        openMaintenanceForm();
      });
      console.log("Listener configurado para botão 'new-maintenance'");
    } else {
      console.warn("Botão 'new-maintenance' não encontrado no DOM!");
    }

    // Botões de navegação entre etapas
    setupNavigationListeners();

    // Botões de fechar modal
    setupCloseModalListeners();

    // Eventos para campos dinâmicos
    setupDynamicFieldListeners(); // Função será substituída pela atualização

    // Form submit
    setupFormSubmitListener();
  }

  function setupNavigationListeners() {
    // *** CÓDIGO SUBSTITUÍDO CONFORME Atualizações.txt (Item 4.2) ***
    // Botão "next-to-step-2"
    const nextToStep2Button = document.getElementById('next-to-step-2');
    if (nextToStep2Button) {
      nextToStep2Button.addEventListener('click', function() {
        // Validar os campos da etapa 1
        const step1Fields = [
          { id: 'equipment-type', errorMsg: 'Selecione o tipo de equipamento' },
          { id: 'technician-name', errorMsg: 'Informe o nome do responsável' },
          { id: 'maintenance-date', errorMsg: 'Selecione a data da manutenção' },
          { id: 'area', errorMsg: 'Selecione a área' },
          { id: 'office', errorMsg: 'Informe o local/oficina' },
          { id: 'maintenance-type-select', errorMsg: 'Selecione o tipo de manutenção' } // ATENÇÃO: Verificar se o ID é 'maintenance-type' ou 'maintenance-type-select' no HTML
        ];

        // Validação adicional para o ID do equipamento
        const equipmentType = document.getElementById('equipment-type').value;
        const equipmentIdElement = document.getElementById('equipment-id');
        const otherEquipmentElement = document.getElementById('other-equipment');

        // Usar o VALOR do select (slug) para a lógica
        if (equipmentType === 'aspirador' || equipmentType === 'poliguindaste' || equipmentType === 'outro') {
           // Verifica se o campo 'other-equipment' está visível e requerido
           if (otherEquipmentElement && otherEquipmentElement.closest('.form-col, .form-group, #other-equipment-field').style.display !== 'none') {
               step1Fields.push({ id: 'other-equipment', errorMsg: 'Informe o ID ou descrição do equipamento' });
           }
        } else if (equipmentType) {
          // Verifica se o campo 'equipment-id' está visível e requerido
          if (equipmentIdElement && equipmentIdElement.closest('.form-col, .form-group').style.display !== 'none') {
             step1Fields.push({ id: 'equipment-id', errorMsg: 'Selecione o equipamento' });
          }
        } // Se equipmentType for vazio, a validação do 'equipment-type' já falhará.

        // Verificar se há campos inválidos
        let hasErrors = false;
        step1Fields.forEach(field => {
          const element = document.getElementById(field.id);
          // Verifica se o elemento existe, está visível (ou seu container), é obrigatório (ou está na lista) e está vazio
          if (element) {
              const container = element.closest('.form-col, .form-group, #other-equipment-field');
              const isVisible = container ? window.getComputedStyle(container).display !== 'none' : window.getComputedStyle(element).display !== 'none';

              // Considera obrigatório se tem o atributo 'required' OU está na nossa lista step1Fields
              const isRequired = element.hasAttribute('required') || step1Fields.some(f => f.id === field.id);

              if (isVisible && isRequired && (!element.value || !element.value.trim())) {
                hasErrors = true;
                // Tentar usar Utilities.showNotification se disponível
                 if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
                     Utilities.showNotification(field.errorMsg, 'error');
                 } else {
                    alert(field.errorMsg); // Fallback
                    console.error(field.errorMsg);
                 }
                 markFieldAsInvalid(element, field.errorMsg); // Marca o campo
              } else {
                 clearFieldValidation(element); // Limpa validação se ok
              }
          } else {
              console.warn(`Elemento de validação não encontrado: ${field.id}`);
          }
        });

        if (!hasErrors) {
           saveStep1Data(); // Salva os dados antes de avançar
          // Avançar para a etapa 2
          showStep(2); // Usa a função showStep existente
        }
      });
    } else {
        console.warn("Botão #next-to-step-2 não encontrado!");
    }

    // Manter outros listeners de navegação originais
    addSafeListener('next-to-step-3', 'click', function() {
      console.log("Botão para próxima etapa (2->3) clicado");
      if (validateStep2()) {
        saveStep2Data();
        updateSummary();
        showStep(3);
      } else {
        // A notificação já é mostrada dentro de validateStep2/validateFields
        console.warn("Validação da etapa 2 falhou.");
      }
    });

    // Botões de voltar
    addSafeListener('back-to-step-1', 'click', function() {
      showStep(1);
    });

    addSafeListener('back-to-step-2', 'click', function() {
      showStep(2);
    });
  }


  function setupCloseModalListeners() {
    // Botões de fechar modal
    const closeButtons = [
      'close-maintenance-form',
      'cancel-maintenance'
    ];

    closeButtons.forEach(id => {
      addSafeListener(id, 'click', closeForm);
    });
  }

  // =========================================================================
  // == INÍCIO DA ATUALIZAÇÃO 2: setupDynamicFieldListeners e loadEquipmentsForType ==
  // =========================================================================
  function setupDynamicFieldListeners() {
    const equipmentTypeSelect = document.getElementById('equipment-type');
    if (equipmentTypeSelect) {
      equipmentTypeSelect.addEventListener('change', function() {
        const selectedType = this.value; // Usa o valor (slug) ex: 'alta-pressao', 'aspirador'
        const equipmentIdContainer = document.getElementById('equipment-id').closest('.form-group, .form-col');
        const otherEquipmentField = document.getElementById('other-equipment-field'); // Container do campo texto

        // Primeiro, resetamos tudo para estado inicial/escondido
        if (equipmentIdContainer) equipmentIdContainer.style.display = 'none';
        if (otherEquipmentField) otherEquipmentField.style.display = 'none';

        // Limpamos o select de equipamentos
        const equipmentIdSelect = document.getElementById('equipment-id');
        if (equipmentIdSelect) {
          equipmentIdSelect.innerHTML = '<option value="">Selecione o equipamento...</option>';
          equipmentIdSelect.disabled = true;
          equipmentIdSelect.removeAttribute('required');
        }

        // Resetamos o campo de texto
        const otherEquipmentInput = document.getElementById('other-equipment');
        if (otherEquipmentInput) {
          otherEquipmentInput.value = '';
          otherEquipmentInput.removeAttribute('required');
        }

        // Agora decidimos qual campo mostrar baseado no tipo selecionado
        if (selectedType) {
          if (selectedType === 'aspirador' || selectedType === 'poliguindaste' || selectedType === 'outro') {
            // Mostra campo de entrada manual
            console.log(`Tipo '${selectedType}' selecionado. Mostrando campo de texto.`);
            if (otherEquipmentField) {
              otherEquipmentField.style.display = 'block'; // Mostrar o container do campo texto
              if (otherEquipmentInput) otherEquipmentInput.setAttribute('required', 'required'); // Marcar como obrigatório
            }
            if (equipmentIdSelect) equipmentIdSelect.removeAttribute('required'); // Remover obrigatório do select
            if (equipmentIdSelect) equipmentIdSelect.disabled = true; // Manter select desabilitado
            if (equipmentIdContainer) equipmentIdContainer.style.display = 'none'; // Garantir que select está escondido

          } else {
            // Mostra campo de seleção de ID/Placa (para tipos como 'alta-pressao', 'auto-vacuo-hiper-vacuo', etc.)
            console.log(`Tipo '${selectedType}' selecionado. Carregando equipamentos.`);
            if (equipmentIdContainer) {
              equipmentIdContainer.style.display = 'block'; // Mostrar o select
              if (equipmentIdSelect) {
                equipmentIdSelect.setAttribute('required', 'required'); // Marcar select como obrigatório
                equipmentIdSelect.disabled = false; // Habilitar (será desabilitado durante a carga)

                // Carrega os equipamentos do tipo selecionado (usando o valor/slug como chave)
                loadEquipmentsForType(selectedType, equipmentIdSelect);
              }
            }
             if (otherEquipmentField) otherEquipmentField.style.display = 'none'; // Esconder o campo texto
             if (otherEquipmentInput) otherEquipmentInput.removeAttribute('required'); // Remover obrigatório do texto
          }
        } else {
             // Reset se nada selecionado ("Selecione o tipo...")
             console.log("Nenhum tipo selecionado. Resetando campos.");
             if(equipmentIdContainer) equipmentIdContainer.style.display = 'none'; // Esconder select por padrão
             if (otherEquipmentField) otherEquipmentField.style.display = 'none'; // Esconder campo texto
             if(otherEquipmentInput) otherEquipmentInput.removeAttribute('required');
             if(equipmentIdSelect) equipmentIdSelect.removeAttribute('required');
             if(equipmentIdSelect) equipmentIdSelect.disabled = true; // Desabilitar até que um tipo seja escolhido
        }
      });
    } else {
      console.error("Elemento #equipment-type não encontrado para adicionar listener!");
    }

     // Listener original para categoria de problema (mantido)
     addSafeListener('problem-category-select', 'change', function(event) {
      const selectedCategory = this.value;
      console.log(`Categoria de problema alterada para: ${selectedCategory}`);

      // Mostrar/esconder campo de "outro" baseado na seleção
      const otherCategoryField = document.getElementById('other-category-field');
      const otherCategoryInput = document.getElementById('other-category');

      if (otherCategoryField && otherCategoryInput) {
          if (selectedCategory === 'Outros') { // Ajustado para 'Outros' que está na lista DEFAULT_PROBLEM_CATEGORIES
              otherCategoryField.style.display = 'block';
              otherCategoryInput.setAttribute('required', 'required');
          } else {
              otherCategoryField.style.display = 'none';
              otherCategoryInput.removeAttribute('required');
              otherCategoryInput.value = ''; // Limpa o valor se não for mais necessário
          }
      }
    });
  }

  // Nova função para carregar equipamentos sem duplicações
  function loadEquipmentsForType(type, selectElement) {
    if (!selectElement) return;

    // Mostra indicador de carregamento no select
    selectElement.disabled = true;
    selectElement.innerHTML = '<option value="">Carregando equipamentos...</option>';

    // Mapeia o slug de volta para a chave original do objeto EQUIPMENT_IDS, se necessário
    // (Neste caso, a chave do objeto já corresponde ao texto dos tipos não-manuais,
    // e usamos o slug para os tipos manuais. A API pode precisar do texto original.)
    let apiTypeParam = type; // Por padrão, usa o slug
    // Se a API esperar o texto original (ex: "Alta Pressão"), precisamos mapear de volta
    const equipmentTypeSelect = document.getElementById('equipment-type');
    if(equipmentTypeSelect) {
        const selectedOption = Array.from(equipmentTypeSelect.options).find(opt => opt.value === type);
        if(selectedOption) {
            apiTypeParam = selectedOption.textContent; // Usa o texto da opção (ex: "Alta Pressão") para a API
        }
    }
    console.log(`Chamando loadEquipmentsForType com tipo (slug): ${type}, parâmetro API (texto): ${apiTypeParam}`);

    // Tenta carregar da lista local primeiro (EQUIPMENT_IDS)
    // Procura pela chave original (texto, ex: "Alta Pressão")
    if (EQUIPMENT_IDS && EQUIPMENT_IDS[apiTypeParam]) {
        console.log(`Carregando da lista local EQUIPMENT_IDS para '${apiTypeParam}'`);
        // Remove duplicatas usando Set
        const uniqueEquipments = [...new Set(EQUIPMENT_IDS[apiTypeParam])];

        // Limpa o select
        selectElement.innerHTML = '<option value="">Selecione o equipamento...</option>';

        // Adiciona as opções únicas ordenadas
        if (uniqueEquipments.length > 0) {
            uniqueEquipments.sort().forEach(item => {
                const option = document.createElement('option');
                option.value = item; // O valor é a própria placa/ID
                option.textContent = item; // O texto também
                selectElement.appendChild(option);
            });
             selectElement.disabled = false;
        } else {
             selectElement.innerHTML += '<option value="" disabled>Nenhum equipamento na lista local</option>';
             selectElement.disabled = true; // Desabilitar se vazio
        }
        return;
    }

    // Caso não tenhamos lista local para esse tipo, tentamos via API
    console.log(`Tipo '${apiTypeParam}' não encontrado em EQUIPMENT_IDS. Tentando via API.`);
    if (window.API && typeof API.getEquipmentsByType === 'function') {
      // Passa o TEXTO do tipo para a API (ajuste se a API esperar o slug)
      API.getEquipmentsByType(apiTypeParam)
        .then(response => {
          selectElement.innerHTML = '<option value="">Selecione o equipamento...</option>';

          if (response.success && Array.isArray(response.equipment)) {
             console.log("Equipamentos carregados da API:", response.equipment);
            // Filtra duplicatas antes de adicionar
            const uniqueItems = new Map();

            response.equipment.forEach(item => {
              // Prioriza 'placaOuId', depois 'id', senão vazio
              const id = item.placaOuId || item.id || '';
              if (id && !uniqueItems.has(id)) {
                uniqueItems.set(id, item); // Guarda o item inteiro para ter nome/descrição
              }
            });

            // Adiciona os itens únicos ao select
            if (uniqueItems.size > 0) {
              // Ordenar pelo ID/Placa antes de adicionar
              const sortedItems = Array.from(uniqueItems.values()).sort((a, b) => {
                  const idA = a.placaOuId || a.id || '';
                  const idB = b.placaOuId || b.id || '';
                  return idA.localeCompare(idB);
              });

              sortedItems.forEach(item => {
                const option = document.createElement('option');
                const itemId = item.placaOuId || item.id; // Já sabemos que existe e é único
                // Usar nome/descrição se disponível, senão o próprio ID
                const itemName = item.name || item.descricao || itemId;

                option.value = itemId;
                // Mostrar nome e ID para clareza, a menos que sejam iguais
                option.textContent = (itemName && itemName !== itemId) ? `${itemName} (${itemId})` : itemId;
                selectElement.appendChild(option);
              });
              selectElement.disabled = false;
            } else {
              selectElement.innerHTML += '<option value="" disabled>Nenhum equipamento encontrado via API</option>';
              selectElement.disabled = true; // Desabilitar se API não retornou nada
            }
          } else {
            console.error('API retornou sucesso=false ou formato inválido:', response);
            selectElement.innerHTML += '<option value="" disabled>Erro ao carregar equipamentos</option>';
            selectElement.disabled = true;
          }
        })
        .catch(error => {
          console.error('Erro ao carregar equipamentos via API:', error);
          selectElement.innerHTML = '<option value="">Selecione o equipamento...</option>';
          selectElement.innerHTML += '<option value="" disabled>Erro na requisição API</option>';
          selectElement.disabled = true;
        });
    } else {
      console.warn('Lista local não encontrada e API.getEquipmentsByType não disponível.');
      selectElement.innerHTML = '<option value="">Selecione o equipamento...</option>';
      selectElement.innerHTML += '<option value="" disabled>Não foi possível carregar</option>';
      selectElement.disabled = true;
    }
  }
  // =======================================================================
  // == FIM DA ATUALIZAÇÃO 2 ==
  // =======================================================================


  function setupFormSubmitListener() {
    const form = document.getElementById('maintenance-form');
    if (form) {
      // Remove listener antigo para evitar duplicação se setup for chamado mais de uma vez
      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, form);

      newForm.addEventListener('submit', function(event) {
        event.preventDefault();
        console.log("Formulário submetido");

        // Valida a etapa atual (geralmente a última, a 3, antes de submeter)
        // No entanto, a validação completa é mais segura.
        if (validateAllSteps()) {
          // Dados já foram coletados nas funções saveStepXData
          // A função updateSummary já foi chamada ao ir para a etapa 3
          submitMaintenance();
        } else {
          showNotification("Por favor, verifique o preenchimento de todos os campos obrigatórios em todas as etapas.", "warning");
          // Tenta levar o usuário para a primeira etapa com erro
          if (!validateStep1()) {
              showStep(1);
          } else if (!validateStep2()) {
              showStep(2);
          }
        }
      });
    } else {
      console.warn("Formulário #maintenance-form não encontrado!");
    }
  }


  // Função auxiliar para adicionar listeners de forma segura (evita duplicação)
  function addSafeListener(elementId, eventType, handler) {
    const element = document.getElementById(elementId);
    if (element) {
      // Clone o elemento para remover todos os listeners antigos
      // Nota: Isso pode ter efeitos colaterais se outros scripts adicionarem listeners
      // Uma alternativa é usar uma flag ou remover o listener específico antes de adicionar
      const newElement = element.cloneNode(true);
      element.parentNode.replaceChild(newElement, element);

      // Adicionar o novo listener
      newElement.addEventListener(eventType, handler);
      return true;
    } else {
      console.warn(`Elemento #${elementId} não encontrado para adicionar listener de ${eventType}.`);
      return false;
    }
  }

  // --- Funções de UI ---
  function showStep(step) {
    console.log(`Tentando mostrar etapa ${step}`);

    // Obter todas as etapas
    const stepsContent = [
      document.getElementById('step-1-content'),
      document.getElementById('step-2-content'),
      document.getElementById('step-3-content')
    ];
    const stepsIndicators = document.querySelectorAll('.form-step');

    // Verificar se todas as etapas existem
    if (stepsContent.some(s => !s)) {
      console.error("Um ou mais elementos de etapa não foram encontrados!");
      console.log("Etapas encontradas:", stepsContent.map(s => s ? s.id : 'não encontrado'));
      return;
    }

    // Esconder todas as etapas de conteúdo
    stepsContent.forEach(s => {
      if (s) s.style.display = 'none';
    });

    // Mostrar apenas a etapa solicitada
    if (step >= 1 && step <= 3 && stepsContent[step - 1]) {
      stepsContent[step - 1].style.display = 'block';
      console.log(`Etapa ${step} mostrada com sucesso`);

      // Atualizar indicadores de etapa
      updateStepIndicators(step);
    } else {
      console.error(`Etapa inválida: ${step}`);
    }
  }

  function updateStepIndicators(currentStep) {
      const stepsIndicators = document.querySelectorAll('.form-step');
      stepsIndicators.forEach((indicator, index) => {
          const stepNumber = index + 1;
          indicator.classList.remove('active', 'completed'); // Limpa classes primeiro
          if (stepNumber === currentStep) {
              indicator.classList.add('active');
          } else if (stepNumber < currentStep) {
              indicator.classList.add('completed');
          }
      });
  }

  function openMaintenanceForm(maintenanceId = null, data = null) {
    console.log("Abrindo formulário de manutenção", maintenanceId ? `para edição (ID: ${maintenanceId})` : "para novo registro");

    // Reset do formulário
    resetForm();

    // Configurar modo de edição se necessário
    if (maintenanceId && data) {
      isEditMode = true;
      editingMaintenanceId = maintenanceId;
      populateFormForEdit(data); // Popula o formulário com os dados
      // Atualizar título do formulário
      const formTitle = document.querySelector('#maintenance-form-modal .form-title'); // Seja mais específico
      if (formTitle) formTitle.textContent = 'Editar Manutenção';
      // Atualizar texto do botão de submit
       const submitButton = document.getElementById('submit-maintenance'); // Assumindo que o botão final tem este ID
       if(submitButton) submitButton.textContent = 'Atualizar Manutenção';

    } else {
      isEditMode = false;
      editingMaintenanceId = null;
       // Garantir título e botão para novo registro
       const formTitle = document.querySelector('#maintenance-form-modal .form-title');
       if (formTitle) formTitle.textContent = 'Registrar Nova Manutenção';
       const submitButton = document.getElementById('submit-maintenance');
       if(submitButton) submitButton.textContent = 'Registrar Manutenção';
    }

    // Mostrar o modal
    const modal = document.getElementById('maintenance-form-overlay');
    if (modal) {
      modal.style.display = 'flex'; // Usando 'flex' em vez de 'block' para o overlay
      console.log("Modal de manutenção aberto com sucesso");
    } else {
      console.error("Modal #maintenance-form-overlay não encontrado!");
    }

    // Garantir que comece na primeira etapa
    showStep(1);
  }


  function populateFormForEdit(data) {
    console.log("Populando formulário para edição:", data);

    // Normalizar o tipo de equipamento para encontrar o 'value' (slug)
    // Considera 'equipamentoOutro' se existir, senão usa 'tipoEquipamento'
    let equipmentTypeValueOrText = data.tipoEquipamento;
    let useOtherField = false;

    // Verifica se é um tipo que usa o campo 'outro'
    const manualTypes = ['aspirador', 'poliguindaste', 'outro'];
    const originalTypeSlug = data.tipoEquipamento?.toLowerCase().replace(/ /g, '-').replace(/\//g, '-');

    if (manualTypes.includes(originalTypeSlug)) {
        equipmentTypeValueOrText = originalTypeSlug; // Usar o slug ('aspirador', 'poliguindaste', 'outro')
        useOtherField = true;
    } else {
        // Tenta encontrar pelo texto original primeiro (ex: "Alta Pressão")
        // Se não achar, tenta pelo slug (ex: "alta-pressao")
         const equipSelect = document.getElementById('equipment-type');
         const optionByText = Array.from(equipSelect.options).find(opt => opt.textContent === data.tipoEquipamento);
         if (optionByText) {
            equipmentTypeValueOrText = optionByText.value; // Usa o slug correspondente ao texto
         } else {
             equipmentTypeValueOrText = originalTypeSlug; // Usa o slug como fallback
         }
    }


    console.log(`Tentando definir tipo para '${equipmentTypeValueOrText}' (Slug/Valor). É tipo manual: ${useOtherField}`);
    setSelectValue('equipment-type', equipmentTypeValueOrText);


    // A seleção do tipo dispara o evento 'change' (devido ao setSelectValue)
    // que por sua vez mostra/esconde os campos corretos e carrega opções se necessário.
    // Esperar um pouco para que essas operações terminem
    setTimeout(() => {
      const currentSelectedTypeValue = document.getElementById('equipment-type').value; // Pega o valor atual (slug)
      console.log("Após timeout, tipo selecionado (valor/slug):", currentSelectedTypeValue);

      // Popula o campo ID/Outro baseado no tipo que ESTÁ selecionado AGORA
      if (currentSelectedTypeValue === 'aspirador' || currentSelectedTypeValue === 'poliguindaste' || currentSelectedTypeValue === 'outro') {
        console.log("Populando other-equipment com:", data.placaOuId || data.equipamentoOutro);
        setInputValue('other-equipment', data.placaOuId || data.equipamentoOutro);
      } else if (currentSelectedTypeValue) {
         // Esperar um pouco mais se for carregamento de API
         setTimeout(() => {
            console.log("Populando equipment-id com:", data.placaOuId);
            if (!setSelectValue('equipment-id', data.placaOuId)) {
                console.warn(`Falha ao selecionar ${data.placaOuId} no select #equipment-id. Pode não ter sido carregado ou não existe.`);
                // Opcional: Adicionar a opção manualmente se não existir?
                const equipIdSelect = document.getElementById('equipment-id');
                const exists = Array.from(equipIdSelect.options).some(opt => opt.value === data.placaOuId);
                if (!exists && data.placaOuId) {
                    console.log(`Adicionando opção ausente: ${data.placaOuId}`);
                    const option = document.createElement('option');
                    option.value = data.placaOuId;
                    option.textContent = data.placaOuId; // Usar nome/descrição se disponível em `data`
                    option.selected = true;
                    equipIdSelect.appendChild(option);
                    equipIdSelect.disabled = false; // Garantir que esteja habilitado
                }
            }
         }, 300); // Delay um pouco maior para API
      }

      // Preencher o restante dos campos da etapa 1 (após o primeiro timeout)
      setInputValue('technician-name', data.responsavel);
      setInputValue('maintenance-date', formatDateForInput(data.dataRegistro));
      setSelectValue('area', data.area);
      setInputValue('office', data.localOficina);
      setSelectValue('maintenance-type-select', data.tipoManutencao);
      setCheckboxValue('is-critical', data.eCritico);

      // Etapa 2 (pré-popular)
      setSelectValue('problem-category-select', data.categoriaProblema);
      const categorySelect = document.getElementById('problem-category-select');
      if(categorySelect) categorySelect.dispatchEvent(new Event('change')); // Dispara change

      setTimeout(() => { // Delay para other-category
          if (data.categoriaProblema === 'Outros') {
              setInputValue('other-category', data.categoriaProblemaOutro);
          }
          setInputValue('problem-description', data.detalhesproblema);
          setInputValue('additional-notes', data.observacoes);
      }, 50);


      console.log("Formulário populado para edição.");

    }, 200); // Aumentado delay inicial para 200ms
  }


  function setSelectValue(id, value) {
    const element = document.getElementById(id);
    if (element && value !== undefined && value !== null) {
      const valueStr = String(value); // Comparar como strings
      let found = false;

      // Tentar encontrar a opção pelo VALOR
      for (let i = 0; i < element.options.length; i++) {
          if (String(element.options[i].value) === valueStr) {
              element.selectedIndex = i;
              found = true;
              break;
          }
      }

      // Se não encontrou pelo valor, tentar pelo TEXTO (como fallback)
      if (!found) {
           for (let i = 0; i < element.options.length; i++) {
              if (element.options[i].textContent.trim() === valueStr.trim()) {
                  element.selectedIndex = i;
                  found = true;
                  break;
              }
          }
      }


      if (found) {
          console.log(`Valor/Texto "${value}" definido para #${id}`);
          // Disparar evento de change para atualizar campos dependentes
          // Fazendo isso de forma segura para não causar loops infinitos se houver listeners complexos
          setTimeout(() => {
              const event = new Event('change', { bubbles: true });
              element.dispatchEvent(event);
          }, 0);
          return true;
      } else {
          console.warn(`Valor/Texto "${value}" não encontrado nas opções de #${id}. Opções disponíveis (valores):`, Array.from(element.options).map(opt => opt.value));
          // Opcional: Selecionar a opção padrão (vazia) se não encontrar
          // element.selectedIndex = 0;
          return false;
      }
    } else {
       // Não logar warning se o valor for null/undefined de propósito
       if (value !== undefined && value !== null) {
           console.warn(`Elemento #${id} não encontrado ou valor inválido: ${value}`);
       }
       return false;
    }
  }


  function setInputValue(id, value) {
    const element = document.getElementById(id);
    if (element && value !== undefined && value !== null) {
      element.value = value;
      return true;
    }
     // console.warn(`Elemento #${id} não encontrado ou valor nulo/indefinido.`);
    return false;
  }

  function setCheckboxValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.checked = !!value; // Converte para booleano
      return true;
    }
    return false;
  }

  function formatDateForInput(dateString) {
    if (!dateString) return '';

    try {
      // Tentar criar data a partir de vários formatos comuns (ISO, DD/MM/YYYY)
      let date;
      if (dateString.includes('/')) {
          // Assumir DD/MM/YYYY
          const parts = dateString.split('/');
          if (parts.length === 3) {
              // Formato DD/MM/YYYY -> YYYY-MM-DD (Tratar como UTC para evitar timezone shift)
              date = new Date(Date.UTC(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])));
          }
      } else {
           // Tentar como ISO (YYYY-MM-DD ou completo) - Date.parse geralmente lida bem
           date = new Date(dateString);
           // Se for apenas YYYY-MM-DD, pode haver problema de timezone (interpreta como UTC 00:00)
           // Se for ISO completo com Z ou offset, ok.
           // Para garantir YYYY-MM-DD sem shift:
           if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
               const parts = dateString.split('-');
               date = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
           }
      }


      if (!date || isNaN(date.getTime())) {
           console.warn("Data inválida para formatar para input:", dateString);
           return ''; // Retorna vazio se a data for inválida
      }

      // Usar getUTCFullYear, getUTCMonth, getUTCDate para consistência
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    } catch (e) {
      console.error("Erro ao formatar data para input:", e);
      return '';
    }
  }

  function closeForm() {
    console.log("Fechando formulário");

    const modal = document.getElementById('maintenance-form-overlay');
    if (modal) {
      modal.style.display = 'none';
      resetForm(); // Reseta o estado do formulário ao fechar
      console.log("Modal de manutenção fechado com sucesso");
    } else {
      console.error("Modal #maintenance-form-overlay não encontrado!");
    }
  }

  function resetForm() {
    // Reset básico do formulário
    const form = document.getElementById('maintenance-form');
    if (form) {
      form.reset();
      console.log("Formulário resetado");
      // Limpar validações visuais
      form.querySelectorAll('.is-invalid').forEach(el => clearFieldValidation(el));
      form.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
      form.querySelectorAll('.error-message').forEach(el => el.remove());
    }

    // Limpar estados internos
    isEditMode = false;
    editingMaintenanceId = null;
    formData = {};

    // Resetar campos dinâmicos/condicionais para o estado inicial
    const equipmentTypeSelect = document.getElementById('equipment-type');
    if(equipmentTypeSelect) {
        equipmentTypeSelect.selectedIndex = 0; // Volta para "Selecione o tipo"
        // Disparar change para resetar campos dependentes
        equipmentTypeSelect.dispatchEvent(new Event('change'));
    }

    // Garantir que campos condicionais estejam no estado resetado (evento 'change' acima deve cuidar disso)
    // Não precisa resetar aqui explicitamente pois o 'change' do tipo já faz isso.

    const problemCategorySelect = document.getElementById('problem-category-select');
    if(problemCategorySelect) {
        problemCategorySelect.selectedIndex = 0;
        // Disparar change para resetar campo dependente
         problemCategorySelect.dispatchEvent(new Event('change'));
    }

    // Definir data atual novamente
    setCurrentDate();

    // Voltar para primeira etapa e resetar indicadores
    showStep(1);


    // Resetar título e botão de submit para "Novo"
    const formTitle = document.querySelector('#maintenance-form-modal .form-title');
    if (formTitle) formTitle.textContent = 'Registrar Nova Manutenção';
    const submitButton = document.getElementById('submit-maintenance'); // Assumindo ID do botão
    if(submitButton) submitButton.textContent = 'Registrar Manutenção';

     console.log("Estado do formulário completamente resetado.");
  }


  // --- Validação e Coleta de Dados ---
  function validateStep1() {
      console.log("Validando etapa 1...");
      // Reutiliza a lógica do listener 'next-to-step-2' para validação
      const fieldsToValidate = [
          { id: 'equipment-type', name: 'Tipo de Equipamento' },
          { id: 'technician-name', name: 'Responsável pelo Relatório' },
          { id: 'maintenance-date', name: 'Data da Manutenção' },
          { id: 'area', name: 'Área' },
          { id: 'office', name: 'Local/Oficina' },
          { id: 'maintenance-type-select', name: 'Tipo de Manutenção' } // Ajustar ID se necessário
      ];

      const equipmentType = document.getElementById('equipment-type').value; // Valor (slug)
      const equipmentIdElement = document.getElementById('equipment-id');
      const otherEquipmentElement = document.getElementById('other-equipment');

      // Usa o VALOR do select (slug) para a lógica
      if (equipmentType === 'aspirador' || equipmentType === 'poliguindaste' || equipmentType === 'outro') {
          if (otherEquipmentElement && otherEquipmentElement.closest('#other-equipment-field')?.style.display !== 'none') {
              fieldsToValidate.push({ id: 'other-equipment', name: 'Identificação/Descrição do Equipamento' });
          }
      } else if (equipmentType) {
          if (equipmentIdElement && equipmentIdElement.closest('.form-col, .form-group')?.style.display !== 'none') {
              fieldsToValidate.push({ id: 'equipment-id', name: 'Placa ou ID do Equipamento' });
          }
      }

      return validateFields(fieldsToValidate);
  }


  function validateStep2() {
    console.log("Validando etapa 2...");

    const requiredFields = [
      { id: 'problem-category-select', name: 'Categoria do Problema' }, // ID corrigido aqui
      { id: 'problem-description', name: 'Detalhes do Problema' }
    ];

    // Verificar se "Outros" foi selecionado como categoria (usando o ID corrigido e valor correto)
    const problemCategory = document.getElementById('problem-category-select').value;
    if (problemCategory === 'Outros') { // Verifica se é a string 'Outros'
      const otherCategoryInput = document.getElementById('other-category');
      if (otherCategoryInput && otherCategoryInput.closest('#other-category-field')?.style.display !== 'none') {
         requiredFields.push({ id: 'other-category', name: 'Especificar Categoria' });
      }
    }

    return validateFields(requiredFields);
  }

  function validateAllSteps() {
    console.log("Validando todas as etapas...");
    const isStep1Valid = validateStep1();
    const isStep2Valid = validateStep2();
    console.log(`Validação Etapa 1: ${isStep1Valid}, Etapa 2: ${isStep2Valid}`);
    return isStep1Valid && isStep2Valid;
  }


  function validateFields(fields) {
      let isValid = true;
      let firstInvalidField = null;

      fields.forEach(field => {
          const element = document.getElementById(field.id);
          if (!element) {
              console.warn(`Campo de validação ${field.id} não encontrado no DOM!`);
              return; // Pula para o próximo campo se não encontrar
          }

          let fieldValue = element.value;
          let fieldValid = false;

           // Verifica visibilidade do elemento ou de seu container relevante
          const container = element.closest('.form-col, .form-group, #other-equipment-field, #other-category-field');
          // Se não achar container específico, usa o próprio elemento
          const checkElement = container || element;
          const isVisible = window.getComputedStyle(checkElement).display !== 'none';


          // Só valida se estiver visível E tiver o atributo 'required' ou estiver na lista
           // O atributo 'required' é dinamicamente adicionado/removido nos listeners
          const isRequired = element.hasAttribute('required');

          if(isVisible && isRequired) {
              // Lógica de validação específica
              if (element.tagName === 'SELECT') {
                  fieldValid = fieldValue !== '' && fieldValue !== null;
              } else if (element.type === 'checkbox') {
                   // Validação de checkbox normalmente é feita de outra forma se for obrigatório
                   fieldValid = element.checked; // Considera válido se marcado
              } else { // Inputs de texto, data, etc.
                  fieldValid = fieldValue && fieldValue.trim() !== '';
              }

              if (!fieldValid) {
                  isValid = false;
                  // Usar a mensagem definida em fieldsToValidate ou uma genérica
                  const errorMsg = field.errorMsg || `${field.name} é obrigatório`;
                  markFieldAsInvalid(element, errorMsg);
                  if (!firstInvalidField) {
                      firstInvalidField = element;
                  }
              } else {
                  clearFieldValidation(element);
              }
          } else {
               // Se não está visível ou não é obrigatório, limpar qualquer validação anterior
               clearFieldValidation(element);
          }
      });

      // Focar no primeiro campo inválido, se houver
      if (firstInvalidField) {
          firstInvalidField.focus();
          console.log(`Foco no primeiro campo inválido: #${firstInvalidField.id}`);
      }

      return isValid;
  }


  function markFieldAsInvalid(element, message) {
    // Adicionar classe de erro ao elemento
    element.classList.add('is-invalid');

    // Procurar o container pai (form-group ou form-col ou o container específico)
    const formGroup = element.closest('.form-group, .form-col, #other-equipment-field, #other-category-field');
    if (formGroup) {
      formGroup.classList.add('has-error');

      // Verificar se já existe mensagem de erro para não duplicar
      let errorElement = formGroup.querySelector('.error-message');
      if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.style.color = '#dc3545'; // Cor de erro Bootstrap
        errorElement.style.fontSize = '0.875em';
        errorElement.style.marginTop = '0.25rem';
        errorElement.style.width = '100%'; // Ocupar largura para evitar quebra
        // Inserir após o elemento inválido ou no final do form-group
        formGroup.appendChild(errorElement); // Adicionar no final do grupo é mais seguro
      }

      errorElement.textContent = message;
      errorElement.style.display = 'block'; // Garantir que esteja visível
    } else {
       console.warn("Não foi possível encontrar .form-group ou .form-col para exibir mensagem de erro para:", element);
       // Tentar adicionar após o próprio elemento como fallback
       let errorElement = element.nextElementSibling;
       if (!errorElement || !errorElement.classList.contains('error-message')) {
           errorElement = document.createElement('div');
           errorElement.className = 'error-message';
           errorElement.style.color = '#dc3545';
           errorElement.style.fontSize = '0.875em';
           errorElement.style.marginTop = '0.25rem';
           element.parentNode.insertBefore(errorElement, element.nextSibling);
       }
       errorElement.textContent = message;
       errorElement.style.display = 'block';
    }
  }


  function clearFieldValidation(element) {
    // Remover classe de erro do elemento
    element.classList.remove('is-invalid');

    // Procurar o container pai (form-group ou form-col)
    const formGroup = element.closest('.form-group, .form-col, #other-equipment-field, #other-category-field');
    if (formGroup) {
      formGroup.classList.remove('has-error');

      // Remover mensagem de erro se existir DENTRO do formGroup
      const errorElement = formGroup.querySelector('.error-message');
      if (errorElement) {
        errorElement.remove(); // Remove o elemento de erro
      }
    } else {
       // Remover mensagem de erro que pode estar como irmão (fallback do markField)
       const errorElement = element.nextElementSibling;
        if (errorElement && errorElement.classList.contains('error-message')) {
            errorElement.remove();
        }
    }
  }

  function saveStep1Data() {
    console.log("Salvando dados da etapa 1...");
    const equipTypeSelect = document.getElementById('equipment-type');
    const equipTypeValue = equipTypeSelect.value; // Valor (slug)
    const equipTypeText = equipTypeSelect.selectedOptions[0]?.textContent || equipTypeValue; // Texto

    formData.tipoEquipamento = equipTypeText; // Salva o texto da opção selecionada

    // Capturar ID/Descrição baseado no tipo de equipamento e visibilidade dos campos
    // Usa o VALOR (slug) para a lógica
    if (equipTypeValue === 'aspirador' || equipTypeValue === 'poliguindaste' || equipTypeValue === 'outro') {
        const otherInput = document.getElementById('other-equipment');
        if(otherInput && otherInput.closest('#other-equipment-field')?.style.display !== 'none') {
           formData.placaOuId = otherInput.value.trim(); // Salva o valor digitado
           formData.equipamentoOutro = null; // Por padrão

           // Se o tipo FOR 'outro', usar a descrição digitada como tipo E salvar em equipamentoOutro
           if(equipTypeValue === 'outro') {
              formData.tipoEquipamento = otherInput.value.trim() || 'Outro (não especificado)'; // Sobrescreve tipoEquipamento
              formData.equipamentoOutro = otherInput.value.trim(); // Campo específico para 'outro'
              // placaOuId já foi definido acima
           }
        } else {
            formData.placaOuId = ''; // Campo não visível/aplicável
            formData.equipamentoOutro = null;
        }
    } else if (equipTypeValue) {
        const idSelect = document.getElementById('equipment-id');
         if(idSelect && idSelect.closest('.form-col, .form-group')?.style.display !== 'none') {
            formData.placaOuId = idSelect.value; // Salva o ID/Placa selecionado
            formData.equipamentoOutro = null; // Garantir que não haja valor de 'outro'
         } else {
            formData.placaOuId = ''; // Campo não visível/aplicável
             formData.equipamentoOutro = null;
         }
    } else {
        formData.placaOuId = ''; // Nenhum tipo selecionado
        formData.equipamentoOutro = null;
    }

    formData.responsavel = document.getElementById('technician-name').value;
    formData.dataRegistro = document.getElementById('maintenance-date').value;
    formData.area = document.getElementById('area').value;
    formData.localOficina = document.getElementById('office').value;
    formData.tipoManutencao = document.getElementById('maintenance-type-select').value; // Ajustar ID se necessário
    formData.eCritico = document.getElementById('is-critical').checked;

    console.log("Dados da etapa 1 salvos:", formData);
  }

  function saveStep2Data() {
    console.log("Salvando dados da etapa 2...");

    // Capturar valores dos campos (usando ID corrigido)
    const problemCategorySelect = document.getElementById('problem-category-select');
    formData.categoriaProblema = problemCategorySelect.value;

    // Se categoria for "Outros", salvar categoria específica
    if (formData.categoriaProblema === 'Outros') { // Usa 'Outros'
      formData.categoriaProblemaOutro = document.getElementById('other-category').value.trim();
       // Opcional: usar a descrição como a categoria principal? Decisão de negócio.
       // Ex: formData.categoriaProblema = formData.categoriaProblemaOutro || 'Outros';
    } else {
        formData.categoriaProblemaOutro = null; // Garantir que não haja valor antigo
    }

    formData.detalhesproblema = document.getElementById('problem-description').value; // Ajustar ID se necessário

    const additionalNotes = document.getElementById('additional-notes');
    formData.observacoes = additionalNotes ? additionalNotes.value : ''; // Ajustar ID se necessário

    console.log("Dados da etapa 2 salvos:", formData);
  }

  function updateSummary() {
    console.log("Atualizando resumo...");

    // Formatar os dados para exibição
    let equipmentSummary = '-';
    // Usar os dados JÁ COLETADOS em formData
    if (formData.tipoEquipamento) {
        // Se tipoEquipamento foi sobrescrito por ser 'outro', ele já contém a descrição
        if (formData.equipamentoOutro) {
             equipmentSummary = formData.tipoEquipamento; // Mostra a descrição digitada (que virou o tipo)
        } else if (formData.placaOuId) {
             equipmentSummary = `${formData.tipoEquipamento} (${formData.placaOuId})`; // Tipo (Placa/ID)
        } else {
             equipmentSummary = formData.tipoEquipamento; // Apenas o tipo
        }
    }


    let categorySummary = formData.categoriaProblema || '-';
    if (formData.categoriaProblema === 'Outros' && formData.categoriaProblemaOutro) {
        categorySummary = `${formData.categoriaProblema} (${formData.categoriaProblemaOutro})`;
    }

    // Mapear IDs dos elementos de resumo para os valores formatados
    const summaryElements = {
      'summary-equipment': equipmentSummary,
      'summary-technician': formData.responsavel || '-',
      'summary-date': formatDate(formData.dataRegistro) || '-', // Formata a data
      'summary-location': `${formData.area || '-'} - ${formData.localOficina || '-'}`,
      'summary-type': formData.tipoManutencao || '-',
      'summary-critical': formData.eCritico ? 'Sim ⚠️' : 'Não',
      'summary-category': categorySummary,
      'summary-problem': formData.detalhesproblema || '-',
      'summary-notes': formData.observacoes || 'Nenhuma'
    };

    // Atualizar elementos no DOM
    Object.entries(summaryElements).forEach(([elementId, value]) => {
      const element = document.getElementById(elementId);
      if (element) {
        element.textContent = value; // Usar textContent é mais seguro que innerHTML para texto simples
      } else {
        console.warn(`Elemento de resumo #${elementId} não encontrado!`);
      }
    });

    console.log("Resumo atualizado com sucesso");
  }


  function submitMaintenance() {
    console.log(`${isEditMode ? 'Atualizando' : 'Criando nova'} manutenção... Dados coletados:`, formData);

    // Mostrar indicador de carregamento
    showLoading(true, `${isEditMode ? 'Atualizando' : 'Registrando'} manutenção...`);

    // Preparar dados para envio (mapeamento final para a API)
    // Adaptar os nomes das chaves conforme esperado pela API
    const dataToSend = {
      // ID só é enviado na atualização
      tipoEquipamento: formData.tipoEquipamento, // Já contém a descrição se for 'outro'
      placaOuId: formData.placaOuId,
      // O campo 'equipamentoOutro' pode não ser necessário se a API só usa 'tipoEquipamento' e 'placaOuId'
      // Mas enviar pode ser útil para referência. Verifique a necessidade da API.
      equipamentoOutro: formData.equipamentoOutro, // Será null a menos que o tipo original fosse 'outro'
      responsavel: formData.responsavel,
      dataRegistro: formData.dataRegistro, // Formato YYYY-MM-DD
      area: formData.area,
      localOficina: formData.localOficina,
      tipoManutencao: formData.tipoManutencao,
      eCritico: formData.eCritico,
      categoriaProblema: formData.categoriaProblema, // Categoria selecionada ou 'Outros'
      categoriaProblemaOutro: formData.categoriaProblemaOutro, // Descrição se categoria foi 'Outros'
      detalhesproblema: formData.detalhesproblema, // Verificar nome do campo esperado pela API
      observacoes: formData.observacoes, // Verificar nome do campo esperado pela API
      // Adicionar status inicial se for criação
      status: isEditMode ? undefined : 'Pendente' // Só envia status na criação
    };

     // Remover campos indefinidos ou nulos se a API não os aceitar
     Object.keys(dataToSend).forEach(key => {
         if (dataToSend[key] === undefined || dataToSend[key] === null) {
             delete dataToSend[key];
         }
     });


    // Se estiver editando, incluir ID
    if (isEditMode && editingMaintenanceId) {
      dataToSend.id = editingMaintenanceId;
    } else if (isEditMode && !editingMaintenanceId) {
        console.error("Tentando editar sem um ID de manutenção!");
        showNotification("Erro: ID da manutenção não encontrado para edição.", "error");
        showLoading(false);
        return;
    }

    console.log("Dados a serem enviados para a API:", dataToSend);

    // Chamar API para salvar os dados
     if (!window.API || !(isEditMode ? API.updateMaintenance : API.createMaintenance)) {
         console.error("Função da API necessária (create/update) não encontrada!");
         showNotification("Erro: Falha na comunicação com o servidor (API não disponível).", "error");
         showLoading(false);
         return;
     }

    const apiCall = isEditMode ?
      API.updateMaintenance(editingMaintenanceId, dataToSend) :
      API.createMaintenance(dataToSend);

    apiCall
      .then(response => {
        // Normalizar a resposta (algumas APIs podem retornar string JSON)
         let parsedResponse = response;
         if (typeof response === 'string') {
             try {
                 parsedResponse = JSON.parse(response);
             } catch (e) {
                 console.error("Erro ao parsear resposta da API:", e);
                 // Considerar a string como mensagem de erro se o parse falhar
                 parsedResponse = { success: false, message: response || "Resposta inválida do servidor." };
             }
         } else if (typeof response !== 'object' || response === null) {
             // Lidar com respostas inesperadas que não são strings nem objetos
             parsedResponse = { success: false, message: "Formato de resposta inesperado do servidor." };
         }


        if (parsedResponse && parsedResponse.success) {
          console.log("Manutenção salva com sucesso:", parsedResponse);

          // Mostrar notificação de sucesso
          const message = isEditMode ?
            "Manutenção atualizada com sucesso!" :
            "Nova manutenção registrada com sucesso!";

          showNotification(message, "success");

          // Fechar o formulário
          closeForm();

          // Recarregar a lista de manutenções
          loadMaintenanceList(); // Recarrega a lista completa (ou com filtros atuais, se implementado)
        } else {
          console.error("Erro ao salvar manutenção (API retornou erro):", parsedResponse);
          // Tentar extrair uma mensagem mais útil da resposta
          const errorMessage = parsedResponse?.message || parsedResponse?.error || (typeof parsedResponse === 'string' ? parsedResponse : 'Erro desconhecido do servidor.');
          showNotification(`Erro ao ${isEditMode ? 'atualizar' : 'registrar'} manutenção: ${errorMessage}`, "error");
        }
      })
      .catch(error => {
        console.error("Falha na chamada da API ao salvar manutenção:", error);
        // Tentar extrair mensagem do erro
        const errorMessage = error?.message || (typeof error === 'string' ? error : 'Verifique sua conexão ou contate o suporte.');
        showNotification(`Falha ao conectar com o servidor: ${errorMessage}`, "error");
      })
      .finally(() => {
        // Esconder indicador de carregamento
        showLoading(false);
      });
  }

  // --- Funções de Dados e Tabela ---
  function loadMaintenanceList() {
      // Verificar se há filtros ativos e carregar com eles, senão carregar tudo
      const statusFilter = document.getElementById('maintenance-status-filter')?.value;
      const typeFilter = document.getElementById('maintenance-type-filter')?.value;
      const dateFrom = document.getElementById('maintenance-date-from')?.value;
      const dateTo = document.getElementById('maintenance-date-to')?.value;

      // Determinar se algum filtro está ativo (diferente de 'all' ou vazio)
      const filtersActive = (statusFilter && statusFilter !== 'all') ||
                            (typeFilter && typeFilter !== 'all') ||
                            dateFrom || dateTo;

      if (filtersActive) {
          console.log("Recarregando lista com filtros ativos.");
          loadMaintenanceListWithFilters(statusFilter, typeFilter, dateFrom, dateTo);
      } else {
          console.log("Carregando lista completa de manutenções (sem filtros ativos).");
          loadMaintenanceListWithoutFilters(); // Função separada para clareza
      }
  }


  function loadMaintenanceListWithoutFilters() {
    console.log("Carregando lista completa de manutenções...");
    showLoading(true, "Carregando manutenções...");

    const tableBody = document.getElementById('maintenance-tbody');
    if (tableBody) {
      tableBody.innerHTML = '<tr><td colspan="10" class="text-center">Carregando...</td></tr>';
    }

    if (window.API && typeof API.getMaintenanceList === 'function') {
      API.getMaintenanceList()
        .then(response => handleApiResponse(response, tableBody))
        .catch(error => handleApiError(error, tableBody))
        .finally(() => showLoading(false));
    } else {
      handleApiError("API.getMaintenanceList não disponível", tableBody);
      showLoading(false);
    }
  }

  // Função para carregar manutenções COM filtros (vinda da atualização 3.2)
  function loadMaintenanceListWithFilters(status, type, dateFrom, dateTo) {
    console.log(`Carregando lista com filtros: Status=${status || 'N/A'}, Tipo=${type || 'N/A'}, De=${dateFrom || 'N/A'}, Até=${dateTo || 'N/A'}`);

    showLoading(true, "Filtrando manutenções...");

    const tableBody = document.getElementById('maintenance-tbody');
     if (tableBody) {
       tableBody.innerHTML = '<tr><td colspan="10" class="text-center">Filtrando...</td></tr>';
     }

    // Montar parâmetros para a API (só incluir se tiver valor e não for 'all')
    const params = {};
    if (status && status !== 'all') params.status = status;
    if (type && type !== 'all') params.tipo = type; // Verificar se a API espera 'tipo' ou 'tipoManutencao'
    if (dateFrom) params.dataInicio = dateFrom; // Verificar nome esperado pela API
    if (dateTo) params.dataFim = dateTo; // Verificar nome esperado pela API

    // Verificar se a função da API existe
    if (window.API && typeof API.getMaintenanceListFiltered === 'function') {
      API.getMaintenanceListFiltered(params)
        .then(response => handleApiResponse(response, tableBody)) // Reutiliza o handler
        .catch(error => handleApiError(error, tableBody)) // Reutiliza o handler
        .finally(() => showLoading(false));
    } else if (window.API && typeof API.getMaintenanceList === 'function') {
        // Fallback: Usar getMaintenanceList com query params se getMaintenanceListFiltered não existir
        console.warn("API.getMaintenanceListFiltered não encontrada. Tentando usar API.getMaintenanceList com parâmetros.");
        API.getMaintenanceList(params) // Passa os mesmos parâmetros
            .then(response => handleApiResponse(response, tableBody))
            .catch(error => handleApiError(error, tableBody))
            .finally(() => showLoading(false));
    } else {
      handleApiError("Nenhuma função da API disponível para carregar/filtrar manutenções.", tableBody);
      showLoading(false);
    }
  }


  // Handler comum para respostas da API (lista/filtrada)
  function handleApiResponse(response, tableBody) {
      let parsedResponse = response;
      if (typeof response === 'string') {
          try {
              parsedResponse = JSON.parse(response);
          } catch (e) {
              console.error("Erro ao parsear resposta da API (lista):", e);
              parsedResponse = { success: false, message: response || "Resposta inválida do servidor." };
          }
      } else if (typeof response !== 'object' || response === null) {
           parsedResponse = { success: false, message: "Formato de resposta inesperado do servidor." };
      }

      if (parsedResponse && parsedResponse.success && Array.isArray(parsedResponse.maintenances)) {
        fullMaintenanceList = parsedResponse.maintenances;
        console.log(`Lista de manutenções recebida/filtrada (${fullMaintenanceList.length} itens).`);
        renderMaintenanceTable(fullMaintenanceList); // Chama a função atualizada de renderização
      } else {
        console.error("Erro ao carregar/filtrar manutenções:", parsedResponse);
        const errorMessage = parsedResponse?.message || 'Formato inválido ou nenhum dado retornado.';
        if (tableBody) {
          tableBody.innerHTML = `<tr><td colspan="10" class="text-center error-message">Erro ao carregar dados: ${errorMessage}</td></tr>`;
        }
        fullMaintenanceList = []; // Limpar a lista em caso de erro
        renderMaintenanceTable(fullMaintenanceList); // Renderizar tabela vazia com mensagem
      }
  }

  // Handler comum para erros de API (fetch/network)
  function handleApiError(error, tableBody) {
      console.error("Falha na comunicação com a API:", error);
      const errorMessage = error?.message || (typeof error === 'string' ? error : 'Falha ao conectar com o servidor.');
      if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="10" class="text-center error-message">${errorMessage}. Tente novamente mais tarde.</td></tr>`;
      }
      fullMaintenanceList = []; // Limpar a lista em caso de erro
      renderMaintenanceTable(fullMaintenanceList); // Renderizar tabela vazia com mensagem
  }


 // *** FUNÇÃO SUBSTITUÍDA CONFORME Atualizações.txt (Item 3.1 e 5 - são idênticas no exemplo) ***
 // Esta função não foi alterada pelas atualizações 2 ou 3, mantendo a versão original.
 function renderMaintenanceTable(maintenances) {
    const tbody = document.getElementById('maintenance-tbody');
    if (!tbody) {
        console.error("Elemento #maintenance-tbody não encontrado para renderizar tabela.");
        return;
    }

    tbody.innerHTML = ''; // Limpa o corpo da tabela

    if (!maintenances || maintenances.length === 0) {
        // Verificar se filtros estão ativos para mensagem mais específica
        const statusFilter = document.getElementById('maintenance-status-filter')?.value;
        const typeFilter = document.getElementById('maintenance-type-filter')?.value;
        const dateFrom = document.getElementById('maintenance-date-from')?.value;
        const dateTo = document.getElementById('maintenance-date-to')?.value;
        const filtersActive = (statusFilter && statusFilter !== 'all') || (typeFilter && typeFilter !== 'all') || dateFrom || dateTo;

        const message = filtersActive ? "Nenhuma manutenção encontrada para os filtros aplicados." : "Nenhuma manutenção encontrada.";
        tbody.innerHTML = `<tr><td colspan="10" class="text-center">${message}</td></tr>`;
        return;
    }


    console.log(`Renderizando ${maintenances.length} manutenções na tabela.`);

    maintenances.forEach(maintenance => {
        // Garantir valores confiáveis com fallbacks para cada campo
        const id = maintenance.id || '-';
        const tipoEquipamento = maintenance.tipoEquipamento || 'Não especificado';
        const placaOuId = maintenance.placaOuId || '-';
        // Exibir 'tipo (placa)' apenas se placa/id existir
        const equipamentoDisplay = placaOuId !== '-' ? `${tipoEquipamento} (${placaOuId})` : tipoEquipamento;
        const tipoManutencao = maintenance.tipoManutencao || 'Preventiva'; // Valor padrão mais específico
        const dataRegistro = formatDate(maintenance.dataRegistro) || '-'; // Usa a função de formatação
        const responsavel = maintenance.responsavel || 'Não atribuído';
        const area = maintenance.area || 'Não especificada';
        const local = maintenance.localOficina || maintenance.local || '-'; // Usa localOficina ou local como fallback
        // Usar htmlspecialchars ou similar para exibir problema/detalhes com segurança se puderem conter HTML
        const problemaRaw = maintenance.detalhesproblema || maintenance.problema || '-';
        const problema = Utilities.escapeHtml ? Utilities.escapeHtml(problemaRaw) : problemaRaw; // Usar escape se disponível

        const status = maintenance.status || 'Pendente'; // Default 'Pendente'
        const statusLower = status.toLowerCase();
        const statusClass = getStatusClass(status); // Obtém a classe CSS para o status

        const row = document.createElement('tr');
        row.dataset.id = id; // Adiciona o ID real ao dataset da linha

        // Determinar quais botões mostrar com base no status (lógica vinda das atualizações)
        const canVerify = ['pendente', 'aguardando verificacao', 'aguardando verificação'].includes(statusLower);
        // Permitir editar se pendente, aguardando, ajustes ou reprovado (ajustar conforme regra de negócio)
        const canEdit = ['pendente', 'aguardando verificacao', 'aguardando verificação', 'ajustes', 'reprovado'].includes(statusLower);


        row.innerHTML = `
          <td>${id}</td>
          <td>${equipamentoDisplay} ${maintenance.eCritico ? '<span class="critical-badge" title="Manutenção Crítica">⚠️</span>' : ''}</td>
          <td>${tipoManutencao}</td>
          <td>${dataRegistro}</td>
          <td>${responsavel}</td>
          <td>${area}</td>
          <td>${local}</td>
          <td>${problema}</td>
          <td>
            <span class="status-badge status-${statusClass}">${status}</span>
          </td>
          <td class="action-buttons">
            <button class="btn-icon view-maintenance" title="Ver Detalhes" data-id="${id}">👁️</button>
            ${canEdit ? `<button class="btn-icon edit-maintenance" title="Editar" data-id="${id}">✏️</button>` : ''}
            ${canVerify ? `<button class="btn-icon verify-maintenance" title="Verificar" data-id="${id}">✔️</button>` : ''}
            <!-- Adicionar outros botões aqui se necessário (ex: delete, etc.) -->
          </td>
        `;

        tbody.appendChild(row);
    });

     // Re-configurar listeners para ações na tabela após renderizar
     setupTableActionListeners();
     console.log("Tabela renderizada e listeners de ação configurados.");
 }


  function setupTableActionListeners() {
    const tableBody = document.getElementById('maintenance-tbody');
    if (!tableBody) return;

    // Remover listeners antigos para evitar duplicação (delegação de eventos é mais eficiente)
    // Clonar e substituir é uma forma bruta, mas eficaz se houver problemas com listeners duplicados
    const newTableBody = tableBody.cloneNode(true);
    tableBody.parentNode.replaceChild(newTableBody, tableBody);


    // Usar delegação de eventos no novo corpo da tabela
    newTableBody.addEventListener('click', function(event) {
      const button = event.target.closest('.btn-icon[data-id]'); // Procura por botão de ícone com data-id
      if (!button) return; // Clique não foi em um botão de ação válido

      const maintenanceId = button.getAttribute('data-id');
      if (!maintenanceId) return; // Botão sem data-id (improvável devido ao seletor)

      // Garantir que o ID seja tratado como string ou número consistentemente
      // const maintenanceIdNum = parseInt(maintenanceId, 10); // Use se IDs forem números

      console.log(`Ação clicada: ${Array.from(button.classList).join(' ')}, ID: ${maintenanceId}`);

      if (button.classList.contains('view-maintenance')) {
        viewMaintenanceDetails(maintenanceId);
      } else if (button.classList.contains('edit-maintenance')) {
        editMaintenance(maintenanceId);
      } else if (button.classList.contains('verify-maintenance')) {
        verifyMaintenance(maintenanceId);
      }
      // Adicionar outras ações aqui (delete, etc.)
       // else if (button.classList.contains('delete-maintenance')) {
       //   deleteMaintenance(maintenanceId);
       // }
    });
  }


  function viewMaintenanceDetails(id) {
      console.log(`Buscando detalhes para manutenção ID: ${id}`);
      // Buscar dados da manutenção na lista local
      const maintenanceData = findMaintenanceById(id);

      if (!maintenanceData) {
          showNotification("Erro: Dados da manutenção não encontrados localmente.", "error");
          console.error(`Manutenção com ID ${id} não encontrada em fullMaintenanceList.`);
          return;
      }

      console.log("Dados encontrados para visualização:", maintenanceData);

      // Tentar usar Utilities.viewMaintenanceDetails se existir
      if (typeof Utilities !== 'undefined' && Utilities.viewMaintenanceDetails) {
          console.log("Usando Utilities.viewMaintenanceDetails");
          // Passar a função de verificação como callback para o Utilities, se necessário
          // E passar a função de edição como callback também
          const actions = {
              canVerify: ['pendente', 'aguardando verificacao', 'aguardando verificação'].includes((maintenanceData.status || '').toLowerCase()),
              canEdit: ['pendente', 'aguardando verificacao', 'aguardando verificação', 'ajustes', 'reprovado'].includes((maintenanceData.status || '').toLowerCase()),
              onVerify: () => verifyMaintenance(id),
              onEdit: () => editMaintenance(id)
              // Adicionar onDelete se houver
          };
          Utilities.viewMaintenanceDetails(id, maintenanceData, actions);
      } else {
          // Fallback: Usar um modal/overlay genérico se Utilities não estiver disponível
          console.warn("Utilities.viewMaintenanceDetails não encontrado. Usando modal de fallback.");
          // Implementação de um modal de detalhes básico (exemplo)
          const detailOverlay = document.getElementById('detail-overlay'); // Precisa existir no HTML
          const detailContent = document.getElementById('maintenance-detail-content'); // Precisa existir no HTML

          if (detailOverlay && detailContent) {
               let htmlContent = `<h2>Detalhes da Manutenção #${maintenanceData.id || '-'}</h2>`;

                // Mapeamento de campos para exibição
                const equipamentoDisplayFallback = maintenanceData.placaOuId ? `${maintenanceData.tipoEquipamento || '-'} (${maintenanceData.placaOuId})` : (maintenanceData.tipoEquipamento || '-');
                const categoryDisplayFallback = (maintenanceData.categoriaProblema === 'Outros' && maintenanceData.categoriaProblemaOutro) ? `${maintenanceData.categoriaProblema} (${maintenanceData.categoriaProblemaOutro})` : (maintenanceData.categoriaProblema || '-');

                const detailsMap = [
                    { label: 'Equipamento', value: equipamentoDisplayFallback },
                    { label: 'Tipo de Manutenção', value: `${maintenanceData.tipoManutencao || '-'} ${maintenanceData.eCritico ? '<span class="critical-badge" title="Manutenção Crítica">⚠️ CRÍTICA</span>' : ''}` },
                    { label: 'Data de Registro', value: formatDate(maintenanceData.dataRegistro) || '-' },
                    { label: 'Responsável', value: maintenanceData.responsavel || '-' },
                    { label: 'Local', value: `${maintenanceData.area || '-'} / ${maintenanceData.localOficina || '-'}` },
                    { label: 'Status', value: `<span class="status-badge status-${getStatusClass(maintenanceData.status)}">${maintenanceData.status || 'Pendente'}</span>` },
                    { label: 'Categoria do Problema', value: categoryDisplayFallback },
                    { label: 'Descrição do Problema', value: Utilities.escapeHtml ? Utilities.escapeHtml(maintenanceData.detalhesproblema || '-') : (maintenanceData.detalhesproblema || '-') },
                    { label: 'Observações', value: Utilities.escapeHtml ? Utilities.escapeHtml(maintenanceData.observacoes || 'Nenhuma') : (maintenanceData.observacoes || 'Nenhuma') },
                ];

                 htmlContent += '<div class="details-grid">'; // Usar grid para melhor layout
                 detailsMap.forEach(item => {
                      // Usar innerHTML para value apenas se contiver HTML (badge, span), senão textContent
                      const valueHtml = item.value.includes('<span') ? item.value : (Utilities.escapeHtml ? Utilities.escapeHtml(item.value) : item.value);
                      htmlContent += `<div class="detail-item"><strong>${item.label}:</strong> <div>${valueHtml || '-'}</div></div>`;
                 });
                 htmlContent += '</div>';


               // Adicionar seção de verificação se existir nos dados da API
              if (maintenanceData.verificacao && typeof maintenanceData.verificacao === 'object' && Object.keys(maintenanceData.verificacao).length > 0) {
                    htmlContent += `<h3 style="margin-top: 20px;">Informações da Verificação</h3>`;
                    const verificationMap = [
                         { label: 'Verificador', value: maintenanceData.verificacao.verifierName || maintenanceData.verificacao.verificador },
                         { label: 'Data da Verificação', value: formatDate(maintenanceData.verificacao.verificationDate || maintenanceData.verificacao.data) },
                         { label: 'Resultado', value: maintenanceData.verificacao.result || maintenanceData.verificacao.resultado },
                         { label: 'Comentários', value: Utilities.escapeHtml ? Utilities.escapeHtml(maintenanceData.verificacao.comments || maintenanceData.verificacao.comentarios) : (maintenanceData.verificacao.comments || maintenanceData.verificacao.comentarios) },
                    ];
                     htmlContent += '<div class="details-grid">';
                     verificationMap.forEach(item => {
                         const valueHtml = Utilities.escapeHtml ? Utilities.escapeHtml(item.value) : item.value;
                        htmlContent += `<div class="detail-item"><strong>${item.label}:</strong> <div>${valueHtml || '-'}</div></div>`;
                    });
                     htmlContent += '</div>';
              }

                detailContent.innerHTML = htmlContent;

                // Botões de ação no modal de detalhes (se aplicável)
                 const detailActions = detailOverlay.querySelector('.modal-actions'); // Container para botões no modal
                 if (detailActions) {
                    detailActions.innerHTML = ''; // Limpa ações antigas
                     const statusLower = (maintenanceData.status || '').toLowerCase();
                     const canVerify = ['pendente', 'aguardando verificacao', 'aguardando verificação'].includes(statusLower);
                     const canEdit = ['pendente', 'aguardando verificacao', 'aguardando verificação', 'ajustes', 'reprovado'].includes(statusLower);

                     // Botão Editar (se aplicável)
                     if (canEdit) {
                         const editBtn = document.createElement('button');
                         editBtn.innerHTML = '✏️ Editar'; // Usar ícone + texto
                         editBtn.className = 'btn btn-secondary'; // Ajustar classe
                         editBtn.onclick = () => {
                             detailOverlay.style.display = 'none'; // Fecha detalhes
                             editMaintenance(id); // Abre edição
                         };
                         detailActions.appendChild(editBtn);
                     }

                     // Botão Verificar (se aplicável)
                     if (canVerify) {
                          const verifyBtn = document.createElement('button');
                          verifyBtn.innerHTML = '✔️ Verificar'; // Usar ícone + texto
                          verifyBtn.className = 'btn btn-primary'; // Usar classes CSS apropriadas
                          verifyBtn.onclick = () => {
                               detailOverlay.style.display = 'none'; // Fecha detalhes
                               verifyMaintenance(id); // Abre verificação
                          };
                          detailActions.appendChild(verifyBtn);
                     }

                      // Botão de fechar sempre presente
                      const closeBtn = document.createElement('button');
                      closeBtn.textContent = 'Fechar';
                      closeBtn.className = 'btn btn-light'; // Usar classe apropriada
                      closeBtn.onclick = () => detailOverlay.style.display = 'none';
                      detailActions.appendChild(closeBtn);
                 }


                detailOverlay.style.display = 'flex'; // Mostra o overlay

                // Adicionar event listener para fechar clicando fora (opcional)
                detailOverlay.onclick = function(event) {
                    // Fechar só se clicar DIRETAMENTE no overlay (não nos filhos)
                    if (event.target === detailOverlay) {
                        detailOverlay.style.display = 'none';
                    }
                };

                 // Garantir que os botões de fechar dentro do modal funcionem (se houver com classe específica)
                 detailOverlay.querySelectorAll('.close-modal-btn').forEach(btn => { // Adicione essa classe aos botões X ou Fechar internos
                     btn.onclick = () => detailOverlay.style.display = 'none';
                 });


          } else {
              // Fallback final se nem o overlay existir: alert simples
              const alertMessage = `Detalhes Manutenção #${id}\n` +
                                   `Equipamento: ${maintenanceData.tipoEquipamento || '-'} (${maintenanceData.placaOuId || '-'})\n` +
                                   `Status: ${maintenanceData.status || '-'}\n` +
                                   `Problema: ${maintenanceData.detalhesproblema || '-'}`;
              alert(alertMessage);
          }
      }
  }


  function editMaintenance(id) {
    console.log(`Iniciando edição para manutenção ID: ${id}`);
    // Buscar dados da manutenção na lista local
    const maintenanceData = findMaintenanceById(id);

    if (!maintenanceData) {
      showNotification("Erro: Dados da manutenção não encontrados para edição.", "error");
      console.error(`Manutenção com ID ${id} não encontrada em fullMaintenanceList para edição.`);
      return;
    }

     console.log("Dados encontrados para edição:", maintenanceData);

    // Abrir formulário no modo de edição, passando os dados
    openMaintenanceForm(id, maintenanceData);
  }

  function verifyMaintenance(id) {
      console.log(`Iniciando verificação para manutenção ID: ${id}`);
      // Buscar dados da manutenção na lista local
      const maintenanceData = findMaintenanceById(id);

      if (!maintenanceData) {
          showNotification("Erro: Dados da manutenção não encontrados para verificação.", "error");
          console.error(`Manutenção com ID ${id} não encontrada em fullMaintenanceList para verificação.`);
          return;
      }

      console.log("Dados encontrados para verificação:", maintenanceData);

      // Tentar usar módulo global Verification se existir
      if (typeof Verification !== 'undefined' && Verification.openVerificationForm) {
          console.log("Usando módulo global Verification.openVerificationForm");
          Verification.openVerificationForm(id, maintenanceData);
      } else {
          // Fallback: Usar um formulário/modal de verificação interno ou genérico
          console.warn("Módulo global Verification não encontrado. Usando formulário de verificação de fallback.");

          // Aqui você precisaria ter um HTML para o modal/formulário de verificação de fallback
          // Exemplo: <div id="verification-form-overlay-fallback"> <form id="verification-form-fallback"> ... </form> </div>
          const verificationOverlay = document.getElementById('verification-form-overlay-fallback'); // Usar ID de fallback
          const verificationForm = document.getElementById('verification-form-fallback'); // Usar ID de fallback

          if (verificationOverlay && verificationForm) {
              // Resetar o formulário de verificação
              verificationForm.reset();
              // Limpar validações visuais (reusar funções se possível)
              verificationForm.querySelectorAll('.is-invalid').forEach(el => clearFieldValidation(el)); // Requer clearFieldValidation global ou local
              verificationForm.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
              verificationForm.querySelectorAll('.error-message').forEach(el => el.remove());


              // Preencher campos fixos com dados da manutenção (assumindo que existem no HTML do fallback)
              setInputValue('verification-id-fallback', id); // Usar IDs de fallback
              const equipmentDisplayFallbackV = maintenanceData.placaOuId ? `${maintenanceData.tipoEquipamento || '-'} (${maintenanceData.placaOuId})` : (maintenanceData.tipoEquipamento || '-');
              setInputValue('verification-equipment-fallback', equipmentDisplayFallbackV);
              setInputValue('verification-type-fallback', maintenanceData.tipoManutencao || '-');
              const problemDisplayFallback = document.getElementById('verification-problem-display-fallback');
              if(problemDisplayFallback) problemDisplayFallback.textContent = maintenanceData.detalhesproblema || '-';


              // Mostrar overlay/modal
              verificationOverlay.style.display = 'flex';

              // Configurar listeners de fechar (usando addSafeListener se disponível globalmente ou implementar localmente)
              addSafeListener('close-verification-form-fallback', 'click', () => verificationOverlay.style.display = 'none');
              addSafeListener('cancel-verification-fallback', 'click', () => verificationOverlay.style.display = 'none');

               // Configurar listener para o botão de submissão da verificação (usando ID de fallback)
              addSafeListener('submit-verification-btn-fallback', 'click', function(event) { // Adicione um ID ao botão submit
                  event.preventDefault(); // Prevenir submit padrão se for type="submit"

                  // Coletar dados do formulário de verificação (usando IDs de fallback)
                  const verifierNameInput = document.getElementById('verifier-name-fallback');
                  const resultRadio = verificationForm.querySelector('input[name="verification-result-fallback"]:checked');
                  const commentsInput = document.getElementById('verification-comments-fallback');

                  const verificationData = {
                      maintenanceId: id,
                      // Usar nome do usuário logado se disponível, senão pegar do input
                      verifierName: (typeof UserSession !== 'undefined' && UserSession.getUserName) ? UserSession.getUserName() : (verifierNameInput ? verifierNameInput.value.trim() : ''),
                      result: resultRadio ? resultRadio.value : null, // Ex: 'Aprovado', 'Reprovado', 'Ajustes'
                      comments: commentsInput ? commentsInput.value.trim() : '',
                      verificationDate: new Date().toISOString().split('T')[0] // Data YYYY-MM-DD
                  };

                  // Validar dados da verificação (reusando funções se possível)
                  let isVerificationValid = true;
                   if (!verificationData.verifierName && verifierNameInput && window.getComputedStyle(verifierNameInput).display !== 'none') { // Só valida nome se input estiver visível
                       markFieldAsInvalid(verifierNameInput, 'Nome do verificador é obrigatório.'); // Requer markFieldAsInvalid global ou local
                       isVerificationValid = false;
                   } else if (verifierNameInput) {
                       clearFieldValidation(verifierNameInput); // Requer clearFieldValidation global ou local
                   }

                   if (!verificationData.result) {
                       const radioGroupContainer = verificationForm.querySelector('input[name="verification-result-fallback"]')?.closest('.form-group, .radio-group-container'); // Ajuste o seletor
                       if(radioGroupContainer) markFieldAsInvalid(radioGroupContainer, 'Selecione um resultado.');
                       isVerificationValid = false;
                  } else {
                       const radioGroupContainer = verificationForm.querySelector('input[name="verification-result-fallback"]')?.closest('.form-group, .radio-group-container');
                       if(radioGroupContainer) clearFieldValidation(radioGroupContainer);
                  }

                  // Tornar comentários obrigatórios dependendo do resultado (ex: obrigatório se 'Reprovado' ou 'Ajustes')
                  const isCommentRequired = ['Reprovado', 'Ajustes'].includes(verificationData.result);
                   if (isCommentRequired && !verificationData.comments) {
                       if(commentsInput) markFieldAsInvalid(commentsInput, 'Comentários são obrigatórios para este resultado.');
                       isVerificationValid = false;
                   } else {
                        if(commentsInput) clearFieldValidation(commentsInput);
                   }


                  if (!isVerificationValid) {
                      showNotification("Por favor, preencha os campos obrigatórios da verificação.", "warning"); // Requer showNotification
                      return;
                  }

                  // Submeter verificação via API (ou função de fallback)
                  submitVerification(verificationData); // Reutiliza a função de submissão
              });

          } else {
              alert(`Interface de verificação de fallback não encontrada. Contate o suporte.`);
              console.error("Elementos #verification-form-overlay-fallback ou #verification-form-fallback não encontrados.");
          }
      }
  }


  function submitVerification(data) {
    console.log("Submetendo verificação via API:", data);

    // Mostrar indicador de carregamento
    showLoading(true, "Registrando verificação...");

    // Chamar API para registrar verificação
    if (window.API && typeof API.submitVerification === 'function') {
      API.submitVerification(data)
        .then(response => {
           // Normalizar resposta
           let parsedResponse = response;
            if (typeof response === 'string') {
                try {
                    parsedResponse = JSON.parse(response);
                } catch (e) {
                    console.error("Erro ao parsear resposta da API de verificação:", e);
                    parsedResponse = { success: false, message: response || "Resposta inválida do servidor." };
                }
            } else if (typeof response !== 'object' || response === null) {
               parsedResponse = { success: false, message: "Formato de resposta inesperado do servidor." };
            }

          if (parsedResponse && parsedResponse.success) {
            console.log("Verificação registrada com sucesso:", parsedResponse);
            showNotification("Verificação registrada com sucesso!", "success");

            // Fechar o formulário de verificação (tentar fechar ambos, normal e fallback)
            const verificationOverlay = document.getElementById('verification-form-overlay') || document.getElementById('verification-form-overlay-fallback');
            if (verificationOverlay) {
              verificationOverlay.style.display = 'none';
            }

            // Recarregar a lista de manutenções para refletir a mudança de status
            loadMaintenanceList();
          } else {
            console.error("Erro ao registrar verificação (API retornou erro):", parsedResponse);
            const errorMessage = parsedResponse?.message || parsedResponse?.error || 'Erro desconhecido';
            showNotification(`Erro ao registrar verificação: ${errorMessage}`, "error");
          }
        })
        .catch(error => {
          console.error("Falha na chamada da API ao registrar verificação:", error);
          const errorMessage = error?.message || 'Verifique sua conexão.';
          showNotification(`Falha ao conectar com o servidor para registrar verificação: ${errorMessage}`, "error");
        })
        .finally(() => {
          showLoading(false);
        });
    } else {
      console.error("API.submitVerification não disponível.");
      showNotification("Erro: Função da API para submeter verificação não encontrada.", "error");
      showLoading(false);
      // Fechar o formulário mesmo em caso de erro de API para não travar o usuário
      const verificationOverlay = document.getElementById('verification-form-overlay') || document.getElementById('verification-form-overlay-fallback');
      if (verificationOverlay) {
          verificationOverlay.style.display = 'none';
      }
    }
  }


  function findMaintenanceById(id) {
      if (!id || !Array.isArray(fullMaintenanceList)) return null;
      // Comparar como strings para evitar problemas de tipo (e.g., API retorna string, local é número)
      const stringId = String(id);
      return fullMaintenanceList.find(item => String(item.id) === stringId);
  }

  // --- Funções Utilitárias (Podem vir de Utilities ou ter fallback aqui) ---
  function formatDate(dateString) {
    if (!dateString) return '-';

    // Tentar usar Utilities.formatDate se disponível
    if (typeof Utilities !== 'undefined' && Utilities.formatDate) {
      return Utilities.formatDate(dateString);
    }

    // Implementação de fallback robusta
    try {
        let date;
        // Verificar se a string já contém informações de timezone ou se é apenas data
        if (dateString.includes('T') || dateString.includes('Z')) {
            date = new Date(dateString); // Tentar parsear como ISO 8601 completo
        } else if (dateString.includes('-')) {
             // Assumir YYYY-MM-DD e tratar como UTC para evitar problemas de timezone
             const parts = dateString.split('-');
             if(parts.length === 3 && parts.every(p => !isNaN(parseInt(p)))) {
                date = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
             }
        } else if (dateString.includes('/')) {
            // Assumir DD/MM/YYYY e tratar como UTC
            const parts = dateString.split('/');
             if(parts.length === 3 && parts.every(p => !isNaN(parseInt(p)))) {
                 date = new Date(Date.UTC(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])));
             }
        }

        // Se o parse inicial falhou, tentar um parse mais genérico
        if (!date || isNaN(date.getTime())) {
             date = new Date(dateString);
             // Se ainda assim for inválida, retornar a string original
             if (isNaN(date.getTime())) {
                 console.warn(`Formato de data inválido ou não reconhecido: ${dateString}`);
                 return dateString;
             }
             // Se foi parse genérico, usar métodos não-UTC para formatar
             const day = String(date.getDate()).padStart(2, '0');
             const month = String(date.getMonth() + 1).padStart(2, '0');
             const year = date.getFullYear();
             return `${day}/${month}/${year}`;
        }

        // Formatar a data válida (que foi tratada como UTC) para DD/MM/YYYY
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Meses são 0-indexados
        const year = date.getUTCFullYear();

        return `${day}/${month}/${year}`;
    } catch(e) {
      console.error(`Erro ao formatar data "${dateString}":`, e);
      return dateString; // Retornar string original em caso de erro
    }
  }


  function getStatusClass(status) {
    if (!status) return 'default'; // Cinza/Padrão

    const statusLower = status.toLowerCase();

    // Mapeamento de status para classes CSS (ajuste conforme seu CSS)
    const statusMap = {
        'pendente': 'pending',
        'aguardando verificação': 'pending',
        'aguardando verificacao': 'pending',
        'em análise': 'pending', // Exemplo adicional
        'verificado': 'verified',
        'aprovado': 'verified', // Exemplo adicional
        'concluído': 'completed',
        'concluido': 'completed',
        'finalizado': 'completed', // Exemplo adicional
        'ajustes': 'adjusting',
        'em andamento': 'progress', // Renomeado de adjusting para progress? Ajustar.
        'reprovado': 'rejected',
        'cancelado': 'cancelled', // Exemplo adicional
    };

    // Procurar correspondência EXATA primeiro
    if (statusMap[statusLower]) {
        return statusMap[statusLower];
    }

    // Procurar por correspondência parcial (mais flexível, mas pode dar falso positivo)
    for (const key in statusMap) {
        // Usar includes pode ser perigoso (ex: 'aprovado' inclui 'provado')
        // Melhor fazer split e verificar palavras chave se necessário, ou manter mapeamento exato.
        // Exemplo com includes (cuidado):
        // if (statusLower.includes(key)) {
        //     return statusMap[key];
        // }
    }


    // Se não achou correspondência, retornar uma classe padrão
     console.warn(`Status não mapeado para classe CSS: "${status}". Usando 'default'.`);
    return 'default'; // Classe padrão para status não mapeados
  }


  function showNotification(message, type = 'info') {
    // Usar Utilities se disponível
    if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
      Utilities.showNotification(message, type);
      return;
    }

    // Implementação de fallback (melhorada)
    console.log(`[${type.toUpperCase()}] ${message}`); // Log no console sempre útil

    let container = document.getElementById('notification-container-fallback');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container-fallback';
        // Estilos básicos (ajuste conforme necessário)
        Object.assign(container.style, {
            position: 'fixed',
            top: '20px', // Um pouco mais de espaço do topo
            right: '20px', // Um pouco mais de espaço da direita
            zIndex: '1055', // Acima de muitos elementos, mas talvez abaixo de loaders/modais
            width: '350px', // Um pouco maior
            maxWidth: '90%'
        });
        document.body.appendChild(container);
    }

    // Criar elemento de notificação
    const notification = document.createElement('div');
    // Usar classes genéricas e específicas do tipo para estilização via CSS
    notification.className = `notification-fallback notification-${type}`;
    notification.setAttribute('role', 'alert'); // Melhor acessibilidade

    // Adicionar um botão de fechar
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;'; // 'X' HTML entity
    closeButton.setAttribute('aria-label', 'Fechar');
    // Estilos básicos para o botão de fechar
    Object.assign(closeButton.style, {
        background: 'none',
        border: 'none',
        color: 'inherit', // Herda a cor do texto da notificação
        fontSize: '1.2em',
        position: 'absolute',
        top: '5px',
        right: '10px',
        cursor: 'pointer',
        lineHeight: '1'
    });

    // Span para a mensagem
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;

    notification.appendChild(messageSpan);
    notification.appendChild(closeButton);


    // Estilos básicos via JS (melhor usar CSS com as classes acima)
     Object.assign(notification.style, {
        position: 'relative', // Para posicionar o botão de fechar
        padding: '15px 40px 15px 20px', // Mais padding, espaço para botão fechar
        marginBottom: '10px',
        borderRadius: '4px', // Bootstrap-like
        color: '#fff',
        opacity: '0', // Começa transparente
        transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
        transform: 'translateX(100%)', // Começa fora da tela
        boxShadow: '0 4px 8px rgba(0,0,0,0.15)', // Sombra mais suave
        wordWrap: 'break-word',
        overflow: 'hidden' // Para garantir que conteúdo não vaze antes da animação
     });

     // Cores baseadas no tipo (usando variáveis CSS seria ideal)
     switch (type) {
        case 'error': notification.style.backgroundColor = '#dc3545'; break; // Vermelho Bootstrap
        case 'success': notification.style.backgroundColor = '#28a745'; break; // Verde Bootstrap
        case 'warning': notification.style.backgroundColor = '#ffc107'; notification.style.color = '#212529'; break; // Amarelo Bootstrap (texto escuro)
        default: notification.style.backgroundColor = '#0dcaf0'; break; // Info Bootstrap (Cyan)
     }


    // Adicionar ao início do container (novas notificações aparecem em cima)
    container.insertBefore(notification, container.firstChild);

     // Animar entrada
     requestAnimationFrame(() => { // Garante que o elemento está no DOM antes de animar
         notification.style.opacity = '0.95'; // Um pouco de transparência
         notification.style.transform = 'translateX(0)';
     });


    // Função para remover a notificação
    const removeNotification = () => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(110%)'; // Animar saída
        // Esperar a transição terminar antes de remover o elemento
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
                // Opcional: remover o container se estiver vazio
                if (container.children.length === 0 && container.parentNode) {
                    // container.remove(); // Descomente se quiser remover o container vazio
                }
            }
        }, 300); // Tempo igual à duração da transição
    };

    // Remover após alguns segundos
    const removeTimeout = setTimeout(removeNotification, 6000); // Aumentar tempo visível

    // Fechar ao clicar no botão 'X'
     closeButton.onclick = () => {
         clearTimeout(removeTimeout); // Cancela a remoção automática
         removeNotification();
     };
  }


  function showLoading(show, message = 'Carregando...') {
    // Usar Utilities se disponível
    if (typeof Utilities !== 'undefined' && Utilities.showLoading) {
      Utilities.showLoading(show, message);
      return;
    }

    // Implementação básica de fallback (melhorada)
    const loaderId = 'global-loader-fallback';
    let loader = document.getElementById(loaderId);

    if (show) {
        if (!loader) {
            loader = document.createElement('div');
            loader.id = loaderId;
            // Estilos do overlay
             Object.assign(loader.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(40, 40, 40, 0.7)', // Fundo um pouco mais escuro
                display: 'flex',
                flexDirection: 'column', // Para colocar mensagem abaixo do spinner
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: '1060', // Acima de outros elementos, incluindo notificações
                color: 'white',
                textAlign: 'center',
                transition: 'opacity 0.2s ease-in-out', // Transição mais rápida
                opacity: '0' // Começa invisível para transição
             });


            // Spinner (CSS puro, estilo diferente)
            const spinner = document.createElement('div');
            spinner.className = 'loader-spinner-fallback'; // Use CSS para estilizar
             Object.assign(spinner.style, {
                 border: '4px solid rgba(255, 255, 255, 0.3)', // Cinza claro transparente
                 borderTop: '4px solid #ffffff', // Branco sólido
                 borderRadius: '50%',
                 width: '40px',
                 height: '40px',
                 animation: 'spinFallback 0.8s linear infinite', // Animação mais rápida
                 marginBottom: '15px' // Espaço entre spinner e mensagem
             });


            // Mensagem
            const loaderMessageElement = document.createElement('p');
            loaderMessageElement.id = 'global-loader-message-fallback';
             Object.assign(loaderMessageElement.style, {
                 fontSize: '1em', // Tamanho ligeiramente menor
                 margin: '0',
                 padding: '0 10px', // Evita que texto longo toque as bordas
                 fontFamily: 'sans-serif' // Fonte padrão
             });

            loader.appendChild(spinner);
            loader.appendChild(loaderMessageElement);
            document.body.appendChild(loader);

            // Adicionar keyframes para a animação do spinner se não existir
            if (!document.getElementById('spin-fallback-style')) {
                const style = document.createElement('style');
                style.id = 'spin-fallback-style';
                style.textContent = `
                    @keyframes spinFallback {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    .loader-spinner-fallback { /* Garante que a classe exista */ }
                `;
                document.head.appendChild(style);
            }

             // Forçar reflow para garantir a transição de opacidade
             void loader.offsetWidth;
             loader.style.opacity = '1'; // Torna visível
        }
         // Atualizar a mensagem
        const messageElement = loader.querySelector('#global-loader-message-fallback');
        if (messageElement) messageElement.textContent = message;
        loader.style.display = 'flex'; // Garante que esteja flexível (caso tenha sido escondido antes)
    } else {
        if (loader) {
            loader.style.opacity = '0'; // Inicia transição para esconder
            // Remover após a transição
             setTimeout(() => {
                 // Verificar se ainda existe antes de tentar remover
                 const currentLoader = document.getElementById(loaderId);
                 if (currentLoader && currentLoader.parentNode) {
                     currentLoader.remove();
                 }
             }, 200); // Tempo da transição de opacidade (0.2s)
        }
    }
  }

   // --- Filtros Inteligentes (Funções da atualização 3) ---
   // =======================================================================================
   // == INÍCIO DA ATUALIZAÇÃO 3: createMaintenanceFilters, setupMaintenanceFilterListeners, addMaintenanceFilterStyles ==
   // =======================================================================================
   function createMaintenanceFilters() {
        const filterContainer = document.getElementById('maintenance-filter-buttons');
        if (!filterContainer) {
             console.warn("Container #maintenance-filter-buttons não encontrado. Filtros não serão criados.");
             return;
        }

        // Define os ícones como texto simples para evitar o erro com searchIcon
        const filterHTML = `
            <div class="smart-filter-container">
            <div class="filter-group">
                <label for="maintenance-status-filter" class="filter-label">Status:</label>
                <select id="maintenance-status-filter" class="filter-dropdown">
                <option value="all">Todos os Status</option>
                <option value="Pendente">Pendentes</option>
                <option value="Aguardando Verificação">Aguardando Verificação</option>
                <option value="Verificado">Verificados</option>
                <option value="Aprovado">Aprovados</option>
                <option value="Concluído">Concluídos</option>
                <option value="Ajustes">Ajustes</option>
                <option value="Reprovado">Reprovados</option>
                <option value="Cancelado">Cancelados</option>
                </select>
            </div>

            <div class="filter-group">
                <label for="maintenance-type-filter" class="filter-label">Tipo:</label>
                <select id="maintenance-type-filter" class="filter-dropdown">
                <option value="all">Todos os Tipos</option>
                <option value="Preventiva">Preventiva</option>
                <option value="Corretiva">Corretiva</option>
                <option value="Emergencial">Emergencial</option>
                <option value="Melhoria">Melhoria</option>
                </select>
            </div>

            <div class="date-filter-group">
                <label for="maintenance-date-from" class="filter-label">Período:</label>
                <input type="date" id="maintenance-date-from" class="filter-dropdown" title="Data de início">
                <span class="filter-label date-separator">até</span>
                <input type="date" id="maintenance-date-to" class="filter-dropdown" title="Data de fim">
            </div>

            <div class="filter-actions">
                <button id="apply-maintenance-filter" class="smart-filter-toggle">
                Filtrar
                </button>
                <button id="reset-maintenance-filter" class="smart-filter-toggle reset-button">
                Limpar
                </button>
            </div>
            </div>
        `;

        filterContainer.innerHTML = filterHTML;

        // Configurar event listeners para os botões
        setupMaintenanceFilterListeners();

        // Adicionar estilos CSS inline se necessário
        addMaintenanceFilterStyles();
    }


    function setupMaintenanceFilterListeners() {
        const applyBtn = document.getElementById('apply-maintenance-filter');
        const resetBtn = document.getElementById('reset-maintenance-filter');

        if (applyBtn) {
            applyBtn.addEventListener('click', function() {
                // Coleta os valores atuais dos filtros
                const statusFilter = document.getElementById('maintenance-status-filter').value;
                const typeFilter = document.getElementById('maintenance-type-filter').value;
                const dateFrom = document.getElementById('maintenance-date-from').value;
                const dateTo = document.getElementById('maintenance-date-to').value;

                // Chama a função para carregar a lista com os filtros selecionados
                loadMaintenanceListWithFilters(statusFilter, typeFilter, dateFrom, dateTo);

                // Feedback visual (sem usar searchIcon)
                const originalText = applyBtn.textContent;
                applyBtn.textContent = "✓ Aplicado";
                applyBtn.disabled = true;
                setTimeout(() => {
                    applyBtn.textContent = originalText;
                    applyBtn.disabled = false;
                }, 2000);
            });
        } else {
            console.warn("Botão #apply-maintenance-filter não encontrado para adicionar listener.");
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', function() {
                // Resetar valores dos campos de filtro
                document.getElementById('maintenance-status-filter').value = 'all';
                document.getElementById('maintenance-type-filter').value = 'all';
                document.getElementById('maintenance-date-from').value = '';
                document.getElementById('maintenance-date-to').value = '';

                // Recarregar lista sem filtros
                loadMaintenanceListWithoutFilters();

                // Feedback visual (sem usar resetIcon)
                const originalText = resetBtn.textContent;
                resetBtn.textContent = "✓ Limpo";
                resetBtn.disabled = true;
                setTimeout(() => {
                    resetBtn.textContent = originalText;
                    resetBtn.disabled = false;
                }, 1500);
            });
        } else {
            console.warn("Botão #reset-maintenance-filter não encontrado para adicionar listener.");
        }

         // Opcional: Adicionar listener para 'Enter' nos campos de data para aplicar filtro
         ['maintenance-date-from', 'maintenance-date-to'].forEach(id => {
            const input = document.getElementById(id);
            if(input) {
                input.addEventListener('keypress', function(event) {
                    if (event.key === 'Enter') {
                        event.preventDefault(); // Evita submit de formulário se houver
                        applyBtn?.click(); // Simula clique no botão de aplicar
                    }
                });
            }
        });
    }

    // Adiciona estilos CSS para os filtros
    function addMaintenanceFilterStyles() {
        if (!document.getElementById('maintenance-filter-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'maintenance-filter-styles';
            styleEl.textContent = `
            .smart-filter-container {
                display: flex;
                flex-wrap: wrap;
                gap: 15px;
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
            }
            .filter-group, .date-filter-group {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .filter-label { /* Estilo adicionado para labels */
                font-weight: 500; /* Um pouco mais de destaque */
                font-size: 0.9em;
                color: #495057;
            }
            .filter-dropdown {
                padding: 6px 12px;
                border: 1px solid #ced4da;
                border-radius: 4px;
                background-color: #fff; /* Fundo branco */
            }
            .date-separator { /* Estilo para o 'até' */
                margin: 0 5px;
            }
            .filter-actions {
                display: flex;
                gap: 10px;
                margin-left: auto; /* Empurra botões para a direita em telas maiores */
            }
            .smart-filter-toggle {
                padding: 6px 12px;
                background: #0052cc; /* Azul primário */
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                transition: background-color 0.2s ease; /* Transição suave */
            }
            .smart-filter-toggle:hover:not(:disabled) { /* Efeito hover */
                background: #0041a3;
            }
            .smart-filter-toggle:disabled { /* Estilo desabilitado */
                background: #a0c7e8;
                cursor: not-allowed;
            }
            .reset-button {
                background: #6c757d; /* Cinza Bootstrap */
            }
            .reset-button:hover:not(:disabled) {
                background: #5a6268;
            }
            .reset-button:disabled {
                background: #adb5bd;
            }
            @media (max-width: 992px) { /* Ajuste breakpoint se necessário */
                 .filter-actions {
                    margin-left: 0; /* Remove margem automática em telas menores */
                    width: 100%; /* Ocupa largura total */
                    justify-content: flex-start; /* Alinha botões à esquerda */
                 }
            }
            @media (max-width: 768px) {
                .smart-filter-container {
                    flex-direction: column;
                    align-items: stretch;
                }
                .filter-group, .date-filter-group {
                    flex-direction: column;
                    align-items: stretch;
                }
                .filter-dropdown, .date-filter-group input[type="date"] {
                    width: 100%; /* Ocupar largura total em telas pequenas */
                }
                .date-filter-group {
                     gap: 5px; /* Reduz gap vertical entre data e 'até' */
                 }
                 .date-separator {
                     text-align: center; /* Centraliza o 'até' */
                     margin: 5px 0;
                 }
                .filter-actions {
                     flex-direction: column; /* Empilha os botões */
                     gap: 8px;
                 }
                .smart-filter-toggle {
                     width: 100%; /* Botões ocupam largura total */
                 }
            }
            `;
            document.head.appendChild(styleEl);
        }
    }
   // =======================================================================================
   // == FIM DA ATUALIZAÇÃO 3 ==
   // =======================================================================================


  // API pública do módulo
  return {
    initialize,
    openMaintenanceForm,
    loadMaintenanceList, // Função principal para carregar/recarregar
    // Expor outras funções se necessário para depuração ou interação externa
    // Ex: Se outro módulo precisar disparar a edição ou visualização
     viewMaintenanceDetails,
     editMaintenance,
     verifyMaintenance,
     // Funções de filtro podem ser úteis externamente?
     // createMaintenanceFilters, // Exposto implicitamente via initialize
     loadMaintenanceListWithFilters // Expor explicitamente se necessário
  };
})();

// --- Inicialização ---
// Garante que o DOM esteja pronto antes de inicializar
function initializeMaintenanceModule() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log("DOM carregado. Inicializando Maintenance...");
            // Garantir que dependências (API, Utilities) estejam prontas se forem assíncronas
            // Se forem síncronas (scripts carregados antes), pode inicializar direto.
            // Exemplo de verificação simples (assumindo que são globais):
            if (window.API && window.Utilities) {
                 Maintenance.initialize();
            } else {
                 console.error("Falha na inicialização: Dependências API ou Utilities não encontradas no DOMContentLoaded.");
                 // Tentar novamente após um pequeno delay? Ou mostrar erro ao usuário.
                 setTimeout(() => {
                     if (window.API && window.Utilities) {
                          console.log("Tentando inicializar Maintenance após delay...");
                          Maintenance.initialize();
                     } else {
                          console.error("Dependências ainda não disponíveis após delay.");
                          alert("Erro ao carregar componentes da página. Por favor, recarregue.");
                     }
                 }, 500);
            }
        });
    } else {
        // DOM já está pronto
        console.log("DOM já pronto. Inicializando Maintenance...");
        if (window.API && window.Utilities) {
            Maintenance.initialize();
        } else {
             console.error("Falha na inicialização: Dependências API ou Utilities não encontradas (DOM já pronto).");
             alert("Erro ao carregar componentes da página. Por favor, recarregue.");
        }
    }
}

initializeMaintenanceModule(); // Chama a inicialização
