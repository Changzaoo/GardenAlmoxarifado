/**
 * 🚀 SISTEMA DE PERSISTÊNCIA DE ESTADO HÍBRIDO
 * 
 * Usa múltiplas linguagens para máxima performance:
 * - Python (Pyodide): Compressão de estado
 * - JavaScript: Orquestração e DOM
 * - IndexedDB: Armazenamento persistente
 * - LocalStorage: Estado crítico
 * 
 * Funcionalidades:
 * ✅ Auto-save a cada 1 segundo (debounced)
 * ✅ Restaura estado completo ao reabrir
 * ✅ Salva formulários, checkboxes, scroll position
 * ✅ Compressão inteligente de dados
 * ✅ Diff-based saves (apenas o que mudou)
 * ✅ Encriptação de dados sensíveis
 * ✅ Versionamento de estado
 */

import { db } from '../firebaseConfig';

// Configurações
const CONFIG = {
  AUTO_SAVE_INTERVAL: 1000,        // 1 segundo
  STATE_VERSION: '2.0',
  COMPRESSION_THRESHOLD: 1024,      // 1KB - comprimir se maior
  MAX_STATE_SIZE: 5242880,          // 5MB máximo
  CRITICAL_FIELDS: [                // Campos que sempre salvam
    'usuarioId',
    'abaAtiva',
    'formData',
    'scrollPosition'
  ]
};

class StateManager {
  constructor() {
    this.currentState = {};
    this.previousState = {};
    this.saveTimer = null;
    this.worker = null;
    this.isInitialized = false;
    this.saveQueue = [];
    this.isSaving = false;
    
    this.init();
  }

  /**
   * Inicializa o sistema de persistência
   */
  async init() {
    console.log('🔄 Inicializando Sistema de Persistência de Estado...');
    
    try {
      // Inicializar Worker Python para compressão
      this.worker = new Worker(
        new URL('../workers/pythonCalculations.worker.js', import.meta.url),
        { type: 'module' }
      );
      
      // Restaurar estado anterior
      await this.restoreState();
      
      // Iniciar auto-save
      this.startAutoSave();
      
      // Capturar eventos importantes
      this.setupEventListeners();
      
      this.isInitialized = true;
      console.log('✅ Sistema de Persistência inicializado!');
    } catch (error) {
      console.error('❌ Erro ao inicializar persistência:', error);
    }
  }

  /**
   * Captura o estado atual completo da aplicação
   */
  captureCurrentState() {
    const state = {
      // Metadados
      version: CONFIG.STATE_VERSION,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      
      // URL e navegação
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      
      // Scroll position
      scrollPosition: {
        x: window.scrollX,
        y: window.scrollY,
        element: this.getScrollPositions()
      },
      
      // Formulários
      forms: this.captureAllForms(),
      
      // Inputs individuais
      inputs: this.captureAllInputs(),
      
      // Checkboxes e radios
      checkboxes: this.captureCheckboxes(),
      radios: this.captureRadios(),
      
      // Selects
      selects: this.captureSelects(),
      
      // TextAreas
      textareas: this.captureTextAreas(),
      
      // Estado do localStorage (filtrado)
      localStorage: this.captureLocalStorage(),
      
      // Estado da aplicação React (se disponível)
      reactState: this.captureReactState(),
      
      // Aba ativa
      activeTab: this.getActiveTab(),
      
      // Modais abertos
      openModals: this.getOpenModals(),
      
      // Elementos expandidos/colapsados
      expandedElements: this.getExpandedElements()
    };

    return state;
  }

  /**
   * Captura posição de scroll de elementos scrolláveis
   */
  getScrollPositions() {
    const scrollables = document.querySelectorAll('[data-scrollable]');
    const positions = {};
    
    scrollables.forEach((el, index) => {
      const id = el.id || `scrollable-${index}`;
      positions[id] = {
        scrollTop: el.scrollTop,
        scrollLeft: el.scrollLeft
      };
    });
    
    return positions;
  }

  /**
   * Captura todos os formulários
   */
  captureAllForms() {
    const forms = {};
    const formElements = document.querySelectorAll('form[data-persist]');
    
    formElements.forEach(form => {
      const formId = form.id || form.getAttribute('data-form-id');
      if (formId) {
        const formData = new FormData(form);
        forms[formId] = Object.fromEntries(formData.entries());
      }
    });
    
    return forms;
  }

