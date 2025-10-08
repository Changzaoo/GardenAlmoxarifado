# 🚀 Guia: Inserir Pontos Perfeitos + Banco de Horas

## 📋 O que este script faz?

Este script automatiza a inserção de:

1. ✅ **Pontos perfeitos** (exatamente no horário esperado) de **01/10 a 07/10/2025**
2. ✅ **Banco de horas** atualizado para cada funcionário
3. ✅ Respeita a escala de cada funcionário (M, M1, M4)
4. ✅ Pula finais de semana para escalas 5x2
5. ✅ Não duplica pontos já existentes

---

## 🎯 Resultado Esperado

### Antes:
```
Robson: -11h 56m (sem pontos 01-07/10)
Angelo: -3h 03m (sem pontos 01-07/10)
```

### Depois:
```
Robson: +36h 40m no banco de horas (5 dias × 7h20)
Angelo: +40h no banco de horas (5 dias × 8h)
```

---

## 📝 Opções de Execução

### **OPÇÃO 1: Console do Navegador** ⭐ RECOMENDADO

**Passos:**

1. Abra seu sistema no navegador
2. Faça login como **admin**
3. Pressione **F12** para abrir o Console
4. Abra o arquivo: `inserir-pontos-perfeitos.js`
5. **Copie TODO o conteúdo**
6. **Cole no Console** e pressione Enter
7. Aguarde a conclusão (pode levar 1-2 minutos)

**Vantagens:**
- ✅ Não precisa instalar nada
- ✅ Usa autenticação já logada
- ✅ Visual colorido no console
- ✅ Mais rápido

---

### **OPÇÃO 2: Node.js (Standalone)**

**Pré-requisitos:**
```bash
npm install firebase-admin
```

**Configuração:**

1. Abra `inserir-pontos-node.js`
2. Configure suas credenciais do Firebase:

```javascript
const serviceAccount = {
  projectId: "seu-project-id",
  clientEmail: "firebase-adminsdk@seu-projeto.iam.gserviceaccount.com",
  privateKey: "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
};
```

3. Execute:
```bash
node inserir-pontos-node.js
```

**Como obter as credenciais:**
1. Firebase Console → Configurações do Projeto → Contas de Serviço
2. Clique em "Gerar nova chave privada"
3. Baixe o arquivo JSON
4. Use os dados do JSON no script

---

## 📊 O que será criado?

### Para cada funcionário:

#### **Escala M (6x1) - 8h/dia:**
```
01/10 (Ter): Entrada 07:20 | Almoço 12:00-13:00 | Saída 16:20 = 8h
02/10 (Qua): Entrada 07:20 | Almoço 12:00-13:00 | Saída 16:20 = 8h
03/10 (Qui): Entrada 07:20 | Almoço 12:00-13:00 | Saída 16:20 = 8h
04/10 (Sex): Entrada 07:20 | Almoço 12:00-13:00 | Saída 16:20 = 8h
05/10 (Sáb): Entrada 07:20 | Almoço 10:20-11:20 | Saída 13:20 = 6h
06/10 (Dom): Entrada 07:20 | Almoço 10:20-11:20 | Saída 13:20 = 6h
07/10 (Seg): Entrada 07:20 | Almoço 12:00-13:00 | Saída 16:20 = 8h

TOTAL: 46h → Banco de Horas
```

#### **Escala M1 (6x1) - 7h20/dia:**
```
01/10 (Ter): Entrada 07:00 | Almoço 12:00-13:00 | Saída 15:20 = 7h20
02/10 (Qua): Entrada 07:00 | Almoço 12:00-13:00 | Saída 15:20 = 7h20
03/10 (Qui): Entrada 07:00 | Almoço 12:00-13:00 | Saída 15:20 = 7h20
04/10 (Sex): Entrada 07:00 | Almoço 12:00-13:00 | Saída 15:20 = 7h20
05/10 (Sáb): Entrada 07:00 | Almoço 10:00-11:00 | Saída 13:00 = 6h
06/10 (Dom): Entrada 07:00 | Almoço 10:00-11:00 | Saída 13:00 = 6h
07/10 (Seg): Entrada 07:00 | Almoço 12:00-13:00 | Saída 15:20 = 7h20

TOTAL: 43h 20m → Banco de Horas
```

