/**
 * Sistema de Dupla Checagem de Manutenção
 * Módulo: API para comunicação com o backend
 */

const API = (function() {
  // URL base da API (Web App do Google Apps Script publicado)
  const API_URL = 'https://script.google.com/macros/s/AKfycbxl-kNereG9-PJFCnoPqwGB6V4EX_b5ROciaj4_d9MBlnT4zeMdvD019lrrKnFdq3A6zg/exec';
  
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
      // Criar uma cópia e adicionar mapeamentos para backend
      const formattedData = { ...data, id };
      
      // Garantir que os campos estejam no formato esperado pelo backend
      // Mesmo mapeamento da função createMaintenance
      formattedData.equipmentId = formattedData.placaOuId;
      formattedData.date = formattedData.dataRegistro;
      formattedData.equipmentType = formattedData.tipoEquipamento;
      formattedData.technician = formattedData.responsavel;
      formattedData.location = formattedData.localOficina;
      formattedData.maintenanceType = formattedData.tipoManutencao;
      formattedData.isCritical = formattedData.eCritico;
      formattedData.problemCategory = formattedData.categoriaProblema;
      formattedData.problemDescription = formattedData.detalhesproblema;
      formattedData.additionalNotes = formattedData.observacoes;
      
      console.log("API.updateMaintenance dados formatados:", formattedData);
      
      return callAPI('updateMaintenance', formattedData);
    },
    
    // Método para deletar uma manutenção
    deleteMaintenance: function(id) {
      return callAPI('deleteMaintenance', { id });
    },
    
    // FUNÇÃO MELHORADA: Método para criar uma nova manutenção
    createMaintenance: function(data) {
      console.log("API.createMaintenance chamada com dados:", data);
      
      // Criar uma cópia dos dados para não modificar o objeto original
      const formattedData = { ...data };
      
      // MAPEAMENTO DE CAMPOS: Garantir que os campos obrigatórios estejam no formato esperado pelo backend
      
      // Campos críticos que estavam causando erro
      formattedData.equipmentId = formattedData.placaOuId;
      formattedData.date = formattedData.dataRegistro;
      
      // Outros mapeamentos importantes
      formattedData.equipmentType = formattedData.tipoEquipamento;
      formattedData.technician = formattedData.responsavel;
      formattedData.location = formattedData.localOficina;
      formattedData.maintenanceType = formattedData.tipoManutencao;
      formattedData.isCritical = formattedData.eCritico;
      formattedData.problemCategory = formattedData.categoriaProblema;
      formattedData.problemDescription = formattedData.detalhesproblema;
      formattedData.additionalNotes = formattedData.observacoes;
      
      // Formatos alternativos para compatibilidade com diferentes versões do backend
      formattedData.id_equipamento = formattedData.placaOuId;
      formattedData.equipamento_id = formattedData.placaOuId;
      formattedData.equipamentoId = formattedData.placaOuId;
      formattedData.placa_id = formattedData.placaOuId;
      
      // Backup para datas
      formattedData.data = formattedData.dataRegistro;
      formattedData.data_manutencao = formattedData.dataRegistro;
      formattedData.dataManutencao = formattedData.dataRegistro;
      
      // Garantir formato de data correto (YYYY-MM-DD)
      if (formattedData.dataRegistro && !formattedData.dataRegistro.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Se não estiver no formato correto, tente converter
        try {
          const dateObj = new Date(formattedData.dataRegistro);
          const formattedDate = dateObj.toISOString().split('T')[0];
          formattedData.dataRegistro = formattedDate;
          formattedData.date = formattedDate;
          formattedData.data = formattedDate;
          formattedData.data_manutencao = formattedDate;
          formattedData.dataManutencao = formattedDate;
        } catch (e) {
          console.error("Erro ao formatar data:", e);
        }
      }
      
      // Backup para tipo de equipamento
      formattedData.tipo_equipamento = formattedData.tipoEquipamento;
      formattedData.equipment_type = formattedData.tipoEquipamento;
      
      // Backup para responsável
      formattedData.tecnico = formattedData.responsavel;
      formattedData.responsavel_nome = formattedData.responsavel;
      formattedData.technician_name = formattedData.responsavel;
      
      // Backup para categoria de problema
      formattedData.categoria = formattedData.categoriaProblema;
      formattedData.problema_categoria = formattedData.categoriaProblema;
      
      // Backup para detalhes do problema
      formattedData.detalhes = formattedData.detalhesproblema;
      formattedData.problema_detalhes = formattedData.detalhesproblema;
      
      console.log("Dados formatados para envio:", formattedData);
      
      // Chamar a função original com os dados formatados
      return callAPI('saveMaintenance', formattedData);
    },
    
    // Método para enviar verificação
    submitVerification: function(data) {
      console.log("API.submitVerification chamada com dados:", data);
      
      // Mapear campos para o backend
      const formattedData = {
        ...data,
        maintenanceId: data.maintenanceId || data.id, // Aceitar ambos os formatos
        verifier: data.verifierName || data.verifier,
        verificador: data.verifierName || data.verifier,
        result: data.result || data.resultado,
        resultado: data.result || data.resultado,
        comments: data.comments || data.comentarios,
        comentarios: data.comments || data.comentarios
      };
      
      return this.saveVerification(formattedData);
    },
    
    // Função auxiliar para exibir dados de depuração
    debug: function() {
      console.log("Métodos disponíveis na API:");
      Object.keys(this).forEach(key => {
        if (typeof this[key] === 'function') {
          console.log(`- ${key}`);
        }
      });
      return { success: true, message: "Ver console para detalhes de depuração" };
    }
  };
  
  console.log("API.js carregado com sucesso!");
  window.API_LOADED = true;
  window.API = publicAPI; // Expõe API globalmente
  
  return publicAPI;
})();
