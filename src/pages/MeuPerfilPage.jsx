import React, { useState } from 'react';
import { User, Clock, Calendar, LogIn, LogOut, Coffee, ArrowRightLeft } from 'lucide-react';
import WorkPontoTab from '../components/WorkPontoTab';

const MeuPerfilPage = () => {
  const [aba, setAba] = useState('perfil');

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex gap-2 mb-6">
        <button
          className={`px-4 py-2 rounded-t-lg font-semibold border-b-2 transition-all ${aba === 'perfil' ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-gray-500 bg-gray-100'}`}
          onClick={() => setAba('perfil')}
        >
          <User className="inline w-5 h-5 mr-1" /> Meu Perfil
        </button>
        <button
          className={`px-4 py-2 rounded-t-lg font-semibold border-b-2 transition-all ${aba === 'workponto' ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-gray-500 bg-gray-100'}`}
          onClick={() => setAba('workponto')}
        >
          <Clock className="inline w-5 h-5 mr-1" /> WorkPonto
        </button>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 min-h-[400px]">
        {aba === 'perfil' && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Meu Perfil</h2>
            {/* ...dados do perfil aqui... */}
            <p className="text-gray-500">Informações do usuário aqui.</p>
          </div>
        )}
        {aba === 'workponto' && <WorkPontoTab />}
      </div>
    </div>
  );
};

export default MeuPerfilPage;
