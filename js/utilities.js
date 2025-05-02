<artifact id="fixed-utilities-js" type="application/vnd.ant.code" language="javascript">
/**
 * Sistema de Dupla Checagem de Manutenção
 * Módulo: Funções Utilitárias
 */

/**
 * Variáveis globais compartilhadas
 */
let currentTab = 'dashboard';
let maintenanceList = [];

/**
 * Formatar data (Brasileiro)
 */
function formatDate(dateSource, includeTime = false) {
  if (!dateSource) return '-';

  let date;
  try {
    if (dateSource instanceof Date) {
      date = dateSource;
    } else if (typeof dateSource === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateSource)) {
        date = new Date(dateSource + 'T00:00:00');
      } else {
        date = new Date(dateSource);
      }
    } else if (typeof dateSource === 'number') {
      date = new Date(dateSource);
    } else {
      throw new Error("Tipo de entrada de data não suportado.");
    }

    if (isNaN(date.getTime())) {
      return typeof dateSource === 'string' ? dateSource : '-';
    }

    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };

    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.hour12 = false;
    }

    return new Intl.DateTimeFormat('pt-BR', options).format(date);
  } catch (e) {
    console.error("Erro ao formatar data:", dateSource, e);
    return dateSource?.toString() || '-';
  }
}

/**
 * Função debounce para inputs
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Obter classe CSS baseada no status
 */
function getStatusClass(status) {
  if (!status) return 'pending';

  const lowerStatus = status.toLowerCase();
  switch (lowerStatus) {
    case 'pendente': return 'pending';
    case 'verificado': case 'aprovado': case 'ajustes': return 'verification';
    case 'concluído': case 'concluido': return 'completed';
    case 'reprovado': return 'danger';
    default: return 'pending';
  }
}

/**
 * Mostrar/esconder indicador de carregamento
 */
function showLoading(show, message = 'Carregando...') {
  const loader = document.getElementById('global-loader');
  const loaderMessage = document.getElementById('global-loader-message');

  if (!loader || !loaderMessage) return;

  if (show) {
    loaderMessage.textContent = message;
    loader.style.display = 'flex';
  } else {
    loader.style.display = 'none';
  }
}

/**
 * Sistema de notificações
 */
