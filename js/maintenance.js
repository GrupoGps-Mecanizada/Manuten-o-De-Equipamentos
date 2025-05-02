// Verificar dependências no início
if (!window.API || !window.Utilities) {
  console.error("Erro CRÍTICO: Dependências API ou Utilities não carregadas antes de maintenance.js");
} else {
  console.log("Maintenance.js - Dependências API e Utilities parecem carregadas.");
}

// Definir o módulo Maintenance com funcionalidade adaptada para o HTML existente
const Maintenance = (() => {
  // --- Variáveis Locais ---
  const EQUIPMENT_IDS = {
    'Alta Pressão': ["PUB-2G02","LUX-3201","FLX7617","EZS-8765","EZS-8764","EVK-0291"],
    'Auto Vácuo / Hiper Vácuo': ["PUB-2F80","NFF-0235","HJS-1097","FSA-3D71","EGC-2993"]
  };
  
  let formData = {};
  let isEditMode = false;
  let editingMaintenanceId = null;
  let fullMaintenanceList = [];
  
  // --- Função de Inicialização ---
  function initialize() {
    console.log("Maintenance.initialize() chamado.");
    
    // Configurar listeners básicos
    setupBasicListeners();
    
    // Carregar lista de manutenções
    loadMaintenanceList();
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
    
    // Botões de etapas
    const nextToStep2Btn = document.getElementById('next-to-step-2');
    if (nextToStep2Btn) {
      nextToStep2Btn.addEventListener('click', function() {
        console.log("Botão para próxima etapa (1->2) clicado");
        showStep(2);
      });
    }
    
    const backToStep1Btn = document.getElementById('back-to-step-1');
    if (backToStep1Btn) {
      backToStep1Btn.addEventListener('click', function() {
        showStep(1);
      });
    }
    
    const nextToStep3Btn = document.getElementById('next-to-step-3');
    if (nextToStep3Btn) {
      nextToStep3Btn.addEventListener('click', function() {
        console.log("Botão para próxima etapa (2->3) clicado");
        showStep(3);
      });
    }
    
    const backToStep2Btn = document.getElementById('back-to-step-2');
    if (backToStep2Btn) {
      backToStep2Btn.addEventListener('click', function() {
        showStep(2);
      });
    }
    
    // Botões de fechar modal
    const closeButtons = [
      document.getElementById('close-maintenance-form'),
      document.getElementById('cancel-maintenance')
    ];
    
    closeButtons.forEach(btn => {
      if (btn) {
        btn.addEventListener('click', closeForm);
      }
    });
    
    // Form submit
    const form = document.getElementById('maintenance-form');
    if (form) {
      form.addEventListener('submit', function(event) {
        event.preventDefault();
        console.log("Formulário submetido");
        // Aqui iria a lógica para salvar os dados
        closeForm();
      });
    } else {
      console.warn("Formulário #maintenance-form não encontrado!");
    }
    
    // Setup dos listeners para campos dinâmicos
    setupDynamicFieldListeners();
  }
  
  function setupDynamicFieldListeners() {
    // Listener para alteração de tipo de equipamento
    const equipTypeSelect = document.getElementById('equipment-type');
    if (equipTypeSelect) {
      equipTypeSelect.addEventListener('change', function(event) {
        const selectedType = this.value;
        console.log(`Tipo de equipamento alterado para: ${selectedType}`);
        
        handleEquipmentTypeChange(selectedType);
      });
    }
    
    // Listener para categoria de problema
    const problemCategorySelect = document.getElementById('problem-category');
    if (problemCategorySelect) {
      problemCategorySelect.addEventListener('change', function(event) {
        const selectedCategory = this.value;
        console.log(`Categoria de problema alterada para: ${selectedCategory}`);
        
        // Mostrar/esconder campo de "outro" baseado na seleção
        const otherCategoryField = document.getElementById('other-category-field');
        if (otherCategoryField) {
          otherCategoryField.style.display = selectedCategory === 'Outro' ? 'block' : 'none';
        }
      });
    }
  }
  
  function handleEquipmentTypeChange(selectedType) {
    // Campos que serão mostrados/escondidos
    const equipmentIdField = document.getElementById('equipment-id')?.closest('.form-col');
    const otherEquipmentField = document.getElementById('other-equipment-field');
    
    // Esconder todos os campos especiais primeiro
    if (otherEquipmentField) otherEquipmentField.style.display = 'none';
    
    // Mostrar campo apropriado baseado na seleção
    if (selectedType === 'Outro') {
      if (otherEquipmentField) otherEquipmentField.style.display = 'block';
    } else {
      // Carregar IDs específicos para o tipo selecionado
      populateEquipmentIds(selectedType);
    }
  }
  
  function populateEquipmentIds(selectedType) {
    const equipmentIdSelect = document.getElementById('equipment-id');
    if (!equipmentIdSelect) return;
    
    // Limpar opções atuais
    equipmentIdSelect.innerHTML = '<option value="">Selecione o equipamento...</option>';
    
    // Se não há tipo selecionado ou é "Outro", parar aqui
    if (!selectedType || selectedType === 'Outro') {
      equipmentIdSelect.disabled = true;
      return;
    }
    
    // Obter IDs para o tipo selecionado
    const ids = EQUIPMENT_IDS[selectedType] || [];
    
    if (ids.length > 0) {
      // Adicionar opções ao select
      ids.forEach(id => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = id;
        equipmentIdSelect.appendChild(option);
      });
      
      equipmentIdSelect.disabled = false;
    } else {
      console.warn(`Nenhum ID disponível para tipo: ${selectedType}`);
      equipmentIdSelect.disabled = true;
    }
  }
  
  // --- Funções de UI ---
  function showStep(step) {
    console.log(`Tentando mostrar etapa ${step}`);
    
    // *** CORRIGIDO: Usar os IDs corretos do HTML ***
    // Obter todas as etapas
    const steps = [
      document.getElementById('step-1-content'),
      document.getElementById('step-2-content'),
      document.getElementById('step-3-content')
    ];
    
    // Verificar se todas as etapas existem
    if (steps.some(s => !s)) {
      console.error("Um ou mais elementos de etapa não foram encontrados!");
      console.log("Etapas encontradas:", steps.map(s => s ? s.id : 'não encontrado'));
      return;
    }
    
    // Esconder todas as etapas
    steps.forEach(s => {
      if (s) s.style.display = 'none';
    });
    
    // Mostrar apenas a etapa solicitada
    if (step >= 1 && step <= 3 && steps[step - 1]) {
      steps[step - 1].style.display = 'block';
      console.log(`Etapa ${step} mostrada com sucesso`);
      
      // Atualizar indicadores de etapa
      updateStepIndicators(step);
    } else {
      console.error(`Etapa inválida: ${step}`);
    }
  }
  
  function updateStepIndicators(currentStep) {
    const indicators = document.querySelectorAll('.form-step');
    indicators.forEach((indicator, index) => {
      if (index + 1 === currentStep) {
        indicator.classList.add('active');
      } else {
        indicator.classList.remove('active');
      }
    });
  }
  
  function openMaintenanceForm(maintenanceId = null, data = null) {
    console.log("Abrindo formulário de manutenção");
    
    // Reset do formulário
    resetForm();
    
    // Configurar modo de edição se necessário
    if (maintenanceId && data) {
      isEditMode = true;
      editingMaintenanceId = maintenanceId;
      // Aqui iria o código para preencher o formulário com os dados existentes
    } else {
      isEditMode = false;
      editingMaintenanceId = null;
    }
    
    // *** CORRIGIDO: Usar o ID correto do overlay do formulário ***
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
  
  function closeForm() {
    console.log("Fechando formulário");
    
    // *** CORRIGIDO: Usar o ID correto do overlay do formulário ***
    const modal = document.getElementById('maintenance-form-overlay');
    if (modal) {
      modal.style.display = 'none';
      resetForm();
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
    }
    
    // Limpar estados
    isEditMode = false;
    editingMaintenanceId = null;
    formData = {};
    
    // Esconder campos condicionais
    const otherEquipmentField = document.getElementById('other-equipment-field');
    if (otherEquipmentField) otherEquipmentField.style.display = 'none';
    
    const otherCategoryField = document.getElementById('other-category-field');
    if (otherCategoryField) otherCategoryField.style.display = 'none';
    
    // Voltar para primeira etapa
    showStep(1);
  }
  
  // --- Funções de Dados ---
  function loadMaintenanceList() {
    console.log("Carregando lista de manutenções...");
    
    // Indicador de carregamento
    const tableBody = document.getElementById('maintenance-tbody');
    if (tableBody) {
      tableBody.innerHTML = '<tr><td colspan="10" class="text-center">Carregando...</td></tr>';
    }
    
    // Chamar API para obter dados
    if (window.API && typeof API.getMaintenanceList === 'function') {
      API.getMaintenanceList()
        .then(response => {
          if (response && response.success && Array.isArray(response.maintenances)) {
            fullMaintenanceList = response.maintenances;
            renderMaintenanceTable(fullMaintenanceList);
          } else {
            console.error("Erro ao carregar manutenções:", response);
            if (tableBody) {
              tableBody.innerHTML = '<tr><td colspan="10" class="text-center error-message">Erro ao carregar dados.</td></tr>';
            }
          }
        })
        .catch(error => {
          console.error("Falha ao buscar manutenções:", error);
          if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="10" class="text-center error-message">Falha ao buscar dados.</td></tr>';
          }
        });
    } else {
      console.error("API.getMaintenanceList não disponível");
      if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="10" class="text-center error-message">API não disponível.</td></tr>';
      }
    }
  }
  
  function renderMaintenanceTable(maintenances) {
    console.log(`Renderizando tabela com ${maintenances.length} manutenções`);
    
    const tableBody = document.getElementById('maintenance-tbody');
    if (!tableBody) {
      console.error("Elemento #maintenance-tbody não encontrado!");
      return;
    }
    
    // Limpar tabela
    tableBody.innerHTML = '';
    
    // Se não há dados, mostrar mensagem
    if (!maintenances || maintenances.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="10" class="text-center">Nenhuma manutenção encontrada.</td></tr>';
      return;
    }
    
    // Renderizar cada linha
    maintenances.forEach(item => {
      const row = document.createElement('tr');
      
      // Simplificação extrema do HTML da linha
      row.innerHTML = `
        <td>${item.id || '-'}</td>
        <td>${item.tipoEquipamento || '-'} (${item.placaOuId || '-'})</td>
        <td>${item.tipoManutencao || '-'}</td>
        <td>${formatDate(item.dataRegistro) || '-'}</td>
        <td>${item.responsavel || '-'}</td>
        <td>${item.area || '-'}</td>
        <td>${item.localOficina || '-'}</td>
        <td>${item.categoriaProblema || '-'}</td>
        <td><span class="status-badge status-${getStatusClass(item.status)}">${item.status || 'Pendente'}</span></td>
        <td>
          <button class="btn-icon view-maintenance" data-id="${item.id}" title="Ver Detalhes">👁️</button>
          <button class="btn-icon edit-maintenance" data-id="${item.id}" title="Editar">✏️</button>
          <button class="btn-icon verify-maintenance" data-id="${item.id}" title="Verificar">✔️</button>
        </td>
      `;
      
      tableBody.appendChild(row);
    });
    
    // Configurar listeners para ações na tabela
    setupTableActionListeners();
  }
  
  function setupTableActionListeners() {
    const tableBody = document.getElementById('maintenance-tbody');
    if (!tableBody) return;
    
    // Usar delegação de eventos
    tableBody.addEventListener('click', function(event) {
      const button = event.target.closest('.btn-icon');
      if (!button) return;
      
      const maintenanceId = button.getAttribute('data-id');
      if (!maintenanceId) return;
      
      if (button.classList.contains('view-maintenance')) {
        console.log(`Visualizar manutenção: ${maintenanceId}`);
        viewMaintenanceDetails(maintenanceId);
      } else if (button.classList.contains('edit-maintenance')) {
        console.log(`Editar manutenção: ${maintenanceId}`);
        editMaintenance(maintenanceId);
      } else if (button.classList.contains('verify-maintenance')) {
        console.log(`Verificar manutenção: ${maintenanceId}`);
        verifyMaintenance(maintenanceId);
      }
    });
  }
  
  function viewMaintenanceDetails(id) {
    // Buscar dados da manutenção
    const maintenanceData = findMaintenanceById(id);
    
    if (!maintenanceData) {
      if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
        Utilities.showNotification("Erro: Dados da manutenção não encontrados.", "error");
      } else {
        alert("Erro: Dados da manutenção não encontrados.");
      }
      return;
    }
    
    // Exibir detalhes (simplificado)
    if (typeof Utilities !== 'undefined' && Utilities.viewMaintenanceDetails) {
      Utilities.viewMaintenanceDetails(id, maintenanceData);
    } else {
      alert(`Detalhes da manutenção ${id} seriam mostrados aqui.`);
    }
  }
  
  function editMaintenance(id) {
    // Buscar dados da manutenção
    const maintenanceData = findMaintenanceById(id);
    
    if (!maintenanceData) {
      if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
        Utilities.showNotification("Erro: Dados da manutenção não encontrados para edição.", "error");
      } else {
        alert("Erro: Dados da manutenção não encontrados para edição.");
      }
      return;
    }
    
    // Abrir formulário no modo de edição
    openMaintenanceForm(id, maintenanceData);
  }
  
  function verifyMaintenance(id) {
    // Buscar dados da manutenção
    const maintenanceData = findMaintenanceById(id);
    
    if (!maintenanceData) {
      if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
        Utilities.showNotification("Erro: Dados da manutenção não encontrados para verificação.", "error");
      } else {
        alert("Erro: Dados da manutenção não encontrados para verificação.");
      }
      return;
    }
    
    // Verificar se há módulo de verificação
    if (typeof Verification !== 'undefined' && Verification.openVerificationForm) {
      Verification.openVerificationForm(id, maintenanceData);
    } else {
      alert(`Verificação da manutenção ${id} seria iniciada aqui.`);
    }
  }
  
  function findMaintenanceById(id) {
    return fullMaintenanceList.find(item => item.id === id);
  }
  
  // --- Funções Utilitárias ---
  function formatDate(dateString) {
    if (!dateString) return '-';
    
    if (typeof Utilities !== 'undefined' && Utilities.formatDate) {
      return Utilities.formatDate(dateString);
    }
    
    // Implementação básica
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch(e) {
      return dateString;
    }
  }
  
  function getStatusClass(status) {
    if (!status) return 'default';
    
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('pendente') || statusLower.includes('aguardando')) {
      return 'pending';
    } else if (statusLower.includes('verificado')) {
      return 'verified';
    } else if (statusLower.includes('concluído') || statusLower.includes('concluido')) {
      return 'completed';
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
