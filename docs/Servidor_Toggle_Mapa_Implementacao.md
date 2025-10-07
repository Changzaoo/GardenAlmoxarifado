# 🗺️ Implementação: Toggle de Servidores + Mapa Mundi

**Data:** 06/10/2025  
**Funcionalidades:** Toggle de ativação de servidores + Mapa mundi interativo

---

## ✅ Funcionalidades Implementadas

### 1. 🔄 Toggle de Ativação/Desativação de Servidores

#### **Localização:** `BackupMonitoringPage.jsx` (Linhas 386-400)

#### **Como Funciona:**
- Cada servidor customizado possui um **toggle switch** (botão deslizante)
- Estados possíveis: `'active'` (ativo) ou `'inactive'` (inativo)
- Ao clicar, o status é alternado instantaneamente
- Notificação toast aparece confirmando a ação
- Status é salvo no **localStorage** para persistência

#### **Código da Função:**
```javascript
const toggleServerStatus = (serverId) => {
  const updatedServers = customServers.map(server => {
    if (server.id === serverId) {
      const newStatus = server.status === 'active' ? 'inactive' : 'active';
      toast.info(`🔄 Servidor ${server.name} ${newStatus === 'active' ? 'ativado' : 'desativado'}`, {
        position: 'top-right',
        autoClose: 2000
      });
      return { ...server, status: newStatus, lastStatusChange: new Date().toISOString() };
    }
    return server;
  });
  setCustomServers(updatedServers);
  localStorage.setItem('firebaseServers', JSON.stringify(updatedServers));
};
```

#### **Interface do Toggle:**

**Servidor Ativo (Verde):**
```jsx
<button className="bg-green-500">
  <div className="translate-x-6" /> {/* Bolinha à direita */}
</button>
```

**Servidor Inativo (Cinza):**
```jsx
<button className="bg-gray-300">
  <div className="translate-x-0" /> {/* Bolinha à esquerda */}
</button>
```

#### **Visual:**
- ✅ **Ativo:** Fundo verde, bolinha à direita, ícone CheckCircle
- ⭕ **Inativo:** Fundo cinza, bolinha à esquerda, ícone XCircle
- **Timestamp:** Mostra quando o status foi alterado pela última vez

---

### 2. 🗺️ Mapa Mundi Interativo de Servidores

#### **Componente:** `ServerWorldMap.jsx`

#### **Recursos Implementados:**

##### **A. Mapeamento Geográfico Completo**
- **45+ regiões Firebase** com coordenadas precisas
- Cobertura global: América do Norte, América do Sul, Europa, Ásia, Oceania, África, Oriente Médio

**Regiões Mapeadas:**
```javascript
// Exemplo de regiões
'us-central1': { coords: [-95.7129, 37.0902], name: 'Iowa, EUA', flag: '🇺🇸' }
'southamerica-east1': { coords: [-46.6333, -23.5505], name: 'São Paulo, Brasil', flag: '🇧🇷' }
'europe-west3': { coords: [8.6821, 50.1109], name: 'Frankfurt, Alemanha', flag: '🇩🇪' }
'asia-northeast1': { coords: [139.6917, 35.6762], name: 'Tóquio, Japão', flag: '🇯🇵' }
'australia-southeast1': { coords: [151.2093, -33.8688], name: 'Sydney, Austrália', flag: '🇦🇺' }
```

##### **B. Markers Interativos**
- **Pins animados** que aparecem na localização geográfica de cada servidor
- **Cores por status:**
  - 🟢 **Verde:** Servidores ativos
  - ⚫ **Cinza:** Servidores inativos
- **Animação hover:** Pin aumenta 30% ao passar o mouse
- **Tooltip:** Mostra nome do servidor e localização ao passar o mouse

##### **C. Modal de Detalhes Completo**
Ao clicar em um marker, abre modal com:
- 📊 Status atual (ativo/inativo)
- 📝 Descrição do servidor
- 🔐 Configurações Firebase:
  - Project ID
  - Auth Domain
  - Storage Bucket
  - App ID
