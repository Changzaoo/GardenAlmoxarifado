# 🗺️ Mapa Mundial com Zoom e Pan

## 📋 Visão Geral

O mapa mundial de servidores agora possui controles interativos de zoom e pan (arrastar), com suporte completo para:
- 🖱️ **Mouse**: Scroll para zoom, arrastar para mover
- 📱 **Touch**: Pinça para zoom, arrasto para mover
- ⌨️ **Botões**: Controles visuais de zoom in/out e reset

## 🎮 Controles Disponíveis

### Desktop (Mouse + Teclado)

| Ação | Como Fazer |
|------|------------|
| **Zoom In** | Scroll do mouse para cima OU botão + |
| **Zoom Out** | Scroll do mouse para baixo OU botão - |
| **Mover (Pan)** | Clicar e arrastar o mapa |
| **Resetar** | Botão de reset (⛶) |
| **Zoom Rápido** | Duplo clique no mapa |

### Mobile (Touch)

| Ação | Como Fazer |
|------|------------|
| **Zoom In/Out** | Gesto de pinça (dois dedos) |
| **Mover (Pan)** | Arrastar com um dedo |
| **Zoom Rápido** | Duplo toque no mapa |
| **Resetar** | Botão de reset (⛶) |

## 🎨 Elementos da Interface

### Botões de Controle
Localizados no canto superior direito:

```
┌─────────┐
│   🔍+   │  Aumentar Zoom
├─────────┤
│   🔍-   │  Diminuir Zoom
├─────────┤
│   ⛶    │  Resetar Visualização
└─────────┘
```

### Indicadores na Tela

1. **Contador de Regiões** (inferior esquerdo)
   - Mostra quantas regiões diferentes têm servidores

2. **Dicas de Uso** (inferior direito)
   - Instruções rápidas de como usar os controles

3. **Legenda** (inferior esquerdo)
   - Status dos servidores (ativo, conectado, inativo)

## ⚙️ Configuração Técnica

### Limites de Zoom

```javascript
minScale: 0.5  // 50% do tamanho original
maxScale: 4.0  // 400% do tamanho original
```

### Velocidade de Zoom

- **Scroll do mouse**: 10% por step
- **Pinça (touch)**: 5% por step
- **Duplo clique**: 50% de aumento

### Comportamento do Pan

- **Sem restrições**: Pode arrastar livremente
- **Cursor visual**: 
  - 🖐️ Grab (pode arrastar)
  - ✊ Grabbing (arrastando)

## 🔧 Implementação

### Biblioteca Utilizada
```bash
npm install react-zoom-pan-pinch
```

### Componentes Principais

```jsx
<TransformWrapper
  initialScale={1}
  minScale={0.5}
  maxScale={4}
  wheel={{ step: 0.1 }}
  pinch={{ step: 5 }}
  doubleClick={{ mode: "zoomIn", step: 0.5 }}
>
  {({ zoomIn, zoomOut, resetTransform }) => (
    <TransformComponent>
      {/* Conteúdo do mapa */}
    </TransformComponent>
  )}
</TransformWrapper>
```

## 📱 Responsividade

### Desktop
- Controles sempre visíveis
- Tooltips ao passar o mouse
- Scroll suave

### Tablet
- Controles touch otimizados
- Botões maiores para toque
- Sem hover states

### Mobile
- Gestos nativos
- Zoom pinça preciso
- Botões adaptativos

## 🎯 Casos de Uso

### 1. Explorar Servidores Distantes
1. Dê zoom em uma região específica
2. Arraste para centralizar a área
3. Clique nos marcadores para detalhes

### 2. Visão Geral
1. Clique no botão de reset
2. Veja todos os servidores de uma vez
3. Use zoom leve para focar em continentes

### 3. Apresentação
1. Use zoom para destacar regiões importantes
2. Arraste suavemente entre pontos
3. Reset para voltar à visão completa

## 🔒 Segurança e Performance

### Otimizações
- ✅ Imagens com `draggable={false}`
- ✅ User-select disabled durante drag
- ✅ Pointer events otimizados
- ✅ Smooth scrolling
- ✅ GPU acceleration

### Acessibilidade
- ✅ Botões com títulos descritivos
- ✅ Dicas visuais sempre presentes
- ✅ Contraste adequado
- ✅ Touch targets >= 44px

## 🐛 Troubleshooting

### Problema: Zoom não funciona
**Solução**: Verifique se o scroll está habilitado no navegador

### Problema: Arrastar está travado
**Solução**: Recarregue a página ou clique em reset

### Problema: Pinça não responde no mobile
**Solução**: Certifique-se de usar dois dedos simultaneamente

### Problema: Mapa fica fora da tela
**Solução**: Clique no botão de reset (⛶)

## 📊 Estatísticas de Uso

O sistema mantém logs de:
- Quantidade de zooms realizados
- Áreas mais visualizadas
- Tempo médio de interação
- Servidores mais clicados

## 🚀 Próximas Melhorias

### Planejadas
- [ ] Zoom automático ao clicar em servidor
- [ ] Mini-mapa de navegação
- [ ] Histórico de navegação (voltar/avançar)
- [ ] Marcadores de calor por uso
- [ ] Busca por região com zoom automático

### Em Consideração
- [ ] Modo fullscreen
- [ ] Salvar posição favorita
- [ ] Tours guiados automáticos
- [ ] Comparação lado a lado de regiões

## 📚 Referências

- [react-zoom-pan-pinch Documentation](https://github.com/prc5/react-zoom-pan-pinch)
- [Touch Events API](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [Wheel Event](https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent)

## 💡 Dicas Avançadas

### Zoom Preciso
Segure `Shift` enquanto usa o scroll para zoom mais lento e preciso

### Pan Vertical/Horizontal
Segure `Shift` para travar movimento horizontal durante drag

### Zoom em Ponto Específico
O zoom sempre centraliza no ponto do cursor/toque

### Performance
Em dispositivos lentos, reduza a complexidade visual nas configurações

---

**Desenvolvido com ❤️ para WorkFlow Garden**
**Versão**: 1.0.0
**Data**: Outubro 2025
