// Arquivo form-navigation-fix.js melhorado
// Versão: 1.0.2
// Data: 05/05/2025

console.log('🚀 Iniciando correção de navegação do formulário');

// Verificar se o documento já está carregado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFormNavigationFix);
} else {
    initFormNavigationFix();
}

// Variável de controle para evitar múltiplas inicializações
let formFixInitialized = false;

// Contador de tentativas para evitar loop infinito
let modalSearchAttempts = 0;
const MAX_MODAL_SEARCH_ATTEMPTS = 5;

// Função principal
function initFormNavigationFix() {
    if (formFixInitialized) return;
    formFixInitialized = true;
    
    // Configurar observer para detectar quando o botão de nova manutenção é clicado
    setupNewMaintenanceButtonObserver();
    
    // Configurar um MutationObserver para detectar quando o modal é adicionado ao DOM
    setupModalObserver();
}

// Observer para o botão de nova manutenção
function setupNewMaintenanceButtonObserver() {
    const newMaintenanceBtn = document.querySelector('#new-maintenance');
    
    if (newMaintenanceBtn) {
        console.log('🔍 Botão de nova manutenção encontrado, configurando listener');
        
        newMaintenanceBtn.addEventListener('click', () => {
            console.log('🔎 Botão nova manutenção clicado, aguardando abertura do modal...');
            // Resetar contador de tentativas e tentar aplicar correções
            modalSearchAttempts = 0;
            setTimeout(findAndFixModal, 300);
        });
    } else {
        // Tentar novamente depois se o botão não for encontrado
        console.log('⚠️ Botão de nova manutenção não encontrado, tentando novamente mais tarde');
        setTimeout(setupNewMaintenanceButtonObserver, 1000);
    }
}

// Configurar MutationObserver para detectar quando o modal é adicionado ao DOM
function setupModalObserver() {
    const bodyObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    const node = mutation.addedNodes[i];
                    if (node.nodeType === 1) { // ELEMENT_NODE
                        if (
                            node.classList && 
                            (node.classList.contains('modal') || 
                             node.classList.contains('maintenance-form-container'))
                        ) {
                            console.log('🔍 Modal detectado via MutationObserver', node);
                            fixFormNavigation(node);
                            return;
                        }
                        
                        // Verifique também dentro do nó adicionado
                        const modalInside = node.querySelector('.modal, .maintenance-form-container, #maintenance-modal');
                        if (modalInside) {
                            console.log('🔍 Modal encontrado dentro de um nó adicionado', modalInside);
                            fixFormNavigation(modalInside);
                            return;
                        }
                    }
                }
            }
        });
    });
    
    // Observar todo o body para capturar qualquer modal que for adicionado
    bodyObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('👁️ Observer configurado para detectar modais adicionados ao DOM');
}

// Função para encontrar e corrigir o modal, com limitador de tentativas
function findAndFixModal() {
    if (modalSearchAttempts >= MAX_MODAL_SEARCH_ATTEMPTS) {
        console.log('⚠️ Número máximo de tentativas excedido. Interrompendo busca do modal.');
        return;
    }
    
    modalSearchAttempts++;
    console.log(`🔍 Tentativa ${modalSearchAttempts}/${MAX_MODAL_SEARCH_ATTEMPTS} de encontrar o modal...`);
    
    // Procurar pelos possíveis IDs/classes do modal
    const modal = document.querySelector('#maintenance-modal, .maintenance-form-container, .modal.show, .modal.fade.show');
    
    if (modal) {
        console.log('✅ Modal encontrado!', modal);
        fixFormNavigation(modal);
    } else {
        console.log('⚠️ Modal não encontrado! Tentando novamente em breve...');
        setTimeout(findAndFixModal, 1000);
    }
}

// Aplicar correções à navegação do formulário
function fixFormNavigation(modal) {
    if (!modal) {
        console.log('❌ Modal não fornecido para fixFormNavigation()');
        return;
    }
    
    console.log('🔧 Aplicando correções à navegação do formulário para', modal);
    
    // Verificar se o modal já foi processado
    if (modal.dataset.navigationFixed === 'true') {
        console.log('ℹ️ Navegação do formulário já configurada para este modal');
        return;
    }
    
    // Marcar o modal como processado
    modal.dataset.navigationFixed = 'true';
    
    // Corrigir botões de navegação entre etapas
    fixStepNavigationButtons(modal);
    
    // Configurar validação de campos antes de avançar
    setupFieldValidation(modal);
    
    // Corrigir comportamento do botão de cancelar/fechar
    fixCancelButton(modal);
    
    console.log('✅ Correções de navegação do formulário aplicadas com sucesso');
}

