import React, { useState } from 'react';
import { Plus } from 'lucide-react';

const formatarTelefone = (telefone) => {
  const cleaned = telefone.replace(/\D/g, '');
  let match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return telefone;
};

const FormularioAdicao = ({ onSubmit, loading, formatarTelefone }) => {
  const [dados, setDados] = useState({ nome: '', cargo: '', telefone: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(dados);
    setDados({ nome: '', cargo: '', telefone: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        placeholder="Nome"
        value={dados.nome}
        onChange={e => setDados({ ...dados, nome: e.target.value })}
        className="px-4 py-2 rounded-lg text-sm bg-[#192734] border border-[#38444D] text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] w-36"
        required
      />
      <input
        type="text"
        placeholder="Cargo"
        value={dados.cargo}
        onChange={e => setDados({ ...dados, cargo: e.target.value })}
        className="px-4 py-2 rounded-lg text-sm bg-[#192734] border border-[#38444D] text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] w-36"
        required
      />
      <input
        type="text"
        placeholder="(00) 00000-0000"
        value={dados.telefone ? formatarTelefone(dados.telefone) : ''}
        onChange={e => {
          const onlyNums = e.target.value.replace(/[^0-9]/g, '');
          setDados({ ...dados, telefone: onlyNums });
        }}
        className="px-4 py-2 rounded-lg text-sm bg-[#192734] border border-[#38444D] text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] w-36"
        required
        maxLength={15}
      />
      <button 
        type="submit" 
        className="flex items-center gap-2 px-4 py-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1a91da] transition-colors text-sm" 
        disabled={loading}
      >
        <Plus className="w-3 h-3" /> Adicionar
      </button>
    </form>
  );
};

export default FormularioAdicao;