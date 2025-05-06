/**
 * FIXFORMMODAL.JS - Correção para o problema do formulário de manutenção
 * Este arquivo contém uma solução completa para garantir que o modal de manutenção
 * seja exibido corretamente e funcione sem erros.
 */

(function() {
    console.log("Aplicando correção para o formulário de manutenção...");
    
    // Esperar que o DOM esteja carregado
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeFix);
    } else {
        initializeFix();
    }
    
    function initializeFix() {
        // 1. Redefinir a função de carregamento do formulário na API
        if (window.API && typeof API.loadMaintenanceForm === 'function') {
            const originalLoadMaintenanceForm = API.loadMaintenanceForm;
            
            API.loadMaintenanceForm = function() {
                return new Promise((resolve, reject) => {
                    console.log("Usando função aprimorada de carregamento do formulário");
                    
                    try {
                        // Identificar o container 
                        const container = document.getElementById('maintenance-form-container');
                        if (!container) {
                            // Criar o container se não existir
                            const newContainer = document.createElement('div');
                            newContainer.id = 'maintenance-form-container';
                            document.body.appendChild(newContainer);
                            console.log("Container do formulário criado automaticamente");
                            return API.loadMaintenanceForm().then(resolve).catch(reject);
                        }
                        
                        // Estilos críticos para garantir visibilidade
                        const formStyles = `
                            <style id="maintenance-form-fix-styles">
                                #maintenance-form-overlay {
                                    position: fixed !important;
                                    top: 0 !important;
                                    left: 0 !important;
                                    width: 100% !important;
                                    height: 100% !important;
                                    background-color: rgba(0,0,0,0.5) !important;
                                    display: none;
                                    z-index: 9999 !important;
                                    justify-content: center !important;
                                    align-items: center !important;
                                    padding: 20px !important;
                                }
                                
                                #maintenance-form-modal {
                                    background-color: white !important;
                                    padding: 20px !important;
                                    border-radius: 8px !important;
                                    width: 80% !important;
                                    max-width: 800px !important;
                                    max-height: 90vh !important;
                                    overflow-y: auto !important;
                                    position: relative !important;
                                    box-shadow: 0 5px 15px rgba(0,0,0,0.3) !important;
                                }
                                
                                .form-step {
                                    display: inline-block !important;
                                    margin-right: 15px !important;
                                    padding: 5px 10px !important;
                                    border-radius: 4px !important;
                                    background-color: #f0f0f0 !important;
                                    color: #666 !important;
                                }
                                
                                .form-step.active {
                                    background-color: #4CAF50 !important;
                                    color: white !important;
                                }
                                
                                .step-content {
                                    display: none;
                                }
                                
                                .step-content.active {
                                    display: block !important;
                                }
                                
                                .form-actions {
                                    margin-top: 20px !important;
                                    text-align: right !important;
                                }
                                
                                .btn {
                                    padding: 8px 16px !important;
                                    border-radius: 4px !important;
                                    cursor: pointer !important;
                                    border: none !important;
                                    margin-left: 10px !important;
                                }
                                
                                .btn-primary {
                                    background-color: #4CAF50 !important;
                                    color: white !important;
                                }
                                
                                .btn-secondary {
                                    background-color: #f0f0f0 !important;
                                    color: #333 !important;
                                }
                            </style>
                        `;
                        
                        // Formulário HTML completo com todas as etapas
                        container.innerHTML = formStyles + `
                            <div id="maintenance-form-overlay" class="modal-overlay">
                                <div id="maintenance-form-modal" class="modal-content">
                                    <h2 class="form-title">Nova Manutenção</h2>
                                    <button id="close-maintenance-form" class="close-modal-btn">&times;</button>
                                    
                                    <div class="form-steps">
                                        <div class="form-step active">1. Equipamento</div>
                                        <div class="form-step">2. Problema</div>
                                        <div class="form-step">3. Resumo</div>
                                    </div>
                                    
                                    <form id="maintenance-form" class="multi-step-form">
                                        <!-- Etapa 1: Equipamento -->
                                        <div id="step-1-content" class="step-content active">
                                            <div class="form-row">
                                                <div class="form-col">
                                                    <label for="equipment-type">Tipo de Equipamento *</label>
                                                    <select id="equipment-type" required>
                                                        <option value="">Selecione o tipo...</option>
                                                    </select>
                                                </div>
                                                
                                                <div class="form-col">
                                                    <label for="equipment-id">Placa/ID do Equipamento *</label>
                                                    <select id="equipment-id" disabled>
                                                        <option value="">Selecione o equipamento...</option>
                                                    </select>
                                                </div>
                                            </div>
                                            
                                            <div class="form-row">
                                                <div class="form-col">
                                                    <label for="technician-name">Responsável *</label>
                                                    <input type="text" id="technician-name" required placeholder="Nome do responsável">
                                                </div>
                                                
                                                <div class="form-col">
                                                    <label for="maintenance-date">Data *</label>
                                                    <input type="date" id="maintenance-date" required>
                                                </div>
                                            </div>
                                            
                                            <div class="form-row">
                                                <div class="form-col">
                                                    <label for="area">Área *</label>
                                                    <select id="area" required>
                                                        <option value="">Selecione a área...</option>
                                                        <option value="TORK DIESEL">TORK DIESEL</option>
                                                        <option value="Servitec">Servitec</option>
                                                        <option value="Parana Molas">Parana Molas</option>
                                                        <option value="Carplaca">Carplaca</option>
                                                        <option value="JJS Diesel">JJS Diesel</option>
                                                        <option value="Outro">Outro</option>
                                                    </select>
                                                </div>
                                                
                                                <div class="form-col">
                                                    <label for="office">Local/Oficina *</label>
                                                    <input type="text" id="office" required placeholder="Local específico">
                                                </div>
                                            </div>
                                            
                                            <div class="form-row">
                                                <div class="form-col">
                                                    <label for="maintenance-type-select">Tipo de Manutenção *</label>
                                                    <select id="maintenance-type-select" required>
                                                        <option value="">Selecione o tipo...</option>
                                                        <option value="Preventiva">Preventiva</option>
                                                        <option value="Corretiva">Corretiva</option>
                                                        <option value="Emergencial">Emergencial</option>
                                                        <option value="Melhoria">Melhoria</option>
                                                    </select>
                                                </div>
                                                
                                                <div class="form-col">
                                                    <div class="checkbox-group">
                                                        <input type="checkbox" id="is-critical">
                                                        <label for="is-critical">Manutenção Crítica</label>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div class="form-actions">
                                                <button type="button" id="next-to-step-2" class="btn btn-primary">Avançar</button>
                                            </div>
                                        </div>
                                        
                                        <!-- Etapa 2: Problema -->
                                        <div id="step-2-content" class="step-content">
                                            <div class="form-row">
                                                <div class="form-col">
                                                    <label for="problem-category-select">Categoria do Problema *</label>
                                                    <select id="problem-category-select" required>
                                                        <option value="">Selecione a categoria...</option>
                                                    </select>
                                                </div>
                                            </div>
                                            
                                            <div class="form-row">
                                                <div class="form-col">
                                                    <label for="problem-description">Descrição do Problema *</label>
                                                    <textarea id="problem-description" required rows="5" placeholder="Descreva detalhadamente o problema encontrado"></textarea>
                                                </div>
                                            </div>
                                            
                                            <div class="form-row">
                                                <div class="form-col">
                                                    <label for="additional-notes">Observações</label>
                                                    <textarea id="additional-notes" rows="3" placeholder="Informações complementares (opcional)"></textarea>
                                                </div>
                                            </div>
                                            
                                            <div class="form-actions">
                                                <button type="button" id="back-to-step-1" class="btn btn-secondary">Voltar</button>
                                                <button type="button" id="next-to-step-3" class="btn btn-primary">Avançar</button>
                                            </div>
                                        </div>
                                        
                                        <!-- Etapa 3: Resumo -->
                                        <div id="step-3-content" class="step-content">
                                            <div class="summary-container">
                                                <h3>Resumo da Manutenção</h3>
                                                
                                                <div class="summary-group">
                                                    <div class="summary-item">
                                                        <strong>Equipamento:</strong>
                                                        <span id="summary-equipment">-</span>
                                                    </div>
                                                    <div class="summary-item">
                                                        <strong>Responsável:</strong>
                                                        <span id="summary-technician">-</span>
                                                    </div>
                                                    <div class="summary-item">
                                                        <strong>Data:</strong>
                                                        <span id="summary-date">-</span>
                                                    </div>
                                                    <div class="summary-item">
                                                        <strong>Local:</strong>
                                                        <span id="summary-location">-</span>
                                                    </div>
                                                    <div class="summary-item">
                                                        <strong>Tipo:</strong>
                                                        <span id="summary-type">-</span>
                                                    </div>
                                                    <div class="summary-item">
                                                        <strong>Crítica:</strong>
                                                        <span id="summary-critical">-</span>
                                                    </div>
                                                    <div class="summary-item">
                                                        <strong>Categoria do Problema:</strong>
                                                        <span id="summary-category">-</span>
                                                    </div>
                                                    <div class="summary-item">
                                                        <strong>Descrição:</strong>
                                                        <span id="summary-problem">-</span>
                                                    </div>
                                                    <div class="summary-item">
                                                        <strong>Observações:</strong>
                                                        <span id="summary-notes">Nenhuma</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div class="form-actions">
                                                <button type="button" id="back-to-step-2" class="btn btn-secondary">Voltar</button>
                                                <button type="submit" id="submit-maintenance" class="btn btn-primary">Registrar Manutenção</button>
                                                <button type="button" id="cancel-maintenance" class="btn btn-secondary">Cancelar</button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        `;
                        
                        console.log("HTML do formulário injetado com sucesso no container (versão corrigida)");
                        
                        // Garantir tempo suficiente para o DOM atualizar
                        setTimeout(() => {
                            // Verificar se o DOM foi atualizado corretamente
                            const formModal = document.getElementById('maintenance-form-modal');
                            const step1Content = document.getElementById('step-1-content');
                            
                            if (formModal && step1Content) {
                                console.log("Formulário carregado e verificado com sucesso");
                                resolve(true);
                            } else {
                                console.error("Formulário não carregado corretamente após timeout");
                                reject(new Error("Falha ao carregar formulário: elementos não encontrados após injeção HTML"));
                            }
                        }, 300); // Aumento do timeout para garantir que o DOM seja atualizado
                    } catch (error) {
                        console.error("Erro crítico ao processar HTML do formulário:", error);
                        reject(error);
                    }
                });
            };
            
            console.log("Função API.loadMaintenanceForm substituída com sucesso");
        }
        
        // 2. Corrigir a função de abertura do formulário no módulo Maintenance
        if (window.Maintenance && typeof Maintenance.openMaintenanceForm === 'function') {
            const originalOpenMaintenanceForm = Maintenance.openMaintenanceForm;
            
            Maintenance.openMaintenanceForm = function(maintenanceId = null, data = null) {
                console.log("Usando função aprimorada de abertura do formulário");
                
                // Verificar se o container do formulário existe
                let container = document.getElementById('maintenance-form-container');
                if (!container) {
                    console.log("Container #maintenance-form-container não encontrado, criando um novo...");
                    container = document.createElement('div');
                    container.id = 'maintenance-form-container';
                    document.body.appendChild(container);
                }
                
                // Usar Utilities.showLoading se disponível
                if (window.Utilities && typeof Utilities.showLoading === 'function') {
                    Utilities.showLoading(true, "Carregando formulário...");
                }
                
                // Se o formulário modal já existe, limpar e exibí-lo
                const existingModal = document.getElementById('maintenance-form-overlay');
                if (existingModal) {
                    console.log("Modal já existe no DOM, reaproveitando...");
                    
                    // Mostrar com estilos inline forçados
                    existingModal.style.position = 'fixed';
                    existingModal.style.top = '0';
                    existingModal.style.left = '0';
                    existingModal.style.width = '100%';
                    existingModal.style.height = '100%';
                    existingModal.style.backgroundColor = 'rgba(0,0,0,0.5)';
                    existingModal.style.display = 'flex';
                    existingModal.style.zIndex = '9999';
                    existingModal.style.justifyContent = 'center';
                    existingModal.style.alignItems = 'center';
                    
                    // Garantir visibilidade do modal
                    const modalContent = document.getElementById('maintenance-form-modal');
                    if (modalContent) {
                        modalContent.style.backgroundColor = 'white';
                        modalContent.style.padding = '20px';
                        modalContent.style.borderRadius = '8px';
                        modalContent.style.maxWidth = '800px';
                        modalContent.style.width = '80%';
                        modalContent.style.maxHeight = '90vh';
                        modalContent.style.overflowY = 'auto';
                    }
                    
                    // Reiniciar o formulário
                    this.resetForm && this.resetForm();
                    
                    // Mostrar a primeira etapa com verificação
                    const step1 = document.getElementById('step-1-content');
                    if (step1) {
                        // Esconder todas as etapas
                        const allSteps = document.querySelectorAll('.step-content');
                        allSteps.forEach(step => step.style.display = 'none');
                        
                        // Mostrar apenas a primeira etapa
                        step1.style.display = 'block';
                        
                        // Atualizar indicadores de etapa
                        const stepIndicators = document.querySelectorAll('.form-step');
                        stepIndicators.forEach((indicator, index) => {
                            if (index === 0) {
                                indicator.classList.add('active');
                            } else {
                                indicator.classList.remove('active');
                            }
                        });
                    }
                    
                    // Configurar listeners após um delay
                    setTimeout(() => {
                        this.setupDynamicFieldListeners && this.setupDynamicFieldListeners();
                        this.setupNavigationListeners && this.setupNavigationListeners();
                        
                        // Escutar o botão fechar
                        const closeBtn = document.getElementById('close-maintenance-form');
                        if (closeBtn) {
                            closeBtn.addEventListener('click', () => {
                                this.closeForm && this.closeForm();
                            });
                        }
                        
                        // Escutar o botão cancelar
                        const cancelBtn = document.getElementById('cancel-maintenance');
                        if (cancelBtn) {
                            cancelBtn.addEventListener('click', () => {
                                this.closeForm && this.closeForm();
                            });
                        }
                        
                        console.log("Listeners configurados com sucesso para o formulário");
                    }, 300);
                    
                    if (window.Utilities && typeof Utilities.showLoading === 'function') {
                        Utilities.showLoading(false);
                    }
                    
                    console.log("Modal de manutenção reaberto com sucesso");
                    return;
                }
                
                // Carregar o formulário se não existir
                if (window.API && typeof API.loadMaintenanceForm === 'function') {
                    API.loadMaintenanceForm()
                        .then(() => {
                            console.log("HTML do formulário carregado com sucesso");
                            
                            // Verificar novamente se o formulário existe no DOM
                            const modal = document.getElementById('maintenance-form-overlay');
                            if (!modal) {
                                console.error("Formulário ainda não encontrado no DOM após loadMaintenanceForm()");
                                if (window.Utilities && typeof Utilities.showNotification === 'function') {
                                    Utilities.showNotification("Erro ao carregar formulário. Tente novamente.", "error");
                                }
                                if (window.Utilities && typeof Utilities.showLoading === 'function') {
                                    Utilities.showLoading(false);
                                }
                                return;
                            }
                            
                            // Mesmo código de reinicialização do caso acima
                            modal.style.position = 'fixed';
                            modal.style.top = '0';
                            modal.style.left = '0';
                            modal.style.width = '100%';
                            modal.style.height = '100%';
                            modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
                            modal.style.display = 'flex';
                            modal.style.zIndex = '9999';
                            modal.style.justifyContent = 'center';
                            modal.style.alignItems = 'center';
                            
                            const modalContent = document.getElementById('maintenance-form-modal');
                            if (modalContent) {
                                modalContent.style.backgroundColor = 'white';
                                modalContent.style.padding = '20px';
                                modalContent.style.borderRadius = '8px';
                                modalContent.style.maxWidth = '800px';
                                modalContent.style.width = '80%';
                                modalContent.style.maxHeight = '90vh';
                                modalContent.style.overflowY = 'auto';
                            }
                            
                            // Preencher os dropdowns
                            this.populateEquipmentTypes && this.populateEquipmentTypes();
                            this.populateProblemCategories && this.populateProblemCategories();
                            
                            // Reiniciar formulário
                            this.resetForm && this.resetForm();
                            
                            // Mostrar primeira etapa
                            const step1 = document.getElementById('step-1-content');
                            if (step1) {
                                // Esconder todas as etapas
                                const allSteps = document.querySelectorAll('.step-content');
                                allSteps.forEach(step => step.style.display = 'none');
                                
                                // Mostrar apenas a primeira etapa
                                step1.style.display = 'block';
                                
                                // Atualizar indicadores de etapa
                                const stepIndicators = document.querySelectorAll('.form-step');
                                stepIndicators.forEach((indicator, index) => {
                                    if (index === 0) {
                                        indicator.classList.add('active');
                                    } else {
                                        indicator.classList.remove('active');
                                    }
                                });
                            }
                            
                            // Configurar listeners após um delay
                            setTimeout(() => {
                                this.setupDynamicFieldListeners && this.setupDynamicFieldListeners();
                                this.setupNavigationListeners && this.setupNavigationListeners();
                                
                                // Escutar o botão fechar
                                const closeBtn = document.getElementById('close-maintenance-form');
                                if (closeBtn) {
                                    closeBtn.addEventListener('click', () => {
                                        this.closeForm && this.closeForm();
                                    });
                                }
                                
                                // Escutar o botão cancelar
                                const cancelBtn = document.getElementById('cancel-maintenance');
                                if (cancelBtn) {
                                    cancelBtn.addEventListener('click', () => {
                                        this.closeForm && this.closeForm();
                                    });
                                }
                                
                                console.log("Listeners configurados com sucesso para o formulário");
                            }, 300);
                            
                            console.log("Modal de manutenção aberto com sucesso");
                        })
                        .catch(error => {
                            console.error("Falha ao carregar HTML do formulário:", error);
                            if (window.Utilities && typeof Utilities.showNotification === 'function') {
                                Utilities.showNotification("Erro ao carregar formulário. Tente novamente.", "error");
                            }
                        })
                        .finally(() => {
                            if (window.Utilities && typeof Utilities.showLoading === 'function') {
                                Utilities.showLoading(false);
                            }
                        });
                } else {
                    console.error("API.loadMaintenanceForm não é uma função ou API não está disponível");
                    if (window.Utilities && typeof Utilities.showNotification === 'function') {
                        Utilities.showNotification("Erro crítico: API não disponível. Recarregue a página.", "error");
                    }
                    if (window.Utilities && typeof Utilities.showLoading === 'function') {
                        Utilities.showLoading(false);
                    }
                }
            };
            
            console.log("Função Maintenance.openMaintenanceForm substituída com sucesso");
        }
        
        // 3. Corrigir a função showStep
        if (window.Maintenance && typeof Maintenance.showStep === 'function') {
            const originalShowStep = Maintenance.showStep;
            
            Maintenance.showStep = function(step) {
                console.log("Usando função aprimorada para mostrar etapa:", step);
                
                // Verificar se os elementos existem
                const step1 = document.getElementById('step-1-content');
                const step2 = document.getElementById('step-2-content');
                const step3 = document.getElementById('step-3-content');
                
                if (!step1 || !step2 || !step3) {
                    console.error("Um ou mais containers de etapa não encontrados, tentando reconstruir...");
                    
                    // Função para reconstruir as etapas faltantes
                    const rebuildMissingSteps = () => {
                        const form = document.getElementById('maintenance-form');
                        if (!form) return false;
                        
                        let rebuilt = false;
                        
                        if (!step1) {
                            const newStep1 = document.createElement('div');
                            newStep1.id = 'step-1-content';
                            newStep1.className = 'step-content';
                            newStep1.innerHTML = `
                                <div class="form-row">
                                    <div class="form-col">
                                        <label for="equipment-type">Tipo de Equipamento *</label>
                                        <select id="equipment-type" required>
                                            <option value="">Selecione o tipo...</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-col">
                                        <label for="equipment-id">Placa/ID do Equipamento *</label>
                                        <select id="equipment-id" disabled>
                                            <option value="">Selecione o equipamento...</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-col">
                                        <label for="technician-name">Responsável *</label>
                                        <input type="text" id="technician-name" required placeholder="Nome do responsável">
                                    </div>
                                    
                                    <div class="form-col">
                                        <label for="maintenance-date">Data *</label>
                                        <input type="date" id="maintenance-date" required>
                                    </div>
                                </div>
                                
                                <div class="form-actions">
                                    <button type="button" id="next-to-step-2" class="btn btn-primary">Avançar</button>
                                </div>
                            `;
                            form.appendChild(newStep1);
                            rebuilt = true;
                        }
                        
                        if (!step2) {
                            const newStep2 = document.createElement('div');
                            newStep2.id = 'step-2-content';
                            newStep2.className = 'step-content';
                            newStep2.style.display = 'none';
                            newStep2.innerHTML = `
                                <div class="form-row">
                                    <div class="form-col">
                                        <label for="problem-category-select">Categoria do Problema *</label>
                                        <select id="problem-category-select" required>
                                            <option value="">Selecione a categoria...</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-col">
                                        <label for="problem-description">Descrição do Problema *</label>
                                        <textarea id="problem-description" required rows="5" placeholder="Descreva detalhadamente o problema encontrado"></textarea>
                                    </div>
                                </div>
                                
                                <div class="form-actions">
                                    <button type="button" id="back-to-step-1" class="btn btn-secondary">Voltar</button>
                                    <button type="button" id="next-to-step-3" class="btn btn-primary">Avançar</button>
                                </div>
                            `;
                            form.appendChild(newStep2);
                            rebuilt = true;
                        }
                        
                        if (!step3) {
                            const newStep3 = document.createElement('div');
                            newStep3.id = 'step-3-content';
                            newStep3.className = 'step-content';
                            newStep3.style.display = 'none';
                            newStep3.innerHTML = `
                                <div class="summary-container">
                                    <h3>Resumo da Manutenção</h3>
                                    
                                    <div class="summary-group">
                                        <div class="summary-item">
                                            <strong>Equipamento:</strong>
                                            <span id="summary-equipment">-</span>
                                        </div>
                                        <div class="summary-item">
                                            <strong>Problema:</strong>
                                            <span id="summary-problem">-</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="form-actions">
                                    <button type="button" id="back-to-step-2" class="btn btn-secondary">Voltar</button>
                                    <button type="submit" id="submit-maintenance" class="btn btn-primary">Registrar Manutenção</button>
                                    <button type="button" id="cancel-maintenance" class="btn btn-secondary">Cancelar</button>
                                </div>
                            `;
                            form.appendChild(newStep3);
                            rebuilt = true;
                        }
                        
                        return rebuilt;
                    };
                    
                    // Tentar reconstruir as etapas faltantes
                    if (rebuildMissingSteps()) {
                        console.log("Etapas reconstruídas com sucesso");
                        
                        // Reconfigurar listeners após reconstrução
                        setTimeout(() => {
                            this.setupDynamicFieldListeners && this.setupDynamicFieldListeners();
                            this.setupNavigationListeners && this.setupNavigationListeners();
                            console.log("Listeners reconfigurados após reconstrução das etapas");
                        }, 100);
                    } else {
                        console.error("Não foi possível reconstruir as etapas - o formulário não foi encontrado");
                        return false;
                    }
                }
                
                // Atualizar variáveis após possível reconstrução
                const stepElements = {
                    1: document.getElementById('step-1-content'),
                    2: document.getElementById('step-2-content'),
                    3: document.getElementById('step-3-content')
                };
                
                // Esconder todas as etapas
                Object.values(stepElements).forEach(el => {
                    if (el) el.style.display = 'none';
                });
                
                // Mostrar apenas a etapa solicitada
                if (stepElements[step]) {
                    stepElements[step].style.display = 'block';
                    
                    // Atualizar indicadores de etapa
                    const stepIndicators = document.querySelectorAll('.form-step');
                    stepIndicators.forEach((indicator, index) => {
                        if (index === step - 1) {
                            indicator.classList.add('active');
                        } else {
                            indicator.classList.remove('active');
                        }
                    });
                    
                    console.log(`Etapa ${step} mostrada com sucesso`);
                    return true;
                } else {
                    console.error(`Etapa ${step} não encontrada mesmo após tentativa de reconstrução`);
                    return false;
                }
            };
            
            console.log("Função Maintenance.showStep substituída com sucesso");
        }
        
        // 4. Adicionar um listener ao botão de nova manutenção
        const addNewMaintenanceButtonListener = () => {
            const newMaintenanceBtn = document.getElementById('new-maintenance');
            if (newMaintenanceBtn) {
                // Preservar o handler original
                const originalClickHandler = newMaintenanceBtn.onclick;
                
                // Substituir por nosso handler melhorado
                newMaintenanceBtn.onclick = function(e) {
                    console.log("Botão Nova Manutenção clicado (handler melhorado)");
                    
                    if (originalClickHandler) {
                        originalClickHandler.call(this, e);
                    }
                    
                    // Verificar se o modal está visível após um delay
                    setTimeout(() => {
                        const modal = document.getElementById('maintenance-form-overlay');
                        if (!modal || modal.style.display !== 'flex') {
                            console.log("Modal não visível após clique, forçando abertura...");
                            
                            if (window.Maintenance && typeof Maintenance.openMaintenanceForm === 'function') {
                                Maintenance.openMaintenanceForm();
                            }
                        }
                    }, 300);
                };
                
                console.log("Listener melhorado adicionado ao botão Nova Manutenção");
            } else {
                // O botão pode não existir ainda, tentar novamente após um delay
                setTimeout(addNewMaintenanceButtonListener, 1000);
            }
        };
        
        // Iniciar o listener para o botão
        addNewMaintenanceButtonListener();
        
        console.log("Fix para formulário de manutenção aplicado com sucesso!");
    }
})();
