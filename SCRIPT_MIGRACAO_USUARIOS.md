# 🔍 Sistema de Identificação e Migração de Usuários Antigos

## 📋 Visão Geral

Este sistema completo identifica usuários antigos no banco de dados e oferece ferramentas para migrá-los para a nova estrutura com empresa, setor, cargo e senha criptografada.

---

## 🎯 Funcionalidades

### 1️⃣ **Identificação de Usuários Antigos**
```javascript
import { identificarUsuariosAntigos } from './utils/migrarUsuariosAntigos';

const analise = await identificarUsuariosAntigos();
console.log(analise);
```

**O que identifica:**
- ❌ Senha não criptografada (senhaVersion !== 2)
- ❌ Sem empresa associada (empresaId ausente)
- ❌ Sem setor associado (setorId ausente)
- ❌ Sem cargo definido
- ❌ Sem empresaNome/setorNome (necessário para exibição)

**Retorna:**
```javascript
{
  total: 15,                    // Total de usuários
  migrados: 10,                 // Já migrados corretamente
  precisamMigracao: [           // Lista de usuários com problemas
    {
      id: "user123",
      nome: "João Silva",
      email: "joao",
      nivel: 3,
      problemas: [
        "sem_empresa",
        "sem_setor",
        "senha_nao_criptografada"
      ]
    }
  ],
  semEmpresa: [...],           // Usuários sem empresa
  semSetor: [...],             // Usuários sem setor
  semSenhaCriptografada: [...], // Usuários com senha em texto plano
  semCargo: [...],             // Usuários sem cargo
  ok: [...]                    // Usuários totalmente migrados
}
```

---

### 2️⃣ **Migração Individual**
```javascript
import { migrarUsuario } from './utils/migrarUsuariosAntigos';

await migrarUsuario('userId123', {
  senha: '123456',              // Senha original (será criptografada)
  criptografarSenha: true,      // Criptografar com SHA-512
  empresaId: 'emp1',            // ID da empresa
  empresaNome: 'Zendaya',       // Nome da empresa
  setorId: 'set1',              // ID do setor
  setorNome: 'Jardim',          // Nome do setor
  cargo: 'Jardineiro'           // Cargo do usuário
});
```

**Características:**
- ✅ Criptografa senha com SHA-512
- ✅ Atribui empresa e setor
- ✅ Define cargo apropriado
- ✅ Atualiza documento no Firebase
- ✅ Log detalhado de cada operação

---

### 3️⃣ **Migração Automática em Lote**
```javascript
import { migrarTodosAutomaticamente } from './utils/migrarUsuariosAntigos';

const resultado = await migrarTodosAutomaticamente(
  'empresaPadraoId',  // ID da empresa padrão
  'setorPadraoId'     // ID do setor padrão
);

console.log(resultado);
// {
//   success: true,
//   migrados: 8,
//   erros: 0,
//   resultados: [...]
// }
```

**Características:**
- 🔄 Migra todos os usuários automaticamente
- 🎯 Usa empresa/setor padrão fornecidos
- 📊 Relatório detalhado de sucesso/erros
- ⚠️ **IMPORTANTE**: Não pode migrar senhas (precisa senha original)

---

### 4️⃣ **Migração Completa (Recomendado)**
```javascript
import { executarMigracaoCompleta } from './utils/migrarUsuariosAntigos';

const resultado = await executarMigracaoCompleta();

console.log(resultado);
// {
//   success: true,
//   empresa: { id: "emp1", nome: "Zendaya Jardinagem" },
//   setores: {
//     "Jardim": { id: "set1", nome: "Jardim" },
//     "Administrativo": { id: "set2", nome: "Administrativo" },
//     "Manutenção": { id: "set3", nome: "Manutenção" }
//   },
//   migracao: {
//     migrados: 8,
//     erros: 0,
//     resultados: [...]
//   }
// }
```

**O que faz:**
1. ✅ Cria empresa "Zendaya Jardinagem" (se não existir)
2. ✅ Cria setores padrões: Jardim, Administrativo, Manutenção
3. ✅ Migra todos os usuários para Jardim (padrão)
4. ✅ Atribui cargos por nível de permissão
5. ✅ Retorna relatório completo