- 📅 Data de criação
- 🧪 Data do último teste
- 📍 Localização detectada automaticamente

##### **D. Controles de Zoom**
- Botões **+** e **-** no header
- Zoom de **1x a 4x**
- Pan (arrastar) para navegar pelo mapa

##### **E. Dashboard Visual**
- **Contador de servidores:** Total de ativos/inativos no topo direito
- **Legenda:** Explicação das cores no canto inferior esquerdo

---

## 🎨 Design e UX

### **Cores e Tema:**
```css
/* Mapa */
- Países: Cinza claro (#E5E7EB)
- Bordas: Cinza médio (#9CA3AF)
- Hover: Cinza mais escuro (#D1D5DB)

/* Markers */
- Ativo: Verde (#10b981)
- Inativo: Cinza (#6b7280)
- Borda: Branco (#fff)

/* Modal */
- Header: Gradiente azul-indigo
- Background: Branco (light) / Cinza escuro (dark)
- Cards: Cinza claro com cantos arredondados
```

### **Animações:**
- **Entrada dos markers:** Fade in + slide up
- **Hover:** Scale 1.3x com transição suave
- **Modal:** Scale 0.9 → 1.0 com fade in
- **Toggle:** Transição suave da bolinha (300ms)

---

## 🔧 Integração no BackupMonitoringPage

### **Import:**
```javascript
import ServerWorldMap from '../components/ServerWorldMap';
```

### **Uso:**
```jsx
<ServerWorldMap 
  servers={[
    // Servidores padrão
    {
      id: 'primary',
      name: 'Firebase Principal',
      status: 'active',
      config: { projectId: 'garden-c0b50', ... }
    },
    // Servidores customizados
    ...customServers
  ]}
/>
```

### **Localização na Página:**
- Após a seção de **Servidores Customizados**
- Antes dos modais (AddFirebaseServerModal, DocumentViewerModal)

---

## 📊 Detecção Automática de Região

### **Algoritmo:**
```javascript
const detectRegion = (server) => {
  const projectId = server.config?.projectId || '';
  const authDomain = server.config?.authDomain || '';
  
  // Procurar região no authDomain ou projectId
  for (const [region, data] of Object.entries(FIREBASE_REGIONS)) {
    if (authDomain.includes(region) || projectId.includes(region)) {
      return { region, ...data };
    }
  }
  
  // Default: us-central1
  return { region: 'us-central1', ...FIREBASE_REGIONS['us-central1'] };
};
```

### **Exemplos de Detecção:**
```
authDomain: "garden-us-west1.firebaseapp.com" → Detecta: Oregon, EUA 🇺🇸
authDomain: "garden-europe-west3.firebaseapp.com" → Detecta: Frankfurt, Alemanha 🇩🇪
authDomain: "garden-asia-east1.firebaseapp.com" → Detecta: Taiwan 🇹🇼
authDomain: "garden-southamerica-east1.firebaseapp.com" → Detecta: São Paulo, Brasil 🇧🇷
```

---

## 🗂️ Estrutura de Dados

### **Servidor Customizado:**
```javascript
{
  id: 'unique-id',
  name: 'Nome do Servidor',
  status: 'active' | 'inactive',
  config: {
    projectId: 'firebase-project-id',
    authDomain: 'project.firebaseapp.com',
    storageBucket: 'project.appspot.com',
    appId: '1:123456:web:abc123'
  },
  description: 'Descrição opcional',
  createdAt: '2025-10-06T12:00:00Z',
  lastTested: '2025-10-06T15:30:00Z',
  lastStatusChange: '2025-10-06T16:00:00Z' // Adicionado ao alternar
}
```

### **LocalStorage:**
```javascript
// Chave: 'firebaseServers'
// Valor: Array de servidores em JSON
localStorage.setItem('firebaseServers', JSON.stringify(customServers));
```

