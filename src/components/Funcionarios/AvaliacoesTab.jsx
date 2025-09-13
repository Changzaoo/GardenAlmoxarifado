import React, { useState, useEffect } from 'react';
import { Star, Calendar, Clock, Plus, X, Check } from 'lucide-react';
import { collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { formatarData, formatarHora } from '../../utils/dateUtils';
import { useAuth } from '../../hooks/useAuth';

const AvaliacoesTab = ({ funcionario }) => {
  const { usuario } = useAuth();
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [novaAvaliacao, setNovaAvaliacao] = useState({
    data: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().slice(0, 5),
    estrelas: 0,
    comentario: '',
  });
  const [hoverEstrelas, setHoverEstrelas] = useState(0);

  // Carregar avaliações existentes
  useEffect(() => {
    const carregarAvaliacoes = async () => {
      try {
        const avaliacoesRef = collection(db, 'avaliacoes_funcionarios');
        const q = query(
          avaliacoesRef,
          where('funcionarioId', '==', funcionario.id),
          orderBy('data', 'desc'),
          orderBy('hora', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const avaliacoesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setAvaliacoes(avaliacoesData);
      } catch (error) {
        console.error('Erro ao carregar avaliações:', error);
      }
    };

    if (funcionario?.id) {
      carregarAvaliacoes();
    }
  }, [funcionario?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const novaAvaliacaoDoc = {
        ...novaAvaliacao,
        funcionarioId: funcionario.id,
        funcionarioNome: funcionario.nome,
        supervisorId: usuario.id,
        supervisorNome: usuario.nome,
        dataCriacao: new Date().toISOString()
      };

      await addDoc(collection(db, 'avaliacoes_funcionarios'), novaAvaliacaoDoc);
      
      setAvaliacoes(prev => [novaAvaliacaoDoc, ...prev]);
      setShowAddModal(false);
      setNovaAvaliacao({
        data: new Date().toISOString().split('T')[0],
        hora: new Date().toTimeString().slice(0, 5),
        estrelas: 0,
        comentario: ''
      });
    } catch (error) {
      console.error('Erro ao adicionar avaliação:', error);
    }
  };

  if (usuario?.nivel < 2) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Botão Adicionar Avaliação */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1DA1F2] text-white rounded-full hover:bg-[#1a91da] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Avaliação
        </button>
      </div>

      {/* Lista de Avaliações */}
      <div className="space-y-4">
        {avaliacoes.length === 0 ? (
          <div className="bg-[#192734] rounded-xl p-6 text-center border border-[#38444D]">
            <Star className="w-12 h-12 text-[#8899A6] mx-auto mb-3" />
            <p className="text-[#8899A6]">Nenhuma avaliação registrada para este funcionário</p>
          </div>
        ) : (
          avaliacoes.map((avaliacao) => (
            <div
              key={avaliacao.id}
              className="bg-[#192734] rounded-xl p-6 border border-[#38444D]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((estrela) => (
                      <Star
                        key={estrela}
                        className={`w-5 h-5 ${
                          estrela <= avaliacao.estrelas
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-[#38444D]'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[#8899A6] mt-2">{avaliacao.comentario}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm text-[#8899A6]">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatarData(avaliacao.data)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatarHora(avaliacao.hora)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>por {avaliacao.supervisorNome}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Nova Avaliação */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#192734] rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Nova Avaliação</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-[#8899A6] hover:bg-[#283340] rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Data e Hora */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#8899A6] mb-2">Data</label>
                  <input
                    type="date"
                    value={novaAvaliacao.data}
                    onChange={(e) => setNovaAvaliacao(prev => ({ ...prev, data: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#253341] text-white border border-[#38444D] rounded-lg focus:border-[#1DA1F2] focus:ring-1 focus:ring-[#1DA1F2] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#8899A6] mb-2">Hora</label>
                  <input
                    type="time"
                    value={novaAvaliacao.hora}
                    onChange={(e) => setNovaAvaliacao(prev => ({ ...prev, hora: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#253341] text-white border border-[#38444D] rounded-lg focus:border-[#1DA1F2] focus:ring-1 focus:ring-[#1DA1F2] outline-none"
                    required
                  />
                </div>
              </div>

              {/* Estrelas */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[#8899A6] text-sm">Avaliação</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((estrela) => (
                    <button
                      key={estrela}
                      type="button"
                      onClick={() => setNovaAvaliacao(prev => ({ ...prev, estrelas: estrela }))}
                      onMouseEnter={() => setHoverEstrelas(estrela)}
                      onMouseLeave={() => setHoverEstrelas(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          (hoverEstrelas ? estrela <= hoverEstrelas : estrela <= novaAvaliacao.estrelas)
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-[#38444D]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comentário */}
              <div>
                <label className="block text-sm text-[#8899A6] mb-2">Comentário</label>
                <textarea
                  value={novaAvaliacao.comentario}
                  onChange={(e) => setNovaAvaliacao(prev => ({ ...prev, comentario: e.target.value }))}
                  className="w-full h-32 px-4 py-2 bg-[#253341] text-white border border-[#38444D] rounded-lg resize-none focus:border-[#1DA1F2] focus:ring-1 focus:ring-[#1DA1F2] outline-none"
                  placeholder="Deixe um feedback sobre o desempenho do funcionário..."
                  required
                />
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-[#8899A6] hover:bg-[#283340] rounded-full transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1DA1F2] text-white rounded-full hover:bg-[#1a91da] transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Salvar Avaliação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvaliacoesTab;