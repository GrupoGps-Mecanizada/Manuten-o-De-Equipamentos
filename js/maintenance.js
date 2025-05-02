/**
 * Sistema de Dupla Checagem de Manutenção
 * Módulo: Formulário de Manutenção (Redesenhado)
 */

const MaintenanceForm = (() => {
  // Variáveis privadas
  let formData = null;
  let currentStep = 1;
  
  // Inicializar formulário
  function initialize() {
    setupEventListeners();
    
    // Carregar dados do formulário (tipos de equipamento, categorias de problemas, etc.)
    getFormData();
  }
  
  // Configurar event listeners
  function setupEventListeners() {
    // Botão de nova manutenção
    document.getElementById('new-maintenance').addEventListener('click', openMaintenanceForm);
    
    // Fechar formulário
    document.getElementById('close-maintenance-form').addEventListener('click', function() {
      if (hasUnsavedChanges() && !confirm('Existem dados não salvos. Deseja realmente cancelar?')) {
        return;
      }
      closeMaintenanceForm();
    });
    
    document.getElementById('cancel-maintenance').addEventListener('click', function() {
      if (hasUnsavedChanges() && !confirm('Existem dados não salvos. Deseja realmente cancelar?')) {
        return;
      }
      closeMaintenanceForm();
    });
    
    // Navegação entre etapas
    document.getElementById('next-to-step-2').addEventListener('click', function() {
      if (validateFormStep(1)) {
        goToFormStep(2);
      }
    });
    
    document.getElementById('back-to-step-1').addEventListener('click', function() {
      goToFormStep(1);
    });
    
    document.getElementById('next-to-step-3').addEventListener('click', function() {
      if (validateFormStep(2)) {
        goToFormStep(3);
      }
    });
    
    document.getElementById('back-to-step-2').addEventListener('click', function() {
      goToFormStep(2);
    });
    
    // Submissão do formulário
    document.getElementById('maintenance-form').addEventListener('submit', function(e) {
      e.preventDefault();
      if (validateFormStep(3)) {
        submitMaintenance();
      }
    });
    
    // Alternar tipo de equipamento (atualizar lista de equipamentos disponíveis)
    document.getElementById('equipment-type').addEventListener('change', updateEquipmentOptions);
    
    // Alternar área (mostrar campo de Oficina)
    document.getElementById('area').addEventListener('change', function() {
      const officeField = document.getElementById('office-field');
      if (this.value) {
        officeField.style.display = 'block';
      } else {
        officeField.style.display = 'none';
      }
    });
    
    // Escolher outra categoria de problema
    document.getElementById('problem-category').addEventListener('change', function() {
      const otherCategoryField = document.getElementById('other-category-field');
      if (this.value === 'Outro') {
        otherCategoryField.style.display = 'block';
      } else {
        otherCategoryField.style.display = 'none';
      }
    });
  }
  
  // Abrir formulário de manutenção
  function openMaintenanceForm() {
    resetMaintenanceForm();
    document.getElementById('maintenance-form-overlay').style.display = 'block';
    goToFormStep(1);
  }
  
  // Fechar formulário de manutenção
  function closeMaintenanceForm() {
    document.getElementById('maintenance-form-overlay').style.display = 'none';
    resetMaintenanceForm();
  }
  
  // Resetar formulário de manutenção
  function resetMaintenanceForm() {
    const form = document.getElementById('maintenance-form');
    if (form) form.reset();
    currentStep = 1;
    
    // Resetar campos específicos
    const today = new Date();
    const dateInput = document.getElementById('maintenance-date');
    if (dateInput) {
      try { 
        dateInput.valueAsDate = today; 
      } catch(e) { 
        dateInput.value = today.toISOString().split('T')[0];
      }
    }
    
    // Remover classes de erro
    form.querySelectorAll('.form-control.is-invalid').forEach(el => 
      el.classList.remove('is-invalid')
    );
    form.querySelectorAll('input[style*="border-color: red"], select[style*="border-color: red"], textarea[style*="border-color: red"]').forEach(el => 
      el.style.borderColor = ''
    );
    
    // Esconder campos condicionais
    document.getElementById('office-field').style.display = 'none';
    document.getElementById('other-category-field').style.display = 'none';
    
    // Resetar visualização das etapas
    goToFormStep(1);
  }
  
  // Navegar para uma etapa do formulário
  function goToFormStep(step) {
    currentStep = step;
    
    // Ocultar todos os conteúdos de etapa
    document.querySelectorAll('#maintenance-form .form-step-content').forEach(content => {
      content.style.display = 'none';
    });
    
    // Atualizar indicadores visuais de etapa
    document.querySelectorAll('#maintenance-form-overlay .form-step').forEach(stepEl => {
      const stepNum = parseInt(stepEl.getAttribute('data-step'));
      stepEl.classList.remove('active', 'completed');
      if (stepNum === step) {
        stepEl.classList.add('active');
      } else if (stepNum < step) {
        stepEl.classList.add('completed');
      }
    });
    
    // Mostrar o conteúdo da etapa atual
    const contentId = `step-${step}-content`;
    const stepContentElement = document.getElementById(contentId);
    if (stepContentElement) {
      stepContentElement.style.display = 'block';
      
      // Focar no primeiro campo da etapa
      const firstInput = stepContentElement.querySelector('input:not([type=hidden]):not([type=button]):not([type=submit]):not([type=reset]):not([disabled]), select:not([disabled]), textarea:not([disabled])');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 50);
      }
    } else {
      console.error(`Elemento de conteúdo da etapa ${contentId} não encontrado.`);
    }
  }
  
  // Carregar dados do formulário (listas de opções)
  function getFormData() {
    showLoading(true, 'Carregando dados do formulário...');
    
    API.getMaintenanceFormData()
      .then(response => {
        if (response.success && response.formData) {
          formData = response.formData;
          updateFormOptions();
        } else {
          console.error("Erro ao carregar dados do formulário:", response);
          showNotification("Erro ao carregar dados do formulário", "error");
        }
      })
      .catch(error => {
        console.error("Erro ao carregar dados do formulário:", error);
        showNotification("Erro ao carregar dados do formulário: " + error.message, "error");
      })
      .finally(() => {
        showLoading(false);
      });
  }
  
  // Atualizar as opções nos selects do formulário
  function updateFormOptions() {
    if (!formData) return;
    
    // Preencher tipo de equipamento
    const tipoEquipeSelect = document.getElementById('equipment-type');
    clearSelectOptions(tipoEquipeSelect);
    addSelectOption(tipoEquipeSelect, "", "Selecione o tipo de equipamento...");
    
    if (formData.opcoesTipoEquipe && formData.opcoesTipoEquipe.length) {
      formData.opcoesTipoEquipe.forEach(tipo => {
        addSelectOption(tipoEquipeSelect, tipo, tipo);
      });
    }
    
    // Preencher tipo de manutenção
    const tipoManutencaoSelect = document.getElementById('maintenance-type');
    clearSelectOptions(tipoManutencaoSelect);
    addSelectOption(tipoManutencaoSelect, "", "Selecione o tipo de manutenção...");
    
    if (formData.opcoesTipoManutencao && formData.opcoesTipoManutencao.length) {
      formData.opcoesTipoManutencao.forEach(tipo => {
        addSelectOption(tipoManutencaoSelect, tipo, tipo);
      });
    }
    
    // Preencher área (interna/externa)
    const areaSelect = document.getElementById('area');
    clearSelectOptions(areaSelect);
    addSelectOption(areaSelect, "", "Selecione a área...");
    
    if (formData.opcoesArea && formData.opcoesArea.length) {
      formData.opcoesArea.forEach(area => {
        addSelectOption(areaSelect, area, area);
      });
    }
    
    // Preencher categoria de problema
    const categoriaProbSelect = document.getElementById('problem-category');
    clearSelectOptions(categoriaProbSelect);
    addSelectOption(categoriaProbSelect, "", "Selecione a categoria do problema...");
    
    if (formData.categoriaProblema && formData.categoriaProblema.length) {
      formData.categoriaProblema.forEach(categoria => {
        addSelectOption(categoriaProbSelect, categoria, categoria);
      });
    }
    
    // Atualizar as opções de equipamento com base no tipo selecionado
    updateEquipmentOptions();
  }
  
  // Atualizar opções de equipamento com base no tipo selecionado
  function updateEquipmentOptions() {
    if (!formData) return;
    
    const equipmentTypeSelect = document.getElementById('equipment-type');
    const equipmentIdSelect = document.getElementById('equipment-id');
    const selectedType = equipmentTypeSelect.value;
    
    clearSelectOptions(equipmentIdSelect);
    addSelectOption(equipmentIdSelect, "", "Selecione o equipamento...");
    
    if (selectedType === 'Alta Pressão') {
      if (formData.equipamentosAltaPressao && formData.equipamentosAltaPressao.length) {
        formData.equipamentosAltaPressao.forEach(equip => {
          addSelectOption(equipmentIdSelect, equip, equip);
        });
      }
    } else if (selectedType === 'Auto Vácuo / Hiper Vácuo') {
      if (formData.equipamentosVacuo && formData.equipamentosVacuo.length) {
        formData.equipamentosVacuo.forEach(equip => {
          addSelectOption(equipmentIdSelect, equip, equip);
        });
      }
    }
    
    // Mostrar campo "Outro Equipamento" se "OUTRO EQUIPAMENTO" estiver selecionado
    const otherEquipmentField = document.getElementById('other-equipment-field');
    equipmentIdSelect.addEventListener('change', function() {
      if (this.value === 'OUTRO EQUIPAMENTO') {
        otherEquipmentField.style.display = 'block';
      } else {
        otherEquipmentField.style.display = 'none';
      }
    });
  }
  
  // Validar uma etapa do formulário
  function validateFormStep(step) {
    let isValid = true;
    let firstInvalidField = null;
    
    if (step === 1) {
      // Validar Etapa 1: Informações Básicas
      const fieldsToValidate = [
        'equipment-type',
        'equipment-id',
        'technician-name',
        'maintenance-date',
        'area',
        'office',
        'maintenance-type'
      ];
      
      fieldsToValidate.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
          // Verificar se o campo está vazio ou contém apenas espaços
          if (!input.value.trim()) {
            input.style.borderColor = 'red';
            isValid = false;
            if (!firstInvalidField) {
              firstInvalidField = input;
            }
          } else {
            input.style.borderColor = '';
          }
        }
      });
      
      // Validação de campo "outro equipamento" se "OUTRO EQUIPAMENTO" está selecionado
      if (document.getElementById('equipment-id').value === 'OUTRO EQUIPAMENTO') {
        const otherEquipInput = document.getElementById('other-equipment');
        if (!otherEquipInput.value.trim()) {
          otherEquipInput.style.borderColor = 'red';
          isValid = false;
          if (!firstInvalidField) {
            firstInvalidField = otherEquipInput;
          }
        } else {
          otherEquipInput.style.borderColor = '';
        }
      }
    } else if (step === 2) {
      // Validar Etapa 2: Problema
      const fieldsToValidate = [
        'problem-category',
        'problem-description'
      ];
      
      fieldsToValidate.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
          if (!input.value.trim()) {
            input.style.borderColor = 'red';
            isValid = false;
            if (!firstInvalidField) {
              firstInvalidField = input;
            }
          } else {
            input.style.borderColor = '';
          }
        }
      });
      
      // Validação de "outra categoria" se "Outro" está selecionado
      if (document.getElementById('problem-category').value === 'Outro') {
        const otherCategoryInput = document.getElementById('other-category');
        if (!otherCategoryInput.value.trim()) {
          otherCategoryInput.style.borderColor = 'red';
          isValid = false;
          if (!firstInvalidField) {
            firstInvalidField = otherCategoryInput;
          }
        } else {
          otherCategoryInput.style.borderColor = '';
        }
      }
    } else if (step === 3) {
      // Etapa 3: Final (não há campos obrigatórios na etapa 3 após remoção de imagens)
      isValid = true;
    }
    
    if (!isValid) {
      showNotification('Por favor, preencha todos os campos obrigatórios (*).', 'error');
      if (firstInvalidField) {
        firstInvalidField.focus();
      }
    }
    
    return isValid;
  }
  
  // Verificar se há dados não salvos
  function hasUnsavedChanges() {
    // Verifica se algum campo obrigatório foi preenchido
    return document.getElementById('equipment-id').value !== '' ||
           document.getElementById('technician-name').value !== '' ||
           document.getElementById('problem-description').value !== '';
  }
  
  // Enviar formulário de manutenção
  function submitMaintenance() {
    showLoading(true, 'Registrando manutenção...');
    
    // Preparar dados do formulário
    let maintenanceData = {
      equipmentId: document.getElementById('equipment-id').value,
      equipmentType: document.getElementById('equipment-type').value,
      technician: document.getElementById('technician-name').value,
      date: document.getElementById('maintenance-date').value,
      area: document.getElementById('area').value,
      location: document.getElementById('office').value,
      maintenanceType: document.getElementById('maintenance-type').value,
      isCritical: document.getElementById('is-critical').checked,
      problemCategory: document.getElementById('problem-category').value,
      problemDescription: document.getElementById('problem-description').value,
      additionalNotes: document.getElementById('additional-notes').value || ""
    };
    
    // Tratar campos condicionais
    if (maintenanceData.equipmentId === 'OUTRO EQUIPAMENTO') {
      maintenanceData.equipmentId = document.getElementById('other-equipment').value;
    }
    
    if (maintenanceData.problemCategory === 'Outro') {
      maintenanceData.problemCategory = document.getElementById('other-category').value;
    }
    
    // Enviar dados para API
    API.saveMaintenance(maintenanceData)
      .then(response => {
        if (response.success) {
          showNotification('Manutenção registrada com sucesso! ID: ' + response.id, 'success');
          closeMaintenanceForm();
          
          // Atualizar dados do dashboard ou lista de manutenções, dependendo da aba atual
          if (currentTab === 'dashboard') {
            Dashboard.loadDashboardData();
          } else if (currentTab === 'maintenance') {
            // Se estiver implementado, chamar função para atualizar lista de manutenções
            if (typeof MaintenanceList !== 'undefined' && MaintenanceList.loadMaintenanceData) {
              MaintenanceList.loadMaintenanceData();
            }
          }
        } else {
          console.error("Erro ao registrar manutenção:", response);
          showNotification('Erro ao registrar manutenção: ' + response.message, 'error');
        }
      })
      .catch(error => {
        console.error("Erro ao enviar formulário:", error);
        showNotification('Erro ao registrar manutenção: ' + error.message, 'error');
      })
      .finally(() => {
        showLoading(false);
      });
  }
  
  // Funções auxiliares
  function clearSelectOptions(selectElement) {
    if (!selectElement) return;
    while (selectElement.options.length > 0) {
      selectElement.remove(0);
    }
  }
  
  function addSelectOption(selectElement, value, text) {
    if (!selectElement) return;
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    selectElement.add(option);
  }
  
  // API pública
  return {
    initialize,
    openMaintenanceForm,
    closeMaintenanceForm,
    getFormData
  };
})();

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  MaintenanceForm.initialize();
});
