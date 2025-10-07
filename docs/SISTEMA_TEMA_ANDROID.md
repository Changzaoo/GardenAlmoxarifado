# 🎨 Sistema de Tema Dinâmico para Android

## 📋 Visão Geral

Sistema completo que sincroniza o tema do aplicativo (light/dark) com a interface nativa do Android em tempo real, incluindo:
- ✅ Barra de status
- ✅ Barra de navegação
- ✅ Splash screen
- ✅ Ícone do aplicativo
- ✅ Cores do sistema

## 🚀 Instalação

### 1. Instalar Dependências do Capacitor

```bash
npm install @capacitor/status-bar @capacitor/splash-screen
```

### 2. Sincronizar com Android

```bash
npx cap sync android
```

### 3. Configurar AndroidManifest.xml

Adicione o plugin customizado no arquivo `android/app/src/main/AndroidManifest.xml`:

```xml
<application
    android:allowBackup="true"
    android:icon="@mipmap/ic_launcher"
    android:label="@string/app_name"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:supportsRtl="true"
    android:theme="@style/SplashTheme">
    
    <activity
        android:name=".MainActivity"
        android:exported="true"
        android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
        android:label="@string/title_activity_main"
        android:theme="@style/SplashTheme"
        android:launchMode="singleTask">
        
        <intent-filter>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent-filter>
    </activity>
    
    <!-- Plugin Customizado de Tema -->
    <meta-data
        android:name="br.workflow.app.plugins.ThemeManagerPlugin"
        android:value="ThemeManager" />
</application>
```

## 📁 Arquivos Criados

### JavaScript/React

1. **`src/hooks/useAndroidTheme.js`**
   - Hook que sincroniza o tema com o Android
   - Atualiza StatusBar, NavigationBar e meta tags
   - Suporte para plugin customizado com fallback

2. **`src/components/Theme/ThemeSystem.jsx`** (atualizado)
   - Integração com `useAndroidTheme`
   - Atualização automática ao trocar tema

### Android (Java)

1. **`android/app/src/main/java/br/workflow/app/MainActivity.java`**
   - Activity principal com suporte a temas dinâmicos
   - Aplica tema ao iniciar e ao voltar do background
   - Gerencia SharedPreferences para persistir tema

2. **`android/app/src/main/java/br/workflow/app/plugins/ThemeManagerPlugin.java`**
   - Plugin Capacitor customizado
   - Métodos: `setTheme()`, `getTheme()`
   - Atualização em tempo real da StatusBar e NavigationBar

### Android (Resources)

1. **`android/app/src/main/res/values/colors.xml`**
   - Define todas as cores para temas light e dark
   - Cores para StatusBar, NavigationBar, SplashScreen

2. **`android/app/src/main/res/values/styles.xml`**
   - Estilos `AppTheme.Light` e `AppTheme.Dark`
   - Estilos `SplashTheme.Light` e `SplashTheme.Dark`
   - Configurações de barras do sistema

3. **`android/app/src/main/res/drawable/splash_light.xml`**
   - Splash screen para tema claro
   - Fundo branco, logo centralizado, indicador azul

4. **`android/app/src/main/res/drawable/splash_dark.xml`**
   - Splash screen para tema escuro
   - Fundo preto, logo centralizado, indicador azul

## 🎯 Como Funciona

### Fluxo de Mudança de Tema

```
Usuário clica no toggle de tema
         ↓
ThemeSystem.toggleTheme()
         ↓
useAndroidTheme detecta mudança
         ↓
Chama ThemeManager.setTheme()
         ↓
Plugin Java atualiza:
  - SharedPreferences
  - StatusBar color
  - NavigationBar color
  - System UI flags
         ↓
Interface atualizada instantaneamente
```

### Cores dos Temas

#### Light Theme
```
Background: #FFFFFF (branco)
StatusBar: #FFFFFF (branco)
NavigationBar: #FFFFFF (branco)
Text: #111827 (quase preto)
Primary: #1D9BF0 (azul Twitter)
StatusBar Icons: Dark (preto)
```