**Mapeamento de Cargos:**
```javascript
Nível 1 (Funcionário) → "Jardineiro"
Nível 2 (Supervisor) → "Supervisor de Jardim"
Nível 3 (Gerente) → "Gerente de Operações"
Nível 4 (Admin) → "Administrador do Sistema"
```

---

### 5️⃣ **Relatório Detalhado**
```javascript
import { gerarRelatorioUsuarios } from './utils/migrarUsuariosAntigos';

const relatorio = await gerarRelatorioUsuarios();

console.table(relatorio.resumo);
// ┌─────────────────────────┬─────────┐
// │ total                   │ 15      │
// │ migrados                │ 10      │
// │ precisamMigracao        │ 5       │
// │ porcentagemMigrada      │ 66.7%   │
// └─────────────────────────┴─────────┘

console.table(relatorio.problemas);
// ┌─────────────────────────┬─────────┐
// │ semSenhaCriptografada   │ 3       │
// │ semEmpresa              │ 5       │
// │ semSetor                │ 5       │
// │ semCargo                │ 2       │
// └─────────────────────────┴─────────┘
```

**Formato do Relatório:**
```javascript
{
  resumo: {
    total: 15,
    migrados: 10,
    precisamMigracao: 5,
    porcentagemMigrada: "66.7"
  },
  problemas: {
    semSenhaCriptografada: 3,
    semEmpresa: 5,
    semSetor: 5,
    semCargo: 2
  },
  usuariosProblematicos: [
    {
      nome: "João Silva",
      email: "joao",
      nivel: 3,
      problemas: ["sem_empresa", "sem_setor"]
    }
  ],
  usuariosOk: [
    {
      nome: "Maria Santos",
      email: "maria",
      empresa: "Zendaya Jardinagem",
      setor: "Jardim"
    }
  ]
}
```

---

## 🚀 Como Usar

### **Cenário 1: Primeiro Uso - Migração Completa**
```javascript
// No console do navegador (F12) ou em um componente admin

import { executarMigracaoCompleta } from './utils/migrarUsuariosAntigos';

// Executar migração completa (cria empresa/setores + migra usuários)
const resultado = await executarMigracaoCompleta();

if (resultado.success) {
  console.log('✅ Migração completa bem-sucedida!');
  console.log(`📊 ${resultado.migracao.migrados} usuários migrados`);
  console.log(`🏢 Empresa: ${resultado.empresa.nome}`);
  console.log(`📁 Setores criados:`, Object.keys(resultado.setores));
}
```

### **Cenário 2: Apenas Identificar Usuários**
```javascript
import { identificarUsuariosAntigos } from './utils/migrarUsuariosAntigos';

const analise = await identificarUsuariosAntigos();

console.log(`Total: ${analise.total}`);
console.log(`Migrados: ${analise.migrados}`);
console.log(`Precisam migração: ${analise.precisamMigracao.length}`);

// Ver detalhes dos problemáticos
analise.precisamMigracao.forEach(u => {
  console.log(`${u.nome}: ${u.problemas.join(', ')}`);
});
```

### **Cenário 3: Migrar Usuário Específico**
```javascript
import { migrarUsuario } from './utils/migrarUsuariosAntigos';

// Migrar um usuário com todos os dados
await migrarUsuario('userId123', {
  senha: '123456',              // Senha original
  criptografarSenha: true,
  empresaId: 'emp1',
  empresaNome: 'Zendaya Jardinagem',
  setorId: 'set1',
  setorNome: 'Jardim',
  cargo: 'Jardineiro'
});
```

### **Cenário 4: Gerar Relatório**
```javascript
import { gerarRelatorioUsuarios } from './utils/migrarUsuariosAntigos';

const relatorio = await gerarRelatorioUsuarios();

// Exportar para JSON
const json = JSON.stringify(relatorio, null, 2);
console.log(json);

// Ou baixar arquivo
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'relatorio-usuarios.json';
a.click();
```

---

## ⚠️ Avisos Importantes

### **1. Senhas Não Podem Ser Migradas Automaticamente**
As senhas antigas estão em texto plano ou com outra criptografia. **NÃO É POSSÍVEL** descriptografá-las para re-criptografar em SHA-512.

**Soluções:**
- ✅ **Opção 1**: Usuários precisam redefinir senha no primeiro login
- ✅ **Opção 2**: Admin redefine senha manualmente para cada usuário
- ✅ **Opção 3**: Migração individual com senha fornecida pelo admin

