// Arquivo form-navigation-fix.js corrigido
// Versão: 1.0.1
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

// Função principal
function initFormNavigationFix() {
    if (formFixInitialized) return;
    formFixInitialized = true;
    
    // Configurar observer para detectar quando o botão de nova manutenção é clicado
    setupNewMaintenanceButtonObserver();
    
    // Tentar aplicar correções se o modal já estiver aberto
    fixFormNavigation();
}

// Observer para o botão de nova manutenção
function setupNewMaintenanceButtonObserver() {
    const newMaintenanceBtn = document.querySelector('#new-maintenance');
    
    if (newMaintenanceBtn) {
        console.log('🔍 Botão de nova manutenção encontrado, configurando listener');
        
        newMaintenanceBtn.addEventListener('click', () => {
            console.log('🔎 Botão nova manutenção clicado, aguardando abertura do modal...');
            // Aguardar a abertura do modal
            setTimeout(fixFormNavigation, 300);
        });
    } else {
        // Tentar novamente depois se o botão não for encontrado
        console.log('⚠️ Botão de nova manutenção não encontrado, tentando novamente mais tarde');
        setTimeout(setupNewMaintenanceButtonObserver, 500);
    }
}

// Aplicar correções à navegação do formulário
function fixFormNavigation() {
    console.log('🔧 Aplicando correções à navegação do formulário');
    
    // Encontrar o modal de manutenção
    const maintenanceModal = document.querySelector('#maintenance-modal') || 
                            document.querySelector('.maintenance-form-container');
    
    if (!maintenanceModal) {
        console.log('⚠️ Modal não encontrado! Tentando novamente em breve...');
        // Tentar novamente após um curto período
        setTimeout(fixFormNavigation, 500);
        return;
    }
    
    // Corrigir botões de navegação entre etapas
    fixStepNavigationButtons(maintenanceModal);
    
    // Configurar validação de campos antes de avançar
    setupFieldValidation(maintenanceModal);
    
    // Corrigir comportamento do botão de cancelar/fechar
    fixCancelButton(maintenanceModal);
    
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
    validateStep: validateCurrentStep
};

console.log('🏁 Script de correção de navegação do formulário carregado com sucesso');