#### Dark Theme
```
Background: #000000 (preto puro)
StatusBar: #000000 (preto)
NavigationBar: #000000 (preto)
Text: #E7E9EA (branco-cinza)
Primary: #1D9BF0 (azul Twitter)
StatusBar Icons: Light (branco)
```

## 🔧 Uso no Código

### Detectar Mudança de Tema

```javascript
import { useTheme } from '../components/Theme/ThemeSystem';

function MyComponent() {
  const { currentTheme, toggleTheme, isDark } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      Tema Atual: {currentTheme}
    </button>
  );
}
```

### Aplicar Tema Manualmente

```javascript
import { useAndroidTheme } from '../hooks/useAndroidTheme';

function MyComponent() {
  const theme = 'dark'; // ou 'light'
  useAndroidTheme(theme);
  
  return <div>Tema aplicado!</div>;
}
```

## 📱 Testando no Android

### 1. Build do Android

```bash
npm run build
npx cap copy android
npx cap sync android
```

### 2. Abrir no Android Studio

```bash
npx cap open android
```

### 3. Executar no Dispositivo/Emulador

- Click em "Run" no Android Studio
- Ou use: `npx cap run android`

### 4. Testar Mudança de Tema

1. Abra o aplicativo
2. Vá para as configurações
3. Click no toggle de tema
4. **Observe:**
   - Barra de status muda de cor instantaneamente
   - Barra de navegação muda de cor
   - Ícones da status bar mudam (preto/branco)
   - Interface do app muda

## 🎨 Personalizando Cores

### Modificar Cores no Android

Edite `android/app/src/main/res/values/colors.xml`:

```xml
<color name="statusBarLight">#SUA_COR_AQUI</color>
<color name="statusBarDark">#SUA_COR_AQUI</color>
```

### Modificar Cores no JavaScript

Edite `src/components/Theme/ThemeSystem.jsx`:

```javascript
dark: {
  colors: {
    background: '#000000', // Sua cor aqui
    primary: '#1D9BF0',    // Sua cor aqui
    // ...
  }
}
```

## 🐛 Troubleshooting

### Tema não muda no Android

1. Verifique se os plugins estão instalados:
   ```bash
   npm list @capacitor/status-bar
   npm list @capacitor/splash-screen
   ```

2. Sincronize novamente:
   ```bash
   npx cap sync android
   ```

3. Limpe o build:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npx cap sync android
   ```

### StatusBar fica transparente

Verifique no `MainActivity.java` se o flag está correto:

```java
window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
```

### Plugin não encontrado

Adicione no `AndroidManifest.xml`:

```xml
<meta-data
    android:name="br.workflow.app.plugins.ThemeManagerPlugin"
    android:value="ThemeManager" />
```

## 📊 Status de Implementação

- ✅ Hook `useAndroidTheme` criado
- ✅ Plugin Java `ThemeManagerPlugin` criado
- ✅ MainActivity com suporte a temas
- ✅ Arquivos de recursos (colors, styles, drawables)
- ✅ Splash screens light/dark
- ✅ Integração com ThemeSystem
- ✅ Fallback para StatusBar nativo
- ✅ Persistência de tema (SharedPreferences)
- ✅ Atualização em tempo real

## 🎉 Resultado Final

Quando o usuário trocar o tema:
- 🎨 Barra de status muda de cor instantaneamente
- 🎨 Barra de navegação muda de cor instantaneamente
- 🎨 Ícones da status bar invertem cor (preto ↔ branco)
- 🎨 Splash screen na próxima abertura será do tema escolhido
- 🎨 Todo o app fica consistente com o tema
- 🎨 Transição suave e sem flickering

## 📚 Recursos Adicionais

- [Capacitor StatusBar](https://capacitorjs.com/docs/apis/status-bar)
- [Capacitor SplashScreen](https://capacitorjs.com/docs/apis/splash-screen)
- [Android Themes](https://developer.android.com/develop/ui/views/theming/themes)
- [Material Design Dark Theme](https://m3.material.io/styles/color/dark-theme/overview)
