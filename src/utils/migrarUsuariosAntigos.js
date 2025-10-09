import { collection, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { encryptPassword } from './crypto';
import { NIVEIS_PERMISSAO } from '../constants/permissoes';

/**
 * Script de Identificação e Migração de Usuários Antigos
 * 
 * Identifica usuários que precisam de migração e oferece opções para migrar
 */

/**
 * Identificar usuários antigos que precisam de migração
 */
export async function identificarUsuariosAntigos() {
  try {
    const usuariosSnapshot = await getDocs(collection(db, 'usuario'));
    
    const analise = {
      total: 0,
      migrados: 0,
      precisamMigracao: [],
      semEmpresa: [],
      semSetor: [],
      semSenhaCriptografada: [],
      semCargo: [],
      ok: []
    };

    usuariosSnapshot.forEach(docSnap => {
      const usuario = { id: docSnap.id, ...docSnap.data() };
      analise.total++;

      // Verificar se precisa de migração
      const problemas = [];
      
      // 1. Senha não criptografada (senhaVersion !== 2)
      if (usuario.senhaVersion !== 2) {
        problemas.push('senha_nao_criptografada');
        analise.semSenhaCriptografada.push(usuario);
      }

      // 2. Sem empresa (exceto admin)
      if (usuario.nivel !== NIVEIS_PERMISSAO.ADMIN && !usuario.empresaId) {
        problemas.push('sem_empresa');
        analise.semEmpresa.push(usuario);
      }

      // 3. Sem setor (exceto admin)
      if (usuario.nivel !== NIVEIS_PERMISSAO.ADMIN && !usuario.setorId) {
        problemas.push('sem_setor');
        analise.semSetor.push(usuario);
      }

      // 4. Sem cargo
      if (!usuario.cargo || usuario.cargo === '') {
        problemas.push('sem_cargo');
        analise.semCargo.push(usuario);
      }

      // 5. Sem empresaNome ou setorNome (necessário para exibição)
      if (usuario.empresaId && !usuario.empresaNome) {
        problemas.push('sem_empresa_nome');
      }
      if (usuario.setorId && !usuario.setorNome) {
        problemas.push('sem_setor_nome');
      }

      if (problemas.length > 0) {
        analise.precisamMigracao.push({
          ...usuario,
          problemas
        });
      } else {
        analise.migrados++;
        analise.ok.push(usuario);
      }
    });
    return analise;
  } catch (error) {
    console.error('❌ Erro ao identificar usuários:', error);
    throw error;
  }
}

/**
 * Migrar um usuário específico
 */
export async function migrarUsuario(usuarioId, opcoes = {}) {
  try {
    const usuarioRef = doc(db, 'usuarios', usuarioId);
    const dadosAtualizacao = {};

    // 1. Criptografar senha se necessário
    if (opcoes.senha && opcoes.criptografarSenha) {
      dadosAtualizacao.senha = await encryptPassword(opcoes.senha);
      dadosAtualizacao.senhaVersion = 2;
    }

    // 2. Adicionar empresa se fornecida
    if (opcoes.empresaId) {
      dadosAtualizacao.empresaId = opcoes.empresaId;
      dadosAtualizacao.empresaNome = opcoes.empresaNome || await buscarNomeEmpresa(opcoes.empresaId);
    }

    // 3. Adicionar setor se fornecido
    if (opcoes.setorId) {
      dadosAtualizacao.setorId = opcoes.setorId;
      dadosAtualizacao.setorNome = opcoes.setorNome || await buscarNomeSetor(opcoes.setorId);
    }

    // 4. Adicionar cargo se fornecido
    if (opcoes.cargo) {
      dadosAtualizacao.cargo = opcoes.cargo;
    }

    // 5. Atualizar no Firebase
    await updateDoc(usuarioRef, dadosAtualizacao);
    return { success: true, dadosAtualizacao };
  } catch (error) {
    console.error(`❌ Erro ao migrar usuário ${usuarioId}:`, error);
    throw error;
  }
}

/**
 * Migrar todos os usuários automaticamente com configuração padrão
 */
export async function migrarTodosAutomaticamente(empresaPadraoId, setorPadraoId) {
  try {
    // 1. Identificar usuários que precisam de migração
    const analise = await identificarUsuariosAntigos();
    
    if (analise.precisamMigracao.length === 0) {
      return {
        success: true,
        migrados: 0,
        erros: 0,
        mensagem: 'Todos os usuários já estão atualizados'
      };
    }

    // 2. Buscar nomes de empresa e setor
    const empresaNome = await buscarNomeEmpresa(empresaPadraoId);
    const setorNome = await buscarNomeSetor(setorPadraoId);

    // 3. Migrar cada usuário
    let migrados = 0;
    let erros = 0;
    const resultados = [];

    for (const usuario of analise.precisamMigracao) {
      try {
        const opcoes = {};

        // Determinar o que precisa ser migrado
        if (usuario.problemas.includes('sem_empresa') || usuario.problemas.includes('sem_empresa_nome')) {
          opcoes.empresaId = empresaPadraoId;
          opcoes.empresaNome = empresaNome;
        }

        if (usuario.problemas.includes('sem_setor') || usuario.problemas.includes('sem_setor_nome')) {
          opcoes.setorId = setorPadraoId;
          opcoes.setorNome = setorNome;
        }

        if (usuario.problemas.includes('sem_cargo')) {
          opcoes.cargo = atribuirCargoPorNivel(usuario.nivel);
        }

        if (usuario.problemas.includes('senha_nao_criptografada')) {
          // ATENÇÃO: Não podemos migrar senhas sem conhecer a senha original
          // Este campo será pulado e precisará ser atualizado manualmente
        }

        await migrarUsuario(usuario.id, opcoes);
        migrados++;
        resultados.push({ id: usuario.id, nome: usuario.nome, status: 'sucesso' });
      } catch (error) {
        erros++;
        resultados.push({ id: usuario.id, nome: usuario.nome, status: 'erro', erro: error.message });
        console.error(`❌ Erro ao migrar ${usuario.nome}:`, error);
      }
    }
    return {
      success: true,
      migrados,
      erros,
      resultados,
      mensagem: `Migração concluída: ${migrados} usuários migrados, ${erros} erros`
    };
  } catch (error) {
    console.error('❌ Erro na migração automática:', error);
    throw error;
  }
}

/**
 * Criar empresa padrão se não existir
 */
export async function criarEmpresaPadrao() {
  try {
    // Verificar se já existe uma empresa "Zendaya Jardinagem"
    const empresasSnapshot = await getDocs(collection(db, 'empresas'));
    let empresaExistente = null;

    empresasSnapshot.forEach(doc => {
      const empresa = doc.data();
      if (empresa.nome === 'Zendaya Jardinagem') {
        empresaExistente = { id: doc.id, ...empresa };
      }
    });

    if (empresaExistente) {
      return empresaExistente;
    }

    // Criar empresa padrão
    const novaEmpresa = {
      nome: 'Zendaya Jardinagem',
      ativo: true,
      dataCriacao: new Date().toISOString()
    };

    const empresaRef = await addDoc(collection(db, 'empresas'), novaEmpresa);
    return { id: empresaRef.id, ...novaEmpresa };
  } catch (error) {
    console.error('❌ Erro ao criar empresa padrão:', error);
    throw error;
  }
}

/**
 * Criar setores padrões se não existirem
 */
export async function criarSetoresPadroes(empresaId) {
  try {
    const setoresSnapshot = await getDocs(collection(db, 'setores'));
    const setoresExistentes = {};

    setoresSnapshot.forEach(doc => {
      const setor = doc.data();
      if (setor.empresaId === empresaId) {
        setoresExistentes[setor.nome] = { id: doc.id, ...setor };
      }
    });

    const setoresPadrao = ['Jardim', 'Administrativo', 'Manutenção'];
    const setoresCriados = {};

    for (const nomeSetor of setoresPadrao) {
      if (setoresExistentes[nomeSetor]) {
        setoresCriados[nomeSetor] = setoresExistentes[nomeSetor];
      } else {
        const novoSetor = {
          nome: nomeSetor,
          empresaId,
          ativo: true,
          dataCriacao: new Date().toISOString()
        };

        const setorRef = await addDoc(collection(db, 'setores'), novoSetor);
        setoresCriados[nomeSetor] = { id: setorRef.id, ...novoSetor };
      }
    }

    return setoresCriados;
  } catch (error) {
    console.error('❌ Erro ao criar setores padrões:', error);
    throw error;
  }
}

/**
 * Executar migração completa (criar empresa/setores + migrar usuários)
 */
export async function executarMigracaoCompleta() {
  try {
    // 1. Criar empresa padrão
    const empresa = await criarEmpresaPadrao();

    // 2. Criar setores padrões
    const setores = await criarSetoresPadroes(empresa.id);

    // 3. Migrar usuários (usar setor "Jardim" como padrão)
    const setorPadrao = setores['Jardim'];
    const resultado = await migrarTodosAutomaticamente(empresa.id, setorPadrao.id);
    return {
      success: true,
      empresa,
      setores,
      migracao: resultado
    };
  } catch (error) {
    console.error('❌ Erro na migração completa:', error);
    throw error;
  }
}

/**
 * Gerar relatório detalhado de usuários
 */
export async function gerarRelatorioUsuarios() {
  try {
    const analise = await identificarUsuariosAntigos();

    const relatorio = {
      resumo: {
        total: analise.total,
        migrados: analise.migrados,
        precisamMigracao: analise.precisamMigracao.length,
        porcentagemMigrada: ((analise.migrados / analise.total) * 100).toFixed(1)
      },
      problemas: {
        semSenhaCriptografada: analise.semSenhaCriptografada.length,
        semEmpresa: analise.semEmpresa.length,
        semSetor: analise.semSetor.length,
        semCargo: analise.semCargo.length
      },
      usuariosProblematicos: analise.precisamMigracao.map(u => ({
        nome: u.nome,
        email: u.email,
        nivel: u.nivel,
        problemas: u.problemas
      })),
      usuariosOk: analise.ok.map(u => ({
        nome: u.nome,
        email: u.email,
        empresa: u.empresaNome,
        setor: u.setorNome
      }))
    };

    console.table(relatorio.resumo);
    console.table(relatorio.problemas);
    
    if (relatorio.usuariosProblematicos.length > 0) {
      console.table(relatorio.usuariosProblematicos);
    }

    return relatorio;
  } catch (error) {
    console.error('❌ Erro ao gerar relatório:', error);
    throw error;
  }
}

// ==================== FUNÇÕES AUXILIARES ====================

async function buscarNomeEmpresa(empresaId) {
  try {
    const empresasSnapshot = await getDocs(collection(db, 'empresas'));
    let nome = 'Empresa Desconhecida';
    
    empresasSnapshot.forEach(doc => {
      if (doc.id === empresaId) {
        nome = doc.data().nome;
      }
    });
    
    return nome;
  } catch (error) {
    console.error('Erro ao buscar nome da empresa:', error);
    return 'Empresa Desconhecida';
  }
}

async function buscarNomeSetor(setorId) {
  try {
    const setoresSnapshot = await getDocs(collection(db, 'setores'));
    let nome = 'Setor Desconhecido';
    
    setoresSnapshot.forEach(doc => {
      if (doc.id === setorId) {
        nome = doc.data().nome;
      }
    });
    
    return nome;
  } catch (error) {
    console.error('Erro ao buscar nome do setor:', error);
    return 'Setor Desconhecido';
  }
}

function atribuirCargoPorNivel(nivel) {
  const cargos = {
    [NIVEIS_PERMISSAO.FUNCIONARIO]: 'Jardineiro',
    [NIVEIS_PERMISSAO.SUPERVISOR]: 'Supervisor de Jardim',
    [NIVEIS_PERMISSAO.GERENTE_SETOR]: 'Gerente de Setor',
    [NIVEIS_PERMISSAO.GERENTE_GERAL]: 'Gerente Geral',
    [NIVEIS_PERMISSAO.ADMIN]: 'Administrador do Sistema'
  };
  
  return cargos[nivel] || 'Funcionário';
}
