import React, { useState } from 'react';
import { legalDocumentService } from '../../services/legalDocumentService';
import { auditService } from '../../services/auditService';

const TermoResponsabilidade = ({ items, usuario, onSign, onCancel }) => {
  const [assinatura, setAssinatura] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSign = async () => {
    if (!assinatura) {
      alert('Por favor, insira sua assinatura');
      return;
    }

    setLoading(true);
    try {
      // Criar termo de responsabilidade
      const termId = await legalDocumentService.createTermOfResponsibility(
        usuario.id,
        items,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
      );

      // Assinar o documento
      await legalDocumentService.signDocument(termId, usuario.id, assinatura);

      // Registrar na auditoria
      await auditService.logOperation({
        userId: usuario.id,
        operation: 'sign_responsibility_term',
        category: 'legal_documents',
        details: 'Term of responsibility signed',
        affectedItems: items.map(item => item.id),
        ipAddress: await legalDocumentService.getClientIP()
      });

      onSign(termId);
    } catch (error) {
      console.error('Erro ao assinar termo:', error);
      alert('Erro ao processar assinatura. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Termo de Responsabilidade</h2>
      
      <div className="mb-6">
        <p className="text-gray-700 mb-4">
          Eu, {usuario.nome}, portador do documento {usuario.documento}, 
          declaro que recebi os itens abaixo relacionados, pelos quais assumo 
          total responsabilidade quanto ao uso, guarda e conservação.
        </p>

        <div className="bg-gray-50 p-4 rounded mb-4">
          <h3 className="font-semibold mb-2">Itens sob responsabilidade:</h3>
          <ul className="list-disc pl-5">
            {items.map((item, index) => (
              <li key={index} className="text-gray-600">
                {item.nome} {item.quantidade > 1 ? `(${item.quantidade} unidades)` : ''}
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Condições:</h3>
          <ol className="list-decimal pl-5 text-gray-600">
            <li>Comprometo-me a devolver os itens nas mesmas condições em que os recebi</li>
            <li>Em caso de dano ou perda, comunicarei imediatamente ao responsável</li>
            <li>Não transferirei a posse dos itens sem prévia autorização</li>
            <li>Utilizarei os itens apenas para fins profissionais</li>
          </ol>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Assinatura Digital:</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="Digite seu nome completo como assinatura"
            value={assinatura}
            onChange={(e) => setAssinatura(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSign}
            className="px-4 py-2 bg-blue-600 text-gray-900 dark:text-white rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Processando...' : 'Assinar e Aceitar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermoResponsabilidade;

