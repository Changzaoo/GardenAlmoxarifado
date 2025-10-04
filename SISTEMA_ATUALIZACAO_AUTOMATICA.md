# 🔄 Sistema de Atualização Automática

Sistema eficiente de atualização automática que detecta e aplica novas versões do sistema assim que são disponibilizadas no Vercel.

## 📋 Funcionalidades

### ✨ Detecção Automática
- **Verificação Periódica**: A cada 5 minutos verifica se há nova versão
- **Verificação em Foco**: Quando o usuário retorna à aba
- **Verificação Online**: Quando a conexão é restabelecida
- **Verificação Inicial**: 5 segundos após o carregamento

### 🚀 Atualização Rápida
- **Pre-cache**: Service Worker baixa a nova versão em background
- **Network First**: Sempre busca a versão mais recente
- **Cache Inteligente**: Mantém assets em cache para offline
- **Limpeza Automática**: Remove versões antigas do cache

### 🎨 Interface Amigável
- **Modal Atrativo**: Design moderno com animações
- **Progresso Visual**: Barra de progresso durante atualização
- **Auto-atualização**: Timer de 30 segundos para atualização automática
- **Notificações**: Alerta nativo quando nova versão disponível

### 📦 Versionamento
- **Build Automático**: Geração automática de versão em cada build
- **Informações Completas**: Versão, data, número do build, commit Git
- **Comparação Inteligente**: Compara múltiplos critérios para detectar atualizações

## 🛠️ Arquivos do Sistema

### Hook Personalizado
```
src/hooks/useAppUpdate.js
```
Gerencia toda a lógica de verificação e atualização.

### Componente de UI
```
src/components/AppUpdateModal.jsx
```
Modal moderno e interativo para notificar usuários.

### Service Worker
```
service-worker.js
```
Gerencia cache e atualização em background.

### Script de Versão
```
scripts/generate-version.js
```
Gera automaticamente version.json em cada build.

### Arquivo de Versão
```
public/version.json
```
Contém informações da versão atual.

## 📊 Fluxo de Atualização

```
1. Deploy no Vercel
   ↓
2. Script gera novo version.json com buildNumber único
   ↓
3. Cliente verifica version.json periodicamente
   ↓
4. Detecta buildNumber diferente
   ↓
5. Service Worker baixa nova versão em background
   ↓
6. Exibe modal para usuário
   ↓
7. Auto-atualização após 30s ou ação do usuário
   ↓
8. Limpa cache antigo e recarrega página
   ↓
9. Nova versão ativa!
```

## ⚙️ Configuração

### Build no Vercel

O sistema está configurado para gerar automaticamente a versão:

```json
{
  "scripts": {
    "prebuild": "node scripts/generate-version.js",
    "vercel-build": "npm run build:version"
  }
}
```

### Personalização

#### Intervalo de Verificação

Em `src/hooks/useAppUpdate.js`:

```javascript
// Altere o intervalo (padrão: 5 minutos)
checkIntervalRef.current = setInterval(() => {
  checkForUpdate();
}, 5 * 60 * 1000); // 5 minutos
```

#### Tempo de Auto-atualização

Em `src/components/AppUpdateModal.jsx`:

```javascript
// Altere o countdown (padrão: 30 segundos)
if (updateAvailable && !countdown) {
  setCountdown(30);
  // ...
}
```

## 🔍 Comparação de Versões

O sistema compara versões usando múltiplos critérios:

1. **buildDate**: Data de compilação (timestamp)
2. **buildNumber**: Número único do build
3. **version**: String de versão semântica (fallback)

## 📱 Notificações

Quando habilitadas, o sistema envia notificações nativas:

```javascript
if ('Notification' in window && Notification.permission === 'granted') {
  new Notification('Atualização Disponível', {
    body: 'Uma nova versão do sistema está disponível!',
    icon: '/logo192.png'
  });
}
```

## 🧪 Testando

### Localmente

1. Altere a versão em `package.json`
2. Execute `npm run generate-version`
3. O sistema detectará a mudança

### Em Produção

1. Faça commit e push para o repositório
2. Vercel fará deploy automaticamente
3. Clientes receberão notificação em até 5 minutos

## 🚨 Tratamento de Erros

- **Falha na verificação**: Continua tentando no próximo ciclo
- **Timeout**: Usa cache como fallback
- **Erro no Service Worker**: Força reload tradicional
- **Cache corrompido**: Limpa e recarrega

## 💡 Boas Práticas

1. **Sempre teste**: Verifique se a atualização funciona antes de deploy
2. **Comunique**: Informe usuários sobre mudanças importantes
3. **Monitore**: Acompanhe logs para detectar problemas
4. **Versionamento semântico**: Use versões significativas (1.0.0, 1.1.0, etc)

## 🔒 Segurança

- **Cache-Control**: Headers adequados para evitar cache excessivo
- **HTTPS**: Necessário para Service Workers
- **Permissões**: Solicita permissão para notificações

## 📈 Performance

- **Baixo impacto**: Verificações leves e assíncronas
- **Pre-cache**: Download em background não bloqueia UI
- **Cache inteligente**: Reduz tráfego de rede
- **Limpeza automática**: Remove versões antigas

## 🎯 Benefícios

✅ **Usuários sempre atualizados**: Distribuição rápida de correções  
✅ **Zero fricção**: Atualização transparente e automática  
✅ **Melhor UX**: Interface clara e não intrusiva  
✅ **Confiável**: Múltiplas camadas de verificação  
✅ **Eficiente**: Uso otimizado de cache e rede  

## 📝 Logs

O sistema registra eventos importantes no console:

```
[SW] Instalando nova versão...
[SW] Ativação concluída
✨ Nova versão disponível!
🔄 Gerando arquivo de versão...
✅ Arquivo de versão gerado com sucesso!
```

## 🆘 Troubleshooting

### Atualização não detectada

1. Verifique se `version.json` foi atualizado
2. Limpe o cache do navegador
3. Verifique console para erros

### Modal não aparece

1. Confirme que `AppUpdateModal` está no componente raiz
2. Verifique se há erros no hook `useAppUpdate`
3. Teste manualmente chamando `checkForUpdate()`

### Service Worker não ativa

1. HTTPS é obrigatório (ou localhost)
2. Verifique console do SW (DevTools > Application > Service Workers)
3. Force atualização manual se necessário

---

**Desenvolvido com ❤️ para Garden Almoxarifado**
