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
  
  function initialize() {
    setupEventListeners();
    loadEquipmentTypes();
    loadProblemCategories();
  }
  
  function setupEventListeners() {
    // Botão nova manutenção
    document.getElementById('new-maintenance').addEventListener('click', function() {
      resetForm();
      document.getElementById('maintenance-form-overlay').style.display = 'block';
    });
    
    // Navegação entre etapas
    document.getElementById('next-to-step-2').addEventListener('click', function() {
      if (validateStep1()) {
        saveStep1Data();
        showStep(2);
      }
    });
    
    document.getElementById('back-to-step-1').addEventListener('click', function() {
      showStep(1);
    });
    
    document.getElementById('next-to-step-3').addEventListener('click', function() {
      if (validateStep2()) {
        saveStep2Data();
        updateSummary(); // Atualiza o resumo com TODOS os dados
        showStep(3);
      }
    });
    
    document.getElementById('back-to-step-2').addEventListener('click', function() {
      showStep(2);
    });
    
    // Fechar formulário
    document.getElementById('close-maintenance-form').addEventListener('click', function() {
      if (confirm('Tem certeza que deseja cancelar o registro?')) {
        document.getElementById('maintenance-form-overlay').style.display = 'none';
      }
    });
    
    document.getElementById('cancel-maintenance').addEventListener('click', function() {
      if (confirm('Tem certeza que deseja cancelar o registro?')) {
        document.getElementById('maintenance-form-overlay').style.display = 'none';
      }
    });
    
    // Submit do formulário
    document.getElementById('maintenance-form').addEventListener('submit', function(e) {
      e.preventDefault();
      submitMaintenance();
    });
    
    // Campo "Outro equipamento"
    document.getElementById('equipment-type').addEventListener('change', function() {
      const otherField = document.getElementById('other-equipment-field');
      otherField.style.display = this.value === 'Outro' ? 'block' : 'none';
    });
    
    // Campo "Outra categoria"
    document.getElementById('problem-category').addEventListener('change', function() {
      const otherField = document.getElementById('other-category-field');
      otherField.style.display = this.value === 'Outro' ? 'block' : 'none';
    });
  }
  
  function loadEquipmentTypes() {
    API.getEquipmentTypes()
      .then(response => {
        if (response.success) {
          const select = document.getElementById('equipment-type');
          select.innerHTML = '<option value="">Selecione o tipo...</option>';
          
          response.types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            select.appendChild(option);
          });
        }
      })
      .catch(error => {
        console.error("Erro ao carregar tipos de equipamento:", error);
      });
  }
  
  function loadProblemCategories() {
    API.getProblemCategories()
      .then(response => {
        if (response.success) {
          const select = document.getElementById('problem-category');
          select.innerHTML = '<option value="">Selecione a categoria...</option>';
          
          response.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
          });
        }
      })
      .catch(error => {
        console.error("Erro ao carregar categorias de problema:", error);
      });
  }
  
  function showStep(step) {
    // Atualizar indicadores de etapa
    document.querySelectorAll('.form-step').forEach(el => {
      el.classList.remove('active');
    });
    document.querySelector(`.form-step[data-step="${step}"]`).classList.add('active');
    
    // Mostrar conteúdo da etapa
    document.querySelectorAll('.form-step-content').forEach(el => {
      el.style.display = 'none';
    });
    document.getElementById(`step-${step}-content`).style.display = 'block';
  }
  
  function validateStep1() {
    let isValid = true;
    
    // Validar campos
    const requiredFields = [
      { id: 'equipment-type', name: 'Tipo de Equipamento' },
      { id: 'technician-name', name: 'Responsável' },
      { id: 'maintenance-date', name: 'Data da Manutenção' },
      { id: 'area', name: 'Área' },
      { id: 'maintenance-type', name: 'Tipo de Manutenção' }
    ];
    
    // Se o tipo for "Outro", o campo equipment-id não é obrigatório
    const equipType = document.getElementById('equipment-type').value;
    if (equipType && equipType !== 'Outro') {
      requiredFields.push({ id: 'equipment-id', name: 'Placa ou ID' });
    } else if (equipType === 'Outro') {
      requiredFields.push({ id: 'other-equipment', name: 'Especificar Equipamento' });
    }
    
    let firstInvalid = null;
    
    requiredFields.forEach(field => {
      const element = document.getElementById(field.id);
      if (!element.value.trim()) {
        element.style.borderColor = 'red';
        isValid = false;
        if (!firstInvalid) firstInvalid = element;
      } else {
        element.style.borderColor = '';
      }
    });
    
    // Validar campos especiais
    const isCritical = document.getElementById('is-critical').checked;
    
    if (!isValid) {
      showNotification("Por favor, preencha todos os campos obrigatórios.", "error");
      if (firstInvalid) {
        firstInvalid.focus();
      }
    }
    
    return isValid;
  }
  
  function validateStep2() {
    let isValid = true;
    let firstInvalid = null;
    
    // Validar categoria de problema
    const categoryField = document.getElementById('problem-category');
    if (!categoryField.value) {
      categoryField.style.borderColor = 'red';
      isValid = false;
      firstInvalid = categoryField;
    } else {
      categoryField.style.borderColor = '';
    }
    
    // Se categoria for 'Outro', validar campo adicional
    if (categoryField.value === 'Outro') {
      const otherCategory = document.getElementById('other-category');
      if (!otherCategory.value.trim()) {
        otherCategory.style.borderColor = 'red';
        isValid = false;
        if (!firstInvalid) firstInvalid = otherCategory;
      } else {
        otherCategory.style.borderColor = '';
      }
    }
    
    // Validar descrição do problema
    const description = document.getElementById('problem-description');
    if (!description.value.trim()) {
      description.style.borderColor = 'red';
      isValid = false;
      if (!firstInvalid) firstInvalid = description;
    } else {
      description.style.borderColor = '';
    }
    
    if (!isValid) {
      showNotification("Por favor, preencha todos os campos obrigatórios.", "error");
      if (firstInvalid) {
        firstInvalid.focus();
      }
    }
    
    return isValid;
  }
  
  function saveStep1Data() {
    formData.equipmentType = document.getElementById('equipment-type').value;
    formData.equipmentId = document.getElementById('equipment-id').value;
    formData.otherEquipment = document.getElementById('other-equipment').value;
    formData.technician = document.getElementById('technician-name').value;
    formData.date = document.getElementById('maintenance-date').value;
    formData.area = document.getElementById('area').value;
    formData.office = document.getElementById('office').value;
    formData.maintenanceType = document.getElementById('maintenance-type').value;
    formData.isCritical = document.getElementById('is-critical').checked;
  }
  
  function saveStep2Data() {
    formData.problemCategory = document.getElementById('problem-category').value;
    formData.otherCategory = document.getElementById('other-category').value;
    formData.problemDescription = document.getElementById('problem-description').value;
    formData.additionalNotes = document.getElementById('additional-notes').value;
  }
  
  function updateSummary() {
    // Equipamento
    let equipmentDisplay = '';
    if (formData.equipmentType === 'Outro') {
      equipmentDisplay = formData.otherEquipment || '-';
    } else {
      equipmentDisplay = formData.equipmentType + ' (' + (formData.equipmentId || 'Sem ID') + ')';
    }
    document.getElementById('summary-equipment').textContent = equipmentDisplay;
    
    // Responsável
    document.getElementById('summary-technician').textContent = formData.technician || '-';
    
    // Data
    const dateObj = formData.date ? new Date(formData.date) : null;
    const formattedDate = dateObj ? formatDate(dateObj) : '-';
    document.getElementById('summary-date').textContent = formattedDate;
    
    // Local
    const location = `${formData.area || '-'} / ${formData.office || '-'}`;
    document.getElementById('summary-location').textContent = location;
    
    // Tipo
    document.getElementById('summary-type').textContent = formData.maintenanceType || '-';
    
    // É Crítica
    document.getElementById('summary-critical').textContent = formData.isCritical ? 'Sim' : 'Não';
    
    // Categoria de Problema
    let categoryDisplay = '';
    if (formData.problemCategory === 'Outro') {
      categoryDisplay = formData.otherCategory || '-';
    } else {
      categoryDisplay = formData.problemCategory || '-';
    }
    document.getElementById('summary-category').textContent = categoryDisplay;
    
    // Detalhes do Problema
    document.getElementById('summary-problem').textContent = formData.problemDescription || '-';
    
    // Observações
    document.getElementById('summary-notes').textContent = formData.additionalNotes || '-';
  }
  
  function resetForm() {
    // Limpar dados do formulário
    formData = {
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
    
    // Resetar campos do formulário
    document.getElementById('maintenance-form').reset();
    
    // Esconder campos condicionais
    document.getElementById('other-equipment-field').style.display = 'none';
    document.getElementById('other-category-field').style.display = 'none';
    
    // Redefinir bordas de validação
    document.querySelectorAll('.form-control').forEach(el => {
      el.style.borderColor = '';
    });
    
    // Voltar para etapa 1
    showStep(1);
  }
  
  function submitMaintenance() {
    showLoading(true, 'Registrando manutenção...');
    
    // Construir dados para API
    const apiData = {
      tipoEquipamento: formData.equipmentType,
      placaOuId: formData.equipmentType === 'Outro' ? formData.otherEquipment : formData.equipmentId,
      responsavel: formData.technician,
      dataManutencao: formData.date,
      area: formData.area,
      localOficina: formData.office,
      tipoManutencao: formData.maintenanceType,
      eCritico: formData.isCritical,
      categoriaProblema: formData.problemCategory === 'Outro' ? formData.otherCategory : formData.problemCategory,
      detalhesproblema: formData.problemDescription,
      observacoes: formData.additionalNotes,
      status: 'Pendente'
    };
    
    API.saveMaintenance(apiData)
      .then(response => {
        if (response.success) {
          showNotification('Manutenção registrada com sucesso! ID: ' + response.id, 'success');
          document.getElementById('maintenance-form-overlay').style.display = 'none';
          
          // Atualizar dashboard se estiver visível
          if (document.getElementById('tab-dashboard').classList.contains('active')) {
            if (typeof Dashboard !== 'undefined' && Dashboard.loadDashboardData) {
              Dashboard.loadDashboardData();
            }
          }
          
          // Atualizar lista de manutenções se estiver visível
          if (document.getElementById('tab-maintenance').classList.contains('active')) {
            loadMaintenanceList();
          }
        } else {
          console.error("Erro ao salvar manutenção:", response);
          showNotification('Erro ao salvar: ' + (response.message || 'Erro desconhecido'), 'error');
        }
      })
      .catch(error => {
        console.error("Erro na requisição:", error);
        showNotification('Falha na requisição: ' + error.message, 'error');
      })
      .finally(() => {
        showLoading(false);
      });
  }
  
  return {
    initialize
  };
})();

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  Maintenance.initialize();
});
