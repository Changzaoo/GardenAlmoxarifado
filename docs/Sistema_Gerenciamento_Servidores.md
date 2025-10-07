# 🗺️ Sistema de Gerenciamento de Servidores

## 📋 Visão Geral

Sistema completo de gerenciamento e visualização de servidores Firebase com:
- ✅ Visualização em mapa-múndi interativo
- ✅ Gerenciamento completo de servidores (CRUD)
- ✅ Sistema automático de rotação de backup
- ✅ Análise de uso por período (dia/semana/mês)
- ✅ Estatísticas em tempo real
- ✅ Adição dinâmica de servidores que aparecem automaticamente no mapa

## 🎯 Funcionalidades Principais

### 1. **Servidores Padrão**
O sistema inicia com **3 servidores pré-configurados**:
- 🇧🇷 **Servidor Principal Brasil** (São Paulo)
- 🇺🇸 **Servidor Backup EUA** (Iowa)
- 🇧🇪 **Servidor Europa** (Bélgica)

### 2. **Visualização em Mapa**
- Mapa-múndi interativo com marcadores de servidores
- Coordenadas geográficas precisas
- Animações de pulso para servidores ativos
- Tooltips com informações detalhadas
- Modal com estatísticas completas

### 3. **Gerenciamento de Servidores**
- ➕ **Adicionar** novos servidores com localização customizada
- ✏️ **Editar** configurações de servidores existentes
- 🗑️ **Remover** servidores
- 📊 **Visualizar** estatísticas detalhadas

### 4. **Sistema de Rotação de Backup**
- Rotação automática entre servidores a cada 1 minuto
- Prioriza servidor com backup mais antigo
- Exibe servidor atual e próximo na fila
- Ordem de rotação visível

### 5. **Análise de Uso por Período**
- 📅 **Hoje**: Requisições nas últimas 24 horas
- 📆 **Semana**: Requisições nos últimos 7 dias
- 📈 **Mês**: Requisições nos últimos 30 dias

### 6. **Estatísticas por Servidor**
- **Uso**: Número de requisições no período
- **Tempo de Resposta**: Média em milissegundos
- **Uptime**: Porcentagem de disponibilidade
- **Carga Atual**: Percentual de uso
- **Último Backup**: Data e hora

## 🏗️ Arquitetura

### **Estrutura de Arquivos**

```
src/
├── hooks/
│   └── useServerManagement.js       # Hook principal de gerenciamento
├── components/
│   ├── ServerWorldMap.jsx           # Mapa interativo
│   ├── ServerManagement.jsx         # Interface de gerenciamento
│   └── InitializeServersButton.jsx  # Botão de inicialização
├── pages/
│   └── ServidoresPage.jsx           # Página principal
└── scripts/
    └── initializeServers.js         # Script de inicialização
```

### **Estrutura do Firestore**

```javascript
servers/
  {serverId}/
    name: string              // Nome do servidor
    region: string            // Região (ex: us-central1)
    latitude: number          // Latitude (-90 a 90)
    longitude: number         // Longitude (-180 a 180)
    status: 'active' | 'inactive'
    type: 'primary' | 'backup' | 'testing'
    capacity: number          // Capacidade máxima
    currentLoad: number       // Carga atual (0-100%)
    country: string           // País
    flag: string              // Emoji da bandeira
    createdAt: timestamp      // Data de criação
    lastBackup: timestamp     // Último backup
    lastUsed: timestamp       // Último uso
    backupCount: number       // Número de backups realizados
    downtime: number          // Tempo de inatividade (ms)
    usage: [                  // Histórico de uso
      {
        timestamp: timestamp,
        responseTime: number,
        load: number
      }
    ]
    config: {
      autoBackup: boolean,
      backupInterval: number,
      maxConnections: number
    }
```

## 🚀 Como Usar

### **1. Inicialização**

#### Opção A: Via Interface (Recomendado)
1. Acesse a página de Servidores
2. Clique em "Inicializar 3 Servidores Padrão"
3. Aguarde confirmação de sucesso

#### Opção B: Via Script
```javascript
import { initializeDefaultServers } from './scripts/initializeServers';

await initializeDefaultServers();
```

### **2. Visualizar Servidores**

```jsx
import ServidoresPage from './pages/ServidoresPage';

// Renderizar página completa
<ServidoresPage />
```

Ou componentes individuais:

