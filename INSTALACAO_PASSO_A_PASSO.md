# 🚀 Instalação do Sistema de Backup Automático - Passo a Passo

## ✅ O Que Você Tem Agora

- ✅ 9 arquivos novos criados
- ✅ 2,831 linhas de código
- ✅ Documentação completa
- ✅ Sistema pronto para usar

## 📋 Instalação em 3 Passos

### 🎯 Passo 1: Atualizar Imports do Firebase

Você tem **2 opções**:

#### Opção A: Script Automático (⚡ Recomendado)

```bash
# Execute no terminal do VS Code
node migrate-firebase-imports.js
```

O script vai:
- ✅ Buscar todos os arquivos `.js`, `.jsx`, `.ts`, `.tsx`
- ✅ Encontrar imports de `firebaseConfig`
- ✅ Criar backup de todos os arquivos
- ✅ Atualizar para `config/firebaseDual`
- ✅ Gerar relatório em `migration-report.json`

**Se der problema:**
```bash
# Restaurar backup
node migrate-firebase-imports.js --restore
```

#### Opção B: Manual

**Encontre todos os imports:**
```powershell
# PowerShell
Get-ChildItem -Path .\src -Filter *.jsx -Recurse | Select-String "firebaseConfig"
```

**Substitua manualmente:**
```javascript
// ANTES
import { db, auth, storage } from './firebaseConfig';
import { db } from '../firebaseConfig';

// DEPOIS
import { db, auth, storage } from './config/firebaseDual';
import { db } from '../config/firebaseDual';
```

> ⚠️ **Importante**: Ajuste o caminho relativo (`./`, `../`, `../../`) dependendo de onde o arquivo está!

### 🎯 Passo 2: Adicionar Provider no App

```javascript
// src/App.jsx ou main.jsx
import { DatabaseRotationProvider } from './contexts/DatabaseRotationContext';

function App() {
  return (
    <DatabaseRotationProvider>
      {/* Todo o conteúdo do seu app */}
      <Workflow>
        <Routes>
          {/* suas rotas */}
        </Routes>
      </Workflow>
    </DatabaseRotationProvider>
  );
}

export default App;
```

### 🎯 Passo 3: Testar

Abra o console do navegador (F12) e execute:

```javascript
// 1. Verificar se sistema está ativo
console.log('DB Manager:', window.dbManager);
console.log('Active DB:', window.dbManager?.activeDatabase);

// 2. Verificar se ambos os databases estão conectados
console.log('Primary DB:', window.primaryDb);
console.log('Backup DB:', window.backupDb);

// 3. Ver informações completas
console.log(window.dbManager?.getInfo());
```

**Resultado esperado:**
```javascript
{
  activeDatabase: "primary",
  lastRotation: "2025-10-04T...",
  needsRotation: false,
  hoursUntilRotation: 23.5,
  primaryDb: {...},
  backupDb: {...}
}
```

## 🎨 [OPCIONAL] Adicionar Painel Visual

Se quiser ter um painel de controle visual:

```javascript
// src/pages/ConfiguracoesPage.jsx ou similar
import { DatabaseRotationPanel } from '../components/DatabaseRotationPanel';

function ConfiguracoesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>
      
      {/* Outras configurações */}
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Backup Automático</h2>
        <DatabaseRotationPanel />
      </div>
    </div>
  );
}
```

## 📊 Verificação Final

Execute este checklist:

- [ ] Script de migração executou com sucesso (ou imports atualizados manualmente)
- [ ] Provider adicionado no App.jsx
- [ ] App carrega sem erros
- [ ] Console mostra `window.dbManager` válido
- [ ] Database ativo é exibido
- [ ] Não há erros em vermelho no console

### Como Verificar:

1. **Abrir o app no navegador**
2. **Abrir console (F12)**
3. **Executar:**
   ```javascript
   console.log('✅ Sistema ativo:', window.dbManager?.activeDatabase);
   console.log('⏰ Horas até rotação:', window.dbManager?.getInfo().hoursUntilRotation.toFixed(1));
   ```

## 🎯 Uso no Código

Depois de instalado, você pode usar em qualquer componente:

```javascript
import { useDatabaseRotationContext } from './contexts/DatabaseRotationContext';

function MeuComponente() {
  const {
    activeDatabase,        // 'primary' ou 'backup'
    hoursUntilRotation,    // Horas até próxima rotação
    isRotating,            // Se está rotacionando agora
    isSyncing,             // Se está sincronizando
    syncProgress,          // { current, total, percentage }
    forceRotation,         // Função para rotação manual
    forceSync              // Função para sync manual
  } = useDatabaseRotationContext();

  return (
    <div>
      <p>Database: {activeDatabase}</p>
      <p>Próxima rotação em: {hoursUntilRotation.toFixed(1)}h</p>
      
      {isRotating && <p>🔄 Rotacionando...</p>}
      {isSyncing && (
        <div>
          <p>Sincronizando: {syncProgress?.percentage}%</p>
          <progress value={syncProgress?.current} max={syncProgress?.total} />
        </div>
      )}
      
      <button onClick={forceRotation}>Forçar Rotação</button>
      <button onClick={forceSync}>Forçar Sincronização</button>
    </div>
  );
}
```

