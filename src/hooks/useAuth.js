import { createContext, useContext, useState, useEffect } from 'react';

// Criar o contexto
const AuthContext = createContext();

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

  // Carregar usuário do localStorage na inicialização
  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('usuario');
    const usuariosSalvos = localStorage.getItem('usuarios');
    
    if (usuarioSalvo) {
      setUsuario(JSON.parse(usuarioSalvo));
    }
    
    if (usuariosSalvos) {
      setUsuarios(JSON.parse(usuariosSalvos));
    } else {
      // Criar usuário admin padrão se não existir
      const usuariosPadrao = [
        {
          id: 1,
          nome: 'Administrador',
          email: 'admin',
          senha: 'admin',
          nivel: 'admin',
          ativo: true,
          ultimoLogin: null
        }
      ];
      setUsuarios(usuariosPadrao);
      localStorage.setItem('usuarios', JSON.stringify(usuariosPadrao));
    }
    
    setLoading(false);
  }, []);

  // Salvar usuários no localStorage sempre que a lista mudar
  useEffect(() => {
    if (usuarios.length > 0) {
      localStorage.setItem('usuarios', JSON.stringify(usuarios));
    }
  }, [usuarios]);

  // Função de login
  const login = async (email, senha) => {
    const usuarioEncontrado = usuarios.find(
      u => u.email === email && u.senha === senha && u.ativo
    );

    if (usuarioEncontrado) {
      const usuarioAtualizado = {
        ...usuarioEncontrado,
        ultimoLogin: new Date().toISOString()
      };
      
      // Atualizar último login na lista de usuários
      setUsuarios(prev => prev.map(u => 
        u.id === usuarioEncontrado.id ? usuarioAtualizado : u
      ));
      
      setUsuario(usuarioAtualizado);
      localStorage.setItem('usuario', JSON.stringify(usuarioAtualizado));
      return { success: true };
    }

    return { success: false, message: 'Credenciais inválidas' };
  };

  // Função de logout
  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('usuario');
  };

  // Função para criar usuário
  const criarUsuario = async (dadosUsuario) => {
    try {
      const novoId = Math.max(...usuarios.map(u => u.id), 0) + 1;
      const novoUsuario = {
        id: novoId,
        ...dadosUsuario,
        ultimoLogin: null
      };

      setUsuarios(prev => [...prev, novoUsuario]);
      return { success: true, usuario: novoUsuario };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  // Função para atualizar usuário
  const atualizarUsuario = async (id, dadosAtualizados) => {
    try {
      setUsuarios(prev => prev.map(u => 
        u.id === id ? { ...u, ...dadosAtualizados } : u
      ));

      // Se for o usuário logado, atualizar também
      if (usuario && usuario.id === id) {
        const usuarioAtualizado = { ...usuario, ...dadosAtualizados };
        setUsuario(usuarioAtualizado);
        localStorage.setItem('usuario', JSON.stringify(usuarioAtualizado));
      }

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  // Função para remover usuário
  const removerUsuario = async (id) => {
    try {
      // Não permitir remover o próprio usuário logado
      if (usuario && usuario.id === id) {
        return { success: false, message: 'Não é possível remover o próprio usuário' };
      }

      setUsuarios(prev => prev.filter(u => u.id !== id));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const value = {
    usuario,
    usuarios,
    loading,
    login,
    logout,
    criarUsuario,
    atualizarUsuario,
    removerUsuario
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Exportar também o contexto para casos específicos
export { AuthContext };