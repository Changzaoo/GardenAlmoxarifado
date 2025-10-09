// 🔑 Interface de Gerenciamento de Códigos de Redefinição e Criação de Contas
// Apenas administradores podem gerar e gerenciar códigos

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import {
  Key,
  Plus,
  Trash2,
  Copy,
  CheckCircle,
  Clock,
  User,
  Shield,
  RefreshCw,
  AlertCircle,
  Search,
  Filter,
  Building2,
  Briefcase,
  UserPlus,
  UserCheck,
  Tabs,
  QrCode
} from 'lucide-react';
import {
  criarCodigoRedefinicao,
  listarCodigosAtivos,
  revogarCodigo,
  limparCodigosExpirados,
  criarCodigoCriacaoConta,
  listarCodigosCriacaoAtivos
} from '../../services/passwordReset';
import {
  criarQRCodeCriacaoConta,
  criarQRCodeRedefinicaoSenha,
  listarQRCodesAtivos,
  revogarQRCode
} from '../../services/qrCodeAuth';
import QRCodeDisplay from '../QRCode/QRCodeDisplay';
import { useAuth } from '../Workflow';

const PasswordResetManager = () => {
  const { usuario, usuarios } = useAuth();
  
  // Estado para controlar a aba ativa
  const [abaAtiva, setAbaAtiva] = useState('redefinicao'); // 'redefinicao' | 'criacao'
  
  // Estados para códigos de redefinição
  const [codigosRedefinicao, setCodigosRedefinicao] = useState([]);
  
  // Estados para códigos de criação de contas
  const [codigosCriacao, setCodigosCriacao] = useState([]);
  
  // Estados compartilhados
  const [carregando, setCarregando] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState('');
  const [validadeHoras, setValidadeHoras] = useState(24);
  const [empresaSelecionada, setEmpresaSelecionada] = useState('');
  const [setorSelecionado, setSetorSelecionado] = useState('');
  const [nivelUsuario, setNivelUsuario] = useState('1'); // 0-6: níveis de permissão
  const [empresas, setEmpresas] = useState([]);
  const [setores, setSetores] = useState([]);
  const [codigoGerado, setCodigoGerado] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState('');
  const [filtro, setFiltro] = useState('todos'); // todos, ativos, expirados
  const [busca, setBusca] = useState('');
  
  // Estados para QR Code
  const [qrCodesAtivos, setQrCodesAtivos] = useState([]);
  const [qrCodeSelecionado, setQrCodeSelecionado] = useState(null);
  const [mostrarQRCode, setMostrarQRCode] = useState(false);
  const [tipoGeracao, setTipoGeracao] = useState('codigo'); // 'codigo' | 'qrcode'

  useEffect(() => {
    carregarCodigos();
    carregarEmpresas();
    // Atualizar a cada 30 segundos
    const intervalo = setInterval(carregarCodigos, 30000);
    return () => clearInterval(intervalo);
  }, [abaAtiva]);

  useEffect(() => {
    if (empresaSelecionada) {
      carregarSetores(empresaSelecionada);
    } else {
      setSetores([]);
      setSetorSelecionado('');
    }
  }, [empresaSelecionada]);

  const carregarEmpresas = async () => {
    try {
      console.log('🏢 Carregando empresas...');
      const empresasRef = collection(db, 'empresas');
      const snapshot = await getDocs(empresasRef);
      const empresasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('✅ Empresas carregadas:', empresasData);
      setEmpresas(empresasData);
    } catch (error) {
      console.error('❌ Erro ao carregar empresas:', error);
    }
  };

  const carregarSetores = async (empresaId) => {
    try {
      console.log('📁 Carregando setores para empresa:', empresaId);
      const setoresRef = collection(db, 'setores');
      const snapshot = await getDocs(setoresRef);
      const todosSetores = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('📋 Todos os setores:', todosSetores);
      const setoresData = todosSetores.filter(setor => setor.empresaId === empresaId);
      console.log('✅ Setores filtrados:', setoresData);
      setSetores(setoresData);
    } catch (error) {
      console.error('❌ Erro ao carregar setores:', error);
    }
  };

  const carregarCodigos = async () => {
    if (abaAtiva === 'redefinicao') {
      const resultado = await listarCodigosAtivos();
      if (resultado.success) {
        setCodigosRedefinicao(resultado.codigos);
      }
    } else if (abaAtiva === 'criacao') {
      const resultado = await listarCodigosCriacaoAtivos();
      if (resultado.success) {
        setCodigosCriacao(resultado.codigos);
      }
    }
    
    // Carregar QR Codes ativos também
    await carregarQRCodes();
  };
  
  const carregarQRCodes = async () => {
    const resultado = await listarQRCodesAtivos();
    if (resultado.success) {
      setQrCodesAtivos(resultado.qrCodes);
    }
  };

  const handleGerarCodigo = async () => {
    setCarregando(true);
    setErro('');

    // Validar campos obrigatórios apenas para níveis 1, 2 e 3 (vinculados a setor)
    const nivel = parseInt(nivelUsuario);
    if (nivel >= 1 && nivel <= 3) {
      if (!empresaSelecionada) {
        setErro('Por favor, selecione uma empresa');
        setCarregando(false);
        return;
      }

      if (!setorSelecionado) {
        setErro('Por favor, selecione um setor');
        setCarregando(false);
        return;
      }
    }

    try {
      let resultado;
      
      // Gerar QR Code ou Código tradicional
      if (tipoGeracao === 'qrcode') {
        if (abaAtiva === 'redefinicao') {
          // Para redefinição, precisa selecionar usuário
          if (!usuarioSelecionado) {
            setErro('Selecione um usuário para redefinição de senha');
            setCarregando(false);
            return;
          }
          
          const usuarioObj = usuarios.find(u => u.id === usuarioSelecionado);
          resultado = await criarQRCodeRedefinicaoSenha({
            usuarioId: usuarioObj.id,
            usuarioEmail: usuarioObj.email,
            usuarioNome: usuarioObj.nome || usuarioObj.email,
            validadeHoras,
            criadoPor: usuario.email
          });
        } else {
          // Criação de conta
          const empresaObj = empresas.find(e => e.id === empresaSelecionada);
          const setorObj = setores.find(s => s.id === setorSelecionado);
          
          resultado = await criarQRCodeCriacaoConta({
            nivelUsuario,
            empresaId: (nivel >= 1 && nivel <= 3) ? empresaSelecionada : null,
            empresaNome: (nivel >= 1 && nivel <= 3) ? empresaObj?.nome : null,
            setorId: (nivel >= 1 && nivel <= 3) ? setorSelecionado : null,
            setorNome: (nivel >= 1 && nivel <= 3) ? setorObj?.nome : null,
            validadeHoras,
            criadoPor: usuario.email
          });
        }
        
        if (resultado.success) {
          setQrCodeSelecionado(resultado.qrCode);
          setMostrarQRCode(true);
          await carregarCodigos();
        } else {
          setErro(resultado.error || 'Erro ao gerar QR Code');
        }
      } else {
        // Código tradicional
        if (abaAtiva === 'redefinicao') {
          resultado = await criarCodigoRedefinicao(
            usuario.id,
            usuarioSelecionado || null,
            validadeHoras,
            (nivel >= 1 && nivel <= 3) ? empresaSelecionada : null,
            (nivel >= 1 && nivel <= 3) ? setorSelecionado : null,
            nivelUsuario
          );
        } else {
          resultado = await criarCodigoCriacaoConta(
            usuario.id,
            validadeHoras,
            (nivel >= 1 && nivel <= 3) ? empresaSelecionada : null,
            (nivel >= 1 && nivel <= 3) ? setorSelecionado : null,
            nivelUsuario
          );
        }

        if (resultado.success) {
          setCodigoGerado(resultado);
          await carregarCodigos();
        } else {
          setErro(resultado.error || 'Erro ao gerar código');
        }
      }
    } catch (error) {
      console.error('Erro ao gerar código/QR Code:', error);
      setErro('Erro ao gerar código');
    } finally {
      setCarregando(false);
    }
  };

  const handleRevogarCodigo = async (codigoId) => {
    if (!confirm('Tem certeza que deseja revogar este código?')) {
      return;
    }

    const resultado = await revogarCodigo(codigoId);
    if (resultado.success) {
      await carregarCodigos();
    } else {
      alert(resultado.message);
    }
  };

  const handleLimparExpirados = async () => {
    if (!confirm('Deseja remover todos os códigos expirados?')) {
      return;
    }

    setCarregando(true);
    const resultado = await limparCodigosExpirados();
    if (resultado.success) {
      await carregarCodigos();
      alert(resultado.message);
    } else {
      alert(resultado.message);
    }
    setCarregando(false);
  };

  const copiarCodigo = (codigo) => {
    navigator.clipboard.writeText(codigo);
    setCopiado(codigo);
    setTimeout(() => setCopiado(false), 2000);
  };

  const abrirModal = async () => {
    setMostrarModal(true);
    // Recarregar empresas quando abre o modal
    await carregarEmpresas();
  };

  const fecharModal = () => {
    setMostrarModal(false);
    setCodigoGerado(null);
    setUsuarioSelecionado('');
    setValidadeHoras(24);
    setEmpresaSelecionada('');
    setSetorSelecionado('');
    setNivelUsuario('1');
    setErro('');
    setTipoGeracao('codigo');
  };
  
  const handleRevogarQRCode = async (qrCodeId) => {
    const resultado = await revogarQRCode(qrCodeId);
    if (resultado.success) {
      await carregarQRCodes();
    }
  };

  // Obter códigos atuais baseado na aba ativa
  const codigosAtuais = abaAtiva === 'redefinicao' ? codigosRedefinicao : codigosCriacao;

  // Filtrar códigos
  const codigosFiltrados = codigosAtuais.filter(codigo => {
    // Filtro por status
    if (filtro === 'ativos' && codigo.expirado) return false;
    if (filtro === 'expirados' && !codigo.expirado) return false;

    // Filtro por busca
    if (busca) {
      const termo = busca.toLowerCase();
      return (
        codigo.codigo.toLowerCase().includes(termo) ||
        (codigo.usuarioEmail && codigo.usuarioEmail.toLowerCase().includes(termo))
      );
    }

    return true;
  });

  // Estatísticas
  const stats = {
    total: codigosAtuais.length,
    ativos: codigosAtuais.filter(c => !c.expirado).length,
    expirados: codigosAtuais.filter(c => c.expirado).length,
    genericos: codigosAtuais.filter(c => !c.usuarioEmail && !c.expirado).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Key className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Gerenciamento de Códigos
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gere códigos para redefinição de senha e criação de novas contas
            </p>
          </div>
          
          <button
            onClick={abrirModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            {abaAtiva === 'redefinicao' ? 'Código de Redefinição' : 'Código de Criação'}
          </button>
        </div>

        {/* Sistema de Abas */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setAbaAtiva('redefinicao')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              abaAtiva === 'redefinicao'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Redefinição de Senha
          </button>
          <button
            onClick={() => setAbaAtiva('criacao')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              abaAtiva === 'criacao'
                ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Criação de Contas
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <Key className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ativos</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.ativos}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Expirados</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.expirados}</p>
            </div>
            <Clock className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Genéricos</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.genericos}</p>
            </div>
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por código ou usuário..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtro de Status */}
          <div className="flex gap-2">
            <button
              onClick={() => setFiltro('todos')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filtro === 'todos'
                  ? 'bg-[#1d9bf0] text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltro('ativos')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filtro === 'ativos'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Ativos
            </button>
            <button
              onClick={() => setFiltro('expirados')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filtro === 'expirados'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Expirados
            </button>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2">
            <button
              onClick={carregarCodigos}
              disabled={carregando}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
            </button>
            
            {stats.expirados > 0 && (
              <button
                onClick={handleLimparExpirados}
                disabled={carregando}
                className="px-4 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Códigos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {codigosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Key className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>Nenhum código encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Expira Em
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tempo Restante
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {codigosFiltrados.map((codigo) => (
                  <tr key={codigo.id} className={codigo.expirado ? 'opacity-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">
                          {codigo.codigo}
                        </code>
                        <button
                          onClick={() => copiarCodigo(codigo.codigo)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="Copiar código"
                        >
                          {copiado === codigo.codigo ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {codigo.usuarioEmail ? (
                        <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                          <User className="w-4 h-4 text-gray-400" />
                          {codigo.usuarioEmail}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Shield className="w-4 h-4" />
                          Genérico
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {codigo.expirado ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                          Expirado
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          Ativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(codigo.expiraEm).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {codigo.expirado ? (
                        <span className="text-red-600 dark:text-red-400">Expirado</span>
                      ) : (
                        <span className="text-gray-900 dark:text-white">
                          {Math.floor(codigo.tempoRestante / 60)}h {codigo.tempoRestante % 60}m
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleRevogarCodigo(codigo.id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        title="Revogar código"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Gerar Código */}
      <AnimatePresence>
        {mostrarModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              {codigoGerado ? (
                // Código gerado com sucesso
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4"
                  >
                    <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                  </motion.div>
                  
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Código Gerado!
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {abaAtiva === 'redefinicao' 
                      ? 'Compartilhe este código com o usuário para redefinir senha:' 
                      : 'Compartilhe este código para criar uma nova conta:'
                    }
                  </p>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <code className="text-3xl font-mono font-bold text-blue-600 dark:text-blue-400">
                        {codigoGerado.codigo}
                      </code>
                      <button
                        onClick={() => copiarCodigo(codigoGerado.codigo)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {copiado === codigoGerado.codigo ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    
                    <div className="mt-3 space-y-1 text-sm">
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>Nível:</strong> {
                          nivelUsuario === '0' ? '👑 Admin (Total)' :
                          nivelUsuario === '1' ? '👤 Funcionário' :
                          nivelUsuario === '2' ? '👔 Supervisor' :
                          nivelUsuario === '3' ? '� Gerente Setor' :
                          nivelUsuario === '4' ? '🎯 Gerente Geral' :
                          nivelUsuario === '5' ? '💼 RH' :
                          nivelUsuario === '6' ? '🏆 CEO' : 'N/A'
                        }
                      </p>
                      {(nivelUsuario === '1' || nivelUsuario === '2' || nivelUsuario === '3') && (
                        <>
                          <p className="text-gray-700 dark:text-gray-300">
                            <strong>Empresa:</strong> {empresas.find(e => e.id === empresaSelecionada)?.nome || 'N/A'}
                          </p>
                          <p className="text-gray-700 dark:text-gray-300">
                            <strong>Setor:</strong> {setores.find(s => s.id === setorSelecionado)?.nome || 'N/A'}
                          </p>
                        </>
                      )}
                      {(nivelUsuario === '0' || parseInt(nivelUsuario) >= 4) && (
                        <p className="text-yellow-600 dark:text-yellow-400 text-xs">
                          ⚠️ Este código cria um usuário com visão global/permissões elevadas
                        </p>
                      )}
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
                        Válido até: {new Date(codigoGerado.expiraEm).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={fecharModal}
                    className="w-full px-4 py-2 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white rounded-lg transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              ) : (
                // Formulário de geração
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    {abaAtiva === 'redefinicao' ? 'Gerar Código de Redefinição' : 'Gerar Código de Criação de Conta'}
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Seletor de Tipo: Código ou QR Code */}
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-4">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">
                        🎯 Escolha o tipo de autenticação
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setTipoGeracao('codigo')}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            tipoGeracao === 'codigo'
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                              : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                          }`}
                        >
                          <Key className={`w-8 h-8 mx-auto mb-2 ${
                            tipoGeracao === 'codigo' ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                          <p className={`font-semibold text-sm ${
                            tipoGeracao === 'codigo' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            Código de Texto
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Tradicional
                          </p>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setTipoGeracao('qrcode')}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            tipoGeracao === 'qrcode'
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                              : 'border-gray-300 dark:border-gray-600 hover:border-purple-300'
                          }`}
                        >
                          <QrCode className={`w-8 h-8 mx-auto mb-2 ${
                            tipoGeracao === 'qrcode' ? 'text-purple-600' : 'text-gray-400'
                          }`} />
                          <p className={`font-semibold text-sm ${
                            tipoGeracao === 'qrcode' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            QR Code Único
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Moderno e seguro
                          </p>
                        </button>
                      </div>
                      {tipoGeracao === 'qrcode' && (
                        <div className="mt-3 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <p className="text-xs text-purple-700 dark:text-purple-300">
                            ✨ <strong>QR Code único:</strong> Gerado com timestamp e só pode ser usado uma única vez. Mais seguro e prático!
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Usuário Específico - Só para redefinição */}
                    {abaAtiva === 'redefinicao' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          Usuário (opcional)
                        </label>
                        <select
                          value={usuarioSelecionado}
                          onChange={(e) => setUsuarioSelecionado(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                          disabled={carregando}
                        >
                          <option value="">Código Genérico</option>
                          {usuarios.map((user) => (
                            <option key={user.id} value={user.email}>
                              {user.nome || user.email} ({user.email})
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Deixe em branco para criar um código que pode ser usado por qualquer usuário
                        </p>
                      </div>
                    )}

                    {/* Informação para criação de contas */}
                    {abaAtiva === 'criacao' && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-blue-900 dark:text-blue-300 mb-1">
                              Código de Criação de Conta
                            </p>
                            <p className="text-blue-700 dark:text-blue-400">
                              Este código permitirá que alguém crie uma nova conta no sistema com o nível de permissão especificado abaixo.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Nível de Permissão do Usuário - Aparece primeiro */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Nível de Permissão *
                      </label>
                      <select
                        value={nivelUsuario}
                        onChange={(e) => {
                          setNivelUsuario(e.target.value);
                          // Limpar empresa e setor se for níveis altos (0, 4, 5, 6)
                          const nivel = parseInt(e.target.value);
                          if (nivel === 0 || nivel >= 4) {
                            setEmpresaSelecionada('');
                            setSetorSelecionado('');
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#1d9bf0]"
                        disabled={carregando}
                        required
                      >
                        <option value="0">👑 Nível 0 - Administrador (Acesso Total)</option>
                        <option value="1">👤 Nível 1 - Funcionário (Acesso Básico)</option>
                        <option value="2">👔 Nível 2 - Supervisor de Setor</option>
                        <option value="3">📊 Nível 3 - Gerente de Setor</option>
                        <option value="4">🎯 Nível 4 - Gerente Geral</option>
                        <option value="5">💼 Nível 5 - RH (Recursos Humanos)</option>
                        <option value="6">🏆 Nível 6 - CEO (Diretor Executivo)</option>
                      </select>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {nivelUsuario === '0' && '⚠️ Acesso total ao sistema (não vinculado a empresa/setor)'}
                        {nivelUsuario === '1' && '📌 Acesso básico - vinculado a empresa e setor'}
                        {nivelUsuario === '2' && '📌 Supervisiona equipe - vinculado a setor'}
                        {nivelUsuario === '3' && '📌 Gerencia setor específico - vinculado a setor'}
                        {nivelUsuario === '4' && '🌐 Gerencia múltiplos setores (visão global)'}
                        {nivelUsuario === '5' && '🌐 Gestão de recursos humanos (visão global)'}
                        {nivelUsuario === '6' && '🌐 Diretor executivo - visão estratégica (visão global)'}
                      </p>
                    </div>

                    {/* Empresa - Só aparece para níveis 1, 2 e 3 (vinculados a setor) */}
                    {(nivelUsuario === '1' || nivelUsuario === '2' || nivelUsuario === '3') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Empresa * {empresas.length > 0 && <span className="text-xs text-green-500">({empresas.length} disponíveis)</span>}
                        </label>
                        <select
                          value={empresaSelecionada}
                          onChange={(e) => {
                            console.log('Empresa selecionada:', e.target.value);
                            setEmpresaSelecionada(e.target.value);
                            // Limpar setor quando mudar empresa
                            setSetorSelecionado('');
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                          disabled={carregando}
                          required
                        >
                          <option value="">Selecione uma empresa</option>
                          {empresas.length === 0 ? (
                            <option disabled>Carregando empresas...</option>
                          ) : (
                            empresas.map((empresa) => (
                              <option key={empresa.id} value={empresa.id}>
                                {empresa.nome}
                              </option>
                            ))
                          )}
                        </select>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          O usuário será registrado nesta empresa
                        </p>
                      </div>
                    )}

                    {/* Setor - Só aparece para níveis 1, 2 e 3 E depois de selecionar empresa */}
                    {(nivelUsuario === '1' || nivelUsuario === '2' || nivelUsuario === '3') && empresaSelecionada && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          Setor * {setores.length > 0 && <span className="text-xs text-green-500">({setores.length} disponíveis)</span>}
                        </label>
                        <select
                          value={setorSelecionado}
                          onChange={(e) => {
                            console.log('Setor selecionado:', e.target.value);
                            setSetorSelecionado(e.target.value);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                          disabled={carregando}
                          required
                        >
                          <option value="">Selecione um setor</option>
                          {setores.length === 0 ? (
                            <option disabled>Carregando setores...</option>
                          ) : (
                            setores.map((setor) => (
                              <option key={setor.id} value={setor.id}>
                                {setor.nome}
                              </option>
                            ))
                          )}
                        </select>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          O usuário será registrado neste setor
                        </p>
                      </div>
                    )}

                    {/* Validade */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Validade (horas)
                      </label>
                      <input
                        type="number"
                        value={validadeHoras}
                        onChange={(e) => setValidadeHoras(Math.max(1, parseInt(e.target.value) || 24))}
                        min="1"
                        max="168"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        disabled={carregando}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        O código expirará após este período
                      </p>
                    </div>

                    {/* Erro */}
                    {erro && (
                      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>{erro}</span>
                      </div>
                    )}

                    {/* Botões */}
                    <div className="flex gap-3">
                      <button
                        onClick={fecharModal}
                        disabled={carregando}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      
                      <button
                        onClick={handleGerarCodigo}
                        disabled={carregando}
                        className="flex-1 px-4 py-2 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {carregando ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Gerando...
                          </div>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            {tipoGeracao === 'qrcode' ? <QrCode className="w-5 h-5" /> : <Key className="w-5 h-5" />}
                            {tipoGeracao === 'qrcode' ? 'Gerar QR Code' : 'Gerar Código'}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Modal de exibição do QR Code */}
      <AnimatePresence>
        {mostrarQRCode && qrCodeSelecionado && (
          <QRCodeDisplay
            qrCode={qrCodeSelecionado}
            onClose={() => {
              setMostrarQRCode(false);
              setQrCodeSelecionado(null);
              fecharModal();
            }}
            onRevoke={handleRevogarQRCode}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PasswordResetManager;
