// Verificar dependências no início
if (!window.API || !window.Utilities) {
  console.error("Erro CRÍTICO: Dependências API ou Utilities não carregadas antes de maintenance.js");
} else {
  console.log("Maintenance.js - Dependências API e Utilities parecem carregadas.");
}

// Definir o módulo Maintenance com funcionalidade mínima para operar
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
    }
  }
  
  // --- Funções de UI ---
  function showStep(step) {
    console.log(`Tentando mostrar etapa ${step}`);
    
    // Obter todas as etapas
    const steps = [
      document.getElementById('step-1'),
      document.getElementById('step-2'),
      document.getElementById('step-3')
    ];
    
    // Verificar se todas as etapas existem
    if (steps.some(s => !s)) {
      console.error("Um ou mais elementos de etapa não foram encontrados!");
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
    } else {
      console.error(`Etapa inválida: ${step}`);
    }
    
    // Atualizar indicadores visuais (se existirem)
    const indicators = document.querySelectorAll('.step-indicator');
    indicators.forEach((indicator, index) => {
      if (index + 1 === step) {
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
    
    // Mostrar o modal
    const modal = document.getElementById('maintenance-form-modal');
    if (modal) {
      modal.style.display = 'block';
      // Adicionar classe para animação se necessário
      modal.classList.add('active');
    } else {
      console.error("Modal #maintenance-form-modal não encontrado!");
    }
    
    // Garantir que comece na primeira etapa
    showStep(1);
  }
  
  function closeForm() {
    console.log("Fechando formulário");
    
    const modal = document.getElementById('maintenance-form-modal');
    if (modal) {
      // Remover classe ativa (para animação se existir)
      modal.classList.remove('active');
      
      // Esconder após um curto delay
      setTimeout(() => {
        modal.style.display = 'none';
        resetForm();
      }, 300);
    }
  }
  
  function resetForm() {
    // Reset básico do formulário
    const form = document.getElementById('maintenance-form');
    if (form) form.reset();
    
    // Limpar estados
    isEditMode = false;
    editingMaintenanceId = null;
    formData = {};
    
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
        <td>${item.dataRegistro || '-'}</td>
        <td>${item.responsavel || '-'}</td>
        <td>${item.area || '-'}</td>
        <td>${item.localOficina || '-'}</td>
        <td>${item.categoriaProblema || '-'}</td>
        <td>${item.status || 'Pendente'}</td>
        <td>
          <button class="btn-icon view-maintenance" data-id="${item.id}">👁️</button>
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
        // Aqui iria o código para visualizar detalhes
      }
    });
  }
  
  // API pública do módulo
  return {
    initialize,
    openMaintenanceForm,
    loadMaintenanceList
  };
})();
