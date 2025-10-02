import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { NIVEIS_PERMISSAO, NIVEIS_LABELS, PermissionChecker } from '../../constants/permissoes';
import { twitterThemeConfig } from '../../styles/twitterThemeConfig';
import { 
  UserCog,
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Shield,
  Check,
  X,
  AlertTriangle,
  User
} from 'lucide-react';

const { classes, colors } = twitterThemeConfig;


const UsuariosTab = () => {
  const { 
    usuarios, 
    usuario: usuarioLogado,
    criarUsuario, 
    atualizarUsuario, 
    removerUsuario
  } = useAuth();

  // Move all hooks to top-level before any early return
  const [mostrarModal, setMostrarModal] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [confirmacaoRemocao, setConfirmacaoRemocao] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    nivel: NIVEIS_PERMISSAO.FUNCIONARIO,
    ativo: true
  });

  // Check if context is properly loaded
  if (!usuarioLogado) {
    return (
      <div className={`bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-8 text-center`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1D9BF0] mx-auto mb-4"></div>
        <p className={colors.textSecondary}>Carregando dados do usuário...</p>
      </div>
    );
  }

  const isFuncionario = usuarioLogado?.nivel === NIVEIS_PERMISSAO.FUNCIONARIO;

  // Resetar formulário
  const resetarForm = () => {
    setFormData({
      nome: '',
      email: '',
      senha: '',
      nivel: NIVEIS_PERMISSAO.FUNCIONARIO,
      ativo: true
    });
    setUsuarioEditando(null);
    setMostrarSenha(false);
    setErro('');
    setSucesso('');
  };

  // Abrir modal para criar usuário
  const abrirModalCriar = () => {
    if (isFuncionario) return;
    resetarForm();
    setMostrarModal(true);
  };

  // Abrir modal para editar usuário
  const abrirModalEditar = (usuario) => {
    if (!PermissionChecker.canEditUser(usuarioLogado.nivel, usuarioLogado.id, usuario.id, usuario.nivel)) {
      setErro('Você não tem permissão para editar este usuário.');
      return;
    }

    setFormData({
      nome: usuario.nome,
      email: usuario.email,
      senha: '', // Não mostrar senha por segurança
      nivel: usuario.nivel,
      ativo: usuario.ativo
    });
    setUsuarioEditando(usuario);
    setMostrarModal(true);
  };

  // Fechar modal
  const fecharModal = () => {
    setMostrarModal(false);
    resetarForm();
  };

  // Validar formulário
  const validarForm = () => {
    if (!formData.nome.trim()) {
      return 'Nome é obrigatório';
    }
    if (!formData.email.trim()) {
      return 'Email/usuário é obrigatório';
    }
    if (!usuarioEditando && !formData.senha) {
      return 'Senha é obrigatória';
    }
    if (formData.senha && formData.senha.length < 4) {
      return 'Senha deve ter pelo menos 4 caracteres';
    }
    
    // Verificar se email já existe (exceto o próprio usuário sendo editado)
    const emailExiste = usuarios.find(u => 
      u.email === formData.email && (!usuarioEditando || u.id !== usuarioEditando.id)
    );
    if (emailExiste) {
      return 'Este email/usuário já está em uso';
    }

    return null;
  };

  // Salvar usuário
  const salvarUsuario = async () => {
    setErro('');
    setSucesso('');
    setCarregando(true);

    const erroValidacao = validarForm();
    if (erroValidacao) {
      setErro(erroValidacao);
      setCarregando(false);
      return;
    }

    try {
      const dadosParaSalvar = {
        nome: formData.nome.trim(),
        email: formData.email.trim(),
        nivel: formData.nivel,
        ativo: formData.ativo
      };

      // Incluir senha apenas se foi fornecida
      if (formData.senha) {
        dadosParaSalvar.senha = formData.senha;
      }

      let resultado;
      if (usuarioEditando) {
        resultado = await atualizarUsuario(usuarioEditando.id, dadosParaSalvar);
        setSucesso('Usuário atualizado com sucesso!');
      } else {
        resultado = await criarUsuario(dadosParaSalvar);
        setSucesso('Usuário criado com sucesso!');
      }

      if (resultado.success) {
        setTimeout(() => {
          fecharModal();
        }, 1500);
      } else {
        setErro(resultado.message || 'Erro ao salvar usuário');
      }
    } catch (error) {
      setErro('Erro ao salvar usuário: ' + error.message);
    } finally {
      setCarregando(false);
    }
  };

  // Confirmar remoção
  const confirmarRemocao = (usuario) => {
    if (!PermissionChecker.canEditUser(usuarioLogado.nivel, usuarioLogado.id, usuario.id, usuario.nivel)) {
      setErro('Você não tem permissão para remover este usuário.');
      return;
    }
    setConfirmacaoRemocao(usuario);
  };

  // Executar remoção
  const executarRemocao = async () => {
    if (!confirmacaoRemocao) return;

    setCarregando(true);
    try {
      const resultado = await removerUsuario(confirmacaoRemocao.id);
      if (resultado.success) {
        setSucesso('Usuário removido com sucesso!');
        setConfirmacaoRemocao(null);
        setTimeout(() => setSucesso(''), 3000);
      } else {
        setErro(resultado.message || 'Erro ao remover usuário');
      }
    } catch (error) {
      setErro('Erro ao remover usuário: ' + error.message);
    } finally {
      setCarregando(false);
    }
  };

  // Obter níveis disponíveis para criação
  const getNiveisDisponiveis = () => {
    const niveis = [];
    
    if (usuarioLogado.nivel === NIVEIS_PERMISSAO.ADMIN) {
      // Admin pode criar todos os tipos
      niveis.push(
        { valor: NIVEIS_PERMISSAO.FUNCIONARIO, label: NIVEIS_LABELS[NIVEIS_PERMISSAO.FUNCIONARIO] },
        { valor: NIVEIS_PERMISSAO.SUPERVISOR, label: NIVEIS_LABELS[NIVEIS_PERMISSAO.SUPERVISOR] },
        { valor: NIVEIS_PERMISSAO.GERENTE, label: NIVEIS_LABELS[NIVEIS_PERMISSAO.GERENTE] },
        { valor: NIVEIS_PERMISSAO.ADMIN, label: NIVEIS_LABELS[NIVEIS_PERMISSAO.ADMIN] }
      );
    }
    
    return niveis;
  };

  const niveisDisponiveis = getNiveisDisponiveis();

  // Filtrar usuários visíveis e ordenar alfabeticamente
  const usuariosVisiveis = usuarios
    .filter(usuario => {
      // Primeiro aplicar filtro de permissões
      const temPermissao = usuarioLogado.nivel === NIVEIS_PERMISSAO.ADMIN ? true :
        usuarioLogado.nivel === NIVEIS_PERMISSAO.GERENTE ? 
          (usuario.nivel < NIVEIS_PERMISSAO.GERENTE || usuario.id === usuarioLogado.id) :
          usuario.id === usuarioLogado.id;

      // Depois aplicar filtro de busca
      const termoBusca = searchTerm.toLowerCase();
      const matchBusca = !searchTerm || 
        usuario.nome.toLowerCase().includes(termoBusca) ||
        usuario.email.toLowerCase().includes(termoBusca) ||
        (usuario.empresaNome && usuario.empresaNome.toLowerCase().includes(termoBusca)) ||
        (usuario.setorNome && usuario.setorNome.toLowerCase().includes(termoBusca)) ||
        (usuario.cargo && usuario.cargo.toLowerCase().includes(termoBusca));

      return temPermissao && matchBusca;
    })
    .sort((a, b) => a.nome.localeCompare(b.nome)); // Ordenação alfabética

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-6`}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-[#1D9BF0] dark:to-purple-500 rounded-xl flex items-center justify-center shadow-md">
                <UserCog className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${colors.text}`}>Gerenciamento de Usuários</h2>
                <p className={`text-sm ${colors.textSecondary}`}>Usuários com acesso ao sistema - Segurança SHA-512</p>
              </div>
            </div>
            
            {niveisDisponiveis.length > 0 && (
              <button
                onClick={abrirModalCriar}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-[#1D9BF0] dark:to-[#1A8CD8] dark:hover:from-[#1A8CD8] dark:hover:to-[#1D9BF0] text-white px-6 py-2.5 rounded-full transition-all shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Novo Usuário</span>
              </button>
            )}
          </div>
          
          {/* Campo de busca aprimorado */}
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Buscar por nome, email, empresa, setor ou função..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-5 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] focus:border-transparent transition-all shadow-sm`}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Badge de informações de segurança */}
          <div className="flex items-center gap-2 text-xs bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg px-3 py-2">
            <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-green-700 dark:text-green-300 font-medium">
              Senhas criptografadas com SHA-512 | {usuariosVisiveis.length} usuário{usuariosVisiveis.length !== 1 ? 's' : ''} cadastrado{usuariosVisiveis.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Mensagens */}
        {erro && (
          <div className={`bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm mt-4 p-4 border border-red-500 border-opacity-20 bg-red-500 bg-opacity-10 text-red-500 dark:border-[#F4212E] dark:bg-[#F4212E] dark:text-[#F4212E]`}>
            {erro}
          </div>
        )}
        
        {sucesso && (
          <div className={`bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm mt-4 p-4 border border-green-500 border-opacity-20 bg-green-500 bg-opacity-10 text-green-500 dark:border-[#00BA7C] dark:bg-[#00BA7C] dark:text-[#00BA7C]`}>
            {sucesso}
          </div>
        )}
      </div>

      {/* Lista de Usuários */}
      <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-750">
              <tr>
                <th className={`px-6 py-4 text-left text-xs font-bold ${colors.text} uppercase tracking-wider`}>
                  👤 Usuário
                </th>
                <th className={`px-6 py-4 text-left text-xs font-bold ${colors.text} uppercase tracking-wider`}>
                  🏢 Empresa / Setor
                </th>
                <th className={`px-6 py-4 text-left text-xs font-bold ${colors.text} uppercase tracking-wider`}>
                  💼 Função
                </th>
                <th className={`px-6 py-4 text-left text-xs font-bold ${colors.text} uppercase tracking-wider`}>
                  🔐 Nível de Acesso
                </th>
                <th className={`px-6 py-4 text-left text-xs font-bold ${colors.text} uppercase tracking-wider`}>
                  ⚡ Status
                </th>
                <th className={`px-6 py-4 text-left text-xs font-bold ${colors.text} uppercase tracking-wider`}>
                  🕐 Último Login
                </th>
                <th className={`px-6 py-4 text-left text-xs font-bold ${colors.text} uppercase tracking-wider`}>
                  ⚙️ Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {usuariosVisiveis.map((usuario, index) => (
                <tr key={usuario.id} className={`transition-all hover:bg-blue-50 dark:hover:bg-gray-700/50 ${index % 2 === 0 ? 'bg-gray-50/30 dark:bg-gray-800/50' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white shadow-md ${
                          usuario.nivel === NIVEIS_PERMISSAO.ADMIN ? 'bg-gradient-to-br from-red-500 to-red-600' :
                          usuario.nivel === NIVEIS_PERMISSAO.GERENTE ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                          usuario.nivel === NIVEIS_PERMISSAO.SUPERVISOR ? 'bg-gradient-to-br from-green-500 to-green-600' :
                          'bg-gradient-to-br from-yellow-500 to-yellow-600'
                        }`}>
                          {usuario.nome.charAt(0).toUpperCase()}
                        </div>
                        {usuario.senhaVersion === 2 && (
                          <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
                            <Shield className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold ${colors.text} truncate`}>
                            {usuario.nome}
                          </p>
                          {usuario.id === usuarioLogado.id && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                              Você
                            </span>
                          )}
                        </div>
                        <p className={`text-sm ${colors.textSecondary} truncate`}>{usuario.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className={`text-sm font-medium ${colors.text}`}>
                        {usuario.empresaNome || <span className="text-gray-400 dark:text-gray-500 italic text-xs">Não atribuída</span>}
                      </div>
                      <div className={`text-xs ${colors.textSecondary} flex items-center gap-1`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-[#1D9BF0]"></div>
                        {usuario.setorNome || <span className="text-gray-400 dark:text-gray-500 italic">Não atribuído</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-sm font-medium ${colors.text}`}>
                      {usuario.cargo || <span className="text-gray-400 dark:text-gray-500 italic text-xs">Não definida</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full shadow-sm ${
                        usuario.nivel === NIVEIS_PERMISSAO.ADMIN ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' :
                        usuario.nivel === NIVEIS_PERMISSAO.GERENTE ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' :
                        usuario.nivel === NIVEIS_PERMISSAO.SUPERVISOR ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' :
                        'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white'
                      }`}>
                        <Shield className="w-3.5 h-3.5" />
                        {NIVEIS_LABELS[usuario.nivel]}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full shadow-sm ${
                      usuario.ativo 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                        : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                    }`}>
                      {usuario.ativo ? '✓ Ativo' : '✗ Inativo'}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm ${colors.textSecondary}`}>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {usuario.ultimoLogin ? 
                          new Date(usuario.ultimoLogin).toLocaleDateString('pt-BR') : 
                          'Nunca acessou'
                        }
                      </span>
                      {usuario.ultimoLogin && (
                        <span className="text-xs">
                          {new Date(usuario.ultimoLogin).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {PermissionChecker.canEditUser(usuarioLogado.nivel, usuarioLogado.id, usuario.id, usuario.nivel) && (
                        <button
                          onClick={() => abrirModalEditar(usuario)}
                          className="p-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-lg transition-all transform hover:scale-110"
                          title="Editar usuário"
                        >
                          <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </button>
                      )}
                      {usuarioLogado.nivel === NIVEIS_PERMISSAO.ADMIN &&
                        usuario.email !== 'admin' && usuario.id !== usuarioLogado.id && (
                        <button
                          onClick={() => confirmarRemocao(usuario)}
                          className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg transition-all transform hover:scale-110"
                          title="Remover usuário"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              
              {usuariosVisiveis.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <div>
                        <p className={`text-lg font-medium ${colors.text}`}>Nenhum usuário encontrado</p>
                        <p className={`text-sm ${colors.textSecondary} mt-1`}>
                          {searchTerm ? 'Tente ajustar os termos de busca' : 'Adicione usuários para começar'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Usuário */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className={`bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm max-w-md w-full mx-4 max-h-screen overflow-y-auto`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-medium ${colors.text}`}>
                  {usuarioEditando ? 'Editar Usuário' : 'Novo Usuário'}
                </h3>
                <button
                  onClick={fecharModal}
                  className="p-2 hover:bg-[#1D9BF0] hover:bg-opacity-10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-[#1D9BF0]" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${colors.text} mb-2`}>
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#1D9BF0] focus:border-transparent`}
                    placeholder="Digite o nome completo"
                    disabled={carregando}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${colors.text} mb-2`}>
                    Email/Usuário *
                  </label>
                  <input
                    type="text"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#1D9BF0] focus:border-transparent`}
                    placeholder="Digite o email ou nome de usuário"
                    disabled={carregando}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${colors.text} mb-2`}>
                    Senha {usuarioEditando ? '(deixe vazio para manter a atual)' : '*'}
                  </label>
                  <div className="relative">
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                      className={`w-full px-3 py-2 pr-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#1D9BF0] focus:border-transparent`}
                      placeholder={usuarioEditando ? "Nova senha" : "Digite a senha"}
                      disabled={carregando}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-3 top-2 p-1 hover:bg-[#1D9BF0] hover:bg-opacity-10 rounded-full transition-colors"
                      disabled={carregando}
                    >
                      {mostrarSenha ? 
                        <EyeOff className="w-5 h-5 text-[#1D9BF0]" /> : 
                        <Eye className="w-5 h-5 text-[#1D9BF0]" />
                      }
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${colors.text} mb-2`}>
                    Nível de Acesso *
                  </label>
                  <select
                    value={formData.nivel}
                    onChange={(e) => setFormData({ ...formData, nivel: parseInt(e.target.value) })}
                    className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#1D9BF0] focus:border-transparent`}
                    disabled={carregando}
                  >
                    {niveisDisponiveis.map(nivel => (
                      <option key={nivel.valor} value={nivel.valor}>
                        {nivel.label}
                      </option>
                    ))}
                  </select>
                  <p className={`text-xs ${colors.textSecondary} mt-1`}>
                    {formData.nivel === NIVEIS_PERMISSAO.FUNCIONARIO && "Apenas visualizar informações"}
                    {formData.nivel === NIVEIS_PERMISSAO.SUPERVISOR && "Criar funcionários + operações"}
                    {formData.nivel === NIVEIS_PERMISSAO.GERENTE && "Gerenciar funcionários e usuários"}
                    {formData.nivel === NIVEIS_PERMISSAO.ADMIN && "Todas as permissões"}
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    className="h-4 w-4 text-[#1D9BF0] focus:ring-[#1D9BF0] border-[#1D9BF0] rounded"
                    disabled={carregando}
                  />
                  <label htmlFor="ativo" className={`ml-2 text-sm ${colors.text}`}>
                    Usuário ativo
                  </label>
                </div>
              </div>

              {erro && (
                <div className={`bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm mt-4 p-4 border border-[#F4212E] border-opacity-20 bg-[#F4212E] bg-opacity-10 text-[#F4212E]`}>
                  {erro}
                </div>
              )}

              {sucesso && (
                <div className={`bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm mt-4 p-4 border border-[#00BA7C] border-opacity-20 bg-[#00BA7C] bg-opacity-10 text-[#00BA7C]`}>
                  {sucesso}
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t dark:border-[#2F3336]">
                <button
                  onClick={fecharModal}
                  disabled={carregando}
                  className={`px-4 py-2 bg-black bg-opacity-5 dark:bg-opacity-20 ${colors.text} rounded-full hover:bg-opacity-10 dark:hover:bg-opacity-30 transition-colors disabled:opacity-50`}
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarUsuario}
                  disabled={carregando}
                  className="px-4 py-2 bg-[#1D9BF0] text-white rounded-full hover:bg-[#1A8CD8] transition-colors disabled:opacity-50"
                >
                  {carregando ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Salvando...
                    </div>
                  ) : (
                    usuarioEditando ? 'Atualizar' : 'Criar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Remoção */}
      {confirmacaoRemocao && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className={`bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm max-w-md w-full mx-4`}>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-[#F4212E] bg-opacity-10">
                  <AlertTriangle className="h-6 w-6 text-[#F4212E]" />
                </div>
              </div>
              <div className="text-center">
                <h3 className={`text-lg font-medium ${colors.text} mb-2`}>
                  Confirmar Remoção
                </h3>
                <p className={`text-sm ${colors.textSecondary} mb-4`}>
                  Tem certeza que deseja remover o usuário <strong>{confirmacaoRemocao.nome}</strong>?
                  Esta ação não pode ser desfeita.
                </p>
              </div>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setConfirmacaoRemocao(null)}
                  disabled={carregando}
                  className={`px-4 py-2 bg-black bg-opacity-5 dark:bg-opacity-20 ${colors.text} rounded-full hover:bg-opacity-10 dark:hover:bg-opacity-30 transition-colors disabled:opacity-50`}
                >
                  Cancelar
                </button>
                <button
                  onClick={executarRemocao}
                  disabled={carregando}
                  className="px-4 py-2 bg-[#F4212E] text-white rounded-full hover:bg-opacity-90 transition-colors disabled:opacity-50"
                >
                  {carregando ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Removendo...
                    </div>
                  ) : (
                    'Remover'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosTab;


