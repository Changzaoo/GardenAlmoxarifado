# 🔄 Migração de Usuários Antigos para o Novo Sistema

## 📋 Visão Geral

Este guia explica como migrar os usuários da versão antiga (commit 9bf48206) para a nova versão com agrupamento por empresa/setor e Firebase.

---

## 🎯 Objetivos da Migração

1. ✅ Manter todos os usuários existentes
2. ✅ Adicionar campos de empresa e setor
3. ✅ Migrar senhas para SHA-512
4. ✅ Preservar permissões e dados
5. ✅ Garantir compatibilidade com novo sistema

---

## 📊 Estrutura de Dados

### **ANTES (Local Storage / Versão Antiga)**
```javascript
{
  id: "1",
  nome: "João Silva",
  email: "joao",
  senha: "123456",              // ← Texto plano
  nivel: 3,                     // ← Nível antigo
  ativo: true,
  dataCriacao: "2025-01-01",
  ultimoLogin: null
}
```

### **AGORA (Firebase / Versão Nova)**
```javascript
{
  id: "abc123",
  nome: "João Silva",
  email: "joao",
  senha: "hash_sha512...",      // ← Criptografado
  senhaVersion: 2,              // ← Indicador SHA-512
  nivel: 4,                     // ← Novo sistema (1-4)
  ativo: true,
  empresaId: "emp1",            // ← NOVO
  empresaNome: "Zendaya",       // ← NOVO (para exibição)
  setorId: "set1",              // ← NOVO
  setorNome: "Jardim",          // ← NOVO (para exibição)
  cargo: "Gerente",             // ← NOVO
  dataCriacao: "2025-01-01T00:00:00.000Z",
  ultimoLogin: null
}
```

---

## 🔧 Script de Migração

### **Passo 1: Preparar Empresas e Setores**

```javascript
// 1. Criar empresa padrão no Firebase
const empresaPadrao = {
  nome: "Zendaya Jardinagem",
  ativo: true,
  dataCriacao: new Date().toISOString()
};

const empresaRef = await addDoc(collection(db, 'empresas'), empresaPadrao);
const empresaId = empresaRef.id;

// 2. Criar setores padrões
const setores = [
  { nome: "Jardim", empresaId, ativo: true },
  { nome: "Administrativo", empresaId, ativo: true },
  { nome: "Manutenção", empresaId, ativo: true }
];

const setorIds = {};
for (const setor of setores) {
  const setorRef = await addDoc(collection(db, 'setores'), setor);
  setorIds[setor.nome] = setorRef.id;
}
```

### **Passo 2: Mapear Níveis Antigos para Novos**

```javascript
// Mapeamento de níveis
const MAPEAMENTO_NIVEIS = {
  1: 1,  // Funcionário → Funcionário
  2: 2,  // Supervisor → Supervisor
  3: 3,  // Gerente → Gerente
  4: 4   // Admin → Admin
};

// Atribuir setor baseado no nível (sugestão)
const SETOR_POR_NIVEL = {
  1: "Jardim",           // Funcionários no jardim
  2: "Jardim",           // Supervisores no jardim
  3: "Administrativo",   // Gerentes no admin
  4: null                // Admin não precisa de setor
};
```

### **Passo 3: Migrar Usuários**

```javascript
import { encryptPassword } from './utils/crypto';

async function migrarUsuarios() {
  // 1. Buscar usuários antigos do Firebase
  const usuariosAntigos = await getDocs(collection(db, 'usuarios'));
  
  let migrados = 0;
  let erros = 0;

  for (const docSnap of usuariosAntigos.docs) {
    const usuarioAntigo = { id: docSnap.id, ...docSnap.data() };
    
    try {
      // 2. Verificar se já foi migrado
      if (usuarioAntigo.senhaVersion === 2 && usuarioAntigo.empresaId) {
        console.log(`✅ ${usuarioAntigo.nome} já migrado`);
        continue;
      }

      // 3. Preparar dados migrados
      const usuarioNovo = {
        ...usuarioAntigo,
        
        // Criptografar senha se ainda não foi
        senha: usuarioAntigo.senhaVersion === 2 
          ? usuarioAntigo.senha 
          : await encryptPassword(usuarioAntigo.senha),
        senhaVersion: 2,
        
        // Mapear nível
        nivel: MAPEAMENTO_NIVEIS[usuarioAntigo.nivel] || usuarioAntigo.nivel,
        
        // Adicionar empresa e setor (se não for admin)
        ...(usuarioAntigo.nivel !== 4 && {
          empresaId: empresaId,
          empresaNome: "Zendaya Jardinagem",
          setorId: setorIds[SETOR_POR_NIVEL[usuarioAntigo.nivel]],
          setorNome: SETOR_POR_NIVEL[usuarioAntigo.nivel],
          cargo: obterCargoPorNivel(usuarioAntigo.nivel)
        })
      };

      // 4. Atualizar no Firebase
      await updateDoc(doc(db, 'usuarios', usuarioAntigo.id), usuarioNovo);
      
      console.log(`✅ Migrado: ${usuarioAntigo.nome}`);
      migrados++;
      
    } catch (error) {
      console.error(`❌ Erro ao migrar ${usuarioAntigo.nome}:`, error);
      erros++;
    }
  }

  console.log(`\n📊 Migração concluída:`);
  console.log(`✅ Migrados: ${migrados}`);
  console.log(`❌ Erros: ${erros}`);
}

function obterCargoPorNivel(nivel) {
  const cargos = {
    1: "Jardineiro",
    2: "Supervisor de Jardim",
    3: "Gerente de Operações",
    4: "Administrador"
  };
  return cargos[nivel] || "Funcionário";
}
```

