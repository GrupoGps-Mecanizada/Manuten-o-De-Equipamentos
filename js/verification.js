/**
 * Sistema de Dupla Checagem de Manutenção
 * Módulo: Lógica de Verificação
 */

const Verification = (() => {
  // Variáveis privadas
  let verificationList = [];
  let currentFilter = 'all';
  let searchTerm = '';
  let selectedMaintenanceId = null;
  
  // Inicialização
  function initialize() {
    setupEventListeners();
    // Não carrega dados aqui, apenas quando a aba for selecionada
  }
  
  // Configurar event listeners
  function setupEventListeners() {
    // Filtros de verificações
    document.querySelectorAll('#tab-verification .filter-item').forEach(filter => {
      filter.addEventListener('click', function() {
        const filterItems = this.parentElement.querySelectorAll('.filter-item');
        filterItems.forEach(f => f.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.getAttribute('data-filter');
        updateVerificationList();
      });
    });
    
    // Busca de verificações
    document.getElementById('verification-search').addEventListener('input', debounce(function() {
      searchTerm = this.value;
      updateVerificationList();
    }, 300));
    
    // Botão de refresh
    document.getElementById('refresh-verification-list').addEventListener('click', function() {
      loadVerificationData(true);
    });
    
    // Formulário de verificação
    document.getElementById('verification-form').addEventListener('submit', function(e) {
      e.preventDefault();
      if (validateVerificationForm()) {
        submitVerification();
      }
    });
    
    // Fechar formulário
    document.getElementById('close-verification-form').addEventListener('click', function() {
      if (hasUnsavedChanges() && !confirm('Existem dados não salvos. Deseja realmente cancelar?')) {
        return;
      }
      closeVerificationForm();
    });
    
    document.getElementById('cancel-verification').addEventListener('click', function() {
      if (hasUnsavedChanges() && !confirm('Existem dados não salvos. Deseja realmente cancelar?')) {
        return;
      }
      closeVerificationForm();
    });
  }
  
  // Carregar dados de verificação
  function loadVerificationData(forceReload = false) {
    showLoading(true, 'Carregando verificações...');
    
    // Depende da API.getVerificationList() que busca as manutenções pendentes
    // Se mudar para outro endpoint específico, ajuste aqui
    API.getVerificationList()
      .then(response => {
        if (response.success && Array.isArray(response.maintenances)) {
          verificationList = response.maintenances;
          console.log(`${verificationList.length} manutenções para verificação carregadas.`);
          updateVerificationList();
        } else {
          console.error("Erro ao carregar lista de verificações:", response);
          showNotification("Erro ao carregar verificações: " + (response.message || "Resposta inválida"), "error");
          verificationList = [];
          updateVerificationList();
        }
      })
      .catch(error => {
        console.error("Falha na requisição de verificações:", error);
        showNotification("Falha ao buscar verificações: " + error.message, "error");
        verificationList = [];
        updateVerificationList();
      })
      .finally(() => {
        showLoading(false);
      });
  }
  
  // Atualizar lista de verificações com base nos filtros e busca
  function updateVerificationList() {
    const tbody = document.getElementById('verification-tbody');
    tbody.innerHTML = '';
    
    // Aplicar filtro e busca
    const filtered = filterVerifications(verificationList, currentFilter, searchTerm);
    
    if (filtered.length === 0) {
      let message = "Nenhuma manutenção para verificação encontrada";
      if (searchTerm) {
        message += ` para "${searchTerm}"`;
      }
      if (currentFilter !== 'all') {
        message += ` com filtro "${currentFilter}"`;
      }
      
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center;">${message}.</td></tr>`;
      return;
    }
    
    // Preencher tabela com verificações filtradas
    filtered.forEach(item => {
      const id = item.id || 'N/A';
      const equipmentId = item.placaOuId || item.equipmentId || '-';
      const type = item.tipoEquipamento || item.equipmentType || 'N/A';
      const maintDate = formatDate(item.dataManutencao || item.date);
      const resp = item.responsavel || item.technician || '-';
      const area = item.area || '-';
      const local = item.localOficina || item.location || '-';
      const status = item.status || 'Pendente';
      const statusClass = getStatusClass(status);
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${id}</td>
        <td>${equipmentId}</td>
        <td>${type}</td>
        <td>${maintDate}</td>
        <td>${resp}</td>
        <td>${area}</td>
        <td>${local}</td>
        <td><span class="status-badge status-${statusClass}">${status}</span></td>
        <td>
          <button class="btn-icon view-maintenance" data-id="${id}" title="Ver detalhes">👁️</button>
          ${status === 'Pendente' ? `<button class="btn-icon verify-maintenance" data-id="${id}" title="Verificar">✓</button>` : ''}
        </td>
      `;
      
      tbody.appendChild(row);
    });
    
    // Adicionar event listeners aos botões
    addActionButtonListeners(tbody);
  }
  
  // Filtrar verificações com base nos filtros
  function filterVerifications(list, filter, search) {
    // Se a lista é inválida, retorna array vazio
    if (!Array.isArray(list)) return [];
    
    const searchLower = search ? search.toLowerCase().trim() : '';
    
    return list.filter(item => {
      // 1. Aplicar filtro de status
      let statusMatch = false;
      const status = (item.status || 'Pendente').toLowerCase();
      
      switch (filter) {
        case 'pending':
          statusMatch = status === 'pendente';
          break;
        case 'verified':
          // Filtra por verificados hoje
          if (['verificado', 'aprovado', 'ajustes', 'reprovado'].includes(status)) {
            // Verifica se é de hoje (opcional)
            if (item.verification && item.verification.dataVerificacao) {
              const today = new Date();
              const today_str = today.toISOString().split('T')[0];
              const verificDate = new Date(item.verification.dataVerificacao);
              const verific_str = verificDate.toISOString().split('T')[0];
              statusMatch = today_str === verific_str;
            } else {
              statusMatch = true; // Se não tem data, considera match (mais inclusivo)
            }
          } else {
            statusMatch = false;
          }
          break;
        case 'completed':
          statusMatch = ['concluído', 'concluido'].includes(status);
          break;
        case 'all':
        default:
          statusMatch = true;
          break;
      }
      
      if (!statusMatch) return false;
      
      // 2. Aplicar termo de busca (se houver)
      if (searchLower) {
        const idMatch = String(item.id || '').toLowerCase().includes(searchLower);
        const equipMatch = (item.placaOuId || item.equipmentId || '').toLowerCase().includes(searchLower);
        const respMatch = (item.responsavel || item.technician || '').toLowerCase().includes(searchLower);
        const typeMatch = (item.tipoEquipamento || item.equipmentType || '').toLowerCase().includes(searchLower);
        const areaMatch = (item.area || '').toLowerCase().includes(searchLower);
        const localMatch = (item.localOficina || item.location || '').toLowerCase().includes(searchLower);
        
        return idMatch || equipMatch || respMatch || typeMatch || areaMatch || localMatch;
      }
      
      return true;
    });
  }
  
  // Adicionar event listeners aos botões da tabela
  function addActionButtonListeners(container) {
    if (!container) return;
    
    // Usar delegação de eventos
    container.addEventListener('click', function(event) {
      const target = event.target.closest('.btn-icon');
      if (!target) return;
      
      const id = target.getAttribute('data-id');
      if (!id) return;
      
      if (target.classList.contains('view-maintenance')) {
        viewMaintenanceDetails(id);
      } else if (target.classList.contains('verify-maintenance')) {
        openVerificationForm(id);
      }
    });
  }
  
  // Abrir formulário de verificação
  function openVerificationForm(id) {
    selectedMaintenanceId = id;
    
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
  
  // Fechar formulário de verificação
  function closeVerificationForm() {
    document.getElementById('verification-form-overlay').style.display = 'none';
    selectedMaintenanceId = null;
  }
  
  // Verificar se há mudanças não salvas no formulário
  function hasUnsavedChanges() {
    const verifierName = document.getElementById('verifier-name').value;
    const comments = document.getElementById('verification-comments').value;
    const resultSelected = document.querySelector('input[name="verification-result"]:checked');
    
    return verifierName.trim() !== '' || comments.trim() !== '' || resultSelected !== null;
  }
  
  // Validar formulário de verificação
  function validateVerificationForm() {
    let isValid = true;
    let firstInvalidField = null;
    
    // Validar campos
    const fieldsToValidate = [
      { element: document.getElementById('verifier-name'), name: 'Nome do Verificador' },
      { element: document.getElementById('verification-comments'), name: 'Comentários' }
    ];
    
    fieldsToValidate.forEach(field => {
      if (!field.element.value.trim()) {
        field.element.style.borderColor = 'red';
        if (!firstInvalidField) {
          firstInvalidField = field.element;
        }
        isValid = false;
      } else {
        field.element.style.borderColor = '';
      }
    });
    
    // Validar seleção de resultado
    const resultSelected = document.querySelector('input[name="verification-result"]:checked');
    if (!resultSelected) {
      // Destacar label do grupo
      const resultLabel = document.querySelector('label[for="verification-approved"]').parentElement.querySelector('label');
      resultLabel.style.color = 'red';
      isValid = false;
      if (!firstInvalidField) {
        firstInvalidField = document.getElementById('verification-approved');
      }
    } else {
      // Resetar cor do label
      const resultLabel = document.querySelector('label[for="verification-approved"]').parentElement.querySelector('label');
      resultLabel.style.color = '';
    }
    
    if (!isValid) {
      showNotification("Por favor, preencha todos os campos obrigatórios.", "error");
      if (firstInvalidField) {
        firstInvalidField.focus();
      }
    }
    
    return isValid;
  }
  
  // Enviar verificação
  function submitVerification() {
    if (!selectedMaintenanceId) {
      showNotification("ID da manutenção não identificado.", "error");
      return;
    }
    
    showLoading(true, 'Enviando verificação...');
    
    const data = {
      maintenanceId: selectedMaintenanceId,
      verifier: document.getElementById('verifier-name').value,
      result: document.querySelector('input[name="verification-result"]:checked').value,
      comments: document.getElementById('verification-comments').value
    };
    
    API.saveVerification(data)
      .then(response => {
        if (response.success) {
          showNotification("Verificação realizada com sucesso!", "success");
          closeVerificationForm();
          loadVerificationData(true); // Recarregar dados
          
          // Se estiver no dashboard, atualizar também
          if (typeof Dashboard !== 'undefined' && Dashboard.loadDashboardData) {
            Dashboard.loadDashboardData();
          }
        } else {
          console.error("Erro ao salvar verificação:", response);
          showNotification("Erro ao salvar verificação: " + (response.message || "Erro desconhecido"), "error");
        }
      })
      .catch(error => {
        console.error("Erro ao enviar verificação:", error);
        showNotification("Erro ao salvar verificação: " + error.message, "error");
      })
      .finally(() => {
        showLoading(false);
      });
  }
  
  // Ver detalhes da manutenção
  function viewMaintenanceDetails(id) {
    // Reutilizar função do módulo principal
    if (typeof window.viewMaintenanceDetails === 'function') {
      window.viewMaintenanceDetails(id);
    } else {
      // Implementação local se necessário
      showLoading(true, `Carregando detalhes da manutenção ${id}...`);
      selectedMaintenanceId = id;
      
      API.getMaintenanceDetails(id)
        .then(details => {
          if (!details || !details.success) {
            console.error("Erro ao carregar detalhes:", details);
            showNotification('Erro ao carregar detalhes: ' + (details ? details.message : 'Resposta inválida'), 'error');
            document.getElementById('maintenance-detail-content').innerHTML = '<p style="color: var(--danger-color); text-align: center;">Não foi possível carregar os detalhes.</p>';
            document.getElementById('detail-overlay').style.display = 'block';
            document.getElementById('verify-maintenance-btn').style.display = 'none';
            return;
          }
          
          renderMaintenanceDetails(details);
          document.getElementById('detail-overlay').style.display = 'block';
          
          // Mostrar/ocultar botão verificar com base no status
          const status = details.status || 'Pendente';
          const verifyBtn = document.getElementById('verify-maintenance-btn');
          
          if (status === 'Pendente') {
            verifyBtn.style.display = 'inline-block';
            verifyBtn.disabled = false;
          } else {
            verifyBtn.style.display = 'none';
            verifyBtn.disabled = true;
          }
        })
        .catch(error => {
          console.error("Falha na requisição de detalhes:", error);
          showNotification('Falha ao buscar detalhes: ' + error.message, 'error');
          document.getElementById('maintenance-detail-content').innerHTML = '<p style="color: var(--danger-color); text-align: center;">Falha ao buscar detalhes. Tente novamente.</p>';
          document.getElementById('detail-overlay').style.display = 'block';
          document.getElementById('verify-maintenance-btn').style.display = 'none';
        })
        .finally(() => {
          showLoading(false);
        });
    }
  }
  
  // Renderizar detalhes da manutenção
  function renderMaintenanceDetails(details) {
    // Reutilizar função do módulo principal
    if (typeof window.renderMaintenanceDetails === 'function') {
      window.renderMaintenanceDetails(details);
    } else {
      // Implementação local se necessário
      const container = document.getElementById('maintenance-detail-content');
      
      // Converter camelCase para nomes legíveis
      const camelToTitle = (text) => {
        return text
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase());
      };
      
      // Mapear campos importantes
      const mappedFields = [
        { label: 'ID', value: details.id },
        { label: 'Data de Registro', value: formatDate(details.dataRegistro, true) },
        { label: 'Equipamento', value: details.placaOuId || details.equipmentId },
        { label: 'Tipo de Equipamento', value: details.tipoEquipamento || details.equipmentType },
        { label: 'Responsável', value: details.responsavel || details.technician },
        { label: 'Data da Manutenção', value: formatDate(details.dataManutencao) },
        { label: 'Área', value: details.area },
        { label: 'Local/Oficina', value: details.localOficina || details.location },
        { label: 'Tipo de Manutenção', value: details.tipoManutencao || details.maintenanceType },
        { label: 'É Crítica', value: details.eCritico ? 'Sim' : 'Não' },
        { label: 'Categoria do Problema', value: details.categoriaProblema || details.problemCategory },
        { label: 'Detalhes do Problema', value: details.detalhesproblema || details.problemDescription },
        { label: 'Observações', value: details.observacoes || details.additionalNotes }
      ];
      
      // Criar HTML
      let html = `
      <div class="detail-header">
        <div class="detail-header-left">
          <div class="detail-title">Manutenção #${details.id}</div>
          <div class="detail-subtitle">Registrada em ${formatDate(details.dataRegistro, true)}</div>
        </div>
        <div class="detail-header-right">
          <span class="status-badge status-${getStatusClass(details.status)}">${details.status || 'Pendente'}</span>
        </div>
      </div>
      
      <div class="detail-section">
        <div class="detail-section-title">Informações Básicas</div>
        <div class="detail-grid">
          ${mappedFields.slice(2, 7).map(field => `
            <div class="detail-field">
              <div class="detail-label">${field.label}</div>
              <div class="detail-value">${field.value || '-'}</div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="detail-section">
        <div class="detail-section-title">Problema</div>
        <div class="detail-field">
          <div class="detail-label">Categoria</div>
          <div class="detail-value">${details.categoriaProblema || details.problemCategory || '-'}</div>
        </div>
        <div class="detail-field">
          <div class="detail-label">Detalhes</div>
          <div class="detail-value" style="white-space: pre-wrap;">${details.detalhesproblema || details.problemDescription || '-'}</div>
        </div>
        <div class="detail-field">
          <div class="detail-label">Observações</div>
          <div class="detail-value" style="white-space: pre-wrap;">${details.observacoes || details.additionalNotes || '-'}</div>
        </div>
      </div>`;
      
      // Adicionar seção de verificação se existir
      if (details.verification) {
        const v = details.verification;
        html += `
        <div class="detail-section">
          <div class="detail-section-title">Verificação</div>
          <div class="detail-grid">
            <div class="detail-field">
              <div class="detail-label">Verificador</div>
              <div class="detail-value">${v.verifier || '-'}</div>
            </div>
            <div class="detail-field">
              <div class="detail-label">Data</div>
              <div class="detail-value">${formatDate(v.dataVerificacao, true)}</div>
            </div>
            <div class="detail-field">
              <div class="detail-label">Resultado</div>
              <div class="detail-value">${v.result || '-'}</div>
            </div>
          </div>
          <div class="detail-field">
            <div class="detail-label">Comentários</div>
            <div class="detail-value" style="white-space: pre-wrap;">${v.comments || '-'}</div>
          </div>
        </div>`;
      }
      
      container.innerHTML = html;
    }
  }
  
  // API pública
  return {
    initialize,
    loadVerificationData,
    openVerificationForm,
    closeVerificationForm
  };
})();

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  Verification.initialize();
});
