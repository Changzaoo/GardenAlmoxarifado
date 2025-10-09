// Solução Temporária de Emergência para Erro do Firestore
// Este arquivo limpa o cache corrompido do Firestore

import { clearIndexedDbPersistence, terminate } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Limpa completamente o cache do Firestore
 * Use quando aparecer erro: "INTERNAL ASSERTION FAILED: Unexpected state"
 */
export const limparCacheFirestore = async () => {
  try {
    console.log('🔄 Limpando cache do Firestore...');
    
    // 1. Terminar todas as conexões ativas
    await terminate(db);
    console.log('✅ Conexões terminadas');
    
    // 2. Limpar IndexedDB
    await clearIndexedDbPersistence(db);
    console.log('✅ Cache limpo');
    
    // 3. Recarregar a página
    console.log('🔄 Recarregando página...');
    window.location.reload();
    
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error);
    
    // Se falhar, limpar manualmente o IndexedDB
    if (window.indexedDB) {
      const databases = await window.indexedDB.databases();
      for (const dbInfo of databases) {
        if (dbInfo.name?.includes('firestore')) {
          console.log(`🗑️ Deletando banco: ${dbInfo.name}`);
          window.indexedDB.deleteDatabase(dbInfo.name);
        }
      }
    }
    
    // Forçar reload
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
};

/**
 * Detecta erro crítico do Firestore e limpa automaticamente
 */
export const detectarECorrigirErroFirestore = () => {
  // Interceptar erros do console
  const originalError = console.error;
  console.error = (...args) => {
    const errorMessage = args.join(' ');
    
    // Detectar erro crítico do Firestore
    if (
      errorMessage.includes('FIRESTORE') &&
      errorMessage.includes('INTERNAL ASSERTION FAILED') &&
      (errorMessage.includes('Unexpected state') || errorMessage.includes('ID: ca9') || errorMessage.includes('ID: b815'))
    ) {
      console.warn('🚨 ERRO CRÍTICO DO FIRESTORE DETECTADO!');
      console.warn('🔄 Iniciando limpeza automática...');
      
      // Limpar cache automaticamente
      limparCacheFirestore();
      
      return; // Não mostrar o erro original
    }
    
    // Chamar console.error original para outros erros
    originalError.apply(console, args);
  };
};

/**
 * Adiciona botão de emergência na tela
 */
export const adicionarBotaoEmergencia = () => {
  // Verificar se já existe
  if (document.getElementById('firestore-emergency-btn')) return;
  
  const button = document.createElement('button');
  button.id = 'firestore-emergency-btn';
  button.innerHTML = '🆘 Limpar Cache Firestore';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 50px;
    font-weight: bold;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    transition: all 0.3s ease;
    display: none;
  `;
  
  button.onmouseover = () => {
    button.style.transform = 'scale(1.05)';
    button.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
  };
  
  button.onmouseout = () => {
    button.style.transform = 'scale(1)';
    button.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
  };
  
  button.onclick = async () => {
    if (confirm('⚠️ Isso vai limpar o cache do Firestore e recarregar a página. Continuar?')) {
      button.innerHTML = '⏳ Limpando...';
      button.disabled = true;
      await limparCacheFirestore();
    }
  };
  
  document.body.appendChild(button);
  
  // Mostrar botão quando houver erro
  window.addEventListener('error', (event) => {
    if (event.message?.includes('FIRESTORE')) {
      button.style.display = 'block';
    }
  });
  
  // Mostrar botão quando houver erro no console
  const originalError = console.error;
  console.error = (...args) => {
    const errorMessage = args.join(' ');
    if (errorMessage.includes('FIRESTORE') && errorMessage.includes('INTERNAL ASSERTION')) {
      button.style.display = 'block';
    }
    originalError.apply(console, args);
  };
};

export default {
  limparCacheFirestore,
  detectarECorrigirErroFirestore,
  adicionarBotaoEmergencia
};
