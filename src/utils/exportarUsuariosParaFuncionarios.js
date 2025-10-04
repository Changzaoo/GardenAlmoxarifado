import { db } from '../firebaseConfig';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  addDoc, 
  query, 
  where 
} from 'firebase/firestore';

/**
 * Script de Migração: Usuários → Funcionários
 * 
 * Exporta todos os usuários da coleção 'usuario' e os insere como funcionários
 * na coleção 'funcionarios', vinculando-os automaticamente à empresa Zendaya
 * e ao setor Jardim.
 */

/**
 * Busca ou cria a empresa Zendaya
 * @returns {Object} Dados da empresa Zendaya
 */
async function buscarOuCriarEmpresaZendaya() {
  try {
    console.log('🔍 Buscando empresa Zendaya...');
    
    const empresasRef = collection(db, 'empresas');
    const q = query(empresasRef, where('nome', '==', 'Zendaya'));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const empresaDoc = snapshot.docs[0];
      const empresa = { id: empresaDoc.id, ...empresaDoc.data() };
      console.log('✅ Empresa Zendaya encontrada:', empresa.id);
      return empresa;
    }
    
    // Criar empresa Zendaya se não existir
    console.log('📝 Criando empresa Zendaya...');
    const novaEmpresa = {
      nome: 'Zendaya',
      cnpj: '',
      telefone: '',
      email: '',
      endereco: '',
      ativo: true,
      dataCriacao: new Date().toISOString()
    };
    
    const docRef = await addDoc(empresasRef, novaEmpresa);
    console.log('✅ Empresa Zendaya criada:', docRef.id);
    
    return { id: docRef.id, ...novaEmpresa };
  } catch (error) {
    console.error('❌ Erro ao buscar/criar empresa Zendaya:', error);
    throw error;
  }
}

/**
 * Busca ou cria o setor Jardim vinculado à empresa Zendaya
 * @param {string} empresaId - ID da empresa Zendaya
 * @returns {Object} Dados do setor Jardim
 */
async function buscarOuCriarSetorJardim(empresaId) {
  try {
    console.log('🔍 Buscando setor Jardim...');
    
    const setoresRef = collection(db, 'setores');
    const q = query(
      setoresRef, 
      where('nome', '==', 'Jardim'),
      where('empresaId', '==', empresaId)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const setorDoc = snapshot.docs[0];
      const setor = { id: setorDoc.id, ...setorDoc.data() };
      console.log('✅ Setor Jardim encontrado:', setor.id);
      return setor;
    }
    
    // Criar setor Jardim se não existir
    console.log('📝 Criando setor Jardim...');
    const novoSetor = {
      nome: 'Jardim',
      empresaId: empresaId,
      empresaNome: 'Zendaya',
      descricao: 'Setor responsável pela manutenção e cuidados com o jardim',
      ativo: true,
      dataCriacao: new Date().toISOString()
    };
    
    const docRef = await addDoc(setoresRef, novoSetor);
    console.log('✅ Setor Jardim criado:', docRef.id);
    
    return { id: docRef.id, ...novoSetor };
  } catch (error) {
    console.error('❌ Erro ao buscar/criar setor Jardim:', error);
    throw error;
  }
}

/**
 * Verifica se um funcionário já existe
 * @param {string} email - Email do funcionário
 * @param {string} nome - Nome do funcionário
 * @returns {Object|null} Funcionário existente ou null
 */