---

## 🎯 Casos de Uso

### **1. Adicionar Servidor**
1. Clicar em **"+ Adicionar Servidor"**
2. Preencher configurações Firebase
3. Testar conexão
4. Salvar
5. Servidor aparece **inativo** por padrão

### **2. Ativar Servidor**
1. Localizar servidor na lista
2. Clicar no **toggle switch**
3. Servidor muda para **verde** (ativo)
4. Toast confirma: "🔄 Servidor X ativado"
5. Marker no mapa muda para **verde**

### **3. Visualizar no Mapa**
1. Scroll até a seção do mapa
2. Encontrar marker do servidor (cor indica status)
3. **Hover:** Ver tooltip com nome e localização
4. **Click:** Abrir modal com detalhes completos

### **4. Gerenciar Status**
1. Servidor pode ser ativado/desativado **a qualquer momento**
2. Status persiste no localStorage
3. Status é exibido em **3 lugares:**
   - Card do servidor (lista)
   - Contador de ativos/inativos
   - Marker no mapa

---

## 🔍 Recursos Visuais

### **Toggle Switch:**
```
[ ⚫️     ] Inativo (cinza)
[     ⚫️ ] Ativo (verde)
```

### **Marker no Mapa:**
```
📍 (Verde) = Ativo
📍 (Cinza) = Inativo
```

### **Contador:**
```
✅ 3 Ativos | ❌ 1 Inativo
```

---

## 🚀 Melhorias Futuras

### **Possíveis Expansões:**
- [ ] **Filtro no mapa:** Mostrar apenas ativos ou inativos
- [ ] **Linhas de conexão:** Conectar servidores relacionados
- [ ] **Heatmap:** Mostrar intensidade de uso por região
- [ ] **Métricas em tempo real:** Latência, uptime, requisições/s
- [ ] **Alertas geográficos:** Notificar quando servidor em região específica cai
- [ ] **Multi-seleção:** Ativar/desativar múltiplos servidores de uma vez
- [ ] **Histórico de status:** Gráfico de ativações/desativações ao longo do tempo

---

## 📝 Notas Técnicas

### **Bibliotecas Utilizadas:**
- **react-simple-maps:** Renderização do mapa e marcadores
- **framer-motion:** Animações suaves
- **lucide-react:** Ícones modernos
- **react-toastify:** Notificações toast

### **Arquivo TopoJSON:**
```javascript
const geoUrl = 'https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json';
```

### **Projeção do Mapa:**
```javascript
projection="geoMercator"
projectionConfig={{
  scale: 147,
  center: [0, 20] // Centralizado ligeiramente ao norte
}}
```

---

## ✅ Checklist de Implementação

- [x] Criar componente ServerWorldMap.jsx
- [x] Mapear 45+ regiões Firebase com coordenadas
- [x] Implementar markers interativos com animações
- [x] Criar modal de detalhes completo
- [x] Adicionar controles de zoom
- [x] Implementar detecção automática de região
- [x] Integrar no BackupMonitoringPage
- [x] Criar função toggleServerStatus
- [x] Adicionar toggle switch nos cards de servidor
- [x] Implementar notificações toast
- [x] Persistir status no localStorage
- [x] Sincronizar status entre lista e mapa
- [x] Adicionar contador de ativos/inativos
- [x] Testar todos os fluxos

---

## 🎉 Resultado Final

**Sistema Completo de Gerenciamento Visual de Servidores:**
✅ Toggle instantâneo de ativação  
✅ Mapa mundi interativo com 45+ regiões  
✅ Detecção automática de localização  
✅ Modal de detalhes completo  
✅ Animações fluidas  
✅ Persistência de dados  
✅ Notificações em tempo real  
✅ Dark mode compatível  
✅ Design responsivo  

---

**Desenvolvido em:** 06/10/2025  
**Status:** ✅ Implementado e Funcional
