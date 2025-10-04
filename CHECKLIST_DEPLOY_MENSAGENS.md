# ✅ CHECKLIST DE DEPLOY - SISTEMA DE MENSAGENS

## 🚀 Pré-Deploy

### 1. Verificação de Código

- [x] ✅ Todos os componentes criados (6 arquivos)
- [x] ✅ Imports corretos no Workflow.jsx
- [x] ✅ Menu item "Mensagens" adicionado
- [x] ✅ Render condicional configurado
- [x] ✅ Zero erros de compilação
- [x] ✅ Dependências instaladas (date-fns)

### 2. Documentação

- [x] ✅ SISTEMA_MENSAGENS_COMPLETO.md
- [x] ✅ GUIA_RAPIDO_MENSAGENS.md
- [x] ✅ README_MENSAGENS.md
- [x] ✅ RESUMO_MENSAGENS.md
- [x] ✅ FIRESTORE_RULES_MENSAGENS.txt
- [x] ✅ CHECKLIST_DEPLOY_MENSAGENS.md (este arquivo)

---

## 🔧 Configuração do Firebase

### 3. Firestore Rules

- [ ] Abrir Firebase Console
- [ ] Ir em Firestore Database > Rules
- [ ] Copiar regras de `FIRESTORE_RULES_MENSAGENS.txt`
- [ ] Colar e publicar as regras
- [ ] Testar permissões

**Comando alternativo:**
```bash
firebase deploy --only firestore:rules
```

### 4. Índices Compostos

Criar os seguintes índices no Firestore:

#### Índice 1: Conversas por Participante
```
Coleção: conversas
Campos:
  - participantes (Array)
  - ultimaAtualizacao (Descending)
Query Scope: Collection
```

#### Índice 2: Mensagens por Conversa (com deletada)
```
Coleção: mensagens
Campos:
  - conversaId (Ascending)
  - status.deletada (Ascending)
  - timestamp (Ascending)
Query Scope: Collection
```

#### Índice 3: Mensagens por Conversa
```
Coleção: mensagens
Campos:
  - conversaId (Ascending)
  - timestamp (Ascending)
Query Scope: Collection
```

**Como criar:**

1. **Via Console:**
   - Firebase Console > Firestore > Indexes
   - Single-field > Add Index
   - Preencher campos conforme acima

2. **Via CLI:**
```bash
firebase firestore:indexes:create conversas \
  --field participantes:ARRAY \
  --field ultimaAtualizacao:DESCENDING

firebase firestore:indexes:create mensagens \
  --field conversaId:ASCENDING \
  --field status.deletada:ASCENDING \
  --field timestamp:ASCENDING

firebase firestore:indexes:create mensagens \
  --field conversaId:ASCENDING \
  --field timestamp:ASCENDING
```

3. **Via arquivo (firestore.indexes.json):**
```json
{
  "indexes": [
    {
      "collectionGroup": "conversas",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "participantes", "arrayConfig": "CONTAINS" },
        { "fieldPath": "ultimaAtualizacao", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "mensagens",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "conversaId", "order": "ASCENDING" },
        { "fieldPath": "status.deletada", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "mensagens",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "conversaId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "ASCENDING" }
      ]
    }
  ]
}
```

Depois:
```bash
firebase deploy --only firestore:indexes
```

---

## 🔔 Notificações

### 5. Som de Notificação

- [ ] Verificar que existe `public/sounds/notification.wav`
- [ ] Se não existir, adicionar arquivo de som
- [ ] Testar reprodução no navegador

**Alternativas de som:**
- Gravar próprio som (1-2 segundos)
- Usar som padrão do sistema
- Download de sites como freesound.org

### 6. Permissões de Notificação

- [ ] Testar solicitação de permissão no primeiro uso
- [ ] Verificar que funciona em Chrome/Firefox/Safari
- [ ] Testar notificações desktop
- [ ] Testar notificações mobile (Capacitor)

---

## 📱 Mobile (Capacitor)

