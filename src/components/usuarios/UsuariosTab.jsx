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

  // Filtrar usuários visíveis
  const usuariosVisiveis = usuarios.filter(usuario => {
    // Primeiro aplicar filtro de permissões
    const temPermissao = usuarioLogado.nivel === NIVEIS_PERMISSAO.ADMIN ? true :
      usuarioLogado.nivel === NIVEIS_PERMISSAO.GERENTE ? 
        (usuario.nivel < NIVEIS_PERMISSAO.GERENTE || usuario.id === usuarioLogado.id) :
        usuario.id === usuarioLogado.id;

    // Depois aplicar filtro de busca
    const termoBusca = searchTerm.toLowerCase();
    const matchBusca = !searchTerm || 
      usuario.nome.toLowerCase().includes(termoBusca) ||
      usuario.email.toLowerCase().includes(termoBusca);

    return temPermissao && matchBusca;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 bg-opacity-10 dark:bg-[#1D9BF0] dark:bg-opacity-10 rounded-lg flex items-center justify-center">
              <UserCog className="w-5 h-5 text-blue-500 dark:text-[#1D9BF0]" />
            </div>
            <div>
              <p className={colors.textSecondary}>Gerencie os usuários do sistema de acordo com suas permissões</p>
            </div>
          </div>
          
          {/* Campo de busca */}
          <div className="flex-1 mx-4">
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#1D9BF0] focus:border-transparent`}
            />
          </div>

          {niveisDisponiveis.length > 0 && (
            <button
              onClick={abrirModalCriar}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] text-white px-4 py-2 rounded-full transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Usuário
            </button>
          )}
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
      <div className={`bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y dark:divide-[#2F3336]">
            <thead className="bg-black bg-opacity-5 dark:bg-[#2F3336]">
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textSecondary} uppercase tracking-wider`}>
                  Usuário
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textSecondary} uppercase tracking-wider`}>
                  Nível de Acesso
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textSecondary} uppercase tracking-wider`}>
                  Status
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textSecondary} uppercase tracking-wider`}>
                  Último Login
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textSecondary} uppercase tracking-wider`}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-[#2F3336]">
              {usuariosVisiveis.map((usuario) => (
                <tr key={usuario.id} className={`hover:bg-black hover:bg-opacity-5 dark:hover:bg-[#2F3336]`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-blue-500 bg-opacity-10 dark:bg-[#1D9BF0] dark:bg-opacity-10 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-500 dark:text-[#1D9BF0]" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className={`text-sm font-medium ${colors.text}`}>
                          {usuario.nome}
                          {usuario.id === usuarioLogado.id && (
                            <span className="ml-2 text-xs text-blue-500 dark:text-[#1D9BF0] font-medium">(Você)</span>
                          )}
                        </div>
                        <div className={`text-sm ${colors.textSecondary}`}>{usuario.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 text-blue-500 dark:text-[#1D9BF0] mr-2" />
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        usuario.nivel === NIVEIS_PERMISSAO.ADMIN ? 'bg-red-500 bg-opacity-10 text-red-500 dark:bg-[#F4212E] dark:bg-opacity-10 dark:text-[#F4212E]' :
                        usuario.nivel === NIVEIS_PERMISSAO.GERENTE ? 'bg-blue-500 bg-opacity-10 text-blue-500 dark:bg-[#1D9BF0] dark:bg-opacity-10 dark:text-[#1D9BF0]' :
                        usuario.nivel === NIVEIS_PERMISSAO.SUPERVISOR ? 'bg-green-500 bg-opacity-10 text-green-500 dark:bg-[#00BA7C] dark:bg-opacity-10 dark:text-[#00BA7C]' :
                        'bg-yellow-500 bg-opacity-10 text-yellow-600 dark:bg-[#FFD700] dark:bg-opacity-10 dark:text-[#FFD700]'
                      }`}>
                        {NIVEIS_LABELS[usuario.nivel]}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      usuario.ativo ? 'bg-[#00BA7C] bg-opacity-10 text-[#00BA7C]' : 'bg-[#F4212E] bg-opacity-10 text-[#F4212E]'
                    }`}>
                      {usuario.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${colors.textSecondary}`}>
                    {usuario.ultimoLogin ? 
                      new Date(usuario.ultimoLogin).toLocaleString('pt-BR') : 
                      'Nunca'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      {PermissionChecker.canEditUser(usuarioLogado.nivel, usuarioLogado.id, usuario.id, usuario.nivel) && (
                        <button
                          onClick={() => abrirModalEditar(usuario)}
                          className="p-2 hover:bg-[#1D9BF0] hover:bg-opacity-10 rounded-full transition-colors"
                          title="Editar usuário"
                        >
                          <Edit className="w-4 h-4 text-[#1D9BF0]" />
                        </button>
                      )}
                      {usuarioLogado.nivel === NIVEIS_PERMISSAO.ADMIN &&
                        usuario.email !== 'admin' && usuario.id !== usuarioLogado.id && (
                        <button
                          onClick={() => confirmarRemocao(usuario)}
                          className="p-2 hover:bg-[#F4212E] hover:bg-opacity-10 rounded-full transition-colors"
                          title="Remover usuário"
                        >
                          <Trash2 className="w-4 h-4 text-[#F4212E]" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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


