# 🌱 Exemplos de Uso - Zendaya Jardinagem

## 💡 Casos de Uso Práticos

Este guia mostra exemplos práticos de como usar o sistema Zendaya Jardinagem no dia a dia.

---

## 📋 Cenário 1: Recebimento de Novas Mudas

**Situação:** Chegou um lote de 100 mudas de rosas vermelhas.

### Passos:
1. Acesse **Inventário**
2. Clique em **Adicionar Item**
3. Preencha:
   - **Nome**: Mudas de Rosa Vermelha
   - **Quantidade**: 100
   - **Categoria**: 🌱 Plantas & Mudas
4. Clique em **Adicionar**

**Resultado:** Sistema registra 100 mudas disponíveis para venda/uso.

---

## 📋 Cenário 2: Empréstimo de Ferramentas para Funcionário

**Situação:** João precisa de 2 pás, 1 regador e 1 tesoura de poda para trabalhar no jardim.

### Passos:
1. Acesse **Empréstimos**
2. Clique em **Novo Empréstimo**
3. Selecione:
   - **Funcionário**: João Silva
   - **Ferramentas**:
     * Pá de Jardinagem Grande (2 unidades)
     * Regador 10L (1 unidade)
     * Tesoura de Poda Profissional (1 unidade)
4. Confirme o empréstimo

**Resultado:** 
- Disponibilidade atualizada automaticamente
- João recebe as ferramentas
- Sistema rastreia o empréstimo

---

## 📋 Cenário 3: Controle de Estoque de Fertilizantes

**Situação:** Precisa verificar quanto fertilizante NPK ainda tem em estoque.

### Passos:
1. Acesse **Inventário**
2. Use o filtro de categoria: **🧪 Fertilizantes & Adubos**
3. Localize "Fertilizante NPK 10-10-10"
4. Veja:
   - **Quantidade Total**: 15 sacos
   - **Disponível**: 12 sacos
   - **Em Uso**: 3 sacos

**Ação:** Se estoque baixo, faça uma requisição de compra!

---

## 📋 Cenário 4: Compra de Novos Vasos

**Situação:** Acabou o estoque de vasos de 20cm, precisa comprar mais.

### Passos:
1. Acesse **Inventário** → **Compras**
2. Clique em **Nova Requisição**
3. Preencha:
   - **Item**: Vaso de Barro 20cm
   - **Quantidade**: 100 unidades
   - **Fornecedor**: Cerâmica São Paulo
   - **Justificativa**: "Estoque zerado, alta demanda"
   - **Valor**: R$ 8,00/unidade
4. Envie para aprovação

**Resultado:** 
- Requisição enviada ao supervisor
- Notificação de aprovação/rejeição
- Após aprovação, atualiza estoque automaticamente

---

## 📋 Cenário 5: Devolução Parcial de Empréstimo

**Situação:** João devolveu 1 pá, mas ainda está usando a outra pá, o regador e a tesoura.

### Passos:
1. Acesse **Empréstimos**
2. Encontre o empréstimo de João
3. Clique em **Devolver**
4. Selecione:
   - ✅ Pá de Jardinagem Grande (1 unidade) - DEVOLVER
   - ❌ Pá de Jardinagem Grande (1 unidade) - MANTER
   - ❌ Regador 10L - MANTER
   - ❌ Tesoura de Poda - MANTER
5. Confirme a devolução parcial

**Resultado:**
- 1 pá volta ao estoque (disponível +1)
- Empréstimo continua ativo com 3 itens
- Sistema atualiza automaticamente

---

## 📋 Cenário 6: Verificação Mensal de Inventário

**Situação:** Final do mês, precisa fazer a contagem de inventário.

### Passos:
1. Acesse **Inventário** → **Verificação**
2. Clique em **Nova Verificação**
3. O sistema mostra:
   - **Total de Itens**: 75
   - **Empréstimos Ativos**: 12
   - **Diferenças do mês anterior**:
     * Vasos de Barro 20cm: **-15** 📉 (vendidos)
     * Mudas de Rosa: **+50** 📈 (compradas)
     * Fertilizante NPK: **-8** 📉 (usado)
4. Revise e confirme a verificação

**Resultado:** Histórico salvo para comparação futura.

---

## 📋 Cenário 7: Item Danificado

**Situação:** Uma tesoura de poda quebrou durante o uso.

### Passos:
1. Acesse **Inventário** → **Danificadas**
2. Clique em **Registrar Item Danificado**
3. Preencha:
   - **Item**: Tesoura de Poda Profissional
   - **Quantidade**: 1
   - **Tipo de Dano**: Lâmina quebrada
   - **Responsável**: João Silva
   - **Data**: Hoje
   - **Fotos**: (opcional) tire foto do dano
   - **Ação**: Reparo ou Substituição
4. Salve o registro

**Resultado:**
- Item removido do estoque disponível
- Registro de dano criado
- Possível desconto no salário ou seguro

---

