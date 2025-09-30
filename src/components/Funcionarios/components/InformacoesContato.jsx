import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const formatarTelefone = (telefone) => {
  const cleaned = telefone.replace(/\D/g, '');
  let match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return telefone;
};

const getWhatsAppLink = (telefone) => {
  const numero = telefone.replace(/\D/g, '');
  return `https://wa.me/55${numero}`;
};

const InformacoesContato = ({ funcionario }) => {
  const [copiado, setCopiado] = useState(false);

  const copiarTelefone = async (telefone) => {
    try {
      await navigator.clipboard.writeText(telefone);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };
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
          <a
            href={getWhatsAppLink(funcionario.telefone)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center hover:bg-green-500/20 transition-colors"
            title="Abrir conversa no WhatsApp"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-5 h-5">
              <path fill="#25D366" d="M256.064,0h-0.128C114.784,0,0,114.816,0,256c0,56,18.048,107.904,48.736,150.048l-31.904,95.104  l98.4-31.456C155.712,496.512,204,512,256.064,512C397.216,512,512,397.152,512,256S397.216,0,256.064,0z"/>
              <path fill="#FFFFFF" d="M405.024,361.504c-6.176,17.44-30.688,31.904-50.24,36.128c-13.376,2.848-30.848,5.12-89.664-19.264  c-75.232-31.168-123.68-107.616-127.456-112.576c-3.616-4.96-30.4-40.48-30.4-77.216s18.656-54.624,26.176-62.304  c6.176-6.304,16.384-9.184,26.176-9.184c3.168,0,6.016,0.16,8.576,0.288c7.52,0.32,11.296,0.768,16.256,12.64  c6.176,14.88,21.216,51.616,23.008,55.392c1.824,3.776,3.648,8.896,1.088,13.856c-2.4,5.12-4.512,7.392-8.288,11.744  c-3.776,4.352-7.36,7.68-11.136,12.352c-3.456,4.064-7.36,8.416-3.008,15.936c4.352,7.36,19.392,31.904,41.536,51.616  c28.576,25.44,51.744,33.568,60.032,37.024c6.176,2.56,13.536,1.952,18.048-2.848c5.728-6.176,12.8-16.416,20-26.496  c5.12-7.232,11.584-8.128,18.368-5.568c6.912,2.4,43.488,20.48,51.008,24.224c7.52,3.776,12.48,5.568,14.304,8.736  C411.2,329.152,411.2,344.032,405.024,361.504z"/>
            </svg>
          </a>
          <div className="flex-1">
            <span className="text-[#8899A6] text-xs">WhatsApp</span>
            <p className="text-white font-medium">{formatarTelefone(funcionario.telefone)}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              copiarTelefone(funcionario.telefone);
            }}
            className="w-8 h-8 rounded-lg bg-[#1DA1F2]/10 flex items-center justify-center hover:bg-[#1DA1F2]/20 transition-colors"
            title="Copiar número"
          >
            {copiado ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-[#1DA1F2]" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default InformacoesContato;