import React, { useState, useEffect } from 'react';
import { lgpdService } from '../../services/lgpdService';
import { LGPD_PURPOSES } from '../../constants/lgpd';
import { Shield, CheckCircle, AlertTriangle, Download, Trash2 } from 'lucide-react';

const LGPDConsent = ({ usuario }) => {
  const [consentStatus, setConsentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestingData, setRequestingData] = useState(false);

  useEffect(() => {
    loadConsentStatus();
  }, [usuario.id]);

  const loadConsentStatus = async () => {
    try {
      const status = await lgpdService.getConsentStatus(usuario.id);
      setConsentStatus(status);
    } catch (error) {
      console.error('Erro ao carregar status de consentimento:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleConsent = async (purpose) => {
    try {
      const newPurposes = consentStatus.purposes.includes(purpose)
        ? consentStatus.purposes.filter(p => p !== purpose)
        : [...consentStatus.purposes, purpose];
      
      await lgpdService.updateConsent(usuario.id, newPurposes);
      await loadConsentStatus();
    } catch (error) {
      console.error('Erro ao atualizar consentimento:', error);
    }
  };

  const handleRequestData = async () => {
    setRequestingData(true);
    try {
      await lgpdService.requestDataAccess(usuario.id);
      alert('Sua solicitação foi registrada. Você receberá os dados em até 15 dias úteis.');
    } catch (error) {
      console.error('Erro ao solicitar dados:', error);
      alert('Erro ao processar sua solicitação. Tente novamente mais tarde.');
    } finally {
      setRequestingData(false);
    }
  };

  const handleRequestDeletion = async () => {
    const shouldProceed = window.confirm('Tem certeza que deseja solicitar a exclusão dos seus dados? Esta ação não pode ser desfeita.');
    if (!shouldProceed) {
      return;
    }

    try {
      await lgpdService.requestDataDeletion(usuario.id);
      alert('Sua solicitação de exclusão foi registrada. Processaremos em até 15 dias úteis.');
    } catch (error) {
      console.error('Erro ao solicitar exclusão:', error);
      alert('Erro ao processar sua solicitação. Tente novamente mais tarde.');
    }
  };

  if (loading) {
    return <div className="text-[#8899A6]">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#22303C] p-6 rounded-lg border border-[#38444D]">
        <h3 className="text-lg text-white mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-[#1DA1F2]" />
          Seus Consentimentos
        </h3>

        <div className="space-y-4">
          {Object.values(LGPD_PURPOSES).map(purpose => (
            <div key={purpose} className="flex items-center justify-between">
              <div>
                <p className="text-white">{purpose.replace('_', ' ').toUpperCase()}</p>
                <p className="text-sm text-[#8899A6]">
                  {getPurposeDescription(purpose)}
                </p>
              </div>
              <button
                onClick={() => handleToggleConsent(purpose)}
                className={`p-2 rounded ${
                  consentStatus?.purposes?.includes(purpose)
                    ? 'bg-[#1DA1F2] text-white'
                    : 'bg-[#38444D] text-[#8899A6]'
                }`}
              >
                <CheckCircle className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleRequestData}
          disabled={requestingData}
          className="flex items-center justify-center space-x-2 p-4 bg-[#22303C] rounded-lg border border-[#38444D] text-white hover:bg-[#2C3E50]"
        >
          <Download className="w-5 h-5" />
          <span>Solicitar Meus Dados</span>
        </button>

        <button
          onClick={handleRequestDeletion}
          className="flex items-center justify-center space-x-2 p-4 bg-[#22303C] rounded-lg border border-[#38444D] text-[#FF5555] hover:bg-[#2C3E50]"
        >
          <Trash2 className="w-5 h-5" />
          <span>Solicitar Exclusão</span>
        </button>
      </div>
    </div>
  );
};

const getPurposeDescription = (purpose) => {
  const descriptions = {
    [LGPD_PURPOSES.INVENTORY_MANAGEMENT]: 'Gerenciamento de inventário e controle de ativos',
    [LGPD_PURPOSES.EMPLOYEE_TRACKING]: 'Registro de empréstimos e devoluções',
    [LGPD_PURPOSES.TOOL_LENDING]: 'Histórico de uso de ferramentas',
    [LGPD_PURPOSES.MAINTENANCE_HISTORY]: 'Registro de manutenções e ocorrências'
  };
  return descriptions[purpose] || purpose;
};

export default LGPDConsent;
