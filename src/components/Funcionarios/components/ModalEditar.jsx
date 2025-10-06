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
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full mx-4 p-6 border border-gray-200 dark:border-gray-600">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Editar Funcionário</h3>
        <div className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="relative">
              {preview ? (
                <div className="relative">
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600"
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
                    className="absolute -top-2 -right-2 bg-red-500 text-gray-900 dark:text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    title="Remover imagem"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center border-4 border-gray-200 dark:border-gray-600">
                  <Users className="w-16 h-16 text-gray-500 dark:text-gray-400" />
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-blue-500 dark:bg-[#1D9BF0] text-gray-900 dark:text-white rounded-full p-2.5 hover:bg-blue-600 dark:hover:bg-[#1a8cd8] transition-colors"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL da Imagem
            </label>
            <input
              type="url"
              placeholder="https://exemplo.com/imagem.jpg"
              value={formEdit.photoURL || ''}
              onChange={e => {
                const url = e.target.value.trim();
                setFormEdit(prev => ({ ...prev, photoURL: url }));
                setPreview(url || null);
              }}
              className="w-full px-4 py-2 rounded-lg text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0]"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">ou faça upload usando o botão da câmera</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: João da Silva"
              value={formEdit.nome}
              onChange={e => setFormEdit({ ...formEdit, nome: e.target.value })}
              className="w-full px-4 py-2 rounded-lg text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0]"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cargo
            </label>
            <input
              type="text"
              placeholder="Ex: Jardineiro, Gerente, etc."
              value={formEdit.cargo}
              onChange={e => setFormEdit({ ...formEdit, cargo: e.target.value })}
              className="w-full px-4 py-2 rounded-lg text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0]"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Telefone/WhatsApp
            </label>
            <input
              type="text"
              placeholder="(00) 00000-0000"
              value={formEdit.telefone ? formatarTelefone(formEdit.telefone) : ''}
              onChange={e => setFormEdit({ ...formEdit, telefone: e.target.value.replace(/[^0-9]/g, '') })}
              className="w-full px-4 py-2 rounded-lg text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0]"
              maxLength={15}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setEditando(null)}
            className="px-4 py-2 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleSalvarEdicao(formEdit)}
            className="px-4 py-2 bg-blue-500 dark:bg-[#1D9BF0] hover:bg-blue-600 dark:hover:bg-[#1a8cd8] text-gray-900 dark:text-white rounded-lg transition-colors"
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




