# 🎛️ Página de Monitoramento de Backup - Guia Completo

## 📋 Visão Geral

Página completa para monitorar e controlar o sistema de backup automático do Firebase.

## ✨ Funcionalidades

### 1. 📊 Monitoramento em Tempo Real

#### Status Cards
- **Database Ativo**: Mostra qual Firebase está em uso (Principal/Backup)
- **Status de Rotação**: Indica se está rotacionando ou sincronizando
- **Próxima Rotação**: Countdown até a próxima alternância
- **Saúde do Sistema**: Status geral dos databases

#### Métricas por Database
- **Leituras**: Contador de operações de leitura
- **Escritas**: Contador de operações de escrita
- **Última Operação**: Timestamp da última atividade
- **Status**: Saudável ou com erro

### 2. 🧪 Testes de Conexão

#### Teste Completo de Database
Cada database pode ser testado individualmente:

1. **Teste de Escrita** - Cria documento de teste
2. **Teste de Leitura** - Lê documentos da coleção
3. **Teste de Atualização** - Atualiza documento
4. **Teste de Exclusão** - Remove documento de teste

**Resultado**: Tempo de cada operação + status de saúde

### 3. ⚙️ Configurações Avançadas

#### Intervalo de Rotação
- Configurável de 1 a 168 horas (1 hora a 7 dias)
- Padrão: 24 horas
- Mostra conversão para dias

#### Rotação Automática
- **Ligado**: Sistema alterna automaticamente no intervalo
- **Desligado**: Apenas rotação manual

#### Sincronização ao Rotacionar
- **Ligado**: Sincroniza dados ao alternar databases
- **Desligado**: Apenas alterna sem sincronizar

#### Notificações
- **Ligado**: Mostra notificações visuais
- **Desligado**: Modo silencioso

### 4. 🔄 Ações Manuais

#### Forçar Rotação
- Alterna imediatamente para outro database
- Sincroniza se configurado

#### Forçar Sincronização
- Sincroniza todos os dados sem alternar
- Mostra progress bar em tempo real

#### Ver Métricas Completas
- Exporta informações detalhadas para console
- Útil para debugging

### 5. 📜 Histórico de Rotações

- Lista últimas 10 rotações
- Mostra:
  - De qual database para qual
  - Data e hora
  - Se sincronizou
  - Quantos documentos foram sincronizados

## 🚀 Como Usar

### 1. Adicionar Rota

```javascript
// App.jsx ou Routes.jsx
import { BackupMonitoringPage } from './pages/BackupMonitoringPage';

<Routes>
  <Route path="/backup-monitoring" element={<BackupMonitoringPage />} />
</Routes>
```

### 2. Adicionar no Menu

```javascript
// No seu componente de menu
<Link to="/backup-monitoring">
  <Activity className="w-5 h-5" />
  Monitoramento de Backup
</Link>
```

### 3. Acessar

Navegue para `/backup-monitoring` no navegador.

## 📊 Interface

### Layout Responsivo

```
┌─────────────────────────────────────────────┐
│  🎛️ Monitoramento de Backup    [⚙️ Config] │
├─────────────────────────────────────────────┤
│ [🔵 Ativo] [🔄 Status] [⏰ Próx] [✅ Saúde]│
├─────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐│
│  │ 🔵 Primary      │  │ 🟣 Backup        ││
│  │                  │  │                  ││
│  │ Leituras: 1,234 │  │ Leituras: 567   ││
│  │ Escritas: 890   │  │ Escritas: 345   ││
│  │ Última: 10:30   │  │ Última: 09:45   ││
│  │ Status: ✅      │  │ Status: ✅      ││
│  │                  │  │                  ││
│  │ [⚡ Testar]     │  │ [⚡ Testar]     ││
│  └──────────────────┘  └──────────────────┘│
├─────────────────────────────────────────────┤
│ [🔄 Rotação] [💾 Sync] [📊 Métricas]      │
├─────────────────────────────────────────────┤
│  📜 Histórico                                │
│  • primary → backup (hoje, 10:00) ✅        │
│  • backup → primary (ontem, 10:00) ✅       │
└─────────────────────────────────────────────┘
```

## 🎨 Cores e Indicadores

### Status do Database
- 🔵 **Azul**: Firebase Principal ativo
- 🟣 **Roxo**: Firebase Backup ativo

### Status de Saúde
- ✅ **Verde**: Todos os testes passaram
- ❌ **Vermelho**: Erro detectado

### Animações
- 🔄 **Spinning**: Rotacionando ou sincronizando
- 📊 **Progress Bar**: Mostra % de sincronização
- ✨ **Fade In**: Entrada suave de elementos

## 🧪 Exemplo de Teste

### Teste Bem-Sucedido

```javascript
{
  database: 'primary',
  timestamp: '2025-10-04T15:30:00.000Z',
  success: true,
  tests: [
    { name: 'Escrita', status: 'success', time: '85.23ms' },
    { name: 'Leitura', status: 'success', time: '42.18ms' },
    { name: 'Atualização', status: 'success', time: '67.94ms' },
    { name: 'Exclusão', status: 'success', time: '53.12ms' }
  ],
  summary: 'Todos os testes passaram! Latência média: 62.12ms'
}
```

### Resultado Visual

