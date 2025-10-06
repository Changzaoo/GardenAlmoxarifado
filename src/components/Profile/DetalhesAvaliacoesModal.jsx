import React, { useState, useEffect } from 'react';
import { X, Star, Calendar, Award, User, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

const DetalhesAvaliacoesModal = ({ isOpen, onClose, funcionarioId, pontos }) => {
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && funcionarioId) {
      buscarAvaliacoes();
    }
  }, [isOpen, funcionarioId]);

  const buscarAvaliacoes = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'avaliacoes'),
        where('funcionarioId', '==', funcionarioId)
      );
      
      const snapshot = await getDocs(q);
      const avaliacoesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Ordenar por data (mais recente primeiro)
      avaliacoesData.sort((a, b) => {
        const dateA = a.dataAvaliacao?.seconds || a.dataAvaliacao?.toDate?.() || a.timestamp?.seconds || 0;
        const dateB = b.dataAvaliacao?.seconds || b.dataAvaliacao?.toDate?.() || b.timestamp?.seconds || 0;
        return dateB - dateA;
      });
      
      setAvaliacoes(avaliacoesData);
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularPontosAvaliacao = (avaliacao) => {
    const estrelas = avaliacao.nota || avaliacao.estrelas || 0;
    return estrelas * 10; // 10 pontos por estrela (max 50)
  };

  const renderStars = (quantidade) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            className={`w-4 h-4 ${
              index < quantidade
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-xl p-2">
              <Star className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Avaliações Recebidas</h2>
              <p className="text-sm text-white/80">{avaliacoes.length} avaliações registradas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
              <p className="text-gray-500 mt-4">Carregando avaliações...</p>
            </div>
          ) : avaliacoes.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma avaliação recebida</p>
            </div>
          ) : (
            <div className="space-y-3">
              {avaliacoes.map((avaliacao) => {
                const pontosAvaliacao = calcularPontosAvaliacao(avaliacao);
                const dataAvaliacao = avaliacao.dataAvaliacao?.toDate?.() || 
                                      (avaliacao.timestamp?.toDate?.() || new Date());
                const estrelas = avaliacao.nota || avaliacao.estrelas || 0;
                
                return (
                  <div key={avaliacao.id} className="bg-gradient-to-br from-yellow-50 to-orange-100/50 rounded-xl p-4 border border-yellow-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {renderStars(estrelas)}
                          <span className="text-sm font-semibold text-gray-700">
                            {estrelas.toFixed(1)} / 5.0
                          </span>
                        </div>
                        
                        {avaliacao.avaliadorNome && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <User className="w-4 h-4" />
                            <span>Avaliado por: <strong>{avaliacao.avaliadorNome}</strong></span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{format(dataAvaliacao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-yellow-300">
                        <Award className="w-4 h-4 text-yellow-600" />
                        <span className="font-bold text-yellow-600">+{pontosAvaliacao} pts</span>
                      </div>
                    </div>

                    {/* Comentário */}
                    {avaliacao.comentario && (
                      <div className="bg-white rounded-lg p-3 mb-2 border border-gray-200">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700 italic">{avaliacao.comentario}</p>
                        </div>
                      </div>
                    )}

                    {/* Contexto da avaliação */}
                    {(avaliacao.tipo || avaliacao.referencia) && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {avaliacao.tipo && (
                          <span className="bg-white px-2 py-1 rounded-full border border-gray-200">
                            {avaliacao.tipo}
                          </span>
                        )}
                        {avaliacao.referencia && (
                          <span className="bg-white px-2 py-1 rounded-full border border-gray-200">
                            Ref: {avaliacao.referencia}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Breakdown de pontos */}
                    <div className="mt-2 text-xs text-gray-600">
                      <span>
                        Cálculo: <strong className="text-gray-800">{estrelas} estrelas × 10 pts = {pontosAvaliacao} pts</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer com estatísticas */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-white" />
              <span className="text-white/90 text-sm font-medium">Total Acumulado:</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {pontos} pontos
            </div>
          </div>
          
          {avaliacoes.length > 0 && (
            <div className="flex items-center justify-between text-xs text-white/80 pt-2 border-t border-white/20">
              <span>Média de avaliação:</span>
              <div className="flex items-center gap-2">
                {renderStars(Math.round(avaliacoes.reduce((acc, av) => acc + (av.nota || av.estrelas || 0), 0) / avaliacoes.length))}
                <span className="font-semibold text-white">
                  {(avaliacoes.reduce((acc, av) => acc + (av.nota || av.estrelas || 0), 0) / avaliacoes.length).toFixed(1)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetalhesAvaliacoesModal;
