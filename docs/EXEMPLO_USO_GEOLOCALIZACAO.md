# 🧪 Exemplo de Uso - Sistema de Geolocalização Precisa

## 📦 Importação do Componente

```jsx
import ServerWorldMap from '../components/ServerWorldMap';
```

## 🎯 Uso Básico

```jsx
<ServerWorldMap 
  servers={servidores}
/>
```

## 📋 Formato dos Dados

### Estrutura de um Servidor

```javascript
{
  id: 'identificador-unico',
  name: 'Nome do Servidor',
  status: 'active' | 'inactive',
  description: 'Descrição opcional',
  config: {
    projectId: 'seu-projeto',
    authDomain: 'seu-projeto.firebaseapp.com',
    storageBucket: 'seu-projeto.appspot.com',
    appId: '1:123456789:web:abcdef'
  }
}
```

## 🌍 Exemplo Completo com Múltiplas Regiões

### Servidores nos EUA (diferentes estados)

```jsx
const servidoresEUA = [
  {
    id: 'us-iowa',
    name: 'Servidor Iowa',
    status: 'active',
    description: 'Data center principal nos EUA',
    config: {
      projectId: 'meu-projeto-us-central1',
      authDomain: 'meu-projeto.firebaseapp.com',
      storageBucket: 'meu-projeto.appspot.com',
      appId: '1:123456789:web:abc123'
    }
  },
  {
    id: 'us-south-carolina',
    name: 'Servidor Carolina do Sul',
    status: 'active',
    description: 'Backup East Coast',
    config: {
      projectId: 'meu-projeto-us-east1',
      authDomain: 'meu-projeto-east.firebaseapp.com',
      storageBucket: 'meu-projeto-east.appspot.com',
      appId: '1:987654321:web:def456'
    }
  },
  {
    id: 'us-oregon',
    name: 'Servidor Oregon',
    status: 'active',
    description: 'West Coast principal',
    config: {
      projectId: 'meu-projeto-us-west1',
      authDomain: 'meu-projeto-west.firebaseapp.com',
      storageBucket: 'meu-projeto-west.appspot.com',
      appId: '1:555666777:web:ghi789'
    }
  }
];
```

**Resultado no Mapa:**
- ✅ Iowa aparece no centro-norte dos EUA
- ✅ Carolina do Sul aparece no sudeste
- ✅ Oregon aparece no noroeste
- ✅ Tooltips mostram estado específico de cada servidor

---

### Servidores Globais (múltiplos países)

```jsx
const servidoresGlobais = [
  // América do Norte
  {
    id: 'us-central',
    name: 'US Central',
    status: 'active',
    config: {
      projectId: 'projeto-us-central1',
      authDomain: 'projeto.firebaseapp.com',
      storageBucket: 'projeto.appspot.com',
      appId: '1:111:web:aaa'
    }
  },
  
  // América do Sul
  {
    id: 'brazil',
    name: 'Brasil São Paulo',
    status: 'active',
    config: {
      projectId: 'projeto-southamerica-east1',
      authDomain: 'projeto-br.firebaseapp.com',
      storageBucket: 'projeto-br.appspot.com',
      appId: '1:222:web:bbb'
    }
  },
  
  // Europa
  {
    id: 'europe-belgium',
    name: 'Europa Bélgica',
    status: 'active',
    config: {
      projectId: 'projeto-europe-west1',
      authDomain: 'projeto-eu.firebaseapp.com',
      storageBucket: 'projeto-eu.appspot.com',
      appId: '1:333:web:ccc'
    }
  },
  
  // Ásia
  {
    id: 'asia-tokyo',
    name: 'Ásia Tóquio',
    status: 'active',
    config: {
      projectId: 'projeto-asia-northeast1',
      authDomain: 'projeto-asia.firebaseapp.com',
      storageBucket: 'projeto-asia.appspot.com',
      appId: '1:444:web:ddd'
    }
  },
  
  // Austrália
  {
    id: 'australia-sydney',
    name: 'Austrália Sydney',
    status: 'active',
    config: {
      projectId: 'projeto-australia-southeast1',
      authDomain: 'projeto-au.firebaseapp.com',
      storageBucket: 'projeto-au.appspot.com',
      appId: '1:555:web:eee'
    }
  }
];
```

**Resultado no Mapa:**
- ✅ 5 continentes representados
- ✅ Cada servidor na posição exata do estado/região
- ✅ Tooltips com país, estado e bandeira

---

## 🎨 Exemplo Completo em Página

### BackupMonitoringPage.jsx

```jsx
import React, { useState, useEffect } from 'react';
import ServerWorldMap from '../components/ServerWorldMap';

const BackupMonitoringPage = () => {
  const [servers, setServers] = useState([]);
  
  useEffect(() => {
    // Carregar servidores do Firebase ou API
    const loadServers = async () => {
      const servidores = [
        {
          id: 'primary',
          name: 'Firebase Principal',
          status: 'active',
          description: 'Servidor principal em Iowa',
          config: {
            projectId: 'workflow-us-central1',
            authDomain: 'workflow.firebaseapp.com',
            storageBucket: 'workflow.appspot.com',
            appId: '1:123456789:web:abcdef'
          }
        },
        {
          id: 'backup-brazil',
          name: 'Backup Brasil',
          status: 'active',
          description: 'Servidor de backup em São Paulo',
          config: {
            projectId: 'workflow-southamerica-east1',
            authDomain: 'workflow-br.firebaseapp.com',
            storageBucket: 'workflow-br.appspot.com',
            appId: '1:987654321:web:ghijkl'
          }
        }
      ];
      
      setServers(servidores);
    };
    
    loadServers();
  }, []);
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Monitoramento de Servidores
      </h1>
      
      {/* Mapa com servidores */}
      <ServerWorldMap servers={servers} />
      
      {/* Outras informações */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {servers.map(server => (
          <div key={server.id} className="bg-white rounded-lg p-4 shadow">
            <h3 className="font-bold">{server.name}</h3>
            <p className="text-sm text-gray-600">{server.description}</p>
            <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
              server.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {server.status === 'active' ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BackupMonitoringPage;
```

