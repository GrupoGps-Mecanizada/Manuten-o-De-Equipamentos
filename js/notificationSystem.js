/**
 * Sistema de Dupla Checagem de Manutenção
 * Módulo: Sistema de Notificações em Tempo Real
 * 
 * Este módulo implementa um sistema de notificações avançado com:
 * - Notificações em tempo real
 * - Centro de notificações com histórico
 * - Categorização de notificações por prioridade
 * - Integração com o resto do sistema
 */

const NotificationSystem = (function() {
  // Configurações do sistema de notificações
  const config = {
    checkInterval: 60000, // Verificar novas notificações a cada 1 minuto
    maxNotifications: 100, // Máximo de notificações para armazenar no histórico
    autoCloseTime: 8000,   // Tempo para fechar notificações automáticas (ms)
    sound: true,           // Reproduzir som para notificações importantes
    defaultIcon: 'bell'    // Ícone padrão (pode ser personalizado)
  };

  // Armazenamento local de notificações
  let notificationHistory = [];
  let unreadCount = 0;
  let isInitialized = false;
  let poller = null;

  // Tipos de notificações e seus ícones/cores
  const notificationTypes = {
    maintenance: { icon: '🔧', color: 'var(--primary-color)', sound: 'notification-standard.mp3' },
    verification: { icon: '✓', color: 'var(--status-verification)', sound: 'notification-standard.mp3' },
    critical: { icon: '⚠️', color: 'var(--status-danger)', sound: 'notification-urgent.mp3' },
    system: { icon: 'ℹ️', color: 'var(--text-light)', sound: null },
    success: { icon: '✅', color: 'var(--status-completed)', sound: 'notification-success.mp3' }
  };

  /**
   * Inicializa o sistema de notificações
   */
  function initialize() {
    if (isInitialized) {
      console.log("Sistema de notificações já inicializado.");
      return;
    }

    console.log("Inicializando sistema de notificações...");
    
    // Criar elementos de UI necessários
    createNotificationUI();
    
    // Carregar histórico do localStorage se disponível
    loadNotificationHistory();
    
    // Iniciar polling para verificar novas notificações
    startNotificationPolling();
    
    // Configurar listeners de eventos
    setupEventListeners();
    
    isInitialized = true;
    console.log("Sistema de notificações inicializado com sucesso.");
    
    // Mostrar notificação de boas-vindas
    showNotification({
      title: 'Sistema de Notificações Ativado',
      message: 'Você receberá alertas sobre manutenções e verificações importantes.',
      type: 'system',
      autoClose: true
    });
  }

  /**
   * Cria elementos da UI para o sistema de notificações
   */
  function createNotificationUI() {
    // Verificar se o container já existe
    let container = document.getElementById('notification-center-container');
    if (container) return;
    
    // Criar container principal
    container = document.createElement('div');
    container.id = 'notification-center-container';
    container.className = 'notification-center-container';
    
    // Adicionar estilos inline para garantir que funcionem independente do CSS
    container.style.cssText = `
      position: fixed;
      top: 0;
      right: -350px;
      width: 350px;
      max-width: 90vw;
      height: 100vh;
      background-color: #fff;
      box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
      z-index: 9999;
      transition: right 0.3s ease;
      display: flex;
      flex-direction: column;
    `;
    
    // Criar header
    const header = document.createElement('div');
    header.className = 'notification-center-header';
    header.style.cssText = `
      padding: 15px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    
    const title = document.createElement('h3');
    title.textContent = 'Centro de Notificações';
    title.style.cssText = `
      margin: 0;
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--primary-color, #1a5fb4);
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.id = 'close-notification-center';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--text-light, #5e6c84);
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s ease;
    `;
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // Criar área de conteúdo
    const content = document.createElement('div');
    content.id = 'notification-center-content';
    content.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 10px;
    `;
    
    // Criar rodapé
    const footer = document.createElement('div');
    footer.className = 'notification-center-footer';
    footer.style.cssText = `
      padding: 10px 15px;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      display: flex;
      justify-content: space-between;
    `;
    
    const clearAllBtn = document.createElement('button');
    clearAllBtn.textContent = 'Limpar Tudo';
    clearAllBtn.id = 'clear-all-notifications';
    clearAllBtn.style.cssText = `
      background: none;
      border: none;
      color: var(--text-light, #5e6c84);
      cursor: pointer;
      font-size: 0.9rem;
      padding: 5px 10px;
      transition: all 0.2s ease;
    `;
    
    const settingsBtn = document.createElement('button');
    settingsBtn.textContent = 'Configurações';
    settingsBtn.id = 'notification-settings';
    settingsBtn.style.cssText = `
      background: none;
      border: none;
      color: var(--primary-color, #1a5fb4);
      cursor: pointer;
      font-size: 0.9rem;
      padding: 5px 10px;
      transition: all 0.2s ease;
    `;
    
    footer.appendChild(clearAllBtn);
    footer.appendChild(settingsBtn);
    
    // Adicionar elementos ao container
    container.appendChild(header);
    container.appendChild(content);
    container.appendChild(footer);
    
    // Adicionar ao body
    document.body.appendChild(container);
    
    // Criar botão para abrir o centro de notificações
    const notificationBtn = document.createElement('button');
    notificationBtn.id = 'notification-center-toggle';
    notificationBtn.className = 'notification-center-toggle';
    notificationBtn.innerHTML = `
      <span class="notification-icon">🔔</span>
      <span class="notification-count">0</span>
    `;
    notificationBtn.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background-color: var(--primary-color, #1a5fb4);
      color: white;
      border: none;
      cursor: pointer;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    `;
    
    const countBadge = notificationBtn.querySelector('.notification-count');
    countBadge.style.cssText = `
      position: absolute;
      top: -5px;
      right: -5px;
      background-color: var(--status-danger, #cc0000);
      color: white;
      font-size: 0.7rem;
      font-weight: bold;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
      transition: transform 0.2s ease;
    `;
    
    document.body.appendChild(notificationBtn);
    
    // Atualizar estilo global para o overlay
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .notification-center-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 9997;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease;
      }
      
      .notification-item {
        padding: 15px;
        border-radius: 8px;
        background-color: white;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        margin-bottom: 10px;
        border-left: 4px solid var(--primary-color, #1a5fb4);
        transition: all 0.2s ease;
        cursor: pointer;
      }
      
      .notification-item:hover {
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }
      
      .notification-item .notification-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
      }
      
      .notification-item .notification-title {
        font-weight: 600;
        font-size: 0.95rem;
      }
      
      .notification-item .notification-time {
        font-size: 0.8rem;
        color: var(--text-light, #5e6c84);
      }
      
      .notification-item .notification-message {
        font-size: 0.9rem;
        color: var(--text-dark, #333333);
      }
      
      .notification-item.unread {
        background-color: rgba(26, 95, 180, 0.05);
      }
      
      .notification-item.critical {
        border-left-color: var(--status-danger, #cc0000);
      }
      
      .notification-item.success {
        border-left-color: var(--status-completed, #2b9348);
      }
      
      .notification-item.verification {
        border-left-color: var(--status-verification, #0066cc);
      }
      
      .notification-empty {
        padding: 30px;
        text-align: center;
        color: var(--text-light, #5e6c84);
        font-style: italic;
      }
    `;
    
    document.head.appendChild(styleElement);
    
    // Criar overlay para fechar ao clicar fora
    const overlay = document.createElement('div');
    overlay.className = 'notification-center-overlay';
    document.body.appendChild(overlay);
  }

  /**
   * Configura listeners de eventos
   */
  function setupEventListeners() {
    // Botão para abrir o centro de notificações
    const toggleBtn = document.getElementById('notification-center-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleNotificationCenter);
    }
    
    // Botão para fechar o centro de notificações
    const closeBtn = document.getElementById('close-notification-center');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeNotificationCenter);
    }
    
    // Overlay para fechar ao clicar fora
    const overlay = document.querySelector('.notification-center-overlay');
    if (overlay) {
      overlay.addEventListener('click', closeNotificationCenter);
    }
    
    // Botão para limpar todas as notificações
    const clearAllBtn = document.getElementById('clear-all-notifications');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', clearAllNotifications);
    }
    
    // Botão de configurações
    const settingsBtn = document.getElementById('notification-settings');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', openNotificationSettings);
    }
  }

  /**
   * Inicia o polling para verificar novas notificações
   */
  function startNotificationPolling() {
    if (poller) {
      clearInterval(poller);
    }
    
    // Verificar novas notificações imediatamente
    checkForNewNotifications();
    
    // Configurar verificação periódica
    poller = setInterval(checkForNewNotifications, config.checkInterval);
    console.log(`Polling de notificações iniciado (intervalo: ${config.checkInterval / 1000}s)`);
  }

  /**
   * Verifica se há novas notificações
   */
  function checkForNewNotifications() {
    // Este é o ponto onde integramos com a API para buscar notificações
    // Por enquanto, simulamos algumas notificações para demonstração
    
    // Na implementação real, você chamaria a API:
    if (window.API && typeof API.getNotifications === 'function') {
      API.getNotifications()
        .then(response => {
          if (response.success && Array.isArray(response.notifications)) {
            processNewNotifications(response.notifications);
          }
        })
        .catch(error => {
          console.error("Erro ao buscar notificações:", error);
        });
    } else {
      // Para demonstração, podemos simular algumas notificações aleatoriamente
      if (Math.random() < 0.3) { // 30% de chance de gerar uma notificação de teste
        const demoTypes = ['maintenance', 'verification', 'system'];
        const type = demoTypes[Math.floor(Math.random() * demoTypes.length)];
        
        const demoNotification = {
          id: 'demo-' + Date.now(),
          title: `Notificação de ${type} de teste`,
          message: `Esta é uma notificação de teste do tipo ${type}.`,
          type: type,
          timestamp: new Date().toISOString(),
          read: false
        };
        
        processNewNotifications([demoNotification]);
      }
    }
  }

  /**
   * Processa novas notificações recebidas
   * @param {Array} notifications - Array de objetos de notificação
   */
  function processNewNotifications(notifications) {
    if (!Array.isArray(notifications) || notifications.length === 0) return;
    
    let hasNewNotifications = false;
    
    notifications.forEach(notification => {
      // Verificar se esta notificação já existe no histórico
      const exists = notificationHistory.some(item => item.id === notification.id);
      
      if (!exists) {
        // Adicionar ao início da lista (mais recente primeiro)
        notificationHistory.unshift(notification);
        hasNewNotifications = true;
        
        // Incrementar contador de não lidas
        if (!notification.read) {
          unreadCount++;
        }
        
        // Mostrar notificação na tela
        showNotification(notification);
      }
    });
    
    // Limitar o tamanho do histórico
    if (notificationHistory.length > config.maxNotifications) {
      notificationHistory = notificationHistory.slice(0, config.maxNotifications);
    }
    
    // Atualizar contador no botão
    updateNotificationCount();
    
    // Atualizar conteúdo do centro de notificações
    updateNotificationCenter();
    
    // Salvar histórico
    saveNotificationHistory();
    
    return hasNewNotifications;
  }

  /**
   * Mostra uma notificação na tela
   * @param {Object} notification - Objeto de notificação
   */
  function showNotification(notification) {
    // Verificar se temos um container para as notificações
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      document.body.appendChild(container);
    }
    
    // Obter tipo de notificação e suas propriedades
    const type = notification.type || 'system';
    const typeConfig = notificationTypes[type] || notificationTypes.system;
    
    // Criar elemento de notificação
    const notificationEl = document.createElement('div');
    notificationEl.className = `notification-popup ${type}`;
    notificationEl.id = `notification-${notification.id || Date.now()}`;
    
    // Definir HTML interno
    notificationEl.innerHTML = `
      <div class="notification-icon">${typeConfig.icon}</div>
      <div class="notification-content">
        <div class="notification-title">${notification.title || 'Nova Notificação'}</div>
        <div class="notification-message">${notification.message || ''}</div>
      </div>
      <span class="close-btn">×</span>
    `;
    
    // Adicionar ao container
    container.appendChild(notificationEl);
    
    // Reproduzir som se configurado
    if (config.sound && typeConfig.sound) {
      // Implementar reprodução de som aqui
      // playNotificationSound(typeConfig.sound);
    }
    
    // Configurar evento para fechar
    const closeBtn = notificationEl.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        removeNotificationElement(notificationEl);
      });
    }
    
    // Auto-fechar se configurado
    if (notification.autoClose !== false) {
      setTimeout(() => {
        removeNotificationElement(notificationEl);
      }, config.autoCloseTime);
    }
    
    // Adicionar animação de entrada
    setTimeout(() => {
      notificationEl.style.opacity = '1';
      notificationEl.style.transform = 'translateX(0)';
    }, 10);
  }

  /**
   * Remove um elemento de notificação com animação
   * @param {HTMLElement} element - Elemento de notificação
   */
  function removeNotificationElement(element) {
    if (!element) return;
    
    // Adicionar animação de saída
    element.style.opacity = '0';
    element.style.transform = 'translateX(100%)';
    
    // Remover após a animação
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }, 300);
  }

  /**
   * Atualiza o contador de notificações não lidas
   */
  function updateNotificationCount() {
    const countElement = document.querySelector('#notification-center-toggle .notification-count');
    if (countElement) {
      countElement.textContent = unreadCount > 99 ? '99+' : unreadCount;
      countElement.style.display = unreadCount > 0 ? 'flex' : 'none';
      
      // Adicionar animação se houver novas notificações
      if (unreadCount > 0) {
        countElement.style.transform = 'scale(1.2)';
        setTimeout(() => {
          countElement.style.transform = 'scale(1)';
        }, 200);
      }
    }
  }

  /**
   * Atualiza o conteúdo do centro de notificações
   */
  function updateNotificationCenter() {
    const content = document.getElementById('notification-center-content');
    if (!content) return;
    
    // Limpar conteúdo atual
    content.innerHTML = '';
    
    // Verificar se há notificações
    if (notificationHistory.length === 0) {
      content.innerHTML = `
        <div class="notification-empty">
          Não há notificações para exibir.
        </div>
      `;
      return;
    }
    
    // Adicionar cada notificação
    notificationHistory.forEach(notification => {
      const type = notification.type || 'system';
      const unread = !notification.read ? 'unread' : '';
      
      // Formatar data
      const date = new Date(notification.timestamp || Date.now());
      const timeAgo = formatTimeAgo(date);
      
      // Criar elemento de notificação
      const notificationItem = document.createElement('div');
      notificationItem.className = `notification-item ${type} ${unread}`;
      notificationItem.setAttribute('data-id', notification.id);
      
      // Definir HTML interno
      notificationItem.innerHTML = `
        <div class="notification-header">
          <div class="notification-title">${notification.title || 'Notificação'}</div>
          <div class="notification-time">${timeAgo}</div>
        </div>
        <div class="notification-message">${notification.message || ''}</div>
      `;
      
      // Adicionar evento para marcar como lido
      notificationItem.addEventListener('click', () => {
        markNotificationAsRead(notification.id);
      });
      
      // Adicionar ao container
      content.appendChild(notificationItem);
    });
  }

  /**
   * Marca uma notificação como lida
   * @param {string} id - ID da notificação
   */
  function markNotificationAsRead(id) {
    if (!id) return;
    
    // Encontrar a notificação no histórico
    const notification = notificationHistory.find(item => item.id === id);
    if (notification && !notification.read) {
      notification.read = true;
      unreadCount = Math.max(0, unreadCount - 1);
      
      // Atualizar contador
      updateNotificationCount();
      
      // Atualizar UI
      const item = document.querySelector(`.notification-item[data-id="${id}"]`);
      if (item) {
        item.classList.remove('unread');
      }
      
      // Salvar histórico
      saveNotificationHistory();
      
      // Se integrado com API, informar que a notificação foi lida
      if (window.API && typeof API.markNotificationAsRead === 'function') {
        API.markNotificationAsRead(id).catch(error => {
          console.error("Erro ao marcar notificação como lida:", error);
        });
      }
    }
  }

  /**
   * Abre o centro de notificações
   */
  function openNotificationCenter() {
    const center = document.getElementById('notification-center-container');
    const overlay = document.querySelector('.notification-center-overlay');
    
    if (center) {
      center.style.right = '0';
    }
    
    if (overlay) {
      overlay.style.opacity = '1';
      overlay.style.visibility = 'visible';
    }
  }

  /**
   * Fecha o centro de notificações
   */
  function closeNotificationCenter() {
    const center = document.getElementById('notification-center-container');
    const overlay = document.querySelector('.notification-center-overlay');
    
    if (center) {
      center.style.right = '-350px';
    }
    
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.style.visibility = 'hidden';
      }, 300);
    }
  }

  /**
   * Alterna o estado do centro de notificações
   */
  function toggleNotificationCenter() {
    const center = document.getElementById('notification-center-container');
    
    if (center && center.style.right === '0px') {
      closeNotificationCenter();
    } else {
      openNotificationCenter();
    }
  }

  /**
   * Limpa todas as notificações
   */
  function clearAllNotifications() {
    // Confirmar antes de limpar
    if (confirm('Deseja realmente limpar todas as notificações?')) {
      notificationHistory = [];
      unreadCount = 0;
      
      // Atualizar UI
      updateNotificationCount();
      updateNotificationCenter();
      
      // Salvar histórico
      saveNotificationHistory();
      
      // Informar o usuário
      if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
        Utilities.showNotification('Todas as notificações foram removidas.', 'info');
      }
    }
  }

  /**
   * Abre as configurações de notificação
   */
  function openNotificationSettings() {
    // Implementar um modal de configurações
    // Por enquanto, apenas exibimos as configurações atuais
    console.log("Configurações de notificação:", config);
    
    alert('Configurações de notificação serão implementadas em uma versão futura.');
  }

  /**
   * Salva o histórico de notificações no localStorage
   */
  function saveNotificationHistory() {
    try {
      localStorage.setItem('notificationHistory', JSON.stringify(notificationHistory));
      localStorage.setItem('unreadCount', unreadCount.toString());
      console.log("Histórico de notificações salvo no localStorage.");
    } catch (error) {
      console.error("Erro ao salvar histórico de notificações:", error);
    }
  }

  /**
   * Carrega o histórico de notificações do localStorage
   */
  function loadNotificationHistory() {
    try {
      const savedHistory = localStorage.getItem('notificationHistory');
      const savedCount = localStorage.getItem('unreadCount');
      
      if (savedHistory) {
        notificationHistory = JSON.parse(savedHistory);
        console.log(`Carregado histórico com ${notificationHistory.length} notificações.`);
      }
      
      if (savedCount) {
        unreadCount = parseInt(savedCount, 10) || 0;
      }
      
      // Atualizar UI
      updateNotificationCount();
      updateNotificationCenter();
    } catch (error) {
      console.error("Erro ao carregar histórico de notificações:", error);
      notificationHistory = [];
      unreadCount = 0;
    }
  }

  /**
   * Formata uma data para tempo relativo (ex: "há 5 minutos")
   * @param {Date} date - Data para formatar
   * @returns {string} Texto formatado
   */
  function formatTimeAgo(date) {
    if (!date) return '';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Converter para segundos
    const seconds = Math.floor(diff / 1000);
    
    // Menos de um minuto
    if (seconds < 60) {
      return 'Agora mesmo';
    }
    
    // Menos de uma hora
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `há ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    }
    
    // Menos de um dia
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }
    
    // Menos de uma semana
    if (seconds < 604800) {
      const days = Math.floor(seconds / 86400);
      return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
    }
    
    // Formatação de data padrão
    return date.toLocaleDateString();
  }

  /**
   * Adiciona uma notificação manualmente
   * Útil para módulos do sistema informarem eventos importantes
   * @param {Object} notification - Objeto de notificação
   */
  function addNotification(notification) {
    if (!notification) return;
    
    // Adicionar ID e timestamp se não existirem
    const fullNotification = {
      ...notification,
      id: notification.id || `notification-${Date.now()}`,
      timestamp: notification.timestamp || new Date().toISOString(),
      read: false
    };
    
    // Processar como uma nova notificação
    processNewNotifications([fullNotification]);
    
    return fullNotification.id;
  }

  // API pública do módulo
  return {
    initialize,
    addNotification,
    markAsRead: markNotificationAsRead,
    clearAll: clearAllNotifications,
    openCenter: openNotificationCenter,
    closeCenter: closeNotificationCenter,
    toggleCenter: toggleNotificationCenter
  };
})();

// Exportar para uso global
window.NotificationSystem = NotificationSystem;

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  // Dar um pequeno delay para garantir que outros sistemas estejam inicializados
  setTimeout(() => {
    NotificationSystem.initialize();
  }, 1000);
});

// Exemplos de uso:
// NotificationSystem.addNotification({
//   title: 'Manutenção Crítica',
//   message: 'Equipamento XYZ-123 precisa de verificação urgente.',
//   type: 'critical'
// });
