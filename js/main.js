// Verificar se as dependências necessárias estão carregadas
if (!window.API || !window.API_LOADED || !window.UTILITIES_LOADED) {
  console.error("Erro: Dependências API.js ou Utilities.js não carregadas antes de main.js");

  // Tentar inicializar com atraso se as dependências não estiverem prontas ainda
  const initWithDelay = function() {
    if (window.API && window.API_LOADED && window.UTILITIES_LOADED) {
      console.log("Dependências detectadas. Inicializando sistema...");
      initializeApp();
    } else {
      console.log("Aguardando carregamento de dependências...");
      setTimeout(initWithDelay, 500);
    }
  };

  // Iniciar verificação com atraso
  setTimeout(initWithDelay, 500);
} else {
  console.log("Main.js - Dependências carregadas corretamente");
  // Se as dependências já estiverem carregadas, inicializar imediatamente.
  initializeApp();
}

// Atualizar o rodapé para exibir o nome correto
document.addEventListener('DOMContentLoaded', function() {
  // Configurar última atualização
  if (typeof formatDate === 'function') {
    document.getElementById('last-update').textContent = formatDate(new Date(), true);
  } else {
     console.warn("Função formatDate não disponível no DOMContentLoaded. A data de atualização pode não ser definida.");
  }

  // Atualizar desenvolvedor no rodapé
  const footerDeveloper = document.querySelector('.developer-credit');
  if (footerDeveloper) {
    footerDeveloper.textContent = 'Desenvolvido por Warlison Abreu';
  }
});

// Variável global para rastrear se o sistema já foi inicializado
let isSystemInitialized = false;

/**
 * Inicializa o sistema
 */
function initializeApp() {
  // Verificar se já inicializou antes
  if (isSystemInitialized) {
    console.log("Sistema já inicializado anteriormente. Ignorando chamada repetida.");
    return;
  }
  
  console.log("Inicializando o sistema..."); // Log para confirmar a chamada
  isSystemInitialized = true;

  // Configurar navegação por tabs
  setupTabNavigation();

  // Configurar modais
  setupModals();

  // Verificar se o sistema está configurado
  checkSystemConfiguration();

  // Se a data de atualização não foi definida no DOMContentLoaded (devido a dependências),
  // tentar definir aqui.
  if (typeof formatDate === 'function' && document.getElementById('last-update') && !document.getElementById('last-update').textContent) {
      document.getElementById('last-update').textContent = formatDate(new Date(), true);
      console.log("Data de atualização definida dentro de initializeApp.");
  }

   // Ativar a primeira tab se nenhuma estiver ativa
   if (!document.querySelector('.tab.active')) {
     const defaultTab = document.querySelector('.tab[data-tab="dashboard"]') || document.querySelector('.tab');
     if (defaultTab) {
       defaultTab.click();
     }
   }
   
   // Configurar botões de Adicionar Manutenção
   setupMaintenanceButtons();
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
      // Assume-se que 'currentTab' é uma variável global ou definida em outro lugar
      window.currentTab = this.getAttribute('data-tab');
      const currentTabContent = document.getElementById(`tab-${window.currentTab}`);

      if (currentTabContent) {
        currentTabContent.classList.add('active');
      } else {
        console.error(`Conteúdo da tab ${window.currentTab} não encontrado!`);
      }

      // Carregar dados apropriados para a tab
      loadTabContent(window.currentTab);
    });
  });

  // Ativar a primeira tab ou a tab padrão, se houver
  const defaultTab = document.querySelector('.tab[data-tab="dashboard"]') || document.querySelector('.tab');
  if (defaultTab) {
      defaultTab.click(); // Simula um clique para inicializar a primeira tab
  }
}

/**
 * Carrega o conteúdo apropriado para a tab selecionada
 */
