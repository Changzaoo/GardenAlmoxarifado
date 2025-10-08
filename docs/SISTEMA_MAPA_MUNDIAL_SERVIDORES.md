# 🗺️ Sistema de Mapa Mundial de Servidores Firebase

## 📋 Visão Geral

O sistema de **Mapa Mundial de Servidores** (`ServerWorldMap.jsx`) é um componente interativo que exibe a localização geográfica precisa de todos os servidores Firebase em um mapa-múndi mundial, permitindo visualização em tempo real do status de conexão e informações detalhadas de cada servidor.

---

## 🎯 Funcionalidades Principais

### 1. **Visualização Geográfica Precisa**
- Mapa-múndi interativo com zoom e pan
- Marcadores de servidor posicionados por coordenadas GPS reais
- Reconhecimento de país, estado e cidade

### 2. **Monitoramento em Tempo Real**
- Status de conexão (Online/Offline)
- Indicador visual com cores:
  - 🟢 **Verde** = Servidor ativo e funcionando
  - 🔴 **Vermelho** = Servidor inativo ou com problemas
- Animação de pulso em servidores ativos

### 3. **Interatividade**
- **Hover**: Exibe tooltip com informações rápidas
- **Clique**: Abre modal detalhado com todas informações do servidor
- **Zoom**: Botões de zoom in/out e reset
- **Pan**: Arraste para navegar pelo mapa

---

## 🗂️ Estrutura do Componente

### **Localização do Arquivo**
```
src/components/ServerWorldMap.jsx
```

### **Dependências**
```javascript
import { motion, AnimatePresence } from 'framer-motion';        // Animações
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'; // Zoom/Pan
import { useServerManagement } from '../hooks/useServerManagement';  // Gerenciamento
import { useAllServersConnection } from '../hooks/useServerConnection'; // Status conexão
```

---

## 📍 Sistema de Coordenadas GPS

### **Mapeamento de Regiões Firebase**

O componente usa um objeto `FIREBASE_REGIONS` que mapeia cada região do Firebase para coordenadas GPS precisas:

```javascript
const FIREBASE_REGIONS = {
  // Exemplo: Brasil
  'southamerica-east1': { 
    coords: [-46.6333, -23.5505],           // Longitude, Latitude
    name: 'Osasco, São Paulo',              // Cidade
    state: 'São Paulo',                     // Estado
    country: 'Brasil',                      // País
    flag: '🇧🇷'                              // Bandeira
  },
  
  // Exemplo: EUA
  'us-central1': { 
    coords: [-93.6250, 41.2619], 
    name: 'Council Bluffs, Iowa',
    state: 'Iowa',
    country: 'EUA',
    flag: '🇺🇸'
  },
  
  // ... mais 60+ regiões mapeadas
};
```

### **Cobertura Global**
- 🇺🇸 **Estados Unidos**: 8 regiões (us-central1, us-east1, us-west1, etc.)
- 🇧🇷 **América do Sul**: 2 regiões (Brasil e Chile)
- 🇪🇺 **Europa**: 12 regiões (Alemanha, França, UK, etc.)
- 🇨🇦 **Canadá**: 2 regiões (Montreal e Toronto)
- 🇯🇵 **Ásia**: 10 regiões (Japão, Índia, Singapura, etc.)
- 🇦🇺 **Oceania**: 2 regiões (Sydney e Melbourne)
- 🌍 **África e Oriente Médio**: 3 regiões

---

## 🎨 Design e Cores (ATUALIZADO)

### **Esquema de Cores Azul**

Todas as cores roxas foram substituídas pelo padrão azul do sistema:

```css
/* Header - Gradiente Azul */
from-blue-600 via-blue-700 to-blue-800

/* Botões de Controle */
border-blue-500 text-blue-600 dark:text-blue-400

/* Card de Localização */
from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20
text-blue-600 dark:text-blue-400

/* Marcadores no Mapa */
- Servidor Online: Verde (#10b981)
- Servidor Offline: Vermelho (#ef4444)
- Borda: Azul (#3b82f6)
```

### **Elementos Visuais**
- ✅ Gradientes azuis no header
- ✅ Botões com borda azul
- ✅ Cards de informação com fundo azul claro
- ✅ Textos destacados em azul
- ✅ Suporte total a dark mode

