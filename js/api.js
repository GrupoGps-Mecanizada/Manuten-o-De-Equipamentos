/**
 * Sistema de Dupla Checagem de Manutenção
 * Módulo: API para comunicação com o backend
 */

const API = (() => {
  // URL base da API (Web App do Google Apps Script publicado)
  const API_URL = 'https://script.google.com/macros/s/AKfycbyM4zw2zDzw_ybAyGFCHdsyjwAXsw-K3x2S1ca0NsTk0eB9s8E0XM9XNlTbiNrb5RadfQ/exec';
  
  // Função para chamar a API com tratamento de erros e timeout
  async function callAPI(action, data = {}, timeout = 30000) {
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
          reject(new Error(`A requisição para ${action} excedeu o limite de tempo (${timeout/1000}s)`));
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
          
          reject(new Error(`Falha na comunicação com a API (${action}). Verifique sua conexão.`));
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
  return {
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
    setConfigValue: (key, value, description) => callAPI('setConfigValue', { key, value, description })
  };
})();
