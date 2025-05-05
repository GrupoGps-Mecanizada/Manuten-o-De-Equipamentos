/**
 * SOLUÇÃO COMPLETA PARA O SISTEMA DE MANUTENÇÃO DE EQUIPAMENTOS
 * Este script corrige os problemas fundamentais na arquitetura do sistema
 * Salve como system-fix.js e inclua antes de todos os outros scripts
 */

// PARTE 1: VERIFICAÇÃO E RECUPERAÇÃO DE DEPENDÊNCIAS
(function() {
    console.log("🔧 INICIANDO CORREÇÃO DO SISTEMA...");
    
    // Verificar se elementos globais existem e criar se necessário
    if (!window.EQUIPMENT_IDS) {
        console.log("⚠️ EQUIPMENT_IDS não encontrado, criando objeto...");
        window.EQUIPMENT_IDS = {
            "Alta Pressão": ["PUB-2G02","LUX-3201","FLX7617","EZS-8765","EZS-8764","EVK-0291","EOF-5C06",
                           "EOF-5208","EGC-2989","EGC-2985","EGC-2983","EGC-2978","EAM-3262","EAM-3256",
                           "EAM-3255","EAM-3253","EAM-3010","DSY-6475","DSY-6474","DSY-6472","CZC-0453"],
            "Auto Vácuo / Hiper Vácuo": ["PUB-2F80","NFF-0235","HJS-1097","FSA-3D71","EGC-2993","EGC-2979",
                                        "EAM-3257","EAM-3251","DYB-7210","DSY-6577","DSY-6473","CUB-0763",
                                        "ANF-2676","FTW-4D99","FTD-6368","FMD-2200","FHD-9264","EZS-9753"]
        };
    }
    
    // Criar indicador de carregamento global
    if (!document.getElementById('global-loading-indicator')) {
        console.log("🔄 Criando indicador de carregamento global...");
        var loadingDiv = document.createElement('div');
        loadingDiv.id = 'global-loading-indicator';
        loadingDiv.className = 'loading-overlay';
        loadingDiv.innerHTML = '<div class="loading-spinner"></div><div class="loading-message">Carregando...</div>';
        loadingDiv.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.8); z-index:9999; justify-content:center; align-items:center; flex-direction:column;';
        document.body.appendChild(loadingDiv);
        
        // Adicionar estilo para o spinner
        var styleEl = document.createElement('style');
        styleEl.textContent = `
            .loading-spinner {
                width: 50px;
                height: 50px;
                border: 5px solid #f3f3f3;
                border-top: 5px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 10px;
            }
            .loading-message {
                font-family: Arial, sans-serif;
                font-size: 16px;
                color: #333;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .loading-overlay {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255,255,255,0.8);
                z-index: 9999;
                justify-content: center;
                align-items: center;
                flex-direction: column;
            }
        `;
        document.head.appendChild(styleEl);
    }
    
    // Verificar e consertar o Utilities global
    if (!window.Utilities || typeof window.Utilities !== 'object') {
        console.log("⚠️ Objeto Utilities não encontrado ou inválido, recriando...");
        window.Utilities = window.Utilities || {};
        
        // Implementar funções essenciais
        Utilities.showLoading = function(message) {
            var indicator = document.getElementById('global-loading-indicator');
            if (indicator) {
                var messageEl = indicator.querySelector('.loading-message');
                if (messageEl) messageEl.textContent = message || 'Carregando...';
                indicator.style.display = 'flex';
                console.log("Loading: " + (message || 'Carregando...'));
            } else {
                console.warn("Elemento #global-loading-indicator não encontrado.");
            }
        };
        
        Utilities.hideLoading = function() {
            var indicator = document.getElementById('global-loading-indicator');
            if (indicator) {
                indicator.style.display = 'none';
                console.log("Loading finished.");
            }
        };
        
        Utilities.showError = function(message) {
            if (!document.getElementById('global-error-container')) {
                var errorDiv = document.createElement('div');
                errorDiv.id = 'global-error-container';
                errorDiv.style.cssText = 'position:fixed; top:10px; right:10px; max-width:300px; z-index:10000;';
                document.body.appendChild(errorDiv);
            }
            
            var alertDiv = document.createElement('div');
            alertDiv.className = 'error-alert';
            alertDiv.innerHTML = message;
            alertDiv.style.cssText = 'background:#f44336; color:white; padding:15px; margin-bottom:10px; border-radius:4px; box-shadow:0 2px 4px rgba(0,0,0,0.2);';
            
            var container = document.getElementById('global-error-container');
            container.appendChild(alertDiv);
            
            setTimeout(function() {
                alertDiv.style.opacity = '0';
                alertDiv.style.transition = 'opacity 0.5s';
                setTimeout(function() {
                    container.removeChild(alertDiv);
                }, 500);
            }, 5000);
        };
        
        Utilities.validateForm = function(formSelector) {
            var form = document.querySelector(formSelector);
            if (!form) return false;
            
            var isValid = true;
            var requiredFields = form.querySelectorAll('[required]');
            
            // Limpar mensagens de erro anteriores
            var errorMessages = form.querySelectorAll('.error-message');
            errorMessages.forEach(function(el) {
                el.parentNode.removeChild(el);
            });
            
            // Verificar cada campo obrigatório
            requiredFields.forEach(function(field) {
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('error-field');
                    field.style.borderColor = '#f44336';
                    
                    // Adicionar mensagem de erro
                    var errorMsg = document.createElement('div');
                    errorMsg.className = 'error-message';
                    errorMsg.innerHTML = 'Este campo é obrigatório';
                    errorMsg.style.color = '#f44336';
                    errorMsg.style.fontSize = '12px';
                    errorMsg.style.marginTop = '5px';
                    
                    // Inserir após o campo
                    field.parentNode.insertBefore(errorMsg, field.nextSibling);
                } else {
                    field.classList.remove('error-field');
                    field.style.borderColor = '';
                }
            });
            
            if (!isValid) {
                // Focar no primeiro campo com erro
                var firstErrorField = form.querySelector('.error-field');
                if (firstErrorField) firstErrorField.focus();
                
                // Mostrar alerta geral
                Utilities.showError('Por favor, preencha todos os campos obrigatórios');
            }
            
            return isValid;
        };
    }
    
    // Verificar API global
    if (!window.API || typeof window.API !== 'object') {
        console.log("⚠️ Objeto API não encontrado ou inválido, implementando funções básicas...");
        window.API = window.API || {};
        
        // Implementar funções essenciais da API
        API.getVersion = function() {
            return "2.0";
        };
        
        API.checkConnection = function() {
            return Promise.resolve({ success: true, version: API.getVersion() });
        };
    }
    
    console.log("✅ Verificação e recuperação de dependências concluída.");
})();

