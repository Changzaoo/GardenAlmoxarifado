import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { formatarData } from '../../utils/dateUtils';
import { ArrowRight, ToolCase } from 'lucide-react';
import { useToast } from '../ToastProvider';

const TransferirFerramenta = ({ emprestimo, funcionarios, onClose }) => {
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const { showToast } = useToast();

  // Filtra funcionários, removendo o atual responsável
  const funcionariosDisponiveis = funcionarios?.filter(f => 
    f.id !== emprestimo.funcionarioId
  ) || [];

  const handleTransferir = async () => {
    if (!funcionarioSelecionado) {
      showToast('Selecione um funcionário para transferir', 'warning');
      return;
    }

    if (!confirmado) {
      showToast('Você precisa confirmar a responsabilidade pela entrega das ferramentas', 'warning');
      return;
    }

    setLoading(true);
    try {
      // Validações iniciais
      if (!emprestimo?.id || !emprestimo?.funcionarioId) {
        throw new Error('Dados do empréstimo incompletos');
      }

      // Encontrar funcionário de destino
      const funcionarioDestino = funcionarios.find(f => f.id === funcionarioSelecionado);
      if (!funcionarioDestino?.nome) {
        throw new Error('Funcionário de destino não encontrado');
      }

      console.log('Transferindo para:', funcionarioDestino.nome);

      // Atualizar o empréstimo com o novo funcionário
      const emprestimoRef = doc(db, 'emprestimos', emprestimo.id);
      const agora = new Date();
      const dataTransferencia = agora.toISOString();
      const horaTransferencia = agora.toTimeString().split(' ')[0];
      
      await updateDoc(emprestimoRef, {
        funcionarioId: String(funcionarioSelecionado),
        colaborador: funcionarioDestino.nome,
        dataUltimaTransferencia: dataTransferencia,
        // Atualizar a data e hora de retirada para a data da transferência
        dataRetirada: dataTransferencia.split('T')[0], // apenas a data
        horaRetirada: horaTransferencia,
        historicoTransferencias: [
          ...(emprestimo.historicoTransferencias || []),
          {
            data: dataTransferencia,
            de: emprestimo.colaborador,
            para: funcionarioDestino.nome,
            deId: String(emprestimo.funcionarioId),
            paraId: String(funcionarioSelecionado)
          }
        ]
      });

      showToast('Ferramenta(s) transferida(s) com sucesso!', 'success');
      onClose();
    } catch (error) {
      console.error('Erro ao transferir:', error);
      let mensagem = 'Erro ao transferir. ';
      if (error.message === 'Funcionário de destino não encontrado') {
        mensagem += 'Funcionário não encontrado.';
      } else if (error.message === 'Dados do empréstimo incompletos') {
        mensagem += 'Dados do empréstimo inválidos.';
      } else {
        mensagem += 'Tente novamente.';
      }
      showToast(mensagem, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        {/* Cabeçalho */}
        <div className="bg-gray-50 px-6 py-4 rounded-t-lg border-b">
          <h3 className="text-lg font-semibold text-gray-900">Transferir Ferramentas</h3>
          <p className="text-sm text-gray-600 mt-1">
            Selecione o funcionário e confirme a transferência das ferramentas
          </p>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-6">
          {/* Ferramentas */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Ferramentas a transferir:</h4>
            <div className="bg-gray-50 border border-gray-200 rounded-lg divide-y divide-gray-200">
              {emprestimo.ferramentas.map((ferramenta, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ToolCase className="w-5 h-5 text-gray-400" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {typeof ferramenta === 'string' ? ferramenta : ferramenta.nome}
                      </span>
                      {typeof ferramenta !== 'string' && ferramenta.codigo && (
                        <span className="ml-2 text-xs text-gray-500">
                          Código: {ferramenta.codigo}
                        </span>
                      )}
                    </div>
                  </div>
                  {typeof ferramenta !== 'string' && ferramenta.quantidade > 1 && (
                    <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      Qtd: {ferramenta.quantidade}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Seleção de Funcionário */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecione o funcionário para receber as ferramentas:
            </label>
            <select
              value={funcionarioSelecionado}
              onChange={(e) => setFuncionarioSelecionado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">Selecione um funcionário</option>
              {funcionariosDisponiveis.map((funcionario) => (
                <option key={funcionario.id} value={funcionario.id}>
                  {funcionario.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Checkbox de confirmação */}
          <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmado}
                onChange={(e) => setConfirmado(e.target.checked)}
                className="mt-1 h-4 w-4 text-green-600 border-yellow-400 rounded focus:ring-green-500"
              />
              <div className="space-y-1">
                <span className="text-sm font-medium text-yellow-800 block">
                  Termo de Responsabilidade
                </span>
                <span className="text-sm text-yellow-700">
                  Confirmo que me responsabilizo pela entrega física das ferramentas ao colaborador selecionado 
                  e que manterei o sistema atualizado com a localização real das ferramentas. Entendo que esta 
                  transferência registrará a mudança de responsabilidade no sistema imediatamente.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Rodapé com botões */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleTransferir}
            disabled={loading || !funcionarioSelecionado || !confirmado}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            {loading ? 'Transferindo...' : 'Confirmar Transferência'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferirFerramenta;