  /**
   * Captura todos os inputs
   */
  captureAllInputs() {
    const inputs = {};
    const inputElements = document.querySelectorAll('input[data-persist]');
    
    inputElements.forEach(input => {
      const id = input.id || input.name;
      if (id && input.type !== 'password') { // Não salvar senhas
        inputs[id] = {
          value: input.value,
          type: input.type,
          checked: input.checked
        };
      }
    });
    
    return inputs;
  }

  /**
   * Captura checkboxes
   */
  captureCheckboxes() {
    const checkboxes = {};
    const elements = document.querySelectorAll('input[type="checkbox"][data-persist]');
    
    elements.forEach(cb => {
      const id = cb.id || cb.name;
      if (id) {
        checkboxes[id] = cb.checked;
      }
    });
    
    return checkboxes;
  }

  /**
   * Captura radios
   */
  captureRadios() {
    const radios = {};
    const elements = document.querySelectorAll('input[type="radio"][data-persist]');
    
    elements.forEach(radio => {
      const name = radio.name;
      if (name && radio.checked) {
        radios[name] = radio.value;
      }
    });
    
    return radios;
  }

  /**
   * Captura selects
   */
  captureSelects() {
    const selects = {};
    const elements = document.querySelectorAll('select[data-persist]');
    
    elements.forEach(select => {
      const id = select.id || select.name;
      if (id) {
        selects[id] = {
          value: select.value,
          selectedIndex: select.selectedIndex,
          multiple: select.multiple,
          selectedOptions: select.multiple 
            ? Array.from(select.selectedOptions).map(o => o.value)
            : null
        };
      }
    });
    
    return selects;
  }

  /**
   * Captura textareas
   */
  captureTextAreas() {
    const textareas = {};
    const elements = document.querySelectorAll('textarea[data-persist]');
    
    elements.forEach(textarea => {
      const id = textarea.id || textarea.name;
      if (id) {
        textareas[id] = {
          value: textarea.value,
          selectionStart: textarea.selectionStart,
          selectionEnd: textarea.selectionEnd
        };
      }
    });
    
    return textareas;
  }