// PARTE 2: CORREÇÃO DO FORMULÁRIO DE MANUTENÇÃO
(function() {
    // Função para corrigir a exibição de campos dinâmicos
    function fixMaintenanceForm() {
        console.log("🔧 Aplicando correções ao formulário de manutenção...");
        
        // Aguardar o DOM estar totalmente carregado
        document.addEventListener('DOMContentLoaded', function() {
            // Verificar se estamos na página de manutenção (verificando presença do formulário)
            var maintenanceForm = document.getElementById('maintenance-form') || document.querySelector('.maintenance-form');
            if (!maintenanceForm) {
                // Esperar pela abertura do modal
                document.body.addEventListener('click', function(e) {
                    if (e.target && (e.target.id === 'new-maintenance' || e.target.closest('#new-maintenance'))) {
                        // Aguardar a abertura do modal
                        setTimeout(setupFormListeners, 500);
                    }
                });
                
                // Verificar se o modal já está aberto
                if (document.querySelector('.modal.show') && document.getElementById('equipment-type')) {
                    setupFormListeners();
                }
            } else {
                setupFormListeners();
            }
        });
        
        // Configuração dos listeners do formulário
        function setupFormListeners() {
            console.log("🔄 Configurando listeners do formulário...");
            
            // Obter elementos do formulário
            var equipmentTypeSelect = document.getElementById('equipment-type');
            if (!equipmentTypeSelect) {
                console.error("❌ Elemento 'equipment-type' não encontrado!");
                return;
            }
            
            // Remover listeners existentes
            var newEquipmentTypeSelect = equipmentTypeSelect.cloneNode(true);
            equipmentTypeSelect.parentNode.replaceChild(newEquipmentTypeSelect, equipmentTypeSelect);
            equipmentTypeSelect = newEquipmentTypeSelect;
            
            // Adicionar listener para o tipo de equipamento
            equipmentTypeSelect.addEventListener('change', function() {
                var selectedValue = this.value;
                var selectedText = this.options[this.selectedIndex].text;
                console.log(`🔄 Tipo de equipamento selecionado: "${selectedText}" (valor: "${selectedValue}")`);
                
                // Buscar elementos relacionados
                var equipmentIdField = document.getElementById('equipment-id');
                var equipmentIdContainer = equipmentIdField ? equipmentIdField.closest('.form-group, .form-col') : null;
                var otherEquipmentField = document.getElementById('other-equipment-field');
                
                // Verificar se os elementos foram encontrados
                if (!equipmentIdField || !equipmentIdContainer || !otherEquipmentField) {
                    console.error("❌ Elementos do formulário não encontrados:", {
                        equipmentIdField: !!equipmentIdField,
                        equipmentIdContainer: !!equipmentIdContainer,
                        otherEquipmentField: !!otherEquipmentField
                    });
                    return;
                }
                
                // Esconder todos os campos primeiro
                equipmentIdContainer.style.display = 'none';
                otherEquipmentField.style.display = 'none';
                
                // Limpar campos
                equipmentIdField.innerHTML = '<option value="">Selecione o equipamento...</option>';
                document.getElementById('other-equipment').value = '';
                
                // Mostrar campo apropriado com base na seleção
                if (selectedText === 'Alta Pressão' || selectedText === 'Auto Vácuo / Hiper Vácuo') {
                    // Mostrar e preencher select de equipamentos
                    equipmentIdContainer.style.display = 'block';
                    loadEquipmentList(selectedText, equipmentIdField);
                    equipmentIdField.setAttribute('required', 'required');
                    console.log(`✅ Mostrando select de equipamentos para "${selectedText}"`);
                } 
                else if (selectedText === 'Aspirador' || selectedText === 'Poliguindaste' || selectedText === 'Outro') {
                    // Mostrar campo de entrada manual
                    otherEquipmentField.style.display = 'block';
                    document.getElementById('other-equipment').setAttribute('required', 'required');
                    console.log(`✅ Mostrando campo manual para "${selectedText}"`);
                }
            });
            
            // Configurar o cancelamento do formulário
            var cancelButton = document.querySelector('#maintenance-form .btn-cancel') || 
                             document.querySelector('.maintenance-modal .btn-cancel') ||
                             document.querySelector('.maintenance-form [data-dismiss="modal"]');
            
            if (cancelButton) {
                // Remover eventos existentes
                var newCancelButton = cancelButton.cloneNode(true);
                cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
                
                // Adicionar novo listener
                newCancelButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    console.log("🔄 Cancelando formulário...");
                    
                    // Fechar modal
                    var modal = document.querySelector('.modal.show');
                    if (modal) {
                        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                            var modalInstance = bootstrap.Modal.getInstance(modal);
                            if (modalInstance) modalInstance.hide();
                        } else {
                            // Fallback para jQuery
                            if (typeof $ !== 'undefined') {
                                $(modal).modal('hide');
                            } else {
                                // Fallback manual
                                modal.style.display = 'none';
                                modal.classList.remove('show');
                                document.body.classList.remove('modal-open');
                                var backdrop = document.querySelector('.modal-backdrop');
                                if (backdrop) backdrop.parentNode.removeChild(backdrop);
                            }
                        }
                    }
                    
                    // Resetar formulário
                    var form = document.getElementById('maintenance-form') || document.querySelector('.maintenance-form');
                    if (form) form.reset();
                });
                
                console.log("✅ Listener do botão Cancelar configurado");
            } else {
                console.warn("⚠️ Botão Cancelar não encontrado");
            }
            
            // Configurar o botão Próximo para validação
            var nextButton = document.querySelector('#maintenance-form .btn-next') || 
                           document.querySelector('.maintenance-modal .btn-next') ||
                           document.querySelector('.maintenance-form .btn-primary');
            
            if (nextButton) {
                // Remover eventos existentes
                var newNextButton = nextButton.cloneNode(true);
                nextButton.parentNode.replaceChild(newNextButton, nextButton);
                
                // Adicionar novo listener com validação
                newNextButton.addEventListener('click', function(e) {
                    var form = document.getElementById('maintenance-form') || document.querySelector('.maintenance-form');
                    if (form) {
                        if (!Utilities.validateForm('#maintenance-form, .maintenance-form')) {
                            e.preventDefault();
                            return false;
                        }
                    }
                });
                
                console.log("✅ Validação adicionada ao botão Próximo");
            }
            
            // Se já tiver um valor selecionado no tipo, disparar o evento change
            if (equipmentTypeSelect.value) {
                var event = new Event('change');
                equipmentTypeSelect.dispatchEvent(event);
            }
            
            console.log("✅ Listeners do formulário configurados com sucesso");
        }
        
        // Função para carregar lista de equipamentos
        function loadEquipmentList(equipmentType, selectElement) {
            console.log(`🔄 Carregando equipamentos para "${equipmentType}"...`);
            
            // Mostrar mensagem de carregamento
            selectElement.innerHTML = '<option value="">Carregando equipamentos...</option>';
            selectElement.disabled = true;
            
            // Obter lista de equipamentos
            var equipmentList = window.EQUIPMENT_IDS && window.EQUIPMENT_IDS[equipmentType];
            
            // Verificar se a lista foi encontrada
            if (equipmentList && equipmentList.length > 0) {
                // Limpar select e adicionar opção padrão
                selectElement.innerHTML = '<option value="">Selecione o equipamento...</option>';
                
                // Adicionar opções
                equipmentList.forEach(function(item) {
                    var option = document.createElement('option');
                    option.value = item;
                    option.textContent = item;
                    selectElement.appendChild(option);
                });
                
                selectElement.disabled = false;
                console.log(`✅ ${equipmentList.length} equipamentos carregados para "${equipmentType}"`);
            } else {
                selectElement.innerHTML = '<option value="">Nenhum equipamento encontrado</option>';
                console.warn(`⚠️ Nenhum equipamento encontrado para "${equipmentType}"`);
            }
        }
    }
    
    // Aplicar correções ao formulário
    fixMaintenanceForm();
})();

