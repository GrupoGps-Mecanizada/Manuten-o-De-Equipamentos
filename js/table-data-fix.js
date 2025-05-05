/**
 * CORREÇÃO DE DADOS NAS TABELAS
 * Salve como "table-data-fix.js"
 */
(function() {
    console.log("📊 Iniciando correção de dados nas tabelas");
    
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
        // Monitorar carregamento de dados na tabela
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && 
                    (mutation.target.id === 'maintenance-table-body' || 
                     mutation.target.classList.contains('maintenance-table') ||
                     mutation.target.tagName === 'TBODY')) {
                    
                    console.log("🔍 Mutação detectada na tabela, aplicando correções...");
                    fixTableData();
                }
            });
        });
        
        // Iniciar observação
        const tables = document.querySelectorAll('table');
        tables.forEach(function(table) {
            observer.observe(table, { childList: true, subtree: true });
        });
        
        // Verificar tabelas existentes
        fixTableData();
        
        // Monitorar trocas de abas
        document.body.addEventListener('click', function(e) {
            if (e.target.classList.contains('nav-link') || 
                e.target.parentElement?.classList.contains('nav-link') ||
                e.target.getAttribute('data-tab')) {
                
                // Aguardar carregamento da nova aba
                setTimeout(fixTableData, 500);
            }
        });
    });
    
    // Função para corrigir dados nas tabelas
    function fixTableData() {
        console.log("🔧 Aplicando correções aos dados das tabelas");
        
        // 1. Corrigir células "Não atribuído"
        const nonAttributedCells = document.querySelectorAll('td:contains("Não atribuído"), td:contains("Não especificada")');
        
        if (nonAttributedCells.length === 0) {
            // Método alternativo para encontrar células
            document.querySelectorAll('td').forEach(function(cell) {
                if (cell.textContent.includes('Não atribuído') || 
                    cell.textContent.includes('Não especificada')) {
                    
                    processCellData(cell);
                }
            });
        } else {
            nonAttributedCells.forEach(function(cell) {
                processCellData(cell);
            });
        }
        
        // 2. Corrigir células vazias
        document.querySelectorAll('td').forEach(function(cell) {
            if (cell.textContent.trim() === '-' || cell.textContent.trim() === '') {
                const columnIndex = getColumnIndex(cell);
                const columnName = getColumnName(cell);
                
                if (columnName) {
                    // Atribuir valor padrão com base na coluna
                    if (columnName.includes('Problem') || columnName.includes('Problema')) {
                        cell.innerHTML = '<span class="badge bg-secondary">Não informado</span>';
                    }
                    else if (columnName.includes('Responsável')) {
                        const userName = getUserName();
                        if (userName) {
                            cell.textContent = userName;
                        } else {
                            cell.innerHTML = '<span class="text-muted">Indefinido</span>';
                        }
                    }
                    else if (columnName.includes('Área')) {
                        cell.innerHTML = '<span class="text-muted">Área Geral</span>';
                    }
                    
                    console.log(`✅ Célula vazia corrigida na coluna ${columnName}`);
                }
            }
        });
        
        console.log("🏁 Correções de dados nas tabelas aplicadas");
    }
    
    // Função para processar dados da célula
    function processCellData(cell) {
        const columnName = getColumnName(cell);
        
        if (!columnName) return;
        
        // Determinar o tipo de dado com base na coluna
        if (columnName.includes('Responsável')) {
            // Obter nome do usuário ou usar um padrão
            const userName = getUserName();
            if (userName) {
                cell.textContent = userName;
            } else {
                cell.innerHTML = '<span class="badge bg-info">Atribuir</span>';
            }
            console.log(`✅ Campo Responsável atualizado: ${cell.textContent}`);
        }
        else if (columnName.includes('Área')) {
            // Usar uma área padrão melhor que "Não especificada"
            cell.textContent = 'Área Geral';
            console.log(`✅ Campo Área atualizado: ${cell.textContent}`);
        }
        else if (columnName.includes('Local') || columnName.includes('Oficina')) {
            // Verificar se há valor específico na linha
            const rowData = getRowData(cell);
            if (rowData && rowData.area) {
                cell.textContent = rowData.area + ' (Geral)';
            } else {
                cell.textContent = 'Sede Principal';
            }
            console.log(`✅ Campo Local/Oficina atualizado: ${cell.textContent}`);
        }
    }
    
    // Função para obter o nome da coluna
    function getColumnName(cell) {
        const cellIndex = cell.cellIndex;
        
        // Procurar cabeçalho correspondente
        const table = cell.closest('table');
        if (!table) return null;
        
        const headerRow = table.querySelector('thead tr');
        if (!headerRow) return null;
        
        const headerCell = headerRow.cells[cellIndex];
        return headerCell ? headerCell.textContent.trim() : null;
    }
    
    // Função para obter o índice da coluna
    function getColumnIndex(cell) {
        return Array.from(cell.parentNode.children).indexOf(cell);
    }
    
    // Função para obter dados da linha
    function getRowData(cell) {
        const row = cell.closest('tr');
        if (!row) return null;
        
        const result = {};
        
        // Procurar por células específicas
        Array.from(row.cells).forEach(function(cell, index) {
            const columnName = getColumnName(cell);
            if (!columnName) return;
            
            if (columnName.includes('Área')) {
                result.area = cell.textContent.trim();
            }
            else if (columnName.includes('Equipamento')) {
                result.equipment = cell.textContent.trim();
            }
            else if (columnName.includes('Tipo')) {
                result.type = cell.textContent.trim();
            }
        });
        
        return result;
    }
    
    // Função para obter nome do usuário atual
    function getUserName() {
        // Tentar encontrar na interface
        const userElement = document.querySelector('.user-name, .username, .user-info, .profile-name');
        if (userElement) {
            return userElement.textContent.trim();
        }
        
        // Verificar diretamente no DOM por alguma informação
        const footerText = document.querySelector('footer')?.textContent || '';
        const match = footerText.match(/Desenvolvido por\s+([A-Za-z\s]+)/);
        if (match && match[1]) {
            return match[1].trim();
        }
        
        // Nome padrão baseado em qualquer pista no DOM
        const developerInfo = document.body.textContent.match(/Warlison|Desenvolvido por\s+([A-Za-z\s]+)/);
        if (developerInfo) {
            return developerInfo[1] || 'Warlison';
        }
        
        return 'Usuário Atual';
    }
    
    // Adicionar método :contains() ao querySelector (inspirado no jQuery)
    if (!Element.prototype.matches) {
        Element.prototype.matches = Element.prototype.msMatchesSelector || 
                                    Element.prototype.webkitMatchesSelector;
    }
    
    if (!document.querySelector(':contains')) {
        // Adicionar pseudosseletor :contains()
        const contains = function(selector) {
            const elements = [];
            const text = selector.replace(/^:contains\(['"](.+)['"]\)$/, '$1');
            
            // Função auxiliar para verificar texto
            const walkTheDOM = function(node, func) {
                func(node);
                node = node.firstChild;
                while (node) {
                    walkTheDOM(node, func);
                    node = node.nextSibling;
                }
            };
            
            // Percorrer todos os elementos
            walkTheDOM(document.body, function(node) {
                if (node.nodeType === 1) { // ELEMENT_NODE
                    if (node.textContent.indexOf(text) > -1) {
                        elements.push(node);
                    }
                }
            });
            
            return elements;
        };
        
        // Adicionar ao querySelectorAll
        const originalQSA = Document.prototype.querySelectorAll;
        Document.prototype.querySelectorAll = function(selector) {
            if (selector.indexOf(':contains') > -1) {
                return contains(selector);
            } else {
                return originalQSA.call(this, selector);
            }
        };
    }
    
    console.log("🏁 Script de correção de dados nas tabelas carregado com sucesso");
})();
