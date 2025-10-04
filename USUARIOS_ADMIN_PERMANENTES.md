# 🔐 Criação de Usuários Administradores Permanentes

## 📋 Usuários Criados

Este script cria **2 usuários administradores permanentes** no sistema:

### 👤 Usuário 1 - Admin Principal
```
Email/Login: admin
Senha: 1533
Nível: Administrador (4)
```

### 👤 Usuário 2 - Angelo
```
Email/Login: Angelo
Senha: voce
Nível: Administrador (4)
```

---

## 🚀 Como Executar

### Opção 1: Comando Direto

```bash
node scripts/criar-usuarios-admin.js
```

### Opção 2: Via NPM (se configurado)

```bash
npm run criar-admins
```

---

## ✨ Recursos dos Usuários

### 🔒 Segurança
- ✅ Senhas criptografadas com **SHA-512**
- ✅ Salt único para cada usuário
- ✅ Versão de senha: 2
- ✅ Algoritmo: SHA-512

### 📊 Configurações
- ✅ **Nível**: Administrador (4) - Acesso total
- ✅ **Status**: Offline (ao criar)
- ✅ **Menu Config**: Todos os 14 itens visíveis
- ✅ **Item Favorito**: sistema-resumo
- ✅ **Cargo**: Administrador

### 📱 Menu Completo (14 itens)
1. Notificações
2. Relatórios de Erro
3. Mensagens
4. Tarefas
5. Escala
6. Inventário
7. Empréstimos
8. Funcionários
9. Empresas e Setores
10. Ponto
11. Ranking
12. Feed
13. Usuários
14. Sistema (Resumo)

---

## 🎯 Funcionalidades do Script

### ✅ Validações
- Verifica se usuário já existe antes de criar
- Não duplica usuários
- Gera senhas seguras automaticamente
- Usa modelo completo de usuário

### 📦 Dados Completos
Cada usuário é criado com:
- Dados básicos (nome, email, nível)
- Segurança (hash SHA-512, salt)
- Informações profissionais
- Configuração de menu personalizada
- Status e última vez online
- Item favorito
- Datas de criação

### 🔄 Processamento
- Cria usuários em sequência
- Mostra progresso no console
- Exibe resumo ao final
- Indica sucessos e erros

---

## 📝 Saída Esperada

Ao executar o script, você verá:

```
═══════════════════════════════════════════════════════
🔐 CRIAÇÃO DE USUÁRIOS ADMINISTRADORES PERMANENTES
═══════════════════════════════════════════════════════

📝 Criando usuários administradores...

✅ Usuário "admin" criado com sucesso!
   ID: abc123xyz
   Email: admin
   Nível: Administrador (4)

✅ Usuário "Angelo" criado com sucesso!
   ID: def456uvw
   Email: Angelo
   Nível: Administrador (4)

═══════════════════════════════════════════════════════
📊 RESUMO DA CRIAÇÃO
═══════════════════════════════════════════════════════
✅ Usuários criados: 2
⚠️  Usuários já existentes: 0
📦 Total processados: 2

═══════════════════════════════════════════════════════
🎉 CREDENCIAIS DE ACESSO
═══════════════════════════════════════════════════════

👤 Usuário 1:
   Email/Login: admin
   Senha: 1533
   Nível: Administrador

👤 Usuário 2:
   Email/Login: Angelo
   Senha: voce
   Nível: Administrador

✅ Os usuários foram criados com sucesso!
🔐 Use essas credenciais para fazer login no sistema.

═══════════════════════════════════════════════════════
✨ Script concluído com sucesso!
═══════════════════════════════════════════════════════
```

---

## 🔧 Requisitos

### Pacotes Necessários
- `firebase` (já instalado no projeto)
- `crypto` (nativo do Node.js)

### Configuração
- Firebase já configurado no projeto
- Credenciais válidas no código

---

## ⚠️ Observações Importantes

### 🔒 Segurança
- **NUNCA** compartilhe essas credenciais publicamente
- Mantenha as senhas em local seguro
- Considere trocar as senhas após primeiro acesso

### 🔄 Re-execução
- Se executar novamente, o script **não duplica** usuários
- Verifica se o email já existe antes de criar
- Mostra aviso se usuário já existe

### 📊 Firestore
- Usuários são adicionados na coleção `usuario`
- Todos os campos do modelo novo são incluídos
- Compatível com sistema de migração

---

## 🎓 Uso no Sistema

### 1️⃣ Login
1. Acesse o sistema
2. Digite o email/login: `admin` ou `Angelo`
3. Digite a senha: `1533` ou `voce`
4. Clique em "Entrar"

### 2️⃣ Recursos Disponíveis
Com permissão de **Administrador**, você pode:
- ✅ Acessar todas as páginas
- ✅ Criar/editar/excluir usuários
- ✅ Gerenciar empresas e setores
- ✅ Ver relatórios completos
- ✅ Executar migrações
- ✅ Configurar o sistema
- ✅ Acessar ferramentas de debug

### 3️⃣ Personalização
Após login, você pode:
- Alterar sua senha
- Configurar menu personalizado
- Definir item favorito
- Adicionar foto de perfil
- Atualizar informações

---

## 🆘 Solução de Problemas

### ❌ Erro: "Usuário já existe"
**Solução:** O usuário já foi criado anteriormente. Use as credenciais existentes para login.

### ❌ Erro de conexão Firebase
**Solução:** 
1. Verifique sua conexão com internet
2. Confirme que as credenciais do Firebase estão corretas
3. Verifique se o projeto Firebase está ativo

### ❌ Script não executa
**Solução:**
1. Certifique-se de estar no diretório raiz do projeto
2. Execute: `npm install` para instalar dependências
3. Tente executar novamente

---

## 📚 Arquivos Relacionados

- **Script**: `scripts/criar-usuarios-admin.js`
- **Modelo**: `src/constants/usuarioModel.js`
- **Serviço**: `src/services/statusUsuarioService.js`
- **Login**: `src/components/Workflow.jsx`

---

## ✅ Checklist de Verificação

Após executar o script, verifique:

- [ ] Script executou sem erros
- [ ] Mensagem de sucesso foi exibida
- [ ] 2 usuários foram criados
- [ ] Consegue fazer login com `admin / 1533`
- [ ] Consegue fazer login com `Angelo / voce`
- [ ] Ambos têm acesso total ao sistema
- [ ] Menu completo está disponível
- [ ] Status online funciona

---

✅ **Pronto para usar! Execute o script e faça login com as credenciais criadas.** 🚀
