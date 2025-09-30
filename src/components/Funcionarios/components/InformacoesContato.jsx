import React from 'react';
import { Phone } from 'lucide-react';

const formatarTelefone = (telefone) => {
  const cleaned = telefone.replace(/\D/g, '');
  let match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return telefone;
};

const InformacoesContato = ({ funcionario }) => {
  return (
    <div className="space-y-2 pt-3 border-t border-[#38444D]">
      {funcionario.setor && (
        <div className="flex items-center gap-2 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#8899A6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m4 0v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" />
          </svg>
          <span className="text-[#8899A6]">{funcionario.setor}</span>
        </div>
      )}
      {funcionario.email && (
        <div className="flex items-center gap-2 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#8899A6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          <span className="text-[#8899A6] truncate">{funcionario.email}</span>
        </div>
      )}
      {funcionario.telefone && (
        <div className="flex items-center gap-2 text-sm bg-[#253341] rounded-xl p-3">
          <div className="w-8 h-8 rounded-lg bg-[#1DA1F2]/10 flex items-center justify-center">
            <Phone className="w-4 h-4 text-[#1DA1F2]" />
          </div>
          <div>
            <span className="text-[#8899A6] text-xs">Telefone</span>
            <p className="text-white font-medium">{formatarTelefone(funcionario.telefone)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InformacoesContato;