### 7. Configuração Android

```typescript
// capacitor.config.ts
{
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#EF4444",
      sound: "notification.mp3"
    }
  }
}
```

### 8. Configuração iOS

```typescript
// capacitor.config.ts
{
  plugins: {
    LocalNotifications: {
      sound: "notification.wav"
    }
  }
}
```

### 9. Build Mobile

```bash
# Android
npm run build
npx cap sync android
npx cap open android

# iOS
npm run build
npx cap sync ios
npx cap open ios
```

---

## 🧪 Testes

### 10. Testes Funcionais

#### Conversas Individuais
- [ ] Criar conversa individual
- [ ] Enviar mensagem de texto
- [ ] Receber mensagem
- [ ] Ver status de leitura
- [ ] Badge de não lidas funcionando

#### Grupos
- [ ] Criar grupo
- [ ] Adicionar múltiplos participantes
- [ ] Enviar mensagem no grupo
- [ ] Todos recebem a mensagem
- [ ] Nome do grupo aparece correto

#### Upload de Imagens
- [ ] Selecionar imagem
- [ ] Upload via Discord
- [ ] Imagem aparece na mensagem
- [ ] Outros usuários veem a imagem
- [ ] Validação de tamanho (10MB)

#### Notificações
- [ ] Som toca ao receber mensagem
- [ ] Notificação desktop aparece
- [ ] Notificação mobile aparece
- [ ] Badge atualiza automaticamente
- [ ] Limpa ao abrir conversa

#### Interface
- [ ] Layout responsivo (mobile/desktop)
- [ ] Dark mode funcionando
- [ ] Busca filtrando conversas
- [ ] Scroll automático
- [ ] Agrupamento por data

### 11. Testes de Segurança

- [ ] Não-participante NÃO vê conversa
- [ ] Não-participante NÃO envia mensagem
- [ ] Usuário NÃO modifica participantes
- [ ] Mensagens de outros setores NÃO aparecem
- [ ] Upload restrito a participantes

### 12. Testes de Performance

- [ ] Carregamento < 500ms
- [ ] Envio de mensagem < 100ms
- [ ] Scroll suave com 100+ mensagens
- [ ] Múltiplas conversas sem lag
- [ ] Memória estável (< 100MB)

---

## 🐛 Debugging

### 13. Console do Navegador

Verificar que NÃO aparecem erros:

```javascript
// Abrir DevTools (F12) e verificar:

// ✅ Não deve ter erros vermelhos
// ✅ Warnings aceitáveis
// ✅ Network requests bem-sucedidos
// ✅ Firestore listeners conectados
```

### 14. Logs Úteis

```javascript
// Para debug, adicione temporariamente:

console.log('Conversas carregadas:', conversas);
console.log('Mensagens:', mensagens);
console.log('Usuário:', usuario);
console.log('Conversa selecionada:', conversaSelecionada);
```

**⚠️ REMOVER antes de produção!**

---

## 📊 Monitoramento

### 15. Firebase Console

Monitorar após deploy:

- [ ] Firestore > Usage
  - Reads/Writes/Deletes
  - Quantidade de documentos
  
- [ ] Firestore > Indexes
  - Status dos índices (Building → Success)
  
- [ ] Authentication > Users
  - Usuários ativos
  
- [ ] Storage (Discord)
  - Tamanho de imagens

### 16. Métricas de Sucesso

```
✅ 0 erros críticos
✅ < 1% taxa de falha em mensagens
✅ > 95% mensagens entregues < 1s
✅ > 90% satisfação dos usuários
✅ 0 vazamentos de memória
```

---

## 📣 Comunicação

### 17. Anúncio para Usuários

**Exemplo de mensagem:**

```
🎉 NOVIDADE! Sistema de Mensagens

Agora você pode:
✅ Conversar com colegas em tempo real
✅ Criar grupos de trabalho
✅ Enviar fotos
✅ Receber notificações instantâneas

📱 Acesse pelo menu "Mensagens"

📖 Guia rápido: [link]
❓ Dúvidas: [suporte]
```

