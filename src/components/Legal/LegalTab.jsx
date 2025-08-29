import React, { useState } from 'react';
import { Shield, FileText, Activity, UserCheck, Database, Clock } from 'lucide-react';
import TermosResponsabilidadeList from './TermosResponsabilidadeList';
import AuditLogViewer from './AuditLogViewer';
import LGPDConsent from './LGPDConsent';
import DataRetentionPanel from './DataRetentionPanel';
import ComplianceReport from './ComplianceReport';

const LegalTab = ({ usuario }) => {
  const [activeSubTab, setActiveSubTab] = useState('termos');

  const subTabs = [
    { id: 'termos', label: 'Termos', icon: FileText },
    { id: 'audit', label: 'Auditoria', icon: Activity },
    { id: 'lgpd', label: 'LGPD', icon: Shield },
    { id: 'retention', label: 'Retenção', icon: Clock },
    { id: 'compliance', label: 'Compliance', icon: UserCheck }
  ];

  return (
    <div className="bg-[#192734] rounded-2xl shadow-sm p-6 border border-[#38444D]">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">Gestão Legal</h2>
        <p className="text-[#8899A6]">Gerenciamento de documentos legais e conformidade</p>
      </div>

      <div className="flex space-x-4 mb-6 border-b border-[#38444D]">
        {subTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={"flex items-center px-4 py-2 " + (
              activeSubTab === tab.id
                ? "text-[#1DA1F2] border-b-2 border-[#1DA1F2]"
                : "text-[#8899A6] hover:text-white"
            )}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {activeSubTab === 'termos' && <TermosResponsabilidadeList usuario={usuario} />}
        {activeSubTab === 'audit' && <AuditLogViewer usuario={usuario} />}
        {activeSubTab === 'lgpd' && <LGPDConsent usuario={usuario} />}
        {activeSubTab === 'retention' && <DataRetentionPanel usuario={usuario} />}
        {activeSubTab === 'compliance' && <ComplianceReport usuario={usuario} />}
      </div>
    </div>
  );
};

export default LegalTab;
