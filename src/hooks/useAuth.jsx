import { createContext, useContext, useState, useEffect } from 'react';
import { encryptData, encryptPassword, verifyPassword } from '../utils/crypto';
import { dbWorkflowBR1 } from '../config/firebaseWorkflowBR1';
import { collection, query, where, getDocs } from 'firebase/firestore';

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

  // Carregar dados do usuário e usuários salvos
  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('usuario');
    const usuariosSalvos = localStorage.getItem('usuarios');

    if (usuarioSalvo) {
      setUsuario(JSON.parse(usuarioSalvo));
    }
    if (usuariosSalvos) {
      setUsuarios(JSON.parse(usuariosSalvos));
    }
    setLoading(false);
  }, []);

  // Salvar alterações no localStorage
  useEffect(() => {
    if (usuario) {
      localStorage.setItem('usuario', JSON.stringify(usuario));
    }
    if (usuarios.length > 0) {
      localStorage.setItem('usuarios', JSON.stringify(usuarios));
    }
  }, [usuario, usuarios]);

  const login = async (username, password) => {
    // 1. Primeiro tenta buscar no workflowbr1
    try {
      const usuariosRef = collection(dbWorkflowBR1, 'usuarios');
      const q = query(usuariosRef, where('email', '==', username), where('ativo', '==', true));
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

        setUsuario(usuarioEncontrado);
        return usuarioEncontrado;
      }
    } catch (error) {
      console.error('Erro ao buscar no workflowbr1:', error);
    }

    // 2. Se não encontrou no workflowbr1, tenta no localStorage (sistema antigo)
    const usuarioEncontrado = usuarios.find(u => u.username === username);
    if (!usuarioEncontrado) {
      throw new Error('Usuário não encontrado');
    }

    const senhaCorreta = await verifyPassword(password, usuarioEncontrado.senha);
    if (!senhaCorreta) {
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

    setUsuario(usuarioEncontrado);
    return usuarioEncontrado;
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('usuario');
    
    // Limpar cookies de autenticação para evitar login automático
    try {
      // Lista de cookies relacionados à autenticação
      const cookieNames = ['workflow_usuario', 'workflow_lembrar', 'workflow_expiracao'];
      
      cookieNames.forEach(cookieName => {
        document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;SameSite=Strict`;
      });
      
      console.log('✅ Cookies de autenticação removidos no logout');
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

  const atualizarUsuario = async (id, dadosAtualizados) => {
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
      
      // 🔑 ATUALIZAR AUTHKEY PARA NOVO SISTEMA DE AUTENTICAÇÃO
      // Se for administrador (nível 0), usa authKey "admin2024"
      // Se for outro usuário, usa authKey "workflow2024"
      const nivelUsuario = usuarioAtualizado.nivel;
      usuarioAtualizado.authKey = nivelUsuario === 0 ? 'admin2024' : 'workflow2024';
      usuarioAtualizado.authKeyUpdatedAt = new Date();
      
      console.log('🔑 Campo authKey atualizado junto com a senha:', usuarioAtualizado.authKey);
    }

    const novosUsuarios = [...usuarios];
    novosUsuarios[usuarioIndex] = usuarioAtualizado;
    setUsuarios(novosUsuarios);

    if (usuario?.id === id) {
      setUsuario(usuarioAtualizado);
    }

    return usuarioAtualizado;
  };

  const excluirUsuario = (id) => {
    setUsuarios(prev => prev.filter(u => u.id !== id));
    if (usuario?.id === id) {
      logout();
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