## 📋 Cenário 8: Adicionar Novo Tipo de Muda

**Situação:** A empresa começou a trabalhar com um novo tipo de planta: Mudas de Hibisco.

### Passos:
1. Acesse **Inventário**
2. Clique em **Adicionar Item**
3. Preencha:
   - **Nome**: Mudas de Hibisco Vermelho
   - **Quantidade**: 80
   - **Categoria**: 🌱 Plantas & Mudas
4. Adicione ao inventário

**Resultado:** Novo item disponível para venda/empréstimo.

---

## 📋 Cenário 9: Busca Rápida por Item

**Situação:** Cliente pergunta se tem substrato para suculentas.

### Passos:
1. Acesse **Inventário**
2. Use a barra de busca: digite "suculenta"
3. Veja o resultado:
   - **Mudas de Suculenta Mista**: 92 disponíveis
   - **Substrato para Suculentas (10L)**: 40 disponíveis

**Resposta ao Cliente:** "Sim! Temos 92 mudas e 40 sacos de substrato em estoque!"

---

## 📋 Cenário 10: Relatório de Empréstimos do Mês

**Situação:** Gerente quer saber quantos empréstimos foram feitos este mês.

### Passos:
1. Acesse **Empréstimos**
2. Use o filtro de data: "Este mês"
3. Veja as estatísticas:
   - **Total de empréstimos**: 45
   - **Itens mais emprestados**:
     * Pá de Jardinagem: 28 vezes
     * Tesoura de Poda: 22 vezes
     * Regador: 18 vezes
   - **Funcionários que mais pegaram**: João (12), Maria (10), Pedro (8)

**Uso:** Identificar necessidade de comprar mais itens populares.

---

## 🎯 Dicas Práticas

### ✅ Boas Práticas

1. **Faça verificação mensal** - Compare estoque todo mês
2. **Registre danificados imediatamente** - Evita perda de controle
3. **Use os filtros** - Encontre itens rapidamente
4. **Acompanhe empréstimos ativos** - Cobre devoluções atrasadas
5. **Peça reabastecimento com antecedência** - Evite faltar itens

### ⚠️ Evite

1. ❌ Não emprestar sem registrar no sistema
2. ❌ Não deixar itens danificados sem registrar
3. ❌ Não ignorar alertas de estoque baixo
4. ❌ Não fazer devoluções sem atualizar o sistema

---

## 📊 Indicadores Importantes

### Monitore Sempre:

1. **Itens com estoque baixo**
   - Verde: > 50% do estoque total
   - Amarelo: 20-50% do estoque total
   - Vermelho: < 20% do estoque total

2. **Empréstimos atrasados**
   - Alerta automático após 7 dias

3. **Items mais usados**
   - Identifique padrões de uso
   - Compre mais dos itens populares

4. **Sazonalidade**
   - Primavera: Maior saída de mudas e sementes
   - Verão: Maior uso de fertilizantes
   - Outono: Preparação de terra
   - Inverno: Manutenção de ferramentas

---

## 🌟 Fluxo de Trabalho Ideal

### Rotina Diária:
1. ✅ Verificar empréstimos do dia
2. ✅ Processar devoluções
3. ✅ Atualizar disponibilidade
4. ✅ Verificar alertas de estoque

### Rotina Semanal:
1. ✅ Revisar itens danificados
2. ✅ Processar requisições de compra
3. ✅ Limpar e organizar ferramentas devolvidas

### Rotina Mensal:
1. ✅ Fazer verificação completa de inventário
2. ✅ Gerar relatório de movimentação
3. ✅ Planejar compras para próximo mês
4. ✅ Analisar padrões de uso

---

## 🎓 Treinamento para Novos Usuários

### Nível Iniciante (Funcionário):
- Consultar disponibilidade de itens
- Solicitar empréstimos
- Devolver itens emprestados

### Nível Intermediário (Supervisor):
- Aprovar/rejeitar requisições
- Adicionar novos itens
- Gerenciar empréstimos
- Registrar itens danificados/perdidos

### Nível Avançado (Administrador):
- Gerenciar usuários
- Configurar permissões
- Executar diagnósticos
- Gerar relatórios completos
- Fazer backup de dados

---

## 📞 Ajuda Rápida

**Dúvida:** Como adicionar um novo tipo de planta?  
**Resposta:** Inventário → Adicionar Item → Categoria: Plantas & Mudas

**Dúvida:** Funcionário não devolveu ferramenta no prazo.  
**Resposta:** Empréstimos → Localizar empréstimo → Ver detalhes → Contatar funcionário

**Dúvida:** Como saber quais itens estão acabando?  
**Resposta:** Inventário → Filtrar por "Disponibilidade Baixa"

**Dúvida:** Preciso comprar mais fertilizante, como fazer?  
**Resposta:** Inventário → Compras → Nova Requisição

---

**Sistema:** Zendaya Jardinagem  
**Versão:** 2.0  
**Última Atualização:** 2 de outubro de 2025