---

## 🔍 Detecção Automática de Região

### Como Funciona

O componente detecta automaticamente a região com base no `projectId` ou `authDomain`:

```javascript
// ✅ Detecta us-central1 (Iowa)
projectId: 'meu-projeto-us-central1'
authDomain: 'meu-projeto.us-central1.firebaseapp.com'

// ✅ Detecta southamerica-east1 (São Paulo)
projectId: 'meu-projeto-southamerica-east1'
authDomain: 'meu-projeto.southamerica-east1.firebaseapp.com'

// ✅ Detecta europe-west1 (Bélgica)
projectId: 'meu-projeto-europe-west1'
authDomain: 'meu-projeto.europe-west1.firebaseapp.com'
```

### Padrões Reconhecidos

| Região Firebase | Padrão no ProjectId/AuthDomain | Localização |
|-----------------|--------------------------------|-------------|
| us-central1 | `us-central1` | Iowa, EUA 🇺🇸 |
| us-east1 | `us-east1` | Carolina do Sul, EUA 🇺🇸 |
| us-west1 | `us-west1` | Oregon, EUA 🇺🇸 |
| southamerica-east1 | `southamerica-east1` | São Paulo, Brasil 🇧🇷 |
| europe-west1 | `europe-west1` | Bélgica 🇧🇪 |
| asia-northeast1 | `asia-northeast1` | Tóquio, Japão 🇯🇵 |

---

## 🎯 Exemplo: Sistema Multi-Banco

### Cenário: 3 Bancos de Dados Firebase

```jsx
const App = () => {
  const [servidores, setServidores] = useState([
    {
      id: 'banco-producao',
      name: '🔴 Produção',
      status: 'active',
      description: 'Banco principal de produção',
      config: {
        projectId: 'workflow-prod-us-central1',
        authDomain: 'workflow-prod.firebaseapp.com',
        storageBucket: 'workflow-prod.appspot.com',
        appId: '1:111111111:web:prod123'
      }
    },
    {
      id: 'banco-staging',
      name: '🟡 Staging',
      status: 'active',
      description: 'Ambiente de testes',
      config: {
        projectId: 'workflow-staging-us-east1',
        authDomain: 'workflow-staging.firebaseapp.com',
        storageBucket: 'workflow-staging.appspot.com',
        appId: '1:222222222:web:stag456'
      }
    },
    {
      id: 'banco-dev',
      name: '🟢 Desenvolvimento',
      status: 'active',
      description: 'Ambiente de desenvolvimento',
      config: {
        projectId: 'workflow-dev-us-west1',
        authDomain: 'workflow-dev.firebaseapp.com',
        storageBucket: 'workflow-dev.appspot.com',
        appId: '1:333333333:web:dev789'
      }
    }
  ]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">
        Sistema Multi-Banco
      </h1>
      
      {/* Mapa mostrando os 3 servidores em diferentes estados dos EUA */}
      <ServerWorldMap servers={servidores} />
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Status dos Ambientes</h2>
        <div className="grid grid-cols-3 gap-4">
          {servidores.map(server => (
            <div 
              key={server.id} 
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <h3 className="text-xl font-bold mb-2">{server.name}</h3>
              <p className="text-gray-600 mb-4">{server.description}</p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Online</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

**Resultado:**
- ✅ Produção em Iowa (centro)
- ✅ Staging em Carolina do Sul (leste)
- ✅ Dev em Oregon (oeste)
- ✅ Visualização geográfica da distribuição

---

## 🚀 Dicas Avançadas

### 1. Status Dinâmico

```jsx
const checkServerStatus = async (server) => {
  try {
    // Verificar conexão com Firebase
    await fetch(`https://${server.config.authDomain}/__/auth/iframe`);
    return 'active';
  } catch {
    return 'inactive';
  }
};

// Atualizar status a cada 30 segundos
useEffect(() => {
  const interval = setInterval(async () => {
    const updatedServers = await Promise.all(
      servers.map(async server => ({
        ...server,
        status: await checkServerStatus(server)
      }))
    );
    setServers(updatedServers);
  }, 30000);

  return () => clearInterval(interval);
}, [servers]);
```

### 2. Notificações de Status

```jsx
useEffect(() => {
  servers.forEach(server => {
    if (server.status === 'inactive') {
      // Mostrar notificação
      toast.error(`Servidor ${server.name} está offline!`);
    }
  });
}, [servers]);
```

### 3. Filtros por Região

```jsx
const [filtroRegiao, setFiltroRegiao] = useState('all');

const servidoresFiltrados = servers.filter(server => {
  if (filtroRegiao === 'all') return true;
  
  const regiao = detectRegion(server);
  return regiao.country === filtroRegiao;
});

<ServerWorldMap servers={servidoresFiltrados} />
```

---

## 📊 Resultado Final

Com este sistema, você tem:

✅ **Mapa interativo** com todos os servidores  
✅ **Posicionamento preciso** por estado/região  
✅ **Tooltips informativos** com país, estado e bandeira  
✅ **Detecção automática** de região  
✅ **Animações suaves** e design moderno  
✅ **Status em tempo real** (ativo/inativo)  

**Cada servidor aparece EXATAMENTE onde ele está localizado geograficamente!** 🎯