#### **Escala M4 (5x2) - 8h40/dia:**
```
01/10 (Ter): Entrada 06:00 | Almoço 10:30-11:30 | Saída 15:40 = 8h40
02/10 (Qua): Entrada 06:00 | Almoço 10:30-11:30 | Saída 15:40 = 8h40
03/10 (Qui): Entrada 06:00 | Almoço 10:30-11:30 | Saída 15:40 = 8h40
04/10 (Sex): Entrada 06:00 | Almoço 10:30-11:30 | Saída 15:40 = 8h40
05/10 (Sáb): FOLGA (5x2 não trabalha fim de semana)
06/10 (Dom): FOLGA (5x2 não trabalha fim de semana)
07/10 (Seg): Entrada 06:00 | Almoço 10:30-11:30 | Saída 15:40 = 8h40

TOTAL: 43h 20m → Banco de Horas
```

---

## 🔍 Verificações do Script

O script **NÃO duplica pontos**. Antes de inserir, verifica:

1. ✅ Funcionário está ativo (não demitido)
2. ✅ Escala está configurada
3. ✅ Dia da semana compatível com escala
4. ✅ **Não existe ponto já registrado para aquele dia**

Se já existir ponto, pula e vai para o próximo dia.

---

## 📊 Saída do Console

Exemplo do que você verá:

```
🚀 SCRIPT: Inserir Pontos Perfeitos + Banco de Horas

⏳ Iniciando processo...

📋 Buscando funcionários ativos...
✅ 15 funcionários encontrados

👤 Processando: Robson (Escala: M1)
   ✅ 01/10 - 4 pontos inseridos (7h 20m)
   ✅ 02/10 - 4 pontos inseridos (7h 20m)
   ✅ 03/10 - 4 pontos inseridos (7h 20m)
   ✅ 04/10 - 4 pontos inseridos (7h 20m)
   ✅ 05/10 - 4 pontos inseridos (6h 0m)
   ✅ 06/10 - 4 pontos inseridos (6h 0m)
   ✅ 07/10 - 4 pontos inseridos (7h 20m)
   💰 Banco de Horas: +43h 20m

👤 Processando: Angelo (Escala: M)
   ✅ 01/10 - 4 pontos inseridos (8h 0m)
   ✅ 02/10 - 4 pontos inseridos (8h 0m)
   ...
   💰 Banco de Horas: +46h 0m

═══════════════════════════════════════════════════════════
🎉 PROCESSO CONCLUÍDO COM SUCESSO!
═══════════════════════════════════════════════════════════

📊 RESUMO GERAL:
   • Funcionários processados: 15
   • Pontos inseridos: 420 (15 funcionários × 7 dias × 4 pontos)
   • Total de horas adicionadas: 650h 40m

✅ Todos os funcionários agora têm pontos perfeitos de 01/10 a 07/10!
✅ Banco de horas atualizado para todos!

⚡ Recarregue a página para ver as mudanças!
```

---

## ⚠️ Avisos Importantes

1. **Backup:** Este script **insere dados** no Firebase. Recomendo fazer backup antes.

2. **Permissões:** Você precisa estar logado como **admin** ou ter permissões de escrita em:
   - Collection `pontos`
   - Collection `funcionarios`

3. **Não duplica:** Se você executar 2 vezes, não vai duplicar pontos (verifica antes de inserir)

4. **Irreversível:** Uma vez inserido, você precisará deletar manualmente se quiser reverter

5. **Banco de Horas:** As horas são **somadas** ao banco existente, não substituem

---

## 🔄 Como Reverter (se necessário)

Se precisar deletar os pontos inseridos:

```javascript
// Execute no console:
(async function deletarPontosAutomaticos() {
  const pontosQuery = await db.collection('pontos')
    .where('origem', '==', 'script_automatico')
    .get();
    
  const batch = db.batch();
  pontosQuery.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  
  console.log(`${pontosQuery.size} pontos deletados`);
})();
```

---

## 🧪 Teste em Desenvolvimento

Para testar sem afetar produção:

1. Use Firebase Emulator
2. Ou crie um ambiente de teste
3. Ou teste com apenas 1 funcionário primeiro (edite o script para filtrar)

---

## 💡 Dicas

- Execute em **horário de baixo movimento** do sistema
- Avise a equipe antes de executar
- Verifique se o Firebase não tem limite de writes atingido
- Monitor o console para erros

---

## 📞 Suporte

Se encontrar erros:

1. Verifique permissões no Firestore Rules
2. Confira se Firebase está inicializado
3. Veja erros no console (F12)
4. Verifique conexão com internet

**Erro comum:**
```
Missing or insufficient permissions
```
**Solução:** Faça login como admin ou ajuste Firestore Rules

---

## ✅ Checklist Final

Antes de executar:

- [ ] Backup do banco de dados feito
- [ ] Logado como admin
- [ ] Console do navegador aberto (F12)
- [ ] Script copiado para área de transferência
- [ ] Equipe avisada sobre a operação
- [ ] Conexão com internet estável

Pronto para executar! 🚀
