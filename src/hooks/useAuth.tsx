import { createContext, useContext, useState, useEffect } from 'react';
import { encryptPassword, verifyPassword } from '../utils/crypto';
import { encryptData, decryptData } from '../utils/cryptoUtils';
import { dbWorkflowBR1 } from '../config/firebaseWorkflowBR1';
import { collection, query, where, getDocs } from 'firebase/firestore';
import rateLimiter from '../utils/rateLimiter';
import sessionManager from '../utils/sessionManager';
import csrfProtection from '../utils/csrfProtection';
import { toast } from 'react-hot-toast';

// Criar o contexto
export const AuthContext = createContext({
  usuario: null,
  usuarios: [],
  loading: true,
  login: () => {},
  logout: () => {},
  cadastrarUsuario: () => {},
  atualizarUsuario: () => {},
  excluirUsuario: () => {},
});

// Hook personalizado para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// Provider do contexto
export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionWarningShown, setSessionWarningShown] = useState(false);

  // Carregar dados do usuário e usuários salvos (descriptografados)
  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('usuario');
    const usuariosSalvos = localStorage.getItem('usuarios');

    try {
      if (usuarioSalvo) {
        // Tentar descriptografar, se falhar usar JSON direto (compatibilidade)
        try {
          const decrypted = decryptData(usuarioSalvo);
          setUsuario(JSON.parse(decrypted));
        } catch {
          setUsuario(JSON.parse(usuarioSalvo));
        }
      }
      if (usuariosSalvos) {
        try {
          const decrypted = decryptData(usuariosSalvos);
          setUsuarios(JSON.parse(decrypted));
        } catch {
          setUsuarios(JSON.parse(usuariosSalvos));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados de autenticação:', error);
    }
    setLoading(false);
  }, []);

  // Salvar alterações no localStorage (criptografados)
  useEffect(() => {
    try {
      if (usuario) {
        const encrypted = encryptData(JSON.stringify(usuario));
        localStorage.setItem('usuario', encrypted);
      }
      if (usuarios.length > 0) {
        const encrypted = encryptData(JSON.stringify(usuarios));
        localStorage.setItem('usuarios', encrypted);
      }
    } catch (error) {
      console.error('Erro ao salvar dados de autenticação:', error);
    }
  }, [usuario, usuarios]);

  const login = async (username, password, csrfToken) => {
    // 🛡️ PROTEÇÃO CSRF: Validar token antes de processar
    if (!csrfProtection.validateOperation('login', csrfToken)) {
      throw new Error('Token de segurança inválido. Recarregue a página e tente novamente.');
    }

    // 🛡️ PROTEÇÃO: Verificar rate limiting antes de processar
    const rateLimitCheck = rateLimiter.canAttemptLogin(username);
    if (!rateLimitCheck.allowed) {
      throw new Error(rateLimitCheck.message);
    }

    // Se há delay necessário, aguardar
    if (rateLimitCheck.waitTime) {
      await new Promise(resolve => setTimeout(resolve, rateLimitCheck.waitTime * 1000));
    }

    // 1. Primeiro tenta buscar no workflowbr1
    try {
      const usuariosRef = collection(dbWorkflowBR1, 'usuarios');
      const q = query(usuariosRef, where('usuario', '==', username), where('ativo', '==', true));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const usuarioEncontrado = { id: doc.id, ...doc.data() };

        // Verificar senha com novo sistema (hash + salt)
        // Suporta tanto o formato antigo (senha, salt) quanto o novo (senhaHash, senhaSalt)
        const hash = usuarioEncontrado.senhaHash || usuarioEncontrado.senha;
        const salt = usuarioEncontrado.senhaSalt || usuarioEncontrado.salt;
        const version = usuarioEncontrado.senhaVersion || usuarioEncontrado.version || 2;
        
        const senhaCorreta = verifyPassword(password, hash, salt, version);

        if (!senhaCorreta) {
          // 🛡️ PROTEÇÃO: Registrar tentativa falhada
          const result = rateLimiter.recordAttempt(username, false);
          if (result.message) {
            throw new Error(`Senha incorreta. ${result.message}`);
          }
          throw new Error('Senha incorreta');
        }

        // Validar setor/empresa para usuários não-admin
        const NIVEL_ADMIN = 0;
        const isAdmin = usuarioEncontrado.nivel === NIVEL_ADMIN;
        
        if (!isAdmin) {
          if (usuarioEncontrado.nivel >= 1 && usuarioEncontrado.nivel <= 3) {
            if (!usuarioEncontrado.setorId || !usuarioEncontrado.setorId.trim()) {
              throw new Error('Usuário sem setor atribuído. Entre em contato com o administrador.');
            }
            if (!usuarioEncontrado.empresaId || !usuarioEncontrado.empresaId.trim()) {
              throw new Error('Usuário sem empresa atribuída. Entre em contato com o administrador.');
            }
          }
        }

        // 🛡️ PROTEÇÃO: Registrar tentativa bem-sucedida (limpa rate limiter)
        rateLimiter.recordAttempt(username, true);

        // �️ CSRF: Rotacionar token após login bem-sucedido
        csrfProtection.rotateAfterOperation('login');

        // �🕐 INICIAR GERENCIAMENTO DE SESSÃO
        sessionManager.startSession(
          (remainingSeconds) => {
            // Alerta antes da expiração
            if (!sessionWarningShown) {
              setSessionWarningShown(true);
              const minutes = Math.ceil(remainingSeconds / 60);
              toast.error(
                `Sua sessão expirará em ${minutes} minuto${minutes !== 1 ? 's' : ''} por inatividade.`,
                {
                  duration: 10000,
                  position: 'top-center',
                  icon: '⏰'
                }
              );
            }
          },
          (reason) => {
            // Logout automático
            toast.error(reason || 'Sessão expirada', {
              duration: 5000,
              icon: '🔒'
            });
            logout();
          }
        );

        setUsuario(usuarioEncontrado);
        return usuarioEncontrado;
      }
    } catch (error) {
      console.error('Erro ao buscar no workflowbr1:', error);
      // Se erro não é de autenticação, re-throw
      if (error.message.includes('incorreta') || error.message.includes('bloqueada') || error.message.includes('tentativas')) {
        throw error;
      }
    }

    // 2. Se não encontrou no workflowbr1, tenta no localStorage (sistema antigo)
    const usuarioEncontrado = usuarios.find(u => u.username === username);
    if (!usuarioEncontrado) {
      // 🛡️ PROTEÇÃO: Registrar tentativa falhada
      rateLimiter.recordAttempt(username, false);
      throw new Error('Usuário não encontrado');
    }

    const senhaCorreta = await verifyPassword(password, usuarioEncontrado.senha);
    if (!senhaCorreta) {
      // 🛡️ PROTEÇÃO: Registrar tentativa falhada
      const result = rateLimiter.recordAttempt(username, false);
      if (result.message) {
        throw new Error(`Senha incorreta. ${result.message}`);
      }
      throw new Error('Senha incorreta');
    }

    // Verificar se o usuário tem setor e empresa definidos
    const NIVEL_ADMIN_OLD = 4;
    const isAdmin = usuarioEncontrado.nivel === NIVEL_ADMIN_OLD;
    
    if (!isAdmin) {
      if (!usuarioEncontrado.setorId || !usuarioEncontrado.setorId.trim()) {
        throw new Error('Usuário sem setor atribuído. Entre em contato com o administrador.');
      }

      if (!usuarioEncontrado.empresaId || !usuarioEncontrado.empresaId.trim()) {
        throw new Error('Usuário sem empresa atribuída. Entre em contato com o administrador.');
      }
    }

    // 🛡️ PROTEÇÃO: Registrar tentativa bem-sucedida (limpa rate limiter)
    rateLimiter.recordAttempt(username, true);

    // �️ CSRF: Rotacionar token após login bem-sucedido
    csrfProtection.rotateAfterOperation('login');

    // �🕐 INICIAR GERENCIAMENTO DE SESSÃO (sistema antigo)
    sessionManager.startSession(
      (remainingSeconds) => {
        if (!sessionWarningShown) {
          setSessionWarningShown(true);
          const minutes = Math.ceil(remainingSeconds / 60);
          toast.error(
            `Sua sessão expirará em ${minutes} minuto${minutes !== 1 ? 's' : ''} por inatividade.`,
            {
              duration: 10000,
              position: 'top-center',
              icon: '⏰'
            }
          );
        }
      },
      (reason) => {
        toast.error(reason || 'Sessão expirada', {
          duration: 5000,
          icon: '🔒'
        });
        logout();
      }
    );

    setUsuario(usuarioEncontrado);
    return usuarioEncontrado;
  };

  const logout = (csrfToken) => {
    // 🛡️ PROTEÇÃO CSRF: Validar token para logout
    if (csrfToken && !csrfProtection.validateOperation('logout', csrfToken)) {
      console.warn('⚠️ Token CSRF inválido no logout (executando mesmo assim por segurança)');
    }

    // 🕐 ENCERRAR SESSÃO
    sessionManager.endSession();
    
    // 🛡️ CSRF: Limpar token após logout
    csrfProtection.clearToken();
    
    setUsuario(null);
    setSessionWarningShown(false);
    localStorage.removeItem('usuario');
    
    // Limpar cookies de autenticação para evitar login automático
    try {
      // Lista de cookies relacionados à autenticação
      const cookieNames = ['workflow_usuario', 'workflow_lembrar', 'workflow_expiracao'];
      
      cookieNames.forEach(cookieName => {
        document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;SameSite=Strict`;
      });
    } catch (error) {
      console.error('❌ Erro ao remover cookies no logout:', error);
    }
  };

  const cadastrarUsuario = async (dadosUsuario) => {
    const senhaEncriptada = await encryptPassword(dadosUsuario.senha);
    const novoUsuario = {
      ...dadosUsuario,
      senha: senhaEncriptada,
      id: Date.now().toString(),
    };

    setUsuarios(prev => [...prev, novoUsuario]);
    return novoUsuario;
  };

  const atualizarUsuario = async (id, dadosAtualizados, csrfToken) => {
    // 🛡️ PROTEÇÃO CSRF: Validar token para operações de atualização
    const operacao = dadosAtualizados.senha ? 'updatePassword' : 'updateUser';
    if (!csrfProtection.validateOperation(operacao, csrfToken)) {
      throw new Error('Token de segurança inválido. Operação não autorizada.');
    }

    const usuarioIndex = usuarios.findIndex(u => u.id === id);
    if (usuarioIndex === -1) {
      throw new Error('Usuário não encontrado');
    }

    const usuarioAtualizado = {
      ...usuarios[usuarioIndex],
      ...dadosAtualizados,
    };

    if (dadosAtualizados.senha) {
      usuarioAtualizado.senha = await encryptPassword(dadosAtualizados.senha);
      
      // � SEGURANÇA: Remover authKey se existir (vulnerabilidade crítica)
      // authKey armazenava senha em texto plano - NUNCA deve ser usado
      if (usuarioAtualizado.authKey) {
        delete usuarioAtualizado.authKey;
        delete usuarioAtualizado.authKeyUpdatedAt;
      }
    }

    const novosUsuarios = [...usuarios];
    novosUsuarios[usuarioIndex] = usuarioAtualizado;
    setUsuarios(novosUsuarios);

    if (usuario?.id === id) {
      setUsuario(usuarioAtualizado);
    }

    // 🛡️ CSRF: Rotacionar token após atualização sensível
    csrfProtection.rotateAfterOperation(operacao);

    return usuarioAtualizado;
  };

  const excluirUsuario = (id, csrfToken) => {
    // 🛡️ PROTEÇÃO CSRF: Validar token para exclusão
    if (!csrfProtection.validateOperation('deleteUser', csrfToken)) {
      throw new Error('Token de segurança inválido. Operação não autorizada.');
    }

    setUsuarios(prev => prev.filter(u => u.id !== id));
    
    // 🛡️ CSRF: Rotacionar token após exclusão
    csrfProtection.rotateAfterOperation('deleteUser');
    
    if (usuario?.id === id) {
      logout(csrfToken);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        usuarios,
        loading,
        login,
        logout,
        cadastrarUsuario,
        atualizarUsuario,
        excluirUsuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
