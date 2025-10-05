# 🚀 Guia Rápido - Testar Biometria no Android

## 📱 Passo a Passo para Testar

### 1. **Abrir o Android Studio**

Execute o comando:

\`\`\`bash
npx cap open android
\`\`\`

Isso abrirá o projeto automaticamente no Android Studio.

### 2. **Conectar dispositivo ou usar emulador**

#### Opção A: **Dispositivo físico (recomendado)**
1. Ative **Depuração USB** no seu celular:
   - Configurações > Sobre o telefone
   - Toque 7 vezes em "Número da compilação"
   - Volte e entre em "Opções do desenvolvedor"
   - Ative "Depuração USB"
2. Conecte o cabo USB no computador
3. Autorize a depuração no celular

#### Opção B: **Emulador Android**
1. No Android Studio: Tools > Device Manager
2. Crie ou inicie um emulador
3. Configure biometria:
   - Settings > Security > Fingerprint
   - Adicione uma digital virtual

### 3. **Executar o app**

1. No Android Studio, clique no botão **Run** (▶️ verde)
2. Ou pressione: **Shift + F10**
3. Aguarde o build e instalação

### 4. **Testar a biometria**

**No dispositivo físico:**
- Ao abrir o app, verá a tela de autenticação biométrica
- Coloque o dedo no sensor de digital
- Ou use reconhecimento facial (se disponível)

**No emulador:**
- Quando aparecer a solicitação de biometria
- Clique no menu superior: **`...`** (três pontos)
- **Fingerprint** > **Touch sensor**
- Ou use o atalho: **Ctrl + Shift + P** (Windows/Linux) ou **Cmd + Shift + P** (Mac)

### 5. **Testar o fluxo completo**

✅ **Sucesso na biometria:**
- Verá a tela de login normal do sistema
- Faça login com suas credenciais

❌ **Falha na biometria:**
- Tente até 3 vezes
- Ou clique em "Usar Login Manual"
- Será redirecionado para tela de login

🔄 **Testar novamente:**
- Feche completamente o app
- Abra novamente
- Biometria será solicitada novamente

## 🛠️ Comandos Úteis

### Rebuild completo:
\`\`\`bash
# 1. Build do projeto web
npm run build

# 2. Sincronizar com Android
npx cap sync android

# 3. Abrir no Android Studio
npx cap open android
\`\`\`

### Limpar cache do Android:
\`\`\`bash
cd android
./gradlew clean
cd ..
npx cap sync android
\`\`\`

### Ver logs em tempo real:
\`\`\`bash
npx cap run android -l
\`\`\`

## 📊 Verificando logs

No Android Studio:
1. **Logcat** (parte inferior da janela)
2. Filtrar por: `BiometricAuth` ou `capacitor`
3. Verá logs de:
   - Verificação de disponibilidade
   - Tipo de biometria detectada
   - Sucesso/falha da autenticação

## 🐛 Problemas Comuns

### "Biometria não disponível"
- ✅ Certifique-se de ter digital cadastrada no dispositivo
- ✅ No emulador: Configure em Settings > Security > Fingerprint

### Plugin não encontrado
\`\`\`bash
npm install @aparajita/capacitor-biometric-auth
npx cap sync android
\`\`\`

### Erro de build
\`\`\`bash
cd android
./gradlew clean
cd ..
npm run build
npx cap sync android
\`\`\`

### App não atualiza
1. Desinstale o app do dispositivo
2. Build e instale novamente

## 📸 O que você verá

1. **Tela de loading** (breve)
2. **Tela de biometria:**
   - Fundo gradiente azul
   - Logo do Garden Almoxarifado
   - Ícone de digital animado
   - Botões: "Tentar Novamente" e "Usar Login Manual"
3. **Após sucesso:**
   - Tela de login tradicional

## 🎯 Teste em diferentes cenários

- [x] **Primeira abertura do app**
- [x] **Sucesso na primeira tentativa**
- [x] **Falha e retry (até 3x)**
- [x] **Clicar em "Usar Login Manual"**
- [x] **Fechar e reabrir o app**
- [x] **Dispositivo sem biometria cadastrada**
- [x] **Navegador web** (deve pular biometria)

## 💡 Dicas

- 🔵 **No navegador**: Biometria é automaticamente desabilitada
- 📱 **No Android**: Biometria funciona automaticamente
- 🔄 **Sessão**: Biometria é solicitada uma vez por sessão
- ⏱️ **Timeout**: Após fechar o app, será solicitada novamente
- 🎨 **Tema**: Respeita dark/light mode do dispositivo

---

**Pronto para testar! 🚀**

Se tiver dúvidas, consulte: `docs/Autenticacao_Biometrica_Android.md`
