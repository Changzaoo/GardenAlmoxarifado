import React from 'react';
import { Users, Camera, X } from 'lucide-react';

const formatarTelefone = (telefone) => {
  const cleaned = telefone.replace(/\D/g, '');
  let match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return telefone;
};

const ModalEditar = ({
  editando,
  formEdit,
  setFormEdit,
  handleSalvarEdicao,
  setEditando,
  preview,
  setPreview,
  fileInputRef,
  loading
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#192734] rounded-2xl max-w-md w-full mx-4 p-6 border border-[#38444D]">
        <h3 className="text-xl font-semibold text-white mb-6">Editar Funcionário</h3>
        <div className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="relative">
              {preview ? (
                <div className="relative">
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="w-32 h-32 rounded-full object-cover border-4 border-[#38444D]"
                    onError={(e) => {
                      e.target.onerror = null;
                      setPreview(null);
                      setFormEdit(prev => ({ ...prev, photoURL: '' }));
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setPreview(null);
                      setFormEdit(prev => ({
                        ...prev,
                        photoURL: '',
                      }));
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    title="Remover imagem"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-[#253341] flex items-center justify-center border-4 border-[#38444D]">
                  <Users className="w-16 h-16 text-[#8899A6]" />
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-[#1DA1F2] text-white rounded-full p-2.5 hover:bg-[#1a91da] transition-colors"
              >
                <Camera className="w-5 h-5" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setPreview(reader.result);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-[#8899A6]">URL da Imagem</p>
            <input
              type="url"
              placeholder="https://exemplo.com/imagem.jpg"
              value={formEdit.photoURL || ''}
              onChange={e => {
                const url = e.target.value.trim();
                setFormEdit(prev => ({ ...prev, photoURL: url }));
                setPreview(url || null);
              }}
              className="w-full px-4 py-2 rounded-lg text-sm bg-[#253341] border border-[#38444D] text-white placeholder-[#8899A6] focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]"
            />
            <p className="text-xs text-[#8899A6]">ou</p>
          </div>

          <input
            type="text"
            placeholder="Nome"
            value={formEdit.nome}
            onChange={e => setFormEdit({ ...formEdit, nome: e.target.value })}
            className="w-full px-4 py-2 rounded-lg text-sm bg-[#253341] border border-[#38444D] text-white placeholder-[#8899A6] focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]"
          />
          <input
            type="text"
            placeholder="Cargo"
            value={formEdit.cargo}
            onChange={e => setFormEdit({ ...formEdit, cargo: e.target.value })}
            className="w-full px-4 py-2 rounded-lg text-sm bg-[#253341] border border-[#38444D] text-white placeholder-[#8899A6] focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]"
          />
          <input
            type="text"
            placeholder="(00) 00000-0000"
            value={formEdit.telefone ? formatarTelefone(formEdit.telefone) : ''}
            onChange={e => setFormEdit({ ...formEdit, telefone: e.target.value.replace(/[^0-9]/g, '') })}
            className="w-full px-4 py-2 rounded-lg text-sm bg-[#253341] border border-[#38444D] text-white placeholder-[#8899A6] focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]"
            maxLength={15}
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setEditando(null)}
            className="px-4 py-2 text-[#8899A6] bg-[#253341] hover:bg-[#192734] rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleSalvarEdicao(formEdit)}
            className="px-4 py-2 bg-[#1DA1F2] hover:bg-[#1a91da] text-white rounded-lg transition-colors"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalEditar;