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
    'Aspirador': [], // Array vazio, usuário insere ID manualmente
    'Poliguindaste': [], // Array vazio, usuário insere ID manualmente
    'Outro': [] // Array vazio, usuário insere o tipo manualmente
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

    // Carregar dados iniciais para os dropdowns
    loadInitialData();

    // Configurar listeners básicos
    setupBasicListeners();

    // Carregar lista de manutenções
    loadMaintenanceList();
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
      option.value = type.toLowerCase().replace(/ /g, '-').replace(/\//g, '-'); // Usar valor normalizado se necessário ou o próprio nome
      option.textContent = type;
      select.appendChild(option);
    });

     // Adiciona 'Aspirador', 'Poliguindaste', 'Outro' explicitamente se não estiverem nas chaves
    ['aspirador', 'poliguindaste', 'outro'].forEach(typeKey => {
        const typeName = typeKey.charAt(0).toUpperCase() + typeKey.slice(1); // Capitaliza
        if (!Object.keys(EQUIPMENT_IDS).map(k => k.toLowerCase()).includes(typeKey)) {
             const option = document.createElement('option');
             option.value = typeKey;
             option.textContent = typeName;
             select.appendChild(option);
        } else {
            // Garante que o value seja o slug minúsculo
            const existingOption = select.querySelector(`option[value="${typeName}"]`);
             if (existingOption) {
                existingOption.value = typeKey;
             }
        }
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
    setupDynamicFieldListeners();

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
              const isVisible = window.getComputedStyle(element).display !== 'none' ||
                               (element.closest('.form-col, .form-group, #other-equipment-field') && window.getComputedStyle(element.closest('.form-col, .form-group, #other-equipment-field')).display !== 'none');

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

  function setupDynamicFieldListeners() {

     // *** CÓDIGO SUBSTITUÍDO/ADICIONADO CONFORME Atualizações.txt (Item 4.2) ***
     const equipmentTypeSelect = document.getElementById('equipment-type');
     if (equipmentTypeSelect) {
        equipmentTypeSelect.addEventListener('change', function() {
            const selectedType = this.value;
            console.log(`Tipo de equipamento alterado para: ${selectedType}`); // Log
            const equipmentIdElement = document.getElementById('equipment-id');
            const otherEquipmentField = document.getElementById('other-equipment-field'); // Container do campo texto
            const otherEquipmentInput = document.getElementById('other-equipment'); // O input em si

            // Garantir que os elementos existem antes de manipulá-los
            if (!equipmentIdElement || !otherEquipmentField || !otherEquipmentInput) {
                console.error("Elementos de seleção de equipamento não encontrados!", {
                    equipmentIdElement: !!equipmentIdElement,
                    otherEquipmentField: !!otherEquipmentField,
                    otherEquipmentInput: !!otherEquipmentInput
                });
                return;
            }

             // Obter os containers (.form-col ou .form-group) para controlar visibilidade
            const equipmentIdContainer = equipmentIdElement.closest('.form-col, .form-group');

            // Limpar a seleção atual e valor do campo texto
            equipmentIdElement.innerHTML = '<option value="">Selecione o equipamento...</option>';
            otherEquipmentInput.value = '';


            if (selectedType === 'aspirador' || selectedType === 'poliguindaste') {
                // Permitir entrada de texto direta para esses tipos
                console.log("Tipo 'aspirador' ou 'poliguindaste' selecionado. Mostrando campo de texto.");
                if(equipmentIdContainer) equipmentIdContainer.style.display = 'none';
                otherEquipmentField.style.display = 'block'; // Mostrar o container do campo texto
                otherEquipmentInput.setAttribute('required', 'required'); // Marcar como obrigatório
                equipmentIdElement.removeAttribute('required'); // Remover obrigatório do select
            } else if (selectedType === 'outro') {
                // Mostrar campo para outro equipamento
                console.log("Tipo 'outro' selecionado. Mostrando campo de texto.");
                if(equipmentIdContainer) equipmentIdContainer.style.display = 'none';
                otherEquipmentField.style.display = 'block'; // Mostrar o container do campo texto
                otherEquipmentInput.setAttribute('required', 'required'); // Marcar como obrigatório
                equipmentIdElement.removeAttribute('required'); // Remover obrigatório do select
            } else if (selectedType) {
                // Carregar equipamentos do tipo selecionado via API
                console.log(`Tipo '${selectedType}' selecionado. Carregando equipamentos via API.`);
                if(equipmentIdContainer) equipmentIdContainer.style.display = 'block'; // Mostrar o select
                otherEquipmentField.style.display = 'none'; // Esconder o campo texto
                otherEquipmentInput.removeAttribute('required'); // Remover obrigatório do texto
                equipmentIdElement.setAttribute('required', 'required'); // Marcar select como obrigatório

                // Verificar se a função API.getEquipmentsByType existe
                if (window.API && typeof API.getEquipmentsByType === 'function') {
                    API.getEquipmentsByType(selectedType)
                    .then(response => {
                        if (response.success && Array.isArray(response.equipment)) {
                           console.log("Equipamentos carregados:", response.equipment);
                           // Limpar novamente antes de adicionar, garantindo
                           equipmentIdElement.innerHTML = '<option value="">Selecione o equipamento...</option>';
                           if (response.equipment.length === 0) {
                                const option = document.createElement('option');
                                option.value = "";
                                option.textContent = "Nenhum equipamento encontrado";
                                option.disabled = true;
                                equipmentIdElement.appendChild(option);
                           } else {
                               response.equipment.forEach(item => {
                                    const option = document.createElement('option');
                                    // Assumindo que 'item' tem 'id' e 'name' ou similar
                                    option.value = item.id || item.placaOuId || item.name; // Usar um identificador único
                                    option.textContent = `${item.name || item.id || 'Equipamento sem nome'} (${item.id || item.placaOuId || 'ID N/A'})`;
                                    equipmentIdElement.appendChild(option);
                                });
                           }
                        } else {
                             console.error('API retornou sucesso=false ou formato inválido:', response);
                             equipmentIdElement.innerHTML = '<option value="" disabled>Erro ao carregar</option>';
                        }
                    })
                    .catch(error => {
                        console.error('Erro ao chamar API.getEquipmentsByType:', error);
                        equipmentIdElement.innerHTML = '<option value="" disabled>Erro na requisição</option>';
                    });
                } else {
                    console.error('Função API.getEquipmentsByType não encontrada!');
                    equipmentIdElement.innerHTML = '<option value="" disabled>Erro interno (API)</option>';
                     // Tentar carregar da lista estática como fallback? Ou deixar erro?
                     // Fallback para lista estática (se fizer sentido):
                     // populateEquipmentIds(selectedType); // Chama a função original se existir
                }
            } else {
                // Reset se nada selecionado ("Selecione o tipo...")
                console.log("Nenhum tipo selecionado. Resetando campos.");
                if(equipmentIdContainer) equipmentIdContainer.style.display = 'block'; // Mostrar select por padrão
                otherEquipmentField.style.display = 'none'; // Esconder campo texto
                otherEquipmentInput.removeAttribute('required');
                equipmentIdElement.removeAttribute('required'); // Não é obrigatório selecionar um ID se o tipo não foi selecionado
                 equipmentIdElement.disabled = true; // Desabilitar até que um tipo seja escolhido
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
      if (otherCategoryField) {
        otherCategoryField.style.display = selectedCategory === 'Outros' ? 'block' : 'none'; // Ajustado para 'Outros' que está na lista DEFAULT_PROBLEM_CATEGORIES
         const otherCategoryInput = document.getElementById('other-category');
         if(otherCategoryInput) {
             if(selectedCategory === 'Outros') {
                 otherCategoryInput.setAttribute('required', 'required');
             } else {
                 otherCategoryInput.removeAttribute('required');
                 otherCategoryInput.value = ''; // Limpa o valor se não for mais necessário
             }
         }
      }
    });
  }


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

  // Função handleEquipmentTypeChange original (mantida caso seja necessária como fallback ou referência)
  // Note que o listener adicionado em setupDynamicFieldListeners agora contém a lógica diretamente.
  /*
  function handleEquipmentTypeChange(selectedType) {
    console.log(`Manipulando mudança de tipo de equipamento para: ${selectedType}`);

    // Elementos que podem ser mostrados/escondidos
    const equipmentIdField = document.getElementById('equipment-id').closest('.form-col');
    const otherEquipmentField = document.getElementById('other-equipment-field');
    const customIdField = document.getElementById('custom-equipment-field');

    // Se qualquer um dos elementos não for encontrado, registre e retorne
    if (!equipmentIdField || !otherEquipmentField) {
      console.error("Elementos necessários para manipular tipo de equipamento não encontrados!");
      console.log("Elementos encontrados:", {
        equipmentIdField: !!equipmentIdField,
        otherEquipmentField: !!otherEquipmentField,
        customIdField: !!customIdField
      });
      return;
    }

    // Esconder todos os campos especiais primeiro
    equipmentIdField.style.display = 'none';
    otherEquipmentField.style.display = 'none';
    if (customIdField) customIdField.style.display = 'none';

    // Desabilitar select de equipments para evitar dados inválidos
    document.getElementById('equipment-id').disabled = true;

    // Mostrar campo apropriado baseado na seleção
    if (selectedType === 'Outro') {
      console.log("Mostrando campo para 'Outro' equipamento");
      otherEquipmentField.style.display = 'block';
    } else if (selectedType === 'Aspirador' || selectedType === 'Poliguindaste') {
      if (customIdField) {
        console.log(`Mostrando campo personalizado para ${selectedType}`);

        // Atualizar o label para refletir o tipo selecionado
        const label = customIdField.querySelector('label');
        if (label) label.textContent = `Identificação ${selectedType}:`;

        customIdField.style.display = 'block';
      } else {
        // Se não tiver o campo específico, mostrar o campo normal
        equipmentIdField.style.display = 'block';
      }
    } else if (selectedType) {
      console.log(`Mostrando dropdown de IDs para ${selectedType}`);
      equipmentIdField.style.display = 'block';

      // Carregar IDs específicos para o tipo selecionado
      populateEquipmentIds(selectedType); // Usa a lista estática local
    }
  }
  */

  // Função populateEquipmentIds original (mantida para referência, API é usada agora)
  /*
  function populateEquipmentIds(selectedType) {
    console.log(`Populando IDs para tipo: ${selectedType}`);

    const select = document.getElementById('equipment-id');
    if (!select) {
      console.error("Elemento select #equipment-id não encontrado!");
      return;
    }

    // Limpar opções existentes
    select.innerHTML = '<option value="">Selecione o equipamento...</option>';

    // Normalizar chave para busca em EQUIPMENT_IDS (ex: 'Alta Pressão')
    const keyForStaticList = Object.keys(EQUIPMENT_IDS).find(k => k.toLowerCase().replace(/ /g, '-').replace(/\//g, '-') === selectedType);


    // Se não há tipo selecionado ou é "Outro", parar aqui
    if (!selectedType || !keyForStaticList || !EQUIPMENT_IDS[keyForStaticList]) {
      select.disabled = true;
      console.warn(`Nenhum tipo válido selecionado ou tipo ${selectedType} (chave: ${keyForStaticList}) não encontrado em EQUIPMENT_IDS`);
      return;
    }

    // Obter IDs para o tipo selecionado
    const ids = EQUIPMENT_IDS[keyForStaticList] || [];

    if (ids.length > 0) {
      // Adicionar opções ao select
      ids.forEach(id => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = id;
        select.appendChild(option);
      });

      select.disabled = false;
      console.log(`${ids.length} IDs carregados para tipo ${selectedType} da lista estática`);
    } else {
      console.warn(`Nenhum ID disponível para tipo: ${selectedType} na lista estática`);
      select.disabled = true;
    }
  }
  */


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

    // Etapa 1
    if (!setSelectValue('equipment-type', data.tipoEquipamento?.toLowerCase().replace(/ /g, '-').replace(/\//g, '-'))) {
         // Fallback se o valor normalizado não funcionar, tentar o valor original
         setSelectValue('equipment-type', data.tipoEquipamento);
    }


    // A seleção do tipo dispara o evento 'change' (devido ao setSelectValue)
    // que por sua vez mostra/esconde os campos corretos e carrega opções se necessário.
    // Precisamos esperar um pouco para que essas operações assíncronas (API) ou síncronas (mostrar/esconder) terminem
    // antes de definir o valor do ID/Outro.
    setTimeout(() => {
      const selectedType = document.getElementById('equipment-type').value; // Pega o valor atual após o setSelectValue
      console.log("Após timeout, tipo selecionado:", selectedType);

      if (selectedType === 'aspirador' || selectedType === 'poliguindaste' || selectedType === 'outro') {
        console.log("Populando other-equipment com:", data.placaOuId || data.equipamentoOutro);
        setInputValue('other-equipment', data.placaOuId || data.equipamentoOutro); // Usar placaOuId ou o campo específico se existir
      } else if (selectedType) {
         // Esperar um pouco mais se for carregamento de API
         setTimeout(() => {
            console.log("Populando equipment-id com:", data.placaOuId);
            setSelectValue('equipment-id', data.placaOuId);
         }, 150); // Delay adicional para garantir que as opções da API tenham sido adicionadas
      }

      // Preencher o restante dos campos da etapa 1
      setInputValue('technician-name', data.responsavel);
      setInputValue('maintenance-date', formatDateForInput(data.dataRegistro));
      setSelectValue('area', data.area);
      setInputValue('office', data.localOficina); // Assumindo que é 'localOficina' no objeto data
      setSelectValue('maintenance-type-select', data.tipoManutencao); // Ajustar ID se necessário ('maintenance-type' ou 'maintenance-type-select')
      setCheckboxValue('is-critical', data.eCritico); // Assumindo que é 'eCritico' no objeto data

      // Etapa 2 (pré-popular para quando o usuário navegar)
      setSelectValue('problem-category-select', data.categoriaProblema);
      // Disparar change para mostrar/esconder 'other-category'
      const categorySelect = document.getElementById('problem-category-select');
      if(categorySelect) categorySelect.dispatchEvent(new Event('change'));

      setTimeout(() => { // Delay para garantir que other-category esteja visível se necessário
          if (data.categoriaProblema === 'Outros') { // Usar 'Outros' conforme DEFAULT_PROBLEM_CATEGORIES
              setInputValue('other-category', data.categoriaProblemaOutro); // Campo para categoria 'outro'
          }
          setInputValue('problem-description', data.detalhesproblema); // Assumindo que é 'detalhesproblema'
          setInputValue('additional-notes', data.observacoes); // Assumindo que é 'observacoes'
      }, 50);


      console.log("Formulário populado para edição.");

    }, 100); // Pequeno delay para permitir que o DOM atualize após 'change' em equipment-type
  }


  function setSelectValue(id, value) {
    const element = document.getElementById(id);
    if (element && value !== undefined && value !== null) {
      const valueStr = String(value); // Comparar como strings
      // Tentar encontrar a opção pelo valor
      let found = false;
      for (let i = 0; i < element.options.length; i++) {
          if (String(element.options[i].value) === valueStr) {
              element.selectedIndex = i;
              found = true;
              break;
          }
      }

      // Se não encontrou pelo valor, tentar pelo texto (como fallback)
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
          console.log(`Valor "${value}" definido para #${id}`);
          // Disparar evento de change para atualizar campos dependentes
          // Fazendo isso de forma segura para não causar loops infinitos se houver listeners complexos
          setTimeout(() => {
              const event = new Event('change', { bubbles: true });
              element.dispatchEvent(event);
          }, 0);
          return true;
      } else {
          console.warn(`Valor "${value}" não encontrado nas opções de #${id}. Opções disponíveis:`, Array.from(element.options).map(opt => opt.value));
          // Opcional: Selecionar a opção padrão (vazia) se não encontrar
          // element.selectedIndex = 0;
          return false;
      }
    } else {
       // console.warn(`Elemento #${id} não encontrado ou valor inválido: ${value}`);
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
              // Formato DD/MM/YYYY -> YYYY-MM-DD
              date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
          }
      } else {
           // Tentar como ISO (YYYY-MM-DD ou completo)
           date = new Date(dateString);
      }


      if (!date || isNaN(date.getTime())) {
           console.warn("Data inválida para formatar para input:", dateString);
           return ''; // Retorna vazio se a data for inválida
      }

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

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
    if(equipmentTypeSelect) equipmentTypeSelect.selectedIndex = 0; // Volta para "Selecione o tipo"

    const equipmentIdSelect = document.getElementById('equipment-id');
    const equipmentIdContainer = equipmentIdSelect?.closest('.form-col, .form-group');
    if (equipmentIdSelect) {
        equipmentIdSelect.innerHTML = '<option value="">Selecione o equipamento...</option>';
        equipmentIdSelect.disabled = true; // Desabilitado por padrão
         equipmentIdSelect.removeAttribute('required');
    }
     if(equipmentIdContainer) equipmentIdContainer.style.display = 'block'; // Visível por padrão

    const otherEquipmentField = document.getElementById('other-equipment-field');
    const otherEquipmentInput = document.getElementById('other-equipment');
    if (otherEquipmentField) otherEquipmentField.style.display = 'none';
    if (otherEquipmentInput) {
        otherEquipmentInput.value = '';
        otherEquipmentInput.removeAttribute('required');
    }


    const problemCategorySelect = document.getElementById('problem-category-select');
    if(problemCategorySelect) problemCategorySelect.selectedIndex = 0;

    const otherCategoryField = document.getElementById('other-category-field');
    const otherCategoryInput = document.getElementById('other-category');
     if (otherCategoryField) otherCategoryField.style.display = 'none';
     if(otherCategoryInput) {
         otherCategoryInput.value = '';
         otherCategoryInput.removeAttribute('required');
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

      const equipmentType = document.getElementById('equipment-type').value;
      const equipmentIdElement = document.getElementById('equipment-id');
      const otherEquipmentElement = document.getElementById('other-equipment');

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
          const isVisible = container ? window.getComputedStyle(container).display !== 'none' : window.getComputedStyle(element).display !== 'none';

          // Só valida se estiver visível
          if(isVisible) {
              // Lógica de validação específica
              if (element.tagName === 'SELECT') {
                  fieldValid = fieldValue !== '' && fieldValue !== null;
              } else if (element.type === 'checkbox') {
                   // Checkboxes geralmente não são validados por 'required', mas podem ser se necessário
                   fieldValid = true; // Assumir válido a menos que haja regra específica
              } else { // Inputs de texto, data, etc.
                  fieldValid = fieldValue && fieldValue.trim() !== '';
              }

              if (!fieldValid) {
                  isValid = false;
                  markFieldAsInvalid(element, `${field.name} é obrigatório`);
                  if (!firstInvalidField) {
                      firstInvalidField = element;
                  }
              } else {
                  clearFieldValidation(element);
              }
          } else {
               // Se não está visível, limpar qualquer validação anterior e considerar válido para o propósito da submissão atual
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

    // Procurar o container pai (form-group ou form-col)
    const formGroup = element.closest('.form-group, .form-col');
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
        // Inserir após o elemento inválido ou no final do form-group
        element.parentNode.insertBefore(errorElement, element.nextSibling);
      }

      errorElement.textContent = message;
      errorElement.style.display = 'block'; // Garantir que esteja visível
    } else {
       console.warn("Não foi possível encontrar .form-group ou .form-col para exibir mensagem de erro para:", element);
    }
  }


  function clearFieldValidation(element) {
    // Remover classe de erro do elemento
    element.classList.remove('is-invalid');

    // Procurar o container pai (form-group ou form-col)
    const formGroup = element.closest('.form-group, .form-col');
    if (formGroup) {
      formGroup.classList.remove('has-error');

      // Remover mensagem de erro se existir
      const errorElement = formGroup.querySelector('.error-message');
      if (errorElement) {
        errorElement.remove(); // Remove o elemento de erro
      }
    }
  }

  function saveStep1Data() {
    console.log("Salvando dados da etapa 1...");

    // Capturar valores dos campos
    const equipType = document.getElementById('equipment-type').value;
    formData.tipoEquipamento = document.getElementById('equipment-type').selectedOptions[0]?.textContent || equipType; // Salva o texto da opção

    // Capturar ID baseado no tipo de equipamento e visibilidade dos campos
    if (equipType === 'aspirador' || equipType === 'poliguindaste' || equipType === 'outro') {
        const otherInput = document.getElementById('other-equipment');
        if(otherInput && otherInput.closest('#other-equipment-field')?.style.display !== 'none') {
           formData.placaOuId = otherInput.value;
           if(equipType === 'outro') {
              formData.equipamentoOutro = otherInput.value; // Campo específico para 'outro'
              formData.tipoEquipamento = otherInput.value; // Sobrescreve tipoEquipamento com a descrição
           }
        } else {
            formData.placaOuId = ''; // Campo não visível/aplicável
        }
    } else if (equipType) {
        const idSelect = document.getElementById('equipment-id');
         if(idSelect && idSelect.closest('.form-col, .form-group')?.style.display !== 'none') {
            formData.placaOuId = idSelect.value;
         } else {
            formData.placaOuId = ''; // Campo não visível/aplicável
         }
    } else {
        formData.placaOuId = ''; // Nenhum tipo selecionado
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
      formData.categoriaProblemaOutro = document.getElementById('other-category').value;
       // Opcional: usar a descrição como a categoria principal
       // formData.categoriaProblema = formData.categoriaProblemaOutro;
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
    if (formData.tipoEquipamento) {
        if (formData.tipoEquipamento === 'outro' && formData.equipamentoOutro) {
             equipmentSummary = formData.equipamentoOutro; // Mostra a descrição do outro
        } else if (formData.placaOuId) {
             equipmentSummary = `${formData.tipoEquipamento} (${formData.placaOuId})`;
        } else {
             equipmentSummary = formData.tipoEquipamento; // Caso não tenha ID (ex: tipos genéricos sem seleção de ID)
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
      'summary-date': formatDate(formData.dataRegistro) || '-',
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
        element.textContent = value;
      } else {
        console.warn(`Elemento de resumo #${elementId} não encontrado!`);
      }
    });

    console.log("Resumo atualizado com sucesso");
  }


  function submitMaintenance() {
    console.log(`${isEditMode ? 'Atualizando' : 'Criando nova'} manutenção... Dados:`, formData);

    // Mostrar indicador de carregamento
    showLoading(true, `${isEditMode ? 'Atualizando' : 'Registrando'} manutenção...`);

    // Preparar dados para envio (mapeamento final para a API)
    // Adaptar os nomes das chaves conforme esperado pela API
    const dataToSend = {
      tipoEquipamento: formData.tipoEquipamento,
      placaOuId: formData.placaOuId,
      equipamentoOutro: formData.equipamentoOutro, // Enviar se for 'outro'
      responsavel: formData.responsavel,
      dataRegistro: formData.dataRegistro, // Enviar no formato YYYY-MM-DD
      area: formData.area,
      localOficina: formData.localOficina,
      tipoManutencao: formData.tipoManutencao,
      eCritico: formData.eCritico,
      categoriaProblema: formData.categoriaProblema,
      categoriaProblemaOutro: formData.categoriaProblemaOutro, // Enviar se for 'Outros'
      detalhesproblema: formData.detalhesproblema, // Verificar nome do campo esperado pela API
      observacoes: formData.observacoes // Verificar nome do campo esperado pela API
      // Adicionar status inicial se for criação? Ex: status: 'Pendente'
    };

     if (!isEditMode) {
        dataToSend.status = 'Pendente'; // Define status inicial para novos registros
     }

    // Se estiver editando, incluir ID
    if (isEditMode && editingMaintenanceId) {
      dataToSend.id = editingMaintenanceId;
    } else if (isEditMode && !editingMaintenanceId) {
        console.error("Tentando editar sem um ID de manutenção!");
        showNotification("Erro: ID da manutenção não encontrado para edição.", "error");
        showLoading(false);
        return;
    }

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
                 parsedResponse = { success: false, message: "Resposta inválida do servidor." };
             }
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
          loadMaintenanceList();
        } else {
          console.error("Erro ao salvar manutenção (API retornou erro):", parsedResponse);
          showNotification(`Erro ao ${isEditMode ? 'atualizar' : 'registrar'} manutenção: ${parsedResponse?.message || 'Erro desconhecido do servidor.'}`, "error");
        }
      })
      .catch(error => {
        console.error("Falha na chamada da API ao salvar manutenção:", error);
        showNotification(`Falha ao conectar com o servidor: ${error.message || 'Verifique sua conexão.'}`, "error");
      })
      .finally(() => {
        // Esconder indicador de carregamento
        showLoading(false);
      });
  }

  // --- Funções de Dados ---
  function loadMaintenanceList() {
    console.log("Carregando lista de manutenções...");

    // Mostrar indicador de carregamento
    showLoading(true, "Carregando manutenções...");

    // Indicador de carregamento na tabela
    const tableBody = document.getElementById('maintenance-tbody');
    if (tableBody) {
      tableBody.innerHTML = '<tr><td colspan="10" class="text-center">Carregando...</td></tr>';
    }

    // Chamar API para obter dados
    if (window.API && typeof API.getMaintenanceList === 'function') {
      API.getMaintenanceList()
        .then(response => {
          // Normalizar resposta
          let parsedResponse = response;
           if (typeof response === 'string') {
             try {
                 parsedResponse = JSON.parse(response);
             } catch (e) {
                 console.error("Erro ao parsear lista da API:", e);
                 parsedResponse = { success: false, message: "Resposta inválida do servidor." };
             }
         }

          if (parsedResponse && parsedResponse.success && Array.isArray(parsedResponse.maintenances)) {
            fullMaintenanceList = parsedResponse.maintenances;
            console.log(`Lista de manutenções recebida (${fullMaintenanceList.length} itens).`);
            renderMaintenanceTable(fullMaintenanceList); // Chama a função atualizada
          } else {
            console.error("Erro ao carregar manutenções:", parsedResponse);
            if (tableBody) {
              tableBody.innerHTML = `<tr><td colspan="10" class="text-center error-message">Erro ao carregar dados: ${parsedResponse?.message || 'Formato inválido.'}</td></tr>`;
            }
            fullMaintenanceList = []; // Limpar a lista em caso de erro
          }
        })
        .catch(error => {
          console.error("Falha ao buscar manutenções (catch):", error);
          if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="10" class="text-center error-message">Falha ao conectar com o servidor. Tente novamente mais tarde.</td></tr>';
          }
          fullMaintenanceList = []; // Limpar a lista em caso de erro
        })
        .finally(() => {
          // Esconder indicador de carregamento
          showLoading(false);
        });
    } else {
      console.error("API.getMaintenanceList não disponível");
      if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="10" class="text-center error-message">Erro interno: API não disponível.</td></tr>';
      }
      showLoading(false);
      fullMaintenanceList = []; // Limpar a lista
    }
  }

 // *** FUNÇÃO SUBSTITUÍDA CONFORME Atualizações.txt (Item 5) ***
 function renderMaintenanceTable(maintenances) {
    const tbody = document.getElementById('maintenance-tbody');
    if (!tbody) {
        console.error("Elemento #maintenance-tbody não encontrado para renderizar tabela.");
        return;
    }

    tbody.innerHTML = ''; // Limpa o corpo da tabela

    if (!maintenances || maintenances.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center">Nenhuma manutenção encontrada.</td></tr>';
        return;
    }

    console.log(`Renderizando ${maintenances.length} manutenções na tabela.`);

    maintenances.forEach(maintenance => {
        // Garantir que os campos vazios tenham um valor padrão para exibição
        const id = maintenance.id || '-';
        const tipoEquipamento = maintenance.tipoEquipamento || 'Não especificado';
        const placaOuId = maintenance.placaOuId || '-';
        const equipamentoDisplay = `${tipoEquipamento} (${placaOuId})`; // Combina tipo e ID/Placa
        const tipoManutencao = maintenance.tipoManutencao || 'Não especificado';
        const dataRegistro = formatDate(maintenance.dataRegistro) || '-'; // Usa a função de formatação
        const responsavel = maintenance.responsavel || 'Não atribuído';
        const area = maintenance.area || 'Não especificada';
        const local = maintenance.localOficina || maintenance.local || '-'; // Usa localOficina ou local como fallback
        const problema = maintenance.detalhesproblema || maintenance.problema || '-'; // Usa detalhesproblema ou problema
        const status = maintenance.status || 'Pendente'; // Default 'Pendente'
        const statusLower = status.toLowerCase();
        const statusClass = getStatusClass(status); // Obtém a classe CSS para o status

        const row = document.createElement('tr');
        row.dataset.id = maintenance.id || ''; // Adiciona o ID real ao dataset da linha

        // Determinar quais botões mostrar com base no status
        // Ajuste as condições conforme a lógica de negócio exata
        const canVerify = ['pendente', 'aguardando verificacao', 'aguardando verificação'].includes(statusLower);
        const canEdit = ['pendente', 'aguardando verificacao', 'aguardando verificação', 'ajustes', 'reprovado'].includes(statusLower); // Permitir editar se reprovado? Ajustar conforme necessário.


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
            <button class="btn-icon view-maintenance" title="Ver Detalhes" data-id="${maintenance.id}">👁️</button>
            ${canEdit ? `<button class="btn-icon edit-maintenance" title="Editar" data-id="${maintenance.id}">✏️</button>` : ''}
            ${canVerify ? `<button class="btn-icon verify-maintenance" title="Verificar" data-id="${maintenance.id}">✔️</button>` : ''}
            <!-- Adicionar outros botões se necessário (ex: delete, etc.) -->
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

      console.log(`Ação clicada: ${button.classList}, ID: ${maintenanceId}`);

      if (button.classList.contains('view-maintenance')) {
        viewMaintenanceDetails(maintenanceId);
      } else if (button.classList.contains('edit-maintenance')) {
        editMaintenance(maintenanceId);
      } else if (button.classList.contains('verify-maintenance')) {
        verifyMaintenance(maintenanceId);
      }
      // Adicionar outras ações aqui (delete, etc.)
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
          Utilities.viewMaintenanceDetails(id, maintenanceData, () => verifyMaintenance(id));
      } else {
          // Fallback: Usar um modal/overlay genérico se Utilities não estiver disponível
          console.warn("Utilities.viewMaintenanceDetails não encontrado. Usando modal de fallback.");
          // Implementação de um modal de detalhes básico (exemplo)
          const detailOverlay = document.getElementById('detail-overlay'); // Precisa existir no HTML
          const detailContent = document.getElementById('maintenance-detail-content'); // Precisa existir no HTML

          if (detailOverlay && detailContent) {
               let htmlContent = `<h2>Detalhes da Manutenção #${maintenanceData.id || '-'}</h2>`;

                // Mapeamento de campos para exibição
                const detailsMap = [
                    { label: 'Equipamento', value: `${maintenanceData.tipoEquipamento || '-'} (${maintenanceData.placaOuId || '-'})` },
                    { label: 'Tipo de Manutenção', value: `${maintenanceData.tipoManutencao || '-'} ${maintenanceData.eCritico ? '⚠️ CRÍTICA' : ''}` },
                    { label: 'Data de Registro', value: formatDate(maintenanceData.dataRegistro) || '-' },
                    { label: 'Responsável', value: maintenanceData.responsavel || '-' },
                    { label: 'Local', value: `${maintenanceData.area || '-'} / ${maintenanceData.localOficina || '-'}` },
                    { label: 'Status', value: `<span class="status-badge status-${getStatusClass(maintenanceData.status)}">${maintenanceData.status || 'Pendente'}</span>` },
                    { label: 'Categoria do Problema', value: (maintenanceData.categoriaProblema === 'Outros' && maintenanceData.categoriaProblemaOutro) ? `${maintenanceData.categoriaProblema} (${maintenanceData.categoriaProblemaOutro})` : (maintenanceData.categoriaProblema || '-') },
                    { label: 'Descrição do Problema', value: maintenanceData.detalhesproblema || '-' },
                    { label: 'Observações', value: maintenanceData.observacoes || 'Nenhuma' },
                ];

                 htmlContent += '<div class="details-grid">'; // Usar grid para melhor layout
                 detailsMap.forEach(item => {
                      htmlContent += `<div class="detail-item"><strong>${item.label}:</strong> <div>${item.value || '-'}</div></div>`;
                 });
                 htmlContent += '</div>';


               // Adicionar seção de verificação se existir nos dados
              if (maintenanceData.verificacao && typeof maintenanceData.verificacao === 'object') {
                    htmlContent += `<h3>Informações da Verificação</h3>`;
                    const verificationMap = [
                         { label: 'Verificador', value: maintenanceData.verificacao.verifierName || maintenanceData.verificacao.verificador },
                         { label: 'Data da Verificação', value: formatDate(maintenanceData.verificacao.verificationDate || maintenanceData.verificacao.data) },
                         { label: 'Resultado', value: maintenanceData.verificacao.result || maintenanceData.verificacao.resultado },
                         { label: 'Comentários', value: maintenanceData.verificacao.comments || maintenanceData.verificacao.comentarios },
                    ];
                     htmlContent += '<div class="details-grid">';
                     verificationMap.forEach(item => {
                        htmlContent += `<div class="detail-item"><strong>${item.label}:</strong> <div>${item.value || '-'}</div></div>`;
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

                     if (canVerify) {
                          const verifyBtn = document.createElement('button');
                          verifyBtn.textContent = 'Verificar Manutenção';
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
                      closeBtn.className = 'btn btn-secondary'; // Usar classes CSS apropriadas
                      closeBtn.onclick = () => detailOverlay.style.display = 'none';
                      detailActions.appendChild(closeBtn);
                 }


                detailOverlay.style.display = 'flex'; // Mostra o overlay

                // Adicionar event listener para fechar clicando fora (opcional)
                detailOverlay.onclick = function(event) {
                    if (event.target === detailOverlay) {
                        detailOverlay.style.display = 'none';
                    }
                };

                 // Garantir que os botões de fechar dentro do modal funcionem
                 detailOverlay.querySelectorAll('.close-modal-btn').forEach(btn => { // Adicione essa classe aos botões de fechar
                     btn.onclick = () => detailOverlay.style.display = 'none';
                 });


          } else {
              // Fallback final se nem o overlay existir
              alert(`Detalhes da Manutenção #${id}\nStatus: ${maintenanceData.status}\nEquipamento: ${maintenanceData.tipoEquipamento} (${maintenanceData.placaOuId})`);
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

          const verificationOverlay = document.getElementById('verification-form-overlay'); // Precisa existir no HTML
          const verificationForm = document.getElementById('verification-form'); // Precisa existir no HTML

          if (verificationOverlay && verificationForm) {
              // Resetar o formulário de verificação
              verificationForm.reset();
              verificationForm.querySelectorAll('.is-invalid').forEach(el => clearFieldValidation(el));
              verificationForm.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
              verificationForm.querySelectorAll('.error-message').forEach(el => el.remove());


              // Preencher campos fixos com dados da manutenção
              setInputValue('verification-id', id); // Campo oculto ou display para ID
              setInputValue('verification-equipment', `${maintenanceData.tipoEquipamento || '-'} (${maintenanceData.placaOuId || '-'})`);
              setInputValue('verification-type', maintenanceData.tipoManutencao || '-');
              // Opcional: mostrar detalhes do problema
              const problemDisplay = document.getElementById('verification-problem-display');
              if(problemDisplay) problemDisplay.textContent = maintenanceData.detalhesproblema || '-';


              // Mostrar overlay/modal
              verificationOverlay.style.display = 'flex';

              // Configurar listeners de fechar
              addSafeListener('close-verification-form', 'click', () => verificationOverlay.style.display = 'none');
              addSafeListener('cancel-verification', 'click', () => verificationOverlay.style.display = 'none');

               // Configurar listener para o botão de submissão da verificação
              addSafeListener('submit-verification-btn', 'click', function(event) { // Adicione um ID ao botão submit
                  event.preventDefault(); // Prevenir submit padrão se for type="submit"

                  // Coletar dados do formulário de verificação
                  const verifierNameInput = document.getElementById('verifier-name');
                  const resultRadio = verificationForm.querySelector('input[name="verification-result"]:checked');
                  const commentsInput = document.getElementById('verification-comments');

                  const verificationData = {
                      maintenanceId: id,
                      verifierName: verifierNameInput ? verifierNameInput.value.trim() : '',
                      result: resultRadio ? resultRadio.value : null,
                      comments: commentsInput ? commentsInput.value.trim() : '',
                      verificationDate: new Date().toISOString() // Adiciona data da verificação
                  };

                  // Validar dados da verificação
                  let isVerificationValid = true;
                  if (!verificationData.verifierName) {
                       if(verifierNameInput) markFieldAsInvalid(verifierNameInput, 'Nome do verificador é obrigatório.');
                       isVerificationValid = false;
                  } else {
                       if(verifierNameInput) clearFieldValidation(verifierNameInput);
                  }

                   if (!verificationData.result) {
                       // Marcar o grupo de radios como inválido
                       const radioGroupContainer = verificationForm.querySelector('input[name="verification-result"]')?.closest('.form-group, .radio-group-container'); // Ajuste o seletor do container
                       if(radioGroupContainer) markFieldAsInvalid(radioGroupContainer, 'Selecione um resultado.');
                       isVerificationValid = false;
                  } else {
                       const radioGroupContainer = verificationForm.querySelector('input[name="verification-result"]')?.closest('.form-group, .radio-group-container');
                       if(radioGroupContainer) clearFieldValidation(radioGroupContainer);
                  }

                  // Tornar comentários obrigatórios dependendo do resultado (ex: obrigatório se 'Reprovado' ou 'Ajustes')
                  const isCommentRequired = verificationData.result === 'Reprovado' || verificationData.result === 'Ajustes';
                   if (isCommentRequired && !verificationData.comments) {
                       if(commentsInput) markFieldAsInvalid(commentsInput, 'Comentários são obrigatórios para este resultado.');
                       isVerificationValid = false;
                   } else {
                        if(commentsInput) clearFieldValidation(commentsInput);
                   }


                  if (!isVerificationValid) {
                      showNotification("Por favor, preencha os campos obrigatórios da verificação.", "warning");
                      return;
                  }

                  // Submeter verificação via API (ou função de fallback)
                  submitVerification(verificationData);
              });

          } else {
              alert(`Interface de verificação não encontrada. Contate o suporte.`);
              console.error("Elementos #verification-form-overlay ou #verification-form não encontrados.");
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
                    parsedResponse = { success: false, message: "Resposta inválida do servidor." };
                }
            }

          if (parsedResponse && parsedResponse.success) {
            console.log("Verificação registrada com sucesso:", parsedResponse);
            showNotification("Verificação registrada com sucesso!", "success");

            // Fechar o formulário de verificação
            const verificationOverlay = document.getElementById('verification-form-overlay');
            if (verificationOverlay) {
              verificationOverlay.style.display = 'none';
            }

            // Recarregar a lista de manutenções para refletir a mudança de status
            loadMaintenanceList();
          } else {
            console.error("Erro ao registrar verificação (API retornou erro):", parsedResponse);
            showNotification(`Erro ao registrar verificação: ${parsedResponse?.message || 'Erro desconhecido'}`, "error");
          }
        })
        .catch(error => {
          console.error("Falha na chamada da API ao registrar verificação:", error);
          showNotification(`Falha ao conectar com o servidor para registrar verificação: ${error.message || 'Verifique sua conexão.'}`, "error");
        })
        .finally(() => {
          showLoading(false);
        });
    } else {
      console.error("API.submitVerification não disponível.");
      showNotification("Erro: Função da API para submeter verificação não encontrada.", "error");
      showLoading(false);
      // Fechar o formulário mesmo em caso de erro de API para não travar o usuário
      const verificationOverlay = document.getElementById('verification-form-overlay');
      if (verificationOverlay) {
          verificationOverlay.style.display = 'none';
      }
    }
  }


  function findMaintenanceById(id) {
      if (!id) return null;
      // Comparar como strings para evitar problemas de tipo (e.g., API retorna string, local é número)
      const stringId = String(id);
      return fullMaintenanceList.find(item => String(item.id) === stringId);
  }


  // --- Funções Utilitárias ---
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
             if(parts.length === 3) {
                date = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
             }
        } else if (dateString.includes('/')) {
            // Assumir DD/MM/YYYY e tratar como UTC
            const parts = dateString.split('/');
             if(parts.length === 3) {
                 date = new Date(Date.UTC(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])));
             }
        }

        // Se o parse falhou ou resultou em data inválida
        if (!date || isNaN(date.getTime())) {
             // Tentar um parse mais genérico como último recurso
             date = new Date(dateString);
             if (isNaN(date.getTime())) {
                 console.warn(`Formato de data inválido ou não reconhecido: ${dateString}`);
                 return dateString; // Retornar string original se não puder formatar
             }
        }

        // Formatar a data válida para DD/MM/YYYY
        // Usar getUTCDate, getUTCMonth, getUTCFullYear se tratou como UTC
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
        'em andamento': 'adjusting', // Exemplo adicional
        'reprovado': 'rejected',
        'cancelado': 'rejected', // Exemplo adicional
    };

    // Procurar correspondência no mapa
    for (const key in statusMap) {
        if (statusLower.includes(key)) {
            return statusMap[key];
        }
    }

    return 'default'; // Classe padrão para status não mapeados
  }


  function showNotification(message, type = 'info') {
    // Usar Utilities se disponível
    if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
      Utilities.showNotification(message, type);
      return;
    }

    // Implementação de fallback (melhorada)
    console.log(`[${type.toUpperCase()}] ${message}`);

    let container = document.getElementById('notification-container-fallback');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container-fallback';
        // Estilos básicos (ajuste conforme necessário)
        Object.assign(container.style, {
            position: 'fixed',
            top: '10px',
            right: '10px',
            zIndex: '1055', // Acima de muitos elementos, mas talvez abaixo de loaders
            width: '320px',
            maxWidth: '90%'
        });
        document.body.appendChild(container);
    }

    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification-fallback notification-${type}`; // Use classes para estilo
    notification.textContent = message;

    // Estilos básicos via JS (melhor usar CSS com as classes acima)
     Object.assign(notification.style, {
        padding: '12px 18px',
        marginBottom: '10px',
        borderRadius: '5px',
        color: '#fff',
        opacity: '0.9',
        transition: 'opacity 0.5s ease-out, transform 0.3s ease-out',
        transform: 'translateX(100%)', // Começa fora da tela
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        wordWrap: 'break-word'
     });

     // Cores baseadas no tipo
     switch (type) {
        case 'error': notification.style.backgroundColor = '#dc3545'; break; // Vermelho Bootstrap
        case 'success': notification.style.backgroundColor = '#28a745'; break; // Verde Bootstrap
        case 'warning': notification.style.backgroundColor = '#ffc107'; notification.style.color = '#333'; break; // Amarelo Bootstrap
        default: notification.style.backgroundColor = '#17a2b8'; break; // Info Bootstrap
     }


    // Adicionar ao container
    container.appendChild(notification);

     // Animar entrada
     setTimeout(() => {
        notification.style.transform = 'translateX(0)';
     }, 50); // Pequeno delay para garantir a transição


    // Remover após alguns segundos
    const removeTimeout = setTimeout(() => {
      notification.style.opacity = '0';
       notification.style.transform = 'translateX(110%)'; // Animar saída
      // Esperar a transição terminar antes de remover o elemento
      setTimeout(() => {
        if (notification.parentNode) {
             notification.remove();
             // Opcional: remover o container se estiver vazio
             if (container.children.length === 0) {
                 // container.remove(); // Descomente se quiser remover o container vazio
             }
        }
      }, 500); // Tempo igual à duração da transição de opacidade/transform
    }, 5000); // Tempo que a notificação fica visível

     // Permitir fechar ao clicar (opcional)
     notification.onclick = () => {
         clearTimeout(removeTimeout); // Cancela a remoção automática
         notification.style.opacity = '0';
         notification.style.transform = 'translateX(110%)';
         setTimeout(() => {
             if (notification.parentNode) notification.remove();
             if (container.children.length === 0) { /* container.remove(); */ }
         }, 500);
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
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                flexDirection: 'column', // Para colocar mensagem abaixo do spinner
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: '1060', // Acima de outros elementos
                color: 'white',
                textAlign: 'center',
                transition: 'opacity 0.3s ease-in-out',
                opacity: '0' // Começa invisível para transição
             });


            // Spinner (CSS puro)
            const spinner = document.createElement('div');
            spinner.className = 'loader-spinner-fallback'; // Use CSS para estilizar
             Object.assign(spinner.style, {
                 border: '5px solid #f3f3f3', /* Light grey */
                 borderTop: '5px solid #55aaff', /* Blue */
                 borderRadius: '50%',
                 width: '50px',
                 height: '50px',
                 animation: 'spinFallback 1s linear infinite',
                 marginBottom: '15px' // Espaço entre spinner e mensagem
             });


            // Mensagem
            const loaderMessageElement = document.createElement('p');
            loaderMessageElement.id = 'global-loader-message-fallback';
             Object.assign(loaderMessageElement.style, {
                 fontSize: '1.1em',
                 margin: '0',
                 padding: '0 10px' // Evita que texto longo toque as bordas
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
        loader.style.display = 'flex'; // Garante que esteja flexível
    } else {
        if (loader) {
            loader.style.opacity = '0'; // Inicia transição para esconder
            // Remover após a transição
             setTimeout(() => {
                 if (loader && loader.parentNode) {
                     loader.remove();
                 }
             }, 300); // Tempo da transição de opacidade
        }
    }
  }


  // API pública do módulo
  return {
    initialize,
    openMaintenanceForm,
    loadMaintenanceList,
    // Expor outras funções se necessário para depuração ou interação externa
    // editMaintenance, // Exemplo
    // viewMaintenanceDetails // Exemplo
  };
})();

// --- Inicialização ---
// Garante que o DOM esteja pronto antes de inicializar
function initializeMaintenanceModule() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log("DOM carregado. Inicializando Maintenance...");
            Maintenance.initialize();
        });
    } else {
        // DOM já está pronto
        console.log("DOM já pronto. Inicializando Maintenance...");
        Maintenance.initialize();
    }
}

initializeMaintenanceModule(); // Chama a inicialização
