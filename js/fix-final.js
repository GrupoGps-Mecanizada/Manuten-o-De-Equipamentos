/**
 * CORREÇÃO FINAL DO SISTEMA
 * Salve como "fix-final.js" e inclua no início do <body>
 */

(function() {
    // Aguardar até que o DOM esteja completamente carregado
    function onDOMReady(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    // PARTE 1: CORREÇÃO IMEDIATA DOS COMPONENTES CRÍTICOS
    onDOMReady(function() {
        console.log("🔄 INICIANDO CORREÇÃO FINAL");

        // 1. Criar indicador de carregamento global
        if (!document.getElementById('global-loading-indicator')) {
            console.log("📊 Criando indicador de carregamento global");
            var loadingDiv = document.createElement('div');
            loadingDiv.id = 'global-loading-indicator';
            loadingDiv.innerHTML = `
                <div class="loading-spinner"></div>
                <div class="loading-text">Carregando...</div>
            `;
            loadingDiv.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.8); z-index:9999; justify-content:center; align-items:center; flex-direction:column;';
            
            var style = document.createElement('style');
            style.textContent = `
                #global-loading-indicator {
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
                #global-loading-indicator.active {
                    display: flex;
                }
                .loading-spinner {
                    width: 50px;
                    height: 50px;
                    border: 5px solid #f3f3f3;
                    border-top: 5px solid #3498db;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                .loading-text {
                    margin-top: 10px;
                    font-family: sans-serif;
                    font-size: 16px;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            
            document.head.appendChild(style);
            document.body.appendChild(loadingDiv);
            
            // Substituir a função showLoading do Utilities
            if (window.Utilities) {
                window.Utilities.showLoading = function(message) {
                    var indicator = document.getElementById('global-loading-indicator');
                    var textEl = indicator ? indicator.querySelector('.loading-text') : null;
                    
                    if (indicator) {
                        if (textEl) textEl.textContent = message || 'Carregando...';
                        indicator.classList.add('active');
                        console.log("🔄 Loading: " + (message || 'Carregando...'));
                    } else {
                        console.warn("⚠️ Elemento #global-loading-indicator não encontrado.");
                    }
                };
                
                window.Utilities.hideLoading = function() {
                    var indicator = document.getElementById('global-loading-indicator');
                    if (indicator) {
                        indicator.classList.remove('active');
                        console.log("✅ Loading concluído");
                    }
                };
            }
        }

        // 2. Corrigir o container de dashboard
        var dashboardTab = document.querySelector('a[href="#dashboard"], .nav-link[href="#dashboard"], [data-tab="dashboard"]');
        if (dashboardTab) {
            dashboardTab.addEventListener('click', function() {
                setTimeout(checkAndCreateDashboardGrid, 100);
            });
        }

        // Verificar e criar grid do dashboard se estiver na aba dashboard
        function checkAndCreateDashboardGrid() {
            console.log("📊 Verificando grid do dashboard");
            
            // Detectar o container do dashboard
            var dashboardContent = document.querySelector('#dashboard, .dashboard-content, .tab-pane.active[id="dashboard"]');
            if (!dashboardContent) {
                console.warn("⚠️ Container do dashboard não encontrado");
                return;
            }
            
            // Verificar se o grid já existe
            var dashboardGrid = dashboardContent.querySelector('.dashboard-grid');
            if (!dashboardGrid) {
                console.log("📊 Criando grid do dashboard");
                dashboardGrid = document.createElement('div');
                dashboardGrid.className = 'dashboard-grid';
                dashboardGrid.style.cssText = 'display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:20px; margin-top:20px;';
                dashboardContent.appendChild(dashboardGrid);
                
                // Criar containers para os gráficos
                var chartIds = [
                    'maintenance-status-chart',
                    'problem-categories-chart',
                    'monthly-trend-chart',
                    'area-distribution-chart',
                    'critical-vs-regular-chart',
                    'verification-results-chart',
                    'maintenance-type-chart',
                    'maintenance-frequency-chart'
                ];
                
                chartIds.forEach(function(id) {
                    var container = document.createElement('div');
                    container.className = 'chart-container';
                    container.style.cssText = 'background:#fff; border-radius:8px; box-shadow:0 2px 5px rgba(0,0,0,0.1); padding:15px; margin-bottom:20px;';
                    
                    var title = document.createElement('h4');
                    title.textContent = formatChartTitle(id);
                    title.style.cssText = 'margin-bottom:15px; font-size:16px; color:#333;';
                    container.appendChild(title);
                    
                    var canvas = document.createElement('canvas');
                    canvas.id = id;
                    canvas.style.cssText = 'width:100%; height:250px;';
                    container.appendChild(canvas);
                    
                    dashboardGrid.appendChild(container);
                    console.log("📊 Canvas criado: " + id);
                });
                
                // Forçar a atualização dos dados do dashboard
                if (window.Dashboard && typeof Dashboard.loadDashboardData === 'function') {
                    console.log("📊 Recarregando dados do dashboard");
                    Dashboard.loadDashboardData('current-month');
                }
            }
        }
        
        function formatChartTitle(id) {
            return id.replace(/-/g, ' ')
                    .replace(/\b\w/g, function(l) { return l.toUpperCase(); })
                    .replace('Chart', '');
        }
        
        // Verificar se está na aba dashboard inicialmente
        if (document.querySelector('.tab-pane.active[id="dashboard"], #dashboard.active')) {
            checkAndCreateDashboardGrid();
        }

        // 3. Corrigir formulário de manutenção
        fixMaintenanceForm();
        
        function fixMaintenanceForm() {
            console.log("🔧 Aplicando correções ao formulário de manutenção");
            
            // Procurar pelo botão de nova manutenção e adicionar listener para o evento de abertura
            var newMaintenanceBtn = document.getElementById('new-maintenance') || 
                                  document.querySelector('.btn-new-maintenance, [data-action="new-maintenance"]');
            
            if (newMaintenanceBtn) {
                newMaintenanceBtn.addEventListener('click', function() {
                    // Dar tempo para o modal abrir
                    setTimeout(setupFormHandlers, 300);
                });
            }
            
            // Configurar handlers para o formulário
            function setupFormHandlers() {
                console.log("🔧 Configurando handlers do formulário");
                
                // Obter elementos do formulário
                var form = document.getElementById('maintenance-form') || 
                         document.querySelector('.maintenance-form, .modal.show form');
                         
                if (!form) {
                    console.warn("⚠️ Formulário não encontrado");
                    return;
                }
                
                // 1. Configurar validação para campos obrigatórios
                var nextButton = form.querySelector('.btn-next, .btn-primary, [type="submit"]');
                if (nextButton) {
                    // Remover eventos existentes
                    var newNextButton = nextButton.cloneNode(true);
                    if (nextButton.parentNode) {
                        nextButton.parentNode.replaceChild(newNextButton, nextButton);
                    }
                    
                    // Adicionar novo listener com validação
                    newNextButton.addEventListener('click', function(e) {
                        if (!validateForm(form)) {
                            e.preventDefault();
                            e.stopPropagation();
                            return false;
                        }
                    });
                    
                    console.log("✅ Validação configurada para o botão " + (newNextButton.textContent || 'Próximo'));
                }
                
                // 2. Configurar o botão cancelar
                var cancelButton = form.querySelector('.btn-cancel, [data-dismiss="modal"], .btn-secondary');
                if (cancelButton) {
                    // Remover eventos existentes
                    var newCancelButton = cancelButton.cloneNode(true);
                    if (cancelButton.parentNode) {
                        cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
                    }
                    
                    // Adicionar novo listener
                    newCancelButton.addEventListener('click', function(e) {
                        e.preventDefault();
                        
                        // Fechar o modal
                        var modal = form.closest('.modal');
                        if (modal) {
                            // Tentar fechar usando Bootstrap
                            if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                                var bsModal = bootstrap.Modal.getInstance(modal);
                                if (bsModal) bsModal.hide();
                            } else if (typeof $ !== 'undefined') {
                                // Tentar fechar usando jQuery
                                $(modal).modal('hide');
                            } else {
                                // Fechamento manual
                                modal.style.display = 'none';
                                modal.classList.remove('show');
                                document.body.classList.remove('modal-open');
                                
                                var backdrop = document.querySelector('.modal-backdrop');
                                if (backdrop && backdrop.parentNode) {
                                    backdrop.parentNode.removeChild(backdrop);
                                }
                            }
                        }
                        
                        // Resetar o formulário
                        form.reset();
                        console.log("✅ Formulário cancelado e resetado");
                    });
                    
                    console.log("✅ Botão cancelar configurado");
                }
                
                // 3. Verificar e configurar seleção de tipo de equipamento
                var equipmentTypeSelect = form.querySelector('#equipment-type, [name="equipment-type"]');
                if (equipmentTypeSelect) {
                    // Identificar containers dos campos relacionados
                    var equipmentIdField = form.querySelector('#equipment-id, [name="equipment-id"]');
                    var equipmentIdContainer = equipmentIdField ? 
                                             equipmentIdField.closest('.form-group, .form-col, .form-row, .mb-3') : 
                                             null;
                                             
                    var otherEquipmentField = form.querySelector('#other-equipment, [name="other-equipment"]');
                    var otherEquipmentContainer = otherEquipmentField ? 
                                                otherEquipmentField.closest('.form-group, .form-col, .form-row, .mb-3, #other-equipment-field') : 
                                                document.getElementById('other-equipment-field');
                    
                    // Estado inicial
                    console.log("🔍 Estado dos campos do formulário:");
                    console.log("- Tipo equipamento: " + (equipmentTypeSelect ? "Encontrado" : "Não encontrado"));
                    console.log("- Campo ID: " + (equipmentIdContainer ? "Encontrado" : "Não encontrado"));
                    console.log("- Campo outro: " + (otherEquipmentContainer ? "Encontrado" : "Não encontrado"));
                    
                    // Se não encontrou o container "outro equipamento", tentar criar
                    if (!otherEquipmentContainer && equipmentIdContainer) {
                        console.log("⚠️ Container 'outro equipamento' não encontrado, criando...");
                        
                        otherEquipmentContainer = document.createElement('div');
                        otherEquipmentContainer.id = 'other-equipment-field';
                        otherEquipmentContainer.className = equipmentIdContainer.className;
                        otherEquipmentContainer.style.display = 'none';
                        
                        var label = document.createElement('label');
                        label.htmlFor = 'other-equipment';
                        label.textContent = 'Identificação do Equipamento';
                        
                        var input = document.createElement('input');
                        input.type = 'text';
                        input.id = 'other-equipment';
                        input.name = 'other-equipment';
                        input.className = 'form-control';
                        input.placeholder = 'Informe a identificação do equipamento';
                        
                        otherEquipmentContainer.appendChild(label);
                        otherEquipmentContainer.appendChild(input);
                        
                        // Inserir após o container do equipment-id
                        equipmentIdContainer.parentNode.insertBefore(otherEquipmentContainer, equipmentIdContainer.nextSibling);
                        
                        otherEquipmentField = input;
                    }
                    
                    // Remover eventos existentes
                    var newEquipmentTypeSelect = equipmentTypeSelect.cloneNode(true);
                    equipmentTypeSelect.parentNode.replaceChild(newEquipmentTypeSelect, equipmentTypeSelect);
                    equipmentTypeSelect = newEquipmentTypeSelect;
                    
                    // Configurar evento change
                    equipmentTypeSelect.addEventListener('change', function() {
                        var selectedText = this.options[this.selectedIndex].text;
                        console.log("🔄 Tipo de equipamento selecionado: " + selectedText);
                        
                        // Esconder ambos os campos primeiro
                        if (equipmentIdContainer) equipmentIdContainer.style.display = 'none';
                        if (otherEquipmentContainer) otherEquipmentContainer.style.display = 'none';
                        
                        // Remover validação
                        if (equipmentIdField) equipmentIdField.removeAttribute('required');
                        if (otherEquipmentField) otherEquipmentField.removeAttribute('required');
                        
                        // Mostrar campo apropriado
                        if (selectedText === 'Alta Pressão' || selectedText === 'Auto Vácuo / Hiper Vácuo') {
                            if (equipmentIdContainer) {
                                equipmentIdContainer.style.display = 'block';
                                if (equipmentIdField) {
                                    equipmentIdField.setAttribute('required', 'required');
                                    
                                    // Carregar lista de equipamentos
                                    loadEquipmentList(selectedText, equipmentIdField);
                                }
                            }
                        } 
                        else if (selectedText === 'Aspirador' || selectedText === 'Poliguindaste' || selectedText === 'Outro') {
                            if (otherEquipmentContainer) {
                                otherEquipmentContainer.style.display = 'block';
                                if (otherEquipmentField) {
                                    otherEquipmentField.setAttribute('required', 'required');
                                    otherEquipmentField.focus();
                                }
                            }
                        }
                    });
                    
                    console.log("✅ Handler de tipo de equipamento configurado");
                    
                    // Disparar o evento change se já tiver um valor selecionado
                    if (equipmentTypeSelect.value) {
                        var event = new Event('change');
                        equipmentTypeSelect.dispatchEvent(event);
                    }
                }
            }
            
            // Função para carregar lista de equipamentos no select
            function loadEquipmentList(equipmentType, selectElement) {
                console.log("🔄 Carregando equipamentos para: " + equipmentType);
                
                // Mostrar estado de carregamento
                selectElement.innerHTML = '<option value="">Carregando equipamentos...</option>';
                selectElement.disabled = true;
                
                // Lista de equipamentos hardcoded (backup)
                var equipmentLists = {
                    'Alta Pressão': ["PUB-2G02","LUX-3201","FLX7617","EZS-8765","EZS-8764","EVK-0291","EOF-5C06",
                                   "EOF-5208","EGC-2989","EGC-2985","EGC-2983","EGC-2978","EAM-3262","EAM-3256",
                                   "EAM-3255","EAM-3253","EAM-3010","DSY-6475","DSY-6474","DSY-6472","CZC-0453"],
                    'Auto Vácuo / Hiper Vácuo': ["PUB-2F80","NFF-0235","HJS-1097","FSA-3D71","EGC-2993","EGC-2979",
                                               "EAM-3257","EAM-3251","DYB-7210","DSY-6577","DSY-6473","CUB-0763",
                                               "ANF-2676","FTW-4D99","FTD-6368","FMD-2200","FHD-9264","EZS-9753"]
                };
                
                // Tentar obter lista do objeto global EQUIPMENT_IDS
                var equipmentList = [];
                if (window.EQUIPMENT_IDS && EQUIPMENT_IDS[equipmentType]) {
                    equipmentList = EQUIPMENT_IDS[equipmentType];
                } else if (equipmentLists[equipmentType]) {
                    equipmentList = equipmentLists[equipmentType];
                }
                
                // Resetar o select
                selectElement.innerHTML = '<option value="">Selecione o equipamento...</option>';
                selectElement.disabled = false;
                
                // Adicionar opções
                if (equipmentList && equipmentList.length > 0) {
                    equipmentList.forEach(function(item) {
                        var option = document.createElement('option');
                        option.value = item;
                        option.textContent = item;
                        selectElement.appendChild(option);
                    });
                    
                    console.log("✅ " + equipmentList.length + " equipamentos carregados");
                } else {
                    console.warn("⚠️ Nenhum equipamento encontrado para " + equipmentType);
                    selectElement.innerHTML += '<option value="" disabled>Nenhum equipamento encontrado</option>';
                }
            }
            
            // Função para validar formulário
            function validateForm(form) {
                console.log("🔍 Validando formulário");
                
                var isValid = true;
                var requiredFields = form.querySelectorAll('[required]');
                
                // Remover mensagens de erro anteriores
                form.querySelectorAll('.error-message').forEach(function(el) {
                    el.parentNode.removeChild(el);
                });
                
                // Verificar cada campo requerido
                requiredFields.forEach(function(field) {
                    field.classList.remove('is-invalid');
                    
                    if (!field.value.trim()) {
                        isValid = false;
                        field.classList.add('is-invalid');
                        
                        // Criar mensagem de erro
                        var errorMsg = document.createElement('div');
                        errorMsg.className = 'invalid-feedback error-message';
                        errorMsg.textContent = 'Este campo é obrigatório';
                        
                        // Adicionar após o campo
                        field.parentNode.appendChild(errorMsg);
                    }
                });
                
                if (!isValid) {
                    // Encontrar o primeiro campo com erro e focar nele
                    var firstInvalid = form.querySelector('.is-invalid');
                    if (firstInvalid) firstInvalid.focus();
                    
                    // Mostrar alerta
                    alert('Por favor, preencha todos os campos obrigatórios');
                }
                
                return isValid;
            }
        }

        console.log("✅ CORREÇÃO FINAL APLICADA COM SUCESSO");
    });
})();
