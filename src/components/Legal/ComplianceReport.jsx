import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Clock, FileText, Shield } from 'lucide-react';
import { dataRetentionService } from '../../services/dataRetentionService';
import { auditService } from '../../services/auditService';
import { lgpdService } from '../../services/lgpdService';
import { legalDocumentService } from '../../services/legalDocumentService';

const ComplianceReport = ({ usuario }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    try {
      // Coletar dados de várias fontes
      const [
        auditLogs,
        consentStatus,
        documents,
        retentionStatus
      ] = await Promise.all([
        auditService.getOperationLogs({ limit: 1000 }),
        lgpdService.getConsentStatus(usuario.id),
        legalDocumentService.getDocumentStats(),
        dataRetentionService.getRetentionStats()
      ]);

      // Análise de conformidade
      const compliance = analyzeCompliance({
        auditLogs,
        consentStatus,
        documents,
        retentionStatus
      });

      setReport(compliance);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500 dark:text-gray-400">Gerando relatório...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 mb-6">
        <ComplianceCard
          title="LGPD"
          score={report.lgpdScore}
          items={report.lgpdItems}
          icon={Shield}
        />
        <ComplianceCard
          title="Documentação Legal"
          score={report.docsScore}
          items={report.docsItems}
          icon={FileText}
        />
        <ComplianceCard
          title="Auditoria"
          score={report.auditScore}
          items={report.auditItems}
          icon={CheckCircle}
        />
        <ComplianceCard
          title="Retenção de Dados"
          score={report.retentionScore}
          items={report.retentionItems}
          icon={Clock}
        />
      </div>

      <div className="bg-[#22303C] p-6 rounded-lg border border-gray-200 dark:border-gray-600 dark:border-gray-600">
        <h3 className="text-lg text-gray-900 dark:text-white mb-4">Recomendações</h3>
        <div className="space-y-3">
          {report.recommendations.map((rec, index) => (
            <div key={index} className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-[#FFD700] flex-shrink-0 mt-0.5" />
              <p className="text-gray-500 dark:text-gray-400">{rec}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ComplianceCard = ({ title, score, items, icon: Icon }) => (
  <div className="bg-[#22303C] p-4 rounded-lg border border-gray-200 dark:border-gray-600 dark:border-gray-600">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center">
        <Icon className="w-5 h-5 text-blue-500 dark:text-[#1D9BF0] mr-2" />
        <h4 className="text-white font-medium">{title}</h4>
      </div>
      <div className={`text-lg font-bold ${getScoreColor(score)}`}>
        {score}%
      </div>
    </div>
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center text-sm">
          {item.status ? (
            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-[#FFD700] mr-2" />
          )}
          <span className={item.status ? 'text-gray-500 dark:text-gray-400' : 'text-[#FFD700]'}>
            {item.text}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const getScoreColor = (score) => {
  if (score >= 90) return 'text-green-500';
  if (score >= 70) return 'text-[#FFD700]';
  return 'text-[#FF5555]';
};

const analyzeCompliance = ({ auditLogs, consentStatus, documents, retentionStatus }) => {
  // Implementar lógica de análise de conformidade aqui
  // Este é um exemplo simplificado
  return {
    lgpdScore: 85,
    lgpdItems: [
      { status: true, text: 'Consentimentos registrados' },
      { status: true, text: 'Política de privacidade atualizada' },
      { status: false, text: 'Revisar bases legais de processamento' }
    ],
    docsScore: 90,
    docsItems: [
      { status: true, text: 'Termos de responsabilidade digitais' },
      { status: true, text: 'Assinaturas criptografadas' },
      { status: true, text: 'Backup de documentos' }
    ],
    auditScore: 95,
    auditItems: [
      { status: true, text: 'Logs de auditoria ativos' },
      { status: true, text: 'Rastreamento de operações' },
      { status: true, text: 'Histórico de acessos' }
    ],
    retentionScore: 75,
    retentionItems: [
      { status: true, text: 'Política de retenção definida' },
      { status: false, text: 'Limpeza automática pendente' },
      { status: true, text: 'Backup antes da exclusão' }
    ],
    recommendations: [
      'Realizar limpeza de dados expirados',
      'Atualizar bases legais de processamento',
      'Revisar permissões de acesso aos dados'
    ]
  };
};

export default ComplianceReport;