---

## 🔧 Como Funciona Tecnicamente

### **1. Conversão de Coordenadas**

O sistema converte coordenadas GPS reais (longitude/latitude) para coordenadas do SVG:

```javascript
// Função de conversão
const convertCoordinates = (coords) => {
  const [lon, lat] = coords;
  
  // Normaliza para escala SVG (0-360, 0-180)
  const x = ((lon + 180) / 360) * 360;
  const y = ((90 - lat) / 180) * 180;
  
  return { x, y };
};
```

**Exemplo prático:**
- Coordenadas GPS do Brasil: `[-46.6333, -23.5505]`
- Conversão: `{ x: 133.37, y: 113.55 }`
- Resultado: Marcador aparece exatamente sobre São Paulo no mapa

### **2. Renderização de Marcadores**

Cada servidor é renderizado como um grupo SVG:

```jsx
<g className="server-marker pointer-events-auto">
  {/* Círculo de pulso (se ativo) */}
  {isActive && (
    <circle 
      cx={x} 
      cy={y} 
      r="3"
      className="animate-ping"
      fill="url(#pulse-gradient)"
    />
  )}
  
  {/* Marcador principal */}
  <circle
    cx={x}
    cy={y}
    r="2.5"
    fill={isOnline ? "#10b981" : "#ef4444"}  // Verde ou Vermelho
    stroke="#3b82f6"                          // Borda azul
    strokeWidth="0.5"
    filter="url(#server-glow)"
  />
</g>
```

### **3. Modal de Detalhes**

Ao clicar em um servidor, abre um modal com:

```jsx
<AnimatePresence>
  {selectedServer && (
    <motion.div className="modal-overlay">
      {/* Informações do Servidor */}
      - Nome e região
      - Status de conexão
      - Última verificação
      - Localização precisa (país, estado, cidade)
      - Coordenadas GPS
      - Bandeira do país
    </motion.div>
  )}
</AnimatePresence>
```

---

## 📊 Dados Exibidos

### **No Header**
- Total de servidores monitorados
- Contador de servidores ativos (verde)
- Contador de servidores inativos (vermelho)

### **No Tooltip (Hover)**
- Nome do servidor
- Status (Online/Offline)
- Localização básica

### **No Modal (Clique)**
- ✅ Nome completo do servidor
- ✅ Status detalhado de conexão
- ✅ Última data de teste
- ✅ Localização precisa com:
  - Bandeira do país
  - Nome da cidade
  - Estado/região
  - País
  - ID da região Firebase
  - Coordenadas GPS

---

## 🎮 Controles de Interação

### **Botões de Zoom**
```jsx
// Aumentar Zoom
<button onClick={() => zoomIn()}>
  <ZoomIn className="w-5 h-5" />
</button>

// Diminuir Zoom
<button onClick={() => zoomOut()}>
  <ZoomOut className="w-5 h-5" />
</button>

// Resetar Visualização
<button onClick={() => resetTransform()}>
  <Maximize2 className="w-5 h-5" />
</button>
```

### **Navegação**
- **Arrastar**: Clique e arraste para mover o mapa
- **Scroll**: Scroll do mouse para zoom
- **Pinch**: Gesto de pinça em dispositivos touch

---

## 🔌 Integração com Backend

### **Hook de Gerenciamento**

```javascript
const { servers, loading, recordUsage } = useServerManagement();
```

**Retorna:**
- `servers`: Array com todos os servidores cadastrados
- `loading`: Boolean indicando carregamento
- `recordUsage`: Função para registrar uso

### **Hook de Conexão**

```javascript
const connectionsStatus = useAllServersConnection(servers);
```

**Retorna:**
- Objeto com status de cada servidor
- Atualização em tempo real
- Exemplo: `{ 'server-id': { isOnline: true, lastCheck: Date } }`

### **Estrutura de um Servidor**

```javascript
{
  id: "server-123",
  name: "Servidor Principal Brasil",
  region: "southamerica-east1",
  status: "active",
  lastTested: "2025-10-08T09:23:28.000Z",
  location: {
    coords: [-46.6333, -23.5505],
    name: "Osasco, São Paulo",
    state: "São Paulo",
    country: "Brasil",
    flag: "🇧🇷",
    region: "southamerica-east1"
  }
}
```

