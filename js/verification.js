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
  function openVerificationForm(maintenanceId) {
    console.log(`Abrindo formulário de verificação para manutenção ID: ${maintenanceId}`);
    
    // Buscar manutenção na lista
    const maintenance = verificationList.find(m => m.id === maintenanceId);
    if (!maintenance) {
      if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
        Utilities.showNotification("Erro: Manutenção não encontrada", "error");
      }
      return;
    }
    
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
    openVerificationForm
  };
})();

// Auto-inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  if (window.API && window.Utilities) {
    Verification.initialize();
  }
});
