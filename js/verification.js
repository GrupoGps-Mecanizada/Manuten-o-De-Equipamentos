/**
 * Módulo de Verificações
 * Responsável pela exibição e processamento de verificações de manutenção
 */

const Verification = (() => {
  let verificationData = [];
  
  // Inicializa o módulo
  function initialize() {
    console.log("Módulo Verification inicializado");
    
    // Configurar listeners para botões e elementos da UI
    setupEventListeners();
    
    // Carregar verificações pendentes se a aba estiver ativa
    if (document.querySelector('.tab[data-tab="verification"].active')) {
      loadVerificationData();
    }
  }
  
  // Configura os listeners de eventos
  function setupEventListeners() {
    // Listener para o botão de atualizar
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
        submitVerificationForm();
      });
    }
    
    // Botões para fechar o formulário
    const closeButtons = ['close-verification-form', 'cancel-verification'];
    closeButtons.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', function() {
          const overlay = document.getElementById('verification-form-overlay');
          if (overlay) overlay.style.display = 'none';
        });
      }
    });
  }
  
  // Carrega dados de verificações pendentes
  function loadVerificationData(forceReload = false) {
    if (!window.API || typeof API.getVerificationList !== 'function') {
      console.error("API.getVerificationList não disponível");
      if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
        Utilities.showNotification("Erro: API de verificações não disponível", "error");
      }
      return;
    }
    
    console.log("Carregando verificações pendentes...");
    
    if (typeof Utilities !== 'undefined' && Utilities.showLoading) {
      Utilities.showLoading(true, "Carregando verificações...");
    }
    
    // Limpar tabela e mostrar indicador de carregamento
    const tbody = document.getElementById('verification-tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center">Carregando...</td></tr>';
    }
    
    API.getVerificationList()
      .then(response => {
        if (response.success) {
          verificationData = response.maintenances || [];
          renderVerificationTable(verificationData);
        } else {
          console.error("Erro ao carregar verificações:", response.message);
          if (tbody) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center error-message">
              Erro ao carregar verificações: ${response.message || 'Erro desconhecido'}
            </td></tr>`;
          }
        }
      })
      .catch(error => {
        console.error("Falha na comunicação com a API:", error);
        if (tbody) {
          tbody.innerHTML = `<tr><td colspan="9" class="text-center error-message">
            Falha na conexão com o servidor: ${error.message || 'Erro desconhecido'}
          </td></tr>`;
        }
      })
      .finally(() => {
        if (typeof Utilities !== 'undefined' && Utilities.showLoading) {
          Utilities.showLoading(false);
        }
      });
  }
  
  // Renderiza a tabela de verificações pendentes
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
        <td>${item.tipoEquipamento || ''} (${item.placaOuId || '-'})</td>
        <td>${item.tipoManutencao || '-'}</td>
        <td>${typeof Utilities !== 'undefined' && Utilities.formatDate ? Utilities.formatDate(item.dataManutencao) : item.dataManutencao || '-'}</td>
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
    
    // Adicionar listeners para os botões de ação
    setupTableActionListeners(tbody);
  }
  
  // Configura listeners para botões na tabela
  function setupTableActionListeners(tableBody) {
    if (!tableBody) return;
    
    tableBody.addEventListener('click', function(event) {
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
    
    // Encontrar a manutenção nos dados carregados
    const maintenance = verificationData.find(m => m.id === maintenanceId);
    if (!maintenance) {
      console.error(`Manutenção ID ${maintenanceId} não encontrada nos dados carregados`);
      if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
        Utilities.showNotification("Erro: Manutenção não encontrada", "error");
      }
      return;
    }
    
    // Preencher o formulário
    const form = document.getElementById('verification-form');
    if (!form) {
      console.error("Formulário de verificação não encontrado no DOM");
      return;
    }
    
    // Resetar o formulário
    form.reset();
    
    // Preencher campos
    document.getElementById('verification-id').value = maintenanceId;
    document.getElementById('verification-equipment').value = 
      `${maintenance.tipoEquipamento || 'N/A'} (${maintenance.placaOuId || 'N/A'})`;
    document.getElementById('verification-type').value = maintenance.tipoManutencao || 'N/A';
    
    // Mostrar o overlay
    const overlay = document.getElementById('verification-form-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
    }
  }
  
  // Submete o formulário de verificação
  function submitVerificationForm() {
    const form = document.getElementById('verification-form');
    if (!form) return;
    
    // Validar campos obrigatórios
    const maintenanceId = document.getElementById('verification-id').value;
    const verifierName = document.getElementById('verifier-name').value;
    const resultRadio = form.querySelector('input[name="verification-result"]:checked');
    const comments = document.getElementById('verification-comments').value;
    
    if (!maintenanceId) {
      if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
        Utilities.showNotification("ID da manutenção não encontrado", "error");
      }
      return;
    }
    
    if (!verifierName) {
      if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
        Utilities.showNotification("Nome do verificador é obrigatório", "warning");
      }
      document.getElementById('verifier-name').focus();
      return;
    }
    
    if (!resultRadio) {
      if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
        Utilities.showNotification("Selecione um resultado para a verificação", "warning");
      }
      return;
    }
    
    if (!comments) {
      if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
        Utilities.showNotification("Comentários são obrigatórios", "warning");
      }
      document.getElementById('verification-comments').focus();
      return;
    }
    
    // Mostrar indicador de carregamento
    if (typeof Utilities !== 'undefined' && Utilities.showLoading) {
      Utilities.showLoading(true, "Enviando verificação...");
    }
    
    // Preparar dados para envio
    const verificationData = {
      maintenanceId: maintenanceId,
      verifier: verifierName,
      result: resultRadio.value,
      comments: comments
    };
    
    console.log("Enviando verificação:", verificationData);
    
    // Enviar para a API
    if (window.API && typeof API.submitVerification === 'function') {
      API.submitVerification(verificationData)
        .then(response => {
          if (response.success) {
            if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
              Utilities.showNotification("Verificação registrada com sucesso!", "success");
            }
            
            // Fechar o formulário
            const overlay = document.getElementById('verification-form-overlay');
            if (overlay) {
              overlay.style.display = 'none';
            }
            
            // Recarregar a lista de verificações
            loadVerificationData(true);
          } else {
            console.error("Erro ao registrar verificação:", response.message);
            if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
              Utilities.showNotification("Erro ao registrar verificação: " + (response.message || "Erro desconhecido"), "error");
            }
          }
        })
        .catch(error => {
          console.error("Falha na comunicação com a API:", error);
          if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
            Utilities.showNotification("Falha na conexão com o servidor: " + (error.message || "Erro desconhecido"), "error");
          }
        })
        .finally(() => {
          if (typeof Utilities !== 'undefined' && Utilities.showLoading) {
            Utilities.showLoading(false);
          }
        });
    } else {
      console.error("API.submitVerification não disponível");
      if (typeof Utilities !== 'undefined' && Utilities.showLoading) {
        Utilities.showLoading(false);
      }
      if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
        Utilities.showNotification("Erro: API de verificação não disponível", "error");
      }
    }
  }
  
  // Visualiza detalhes da manutenção
  function viewMaintenanceDetails(maintenanceId) {
    console.log(`Visualizando detalhes da manutenção ID: ${maintenanceId}`);
    
    // Se existir função global, usa ela
    if (typeof window.viewMaintenanceDetails === 'function') {
      window.viewMaintenanceDetails(maintenanceId);
      return;
    }
    
    // Fallback: implementação simples
    if (window.API && typeof API.getMaintenanceDetails === 'function') {
      if (typeof Utilities !== 'undefined' && Utilities.showLoading) {
        Utilities.showLoading(true, "Carregando detalhes...");
      }
      
      API.getMaintenanceDetails({id: maintenanceId})
        .then(response => {
          if (response.success && response.maintenance) {
            showMaintenanceDetailsModal(response.maintenance);
          } else {
            console.error("Erro ao carregar detalhes:", response.message);
            if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
              Utilities.showNotification("Erro ao carregar detalhes: " + (response.message || "Erro desconhecido"), "error");
            }
          }
        })
        .catch(error => {
          console.error("Falha na comunicação com a API:", error);
          if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
            Utilities.showNotification("Falha na conexão com o servidor: " + (error.message || "Erro desconhecido"), "error");
          }
        })
        .finally(() => {
          if (typeof Utilities !== 'undefined' && Utilities.showLoading) {
            Utilities.showLoading(false);
          }
        });
    } else {
      console.error("API.getMaintenanceDetails não disponível");
      if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
        Utilities.showNotification("Erro: API de detalhes não disponível", "error");
      }
    }
  }
  
  // Mostra modal com detalhes da manutenção
  function showMaintenanceDetailsModal(maintenance) {
    const detailOverlay = document.getElementById('detail-overlay');
    const detailContent = document.getElementById('maintenance-detail-content');
    
    if (!detailOverlay || !detailContent) {
      console.error("Elementos para exibir detalhes não encontrados no DOM");
      return;
    }
    
    // Formatar dados para exibição
    const formattedDate = typeof Utilities !== 'undefined' && Utilities.formatDate ? 
                          Utilities.formatDate(maintenance.dataManutencao || maintenance.dataRegistro) : 
                          (maintenance.dataManutencao || maintenance.dataRegistro || '-');
    
    const statusClass = typeof Utilities !== 'undefined' && Utilities.getStatusClass ? 
                        Utilities.getStatusClass(maintenance.status) : 
                        'default';
    
    detailContent.innerHTML = `
      <h3>Manutenção #${maintenance.id || '-'}</h3>
      
      <div class="detail-section">
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
          <div class="detail-value">
            <span class="status-badge status-${statusClass}">${maintenance.status || 'N/A'}</span>
          </div>
        </div>
      </div>
      
      <div class="detail-section">
        <h4>Informações do Problema</h4>
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
    
    // Configurar botões de ação
    const verifyBtn = document.getElementById('verify-maintenance-btn');
    if (verifyBtn) {
      verifyBtn.style.display = maintenance.status === 'Pendente' ? 'block' : 'none';
      // Armazenar ID da manutenção para uso futuro
      window.selectedMaintenanceId = maintenance.id;
    }
    
    // Exibir o modal
    detailOverlay.style.display = 'flex';
  }
  
  // Retornar API pública do módulo
  return {
    initialize,
    loadVerificationData,
    openVerificationForm
  };
})();

// Auto-inicializar se API e Utilities estiverem disponíveis
document.addEventListener('DOMContentLoaded', function() {
  if (window.API && window.Utilities) {
    console.log("Inicializando Verification via DOMContentLoaded");
    Verification.initialize();
  } else {
    console.warn("API ou Utilities não disponíveis. Verification não inicializado automaticamente.");
  }
});
