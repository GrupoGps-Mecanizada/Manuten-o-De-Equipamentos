// Arquivo system-fix.js corrigido
// Versão: 1.0.1
// Data: 05/05/2025

// Aguardar o carregamento do DOM antes de executar
document.addEventListener('DOMContentLoaded', initSystemFix);

// Variável de controle para evitar múltiplas execuções
let systemFixInitialized = false;

function initSystemFix() {
    // Evitar inicialização duplicada
    if (systemFixInitialized) return;
    systemFixInitialized = true;
    
    console.log('🔧 INICIANDO CORREÇÃO DO SISTEMA...');
    
    // Verificar se o objeto EQUIPMENT_IDS existe e criá-lo se necessário
    if (typeof window.EQUIPMENT_IDS === 'undefined') {
        console.log('⚠️ EQUIPMENT_IDS não encontrado, criando objeto...');
        window.EQUIPMENT_IDS = {};
    }
    
    // Criar indicador de carregamento global apenas se o container existir
    createGlobalLoadingIndicator();
    
    // Iniciar outras correções do sistema
    fixMissingEventListeners();
    ensureUtilitiesLoaded();
    
    console.log('✅ CORREÇÕES DO SISTEMA APLICADAS');
}

// Função para criar o indicador de carregamento global com verificação de elemento
function createGlobalLoadingIndicator() {
    console.log('🔄 Criando indicador de carregamento global...');
    
    // Verificar se o container existe antes de tentar adicionar
    const appContainer = document.querySelector('#app-container') || 
                         document.querySelector('.main-container') || 
                         document.body;
    
    if (appContainer) {
        // Criar o elemento de loading
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'global-loading-indicator';
        loadingIndicator.className = 'loading-overlay hidden';
        loadingIndicator.innerHTML = `
            <div class="spinner-container">
                <div class="spinner"></div>
                <div class="loading-text">Carregando...</div>
            </div>
        `;
        
        // Adicionar ao DOM
        appContainer.appendChild(loadingIndicator);
        console.log('✅ Indicador de carregamento global criado');
        
        // Adicionar funções de controle ao objeto global
        window.SystemLoading = {
            show: function() {
                document.getElementById('global-loading-indicator').classList.remove('hidden');
            },
            hide: function() {
                document.getElementById('global-loading-indicator').classList.add('hidden');
            }
        };
    } else {
        console.log('⚠️ Container para o indicador de carregamento não encontrado, tentando novamente mais tarde');
        // Tentar novamente após um breve atraso
        setTimeout(createGlobalLoadingIndicator, 500);
    }
}

// Função para garantir que as Utilities estejam carregadas
function ensureUtilitiesLoaded() {
    if (typeof window.Utilities === 'undefined') {
        console.log('⚠️ Objeto Utilities não encontrado, criando fallback básico');
        
        // Criar um objeto Utilities básico com funções essenciais
        window.Utilities = {
            formatDate: function(date) {
                if (!date) return '';
                if (typeof date === 'string') {
                    date = new Date(date);
                }
                return date.toLocaleDateString('pt-BR');
            },
            formatCurrency: function(value) {
                if (!value) return 'R$ 0,00';
                return `R$ ${parseFloat(value).toFixed(2).replace('.', ',')}`;
            },
            sanitizeInput: function(input) {
                if (!input) return '';
                return String(input).trim().replace(/[<>]/g, '');
            },
            generateId: function(prefix) {
                const timestamp = new Date().getTime();
                const random = Math.floor(Math.random() * 10000);
                return `${prefix || ''}${timestamp}${random}`;
            },
            debounce: function(func, wait) {
                let timeout;
                return function(...args) {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => func.apply(this, args), wait);
                };
            }
        };
        
        console.log('✅ Objeto Utilities de fallback criado');
    }
}

// Corrigir listeners de eventos que possam estar faltando
function fixMissingEventListeners() {
    // Verificar se botões críticos existem e adicionar listeners se necessário
    const criticalButtons = [
        { selector: '#btn-save', event: 'click', handler: handleSaveClick },
        { selector: '#btn-cancel', event: 'click', handler: handleCancelClick },
        { selector: '.refresh-btn', event: 'click', handler: handleRefreshClick }
    ];
    
    criticalButtons.forEach(btn => {
        const element = document.querySelector(btn.selector);
        if (element && !element.dataset.listenerAttached) {
            element.addEventListener(btn.event, btn.handler);
            element.dataset.listenerAttached = 'true';
            console.log(`✅ Listener ${btn.event} adicionado a ${btn.selector}`);
        }
    });
}

// Handlers para os listeners
function handleSaveClick(e) {
    console.log('🔄 Botão de salvar clicado');
    // Implementação de salvar
}

function handleCancelClick(e) {
    console.log('🔄 Botão de cancelar clicado');
    // Implementação de cancelar
}

function handleRefreshClick(e) {
    console.log('🔄 Botão de atualizar clicado');
    // Recarregar dados atuais
    if (typeof window.Dashboard !== 'undefined' && typeof window.Dashboard.loadDashboardData === 'function') {
        window.Dashboard.loadDashboardData();
    } else if (typeof window.Maintenance !== 'undefined' && typeof window.Maintenance.loadMaintenanceList === 'function') {
        window.Maintenance.loadMaintenanceList();
    }
}

// Inicializar imediatamente se o DOM já estiver carregado
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    initSystemFix();
}
