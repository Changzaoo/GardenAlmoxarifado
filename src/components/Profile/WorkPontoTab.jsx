import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  Camera, 
  CheckCircle, 
  XCircle, 
  Calendar,
  User,
  MapPin,
  Wifi,
  WifiOff,
  Loader,
  Upload,
  Image as ImageIcon,
  AlertTriangle,
  PlayCircle,
  StopCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { collection, addDoc, query, where, getDocs, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebaseConfig';
import { format, differenceInMinutes, differenceInHours, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as faceapi from '@vladmandic/face-api';

const WorkPontoTab = () => {
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pontos, setPontos] = useState([]);
  const [pontoHoje, setPontoHoje] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState(null);
  const [tipoPonto, setTipoPonto] = useState(null); // 'entrada' ou 'saida'
  const [uploadingReference, setUploadingReference] = useState(false);
  const [hasReferencePhoto, setHasReferencePhoto] = useState(false);
  const [location, setLocation] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [imageUrl, setImageUrl] = useState('');
  const [savingUrl, setSavingUrl] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userPreference, setUserPreference] = useState(null); // 'camera' ou 'url'

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Carregar modelos do face-api.js
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
        ]);
        setModelsLoaded(true);
        console.log('✅ Modelos de reconhecimento facial carregados');
      } catch (err) {
        console.error('❌ Erro ao carregar modelos:', err);
        setError('Erro ao carregar sistema de reconhecimento facial');
      }
    };

    loadModels();
  }, []);

  // Atualizar relógio em tempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Monitorar status online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Carregar preferência do usuário
  useEffect(() => {
    const savedPreference = localStorage.getItem(`workponto_preference_${usuario?.id}`);
    if (savedPreference) {
      setUserPreference(savedPreference);
    }
  }, [usuario]);

  // Verificar se usuário tem foto de referência
  useEffect(() => {
    const checkReferencePhoto = async () => {
      if (!usuario?.id) return;

      try {
        const q = query(
          collection(db, 'funcionarios'),
          where('id', '==', usuario.id),
          limit(1)
        );
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const funcionario = snapshot.docs[0].data();
          setHasReferencePhoto(!!funcionario.faceReferenceURL);
        }
      } catch (err) {
        console.error('Erro ao verificar foto de referência:', err);
      }
    };

    checkReferencePhoto();
  }, [usuario]);

  // Buscar pontos do funcionário
  useEffect(() => {
    if (!usuario?.id) return;

    const fetchPontos = async () => {
      try {
        const hoje = new Date();
        const inicioDia = startOfDay(hoje);
        const fimDia = endOfDay(hoje);

        const q = query(
          collection(db, 'pontos'),
          where('funcionarioId', '==', usuario.id),
          orderBy('timestamp', 'desc'),
          limit(30)
        );

        const snapshot = await getDocs(q);
        const pontosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setPontos(pontosData);

        // Verificar se já bateu ponto hoje
        const pontoHoje = pontosData.find(p => {
          const pontoDate = p.timestamp?.toDate();
          return pontoDate >= inicioDia && pontoDate <= fimDia;
        });

        setPontoHoje(pontoHoje || null);
      } catch (err) {
        console.error('Erro ao buscar pontos:', err);
      }
    };

    fetchPontos();
  }, [usuario]);

  // Obter localização
  const getLocation = () => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
          },
          (error) => {
            console.warn('Erro ao obter localização:', error);
            resolve(null);
          }
        );
      } else {
        resolve(null);
      }
    });
  };

  // Registrar ponto usando preferência do usuário
  const registrarPontoComPreferencia = async (tipo) => {
    // Salvar preferência como 'camera' (usuário preferiu usar câmera)
    if (usuario?.id) {
      localStorage.setItem(`workponto_preference_${usuario.id}`, 'camera');
      setUserPreference('camera');
    }
    
    // Iniciar câmera normalmente
    await startCamera(tipo);
  };

  // Iniciar câmera
  const startCamera = async (tipo) => {
    if (!modelsLoaded) {
      setError('Sistema de reconhecimento facial ainda carregando...');
      return;
    }

    if (!hasReferencePhoto) {
      setError('Você precisa cadastrar uma foto de referência primeiro');
      return;
    }

    setTipoPonto(tipo);
    setShowCamera(true);
    setError(null);
    setFaceDetected(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });
      
      setVideoStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Iniciar detecção contínua
        detectFace();
      }

      // Obter localização
      const loc = await getLocation();
      setLocation(loc);
    } catch (err) {
      console.error('Erro ao acessar câmera:', err);
      setError('Não foi possível acessar a câmera');
      setShowCamera(false);
    }
  };

  // Parar câmera
  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    setShowCamera(false);
    setFaceDetected(false);
    setError(null);
  };

  // Detectar rosto continuamente
  const detectFace = async () => {
    if (!videoRef.current || !showCamera) return;

    const detections = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (detections) {
      setFaceDetected(true);
      
      // Desenhar no canvas
      if (canvasRef.current) {
        const displaySize = {
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight
        };
        faceapi.matchDimensions(canvasRef.current, displaySize);
        
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
      }
    } else {
      setFaceDetected(false);
    }

    // Continuar detectando
    setTimeout(() => detectFace(), 100);
  };

  // Capturar foto e comparar
  const capturarPonto = async () => {
    if (!faceDetected) {
      setError('Nenhum rosto detectado. Posicione seu rosto na câmera.');
      return;
    }

    setMatching(true);
    setError(null);

    try {
      // Capturar foto atual
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
      const currentPhoto = canvas.toDataURL('image/jpeg', 0.8);

      // Detectar rosto na foto atual
      const currentDetection = await faceapi
        .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!currentDetection) {
        setError('Não foi possível detectar seu rosto claramente. Tente novamente.');
        setMatching(false);
        return;
      }

      // Buscar foto de referência
      const q = query(
        collection(db, 'funcionarios'),
        where('id', '==', usuario.id),
        limit(1)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty || !snapshot.docs[0].data().faceReferenceURL) {
        setError('Foto de referência não encontrada');
        setMatching(false);
        return;
      }

      const faceReferenceURL = snapshot.docs[0].data().faceReferenceURL;

      // Carregar e processar foto de referência
      const referenceImg = await faceapi.fetchImage(faceReferenceURL);
      const referenceDetection = await faceapi
        .detectSingleFace(referenceImg, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!referenceDetection) {
        setError('Erro ao processar foto de referência');
        setMatching(false);
        return;
      }

      // Comparar rostos
      const distance = faceapi.euclideanDistance(
        currentDetection.descriptor,
        referenceDetection.descriptor
      );

      console.log('🔍 Distância de similaridade:', distance);

      // Threshold: menor = mais parecido (geralmente < 0.6 é boa correspondência)
      const isMatch = distance < 0.6;

      if (!isMatch) {
        setError('Rosto não reconhecido. Certifique-se de que é você!');
        setMatching(false);
        return;
      }

      // Upload da foto do ponto
      const photoBlob = await fetch(currentPhoto).then(r => r.blob());
      const storageRef = ref(storage, `pontos/${usuario.id}/${Date.now()}.jpg`);
      await uploadBytes(storageRef, photoBlob);
      const photoURL = await getDownloadURL(storageRef);

      // Registrar ponto
      const pontoData = {
        funcionarioId: usuario.id,
        funcionarioNome: usuario.nome,
        funcionarioUsuario: usuario.usuario,
        tipo: tipoPonto,
        timestamp: new Date(),
        photoURL,
        faceMatchScore: (1 - distance).toFixed(3), // Score de confiança (0-1)
        location: location || null,
        isOnline,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform
        }
      };

      // Se for saída, calcular tempo trabalhado
      if (tipoPonto === 'saida' && pontoHoje?.timestamp) {
        const entrada = pontoHoje.timestamp.toDate();
        const saida = new Date();
        const minutos = differenceInMinutes(saida, entrada);
        const horas = differenceInHours(saida, entrada);
        
        pontoData.horasTrabalhadas = horas;
        pontoData.minutosTrabalhados = minutos;
      }

      await addDoc(collection(db, 'pontos'), pontoData);

      console.log('✅ Ponto registrado com sucesso!');
      
      stopCamera();
      
      // Recarregar pontos
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err) {
      console.error('Erro ao registrar ponto:', err);
      setError('Erro ao registrar ponto. Tente novamente.');
    } finally {
      setMatching(false);
    }
  };

  // Upload de foto de referência
  const handleReferenceUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReference(true);
    setError(null);

    try {
      // Verificar se há rosto na imagem
      const img = await faceapi.bufferToImage(file);
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setError('Nenhum rosto detectado na foto. Escolha outra imagem.');
        setUploadingReference(false);
        return;
      }

      // Upload da foto
      const storageRef = ref(storage, `face-reference/${usuario.id}.jpg`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      // Atualizar funcionário com a foto de referência
      const q = query(
        collection(db, 'funcionarios'),
        where('id', '==', usuario.id),
        limit(1)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const docRef = doc(db, 'funcionarios', snapshot.docs[0].id);
        await updateDoc(docRef, {
          faceReferenceURL: photoURL,
          faceReferenceUpdated: new Date()
        });
      }

      setHasReferencePhoto(true);
      console.log('✅ Foto de referência cadastrada!');

    } catch (err) {
      console.error('Erro ao fazer upload da foto:', err);
      setError('Erro ao cadastrar foto de referência');
    } finally {
      setUploadingReference(false);
    }
  };

  // Salvar URL da imagem diretamente
  const handleSaveImageUrl = async () => {
    if (!imageUrl.trim()) {
      setError('Por favor, insira uma URL válida');
      return;
    }

    setSavingUrl(true);
    setError(null);

    try {
      // Verificar se a URL é válida e contém um rosto
      const img = await faceapi.fetchImage(imageUrl);
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setError('Nenhum rosto detectado na imagem. Verifique a URL e tente novamente.');
        setSavingUrl(false);
        return;
      }

      // Atualizar funcionário com a URL da foto de referência
      const q = query(
        collection(db, 'funcionarios'),
        where('id', '==', usuario.id),
        limit(1)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const docRef = doc(db, 'funcionarios', snapshot.docs[0].id);
        await updateDoc(docRef, {
          faceReferenceURL: imageUrl,
          faceReferenceUpdated: new Date()
        });
      }

      setHasReferencePhoto(true);
      setImageUrl('');
      
      // Salvar preferência como 'url' (usuário preferiu usar URL)
      if (usuario?.id) {
        localStorage.setItem(`workponto_preference_${usuario.id}`, 'url');
        setUserPreference('url');
      }
      
      console.log('✅ URL da foto de referência salva!');

    } catch (err) {
      console.error('Erro ao processar URL da imagem:', err);
      setError('Erro ao processar a imagem. Verifique se a URL está correta e acessível.');
    } finally {
      setSavingUrl(false);
    }
  };

  // Calcular status do dia
  const getStatusDia = () => {
    if (!pontoHoje) return { status: 'pending', text: 'Não bateu ponto hoje', color: 'gray' };
    
    if (pontoHoje.tipo === 'entrada' && !pontoHoje.horasTrabalhadas) {
      return { status: 'working', text: 'Trabalhando agora', color: 'blue' };
    }
    
    if (pontoHoje.tipo === 'saida') {
      return { status: 'completed', text: 'Jornada concluída', color: 'green' };
    }

    return { status: 'pending', text: 'Pendente', color: 'yellow' };
  };

  const statusDia = getStatusDia();

  return (
    <div className="space-y-6">
      {/* Header com Status */}
      <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">WorkPonto</h2>
              <p className="text-white/80 text-sm">Sistema de Ponto Eletrônico</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-green-300" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-300" />
            )}
          </div>
        </div>

        {/* Data e Hora Atual */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span className="font-medium text-sm sm:text-base">
                {format(currentTime, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold">
              {format(currentTime, 'HH:mm:ss')}
            </div>
          </div>
        </div>

        {/* Status do Dia com Indicador de Preferência */}
        <div className={`bg-${statusDia.color}-500/20 border border-${statusDia.color}-400/30 rounded-xl p-4`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {statusDia.status === 'working' && <PlayCircle className="w-6 h-6" />}
              {statusDia.status === 'completed' && <CheckCircle className="w-6 h-6" />}
              {statusDia.status === 'pending' && <AlertTriangle className="w-6 h-6" />}
              <div>
                <p className="font-semibold text-lg">{statusDia.text}</p>
                {pontoHoje?.timestamp && (
                  <p className="text-sm text-white/80">
                    Último registro: {format(pontoHoje.timestamp.toDate(), 'HH:mm')}
                  </p>
                )}
              </div>
            </div>
            
            {/* Indicador de Preferência */}
            {userPreference && hasReferencePhoto && (
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
                {userPreference === 'camera' ? (
                  <Camera className="w-4 h-4" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
                <span className="text-xs font-medium">
                  {userPreference === 'camera' ? 'Câmera' : 'URL'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Foto de Referência */}
      {!hasReferencePhoto && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-700 rounded-xl p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">
                Cadastre sua Foto de Referência
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
                Para usar o sistema de ponto com reconhecimento facial, você precisa cadastrar uma foto sua de referência.
              </p>
              
              {/* Campo de URL */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Inserir link da imagem
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://exemplo.com/minha-foto.jpg"
                    disabled={savingUrl}
                    className="flex-1 px-3 sm:px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  />
                  <button
                    onClick={handleSaveImageUrl}
                    disabled={savingUrl || !imageUrl.trim()}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                  >
                    {savingUrl ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span className="hidden sm:inline">Salvando...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4" />
                        <span>Salvar</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Cole o link direto da sua foto (deve ser acessível publicamente)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botões de Ponto - Otimizado para Mobile */}
      {hasReferencePhoto && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <button
            onClick={() => registrarPontoComPreferencia('entrada')}
            disabled={!modelsLoaded || (pontoHoje?.tipo === 'entrada' && !pontoHoje?.horasTrabalhadas)}
            className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 sm:p-6 hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3 sm:flex-col sm:gap-2">
              <PlayCircle className="w-8 h-8 sm:mx-auto flex-shrink-0" />
              <div className="text-left sm:text-center flex-1">
                <p className="font-bold text-base sm:text-lg">Registrar Entrada</p>
                <p className="text-xs sm:text-sm text-white/80">
                  {pontoHoje?.tipo === 'entrada' ? 'Já registrou hoje' : 'Iniciar jornada'}
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => registrarPontoComPreferencia('saida')}
            disabled={!modelsLoaded || !pontoHoje || pontoHoje?.tipo === 'saida'}
            className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-4 sm:p-6 hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3 sm:flex-col sm:gap-2">
              <StopCircle className="w-8 h-8 sm:mx-auto flex-shrink-0" />
              <div className="text-left sm:text-center flex-1">
                <p className="font-bold text-base sm:text-lg">Registrar Saída</p>
                <p className="text-xs sm:text-sm text-white/80">
                  {!pontoHoje ? 'Registre entrada primeiro' : pontoHoje?.tipo === 'saida' ? 'Já registrou hoje' : 'Finalizar jornada'}
                </p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Modal da Câmera - Responsivo */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl max-w-2xl w-full overflow-hidden max-h-screen">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3 sm:p-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-sm sm:text-lg">
                {tipoPonto === 'entrada' ? 'Entrada' : 'Saída'}
              </h3>
              <button onClick={stopCamera} className="text-white hover:bg-white/20 rounded-lg p-1.5 sm:p-2">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 sm:p-6">
              <div className="relative mb-3 sm:mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-lg sm:rounded-xl bg-black"
                  style={{ maxHeight: '60vh' }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full"
                />
                
                {/* Indicador de rosto detectado */}
                <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex items-center gap-1.5 sm:gap-2 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1.5 sm:px-3 sm:py-2">
                  {faceDetected ? (
                    <>
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                      <span className="text-white text-xs sm:text-sm font-medium">Rosto OK</span>
                    </>
                  ) : (
                    <>
                      <Loader className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 animate-spin" />
                      <span className="text-white text-xs sm:text-sm font-medium">Procurando...</span>
                    </>
                  )}
                </div>

                {location && (
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex items-center gap-1 sm:gap-2 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1.5 sm:px-3 sm:py-2">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                    <span className="text-white text-xs hidden sm:inline">GPS</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <button
                onClick={capturarPonto}
                disabled={!faceDetected || matching}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {matching ? (
                  <>
                    <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span className="text-sm sm:text-base">Verificando...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base">Registrar Ponto</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Histórico de Pontos - Otimizado para Mobile */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3 sm:p-4">
          <h3 className="text-white font-bold text-base sm:text-lg">Histórico de Pontos</h3>
        </div>

        <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
          {pontos.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Clock className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Nenhum ponto registrado ainda</p>
            </div>
          ) : (
            pontos.map((ponto) => (
              <div
                key={ponto.id}
                className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  {ponto.photoURL && (
                    <img
                      src={ponto.photoURL}
                      alt="Foto do ponto"
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                      <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                        ponto.tipo === 'entrada' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {ponto.tipo.toUpperCase()}
                      </span>
                      {ponto.faceMatchScore && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {(parseFloat(ponto.faceMatchScore) * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                      {format(ponto.timestamp.toDate(), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    {ponto.horasTrabalhadas && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
                        ⏱️ {ponto.horasTrabalhadas}h {ponto.minutosTrabalhados % 60}min
                      </p>
                    )}
                    {ponto.location && (
                      <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
                        <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {ponto.location.latitude.toFixed(2)}, {ponto.location.longitude.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkPontoTab;
