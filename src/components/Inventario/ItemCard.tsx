import React, { useState, useMemo } from 'react';
import { Trash2, Pencil, AlertCircle, CheckCircle2, AlertTriangle, AlertOctagon, XCircle } from 'lucide-react';

const ItemCard = ({ item, onRemover, onEditar, detalhesEmprestimos, ferramentasDanificadas = [], ferramentasPerdidas = [] }) => {
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  
  // Calcular valores de perdas e danos para este item
  const descontos = useMemo(() => {
    const itemNormalized = item.nome.toLowerCase().trim();
    
    // Somar valores de ferramentas danificadas
    const valorDanificadas = ferramentasDanificadas
      .filter(f => f.nomeItem && f.nomeItem.toLowerCase().trim() === itemNormalized)
      .reduce((total, f) => total + (parseFloat(f.valorEstimado) || 0), 0);
    
    // Somar valores de ferramentas perdidas
    const valorPerdidas = ferramentasPerdidas
      .filter(f => f.nomeItem && f.nomeItem.toLowerCase().trim() === itemNormalized)
      .reduce((total, f) => total + (parseFloat(f.valorEstimado) || 0), 0);
    
    // Contar quantidades
    const qtdDanificadas = ferramentasDanificadas
      .filter(f => f.nomeItem && f.nomeItem.toLowerCase().trim() === itemNormalized)
      .length;
      
    const qtdPerdidas = ferramentasPerdidas
      .filter(f => f.nomeItem && f.nomeItem.toLowerCase().trim() === itemNormalized)
      .length;
    
    return {
      valorDanificadas,
      valorPerdidas,
      valorTotal: valorDanificadas + valorPerdidas,
      qtdDanificadas,
      qtdPerdidas,
      temDescontos: valorDanificadas > 0 || valorPerdidas > 0
    };
  }, [item.nome, ferramentasDanificadas, ferramentasPerdidas]);
  
  const getStatusInfo = () => {
    if (item.disponivel === 0) {
      return {
        icon: <AlertCircle className="w-3 h-3 mr-1" />,
        text: 'Indisponível',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800'
      };
    }
    if (item.disponivel < item.quantidade * 0.3) {
      return {
        icon: <AlertTriangle className="w-3 h-3 mr-1" />,
        text: 'Estoque Baixo',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800'
      };
    }
    return {
      icon: <CheckCircle2 className="w-3 h-3 mr-1" />,
      text: 'Disponível',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800'
    };
  };

  const statusInfo = getStatusInfo();
  
  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="p-4">
        {/* Cabeçalho do Card */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {item.nome}
            </h3>
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
              {statusInfo.icon}
              {statusInfo.text}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEditar(item)}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onRemover(item.id)}
              className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Informações do Item */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
            <span>Categoria</span>
            <span className="font-medium">{item.categoria}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
            <span>Total</span>
            <span className="font-medium">{item.quantidade}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
            <span>Disponível</span>
            <span className="font-medium">
              {item.disponivel} ({Math.round((item.disponivel / item.quantidade) * 100)}%)
            </span>
          </div>
          {item.valorUnitario && parseFloat(item.valorUnitario) > 0 && (
            <>
              <div className="h-px bg-gray-200 dark:bg-gray-600 my-2"></div>
              <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
                <span>Valor Unitário</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {parseFloat(item.valorUnitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold text-gray-800 dark:text-gray-200">
                <span>Valor Total Bruto</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {(parseFloat(item.valorUnitario) * parseInt(item.quantidade)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              
              {/* Descontos de Danificadas e Perdidas */}
              {descontos.temDescontos && (
                <>
                  {descontos.valorDanificadas > 0 && (
                    <div className="flex justify-between items-center text-sm text-orange-600 dark:text-orange-400">
                      <span className="flex items-center gap-1">
                        <AlertOctagon className="w-3 h-3" />
                        Danificadas ({descontos.qtdDanificadas})
                      </span>
                      <span className="font-medium">
                        - {descontos.valorDanificadas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  )}
                  
                  {descontos.valorPerdidas > 0 && (
                    <div className="flex justify-between items-center text-sm text-red-600 dark:text-red-400">
                      <span className="flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        Perdidas ({descontos.qtdPerdidas})
                      </span>
                      <span className="font-medium">
                        - {descontos.valorPerdidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  )}
                  
                  <div className="h-px bg-gray-300 dark:bg-gray-600 my-1"></div>
                  
                  <div className="flex justify-between items-center text-sm font-bold text-gray-900 dark:text-white">
                    <span>Valor Total Líquido</span>
                    <span className="text-green-600 dark:text-green-400">
                      {((parseFloat(item.valorUnitario) * parseInt(item.quantidade)) - descontos.valorTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </>
              )}
              
              {!descontos.temDescontos && (
                <div className="flex justify-between items-center text-sm font-bold text-gray-900 dark:text-white">
                  <span>Valor Total Líquido</span>
                  <span className="text-green-600 dark:text-green-400">
                    {(parseFloat(item.valorUnitario) * parseInt(item.quantidade)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Barra de Progresso */}
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-4">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              item.disponivel === 0
                ? 'bg-red-500'
                : item.disponivel < item.quantidade * 0.3
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.round((item.disponivel / item.quantidade) * 100)}%` }}
          />
        </div>

        {/* Detalhes de Empréstimos */}
        {detalhesEmprestimos && detalhesEmprestimos.length > 0 && (
          <div>
            <button
              onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
              className="w-full text-left text-sm font-medium text-[#1D9BF0] hover:text-[#1A8CD8] dark:text-blue-400 dark:hover:text-blue-300 mb-2"
            >
              {mostrarDetalhes ? 'Ocultar detalhes' : `Ver ${detalhesEmprestimos.length} empréstimo(s)`}
            </button>
            
            {mostrarDetalhes && (
              <div className="mt-2 space-y-2">
                {detalhesEmprestimos.map((emp, index) => (
                  <div
                    key={index}
                    className="text-xs p-2 rounded bg-gray-50 dark:bg-gray-600/50 border border-gray-100 dark:border-gray-600"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {emp.nomeFuncionario || emp.funcionario || emp.colaborador}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      Desde {emp.dataEmprestimo ? new Date(emp.dataEmprestimo).toLocaleDateString('pt-BR') : 'Data não disponível'}
                      {emp.horaEmprestimo ? ` às ${emp.horaEmprestimo}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemCard;
