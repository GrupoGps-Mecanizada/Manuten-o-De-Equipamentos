/**
 * Script de Carregamento Melhorado
 * Este arquivo gerencia o carregamento de dependências JavaScript
 * e garante que elas sejam carregadas na ordem correta.
 * 
 * Versão: 1.0.1
 * Data: 05/05/2025
 */

// Configuração dos scripts a serem carregados
const scripts = {
    // Scripts essenciais (carregados primeiro, em ordem)
    core: [
        { name: 'api', path: 'js/api.js', loaded: false },
        { name: 'utilities', path: 'js/utilities.js', loaded: false }
    ],
    
    // Scripts secundários (carregados depois dos essenciais)
    secondary: [
        { name: 'dashboard', path: 'js/dashboard.js', loaded: false },
        { name: 'maintenance', path: 'js/maintenance.js', loaded: false },
        { name: 'verification', path: 'js/verification.js', loaded: false },
        { name: 'reports', path: 'js/reports.js', loaded: false },
        { name: 'main', path: 'js/main.js', loaded: false }
    ],
    
    // Scripts de correção (carregados por último)
    fixes: [
        { name: 'table-data-fix', path: 'js/table-data-fix.js', loaded: false },
        { name: 'form-navigation-fix', path: 'js/form-navigation-fix.js', loaded: false },
        { name: 'system-fix', path: 'js/system-fix.js', loaded: false },
        { name: 'fix-final', path: 'js/fix-final.js', loaded: false }
    ]
};

// Função principal de inicialização
function init() {
    console.log('Iniciando carregamento das dependências...');
    
    // Criar objeto global para controle de estado da aplicação
    window.AppState = {
        scriptsLoaded: {
            core: false,
            secondary: false,
            fixes: false
        },
        ready: false
    };
    
    // 1. Primeiro carregamos os scripts essenciais em sequência
    loadCoreScriptsSequentially();
}

// Carregar scripts essenciais em sequência (um após o outro)
function loadCoreScriptsSequentially() {
    console.log('Carregando scripts essenciais sequencialmente...');
    
    let index = 0;
    
    function loadNextCoreScript() {
        if (index >= scripts.core.length) {
            // Todos os scripts essenciais foram carregados
            console.log('✅ Todos os scripts essenciais foram carregados.');
            window.AppState.scriptsLoaded.core = true;
            
            // Verificar se as dependências críticas estão realmente disponíveis
            setTimeout(function() {
                const apiLoaded = typeof window.API !== 'undefined';
                const utilitiesLoaded = typeof window.Utilities !== 'undefined';
                
                if (!apiLoaded || !utilitiesLoaded) {
                    console.warn('⚠️ Algumas dependências essenciais não foram carregadas corretamente:');
                    if (!apiLoaded) console.warn('- API não foi carregada');
                    if (!utilitiesLoaded) console.warn('- Utilities não foram carregadas corretamente!');
                    
                    // Criar fallbacks para evitar erros
                    if (!apiLoaded) {
                        window.API = {
                            get: function(url, callback) {
                                console.warn('Usando API fallback');
                                setTimeout(() => callback({ success: false, error: 'API não carregada' }), 100);
                            },
                            post: function(url, data, callback) {
                                console.warn('Usando API fallback');
                                setTimeout(() => callback({ success: false, error: 'API não carregada' }), 100);
                            }
                        };
                    }
                    
                    if (!utilitiesLoaded) {
                        window.Utilities = {
                            formatDate: function(date) {
                                return date ? new Date(date).toLocaleDateString() : '';
                            },
                            formatCurrency: function(value) {
                                return `R$ ${parseFloat(value || 0).toFixed(2).replace('.', ',')}`;
                            }
                        };
                    }
                }
                
                // Continuar com os scripts secundários
                loadSecondaryScripts();
                
            }, 200);
            
            return;
        }
        
        const script = scripts.core[index];
        console.log(`Carregando script essencial: ${script.name}`);
        
        loadScript(script.path)
            .then(() => {
                console.log(`Script ${script.name} (${script.path}) carregado com sucesso.`);
                script.loaded = true;
                index++;
                loadNextCoreScript();
            })
            .catch(error => {
                console.error(`Erro ao carregar ${script.name}:`, error);
                
                // Tentar novamente após um curto atraso
                setTimeout(() => {
                    console.log(`Tentando carregar ${script.name} novamente...`);
                    loadNextCoreScript();
                }, 1000);
            });
    }
    
    // Iniciar carregamento sequencial
    loadNextCoreScript();
}

// Carregar scripts secundários em paralelo
function loadSecondaryScripts() {
    console.log('Carregando scripts secundários...');
    
    const promises = scripts.secondary.map(script => {
        return loadScript(script.path)
            .then(() => {
                console.log(`Script ${script.name} (${script.path}) carregado com sucesso.`);
                script.loaded = true;
            })
            .catch(error => {
                console.error(`Erro ao carregar ${script.name}:`, error);
                return Promise.reject(error);
            });
    });
    
    // Continuar mesmo se algum script falhar
    Promise.allSettled(promises)
        .then(() => {
            window.AppState.scriptsLoaded.secondary = true;
            console.log('Scripts secundários carregados. Carregando scripts de correção...');
            
            // Carregar scripts de correção
            loadFixScripts();
        });
}

// Carregar scripts de correção
function loadFixScripts() {
    console.log('Carregando scripts de correção...');
    
    const promises = scripts.fixes.map(script => {
        return loadScript(script.path)
            .then(() => {
                console.log(`Script de correção ${script.name} (${script.path}) carregado com sucesso.`);
                script.loaded = true;
            })
            .catch(error => {
                console.error(`Erro ao carregar ${script.name}:`, error);
                return Promise.reject(error);
            });
    });
    
    // Continuar mesmo se algum script falhar
    Promise.allSettled(promises)
        .then(() => {
            window.AppState.scriptsLoaded.fixes = true;
            console.log('✅ Todos os scripts foram carregados.');
            
            // Inicializar o sistema
            initializeSystem();
        });
}

// Função para carregar um script único
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = false; // Manter a ordem de execução
        
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Falha ao carregar script: ${src}`));
        
        document.head.appendChild(script);
    });
}

// Inicializar o sistema após carregar todos os scripts
function initializeSystem() {
    console.log('Tentando inicializar o sistema...');
    
    // Verificar se a função de inicialização principal existe
    if (typeof window.initializeApp === 'function') {
        try {
            window.initializeApp();
            console.log('Sistema inicializado via window.initializeApp().');
        } catch (error) {
            console.error('Erro ao inicializar o sistema:', error);
            fallbackInitialization();
        }
    } else {
        console.warn('Função initializeApp não encontrada. Usando inicialização de fallback.');
        fallbackInitialization();
    }
    
    // Marcar aplicação como pronta
    window.AppState.ready = true;
    document.dispatchEvent(new CustomEvent('app-ready'));
}

// Inicialização de fallback caso initializeApp falhe
function fallbackInitialization() {
    console.log('Executando inicialização de fallback...');
    
    // Inicializar módulos individualmente
    if (typeof window.Dashboard !== 'undefined' && typeof window.Dashboard.initialize === 'function') {
        console.log('Inicializando Dashboard via fallback...');
        window.Dashboard.initialize();
    }
    
    if (typeof window.Maintenance !== 'undefined' && typeof window.Maintenance.initialize === 'function') {
        console.log('Inicializando Maintenance via fallback...');
        window.Maintenance.initialize();
    }
    
    if (typeof window.Reports !== 'undefined' && typeof window.Reports.initialize === 'function') {
        console.log('Inicializando Reports via fallback...');
        window.Reports.initialize();
    }
    
    // Verificar data de última atualização
    updateLastUpdateTimestamp();
}

// Atualizar timestamp de última atualização
function updateLastUpdateTimestamp() {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');
    window.lastUpdate = formattedDate;
    
    // Atualizar elemento na UI se existir
    const lastUpdateElement = document.querySelector('.last-update-timestamp');
    if (lastUpdateElement) {
        lastUpdateElement.textContent = formattedDate;
    }
}

// Iniciar o carregamento de scripts quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    console.log('DOM carregado. Iniciando ScriptLoader.');
    init();
}

// Aplicar PATCH EMERGENCIAL
console.log('PATCH EMERGENCIAL APLICADO');

// Detectar automaticamente quando o select de tipo de equipamento for alterado
document.addEventListener('input', function(e) {
    if (e.target && e.target.id === 'equipment-type') {
        console.log('PATCH: Novo listener adicionado ao select de tipo de equipamento');
        
        const equipmentIdContainer = document.getElementById('equipment-id-container');
        const otherEquipmentField = document.getElementById('other-equipment-container');
        
        if (e.target.value === 'Outro') {
            if (equipmentIdContainer) equipmentIdContainer.style.display = 'none';
            if (otherEquipmentField) otherEquipmentField.style.display = 'block';
        } else {
            if (equipmentIdContainer) equipmentIdContainer.style.display = 'block';
            if (otherEquipmentField) otherEquipmentField.style.display = 'none';
        }
    }
});
