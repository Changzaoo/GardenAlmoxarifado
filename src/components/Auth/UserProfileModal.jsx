import React, { useState, useRef } from 'react';
import { User, Camera, Upload, Save, X } from 'lucide-react';
import { storage } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../ThemeProvider';
import { encryptData } from '../../utils/crypto';

const UserProfileModal = ({ isOpen, onClose, userId }) => {
  const { usuario, atualizarUsuario } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef();
  const videoRef = useRef();
  const [showCamera, setShowCamera] = useState(false);
  const canEdit = usuario?.id === userId;
  const [editMode, setEditMode] = useState(canEdit);

  const getInputClassName = () => `w-full px-3 py-2 rounded-lg border transition-colors ${
    theme === 'dark'
      ? editMode ? 'bg-gray-700 border-blue-500 text-white focus:ring-2 focus:ring-blue-500' 
                : 'bg-gray-700 border-gray-600 text-white'
      : editMode ? 'bg-white border-blue-500 text-gray-900 focus:ring-2 focus:ring-blue-500' 
                : 'bg-white border-gray-300 text-gray-900'
  }`;
  
  // Inicializa o estado do usuário
  const [userData, setUserData] = useState({
    nome: '',
    email: '',
    cargo: '',
    telefone: ''
  });

  // Atualiza os dados do usuário quando o modal é aberto
  React.useEffect(() => {
    if (isOpen && usuario) {
      // Reseta o estado com os dados atuais do usuário
      setUserData({
        nome: usuario.nome || '',
        email: usuario.email || '',
        cargo: usuario.cargo || '',
        telefone: usuario.telefone || ''
      });
      
      // Se o usuário pode editar, já inicia em modo de edição
      setEditMode(canEdit);
      
      // Reseta o preview da foto
      setPreview(null);
      setShowCamera(false);
    }
  }, [isOpen, usuario, canEdit]);

  const handleFileUpload = async (file) => {
    try {
      setLoading(true);
      const storageRef = ref(storage, `profile-photos/${usuario.id}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      
      // Encriptar a URL da foto antes de salvar
      const encryptedPhotoData = encryptData({ photoURL });
      
      await updateDoc(doc(db, 'usuarios', usuario.id), {
        photoURL: encryptedPhotoData
      });
      
      await atualizarUsuario();
      setPreview(null);
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setShowCamera(true);
    } catch (error) {
      console.error('Erro ao acessar a câmera:', error);
    }
  };

  const takePhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob(async (blob) => {
      await handleFileUpload(blob);
      stopCamera();
    }, 'image/jpeg');
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Validar os campos antes de salvar
      if (!userData.nome || !userData.email) {
        throw new Error('Nome e email são obrigatórios');
      }

      const dataToSave = {
        nome: userData.nome,
        email: userData.email.includes('@') ? userData.email : `${userData.email}@garden.com`,
        cargo: userData.cargo || '',
        telefone: userData.telefone || ''
      };

      // Encriptar e salvar os dados
      const encryptedData = encryptData(dataToSave);
      await updateDoc(doc(db, 'usuarios', usuario.id), encryptedData);
      
      // Atualizar o contexto do usuário e fechar o modo de edição
      await atualizarUsuario();
      setEditMode(false);
      
      // Opcional: feedback visual de sucesso
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      alert(error.message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`bg-${theme === 'dark' ? 'gray-800' : 'white'} rounded-lg shadow-xl max-w-md w-full p-6 relative`}>
        <button
          onClick={onClose}
          className={`absolute right-4 top-4 text-${theme === 'dark' ? 'gray-400' : 'gray-600'} hover:text-${theme === 'dark' ? 'gray-200' : 'gray-800'}`}
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            {showCamera ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  className="w-32 h-32 rounded-full object-cover"
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={takePhoto}
                    className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm"
                  >
                    Capturar
                  </button>
                  <button
                    onClick={stopCamera}
                    className="bg-red-500 text-white px-3 py-1 rounded-md text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : usuario?.photoURL ? (
                  <img
                    src={usuario.photoURL}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <div className={`w-32 h-32 rounded-full bg-${theme === 'dark' ? 'gray-700' : 'gray-200'} flex items-center justify-center`}>
                    <User size={48} className={`text-${theme === 'dark' ? 'gray-400' : 'gray-600'}`} />
                  </div>
                )}
              </div>
            )}
            
            {canEdit && (
              <div className="absolute bottom-0 right-0 flex space-x-2">
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="bg-blue-500 p-2 rounded-full text-white hover:bg-blue-600"
                  title="Upload foto"
                >
                  <Upload size={16} />
                </button>
                <button
                  onClick={handleCameraCapture}
                  className="bg-green-500 p-2 rounded-full text-white hover:bg-green-600"
                  title="Tirar foto"
                >
                  <Camera size={16} />
                </button>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                setPreview(URL.createObjectURL(file));
                handleFileUpload(file);
              }
            }}
          />

          <div className="w-full space-y-4">
            <div>
              <label className={`block text-sm font-medium text-${theme === 'dark' ? 'gray-300' : 'gray-700'} mb-1`}>
                Nome
              </label>
              <input
                type="text"
                value={userData.nome}
                onChange={(e) => setUserData(prev => ({ ...prev, nome: e.target.value }))}
                readOnly={!editMode}
                className={getInputClassName()}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium text-${theme === 'dark' ? 'gray-300' : 'gray-700'} mb-1`}>
                Usuário
              </label>
              <input
                type="text"
                value={userData.email?.replace(/@.*$/, '') || ''}
                onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
                readOnly={!editMode}
                className={getInputClassName()}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium text-${theme === 'dark' ? 'gray-300' : 'gray-700'} mb-1`}>
                Cargo
              </label>
              <input
                type="text"
                value={userData.cargo}
                readOnly={true}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium text-${theme === 'dark' ? 'gray-300' : 'gray-700'} mb-1`}>
                Telefone
              </label>
              <input
                type="tel"
                value={userData.telefone}
                onChange={(e) => setUserData(prev => ({ ...prev, telefone: e.target.value }))}
                readOnly={!editMode}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            {canEdit && (
              <div className="flex justify-end pt-4">
                {editMode ? (
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    <Save size={16} />
                    <span>{loading ? 'Salvando...' : 'Salvar'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    <span>Editar</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