### **2. Backup Antes de Migrar**
```javascript
// 1. Exportar dados atuais do Firestore
// 2. Guardar em local seguro
// 3. Então executar migração
```

### **3. Admin Não Precisa de Empresa/Setor**
Usuários com `nivel === 4` (Admin) são automaticamente excluídos da verificação de empresa/setor.

### **4. Teste em Ambiente de Desenvolvimento**
Primeiro teste a migração com poucos usuários antes de rodar em produção.

---

## 📊 Exemplo de Fluxo Completo

```javascript
// PASSO 1: Identificar situação atual
console.log('📊 PASSO 1: Análise inicial');
const analiseInicial = await identificarUsuariosAntigos();
console.log(`Total de usuários: ${analiseInicial.total}`);
console.log(`Precisam migração: ${analiseInicial.precisamMigracao.length}`);

if (analiseInicial.precisamMigracao.length === 0) {
  console.log('✅ Todos os usuários já estão migrados!');
  return;
}

// PASSO 2: Gerar relatório detalhado
console.log('\n📋 PASSO 2: Relatório detalhado');
const relatorio = await gerarRelatorioUsuarios();
console.table(relatorio.resumo);
console.table(relatorio.problemas);

// PASSO 3: Executar migração completa
console.log('\n🚀 PASSO 3: Migração automática');
const confirmacao = confirm(`Deseja migrar ${analiseInicial.precisamMigracao.length} usuários?`);

if (confirmacao) {
  const resultado = await executarMigracaoCompleta();
  
  console.log('\n✅ MIGRAÇÃO CONCLUÍDA!');
  console.log(`Usuários migrados: ${resultado.migracao.migrados}`);
  console.log(`Erros: ${resultado.migracao.erros}`);
  
  // Ver detalhes
  resultado.migracao.resultados.forEach(r => {
    if (r.status === 'sucesso') {
      console.log(`✅ ${r.nome}`);
    } else {
      console.error(`❌ ${r.nome}: ${r.erro}`);
    }
  });
}

// PASSO 4: Verificar resultado
console.log('\n🔍 PASSO 4: Verificação final');
const analiseFinal = await identificarUsuariosAntigos();
console.log(`Migrados antes: ${analiseInicial.migrados}`);
console.log(`Migrados agora: ${analiseFinal.migrados}`);
console.log(`Melhoria: +${analiseFinal.migrados - analiseInicial.migrados} usuários`);
```

---

## 🎨 Interface Admin (Opcional)

Você pode adicionar um painel no **SistemaResumo** para executar essas funções com interface gráfica:

```jsx
import { 
  identificarUsuariosAntigos, 
  executarMigracaoCompleta,
  gerarRelatorioUsuarios 
} from '../utils/migrarUsuariosAntigos';

function PainelMigracao() {
  const [analise, setAnalise] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const handleIdentificar = async () => {
    setCarregando(true);
    try {
      const resultado = await identificarUsuariosAntigos();
      setAnalise(resultado);
    } catch (error) {
      alert('Erro ao identificar usuários: ' + error.message);
    }
    setCarregando(false);
  };

  const handleMigrar = async () => {
    if (!confirm('Deseja executar a migração completa?')) return;
    
    setCarregando(true);
    try {
      const resultado = await executarMigracaoCompleta();
      alert(`Migração concluída! ${resultado.migracao.migrados} usuários migrados.`);
      handleIdentificar(); // Atualizar análise
    } catch (error) {
      alert('Erro na migração: ' + error.message);
    }
    setCarregando(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h3 className="text-xl font-bold mb-4">🔍 Migração de Usuários</h3>
      
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleIdentificar}
          disabled={carregando}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {carregando ? 'Analisando...' : '🔍 Identificar Usuários'}
        </button>
        
        <button
          onClick={handleMigrar}
          disabled={carregando || !analise}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          {carregando ? 'Migrando...' : '🚀 Migrar Todos'}
        </button>
      </div>

      {analise && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-100 p-4 rounded">
              <div className="text-2xl font-bold">{analise.total}</div>
              <div className="text-sm">Total</div>
            </div>
            <div className="bg-green-100 p-4 rounded">
              <div className="text-2xl font-bold">{analise.migrados}</div>
              <div className="text-sm">Migrados</div>
            </div>
            <div className="bg-yellow-100 p-4 rounded">
              <div className="text-2xl font-bold">{analise.precisamMigracao.length}</div>
              <div className="text-sm">Precisam Migração</div>
            </div>
            <div className="bg-purple-100 p-4 rounded">
              <div className="text-2xl font-bold">
                {((analise.migrados / analise.total) * 100).toFixed(1)}%
              </div>
              <div className="text-sm">Completo</div>
            </div>
          </div>

          {analise.precisamMigracao.length > 0 && (
            <div className="bg-yellow-50 p-4 rounded">
              <h4 className="font-bold mb-2">⚠️ Usuários que precisam migração:</h4>
              <ul className="space-y-2">
                {analise.precisamMigracao.map(u => (
                  <li key={u.id} className="text-sm">
                    <strong>{u.nome}</strong> ({u.email}): {u.problemas.join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 📝 Logs e Debug

O sistema possui logs detalhados em cada etapa:

```
🔍 Iniciando identificação de usuários antigos...
✅ Análise concluída: { total: 15, migrados: 10, precisamMigracao: 5 }

