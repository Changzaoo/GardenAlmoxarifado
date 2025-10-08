# 🕐 Sistema de Reset de Horas - Documentação

## 📋 Visão Geral

Este sistema permite **resetar o cálculo de horas de todos os funcionários** a partir de uma data específica durante o mês, desconsiderando os dias anteriores.

Útil para situações como:
- ✅ Correção de erros acumulados no início do mês
- ✅ Mudança de política de horas
- ✅ Reset após implementação de correções no sistema
- ✅ Início de novo período de contagem

---

## 🗓️ Configuração Atual

**Data de Início:** **08/10/2025** (08 de outubro de 2025)

Todos os funcionários terão suas horas contadas apenas **a partir desta data**. Os dias anteriores de outubro (01/10 a 07/10) **não são considerados** no cálculo do saldo atual.

---

## 📁 Arquivos Envolvidos

### 1. `src/utils/dataCalculoHoras.js`
**Configuração central da data de início**

```javascript
// Data de início para cálculo de horas
export const DATA_INICIO_CALCULO_HORAS = new Date(2025, 9, 8); // 08/10/2025
```

#### Funções disponíveis:

- **`obterDataInicioCalculoHoras()`**
  - Retorna a data de início configurada se for no mês atual
  - Caso contrário, retorna o primeiro dia do mês
  - Garante que o sistema volta ao normal automaticamente no próximo mês

- **`estaDentroPeriodoCalculo(data)`**
  - Verifica se uma data específica está dentro do período de cálculo
  - Útil para filtros e validações

---

### 2. `src/components/Funcionarios/components/CardFuncionarioModerno.jsx`
**Componente que calcula e exibe as horas do funcionário**

```javascript
import { obterDataInicioCalculoHoras } from '../../../utils/dataCalculoHoras';

// No useEffect que busca pontos:
const dataInicio = obterDataInicioCalculoHoras();
const pontosMes = snapshot.docs
  .filter(ponto => {
    const dataPonto = new Date(ponto.timestamp || ponto.data);
    return dataPonto >= dataInicio; // Filtra apenas pontos a partir da data configurada
  });
```

---

### 3. `src/components/Funcionarios/BannerResetHoras.jsx`
**Banner informativo que aparece na tela de funcionários**

Exibe automaticamente quando:
- A data de início NÃO é o primeiro dia do mês
- A data de início está no mês atual

Exemplo de mensagem exibida:
> 📅 **Cálculo de Horas Resetado**
> O cálculo de horas de todos os funcionários foi reiniciado a partir de 08 de outubro de 2025. Os dias anteriores deste mês não estão sendo considerados no saldo atual.

---

### 4. `src/components/Funcionarios/FuncionariosTab.jsx`
**Página principal que renderiza o banner**

```javascript
import BannerResetHoras from './BannerResetHoras';

// No JSX:
<BannerResetHoras />
```

---

## 🔧 Como Alterar a Data de Início

### Para alterar para outra data:

1. Abra o arquivo: `src/utils/dataCalculoHoras.js`

2. Modifique a constante:
```javascript
// Formato: new Date(ano, mês-1, dia)
// Exemplo para 15/10/2025:
export const DATA_INICIO_CALCULO_HORAS = new Date(2025, 9, 15);

// Exemplo para 01/11/2025:
export const DATA_INICIO_CALCULO_HORAS = new Date(2025, 10, 1);
```

⚠️ **Atenção:** O mês é **zero-indexed** (Janeiro = 0, Fevereiro = 1, ..., Outubro = 9)

3. Salve o arquivo e recarregue a aplicação

---

## 🔄 Comportamento Automático

### No Mês Seguinte:

Quando o calendário virar para **novembro/2025**, o sistema **automaticamente** voltará a contar desde o **primeiro dia do mês** (01/11/2025).

Isso ocorre porque a função `obterDataInicioCalculoHoras()` verifica:
```javascript
// Se a data configurada não for do mês atual, usa o primeiro dia do mês
if (dataInicio.getMonth() !== hoje.getMonth()) {
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
}
```

---

## 📊 Impacto no Sistema

### O que é afetado:
✅ Card de funcionários (horas positivas/negativas/normais)
✅ Modal de detalhes de horas
✅ Exportação para Excel/PDF
✅ Todos os relatórios de horas

### O que NÃO é afetado:
❌ Pontos já registrados (dados não são deletados)
❌ Histórico de pontos
❌ Outras funcionalidades do sistema

---

## 🎯 Casos de Uso

### Exemplo 1: Reset no meio do mês
**Situação:** Descobriu erro no cálculo no dia 08/10
**Solução:** Configure `DATA_INICIO_CALCULO_HORAS = new Date(2025, 9, 8)`
**Resultado:** Todos começam com 0h 00m no dia 08/10

### Exemplo 2: Novo período de contagem
**Situação:** Empresa decide começar contagem a cada dia 15
**Solução:** Configure `DATA_INICIO_CALCULO_HORAS = new Date(2025, 9, 15)`
**Resultado:** Saldo zera no dia 15/10

### Exemplo 3: Voltar ao normal
**Situação:** Quer voltar a contar desde o início do mês
**Solução:** Configure `DATA_INICIO_CALCULO_HORAS = new Date(2025, 9, 1)`
**Resultado:** Conta desde 01/10/2025

---

## 🧪 Como Testar

1. Verifique a data atual do sistema
2. Configure `DATA_INICIO_CALCULO_HORAS` para hoje ou ontem
3. Acesse a página de Funcionários
4. Observe:
   - Banner informativo aparece
   - Horas dos funcionários mostram saldo zerado ou reduzido
   - Dias anteriores não são contabilizados

---

## 📝 Notas Importantes

1. **Dados Preservados:** Os pontos registrados nos dias anteriores **não são deletados**, apenas não são contabilizados no saldo atual.

2. **Reversível:** Você pode alterar a data de início a qualquer momento.

3. **Transparente:** O banner informa claramente aos usuários sobre o reset.

4. **Automático:** No próximo mês, volta automaticamente ao comportamento padrão.

---

## 🚀 Melhorias Futuras (Sugestões)

- [ ] Interface para admin configurar a data via dashboard
- [ ] Histórico de resets realizados
- [ ] Notificação por email/push quando reset for aplicado
- [ ] Relatório comparativo (com/sem reset)
- [ ] Opção de reset individual por funcionário

---

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Verifique se a data está no formato correto (ano, mês-1, dia)
2. Confira se o mês está zero-indexed
3. Limpe o cache do navegador (Ctrl+Shift+R)
4. Verifique o console do navegador para erros

---

**Última Atualização:** 08/10/2025  
**Versão:** 1.0.0
