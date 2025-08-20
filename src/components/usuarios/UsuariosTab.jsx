import React, { useState } from 'react';
import { useAuth } from '../AlmoxarifadoJardim';
import { NIVEIS_PERMISSAO, NIVEIS_LABELS, PermissionChecker } from '../AlmoxarifadoJardim';
import { useTheme } from '../AlmoxarifadoJardim';
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

  const { classes } = useTheme();

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
      <div className={`${classes.card} p-6 text-center`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className={classes.textSecondary}>Carregando dados do usuário...</p>
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
    if (
      usuarioLogado.nivel === NIVEIS_PERMISSAO.ADMIN ||
      usuarioLogado.nivel === NIVEIS_PERMISSAO.GERENTE ||
      usuarioLogado.nivel === NIVEIS_PERMISSAO.SUPERVISOR
    ) {
      return true; // Todos com permissão de gestão veem todos
    }
    // Funcionário só vê a si mesmo
    return usuario.id === usuarioLogado.id;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${classes.sectionHeader}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <UserCog className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${classes.textPrimary}`}>Gerenciamento de Usuários</h2>
              <p className={classes.textSecondary}>Gerencie os usuários do sistema de acordo com suas permissões</p>
            </div>
          </div>
          
          {niveisDisponiveis.length > 0 && (
            <button
              onClick={abrirModalCriar}
              className={`flex items-center gap-2 ${classes.buttonPrimary} px-4 py-2 rounded-lg transition-colors`}
              style={{ backgroundColor: '#bd9967' }}
            >
              <Plus className="w-4 h-4" />
              Novo Usuário
            </button>
          )}
        </div>

        {/* Mensagens */}
        {erro && (
          <div className={`mt-4 ${classes.alertError} px-4 py-3 rounded-lg`}>
            {erro}
          </div>
        )}
        
        {sucesso && (
          <div className={`mt-4 ${classes.alertSuccess} px-4 py-3 rounded-lg`}>
            {sucesso}
          </div>
        )}
      </div>

      {/* Lista de Usuários */}
      <div className={`${classes.table} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={classes.tableHeader}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium ${classes.tableHeaderCell} uppercase tracking-wider`}>
                  Usuário
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${classes.tableHeaderCell} uppercase tracking-wider`}>
                  Nível de Acesso
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${classes.tableHeaderCell} uppercase tracking-wider`}>
                  Status
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${classes.tableHeaderCell} uppercase tracking-wider`}>
                  Último Login
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${classes.tableHeaderCell} uppercase tracking-wider`}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className={`${classes.backgroundPrimary} divide-y ${classes.divider}`}>
              {usuariosVisiveis.map((usuario) => (
                <tr key={usuario.id} className={classes.tableRow}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className={`text-sm font-medium ${classes.textPrimary}`}>
                          {usuario.nome}
                          {usuario.id === usuarioLogado.id && (
                            <span className="ml-2 text-xs text-purple-600 dark:text-purple-400 font-medium">(Você)</span>
                          )}
                        </div>
                        <div className={`text-sm ${classes.textSecondary}`}>{usuario.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 text-gray-400 mr-2" />
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        usuario.nivel === NIVEIS_PERMISSAO.ADMIN ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                        usuario.nivel === NIVEIS_PERMISSAO.GERENTE ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' :
                        usuario.nivel === NIVEIS_PERMISSAO.SUPERVISOR ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}>
                        {NIVEIS_LABELS[usuario.nivel]}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      usuario.ativo ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    }`}>
                      {usuario.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${classes.textSecondary}`}>
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
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
                          title="Editar usuário"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {usuarioLogado.nivel === NIVEIS_PERMISSAO.ADMIN &&
                        usuario.email !== 'admin' && usuario.id !== usuarioLogado.id && (
                        <button
                          onClick={() => confirmarRemocao(usuario)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
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
        <div className={`fixed inset-0 ${classes.overlay} flex items-center justify-center z-50`}>
          <div className={`${classes.modal} max-w-md w-full mx-4 max-h-screen overflow-y-auto`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-medium ${classes.textPrimary}`}>
                  {usuarioEditando ? 'Editar Usuário' : 'Novo Usuário'}
                </h3>
                <button
                  onClick={fecharModal}
                  className={`text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={classes.formLabel}>
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className={`w-full px-3 py-2 ${classes.input} focus:ring-2 focus:border-transparent`}
                    style={{ '--tw-ring-color': '#bd9967' }}
                    placeholder="Digite o nome completo"
                    disabled={carregando}
                  />
                </div>

                <div>
                  <label className={classes.formLabel}>
                    Email/Usuário *
                  </label>
                  <input
                    type="text"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-2 ${classes.input} focus:ring-2 focus:border-transparent`}
                    style={{ '--tw-ring-color': '#bd9967' }}
                    placeholder="Digite o email ou nome de usuário"
                    disabled={carregando}
                  />
                </div>

                <div>
                  <label className={classes.formLabel}>
                    Senha {usuarioEditando ? '(deixe vazio para manter a atual)' : '*'}
                  </label>
                  <div className="relative">
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                      className={`w-full px-3 py-2 pr-10 ${classes.input} focus:ring-2 focus:border-transparent`}
                      style={{ '--tw-ring-color': '#bd9967' }}
                      placeholder={usuarioEditando ? "Nova senha" : "Digite a senha"}
                      disabled={carregando}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className={`absolute right-3 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300`}
                      disabled={carregando}
                    >
                      {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={classes.formLabel}>
                    Nível de Acesso *
                  </label>
                  <select
                    value={formData.nivel}
                    onChange={(e) => setFormData({ ...formData, nivel: parseInt(e.target.value) })}
                    className={`w-full px-3 py-2 ${classes.formSelect} focus:ring-2 focus:border-transparent`}
                    style={{ '--tw-ring-color': '#bd9967' }}
                    disabled={carregando}
                  >
                    {niveisDisponiveis.map(nivel => (
                      <option key={nivel.valor} value={nivel.valor}>
                        {nivel.label}
                      </option>
                    ))}
                  </select>
                  <p className={`text-xs ${classes.textMuted} mt-1`}>
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
                    className={`h-4 w-4 text-purple-600 dark:text-purple-400 focus:ring-purple-500 border-gray-300 dark:border-gray-600 rounded ${classes.input}`}
                    disabled={carregando}
                  />
                  <label htmlFor="ativo" className={`ml-2 text-sm ${classes.textSecondary}`}>
                    Usuário ativo
                  </label>
                </div>
              </div>

              {erro && (
                <div className={`mt-4 ${classes.alertError} px-3 py-2 rounded-lg text-sm`}>
                  {erro}
                </div>
              )}

              {sucesso && (
                <div className={`mt-4 ${classes.alertSuccess} px-3 py-2 rounded-lg text-sm`}>
                  {sucesso}
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={fecharModal}
                  disabled={carregando}
                  className={`px-4 py-2 ${classes.buttonSecondary} disabled:opacity-50`}
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarUsuario}
                  disabled={carregando}
                  className={`px-4 py-2 ${classes.buttonPrimary} disabled:opacity-50`}
                  style={{ backgroundColor: '#bd9967' }}
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
        <div className={`fixed inset-0 ${classes.overlay} flex items-center justify-center z-50`}>
          <div className={`${classes.modal} max-w-md w-full mx-4`}>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="text-center">
                <h3 className={`text-lg font-medium ${classes.textPrimary} mb-2`}>
                  Confirmar Remoção
                </h3>
                <p className={`text-sm ${classes.textSecondary} mb-4`}>
                  Tem certeza que deseja remover o usuário <strong>{confirmacaoRemocao.nome}</strong>?
                  Esta ação não pode ser desfeita.
                </p>
              </div>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setConfirmacaoRemocao(null)}
                  disabled={carregando}
                  className={`px-4 py-2 ${classes.buttonSecondary} disabled:opacity-50`}
                >
                  Cancelar
                </button>
                <button
                  onClick={executarRemocao}
                  disabled={carregando}
                  className={`px-4 py-2 ${classes.buttonDanger} disabled:opacity-50`}
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