🔄 Migrando usuário: user123
✅ Senha criptografada
✅ Empresa atribuída: Zendaya Jardinagem
✅ Setor atribuído: Jardim
✅ Cargo atribuído: Jardineiro
✅ Usuário user123 migrado com sucesso

🚀 Iniciando migração automática de todos os usuários...
📝 Verificando empresa padrão...
✅ Empresa padrão já existe: emp1
📝 Verificando setores padrões...
✅ Setor "Jardim" já existe
✅ Migração concluída: 8 migrados, 0 erros

🎉🎉🎉 MIGRAÇÃO COMPLETA CONCLUÍDA 🎉🎉🎉
```

---

## 🔒 Segurança

- ✅ Senhas criptografadas com SHA-512
- ✅ Funções só executam para admin (verificar no componente)
- ✅ Logs detalhados de todas as operações
- ✅ Tratamento de erros em cada etapa
- ✅ Backup recomendado antes de executar

---

## 📚 Estrutura de Dados

### **Usuário Antigo (Antes)**
```javascript
{
  id: "user1",
  nome: "João Silva",
  email: "joao",
  senha: "123456",              // ❌ Texto plano
  nivel: 3,
  ativo: true
  // ❌ Sem empresa
  // ❌ Sem setor
  // ❌ Sem cargo
}
```

### **Usuário Novo (Depois)**
```javascript
{
  id: "user1",
  nome: "João Silva",
  email: "joao",
  senha: "hash_sha512...",      // ✅ Criptografado
  senhaVersion: 2,              // ✅ Versão SHA-512
  nivel: 3,
  ativo: true,
  empresaId: "emp1",            // ✅ Empresa associada
  empresaNome: "Zendaya Jardinagem",
  setorId: "set1",              // ✅ Setor associado
  setorNome: "Jardim",
  cargo: "Gerente de Operações" // ✅ Cargo definido
}
```

---

## 🎯 Próximos Passos

1. **Testar em desenvolvimento**
   ```javascript
   const resultado = await executarMigracaoCompleta();
   ```

2. **Gerar relatório antes da migração**
   ```javascript
   const relatorio = await gerarRelatorioUsuarios();
   ```

3. **Executar migração em produção**
   - Fazer backup do Firestore
   - Executar em horário de baixo tráfego
   - Monitorar logs de erro

4. **Validar resultado**
   ```javascript
   const analiseFinal = await identificarUsuariosAntigos();
   // Verificar que precisamMigracao.length === 0
   ```

5. **Usuários redefinem senhas** (se necessário)
   - Implementar "Esqueci minha senha"
   - Ou admin redefine manualmente

---

## ✅ Checklist de Migração

- [ ] Backup do Firestore realizado
- [ ] Script testado em desenvolvimento
- [ ] Relatório inicial gerado e revisado
- [ ] Migração completa executada
- [ ] Relatório final validado
- [ ] Usuários notificados (se senhas precisam ser redefinidas)
- [ ] Sistema testado com usuários migrados
- [ ] Documentação atualizada

---

**Criado por**: Sistema de Migração Automática  
**Data**: 2025  
**Versão**: 1.0.0  
**Compatibilidade**: Firebase v9+, SHA-512