// Corrigir botões de navegação entre etapas
function fixStepNavigationButtons(modal) {
    const nextButtons = modal.querySelectorAll('.btn-next-step, .next-step');
    const prevButtons = modal.querySelectorAll('.btn-prev-step, .prev-step');
    const steps = modal.querySelectorAll('.form-step');
    
    if (nextButtons.length === 0 || steps.length <= 1) {
        console.log('ℹ️ Formulário não tem múltiplas etapas ou botões de navegação');
        return;
    }
    
    console.log(`📊 Formulário com ${steps.length} etapas e ${nextButtons.length} botões 'próximo'`);
    
    // Remover listeners existentes para evitar duplicação
    nextButtons.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        // Adicionar novo listener
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Encontrar etapa atual e próxima
            const currentStep = modal.querySelector('.form-step.active');
            const currentIndex = Array.from(steps).indexOf(currentStep);
            
            if (currentIndex < steps.length - 1) {
                // Validar campos da etapa atual antes de avançar
                if (validateCurrentStep(currentStep)) {
                    // Esconder etapa atual
                    currentStep.classList.remove('active');
                    currentStep.style.display = 'none';
                    
                    // Mostrar próxima etapa
                    const nextStep = steps[currentIndex + 1];
                    nextStep.classList.add('active');
                    nextStep.style.display = 'block';
                    
                    console.log(`✅ Navegação: avançou para etapa ${currentIndex + 2}`);
                }
            }
        });
    });
    
    // Configurar botões para voltar
    prevButtons.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        // Adicionar novo listener
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Encontrar etapa atual e anterior
            const currentStep = modal.querySelector('.form-step.active');
            const currentIndex = Array.from(steps).indexOf(currentStep);
            
            if (currentIndex > 0) {
                // Esconder etapa atual
                currentStep.classList.remove('active');
                currentStep.style.display = 'none';
                
                // Mostrar etapa anterior
                const prevStep = steps[currentIndex - 1];
                prevStep.classList.add('active');
                prevStep.style.display = 'block';
                
                console.log(`✅ Navegação: voltou para etapa ${currentIndex}`);
            }
        });
    });
    
    console.log(`✅ Botões de navegação corrigidos (${nextButtons.length} próximo, ${prevButtons.length} anterior)`);
}

// Validar campos da etapa atual
function validateCurrentStep(stepElement) {
    const requiredFields = stepElement.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        // Remover mensagens de erro existentes
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Verificar se o campo está preenchido
        if (!field.value.trim()) {
            isValid = false;
            
            // Adicionar classe de erro
            field.classList.add('is-invalid');
            
            // Adicionar mensagem de erro
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message text-danger';
            errorMessage.textContent = 'Este campo é obrigatório';
            field.parentNode.appendChild(errorMessage);
            
            // Adicionar listener para remover o erro quando o campo for preenchido
            field.addEventListener('input', function() {
                if (this.value.trim()) {
                    this.classList.remove('is-invalid');
                    const errorMsg = this.parentNode.querySelector('.error-message');
                    if (errorMsg) {
                        errorMsg.remove();
                    }
                }
            });
        } else {
            field.classList.remove('is-invalid');
        }
    });
    
    return isValid;
}

// Configurar validação de campos
function setupFieldValidation(modal) {
    const allInputs = modal.querySelectorAll('input, select, textarea');
    
    allInputs.forEach(input => {
        // Verificar se já tem listener (usando dataset)
        if (!input.dataset.validationSet) {
            input.dataset.validationSet = 'true';
            
            // Adicionar validação no evento blur
            input.addEventListener('blur', function() {
                if (this.hasAttribute('required') && !this.value.trim()) {
                    this.classList.add('is-invalid');
                } else {
                    this.classList.remove('is-invalid');
                }
            });
            
            // Limpar formatação de erro quando o usuário digitar
            input.addEventListener('input', function() {
                if (this.value.trim()) {
                    this.classList.remove('is-invalid');
                }
            });
        }
    });
    
    console.log(`✅ Validação configurada para ${allInputs.length} campos`);
}

// Corrigir comportamento do botão de cancelar/fechar
function fixCancelButton(modal) {
    const cancelButtons = modal.querySelectorAll('.btn-cancel, .btn-close, [data-dismiss="modal"]');
    
    cancelButtons.forEach(btn => {
        // Remover listeners existentes
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        // Adicionar novo listener
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Verificar se há dados não salvos
            const inputs = modal.querySelectorAll('input, select, textarea');
            let hasData = false;
            
            inputs.forEach(input => {
                if (input.type === 'text' || input.type === 'textarea') {
                    if (input.value.trim() !== '') hasData = true;
                } else if (input.type === 'select-one') {
                    if (input.selectedIndex > 0) hasData = true;
                } else if (input.type === 'checkbox' || input.type === 'radio') {
                    if (input.checked) hasData = true;
                }
            });
            
            // Confirmar fechamento se houver dados
            if (hasData) {
                if (confirm('Há dados não salvos. Deseja realmente cancelar?')) {
                    resetAndCloseModal(modal);
                }
            } else {
                resetAndCloseModal(modal);
            }
        });
    });
    
    console.log(`✅ Botões de cancelar/fechar corrigidos (${cancelButtons.length})`);
}

// Resetar e fechar o modal
function resetAndCloseModal(modal) {
    // Resetar formulário
    const forms = modal.querySelectorAll('form');
    forms.forEach(form => form.reset());
    
    // Voltar para a primeira etapa
    const steps = modal.querySelectorAll('.form-step');
    steps.forEach((step, index) => {
        if (index === 0) {
            step.classList.add('active');
            step.style.display = 'block';
        } else {
            step.classList.remove('active');
            step.style.display = 'none';
        }
    });
    
    // Tentar fechar o modal usando diversas abordagens
    // Abordagem Bootstrap
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) bsModal.hide();
    }
    
    // Abordagem jQuery
    if (typeof $ !== 'undefined') {
        try {
            $(modal).modal('hide');
        } catch (e) {
            console.log('Erro ao fechar modal via jQuery:', e);
        }
    }
    
    // Abordagem fallback - adicionar classe hidden/esconder manualmente
    modal.classList.add('d-none');
    modal.style.display = 'none';
    
    // Remover backdrop se existir
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) backdrop.remove();
    
    // Remover classe modal-open do body
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    console.log('✅ Modal fechado e formulário resetado');
}

// Exportar funções úteis
window.FormNavigationFix = {
    fixNavigation: fixFormNavigation,
    validateStep: validateCurrentStep,
    findModal: findAndFixModal
};

console.log('🏁 Script de correção de navegação do formulário carregado com sucesso');
