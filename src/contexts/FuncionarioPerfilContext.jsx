import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Contexto do Perfil Completo do Funcionário
 * 
 * Estrutura do perfil:
 * - Informações Principais (Prioridade 1):
 *   - empresa
 *   - setor
 *   - funcao (cargo)
 * 
 * - Informações de Contato:
 *   - telefone
 *   - whatsapp
 *   - email
 * 
 * - Informações Pessoais:
 *   - nome completo
 *   - cpf
 *   - data de nascimento
 *   - foto
 * 
 * - Informações de Acesso:
 *   - nivel de permissão
 *   - status (ativo/inativo)
 *   - data de cadastro
 *   - último acesso
 * 
 * - Estatísticas:
 *   - pontos totais
 *   - tarefas concluídas
 *   - avaliações recebidas
 *   - empréstimos ativos
 */

const FuncionarioPerfilContext = createContext();

export const useFuncionarioPerfil = () => {
  const context = useContext(FuncionarioPerfilContext);
  if (!context) {
    throw new Error('useFuncionarioPerfil deve ser usado dentro de FuncionarioPerfilProvider');
  }
  return context;
};

export const FuncionarioPerfilProvider = ({ children }) => {
  const { usuario, usuarioId } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [empresas, setEmpresas] = useState([]);
  const [setores, setSetores] = useState([]);
  const [funcoes, setFuncoes] = useState([]);

  /**
   * Carregar perfil do funcionário do Firestore
   */
  const carregarPerfil = async (uid) => {
    try {
      setLoading(true);
      console.log('📋 Carregando perfil do funcionário:', uid);

      const perfilRef = doc(db, 'funcionarios', uid);
      const perfilDoc = await getDoc(perfilRef);

      if (perfilDoc.exists()) {
        const dados = perfilDoc.data();
        console.log('✅ Perfil carregado:', dados);
        
        setPerfil({
          id: uid,
          // Prioridades (essenciais para o sistema)
          empresa: dados.empresa || '',
          setor: dados.setor || '',
          funcao: dados.funcao || dados.cargo || '',
          
          // Contato
          telefone: dados.telefone || '',
          whatsapp: dados.whatsapp || dados.telefone || '',
          email: dados.email || usuario?.email || '',
          
          // Pessoais
          nome: dados.nome || usuario?.displayName || '',
          cpf: dados.cpf || '',
          dataNascimento: dados.dataNascimento || '',
          foto: dados.foto || usuario?.photoURL || '',
          
          // Acesso
          nivel: dados.nivel || 'funcionario',
          status: dados.status || 'ativo',
          dataCadastro: dados.dataCadastro || new Date().toISOString(),
          ultimoAcesso: new Date().toISOString(),
          
          // Estatísticas
          pontosTotais: dados.pontosTotais || 0,
          tarefasConcluidas: dados.tarefasConcluidas || 0,
          avaliacoesRecebidas: dados.avaliacoesRecebidas || 0,
          emprestimosAtivos: dados.emprestimosAtivos || 0,
          
          // Extras
          observacoes: dados.observacoes || '',
          horarioTrabalho: dados.horarioTrabalho || {},
          
          // Metadata
          criadoEm: dados.criadoEm || new Date().toISOString(),
          atualizadoEm: new Date().toISOString()
        });
      } else {
        console.log('⚠️ Perfil não encontrado, criando novo');
        await criarPerfilInicial(uid);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Criar perfil inicial para novo funcionário
   */
  const criarPerfilInicial = async (uid) => {
    try {
      const perfilInicial = {
        // Prioridades - OBRIGATÓRIOS
        empresa: '',
        setor: '',
        funcao: '',
        
        // Contato
        telefone: '',
        whatsapp: '',
        email: usuario?.email || '',
        
        // Pessoais
        nome: usuario?.displayName || '',
        cpf: '',
        dataNascimento: '',
        foto: usuario?.photoURL || '',
        
        // Acesso
        nivel: 'funcionario',
        status: 'pendente', // Requer aprovação/configuração
        dataCadastro: new Date().toISOString(),
        ultimoAcesso: new Date().toISOString(),
        
        // Estatísticas
        pontosTotais: 0,
        tarefasConcluidas: 0,
        avaliacoesRecebidas: 0,
        emprestimosAtivos: 0,
        
        // Metadata
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      };

      await setDoc(doc(db, 'funcionarios', uid), perfilInicial);
      setPerfil({ id: uid, ...perfilInicial });
      
      console.log('✅ Perfil inicial criado');
    } catch (error) {
      console.error('❌ Erro ao criar perfil inicial:', error);
    }
  };

  /**
   * Atualizar perfil do funcionário
   */
  const atualizarPerfil = async (dadosAtualizados) => {
    try {
      if (!usuarioId) throw new Error('Usuário não autenticado');

      console.log('💾 Atualizando perfil:', dadosAtualizados);

      const perfilRef = doc(db, 'funcionarios', usuarioId);
      const dadosComTimestamp = {
        ...dadosAtualizados,
        atualizadoEm: new Date().toISOString()
      };

      await updateDoc(perfilRef, dadosComTimestamp);
      
      setPerfil(prev => ({
        ...prev,
        ...dadosComTimestamp
      }));

      console.log('✅ Perfil atualizado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
      return false;
    }
  };

  /**
   * Atualizar estatísticas do perfil
   */
  const atualizarEstatisticas = async (tipo, incremento = 1) => {
    try {
      if (!usuarioId) return;

      const campos = {
        'tarefas': 'tarefasConcluidas',
        'avaliacoes': 'avaliacoesRecebidas',
        'emprestimos': 'emprestimosAtivos',
        'pontos': 'pontosTotais'
      };

      const campo = campos[tipo];
      if (!campo) return;

      const novoValor = (perfil[campo] || 0) + incremento;

      await atualizarPerfil({ [campo]: novoValor });
      
      console.log(`📊 Estatística atualizada: ${campo} = ${novoValor}`);
    } catch (error) {
      console.error('❌ Erro ao atualizar estatística:', error);
    }
  };

  /**
   * Carregar lista de empresas disponíveis
   */
  const carregarEmpresas = async () => {
    try {
      const empresasSnapshot = await getDocs(collection(db, 'empresas'));
      const empresasLista = empresasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmpresas(empresasLista);
    } catch (error) {
      console.error('❌ Erro ao carregar empresas:', error);
    }
  };

  /**
   * Carregar setores de uma empresa
   */
  const carregarSetores = async (empresaId) => {
    try {
      if (!empresaId) {
        setSetores([]);
        return;
      }

      const setoresQuery = query(
        collection(db, 'setores'),
        where('empresaId', '==', empresaId)
      );
      
      const setoresSnapshot = await getDocs(setoresQuery);
      const setoresLista = setoresSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setSetores(setoresLista);
    } catch (error) {
      console.error('❌ Erro ao carregar setores:', error);
    }
  };

  /**
   * Carregar funções disponíveis
   */
  const carregarFuncoes = async () => {
    try {
      const funcoesSnapshot = await getDocs(collection(db, 'funcoes'));
      const funcoesLista = funcoesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFuncoes(funcoesLista);
    } catch (error) {
      console.error('❌ Erro ao carregar funções:', error);
    }
  };

  /**
   * Verificar se perfil está completo (campos obrigatórios preenchidos)
   */
  const perfilCompleto = () => {
    if (!perfil) return false;
    return !!(perfil.empresa && perfil.setor && perfil.funcao);
  };

  /**
   * Obter informações resumidas do perfil para exibição
   */
  const getPerfilResumo = () => {
    if (!perfil) return null;
    
    return {
      nome: perfil.nome,
      empresa: perfil.empresa,
      setor: perfil.setor,
      funcao: perfil.funcao,
      foto: perfil.foto,
      nivel: perfil.nivel,
      pontos: perfil.pontosTotais
    };
  };

  // Carregar perfil quando usuário autenticar
  useEffect(() => {
    if (usuarioId) {
      carregarPerfil(usuarioId);
      carregarEmpresas();
      carregarFuncoes();
    } else {
      setPerfil(null);
      setLoading(false);
    }
  }, [usuarioId]);

  // Carregar setores quando empresa mudar
  useEffect(() => {
    if (perfil?.empresa) {
      carregarSetores(perfil.empresa);
    }
  }, [perfil?.empresa]);

  const value = {
    perfil,
    loading,
    empresas,
    setores,
    funcoes,
    atualizarPerfil,
    atualizarEstatisticas,
    carregarSetores,
    perfilCompleto,
    getPerfilResumo
  };

  return (
    <FuncionarioPerfilContext.Provider value={value}>
      {children}
    </FuncionarioPerfilContext.Provider>
  );
};

export default FuncionarioPerfilContext;
