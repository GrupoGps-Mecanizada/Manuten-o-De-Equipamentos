/**
 * utilities.js
 *
 * Conjunto de funções utilitárias reutilizáveis em toda a aplicação.
 */

// Cria o objeto global Utilities se ele ainda não existir
if (typeof window.Utilities === 'undefined') {
    window.Utilities = {};
    console.log("Objeto global Utilities criado.");
} else {
    console.log("Objeto global Utilities já existe.");
}

/**
 * Formata uma string de data em diversos formatos para o formato DD/MM/YYYY.
 * Tenta reconhecer formatos ISO (com T), YYYY-MM-DD, DD/MM/YYYY e faz fallback
 * para a conversão direta via new Date().
 *
 * @param {string | Date | null | undefined} dateString - A string da data a ser formatada, ou um objeto Date.
 * @returns {string} A data formatada como DD/MM/YYYY, '-' se a entrada for nula/vazia,
 *                   ou a string original se a conversão falhar ou a data for inválida.
 */
function formatDate(dateString) {
    // Retorna '-' para valores nulos, indefinidos ou vazios
    if (!dateString) {
        return '-';
    }

    try {
        let date;

        // Se já for um objeto Date, usa diretamente
        if (dateString instanceof Date) {
            date = dateString;
        } else if (typeof dateString === 'string') {
            // Remove espaços extras que podem atrapalhar o parse
            const trimmedDateString = dateString.trim();

            // 1. Verificar formato ISO 8601 (ex: '2023-10-27T10:00:00.000Z')
            if (trimmedDateString.includes('T') && trimmedDateString.includes('-') && trimmedDateString.includes(':')) {
                date = new Date(trimmedDateString);
            }
            // 2. Verificar formato YYYY-MM-DD
            else if (trimmedDateString.includes('-') && trimmedDateString.split('-').length === 3) {
                // Cuidado com fuso horário: new Date('YYYY-MM-DD') pode interpretar como UTC 00:00
                // e resultar no dia anterior dependendo do fuso local.
                // Criar com T00:00:00 força a interpretação no fuso local geralmente.
                 const parts = trimmedDateString.split('-');
                 // Verifica se são números (simples verificação)
                 if (parts.every(part => /^\d+$/.test(part))) {
                     // Usar T00:00:00 ajuda a evitar problemas de fuso horário com apenas data
                     date = new Date(trimmedDateString + 'T00:00:00');
                 } else {
                     // Tenta parse direto se não parecer YYYY-MM-DD numérico
                     date = new Date(trimmedDateString);
                 }

            }
            // 3. Verificar formato DD/MM/YYYY
            else if (trimmedDateString.includes('/') && trimmedDateString.split('/').length === 3) {
                const [day, month, year] = trimmedDateString.split('/');
                // Verifica se são números e cria a data (mês é 0-indexado)
                 if (/^\d+$/.test(day) && /^\d+$/.test(month) && /^\d+$/.test(year)) {
                      date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
                 } else {
                     // Tenta parse direto se não parecer DD/MM/YYYY numérico
                     date = new Date(trimmedDateString);
                 }
            }
            // 4. Tentar converter diretamente como último recurso
            else {
                // Pode funcionar para outros formatos que o JS reconhece, ou timestamp numérico como string
                const timestamp = Number(trimmedDateString);
                if (!isNaN(timestamp) && timestamp > 0) { // Verifica se é um timestamp numérico válido
                     date = new Date(timestamp);
                } else {
                     date = new Date(trimmedDateString);
                }
            }
        } else if (typeof dateString === 'number' && dateString > 0) {
             // Se for um timestamp numérico
             date = new Date(dateString);
        }


        // Verificar se a data resultante é válida
        // `isNaN(date)` ou `isNaN(date.getTime())` são formas de verificar
        if (!date || isNaN(date.getTime())) {
            console.warn(`Formato de data não reconhecido ou data inválida: ${dateString}`);
            // Retornar a string original pode ser útil para debug, ou retornar '-'
            return typeof dateString === 'string' ? dateString : '-';
        }

        // Formatar para DD/MM/YYYY
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Mês é 0-indexado
        const year = date.getFullYear();

        // Validar se o ano é razoável (evitar anos como 0001, etc.)
        if (year < 1000 || year > 3000) {
             console.warn(`Ano ${year} fora do intervalo esperado para a data: ${dateString}`);
             return typeof dateString === 'string' ? dateString : '-';
        }


        return `${day}/${month}/${year}`;

    } catch (error) {
        console.error(`Erro inesperado ao formatar data: ${dateString}`, error);
        // Retornar a string original em caso de erro inesperado
        return typeof dateString === 'string' ? dateString : '-';
    }
}


