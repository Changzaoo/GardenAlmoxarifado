import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { Send, Clock, CheckCircle, MessageCircle } from 'lucide-react';
import { formatarData } from '../../utils/dateUtils';

const SuporteTab = () => {
  const { usuario } = useAuth();
  const [chamados, setChamados] = useState([]);
  const [novoChamado, setNovoChamado] = useState({
    assunto: '',
    descricao: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!usuario?.id) return;

    // Query diferente baseada no nível do usuário
    const q = usuario.nivel === 1
      ? query(collection(db, 'chamados'), where('usuarioId', '==', usuario.id))
      : query(collection(db, 'chamados')); // Níveis superiores veem todos

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chamadosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChamados(chamadosData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [usuario]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!novoChamado.assunto || !novoChamado.descricao) return;

    try {
      await addDoc(collection(db, 'chamados'), {
        ...novoChamado,
        usuarioId: usuario.id,
        nomeUsuario: usuario.nome,
        status: 'aberto',
        dataCriacao: new Date().toISOString(),
        respostas: [],
      });

      setNovoChamado({ assunto: '', descricao: '' });
    } catch (error) {
      console.error('Erro ao criar chamado:', error);
    }
  };

  const handleResponder = async (chamadoId, resposta) => {
    if (!resposta.trim()) return;

    try {
      const chamadoRef = doc(db, 'chamados', chamadoId);
      await updateDoc(chamadoRef, {
        respostas: [
          ...chamados.find(c => c.id === chamadoId).respostas,
          {
            texto: resposta,
            usuarioId: usuario.id,
            nomeUsuario: usuario.nome,
            data: new Date().toISOString(),
          }
        ]
      });
    } catch (error) {
      console.error('Erro ao responder chamado:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Suporte</h1>

      {/* Formulário para novo chamado (apenas nível 1) */}
      {usuario?.nivel === 1 && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Novo Chamado</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assunto
              </label>
              <input
                type="text"
                value={novoChamado.assunto}
                onChange={(e) => setNovoChamado({...novoChamado, assunto: e.target.value})}
                className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={novoChamado.descricao}
                onChange={(e) => setNovoChamado({...novoChamado, descricao: e.target.value})}
                className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500"
                rows={4}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Enviar Chamado
            </button>
          </form>
        </div>
      )}

      {/* Lista de chamados */}
      <div className="space-y-4">
        {chamados.map((chamado) => (
          <div
            key={chamado.id}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{chamado.assunto}</h3>
                <p className="text-sm text-gray-600">
                  Aberto por {chamado.nomeUsuario} em {formatarData(chamado.dataCriacao)}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                chamado.status === 'aberto'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {chamado.status === 'aberto' ? (
                  <><Clock className="w-4 h-4 inline mr-1" />Aberto</>
                ) : (
                  <><CheckCircle className="w-4 h-4 inline mr-1" />Resolvido</>
                )}
              </span>
            </div>

            <p className="text-gray-700 mb-4">{chamado.descricao}</p>

            {/* Respostas */}
            {chamado.respostas?.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Respostas:</h4>
                <div className="space-y-3">
                  {chamado.respostas.map((resposta, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-gray-700">
                          {resposta.nomeUsuario}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatarData(resposta.data)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{resposta.texto}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Campo de resposta (apenas para níveis 2+) */}
            {usuario?.nivel >= 2 && chamado.status === 'aberto' && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Digite sua resposta..."
                    className="flex-1 rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleResponder(chamado.id, e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector(`input[data-chamado-id="${chamado.id}"]`);
                      if (input) {
                        handleResponder(chamado.id, input.value);
                        input.value = '';
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuporteTab;