---

## 🚀 Executando a Migração

### **Opção 1: Via Console do Navegador**

1. Abra o sistema no navegador
2. Abra o Console (F12)
3. Cole o script de migração
4. Execute: `migrarUsuarios()`
5. Aguarde conclusão

### **Opção 2: Via Componente Admin**

Adicione ao `SistemaResumo.jsx`:

```jsx
const [migracaoStatus, setMigracaoStatus] = useState(null);

const executarMigracao = async () => {
  setMigracaoStatus('executando');
  try {
    await migrarUsuarios();
    setMigracaoStatus('sucesso');
  } catch (error) {
    setMigracaoStatus('erro');
    console.error(error);
  }
};

// No JSX
{usuario?.nivel === NIVEIS_PERMISSAO.ADMIN && (
  <button onClick={executarMigracao}>
    🔄 Migrar Usuários Antigos
  </button>
)}
```

### **Opção 3: Script Node.js (Recomendado)**

Crie `scripts/migrar-usuarios.js`:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function main() {
  // Cole o código de migração aqui
  await migrarUsuarios();
  process.exit(0);
}

main().catch(console.error);
```

Execute:
```bash
node scripts/migrar-usuarios.js
```

---

## 📋 Checklist de Migração

### **Antes da Migração**
- [ ] Fazer backup do Firebase
- [ ] Ter empresas criadas
- [ ] Ter setores criados
- [ ] Testar script em ambiente dev
- [ ] Avisar usuários sobre manutenção

### **Durante a Migração**
- [ ] Executar script de migração
- [ ] Monitorar logs no console
- [ ] Verificar erros
- [ ] Anotar usuários com problemas

### **Após a Migração**
- [ ] Verificar todos os usuários no sistema
- [ ] Testar login de diferentes usuários
- [ ] Verificar agrupamento por empresa/setor
- [ ] Confirmar permissões mantidas
- [ ] Validar busca e filtros

---

## 🎯 Casos Especiais

### **1. Usuário Admin**

```javascript
// Admin NÃO precisa de empresa/setor
if (usuario.nivel === 4) {
  // Não adicionar empresaId/setorId
  // Sistema permitirá acesso total
}
```

### **2. Usuário Sem Empresa/Setor Definido**

```javascript
// Para usuários temporários ou em transição
const usuarioSemEmpresa = {
  ...usuario,
  empresaId: null,
  empresaNome: null,
  setorId: null,
  setorNome: null
  // Aparecerá em "Sem Empresa" > "Sem Setor"
};
```

### **3. Múltiplas Empresas**

Se você tem usuários de diferentes empresas:

```javascript
// Mapear por email ou nome
const EMPRESA_POR_EMAIL = {
  '@zendaya.com': 'Zendaya Jardinagem',
  '@outraempresa.com': 'Outra Empresa'
};

const dominio = usuario.email.split('@')[1];
const empresaNome = EMPRESA_POR_EMAIL[`@${dominio}`] || 'Sem Empresa';
```

---

## 🔍 Validação Pós-Migração

### **Script de Validação**

```javascript
async function validarMigracao() {
  const usuarios = await getDocs(collection(db, 'usuarios'));
  
  let validos = 0;
  let invalidos = [];

  usuarios.forEach(doc => {
    const usuario = { id: doc.id, ...doc.data() };
    
    // Verificar campos obrigatórios
    const temSenhaHash = usuario.senhaVersion === 2;
    const adminOuTemEmpresa = usuario.nivel === 4 || usuario.empresaId;
    
    if (temSenhaHash && adminOuTemEmpresa) {
      validos++;
    } else {
      invalidos.push({
        nome: usuario.nome,
        problemas: [
          !temSenhaHash && 'Senha não criptografada',
          !adminOuTemEmpresa && 'Falta empresa/setor'
        ].filter(Boolean)
      });
    }
  });

  console.log(`✅ Usuários válidos: ${validos}`);
  console.log(`❌ Usuários com problemas: ${invalidos.length}`);
  
  if (invalidos.length > 0) {
    console.table(invalidos);
  }
}
```

---

## 🐛 Resolução de Problemas

### **Problema: Senha não funciona após migração**

**Solução:**
```javascript
// Verificar se senha foi criptografada corretamente
const senhaDigitada = "123456";
const hashArmazenado = usuario.senha;