/**
 * Retorna uma classe CSS correspondente a um status de manutenção/verificação.
 * Mapeia diferentes termos de status (case-insensitive e por inclusão) para classes padronizadas.
 *
 * @param {string | null | undefined} status - O texto do status.
 * @returns {string} A classe CSS correspondente (ex: 'pending', 'verified', 'completed', 'adjustments', 'rejected', 'critical') ou 'default' se não houver correspondência.
 */
function getStatusClass(status) {
    // Retorna 'default' se o status for nulo, indefinido ou vazio
    if (!status || typeof status !== 'string' || status.trim() === '') {
        return 'default';
    }

    const statusLower = status.toLowerCase().trim();

    // Mapeamento de termos-chave para classes CSS (ordem pode importar se houver sobreposição)
    // Coloque termos mais específicos primeiro se necessário.
    const statusMap = {
        // Pendente / Aguardando
        'pendente': 'pending',
        'aguardando verificação': 'pending',
        'aguardando': 'pending', // Genérico

        // Verificado / Aprovado (geralmente indicam sucesso na verificação inicial)
        'verificado': 'verified',
        'aprovado': 'verified',

        // Concluído / Finalizado (processo completo)
        'concluído': 'completed',
        'concluido': 'completed', // Sem acento
        'finalizado': 'completed',

        // Requer Atenção / Ação
        'ajustes necessários': 'adjustments',
        'ajustes': 'adjustments',
        'reprovado': 'rejected',

        // Urgência / Problema Grave
        'crítico': 'critical',
        'critico': 'critical', // Sem acento
        'emergencial': 'critical', // Pode ser mapeado como crítico também
        'urgente': 'critical',

        // Outros status possíveis
        'em andamento': 'in-progress', // Exemplo
        'cancelado': 'cancelled'      // Exemplo
        // Adicionar mais mapeamentos conforme necessário
    };

    // Procurar correspondência EXATA primeiro (mais confiável)
    if (statusMap[statusLower]) {
        return statusMap[statusLower];
    }

    // Se não houver correspondência exata, procurar por INCLUSÃO (cuidado com falsos positivos)
    // Iterar pelas chaves do map
    for (const key in statusMap) {
        // Usar includes() para verificar se o status contém a chave
        if (statusLower.includes(key)) {
            // console.log(`Status "${statusLower}" mapeado para "${statusMap[key]}" via inclusão de "${key}"`);
            return statusMap[key];
        }
    }

    // Se nenhuma correspondência for encontrada
    console.warn(`Status não mapeado para classe CSS: "${status}". Usando 'default'.`);
    return 'default';
}

/**
 * Converte a primeira letra de uma string para maiúscula e o restante para minúscula.
 * Útil para padronizar a exibição de textos como status.
 * @param {string} str A string para capitalizar.
 * @returns {string} A string com a primeira letra em maiúscula.
 */
 function capitalizeFirstLetter(str) {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
 }


/**
 * Função Debounce: Atrasar a execução de uma função até que um certo tempo tenha passado
 * sem que ela seja chamada novamente. Útil para eventos como 'input' ou 'resize'.
 * @param {Function} func A função a ser executada após o atraso.
 * @param {number} wait O tempo de espera em milissegundos.
 * @param {boolean} immediate Se true, executa a função imediatamente e depois espera para executar novamente.
 * @returns {Function} A função "debounced".
 */
function debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
        const context = this;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

/**
 * Mostra/Oculta um indicador de carregamento global.
 * Assume que existe um elemento com id="global-loading-indicator" no HTML.
 * @param {boolean} show True para mostrar, false para ocultar.
 * @param {string} [message='Carregando...'] Mensagem opcional a ser exibida.
 */