function showNotification(message, type = 'info', duration = 5000) {
  const containerId = 'notification-container';
  let container = document.getElementById(containerId);

  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 90%;
      width: 350px;
    `;
    document.body.appendChild(container);
  }

  const notification = document.createElement('div');
  notification.className = `notification-popup`; // Classe 'type' será adicionada depois
  notification.style.opacity = '0';
  notification.style.transform = 'translateY(-20px)';
  notification.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';

  let icon = '';
  let title = '';

  switch (type) {
    case 'success':
      icon = '✓';
      title = 'Sucesso';
      duration = Math.max(duration, 3000);
      break;
    case 'error':
      icon = '✗';
      title = 'Erro';
      duration = Math.max(duration, 8000);
      break;
    case 'warning':
      icon = '⚠️';
      title = 'Aviso';
      duration = Math.max(duration, 6000);
      break;
    default:
      icon = 'ℹ';
      title = 'Informação';
      type = 'info'; // Garante que 'info' seja a classe padrão
      break;
  }

  notification.classList.add(type); // Adiciona a classe de tipo correta

  notification.innerHTML = `
    <div class="notification-icon">${icon}</div>
    <div class="notification-content">
      <div class="notification-title">${title}</div>
      <div>${message}</div>
    </div>
    <span class="close-btn" style="cursor:pointer; font-size: 20px; line-height: 1;">×</span>`;

  container.prepend(notification); // Adiciona no início para novas aparecerem acima

  // Delay para permitir a transição inicial
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';
  }, 10);

  const close = () => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';

    // Remove o elemento após a transição de saída
    setTimeout(() => {
      // Verifica se o elemento ainda está no DOM antes de remover
      if (notification.parentNode === container) {
        container.removeChild(notification);
      }
    }, 300);
  };

  notification.querySelector('.close-btn').onclick = close;

  // Fecha automaticamente após a duração
  setTimeout(close, duration);
}

/**
 * Ver detalhes de uma manutenção (Função global compartilhada)
 */
function viewMaintenanceDetails(id) {
  showLoading(true, `Carregando detalhes da manutenção ${id}...`);
  window.selectedMaintenanceId = id;

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

/**
 * Renderizar detalhes da manutenção (Função global compartilhada)
 */
function renderMaintenanceDetails(details) {
  const container = document.getElementById('maintenance-detail-content');

  // Mapear campos importantes
  const equipId = details.placaOuId || details.equipmentId || '-';
  const equipType = details.tipoEquipamento || details.equipmentType || '-';
  const resp = details.responsavel || details.technician || '-';
  const maintDate = formatDate(details.dataManutencao || details.date);
  const area = details.area || '-';
  const local = details.localOficina || details.location || '-';
  const maintType = details.tipoManutencao || details.maintenanceType || '-';
  const isCritical = (details.eCritico || details.isCritical) ? 'Sim' : 'Não';
  const category = details.categoriaProblema || details.problemCategory || '-';
  const problem = details.detalhesproblema || details.problemDescription || '-';
  const notes = details.observacoes || details.additionalNotes || '-';
  const status = details.status || 'Pendente';
  const statusClass = getStatusClass(status);
  const regDate = formatDate(details.dataRegistro || details.registrationDate, true);

  // Criar HTML
  let html = `
  <div class="detail-header">
    <div class="detail-header-left">
      <div class="detail-title">Manutenção #${details.id}</div>
      <div class="detail-subtitle">Registrada em ${regDate}</div>
    </div>
    <div class="detail-header-right">
      <span class="status-badge status-${statusClass}">${status}</span>
    </div>
  </div>

  <div class="detail-section">
    <div class="detail-section-title">Informações Básicas</div>
    <div class="detail-grid">
      <div class="detail-field">
        <div class="detail-label">Equipamento</div>
        <div class="detail-value">${equipId}</div>
      </div>
      <div class="detail-field">
        <div class="detail-label">Tipo Equip.</div>
        <div class="detail-value">${equipType}</div>
      </div>
      <div class="detail-field">
        <div class="detail-label">Responsável</div>
        <div class="detail-value">${resp}</div>
      </div>
      <div class="detail-field">
        <div class="detail-label">Data Manut.</div>
        <div class="detail-value">${maintDate}</div>
      </div>
      <div class="detail-field">
        <div class="detail-label">Área</div>
        <div class="detail-value">${area}</div>
      </div>
      <div class="detail-field">
        <div class="detail-label">Local/Oficina</div>
        <div class="detail-value">${local}</div>
      </div>
      <div class="detail-field">
        <div class="detail-label">Tipo Manut.</div>
        <div class="detail-value">${maintType}</div>
      </div>
      <div class="detail-field">
        <div class="detail-label">Crítica?</div>
        <div class="detail-value">${isCritical}</div>
      </div>
    </div>
  </div>

  <div class="detail-section">
    <div class="detail-section-title">Problema</div>
    <div class="detail-field">
      <div class="detail-label">Categoria</div>
      <div class="detail-value">${category}</div>
    </div>
    <div class="detail-field">
      <div class="detail-label">Detalhes do Problema</div>
      <div class="detail-value" style="white-space: pre-wrap;">${problem}</div>
    </div>
    <div class="detail-field">
      <div class="detail-label">Observações Adicionais</div>
      <div class="detail-value" style="white-space: pre-wrap;">${notes}</div>
    </div>
  </div>`;

  // Adicionar seção de verificação se existir
  if (details.verification) {
    const v = details.verification;
    const verifier = v.verifier || v.verificador || '-';
    const verifyDate = formatDate(v.dataVerificacao || v.date, true);
    const result = v.result || v.resultado || '-';
    const comments = v.comments || v.comentarios || '-';

    html += `
    <div class="detail-section">
      <div class="detail-section-title">Verificação</div>
      <div class="detail-grid">
        <div class="detail-field">
          <div class="detail-label">Verificador</div>
          <div class="detail-value">${verifier}</div>
        </div>
        <div class="detail-field">
          <div class="detail-label">Data</div>
          <div class="detail-value">${verifyDate}</div>
        </div>
        <div class="detail-field">
          <div class="detail-label">Resultado</div>
          <div class="detail-value">${result}</div>
        </div>
      </div>
      <div class="detail-field">
        <div class="detail-label">Comentários</div>
        <div class="detail-value" style="white-space: pre-wrap;">${comments}</div>
      </div>
    </div>`;
  }

  // Adicionar histórico
  html += `
  <div class="detail-section">
    <div class="detail-section-title">Histórico</div>
    <div class="timeline">
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <div class="timeline-title">
            <span>Manutenção Registrada</span>
            <span class="timeline-date">${regDate}</span>
          </div>
          <div class="timeline-description">Por: ${resp}</div>
        </div>
      </div>`;

  if (details.verification) {
    const v = details.verification;
    const verifier = v.verifier || v.verificador || '-';
    const verifyDate = formatDate(v.dataVerificacao || v.date, true);
    const result = v.result || v.resultado || '-';

    const dotClass = (status === 'Concluído' || status === 'Verificado' ||
                      status === 'Aprovado' || status === 'Ajustes' ||
                      status === 'Reprovado') ? 'completed' : '';

    html += `
      <div class="timeline-item">
        <div class="timeline-dot ${dotClass}"></div>
        <div class="timeline-content">
          <div class="timeline-title">
            <span>Verificação Realizada</span>
            <span class="timeline-date">${verifyDate}</span>
          </div>
          <div class="timeline-description">Por: ${verifier} | Resultado: ${result}</div>
        </div>
      </div>`;

    if (status === 'Concluído') {
      html += `
        <div class="timeline-item">
          <div class="timeline-dot completed"></div>
          <div class="timeline-content">
            <div class="timeline-title">
              <span>Manutenção Concluída</span>
              <span class="timeline-date">${verifyDate}</span>
            </div>
            <div class="timeline-description">Processo finalizado.</div>
          </div>
        </div>`;
    }
  }

  html += `
    </div>
  </div>`;

  container.innerHTML = html;
}

// Indicar que utilities.js foi carregado corretamente
window.UTILITIES_LOADED = true;
console.log("Utilities.js carregado com sucesso.");
</artifact>
