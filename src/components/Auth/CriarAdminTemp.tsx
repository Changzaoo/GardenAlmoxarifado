import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { dbWorkflowBR1 } from '../../config/firebaseWorkflowBR1';
import { collection, addDoc, query, getDocs, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { encryptPassword } from '../../utils/crypto';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

const CriarAdminTemp = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processando'); // processando, sucesso, erro
  const [mensagem, setMensagem] = useState('Processando...');
  const [detalhes, setDetalhes] = useState([]);

  useEffect(() => {
    const modo = searchParams.get('modo');
    if (modo === 'alterar') {
      alterarSenhaAdmin();
    } else {
      criarAdmin();
    }
  }, []);

  const alterarSenhaAdmin = async () => {
    try {
      const senha = searchParams.get('senha');
      const adminId = searchParams.get('adminId');
      
      if (!senha || senha.length !== 4 || !/^\d{4}$/.test(senha)) {
        setStatus('erro');
        setMensagem('Senha inválida! Deve ter 4 dígitos numéricos.');
        return;
      }

      if (!adminId) {
        setStatus('erro');
        setMensagem('ID do admin não fornecido!');
        return;
      }

      setMensagem('Alterando senha do administrador...');

      // 1. Buscar dados atuais do admin
      setDetalhes(prev => [...prev, '📋 Buscando dados do admin...']);
      const adminRef = doc(dbWorkflowBR1, 'usuarios', adminId);
      const adminDoc = await getDoc(adminRef);

      if (!adminDoc.exists()) {
        setStatus('erro');
        setMensagem('Admin não encontrado!');
        return;
      }

      const adminAtual = adminDoc.data();
      setDetalhes(prev => [...prev, `✅ Admin encontrado: ${adminAtual.nome}`]);

      // 2. Salvar senha antiga no histórico
      setDetalhes(prev => [...prev, '💾 Salvando senha antiga no histórico...']);
      const historicoRef = collection(dbWorkflowBR1, 'historicoSenhas');
      await addDoc(historicoRef, {
        usuarioId: adminId,
        email: adminAtual.email,
        nome: adminAtual.nome,
        senhaAnterior: adminAtual.senha,
        saltAnterior: adminAtual.salt,
        versionAnterior: adminAtual.version,
        algorithmAnterior: adminAtual.algorithm,
        alteradoEm: new Date().toISOString(),
        alteradoPor: 'Sistema - Alteração via botão de gerenciamento'
      });
      setDetalhes(prev => [...prev, '✅ Histórico salvo com sucesso']);

      // 3. Gerar novo hash da senha
      setDetalhes(prev => [...prev, '🔐 Gerando novo hash de senha...']);
      const { hash, salt, version, algorithm } = encryptPassword(senha);

      // 4. Atualizar senha do admin
      setDetalhes(prev => [...prev, '📝 Atualizando senha do admin...']);
      await updateDoc(adminRef, {
        senha: hash,
        salt: salt,
        version: version,
        algorithm: algorithm,
        senhaAlteradaEm: new Date().toISOString()
      });

      setDetalhes(prev => [...prev, `✅ Senha alterada com sucesso!`]);
      setDetalhes(prev => [...prev, `📧 Login: ${adminAtual.email}`]);
      setDetalhes(prev => [...prev, `🔑 Nova senha: ${senha}`]);

      setStatus('sucesso');
      setMensagem('Senha do administrador alterada com sucesso!');

      // Redirecionar após 5 segundos
      setTimeout(() => {
        navigate('/');
      }, 5000);

    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      setStatus('erro');
      setMensagem('Erro ao alterar senha: ' + error.message);
      setDetalhes(prev => [...prev, `❌ ${error.message}`]);
    }
  };

  const criarAdmin = async () => {
    try {
      const senha = searchParams.get('senha');
      
      if (!senha || senha.length !== 4 || !/^\d{4}$/.test(senha)) {
        setStatus('erro');
        setMensagem('Senha inválida! Deve ter 4 dígitos numéricos.');
        return;
      }

      setMensagem('Criando novo administrador...');

      // 1. Deletar todos os usuários existentes
      setDetalhes(prev => [...prev, '🗑️ Deletando usuários antigos...']);
      const usuariosRef = collection(dbWorkflowBR1, 'usuarios');
      const querySnapshot = await getDocs(usuariosRef);
      
      let deletados = 0;
      for (const documento of querySnapshot.docs) {
        await deleteDoc(doc(dbWorkflowBR1, 'usuarios', documento.id));
        deletados++;
      }
      
      setDetalhes(prev => [...prev, `✅ ${deletados} usuário(s) deletado(s)`]);

      // 2. Criar novo admin
      setDetalhes(prev => [...prev, '👤 Criando novo administrador...']);
      
      const { hash, salt, version, algorithm } = encryptPassword(senha);
      
      const adminData = {
        nome: 'Administrador',
        email: 'admin',
        senha: hash,
        salt: salt,
        version: version,
        algorithm: algorithm,
        nivel: 0, // Admin
        ativo: true,
        criadoEm: new Date().toISOString(),
        bancoDeDados: 'workflowbr1'
      };

      const docRef = await addDoc(usuariosRef, adminData);
      
      setDetalhes(prev => [...prev, `✅ Admin criado com ID: ${docRef.id}`]);
      setDetalhes(prev => [...prev, `📧 Login: admin`]);
      setDetalhes(prev => [...prev, `🔑 Senha: ${senha}`]);
      setDetalhes(prev => [...prev, `👑 Nível: 0 (Administrador)`]);

      // 3. Sucesso
      setStatus('sucesso');
      setMensagem('Administrador criado com sucesso!');

      // Redirecionar após 5 segundos
      setTimeout(() => {
        navigate('/');
      }, 5000);

    } catch (error) {
      console.error('Erro ao criar admin:', error);
      setStatus('erro');
      setMensagem('Erro ao criar administrador: ' + error.message);
      setDetalhes(prev => [...prev, `❌ ${error.message}`]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8"
      >
        {/* Ícone de status */}
        <div className="flex justify-center mb-6">
          {status === 'processando' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader className="w-16 h-16 text-blue-600" />
            </motion.div>
          )}
          {status === 'sucesso' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <CheckCircle className="w-16 h-16 text-green-600" />
            </motion.div>
          )}
          {status === 'erro' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <AlertCircle className="w-16 h-16 text-red-600" />
            </motion.div>
          )}
        </div>

        {/* Mensagem principal */}
        <h2 className={`text-2xl font-bold text-center mb-4 ${
          status === 'sucesso' ? 'text-green-600' : 
          status === 'erro' ? 'text-red-600' : 
          'text-blue-600'
        }`}>
          {mensagem}
        </h2>

        {/* Detalhes */}
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <div className="space-y-2">
            {detalhes.map((detalhe, index) => (
              <motion.p
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                {detalhe}
              </motion.p>
            ))}
          </div>
        </div>

        {/* Ações */}
        {status === 'sucesso' && (
          <div className="space-y-3">
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              Redirecionando para o login em 5 segundos...
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full px-4 py-2 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white rounded-lg transition-colors"
            >
              Ir para Login Agora
            </button>
          </div>
        )}

        {status === 'erro' && (
          <button
            onClick={() => navigate('/')}
            className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Voltar para Login
          </button>
        )}
      </motion.div>
    </div>
  );
};

export default CriarAdminTemp;
