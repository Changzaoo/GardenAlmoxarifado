// 🔐 Sistema de Redefinição de Senhas
// Gerencia códigos de redefinição gerados por administradores

import { backupDb } from '../config/firebaseDual';
import { collection, addDoc, getDocs, updateDoc, doc, query, where, deleteDoc } from 'firebase/firestore';
import { encryptPassword } from '../utils/crypto';

// Gerar código aleatório único (formato: ABC-123-XYZ)
export const generateResetCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = 3;
  const segmentLength = 3;
  
  const code = [];
  for (let i = 0; i < segments; i++) {
    let segment = '';
    for (let j = 0; j < segmentLength; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code.push(segment);
  }
  
  return code.join('-');
};

// Criar código de redefinição
export const criarCodigoRedefinicao = async (adminId, usuarioEmail = null, validadeHoras = 24, empresaId = null, setorId = null, nivelUsuario = 'usuario') => {
  try {
    const codigo = generateResetCode();
    const agora = new Date();
    const expiraEm = new Date(agora.getTime() + (validadeHoras * 60 * 60 * 1000));
    
    const codigoData = {
      codigo: codigo,
      usuarioEmail: usuarioEmail, // null = código genérico
      criadoPor: adminId,
      criadoEm: agora.toISOString(),
      expiraEm: expiraEm.toISOString(),
      usado: false,
      usadoEm: null,
      usadoPor: null,
      empresaId: empresaId, // ID da empresa associada
      setorId: setorId, // ID do setor associado
      nivelUsuario: nivelUsuario // Nível do usuário (usuario ou admin)
    };
    
    const docRef = await addDoc(collection(backupDb, 'codigosRedefinicao'), codigoData);
    
    console.log('✅ Código de redefinição criado:', {
      id: docRef.id,
      codigo: codigo,
      usuarioEmail: usuarioEmail || 'GENÉRICO',
      expiraEm: expiraEm.toLocaleString('pt-BR')
    });
    
    return {
      success: true,
      codigo: codigo,
      id: docRef.id,
      expiraEm: expiraEm.toISOString()
    };
  } catch (error) {
    console.error('❌ Erro ao criar código de redefinição:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Validar código de redefinição
export const validarCodigoRedefinicao = async (codigo, usuarioEmail) => {
  try {
    console.log('🔍 Validando código:', { codigo, usuarioEmail });
    
    // Buscar código no Firebase
    const q = query(
      collection(backupDb, 'codigosRedefinicao'),
      where('codigo', '==', codigo.toUpperCase())
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('❌ Código não encontrado');
      return {
        valido: false,
        motivo: 'Código inválido ou não existe'
      };
    }
    
    const codigoDoc = querySnapshot.docs[0];
    const codigoData = codigoDoc.data();
    
    console.log('📋 Código encontrado:', {
      usado: codigoData.usado,
      expiraEm: codigoData.expiraEm,
      usuarioEmail: codigoData.usuarioEmail
    });
    
    // Verificar se já foi usado
    if (codigoData.usado) {
      console.log('❌ Código já foi usado');
      return {
        valido: false,
        motivo: 'Este código já foi utilizado'
      };
    }
    
    // Verificar validade
    const expiraEm = new Date(codigoData.expiraEm);
    const agora = new Date();
    
    if (agora > expiraEm) {
      console.log('❌ Código expirado');
      return {
        valido: false,
        motivo: 'Este código expirou'
      };
    }
    
    // Verificar se é específico para um usuário
    if (codigoData.usuarioEmail && codigoData.usuarioEmail !== usuarioEmail) {
      console.log('❌ Código não pertence a este usuário');
      return {
        valido: false,
        motivo: 'Este código não pode ser usado por este usuário'
      };
    }
    
    console.log('✅ Código válido!');
    return {
      valido: true,
      id: codigoDoc.id,
      codigo: codigoData.codigo,
      usuarioEmail: codigoData.usuarioEmail,
      empresaId: codigoData.empresaId,
      setorId: codigoData.setorId,
      nivelUsuario: codigoData.nivelUsuario || 'usuario'
    };
  } catch (error) {
    console.error('❌ Erro ao validar código:', error);
    return {
      valido: false,
      motivo: 'Erro ao validar código: ' + error.message
    };
  }
};

// Redefinir senha usando código
export const redefinirSenhaComCodigo = async (usuarioUsername, novaSenha, codigo) => {
  try {
    console.log('🔄 Iniciando redefinição de senha para:', usuarioUsername);
    
    // 1. Validar código
    const validacao = await validarCodigoRedefinicao(codigo, usuarioUsername);
    
    if (!validacao.valido) {
      return {
        success: false,
        message: validacao.motivo
      };
    }
    
    // 2. Buscar usuário no Firebase Backup
    const usuariosRef = collection(backupDb, 'usuarios');
    const q = query(usuariosRef, where('usuario', '==', usuarioUsername.toLowerCase().trim()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('❌ Usuário não encontrado');
      return {
        success: false,
        message: 'Usuário não encontrado'
      };
    }
    
    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;
    
    console.log('✅ Usuário encontrado:', userId);
    
    // 3. Gerar novo hash SHA-512
    console.log('🔒 Gerando novo hash SHA-512...');
    const { hash, salt, version, algorithm } = encryptPassword(novaSenha);
    
    // 4. Atualizar senha no Firebase Backup
    await updateDoc(doc(backupDb, 'usuarios', userId), {
      senhaHash: hash,
      senhaSalt: salt,
      senhaVersion: version,
      senhaAlgorithm: algorithm,
      senha: null, // Remove senha em texto plano se existir
      senhaAtualizadaEm: new Date().toISOString()
    });
    
    console.log('✅ Senha atualizada no Firebase Backup');
    
    // 5. Marcar código como usado
    await updateDoc(doc(backupDb, 'codigosRedefinicao', validacao.id), {
      usado: true,
      usadoEm: new Date().toISOString(),
      usadoPor: usuarioEmail
    });
    
    console.log('✅ Código marcado como usado');
    
    return {
      success: true,
      message: 'Senha redefinida com sucesso!'
    };
  } catch (error) {
    console.error('❌ Erro ao redefinir senha:', error);
    return {
      success: false,
      message: 'Erro ao redefinir senha: ' + error.message
    };
  }
};

// Listar códigos ativos (para admin)
export const listarCodigosAtivos = async () => {
  try {
    const q = query(
      collection(backupDb, 'codigosRedefinicao'),
      where('usado', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    const codigos = [];
    const agora = new Date();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const expiraEm = new Date(data.expiraEm);
      const expirado = agora > expiraEm;
      
      codigos.push({
        id: doc.id,
        ...data,
        expirado: expirado,
        tempoRestante: expirado ? 0 : Math.floor((expiraEm - agora) / (1000 * 60)) // minutos
      });
    });
    
    // Ordenar por data de criação (mais recentes primeiro)
    codigos.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
    
    return {
      success: true,
      codigos: codigos
    };
  } catch (error) {
    console.error('❌ Erro ao listar códigos:', error);
    return {
      success: false,
      codigos: [],
      error: error.message
    };
  }
};

// Revogar código (para admin)
export const revogarCodigo = async (codigoId) => {
  try {
    await deleteDoc(doc(backupDb, 'codigosRedefinicao', codigoId));
    
    console.log('✅ Código revogado:', codigoId);
    
    return {
      success: true,
      message: 'Código revogado com sucesso'
    };
  } catch (error) {
    console.error('❌ Erro ao revogar código:', error);
    return {
      success: false,
      message: 'Erro ao revogar código: ' + error.message
    };
  }
};

// Limpar códigos expirados (para admin)
export const limparCodigosExpirados = async () => {
  try {
    const querySnapshot = await getDocs(collection(backupDb, 'codigosRedefinicao'));
    const agora = new Date();
    let removidos = 0;
    
    const promessas = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const expiraEm = new Date(data.expiraEm);
      
      if (agora > expiraEm) {
        promessas.push(deleteDoc(doc.ref));
        removidos++;
      }
    });
    
    await Promise.all(promessas);
    
    console.log(`✅ ${removidos} código(s) expirado(s) removido(s)`);
    
    return {
      success: true,
      removidos: removidos,
      message: `${removidos} código(s) expirado(s) removido(s)`
    };
  } catch (error) {
    console.error('❌ Erro ao limpar códigos expirados:', error);
    return {
      success: false,
      removidos: 0,
      message: 'Erro ao limpar códigos: ' + error.message
    };
  }
};

// Criar novo usuário com código de redefinição
export const criarUsuarioComCodigo = async (nomeCompleto, email, senha, codigo) => {
  try {
    console.log('👤 Criando usuário com código:', { nomeCompleto, email, codigo });
    
    // 1. Validar código
    const validacao = await validarCodigoRedefinicao(codigo, email);
    
    if (!validacao.valido) {
      return {
        success: false,
        error: validacao.motivo
      };
    }
    
    // 2. Verificar se empresa e setor estão definidos no código (apenas para usuário normal)
    if (validacao.nivelUsuario === 'usuario' && (!validacao.empresaId || !validacao.setorId)) {
      return {
        success: false,
        error: 'Este código não possui empresa ou setor associados. Entre em contato com o administrador.'
      };
    }
    
    // 3. Criptografar senha
    const senhaHash = encryptPassword(senha);
    
    // 4. Preparar dados do usuário (retorna para que o componente faça o registro)
    console.log('✅ Código validado, dados prontos para registro');
    
    return {
      success: true,
      codigoId: validacao.id,
      dadosUsuario: {
        nome: nomeCompleto,
        email: email,
        senha: senhaHash,
        empresaId: validacao.empresaId,
        setorId: validacao.setorId,
        nivel: validacao.nivelUsuario || 'usuario'
      }
    };
  } catch (error) {
    console.error('❌ Erro ao criar usuário com código:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ========================================
// 🆕 FUNÇÕES PARA CÓDIGOS DE CRIAÇÃO DE CONTAS
// ========================================

// Criar código de criação de conta
export const criarCodigoCriacaoConta = async (adminId, validadeHoras = 24, empresaId = null, setorId = null, nivelUsuario = '1') => {
  try {
    const codigo = generateResetCode();
    const agora = new Date();
    const expiraEm = new Date(agora.getTime() + (validadeHoras * 60 * 60 * 1000));
    
    const codigoData = {
      codigo: codigo,
      tipo: 'criacao', // Tipo específico para diferencias dos códigos de redefinição
      criadoPor: adminId,
      criadoEm: agora.toISOString(),
      expiraEm: expiraEm.toISOString(),
      usado: false,
      usadoEm: null,
      usadoPor: null,
      empresaId: empresaId, // ID da empresa associada
      setorId: setorId, // ID do setor associado
      nivelUsuario: nivelUsuario // Nível do usuário (0-6)
    };
    
    const docRef = await addDoc(collection(backupDb, 'codigosCriacaoContas'), codigoData);
    
    console.log('✅ Código de criação de conta criado:', {
      id: docRef.id,
      codigo: codigo,
      nivelUsuario: nivelUsuario,
      expiraEm: expiraEm.toLocaleString('pt-BR')
    });
    
    return {
      success: true,
      codigo: codigo,
      id: docRef.id,
      expiraEm: expiraEm.toISOString(),
      tipo: 'criacao'
    };
  } catch (error) {
    console.error('❌ Erro ao criar código de criação de conta:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Listar códigos de criação de contas ativos
export const listarCodigosCriacaoAtivos = async () => {
  try {
    const snapshot = await getDocs(collection(backupDb, 'codigosCriacaoContas'));
    const agora = new Date();
    
    const codigos = snapshot.docs.map(doc => {
      const data = doc.data();
      const expiraEm = new Date(data.expiraEm);
      const expirado = agora > expiraEm || data.usado;
      
      // Calcular tempo restante em minutos
      const tempoRestante = expirado ? 0 : Math.max(0, Math.floor((expiraEm - agora) / (1000 * 60)));
      
      return {
        id: doc.id,
        codigo: data.codigo,
        tipo: 'criacao',
        usuarioEmail: null, // Códigos de criação são sempre genéricos
        criadoPor: data.criadoPor,
        criadoEm: data.criadoEm,
        expiraEm: data.expiraEm,
        usado: data.usado,
        usadoEm: data.usadoEm,
        usadoPor: data.usadoPor,
        empresaId: data.empresaId,
        setorId: data.setorId,
        nivelUsuario: data.nivelUsuario,
        expirado: expirado,
        tempoRestante: tempoRestante
      };
    });
    
    // Ordenar por data de criação (mais recentes primeiro)
    codigos.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
    
    console.log(`📋 ${codigos.length} códigos de criação encontrados`);
    
    return {
      success: true,
      codigos: codigos
    };
  } catch (error) {
    console.error('❌ Erro ao listar códigos de criação:', error);
    return {
      success: false,
      codigos: [],
      error: error.message
    };
  }
};

// Validar código de criação de conta
export const validarCodigoCriacaoConta = async (codigo) => {
  try {
    console.log('🔍 Validando código de criação:', codigo);
    
    // Buscar código no Firebase
    const q = query(
      collection(backupDb, 'codigosCriacaoContas'),
      where('codigo', '==', codigo.toUpperCase())
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('❌ Código de criação não encontrado');
      return {
        valido: false,
        motivo: 'Código inválido ou não existe'
      };
    }
    
    const codigoDoc = querySnapshot.docs[0];
    const codigoData = codigoDoc.data();
    
    console.log('📋 Código de criação encontrado:', {
      usado: codigoData.usado,
      expiraEm: codigoData.expiraEm,
      nivelUsuario: codigoData.nivelUsuario
    });
    
    // Verificar se já foi usado
    if (codigoData.usado) {
      console.log('❌ Código de criação já foi usado');
      return {
        valido: false,
        motivo: 'Este código já foi utilizado'
      };
    }
    
    // Verificar se expirou
    const agora = new Date();
    const expiraEm = new Date(codigoData.expiraEm);
    
    if (agora > expiraEm) {
      console.log('❌ Código de criação expirado');
      return {
        valido: false,
        motivo: 'Código expirado'
      };
    }
    
    console.log('✅ Código de criação válido');
    
    return {
      valido: true,
      id: codigoDoc.id,
      empresaId: codigoData.empresaId,
      setorId: codigoData.setorId,
      nivelUsuario: codigoData.nivelUsuario,
      expiraEm: codigoData.expiraEm
    };
  } catch (error) {
    console.error('❌ Erro ao validar código de criação:', error);
    return {
      valido: false,
      motivo: 'Erro interno do sistema'
    };
  }
};

// Marcar código de criação como usado
export const marcarCodigoCriacaoUsado = async (codigoId, emailUsuario) => {
  try {
    const docRef = doc(backupDb, 'codigosCriacaoContas', codigoId);
    
    await updateDoc(docRef, {
      usado: true,
      usadoEm: new Date().toISOString(),
      usadoPor: emailUsuario
    });
    
    console.log('✅ Código de criação marcado como usado:', codigoId);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('❌ Erro ao marcar código de criação como usado:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Criar usuário com código de criação
export const criarUsuarioComCodigoCriacao = async (codigo, nomeCompleto, email, senha) => {
  try {
    console.log('👤 Criando usuário com código de criação:', { codigo, email, nome: nomeCompleto });
    
    // Validar código
    const validacao = await validarCodigoCriacaoConta(codigo);
    
    if (!validacao.valido) {
      return {
        success: false,
        error: validacao.motivo
      };
    }
    
    // Criptografar senha
    const { hash, salt, version } = encryptPassword(senha);
    
    // Marcar código como usado
    await marcarCodigoCriacaoUsado(validacao.id, email);
    
    console.log('✅ Usuário criado com código de criação - dados preparados');
    
    return {
      success: true,
      codigoId: validacao.id,
      dadosUsuario: {
        nome: nomeCompleto,
        email: email,
        senha: hash,
        salt: salt,
        version: version,
        algorithm: 'SHA-512',
        empresaId: validacao.empresaId,
        setorId: validacao.setorId,
        nivel: parseInt(validacao.nivelUsuario) || 1,
        authKey: senha, // 🔑 authKey é a senha digitada (PRIORIDADE 1 NO LOGIN)
        primeiroAcesso: false, // Como está criando com senha, não é primeiro acesso
        criadoEm: new Date().toISOString(),
        criadoComCodigo: true
      }
    };
  } catch (error) {
    console.error('❌ Erro ao criar usuário com código de criação:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
