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
    setupDynamicFieldListeners(); // <<< ESTA FUNÇÃO SERÁ SUBSTITUÍDA PELA ATUALIZAÇÃO 1

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
// == SOLUÇÃO PARA PROBLEMAS DO FORMULÁRIO DE MANUTENÇÃO ==
// =========================================================================

function setupDynamicFieldListeners() {
    console.log("Configurando listeners de campos dinâmicos...");
    const equipmentTypeSelect = document.getElementById('equipment-type');
    
    if (equipmentTypeSelect) {
        console.log("Encontrado select de tipo de equipamento. Configurando listener de change...");
        
        equipmentTypeSelect.addEventListener('change', function() {
            const selectedType = this.value; // Valor/slug selecionado
            const selectedText = this.options[this.selectedIndex].text; // Texto da opção
            console.log(`Tipo de equipamento alterado para: '${selectedText}' (valor: '${selectedType}')`);
            
            // Obter os elementos que precisamos manipular
            const equipmentIdSelect = document.getElementById('equipment-id');
            const equipmentIdContainer = equipmentIdSelect?.closest('.form-group, .form-col');
            const otherEquipmentField = document.getElementById('other-equipment-field');
            const otherEquipmentInput = document.getElementById('other-equipment');
            
            console.log("Elementos obtidos:", {
                "equipmentIdSelect": !!equipmentIdSelect,
                "equipmentIdContainer": !!equipmentIdContainer,
                "otherEquipmentField": !!otherEquipmentField,
                "otherEquipmentInput": !!otherEquipmentInput
            });
            
            // Primeiro esconder todos os campos
            if (equipmentIdContainer) {
                console.log("Escondendo container de select de equipamento");
                equipmentIdContainer.style.display = 'none';
            }
            
            if (otherEquipmentField) {
                console.log("Escondendo campo de outro equipamento");
                otherEquipmentField.style.display = 'none';
            }
            
            // Resetar os campos
            if (equipmentIdSelect) {
                equipmentIdSelect.innerHTML = '<option value="">Selecione o equipamento...</option>';
                equipmentIdSelect.removeAttribute('required');
                equipmentIdSelect.disabled = true;
            }
            
            if (otherEquipmentInput) {
                otherEquipmentInput.value = '';
                otherEquipmentInput.removeAttribute('required');
            }
            
            // Se não tiver valor selecionado, não fazer mais nada
            if (!selectedType) {
                console.log("Nenhum tipo selecionado. Mantendo campos ocultos.");
                return;
            }
            
            // Verificar o tipo selecionado de maneira mais robusta
            const selectedTypeLower = selectedType.toLowerCase();
            
            // Verificar se é um dos tipos manuais (aspirador, poliguindaste ou outro)
            if (
                selectedTypeLower === 'aspirador' || 
                selectedTypeLower === 'poliguindaste' || 
                selectedTypeLower === 'outro' ||
                selectedText === 'Aspirador' || 
                selectedText === 'Poliguindaste' || 
                selectedText === 'Outro'
            ) {
                console.log("Tipo de entrada manual selecionado. Exibindo campo 'other-equipment-field'");
                
                // Verificar se otherEquipmentField existe antes de manipular
                if (otherEquipmentField) {
                    // Exibir forçadamente (duas maneiras para garantir)
                    otherEquipmentField.style.display = 'block';
                    otherEquipmentField.classList.remove('d-none');
                    
                    if (otherEquipmentInput) {
                        otherEquipmentInput.setAttribute('required', 'required');
                        otherEquipmentInput.focus();
                        console.log("Campo 'other-equipment' configurado como obrigatório e focado");
                    }
                } else {
                    console.error("ERRO CRÍTICO: Campo 'other-equipment-field' não encontrado no DOM!");
                }
            } 
            // Verificar se é um tipo que usa lista pré-definida (alta pressão ou auto vácuo)
            else if (
                selectedTypeLower === 'alta-pressao' || 
                selectedTypeLower === 'auto-vacuo-hiper-vacuo' ||
                selectedText === 'Alta Pressão' || 
                selectedText === 'Auto Vácuo / Hiper Vácuo'
            ) {
                console.log("Tipo com lista pré-definida selecionado. Exibindo campo 'equipment-id'");
                
                // Verificar se equipmentIdContainer existe antes de manipular
                if (equipmentIdContainer) {
                    // Exibir forçadamente (duas maneiras para garantir)
                    equipmentIdContainer.style.display = 'block';
                    equipmentIdContainer.classList.remove('d-none');
                    
                    if (equipmentIdSelect) {
                        equipmentIdSelect.setAttribute('required', 'required');
                        
                        // Determinar o tipo correto para a chamada da função
                        let equipType;
                        if (selectedTypeLower === 'alta-pressao' || selectedText === 'Alta Pressão') {
                            equipType = 'Alta Pressão';
                        } else {
                            equipType = 'Auto Vácuo / Hiper Vácuo';
                        }
                        
                        console.log(`Populando select de equipamentos para tipo: "${equipType}"`);
                        populateEquipmentSelect(equipType, equipmentIdSelect);
                    } else {
                        console.error("ERRO CRÍTICO: Select 'equipment-id' não encontrado no DOM!");
                    }
                } else {
                    console.error("ERRO CRÍTICO: Container de 'equipment-id' não encontrado no DOM!");
                }
            } else {
                console.log(`Tipo "${selectedText}" (valor: "${selectedType}") não reconhecido como especial. Verificando EQUIPMENT_IDS...`);
                
                // Tentar encontrar o tipo nas chaves do objeto EQUIPMENT_IDS
                if (EQUIPMENT_IDS && Object.keys(EQUIPMENT_IDS).some(key => 
                    key === selectedText || key.toLowerCase() === selectedTypeLower
                )) {
                    console.log(`Tipo "${selectedText}" encontrado em EQUIPMENT_IDS. Exibindo campo 'equipment-id'`);
                    
                    if (equipmentIdContainer) {
                        equipmentIdContainer.style.display = 'block';
                        equipmentIdContainer.classList.remove('d-none');
                        
                        if (equipmentIdSelect) {
                            equipmentIdSelect.setAttribute('required', 'required');
                            populateEquipmentSelect(selectedText, equipmentIdSelect);
                        }
                    }
                } else {
                    console.log(`Tipo "${selectedText}" não encontrado em EQUIPMENT_IDS. Tratando como outros tipos.`);
                    
                    // Tratamento padrão: mostrar campo de entrada manual
                    if (otherEquipmentField) {
                        otherEquipmentField.style.display = 'block';
                        otherEquipmentField.classList.remove('d-none');
                        
                        if (otherEquipmentInput) {
                            otherEquipmentInput.setAttribute('required', 'required');
                        }
                    }
                }
            }
        });
        
        console.log("Listener de change configurado para 'equipment-type'");
    } else {
        console.error("ERRO CRÍTICO: Select 'equipment-type' não encontrado no DOM!");
    }

    // Configurar outros listeners (manter os já existentes) -> Listener para categoria de problema
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

// Nova função para popular o select de equipamentos (da Atualização 1 - corrigida)
function populateEquipmentSelect(equipmentType, selectElement) {
    console.log(`Iniciando populateEquipmentSelect para tipo: "${equipmentType}"`);
    
    if (!selectElement) {
        console.error("Erro: selectElement não fornecido para populateEquipmentSelect");
        return;
    }
    
    // Mostra mensagem de carregamento
    selectElement.innerHTML = '<option value="">Carregando equipamentos...</option>';
    selectElement.disabled = true;

    // Determina quais equipamentos mostrar
    let equipList = [];
    
    // Verificar diretamente no objeto EQUIPMENT_IDS
    if (EQUIPMENT_IDS) {
        // Procurar o tipo exato
        if (EQUIPMENT_IDS[equipmentType]) {
            console.log(`Tipo "${equipmentType}" encontrado em EQUIPMENT_IDS.`);
            equipList = EQUIPMENT_IDS[equipmentType];
        } 
        // Procurar o tipo ignorando case (maiúsculas/minúsculas)
        else {
            const typeKey = Object.keys(EQUIPMENT_IDS).find(key => 
                key.toLowerCase() === equipmentType.toLowerCase()
            );
            
            if (typeKey) {
                console.log(`Tipo "${equipmentType}" encontrado como "${typeKey}" em EQUIPMENT_IDS.`);
                equipList = EQUIPMENT_IDS[typeKey];
            } else {
                console.warn(`Aviso: Tipo "${equipmentType}" não encontrado em EQUIPMENT_IDS.`);
            }
        }
    } else {
        console.error("Erro: EQUIPMENT_IDS não está definido!");
    }

    // Limpa e adiciona a opção padrão
    selectElement.innerHTML = '<option value="">Selecione o equipamento...</option>';

    // Populando o select com os dados
    if (equipList && equipList.length > 0) {
        console.log(`Populando ${equipList.length} equipamentos para "${equipmentType}"`);
        
        // Remove duplicados
        const uniqueItems = [...new Set(equipList)];

        // Adiciona as opções em ordem alfabética
        uniqueItems.sort().forEach(item => {
            const option = document.createElement('option');
            option.value = item;
            option.textContent = item;
            selectElement.appendChild(option);
        });

        selectElement.disabled = false; // Habilita para seleção
        console.log(`Select populado com sucesso: ${uniqueItems.length} equipamentos`);
    } else {
        // Se não houver equipamentos
        console.warn(`Nenhum equipamento encontrado para o tipo "${equipmentType}"`);
        selectElement.innerHTML += '<option value="" disabled>Nenhum equipamento encontrado</option>';
        selectElement.disabled = true;
    }
}
  // =======================================================================
  // == FIM DA ATUALIZAÇÃO 1 ==
  // =======================================================================

  // Função original loadEquipmentsForType - Será chamada pela função setupDynamicFieldListeners substituída?
  // A nova setupDynamicFieldListeners chama populateEquipmentSelect.
  // Mantendo a função loadEquipmentsForType original caso outra parte do código a use (improvável).
  // Se tiver certeza que não é mais usada, pode ser removida.
  function loadEquipmentsForType(type, selectElement) {
    if (!selectElement) return;

    // Mostra indicador de carregamento no select
    selectElement.disabled = true;
    selectElement.innerHTML = '<option value="">Carregando equipamentos...</option>';

    // Mapeia o slug de volta para a chave original do objeto EQUIPMENT_IDS, se necessário
    let apiTypeParam = type;
    const equipmentTypeSelect = document.getElementById('equipment-type');
    if(equipmentTypeSelect) {
        const selectedOption = Array.from(equipmentTypeSelect.options).find(opt => opt.value === type);
        if(selectedOption) {
            apiTypeParam = selectedOption.textContent;
        }
    }
    console.log(`Chamando loadEquipmentsForType com tipo (slug): ${type}, parâmetro API (texto): ${apiTypeParam}`);

    // Tenta carregar da lista local primeiro (EQUIPMENT_IDS)
    if (EQUIPMENT_IDS && EQUIPMENT_IDS[apiTypeParam]) {
        console.log(`Carregando da lista local EQUIPMENT_IDS para '${apiTypeParam}'`);
        const uniqueEquipments = [...new Set(EQUIPMENT_IDS[apiTypeParam])];
        selectElement.innerHTML = '<option value="">Selecione o equipamento...</option>';
        if (uniqueEquipments.length > 0) {
            uniqueEquipments.sort().forEach(item => {
                const option = document.createElement('option');
                option.value = item;
                option.textContent = item;
                selectElement.appendChild(option);
            });
             selectElement.disabled = false;
        } else {
             selectElement.innerHTML += '<option value="" disabled>Nenhum equipamento na lista local</option>';
             selectElement.disabled = true;
        }
        return;
    }

    // Caso não tenhamos lista local para esse tipo, tentamos via API
    console.log(`Tipo '${apiTypeParam}' não encontrado em EQUIPMENT_IDS. Tentando via API.`);
    if (window.API && typeof API.getEquipmentsByType === 'function') {
      API.getEquipmentsByType(apiTypeParam)
        .then(response => {
          selectElement.innerHTML = '<option value="">Selecione o equipamento...</option>';
          if (response.success && Array.isArray(response.equipment)) {
             console.log("Equipamentos carregados da API:", response.equipment);
            const uniqueItems = new Map();
            response.equipment.forEach(item => {
              const id = item.placaOuId || item.id || '';
              if (id && !uniqueItems.has(id)) {
                uniqueItems.set(id, item);
              }
            });
            if (uniqueItems.size > 0) {
              const sortedItems = Array.from(uniqueItems.values()).sort((a, b) => {
                  const idA = a.placaOuId || a.id || '';
                  const idB = b.placaOuId || b.id || '';
                  return idA.localeCompare(idB);
              });
              sortedItems.forEach(item => {
                const option = document.createElement('option');
                const itemId = item.placaOuId || item.id;
                const itemName = item.name || item.descricao || itemId;
                option.value = itemId;
                option.textContent = (itemName && itemName !== itemId) ? `${itemName} (${itemId})` : itemId;
                selectElement.appendChild(option);
              });
              selectElement.disabled = false;
            } else {
              selectElement.innerHTML += '<option value="" disabled>Nenhum equipamento encontrado via API</option>';
              selectElement.disabled = true;
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
    let equipmentTypeValueOrText = data.tipoEquipamento;
    let useOtherField = false;

    const manualTypes = ['aspirador', 'poliguindaste', 'outro'];
    const originalTypeSlug = data.tipoEquipamento?.toLowerCase().replace(/ /g, '-').replace(/\//g, '-');

    if (manualTypes.includes(originalTypeSlug)) {
        equipmentTypeValueOrText = originalTypeSlug;
        useOtherField = true;
    } else {
         const equipSelect = document.getElementById('equipment-type');
         const optionByText = Array.from(equipSelect.options).find(opt => opt.textContent === data.tipoEquipamento);
         if (optionByText) {
            equipmentTypeValueOrText = optionByText.value;
         } else {
             equipmentTypeValueOrText = originalTypeSlug;
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
         // Esperar um pouco mais se for carregamento de API ou da nova populateEquipmentSelect
         setTimeout(() => {
            console.log("Populando equipment-id com:", data.placaOuId);
            if (!setSelectValue('equipment-id', data.placaOuId)) {
                console.warn(`Falha ao selecionar ${data.placaOuId} no select #equipment-id. Pode não ter sido carregado ou não existe.`);
                const equipIdSelect = document.getElementById('equipment-id');
                const exists = Array.from(equipIdSelect.options).some(opt => opt.value === data.placaOuId);
                if (!exists && data.placaOuId) {
                    console.log(`Adicionando opção ausente: ${data.placaOuId}`);
                    const option = document.createElement('option');
                    option.value = data.placaOuId;
                    option.textContent = data.placaOuId;
                    option.selected = true;
                    equipIdSelect.appendChild(option);
                    equipIdSelect.disabled = false;
                }
            }
         }, 300); // Delay um pouco maior
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
          setTimeout(() => {
              const event = new Event('change', { bubbles: true });
              element.dispatchEvent(event);
          }, 0);
          return true;
      } else {
          console.warn(`Valor/Texto "${value}" não encontrado nas opções de #${id}. Opções disponíveis (valores):`, Array.from(element.options).map(opt => opt.value));
          return false;
      }
    } else {
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
      let date;
      if (dateString.includes('/')) {
          const parts = dateString.split('/');
          if (parts.length === 3) {
              date = new Date(Date.UTC(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])));
          }
      } else {
           date = new Date(dateString);
           if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
               const parts = dateString.split('-');
               date = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
           }
      }


      if (!date || isNaN(date.getTime())) {
           console.warn("Data inválida para formatar para input:", dateString);
           return '';
      }

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
        equipmentTypeSelect.dispatchEvent(new Event('change'));
    }

    const problemCategorySelect = document.getElementById('problem-category-select');
    if(problemCategorySelect) {
        problemCategorySelect.selectedIndex = 0;
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
              return;
          }

          let fieldValue = element.value;
          let fieldValid = false;

          const container = element.closest('.form-col, .form-group, #other-equipment-field, #other-category-field');
          const checkElement = container || element;
          const isVisible = window.getComputedStyle(checkElement).display !== 'none';

          const isRequired = element.hasAttribute('required');

          if(isVisible && isRequired) {
              if (element.tagName === 'SELECT') {
                  fieldValid = fieldValue !== '' && fieldValue !== null;
              } else if (element.type === 'checkbox') {
                   fieldValid = element.checked;
              } else {
                  fieldValid = fieldValue && fieldValue.trim() !== '';
              }

              if (!fieldValid) {
                  isValid = false;
                  const errorMsg = field.errorMsg || `${field.name} é obrigatório`;
                  markFieldAsInvalid(element, errorMsg);
                  if (!firstInvalidField) {
                      firstInvalidField = element;
                  }
              } else {
                  clearFieldValidation(element);
              }
          } else {
               clearFieldValidation(element);
          }
      });

      if (firstInvalidField) {
          firstInvalidField.focus();
          console.log(`Foco no primeiro campo inválido: #${firstInvalidField.id}`);
      }

      return isValid;
  }


  function markFieldAsInvalid(element, message) {
    element.classList.add('is-invalid');
    const formGroup = element.closest('.form-group, .form-col, #other-equipment-field, #other-category-field');
    if (formGroup) {
      formGroup.classList.add('has-error');
      let errorElement = formGroup.querySelector('.error-message');
      if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.style.color = '#dc3545';
        errorElement.style.fontSize = '0.875em';
        errorElement.style.marginTop = '0.25rem';
        errorElement.style.width = '100%';
        formGroup.appendChild(errorElement);
      }
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    } else {
       console.warn("Não foi possível encontrar .form-group ou .form-col para exibir mensagem de erro para:", element);
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
    element.classList.remove('is-invalid');
    const formGroup = element.closest('.form-group, .form-col, #other-equipment-field, #other-category-field');
    if (formGroup) {
      formGroup.classList.remove('has-error');
      const errorElement = formGroup.querySelector('.error-message');
      if (errorElement) {
        errorElement.remove();
      }
    } else {
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

    // Usa o VALOR (slug) para a lógica
    if (equipTypeValue === 'aspirador' || equipTypeValue === 'poliguindaste' || equipTypeValue === 'outro') {
        const otherInput = document.getElementById('other-equipment');
        if(otherInput && otherInput.closest('#other-equipment-field')?.style.display !== 'none') {
           formData.placaOuId = otherInput.value.trim();
           formData.equipamentoOutro = null;
           if(equipTypeValue === 'outro') {
              formData.tipoEquipamento = otherInput.value.trim() || 'Outro (não especificado)';
              formData.equipamentoOutro = otherInput.value.trim();
           }
        } else {
            formData.placaOuId = '';
            formData.equipamentoOutro = null;
        }
    } else if (equipTypeValue) {
        const idSelect = document.getElementById('equipment-id');
         if(idSelect && idSelect.closest('.form-col, .form-group')?.style.display !== 'none') {
            formData.placaOuId = idSelect.value;
            formData.equipamentoOutro = null;
         } else {
            formData.placaOuId = '';
             formData.equipamentoOutro = null;
         }
    } else {
        formData.placaOuId = '';
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

    const problemCategorySelect = document.getElementById('problem-category-select');
    formData.categoriaProblema = problemCategorySelect.value;

    if (formData.categoriaProblema === 'Outros') { // Usa 'Outros'
      formData.categoriaProblemaOutro = document.getElementById('other-category').value.trim();
    } else {
        formData.categoriaProblemaOutro = null;
    }

    formData.detalhesproblema = document.getElementById('problem-description').value; // Ajustar ID se necessário

    const additionalNotes = document.getElementById('additional-notes');
    formData.observacoes = additionalNotes ? additionalNotes.value : ''; // Ajustar ID se necessário

    console.log("Dados da etapa 2 salvos:", formData);
  }

  function updateSummary() {
    console.log("Atualizando resumo...");

    let equipmentSummary = '-';
    if (formData.tipoEquipamento) {
        if (formData.equipamentoOutro) {
             equipmentSummary = formData.tipoEquipamento;
        } else if (formData.placaOuId) {
             equipmentSummary = `${formData.tipoEquipamento} (${formData.placaOuId})`;
        } else {
             equipmentSummary = formData.tipoEquipamento;
        }
    }


    let categorySummary = formData.categoriaProblema || '-';
    if (formData.categoriaProblema === 'Outros' && formData.categoriaProblemaOutro) {
        categorySummary = `${formData.categoriaProblema} (${formData.categoriaProblemaOutro})`;
    }

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
    console.log(`${isEditMode ? 'Atualizando' : 'Criando nova'} manutenção... Dados coletados:`, formData);

    showLoading(true, `${isEditMode ? 'Atualizando' : 'Registrando'} manutenção...`);

    const dataToSend = {
      tipoEquipamento: formData.tipoEquipamento,
      placaOuId: formData.placaOuId,
      equipamentoOutro: formData.equipamentoOutro,
      responsavel: formData.responsavel,
      dataRegistro: formData.dataRegistro,
      area: formData.area,
      localOficina: formData.localOficina,
      tipoManutencao: formData.tipoManutencao,
      eCritico: formData.eCritico,
      categoriaProblema: formData.categoriaProblema,
      categoriaProblemaOutro: formData.categoriaProblemaOutro,
      detalhesproblema: formData.detalhesproblema,
      observacoes: formData.observacoes,
      status: isEditMode ? undefined : 'Pendente'
    };

     Object.keys(dataToSend).forEach(key => {
         if (dataToSend[key] === undefined || dataToSend[key] === null) {
             delete dataToSend[key];
         }
     });


    if (isEditMode && editingMaintenanceId) {
      dataToSend.id = editingMaintenanceId;
    } else if (isEditMode && !editingMaintenanceId) {
        console.error("Tentando editar sem um ID de manutenção!");
        showNotification("Erro: ID da manutenção não encontrado para edição.", "error");
        showLoading(false);
        return;
    }

    console.log("Dados a serem enviados para a API:", dataToSend);

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
         let parsedResponse = response;
         if (typeof response === 'string') {
             try {
                 parsedResponse = JSON.parse(response);
             } catch (e) {
                 console.error("Erro ao parsear resposta da API:", e);
                 parsedResponse = { success: false, message: response || "Resposta inválida do servidor." };
             }
         } else if (typeof response !== 'object' || response === null) {
             parsedResponse = { success: false, message: "Formato de resposta inesperado do servidor." };
         }


        if (parsedResponse && parsedResponse.success) {
          console.log("Manutenção salva com sucesso:", parsedResponse);
          const message = isEditMode ?
            "Manutenção atualizada com sucesso!" :
            "Nova manutenção registrada com sucesso!";
          showNotification(message, "success");
          closeForm();
          loadMaintenanceList();
        } else {
          console.error("Erro ao salvar manutenção (API retornou erro):", parsedResponse);
          const errorMessage = parsedResponse?.message || parsedResponse?.error || (typeof parsedResponse === 'string' ? parsedResponse : 'Erro desconhecido do servidor.');
          showNotification(`Erro ao ${isEditMode ? 'atualizar' : 'registrar'} manutenção: ${errorMessage}`, "error");
        }
      })
      .catch(error => {
        console.error("Falha na chamada da API ao salvar manutenção:", error);
        const errorMessage = error?.message || (typeof error === 'string' ? error : 'Verifique sua conexão ou contate o suporte.');
        showNotification(`Falha ao conectar com o servidor: ${errorMessage}`, "error");
      })
      .finally(() => {
        showLoading(false);
      });
  }

  // --- Funções de Dados e Tabela ---
  function loadMaintenanceList() {
      const statusFilter = document.getElementById('maintenance-status-filter')?.value;
      const typeFilter = document.getElementById('maintenance-type-filter')?.value;
      const dateFrom = document.getElementById('maintenance-date-from')?.value;
      const dateTo = document.getElementById('maintenance-date-to')?.value;

      const filtersActive = (statusFilter && statusFilter !== 'all') ||
                            (typeFilter && typeFilter !== 'all') ||
                            dateFrom || dateTo;

      if (filtersActive) {
          console.log("Recarregando lista com filtros ativos.");
          loadMaintenanceListWithFilters(statusFilter, typeFilter, dateFrom, dateTo);
      } else {
          console.log("Carregando lista completa de manutenções (sem filtros ativos).");
          loadMaintenanceListWithoutFilters();
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

  function loadMaintenanceListWithFilters(status, type, dateFrom, dateTo) {
    console.log(`Carregando lista com filtros: Status=${status || 'N/A'}, Tipo=${type || 'N/A'}, De=${dateFrom || 'N/A'}, Até=${dateTo || 'N/A'}`);

    showLoading(true, "Filtrando manutenções...");

    const tableBody = document.getElementById('maintenance-tbody');
     if (tableBody) {
       tableBody.innerHTML = '<tr><td colspan="10" class="text-center">Filtrando...</td></tr>';
     }

    const params = {};
    if (status && status !== 'all') params.status = status;
    if (type && type !== 'all') params.tipo = type;
    if (dateFrom) params.dataInicio = dateFrom;
    if (dateTo) params.dataFim = dateTo;

    if (window.API && typeof API.getMaintenanceListFiltered === 'function') {
      API.getMaintenanceListFiltered(params)
        .then(response => handleApiResponse(response, tableBody))
        .catch(error => handleApiError(error, tableBody))
        .finally(() => showLoading(false));
    } else if (window.API && typeof API.getMaintenanceList === 'function') {
        console.warn("API.getMaintenanceListFiltered não encontrada. Tentando usar API.getMaintenanceList com parâmetros.");
        API.getMaintenanceList(params)
            .then(response => handleApiResponse(response, tableBody))
            .catch(error => handleApiError(error, tableBody))
            .finally(() => showLoading(false));
    } else {
      handleApiError("Nenhuma função da API disponível para carregar/filtrar manutenções.", tableBody);
      showLoading(false);
    }
  }


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
        renderMaintenanceTable(fullMaintenanceList);
      } else {
        console.error("Erro ao carregar/filtrar manutenções:", parsedResponse);
        const errorMessage = parsedResponse?.message || 'Formato inválido ou nenhum dado retornado.';
        if (tableBody) {
          tableBody.innerHTML = `<tr><td colspan="10" class="text-center error-message">Erro ao carregar dados: ${errorMessage}</td></tr>`;
        }
        fullMaintenanceList = [];
        renderMaintenanceTable(fullMaintenanceList);
      }
  }

  function handleApiError(error, tableBody) {
      console.error("Falha na comunicação com a API:", error);
      const errorMessage = error?.message || (typeof error === 'string' ? error : 'Falha ao conectar com o servidor.');
      if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="10" class="text-center error-message">${errorMessage}. Tente novamente mais tarde.</td></tr>`;
      }
      fullMaintenanceList = [];
      renderMaintenanceTable(fullMaintenanceList);
  }


 function renderMaintenanceTable(maintenances) {
    const tbody = document.getElementById('maintenance-tbody');
    if (!tbody) {
        console.error("Elemento #maintenance-tbody não encontrado para renderizar tabela.");
        return;
    }

    tbody.innerHTML = ''; // Limpa o corpo da tabela

    if (!maintenances || maintenances.length === 0) {
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
        const id = maintenance.id || '-';
        const tipoEquipamento = maintenance.tipoEquipamento || 'Não especificado';
        const placaOuId = maintenance.placaOuId || '-';
        const equipamentoDisplay = placaOuId !== '-' ? `${tipoEquipamento} (${placaOuId})` : tipoEquipamento;
        const tipoManutencao = maintenance.tipoManutencao || 'Preventiva';
        const dataRegistro = formatDate(maintenance.dataRegistro) || '-';
        const responsavel = maintenance.responsavel || 'Não atribuído';
        const area = maintenance.area || 'Não especificada';
        const local = maintenance.localOficina || maintenance.local || '-';
        const problemaRaw = maintenance.detalhesproblema || maintenance.problema || '-';
        const problema = Utilities.escapeHtml ? Utilities.escapeHtml(problemaRaw) : problemaRaw;

        const status = maintenance.status || 'Pendente';
        const statusLower = status.toLowerCase();
        const statusClass = getStatusClass(status);

        const row = document.createElement('tr');
        row.dataset.id = id;

        const canVerify = ['pendente', 'aguardando verificacao', 'aguardando verificação'].includes(statusLower);
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
          </td>
        `;

        tbody.appendChild(row);
    });

     setupTableActionListeners();
     console.log("Tabela renderizada e listeners de ação configurados.");
 }


  function setupTableActionListeners() {
    const tableBody = document.getElementById('maintenance-tbody');
    if (!tableBody) return;

    const newTableBody = tableBody.cloneNode(true);
    tableBody.parentNode.replaceChild(newTableBody, tableBody);

    newTableBody.addEventListener('click', function(event) {
      const button = event.target.closest('.btn-icon[data-id]');
      if (!button) return;

      const maintenanceId = button.getAttribute('data-id');
      if (!maintenanceId) return;

      console.log(`Ação clicada: ${Array.from(button.classList).join(' ')}, ID: ${maintenanceId}`);

      if (button.classList.contains('view-maintenance')) {
        viewMaintenanceDetails(maintenanceId);
      } else if (button.classList.contains('edit-maintenance')) {
        editMaintenance(maintenanceId);
      } else if (button.classList.contains('verify-maintenance')) {
        verifyMaintenance(maintenanceId);
      }
    });
  }


  function viewMaintenanceDetails(id) {
      console.log(`Buscando detalhes para manutenção ID: ${id}`);
      const maintenanceData = findMaintenanceById(id);

      if (!maintenanceData) {
          showNotification("Erro: Dados da manutenção não encontrados localmente.", "error");
          console.error(`Manutenção com ID ${id} não encontrada em fullMaintenanceList.`);
          return;
      }

      console.log("Dados encontrados para visualização:", maintenanceData);

      if (typeof Utilities !== 'undefined' && Utilities.viewMaintenanceDetails) {
          console.log("Usando Utilities.viewMaintenanceDetails");
          const actions = {
              canVerify: ['pendente', 'aguardando verificacao', 'aguardando verificação'].includes((maintenanceData.status || '').toLowerCase()),
              canEdit: ['pendente', 'aguardando verificacao', 'aguardando verificação', 'ajustes', 'reprovado'].includes((maintenanceData.status || '').toLowerCase()),
              onVerify: () => verifyMaintenance(id),
              onEdit: () => editMaintenance(id)
          };
          Utilities.viewMaintenanceDetails(id, maintenanceData, actions);
      } else {
          console.warn("Utilities.viewMaintenanceDetails não encontrado. Usando modal de fallback.");
          const detailOverlay = document.getElementById('detail-overlay');
          const detailContent = document.getElementById('maintenance-detail-content');

          if (detailOverlay && detailContent) {
               let htmlContent = `<h2>Detalhes da Manutenção #${maintenanceData.id || '-'}</h2>`;

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

                 htmlContent += '<div class="details-grid">';
                 detailsMap.forEach(item => {
                      const valueHtml = item.value.includes('<span') ? item.value : (Utilities.escapeHtml ? Utilities.escapeHtml(item.value) : item.value);
                      htmlContent += `<div class="detail-item"><strong>${item.label}:</strong> <div>${valueHtml || '-'}</div></div>`;
                 });
                 htmlContent += '</div>';


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

                 const detailActions = detailOverlay.querySelector('.modal-actions');
                 if (detailActions) {
                    detailActions.innerHTML = '';
                     const statusLower = (maintenanceData.status || '').toLowerCase();
                     const canVerify = ['pendente', 'aguardando verificacao', 'aguardando verificação'].includes(statusLower);
                     const canEdit = ['pendente', 'aguardando verificacao', 'aguardando verificação', 'ajustes', 'reprovado'].includes(statusLower);

                     if (canEdit) {
                         const editBtn = document.createElement('button');
                         editBtn.innerHTML = '✏️ Editar';
                         editBtn.className = 'btn btn-secondary';
                         editBtn.onclick = () => {
                             detailOverlay.style.display = 'none';
                             editMaintenance(id);
                         };
                         detailActions.appendChild(editBtn);
                     }

                     if (canVerify) {
                          const verifyBtn = document.createElement('button');
                          verifyBtn.innerHTML = '✔️ Verificar';
                          verifyBtn.className = 'btn btn-primary';
                          verifyBtn.onclick = () => {
                               detailOverlay.style.display = 'none';
                               verifyMaintenance(id);
                          };
                          detailActions.appendChild(verifyBtn);
                     }

                      const closeBtn = document.createElement('button');
                      closeBtn.textContent = 'Fechar';
                      closeBtn.className = 'btn btn-light';
                      closeBtn.onclick = () => detailOverlay.style.display = 'none';
                      detailActions.appendChild(closeBtn);
                 }


                detailOverlay.style.display = 'flex';

                detailOverlay.onclick = function(event) {
                    if (event.target === detailOverlay) {
                        detailOverlay.style.display = 'none';
                    }
                };

                 detailOverlay.querySelectorAll('.close-modal-btn').forEach(btn => {
                     btn.onclick = () => detailOverlay.style.display = 'none';
                 });


          } else {
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
    const maintenanceData = findMaintenanceById(id);

    if (!maintenanceData) {
      showNotification("Erro: Dados da manutenção não encontrados para edição.", "error");
      console.error(`Manutenção com ID ${id} não encontrada em fullMaintenanceList para edição.`);
      return;
    }

     console.log("Dados encontrados para edição:", maintenanceData);

    openMaintenanceForm(id, maintenanceData);
  }

  function verifyMaintenance(id) {
      console.log(`Iniciando verificação para manutenção ID: ${id}`);
      const maintenanceData = findMaintenanceById(id);

      if (!maintenanceData) {
          showNotification("Erro: Dados da manutenção não encontrados para verificação.", "error");
          console.error(`Manutenção com ID ${id} não encontrada em fullMaintenanceList para verificação.`);
          return;
      }

      console.log("Dados encontrados para verificação:", maintenanceData);

      if (typeof Verification !== 'undefined' && Verification.openVerificationForm) {
          console.log("Usando módulo global Verification.openVerificationForm");
          Verification.openVerificationForm(id, maintenanceData);
      } else {
          console.warn("Módulo global Verification não encontrado. Usando formulário de verificação de fallback.");

          const verificationOverlay = document.getElementById('verification-form-overlay-fallback');
          const verificationForm = document.getElementById('verification-form-fallback');

          if (verificationOverlay && verificationForm) {
              verificationForm.reset();
              verificationForm.querySelectorAll('.is-invalid').forEach(el => clearFieldValidation(el));
              verificationForm.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
              verificationForm.querySelectorAll('.error-message').forEach(el => el.remove());


              setInputValue('verification-id-fallback', id);
              const equipmentDisplayFallbackV = maintenanceData.placaOuId ? `${maintenanceData.tipoEquipamento || '-'} (${maintenanceData.placaOuId})` : (maintenanceData.tipoEquipamento || '-');
              setInputValue('verification-equipment-fallback', equipmentDisplayFallbackV);
              setInputValue('verification-type-fallback', maintenanceData.tipoManutencao || '-');
              const problemDisplayFallback = document.getElementById('verification-problem-display-fallback');
              if(problemDisplayFallback) problemDisplayFallback.textContent = maintenanceData.detalhesproblema || '-';


              verificationOverlay.style.display = 'flex';

              addSafeListener('close-verification-form-fallback', 'click', () => verificationOverlay.style.display = 'none');
              addSafeListener('cancel-verification-fallback', 'click', () => verificationOverlay.style.display = 'none');

              addSafeListener('submit-verification-btn-fallback', 'click', function(event) {
                  event.preventDefault();

                  const verifierNameInput = document.getElementById('verifier-name-fallback');
                  const resultRadio = verificationForm.querySelector('input[name="verification-result-fallback"]:checked');
                  const commentsInput = document.getElementById('verification-comments-fallback');

                  const verificationData = {
                      maintenanceId: id,
                      verifierName: (typeof UserSession !== 'undefined' && UserSession.getUserName) ? UserSession.getUserName() : (verifierNameInput ? verifierNameInput.value.trim() : ''),
                      result: resultRadio ? resultRadio.value : null,
                      comments: commentsInput ? commentsInput.value.trim() : '',
                      verificationDate: new Date().toISOString().split('T')[0]
                  };

                  let isVerificationValid = true;
                   if (!verificationData.verifierName && verifierNameInput && window.getComputedStyle(verifierNameInput).display !== 'none') {
                       markFieldAsInvalid(verifierNameInput, 'Nome do verificador é obrigatório.');
                       isVerificationValid = false;
                   } else if (verifierNameInput) {
                       clearFieldValidation(verifierNameInput);
                   }

                   if (!verificationData.result) {
                       const radioGroupContainer = verificationForm.querySelector('input[name="verification-result-fallback"]')?.closest('.form-group, .radio-group-container');
                       if(radioGroupContainer) markFieldAsInvalid(radioGroupContainer, 'Selecione um resultado.');
                       isVerificationValid = false;
                  } else {
                       const radioGroupContainer = verificationForm.querySelector('input[name="verification-result-fallback"]')?.closest('.form-group, .radio-group-container');
                       if(radioGroupContainer) clearFieldValidation(radioGroupContainer);
                  }

                  const isCommentRequired = ['Reprovado', 'Ajustes'].includes(verificationData.result);
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

                  submitVerification(verificationData);
              });

          } else {
              alert(`Interface de verificação de fallback não encontrada. Contate o suporte.`);
              console.error("Elementos #verification-form-overlay-fallback ou #verification-form-fallback não encontrados.");
          }
      }
  }


  function submitVerification(data) {
    console.log("Submetendo verificação via API:", data);

    showLoading(true, "Registrando verificação...");

    if (window.API && typeof API.submitVerification === 'function') {
      API.submitVerification(data)
        .then(response => {
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

            const verificationOverlay = document.getElementById('verification-form-overlay') || document.getElementById('verification-form-overlay-fallback');
            if (verificationOverlay) {
              verificationOverlay.style.display = 'none';
            }

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
      const verificationOverlay = document.getElementById('verification-form-overlay') || document.getElementById('verification-form-overlay-fallback');
      if (verificationOverlay) {
          verificationOverlay.style.display = 'none';
      }
    }
  }


  function findMaintenanceById(id) {
      if (!id || !Array.isArray(fullMaintenanceList)) return null;
      const stringId = String(id);
      return fullMaintenanceList.find(item => String(item.id) === stringId);
  }

  // --- Funções Utilitárias ---
  function formatDate(dateString) {
    if (!dateString) return '-';

    if (typeof Utilities !== 'undefined' && Utilities.formatDate) {
      return Utilities.formatDate(dateString);
    }

    try {
        let date;
        if (dateString.includes('T') || dateString.includes('Z')) {
            date = new Date(dateString);
        } else if (dateString.includes('-')) {
             const parts = dateString.split('-');
             if(parts.length === 3 && parts.every(p => !isNaN(parseInt(p)))) {
                date = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
             }
        } else if (dateString.includes('/')) {
            const parts = dateString.split('/');
             if(parts.length === 3 && parts.every(p => !isNaN(parseInt(p)))) {
                 date = new Date(Date.UTC(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])));
             }
        }

        if (!date || isNaN(date.getTime())) {
             date = new Date(dateString);
             if (isNaN(date.getTime())) {
                 console.warn(`Formato de data inválido ou não reconhecido: ${dateString}`);
                 return dateString;
             }
             const day = String(date.getDate()).padStart(2, '0');
             const month = String(date.getMonth() + 1).padStart(2, '0');
             const year = date.getFullYear();
             return `${day}/${month}/${year}`;
        }

        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();

        return `${day}/${month}/${year}`;
    } catch(e) {
      console.error(`Erro ao formatar data "${dateString}":`, e);
      return dateString;
    }
  }


  function getStatusClass(status) {
    if (!status) return 'default';

    const statusLower = status.toLowerCase();

    const statusMap = {
        'pendente': 'pending',
        'aguardando verificação': 'pending',
        'aguardando verificacao': 'pending',
        'em análise': 'pending',
        'verificado': 'verified',
        'aprovado': 'verified',
        'concluído': 'completed',
        'concluido': 'completed',
        'finalizado': 'completed',
        'ajustes': 'adjusting',
        'em andamento': 'progress',
        'reprovado': 'rejected',
        'cancelado': 'cancelled',
    };

    if (statusMap[statusLower]) {
        return statusMap[statusLower];
    }

     console.warn(`Status não mapeado para classe CSS: "${status}". Usando 'default'.`);
    return 'default';
  }


  function showNotification(message, type = 'info') {
    if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
      Utilities.showNotification(message, type);
      return;
    }

    console.log(`[${type.toUpperCase()}] ${message}`);

    let container = document.getElementById('notification-container-fallback');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container-fallback';
        Object.assign(container.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '1055',
            width: '350px',
            maxWidth: '90%'
        });
        document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.className = `notification-fallback notification-${type}`;
    notification.setAttribute('role', 'alert');

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.setAttribute('aria-label', 'Fechar');
    Object.assign(closeButton.style, {
        background: 'none',
        border: 'none',
        color: 'inherit',
        fontSize: '1.2em',
        position: 'absolute',
        top: '5px',
        right: '10px',
        cursor: 'pointer',
        lineHeight: '1'
    });

    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;

    notification.appendChild(messageSpan);
    notification.appendChild(closeButton);

     Object.assign(notification.style, {
        position: 'relative',
        padding: '15px 40px 15px 20px',
        marginBottom: '10px',
        borderRadius: '4px',
        color: '#fff',
        opacity: '0',
        transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
        transform: 'translateX(100%)',
        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
        wordWrap: 'break-word',
        overflow: 'hidden'
     });

     switch (type) {
        case 'error': notification.style.backgroundColor = '#dc3545'; break;
        case 'success': notification.style.backgroundColor = '#28a745'; break;
        case 'warning': notification.style.backgroundColor = '#ffc107'; notification.style.color = '#212529'; break;
        default: notification.style.backgroundColor = '#0dcaf0'; break;
     }

    container.insertBefore(notification, container.firstChild);

     requestAnimationFrame(() => {
         notification.style.opacity = '0.95';
         notification.style.transform = 'translateX(0)';
     });

    const removeNotification = () => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(110%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
                if (container.children.length === 0 && container.parentNode) {
                    // container.remove(); // Opcional
                }
            }
        }, 300);
    };

    const removeTimeout = setTimeout(removeNotification, 6000);

     closeButton.onclick = () => {
         clearTimeout(removeTimeout);
         removeNotification();
     };
  }


  function showLoading(show, message = 'Carregando...') {
    if (typeof Utilities !== 'undefined' && Utilities.showLoading) {
      Utilities.showLoading(show, message);
      return;
    }

    const loaderId = 'global-loader-fallback';
    let loader = document.getElementById(loaderId);

    if (show) {
        if (!loader) {
            loader = document.createElement('div');
            loader.id = loaderId;
             Object.assign(loader.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(40, 40, 40, 0.7)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: '1060',
                color: 'white',
                textAlign: 'center',
                transition: 'opacity 0.2s ease-in-out',
                opacity: '0'
             });


            const spinner = document.createElement('div');
            spinner.className = 'loader-spinner-fallback';
             Object.assign(spinner.style, {
                 border: '4px solid rgba(255, 255, 255, 0.3)',
                 borderTop: '4px solid #ffffff',
                 borderRadius: '50%',
                 width: '40px',
                 height: '40px',
                 animation: 'spinFallback 0.8s linear infinite',
                 marginBottom: '15px'
             });


            const loaderMessageElement = document.createElement('p');
            loaderMessageElement.id = 'global-loader-message-fallback';
             Object.assign(loaderMessageElement.style, {
                 fontSize: '1em',
                 margin: '0',
                 padding: '0 10px',
                 fontFamily: 'sans-serif'
             });

            loader.appendChild(spinner);
            loader.appendChild(loaderMessageElement);
            document.body.appendChild(loader);

            if (!document.getElementById('spin-fallback-style')) {
                const style = document.createElement('style');
                style.id = 'spin-fallback-style';
                style.textContent = `
                    @keyframes spinFallback {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    .loader-spinner-fallback {}
                `;
                document.head.appendChild(style);
            }

             void loader.offsetWidth;
             loader.style.opacity = '1';
        }
        const messageElement = loader.querySelector('#global-loader-message-fallback');
        if (messageElement) messageElement.textContent = message;
        loader.style.display = 'flex';
    } else {
        if (loader) {
            loader.style.opacity = '0';
             setTimeout(() => {
                 const currentLoader = document.getElementById(loaderId);
                 if (currentLoader && currentLoader.parentNode) {
                     currentLoader.remove();
                 }
             }, 200);
        }
    }
  }

   // --- Filtros Inteligentes ---
   function createMaintenanceFilters() {
        const filterContainer = document.getElementById('maintenance-filter-buttons');
        if (!filterContainer) {
             console.warn("Container #maintenance-filter-buttons não encontrado. Filtros não serão criados.");
             return;
        }

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
        setupMaintenanceFilterListeners(); // <<< ESTA FUNÇÃO SERÁ SUBSTITUÍDA PELA ATUALIZAÇÃO 2

        // Adicionar estilos CSS inline se necessário
        addMaintenanceFilterStyles();
    }


    // =======================================================================================
    // == INÍCIO DA ATUALIZAÇÃO 2: setupMaintenanceFilterListeners ==
    // =======================================================================================
    function setupMaintenanceFilterListeners() {
      const applyBtn = document.getElementById('apply-maintenance-filter');
      const resetBtn = document.getElementById('reset-maintenance-filter');

      if (applyBtn) {
        applyBtn.addEventListener('click', function() {
          // Coleta os valores dos filtros
          const statusFilter = document.getElementById('maintenance-status-filter').value;
          const typeFilter = document.getElementById('maintenance-type-filter').value;
          const dateFrom = document.getElementById('maintenance-date-from').value;
          const dateTo = document.getElementById('maintenance-date-to').value;

          // Carrega a lista filtrada
          loadMaintenanceListWithFilters(statusFilter, typeFilter, dateFrom, dateTo);

          // Feedback visual SEM usar searchIcon (que está causando o erro)
          const originalText = applyBtn.textContent;
          applyBtn.textContent = "✓ Aplicado";
          applyBtn.disabled = true;
          setTimeout(() => {
            applyBtn.textContent = originalText;
            applyBtn.disabled = false;
          }, 1500); // Tempo de feedback reduzido para 1.5s
        });
      }

      if (resetBtn) {
        resetBtn.addEventListener('click', function() {
          // Resetar campos
          document.getElementById('maintenance-status-filter').value = 'all';
          document.getElementById('maintenance-type-filter').value = 'all';
          document.getElementById('maintenance-date-from').value = '';
          document.getElementById('maintenance-date-to').value = '';

          // Recarregar lista sem filtros
          loadMaintenanceListWithoutFilters();

          // Feedback visual
          const originalText = resetBtn.textContent;
          resetBtn.textContent = "✓ Limpo";
          resetBtn.disabled = true;
          setTimeout(() => {
            resetBtn.textContent = originalText;
            resetBtn.disabled = false;
          }, 1500);
        });
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
    // =======================================================================================
    // == FIM DA ATUALIZAÇÃO 2 ==
    // =======================================================================================


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
            .filter-label {
                font-weight: 500;
                font-size: 0.9em;
                color: #495057;
            }
            .filter-dropdown {
                padding: 6px 12px;
                border: 1px solid #ced4da;
                border-radius: 4px;
                background-color: #fff;
            }
            .date-separator {
                margin: 0 5px;
            }
            .filter-actions {
                display: flex;
                gap: 10px;
                margin-left: auto;
            }
            .smart-filter-toggle {
                padding: 6px 12px;
                background: #0052cc;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                transition: background-color 0.2s ease;
            }
            .smart-filter-toggle:hover:not(:disabled) {
                background: #0041a3;
            }
            .smart-filter-toggle:disabled {
                background: #a0c7e8;
                cursor: not-allowed;
            }
            .reset-button {
                background: #6c757d;
            }
            .reset-button:hover:not(:disabled) {
                background: #5a6268;
            }
            .reset-button:disabled {
                background: #adb5bd;
            }
            @media (max-width: 992px) {
                 .filter-actions {
                    margin-left: 0;
                    width: 100%;
                    justify-content: flex-start;
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
                    width: 100%;
                }
                .date-filter-group {
                     gap: 5px;
                 }
                 .date-separator {
                     text-align: center;
                     margin: 5px 0;
                 }
                .filter-actions {
                     flex-direction: column;
                     gap: 8px;
                 }
                .smart-filter-toggle {
                     width: 100%;
                 }
            }
            `;
            document.head.appendChild(styleEl);
        }
    }


  // API pública do módulo
  return {
    initialize,
    openMaintenanceForm,
    loadMaintenanceList,
    viewMaintenanceDetails,
    editMaintenance,
    verifyMaintenance,
    loadMaintenanceListWithFilters
  };
})();

// --- Inicialização ---
function initializeMaintenanceModule() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log("DOM carregado. Inicializando Maintenance...");
            if (window.API && window.Utilities) {
                 Maintenance.initialize();
            } else {
                 console.error("Falha na inicialização: Dependências API ou Utilities não encontradas no DOMContentLoaded.");
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