```jsx
import ServerWorldMap from './components/ServerWorldMap';
import ServerManagement from './components/ServerManagement';

// Apenas mapa
<ServerWorldMap />

// Apenas gerenciamento
<ServerManagement />
```

### **3. Adicionar Servidor Personalizado**

```javascript
import { useServerManagement } from './hooks/useServerManagement';

const { addServer } = useServerManagement();

await addServer({
  name: 'Servidor Ásia',
  region: 'asia-southeast1',
  latitude: 1.3521,
  longitude: 103.8198,
  type: 'primary',
  capacity: 100,
  country: 'Singapura',
  flag: '🇸🇬'
});
```

### **4. Registrar Uso do Servidor**

```javascript
const { recordUsage } = useServerManagement();

// Registrar requisição com tempo de resposta
await recordUsage('serverId', 45); // 45ms
```

### **5. Obter Servidor com Menor Carga**

```javascript
const { getLeastUsedServer } = useServerManagement();

const bestServer = getLeastUsedServer();
console.log(`Usar servidor: ${bestServer.name}`);
```

## 📊 Exemplos de Integração

### **Backup Automático**

O sistema já possui rotação automática, mas você pode forçar um backup:

```javascript
import { useServerManagement } from './hooks/useServerManagement';

const { updateServer } = useServerManagement();

// Forçar backup em servidor específico
await updateServer('serverId', {
  lastBackup: new Date()
});
```

### **Monitorar Status em Tempo Real**

```javascript
const { servers, backupRotation, usageStats } = useServerManagement();

// Servidores ativos
const activeServers = servers.filter(s => s.status === 'active');

// Servidor em backup agora
const currentBackup = backupRotation?.current;

// Uso do servidor na semana
const weeklyUsage = usageStats['serverId']?.week || 0;
```

### **Balanceamento de Carga**

```javascript
const { servers, recordUsage } = useServerManagement();

// Função para escolher melhor servidor
const getBestServer = () => {
  return servers
    .filter(s => s.status === 'active')
    .sort((a, b) => (a.currentLoad || 0) - (b.currentLoad || 0))[0];
};

// Usar servidor
const server = getBestServer();
const startTime = Date.now();

// ... fazer requisição ...

const responseTime = Date.now() - startTime;
await recordUsage(server.id, responseTime);
```

## 🎨 Personalização

### **Alterar Intervalo de Backup**

```javascript
// Em useServerManagement.js, linha ~73
const interval = setInterval(() => {
  const serverToBackup = rotateBackup();
  if (serverToBackup) {
    performBackup(serverToBackup.id);
  }
}, 60000); // ← Alterar aqui (em milissegundos)
```

### **Alterar Número de Registros de Uso Mantidos**

```javascript
// Em useServerManagement.js, função recordUsage
if (usage.length > 1000) { // ← Alterar aqui
  usage.shift();
}
```

### **Customizar Cores do Mapa**

```jsx
// Em ServerWorldMap.jsx
<div className="bg-gradient-to-r from-blue-600 to-purple-600">
  {/* ← Alterar gradiente aqui */}
</div>
```

## 🔐 Regras de Segurança Firestore

Adicione ao `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Servidores - apenas admins podem modificar
    match /servers/{serverId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/funcionarios/$(request.auth.uid)).data.nivel == 'admin';
    }
  }
}
```

## 📱 Responsividade

O sistema é totalmente responsivo:
- 📱 **Mobile**: Layout em coluna única
- 💻 **Tablet**: Grid 2 colunas
- 🖥️ **Desktop**: Grid 3 colunas

## 🎯 Próximos Passos

1. ✅ Sistema completo implementado
2. ✅ 3 servidores padrão configurados
3. ✅ Rotação de backup automática
4. ✅ Análise de uso por período
5. ✅ Adição dinâmica de servidores

## 🐛 Troubleshooting

### **Servidores não aparecem no mapa**
- Verifique se os servidores foram inicializados
- Confirme as coordenadas latitude/longitude
- Certifique-se de que o Firestore está conectado

### **Rotação de backup não funciona**
- Verifique console para erros
- Confirme que há pelo menos 1 servidor ativo
- Verifique permissões do Firestore

### **Estatísticas não atualizam**
- Verifique se `recordUsage` está sendo chamado
- Confirme timestamps corretos no array `usage`
- Limpe cache do navegador

## 📝 Licença

Sistema desenvolvido para WorkFlow Garden Almoxarifado.
