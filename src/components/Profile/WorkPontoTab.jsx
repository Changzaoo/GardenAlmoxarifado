import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { collection, addDoc, query, where, getDocs, limit, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebaseConfig';
import { differenceInMinutes, differenceInHours } from 'date-fns';
import * as faceapi from '@vladmandic/face-api';

// Hooks customizados
import { useWorkPontoData } from '../../hooks/workponto/useWorkPontoData';
import { useSystemStatus } from '../../hooks/workponto/useSystemStatus';
import { useUserPreference } from '../../hooks/workponto/useUserPreference';

// Utilitários
import { getStatusDia, getLocation } from '../../utils/workponto/helpers';

// Componentes otimizados (carregamento imediato)
import WorkPontoHeader from './WorkPonto/WorkPontoHeader';
import WorkPontoReferencePhoto from './WorkPonto/WorkPontoReferencePhoto';
import WorkPontoTestSection from './WorkPonto/WorkPontoTestSection';
import WorkPontoButtons from './WorkPonto/WorkPontoButtons';
import WorkPontoSuccessMessage from './WorkPonto/WorkPontoSuccessMessage';
import WorkPontoHistory from './WorkPonto/WorkPontoHistory';

// Lazy loading do modal da câmera (só carrega quando necessário)
const WorkPontoCameraModal = lazy(() => import('./WorkPonto/WorkPontoCameraModal'));

const WorkPontoTab = () => {
  const { usuario } = useAuth();
  
  // Hooks customizados
  const { loading, pontos, pontoHoje, hasReferencePhoto, setHasReferencePhoto } = useWorkPontoData(usuario);
  const { currentTime, isOnline } = useSystemStatus();
  const { userPreference, savePreference } = useUserPreference(usuario?.id);
  
  // Estados locais
  const [showCamera, setShowCamera] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState(null);
  const [tipoPonto, setTipoPonto] = useState(null);
  const [location, setLocation] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [savingUrl, setSavingUrl] = useState(false);
  const [testSuccess, setTestSuccess] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Carregar modelos do face-api.js (lazy)
  useEffect(() => {
    let mounted = true;
    
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
        ]);
        if (mounted) {
          setModelsLoaded(true);
          console.log('✅ Modelos de reconhecimento facial carregados');
        }
      } catch (err) {
        console.error('❌ Erro ao carregar modelos:', err);
        if (mounted) {
          setError('Erro ao carregar sistema de reconhecimento facial');
        }
      }
    };

    loadModels();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Registrar ponto usando preferência
  const registrarPontoComPreferencia = async (tipo) => {
    savePreference('camera');
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
        detectFace();
      }

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
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
      const currentPhoto = canvas.toDataURL('image/jpeg', 0.8);

      const currentDetection = await faceapi
        .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!currentDetection) {
        setError('Não foi possível detectar seu rosto claramente. Tente novamente.');
        setMatching(false);
        return;
      }

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

      const distance = faceapi.euclideanDistance(
        currentDetection.descriptor,
        referenceDetection.descriptor
      );

      const isMatch = distance < 0.6;
      const matchPercentage = ((1 - distance) * 100).toFixed(1);

      if (!isMatch) {
        setError(`Rosto não reconhecido (${matchPercentage}% de similaridade). Certifique-se de que é você!`);
        setMatching(false);
        return;
      }

      if (tipoPonto === 'teste') {
        setError(null);
        setMatching(false);
        setTestSuccess({ similarity: matchPercentage });
        stopCamera();
        setTimeout(() => setTestSuccess(null), 5000);
        return;
      }

      const photoBlob = await fetch(currentPhoto).then(r => r.blob());
      const storageRef = ref(storage, `pontos/${usuario.id}/${Date.now()}.jpg`);
      await uploadBytes(storageRef, photoBlob);
      const photoURL = await getDownloadURL(storageRef);

      const pontoData = {
        funcionarioId: usuario.id,
        funcionarioNome: usuario.nome,
        funcionarioUsuario: usuario.usuario,
        tipo: tipoPonto,
        timestamp: new Date(),
        photoURL,
        faceMatchScore: (1 - distance).toFixed(3),
        location: location || null,
        isOnline,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform
        }
      };

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
      setTimeout(() => window.location.reload(), 2000);

    } catch (err) {
      console.error('Erro ao registrar ponto:', err);
      setError('Erro ao registrar ponto. Tente novamente.');
    } finally {
      setMatching(false);
    }
  };

  // Salvar URL da imagem
  const handleSaveImageUrl = async () => {
    if (!imageUrl.trim()) {
      setError('Por favor, insira uma URL válida');
      return;
    }

    setSavingUrl(true);
    setError(null);

    try {
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
      savePreference('url');
      console.log('✅ URL da foto de referência salva!');

    } catch (err) {
      console.error('Erro ao processar URL da imagem:', err);
      setError('Erro ao processar a imagem. Verifique se a URL está correta e acessível.');
    } finally {
      setSavingUrl(false);
    }
  };

  const statusDia = getStatusDia(pontoHoje);

  return (
    <div className="space-y-6">
      {/* Header com Status */}
      <WorkPontoHeader
        currentTime={currentTime}
        isOnline={isOnline}
        statusDia={statusDia}
        pontoHoje={pontoHoje}
        userPreference={userPreference}
        hasReferencePhoto={hasReferencePhoto}
      />

      {/* Foto de Referência */}
      {!hasReferencePhoto && (
        <WorkPontoReferencePhoto
          imageUrl={imageUrl}
          setImageUrl={setImageUrl}
          savingUrl={savingUrl}
          handleSaveImageUrl={handleSaveImageUrl}
        />
      )}

      {/* Testar Reconhecimento Facial */}
      {hasReferencePhoto && (
        <WorkPontoTestSection
          modelsLoaded={modelsLoaded}
          onTestClick={() => startCamera('teste')}
        />
      )}

      {/* Mensagem de Sucesso do Teste */}
      <WorkPontoSuccessMessage testSuccess={testSuccess} />

      {/* Botões de Ponto */}
      {hasReferencePhoto && (
        <WorkPontoButtons
          modelsLoaded={modelsLoaded}
          pontoHoje={pontoHoje}
          onEntradaClick={() => registrarPontoComPreferencia('entrada')}
          onSaidaClick={() => registrarPontoComPreferencia('saida')}
        />
      )}

      {/* Modal da Câmera - Lazy Loaded */}
      {showCamera && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"><div className="text-white">Carregando...</div></div>}>
          <WorkPontoCameraModal
            showCamera={showCamera}
            videoRef={videoRef}
            canvasRef={canvasRef}
            faceDetected={faceDetected}
            matching={matching}
            error={error}
            onClose={stopCamera}
            onCapture={capturarPonto}
            tipoPonto={tipoPonto}
          />
        </Suspense>
      )}

      {/* Histórico de Pontos */}
      <WorkPontoHistory pontos={pontos} />
    </div>
  );
};

export default WorkPontoTab;