function showLoading(show, message = 'Carregando...') {
    const loader = document.getElementById('global-loading-indicator');
    if (!loader) {
        console.warn("Elemento #global-loading-indicator não encontrado.");
        // Fallback simples no console se o loader não existir
        if(show) console.log(`Loading: ${message}`);
        else console.log("Loading finished.");
        return;
    }

    const messageElement = loader.querySelector('.loading-message'); // Assume que há um elemento para a mensagem

    if (show) {
        if (messageElement) {
            messageElement.textContent = message;
        }
        loader.style.display = 'flex'; // Ou 'block', dependendo do estilo do loader
    } else {
        loader.style.display = 'none';
    }
}

/**
 * Exibe uma notificação flutuante para o usuário.
 * Assume uma biblioteca de notificação (como Toastify.js, Notyf, etc.) ou implementa uma simples.
 * @param {string} message A mensagem a ser exibida.
 * @param {'success' | 'error' | 'warning' | 'info'} type O tipo de notificação (usado para estilização).
 * @param {number} [duration=3000] Duração em milissegundos.
 */
function showNotification(message, type = 'info', duration = 3000) {
    console.log(`[${type.toUpperCase()}] Notification: ${message} (Duração: ${duration}ms)`);

    // --- Exemplo usando uma implementação simples (div flutuante) ---
    const notificationContainer = document.getElementById('notification-container') || createNotificationContainer();
    if (!notificationContainer) return;

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`; // Classes para estilização
    notification.textContent = message;

    notificationContainer.appendChild(notification);

    // Remover a notificação após a duração
    setTimeout(() => {
        notification.style.opacity = '0'; // Efeito de fade out
        setTimeout(() => {
            if (notification.parentNode === notificationContainer) {
                 notificationContainer.removeChild(notification);
            }
            // Opcional: remover o container se estiver vazio
             if (notificationContainer.children.length === 0) {
                 // document.body.removeChild(notificationContainer); // Ou apenas ocultar
             }
        }, 500); // Tempo para o fade out completar
    }, duration);
}

// Função auxiliar para criar o container de notificações se não existir
function createNotificationContainer() {
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        // Estilos básicos (ajustar via CSS)
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '10000';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';
        document.body.appendChild(container);
    }
    return container;
}


// --- Exposição das funções no objeto global Utilities ---

// Verifica se as funções já não foram definidas para evitar sobrescrever acidentalmente
if (!window.Utilities.formatDate) {
    window.Utilities.formatDate = formatDate;
} else {
    console.warn("Utilities.formatDate já estava definida. Não foi sobrescrita.");
}

if (!window.Utilities.getStatusClass) {
    window.Utilities.getStatusClass = getStatusClass;
} else {
    console.warn("Utilities.getStatusClass já estava definida. Não foi sobrescrita.");
}

if (!window.Utilities.capitalizeFirstLetter) {
    window.Utilities.capitalizeFirstLetter = capitalizeFirstLetter;
} else {
    console.warn("Utilities.capitalizeFirstLetter já estava definida. Não foi sobrescrita.");
}


if (!window.Utilities.debounce) {
    window.Utilities.debounce = debounce;
} else {
    console.warn("Utilities.debounce já estava definida. Não foi sobrescrita.");
}

if (!window.Utilities.showLoading) {
    window.Utilities.showLoading = showLoading;
} else {
    console.warn("Utilities.showLoading já estava definida. Não foi sobrescrita.");
}

if (!window.Utilities.showNotification) {
    window.Utilities.showNotification = showNotification;
} else {
    console.warn("Utilities.showNotification já estava definida. Não foi sobrescrita.");
}

// Adicione outras funções utilitárias aqui e as exponha da mesma forma.
// Exemplo:
// function outraUtilidade() { /* ... */ }
// if (!window.Utilities.outraUtilidade) {
//     window.Utilities.outraUtilidade = outraUtilidade;
// }

console.log("Utilities.js carregado e funções adicionadas ao objeto global Utilities.");
