/**
 * Sistema de Dupla Checagem de Manutenção
 * Módulo: Gerenciamento de Usuários e Papéis
 * 
 * Este módulo implementa:
 * - Autenticação de usuários
 * - Gerenciamento de funções/papéis
 * - Controle de acesso baseado em permissões
 * - Interface de administração de usuários
 */

const UserRoles = (function() {
  // Constantes de papéis de usuário
  const ROLES = {
    ADMIN: 'admin',            // Acesso total ao sistema
    MANAGER: 'manager',        // Gerente - visualização total, aprovações
    TECHNICIAN: 'technician',  // Técnico - criar/editar manutenções 
    VERIFIER: 'verifier',      // Verificador - aprovar/reprovar manutenções
    VIEWER: 'viewer'           // Visualizador - somente leitura
  };

  // Mapeamento de permissões por papel
  const PERMISSIONS = {
    [ROLES.ADMIN]: [
      'view_all', 'create_maintenance', 'edit_maintenance', 'delete_maintenance',
      'verify_maintenance', 'generate_reports', 'manage_users', 'view_analytics',
      'configure_system'
    ],
    [ROLES.MANAGER]: [
      'view_all', 'create_maintenance', 'edit_maintenance', 
      'verify_maintenance', 'generate_reports', 'view_analytics'
    ],
    [ROLES.TECHNICIAN]: [
      'view_all', 'create_maintenance', 'edit_own_maintenance'
    ],
    [ROLES.VERIFIER]: [
      'view_all', 'verify_maintenance'
    ],
    [ROLES.VIEWER]: [
      'view_all'
    ]
  };

  // Estado do módulo
  let currentUser = null;
  let isInitialized = false;
  
  // Armazenamento em memória para usuários (em produção, seria substituído por API)
  let users = [
    {
      id: 1,
      username: 'admin',
      name: 'Administrador',
      email: 'admin@example.com',
      role: ROLES.ADMIN,
      department: 'TI',
      lastLogin: null,
      isActive: true
    },
    {
      id: 2,
      username: 'gerente',
      name: 'Carlos Oliveira',
      email: 'carlos@example.com',
      role: ROLES.MANAGER,
      department: 'Manutenção',
      lastLogin: null,
      isActive: true
    },
    {
      id: 3,
      username: 'tecnico',
      name: 'Roberto Santos',
      email: 'roberto@example.com',
      role: ROLES.TECHNICIAN,
      department: 'Operações',
      lastLogin: null,
      isActive: true
    },
    {
      id: 4,
      username: 'verificador',
      name: 'Ana Silva',
      email: 'ana@example.com',
      role: ROLES.VERIFIER,
      department: 'Qualidade',
      lastLogin: null,
      isActive: true
    },
    {
      id: 5,
      username: 'visualizador',
      name: 'Maria Santos',
      email: 'maria@example.com',
      role: ROLES.VIEWER,
      department: 'Gestão',
      lastLogin: null,
      isActive: true
    }
  ];

  /**
   * Inicializa o módulo de usuários e papéis
   */
  function initialize() {
    if (isInitialized) {
      console.log("Módulo de usuários já inicializado.");
      return;
    }

    console.log("Inicializando módulo de usuários e papéis...");
    
    // Verificar se há um usuário já autenticado
    loadUserFromSession();
    
    // Adicionar botão de login/usuário ao cabeçalho
    createUserButton();
    
    // Configurar handlers de eventos
    setupEventListeners();
    
    // Aplicar restrições de UI baseadas em permissões
    applyPermissionRestrictions();
    
    isInitialized = true;
    console.log("Módulo de usuários inicializado com sucesso.");
  }

  /**
   * Tenta carregar usuário da sessão atual
   */
  function loadUserFromSession() {
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        currentUser = JSON.parse(storedUser);
        console.log(`Usuário carregado da sessão: ${currentUser.name}`);
        updateUserInterface();
      } else {
        console.log("Nenhum usuário em sessão.");
      }
    } catch (error) {
      console.error("Erro ao carregar usuário da sessão:", error);
      // Em caso de erro, limpar a sessão
      localStorage.removeItem('currentUser');
      currentUser = null;
    }
  }

  /**
   * Cria botão de usuário no cabeçalho
   */
  function createUserButton() {
    const header = document.querySelector('.header');
    if (!header) return;
    
    // Verificar se o botão já existe
    if (document.getElementById('user-button')) return;
    
    // Criar container para botão de usuário
    const userContainer = document.createElement('div');
    userContainer.className = 'user-button-container';
    userContainer.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
    `;
    
    // Botão de usuário ou login
    const userButton = document.createElement('button');
    userButton.id = 'user-button';
    userButton.className = 'user-button';
    
    if (currentUser) {
      // Já tem usuário - mostrar informações
      userButton.innerHTML = `
        <span class="user-avatar">${currentUser.name.charAt(0)}</span>
        <span class="user-name">${currentUser.name}</span>
        <span class="user-dropdown-icon">▾</span>
      `;
    } else {
      // Não tem usuário - mostrar botão de login
      userButton.innerHTML = `
        <span class="user-login-icon">👤</span>
        <span class="user-login-text">Entrar</span>
      `;
    }
    
    userButton.style.cssText = `
      background-color: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 4px;
      color: white;
      padding: 8px 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      transition: all 0.2s ease;
    `;
    
    // Adicionar estilos para elementos internos
    const style = document.createElement('style');
    style.textContent = `
      .user-avatar {
        width: 24px;
        height: 24px;
        background-color: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
      }
      
      .user-dropdown-icon, .user-login-icon {
        opacity: 0.8;
        font-size: 0.8rem;
      }
      
      .user-button:hover {
        background-color: rgba(255, 255, 255, 0.25);
      }
      
      .user-menu {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 5px;
        background-color: white;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        overflow: hidden;
        width: 200px;
        z-index: 1000;
        display: none;
      }
      
      .user-menu.active {
        display: block;
        animation: fadeIn 0.2s ease-out;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .user-menu-header {
        padding: 15px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      }
      
      .user-menu-name {
        font-weight: 600;
        color: var(--text-dark, #333333);
        margin: 0 0 2px 0;
        font-size: 0.95rem;
      }
      
      .user-menu-role {
        color: var(--primary-color, #1a5fb4);
        font-size: 0.8rem;
        margin: 0;
      }
      
      .user-menu-items {
        padding: 8px 0;
      }
      
      .user-menu-item {
        padding: 10px 15px;
        cursor: pointer;
        color: var(--text-dark, #333333);
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: background-color 0.2s ease;
      }
      
      .user-menu-item:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }
      
      .user-menu-item-icon {
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.7;
      }
      
      .user-menu-divider {
        height: 1px;
        background-color: rgba(0, 0, 0, 0.05);
        margin: 8px 0;
      }
      
      .user-menu-item.logout {
        color: var(--status-danger, #cc0000);
      }
      
      /* Estilos para o modal de login */
      .login-modal {
        width: 350px;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
        animation: modalSlideIn 0.3s ease-out forwards;
        overflow: hidden;
      }
      
      @keyframes modalSlideIn {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .login-modal-header {
        background-color: var(--primary-color, #1a5fb4);
        color: white;
        padding: 20px;
      }
      
      .login-modal-title {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 500;
      }
      
      .login-modal-body {
        padding: 20px;
      }
      
      .login-form-group {
        margin-bottom: 20px;
      }
      
      .login-form-label {
        display: block;
        margin-bottom: 5px;
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--text-dark, #333333);
      }
      
      .login-form-input {
        width: 100%;
        padding: 10px 12px;
        font-size: 0.9rem;
        border: 1px solid rgba(0, 0, 0, 0.15);
        border-radius: 4px;
      }
      
      .login-form-input:focus {
        outline: none;
        border-color: var(--primary-color, #1a5fb4);
        box-shadow: 0 0 0 2px rgba(26, 95, 180, 0.1);
      }
      
      .login-error {
        color: var(--status-danger, #cc0000);
        font-size: 0.85rem;
        margin-top: 5px;
        display: none;
      }
      
      .login-buttons {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
      }
      
      .login-demo-users {
        margin-top: 20px;
        border-top: 1px solid rgba(0, 0, 0, 0.05);
        padding-top: 15px;
      }
      
      .login-demo-title {
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--text-dark, #333333);
        margin: 0 0 10px 0;
      }
      
      .demo-user-btn {
        background-color: rgba(26, 95, 180, 0.05);
        border: 1px solid rgba(26, 95, 180, 0.1);
        border-radius: 4px;
        padding: 6px 10px;
        margin-right: 8px;
        margin-bottom: 8px;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .demo-user-btn:hover {
        background-color: rgba(26, 95, 180, 0.1);
        border-color: rgba(26, 95, 180, 0.2);
      }
    `;
    
    document.head.appendChild(style);
    
    // Menu de usuário
    const userMenu = document.createElement('div');
    userMenu.className = 'user-menu';
    userMenu.id = 'user-menu';
    
    if (currentUser) {
      // Menu para usuário logado
      const roleName = getRoleName(currentUser.role);
      
      userMenu.innerHTML = `
        <div class="user-menu-header">
          <p class="user-menu-name">${currentUser.name}</p>
          <p class="user-menu-role">${roleName}</p>
        </div>
        <div class="user-menu-items">
          <div class="user-menu-item" id="profile-menu-item">
            <span class="user-menu-item-icon">👤</span>
            <span>Meu Perfil</span>
          </div>
          ${currentUser.role === ROLES.ADMIN ? `
            <div class="user-menu-item" id="users-admin-menu-item">
              <span class="user-menu-item-icon">👥</span>
              <span>Gerenciar Usuários</span>
            </div>
          ` : ''}
          <div class="user-menu-divider"></div>
          <div class="user-menu-item logout" id="logout-menu-item">
            <span class="user-menu-item-icon">🚪</span>
            <span>Sair</span>
          </div>
        </div>
      `;
    }
    
    // Adicionar botão e menu ao container
    userContainer.appendChild(userButton);
    userContainer.appendChild(userMenu);
    
    // Adicionar ao cabeçalho
    header.appendChild(userContainer);
  }

  /**
   * Configura listeners de eventos para o módulo
   */
  function setupEventListeners() {
    // Botão de usuário
    const userButton = document.getElementById('user-button');
    if (userButton) {
      userButton.addEventListener('click', function(e) {
        e.stopPropagation();
        
        if (currentUser) {
          // Alternar menu
          const userMenu = document.getElementById('user-menu');
          if (userMenu) {
            userMenu.classList.toggle('active');
          }
        } else {
          // Mostrar modal de login
          showLoginModal();
        }
      });
    }
    
    // Fechar menu ao clicar fora
    document.addEventListener('click', function(e) {
      const userMenu = document.getElementById('user-menu');
      if (userMenu && userMenu.classList.contains('active')) {
        if (!userMenu.contains(e.target) && e.target.id !== 'user-button') {
          userMenu.classList.remove('active');
        }
      }
    });
    
    // Delegação de eventos para itens do menu
    document.addEventListener('click', function(e) {
      // Logout
      if (e.target.closest('#logout-menu-item')) {
        logout();
      }
      
      // Perfil
      if (e.target.closest('#profile-menu-item')) {
        showProfileModal();
      }
      
      // Administração de usuários
      if (e.target.closest('#users-admin-menu-item')) {
        showUserAdminModal();
      }
    });
  }

  /**
   * Mostra modal de login
   */
  function showLoginModal() {
    // Verificar se já existe um modal aberto
    if (document.querySelector('.modal-overlay')) {
      return;
    }
    
    // Criar overlay para o modal
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease-in-out forwards;
    `;
    
    // Criar modal de login
    const loginModal = document.createElement('div');
    loginModal.className = 'login-modal';
    
    // Conteúdo do modal
    loginModal.innerHTML = `
      <div class="login-modal-header">
        <h3 class="login-modal-title">Login do Sistema</h3>
      </div>
      <div class="login-modal-body">
        <form id="login-form">
          <div class="login-form-group">
            <label class="login-form-label" for="login-username">Usuário</label>
            <input type="text" id="login-username" class="login-form-input" autocomplete="username">
          </div>
          <div class="login-form-group">
            <label class="login-form-label" for="login-password">Senha</label>
            <input type="password" id="login-password" class="login-form-input" autocomplete="current-password">
            <div id="login-error" class="login-error">Nome de usuário ou senha incorretos</div>
          </div>
          <div class="login-buttons">
            <button type="button" id="login-cancel-btn" class="btn btn-secondary" style="background-color: var(--text-light, #5e6c84);">Cancelar</button>
            <button type="submit" id="login-submit-btn" class="btn" style="background-color: var(--primary-color, #1a5fb4);">Entrar</button>
          </div>
        </form>
        
        <div class="login-demo-users">
          <div class="login-demo-title">Usuários de Demonstração:</div>
          <div style="display: flex; flex-wrap: wrap;">
            <button class="demo-user-btn" data-username="admin">Admin</button>
            <button class="demo-user-btn" data-username="gerente">Gerente</button>
            <button class="demo-user-btn" data-username="tecnico">Técnico</button>
            <button class="demo-user-btn" data-username="verificador">Verificador</button>
            <button class="demo-user-btn" data-username="visualizador">Visualizador</button>
          </div>
        </div>
      </div>
    `;
    
    // Adicionar o modal ao overlay
    overlay.appendChild(loginModal);
    
    // Adicionar ao body
    document.body.appendChild(overlay);
    
    // Configurar eventos
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const loginCancelBtn = document.getElementById('login-cancel-btn');
    const demoUserBtns = document.querySelectorAll('.demo-user-btn');
    
    // Evento de submit do formulário
    if (loginForm) {
      loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        if (!username || !password) {
          loginError.style.display = 'block';
          return;
        }
        
        // Para demonstração, aceitar qualquer senha
        const user = users.find(u => u.username === username);
        
        if (user) {
          loginSuccess(user);
          overlay.remove();
        } else {
          loginError.style.display = 'block';
        }
      });
    }
    
    // Botão de cancelar
    if (loginCancelBtn) {
      loginCancelBtn.addEventListener('click', function() {
        overlay.remove();
      });
    }
    
    // Botões de usuários de demonstração
    demoUserBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const username = this.getAttribute('data-username');
        document.getElementById('login-username').value = username;
        document.getElementById('login-password').value = 'senha123'; // Senha fictícia para demo
      });
    });
    
    // Fechar ao clicar fora do modal
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
    
    // Focar no campo de usuário
    const usernameField = document.getElementById('login-username');
    if (usernameField) {
      usernameField.focus();
    }
  }

  /**
   * Processa login bem-sucedido
   * @param {Object} user - Dados do usuário
   */
  function loginSuccess(user) {
    // Atualizar dados do usuário
    user.lastLogin = new Date().toISOString();
    currentUser = user;
    
    // Salvar na sessão
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Atualizar interface
    updateUserInterface();
    
    // Aplicar restrições de permissão
    applyPermissionRestrictions();
    
    // Notificar sucesso
    showNotification(`Bem-vindo, ${user.name}!`, 'success');
    
    console.log(`Login realizado com sucesso: ${user.name} (${user.role})`);
  }

  /**
   * Processa logout do usuário
   */
  function logout() {
    // Limpar dados do usuário
    currentUser = null;
    localStorage.removeItem('currentUser');
    
    // Atualizar interface
    updateUserInterface();
    
    // Remover restrições (todos podem ver a dashboard)
    document.querySelectorAll('.restricted').forEach(el => {
      el.classList.remove('restricted');
    });
    
    // Voltar para a aba dashboard
    const dashboardTab = document.querySelector('.tab[data-tab="dashboard"]');
    if (dashboardTab) {
      dashboardTab.click();
    }
    
    // Fechar o menu de usuário
    const userMenu = document.getElementById('user-menu');
    if (userMenu) {
      userMenu.classList.remove('active');
    }
    
    // Notificar sucesso
    showNotification('Você saiu do sistema', 'info');
    
    console.log('Logout realizado com sucesso');
  }

  /**
   * Atualiza interface com base no usuário atual
   */
  function updateUserInterface() {
    // Atualizar botão de usuário
    const userButton = document.getElementById('user-button');
    if (!userButton) {
      createUserButton();
      return;
    }
    
    if (currentUser) {
      // Já tem usuário - mostrar informações
      userButton.innerHTML = `
        <span class="user-avatar">${currentUser.name.charAt(0)}</span>
        <span class="user-name">${currentUser.name}</span>
        <span class="user-dropdown-icon">▾</span>
      `;
    } else {
      // Não tem usuário - mostrar botão de login
      userButton.innerHTML = `
        <span class="user-login-icon">👤</span>
        <span class="user-login-text">Entrar</span>
      `;
    }
    
    // Atualizar menu de usuário
    const userMenu = document.getElementById('user-menu');
    if (userMenu) {
      if (currentUser) {
        const roleName = getRoleName(currentUser.role);
        
        userMenu.innerHTML = `
          <div class="user-menu-header">
            <p class="user-menu-name">${currentUser.name}</p>
            <p class="user-menu-role">${roleName}</p>
          </div>
          <div class="user-menu-items">
            <div class="user-menu-item" id="profile-menu-item">
              <span class="user-menu-item-icon">👤</span>
              <span>Meu Perfil</span>
            </div>
            ${currentUser.role === ROLES.ADMIN ? `
              <div class="user-menu-item" id="users-admin-menu-item">
                <span class="user-menu-item-icon">👥</span>
                <span>Gerenciar Usuários</span>
              </div>
            ` : ''}
            <div class="user-menu-divider"></div>
            <div class="user-menu-item logout" id="logout-menu-item">
              <span class="user-menu-item-icon">🚪</span>
              <span>Sair</span>
            </div>
          </div>
        `;
      } else {
        userMenu.innerHTML = '';
      }
    }
  }

  /**
   * Aplica restrições de interface com base nas permissões do usuário
   */
  function applyPermissionRestrictions() {
    if (!currentUser) {
      // Sem usuário - restringir tudo exceto dashboard
      restrictTab('maintenance');
      restrictTab('verification');
      restrictTab('reports');
      hideNewMaintenanceButton();
      return;
    }
    
    // Obter permissões do usuário
    const userPermissions = PERMISSIONS[currentUser.role] || [];
    
    // Verificar cada restrição
    if (!hasPermission('create_maintenance')) {
      hideNewMaintenanceButton();
    } else {
      showNewMaintenanceButton();
    }
    
    // Controlar acesso às abas
    if (!hasPermission('view_all')) {
      restrictTab('maintenance');
      restrictTab('verification');
      restrictTab('reports');
    } else {
      unrestrictTab('maintenance');
      
      // Verificadores e Admins podem acessar verificações
      if (hasPermission('verify_maintenance')) {
        unrestrictTab('verification');
      } else {
        restrictTab('verification');
      }
      
      // Gerentes, Admins podem acessar relatórios
      if (hasPermission('generate_reports')) {
        unrestrictTab('reports');
      } else {
        restrictTab('reports');
      }
    }
  }

  /**
   * Verifica se o usuário atual tem uma permissão específica
   * @param {string} permission - Permissão a verificar
   * @returns {boolean} Verdadeiro se tem permissão
   */
  function hasPermission(permission) {
    if (!currentUser) return false;
    
    const userPermissions = PERMISSIONS[currentUser.role] || [];
    return userPermissions.includes(permission);
  }

  /**
   * Restringe acesso a uma aba
   * @param {string} tabName - Nome da aba
   */
  function restrictTab(tabName) {
    const tab = document.querySelector(`.tab[data-tab="${tabName}"]`);
    if (tab) {
      tab.classList.add('restricted');
      tab.style.opacity = '0.5';
      tab.style.pointerEvents = 'none';
    }
  }

  /**
   * Remove restrição de uma aba
   * @param {string} tabName - Nome da aba
   */
  function unrestrictTab(tabName) {
    const tab = document.querySelector(`.tab[data-tab="${tabName}"]`);
    if (tab) {
      tab.classList.remove('restricted');
      tab.style.opacity = '';
      tab.style.pointerEvents = '';
    }
  }

  /**
   * Esconde o botão de nova manutenção
   */
  function hideNewMaintenanceButton() {
    const newMaintenanceBtn = document.getElementById('new-maintenance');
    if (newMaintenanceBtn) {
      newMaintenanceBtn.style.display = 'none';
    }
  }

  /**
   * Mostra o botão de nova manutenção
   */
  function showNewMaintenanceButton() {
    const newMaintenanceBtn = document.getElementById('new-maintenance');
    if (newMaintenanceBtn) {
      newMaintenanceBtn.style.display = '';
    }
  }

  /**
   * Mostra modal de perfil do usuário
   */
  function showProfileModal() {
    if (!currentUser) return;
    
    // Verificar se já existe um modal aberto
    if (document.querySelector('.modal-overlay')) {
      return;
    }
    
    // Criar overlay para o modal
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease-in-out forwards;
    `;
    
    // Formatar última data de login
    let lastLoginText = 'Nunca';
    if (currentUser.lastLogin) {
      const date = new Date(currentUser.lastLogin);
      lastLoginText = date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Criar modal de perfil
    const profileModal = document.createElement('div');
    profileModal.className = 'login-modal'; // Reutilizar estilos do login
    profileModal.style.width = '400px';
    
    // Conteúdo do modal
    profileModal.innerHTML = `
      <div class="login-modal-header">
        <h3 class="login-modal-title">Perfil do Usuário</h3>
      </div>
      <div class="login-modal-body" style="padding: 20px;">
        <div style="display: flex; margin-bottom: 20px; align-items: center;">
          <div style="width: 60px; height: 60px; background-color: var(--primary-color, #1a5fb4); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; font-weight: 600; margin-right: 15px;">
            ${currentUser.name.charAt(0)}
          </div>
          <div>
            <h3 style="margin: 0 0 5px 0; font-size: 1.2rem; color: var(--text-dark, #333333);">${currentUser.name}</h3>
            <p style="margin: 0; font-size: 0.9rem; color: var(--primary-color, #1a5fb4);">${getRoleName(currentUser.role)}</p>
          </div>
        </div>
        
        <div style="background-color: rgba(0, 0, 0, 0.02); border-radius: 4px; padding: 15px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: var(--text-light, #5e6c84); font-size: 0.9rem; width: 120px;">Usuário:</td>
              <td style="padding: 8px 0; font-size: 0.9rem; color: var(--text-dark, #333333);">${currentUser.username}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: var(--text-light, #5e6c84); font-size: 0.9rem;">Email:</td>
              <td style="padding: 8px 0; font-size: 0.9rem; color: var(--text-dark, #333333);">${currentUser.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: var(--text-light, #5e6c84); font-size: 0.9rem;">Departamento:</td>
              <td style="padding: 8px 0; font-size: 0.9rem; color: var(--text-dark, #333333);">${currentUser.department}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: var(--text-light, #5e6c84); font-size: 0.9rem;">Último Login:</td>
              <td style="padding: 8px 0; font-size: 0.9rem; color: var(--text-dark, #333333);">${lastLoginText}</td>
            </tr>
          </table>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; font-size: 1rem; color: var(--text-dark, #333333);">Permissões:</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${PERMISSIONS[currentUser.role].map(permission => `
              <div style="background-color: rgba(26, 95, 180, 0.05); padding: 6px 10px; border-radius: 4px; font-size: 0.85rem; color: var(--primary-color, #1a5fb4);">
                ${formatPermissionName(permission)}
              </div>
            `).join('')}
          </div>
        </div>
        
        <div style="display: flex; justify-content: flex-end;">
          <button id="close-profile-btn" class="btn" style="background-color: var(--primary-color, #1a5fb4);">Fechar</button>
        </div>
      </div>
    `;
    
    // Adicionar o modal ao overlay
    overlay.appendChild(profileModal);
    
    // Adicionar ao body
    document.body.appendChild(overlay);
    
    // Configurar eventos
    const closeProfileBtn = document.getElementById('close-profile-btn');
    
    // Botão de fechar
    if (closeProfileBtn) {
      closeProfileBtn.addEventListener('click', function() {
        overlay.remove();
      });
    }
    
    // Fechar ao clicar fora do modal
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
    
    // Fechar o menu de usuário
    const userMenu = document.getElementById('user-menu');
    if (userMenu) {
      userMenu.classList.remove('active');
    }
  }

  /**
   * Mostra modal de administração de usuários
   * Apenas para administradores
   */
  function showUserAdminModal() {
    if (!currentUser || currentUser.role !== ROLES.ADMIN) return;
    
    // Verificar se já existe um modal aberto
    if (document.querySelector('.modal-overlay')) {
      return;
    }
    
    // Criar overlay para o modal
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease-in-out forwards;
    `;
    
    // Criar modal de administração
    const adminModal = document.createElement('div');
    adminModal.className = 'admin-modal';
    adminModal.style.cssText = `
      width: 800px;
      max-width: 90%;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
      animation: modalSlideIn 0.3s ease-out forwards;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      max-height: 90vh;
    `;
    
    // Cabeçalho do modal
    const modalHeader = document.createElement('div');
    modalHeader.style.cssText = `
      background-color: var(--primary-color, #1a5fb4);
      color: white;
      padding: 15px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    
    modalHeader.innerHTML = `
      <h3 style="margin: 0; font-size: 1.2rem; font-weight: 500;">Gerenciamento de Usuários</h3>
      <button id="close-admin-modal" style="background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background-color: rgba(255, 255, 255, 0.2);">&times;</button>
    `;
    
    // Conteúdo do modal
    const modalBody = document.createElement('div');
    modalBody.style.cssText = `
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    `;
    
    // Tabela de usuários
    modalBody.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <input type="text" id="user-search" placeholder="Buscar usuários..." style="padding: 8px 12px; border: 1px solid rgba(0, 0, 0, 0.15); border-radius: 4px; width: 250px;">
        <button id="add-user-btn" class="btn" style="background-color: var(--status-completed, #2b9348); display: flex; align-items: center; gap: 8px; padding: 8px 15px;">
          <span style="font-size: 1.2rem;">+</span>
          <span>Adicionar Usuário</span>
        </button>
      </div>
      
      <div style="overflow-x: auto; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
        <table id="users-table" style="width: 100%; border-collapse: collapse; background-color: white;">
          <thead>
            <tr>
              <th style="padding: 12px 15px; text-align: left; border-bottom: 1px solid rgba(0, 0, 0, 0.1); font-size: 0.85rem; font-weight: 600; color: var(--text-dark, #333333);">Nome</th>
              <th style="padding: 12px 15px; text-align: left; border-bottom: 1px solid rgba(0, 0, 0, 0.1); font-size: 0.85rem; font-weight: 600; color: var(--text-dark, #333333);">Usuário</th>
              <th style="padding: 12px 15px; text-align: left; border-bottom: 1px solid rgba(0, 0, 0, 0.1); font-size: 0.85rem; font-weight: 600; color: var(--text-dark, #333333);">Função</th>
              <th style="padding: 12px 15px; text-align: left; border-bottom: 1px solid rgba(0, 0, 0, 0.1); font-size: 0.85rem; font-weight: 600; color: var(--text-dark, #333333);">Departamento</th>
              <th style="padding: 12px 15px; text-align: left; border-bottom: 1px solid rgba(0, 0, 0, 0.1); font-size: 0.85rem; font-weight: 600; color: var(--text-dark, #333333);">Status</th>
              <th style="padding: 12px 15px; text-align: center; border-bottom: 1px solid rgba(0, 0, 0, 0.1); font-size: 0.85rem; font-weight: 600; color: var(--text-dark, #333333);">Ações</th>
            </tr>
          </thead>
          <tbody id="users-table-body"></tbody>
        </table>
      </div>
    `;
    
    // Adicionar componentes ao modal
    adminModal.appendChild(modalHeader);
    adminModal.appendChild(modalBody);
    
    // Adicionar o modal ao overlay
    overlay.appendChild(adminModal);
    
    // Adicionar ao body
    document.body.appendChild(overlay);
    
    // Renderizar lista de usuários
    renderUsersList();
    
    // Configurar eventos
    document.getElementById('close-admin-modal').addEventListener('click', function() {
      overlay.remove();
    });
    
    // Fechar ao clicar fora do modal
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
    
    // Campo de busca
    const searchField = document.getElementById('user-search');
    if (searchField) {
      searchField.addEventListener('input', function() {
        renderUsersList(this.value);
      });
    }
    
    // Botão de adicionar usuário
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
      addUserBtn.addEventListener('click', function() {
        showAddUserModal();
      });
    }
    
    // Fechar o menu de usuário
    const userMenu = document.getElementById('user-menu');
    if (userMenu) {
      userMenu.classList.remove('active');
    }
  }

  /**
   * Renderiza a lista de usuários na tabela
   * @param {string} searchTerm - Termo de busca opcional
   */
  function renderUsersList(searchTerm = '') {
    const tableBody = document.getElementById('users-table-body');
    if (!tableBody) return;
    
    // Filtrar usuários se houver termo de busca
    let filteredUsers = users;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(term) || 
        user.username.toLowerCase().includes(term) || 
        user.email.toLowerCase().includes(term) || 
        user.department.toLowerCase().includes(term)
      );
    }
    
    // Limpar tabela
    tableBody.innerHTML = '';
    
    // Adicionar cada usuário
    filteredUsers.forEach(user => {
      const row = document.createElement('tr');
      
      // Definir a cor do status
      let statusColor, statusText;
      if (user.isActive) {
        statusColor = 'var(--status-completed, #2b9348)';
        statusText = 'Ativo';
      } else {
        statusColor = 'var(--text-light, #5e6c84)';
        statusText = 'Inativo';
      }
      
      // Criar células
      row.innerHTML = `
        <td style="padding: 12px 15px; border-bottom: 1px solid rgba(0, 0, 0, 0.05); font-size: 0.9rem;">${user.name}</td>
        <td style="padding: 12px 15px; border-bottom: 1px solid rgba(0, 0, 0, 0.05); font-size: 0.9rem;">${user.username}</td>
        <td style="padding: 12px 15px; border-bottom: 1px solid rgba(0, 0, 0, 0.05); font-size: 0.9rem;">${getRoleName(user.role)}</td>
        <td style="padding: 12px 15px; border-bottom: 1px solid rgba(0, 0, 0, 0.05); font-size: 0.9rem;">${user.department}</td>
        <td style="padding: 12px 15px; border-bottom: 1px solid rgba(0, 0, 0, 0.05); font-size: 0.9rem;">
          <span style="display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; background-color: ${statusColor}20; color: ${statusColor};">
            ${statusText}
          </span>
        </td>
        <td style="padding: 12px 15px; border-bottom: 1px solid rgba(0, 0, 0, 0.05); text-align: center;">
          <button class="btn-icon edit-user-btn" data-id="${user.id}" title="Editar usuário" style="margin-right: 5px; font-size: 0.85rem;">✏️</button>
          <button class="btn-icon toggle-user-btn" data-id="${user.id}" title="${user.isActive ? 'Desativar' : 'Ativar'} usuário" style="font-size: 0.85rem;">
            ${user.isActive ? '🔒' : '🔓'}
          </button>
        </td>
      `;
      
      // Adicionar evento para botões de ação
      row.querySelector('.edit-user-btn').addEventListener('click', function() {
        const userId = parseInt(this.getAttribute('data-id'), 10);
        showEditUserModal(userId);
      });
      
      row.querySelector('.toggle-user-btn').addEventListener('click', function() {
        const userId = parseInt(this.getAttribute('data-id'), 10);
        toggleUserStatus(userId);
      });
      
      // Adicionar à tabela
      tableBody.appendChild(row);
    });
    
    // Mensagem se não houver usuários
    if (filteredUsers.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td colspan="6" style="padding: 20px; text-align: center; color: var(--text-light, #5e6c84);">
          Nenhum usuário encontrado.
        </td>
      `;
      tableBody.appendChild(row);
    }
  }

  /**
   * Alterna o status de ativo/inativo de um usuário
   * @param {number} userId - ID do usuário
   */
  function toggleUserStatus(userId) {
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return;
    
    // Não permitir desativar o próprio usuário
    if (users[userIndex].id === currentUser.id) {
      showNotification('Não é possível desativar o próprio usuário!', 'warning');
      return;
    }
    
    // Alternar status
    users[userIndex].isActive = !users[userIndex].isActive;
    
    // Atualizar tabela
    renderUsersList();
    
    // Notificar
    const status = users[userIndex].isActive ? 'ativado' : 'desativado';
    showNotification(`Usuário ${users[userIndex].name} ${status} com sucesso.`, 'success');
  }

  /**
   * Mostra modal para adicionar novo usuário
   */
  function showAddUserModal() {
    // Verificar se já existe um modal de usuário aberto
    if (document.getElementById('user-form-modal')) {
      return;
    }
    
    // Criar modal
    const modal = document.createElement('div');
    modal.id = 'user-form-modal';
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
      z-index: 2100;
      width: 450px;
      max-width: 95%;
      animation: modalSlideIn 0.3s ease-out forwards;
      overflow: hidden;
    `;
    
    // Cabeçalho do modal
    modal.innerHTML = `
      <div style="background-color: var(--primary-color, #1a5fb4); color: white; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; font-size: 1.2rem; font-weight: 500;">Adicionar Novo Usuário</h3>
        <button id="close-user-form" style="background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer;">&times;</button>
      </div>
      
      <div style="padding: 20px;">
        <form id="user-form">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-size: 0.9rem; font-weight: 500; color: var(--text-dark, #333333);">Nome Completo</label>
            <input type="text" id="user-name" class="form-input" required style="width: 100%; padding: 10px 12px; font-size: 0.9rem; border: 1px solid rgba(0, 0, 0, 0.15); border-radius: 4px;">
          </div>
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-size: 0.9rem; font-weight: 500; color: var(--text-dark, #333333);">Nome de Usuário</label>
            <input type="text" id="user-username" class="form-input" required style="width: 100%; padding: 10px 12px; font-size: 0.9rem; border: 1px solid rgba(0, 0, 0, 0.15); border-radius: 4px;">
          </div>
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-size: 0.9rem; font-weight: 500; color: var(--text-dark, #333333);">Email</label>
            <input type="email" id="user-email" class="form-input" required style="width: 100%; padding: 10px 12px; font-size: 0.9rem; border: 1px solid rgba(0, 0, 0, 0.15); border-radius: 4px;">
          </div>
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-size: 0.9rem; font-weight: 500; color: var(--text-dark, #333333);">Função</label>
            <select id="user-role" class="form-input" required style="width: 100%; padding: 10px 12px; font-size: 0.9rem; border: 1px solid rgba(0, 0, 0, 0.15); border-radius: 4px;">
              <option value="">Selecione uma função</option>
              <option value="admin">Administrador</option>
              <option value="manager">Gerente</option>
              <option value="technician">Técnico</option>
              <option value="verifier">Verificador</option>
              <option value="viewer">Visualizador</option>
            </select>
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 5px; font-size: 0.9rem; font-weight: 500; color: var(--text-dark, #333333);">Departamento</label>
            <input type="text" id="user-department" class="form-input" required style="width: 100%; padding: 10px 12px; font-size: 0.9rem; border: 1px solid rgba(0, 0, 0, 0.15); border-radius: 4px;">
          </div>
          
          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button type="button" id="cancel-user-form" class="btn btn-secondary" style="background-color: var(--text-light, #5e6c84);">Cancelar</button>
            <button type="submit" class="btn" style="background-color: var(--status-completed, #2b9348);">Adicionar</button>
          </div>
        </form>
      </div>
    `;
    
    // Adicionar ao body
    document.body.appendChild(modal);
    
    // Configurar eventos
    document.getElementById('close-user-form').addEventListener('click', function() {
      modal.remove();
    });
    
    document.getElementById('cancel-user-form').addEventListener('click', function() {
      modal.remove();
    });
    
    document.getElementById('user-form').addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Coletar dados do formulário
      const name = document.getElementById('user-name').value;
      const username = document.getElementById('user-username').value;
      const email = document.getElementById('user-email').value;
      const role = document.getElementById('user-role').value;
      const department = document.getElementById('user-department').value;
      
      // Validar campos
      if (!name || !username || !email || !role || !department) {
        showNotification('Preencha todos os campos obrigatórios.', 'warning');
        return;
      }
      
      // Verificar se o nome de usuário já existe
      if (users.some(u => u.username === username)) {
        showNotification('Este nome de usuário já está em uso.', 'warning');
        return;
      }
      
      // Criar novo usuário
      const newUser = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        username,
        name,
        email,
        role,
        department,
        lastLogin: null,
        isActive: true
      };
      
      // Adicionar à lista
      users.push(newUser);
      
      // Atualizar tabela
      renderUsersList();
      
      // Notificar sucesso
      showNotification(`Usuário ${name} adicionado com sucesso.`, 'success');
      
      // Fechar modal
      modal.remove();
    });
  }

  /**
   * Mostra modal para editar usuário existente
   * @param {number} userId - ID do usuário
   */
  function showEditUserModal(userId) {
    // Buscar usuário
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    // Verificar se já existe um modal de usuário aberto
    if (document.getElementById('user-form-modal')) {
      return;
    }
    
    // Criar modal
    const modal = document.createElement('div');
    modal.id = 'user-form-modal';
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
      z-index: 2100;
      width: 450px;
      max-width: 95%;
      animation: modalSlideIn 0.3s ease-out forwards;
      overflow: hidden;
    `;
    
    // Cabeçalho do modal
    modal.innerHTML = `
      <div style="background-color: var(--primary-color, #1a5fb4); color: white; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; font-size: 1.2rem; font-weight: 500;">Editar Usuário</h3>
        <button id="close-user-form" style="background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer;">&times;</button>
      </div>
      
      <div style="padding: 20px;">
        <form id="user-form">
          <input type="hidden" id="user-id" value="${user.id}">
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-size: 0.9rem; font-weight: 500; color: var(--text-dark, #333333);">Nome Completo</label>
            <input type="text" id="user-name" class="form-input" required value="${user.name}" style="width: 100%; padding: 10px 12px; font-size: 0.9rem; border: 1px solid rgba(0, 0, 0, 0.15); border-radius: 4px;">
          </div>
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-size: 0.9rem; font-weight: 500; color: var(--text-dark, #333333);">Nome de Usuário</label>
            <input type="text" id="user-username" class="form-input" required value="${user.username}" style="width: 100%; padding: 10px 12px; font-size: 0.9rem; border: 1px solid rgba(0, 0, 0, 0.15); border-radius: 4px;" ${user.id === currentUser.id ? 'readonly' : ''}>
          </div>
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-size: 0.9rem; font-weight: 500; color: var(--text-dark, #333333);">Email</label>
            <input type="email" id="user-email" class="form-input" required value="${user.email}" style="width: 100%; padding: 10px 12px; font-size: 0.9rem; border: 1px solid rgba(0, 0, 0, 0.15); border-radius: 4px;">
          </div>
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-size: 0.9rem; font-weight: 500; color: var(--text-dark, #333333);">Função</label>
            <select id="user-role" class="form-input" required style="width: 100%; padding: 10px 12px; font-size: 0.9rem; border: 1px solid rgba(0, 0, 0, 0.15); border-radius: 4px;" ${user.id === currentUser.id ? 'disabled' : ''}>
              <option value="">Selecione uma função</option>
              <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrador</option>
              <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>Gerente</option>
              <option value="technician" ${user.role === 'technician' ? 'selected' : ''}>Técnico</option>
              <option value="verifier" ${user.role === 'verifier' ? 'selected' : ''}>Verificador</option>
              <option value="viewer" ${user.role === 'viewer' ? 'selected' : ''}>Visualizador</option>
            </select>
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 5px; font-size: 0.9rem; font-weight: 500; color: var(--text-dark, #333333);">Departamento</label>
            <input type="text" id="user-department" class="form-input" required value="${user.department}" style="width: 100%; padding: 10px 12px; font-size: 0.9rem; border: 1px solid rgba(0, 0, 0, 0.15); border-radius: 4px;">
          </div>
          
          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button type="button" id="cancel-user-form" class="btn btn-secondary" style="background-color: var(--text-light, #5e6c84);">Cancelar</button>
            <button type="submit" class="btn" style="background-color: var(--status-completed, #2b9348);">Salvar</button>
          </div>
        </form>
      </div>
    `;
    
    // Adicionar ao body
    document.body.appendChild(modal);
    
    // Configurar eventos
    document.getElementById('close-user-form').addEventListener('click', function() {
      modal.remove();
    });
    
    document.getElementById('cancel-user-form').addEventListener('click', function() {
      modal.remove();
    });
    
    document.getElementById('user-form').addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Coletar dados do formulário
      const id = parseInt(document.getElementById('user-id').value, 10);
      const name = document.getElementById('user-name').value;
      const username = document.getElementById('user-username').value;
      const email = document.getElementById('user-email').value;
      const role = document.getElementById('user-role').value;
      const department = document.getElementById('user-department').value;
      
      // Validar campos
      if (!name || !username || !email || !role || !department) {
        showNotification('Preencha todos os campos obrigatórios.', 'warning');
        return;
      }
      
      // Verificar se o nome de usuário já existe (exceto o próprio usuário)
      if (users.some(u => u.username === username && u.id !== id)) {
        showNotification('Este nome de usuário já está em uso.', 'warning');
        return;
      }
      
      // Atualizar usuário
      const userIndex = users.findIndex(u => u.id === id);
      if (userIndex !== -1) {
        // Preservar alguns campos
        const oldUser = users[userIndex];
        
        users[userIndex] = {
          ...oldUser,
          name,
          username,
          email,
          role,
          department
        };
        
        // Se o usuário atual foi editado, atualizar sessão
        if (id === currentUser.id) {
          currentUser = users[userIndex];
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
          
          // Atualizar interface
          updateUserInterface();
        }
      }
      
      // Atualizar tabela
      renderUsersList();
      
      // Notificar sucesso
      showNotification(`Usuário ${name} atualizado com sucesso.`, 'success');
      
      // Fechar modal
      modal.remove();
    });
  }

  /**
   * Obtém o nome amigável de um papel de usuário
   * @param {string} role - Código do papel
   * @returns {string} Nome formatado
   */
  function getRoleName(role) {
    switch (role) {
      case ROLES.ADMIN:
        return 'Administrador';
      case ROLES.MANAGER:
        return 'Gerente';
      case ROLES.TECHNICIAN:
        return 'Técnico';
      case ROLES.VERIFIER:
        return 'Verificador';
      case ROLES.VIEWER:
        return 'Visualizador';
      default:
        return 'Usuário';
    }
  }

  /**
   * Formata o nome de uma permissão para exibição
   * @param {string} permission - Código da permissão
   * @returns {string} Nome formatado
   */
  function formatPermissionName(permission) {
    // Mapeamento de códigos para nomes amigáveis
    const permissionNames = {
      'view_all': 'Visualizar Tudo',
      'create_maintenance': 'Criar Manutenções',
      'edit_maintenance': 'Editar Manutenções',
      'delete_maintenance': 'Excluir Manutenções',
      'edit_own_maintenance': 'Editar Próprias Manutenções',
      'verify_maintenance': 'Verificar Manutenções',
      'generate_reports': 'Gerar Relatórios',
      'manage_users': 'Gerenciar Usuários',
      'view_analytics': 'Visualizar Análises',
      'configure_system': 'Configurar Sistema'
    };
    
    return permissionNames[permission] || permission;
  }

  /**
   * Mostra uma notificação
   * @param {string} message - Mensagem da notificação
   * @param {string} type - Tipo de notificação (success, error, warning, info)
   */
  function showNotification(message, type = 'info') {
    // Usar o módulo Utilities se disponível
    if (typeof Utilities !== 'undefined' && Utilities.showNotification) {
      Utilities.showNotification(message, type);
      return;
    }
    
    // Implementação básica de fallback
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification-popup ${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: white;
      border-left: 4px solid ${getColorForType(type)};
      border-radius: 4px;
      padding: 15px 20px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      opacity: 0;
      transform: translateX(50px);
      transition: opacity 0.3s ease, transform 0.3s ease;
      font-size: 0.9rem;
      color: var(--text-dark, #333333);
    `;
    
    notification.textContent = message;
    
    // Adicionar ao body
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remover após alguns segundos
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(50px)';
      
      // Remover do DOM após a animação
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 5000);
  }

  /**
   * Obtém a cor para um tipo de notificação
   * @param {string} type - Tipo de notificação
   * @returns {string} Cor em formato CSS
   */
  function getColorForType(type) {
    switch (type) {
      case 'success':
        return 'var(--status-completed, #2b9348)';
      case 'error':
        return 'var(--status-danger, #cc0000)';
      case 'warning':
        return 'var(--status-pending, #f0ad4e)';
      default:
        return 'var(--primary-color, #1a5fb4)';
    }
  }

  // API pública
  return {
    initialize,
    hasPermission,
    getCurrentUser: () => currentUser,
    getRoles: () => Object.values(ROLES),
    showLoginForm: showLoginModal,
    logout
  };
})();

// Exportar como módulo global
window.UserRoles = UserRoles;

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM completamente carregado. Inicializando UserRoles...");
  
  // Dar um pequeno delay para garantir que o layout base foi carregado
  setTimeout(() => {
    UserRoles.initialize();
  }, 500);
});
