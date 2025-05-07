/**
 * Sistema de Dupla Checagem de Manutenção
 * Módulo: Verificação de Manutenções
 */

const Verification = (() => {
  let verificationList = [];
  
  // Inicializa o módulo
  function initialize() {
    console.log("Módulo Verification inicializado");
    
    // Configurar listeners
    setupListeners();
    
    // Configurar listeners de filtro
    setupFilterListeners(); // Adicionar esta linha
    
    // Carregar lista se a aba estiver ativa
    if (document.querySelector('.tab[data-tab="verification"].active')) {
      loadVerificationData();
    }
  }
  
  // Configura listeners para botões e formulários
  function setupListeners() {
    // Botão de atualizar lista
    const refreshBtn = document.getElementById('refresh-verification-list');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function() {
        loadVerificationData(true); // true = forçar recarga
      });
    }
    
    // Formulário de verificação
    const form = document.getElementById('verification-form');
    if (form) {
      form.addEventListener('submit', function(event) {
        event.preventDefault();
        submitVerification();
      });
    }
    
    // Botões para fechar o formulário
    const closeButtons = document.querySelectorAll('.form-close, #cancel-verification');
    closeButtons.forEach(button => {
      button.addEventListener('click', function() {
        const overlay = document.getElementById('verification-form-overlay');
        if (overlay) overlay.style.display = 'none';
      });
    });
  }
  
  // Carrega dados das verificações pendentes
  function loadVerificationData(forceReload = false) {
    console.log("Carregando verificações pendentes...");
    
    if (typeof Utilities !== 'undefined' && Utilities.showLoading) {
      Utilities.showLoading(true, "Carregando verificações...");
    }
    
    // Mostrar indicador na tabela
    const tbody = document.getElementById('verification-tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center">Carregando...</td></tr>';
    }
    
    // Chamar API para buscar verificações pendentes
    if (window.API && typeof API.getVerificationList === 'function') {
      API.getVerificationList()
        .then(response => {
          if (response.success) {
            verificationList = response.maintenances || [];
            renderVerificationTable(verificationList);
            applyFilters(); // Aplicar filtros após carregar os dados
          } else {
            console.error("Erro ao carregar verificações:", response);
            if (tbody) {
              tbody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">
                Erro ao carregar verificações: ${response.message || 'Erro desconhecido'}
              </td></tr>`;
            }
          }
        })
        .catch(error => {
          console.error("Erro de comunicação ao carregar verificações:", error);
          if (tbody) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">
              Erro de comunicação: ${error.message || 'Verifique sua conexão'}
            </td></tr>`;
          }
        })
        .finally(() => {
          if (typeof Utilities !== 'undefined' && Utilities.showLoading) {
            Utilities.showLoading(false);
          }
        });
    } else {
      console.error("API.getVerificationList não disponível");
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">
          Erro: API de verificações não disponível
        </td></tr>`;
      }
      if (typeof Utilities !== 'undefined' && Utilities.showLoading) {
        Utilities.showLoading(false);
      }
    }
  }
  
  // Renderiza a tabela de verificações
  function renderVerificationTable(items) {
    const tbody = document.getElementById('verification-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!items || items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center">Nenhuma verificação pendente encontrada.</td></tr>';
      return;
    }
    
    items.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.id || '-'}</td>
        <td>${item.tipoEquipamento || '-'} (${item.placaOuId || '-'})</td>
        <td>${item.tipoManutencao || '-'}</td>
        <td>${formatDate(item.dataManutencao) || formatDate(item.dataRegistro) || '-'}</td>
        <td>${item.responsavel || '-'}</td>
        <td>${item.area || '-'}</td>
        <td>${item.localOficina || '-'}</td>
        <td><span class="status-badge status-pending">Pendente</span></td>
        <td>
          <button class="btn-icon verify-maintenance" data-id="${item.id}" title="Verificar">✓</button>
          <button class="btn-icon view-maintenance" data-id="${item.id}" title="Ver Detalhes">👁️</button>
        </td>
      `;
      tbody.appendChild(row);
    });
    
    // Adicionar listeners aos botões
    setupTableActionListeners(tbody);
  }
  
  // Formata datas (fallback se Utilities.formatDate não estiver disponível)
  function formatDate(dateString) {
    if (!dateString) return '-';
    
    if (typeof Utilities !== 'undefined' && typeof Utilities.formatDate === 'function') {
      return Utilities.formatDate(dateString);
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateString;
    }
  }
  
  // Configura listeners para ações na tabela
  function setupTableActionListeners(tableElement) {
    if (!tableElement) return;
    
    tableElement.addEventListener('click', function(event) {
      const button = event.target.closest('.btn-icon');
      if (!button) return;
      
      const maintenanceId = button.getAttribute('data-id');
      if (!maintenanceId) return;
      
      if (button.classList.contains('verify-maintenance')) {
        openVerificationForm(maintenanceId);
      } else if (button.classList.contains('view-maintenance')) {
        viewMaintenanceDetails(maintenanceId);
      }
    });
  }
  
  // Abre o formulário de verificação
  function openVerificationForm(maintenanceId, maintenanceData) {
    console.log(`Abrindo formulário de verificação para manutenção ID: ${maintenanceId}`);
    
    // Inicializar variável para os dados da manutenção
    let maintenance = maintenanceData;
    
    // Se não recebeu dados, tenta buscar na lista local
    if (!maintenance) {
      maintenance = verificationList.find(m => String(m.id) === String(maintenanceId));
    }
    
    // Se ainda não encontrou, tenta buscar pelo mecanismo global compartilhado
    if (!maintenance && window.maintenanceDataShared && typeof window.maintenanceDataShared.getMaintenanceById === 'function') {
      maintenance = window.maintenanceDataShared.getMaintenanceById(maintenanceId);
    }
    
    // Se ainda não encontrou, tenta buscar pela API diretamente
    if (!maintenance && window.API && typeof API.getMaintenanceDetails === 'function') {
      // Mostra loading
      if (typeof Utilities !== 'undefined' && Utilities.showLoading) {
        Utilities.showLoading(true, "Carregando dados da manutenção...");
      }
      
      // Busca os dados diretamente da API
      API.getMaintenanceDetails({ id: maintenanceId })
        .then(response => {
          if (response.success && response.maintenance) {
            // Continuar com o formulário usando os dados obtidos
            continueWithVerificationForm(maintenanceId, response.maintenance);
          } else {
            if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
              Utilities.showNotification("Erro: Manutenção não encontrada", "error");
            }
          }
        })
        .catch(error => {
          if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
            Utilities.showNotification("Erro ao buscar manutenção: " + (error.message || "Erro desconhecido"), "error");
          }
        })
        .finally(() => {
          if (typeof Utilities !== 'undefined' && Utilities.showLoading) {
            Utilities.showLoading(false);
          }
        });
      
      return; // Retorna aqui para evitar prosseguir, já que estamos aguardando a API
    }
    
    // Se ainda não encontrou após tentar todas as opções, mostra erro
    if (!maintenance) {
      if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
        Utilities.showNotification("Erro: Manutenção não encontrada", "error");
      }
      return;
    }
    
    // Continuar com o formulário
    continueWithVerificationForm(maintenanceId, maintenance);
  }

  // Nova função auxiliar para separar a lógica do formulário
  function continueWithVerificationForm(maintenanceId, maintenance) {
    // Resetar e preencher o formulário
    const form = document.getElementById('verification-form');
    if (form) form.reset();
    
    // Preencher campos com dados da manutenção
    document.getElementById('verification-id').value = maintenanceId;
    document.getElementById('verification-equipment').value = 
      `${maintenance.tipoEquipamento || '-'} (${maintenance.placaOuId || '-'})`;
    document.getElementById('verification-type').value = maintenance.tipoManutencao || '-';
    
    // Exibir o formulário
    const overlay = document.getElementById('verification-form-overlay');
    if (overlay) overlay.style.display = 'flex';
  }
  
  // Submete o formulário de verificação
  function submitVerification() {
    // Coletar dados do formulário
    const maintenanceId = document.getElementById('verification-id').value;
    const verifierName = document.getElementById('verifier-name').value;
    const resultRadios = document.getElementsByName('verification-result');
    let result = null;
    for (let i = 0; i < resultRadios.length; i++) {
      if (resultRadios[i].checked) {
        result = resultRadios[i].value;
        break;
      }
    }
    const comments = document.getElementById('verification-comments').value;
    
    // Validar dados
    if (!maintenanceId) {
      showNotification("ID da manutenção é obrigatório", "error");
      return;
    }
    if (!verifierName) {
      showNotification("Nome do verificador é obrigatório", "warning");
      document.getElementById('verifier-name').focus();
      return;
    }
    if (!result) {
      showNotification("Selecione um resultado para a verificação", "warning");
      return;
    }
    if (!comments) {
      showNotification("Comentários são obrigatórios", "warning");
      document.getElementById('verification-comments').focus();
      return;
    }
    
    // Preparar dados para envio
    const verificationData = {
      maintenanceId: maintenanceId,
      verifier: verifierName,
      result: result,
      comments: comments
    };
    
    // Mostrar loading
    if (typeof Utilities !== 'undefined' && Utilities.showLoading) {
      Utilities.showLoading(true, "Registrando verificação...");
    }
    
    // Enviar para a API
    if (window.API && typeof API.submitVerification === 'function') {
      API.submitVerification(verificationData)
        .then(response => {
          if (response.success) {
            if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
              Utilities.showNotification("Verificação registrada com sucesso!", "success");
            }
            
            // Fechar formulário e recarregar lista
            const overlay = document.getElementById('verification-form-overlay');
            if (overlay) overlay.style.display = 'none';
            
            loadVerificationData(true);
          } else {
            if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
              Utilities.showNotification(
                `Erro ao registrar verificação: ${response.message || 'Erro desconhecido'}`, 
                "error"
              );
            }
          }
        })
        .catch(error => {
          if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
            Utilities.showNotification(
              `Erro de comunicação: ${error.message || 'Verifique sua conexão'}`, 
              "error"
            );
          }
        })
        .finally(() => {
          if (typeof Utilities !== 'undefined' && Utilities.showLoading) {
            Utilities.showLoading(false);
          }
        });
    } else {
      console.error("API.submitVerification não disponível");
      if (typeof Utilities !== 'undefined') {
        Utilities.showLoading(false);
        Utilities.showNotification("Erro: API de verificação não disponível", "error");
      }
    }
  }
  
  // Exibe os detalhes de uma manutenção
  function viewMaintenanceDetails(maintenanceId) {
    // Verificar se existe uma função global para isso
    if (typeof window.viewMaintenanceDetails === 'function') {
      window.viewMaintenanceDetails(maintenanceId);
      return;
    }
    
    // Se não existir, implementar visualização local
    // Buscar dados da API
    if (window.API && typeof API.getMaintenanceDetails === 'function') {
      if (typeof Utilities !== 'undefined' && Utilities.showLoading) {
        Utilities.showLoading(true, "Carregando detalhes...");
      }
      
      API.getMaintenanceDetails({ id: maintenanceId })
        .then(response => {
          if (response.success && response.maintenance) {
            displayDetailsModal(response.maintenance);
          } else {
            if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
              Utilities.showNotification(
                `Erro ao carregar detalhes: ${response.message || 'Erro desconhecido'}`, 
                "error"
              );
            }
          }
        })
        .catch(error => {
          if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
            Utilities.showNotification(
              `Erro de comunicação: ${error.message || 'Verifique sua conexão'}`, 
              "error"
            );
          }
        })
        .finally(() => {
          if (typeof Utilities !== 'undefined' && Utilities.showLoading) {
            Utilities.showLoading(false);
          }
        });
    }
  }
  
  // Exibe modal com detalhes da manutenção
  function displayDetailsModal(maintenance) {
    const detailOverlay = document.getElementById('detail-overlay');
    const detailContent = document.getElementById('maintenance-detail-content');
    
    if (!detailOverlay || !detailContent) {
      console.error("Elementos para mostrar detalhes não encontrados no DOM");
      return;
    }
    
    // Formatar os dados para exibição
    const formattedDate = formatDate(maintenance.dataManutencao || maintenance.dataRegistro);
    const statusClass = typeof Utilities !== 'undefined' && Utilities.getStatusClass ? 
                        Utilities.getStatusClass(maintenance.status) : 
                        'default';
    
    detailContent.innerHTML = `
      <h3>Manutenção #${maintenance.id || '-'}</h3>
      
      <div class="detail-grid">
        <div class="detail-row">
          <div class="detail-label">Equipamento:</div>
          <div class="detail-value">${maintenance.tipoEquipamento || '-'} (${maintenance.placaOuId || '-'})</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Data:</div>
          <div class="detail-value">${formattedDate}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Responsável:</div>
          <div class="detail-value">${maintenance.responsavel || '-'}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Local:</div>
          <div class="detail-value">${maintenance.area || '-'} / ${maintenance.localOficina || '-'}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Tipo:</div>
          <div class="detail-value">${maintenance.tipoManutencao || '-'}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Status:</div>
          <div class="detail-value"><span class="status-badge status-${statusClass}">${maintenance.status || 'N/A'}</span></div>
        </div>
      </div>
      
      <div class="detail-section">
        <h4>Problema</h4>
        <div class="detail-row">
          <div class="detail-label">Categoria:</div>
          <div class="detail-value">${maintenance.categoriaProblema || '-'}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Descrição:</div>
          <div class="detail-value">${maintenance.detalhesproblema || '-'}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Observações:</div>
          <div class="detail-value">${maintenance.observacoes || 'Nenhuma'}</div>
        </div>
      </div>
    `;
    
    // Configurar botões no modal
    const verifyBtn = document.getElementById('verify-maintenance-btn');
    if (verifyBtn) {
      // Mostra botão de verificar apenas se status for pendente
      verifyBtn.style.display = maintenance.status === 'Pendente' ? 'block' : 'none';
      window.selectedMaintenanceId = maintenance.id; // Usado pelo listener global
    }
    
    // Mostrar o modal
    detailOverlay.style.display = 'flex';
  }

  // --- Sistema de Filtros ---
  let verificationFilters = {
    search: '',
    equipmentType: '',
    maintenanceType: ''
  };

  function setupFilterListeners() {
    // Campo de busca
    const searchInput = document.getElementById('verification-search');
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        verificationFilters.search = this.value.toLowerCase().trim();
        applyFilters();
      });
    }
    
    // Filtros de dropdown
    const equipmentTypeFilter = document.getElementById('verification-equipment-type-filter');
    const maintenanceTypeFilter = document.getElementById('verification-maintenance-type-filter');
    
    if (equipmentTypeFilter) {
      equipmentTypeFilter.addEventListener('change', function() {
        verificationFilters.equipmentType = this.value;
        applyFilters();
      });
    }
    
    if (maintenanceTypeFilter) {
      maintenanceTypeFilter.addEventListener('change', function() {
        verificationFilters.maintenanceType = this.value;
        applyFilters();
      });
    }
    
    // Botão para limpar filtros
    const clearFiltersBtn = document.getElementById('verification-clear-filters');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', function() {
        resetFilters();
      });
    }
  }

  function resetFilters() {
    verificationFilters = {
      search: '',
      equipmentType: '',
      maintenanceType: ''
    };
    
    // Resetar valores dos elementos de filtro
    const elements = [
      'verification-search',
      'verification-equipment-type-filter',
      'verification-maintenance-type-filter'
    ];
    
    elements.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        if (element.tagName === 'INPUT') {
          element.value = '';
        } else if (element.tagName === 'SELECT') {
          element.selectedIndex = 0;
        }
      }
    });
    
    // Aplicar filtros resetados
    applyFilters();
  }

  function applyFilters() {
    if (!verificationList || !Array.isArray(verificationList)) {
      console.error("Lista de verificações não disponível para filtrar");
      return;
    }
    
    const filteredList = verificationList.filter(item => {
      // Aplicar filtro de busca por texto
      if (verificationFilters.search) {
        const searchTerms = [
          item.id,
          item.placaOuId,
          item.responsavel,
          item.tipoEquipamento,
          item.localOficina
        ];
        
        const matchesSearch = searchTerms.some(term => 
          term && String(term).toLowerCase().includes(verificationFilters.search)
        );
        
        if (!matchesSearch) return false;
      }
      
      // Aplicar filtro de tipo de equipamento
      if (verificationFilters.equipmentType && item.tipoEquipamento !== verificationFilters.equipmentType) {
        return false;
      }
      
      // Aplicar filtro de tipo de manutenção
      if (verificationFilters.maintenanceType && item.tipoManutencao !== verificationFilters.maintenanceType) {
        return false;
      }
      
      return true;
    });
    
    // Renderizar a tabela com a lista filtrada
    renderVerificationTable(filteredList);
    
    // Exibir contador de resultados
    updateFilterResultsCount(filteredList.length, verificationList.length);
  }

  function updateFilterResultsCount(filteredCount, totalCount) {
    const filterCountElement = document.getElementById('verification-filter-results-count');
    
    if (!filterCountElement) {
      // Criar elemento se não existir
      const countDisplay = document.createElement('div');
      countDisplay.id = 'verification-filter-results-count';
      countDisplay.className = 'filter-results-info';
      
      // Encontrar onde inserir
      const filtersContainer = document.querySelector('.tab-content[data-tab="verification"] .filters-container');
      if (filtersContainer) {
        filtersContainer.appendChild(countDisplay);
      }
    }
    
    const element = document.getElementById('verification-filter-results-count');
    if (element) {
      if (filteredCount < totalCount) {
        element.textContent = `Mostrando ${filteredCount} de ${totalCount} verificações pendentes`;
        element.style.display = 'block';
      } else {
        element.style.display = 'none';
      }
    }
  }
  
  // Mostra notificação (fallback para Utilities.showNotification)
  function showNotification(message, type) {
    if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
      Utilities.showNotification(message, type);
    } else {
      alert(message);
    }
  }
  
  // API pública do módulo
  return {
    initialize,
    loadVerificationData,
    openVerificationForm,
    continueWithVerificationForm // Adicionada essa linha
  };
})();

// Auto-inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  if (window.API && window.Utilities) {
    Verification.initialize();
  }
});