async function verificarFuncionarioExistente(email, nome) {
  try {
    const funcionariosRef = collection(db, 'funcionarios');
    
    // Buscar por email
    if (email) {
      const qEmail = query(funcionariosRef, where('email', '==', email));
      const snapshotEmail = await getDocs(qEmail);
      if (!snapshotEmail.empty) {
        return { id: snapshotEmail.docs[0].id, ...snapshotEmail.docs[0].data() };
      }
    }
    
    // Buscar por nome
    const qNome = query(funcionariosRef, where('nome', '==', nome));
    const snapshotNome = await getDocs(qNome);
    if (!snapshotNome.empty) {
      return { id: snapshotNome.docs[0].id, ...snapshotNome.docs[0].data() };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erro ao verificar funcionário existente:', error);
    return null;
  }
}

/**
 * Converte um usuário em funcionário
 * @param {Object} usuario - Dados do usuário
 * @param {Object} empresa - Dados da empresa
 * @param {Object} setor - Dados do setor
 * @returns {Object} Dados do funcionário formatados
 */
function converterUsuarioParaFuncionario(usuario, empresa, setor) {
  return {
    // Dados básicos
    nome: usuario.nome || 'Sem Nome',
    email: usuario.email || '',
    telefone: usuario.telefone || '',
    whatsapp: usuario.whatsapp || usuario.telefone || '',
    
    // Vínculo com empresa e setor
    empresaId: empresa.id,
    empresaNome: empresa.nome,
    setorId: setor.id,
    setorNome: setor.nome,
    
    // Cargo e função
    cargo: usuario.cargo || 'Funcionário',
    funcao: usuario.funcao || usuario.cargo || 'Geral',
    
    // Dados de usuário (referência)
    userId: usuario.id,
    nivel: usuario.nivel || 1,
    
    // Status
    ativo: usuario.ativo !== false,
    demitido: false,
    
    // Foto de perfil (gerar avatar padrão se não tiver)
    photoURL: usuario.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(usuario.nome || 'User')}&background=random&size=200`,
    
    // Metadados
    dataCriacao: usuario.dataCriacao || new Date().toISOString(),
    dataAdmissao: usuario.dataCriacao || new Date().toISOString(),
    ultimaAtualizacao: new Date().toISOString(),
    migradoDeUsuario: true,
    dataMingracao: new Date().toISOString()
  };
}

/**
 * Exporta todos os usuários para funcionários
 * @param {boolean} atualizarExistentes - Se true, atualiza funcionários existentes
 * @returns {Object} Resultado da exportação
 */
export async function exportarUsuariosParaFuncionarios(atualizarExistentes = false) {
  try {
    console.log('🚀 Iniciando exportação de usuários para funcionários...');
    console.log('📋 Configuração:', { atualizarExistentes });
    
    // 1. Buscar/Criar empresa Zendaya
    const empresa = await buscarOuCriarEmpresaZendaya();
    
    // 2. Buscar/Criar setor Jardim
    const setor = await buscarOuCriarSetorJardim(empresa.id);
    
    // 3. Buscar todos os usuários
    console.log('📥 Buscando usuários...');
    const usuariosSnapshot = await getDocs(collection(db, 'usuario'));
    const usuarios = usuariosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`📊 ${usuarios.length} usuários encontrados`);
    
    if (usuarios.length === 0) {
      return {
        sucesso: true,
        mensagem: 'Nenhum usuário encontrado para exportar',
        criados: 0,
        atualizados: 0,
        ignorados: 0,
        erros: 0
      };
    }
    
    // 4. Processar cada usuário
    let criados = 0;
    let atualizados = 0;
    let ignorados = 0;
    let erros = 0;
    const detalhes = [];
    
    for (const usuario of usuarios) {
      try {
        console.log(`\n👤 Processando: ${usuario.nome || usuario.email}`);
        
        // Verificar se já existe como funcionário
        const funcionarioExistente = await verificarFuncionarioExistente(
          usuario.email,
          usuario.nome
        );
        
        if (funcionarioExistente && !atualizarExistentes) {
          console.log(`⏭️ Já existe: ${usuario.nome} - Ignorando`);
          ignorados++;
          detalhes.push({
            usuario: usuario.nome || usuario.email,
            acao: 'ignorado',
            motivo: 'Funcionário já existe'
          });
          continue;
        }
        
        // Converter para funcionário
        const funcionarioData = converterUsuarioParaFuncionario(usuario, empresa, setor);
        
        if (funcionarioExistente) {
          // Atualizar existente
          await setDoc(doc(db, 'funcionarios', funcionarioExistente.id), {
            ...funcionarioData,
            dataCriacao: funcionarioExistente.dataCriacao // Preservar data original
          });
          
          console.log(`✅ Atualizado: ${usuario.nome}`);
          atualizados++;
          detalhes.push({
            usuario: usuario.nome || usuario.email,
            acao: 'atualizado',
            funcionarioId: funcionarioExistente.id
          });
        } else {
          // Criar novo
          const docRef = await addDoc(collection(db, 'funcionarios'), funcionarioData);
          
          console.log(`✨ Criado: ${usuario.nome} - ID: ${docRef.id}`);
          criados++;
          detalhes.push({
            usuario: usuario.nome || usuario.email,
            acao: 'criado',
            funcionarioId: docRef.id
          });
        }
        
      } catch (error) {
        console.error(`❌ Erro ao processar ${usuario.nome}:`, error);
        erros++;
        detalhes.push({
          usuario: usuario.nome || usuario.email,
          acao: 'erro',
          erro: error.message
        });
      }
    }
    
    // 5. Resultado final
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESULTADO DA EXPORTAÇÃO');
    console.log('='.repeat(50));
    console.log(`✨ Criados: ${criados}`);
    console.log(`🔄 Atualizados: ${atualizados}`);
    console.log(`⏭️ Ignorados: ${ignorados}`);
    console.log(`❌ Erros: ${erros}`);
    console.log('='.repeat(50));
    
    const mensagem = erros === 0
      ? `✅ Exportação concluída com sucesso!\n\n✨ ${criados} funcionários criados\n🔄 ${atualizados} funcionários atualizados\n⏭️ ${ignorados} já existentes`
      : `⚠️ Exportação concluída com erros.\n\n✨ ${criados} criados\n🔄 ${atualizados} atualizados\n⏭️ ${ignorados} ignorados\n❌ ${erros} erros`;
    
    return {
      sucesso: erros === 0,
      mensagem,
      criados,
      atualizados,
      ignorados,
      erros,
      detalhes,
      empresa: {
        id: empresa.id,
        nome: empresa.nome
      },
      setor: {
        id: setor.id,
        nome: setor.nome
      }
    };
    
  } catch (error) {
    console.error('❌ Erro fatal na exportação:', error);
    return {
      sucesso: false,
      mensagem: `❌ Erro na exportação: ${error.message}`,
      criados: 0,
      atualizados: 0,
      ignorados: 0,
      erros: 1,
      erro: error.message
    };
  }
}

/**
 * Verifica o status da exportação
 * @returns {Object} Status com contagens
 */
export async function verificarStatusExportacao() {
  try {
    console.log('🔍 Verificando status da exportação...');
    
    const [usuariosSnap, funcionariosSnap, empresasSnap, setoresSnap] = await Promise.all([
      getDocs(collection(db, 'usuario')),
      getDocs(collection(db, 'funcionarios')),
      getDocs(query(collection(db, 'empresas'), where('nome', '==', 'Zendaya'))),
      getDocs(query(collection(db, 'setores'), where('nome', '==', 'Jardim')))
    ]);
    
    // Buscar funcionários migrados
    const funcionariosMigrados = funcionariosSnap.docs.filter(doc => 
      doc.data().migradoDeUsuario === true
    );
    
    const status = {
      usuarios: {
        total: usuariosSnap.size,
        lista: usuariosSnap.docs.map(doc => ({
          id: doc.id,
          nome: doc.data().nome,
          email: doc.data().email,
          cargo: doc.data().cargo
        }))
      },
      funcionarios: {
        total: funcionariosSnap.size,
        migrados: funcionariosMigrados.length,
        lista: funcionariosSnap.docs.map(doc => ({
          id: doc.id,
          nome: doc.data().nome,
          email: doc.data().email,
          empresaNome: doc.data().empresaNome,
          setorNome: doc.data().setorNome,
          migrado: doc.data().migradoDeUsuario || false
        }))
      },
      empresa: empresasSnap.empty ? null : {
        id: empresasSnap.docs[0].id,
        nome: empresasSnap.docs[0].data().nome
      },
      setor: setoresSnap.empty ? null : {
        id: setoresSnap.docs[0].id,
        nome: setoresSnap.docs[0].data().nome
      }
    };
    
    console.log('📊 Status:', {
      usuarios: status.usuarios.total,
      funcionarios: status.funcionarios.total,
      migrados: status.funcionarios.migrados,
      empresa: status.empresa?.nome || 'Não criada',
      setor: status.setor?.nome || 'Não criado'
    });
    
    return status;
    
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
    throw error;
  }
}

export default {
  exportarUsuariosParaFuncionarios,
  verificarStatusExportacao,
  buscarOuCriarEmpresaZendaya,
  buscarOuCriarSetorJardim
};
