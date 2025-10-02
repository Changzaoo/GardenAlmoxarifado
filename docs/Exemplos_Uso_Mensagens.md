# 💻 Exemplos de Uso - Sistema de Mensagens Avançado

## 📋 Índice
1. [Criar Nova Conversa](#criar-nova-conversa)
2. [Criar Grupo](#criar-grupo)
3. [Notificações Push](#notificações-push)
4. [Badge de Mensagens](#badge-de-mensagens)
5. [Eventos Customizados](#eventos-customizados)
6. [Integração Completa](#integração-completa)

---

## 1. Criar Nova Conversa

### Exemplo Básico
```jsx
import React, { useState } from 'react';
import NovaConversa from './components/Mensagens/NovaConversa';
import { useMensagens } from './hooks/useMensagens';

function MeuComponente() {
  const [showModal, setShowModal] = useState(false);
  const { iniciarConversa } = useMensagens();
  const usuario = { id: 'user123', nome: 'João' };

  const handleIniciarConversa = async (outroUsuarioId) => {
    try {
      const conversa = await iniciarConversa(outroUsuarioId);
      console.log('Conversa criada:', conversa);
      setShowModal(false);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Nova Conversa
      </button>

      <NovaConversa
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onIniciarConversa={handleIniciarConversa}
        onCriarGrupo={() => {}} // Desabilitar grupos
        usuarioAtual={usuario}
      />
    </>
  );
}
```

### Com Callback de Sucesso
```jsx
const handleIniciarConversa = async (outroUsuarioId) => {
  try {
    const conversa = await iniciarConversa(outroUsuarioId);
    
    // Mostrar notificação
    toast.success('Conversa iniciada com sucesso!');
    
    // Navegar para a conversa
    selecionarConversa(conversa);
    
    // Fechar modal
    setShowModal(false);
    
    // Analytics (opcional)
    logEvent('conversa_iniciada', {
      conversaId: conversa.id,
      tipo: 'individual'
    });
  } catch (error) {
    toast.error('Erro ao iniciar conversa');
    console.error(error);
  }
};
```

---

## 2. Criar Grupo

### Exemplo Básico
```jsx
function CriarGrupo() {
  const [showModal, setShowModal] = useState(false);
  const { criarGrupo } = useMensagens();
  const usuario = { id: 'admin123', nome: 'Admin' };

  const handleCriarGrupo = async (nome, descricao, participantesIds) => {
    try {
      const grupo = await criarGrupo(nome, descricao, participantesIds);
      console.log('Grupo criado:', grupo);
      toast.success(`Grupo "${nome}" criado com sucesso!`);
      setShowModal(false);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao criar grupo');
    }
  };

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className="btn-primary"
      >
        Novo Grupo
      </button>

      <NovaConversa
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onIniciarConversa={() => {}} // Desabilitar conversas individuais
        onCriarGrupo={handleCriarGrupo}
        usuarioAtual={usuario}
      />
    </>
  );
}
```

### Com Validação e Upload de Imagem
```jsx
const handleCriarGrupo = async (nome, descricao, participantesIds, imagem) => {
  // Validações
  if (nome.length < 3) {
    toast.error('Nome do grupo deve ter no mínimo 3 caracteres');
    return;
  }

  if (participantesIds.length < 2) {
    toast.error('Selecione pelo menos 2 participantes');
    return;
  }

  try {
    // Upload de imagem (se fornecida)
    let imagemUrl = null;
    if (imagem) {
      const storageRef = ref(storage, `grupos/${Date.now()}_${imagem.name}`);
      await uploadBytes(storageRef, imagem);
      imagemUrl = await getDownloadURL(storageRef);
    }

    // Criar grupo
    const grupo = await criarGrupo(nome, descricao, participantesIds, imagemUrl);

    // Enviar mensagem de boas-vindas
    await enviarMensagem(grupo.id, usuario.id, '👋 Bem-vindos ao grupo!', 'texto');

    toast.success(`Grupo "${nome}" criado com ${participantesIds.length} participantes!`);
    setShowModal(false);

    return grupo;
  } catch (error) {
    console.error('Erro ao criar grupo:', error);
    toast.error('Erro ao criar grupo. Tente novamente.');
  }
};
```

---

## 3. Notificações Push

### Inicializar no Login
```jsx
import { useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import pushNotificationService from './services/pushNotificationService';

function App() {
  const { usuario } = useAuth();

  useEffect(() => {
    if (usuario?.id) {
      // Inicializar notificações
      pushNotificationService.initialize(usuario.id)
        .then(() => {
          console.log('✅ Notificações ativadas');
        })
        .catch(error => {
          console.error('❌ Erro ao ativar notificações:', error);
          // Não bloquear o app se notificações falharem
        });
    }

    // Cleanup ao deslogar
    return () => {
      if (usuario?.id) {
        pushNotificationService.cleanup();
      }
    };
  }, [usuario?.id]);

  return <div>...</div>;
}
```

### Solicitar Permissão Manualmente
```jsx
function NotificationSettings() {
  const [permission, setPermission] = useState(Notification.permission);
  const { usuario } = useAuth();

  const handleRequestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        await pushNotificationService.initialize(usuario.id);
        toast.success('Notificações ativadas!');
      } else {
        toast.warning('Permissão negada');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao solicitar permissão');
    }
  };

  return (
    <div>
      <h3>Notificações Push</h3>
      <p>Status: {permission}</p>
      
      {permission === 'default' && (
        <button onClick={handleRequestPermission}>
          Ativar Notificações
        </button>
      )}
      
      {permission === 'granted' && (
        <span className="text-green-600">✓ Ativado</span>
      )}
      
      {permission === 'denied' && (
        <span className="text-red-600">✗ Bloqueado</span>
      )}
    </div>
  );
}
```

### Enviar Notificação de Teste (Backend)
```javascript
// Cloud Function personalizada
exports.sendTestNotification = functions.https.onCall(async (data, context) => {
  // Verificar autenticação
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  const userId = context.auth.uid;
  const { title, body } = data;

  try {
    // Buscar tokens do usuário
    const userDoc = await admin.firestore()
      .collection('usuarios')
      .doc(userId)
      .get();

    const fcmTokens = userDoc.data()?.fcmTokens || [];

    // Enviar para cada token
    const promises = fcmTokens.map(tokenData => 
      admin.messaging().send({
        token: tokenData.token,
        notification: {
          title: title || 'Teste',
          body: body || 'Esta é uma notificação de teste'
        }
      })
    );

    await Promise.all(promises);
    return { success: true, sent: promises.length };
  } catch (error) {
    console.error('Erro:', error);
    throw new functions.https.HttpsError('internal', 'Erro ao enviar notificação');
  }
});
```

---

## 4. Badge de Mensagens

### Exibir Badge no Menu
```jsx
function MenuItem({ item }) {
  const { totalNaoLidas } = useMensagens();

  return (
    <button className="menu-item">
      <div className="relative">
        <MessageCircle className="icon" />
        
        {/* Badge de não lidas */}
        {item.id === 'mensagens' && totalNaoLidas > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {totalNaoLidas > 99 ? '99+' : totalNaoLidas}
          </span>
        )}
      </div>
      <span>{item.nome}</span>
    </button>
  );
}
```

### Badge com Tooltip
```jsx
import { Tooltip } from 'react-tooltip';

function MensagensButton() {
  const { totalNaoLidas, conversas } = useMensagens();
  
  const conversasNaoLidas = conversas.filter(
    c => c.participantesInfo?.[usuario.id]?.naoLidas > 0
  );

  return (
    <div className="relative">
      <button 
        data-tooltip-id="mensagens-tooltip"
        onClick={() => navigate('/mensagens')}
      >
        <MessageCircle />
        {totalNaoLidas > 0 && (
          <span className="badge">{totalNaoLidas}</span>
        )}
      </button>

      <Tooltip id="mensagens-tooltip" place="bottom">
        <div>
          <p className="font-bold">{totalNaoLidas} mensagens não lidas</p>
          <ul className="mt-2">
            {conversasNaoLidas.slice(0, 3).map(c => (
              <li key={c.id} className="text-sm">
                • {c.nome}: {c.participantesInfo[usuario.id].naoLidas}
              </li>
            ))}
          </ul>
        </div>
      </Tooltip>
    </div>
  );
}
```

### Badge Animado
```jsx
function AnimatedBadge({ count }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (count > 0) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 300);
      return () => clearTimeout(timer);
    }
  }, [count]);

  if (count === 0) return null;

  return (
    <span 
      className={`
        absolute -top-1 -right-1 
        min-w-[20px] h-5 px-1 
        bg-red-500 text-white text-xs font-bold 
        rounded-full flex items-center justify-center
        ${animate ? 'animate-bounce' : 'animate-pulse'}
      `}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
```

---

## 5. Eventos Customizados

### Escutar Nova Mensagem
```jsx
function App() {
  useEffect(() => {
    const handleNewMessage = (event) => {
      const { conversaId, mensagemId, senderId, senderName } = event.detail;
      
      console.log('Nova mensagem:', event.detail);
      
      // Atualizar UI
      // Tocar som
      // Mostrar notificação in-app
      toast.info(`Nova mensagem de ${senderName}`);
    };

    window.addEventListener('newMessage', handleNewMessage);
    
    return () => {
      window.removeEventListener('newMessage', handleNewMessage);
    };
  }, []);

  return <div>...</div>;
}
```

### Abrir Conversa pelo Deep Link
```jsx
function MensagensPage() {
  const { selecionarConversa, conversas } = useMensagens();

  useEffect(() => {
    const handleOpenConversa = (event) => {
      const { conversaId } = event.detail;
      
      // Buscar conversa
      const conversa = conversas.find(c => c.id === conversaId);
      
      if (conversa) {
        selecionarConversa(conversa);
        
        // Navegar se necessário
        if (window.location.pathname !== '/mensagens') {
          navigate('/mensagens');
        }
      }
    };

    window.addEventListener('openConversa', handleOpenConversa);
    
    return () => {
      window.removeEventListener('openConversa', handleOpenConversa);
    };
  }, [conversas, selecionarConversa]);

  return <MensagensMain />;
}
```

### Disparar Evento Customizado
```jsx
// Quando enviar mensagem
const enviarMensagem = async (texto) => {
  const mensagem = await mensagensService.sendMessage(conversaId, userId, texto);
  
  // Disparar evento
  window.dispatchEvent(new CustomEvent('messageSent', {
    detail: {
      mensagemId: mensagem.id,
      conversaId,
      texto
    }
  }));
};

// Escutar em outro componente
useEffect(() => {
  const handleMessageSent = (event) => {
    console.log('Mensagem enviada:', event.detail);
    // Analytics, logs, etc.
  };

  window.addEventListener('messageSent', handleMessageSent);
  return () => window.removeEventListener('messageSent', handleMessageSent);
}, []);
```

---

## 6. Integração Completa

### Exemplo de Página Completa
```jsx
import React, { useState, useEffect } from 'react';
import { Plus, MessageCircle } from 'lucide-react';
import MensagensMain from './components/Mensagens/MensagensMain';
import NovaConversa from './components/Mensagens/NovaConversa';
import { useMensagens } from './hooks/useMensagens';
import { useAuth } from './hooks/useAuth';
import pushNotificationService from './services/pushNotificationService';

function MensagensPage() {
  const { usuario } = useAuth();
  const { 
    conversas, 
    conversaAtiva, 
    totalNaoLidas,
    iniciarConversa, 
    criarGrupo,
    selecionarConversa 
  } = useMensagens();
  
  const [showNovaConversa, setShowNovaConversa] = useState(false);

  // Inicializar notificações
  useEffect(() => {
    if (usuario?.id) {
      pushNotificationService.initialize(usuario.id);
    }
    return () => pushNotificationService.cleanup();
  }, [usuario?.id]);

  // Escutar eventos
  useEffect(() => {
    const handleNewMessage = (event) => {
      toast.info(`Nova mensagem de ${event.detail.senderName}`);
    };

    const handleOpenConversa = (event) => {
      const conversa = conversas.find(c => c.id === event.detail.conversaId);
      if (conversa) selecionarConversa(conversa);
    };

    window.addEventListener('newMessage', handleNewMessage);
    window.addEventListener('openConversa', handleOpenConversa);
    
    return () => {
      window.removeEventListener('newMessage', handleNewMessage);
      window.removeEventListener('openConversa', handleOpenConversa);
    };
  }, [conversas, selecionarConversa]);

  const handleIniciarConversa = async (outroUsuarioId) => {
    try {
      const conversa = await iniciarConversa(outroUsuarioId);
      selecionarConversa(conversa);
      setShowNovaConversa(false);
      toast.success('Conversa iniciada!');
    } catch (error) {
      toast.error('Erro ao iniciar conversa');
    }
  };

  const handleCriarGrupo = async (nome, descricao, participantesIds) => {
    try {
      const grupo = await criarGrupo(nome, descricao, participantesIds);
      selecionarConversa(grupo);
      setShowNovaConversa(false);
      toast.success(`Grupo "${nome}" criado!`);
    } catch (error) {
      toast.error('Erro ao criar grupo');
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Mensagens
            </h1>
            {totalNaoLidas > 0 && (
              <p className="text-sm text-gray-500">
                {totalNaoLidas} mensagens não lidas
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowNovaConversa(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Conversa
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <MensagensMain />
      </main>

      {/* Modal Nova Conversa */}
      <NovaConversa
        isOpen={showNovaConversa}
        onClose={() => setShowNovaConversa(false)}
        onIniciarConversa={handleIniciarConversa}
        onCriarGrupo={handleCriarGrupo}
        usuarioAtual={usuario}
      />
    </div>
  );
}

export default MensagensPage;
```

---

## 🎯 Casos de Uso Avançados

### 1. Notificação com Ação Direta
```jsx
// Responder mensagem direto da notificação (Web)
if ('actions' in Notification.prototype) {
  new Notification('Nova mensagem de João', {
    body: 'Oi, tudo bem?',
    actions: [
      { action: 'reply', title: 'Responder' },
      { action: 'dismiss', title: 'Dispensar' }
    ]
  });
}

// Escutar ação
navigator.serviceWorker.addEventListener('notificationclick', (event) => {
  if (event.action === 'reply') {
    // Abrir modal de resposta rápida
  }
});
```

### 2. Agrupar Notificações
```jsx
// Agrupar múltiplas mensagens da mesma conversa
const showGroupedNotification = (conversaId, mensagens) => {
  const count = mensagens.length;
  
  new Notification(`${count} novas mensagens`, {
    body: mensagens.map(m => m.texto).join('\n'),
    tag: `conversa_${conversaId}`, // Mesma tag agrupa notificações
    renotify: true
  });
};
```

### 3. Quiet Hours (Não Perturbe)
```jsx
const shouldShowNotification = () => {
  const now = new Date();
  const hour = now.getHours();
  
  // Não mostrar entre 22h e 7h
  if (hour >= 22 || hour < 7) {
    return false;
  }
  
  // Verificar preferências do usuário
  const userSettings = getUserSettings();
  if (userSettings.doNotDisturb) {
    return false;
  }
  
  return true;
};
```

---

**Última atualização:** 02/10/2025  
**Versão:** 1.0.0