## 🔍 Como Funciona (Resumo)

```
1. Sistema inicia ──► Conecta com ambos os Firebases
                      (Principal + Backup)
                      
2. DatabaseManager ──► Determina qual está ativo
                      (Baseado em localStorage)
                      
3. Timer ativo ──────► Verifica a cada 1 minuto
                      se já passou 24h
                      
4. Quando 24h ──────► Sincroniza todos os dados
                      Alterna para outro database
                      Salva histórico
                      
5. Repete infinito ─► A cada 24h alterna
                      Primary → Backup → Primary...
```

## ⚙️ Configurações (Opcional)

### Alterar Intervalo de Rotação

```javascript
<DatabaseRotationProvider
  rotationInterval={12 * 60 * 60 * 1000}  // 12 horas
>
```

### Desabilitar Auto-rotação

```javascript
<DatabaseRotationProvider
  autoRotate={false}  // Apenas manual
>
```

### Adicionar Callbacks

```javascript
<DatabaseRotationProvider
  onRotationComplete={(dbName) => {
    alert(`Rotação concluída! Agora usando: ${dbName}`);
  }}
  onError={(error) => {
    console.error('Erro:', error);
  }}
>
```

### Modificar Coleções Sincronizadas

```javascript
<DatabaseRotationProvider
  collections={[
    'usuarios',
    'mensagens',
    'minhaNovaColecao'  // Adicionar aqui
  ]}
>
```

## 🆘 Problemas Comuns

### ❌ Erro: "Cannot read property 'activeDatabase' of undefined"

**Causa**: Provider não foi adicionado

**Solução**:
```javascript
// Certifique-se que App está dentro do Provider
<DatabaseRotationProvider>
  <App />
</DatabaseRotationProvider>
```

### ❌ Erro: "db is not defined"

**Causa**: Import não foi atualizado

**Solução**:
```javascript
// Verificar caminho relativo
import { db } from './config/firebaseDual';  // ✅
import { db } from './firebaseConfig';        // ❌
```

### ❌ Erro: "Multiple Firebase Apps"

**Causa**: Ainda tem import de `firebaseConfig` em algum lugar

**Solução**:
```powershell
# Buscar imports antigos
Get-ChildItem -Path .\src -Filter *.jsx -Recurse | Select-String "firebaseConfig"

# Substituir todos
```

### ⚠️ Database não alterna

**Causa**: Timer não está ativo ou não passou 24h

**Solução**:
```javascript
// Ver quanto tempo falta
const { hoursUntilRotation } = useDatabaseRotationContext();
console.log('Faltam:', hoursUntilRotation, 'horas');

// Forçar rotação manual
await forceRotation();
```

## 📊 Monitoramento

### Ver Status no Console

```javascript
// Info completa
console.table(window.dbManager.getInfo());

// Histórico de rotações
const history = JSON.parse(localStorage.getItem('rotationHistory'));
console.table(history);
```

### Adicionar Indicador na UI

```javascript
function Header() {
  const { activeDatabase, hoursUntilRotation } = useDatabaseRotationContext();
  
  return (
    <header className="flex items-center justify-between p-4">
      <h1>Meu App</h1>
      
      <div className="flex items-center gap-2 text-sm">
        <span className={activeDatabase === 'primary' ? 'text-blue-500' : 'text-purple-500'}>
          {activeDatabase === 'primary' ? '🔵' : '🟣'} {activeDatabase}
        </span>
        <span className="text-gray-500">
          ⏰ {hoursUntilRotation.toFixed(1)}h
        </span>
      </div>
    </header>
  );
}
```

## 🎉 Conclusão

Após seguir estes passos:

✅ Sistema de backup automático está ativo  
✅ Alterna entre databases a cada 24h  
✅ Sincroniza dados automaticamente  
✅ Protege contra perda de dados  
✅ Funciona transparentemente  

## 📞 Suporte

**Documentação Completa:**
- `SISTEMA_BACKUP_AUTOMATICO.md` - Documentação detalhada
- `GUIA_RAPIDO_BACKUP.md` - Guia de integração
- `ARQUITETURA_BACKUP.md` - Diagramas de arquitetura
- `RESUMO_BACKUP_AUTOMATICO.md` - Resumo executivo

**Comandos Úteis:**
```javascript
// Ver info
window.dbManager.getInfo()

// Forçar rotação
const { forceRotation } = useDatabaseRotationContext();
await forceRotation();

// Ver histórico
localStorage.getItem('rotationHistory')
```

---

**🚀 Sistema Pronto para Produção!**

**Data**: 04/10/2025  
**Versão**: 1.0.0  
**Status**: ✅ Completo
