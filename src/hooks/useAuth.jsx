import { createContext, useContext, useState, useEffect } from 'react';
import { encryptData, encryptPassword, verifyPassword } from '../utils/crypto';

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
    const usuarioEncontrado = usuarios.find(u => u.username === username);
    if (!usuarioEncontrado) {
      throw new Error('Usuário não encontrado');
    }

    // Verificar se a senha está no formato antigo (string) ou novo (objeto)
    let senhaCorreta = false;
    
    if (typeof usuarioEncontrado.senha === 'object' && usuarioEncontrado.senha !== null) {
      // Formato novo: { hash, salt, version }
      const { hash, salt, version } = usuarioEncontrado.senha;
      senhaCorreta = verifyPassword(password, hash, salt, version);
    } else if (typeof usuarioEncontrado.senha === 'string') {
      // Formato antigo: apenas hash
      // Tentar verificar com salt padrão ou sem salt
      senhaCorreta = verifyPassword(password, usuarioEncontrado.senha, usuarioEncontrado.senhaSalt || '', 1);
    }
    
    if (!senhaCorreta) {
      throw new Error('Senha incorreta');
    }

    // Verificar se o usuário tem setor e empresa definidos
    // EXCEÇÃO: Administradores (nivel 4) não precisam ter setor, empresa ou cargo
    const NIVEL_ADMIN = 4;
    const isAdmin = usuarioEncontrado.nivel === NIVEL_ADMIN;
    
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
