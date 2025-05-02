// Atualizar o rodapé para exibir o nome correto
document.addEventListener('DOMContentLoaded', function() {
  // Inicializar o sistema
  initializeSystem();
  
  // Configurar última atualização
  document.getElementById('last-update').textContent = formatDate(new Date(), true);
  
  // Atualizar desenvolvedor no rodapé
  const footerDeveloper = document.querySelector('.developer-credit');
  if (footerDeveloper) {
    footerDeveloper.textContent = 'Desenvolvido por Warlison Abreu';
  }
});

/**
 * Inicializa o sistema
 */
function initializeSystem() {
  // Configurar navegação por tabs
  setupTabNavigation();
  
  // Configurar modais
  setupModals();
  
  // Verificar se o sistema está configurado
  checkSystemConfiguration();
}

/**
 * Configurar navegação por tabs
 */
function setupTabNavigation() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      this.classList.add('active');
      currentTab = this.getAttribute('data-tab');
      const currentTabContent = document.getElementById(`tab-${currentTab}`);
      
      if (currentTabContent) {
        currentTabContent.classList.add('active');
      } else {
        console.error(`Conteúdo da tab ${currentTab} não encontrado!`);
      }
      
      // Carregar dados apropriados para a tab
      loadTabContent(currentTab);
    });
  });
}

/**
 * Carrega o conteúdo apropriado para a tab selecionada
 */
function loadTabContent(tab) {
  switch (tab) {
    case 'dashboard':
      // Carregar dados do dashboard se o módulo estiver disponível
      if (typeof Dashboard !== 'undefined' && Dashboard.loadDashboardData) {
        Dashboard.loadDashboardData();
      }
      break;
      
    case 'maintenance':
      // Carregar lista de manutenções
      loadMaintenanceList();
      break;
      
    case 'verification':
      // Carregar lista de verificações
      if (typeof Verification !== 'undefined' && Verification.loadVerificationData) {
        Verification.loadVerificationData();
      }
      break;
      
    case 'reports':
      // Não carrega dados inicialmente, espera a solicitação do usuário
      break;
  }
}

/**
 * Configurar comportamento dos modais
 */
function setupModals() {
  // Fechar modais ao clicar no X
  document.querySelectorAll('.form-close').forEach(button => {
    button.addEventListener('click', function() {
      const overlay = this.closest('.form-overlay');
      if (overlay) {
        overlay.style.display = 'none';
      }
    });
  });
  
  // Fechar modais ao clicar fora deles
  document.querySelectorAll('.form-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
      if (e.target === this) {
        this.style.display = 'none';
      }
    });
  });
  
  // Botões de fechar no rodapé dos modais
  document.getElementById('close-detail-btn').addEventListener('click', function() {
    document.getElementById('detail-overlay').style.display = 'none';
  });
  
  // Botão de verificar manutenção
  document.getElementById('verify-maintenance-btn').addEventListener('click', function() {
    const maintenanceId = window.selectedMaintenanceId;
    if (maintenanceId) {
      document.getElementById('detail-overlay').style.display = 'none';
      
      // Abrir formulário de verificação com pequeno atraso
      setTimeout(() => {
        if (typeof Verification !== 'undefined' && Verification.openVerificationForm) {
          Verification.openVerificationForm(maintenanceId);
        } else {
          openVerificationForm(maintenanceId);
        }
      }, 100);
    }
  });
}

/**
 * Verificar se o sistema está configurado adequadamente
 */
function checkSystemConfiguration() {
  // Verificar conexão com a API
  API.ping()
    .then(response => {
      if (response.success) {
        console.log("Conexão com a API estabelecida com sucesso.");
        console.log("Versão da API:", response.version || "Desconhecida");
      } else {
        console.error("Falha na conexão com a API:", response);
        showNotification("Falha na conexão com o servidor. Verifique sua conexão.", "error");
      }
    })
    .catch(error => {
      console.error("Erro ao testar conexão com a API:", error);
      showNotification("Erro ao conectar ao servidor: " + error.message, "error");
    });
}

