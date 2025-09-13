import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebaseConfig';
import { collection, addDoc, doc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import AdminTestBotButton from './AdminTestBotButton';
import AdminTestBotWindow from './AdminTestBotWindow';

const AdminTestBot = () => {
  const { usuario } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [progress, setProgress] = useState(0);

  // Verifica se o usuário é administrador
  if (!usuario?.isAdmin) {
    return null;
  }

  // Lista de testes a serem executados
  const tests = [
    {
      name: 'Criar Funcionário',
      async run() {
        try {
          const testFunc = {
            nome: 'Bot Test User',
            email: 'bottest@test.com',
            cargo: 'Teste',
            departamento: 'Bot Testing',
            status: 'ativo'
          };
          const docRef = await addDoc(collection(db, 'funcionarios'), testFunc);
          await deleteDoc(doc(db, 'funcionarios', docRef.id));
          return { success: true, message: 'Funcionário criado e removido com sucesso' };
        } catch (error) {
          return { success: false, message: `Erro ao testar criação de funcionário: ${error.message}` };
        }
      }
    },
    {
      name: 'Criar Ferramenta',
      async run() {
        try {
          const testTool = {
            nome: 'Ferramenta Teste',
            quantidade: 1,
            categoria: 'Teste',
            status: 'disponível'
          };
          const docRef = await addDoc(collection(db, 'inventario'), testTool);
          await deleteDoc(doc(db, 'inventario', docRef.id));
          return { success: true, message: 'Ferramenta criada e removida com sucesso' };
        } catch (error) {
          return { success: false, message: `Erro ao testar criação de ferramenta: ${error.message}` };
        }
      }
    },
    {
      name: 'Criar Empréstimo',
      async run() {
        try {
          const testEmprestimo = {
            funcionarioId: 'test-id',
            ferramentaId: 'test-id',
            dataEmprestimo: new Date(),
            status: 'pendente'
          };
          const docRef = await addDoc(collection(db, 'emprestimos'), testEmprestimo);
          await deleteDoc(doc(db, 'emprestimos', docRef.id));
          return { success: true, message: 'Empréstimo criado e removido com sucesso' };
        } catch (error) {
          return { success: false, message: `Erro ao testar criação de empréstimo: ${error.message}` };
        }
      }
    },
    {
      name: 'Testar Notificações',
      async run() {
        try {
          const testNotification = {
            tipo: 'teste',
            titulo: 'Notificação de Teste',
            mensagem: 'Esta é uma notificação de teste',
            data: new Date(),
            destinatario: usuario.id
          };
          const docRef = await addDoc(collection(db, 'notificacoes'), testNotification);
          await deleteDoc(doc(db, 'notificacoes', docRef.id));
          return { success: true, message: 'Notificação criada e removida com sucesso' };
        } catch (error) {
          return { success: false, message: `Erro ao testar notificações: ${error.message}` };
        }
      }
    },
    {
      name: 'Testar Relatórios',
      async run() {
        try {
          const q = query(collection(db, 'emprestimos'), where('status', '==', 'concluído'));
          await getDocs(q);
          return { success: true, message: 'Consulta de relatórios executada com sucesso' };
        } catch (error) {
          return { success: false, message: `Erro ao testar relatórios: ${error.message}` };
        }
      }
    }
  ];

  // Inicia a execução dos testes
  const startTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setProgress(0);
    setIsOpen(true);

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      setCurrentTest(test.name);
      
      const result = await test.run();
      setTestResults(prev => [...prev, { name: test.name, ...result }]);
      setProgress(((i + 1) / tests.length) * 100);
      
      // Pausa entre os testes para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsRunning(false);
    setCurrentTest('');
  };

  // Para a execução dos testes
  const stopTests = () => {
    setIsRunning(false);
    setCurrentTest('');
  };

  return (
    <>
      <AdminTestBotButton 
        onClick={isRunning ? stopTests : startTests}
        isRunning={isRunning}
      />
      <AdminTestBotWindow
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        isRunning={isRunning}
        currentTest={currentTest}
        progress={progress}
        testResults={testResults}
      />
    </>
  );
};

export default AdminTestBot;

const AdminTestBot = () => {
  const { usuario } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [progress, setProgress] = useState(0);

  // Verifica se o usuário é administrador
  if (!usuario?.isAdmin) {
    return null;
  }

  // Lista de testes a serem executados
  const tests = [
    {
      name: 'Criar Funcionário',
      async run() {
        try {
          const testFunc = {
            nome: 'Bot Test User',
            email: 'bottest@test.com',
            cargo: 'Teste',
            departamento: 'Bot Testing',
            status: 'ativo'
          };
          const docRef = await addDoc(collection(db, 'funcionarios'), testFunc);
          await deleteDoc(doc(db, 'funcionarios', docRef.id));
          return { success: true, message: 'Funcionário criado e removido com sucesso' };
        } catch (error) {
          return { success: false, message: \`Erro ao testar criação de funcionário: \${error.message}\` };
        }
      }
    },
    {
      name: 'Criar Ferramenta',
      async run() {
        try {
          const testTool = {
            nome: 'Ferramenta Teste',
            quantidade: 1,
            categoria: 'Teste',
            status: 'disponível'
          };
          const docRef = await addDoc(collection(db, 'inventario'), testTool);
          await deleteDoc(doc(db, 'inventario', docRef.id));
          return { success: true, message: 'Ferramenta criada e removida com sucesso' };
        } catch (error) {
          return { success: false, message: \`Erro ao testar criação de ferramenta: \${error.message}\` };
        }
      }
    },
    {
      name: 'Criar Empréstimo',
      async run() {
        try {
          const testEmprestimo = {
            funcionarioId: 'test-id',
            ferramentaId: 'test-id',
            dataEmprestimo: new Date(),
            status: 'pendente'
          };
          const docRef = await addDoc(collection(db, 'emprestimos'), testEmprestimo);
          await deleteDoc(doc(db, 'emprestimos', docRef.id));
          return { success: true, message: 'Empréstimo criado e removido com sucesso' };
        } catch (error) {
          return { success: false, message: \`Erro ao testar criação de empréstimo: \${error.message}\` };
        }
      }
    },
    {
      name: 'Testar Notificações',
      async run() {
        try {
          const testNotification = {
            tipo: 'teste',
            titulo: 'Notificação de Teste',
            mensagem: 'Esta é uma notificação de teste',
            data: new Date(),
            destinatario: usuario.id
          };
          const docRef = await addDoc(collection(db, 'notificacoes'), testNotification);
          await deleteDoc(doc(db, 'notificacoes', docRef.id));
          return { success: true, message: 'Notificação criada e removida com sucesso' };
        } catch (error) {
          return { success: false, message: \`Erro ao testar notificações: \${error.message}\` };
        }
      }
    },
    {
      name: 'Testar Relatórios',
      async run() {
        try {
          const q = query(collection(db, 'emprestimos'), where('status', '==', 'concluído'));
          await getDocs(q);
          return { success: true, message: 'Consulta de relatórios executada com sucesso' };
        } catch (error) {
          return { success: false, message: \`Erro ao testar relatórios: \${error.message}\` };
        }
      }
    }
  ];

  // Inicia a execução dos testes
  const startTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setProgress(0);

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      setCurrentTest(test.name);
      
      const result = await test.run();
      setTestResults(prev => [...prev, { name: test.name, ...result }]);
      setProgress(((i + 1) / tests.length) * 100);
      
      // Pausa entre os testes para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsRunning(false);
    setCurrentTest('');
  };

  // Para a execução dos testes
  const stopTests = () => {
    setIsRunning(false);
    setCurrentTest('');
  };

  return (
    <div className="fixed bottom-4 right-4 bg-[#253341] p-4 rounded-lg shadow-lg border border-[#38444D] w-96">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">Admin Test Bot</h3>
        <button
          onClick={isRunning ? stopTests : startTests}
          className={`p-2 rounded-full ${
            isRunning ? 'text-red-500 hover:text-red-400' : 'text-green-500 hover:text-green-400'
          }`}
        >
          {isRunning ? <StopCircle className="w-6 h-6" /> : <PlayCircle className="w-6 h-6" />}
        </button>
      </div>

      {isRunning && (
        <>
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>Progresso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-[#38444D] rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: \`\${progress}%\` }}
              />
            </div>
          </div>
          <div className="text-sm text-gray-400 mb-4">
            Executando: {currentTest}
          </div>
        </>
      )}

      <div className="max-h-60 overflow-y-auto">
        {testResults.map((result, index) => (
          <div
            key={index}
            className={`flex items-start space-x-2 p-2 rounded ${
              result.success ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {result.success ? (
              <CheckCircle className="w-4 h-4 mt-1 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 mt-1 flex-shrink-0" />
            )}
            <div>
              <div className="font-medium">{result.name}</div>
              <div className="text-sm opacity-80">{result.message}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminTestBot;
