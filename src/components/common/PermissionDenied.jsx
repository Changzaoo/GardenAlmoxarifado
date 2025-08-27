import React from 'react';
import { Shield } from 'lucide-react';

const PermissionDenied = ({ message = 'Você não tem permissão para acessar este recurso.' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <Shield className="w-12 h-12 text-red-500 mb-4" />
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Acesso Negado</h2>
      <p className="text-gray-600 text-center">{message}</p>
    </div>
  );
};

export default PermissionDenied;
