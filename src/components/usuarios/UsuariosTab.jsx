import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { NIVEIS_PERMISSAO, NIVEIS_LABELS, PermissionChecker, isAdmin } from '../../constants/permissoes';
import { twitterThemeConfig } from '../../styles/twitterThemeConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import NivelPermissaoSelector from './NivelPermissaoSelector';
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
  User,
  Building2,
  Briefcase,
  Search,
  Mail,
  Lock,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Award,
  Target,
  Zap,
  TrendingUp,
  Phone
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
  const [senhasVisiveis, setSenhasVisiveis] = useState({}); // Estado para controlar visibilidade de cada senha
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [confirmacaoRemocao, setConfirmacaoRemocao] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [empresas, setEmpresas] = useState([]);
  const [setores, setSetores] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [usuariosStats, setUsuariosStats] = useState({});
  
  // Estados para seleção múltipla e ações em lote
  const [usuariosSelecionados, setUsuariosSelecionados] = useState([]);
  const [modoSelecao, setModoSelecao] = useState(false);
  const [mostrarModalAcaoLote, setMostrarModalAcaoLote] = useState(false);
  const [acaoLoteSelecionada, setAcaoLoteSelecionada] = useState(null);
  const [formAcaoLote, setFormAcaoLote] = useState({
    empresaId: '',
    setorId: '',
    nivelPermissao: '',
    modoExclusao: 'selecionados' // 'selecionados' ou 'porNivel'
  });
  const [formData, setFormData] = useState({
    nome: '',
    usuario: '',
    senha: '',
    nivel: NIVEIS_PERMISSAO.FUNCIONARIO,
    ativo: true,
    empresaId: '',
    setorId: '',
    cargo: '',
    semEmpresaSetor: false
  });

  // Carregar empresas, setores, funcionários e estatísticas
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [empresasSnapshot, setoresSnapshot, funcionariosSnapshot] = await Promise.all([
          getDocs(collection(db, 'empresas')),
          getDocs(collection(db, 'setores')),
          getDocs(collection(db, 'funcionarios'))
        ]);

        setEmpresas(empresasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setSetores(setoresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setFuncionarios(funcionariosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    carregarDados();
  }, []);

  // Carregar estatísticas de avaliações para cada usuário
  useEffect(() => {
    const carregarEstatisticas = async () => {
      if (!usuarios.length || !funcionarios.length) return;

      const stats = {};

      for (const usuario of usuarios) {
        // Buscar funcionário correspondente pelo usuario ou nome
        const funcionario = funcionarios.find(
          f => f.usuario?.toLowerCase() === usuario.usuario?.toLowerCase() || 
               f.nome?.toLowerCase() === usuario.nome?.toLowerCase()
        );

        if (funcionario) {
          try {
            // Buscar avaliações do funcionário
            const avaliacoesQuery = query(
              collection(db, 'avaliacoes'),
              where('funcionarioId', '==', funcionario.id)
            );
            const avaliacoesSnapshot = await getDocs(avaliacoesQuery);
            
            const avaliacoes = avaliacoesSnapshot.docs.map(doc => ({
              ...doc.data(),
              nota: Number(doc.data().estrelas || doc.data().nota || 0)
            }));

            const mediaAvaliacao = avaliacoes.length > 0
              ? avaliacoes.reduce((sum, av) => sum + av.nota, 0) / avaliacoes.length
              : 0;

            stats[usuario.id] = {
              funcionarioId: funcionario.id,
              photoURL: funcionario.photoURL,
              telefone: funcionario.telefone,
              cargo: funcionario.cargo,
              avaliacoes: avaliacoes,
              totalAvaliacoes: avaliacoes.length,
              mediaAvaliacao: mediaAvaliacao
            };
          } catch (error) {
            console.error(`Erro ao carregar estatísticas do usuário ${usuario.usuario}:`, error);
          }
        }
      }

      setUsuariosStats(stats);
    };

    carregarEstatisticas();
  }, [usuarios, funcionarios]);

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

  // Definir níveis disponíveis baseado nas permissões do usuário logado
  const getNiveisDisponiveis = () => {
    const niveis = [];
    
    // Apenas administradores (nível 0) podem criar/editar outros usuários
    if (usuarioLogado?.nivel === NIVEIS_PERMISSAO.ADMIN) {
      // Admin pode criar todos os tipos
      Object.entries(NIVEIS_PERMISSAO).forEach(([key, value]) => {
        niveis.push({
          valor: value,
          label: NIVEIS_LABELS[value],
          key: key
        });
      });
    }
    
    // Ordenar por valor (0, 1, 2, 3, 4, 5, 6)
    return niveis.sort((a, b) => a.valor - b.valor);
  };

  const niveisDisponiveis = getNiveisDisponiveis();

  // Resetar formulário
  const resetarForm = () => {
    setFormData({
      nome: '',
      usuario: '',
      senha: '',
      nivel: NIVEIS_PERMISSAO.FUNCIONARIO,
      ativo: true,
      empresaId: '',
      setorId: '',
      cargo: '',
      semEmpresaSetor: false
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
      usuario: usuario.usuario,
      senha: '', // Não mostrar senha por segurança
      nivel: usuario.nivel,
      ativo: usuario.ativo,
      empresaId: usuario.empresaId || '',
      setorId: usuario.setorId || '',
      cargo: usuario.cargo || '',
      semEmpresaSetor: !usuario.empresaId && !usuario.setorId
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
    if (!formData.usuario.trim()) {
      return 'Usuário é obrigatório';
    }
    if (!usuarioEditando && !formData.senha) {
      return 'Senha é obrigatória';
    }
    if (formData.senha && formData.senha.length < 4) {
      return 'Senha deve ter pelo menos 4 caracteres';
    }
    
    // Verificar se usuario já existe (exceto o próprio usuário sendo editado)
    const usuarioExiste = usuarios.find(u => 
      u.usuario === formData.usuario && (!usuarioEditando || u.id !== usuarioEditando.id)
    );
    if (usuarioExiste) {
      return 'Este nome de usuário já está em uso';
    }

    // Validar empresa e setor para níveis que não são ADMIN
    // Se não marcou "sem empresa/setor", deve preencher os campos
    if (formData.nivel !== NIVEIS_PERMISSAO.ADMIN && !formData.semEmpresaSetor) {
      if (!formData.empresaId) {
        return 'Selecione uma empresa ou marque "Registrar sem empresa/setor"';
      }
      if (!formData.setorId) {
        return 'Selecione um setor ou marque "Registrar sem empresa/setor"';
      }
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

    // 🛡️ VALIDAÇÃO: Verificar se login/nome são permitidos
    try {
      const { validarDadosUsuario } = await import('../../utils/validacaoUsuarios');
      const validacao = validarDadosUsuario({
        usuario: formData.usuario,
        nome: formData.nome
      });

      if (!validacao.valido) {
        setErro(validacao.erros.join('\n'));
        setCarregando(false);
        return;
      }
    } catch (error) {
      console.error('Erro ao validar usuário:', error);
    }

    try {
      const dadosParaSalvar = {
        nome: formData.nome.trim(),
        usuario: formData.usuario.trim(),
        nivel: formData.nivel,
        ativo: formData.ativo
      };

      // Incluir empresa, setor e cargo se não marcou "sem empresa/setor"
      if (!formData.semEmpresaSetor && formData.nivel !== NIVEIS_PERMISSAO.ADMIN) {
        dadosParaSalvar.empresaId = formData.empresaId;
        dadosParaSalvar.setorId = formData.setorId;
        
        // Buscar nomes de empresa e setor para exibição
        const empresa = empresas.find(e => e.id === formData.empresaId);
        const setor = setores.find(s => s.id === formData.setorId);
        
        if (empresa) dadosParaSalvar.empresaNome = empresa.nome;
        if (setor) dadosParaSalvar.setorNome = setor.nome;
      }

      // Incluir cargo se fornecido
      if (formData.cargo?.trim()) {
        dadosParaSalvar.cargo = formData.cargo.trim();
      }

      // Incluir senha apenas se foi fornecida
      // O Workflow.jsx cuidará de criptografar e definir o authKey automaticamente
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

  // ============ FUNÇÕES DE SELEÇÃO MÚLTIPLA ============

  // Alternar modo de seleção
  const toggleModoSelecao = () => {
    setModoSelecao(!modoSelecao);
    setUsuariosSelecionados([]);
  };

  // Selecionar/desselecionar um usuário
  const toggleSelecaoUsuario = (usuarioId) => {
    setUsuariosSelecionados(prev => {
      if (prev.includes(usuarioId)) {
        return prev.filter(id => id !== usuarioId);
      } else {
        return [...prev, usuarioId];
      }
    });
  };

  // Selecionar todos os usuários visíveis
  const selecionarTodos = () => {
    const todosIds = usuariosVisiveis.map(u => u.id);
    setUsuariosSelecionados(todosIds);
  };

  // Desselecionar todos
  const desselecionarTodos = () => {
    setUsuariosSelecionados([]);
  };

  // Abrir modal de ação em lote
  const abrirModalAcaoLote = (acao) => {
    if (acao !== 'excluir' && usuariosSelecionados.length === 0) {
      setErro('Selecione pelo menos um usuário');
      setTimeout(() => setErro(''), 3000);
      return;
    }
    setAcaoLoteSelecionada(acao);
    setFormAcaoLote({ 
      empresaId: '', 
      setorId: '', 
      nivelPermissao: '',
      modoExclusao: acao === 'excluir' && usuariosSelecionados.length === 0 ? 'porNivel' : 'selecionados'
    });
    setMostrarModalAcaoLote(true);
  };

  // Executar ação em lote
  const executarAcaoLote = async () => {
    setCarregando(true);
    setErro('');
    setSucesso('');

    try {
      let sucessos = 0;
      let erros = 0;
      let usuariosParaProcessar = [];

      // Determinar quais usuários processar
      if (acaoLoteSelecionada === 'excluir' && formAcaoLote.modoExclusao === 'porNivel') {
        // Excluir por nível de permissão
        if (!formAcaoLote.nivelPermissao && formAcaoLote.nivelPermissao !== 0) {
          setErro('Selecione um nível de permissão');
          setCarregando(false);
          return;
        }
        
        usuariosParaProcessar = usuarios.filter(u => u.nivel === parseInt(formAcaoLote.nivelPermissao));
        
        if (usuariosParaProcessar.length === 0) {
          setErro('Nenhum usuário encontrado com esse nível de permissão');
          setCarregando(false);
          return;
        }
      } else {
        // Usar usuários selecionados
        usuariosParaProcessar = usuariosSelecionados.map(id => usuarios.find(u => u.id === id)).filter(Boolean);
      }

      for (const usuario of usuariosParaProcessar) {
        const usuarioId = usuario.id;

        try {
          if (acaoLoteSelecionada === 'transferir') {
            // Transferir para empresa/setor
            if (!formAcaoLote.empresaId || !formAcaoLote.setorId) {
              erros++;
              continue;
            }
            await atualizarUsuario(usuarioId, {
              empresaId: formAcaoLote.empresaId,
              setorId: formAcaoLote.setorId
            });
            sucessos++;
          } else if (acaoLoteSelecionada === 'incluir') {
            // Incluir em empresa/setor (sem remover o atual)
            if (!formAcaoLote.empresaId || !formAcaoLote.setorId) {
              erros++;
              continue;
            }
            await atualizarUsuario(usuarioId, {
              empresaId: formAcaoLote.empresaId,
              setorId: formAcaoLote.setorId
            });
            sucessos++;
          } else if (acaoLoteSelecionada === 'excluir') {
            // Excluir usuário
            if (!PermissionChecker.canEditUser(usuarioLogado.nivel, usuarioLogado.id, usuarioId, usuario.nivel)) {
              erros++;
              continue;
            }
            const resultado = await removerUsuario(usuarioId);
            if (resultado.success) {
              sucessos++;
            } else {
              erros++;
            }
          }
        } catch (error) {
          console.error(`Erro ao processar usuário ${usuarioId}:`, error);
          erros++;
        }
      }

      if (sucessos > 0) {
        setSucesso(`${sucessos} usuário(s) processado(s) com sucesso!`);
      }
      if (erros > 0) {
        setErro(`${erros} usuário(s) não puderam ser processados`);
      }

      // Limpar seleção e fechar modal
      setUsuariosSelecionados([]);
      setModoSelecao(false);
      setMostrarModalAcaoLote(false);
      setAcaoLoteSelecionada(null);

      setTimeout(() => {
        setSucesso('');
        setErro('');
      }, 5000);
    } catch (error) {
      setErro('Erro ao executar ação em lote: ' + error.message);
    } finally {
      setCarregando(false);
    }
  };

  // Filtrar usuários visíveis e ordenar alfabeticamente
  const usuariosVisiveis = usuarios
    .filter(usuario => {
      // Primeiro aplicar filtro de permissões
      const temPermissao = usuarioLogado.nivel === NIVEIS_PERMISSAO.ADMIN ? true :
        usuarioLogado.nivel <= NIVEIS_PERMISSAO.GERENTE_SETOR ? 
          (usuario.nivel > NIVEIS_PERMISSAO.GERENTE_SETOR || usuario.id === usuarioLogado.id) :
          usuario.id === usuarioLogado.id;

      // Depois aplicar filtro de busca
      const termoBusca = searchTerm.toLowerCase();
      const matchBusca = !searchTerm || 
        usuario.nome.toLowerCase().includes(termoBusca) ||
        usuario.usuario.toLowerCase().includes(termoBusca) ||
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
                <h2 className={`text-xl font-bold ${colors.text}`}>
                  <span className="hidden sm:inline">Gerenciamento de Usuários</span>
                  <span className="sm:hidden">Usuários</span>
                </h2>
                <p className={`text-sm ${colors.textSecondary} hidden sm:block`}>Usuários com acesso ao sistema - Segurança SHA-512</p>
                <p className={`text-xs ${colors.textSecondary} sm:hidden`}>Acesso ao sistema</p>
              </div>
            </div>
            
            {niveisDisponiveis.length > 0 && (
              <button
                onClick={abrirModalCriar}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-[#1D9BF0] dark:to-[#1A8CD8] dark:hover:from-[#1A8CD8] dark:hover:to-[#1D9BF0] text-white px-6 py-2.5 rounded-full transition-all shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium hidden sm:inline">Novo Usuário</span>
                <span className="font-medium sm:hidden">Novo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Barra de Seleção Múltipla e Ações em Lote */}
      <div className={`bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 ${
        modoSelecao ? 'border-purple-400 dark:border-purple-500' : 'border-gray-200 dark:border-gray-700'
      } rounded-xl shadow-lg p-6 transition-all duration-300`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Toggle Modo Seleção */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleModoSelecao}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                modoSelecao
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              {modoSelecao ? 'Modo Seleção Ativo' : 'Ativar Seleção Múltipla'}
            </button>

            {modoSelecao && (
              <>
                <button
                  onClick={selecionarTodos}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all"
                >
                  <Check className="w-4 h-4" />
                  Selecionar Todos
                </button>
                <button
                  onClick={desselecionarTodos}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-all"
                >
                  <X className="w-4 h-4" />
                  Limpar
                </button>
              </>
            )}
          </div>

          {/* Contador e Ações */}
          {modoSelecao && usuariosSelecionados.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-4 py-2 bg-purple-500 text-white rounded-full font-bold shadow-md">
                {usuariosSelecionados.length} selecionado(s)
              </span>
              
              <button
                onClick={() => abrirModalAcaoLote('transferir')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all shadow-md"
              >
                <Building2 className="w-4 h-4" />
                Transferir Empresa/Setor
              </button>

              <button
                onClick={() => abrirModalAcaoLote('incluir')}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                Incluir em Empresa/Setor
              </button>

              <button
                onClick={() => abrirModalAcaoLote('excluir')}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all shadow-md"
              >
                <Trash2 className="w-4 h-4" />
                Excluir Selecionados
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Barra de Busca */}
      <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-6`}>
        <div className="space-y-4">
          {/* Campo de busca aprimorado */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-[#1D9BF0] dark:to-purple-500 rounded-xl flex items-center justify-center shadow-md">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Buscar por nome, usuário, empresa, setor ou função..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] focus:border-transparent transition-all shadow-sm`}
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
          <div className="rounded-xl shadow-sm mt-4 p-4 border border-red-500 border-opacity-20 bg-red-500 bg-opacity-10 text-red-500 dark:border-[#F4212E] dark:bg-[#F4212E]/10 dark:text-[#F4212E]">
            {erro}
          </div>
        )}
        
        {sucesso && (
          <div className="rounded-xl shadow-sm mt-4 p-4 border border-green-500 border-opacity-20 bg-green-500 bg-opacity-10 text-green-500 dark:border-[#00BA7C] dark:bg-[#00BA7C]/10 dark:text-[#00BA7C]">
            {sucesso}
          </div>
        )}
      </div>

      {/* Grid de Cards de Usuários */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {usuariosVisiveis.length === 0 ? (
          <div className="col-span-full">
            <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-12`}>
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="text-center">
                  <p className={`text-lg font-medium ${colors.text}`}>Nenhum usuário encontrado</p>
                  <p className={`text-sm ${colors.textSecondary} mt-1`}>
                    {searchTerm ? 'Tente ajustar os termos de busca' : 'Adicione usuários para começar'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          usuariosVisiveis.map((usuario) => {
            const stats = usuariosStats[usuario.id] || {};
            const mediaAvaliacao = Number(stats.mediaAvaliacao) || 0;
            const totalAvaliacoes = stats.totalAvaliacoes || 0;

            return (
              <div
                key={usuario.id}
                className={`group relative overflow-hidden bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl border transition-all duration-500 hover:shadow-2xl ${
                  usuariosSelecionados.includes(usuario.id)
                    ? 'border-purple-500 dark:border-purple-400 shadow-lg shadow-purple-500/30'
                    : 'border-white/20 dark:border-gray-700/50 hover:border-blue-400/50 dark:hover:border-blue-500/50 hover:shadow-blue-500/25 dark:hover:shadow-blue-500/10'
                }`}
              >
                {/* Checkbox de seleção - canto superior direito */}
                {modoSelecao && (
                  <div className="absolute top-4 right-4 z-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelecaoUsuario(usuario.id);
                      }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-lg ${
                        usuariosSelecionados.includes(usuario.id)
                          ? 'bg-purple-500 text-white scale-110'
                          : 'bg-white dark:bg-gray-700 text-gray-400 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                      }`}
                    >
                      {usuariosSelecionados.includes(usuario.id) ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-current rounded" />
                      )}
                    </button>
                  </div>
                )}

                {/* Background decorativo */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white/50 to-purple-50/50 dark:from-blue-900/10 dark:via-gray-800/50 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Barra lateral com gradiente */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${
                  !usuario.ativo 
                    ? 'bg-gradient-to-b from-red-400 to-red-600' 
                    : usuario.nivel === NIVEIS_PERMISSAO.ADMIN
                    ? 'bg-gradient-to-b from-red-500 to-red-700'
                    : 'bg-gradient-to-b from-blue-400 via-purple-500 to-blue-600'
                } shadow-lg`}>
                  <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-l-2xl" />
                </div>

                <div className="relative pl-6 pr-5 py-6">
                  {/* Header Section */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Avatar com foto do funcionário */}
                      <div className="relative flex-shrink-0">
                        <div className={`h-16 w-16 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg overflow-hidden ${
                          usuario.nivel === NIVEIS_PERMISSAO.ADMIN ? 'bg-gradient-to-br from-red-500 to-red-700' :
                          usuario.nivel === NIVEIS_PERMISSAO.GERENTE_GERAL ? 'bg-gradient-to-br from-blue-500 to-blue-700' :
                          usuario.nivel === NIVEIS_PERMISSAO.GERENTE_SETOR ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                          usuario.nivel === NIVEIS_PERMISSAO.SUPERVISOR ? 'bg-gradient-to-br from-green-500 to-green-700' :
                          'bg-gradient-to-br from-yellow-500 to-yellow-700'
                        }`}>
                          {stats.photoURL ? (
                            <img 
                              src={stats.photoURL} 
                              alt={usuario.nome}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl">{usuario.nome.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        
                        {/* Badge de segurança SHA-512 */}
                        {usuario.senhaVersion === 2 && (
                          <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 shadow-lg">
                            <Shield className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Info do Usuário */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className={`text-lg font-bold ${colors.text} truncate`}>
                            {usuario.nome}
                          </h3>
                          {usuario.id === usuarioLogado.id && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                              Você
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <p className={`text-sm ${colors.textSecondary} truncate`}>{usuario.usuario}</p>
                        </div>

                        {/* Senha do Usuário */}
                        {usuario.senha && (
                          <div className="space-y-2 mb-2">
                            <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/30 rounded-lg p-2">
                              <Lock className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-500" />
                              <div className="flex-1 flex items-center gap-2">
                                <p className={`text-sm font-mono ${colors.text}`}>
                                  {senhasVisiveis[usuario.id] ? usuario.senha : '••••••••'}
                                </p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSenhasVisiveis(prev => ({
                                      ...prev,
                                      [usuario.id]: !prev[usuario.id]
                                    }));
                                  }}
                                  className="p-1 hover:bg-yellow-100 dark:hover:bg-yellow-800/30 rounded transition-colors"
                                  title={senhasVisiveis[usuario.id] ? 'Ocultar senha' : 'Mostrar senha'}
                                >
                                  {senhasVisiveis[usuario.id] ? (
                                    <EyeOff className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-500" />
                                  ) : (
                                    <Eye className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-500" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Badge de Nível */}
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full shadow-sm ${
                          usuario.nivel === NIVEIS_PERMISSAO.ADMIN ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' :
                          usuario.nivel === NIVEIS_PERMISSAO.GERENTE_GERAL ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' :
                          usuario.nivel === NIVEIS_PERMISSAO.GERENTE_SETOR ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white' :
                          usuario.nivel === NIVEIS_PERMISSAO.SUPERVISOR ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' :
                          'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white'
                        }`}>
                          <Shield className="w-3 h-3" />
                          {NIVEIS_LABELS[usuario.nivel]}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full shadow-sm ${
                      usuario.ativo 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                        : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                    }`}>
                      {usuario.ativo ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          Inativo
                        </>
                      )}
                    </span>
                  </div>

                  {/* Informações Complementares */}
                  <div className="space-y-3 mb-4">
                    {/* Empresa e Setor */}
                    {(usuario.empresaNome || usuario.setorNome) && (
                      <div className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${colors.text} truncate`}>
                            {usuario.empresaNome || <span className="text-gray-400 italic">Sem empresa</span>}
                          </p>
                          {usuario.setorNome && (
                            <p className={`text-xs ${colors.textSecondary} truncate`}>
                              {usuario.setorNome}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Cargo do Funcionário */}
                    {(stats.cargo || usuario.cargo) && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                        <p className={`text-sm ${colors.text}`}>
                          {stats.cargo || usuario.cargo}
                        </p>
                      </div>
                    )}

                    {/* Telefone */}
                    {stats.telefone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-green-500 dark:text-green-400" />
                        <p className={`text-sm ${colors.text}`}>
                          {stats.telefone}
                        </p>
                      </div>
                    )}

                    {/* Avaliações */}
                    {totalAvaliacoes > 0 && (
                      <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200/50 dark:border-yellow-700/30">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-bold ${colors.text}`}>
                              {mediaAvaliacao.toFixed(1)}
                            </span>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3.5 h-3.5 ${
                                    star <= Math.round(mediaAvaliacao)
                                      ? 'text-yellow-500 fill-yellow-500'
                                      : 'text-gray-300 dark:text-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className={`text-xs ${colors.textSecondary}`}>
                            {totalAvaliacoes} avaliação{totalAvaliacoes !== 1 ? 'ões' : ''}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Último Login */}
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className={colors.textSecondary}>
                        {usuario.ultimoLogin ? (
                          <>
                            Último acesso: {new Date(usuario.ultimoLogin).toLocaleDateString('pt-BR')}
                          </>
                        ) : (
                          <span className="italic">Nunca acessou</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    {PermissionChecker.canEditUser(usuarioLogado.nivel, usuarioLogado.id, usuario.id, usuario.nivel) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirModalEditar(usuario);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm text-sm font-medium"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </button>
                    )}
                    {usuarioLogado.nivel === NIVEIS_PERMISSAO.ADMIN &&
                      usuario.usuario !== 'admin' && usuario.id !== usuarioLogado.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmarRemocao(usuario);
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg transition-all shadow-sm text-sm font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>


      {/* Modal de Usuário */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 pb-20 md:pb-4">
          <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-w-md w-full flex flex-col max-h-[75vh] md:max-h-[85vh]`}>
            {/* Header fixo */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h3 className={`text-lg md:text-xl font-bold ${colors.text}`}>
                {usuarioEditando ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
              <button
                onClick={fecharModal}
                className="p-2 hover:bg-[#1D9BF0] hover:bg-opacity-10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 md:w-6 md:h-6 text-[#1D9BF0]" />
              </button>
            </div>

            {/* Conteúdo scrollável */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="space-y-3 md:space-y-4">
                <div>
                  <label className={`flex items-center gap-2 text-sm font-medium ${colors.text} mb-2`}>
                    <User className="w-4 h-4" />
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className={`w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#1D9BF0] focus:border-transparent`}
                    placeholder="Digite o nome completo"
                    disabled={carregando}
                  />
                </div>

                <div>
                  <label className={`flex items-center gap-2 text-sm font-medium ${colors.text} mb-2`}>
                    <User className="w-4 h-4" />
                    Usuário *
                  </label>
                  <input
                    type="text"
                    value={formData.usuario}
                    onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                    className={`w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#1D9BF0] focus:border-transparent`}
                    placeholder="Digite o nome de usuário"
                    disabled={carregando}
                  />
                </div>

                <div>
                  <label className={`flex items-center gap-2 text-sm font-medium ${colors.text} mb-2`}>
                    <Lock className="w-4 h-4" />
                    Senha {usuarioEditando ? '(deixe vazio para manter a atual)' : '*'}
                  </label>
                  <div className="relative">
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                      className={`w-full px-4 py-2 pr-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#1D9BF0] focus:border-transparent`}
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
                  <NivelPermissaoSelector
                    nivel={formData.nivel}
                    onChange={(nivel) => setFormData({ ...formData, nivel })}
                    disabled={carregando}
                    usuarioLogadoNivel={usuarioLogado?.nivel}
                  />
                </div>

                {/* Checkbox para registrar sem empresa/setor */}
                {formData.nivel !== NIVEIS_PERMISSAO.ADMIN && (
                  <div className="flex items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                    <input
                      type="checkbox"
                      id="semEmpresaSetor"
                      checked={formData.semEmpresaSetor}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData({ 
                          ...formData, 
                          semEmpresaSetor: checked,
                          empresaId: checked ? '' : formData.empresaId,
                          setorId: checked ? '' : formData.setorId
                        });
                      }}
                      className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-yellow-400 rounded"
                      disabled={carregando}
                    />
                    <label htmlFor="semEmpresaSetor" className={`ml-2 text-sm ${colors.text}`}>
                      Registrar sem empresa/setor (não recomendado)
                    </label>
                  </div>
                )}

                {/* Campos de Empresa e Setor */}
                {formData.nivel !== NIVEIS_PERMISSAO.ADMIN && !formData.semEmpresaSetor && (
                  <>
                    <div>
                      <label className={`flex items-center gap-2 text-sm font-medium ${colors.text} mb-2`}>
                        <Building2 className="w-4 h-4" />
                        Empresa *
                      </label>
                      <select
                        value={formData.empresaId}
                        onChange={(e) => setFormData({ ...formData, empresaId: e.target.value, setorId: '' })}
                        className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#1D9BF0] focus:border-transparent`}
                        disabled={carregando}
                      >
                        <option value="">Selecione uma empresa</option>
                        {empresas.map(empresa => (
                          <option key={empresa.id} value={empresa.id}>
                            {empresa.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={`flex items-center gap-2 text-sm font-medium ${colors.text} mb-2`}>
                        <Briefcase className="w-4 h-4" />
                        Setor *
                      </label>
                      <select
                        value={formData.setorId}
                        onChange={(e) => setFormData({ ...formData, setorId: e.target.value })}
                        className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#1D9BF0] focus:border-transparent`}
                        disabled={carregando || !formData.empresaId}
                      >
                        <option value="">Selecione um setor</option>
                        {setores
                          .filter(setor => !formData.empresaId || setor.empresaId === formData.empresaId)
                          .map(setor => (
                            <option key={setor.id} value={setor.id}>
                              {setor.nome}
                            </option>
                          ))}
                      </select>
                      {!formData.empresaId && (
                        <p className={`text-xs ${colors.textSecondary} mt-1`}>
                          Selecione uma empresa primeiro
                        </p>
                      )}
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${colors.text} mb-2`}>
                        Cargo/Função
                      </label>
                      <input
                        type="text"
                        value={formData.cargo}
                        onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                        className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#1D9BF0] focus:border-transparent`}
                        placeholder="Ex: Analista, Supervisor, etc."
                        disabled={carregando}
                      />
                    </div>
                  </>
                )}

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

                {erro && (
                  <div className="mt-4 p-3 md:p-4 rounded-lg border border-[#F4212E] border-opacity-20 bg-[#F4212E] bg-opacity-10 text-[#F4212E] text-sm">
                    {erro}
                  </div>
                )}

                {sucesso && (
                  <div className="mt-4 p-3 md:p-4 rounded-lg border border-[#00BA7C] border-opacity-20 bg-[#00BA7C] bg-opacity-10 text-[#00BA7C] text-sm">
                    {sucesso}
                  </div>
                )}
              </div>
            </div>

            {/* Footer fixo */}
            <div className="flex justify-end gap-3 p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
              <button
                onClick={fecharModal}
                disabled={carregando}
                className={`px-4 md:px-6 py-2 md:py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 ${colors.text} rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-all disabled:opacity-50 font-medium text-sm md:text-base`}
              >
                Cancelar
              </button>
              <button
                onClick={salvarUsuario}
                disabled={carregando}
                className="px-4 md:px-6 py-2 md:py-2.5 bg-[#1D9BF0] text-white rounded-full hover:bg-[#1A8CD8] transition-all disabled:opacity-50 font-medium text-sm md:text-base shadow-lg"
              >
                {carregando ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Salvando...</span>
                  </div>
                ) : (
                  usuarioEditando ? 'Atualizar' : 'Criar'
                )}
              </button>
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

      {/* Modal de Ação em Lote */}
      {mostrarModalAcaoLote && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    {acaoLoteSelecionada === 'transferir' && (
                      <>
                        <Building2 className="w-6 h-6" />
                        Transferir Usuários
                      </>
                    )}
                    {acaoLoteSelecionada === 'incluir' && (
                      <>
                        <Plus className="w-6 h-6" />
                        Incluir em Empresa/Setor
                      </>
                    )}
                    {acaoLoteSelecionada === 'excluir' && (
                      <>
                        <Trash2 className="w-6 h-6" />
                        Excluir Usuários
                      </>
                    )}
                  </h3>
                  <p className="text-purple-100 mt-1">
                    {usuariosSelecionados.length} usuário(s) selecionado(s)
                  </p>
                </div>
                <button
                  onClick={() => setMostrarModalAcaoLote(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-full transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {acaoLoteSelecionada === 'excluir' ? (
                <div className="space-y-4">
                  <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-bold text-red-800 dark:text-red-300 mb-2">
                          ⚠️ ATENÇÃO: Esta ação é irreversível!
                        </h4>
                        <p className="text-sm text-red-700 dark:text-red-400">
                          {formAcaoLote.modoExclusao === 'porNivel' ? (
                            <>Todos os usuários com o nível de permissão selecionado serão excluídos permanentemente.</>
                          ) : (
                            <>Você está prestes a excluir <strong>{usuariosSelecionados.length} usuário(s)</strong> do sistema. Todos os dados serão permanentemente removidos.</>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Seletor de Modo de Exclusão */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Shield className="w-4 h-4 inline mr-2" />
                      Modo de Exclusão
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setFormAcaoLote(prev => ({ ...prev, modoExclusao: 'selecionados' }))}
                        disabled={usuariosSelecionados.length === 0}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formAcaoLote.modoExclusao === 'selecionados'
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/30'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                        } ${usuariosSelecionados.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:border-red-400'}`}
                      >
                        <div className="text-center">
                          <User className={`w-6 h-6 mx-auto mb-2 ${formAcaoLote.modoExclusao === 'selecionados' ? 'text-red-600' : 'text-gray-600'}`} />
                          <p className={`font-semibold text-sm ${formAcaoLote.modoExclusao === 'selecionados' ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            Usuários Selecionados
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {usuariosSelecionados.length} selecionado(s)
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => setFormAcaoLote(prev => ({ ...prev, modoExclusao: 'porNivel' }))}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formAcaoLote.modoExclusao === 'porNivel'
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/30'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                        } hover:border-red-400`}
                      >
                        <div className="text-center">
                          <Shield className={`w-6 h-6 mx-auto mb-2 ${formAcaoLote.modoExclusao === 'porNivel' ? 'text-red-600' : 'text-gray-600'}`} />
                          <p className={`font-semibold text-sm ${formAcaoLote.modoExclusao === 'porNivel' ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            Por Nível de Permissão
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Excluir por cargo
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {formAcaoLote.modoExclusao === 'porNivel' ? (
                    <div className="space-y-4">
                      {/* Seletor de Nível de Permissão */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <Award className="w-4 h-4 inline mr-2" />
                          Selecione o Nível de Permissão *
                        </label>
                        <select
                          value={formAcaoLote.nivelPermissao}
                          onChange={(e) => setFormAcaoLote(prev => ({ ...prev, nivelPermissao: e.target.value }))}
                          className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">Selecione um nível</option>
                          {Object.entries(NIVEIS_LABELS).map(([nivel, label]) => {
                            const count = usuarios.filter(u => u.nivel === parseInt(nivel)).length;
                            return (
                              <option key={nivel} value={nivel}>
                                {label} ({count} usuário{count !== 1 ? 's' : ''})
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Preview de usuários que serão excluídos */}
                      {formAcaoLote.nivelPermissao !== '' && (
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 max-h-64 overflow-y-auto">
                          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Usuários que serão excluídos ({usuarios.filter(u => u.nivel === parseInt(formAcaoLote.nivelPermissao)).length}):
                          </h4>
                          <div className="space-y-2">
                            {usuarios
                              .filter(u => u.nivel === parseInt(formAcaoLote.nivelPermissao))
                              .slice(0, 10)
                              .map(usuario => (
                                <div key={usuario.id} className="flex items-center gap-3 bg-white dark:bg-gray-600 p-3 rounded-lg">
                                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-white font-bold">
                                    {usuario.nome.charAt(0)}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-800 dark:text-white">{usuario.nome}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{usuario.usuario}</p>
                                  </div>
                                  <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-full">
                                    {NIVEIS_LABELS[usuario.nivel]}
                                  </span>
                                </div>
                              ))}
                            {usuarios.filter(u => u.nivel === parseInt(formAcaoLote.nivelPermissao)).length > 10 && (
                              <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-2">
                                +{usuarios.filter(u => u.nivel === parseInt(formAcaoLote.nivelPermissao)).length - 10} mais...
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 max-h-64 overflow-y-auto">
                      <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Usuários que serão excluídos:
                      </h4>
                      <div className="space-y-2">
                        {usuariosSelecionados.map(id => {
                          const usuario = usuarios.find(u => u.id === id);
                          return usuario ? (
                            <div key={id} className="flex items-center gap-3 bg-white dark:bg-gray-600 p-3 rounded-lg">
                              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-white font-bold">
                                {usuario.nome.charAt(0)}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-800 dark:text-white">{usuario.nome}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{usuario.usuario}</p>
                              </div>
                              <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-full">
                                {NIVEIS_LABELS[usuario.nivel]}
                              </span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-xl p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      {acaoLoteSelecionada === 'transferir' 
                        ? 'Os usuários selecionados serão transferidos para a empresa/setor escolhido.'
                        : 'Os usuários selecionados serão incluídos na empresa/setor escolhido.'}
                    </p>
                  </div>

                  {/* Seletor de Empresa */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Building2 className="w-4 h-4 inline mr-2" />
                      Empresa *
                    </label>
                    <select
                      value={formAcaoLote.empresaId}
                      onChange={(e) => setFormAcaoLote(prev => ({ ...prev, empresaId: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Selecione uma empresa</option>
                      {empresas.map(empresa => (
                        <option key={empresa.id} value={empresa.id}>
                          {empresa.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Seletor de Setor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Briefcase className="w-4 h-4 inline mr-2" />
                      Setor *
                    </label>
                    <select
                      value={formAcaoLote.setorId}
                      onChange={(e) => setFormAcaoLote(prev => ({ ...prev, setorId: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      disabled={!formAcaoLote.empresaId}
                    >
                      <option value="">Selecione um setor</option>
                      {setores
                        .filter(setor => setor.empresaId === formAcaoLote.empresaId)
                        .map(setor => (
                          <option key={setor.id} value={setor.id}>
                            {setor.nome}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Lista de usuários */}
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 max-h-48 overflow-y-auto">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Usuários selecionados ({usuariosSelecionados.length}):
                    </h4>
                    <div className="space-y-2">
                      {usuariosSelecionados.slice(0, 5).map(id => {
                        const usuario = usuarios.find(u => u.id === id);
                        return usuario ? (
                          <div key={id} className="flex items-center gap-3 bg-white dark:bg-gray-600 p-2 rounded-lg">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {usuario.nome.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 dark:text-white text-sm truncate">{usuario.nome}</p>
                            </div>
                          </div>
                        ) : null;
                      })}
                      {usuariosSelecionados.length > 5 && (
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-2">
                          +{usuariosSelecionados.length - 5} mais...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <button
                onClick={() => setMostrarModalAcaoLote(false)}
                disabled={carregando}
                className="px-6 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-all disabled:opacity-50 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={executarAcaoLote}
                disabled={
                  carregando || 
                  (acaoLoteSelecionada === 'excluir' && formAcaoLote.modoExclusao === 'porNivel' && !formAcaoLote.nivelPermissao && formAcaoLote.nivelPermissao !== 0) ||
                  (acaoLoteSelecionada === 'excluir' && formAcaoLote.modoExclusao === 'selecionados' && usuariosSelecionados.length === 0) ||
                  (acaoLoteSelecionada !== 'excluir' && (!formAcaoLote.empresaId || !formAcaoLote.setorId))
                }
                className={`px-6 py-2.5 text-white rounded-full transition-all disabled:opacity-50 font-medium shadow-lg ${
                  acaoLoteSelecionada === 'excluir'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                    : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
                }`}
              >
                {carregando ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processando...</span>
                  </div>
                ) : (
                  <>
                    {acaoLoteSelecionada === 'transferir' && 'Transferir Usuários'}
                    {acaoLoteSelecionada === 'incluir' && 'Incluir Usuários'}
                    {acaoLoteSelecionada === 'excluir' && formAcaoLote.modoExclusao === 'porNivel' && `Excluir ${usuarios.filter(u => u.nivel === parseInt(formAcaoLote.nivelPermissao)).length || 0} Usuário(s)`}
                    {acaoLoteSelecionada === 'excluir' && formAcaoLote.modoExclusao === 'selecionados' && `Excluir ${usuariosSelecionados.length} Selecionado(s)`}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosTab;


