/**
 * ⚠️ IMPORTANTE: Este arquivo é mantido para compatibilidade retroativa
 * 
 * Todo o código antigo que importa de './firebaseConfig' continuará funcionando,
 * mas agora usará o sistema multi-database do firebaseMulti.js por baixo dos panos.
 * 
 * Para novos recursos que precisam de acesso aos múltiplos bancos,
 * importe diretamente de './config/firebaseMulti'
 */

import { 
  db, 
  auth, 
  storage, 
  app,
  primaryDb,
  backupDb,
  workflowbr1Db,
  dbManager
} from './config/firebaseMulti';

// Exportações para compatibilidade total com código antigo
export { db, auth, storage, app };

// Exportações adicionais do sistema multi-database
export { 
  primaryDb,
  backupDb, 
  workflowbr1Db,
  dbManager 
};

// Export default do app
export default app;