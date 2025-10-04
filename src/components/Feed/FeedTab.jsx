import React, { useState, useEffect } from 'react';
import { 
  Image, Heart, MessageCircle, Send, MoreVertical, 
  Globe, Users, Camera, X, Loader, Trash2, Edit,
  Clock, MapPin, Smile
} from 'lucide-react';
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, 
  query, where, orderBy, onSnapshot, getDocs, arrayUnion, arrayRemove 
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { uploadToDiscord, validateImage, compressImage, deleteFromDiscord } from '../../services/discordStorage';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const FeedTab = () => {
  const { usuario } = useAuth();
  const [posts, setPosts] = useState([]);
  const [modoExplorar, setModoExplorar] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [showNovoPost, setShowNovoPost] = useState(false);

  // Carregar posts
  useEffect(() => {
    if (!usuario) return;

    let q;
    
    if (modoExplorar) {
      // Modo explorar: todos os posts
      q = query(
        collection(db, 'posts'),
        orderBy('dataPostagem', 'desc')
      );
    } else {
      // Modo normal: apenas da mesma empresa e setor
      q = query(
        collection(db, 'posts'),
        where('empresaId', '==', usuario.empresaId),
        where('setorId', '==', usuario.setorId),
        orderBy('dataPostagem', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postsData);
      setCarregando(false);
    });

    return () => unsubscribe();
  }, [usuario, modoExplorar]);

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Carregando feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header do Feed */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Feed Social
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {modoExplorar ? 'Explorando todas as publicações' : 'Publicações da sua equipe'}
            </p>
          </div>
          
          {/* Toggle Explorar */}
          <button
            onClick={() => setModoExplorar(!modoExplorar)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              modoExplorar
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {modoExplorar ? (
              <>
                <Globe className="w-5 h-5" />
                Explorar
              </>
            ) : (
              <>
                <Users className="w-5 h-5" />
                Minha Equipe
              </>
            )}
          </button>
        </div>

        {/* Botão Novo Post */}
        <button
          onClick={() => setShowNovoPost(true)}
          className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium shadow-md transition-all"
        >
          <Camera className="w-5 h-5" />
          Criar nova publicação
        </button>
      </div>

      {/* Lista de Posts */}
      {posts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center border border-gray-200 dark:border-gray-700">
          <Camera className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Nenhuma publicação ainda
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {modoExplorar 
              ? 'Seja o primeiro a compartilhar algo!' 
              : 'Sua equipe ainda não fez nenhuma publicação.'}
          </p>
          <button
            onClick={() => setShowNovoPost(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
          >
            <Camera className="w-5 h-5" />
            Criar primeira publicação
          </button>
        </div>
      ) : (
        posts.map(post => (
          <PostCard key={post.id} post={post} usuario={usuario} />
        ))
      )}

      {/* Modal Novo Post */}
      {showNovoPost && (
        <NovoPostModal
          onClose={() => setShowNovoPost(false)}
          usuario={usuario}
        />
      )}
    </div>
  );
};

// Componente de Card de Post
const PostCard = ({ post, usuario }) => {
  const [showComentarios, setShowComentarios] = useState(false);
  const [comentario, setComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isAutor = post.autorId === usuario.id;
  const curtiu = post.curtidas?.includes(usuario.id);

  // Curtir/Descurtir
  const handleCurtir = async () => {
    try {
      const postRef = doc(db, 'posts', post.id);
      if (curtiu) {
        await updateDoc(postRef, {
          curtidas: arrayRemove(usuario.id)
        });
      } else {
        await updateDoc(postRef, {
          curtidas: arrayUnion(usuario.id)
        });
      }
    } catch (error) {
      console.error('Erro ao curtir:', error);
    }
  };

  // Adicionar comentário
  const handleComentario = async (e) => {
    e.preventDefault();
    if (!comentario.trim()) return;

    setEnviandoComentario(true);
    try {
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        comentarios: arrayUnion({
          id: Date.now().toString(),
          autorId: usuario.id,
          autorNome: usuario.nome,
          autorFoto: usuario.photoURL || null,
          texto: comentario.trim(),
          data: new Date().toISOString()
        })
      });
      setComentario('');
    } catch (error) {
      console.error('Erro ao comentar:', error);
    } finally {
      setEnviandoComentario(false);
    }
  };

  // Deletar post
  const handleDeletar = async () => {
    if (!window.confirm('Deseja realmente deletar esta publicação?')) return;

    try {
      // Deletar imagem do Discord
      if (post.imagemDiscord?.messageId && post.imagemDiscord?.channelId) {
        await deleteFromDiscord(post.imagemDiscord.messageId, post.imagemDiscord.channelId);
      }

      // Deletar post do Firestore
      await deleteDoc(doc(db, 'posts', post.id));
    } catch (error) {
      console.error('Erro ao deletar post:', error);
      alert('Erro ao deletar publicação');
    }
  };

  const dataRelativa = formatDistanceToNow(new Date(post.dataPostagem), {
    addSuffix: true,
    locale: ptBR
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header do Post */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
            {post.autorFoto ? (
              <img src={post.autorFoto} alt={post.autorNome} className="w-full h-full rounded-full object-cover" />
            ) : (
              post.autorNome.charAt(0).toUpperCase()
            )}
          </div>

          {/* Info do autor */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {post.autorNome}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <Clock className="w-3 h-3" />
              {dataRelativa}
              {post.empresaNome && (
                <>
                  <span>•</span>
                  <MapPin className="w-3 h-3" />
                  {post.empresaNome}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Menu (apenas para autor) */}
        {isAutor && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                <button
                  onClick={handleDeletar}
                  className="w-full flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Deletar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Imagem */}
      {post.imagemUrl && (
        <div className="relative w-full" style={{ maxHeight: '600px' }}>
          <img
            src={post.imagemUrl}
            alt="Post"
            className="w-full h-auto object-contain bg-black"
            loading="lazy"
          />
        </div>
      )}

      {/* Legenda */}
      {post.legenda && (
        <div className="px-4 py-3">
          <p className="text-gray-900 dark:text-white whitespace-pre-wrap break-words">
            <span className="font-semibold">{post.autorNome}</span>{' '}
            {post.legenda}
          </p>
        </div>
      )}

      {/* Ações */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={handleCurtir}
            className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <Heart className={`w-6 h-6 ${curtiu ? 'fill-red-600 text-red-600' : ''}`} />
            <span className="text-sm font-medium">{post.curtidas?.length || 0}</span>
          </button>

          <button
            onClick={() => setShowComentarios(!showComentarios)}
            className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-sm font-medium">{post.comentarios?.length || 0}</span>
          </button>
        </div>
      </div>

      {/* Seção de Comentários */}
      {showComentarios && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
          {/* Lista de comentários */}
          {post.comentarios && post.comentarios.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {post.comentarios.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {c.autorFoto ? (
                      <img src={c.autorFoto} alt={c.autorNome} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      c.autorNome.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-semibold text-gray-900 dark:text-white">{c.autorNome}</span>{' '}
                      <span className="text-gray-700 dark:text-gray-300">{c.texto}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(c.data), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Form de comentário */}
          <form onSubmit={handleComentario} className="flex gap-2">
            <input
              type="text"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Adicione um comentário..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
              disabled={enviandoComentario}
            />
            <button
              type="submit"
              disabled={!comentario.trim() || enviandoComentario}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

// Modal de Novo Post
const NovoPostModal = ({ onClose, usuario }) => {
  const [legenda, setLegenda] = useState('');
  const [imagemFile, setImagemFile] = useState(null);
  const [imagemPreview, setImagemPreview] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [progresso, setProgresso] = useState(0);

  const handleImagemChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Validar imagem
      await validateImage(file);

      // Comprimir se muito grande
      let finalFile = file;
      if (file.size > 2 * 1024 * 1024) { // > 2MB
        setProgresso(10);
        finalFile = await compressImage(file, 1920, 0.85);
        setProgresso(0);
      }

      setImagemFile(finalFile);
      setImagemPreview(URL.createObjectURL(finalFile));
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imagemFile && !legenda.trim()) {
      alert('Adicione pelo menos uma imagem ou legenda');
      return;
    }

    setCarregando(true);
    setProgresso(0);

    try {
      let imagemUrl = null;
      let imagemDiscord = null;

      // Upload da imagem para Discord
      if (imagemFile) {
        setProgresso(30);
        const uploadResult = await uploadToDiscord(imagemFile, 'posts', {
          autorId: usuario.id,
          autorNome: usuario.nome,
          empresaId: usuario.empresaId,
          setorId: usuario.setorId
        });
        imagemUrl = uploadResult.url;
        imagemDiscord = {
          messageId: uploadResult.messageId,
          channelId: uploadResult.channelId,
          filename: uploadResult.filename
        };
        setProgresso(70);
      }

      // Salvar post no Firestore
      await addDoc(collection(db, 'posts'), {
        autorId: usuario.id,
        autorNome: usuario.nome,
        autorFoto: usuario.photoURL || null,
        empresaId: usuario.empresaId,
        empresaNome: usuario.empresaNome || '',
        setorId: usuario.setorId,
        setorNome: usuario.setorNome || '',
        legenda: legenda.trim(),
        imagemUrl,
        imagemDiscord,
        dataPostagem: new Date().toISOString(),
        curtidas: [],
        comentarios: []
      });

      setProgresso(100);
      onClose();
    } catch (error) {
      console.error('Erro ao criar post:', error);
      alert('Erro ao criar publicação: ' + error.message);
    } finally {
      setCarregando(false);
      setProgresso(0);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Nova Publicação
          </h2>
          <button
            onClick={onClose}
            disabled={carregando}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Preview da Imagem */}
          {imagemPreview ? (
            <div className="relative">
              <img
                src={imagemPreview}
                alt="Preview"
                className="w-full h-auto max-h-96 object-contain rounded-lg border border-gray-200 dark:border-gray-700"
              />
              <button
                type="button"
                onClick={() => {
                  setImagemFile(null);
                  setImagemPreview(null);
                }}
                className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <Camera className="w-12 h-12 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Clique para adicionar uma imagem
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                JPG, PNG, GIF ou WebP (máx. 25MB)
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImagemChange}
                className="hidden"
                disabled={carregando}
              />
            </label>
          )}

          {/* Legenda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Legenda
            </label>
            <textarea
              value={legenda}
              onChange={(e) => setLegenda(e.target.value)}
              placeholder="Escreva uma legenda..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 resize-none"
              disabled={carregando}
            />
          </div>

          {/* Barra de Progresso */}
          {carregando && progresso > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">Enviando...</span>
                <span className="text-blue-600 dark:text-blue-400 font-medium">{progresso}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                  style={{ width: `${progresso}%` }}
                />
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={carregando}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={carregando || (!imagemFile && !legenda.trim())}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {carregando ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader className="w-5 h-5 animate-spin" />
                  Publicando...
                </div>
              ) : (
                'Publicar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedTab;
