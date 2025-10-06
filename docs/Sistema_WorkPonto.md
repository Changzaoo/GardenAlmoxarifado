# WorkPonto - Sistema de Ponto Eletrônico com Reconhecimento Facial

## 📋 Visão Geral

O **WorkPonto** é um sistema completo de ponto eletrônico integrado ao perfil do funcionário, que utiliza reconhecimento facial para validação de identidade e garante a autenticidade dos registros de ponto.

## 🎯 Características Principais

### 1. **Reconhecimento Facial**
- Usa a biblioteca `@vladmandic/face-api` para detecção e reconhecimento facial
- Compara o rosto capturado com uma foto de referência previamente cadastrada
- Score de confiança (threshold < 0.6 para aprovação)
- Feedback visual em tempo real da detecção de rosto

### 2. **Registro de Entrada e Saída**
- Botões separados para entrada e saída
- Validação: não pode registrar saída sem ter entrada
- Não pode registrar entrada duplicada no mesmo dia
- Cálculo automático de horas trabalhadas

### 3. **Geolocalização**
- Captura localização GPS no momento do registro
- Armazena latitude, longitude e precisão
- Útil para validar que o ponto foi batido no local correto

### 4. **Status Online/Offline**
- Detecta se o dispositivo está online ou offline
- Registra o status de conectividade junto com o ponto

### 5. **Foto de Referência**
- Usuário precisa cadastrar uma foto de referência antes de usar
- Sistema valida se há rosto detectável na foto
- Foto armazenada no Firebase Storage
- Pode ser atualizada a qualquer momento

### 6. **Histórico Completo**
- Lista os últimos 30 registros de ponto
- Mostra foto capturada, data/hora, tipo (entrada/saída)
- Exibe horas trabalhadas quando aplicável
- Score de confiança do reconhecimento facial
- Localização GPS de cada registro

## 🏗️ Arquitetura

### Componentes

```
src/components/Profile/
├── WorkPontoTab.jsx          # Componente principal do sistema
└── ProfileTab.jsx             # Integração da nova aba
```

### Coleções do Firebase

#### `pontos`
```javascript
{
  funcionarioId: string,        // ID do funcionário
  funcionarioNome: string,      // Nome do funcionário
  funcionarioUsuario: string,   // Username
  tipo: string,                 // 'entrada' ou 'saida'
  timestamp: Timestamp,         // Data/hora do registro
  photoURL: string,             // URL da foto capturada
  faceMatchScore: string,       // Score de confiança (0-1)
  location: {                   // Localização GPS
    latitude: number,
    longitude: number,
    accuracy: number
  },
  isOnline: boolean,           // Status de conectividade
  deviceInfo: {                // Informações do dispositivo
    userAgent: string,
    platform: string
  },
  horasTrabalhadas: number,    // (Apenas para saída)
  minutosTrabalhados: number   // (Apenas para saída)
}
```

#### `funcionarios` (campo adicional)
```javascript
{
  // ... campos existentes
  faceReferenceURL: string,      // URL da foto de referência
  faceReferenceUpdated: Timestamp // Data da última atualização
}
```

## 🔧 Fluxo de Uso

### 1. Primeiro Uso - Cadastro de Foto de Referência

```
1. Usuário acessa a aba "WorkPonto"
2. Sistema detecta que não há foto de referência
3. Exibe aviso amarelo com botão "Enviar Foto"
4. Usuário seleciona uma foto
5. Sistema valida se há rosto na foto
6. Se válido, faz upload para Firebase Storage
7. Atualiza o registro do funcionário com a URL da foto
```

### 2. Registro de Entrada

```
1. Usuário clica no botão "Entrada"
2. Sistema verifica se já existe entrada no dia
3. Solicita permissão de câmera e localização
4. Inicia câmera e detecção contínua de rosto
5. Quando rosto é detectado, exibe indicador verde
6. Usuário clica em "Registrar Ponto"
7. Sistema captura foto e extrai descritores faciais
8. Busca foto de referência do funcionário
9. Compara os descritores (distância euclidiana)
10. Se match (< 0.6), registra ponto com sucesso
11. Se não match, exibe erro "Rosto não reconhecido"
```

### 3. Registro de Saída

```
1. Similar ao registro de entrada
2. Validação adicional: verifica se há entrada registrada
3. Calcula automaticamente o tempo trabalhado
4. Registra horas e minutos trabalhados
```

## 🎨 Interface do Usuário

### Header
- Gradiente roxo/índigo
- Data e hora atualizadas em tempo real
- Status de conectividade (online/offline)
- Status do dia (trabalhando, concluído, pendente)

