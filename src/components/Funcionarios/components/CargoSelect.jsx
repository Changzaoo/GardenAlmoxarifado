import React, { useState, useEffect } from 'react';
import { Plus, X, Check, Edit2 } from 'lucide-react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

const CargoSelect = ({ value, onChange, className }) => {
  const [cargos, setCargos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [novoCargo, setNovoCargo] = useState('');
  const [editingCargo, setEditingCargo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Carregar cargos do Firestore
  useEffect(() => {
    const fetchCargos = async () => {
      try {
        const cargosRef = collection(db, 'cargos');
        const snapshot = await getDocs(cargosRef);
        const cargosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCargos(cargosData);
      } catch (error) {
        console.error('Erro ao carregar cargos:', error);
      }
    };

    fetchCargos();
  }, []);

  // Adicionar novo cargo
  const handleAddCargo = async () => {
    if (!novoCargo.trim()) return;

    try {
      const cargosRef = collection(db, 'cargos');
      const docRef = await addDoc(cargosRef, {
        nome: novoCargo,
        createdAt: new Date().toISOString()
      });

      setCargos(prev => [...prev, { id: docRef.id, nome: novoCargo }]);
      setNovoCargo('');
    } catch (error) {
      console.error('Erro ao adicionar cargo:', error);
    }
  };

  // Editar cargo existente
  const handleEditCargo = async () => {
    if (!editingCargo || !novoCargo.trim()) return;

    try {
      const cargoRef = doc(db, 'cargos', editingCargo.id);
      await updateDoc(cargoRef, {
        nome: novoCargo,
        updatedAt: new Date().toISOString()
      });

      setCargos(prev => prev.map(cargo => 
        cargo.id === editingCargo.id ? { ...cargo, nome: novoCargo } : cargo
      ));
      
      setEditingCargo(null);
      setNovoCargo('');
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao editar cargo:', error);
    }
  };

  // Excluir cargo
  const handleDeleteCargo = async (cargoId) => {
    if (!window.confirm('Tem certeza que deseja excluir este cargo?')) return;

    try {
      await deleteDoc(doc(db, 'cargos', cargoId));
      setCargos(prev => prev.filter(cargo => cargo.id !== cargoId));
    } catch (error) {
      console.error('Erro ao excluir cargo:', error);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={`bg-[#253341] text-white rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] ${className}`}
        >
          <option value="">Selecione um cargo</option>
          {cargos.map(cargo => (
            <option key={cargo.id} value={cargo.nome}>
              {cargo.nome}
            </option>
          ))}
        </select>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#253341] p-2 rounded-lg hover:bg-[#2C3E50] transition-colors"
          title="Gerenciar cargos"
        >
          <Plus className="w-5 h-5 text-[#1DA1F2]" />
        </button>
      </div>

      {/* Modal de Gerenciamento de Cargos */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#192734] rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Gerenciar Cargos</h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingCargo(null);
                  setNovoCargo('');
                  setIsEditing(false);
                }}
                className="text-[#8899A6] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={novoCargo}
                  onChange={(e) => setNovoCargo(e.target.value)}
                  placeholder={isEditing ? "Editar cargo" : "Novo cargo"}
                  className="flex-1 bg-[#253341] text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]"
                />
                <button
                  onClick={isEditing ? handleEditCargo : handleAddCargo}
                  disabled={!novoCargo.trim()}
                  className="bg-[#1DA1F2] text-white px-4 py-2 rounded-lg hover:bg-[#1A91DA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEditing ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {cargos.map(cargo => (
                <div
                  key={cargo.id}
                  className="flex items-center justify-between bg-[#253341] p-3 rounded-lg"
                >
                  <span className="text-white">{cargo.nome}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingCargo(cargo);
                        setNovoCargo(cargo.nome);
                        setIsEditing(true);
                      }}
                      className="text-[#1DA1F2] hover:text-[#1A91DA] transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCargo(cargo.id)}
                      className="text-red-500 hover:text-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CargoSelect;