# Sons de Notificação

Este diretório deve conter os arquivos de som para as notificações do sistema de mensagens.

## Arquivos Necessários

### 1. `notification.mp3`
- **Uso**: Som padrão para novas mensagens
- **Duração recomendada**: 1-2 segundos
- **Volume**: Médio (será ajustado para 0.5 no código)
- **Formato**: MP3, 128kbps

### 2. `mention.mp3`
- **Uso**: Som quando o usuário é mencionado (@usuario)
- **Duração recomendada**: 1-2 segundos
- **Volume**: Médio-alto (notificação importante)
- **Formato**: MP3, 128kbps

### 3. `call.mp3`
- **Uso**: Som para chamadas de vídeo/voz (futuro)
- **Duração recomendada**: 3-5 segundos (pode repetir)
- **Volume**: Alto (chamada é prioritária)
- **Formato**: MP3, 128kbps

## Onde Encontrar Sons

### Opção 1: Sites de Sons Gratuitos
- **Zapsplat**: https://www.zapsplat.com/
- **Freesound**: https://freesound.org/
- **Notification Sounds**: https://notificationsounds.com/

### Opção 2: Gerar com IA
- **ElevenLabs**: https://elevenlabs.io/ (pode gerar sons)
- **AudioGen**: Gerar sons com IA

### Opção 3: Sons do Sistema
Você pode usar sons nativos do Windows/Mac:
- Windows: `C:\Windows\Media\`
- Mac: `/System/Library/Sounds/`

## Recomendações

- ✅ **Tamanho**: Mantenha arquivos pequenos (<50KB)
- ✅ **Formato**: MP3 é universal e bem suportado
- ✅ **Volume**: Não muito alto para não assustar
- ✅ **Licença**: Use sons livres de direitos autorais

## Sons Temporários (Fallback)

Se você não tiver os arquivos, o sistema funcionará normalmente mas sem som. O código tem tratamento de erro para sons ausentes.

Você pode testar com qualquer arquivo MP3 renomeando-o para `notification.mp3`.

## Implementação

Os sons são carregados em `notificationManager.js`:

```javascript
loadSounds() {
  this.sounds.message = new Audio('/sounds/notification.mp3');
  this.sounds.message.volume = 0.5;
  
  this.sounds.mention = new Audio('/sounds/mention.mp3');
  this.sounds.call = new Audio('/sounds/call.mp3');
}
```

E tocados quando uma notificação é recebida:

```javascript
if (this.preferences.sound) {
  this.playSound('message'); // ou 'mention', 'call'
}
```
