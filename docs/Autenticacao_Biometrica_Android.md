# 🔐 Autenticação Biométrica no Android

## 📋 Implementação

A autenticação biométrica foi implementada usando o plugin `@aparajita/capacitor-biometric-auth` e funciona automaticamente quando o app é instalado em dispositivos Android.

## ✅ O que foi implementado

### 1. **Hook personalizado** (`useBiometricAuth.js`)
- Verifica disponibilidade de biometria no dispositivo
- Detecta tipo de biometria (digital, facial, íris)
- Gerencia o processo de autenticação
- Trata erros e tentativas falhadas

### 2. **Componente de UI** (`BiometricAuth.jsx`)
- Tela de boas-vindas com logo
- Interface moderna com animações
- Suporte a tema claro/escuro
- Feedback visual durante autenticação
- Limite de 3 tentativas
- Opção de pular e usar login manual

### 3. **Integração no App** (`App.jsx`)
- Verifica se está rodando em plataforma nativa (Android/iOS)
- Exibe tela de biometria antes de qualquer outra tela
- Usa `sessionStorage` para manter autenticação durante a sessão
- Permite pular biometria e usar login tradicional

## 🚀 Como funciona

1. **Ao abrir o app no Android:**
   - Sistema verifica se biometria está disponível
   - Se disponível, mostra tela de autenticação biométrica
   - Usuário autentica com digital/face
   - Após sucesso, acessa a tela de login normal

2. **Se biometria falhar:**
   - Usuário tem até 3 tentativas
   - Pode clicar em "Usar Login Manual" a qualquer momento
   - Segue para tela de login tradicional

3. **Durante a sessão:**
   - Biometria é solicitada apenas uma vez por sessão
   - Após fechar completamente o app, será solicitada novamente

## 📱 Tipos de biometria suportados

- ✅ **Digital (Fingerprint)**
- ✅ **Reconhecimento Facial (Face)**
- ✅ **Íris (Iris)**
- ✅ **Credenciais do dispositivo** (PIN, padrão, senha)

## 🔧 Permissões no Android

As seguintes permissões são adicionadas automaticamente pelo plugin:

\`\`\`xml
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
<uses-permission android:name="android.permission.USE_FINGERPRINT" />
\`\`\`

## 🧪 Como testar

### **No navegador (desenvolvimento):**
- Biometria é desabilitada automaticamente
- App funciona normalmente sem solicitar biometria

### **No dispositivo Android:**

1. **Build do app:**
   \`\`\`bash
   npm run build
   npx cap sync android
   npx cap open android
   \`\`\`

2. **No Android Studio:**
   - Clique em "Run" (Play verde)
   - Ou use: Shift + F10

3. **Testando:**
   - Ao abrir o app, verá a tela de autenticação biométrica
   - Use sua digital cadastrada no dispositivo
   - Ou clique em "Usar Login Manual"

### **Emulador Android:**

Para testar no emulador:

1. **Configurar digital no emulador:**
   - Settings > Security > Fingerprint
   - Adicione uma digital virtual

2. **Simular toque na digital:**
   - Durante a autenticação biométrica
   - Menu superior: `...` > `Fingerprint` > `Touch sensor`

## 🎨 Recursos visuais

- **Gradiente azul/índigo** no fundo
- **Ícone de escudo** no logo
- **Ícone de digital** com animação pulsante
- **Feedback visual** durante autenticação
- **Mensagens de erro** claras e amigáveis
- **Contador de tentativas** restantes
- **Design responsivo** e acessível

## 🔒 Segurança

- ✅ Biometria é processada pelo hardware seguro do Android
- ✅ Dados biométricos NUNCA deixam o dispositivo
- ✅ Autenticação é válida apenas para a sessão atual
- ✅ Limite de tentativas previne ataques de força bruta
- ✅ Fallback para login manual sempre disponível

## 📝 Configurações avançadas

Se precisar customizar, edite `src/hooks/useBiometricAuth.js`:

\`\`\`javascript
const result = await BiometricAuth.authenticate({
  reason: 'Texto personalizado',
  androidTitle: 'Título customizado',
  androidSubtitle: 'Subtítulo customizado',
  cancelTitle: 'Botão de cancelar',
  allowDeviceCredential: true, // Permite PIN/padrão
  androidBiometryStrength: 'weak' // 'weak' | 'strong'
});
\`\`\`

## 🐛 Troubleshooting

### Biometria não aparece:
1. Verifique se está rodando em dispositivo Android real (não navegador)
2. Confirme que o dispositivo tem biometria cadastrada
3. Verifique se as permissões estão corretas

### Erro de permissão:
1. Execute `npx cap sync android` novamente
2. Limpe e rebuilde o projeto Android
3. Verifique o AndroidManifest.xml

### Plugin não encontrado:
\`\`\`bash
npm install @aparajita/capacitor-biometric-auth
npx cap sync android
\`\`\`

## 📚 Documentação do plugin

- [GitHub - @aparajita/capacitor-biometric-auth](https://github.com/aparajita/capacitor-biometric-auth)
- [Capacitor Documentation](https://capacitorjs.com/docs)

## 🎯 Próximos passos

- [ ] Adicionar opção para desabilitar biometria nas configurações
- [ ] Salvar preferência do usuário sobre biometria
- [ ] Implementar biometria para ações sensíveis (ex: aprovar empréstimos)
- [ ] Adicionar logs de autenticação biométrica
- [ ] Implementar timeout de inatividade com re-autenticação

---

**Desenvolvido para Garden Almoxarifado** 🌱
