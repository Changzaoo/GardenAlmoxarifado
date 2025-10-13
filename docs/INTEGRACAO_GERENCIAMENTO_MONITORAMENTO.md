# Integração: Gerenciamento de Servidores ↔️ Monitoramento de Backup

## 📊 Visão Geral da Integração

Este documento explica como a aba **"Gerenciamento de Servidores"** está integrada com a seção **"Monitoramento de Backup"**.

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────┐
│  Gerenciamento de Servidores       │
│  (Interface de Administração)      │
└──────────────┬──────────────────────┘
               │
               │ localStorage.setItem('firebaseServers')
               │
               ▼
┌─────────────────────────────────────┐
│    LocalStorage                     │
│    firebaseServers: [...]           │
└──────────────┬──────────────────────┘
               │
               │ JSON.parse(localStorage.getItem())
               │
               ▼
┌─────────────────────────────────────┐
│  Monitoramento de Backup            │
│  (Exibição de Métricas)            │
└─────────────────────────────────────┘
```

## 📦 Estrutura de Dados do Servidor

Cada servidor customizado é armazenado com a seguinte estrutura:

```javascript
{
  id: "firebase-1729234567890",
  name: "WKFW",
  description: "Servidor de produção WKFW",
  config: {
    apiKey: "AIza...",
    authDomain: "wkfw-7cb4d.firebaseapp.com",
    projectId: "wkfw-7cb4d",
    storageBucket: "wkfw-7cb4d.appspot.com",
    messagingSenderId: "...",
    appId: "...",
    measurementId: "..."
  },
  createdAt: "2025-10-13T09:44:59.000Z",
  lastTested: "2025-10-13T09:44:59.000Z",
  status: "active", // ou "inactive"
  lastStatusChange: "2025-10-13T09:45:01.000Z",
  
  // Métricas (opcional, populado após testes)
  metrics: {
    read: 0,
    write: 0
  },
  
  // Info de conexão (opcional)
  connectionStatus: "Conectado", // ou "Desconectado"
  collections: 8 // número de coleções (se disponível)
}
```

## 🎯 Mapeamento: Imagem 1 → Imagem 2

### **Card de Servidor na Imagem 1:**
```
┌──────────────────────────┐
│ WKFW                  [X]│
│ Project ID: wkfw-7cb4d   │
│ Adicionado: 13/10/2025   │
│ Status: 🟢 Ativo [Toggle]│
│ Alterado em: 09:45:01    │
└──────────────────────────┘
```

### **Card de Servidor na Imagem 2:**
```
┌────────────────────────────┐
│ 💾 WKFW          [Ativo]  │
│    wkfw-7cb4d              │
├────────────────────────────┤
│ Leituras:            0     │
│ Escritas:            0     │
│ Última Operação: Nunca     │
│ Status:          ✅ Saudável│
├────────────────────────────┤
│ Adicionado: 13/10/2025     │
│ Alterado em: 09:45:01      │
├────────────────────────────┤
│    ⚡ Testar Conexão       │
└────────────────────────────┘
```

## 🔑 Campos Integrados

| Campo na Imagem 1 | Campo na Imagem 2 | Descrição |
|-------------------|-------------------|-----------|
| `name` | Título do Card | Nome do servidor |
| `config.projectId` | Subtítulo do Card | ID do projeto Firebase |
| `status` | Badge "Ativo" | Status do servidor |
| `createdAt` | "Adicionado em" | Data de criação |
| `lastStatusChange` | "Alterado em" | Última mudança de status |
| `metrics.read` | "Leituras" | Operações de leitura |
| `metrics.write` | "Escritas" | Operações de escrita |
| `lastTested` | "Última Operação" | Último teste de conexão |

## 🎨 Diferenciação Visual

### Servidores Padrão (Principal e Backup)
- **Cor:** Azul (blue-100/blue-500)
- **Badge:** "Ativo" (sempre verde)
- **Ícone:** 💾 Database azul

### Servidores Customizados
- **Cor:** Verde (green-100/green-500)
- **Badge:** "Ativo" (se status === 'active')
- **Ícone:** 💾 Database verde
- **Informações extras:** Data de adição e última alteração

## 🔄 Sincronização em Tempo Real

### Quando um servidor é adicionado:
1. ✅ Usuário preenche o formulário no modal "Adicionar Servidor"
2. ✅ Servidor é salvo no `localStorage`
3. ✅ `customServers` state é atualizado via `setCustomServers()`
4. ✅ Card aparece automaticamente na seção "Gerenciamento de Servidores"
5. ✅ Se status for "active", card aparece na seção "Monitoramento de Backup"

### Quando um servidor é ativado/desativado:
1. ✅ Usuário clica no toggle na Imagem 1
2. ✅ `toggleServerStatus()` atualiza o status
3. ✅ `localStorage` é atualizado
4. ✅ State `customServers` é atualizado
5. ✅ Card aparece/desaparece da Imagem 2 automaticamente

### Quando um servidor é removido:
1. ✅ Usuário clica no [X] na Imagem 1
2. ✅ `removeCustomServer()` remove do array
3. ✅ `localStorage` é atualizado
4. ✅ Card desaparece de ambas as seções

## 🚀 Funcionalidades Implementadas

### ✅ Na Imagem 1 (Gerenciamento)
- [x] Exibir todos os servidores (padrão + customizados)
- [x] Adicionar novos servidores
- [x] Remover servidores customizados
- [x] Ativar/desativar servidores
- [x] Mostrar informações: Project ID, data, status
- [x] Contadores: X ativos • Y total

### ✅ Na Imagem 2 (Monitoramento)
- [x] Exibir apenas servidores ativos
- [x] Mostrar métricas (leituras, escritas)
- [x] Exibir última operação
- [x] Status de saúde do servidor
- [x] Botão "Testar Conexão"
- [x] Grid responsivo (2 colunas → 3 colunas em telas grandes)
- [x] Informações adicionais (data de adição, última alteração)

## 📊 Métricas e Estatísticas

### Card "Database Ativo"
Agora mostra o pool total de servidores:
```
Database Ativo
Principal
2 servidores no pool
```

Cálculo: `2 (padrão) + customServers.filter(s => s.status === 'active').length`

## 🎯 Próximos Passos (Melhorias Futuras)

### 🔄 Teste de Conexão Real
Implementar teste real para servidores customizados:
```javascript
const testCustomServer = async (server) => {
  try {
    const app = initializeApp(server.config, server.id);
    const db = getFirestore(app);
    
    // Testar leitura
    const snapshot = await getDocs(collection(db, 'test'));
    
    // Atualizar métricas
    updateServerMetrics(server.id, {
      read: snapshot.size,
      lastTested: new Date().toISOString()
    });
    
    return { success: true, collections: snapshot.size };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### 📊 Métricas em Tempo Real
Implementar listeners para monitorar operações:
```javascript
// Escutar mudanças nas coleções
onSnapshot(collection(db, 'usuarios'), (snapshot) => {
  updateServerMetrics(serverId, {
    read: metrics.read + 1,
    collections: snapshot.docs.length
  });
});
```

### 🔄 Rotação Multi-Servidor
Incluir servidores customizados na rotação automática:
```javascript
const servers = [
  { id: 'primary', ... },
  { id: 'backup', ... },
  ...customServers.filter(s => s.status === 'active')
];

const rotateServers = () => {
  const currentIndex = servers.findIndex(s => s.id === activeServer.id);
  const nextIndex = (currentIndex + 1) % servers.length;
  switchToServer(servers[nextIndex]);
};
```

## 🐛 Troubleshooting

### Servidor não aparece na Imagem 2
**Problema:** Servidor está na Imagem 1 mas não aparece na Imagem 2

**Soluções:**
1. ✅ Verificar se o status é "active"
2. ✅ Verificar se o toggle está ligado (verde)
3. ✅ Recarregar a página (F5)
4. ✅ Verificar console do navegador por erros

### Dados não sincronizam
**Problema:** Mudanças na Imagem 1 não refletem na Imagem 2

**Soluções:**
1. ✅ Verificar `localStorage` no DevTools → Application → Local Storage
2. ✅ Checar se `loadCustomServers()` é chamado no `useEffect`
3. ✅ Confirmar que o state está sendo atualizado corretamente

### Métricas zeradas
**Problema:** Leituras e Escritas sempre em 0

**Solução:** 
- Isso é esperado! As métricas só serão populadas quando:
  1. Implementarmos o teste de conexão real
  2. Adicionarmos listeners para monitorar operações
  3. O servidor for usado para leitura/escrita real

## 📚 Referências

- `src/pages/BackupMonitoringPage.jsx` - Componente principal
- `src/components/AddFirebaseServerModal.jsx` - Modal de adicionar servidor
- `localStorage.firebaseServers` - Armazenamento de servidores
- `docs/SISTEMA_ROTACAO_SERVIDORES.md` - Documentação do sistema de rotação

---

**Última atualização:** 13 de outubro de 2025
**Status:** ✅ Integração Básica Completa
**Próximo:** Implementar métricas em tempo real
