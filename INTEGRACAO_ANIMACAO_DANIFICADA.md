# Integração da Animação de Ferramenta Danificada

## ✅ Passo 1: Import Adicionado
```jsx
import FerramentaDanificadaAnimation from '../Animacoes/FerramentaDanificadaAnimation';
```
**Status:** COMPLETO

## 🔄 Passo 2: Adicionar Estados (após linha 49)
Adicionar após `const [filtroStatus, setFiltroStatus] = useState('todos');`:

```jsx
// Estados para animação de ferramenta danificada
const [showDanificadaAnimation, setShowDanificadaAnimation] = useState(false);
const [dadosDanificadaAnimacao, setDadosDanificadaAnimacao] = useState(null);
```

## 🔄 Passo 3: Modificar handleSubmit (linha ~80-150)
Substituir o conteúdo da função `handleSubmit` (após validações) por:

```jsx
const dadosCompletos = {
  ...novaFerramenta,
  valorReparo: novaFerramenta.valorReparo ? parseFloat(novaFerramenta.valorReparo) : 0
};

// Fechar modal e preparar dados para animação
setModalAberto(false);

// Configurar dados da animação
setDadosDanificadaAnimacao({
  ferramenta: {
    nome: dadosCompletos.nomeItem,
    motivo: dadosCompletos.descricaoProblema,
    gravidade: dadosCompletos.prioridade
  },
  dadosCompletos // Guardar dados completos para salvar depois
});

// Mostrar animação
setShowDanificadaAnimation(true);
```

## 🔄 Passo 4: Adicionar Função finalizarRegistroDanificada (após handleSubmit)
```jsx
// Função para finalizar o registro após a animação
const finalizarRegistroDanificada = async () => {
  if (!dadosDanificadaAnimacao) return;
  
  const sucesso = await adicionarFerramentaDanificada(dadosDanificadaAnimacao.dadosCompletos);
  
  // Limpar estados
  setShowDanificadaAnimation(false);
  setDadosDanificadaAnimacao(null);
  
  if (sucesso) {
    // Resetar formulário
    setNovaFerramenta({
      nomeItem: '',
      categoria: '',
      descricaoProblema: '',
      responsavel: '',
      localUltimaVez: '',
      dataDanificacao: new Date().toISOString().split('T')[0],
      valorReparo: '',
      statusReparo: 'aguardando_reparo',
      observacoes: '',
      prioridade: 'media'
    });
    
    toast.success('Ferramenta danificada registrada com sucesso!', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
      style: {
        background: '#192734',
        color: '#ffffff',
        borderRadius: '1rem',
        border: '1px solid #38444D'
      }
    });
  } else {
    toast.error('Erro ao registrar ferramenta danificada. Tente novamente.', {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
      style: {
        background: '#192734',
        color: '#ffffff',
        borderRadius: '1rem',
        border: '1px solid #38444D'
      }
    });
  }
};
```

## 🔄 Passo 5: Renderizar Animação (antes do último `</>`  ou `</div>` de fechamento do component)
Adicionar no final do JSX, antes do fechamento final:

```jsx
{/* Animação de Ferramenta Danificada */}
{showDanificadaAnimation && dadosDanificadaAnimacao && (
  <FerramentaDanificadaAnimation
    ferramenta={dadosDanificadaAnimacao.ferramenta}
    onComplete={finalizarRegistroDanificada}
  />
)}
```

## 🎨 Passo 6: Corrigir Cores do Modal
Substituir no modal (linha ~527):

### ANTES:
```jsx
<div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 dark:border-gray-600 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
```

### DEPOIS:
```jsx
<div className="bg-white dark:bg-[#192734] border-2 border-[#F4212E] dark:border-[#F4212E] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
```

### Título (linha ~534):
```jsx
<h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
  <AlertCircle className="w-6 h-6 text-[#F4212E]" />
  Registrar Ferramenta Danificada
</h3>
```

### Todos os inputs do formulário - substituir classes:
REMOVER: `bg-white dark:bg-gray-800 dark:bg-gray-700 border border-gray-200 dark:border-gray-600`
ADICIONAR: `bg-white dark:bg-[#15202B] border-2 border-gray-300 dark:border-[#38444D] focus:ring-[#F4212E] dark:focus:ring-[#F4212E] focus:border-[#F4212E]`

## 📝 Resumo
1. ✅ Import adicionado
2. ⏳ Adicionar 2 estados
3. ⏳ Modificar handleSubmit (remover salvamento direto, adicionar animação)
4. ⏳ Adicionar função finalizarRegistroDanificada
5. ⏳ Renderizar componente de animação
6. ⏳ Corrigir cores do modal

## 🎯 Resultado Esperado
- Quando clicar em "Registrar Ferramenta Danificada", o modal fecha
- Animação dramática de ferramenta quebrando aparece (rachaduras, fragmentos, chamas)
- Após 5.8s, dados são salvos no Firebase
- Toast de sucesso aparece
- Formulário é resetado
- Modal tem cores vibrantes (vermelho/cinza escuro) para melhor contraste