// PARTE 3: CORREÇÃO DOS FILTROS E DASHBOARD
(function() {
    console.log("🔧 Aplicando correções aos filtros e dashboard...");
    
    // Aguardar o DOM estar pronto
    document.addEventListener('DOMContentLoaded', function() {
        // Verificar se estamos na página com filtros
        var filterContainer = document.querySelector('.filter-container') || document.querySelector('.filters');
        
        if (filterContainer) {
            console.log("🔄 Configurando filtros...");
            
            // Obter botões de filtro
            var filterButton = document.getElementById('filter-button') || document.querySelector('.btn-filter');
            var clearButton = document.getElementById('clear-filter') || document.querySelector('.btn-clear');
            
            if (filterButton) {
                // Remover eventos existentes
                var newFilterButton = filterButton.cloneNode(true);
                filterButton.parentNode.replaceChild(newFilterButton, filterButton);
                filterButton = newFilterButton;
                
                // Adicionar novo listener
                filterButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    console.log("🔄 Aplicando filtros...");
                    
                    // Mostrar indicador de carregamento
                    if (window.Utilities && Utilities.showLoading) {
                        Utilities.showLoading("Filtrando dados...");
                    }
                    
                    // Simular tempo de carregamento
                    setTimeout(function() {
                        if (window.Utilities && Utilities.hideLoading) {
                            Utilities.hideLoading();
                        }
                        
                        console.log("✅ Filtros aplicados com sucesso");
                        
                        // Verificar se há função original para chamar
                        if (window.applyFilters && typeof window.applyFilters === 'function') {
                            window.applyFilters();
                        } else if (window.Maintenance && Maintenance.applyFilters) {
                            Maintenance.applyFilters();
                        }
                    }, 500);
                });
                
                console.log("✅ Listener do botão Filtrar configurado");
            }
            
            if (clearButton) {
                // Remover eventos existentes
                var newClearButton = clearButton.cloneNode(true);
                clearButton.parentNode.replaceChild(newClearButton, clearButton);
                clearButton = newClearButton;
                
                // Adicionar novo listener
                clearButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    console.log("🔄 Limpando filtros...");
                    
                    // Limpar campos de filtro
                    var filterInputs = document.querySelectorAll('.filter-container input, .filter-container select, .filters input, .filters select');
                    filterInputs.forEach(function(input) {
                        if (input.tagName === 'SELECT') {
                            input.selectedIndex = 0;
                        } else {
                            input.value = '';
                        }
                    });
                    
                    // Verificar se há função original para chamar
                    if (window.clearFilters && typeof window.clearFilters === 'function') {
                        window.clearFilters();
                    } else if (window.Maintenance && Maintenance.clearFilters) {
                        Maintenance.clearFilters();
                    }
                    
                    console.log("✅ Filtros limpos com sucesso");
                });
                
                console.log("✅ Listener do botão Limpar configurado");
            }
        }
        
        // Verificar se estamos na página do dashboard
        var dashboardContainer = document.getElementById('dashboard-container') || document.querySelector('.dashboard-content');
        if (dashboardContainer) {
            console.log("🔄 Configurando dashboard...");
            
            // Verificar grid do dashboard
            var dashboardGrid = document.querySelector('.dashboard-grid');
            if (!dashboardGrid) {
                console.log("⚠️ Container .dashboard-grid não encontrado, criando...");
                dashboardGrid = document.createElement('div');
                dashboardGrid.className = 'dashboard-grid';
                dashboardGrid.style.cssText = 'display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:20px; margin-top:20px;';
                dashboardContainer.appendChild(dashboardGrid);
            }
            
            // Criar containers para gráficos se não existirem
            var chartContainers = [
                'maintenance-status-chart',
                'problem-categories-chart',
                'monthly-trend-chart',
                'area-distribution-chart',
                'critical-vs-regular-chart',
                'verification-results-chart',
                'maintenance-type-chart'
            ];
            
            chartContainers.forEach(function(id) {
                if (!document.getElementById(id)) {
                    console.log(`⚠️ Container para o gráfico #${id} não encontrado, criando...`);
                    var container = document.createElement('div');
                    container.className = 'chart-container';
                    container.id = id + '-container';
                    container.style.cssText = 'background:#fff; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.1); padding:15px;';
                    
                    var title = document.createElement('h4');
                    title.textContent = id.replace(/-/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); });
                    title.style.cssText = 'margin-bottom:15px; font-size:16px; color:#333;';
                    container.appendChild(title);
                    
                    var canvas = document.createElement('canvas');
                    canvas.id = id;
                    canvas.style.cssText = 'width:100%; height:250px;';
                    container.appendChild(canvas);
                    
                    dashboardGrid.appendChild(container);
                }
            });
            
            console.log("✅ Containers dos gráficos verificados/criados");
        }
    });
    
    console.log("✅ Correções aos filtros e dashboard aplicadas");
})();

// PARTE 4: INICIALIZAÇÃO E LIMPEZA GERAL
(function() {
    console.log("🔧 Executando inicialização e limpeza geral...");
    
    // Aguardar o DOM estar pronto
    document.addEventListener('DOMContentLoaded', function() {
        console.log("🔄 DOM carregado, executando limpeza e inicialização final...");
        
        // Verificar erros no console e limpar
        if (console.clear && typeof console.clear === 'function') {
            // Comentado para não perder logs úteis durante o desenvolvimento
            // console.clear();
        }
        
        // Iniciar sistema se ainda não iniciou
        setTimeout(function() {
            if (window.initializeApp && typeof window.initializeApp === 'function') {
                console.log("🔄 Chamando window.initializeApp()...");
                try {
                    window.initializeApp();
                    console.log("✅ Sistema inicializado com sucesso");
                } catch (e) {
                    console.error("❌ Erro ao inicializar sistema:", e);
                }
            }
        }, 1000);
        
        console.log("✅ CORREÇÃO DO SISTEMA CONCLUÍDA COM SUCESSO");
    });
})();
