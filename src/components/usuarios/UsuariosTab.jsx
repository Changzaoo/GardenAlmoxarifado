import React, { useState } from 'react';
import { useAuth } from '../AlmoxarifadoJardim';
import { NIVEIS_PERMISSAO, NIVEIS_LABELS, PermissionChecker } from '../AlmoxarifadoJardim';
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
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando dados do usuário...</p>
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
    } else if (usuarioLogado.nivel === NIVEIS_PERMISSAO.GERENTE) {
      // Gerente pode criar funcionários e supervisores
      niveis.push(
        { valor: NIVEIS_PERMISSAO.FUNCIONARIO, label: NIVEIS_LABELS[NIVEIS_PERMISSAO.FUNCIONARIO] },
        { valor: NIVEIS_PERMISSAO.SUPERVISOR, label: NIVEIS_LABELS[NIVEIS_PERMISSAO.SUPERVISOR] }
      );
    }
    
    return niveis;
  };

  const niveisDisponiveis = getNiveisDisponiveis();

  // Filtrar usuários visíveis
  const usuariosVisiveis = usuarios.filter(usuario => {
    if (usuarioLogado.nivel === NIVEIS_PERMISSAO.ADMIN) {
      return true; // Admin vê todos
    }
    if (usuarioLogado.nivel === NIVEIS_PERMISSAO.GERENTE) {
      return usuario.nivel < NIVEIS_PERMISSAO.GERENTE || usuario.id === usuarioLogado.id;
    }
    return usuario.id === usuarioLogado.id; // Só pode ver a si mesmo
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserCog className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Gerenciamento de Usuários</h2>
              <p className="text-gray-600">Gerencie os usuários do sistema de acordo com suas permissões</p>
            </div>
          </div>
          
          {niveisDisponiveis.length > 0 && (
            <button
              onClick={abrirModalCriar}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Usuário
            </button>
          )}
        </div>

        {/* Mensagens */}
        {erro && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {erro}
          </div>
        )}
        
        {sucesso && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
            {sucesso}
          </div>
        )}
      </div>

      {/* Lista de Usuários */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nível de Acesso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuariosVisiveis.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-purple-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {usuario.nome}
                          {usuario.id === usuarioLogado.id && (
                            <span className="ml-2 text-xs text-purple-600 font-medium">(Você)</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{usuario.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 text-gray-400 mr-2" />
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        usuario.nivel === NIVEIS_PERMISSAO.ADMIN ? 'bg-red-100 text-red-800' :
                        usuario.nivel === NIVEIS_PERMISSAO.GERENTE ? 'bg-purple-100 text-purple-800' :
                        usuario.nivel === NIVEIS_PERMISSAO.SUPERVISOR ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {NIVEIS_LABELS[usuario.nivel]}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      usuario.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {usuario.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {usuario.ultimoLogin ? 
                      new Date(usuario.ultimoLogin).toLocaleString('pt-BR') : 
                      'Nunca'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <span className="flex gap-2">
                      {PermissionChecker.canEditUser(usuarioLogado.nivel, usuarioLogado.id, usuario.id, usuario.nivel) && (
                        <button
                          onClick={() => abrirModalEditar(usuario)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Editar usuário"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {usuarioLogado.nivel === NIVEIS_PERMISSAO.ADMIN &&
                        usuario.email !== 'admin' && usuario.id !== usuarioLogado.id && (
                        <button
                          onClick={() => confirmarRemocao(usuario)}
                          className="text-red-600 hover:text-red-800"
                          title="Remover usuário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Usuário */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {usuarioEditando ? 'Editar Usuário' : 'Novo Usuário'}
                </h3>
                <button
                  onClick={fecharModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Digite o nome completo"
                    disabled={carregando}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email/Usuário *
                  </label>
                  <input
                    type="text"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Digite o email ou nome de usuário"
                    disabled={carregando}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha {usuarioEditando ? '(deixe vazio para manter a atual)' : '*'}
                  </label>
                  <div className="relative">
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder={usuarioEditando ? "Nova senha" : "Digite a senha"}
                      disabled={carregando}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-3 top-2 text-gray-400 hover:text-gray-600"
                      disabled={carregando}
                    >
                      {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nível de Acesso *
                  </label>
                  <select
                    value={formData.nivel}
                    onChange={(e) => setFormData({ ...formData, nivel: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={carregando}
                  >
                    {niveisDisponiveis.map(nivel => (
                      <option key={nivel.valor} value={nivel.valor}>
                        {nivel.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
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
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    disabled={carregando}
                  />
                  <label htmlFor="ativo" className="ml-2 text-sm text-gray-700">
                    Usuário ativo
                  </label>
                </div>
              </div>

              {erro && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">
                  {erro}
                </div>
              )}

              {sucesso && (
                <div className="mt-4 bg-green-50 border border-green-200 text-green-600 px-3 py-2 rounded-lg text-sm">
                  {sucesso}
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={fecharModal}
                  disabled={carregando}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarUsuario}
                  disabled={carregando}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Confirmar Remoção
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Tem certeza que deseja remover o usuário <strong>{confirmacaoRemocao.nome}</strong>?
                  Esta ação não pode ser desfeita.
                </p>
              </div>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setConfirmacaoRemocao(null)}
                  disabled={carregando}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={executarRemocao}
                  disabled={carregando}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
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