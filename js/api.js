/**
 * Sistema de Dupla Checagem de Manutenção
 * Módulo: API para comunicação com o backend
 */

const API = (function() {
  // URL base da API (Web App do Google Apps Script publicado)
  const API_URL = 'https://script.google.com/macros/s/AKfycbxlQDfskwbp4S9rrcMrNb823irz7O3pU-kfMeauzREV-7jy0JDIgXCxhxQBlQ4aM3MQ2w/exec';
  
  // Função para chamar a API com tratamento de erros e timeout
  async function callAPI(action, data = {}, timeout = 60000) {
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
            window[callbackName] = undefined;
          }
          
          // Remover script após timeout
          if (scriptElement && scriptElement.parentNode) {
            scriptElement.parentNode.removeChild(scriptElement);
          }
          
          // Mensagem de erro específica para cada ação
          let errorMsg = `A requisição para ${action} excedeu o limite de tempo (${timeout/1000}s)`;
          
          if (action === 'getVerificationList') {
            errorMsg += '. Tente novamente ou verifique a conexão com o servidor.';
            
            // Para verificações, podemos tentar recuperar com dados vazios
            resolve({
              success: true,
              message: "Dados limitados devido a timeout",
              maintenances: []
            });
          } else {
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
          
          // Verificar se a resposta tem erro
          if (response && response.error) {
            reject(new Error(response.message || `Erro na API (${action}): ${response.error}`));
            return;
          }
          
          // Resolver a promessa com os dados
          resolve(response);
        };
        
        // Converter dados para string
        const dataStr = encodeURIComponent(JSON.stringify(data));
        
        // Construir URL com parâmetros
        const url = `${API_URL}?action=${action}&data=${dataStr}&callback=${callbackName}&t=${Date.now()}`;
        
        // Criar elemento de script
        const scriptElement = document.createElement('script');
        scriptElement.src = url;
        scriptElement.async = true; // Adicionado para melhor performance
        
        // Tratar erros de carregamento
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
          
          // Para algumas ações, podemos fornecer dados parciais em caso de erro
          if (action === 'getVerificationList') {
            resolve({
              success: true,
              message: "Dados limitados devido a erro de comunicação",
              maintenances: []
            });
          } else {
            reject(new Error(`Falha na comunicação com a API (${action}). Verifique sua conexão.`));
          }
        };
        
        // Adicionar o script ao documento
        document.body.appendChild(scriptElement);
      });
    } catch (error) {
      console.error("Erro geral em callAPI:", error);
      throw error;
    }
  }
  
  // API pública
  const publicAPI = {
    // Dashboard
    getDashboardData: (period = 'current-month') => callAPI('getDashboardData', { period }),
    
    // Manutenção
    getMaintenanceList: () => callAPI('getMaintenanceList'),
    getMaintenanceFormData: () => callAPI('getMaintenanceFormData'),
    saveMaintenance: (data) => callAPI('saveMaintenance', data),
    getMaintenanceDetails: (id) => callAPI('getMaintenanceDetails', { id }),
    
    // Verificação
    getVerificationList: () => callAPI('getVerificationList'),
    getVerificationFormData: () => callAPI('getVerificationFormData'),
    saveVerification: (data) => callAPI('saveVerification', data),
    
    // Relatórios
    generateReport: (startDate, endDate) => callAPI('generateReport', { startDate, endDate }),
    exportData: (startDate, endDate, format) => callAPI('exportData', { startDate, endDate, format }),
    
    // Utilitários
    search: (term, sheet, columns) => callAPI('search', { term, sheet, columns }),
    ping: () => callAPI('ping'),
    
    // Sistema
    initializeSystem: () => callAPI('initializeSystem'),
    getConfigValue: (key) => callAPI('getConfigValue', { key }),
    setConfigValue: (key, value, description) => callAPI('setConfigValue', { key, value, description }),
    
    // Métodos adicionados para compatibilidade
    getEquipmentTypes: function() {
      console.log("Usando getMaintenanceFormData em vez da função legada getEquipmentTypes");
      return this.getMaintenanceFormData()
        .then(response => {
          if (response.success && response.formData) {
            // Transformar para o formato esperado pela função loadEquipmentTypes
            return {
              success: true,
              types: response.formData.opcoesTipoEquipe || []
            };
          }
          return { success: false, message: "Dados não disponíveis", types: [] };
        });
    },
    
    getProblemCategories: function() {
      console.log("Usando getMaintenanceFormData em vez da função legada getProblemCategories");
      return this.getMaintenanceFormData()
        .then(response => {
          if (response.success && response.formData) {
            return {
              success: true,
              categories: response.formData.categoriaProblema || []
            };
          }
          return { success: false, message: "Dados não disponíveis", categories: [] };
        });
    },
    
    // Método para buscar IDs de equipamento por tipo
    getEquipmentIdsByType: function(type) {
      return callAPI('getEquipmentIdsByType', { type })
        .then(response => {
          if (!response || !response.success) {
            return { success: false, message: "Falha ao buscar IDs", ids: [] };
          }
          return response;
        })
        .catch(error => {
          console.error(`Erro ao buscar IDs para o tipo ${type}:`, error);
          return { success: false, message: error.message, ids: [] };
        });
    },
    
    // Método para atualizar uma manutenção existente
    updateMaintenance: function(id, data) {
      return callAPI('updateMaintenance', { id, ...data });
    },
    
    // Método para deletar uma manutenção
    deleteMaintenance: function(id) {
      return callAPI('deleteMaintenance', { id });
    }
  };
  
  console.log("API.js carregado com sucesso!");
  window.API_LOADED = true;
  window.API = publicAPI; // ADICIONADO: Expõe API globalmente
  
  return publicAPI;
})();
