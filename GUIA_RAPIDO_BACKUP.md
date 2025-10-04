# ⚡ Guia Rápido de Integração - Backup Automático

## 📋 Checklist de Instalação

### ✅ Passo 1: Adicionar Provider (App.jsx ou main.jsx)

```javascript
import { DatabaseRotationProvider } from './contexts/DatabaseRotationContext';

function App() {
  return (
    <DatabaseRotationProvider>
      {/* Todo o conteúdo do app */}
      <YourAppComponents />
    </DatabaseRotationProvider>
  );
}
```

### ✅ Passo 2: Atualizar TODOS os imports do Firebase

**Encontre e substitua em TODOS os arquivos:**

```bash
# PowerShell - Buscar arquivos que importam firebase
Get-ChildItem -Path .\src -Filter *.jsx -Recurse | Select-String "from.*firebaseConfig"
```

**Antes:**
```javascript
import { db, auth, storage } from './firebaseConfig';
import { db } from '../firebaseConfig';
import { db, auth } from '../../firebaseConfig';
```

**Depois:**
```javascript
import { db, auth, storage } from './config/firebaseDual';
import { db } from '../config/firebaseDual';
import { db, auth } from '../../config/firebaseDual';
```

> **⚠️ IMPORTANTE**: Ajuste o caminho relativo dependendo de onde o arquivo está!

### ✅ Passo 3: Adicionar Painel de Controle (Opcional)

```javascript
// Em alguma página de configurações
import { DatabaseRotationPanel } from './components/DatabaseRotationPanel';

function SettingsPage() {
  return (
    <div>
      <h1>Backup e Sincronização</h1>
      <DatabaseRotationPanel />
    </div>
  );
}
```

### ✅ Passo 4: Testar

```javascript
// Abra o console do navegador e execute:
console.log('Database ativo:', window.dbManager?.activeDatabase);
```

## 🎯 Arquivos que Precisam ser Atualizados

Procure por imports de Firebase nestes arquivos típicos:

```
src/
├── components/
│   ├── Workflow.jsx              ← ATUALIZAR
│   ├── Mensagens/
│   │   └── MessageInput.jsx      ← ATUALIZAR
│   └── ...
├── contexts/
│   ├── AuthContext.jsx           ← ATUALIZAR
│   ├── MensagensContext.jsx      ← ATUALIZAR
│   └── ...
├── hooks/
│   └── useFirestore.js           ← ATUALIZAR
└── services/
    └── notificationService.js    ← ATUALIZAR
```

## 🔍 Como Encontrar Imports

### PowerShell (Windows):
```powershell
# Buscar em arquivos .jsx
Get-ChildItem -Path .\src -Filter *.jsx -Recurse | Select-String "firebaseConfig" -List

# Buscar em arquivos .js
Get-ChildItem -Path .\src -Filter *.js -Recurse | Select-String "firebaseConfig" -List
```

### Bash (Linux/Mac):
```bash
# Buscar recursivamente
grep -r "firebaseConfig" src/
```

### VS Code:
```
Ctrl+Shift+F
Buscar: firebaseConfig
Substituir: config/firebaseDual
```

## 🧪 Teste Completo

### 1. Verificar Inicialização

```javascript
// No console do navegador (F12)

// Verificar se ambos os databases estão conectados
console.log('Primary DB:', window.primaryDb);
console.log('Backup DB:', window.backupDb);

// Verificar database ativo
console.log('Active:', window.dbManager?.activeDatabase);
```

### 2. Testar Rotação Manual

```javascript
// Abrir painel de controle e clicar em "Forçar Rotação"
// Ou no console:
const rotation = useDatabaseRotationContext();
await rotation.forceRotation();
```

### 3. Verificar Sincronização

```javascript
// No console, após rotação:
const history = JSON.parse(localStorage.getItem('rotationHistory'));
console.log('Última rotação:', history[history.length - 1]);
```

## 🚨 Erros Comuns

### Erro: "Cannot read property 'activeDatabase' of undefined"

**Causa**: Provider não foi adicionado no App.jsx

**Solução**:
```javascript
// Certifique-se de envolver o app com o provider
<DatabaseRotationProvider>
  <App />
</DatabaseRotationProvider>
```

### Erro: "db is not defined"

**Causa**: Import não foi atualizado

**Solução**:
```javascript
// Verificar se o caminho está correto
import { db } from './config/firebaseDual';
// OU
import { db } from '../config/firebaseDual';
// OU
import { db } from '../../config/firebaseDual';
```

### Erro: "Multiple Firebase Apps"

**Causa**: Inicialização duplicada

**Solução**:
- Remover importações antigas de `./firebaseConfig.js`
- Usar apenas `./config/firebaseDual.js`

## ⚙️ Configuração Personalizada

### Alterar Intervalo de Rotação (12h em vez de 24h)

```javascript
<DatabaseRotationProvider
  rotationInterval={12 * 60 * 60 * 1000}
>
```

### Adicionar Mais Coleções

```javascript
<DatabaseRotationProvider
  collections={[
    'usuarios',
    'mensagens',
    'minhaNovaColecao'  // ← Adicionar aqui
  ]}
>
```

### Callbacks Customizados

```javascript
<DatabaseRotationProvider
  onRotationComplete={(toDb) => {
    alert(`Rotação concluída! Agora usando: ${toDb}`);
  }}
  onError={(error) => {
    console.error('Erro no backup:', error);
  }}
>
```

## 📊 Monitorar Status

### Adicionar Indicador na UI

```javascript
import { useDatabaseRotationContext } from './contexts/DatabaseRotationContext';

function Header() {
  const { activeDatabase, hoursUntilRotation } = useDatabaseRotationContext();
  
  return (
    <header>
      <div className="backup-status">
        <span className={activeDatabase === 'primary' ? 'blue' : 'purple'}>
          {activeDatabase === 'primary' ? '🔵' : '🟣'} {activeDatabase}
        </span>
        <span>⏰ {hoursUntilRotation.toFixed(1)}h</span>
      </div>
    </header>
  );
}
```

## 🎯 Validação Final

Execute este checklist:

- [ ] Provider adicionado no App.jsx
- [ ] Todos os imports de `firebaseConfig` substituídos por `firebaseDual`
- [ ] App carrega sem erros no console
- [ ] `console.log(window.dbManager)` retorna objeto válido
- [ ] Database ativo é exibido corretamente
- [ ] Rotação manual funciona
- [ ] Histórico é salvo no localStorage

## 📞 Suporte

Se encontrar problemas:

1. **Verificar console do navegador (F12)**
   - Procure por erros em vermelho
   - Verifique warnings em amarelo

2. **Ver logs do sistema**
   ```javascript
   console.log(window.dbManager.getInfo());
   ```

3. **Limpar cache**
   ```javascript
   localStorage.clear();
   location.reload();
   ```

---

**🚀 Sistema pronto para uso!**

Após seguir este guia, o backup automático estará ativo e alternando databases a cada 24h.
