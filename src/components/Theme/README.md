# Sistema de Transições de Tema Premium

Um sistema sofisticado de transições visuais para mudança de tema, desenvolvido com a qualidade de grandes empresas de tecnologia.

## 🎬 Efeitos Visuais

### 🖥️ Efeito TV Desligando (Escuro → Claro)
Simula uma TV CRT vintage sendo desligada com:
- Linhas de varredura progressivas
- Ruído estático dinâmico
- Linha horizontal de shutdown
- Brilho residual que desvanece

### 🔦 Efeito Lanterna (Claro → Escuro)
Simula uma lanterna potente ofuscando a tela com:
- Feixe circular expandindo radialmente
- 12 raios de luz rotacionais
- 20 partículas flutuantes
- Núcleo brilhante central

## 🚀 Como Usar

### Implementação Básica

```jsx
import ThemeTransition from './components/Theme/ThemeTransition';
import { useState } from 'react';

function App() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light');

  const handleThemeChange = () => {
    setIsTransitioning(true);
    
    // Atrasar mudança para permitir animação
    setTimeout(() => {
      setCurrentTheme(current => current === 'light' ? 'dark' : 'light');
    }, 200);
  };

  return (
    <>
      <ThemeTransition
        isTransitioning={isTransitioning}
        transitionType={currentTheme === 'light' ? 'flashlight' : 'tv-off'}
        onTransitionComplete={() => setIsTransitioning(false)}
      />
      
      <button onClick={handleThemeChange}>
        Trocar Tema
      </button>
    </>
  );
}
```

### Com Hook Personalizado

```jsx
import { useThemeTransition } from './components/Theme/useThemeTransition';

function ThemeButton() {
  const { isTransitioning, startTransition } = useThemeTransition();
  
  const handleClick = () => {
    startTransition(currentTheme, () => {
      // Sua lógica de mudança de tema aqui
      toggleTheme();
    });
  };

  return (
    <button 
      onClick={handleClick}
      disabled={isTransitioning}
    >
      {isTransitioning ? 'Transitioning...' : 'Toggle Theme'}
    </button>
  );
}
```

## 🎛️ Propriedades

### ThemeTransition Component

| Prop | Tipo | Padrão | Descrição |
|------|------|---------|-----------|
| `isTransitioning` | boolean | false | Controla se a transição está ativa |
| `transitionType` | 'tv-off' \| 'flashlight' | 'tv-off' | Tipo de efeito visual |
| `onTransitionComplete` | function | undefined | Callback chamado ao final da transição |

### Tipos de Transição

- **`tv-off`**: Ideal para transições escuro → claro
- **`flashlight`**: Ideal para transições claro → escuro

## 📱 Responsividade

O sistema é totalmente responsivo e otimizado para:

### Desktop (> 1024px)
- Animações completas com todos os efeitos
- Duração: 1.4s
- 12 raios de luz, 20 partículas

### Tablet (481px - 1024px)
- Efeitos otimizados para performance
- Elementos ligeiramente reduzidos

### Mobile (≤ 480px)
- Duração reduzida: 1.0s
- Menos elementos para melhor performance
- Apenas 8 raios de luz, 10 partículas

### Landscape Mobile
- Duração ainda mais rápida: 1.0s
- Otimizado para telas baixas

## ♿ Acessibilidade

### Suporte a Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  /* Animações simplificadas */
  .theme-transition-overlay {
    animation-duration: 0.3s;
  }
  
  /* Remove elementos decorativos */
  .ray, .particle, .tv-noise {
    display: none;
  }
}
```

### Características de Acessibilidade
- Respeita preferências do usuário para movimento reduzido
- Botões com estados disabled durante transições
- Labels apropriados para screen readers
- Foco gerenciado corretamente

## 🔧 Otimizações de Performance

### CSS Otimizado
```css
.theme-transition-overlay * {
  will-change: transform, opacity, width, height;
  backface-visibility: hidden;
  transform-style: preserve-3d;
}
```

### Características de Performance
- **60fps**: Animações usando apenas `transform` e `opacity`
- **GPU Acceleration**: `will-change` e `backface-visibility`
- **Memory Efficient**: Cleanup automático de elementos
- **Battery Friendly**: Reduced motion para dispositivos com bateria baixa

## 🎨 Customização

### Cores Personalizadas
```css
/* Customizar cores do efeito lanterna */
.flashlight-beam {
  background: radial-gradient(
    circle,
    rgba(255, 100, 100, 0.9) 0%,    /* Sua cor aqui */
    rgba(255, 100, 100, 0.7) 30%,
    rgba(255, 100, 100, 0.3) 60%,
    transparent 100%
  );
}

/* Customizar cores do efeito TV */
.tv-shutdown-line {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(100, 255, 100, 0.8) 45%,   /* Sua cor aqui */
    rgba(100, 255, 100, 1) 50%,
    rgba(100, 255, 100, 0.8) 55%,
    transparent 100%
  );
}
```

### Duração Personalizada
```css
.custom-transition .theme-transition-overlay {
  --transition-duration: 2s;
}

.custom-transition .flashlight-beam,
.custom-transition .tv-shutdown-line {
  animation-duration: var(--transition-duration);
}
```

## 🧪 Componente de Demonstração

Use o `ThemeTransitionDemo` para testar os efeitos:

```jsx
import ThemeTransitionDemo from './components/Theme/ThemeTransitionDemo';

function DemoPage() {
  return (
    <div>
      <h1>Teste as Transições</h1>
      <ThemeTransitionDemo />
    </div>
  );
}
```

## 🛠️ Integração com Frameworks

### Next.js
```jsx
// pages/_app.js
import { ThemeProvider } from '../components/Theme/ThemeSystem';
import ThemeTransition from '../components/Theme/ThemeTransition';

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <ThemeTransition />
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
```

### React Router
```jsx
// App.js
import { BrowserRouter } from 'react-router-dom';
import ThemeTransition from './components/Theme/ThemeTransition';

function App() {
  return (
    <BrowserRouter>
      <ThemeTransition />
      <Routes>
        {/* Suas rotas */}
      </Routes>
    </BrowserRouter>
  );
}
```

## 📊 Especificações Técnicas

### Timings
- **Fase Inicial**: 0-200ms (setup)
- **Fase Principal**: 200-600ms (efeito principal)
- **Fase Final**: 600-1000ms (conclusão)
- **Fade Out**: 1000-1400ms (limpeza)

### Z-Index
- **Overlay**: 9999 (máxima prioridade)
- **Elementos internos**: Relativos ao overlay

### Suporte de Navegadores
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ iOS Safari 13+
- ✅ Chrome Mobile 80+

## 🐛 Troubleshooting

### Transição não aparece
- Verifique se `isTransitioning` está sendo definido como `true`
- Confirme que o CSS foi importado corretamente
- Verifique se não há conflitos de z-index

### Performance lenta
- Use `prefers-reduced-motion` para dispositivos lentos
- Considere reduzir número de partículas/raios
- Verifique se hardware acceleration está ativo

### Conflitos de tema
- Garanta que a mudança de tema aconteça após 200ms
- Use `onTransitionComplete` para sincronização
- Evite múltiplas transições simultâneas

## 📝 Changelog

### v1.0.0
- ✨ Efeito TV desligando completo
- ✨ Efeito lanterna com raios e partículas
- ✨ Suporte responsivo completo
- ✨ Otimizações de performance
- ✨ Suporte a acessibilidade
- ✨ Hook personalizado
- ✨ Componente de demonstração

---

**Desenvolvido com ❤️ para criar experiências visuais memoráveis**