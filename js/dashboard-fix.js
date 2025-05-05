/**
 * dashboard-fix.js
 * Script para corrigir problemas com o container do dashboard
 * Versão: 1.0.0
 * Data: 05/05/2025
 */

(function() {
    // Executar quando o DOM estiver carregado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDashboardFix);
    } else {
        initDashboardFix();
    }

    function initDashboardFix() {
        console.log('🔧 Iniciando correções do dashboard...');
        
        // Verificar se o Dashboard já está inicializado
        if (typeof window.Dashboard === 'undefined') {
            console.log('⚠️ Objeto Dashboard não encontrado. Aguardando carregamento do script...');
            // Aguardar o carregamento e inicialização do objeto Dashboard
            checkDashboardReady();
            return;
        }
        
        // Aplicar correções ao Dashboard
        applyDashboardFixes();
    }

    function checkDashboardReady() {
        // Verificar periodicamente se o Dashboard foi carregado
        const checkInterval = setInterval(function() {
            if (typeof window.Dashboard !== 'undefined') {
                clearInterval(checkInterval);
                console.log('✅ Objeto Dashboard detectado. Aplicando correções...');
                applyDashboardFixes();
            }
        }, 500);
        
        // Definir um timeout para evitar verificação infinita
        setTimeout(function() {
            clearInterval(checkInterval);
            console.log('⚠️ Timeout de espera pelo Dashboard. Tentando aplicar correções de fallback...');
            applyDashboardFallbackFixes();
        }, 10000);
    }

    function applyDashboardFixes() {
        // Monkey patch para o método checkAndCreateChartContainers do Dashboard
        if (window.Dashboard && typeof window.Dashboard.checkAndCreateChartContainers === 'function') {
            const originalCheckContainers = window.Dashboard.checkAndCreateChartContainers;
            
            window.Dashboard.checkAndCreateChartContainers = function() {
                console.log('🛠️ Método checkAndCreateChartContainers interceptado para correção');
                
                // Verificar se o container .dashboard-grid existe
                let dashboardGrid = document.querySelector('.dashboard-grid');
                
                if (!dashboardGrid) {
                    console.log('🔍 Container .dashboard-grid não encontrado. Criando container...');
                    
                    // Encontrar um lugar adequado para criar o grid
                    const dashboardContent = document.querySelector('#dashboard-content, .dashboard-content, .content-wrapper, main');
                    
                    if (dashboardContent) {
                        // Criar o container do grid
                        dashboardGrid = document.createElement('div');
                        dashboardGrid.className = 'dashboard-grid';
                        dashboardGrid.style.display = 'grid';
                        dashboardGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
                        dashboardGrid.style.gap = '20px';
                        dashboardGrid.style.padding = '20px';
                        
                        // Adicionar ao DOM
                        dashboardContent.appendChild(dashboardGrid);
                        console.log('✅ Container .dashboard-grid criado com sucesso!');
                        
                        // Criar containers de gráficos
                        createChartContainers(dashboardGrid);
                    } else {
                        console.log('⚠️ Não foi possível encontrar um container pai para o dashboard-grid');
                        console.log('Criando container no body como fallback...');
                        
                        // Criar div principal
                        const mainContent = document.createElement('div');
                        mainContent.className = 'dashboard-content';
                        mainContent.style.padding = '20px';
                        
                        // Criar o grid dentro da div principal
                        dashboardGrid = document.createElement('div');
                        dashboardGrid.className = 'dashboard-grid';
                        dashboardGrid.style.display = 'grid';
                        dashboardGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
                        dashboardGrid.style.gap = '20px';
                        
                        // Adicionar ao DOM
                        mainContent.appendChild(dashboardGrid);
                        document.body.appendChild(mainContent);
                        console.log('✅ Container .dashboard-grid criado como fallback!');
                        
                        // Criar containers de gráficos
                        createChartContainers(dashboardGrid);
                    }
                } else {
                    // O container existe, chamar o método original
                    console.log('✅ Container .dashboard-grid encontrado!');
                    return originalCheckContainers.apply(this, arguments);
                }
            };
            
            console.log('✅ Patch aplicado ao método checkAndCreateChartContainers');
            
            // Chamar a função para recarregar o dashboard se ele já estiver inicializado
            if (window.Dashboard.initialized) {
                setTimeout(function() {
                    if (typeof window.Dashboard.loadDashboardData === 'function') {
                        console.log('🔄 Recarregando dados do dashboard após as correções...');
                        window.Dashboard.loadDashboardData();
                    }
                }, 1000);
            }
        } else {
            console.log('⚠️ Método checkAndCreateChartContainers não encontrado no objeto Dashboard');
            applyDashboardFallbackFixes();
        }
    }

    function createChartContainers(dashboardGrid) {
        // Lista dos containers de gráficos que precisam ser criados
        const chartContainers = [
            { id: 'maintenance-status-chart-container', title: 'Status de Manutenção' },
            { id: 'maintenance-type-chart-container', title: 'Tipos de Manutenção' },
            { id: 'problem-categories-chart-container', title: 'Categorias de Problemas' },
            { id: 'monthly-trend-chart-container', title: 'Tendência Mensal' },
            { id: 'area-distribution-chart-container', title: 'Distribuição por Área' },
            { id: 'critical-vs-regular-chart-container', title: 'Críticas vs Regulares' },
            { id: 'verification-results-chart-container', title: 'Resultados de Verificação' },
            { id: 'maintenance-frequency-chart-container', title: 'Frequência de Manutenção' }
        ];
        
        // Criar cada container de gráfico
        chartContainers.forEach(chart => {
            if (!document.getElementById(chart.id)) {
                const chartContainer = document.createElement('div');
                chartContainer.className = 'chart-container';
                chartContainer.style.backgroundColor = '#fff';
                chartContainer.style.borderRadius = '8px';
                chartContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                chartContainer.style.padding = '15px';
                
                // Criar o título do gráfico
                const chartTitle = document.createElement('h5');
                chartTitle.className = 'chart-title';
                chartTitle.textContent = chart.title;
                chartTitle.style.marginBottom = '15px';
                chartTitle.style.borderBottom = '1px solid #eee';
                chartTitle.style.paddingBottom = '10px';
                
                // Criar o container para o canvas
                const canvasContainer = document.createElement('div');
                canvasContainer.id = chart.id;
                canvasContainer.style.height = '250px';
                
                // Criar o canvas para o gráfico
                const canvas = document.createElement('canvas');
                canvas.id = chart.id.replace('-container', '');
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                
                // Montar a estrutura
                canvasContainer.appendChild(canvas);
                chartContainer.appendChild(chartTitle);
                chartContainer.appendChild(canvasContainer);
                dashboardGrid.appendChild(chartContainer);
                
                console.log(`✅ Container de gráfico criado: ${chart.id}`);
            }
        });
        
        // Criar containers para tabelas
        const tableContainers = [
            { id: 'equipment-ranking-container', title: 'Ranking de Equipamentos' },
            { id: 'recent-maintenance-container', title: 'Manutenções Recentes' }
        ];
        
        tableContainers.forEach(tableInfo => {
            if (!document.getElementById(tableInfo.id)) {
                const tableContainer = document.createElement('div');
                tableContainer.className = 'table-container';
                tableContainer.id = tableInfo.id;
                tableContainer.style.backgroundColor = '#fff';
                tableContainer.style.borderRadius = '8px';
                tableContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                tableContainer.style.padding = '15px';
                tableContainer.style.gridColumn = '1 / -1'; // Ocupar toda a largura
                
                // Criar o título da tabela
                const tableTitle = document.createElement('h5');
                tableTitle.className = 'table-title';
                tableTitle.textContent = tableInfo.title;
                tableTitle.style.marginBottom = '15px';
                tableTitle.style.borderBottom = '1px solid #eee';
                tableTitle.style.paddingBottom = '10px';
                
                // Criar a tabela
                const table = document.createElement('table');
                table.className = 'table table-striped';
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Equipamento</th>
                            <th>Status</th>
                            <th>Data</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody id="${tableInfo.id.replace('-container', '-tbody')}">
                        <tr>
                            <td colspan="5" class="text-center">Aguardando dados...</td>
                        </tr>
                    </tbody>
                `;
                
                // Montar a estrutura
                tableContainer.appendChild(tableTitle);
                tableContainer.appendChild(table);
                dashboardGrid.appendChild(tableContainer);
                
                console.log(`✅ Container de tabela criado: ${tableInfo.id}`);
            }
        });
    }

    function applyDashboardFallbackFixes() {
        console.log('🔧 Aplicando correções de fallback para o dashboard...');
        
        // Verificar se o elemento .dashboard-grid existe
        let dashboardGrid = document.querySelector('.dashboard-grid');
        
        if (!dashboardGrid) {
            console.log('🔍 Container .dashboard-grid não encontrado. Criando container (fallback)...');
            
            // Encontrar um lugar adequado para criar o grid
            const dashboardContent = document.querySelector('#dashboard-content, .dashboard-content, .content-wrapper, main, #app, .app-container');
            
            if (dashboardContent) {
                // Criar o container do grid
                dashboardGrid = document.createElement('div');
                dashboardGrid.className = 'dashboard-grid';
                dashboardGrid.style.display = 'grid';
                dashboardGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
                dashboardGrid.style.gap = '20px';
                dashboardGrid.style.padding = '20px';
                
                // Adicionar ao DOM
                dashboardContent.appendChild(dashboardGrid);
                console.log('✅ Container .dashboard-grid criado com sucesso (fallback)!');
                
                // Criar containers de gráficos
                createChartContainers(dashboardGrid);
            } else {
                console.log('⚠️ Não foi possível encontrar um container pai para o dashboard-grid');
                console.log('Criando container no body como último recurso...');
                
                // Criar div principal
                const mainContent = document.createElement('div');
                mainContent.className = 'dashboard-content';
                mainContent.style.padding = '20px';
                
                // Criar o grid dentro da div principal
                dashboardGrid = document.createElement('div');
                dashboardGrid.className = 'dashboard-grid';
                dashboardGrid.style.display = 'grid';
                dashboardGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
                dashboardGrid.style.gap = '20px';
                
                // Adicionar ao DOM
                mainContent.appendChild(dashboardGrid);
                document.body.appendChild(mainContent);
                console.log('✅ Container .dashboard-grid criado no body como último recurso!');
                
                // Criar containers de gráficos
                createChartContainers(dashboardGrid);
            }
            
            // Tentar acionar o reload do dashboard
            setTimeout(function() {
                if (window.Dashboard && typeof window.Dashboard.loadDashboardData === 'function') {
                    console.log('🔄 Recarregando dados do dashboard após correções de fallback...');
                    window.Dashboard.loadDashboardData();
                }
            }, 2000);
        }
    }

    console.log('✅ Script de correção do dashboard carregado com sucesso');
})();