### Botões de Ponto
- **Entrada**: Verde, ícone PlayCircle
- **Saída**: Vermelho, ícone StopCircle
- Desabilitados quando não aplicável

### Modal de Câmera
- Vídeo em tempo real com overlay de canvas
- Indicadores visuais de detecção
- Feedback de localização
- Botão de registrar (habilitado apenas com rosto detectado)

### Histórico
- Cards com foto, data/hora, tipo
- Score de confiança da verificação
- Horas trabalhadas (quando aplicável)
- Coordenadas GPS

## 🔐 Segurança

1. **Validação de Identidade**: Reconhecimento facial impede fraudes
2. **Geolocalização**: Valida local do registro
3. **Foto de Referência**: Apenas o próprio funcionário pode cadastrar
4. **Score de Confiança**: Threshold ajustável para precisão
5. **Timestamp no Servidor**: Data/hora do Firebase (não manipulável)
6. **Histórico Imutável**: Registros não podem ser editados/excluídos

## 📊 Estatísticas e Relatórios

O sistema armazena dados que permitem:
- Relatório de frequência por funcionário
- Cálculo de horas extras
- Identificação de atrasos
- Análise de padrões de entrada/saída
- Validação de local (dentro da empresa ou não)

## 🚀 Melhorias Futuras

1. **Relatórios Administrativos**
   - Dashboard para gestores
   - Exportação de relatórios em PDF/Excel
   - Gráficos de frequência

2. **Notificações**
   - Lembrete para bater ponto
   - Alerta de esquecimento de saída
   - Notificação para administradores

3. **Validação de Localização**
   - Definir raio permitido (geofencing)
   - Alertas se fora da área

4. **Banco de Horas**
   - Cálculo automático de saldo
   - Visualização de créditos/débitos
   - Solicitação de compensação

5. **Integração com RH**
   - Exportação para sistemas de folha
   - Justificativas de ausências
   - Aprovação de horas extras

## 🛠️ Configuração e Instalação

### Dependências
```bash
npm install @vladmandic/face-api
```

### Firebase Storage Rules
```javascript
// Permitir upload de fotos de referência e pontos
match /face-reference/{userId} {
  allow write: if request.auth != null && request.auth.uid == userId;
  allow read: if request.auth != null;
}

match /pontos/{userId}/{fileName} {
  allow write: if request.auth != null;
  allow read: if request.auth != null;
}
```

### Firestore Rules
```javascript
// Coleção de pontos
match /pontos/{pontoId} {
  allow create: if request.auth != null;
  allow read: if request.auth != null;
  allow update, delete: if false; // Imutável
}

// Adicionar campo faceReferenceURL aos funcionários
match /funcionarios/{funcId} {
  allow update: if request.auth != null 
    && request.resource.data.diff(resource.data).affectedKeys()
       .hasOnly(['faceReferenceURL', 'faceReferenceUpdated']);
}
```

## 📱 Compatibilidade

- ✅ Chrome/Edge (desktop e mobile)
- ✅ Safari (iOS/macOS)
- ✅ Firefox
- ✅ Samsung Internet
- ⚠️ Requer HTTPS para acesso à câmera
- ⚠️ Requer permissões de câmera e localização

## 🐛 Troubleshooting

### Erro: "Não foi possível acessar a câmera"
- Verificar permissões do navegador
- Verificar se o site está em HTTPS
- Verificar se a câmera não está em uso

### Erro: "Sistema de reconhecimento facial ainda carregando"
- Aguardar carregamento dos modelos (~2-3 segundos)
- Verificar conexão com internet (modelos vêm de CDN)

### Erro: "Rosto não reconhecido"
- Usar melhor iluminação
- Posicionar rosto centralizado
- Atualizar foto de referência se necessário

### Foto de referência não detecta rosto
- Usar foto com boa resolução
- Garantir que o rosto está visível e centralizado
- Evitar óculos escuros ou obstruções

## 📝 Notas Técnicas

### Performance
- Detecção de rosto roda a ~10 FPS
- Modelos carregam automaticamente do CDN
- Threshold de 0.6 para balanço entre segurança e usabilidade

### Privacidade
- Fotos armazenadas apenas no Firebase Storage
- Descritores faciais não são armazenados
- Comparação feita no cliente (não enviado para servidor)

### Limitações
- Um ponto por dia (entrada + saída)
- Não permite edição de registros
- Requer internet para carregar modelos
- Requer foto de referência prévia

---

**Desenvolvido com ❤️ para o sistema WorkFlow**