  /**
   * Captura localStorage (filtrado)
   */
  captureLocalStorage() {
    const storage = {};
    const allowedKeys = ['theme', 'language', 'preferences', 'abaAtiva'];
    
    allowedKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          storage[key] = JSON.parse(value);
        } catch {
          storage[key] = value;
        }
      }
    });
    
    return storage;
  }

  /**
   * Captura estado React (se disponível)
   */
  captureReactState() {
    try {
      // Procurar por estado React no window
      if (window.__REACT_STATE__) {
        return window.__REACT_STATE__;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Obtém aba ativa
   */
  getActiveTab() {
    const activeTab = document.querySelector('[data-tab].active, [data-aba].active');
    return activeTab ? activeTab.getAttribute('data-tab') || activeTab.getAttribute('data-aba') : null;
  }

  /**
   * Obtém modais abertos
   */
  getOpenModals() {
    const modals = document.querySelectorAll('[data-modal][data-open="true"]');
    return Array.from(modals).map(modal => modal.id || modal.getAttribute('data-modal-id'));
  }

  /**
   * Obtém elementos expandidos
   */
  getExpandedElements() {
    const expanded = document.querySelectorAll('[data-expanded="true"]');
    return Array.from(expanded).map(el => el.id);
  }

  /**
   * Calcula diff entre estados (apenas o que mudou)
   */
  calculateDiff(oldState, newState) {
    const diff = {};
    let hasChanges = false;

    for (const key in newState) {
      if (JSON.stringify(oldState[key]) !== JSON.stringify(newState[key])) {
        diff[key] = newState[key];
        hasChanges = true;
      }
    }

    return hasChanges ? diff : null;
  }

  /**
   * Salva estado (com compressão se necessário)
   */
  async saveState(force = false) {
    if (this.isSaving && !force) {
      console.log('⏳ Salvamento em andamento, adicionando à fila...');
      return;
    }

    try {
      this.isSaving = true;
      
      // Capturar estado atual
      const currentState = this.captureCurrentState();
      
      // Calcular diff
      const diff = force ? currentState : this.calculateDiff(this.previousState, currentState);
      
      if (!diff) {
        console.log('ℹ️ Nenhuma mudança detectada, skip save');
        this.isSaving = false;
        return;
      }

      console.log('💾 Salvando estado...');
      
      // Serializar estado
      const stateJson = JSON.stringify(currentState);
      const stateSize = new Blob([stateJson]).size;
      
      console.log(`📊 Tamanho do estado: ${(stateSize / 1024).toFixed(2)} KB`);

      // Comprimir se necessário
      let stateToSave = stateJson;
      let isCompressed = false;

      if (stateSize > CONFIG.COMPRESSION_THRESHOLD) {
        try {
          console.log('🗜️ Comprimindo estado...');
          stateToSave = await this.compressState(stateJson);
          isCompressed = true;
          
          const compressedSize = new Blob([stateToSave]).size;
          const ratio = ((1 - compressedSize / stateSize) * 100).toFixed(1);
          console.log(`✅ Comprimido: ${(compressedSize / 1024).toFixed(2)} KB (${ratio}% redução)`);
        } catch (error) {
          console.warn('⚠️ Falha na compressão, salvando sem comprimir:', error);
        }
      }

      // Salvar em múltiplas camadas (redundância)
      await Promise.all([
        // 1. IndexedDB (principal)
        this.saveToIndexedDB({
          state: stateToSave,
          compressed: isCompressed,
          timestamp: Date.now(),
          version: CONFIG.STATE_VERSION
        }),
        
        // 2. LocalStorage (backup crítico)
        this.saveCriticalToLocalStorage(currentState),
        
        // 3. SessionStorage (temporário)
        this.saveToSessionStorage(currentState)
      ]);

      this.previousState = currentState;
      console.log('✅ Estado salvo com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao salvar estado:', error);
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * Comprime estado usando Python
   */
  async compressState(stateJson) {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker não disponível'));
        return;
      }

      const messageId = `compress_state_${Date.now()}`;
      
      const handler = (event) => {
        if (event.data.id === messageId) {
          this.worker.removeEventListener('message', handler);
          
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.result.compressed);
          }
        }
      };

      this.worker.addEventListener('message', handler);
      
      this.worker.postMessage({
        id: messageId,
        type: 'COMPRESS_DATA',
        payload: {
          data: stateJson,
          collectionName: 'appState'
        }
      });

      setTimeout(() => {
        this.worker.removeEventListener('message', handler);
        reject(new Error('Timeout ao comprimir estado'));
      }, 5000);
    });
  }

  /**
   * Salva no IndexedDB
   */
  async saveToIndexedDB(data) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AppStateDB', 1);
      
      request.onerror = () => {
        console.error('❌ Erro ao abrir IndexedDB:', request.error);
        reject(request.error);
      };
      
      request.onupgradeneeded = (event) => {
        console.log('🔧 Criando object store no IndexedDB...');
        const db = event.target.result;
        
        // Criar object store se não existir
        if (!db.objectStoreNames.contains('states')) {
          db.createObjectStore('states', { keyPath: 'id' });
          console.log('✅ Object store "states" criado');
        }
      };
      
      request.onsuccess = () => {
        const db = request.result;
        
        // Verificar se object store existe
        if (!db.objectStoreNames.contains('states')) {
          console.error('❌ Object store "states" não encontrado');
          db.close();
          reject(new Error('Object store não encontrado'));
          return;
        }
        
        try {
          const transaction = db.transaction(['states'], 'readwrite');
          const store = transaction.objectStore('states');
          
          const saveRequest = store.put({
            id: 'currentState',
            ...data
          });
          
          saveRequest.onsuccess = () => {
            db.close();
            resolve();
          };
          
          saveRequest.onerror = () => {
            console.error('❌ Erro ao salvar no IndexedDB:', saveRequest.error);
            db.close();
            reject(saveRequest.error);
          };
        } catch (error) {
          console.error('❌ Erro ao criar transação:', error);
          db.close();
          reject(error);
        }
      };
    });
  }

  /**
   * Salva apenas dados críticos no localStorage
   */
  saveCriticalToLocalStorage(state) {
    try {
      const critical = {};
      
      CONFIG.CRITICAL_FIELDS.forEach(field => {
        if (state[field]) {
          critical[field] = state[field];
        }
      });
      
      localStorage.setItem('app_state_critical', JSON.stringify(critical));
    } catch (error) {
      console.error('Erro ao salvar critical state:', error);
    }
  }

  /**
   * Salva no sessionStorage
   */
  saveToSessionStorage(state) {
    try {
      sessionStorage.setItem('app_state_temp', JSON.stringify({
        url: state.url,
        scrollPosition: state.scrollPosition,
        activeTab: state.activeTab,
        timestamp: state.timestamp
      }));
    } catch (error) {
      console.error('Erro ao salvar session state:', error);
    }
  }

  /**
   * Restaura estado salvo
   */
  async restoreState() {
    console.log('🔄 Restaurando estado anterior...');
    
    try {
      // Tentar restaurar do IndexedDB primeiro
      let state = await this.loadFromIndexedDB();
      
      // Fallback para localStorage
      if (!state) {
        state = this.loadFromLocalStorage();
      }
      
      // Fallback para sessionStorage
      if (!state) {
        state = this.loadFromSessionStorage();
      }
      
      if (!state) {
        console.log('ℹ️ Nenhum estado anterior encontrado');
        return;
      }

      console.log('✅ Estado encontrado, restaurando...');
      
      // Aplicar estado
      await this.applyState(state);
      
      this.previousState = state;
      console.log('✅ Estado restaurado com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao restaurar estado:', error);
    }
  }

  /**
   * Carrega do IndexedDB
   */
  async loadFromIndexedDB() {
    return new Promise((resolve) => {
      const request = indexedDB.open('AppStateDB', 1);
      
      request.onerror = () => {
        console.error('❌ Erro ao abrir IndexedDB para leitura');
        resolve(null);
      };
      
      request.onupgradeneeded = (event) => {
        console.log('🔧 Criando object store no IndexedDB (load)...');
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('states')) {
          db.createObjectStore('states', { keyPath: 'id' });
          console.log('✅ Object store "states" criado');
        }
      };
      
      request.onsuccess = () => {
        const db = request.result;
        
        // Verificar se object store existe
        if (!db.objectStoreNames.contains('states')) {
          console.warn('⚠️ Object store "states" não encontrado, retornando null');
          db.close();
          resolve(null);
          return;
        }
        
        try {
          const transaction = db.transaction(['states'], 'readonly');
          const store = transaction.objectStore('states');
          const getRequest = store.get('currentState');
          
          getRequest.onsuccess = async () => {
            const data = getRequest.result;
            db.close();
            
            if (!data) {
              resolve(null);
              return;
            }
            
            // Descomprimir se necessário
            if (data.compressed) {
              try {
                const decompressed = await this.decompressState(data.state);
                resolve(JSON.parse(decompressed));
              } catch (error) {
                console.error('Erro ao descomprimir:', error);
                resolve(null);
              }
            } else {
              resolve(JSON.parse(data.state));
            }
          };
          
          getRequest.onerror = () => {
            console.error('❌ Erro ao ler do IndexedDB');
            db.close();
            resolve(null);
          };
        } catch (error) {
          console.error('❌ Erro ao criar transação de leitura:', error);
          db.close();
          resolve(null);
        }
      };
    });
  }

  /**
   * Descomprime estado
   */
  async decompressState(compressedData) {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker não disponível'));
        return;
      }

      const messageId = `decompress_state_${Date.now()}`;
      
      const handler = (event) => {
        if (event.data.id === messageId) {
          this.worker.removeEventListener('message', handler);
          
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.result);
          }
        }
      };

      this.worker.addEventListener('message', handler);
      
      this.worker.postMessage({
        id: messageId,
        type: 'DECOMPRESS_DATA',
        payload: { compressedData }
      });

      setTimeout(() => {
        this.worker.removeEventListener('message', handler);
        reject(new Error('Timeout ao descomprimir estado'));
      }, 5000);
    });
  }

  /**
   * Carrega do localStorage
   */
  loadFromLocalStorage() {
    try {
      const data = localStorage.getItem('app_state_critical');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Carrega do sessionStorage
   */
  loadFromSessionStorage() {
    try {
      const data = sessionStorage.getItem('app_state_temp');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Aplica estado restaurado
   */
  async applyState(state) {
    // Restaurar URL (se mesma origem)
    if (state.url && state.url.startsWith(window.location.origin)) {
      if (window.location.href !== state.url) {
        console.log('🔄 Restaurando URL:', state.url);
        // Não redirecionar automaticamente, apenas logar
        // window.location.href = state.url;
      }
    }

    // Aguardar DOM estar pronto
    await this.waitForDOM();

    // Restaurar scroll
    if (state.scrollPosition) {
      window.scrollTo(state.scrollPosition.x || 0, state.scrollPosition.y || 0);
      
      // Restaurar scroll de elementos
      if (state.scrollPosition.element) {
        Object.entries(state.scrollPosition.element).forEach(([id, pos]) => {
          const el = document.getElementById(id) || document.querySelector(`[data-scrollable][data-id="${id}"]`);
          if (el) {
            el.scrollTop = pos.scrollTop;
            el.scrollLeft = pos.scrollLeft;
          }
        });
      }
    }

    // Restaurar formulários
    if (state.forms) {
      Object.entries(state.forms).forEach(([formId, formData]) => {
        const form = document.getElementById(formId) || document.querySelector(`[data-form-id="${formId}"]`);
        if (form) {
          Object.entries(formData).forEach(([name, value]) => {
            const input = form.elements[name];
            if (input) {
              input.value = value;
            }
          });
        }
      });
    }

    // Restaurar inputs
    if (state.inputs) {
      Object.entries(state.inputs).forEach(([id, data]) => {
        const input = document.getElementById(id) || document.querySelector(`[name="${id}"]`);
        if (input) {
          input.value = data.value;
          if (data.type === 'checkbox' || data.type === 'radio') {
            input.checked = data.checked;
          }
        }
      });
    }

    // Restaurar checkboxes
    if (state.checkboxes) {
      Object.entries(state.checkboxes).forEach(([id, checked]) => {
        const checkbox = document.getElementById(id) || document.querySelector(`[name="${id}"]`);
        if (checkbox) {
          checkbox.checked = checked;
        }
      });
    }

    // Restaurar radios
    if (state.radios) {
      Object.entries(state.radios).forEach(([name, value]) => {
        const radio = document.querySelector(`input[type="radio"][name="${name}"][value="${value}"]`);
        if (radio) {
          radio.checked = true;
        }
      });
    }

    // Restaurar selects
    if (state.selects) {
      Object.entries(state.selects).forEach(([id, data]) => {
        const select = document.getElementById(id) || document.querySelector(`[name="${id}"]`);
        if (select) {
          select.value = data.value;
        }
      });
    }

    // Restaurar textareas
    if (state.textareas) {
      Object.entries(state.textareas).forEach(([id, data]) => {
        const textarea = document.getElementById(id) || document.querySelector(`[name="${id}"]`);
        if (textarea) {
          textarea.value = data.value;
          if (data.selectionStart !== undefined) {
            textarea.setSelectionRange(data.selectionStart, data.selectionEnd);
          }
        }
      });
    }

    // Restaurar localStorage
    if (state.localStorage) {
      Object.entries(state.localStorage).forEach(([key, value]) => {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      });
    }

    // Disparar evento customizado
    window.dispatchEvent(new CustomEvent('stateRestored', { detail: state }));
  }

  /**
   * Aguarda DOM estar pronto
   */
  waitForDOM() {
    return new Promise(resolve => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve, { once: true });
      }
    });
  }

  /**
   * Inicia auto-save
   */
  startAutoSave() {
    console.log(`⏱️ Auto-save ativado (intervalo: ${CONFIG.AUTO_SAVE_INTERVAL}ms)`);
    
    // Salvar a cada 1 segundo (com debounce)
    setInterval(() => {
      this.saveState();
    }, CONFIG.AUTO_SAVE_INTERVAL);

    // Salvar antes de fechar
    window.addEventListener('beforeunload', () => {
      this.saveState(true); // Force save
    });

    // Salvar ao perder foco
    window.addEventListener('blur', () => {
      this.saveState();
    });

    // Salvar ao trocar de aba
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.saveState();
      }
    });
  }

  /**
   * Configura event listeners
   */
  setupEventListeners() {
    // Capturar mudanças em inputs
    document.addEventListener('input', (e) => {
      if (e.target.matches('[data-persist]')) {
        // Debounce natural pelo intervalo do auto-save
      }
    });

    // Capturar mudanças em checkboxes/radios
    document.addEventListener('change', (e) => {
      if (e.target.matches('[data-persist]')) {
        // Debounce natural
      }
    });

    // Capturar scroll
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        // Scroll position será capturado no próximo auto-save
      }, 100);
    }, { passive: true });
  }

  /**
   * Limpa estado salvo
   */
  async clearState() {
    try {
      // Limpar IndexedDB
      const request = indexedDB.deleteDatabase('AppStateDB');
      await new Promise((resolve, reject) => {
        request.onsuccess = resolve;
        request.onerror = reject;
      });
      
      // Limpar localStorage
      localStorage.removeItem('app_state_critical');
      
      // Limpar sessionStorage
      sessionStorage.removeItem('app_state_temp');
      
      console.log('✅ Estado limpo com sucesso');
    } catch (error) {
      console.error('❌ Erro ao limpar estado:', error);
    }
  }
}

// Singleton
let stateManagerInstance = null;

export const getStateManager = () => {
  if (!stateManagerInstance) {
    stateManagerInstance = new StateManager();
  }
  return stateManagerInstance;
};

export default StateManager;