---

## 📱 Responsividade

### **Desktop**
- Mapa em tela cheia
- Controles de zoom no canto superior direito
- Modal centralizado

### **Mobile/Tablet**
- Mapa adaptado ao tamanho da tela
- Controles responsivos
- Gestos touch para zoom e pan
- Modal em tela cheia em telas pequenas

---

## 🎯 Casos de Uso

### **1. Monitoramento de Infraestrutura**
Administradores podem visualizar rapidamente:
- Quais servidores estão online
- Distribuição geográfica da infraestrutura
- Identificar regiões com problemas

### **2. Planejamento de Expansão**
- Ver cobertura atual de servidores
- Identificar gaps geográficos
- Planejar novas regiões

### **3. Troubleshooting**
- Localizar rapidamente servidor com problema
- Ver última verificação
- Acessar detalhes técnicos

### **4. Relatórios e Dashboards**
- Visualização executiva da infraestrutura
- Status geral em tempo real
- Métricas de disponibilidade

---

## 🚀 Melhorias Implementadas

### **Versão 2.0 - Outubro 2025**

✅ **Design Modernizado**
- Substituição completa de roxo para azul
- Gradientes suaves e profissionais
- Melhor contraste em dark mode

✅ **Performance**
- Otimização de renderização SVG
- Lazy loading de imagens
- Memoização de cálculos

✅ **Acessibilidade**
- Tooltips descritivos
- Navegação por teclado
- Suporte a screen readers

✅ **Precisão Geográfica**
- Coordenadas GPS validadas
- Mapeamento completo de 60+ regiões
- Reconhecimento de estado/província

---

## 🐛 Troubleshooting

### **Servidor não aparece no mapa**

**Possíveis causas:**
1. Região não mapeada em `FIREBASE_REGIONS`
2. Coordenadas inválidas
3. Servidor sem campo `region` válido

**Solução:**
```javascript
// Adicionar região em FIREBASE_REGIONS
'nova-regiao': { 
  coords: [lon, lat],
  name: 'Nome da Cidade',
  state: 'Estado',
  country: 'País',
  flag: '🏁'
}
```

### **Mapa não carrega**

**Verificar:**
1. Conexão com internet (imagem externa)
2. Hook `useServerManagement` funcionando
3. Console do navegador para erros

### **Cores não mudaram**

**Verificar:**
1. Cache do navegador (Ctrl+Shift+R)
2. Build atualizado (`npm run build`)
3. Arquivo CSS compilado

---

## 📖 Documentação Relacionada

- `GEOLOCALIZACAO_PRECISA_SERVIDORES.md` - Detalhes técnicos do sistema
- `EXEMPLO_USO_GEOLOCALIZACAO.md` - Exemplos de implementação
- `GUIA_ADICIONAR_SERVIDORES.md` - Como adicionar novos servidores
- `COORDENADAS_SERVIDORES_FIREBASE.md` - Lista completa de coordenadas

---

## 🎨 Resumo das Mudanças de Cor

| Elemento | Antes (Roxo) | Depois (Azul) |
|----------|-------------|---------------|
| Header | `from-purple-600 to-purple-600` | `from-blue-600 to-blue-800` |
| Botão Reset | `border-purple-500 text-purple-600` | `border-blue-500 text-blue-600` |
| Card Localização | `from-purple-50 to-pink-50` | `from-blue-50 to-blue-100` |
| Texto Destaque | `text-purple-600` | `text-blue-600` |
| Dark Mode | `dark:from-purple-900/20` | `dark:from-blue-900/20` |

---

## 🔗 Links Úteis

- [React Zoom Pan Pinch](https://github.com/prc5/react-zoom-pan-pinch) - Biblioteca de zoom
- [Framer Motion](https://www.framer.com/motion/) - Animações
- [Firebase Regions](https://firebase.google.com/docs/projects/locations) - Lista oficial de regiões
- [Lucide Icons](https://lucide.dev/) - Ícones usados

---

**Última Atualização:** 08 de Outubro de 2025  
**Versão:** 2.0  
**Status:** ✅ Produção
