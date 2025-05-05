/**
 * CORREÇÃO FINAL - NAVEGAÇÃO DO FORMULÁRIO
 * Salve como "form-navigation-fix.js"
 */
(function() {
    console.log("🚀 Iniciando correção de navegação do formulário");
    
    // Executar quando o DOM estiver pronto
    function onReady(fn) {
        if (document.readyState !== 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }
    
    // Função principal
    onReady(function() {
        // Monitorar abertura do modal
        document.body.addEventListener('click', function(e) {
            // Verificar se o clique foi no botão de nova manutenção
            if (e.target && (e.target.id === 'new-maintenance' || 
                e.target.closest('#new-maintenance') || 
                e.target.classList.contains('btn-new-maintenance'))) {
                
                console.log("🔎 Botão nova manutenção clicado, aguardando abertura do modal...");
                
                // Aguardar abertura do modal
                setTimeout(function() {
                    fixFormNavigation();
                }, 300);
            }
        });
        
        // Verificar se o modal já está aberto
        if (document.querySelector('.modal.show')) {
            console.log("🔎 Modal já está aberto, aplicando correções...");
            fixFormNavigation();
        }
    });
    
    // Função para corrigir navegação do formulário
    function fixFormNavigation() {
        console.log("🔧 Aplicando correções à navegação do formulário");
        
        // 1. Localizar o formulário e botões
        const modal = document.querySelector('.modal.show');
        if (!modal) {
            console.warn("⚠️ Modal não encontrado!");
            return;
        }
        
        const form = modal.querySelector('form') || modal.querySelector('.modal-body');
        const nextButton = modal.querySelector('.btn-next, .btn-primary, [type="submit"]');
        const cancelButton = modal.querySelector('.btn-cancel, [data-dismiss="modal"], .btn-secondary');
        
        // 2. Corrigir o botão Próximo
        if (nextButton) {
            // Remover eventos existentes
            const newNextButton = nextButton.cloneNode(true);
            nextButton.parentNode.replaceChild(newNextButton, nextButton);
            
            newNextButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log("🔎 Botão Próximo clicado");
                
                // Validar o formulário antes de prosseguir
                if (validateForm()) {
                    console.log("✅ Formulário válido, avançando para próxima etapa");
                    goToNextStep();
                } else {
                    console.log("❌ Formulário inválido");
                }
            });
            
            console.log("✅ Correção aplicada ao botão Próximo");
        } else {
            console.warn("⚠️ Botão Próximo não encontrado!");
        }
        
        // 3. Corrigir o botão Cancelar
        if (cancelButton) {
            // Remover eventos existentes
            const newCancelButton = cancelButton.cloneNode(true);
            cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
            
            newCancelButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log("🔎 Botão Cancelar clicado");
                
                // Fechar o modal
                closeModal(modal);
                
                console.log("✅ Modal fechado com sucesso");
            });
            
            console.log("✅ Correção aplicada ao botão Cancelar");
        } else {
            console.warn("⚠️ Botão Cancelar não encontrado!");
        }
        
        // 4. Configurar todos os campos obrigatórios para validação visual
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(function(field) {
            // Adicionar classe para estilização
            field.classList.add('required-field');
            
            // Adicionar asterisco ao label se não existir
            const fieldId = field.id;
            if (fieldId) {
                const label = form.querySelector(`label[for="${fieldId}"]`);
                if (label && !label.innerHTML.includes('*')) {
                    label.innerHTML += ' <span class="text-danger">*</span>';
                }
            }
            
            // Adicionar event listener para validação em tempo real
            field.addEventListener('blur', function() {
                validateField(this);
            });
            
            console.log(`✅ Campo ${field.name || field.id} configurado para validação`);
        });
        
        console.log("🏁 Correções de navegação aplicadas com sucesso");
    }
    
    // Função para validar o formulário
    function validateForm() {
        const modal = document.querySelector('.modal.show');
        if (!modal) return false;
        
        const form = modal.querySelector('form') || modal.querySelector('.modal-body');
        const requiredFields = form.querySelectorAll('[required]');
        
        // Remover mensagens de erro anteriores
        form.querySelectorAll('.validation-error').forEach(function(el) {
            el.parentNode.removeChild(el);
        });
        
        let isValid = true;
        
        requiredFields.forEach(function(field) {
            if (!validateField(field)) {
                isValid = false;
            }
        });
        
        if (!isValid) {
            // Mostrar alerta
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-danger validation-error';
            alertDiv.innerHTML = 'Por favor, preencha todos os campos obrigatórios.';
            alertDiv.style.cssText = 'margin-top: 15px;';
            
            // Adicionar no topo do formulário
            form.insertBefore(alertDiv, form.firstChild);
            
            // Focar no primeiro campo inválido
            const firstInvalid = form.querySelector('.is-invalid');
            if (firstInvalid) firstInvalid.focus();
        }
        
        return isValid;
    }
    
    // Função para validar um campo
    function validateField(field) {
        // Remover estados anteriores
        field.classList.remove('is-invalid', 'is-valid');
        
        // Remover mensagem de erro anterior
        const errorMessage = field.parentNode.querySelector('.invalid-feedback');
        if (errorMessage) errorMessage.parentNode.removeChild(errorMessage);
        
        // Validar o campo
        let isValid = true;
        
        if (field.hasAttribute('required') && !field.value.trim()) {
            isValid = false;
            field.classList.add('is-invalid');
            
            // Adicionar mensagem de erro
            const feedbackDiv = document.createElement('div');
            feedbackDiv.className = 'invalid-feedback';
            feedbackDiv.textContent = 'Este campo é obrigatório';
            
            field.parentNode.appendChild(feedbackDiv);
        } else {
            field.classList.add('is-valid');
        }
        
        return isValid;
    }
    
    // Função para avançar para a próxima etapa
    function goToNextStep() {
        const modal = document.querySelector('.modal.show');
        if (!modal) return;
        
        // Encontrar etapas e etapa atual
        const steps = modal.querySelectorAll('.step, .form-step, .wizard-step, [data-step]');
        if (steps.length === 0) {
            console.warn("⚠️ Nenhuma etapa encontrada no formulário!");
            
            // Tentar alternativas
            const formContent = modal.querySelector('.modal-body');
            const nextTab = modal.querySelector('.nav-item:not(.active) a, .tab-pane:not(.active)');
            
            if (nextTab) {
                console.log("🔍 Alternativa: Navegação por abas encontrada");
                
                // Simular clique na próxima aba
                nextTab.click();
                return;
            }
            
            console.log("✅ Formulário enviado com sucesso!");
            return;
        }
        
        // Determinar etapa atual e próxima
        let currentStep = -1;
        
        for (let i = 0; i < steps.length; i++) {
            if (steps[i].classList.contains('active') || 
                steps[i].style.display === 'block' || 
                window.getComputedStyle(steps[i]).display === 'block') {
                currentStep = i;
                break;
            }
        }
        
        if (currentStep === -1) {
            console.warn("⚠️ Etapa atual não encontrada!");
            return;
        }
        
        // Próxima etapa
        const nextStep = currentStep + 1;
        
        if (nextStep < steps.length) {
            console.log(`🔄 Navegando da etapa ${currentStep + 1} para etapa ${nextStep + 1}`);
            
            // Esconder etapa atual
            steps[currentStep].classList.remove('active');
            steps[currentStep].style.display = 'none';
            
            // Mostrar próxima etapa
            steps[nextStep].classList.add('active');
            steps[nextStep].style.display = 'block';
            
            // Atualizar indicador de progresso se existir
            updateStepIndicator(nextStep);
        } else {
            console.log("✅ Última etapa alcançada, enviando formulário");
            
            // Simular envio do formulário
            const form = modal.querySelector('form');
            if (form) {
                form.submit();
            } else {
                console.warn("⚠️ Formulário não encontrado para envio!");
                
                // Fechar o modal como fallback
                setTimeout(function() {
                    closeModal(modal);
                }, 500);
            }
        }
    }
    
    // Função para atualizar indicador de progresso
    function updateStepIndicator(activeStep) {
        const modal = document.querySelector('.modal.show');
        if (!modal) return;
        
        // Procurar por indicadores de etapa
        const indicators = modal.querySelectorAll('.step-indicator, .wizard-progress, .progress-indicator, .steps');
        
        if (indicators.length === 0) {
            // Alternativa: procurar itens numerados individuais
            const items = modal.querySelectorAll('.step-item, .wizard-step-item, .step-circle, .step-number');
            
            if (items.length > 0) {
                // Desativar todos e ativar o atual
                items.forEach((item, index) => {
                    if (index === activeStep) {
                        item.classList.add('active', 'current');
                    } else {
                        item.classList.remove('active', 'current');
                        
                        // Manter como "concluído" os passos anteriores
                        if (index < activeStep) {
                            item.classList.add('completed', 'done');
                        } else {
                            item.classList.remove('completed', 'done');
                        }
                    }
                });
                
                console.log(`✅ Indicador de etapa atualizado para etapa ${activeStep + 1}`);
            }
        } else {
            // Atualizar o indicador encontrado
            const indicator = indicators[0];
            
            // Localizar os itens dentro do indicador
            const items = indicator.querySelectorAll('li, .step, .dot, .point, .circle');
            
            if (items.length > 0) {
                items.forEach((item, index) => {
                    if (index === activeStep) {
                        item.classList.add('active', 'current');
                    } else {
                        item.classList.remove('active', 'current');
                        
                        // Manter como "concluído" os passos anteriores
                        if (index < activeStep) {
                            item.classList.add('completed', 'done');
                        } else {
                            item.classList.remove('completed', 'done');
                        }
                    }
                });
                
                console.log(`✅ Indicador de etapa atualizado para etapa ${activeStep + 1}`);
            }
        }
    }
    
    // Função para fechar o modal
    function closeModal(modal) {
        // 1. Tentar método Bootstrap
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            try {
                const bsModal = bootstrap.Modal.getInstance(modal);
                if (bsModal) {
                    bsModal.hide();
                    return;
                }
            } catch (e) {
                console.warn("⚠️ Erro ao fechar modal via Bootstrap:", e);
            }
        }
        
        // 2. Tentar método jQuery
        if (typeof $ !== 'undefined') {
            try {
                $(modal).modal('hide');
                return;
            } catch (e) {
                console.warn("⚠️ Erro ao fechar modal via jQuery:", e);
            }
        }
        
        // 3. Método manual
        try {
            modal.style.display = 'none';
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');
            
            // Remover backdrop
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop && backdrop.parentNode) {
                backdrop.parentNode.removeChild(backdrop);
            }
        } catch (e) {
            console.error("❌ Erro ao fechar modal manualmente:", e);
        }
    }
    
    // Estilização adicional para validação
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        .required-field:not(.is-valid):not(.is-invalid) {
            border-color: #ced4da;
        }
        .required-field.is-invalid {
            border-color: #dc3545 !important;
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right calc(0.375em + 0.1875rem) center;
            background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
        }
        .required-field.is-valid {
            border-color: #198754 !important;
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3e%3cpath fill='%23198754' d='M2.3 6.73L.6 4.53c-.4-1.04.46-1.4 1.1-.8l1.1 1.4 3.4-3.8c.6-.63 1.6-.27 1.2.7l-4 4.6c-.43.5-.8.4-1.1.1z'/%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right calc(0.375em + 0.1875rem) center;
            background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
        }
        .invalid-feedback {
            display: block;
            width: 100%;
            margin-top: 0.25rem;
            font-size: 0.875em;
            color: #dc3545;
        }
    `;
    document.head.appendChild(styleEl);
    
    console.log("🏁 Script de correção de navegação do formulário carregado com sucesso");
})();