const senhaCorreta = await encryptPassword(senhaDigitada) === hashArmazenado;
console.log('Senha válida?', senhaCorreta);
```

### **Problema: Usuário não aparece no grupo**

**Solução:**
```javascript
// Verificar se tem empresaNome e setorNome
console.log({
  empresaNome: usuario.empresaNome,  // Deve ter valor
  setorNome: usuario.setorNome       // Deve ter valor
});

// Se estiverem null/undefined, atualizar:
await updateDoc(doc(db, 'usuarios', usuario.id), {
  empresaNome: "Nome da Empresa",
  setorNome: "Nome do Setor"
});
```

### **Problema: Níveis de permissão incorretos**

**Solução:**
```javascript
// Verificar mapeamento de níveis
const NIVEIS_CORRETOS = {
  1: NIVEIS_PERMISSAO.FUNCIONARIO,    // 1
  2: NIVEIS_PERMISSAO.SUPERVISOR,     // 2
  3: NIVEIS_PERMISSAO.GERENTE,        // 3
  4: NIVEIS_PERMISSAO.ADMIN           // 4
};

// Corrigir se necessário
await updateDoc(doc(db, 'usuarios', usuario.id), {
  nivel: NIVEIS_CORRETOS[nivelAntigo]
});
```

---

## 📊 Relatório de Migração

Após a migração, gere um relatório:

```javascript
async function gerarRelatorio() {
  const usuarios = await getDocs(collection(db, 'usuarios'));
  
  const relatorio = {
    total: usuarios.size,
    porNivel: {},
    porEmpresa: {},
    porSetor: {},
    semEmpresa: 0,
    senhaCriptografada: 0
  };

  usuarios.forEach(doc => {
    const u = doc.data();
    
    // Por nível
    relatorio.porNivel[u.nivel] = (relatorio.porNivel[u.nivel] || 0) + 1;
    
    // Por empresa
    if (u.empresaNome) {
      relatorio.porEmpresa[u.empresaNome] = 
        (relatorio.porEmpresa[u.empresaNome] || 0) + 1;
    } else {
      relatorio.semEmpresa++;
    }
    
    // Por setor
    if (u.setorNome) {
      relatorio.porSetor[u.setorNome] = 
        (relatorio.porSetor[u.setorNome] || 0) + 1;
    }
    
    // Senha criptografada
    if (u.senhaVersion === 2) {
      relatorio.senhaCriptografada++;
    }
  });

  console.table(relatorio);
  return relatorio;
}
```

---

## 🎓 Exemplo Completo

```javascript
// Migração completa de um usuário
const usuarioAntigo = {
  id: "user123",
  nome: "João Silva",
  email: "joao",
  senha: "123456",  // Texto plano
  nivel: 3,         // Gerente antigo
  ativo: true
};

const usuarioNovo = {
  ...usuarioAntigo,
  senha: await encryptPassword("123456"),
  senhaVersion: 2,
  nivel: NIVEIS_PERMISSAO.GERENTE,  // 3
  empresaId: "emp_zendaya",
  empresaNome: "Zendaya Jardinagem",
  setorId: "set_admin",
  setorNome: "Administrativo",
  cargo: "Gerente de Operações"
};

await updateDoc(doc(db, 'usuarios', "user123"), usuarioNovo);
```

---

## ⚠️ IMPORTANTE

1. **Sempre faça backup** antes de migrar
2. **Teste em dev** antes de produção
3. **Avise os usuários** sobre possível downtime
4. **Documente problemas** encontrados
5. **Tenha plano de rollback** preparado

---

## 📞 Suporte

Se encontrar problemas durante a migração:

1. Verifique os logs do console
2. Consulte a documentação do Firebase
3. Revise o código de migração
4. Teste com um usuário antes de migrar todos

---

**Boa sorte com a migração! 🚀**

---

**Data:** 04/10/2025
**Versão:** 3.0
**WorkFlow System**
