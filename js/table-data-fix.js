// Arquivo table-data-fix.js corrigido
// Versão: 1.0.1
// Data: 05/05/2025

console.log('📊 Iniciando correção de dados nas tabelas');

// Função para verificar se um elemento contém um texto específico
function elementContainsText(element, text) {
    return element.textContent.includes(text);
}

// Substitui o seletor :contains inválido com uma função customizada
function querySelectorContains(selector, containsText) {
    const baseElements = document.querySelectorAll(selector);
    return Array.from(baseElements).filter(el => elementContainsText(el, containsText));
}

// Observer para detectar mudanças na tabela
const tableObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            console.log('🔍 Mutação detectada na tabela, aplicando correções...');
            try {
                fixTableData();
            } catch (error) {
                console.error('❌ Erro ao aplicar correções à tabela:', error);
            }
        }
    });
});

// Configuração do observer
function setupTableObserver() {
    const tableContainers = document.querySelectorAll('.table-container, .table-responsive');
    
    if (tableContainers.length > 0) {
        tableContainers.forEach(container => {
            tableObserver.observe(container, { childList: true, subtree: true });
        });
        console.log('👁️ Observer de tabela configurado para', tableContainers.length, 'containers');
    } else {
        // Se não encontrar no carregamento inicial, tentar novamente após um curto atraso
        setTimeout(setupTableObserver, 500);
    }
}

// Inicializar observer após o carregamento do DOM
document.addEventListener('DOMContentLoaded', setupTableObserver);

// Se o DOM já estiver carregado, inicializar imediatamente
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    setupTableObserver();
}

// Função principal para corrigir dados das tabelas
function fixTableData() {
    console.log('🔧 Aplicando correções aos dados das tabelas');
    
    try {
        // Corrigir células "Não atribuído"
        const naoAtribuidoCells = querySelectorContains('td', 'Não atribuído');
        naoAtribuidoCells.forEach(cell => {
            cell.classList.add('status-warning');
            cell.title = 'Este item precisa ser atribuído';
        });
        
        // Corrigir células "Não especificada"
        const naoEspecificadaCells = querySelectorContains('td', 'Não especificada');
        naoEspecificadaCells.forEach(cell => {
            cell.classList.add('status-info');
            cell.title = 'Especificação pendente';
        });
        
        // Destacar status críticos
        const criticoCells = querySelectorContains('td', 'Crítico');
        criticoCells.forEach(cell => {
            cell.classList.add('status-danger');
            cell.style.fontWeight = 'bold';
        });
        
        // Destacar status de sucesso
        const concluido = ['Concluído', 'Aprovado', 'Finalizado'];
        concluido.forEach(texto => {
            const cells = querySelectorContains('td', texto);
            cells.forEach(cell => {
                cell.classList.add('status-success');
            });
        });
        
        // Destacar status pendentes
        const pendente = ['Pendente', 'Em análise', 'Em andamento'];
        pendente.forEach(texto => {
            const cells = querySelectorContains('td', texto);
            cells.forEach(cell => {
                cell.classList.add('status-pending');
            });
        });
        
        console.log('✅ Correções aplicadas às tabelas com sucesso');
    } catch (error) {
        console.error('❌ Erro ao aplicar correções às tabelas:', error);
    }
}

// Exportar funções para uso global
window.TableDataFix = {
    applyFixes: fixTableData,
    querySelectorContains: querySelectorContains
};

console.log('✅ Módulo de correção de tabelas carregado e pronto');
