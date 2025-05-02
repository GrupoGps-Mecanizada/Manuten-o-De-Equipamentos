**
 * Sistema de Dupla Checagem de Manutenção
 * Módulo: API para comunicação com o backend
 */

const API = (() => {
  // URL base da API (Web App do Google Apps Script publicado)
  // Substitua pela URL correta do seu Web App publicado
  const API_URL = 'https://script.google.com/macros/s/AKfycbxlQDfskwbp4S9rrcMrNb823irz7O3pU-kfMeauzREV-7jy0JDIgXCxhxQBlQ4aM3MQ2w/exec';

  // ================================================
  // == Início da Função callAPI Atualizada ==
  // ================================================
  /**
   * Função modificada para aumentar o timeout e melhorar tratamento de erros
   * Ajustar em api.js
   */
  async function callAPI(action, data = {}, timeout = 60000) { // Aumentado para 60 segundos
    let scriptElement = null; // Definir aqui para acesso no escopo
    try {
      // Gerar um nome de callback único para JSONP
      const callbackName = 'jsonp_callback_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);

      // Criar uma Promise que encapsula a requisição JSONP
      return new Promise((resolve, reject) => {
        // Configurar timeout
        const timeoutId = setTimeout(() => {
          // Limpar o callback global ao atingir timeout
          try {
            delete window[callbackName];
          } catch (e) {
            window[callbackName] = undefined; // Fallback para ambientes onde delete pode falhar
          }

          // Remover script após timeout
          if (scriptElement && scriptElement.parentNode) {
            scriptElement.parentNode.removeChild(scriptElement);
          }

          // Mensagem de erro específica para cada ação
          let errorMsg = `A requisição para ${action} excedeu o limite de tempo (${timeout/1000}s)`;

          // TRATAMENTO ESPECIAL PARA getVerificationList EM TIMEOUT
          if (action === 'getVerificationList') {
            console.warn(errorMsg + '. Retornando lista de verificações vazia.');
            // Para verificações, podemos tentar recuperar com dados vazios
            resolve({
              success: true, // Indica sucesso na operação geral, mas com dados limitados
              message: "Dados limitados devido a timeout",
              verifications: [] // Alterado de maintenances para verifications
            });
          } else {
            // Para outras ações, rejeitar normalmente
            reject(new Error(errorMsg));
          }
        }, timeout);

        // Definir callback global que será chamado pelo script
        window[callbackName] = function(response) {
          // Limpar timeout ao receber resposta
          clearTimeout(timeoutId);

          // Remover script após execução
          if (scriptElement && scriptElement.parentNode) {
            scriptElement.parentNode.removeChild(scriptElement);
          }

          // Limpar o callback global
          try {
            delete window[callbackName];
          } catch (e) {
            window[callbackName] = undefined;
          }

          // Verificar se a resposta tem erro explícito da API
          if (response && response.error) {
            console.error(`Erro retornado pela API (${action}):`, response);
            reject(new Error(response.message || `Erro na API (${action}): ${response.error}`));
            return;
          }

          // Resolver a promessa com os dados
          resolve(response);
        };

        // Converter dados para string URL-safe
        const dataStr = encodeURIComponent(JSON.stringify(data));

        // Construir URL com parâmetros (incluindo timestamp para evitar cache)
        const url = `${API_URL}?action=${action}&data=${dataStr}&callback=${callbackName}&t=${Date.now()}`;

        // Criar elemento de script
        scriptElement = document.createElement('script'); // Atribuir à variável no escopo externo
        scriptElement.src = url;
        scriptElement.async = true; // Adicionado para melhor performance

        // Tratar erros de carregamento do script (rede, CORS, etc.)
        scriptElement.onerror = (event) => {
          clearTimeout(timeoutId);

          // Remover o script
          if (scriptElement.parentNode) {
            scriptElement.parentNode.removeChild(scriptElement);
          }

          // Limpar o callback
          try {
            delete window[callbackName];
          } catch (e) {
            window[callbackName] = undefined;
          }

          // TRATAMENTO ESPECIAL PARA getVerificationList EM ERRO DE REDE
          if (action === 'getVerificationList') {
            console.warn(`Falha na comunicação com a API (${action}). Retornando lista de verificações vazia.`);
            resolve({
              success: true, // Indica sucesso na operação geral, mas com dados limitados
              message: "Dados limitados devido a erro de comunicação",
              verifications: [] // Alterado de maintenances para verifications
            });
          } else {
            // Para outras ações, rejeitar normalmente
             console.error(`Falha ao carregar script da API para ${action}:`, event);
             reject(new Error(`Falha na comunicação com a API (${action}). Verifique sua conexão ou a URL da API.`));
          }
        };

        // Adicionar o script ao documento para iniciar a requisição
        document.body.appendChild(scriptElement);
      });
    } catch (error) {
      // Captura erros na própria lógica síncrona de callAPI (raro)
      console.error(`Erro inesperado em callAPI (${action}):`, error);
      // Re-lança o erro para que a cadeia de Promises possa tratá-lo
      throw error;
    }
  }
  // ================================================
  // == Fim da Função callAPI Atualizada ==
  // ================================================

  // Objeto público da API
  const publicAPI = {
    // Dashboard
    getDashboardData: (period = 'current-month') => callAPI('getDashboardData', { period }),

    // Manutenção
    getMaintenanceList: () => callAPI('getMaintenanceList'),
    getMaintenanceFormData: () => callAPI('getMaintenanceFormData'), // Retorna opções para formulário
    saveMaintenance: (data) => callAPI('saveMaintenance', data),
    getMaintenanceDetails: (id) => callAPI('getMaintenanceDetails', { id }),
     // Adicionar função de atualização se necessária pela lógica em Maintenance.js
     updateMaintenance: (id, data) => callAPI('updateMaintenance', { id, ...data }), // Exemplo
     // Adicionar função de exclusão se necessária pela lógica em Maintenance.js
     deleteMaintenance: (id) => callAPI('deleteMaintenance', { id }), // Exemplo

    // Verificação
    getVerificationList: () => callAPI('getVerificationList'), // Usa a nova callAPI com tratamento especial
    getVerificationFormData: (maintenanceId) => callAPI('getVerificationFormData', { maintenanceId }), // Passar ID da manutenção relacionada?
    saveVerification: (data) => callAPI('saveVerification', data),

    // Equipamentos (exemplo, se API suportar)
    getEquipmentIdsByType: (type) => callAPI('getEquipmentIdsByType', { type }), // Exemplo para carregar IDs no form

    // Relatórios
    generateReport: (startDate, endDate) => callAPI('generateReport', { startDate, endDate }),
    exportData: (startDate, endDate, format) => callAPI('exportData', { startDate, endDate, format }),

    // Utilitários
    search: (term, sheet, columns) => callAPI('search', { term, sheet, columns }), // Se API suportar busca genérica
    ping: () => callAPI('ping'), // Para verificar conectividade

    // Sistema / Configuração
    initializeSystem: () => callAPI('initializeSystem'), // Se houver inicialização
    getConfigValue: (key) => callAPI('getConfigValue', { key }),
    setConfigValue: (key, value, description) => callAPI('setConfigValue', { key, value, description }),


    // ========================================================
    // == Início Métodos Adicionados para Compatibilidade ==
    // ========================================================
    getEquipmentTypes: () => {
      console.warn("CHAMADA LEGADA: Usando getMaintenanceFormData para obter Tipos de Equipamento.");
      return callAPI('getMaintenanceFormData') // Chama a action que retorna todos os dados do form
        .then(response => {
          // Extrai e formata apenas os tipos de equipamento
          if (response && response.success && response.formData && Array.isArray(response.formData.opcoesTipoEquipe)) {
            return {
              success: true,
              types: response.formData.opcoesTipoEquipe // Campo esperado pelo Maintenance.js
            };
          }
          // Retorno em caso de falha ou dados ausentes
           console.error("Não foi possível extrair 'opcoesTipoEquipe' da resposta de getMaintenanceFormData:", response);
          return { success: false, message: "Dados de tipo de equipamento não disponíveis na resposta.", types: [] };
        })
        .catch(error => {
           // Captura erros da chamada callAPI
           console.error("Erro ao chamar getMaintenanceFormData para obter tipos de equipamento:", error);
           return { success: false, message: error.message || "Erro ao buscar dados do formulário.", types: [] };
        });
    },

    getProblemCategories: () => {
      console.warn("CHAMADA LEGADA: Usando getMaintenanceFormData para obter Categorias de Problema.");
      return callAPI('getMaintenanceFormData') // Chama a action que retorna todos os dados do form
        .then(response => {
          // Extrai e formata apenas as categorias de problema
          if (response && response.success && response.formData && Array.isArray(response.formData.categoriaProblema)) {
            return {
              success: true,
              categories: response.formData.categoriaProblema // Campo esperado pelo Maintenance.js
            };
          }
           // Retorno em caso de falha ou dados ausentes
           console.error("Não foi possível extrair 'categoriaProblema' da resposta de getMaintenanceFormData:", response);
          return { success: false, message: "Dados de categoria de problema não disponíveis na resposta.", categories: [] };
        })
        .catch(error => {
            // Captura erros da chamada callAPI
            console.error("Erro ao chamar getMaintenanceFormData para obter categorias de problema:", error);
           return { success: false, message: error.message || "Erro ao buscar dados do formulário.", categories: [] };
        });
    }
    // ======================================================
    // == Fim Métodos Adicionados para Compatibilidade ==
    // ======================================================

  }; // Fim do objeto publicAPI

  return publicAPI;

})(); // Fim do IIFE API