### 18. Treinamento

- [ ] Criar vídeo tutorial (2-3 min)
- [ ] Documentar perguntas frequentes
- [ ] Preparar equipe de suporte
- [ ] Criar material de onboarding

---

## 🔄 Rollback Plan

### 19. Backup

Antes de fazer deploy:

```bash
# Backup do Firestore
firebase firestore:export gs://[BUCKET]/backup-$(date +%Y%m%d)

# Backup do código
git commit -m "Sistema de mensagens - antes do deploy"
git tag v1.0-pre-mensagens
git push --tags
```

### 20. Procedimento de Rollback

Se algo der errado:

```bash
# Reverter código
git revert HEAD
git push

# Ou voltar para tag anterior
git reset --hard v1.0-pre-mensagens
git push -f

# Restaurar Firestore (se necessário)
firebase firestore:import gs://[BUCKET]/backup-[DATE]
```

---

## ✅ Deploy Final

### 21. Build de Produção

```bash
# Limpar cache
rm -rf node_modules
rm -rf build
npm cache clean --force

# Reinstalar dependências
npm install

# Build otimizado
npm run build

# Verificar tamanho do build
du -sh build/
```

### 22. Deploy

```bash
# Deploy para Firebase Hosting
firebase deploy --only hosting

# Ou se usar outro serviço:
# Vercel
vercel --prod

# Netlify
netlify deploy --prod
```

### 23. Verificação Pós-Deploy

- [ ] Abrir URL de produção
- [ ] Fazer login
- [ ] Testar criar conversa
- [ ] Enviar mensagem de teste
- [ ] Verificar notificações
- [ ] Testar em mobile
- [ ] Confirmar com 2-3 usuários beta

---

## 📈 Pós-Deploy

### 24. Primeira Semana

- [ ] Monitorar logs de erro
- [ ] Coletar feedback dos usuários
- [ ] Ajustar performance se necessário
- [ ] Documentar issues encontrados
- [ ] Fazer hot-fixes se crítico

### 25. Primeiro Mês

- [ ] Analisar métricas de uso
- [ ] Identificar funcionalidades mais usadas
- [ ] Planejar melhorias (fase 2)
- [ ] Otimizar queries mais lentas
- [ ] Considerar cache para imagens

---

## 🎯 Critérios de Sucesso

### Sistema está pronto quando:

- [x] ✅ Zero erros de compilação
- [ ] ✅ Índices do Firestore criados
- [ ] ✅ Regras de segurança publicadas
- [ ] ✅ Notificações funcionando
- [ ] ✅ Todos os testes passando
- [ ] ✅ Documentação completa
- [ ] ✅ Deploy realizado
- [ ] ✅ Usuários conseguem enviar mensagens
- [ ] ✅ Performance dentro do esperado
- [ ] ✅ Sem vazamento de dados

---

## 📞 Contatos de Emergência

### Em caso de problemas críticos:

**Equipe de Desenvolvimento:**
- [Nome do Dev Lead]
- [Email/Telefone]

**Suporte Firebase:**
- Console: https://console.firebase.google.com
- Docs: https://firebase.google.com/docs

**Monitoramento:**
- [Link para dashboard]
- [Link para logs]

---

## 🎉 CONCLUSÃO

Após completar todos os itens deste checklist:

```
┌────────────────────────────────────┐
│  ✅ SISTEMA PRONTO PARA PRODUÇÃO   │
│                                    │
│  🚀 Deploy realizado               │
│  ✅ Testes concluídos              │
│  📊 Monitoramento ativo            │
│  👥 Usuários notificados           │
│                                    │
│  SUCESSO! 🎊                       │
└────────────────────────────────────┘
```

**Parabéns! Sistema de mensagens no ar! 💬🎉**

---

*Checklist criado em: 3 de outubro de 2025*
*Última atualização: 3 de outubro de 2025*
