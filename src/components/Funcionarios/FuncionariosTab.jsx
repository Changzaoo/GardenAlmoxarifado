import React, { useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Users, Trash2, Plus, Edit, Camera } from 'lucide-react';
import { storage } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '../ToastProvider';
import FuncionarioProfile from './FuncionarioProfile';

const FuncionariosTab = ({ funcionarios, adicionarFuncionario, removerFuncionario, atualizarFuncionario, readonly }) => {
  const [novoFuncionario, setNovoFuncionario] = useState({ nome: '', cargo: '', telefone: '' });
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({ nome: '', cargo: '', telefone: '', photoURL: '' });
  const [modalConfirmacao, setModalConfirmacao] = useState(false);
  const [funcionarioParaExcluir, setFuncionarioParaExcluir] = useState(null);
  const [preview, setPreview] = useState(null);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);
  const fileInputRef = useRef();
  const { usuario } = useAuth();
  const isFuncionario = usuario?.nivel === 'funcionario';

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);

      try {
        setLoading(true);
        const storageRef = ref(storage, `funcionarios/${editando?.id || Date.now()}`);
        const snapshot = await uploadBytes(storageRef, file);
        const photoURL = await getDownloadURL(snapshot.ref);
        setFormEdit(prev => ({ ...prev, photoURL }));
        
        if (editando) {
          await atualizarFuncionario(editando.id, { ...formEdit, photoURL });
        }
      } catch (error) {
        console.error('Erro ao fazer upload da imagem:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditar = (func) => {
    setEditando(func);
    setFormEdit({ nome: func.nome, cargo: func.cargo, telefone: func.telefone, photoURL: func.photoURL });
    setPreview(func.photoURL);
  };

  const handleAdicionar = async (e) => {
    e.preventDefault();
    setLoading(true);
    await adicionarFuncionario({
      ...novoFuncionario,
      photoURL: formEdit.photoURL
    });
    setNovoFuncionario({ nome: '', cargo: '', telefone: '' });
    setFormEdit(prev => ({ ...prev, photoURL: '' }));
    setPreview(null);
    setLoading(false);
  };

  const handleSalvarEdicao = async () => {
    setLoading(true);
    await atualizarFuncionario(editando.id, {
      ...formEdit,
      photoURL: formEdit.photoURL || editando.photoURL
    });
    setEditando(null);
    setPreview(null);
    setLoading(false);
  };

  const confirmarExclusao = (funcionario) => {
    setFuncionarioParaExcluir(funcionario);
    setModalConfirmacao(true);
  };

  const handleRemover = async () => {
    try {
      setLoading(true);
      await removerFuncionario(funcionarioParaExcluir.id);
      setModalConfirmacao(false);
      setFuncionarioParaExcluir(null);
    } catch (error) {
      alert('Erro ao excluir funcionário: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#15202B] p-4 rounded-xl">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          {!isFuncionario && !readonly && (
            <form onSubmit={handleAdicionar} className="flex gap-2">
              <input
                type="text"
                placeholder="Nome"
                value={novoFuncionario.nome}
                onChange={e => setNovoFuncionario({ ...novoFuncionario, nome: e.target.value })}
                className="px-4 py-2 rounded-lg text-sm bg-[#192734] border border-[#38444D] text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] w-36"
                required
              />
              <input
                type="text"
                placeholder="Cargo"
                value={novoFuncionario.cargo}
                onChange={e => setNovoFuncionario({ ...novoFuncionario, cargo: e.target.value })}
                className="px-4 py-2 rounded-lg text-sm bg-[#192734] border border-[#38444D] text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] w-36"
                required
              />
              <input
                type="text"
                placeholder="Telefone"
                value={novoFuncionario.telefone}
                onChange={e => {
                  const onlyNums = e.target.value.replace(/[^0-9]/g, '');
                  setNovoFuncionario({ ...novoFuncionario, telefone: onlyNums });
                }}
                className="px-4 py-2 rounded-lg text-sm bg-[#192734] border border-[#38444D] text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] w-36"
                required
                maxLength={15}
              />
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1a91da] transition-colors text-sm" disabled={loading}>
                <Plus className="w-3 h-3" /> Adicionar
              </button>
            </form>
          )}
        </div>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {[...funcionarios].sort((a, b) => a.nome.localeCompare(b.nome)).map((func) => (
          <div 
            key={func.id} 
            className="bg-[#192734] p-4 rounded-xl border border-[#38444D] hover:border-[#1DA1F2] transition-colors cursor-pointer"
            onClick={() => setFuncionarioSelecionado(func)}
          >
            <div className="flex flex-col items-center">
              {func.photoURL ? (
                <img 
                  src={func.photoURL} 
                  alt={func.nome} 
                  className="w-20 h-20 rounded-full object-cover mb-3"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#253341] flex items-center justify-center mb-3">
                  <Users className="w-10 h-10 text-[#8899A6]" />
                </div>
              )}
              
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-1">{func.nome}</h3>
                <p className="text-sm text-[#8899A6] mb-1">{func.cargo}</p>
                <p className="text-sm text-[#8899A6] mb-3">{func.telefone}</p>
              </div>

              {!isFuncionario && !readonly && (
                <div className="flex gap-3 mt-2">
                  <button 
                    onClick={() => handleEditar(func)} 
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1a91da] transition-colors text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button 
                    onClick={() => confirmarExclusao(func)} 
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Perfil do Funcionário */}
      {funcionarioSelecionado && (
        <FuncionarioProfile
          funcionario={funcionarioSelecionado}
          onClose={() => setFuncionarioSelecionado(null)}
        />
      )}

      {!isFuncionario && editando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#192734] rounded-2xl max-w-md w-full mx-4 p-6 border border-[#38444D]">
            <h3 className="text-xl font-semibold text-white mb-6">Editar Funcionário</h3>
            <div className="space-y-4">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  {preview ? (
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="w-32 h-32 rounded-full object-cover border-4 border-[#38444D]"
                    />
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
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
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
                placeholder="Telefone"
                value={formEdit.telefone}
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
                onClick={handleSalvarEdicao}
                className="px-4 py-2 bg-[#1DA1F2] hover:bg-[#1a91da] text-white rounded-lg transition-colors"
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalConfirmacao && funcionarioParaExcluir && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#192734] rounded-2xl p-6 w-full max-w-md border border-[#38444D]">
            <h3 className="text-xl font-semibold text-white mb-4">
              Confirmar Exclusão
            </h3>
            <p className="text-sm text-[#8899A6] mb-4">
              Tem certeza que deseja excluir o funcionário "{funcionarioParaExcluir.nome}"?
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setModalConfirmacao(false);
                  setFuncionarioParaExcluir(null);
                }}
                className="px-4 py-2 text-sm text-[#8899A6] bg-[#253341] hover:bg-[#192734] rounded-lg transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleRemover}
                className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                disabled={loading}
              >
                {loading ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FuncionariosTab;
