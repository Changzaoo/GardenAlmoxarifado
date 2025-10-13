import React, { useState } from 'react';
import EmprestimoParticleAnimation from '../components/Emprestimos/EmprestimoParticleAnimation';
import DevolucaoParticleAnimation from '../components/Emprestimos/DevolucaoParticleAnimation';
import { Package, Sparkles } from 'lucide-react';

/**
 * 🎨 Página de Teste das Animações de Partículas
 * 
 * Use esta página para testar e demonstrar as animações de empréstimo e devolução
 * com partículas minimalistas.
 */
const TesteAnimacoesPage = () => {
  const [showEmprestimo, setShowEmprestimo] = useState(false);
  const [showDevolucao, setShowDevolucao] = useState(false);

  // Dados de teste
  const ferramentasTeste = [
    { nome: 'Martelo', quantidade: 2 },
    { nome: 'Chave de Fenda', quantidade: 1 },
    { nome: 'Alicate', quantidade: 3 }
  ];

  const emprestimoTeste = {
    id: 'teste-123',
    funcionarioNome: 'João da Silva',
    funcionarioFoto: null,
    ferramentas: ferramentasTeste
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Cabeçalho */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center gap-3">
            <Sparkles className="w-10 h-10 text-blue-500" />
            Teste de Animações com Partículas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Clique nos botões abaixo para visualizar as animações minimalistas
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-blue-700 dark:text-blue-300 font-medium">Duração: 700ms</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-green-700 dark:text-green-300 font-medium">60 FPS</span>
            </div>
          </div>
        </div>

        {/* Grid de Testes */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Animação de Empréstimo */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-2 border-blue-200 dark:border-blue-800">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Animação de Empréstimo
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Partículas convergindo + card materializando
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Partículas:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">30 azuis</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Duração:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">700ms</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Efeito:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">Convergência + 3D</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Ferramentas:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{ferramentasTeste.length}</span>
              </div>
            </div>

            <button
              onClick={() => setShowEmprestimo(true)}
              disabled={showEmprestimo}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              {showEmprestimo ? 'Animação em Execução...' : 'Testar Animação'}
            </button>

            {showEmprestimo && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
                  ⏱️ Animação executando por 700ms...
                </p>
              </div>
            )}
          </div>

          {/* Animação de Devolução */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-2 border-green-200 dark:border-green-800">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Animação de Devolução
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Card evaporando em partículas subindo
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Partículas:</span>
                <span className="font-bold text-green-600 dark:text-green-400">40 verdes</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Duração:</span>
                <span className="font-bold text-green-600 dark:text-green-400">700ms</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Efeito:</span>
                <span className="font-bold text-green-600 dark:text-green-400">Evaporação + Rastros</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Extras:</span>
                <span className="font-bold text-green-600 dark:text-green-400">8 rastros + 3 ondas</span>
              </div>
            </div>

            <button
              onClick={() => setShowDevolucao(true)}
              disabled={showDevolucao}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              {showDevolucao ? 'Animação em Execução...' : 'Testar Animação'}
            </button>

            {showDevolucao && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300 text-center">
                  ⏱️ Animação executando por 700ms...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Card de Exemplo (para devolução capturar posição) */}
        <div id="emprestimo-card-teste-123" className="mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border-2 border-gray-200 dark:border-gray-700 max-w-md mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center text-white text-xl font-bold">
                J
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {emprestimoTeste.funcionarioNome}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {ferramentasTeste.length} ferramentas
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {ferramentasTeste.map((ferr, idx) => (
                <div key={idx} className="text-sm bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                  <span className="font-medium">{ferr.nome}</span>
                  <span className="ml-2 text-gray-500">x{ferr.quantidade}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Informações Técnicas */}
        <div className="mt-12 bg-gray-800 dark:bg-gray-900 rounded-2xl shadow-xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <code className="text-green-400">{'<>'}</code>
            Informações Técnicas
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-bold text-blue-400 mb-3">Empréstimo</h4>
              <div className="font-mono text-sm space-y-2 bg-gray-900 dark:bg-black p-4 rounded-lg">
                <div><span className="text-gray-400">Componente:</span> <span className="text-green-400">EmprestimoParticleAnimation</span></div>
                <div><span className="text-gray-400">Partículas:</span> <span className="text-yellow-400">30</span></div>
                <div><span className="text-gray-400">Cor:</span> <span className="text-blue-400">#3B82F6</span></div>
                <div><span className="text-gray-400">Duração:</span> <span className="text-red-400">700ms</span></div>
                <div><span className="text-gray-400">FPS:</span> <span className="text-purple-400">60</span></div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-green-400 mb-3">Devolução</h4>
              <div className="font-mono text-sm space-y-2 bg-gray-900 dark:bg-black p-4 rounded-lg">
                <div><span className="text-gray-400">Componente:</span> <span className="text-green-400">DevolucaoParticleAnimation</span></div>
                <div><span className="text-gray-400">Partículas:</span> <span className="text-yellow-400">40 + 8 rastros</span></div>
                <div><span className="text-gray-400">Cor:</span> <span className="text-green-400">#22C55E</span></div>
                <div><span className="text-gray-400">Duração:</span> <span className="text-red-400">700ms</span></div>
                <div><span className="text-gray-400">FPS:</span> <span className="text-purple-400">60</span></div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-sm text-yellow-300">
              💡 <strong>Dica:</strong> As animações são executadas em exatamente 700ms e aparecem em fullscreen sobre toda a página.
            </p>
          </div>
        </div>
      </div>

      {/* Animações */}
      {showEmprestimo && (
        <EmprestimoParticleAnimation
          ferramentas={ferramentasTeste}
          funcionarioNome={emprestimoTeste.funcionarioNome}
          funcionarioFoto={emprestimoTeste.funcionarioFoto}
          onComplete={() => {
            setShowEmprestimo(false);
            alert('✅ Animação de Empréstimo Completa! (700ms)');
          }}
        />
      )}

      {showDevolucao && (
        <DevolucaoParticleAnimation
          emprestimo={emprestimoTeste}
          ferramentasDevolvidas={ferramentasTeste}
          cardElement={document.getElementById('emprestimo-card-teste-123')}
          onComplete={() => {
            setShowDevolucao(false);
            alert('✅ Animação de Devolução Completa! (700ms)');
          }}
        />
      )}
    </div>
  );
};

export default TesteAnimacoesPage;