```
✅ Todos os testes passaram! Latência média: 62.12ms

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Escrita  │ │ Leitura  │ │Atualiza. │ │ Exclusão │
│ 85.23ms  │ │ 42.18ms  │ │ 67.94ms  │ │ 53.12ms  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

## ⚙️ Painel de Configurações

### Como Abrir
Clique no botão **⚙️ Configurações** no topo direito.

### Opções Disponíveis

#### 1. Intervalo de Rotação
```
[Input numérico: 1-168 horas]
Atualmente: 24h = 1.0 dia(s)
```

#### 2. Toggles
```
Rotação Automática        [●─────] ON
Sincronização ao Rotacionar [●─────] ON
Notificações              [●─────] ON
```

#### 3. Salvar
```
[💾 Salvar Configurações]
```

> ⚠️ **Importante**: Após salvar, recarregue a página para aplicar.

## 📱 Responsividade

### Desktop (> 1024px)
- 4 cards de status em linha
- 2 databases lado a lado
- 3 botões de ação em linha

### Tablet (768px - 1024px)
- 2 cards de status por linha
- 2 databases lado a lado
- 3 botões em linha

### Mobile (< 768px)
- 1 card por linha
- 1 database por vez
- 1 botão por linha (stacked)

## 🔍 Debugging

### Ver Info Completa

```javascript
// Clique em "Ver Métricas Completas"
// Ou no console:
window.dbManager.getInfo();
```

### Output
```javascript
{
  activeDatabase: 'primary',
  lastRotation: Date,
  nextRotation: Date,
  isRotating: false,
  isSyncing: false,
  syncProgress: null,
  rotationHistory: [...],
  autoRotate: true,
  rotationInterval: 86400000,
  primaryDb: {...},
  backupDb: {...},
  activeDb: {...},
  inactiveDb: {...}
}
```

## 🎯 Casos de Uso

### 1. Verificar Saúde Diária

1. Abrir página de monitoramento
2. Verificar status cards (todos verdes?)
3. Ver última operação de cada database
4. Verificar próxima rotação

### 2. Testar Após Manutenção

1. Clicar em "Testar Conexão" no Primary
2. Aguardar resultado
3. Clicar em "Testar Conexão" no Backup
4. Verificar se ambos passaram

### 3. Alterar Intervalo de Rotação

1. Clicar em "⚙️ Configurações"
2. Alterar "Intervalo de Rotação" (ex: 12 horas)
3. Clicar em "Salvar Configurações"
4. Recarregar página

### 4. Rotação Manual Urgente

1. Verificar qual database está ativo
2. Clicar em "Forçar Rotação Agora"
3. Aguardar sincronização (se habilitada)
4. Verificar novo database ativo

### 5. Sincronizar Antes de Manutenção

1. Clicar em "Forçar Sincronização"
2. Acompanhar progress bar
3. Aguardar conclusão
4. Verificar "Histórico" para confirmar

## 🚨 Alertas e Notificações

### Database com Erro

```
┌────────────────────────────────────┐
│ ⚠️ Alerta                          │
│                                     │
│ Database Backup apresentou erro    │
│ no teste de conexão.               │
│                                     │
│ [Ver Detalhes] [Ignorar]          │
└────────────────────────────────────┘
```

### Rotação Concluída

```
┌────────────────────────────────────┐
│ ✅ Sucesso                         │
│                                     │
│ Rotação concluída!                 │
│ Agora usando: backup               │
│ 1,234 documentos sincronizados     │
│                                     │
│ [OK]                               │
└────────────────────────────────────┘
```

## 💾 Persistência de Configurações

As configurações são salvas em `localStorage`:

```javascript
{
  rotationInterval: 24,
  autoRotate: true,
  autoSync: true,
  notificationsEnabled: true
}
```

Para resetar:
```javascript
localStorage.removeItem('backupSettings');
location.reload();
```

## 🎨 Customização

### Alterar Cores

```javascript
// Cores do Primary
from-blue-500 to-blue-600    // Gradiente
bg-blue-100                  // Background claro
text-blue-600                // Texto

// Cores do Backup
from-purple-500 to-purple-600
bg-purple-100
text-purple-600
```

### Adicionar Métrica Personalizada

```javascript
// No estado de metrics
const [metrics, setMetrics] = useState({
  primary: { 
    read: 0, 
    write: 0, 
    minhaMetrica: 0  // ← Nova métrica
  },
  backup: { 
    read: 0, 
    write: 0,
    minhaMetrica: 0
  }
});

// Exibir na UI
<div className="flex items-center justify-between py-3">
  <span>Minha Métrica</span>
  <span>{metrics.primary.minhaMetrica}</span>
</div>
```

## 📊 Performance

### Métricas Esperadas

| Operação | Tempo Esperado |
|----------|----------------|
| Renderização inicial | < 500ms |
| Teste de conexão | 200-500ms |
| Atualização de métricas | < 50ms |
| Salvamento de config | < 100ms |

### Otimizações

- ✅ Animações com Framer Motion (GPU accelerated)
- ✅ Lazy loading de componentes
- ✅ Debouncing de inputs
- ✅ Memoização de cálculos pesados

## 🆘 Troubleshooting

### Métricas não atualizam

**Causa**: Timer não está ativo

**Solução**:
```javascript
// Verificar no console
console.log('Metrics:', metrics);

// Forçar atualização
window.location.reload();
```

### Teste falha sempre

**Causa**: Permissões do Firestore ou conexão

**Solução**:
1. Verificar Firestore Rules
2. Verificar conexão de internet
3. Ver erro no console (F12)

### Configurações não salvam

**Causa**: localStorage desabilitado

**Solução**:
```javascript
// Testar localStorage
try {
  localStorage.setItem('test', '1');
  console.log('✅ localStorage OK');
} catch(e) {
  console.error('❌ localStorage bloqueado');
}
```

---

**Data**: 04/10/2025  
**Versão**: 1.0.0  
**Arquivo**: `BackupMonitoringPage.jsx`