function loadTabContent(tab) {
  console.log(`Carregando conteúdo para a tab: ${tab}`);
  switch (tab) {
    case 'dashboard':
      // Carregar dados do dashboard se o módulo estiver disponível
      if (typeof Dashboard !== 'undefined' && Dashboard.loadDashboardData) {
        Dashboard.loadDashboardData();
      } else {
        console.warn("Módulo Dashboard ou função loadDashboardData não encontrados.");
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
      } else {
         console.warn("Módulo Verification ou função loadVerificationData não encontrados.");
      }
      break;

    case 'reports':
      // Não carrega dados inicialmente, espera a solicitação do usuário
      console.log("Tab de Relatórios selecionada - aguardando ação do usuário.");
      break;

    default:
      console.warn(`Nenhuma ação definida para carregar conteúdo da tab: ${tab}`);
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

  // Botões de fechar no rodapé dos modais (Exemplo para 'detail-overlay')
  const closeDetailBtn = document.getElementById('close-detail-btn');
  if (closeDetailBtn) {
      closeDetailBtn.addEventListener('click', function() {
          const detailOverlay = document.getElementById('detail-overlay');
          if (detailOverlay) {
              detailOverlay.style.display = 'none';
          }
      });
  }

  // Botão de verificar manutenção (Exemplo para 'detail-overlay')
  const verifyMaintenanceBtn = document.getElementById('verify-maintenance-btn');
   if (verifyMaintenanceBtn) {
      verifyMaintenanceBtn.addEventListener('click', function() {
        const maintenanceId = window.selectedMaintenanceId; // Assume que isso é definido em outro lugar
        if (maintenanceId) {
          const detailOverlay = document.getElementById('detail-overlay');
          if (detailOverlay) {
              detailOverlay.style.display = 'none';
          }

          // Abrir formulário de verificação com pequeno atraso
          setTimeout(() => {
            if (typeof Verification !== 'undefined' && Verification.openVerificationForm) {
              Verification.openVerificationForm(maintenanceId);
            } else {
              // Se o módulo Verification não existir, chamar a função local
              openVerificationForm(maintenanceId);
            }
          }, 100);
        } else {
            console.warn("ID da manutenção não selecionado para verificação.");
        }
      });
   }

   // Configurar botões de Adicionar Manutenção
   setupMaintenanceButtons();
}

/**
 * Configurar botões de manutenção
 */
function setupMaintenanceButtons() {
  console.log("Configurando botões de manutenção...");
  
  // Configurar botão "Adicionar Nova Manutenção"
  const addButton = document.getElementById('add-maintenance-btn');
  if (addButton) {
    console.log("Botão de adicionar encontrado, configurando evento...");
    
    // Remover event listeners antigos (clone e substitui)
    const newButton = addButton.cloneNode(true);
    addButton.parentNode.replaceChild(newButton, addButton);
    
    // Adicionar novo event listener
    newButton.addEventListener('click', function() {
      console.log("Botão de adicionar manutenção clicado");
      const overlay = document.getElementById('maintenance-form-overlay');
      if (overlay) {
        overlay.style.display = 'block';
        console.log("Overlay de formulário exibido");
        
        // Limpar formulário
        const form = document.getElementById('maintenance-form');
        if (form) form.reset();
      } else {
        console.error("Elemento 'maintenance-form-overlay' não encontrado!");
        showNotification("Erro: Formulário não encontrado.", "error");
      }
    });
  } else {
    console.warn("Botão 'add-maintenance-btn' não encontrado!");
  }
  
  // Configurar botão "Fechar" do formulário
  const closeButtons = document.querySelectorAll('.form-close, .cancel-btn');
  closeButtons.forEach(button => {
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    
    newButton.addEventListener('click', function() {
      const overlay = this.closest('.form-overlay');
      if (overlay) {
        overlay.style.display = 'none';
      }
    });
  });
}

/**
 * Verificar se o sistema está configurado adequadamente
 * (Função atualizada conforme a instrução)
 */
function checkSystemConfiguration() {
  // Verificar se API está definida
  if (!window.API || typeof API.ping !== 'function') {
    console.error("API não está definida ou incompleta!");
    // Tentar mostrar notificação se a função existir
    if (typeof showNotification === 'function') {
        showNotification("Erro ao carregar a API do sistema. Tente recarregar a página.", "error");
    }
    return; // Interrompe a verificação se a API não está pronta
  }

  // Verificar conexão com a API
  console.log("Verificando conexão com a API...");
  API.ping()
    .then(response => {
      if (response.success) {
        console.log("Conexão com a API estabelecida com sucesso.");
        console.log("Versão da API:", response.version || "Desconhecida");
      } else {
        console.error("Falha na conexão com a API:", response);
        if (typeof showNotification === 'function') {
            showNotification("Falha na conexão com o servidor. Verifique sua conexão.", "error");
        }
      }
    })
    .catch(error => {
      console.error("Erro ao testar conexão com a API:", error);
      if (typeof showNotification === 'function') {
        showNotification("Erro ao conectar ao servidor: " + error.message, "error");
      }
    });
}


/**
 * Carregar lista de manutenções
 */
function loadMaintenanceList() {
  // Verificar se showLoading existe antes de chamar
  if (typeof showLoading === 'function') showLoading(true, 'Carregando manutenções...');

  // Verificar se API e getMaintenanceList existem
  if (!window.API || typeof API.getMaintenanceList !== 'function') {
      console.error("API ou API.getMaintenanceList não está disponível para carregar manutenções.");
      if (typeof showNotification === 'function') showNotification("Erro interno: Falha ao carregar componente de manutenções.", "error");
      if (typeof showLoading === 'function') showLoading(false);
      // Limpar a tabela ou mostrar mensagem de erro nela
      const tbody = document.getElementById('maintenance-tbody');
      if (tbody) {
          tbody.innerHTML = '<tr><td colspan="10" style="text-align: center;">Erro ao carregar dados. API indisponível.</td></tr>';
      }
      window.maintenanceList = []; // Resetar a lista global
      return;
  }

  API.getMaintenanceList()
    .then(response => {
      if (response.success && Array.isArray(response.maintenances)) {
        window.maintenanceList = response.maintenances; // Assumindo lista global
        console.log(`${window.maintenanceList.length} manutenções carregadas.`);
        updateMaintenanceTable();
        setupMaintenanceButtons(); // Reconfigurar os botões após carregar
      } else {
        console.error("Erro ao carregar lista de manutenções:", response);
        if (typeof showNotification === 'function') {
            showNotification("Erro ao carregar manutenções: " + (response.message || "Resposta inválida"), "error");
        }
        window.maintenanceList = [];
        updateMaintenanceTable(); // Atualiza a tabela para mostrar "Nenhuma encontrada" ou erro
      }
    })
    .catch(error => {
      console.error("Falha na requisição de manutenções:", error);
      if (typeof showNotification === 'function') {
          showNotification("Falha ao buscar manutenções: " + error.message, "error");
      }
      window.maintenanceList = [];
      updateMaintenanceTable(); // Atualiza a tabela para mostrar "Nenhuma encontrada" ou erro
    })
    .finally(() => {
      if (typeof showLoading === 'function') showLoading(false);
    });
}

/**
 * Atualizar tabela de manutenções
 */
function updateMaintenanceTable() {
  const tbody = document.getElementById('maintenance-tbody');
  if (!tbody) {
      console.error("Elemento tbody 'maintenance-tbody' não encontrado para atualizar tabela.");
      return;
  }

  tbody.innerHTML = ''; // Limpar tabela

  const currentList = window.maintenanceList || []; // Usar a lista global

  if (!Array.isArray(currentList) || currentList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align: center;">Nenhuma manutenção encontrada.</td></tr>';
    return;
  }

  // Funções formatDate e getStatusClass devem estar disponíveis (provavelmente em Utilities.js)
  const safeFormatDate = typeof formatDate === 'function' ? formatDate : (d) => d ? new Date(d).toLocaleDateString() : '-';
  const safeGetStatusClass = typeof getStatusClass === 'function' ? getStatusClass : (s) => s ? s.toLowerCase().replace(/\s+/g, '-') : 'desconhecido';

  // Ordenar por data de registro (mais recente primeiro)
  const sortedList = [...currentList].sort((a, b) => {
    const dateA = new Date(a.dataRegistro || a.registrationDate || 0);
    const dateB = new Date(b.dataRegistro || b.registrationDate || 0);
    // Tratar datas inválidas colocando-as no final
    const timeA = !isNaN(dateA.getTime()) ? dateA.getTime() : -Infinity;
    const timeB = !isNaN(dateB.getTime()) ? dateB.getTime() : -Infinity;
    return timeB - timeA;
  });

  sortedList.forEach(item => {
    const id = item.id || 'N/A';
    const equipmentId = item.placaOuId || item.equipmentId || '-';
    const type = item.tipoEquipamento || item.equipmentType || 'N/A';
    const regDate = safeFormatDate(item.dataRegistro || item.registrationDate, true);
    const resp = item.responsavel || item.technician || '-';
    const area = item.area || '-';
    const local = item.localOficina || item.location || '-';
    const problem = item.categoriaProblema || item.problemCategory || '-';
    const status = item.status || 'Pendente';
    const statusClass = safeGetStatusClass(status);

    const row = document.createElement('tr');
    // Usar textContent para segurança contra XSS, exceto onde HTML é necessário (status badge, botões)
    row.innerHTML = `
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td><span class="status-badge status-${statusClass}">${status}</span></td>
      <td>
        <button class="btn-icon view-maintenance" data-id="${id}" title="Ver detalhes">👁️</button>
        ${status === 'Pendente' ? `<button class="btn-icon verify-maintenance" data-id="${id}" title="Verificar">✓</button>` : ''}
      </td>
    `;
    // Preencher com textContent
    row.cells[0].textContent = id;
    row.cells[1].textContent = equipmentId;
    row.cells[2].textContent = type;
    row.cells[3].textContent = regDate;
    row.cells[4].textContent = resp;
    row.cells[5].textContent = area;
    row.cells[6].textContent = local;
    row.cells[7].textContent = problem;

    tbody.appendChild(row);
  });

  // Adicionar event listeners aos botões (re-adicionar após limpar o tbody)
  tbody.querySelectorAll('.view-maintenance').forEach(button => {
    button.addEventListener('click', function() {
      const id = this.getAttribute('data-id');
      if (typeof viewMaintenanceDetails === 'function') {
          viewMaintenanceDetails(id);
      } else {
          console.warn("Função viewMaintenanceDetails não definida.");
          alert(`Detalhes para ID: ${id}`); // Fallback básico
      }
    });
  });

  tbody.querySelectorAll('.verify-maintenance').forEach(button => {
    button.addEventListener('click', function() {
      const id = this.getAttribute('data-id');
      if (typeof Verification !== 'undefined' && Verification.openVerificationForm) {
        Verification.openVerificationForm(id);
      } else {
        // Fallback para função local se Verification não existir
        openVerificationForm(id);
      }
    });
  });

  // Configurar (ou re-configurar) busca e filtros após atualizar a tabela
  setupMaintenanceFilters();
}

/**
 * Configurar filtros e busca na lista de manutenções
 * (Garante que os listeners sejam adicionados ou re-adicionados)
 */
function setupMaintenanceFilters() {
  // Remover listeners antigos para evitar duplicação se esta função for chamada múltiplas vezes
  const filterContainer = document.querySelector('#tab-maintenance .filter-container'); // Ajuste o seletor se necessário
  if (filterContainer) {
    filterContainer.querySelectorAll('.filter-item').forEach(filter => {
        const newFilter = filter.cloneNode(true); // Clonar para remover listeners antigos
        filter.parentNode.replaceChild(newFilter, filter);
        newFilter.addEventListener('click', handleFilterClick); // Adicionar novo listener
    });
  }

  const searchInput = document.getElementById('maintenance-search');
  if (searchInput) {
      // Remover listener antigo de input se existir (usando uma função nomeada ou debounce wrapper)
      // Se estiver usando debounce, a lógica de remoção pode ser mais complexa ou desnecessária
      // Aqui, apenas re-adicionamos, assumindo que debounce lida com chamadas excessivas.
      // A função debounce também deve estar disponível globalmente.
      const safeDebounce = typeof debounce === 'function' ? debounce : (fn, delay) => {
          let timeoutId;
          return (...args) => {
              clearTimeout(timeoutId);
              timeoutId = setTimeout(() => fn.apply(this, args), delay);
          };
      };
      searchInput.addEventListener('input', safeDebounce(handleSearchInput, 300));
  }

  const refreshButton = document.getElementById('refresh-maintenance-list');
  if (refreshButton) {
      const newRefreshButton = refreshButton.cloneNode(true);
      refreshButton.parentNode.replaceChild(newRefreshButton, refreshButton);
      newRefreshButton.addEventListener('click', loadMaintenanceList); // Chamar diretamente loadMaintenanceList
  }
}

// Função separada para o handler de clique do filtro
function handleFilterClick() {
    const filterItems = this.parentElement.querySelectorAll('.filter-item');
    filterItems.forEach(f => f.classList.remove('active'));
    this.classList.add('active');

    const filterValue = this.getAttribute('data-filter');
    filterMaintenanceList(filterValue);
}

// Função separada para o handler de input da busca
function handleSearchInput() {
    const searchTerm = this.value.toLowerCase().trim();
    searchMaintenanceList(searchTerm);
}


/**
 * Filtrar lista de manutenções por status
 */
function filterMaintenanceList(filter) {
  console.log(`Filtrando por: ${filter}`);
  const rows = document.querySelectorAll('#maintenance-tbody tr');
  let hasVisibleRows = false;

  rows.forEach(row => {
    // Ignorar linha de "Nenhuma manutenção encontrada"
    if (row.cells.length === 1 && row.cells[0].colSpan === 10) {
        row.style.display = 'none'; // Esconder a linha de placeholder durante a filtragem
        return;
    }

    let showRow = false;
    const statusCell = row.querySelector('td:nth-child(9) .status-badge'); // Target o span dentro da célula
    const status = statusCell ? statusCell.textContent.toLowerCase() : '';

    // Lógica de filtro
    switch (filter) {
      case 'pending':
        showRow = status.includes('pendente');
        break;
      case 'verified':
        // Inclui qualquer status que não seja pendente ou concluído? Ou apenas 'Verificado', 'Aprovado', 'Ajustes'?
        showRow = status.includes('verificado') || status.includes('aprovado') || status.includes('ajustes');
        break;
      case 'completed':
        showRow = status.includes('concluído') || status.includes('concluido');
        break;
      case 'critical':
        // Precisa acessar os dados originais para verificar 'eCritico'
        const id = row.querySelector('.view-maintenance')?.getAttribute('data-id');
        const item = (window.maintenanceList || []).find(m => m.id == id);
        showRow = (item && (item.eCritico || item.isCritical));
        break;
      case 'all': // Adicionado caso 'all'
      default:
        showRow = true; // Mostrar todas as linhas se o filtro for 'all' ou desconhecido
    }

    row.style.display = showRow ? '' : 'none';
    if (showRow) hasVisibleRows = true;
  });

  // Mostrar mensagem se nenhum resultado for encontrado após filtrar
  const tbody = document.getElementById('maintenance-tbody');
  let noResultsRow = tbody.querySelector('.no-results-row');
  if (!hasVisibleRows) {
      if (!noResultsRow) {
          noResultsRow = document.createElement('tr');
          noResultsRow.classList.add('no-results-row'); // Adiciona classe para fácil identificação
          noResultsRow.innerHTML = `<td colspan="10" style="text-align: center;">Nenhuma manutenção encontrada para o filtro selecionado.</td>`;
          tbody.appendChild(noResultsRow);
      } else {
          noResultsRow.style.display = ''; // Garante que esteja visível
      }
  } else if (noResultsRow) {
      noResultsRow.style.display = 'none'; // Esconde se houver resultados
  }
}

/**
 * Buscar na lista de manutenções
 */
function searchMaintenanceList(searchTerm) {
  console.log(`Buscando por: ${searchTerm}`);
  const rows = document.querySelectorAll('#maintenance-tbody tr');
  let hasVisibleRows = false;
  const lowerSearchTerm = searchTerm.toLowerCase();

  rows.forEach(row => {
    // Ignorar linha de placeholder/nenhum resultado
    if (row.cells.length === 1 && (row.cells[0].colSpan === 10 || row.classList.contains('no-results-row'))) {
        row.style.display = 'none'; // Esconder placeholders durante a busca
        return;
    }

    const cells = row.querySelectorAll('td');
    let rowVisible = false;

    // Se o termo de busca está vazio, mostrar todas as linhas (respeitando o filtro ativo)
    if (!lowerSearchTerm) {
      // Reaplicar o filtro ativo em vez de mostrar tudo
      const activeFilter = document.querySelector('#tab-maintenance .filter-item.active');
      const filterValue = activeFilter ? activeFilter.getAttribute('data-filter') : 'all';
      // (A lógica de filtro já deve ter definido a visibilidade, mas podemos re-checar)
      // Esta parte pode ser complexa, talvez seja melhor chamar filterMaintenanceList novamente?
      // Por simplicidade, vamos assumir que a visibilidade atual reflete o filtro.
      // Apenas garantimos que não está 'none' por causa de uma busca anterior.
      // Se a linha estava escondida pelo filtro, permanecerá escondida.
      if (row.style.display !== 'none') { // Só mostrar se não estiver escondida pelo filtro
         rowVisible = true;
      }

    } else {
      // Buscar em todas as células exceto a última (ações)
      for (let i = 0; i < cells.length - 1; i++) {
        const cellText = cells[i].textContent.toLowerCase();
        if (cellText.includes(lowerSearchTerm)) {
          rowVisible = true;
          break; // Encontrou o termo na linha, não precisa checar mais células
        }
      }
    }

    // A visibilidade final depende tanto da busca quanto do filtro ativo.
    // A maneira mais fácil é filtrar primeiro e depois buscar nos resultados visíveis.
    // Ou, buscar em tudo e depois garantir que o filtro ainda se aplica.
    // Vamos ajustar: a linha só é visível se passar na busca E no filtro ativo.

    // Re-checar filtro ativo:
    const activeFilter = document.querySelector('#tab-maintenance .filter-item.active');
    const filterValue = activeFilter ? activeFilter.getAttribute('data-filter') : 'all';
    let passesFilter = false;
    const statusCell = row.querySelector('td:nth-child(9) .status-badge');
    const status = statusCell ? statusCell.textContent.toLowerCase() : '';

    switch (filterValue) {
      case 'pending': passesFilter = status.includes('pendente'); break;
      case 'verified': passesFilter = status.includes('verificado') || status.includes('aprovado') || status.includes('ajustes'); break;
      case 'completed': passesFilter = status.includes('concluído') || status.includes('concluido'); break;
      case 'critical':
        const id = row.querySelector('.view-maintenance')?.getAttribute('data-id');
        const item = (window.maintenanceList || []).find(m => m.id == id);
        passesFilter = (item && (item.eCritico || item.isCritical));
        break;
      default: passesFilter = true; // 'all' ou desconhecido
    }

    // Mostrar a linha apenas se passar na busca (se houver termo) E no filtro
    const displayStyle = (rowVisible && passesFilter) ? '' : 'none';
    row.style.display = displayStyle;

    if (displayStyle === '') hasVisibleRows = true;

  });

  // Mostrar mensagem se nenhum resultado for encontrado após busca/filtro
  const tbody = document.getElementById('maintenance-tbody');
  let noResultsRow = tbody.querySelector('.no-results-row');
  if (!hasVisibleRows) {
      if (!noResultsRow) {
          noResultsRow = document.createElement('tr');
          noResultsRow.classList.add('no-results-row');
          noResultsRow.innerHTML = `<td colspan="10" style="text-align: center;">Nenhuma manutenção encontrada para a busca/filtro atual.</td>`;
          tbody.appendChild(noResultsRow);
      } else {
          noResultsRow.style.display = ''; // Garante visibilidade
          noResultsRow.cells[0].textContent = 'Nenhuma manutenção encontrada para a busca/filtro atual.';
      }
  } else if (noResultsRow) {
      noResultsRow.style.display = 'none'; // Esconde se houver resultados
  }
}


/**
 * Função de apoio para abrir formulário de verificação
 * (Usada como fallback se o módulo Verification não estiver carregado)
 */
function openVerificationForm(id) {
  console.log(`Abrindo formulário de verificação local para ID: ${id}`);
  window.selectedMaintenanceId = id; // Guarda o ID globalmente

  // Verificar se API e getMaintenanceDetails existem
  if (!window.API || typeof API.getMaintenanceDetails !== 'function') {
      console.error("API ou API.getMaintenanceDetails não disponível para abrir formulário de verificação.");
       if (typeof showNotification === 'function') showNotification("Erro interno: Falha ao carregar detalhes da manutenção.", "error");
       return;
  }

  // Mostrar loading se disponível
  if (typeof showLoading === 'function') showLoading(true, 'Carregando dados da manutenção...');

  API.getMaintenanceDetails(id)
    .then(response => {
       // A API agora retorna um objeto com { success: true, maintenance: {...} } ou { success: false, message: "..." }
      if (!response || !response.success || !response.maintenance) {
        // Usar a mensagem de erro da API se disponível
        throw new Error(response?.message || 'Manutenção não encontrada ou resposta inválida da API.');
      }

      const maintenance = response.maintenance; // Acessar os detalhes dentro do objeto

      // Preencher campos do formulário de verificação (usar IDs corretos do seu HTML)
      const verificationIdInput = document.getElementById('verification-id');
      const verificationEquipmentInput = document.getElementById('verification-equipment');
      const verificationTypeInput = document.getElementById('verification-type'); // Ex: tipo de manutenção
      // Adicione outros campos conforme necessário

      if (verificationIdInput) verificationIdInput.value = maintenance.id || id;
      if (verificationEquipmentInput) verificationEquipmentInput.value = maintenance.placaOuId || maintenance.equipmentId || '-';
      if (verificationTypeInput) verificationTypeInput.value = maintenance.tipoManutencao || maintenance.maintenanceType || '-'; // Exemplo

      // Limpar campos de entrada da verificação para nova avaliação
      const verifierNameInput = document.getElementById('verifier-name');
      const approvedRadio = document.getElementById('verification-approved');
      const adjustmentsRadio = document.getElementById('verification-adjustments');
      const rejectedRadio = document.getElementById('verification-rejected');
      const commentsTextarea = document.getElementById('verification-comments');

      if (verifierNameInput) verifierNameInput.value = '';
      if (approvedRadio) approvedRadio.checked = false;
      if (adjustmentsRadio) adjustmentsRadio.checked = false;
      if (rejectedRadio) rejectedRadio.checked = false;
      if (commentsTextarea) commentsTextarea.value = '';

      // Exibir o overlay/modal do formulário de verificação
      const verificationOverlay = document.getElementById('verification-form-overlay'); // Usar ID correto do overlay
      if (verificationOverlay) {
          verificationOverlay.style.display = 'block';
      } else {
          console.error("Overlay do formulário de verificação ('verification-form-overlay') não encontrado.");
          // Fallback: alertar que o formulário deveria aparecer
          alert("Formulário de verificação deveria ser exibido aqui.");
      }

    })
    .catch(error => {
      console.error("Erro ao abrir formulário de verificação:", error);
      if (typeof showNotification === 'function') {
          showNotification("Erro ao carregar dados da manutenção: " + error.message, "error");
      }
    })
    .finally(() => {
      if (typeof showLoading === 'function') showLoading(false);
    });
}