/**
 * Carregar lista de manutenções
 */
function loadMaintenanceList() {
  showLoading(true, 'Carregando manutenções...');
  
  API.getMaintenanceList()
    .then(response => {
      if (response.success && Array.isArray(response.maintenances)) {
        maintenanceList = response.maintenances;
        console.log(`${maintenanceList.length} manutenções carregadas.`);
        updateMaintenanceTable();
      } else {
        console.error("Erro ao carregar lista de manutenções:", response);
        showNotification("Erro ao carregar manutenções: " + (response.message || "Resposta inválida"), "error");
        maintenanceList = [];
        updateMaintenanceTable();
      }
    })
    .catch(error => {
      console.error("Falha na requisição de manutenções:", error);
      showNotification("Falha ao buscar manutenções: " + error.message, "error");
      maintenanceList = [];
      updateMaintenanceTable();
    })
    .finally(() => {
      showLoading(false);
    });
}

/**
 * Atualizar tabela de manutenções
 */
function updateMaintenanceTable() {
  const tbody = document.getElementById('maintenance-tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (!Array.isArray(maintenanceList) || maintenanceList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align: center;">Nenhuma manutenção encontrada.</td></tr>';
    return;
  }
  
  // Filtrar e ordenar (por enquanto apenas ordenação por data de registro, mais recente primeiro)
  const sortedList = [...maintenanceList].sort((a, b) => {
    const dateA = new Date(a.dataRegistro || a.registrationDate || 0);
    const dateB = new Date(b.dataRegistro || b.registrationDate || 0);
    return dateB - dateA;
  });
  
  sortedList.forEach(item => {
    const id = item.id || 'N/A';
    const equipmentId = item.placaOuId || item.equipmentId || '-';
    const type = item.tipoEquipamento || item.equipmentType || 'N/A';
    const regDate = formatDate(item.dataRegistro || item.registrationDate, true);
    const resp = item.responsavel || item.technician || '-';
    const area = item.area || '-';
    const local = item.localOficina || item.location || '-';
    const problem = item.categoriaProblema || item.problemCategory || '-';
    const status = item.status || 'Pendente';
    const statusClass = getStatusClass(status);
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${id}</td>
      <td>${equipmentId}</td>
      <td>${type}</td>
      <td>${regDate}</td>
      <td>${resp}</td>
      <td>${area}</td>
      <td>${local}</td>
      <td>${problem}</td>
      <td><span class="status-badge status-${statusClass}">${status}</span></td>
      <td>
        <button class="btn-icon view-maintenance" data-id="${id}" title="Ver detalhes">👁️</button>
        ${status === 'Pendente' ? `<button class="btn-icon verify-maintenance" data-id="${id}" title="Verificar">✓</button>` : ''}
      </td>
    `;
    
    tbody.appendChild(row);
  });
  
  // Adicionar event listeners aos botões
  document.querySelectorAll('#maintenance-tbody .view-maintenance').forEach(button => {
    button.addEventListener('click', function() {
      const id = this.getAttribute('data-id');
      viewMaintenanceDetails(id);
    });
  });
  
  document.querySelectorAll('#maintenance-tbody .verify-maintenance').forEach(button => {
    button.addEventListener('click', function() {
      const id = this.getAttribute('data-id');
      if (typeof Verification !== 'undefined' && Verification.openVerificationForm) {
        Verification.openVerificationForm(id);
      } else {
        openVerificationForm(id);
      }
    });
  });
  
  // Configurar busca e filtros
  setupMaintenanceFilters();
}

/**
 * Configurar filtros e busca na lista de manutenções
 */
function setupMaintenanceFilters() {
  // Filtros de status
  document.querySelectorAll('#tab-maintenance .filter-item').forEach(filter => {
    filter.addEventListener('click', function() {
      const filterItems = this.parentElement.querySelectorAll('.filter-item');
      filterItems.forEach(f => f.classList.remove('active'));
      this.classList.add('active');
      
      const filterValue = this.getAttribute('data-filter');
      filterMaintenanceList(filterValue);
    });
  });
  
  // Campo de busca
  document.getElementById('maintenance-search').addEventListener('input', debounce(function() {
    const searchTerm = this.value.toLowerCase().trim();
    searchMaintenanceList(searchTerm);
  }, 300));
  
  // Botão de refresh
  document.getElementById('refresh-maintenance-list').addEventListener('click', function() {
    loadMaintenanceList();
  });
}

/**
 * Filtrar lista de manutenções por status
 */
function filterMaintenanceList(filter) {
  const rows = document.querySelectorAll('#maintenance-tbody tr');
  
  rows.forEach(row => {
    const statusCell = row.querySelector('td:nth-child(9)');
    
    if (!statusCell) {
      row.style.display = '';
      return;
    }
    
    const status = statusCell.textContent.toLowerCase();
    
    switch (filter) {
      case 'pending':
        row.style.display = status.includes('pendente') ? '' : 'none';
        break;
      case 'verified':
        row.style.display = status.includes('verificado') || status.includes('aprovado') || status.includes('ajustes') ? '' : 'none';
        break;
      case 'completed':
        row.style.display = status.includes('concluído') || status.includes('concluido') ? '' : 'none';
        break;
      case 'critical':
        // Para críticos, precisamos verificar o campo "É Crítica" nos detalhes
        const id = row.querySelector('.view-maintenance')?.getAttribute('data-id');
        const item = maintenanceList.find(m => m.id == id);
        row.style.display = (item && (item.eCritico || item.isCritical)) ? '' : 'none';
        break;
      default:
        row.style.display = '';
    }
  });
}

/**
 * Buscar na lista de manutenções
 */
function searchMaintenanceList(searchTerm) {
  if (!searchTerm) {
    // Restaurar visibilidade de todas as linhas
    document.querySelectorAll('#maintenance-tbody tr').forEach(row => {
      row.style.display = '';
    });
    return;
  }
  
  const rows = document.querySelectorAll('#maintenance-tbody tr');
  
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    let rowVisible = false;
    
    cells.forEach((cell, index) => {
      // Não buscar na última coluna (ações)
      if (index < cells.length - 1) {
        const value = cell.textContent.toLowerCase();
        if (value.includes(searchTerm)) {
          rowVisible = true;
        }
      }
    });
    
    row.style.display = rowVisible ? '' : 'none';
  });
}

/**
 * Função de apoio para abrir formulário de verificação
 */
function openVerificationForm(id) {
  // Se o módulo de verificação não estiver disponível, implementamos a função aqui
  window.selectedMaintenanceId = id;
  
  // Buscar detalhes da manutenção
  showLoading(true, 'Carregando dados da manutenção...');
  
  API.getMaintenanceDetails(id)
    .then(maintenance => {
      if (!maintenance || !maintenance.success) {
        throw new Error(maintenance?.message || 'Manutenção não encontrada');
      }
      
      // Preencher campos do formulário
      document.getElementById('verification-id').value = maintenance.id || id;
      document.getElementById('verification-equipment').value = maintenance.placaOuId || maintenance.equipmentId || '-';
      document.getElementById('verification-type').value = maintenance.tipoManutencao || maintenance.maintenanceType || '-';
      
      // Limpar outros campos para nova verificação
      document.getElementById('verifier-name').value = '';
      document.getElementById('verification-approved').checked = false;
      document.getElementById('verification-adjustments').checked = false;
      document.getElementById('verification-rejected').checked = false;
      document.getElementById('verification-comments').value = '';
      
      // Exibir formulário
      document.getElementById('verification-form-overlay').style.display = 'block';
    })
    .catch(error => {
      console.error("Erro ao abrir formulário de verificação:", error);
      showNotification("Erro ao carregar dados da manutenção: " + error.message, "error");
    })
    .finally(() => {
      showLoading(false);
    });
}
