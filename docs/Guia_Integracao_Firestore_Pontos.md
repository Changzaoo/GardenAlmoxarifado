# 🔥 Guia de Integração com Firestore - Sistema de Pontos

## 📚 Índice
- [Estrutura de Dados](#estrutura-de-dados)
- [Funções de Salvamento](#funções-de-salvamento)
- [Funções de Leitura](#funções-de-leitura)
- [Validações](#validações)
- [Código Completo](#código-completo)

---

## 📊 Estrutura de Dados

### Coleção: `pontos`

```javascript
// Estrutura no Firestore
pontos/
  └── {funcionarioId}/
      ├── dados/
      │   ├── 2025-10-08: {
      │   │     entrada: "08:00",
      │   │     saidaAlmoco: "12:00",
      │   │     voltaAlmoco: "13:00",
      │   │     saida: "17:30",
      │   │     editadoPor: "userId123",
      │   │     editadoEm: Timestamp,
      │   │     horasTrabalhadas: "8h 30m"
      │   │   }
      │   ├── 2025-10-07: {...}
      │   └── ...
      └── metadata: {
            funcionarioId: "func123",
            nome: "João Silva",
            ultimaAtualizacao: Timestamp
          }
```

### Exemplo de Documento

```javascript
{
  // Documento: pontos/funcionarioId123
  dados: {
    "2025-10-08": {
      entrada: "08:00",
      saidaAlmoco: "12:00",
      voltaAlmoco: "13:00",
      saida: "17:30",
      editadoPor: "admin001",
      editadoEm: serverTimestamp(),
      horasTrabalhadas: "8h 30m",
      observacao: "Horário corrigido manualmente"
    }
  },
  metadata: {
    funcionarioId: "funcionarioId123",
    nome: "João Silva",
    ultimaAtualizacao: serverTimestamp(),
    totalPontosRegistrados: 20
  }
}
```

---

## 💾 Funções de Salvamento

### 1. Salvar Pontos Editados

```javascript
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const salvarPontosEditados = async () => {
  if (!dataEdicao) {
    toast.error('Selecione uma data válida');
    return;
  }

  // Validar formato de horários (HH:MM)
  const regexHorario = /^([01]\d|2[0-3]):([0-5]\d)$/;
  const pontosValidos = Object.entries(pontosEdicao).filter(([_, valor]) => valor !== '');
  
  for (const [campo, valor] of pontosValidos) {
    if (!regexHorario.test(valor)) {
      toast.error(`Horário inválido no campo ${campo}. Use o formato HH:MM`);
      return;
    }
  }

  const toastId = toast.loading('Salvando pontos...');
  
  try {
    const pontosRef = doc(db, 'pontos', funcionario.id);
    
    // Calcular horas trabalhadas
    const horasTrabalhadas = calcularHorasTrabalhadas(pontosEdicao);
    
    // Dados a serem salvos
    const dadosPonto = {
      [`dados.${dataEdicao}`]: {
        entrada: pontosEdicao.entrada || null,
        saidaAlmoco: pontosEdicao.saidaAlmoco || null,
        voltaAlmoco: pontosEdicao.voltaAlmoco || null,
        saida: pontosEdicao.saida || null,
        editadoPor: usuarioLogado.id,
        editadoEm: serverTimestamp(),
        horasTrabalhadas: horasTrabalhadas,
        observacao: "Editado manualmente"
      },
      'metadata.ultimaAtualizacao': serverTimestamp()
    };

    // Atualizar ou criar documento
    await updateDoc(pontosRef, dadosPonto).catch(async (error) => {
      if (error.code === 'not-found') {
        // Documento não existe, criar novo
        await setDoc(pontosRef, {
          dados: {
            [dataEdicao]: dadosPonto[`dados.${dataEdicao}`]
          },
          metadata: {
            funcionarioId: funcionario.id,
            nome: funcionario.nome,
            ultimaAtualizacao: serverTimestamp(),
            totalPontosRegistrados: 1
          }
        });
      } else {
        throw error;
      }
    });

    toast.update(toastId, {
      render: '✓ Pontos salvos com sucesso!',
      type: 'success',
      isLoading: false,
      autoClose: 3000
    });

    setMostrarModalEdicao(false);
    setPontosEdicao({
      entrada: '',
      saidaAlmoco: '',
      voltaAlmoco: '',
      saida: ''
    });
    
    // Recarregar dados do funcionário
    await recarregarDados();
    
  } catch (error) {
    console.error('Erro ao salvar pontos:', error);
    toast.update(toastId, {
      render: 'Erro ao salvar pontos. Tente novamente.',
      type: 'error',
      isLoading: false,
      autoClose: 3000
    });
  }
};
```

### 2. Calcular Horas Trabalhadas

```javascript
const calcularHorasTrabalhadas = (pontos) => {
  const { entrada, saidaAlmoco, voltaAlmoco, saida } = pontos;
  
  // Verificar se todos os pontos estão preenchidos
  if (!entrada || !saidaAlmoco || !voltaAlmoco || !saida) {
    return "--h --m";
  }
  
  try {
    // Converter HH:MM para minutos
    const toMinutes = (time) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };
    
    const entradaMin = toMinutes(entrada);
    const saidaAlmocoMin = toMinutes(saidaAlmoco);
    const voltaAlmocoMin = toMinutes(voltaAlmoco);
    const saidaMin = toMinutes(saida);
    
    // Calcular períodos
    const periodo1 = saidaAlmocoMin - entradaMin; // Manhã
    const periodo2 = saidaMin - voltaAlmocoMin;   // Tarde
    
    const totalMinutos = periodo1 + periodo2;
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    
    return `${horas}h ${minutos}m`;
  } catch (error) {
    console.error('Erro ao calcular horas:', error);
    return "--h --m";
  }
};
```

---

## 📖 Funções de Leitura

### 1. Buscar Pontos de um Funcionário

```javascript
import { doc, getDoc } from 'firebase/firestore';

const buscarPontosFuncionario = async (funcionarioId) => {
  try {
    const pontosRef = doc(db, 'pontos', funcionarioId);
    const pontosSnap = await getDoc(pontosRef);
    
    if (pontosSnap.exists()) {
      return pontosSnap.data();
    } else {
      console.log('Nenhum ponto registrado para este funcionário');
      return null;
    }
  } catch (error) {
    console.error('Erro ao buscar pontos:', error);
    throw error;
  }
};

// Uso:
const pontos = await buscarPontosFuncionario('funcionarioId123');
console.log(pontos.dados['2025-10-08']);
```

### 2. Buscar Pontos de uma Data Específica

```javascript
const buscarPontosData = async (funcionarioId, data) => {
  try {
    const pontos = await buscarPontosFuncionario(funcionarioId);
    
    if (pontos && pontos.dados && pontos.dados[data]) {
      return pontos.dados[data];
    } else {
      return null;
    }
  } catch (error) {
    console.error('Erro ao buscar pontos da data:', error);
    return null;
  }
};

// Uso:
const pontosHoje = await buscarPontosData('funcionarioId123', '2025-10-08');
```

### 3. Buscar Pontos do Mês

```javascript
const buscarPontosMes = async (funcionarioId, ano, mes) => {
  try {
    const pontos = await buscarPontosFuncionario(funcionarioId);
    
    if (!pontos || !pontos.dados) {
      return [];
    }
    
    // Filtrar pontos do mês
    const pontosMes = Object.entries(pontos.dados)
      .filter(([data, _]) => {
        const [anoData, mesData] = data.split('-');
        return anoData === ano && mesData === mes.padStart(2, '0');
      })
      .map(([data, pontoData]) => ({
        data,
        ...pontoData
      }));
    
    return pontosMes;
  } catch (error) {
    console.error('Erro ao buscar pontos do mês:', error);
    return [];
  }
};

// Uso:
const pontosOutubro = await buscarPontosMes('funcionarioId123', '2025', '10');
```

---

## ✅ Validações

### 1. Validação de Sequência de Horários

```javascript
const validarSequenciaHorarios = (pontos) => {
  const { entrada, saidaAlmoco, voltaAlmoco, saida } = pontos;
  
  // Verificar se pontos estão preenchidos
  const pontosPreenchidos = [entrada, saidaAlmoco, voltaAlmoco, saida]
    .filter(p => p !== '');
  
  if (pontosPreenchidos.length === 0) {
    return { valido: false, erro: 'Preencha pelo menos um ponto' };
  }
  
  // Converter para minutos
  const toMinutes = (time) => {
    if (!time) return null;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  
  const e = toMinutes(entrada);
  const sa = toMinutes(saidaAlmoco);
  const va = toMinutes(voltaAlmoco);
  const s = toMinutes(saida);
  
  // Validar ordem
  if (e && sa && e >= sa) {
    return { valido: false, erro: 'Entrada deve ser antes da saída para almoço' };
  }
  
  if (sa && va && sa >= va) {
    return { valido: false, erro: 'Saída do almoço deve ser antes da volta' };
  }
  
  if (va && s && va >= s) {
    return { valido: false, erro: 'Volta do almoço deve ser antes da saída final' };
  }
  
  if (e && s && e >= s) {
    return { valido: false, erro: 'Entrada deve ser antes da saída final' };
  }
  
  return { valido: true };
};

// Uso:
const validacao = validarSequenciaHorarios(pontosEdicao);
if (!validacao.valido) {
  toast.error(validacao.erro);
  return;
}
```

### 2. Validação de Horário Comercial

```javascript
const validarHorarioComercial = (horario) => {
  if (!horario) return true; // Campo opcional
  
  const [horas] = horario.split(':').map(Number);
  
  // Validar horário comercial (6h às 22h)
  if (horas < 6 || horas >= 22) {
    return { 
      valido: false, 
      erro: `Horário ${horario} fora do expediente comercial (6h-22h)`,
      aviso: true // Aviso, não erro crítico
    };
  }
  
  return { valido: true };
};
```

---

## 🔐 Regras de Segurança do Firestore

### rules.rules (Firestore Security Rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Coleção de pontos
    match /pontos/{funcionarioId} {
      
      // Permitir leitura para:
      // - O próprio funcionário
      // - Administradores
      // - Gerentes do setor
      allow read: if request.auth != null && (
        request.auth.uid == funcionarioId ||
        get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.nivel in ['admin', 'gerente']
      );
      
      // Permitir escrita apenas para:
      // - Administradores
      // - Gerentes do setor
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.nivel in ['admin', 'gerente'];
      
      // Validar estrutura dos dados
      allow update: if request.auth != null &&
        request.resource.data.keys().hasAll(['dados', 'metadata']) &&
        request.resource.data.metadata.funcionarioId == funcionarioId;
    }
  }
}
```

---

## 📋 Código Completo - Integrado

### ModalDetalhesEstatisticas.jsx (com Firestore)

```javascript
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { doc, updateDoc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
// ... imports de ícones

const ModalDetalhesEstatisticas = ({ 
  isOpen, 
  onClose, 
  tipo, 
  funcionario,
  stats,
  pontos,
  horasInfo 
}) => {
  const { usuario: usuarioLogado } = useAuth();
  
  // ... estados existentes
  
  // Carregar pontos existentes ao abrir modal de edição
  const carregarPontosExistentes = async (data) => {
    try {
      const pontosRef = doc(db, 'pontos', funcionario.id);
      const pontosSnap = await getDoc(pontosRef);
      
      if (pontosSnap.exists()) {
        const dados = pontosSnap.data();
        if (dados.dados && dados.dados[data]) {
          // Preencher campos com dados existentes
          setPontosEdicao({
            entrada: dados.dados[data].entrada || '',
            saidaAlmoco: dados.dados[data].saidaAlmoco || '',
            voltaAlmoco: dados.dados[data].voltaAlmoco || '',
            saida: dados.dados[data].saida || ''
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar pontos existentes:', error);
    }
  };
  
  // Abrir modal e carregar dados
  const abrirModalEdicao = async () => {
    const hoje = new Date().toISOString().split('T')[0];
    setDataEdicao(hoje);
    await carregarPontosExistentes(hoje);
    setMostrarModalEdicao(true);
  };
  
  // Calcular horas trabalhadas
  const calcularHorasTrabalhadas = (pontos) => {
    const { entrada, saidaAlmoco, voltaAlmoco, saida } = pontos;
    
    if (!entrada || !saidaAlmoco || !voltaAlmoco || !saida) {
      return "--h --m";
    }
    
    try {
      const toMinutes = (time) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
      };
      
      const entradaMin = toMinutes(entrada);
      const saidaAlmocoMin = toMinutes(saidaAlmoco);
      const voltaAlmocoMin = toMinutes(voltaAlmoco);
      const saidaMin = toMinutes(saida);
      
      const periodo1 = saidaAlmocoMin - entradaMin;
      const periodo2 = saidaMin - voltaAlmocoMin;
      
      const totalMinutos = periodo1 + periodo2;
      const horas = Math.floor(totalMinutos / 60);
      const minutos = totalMinutos % 60;
      
      return `${horas}h ${minutos}m`;
    } catch (error) {
      console.error('Erro ao calcular horas:', error);
      return "--h --m";
    }
  };
  
  // Salvar pontos no Firestore
  const salvarPontosEditados = async () => {
    if (!dataEdicao) {
      toast.error('Selecione uma data válida');
      return;
    }

    // Validar formato
    const regexHorario = /^([01]\d|2[0-3]):([0-5]\d)$/;
    const pontosValidos = Object.entries(pontosEdicao).filter(([_, valor]) => valor !== '');
    
    for (const [campo, valor] of pontosValidos) {
      if (!regexHorario.test(valor)) {
        toast.error(`Horário inválido no campo ${campo}. Use o formato HH:MM`);
        return;
      }
    }

    const toastId = toast.loading('Salvando pontos...');
    
    try {
      const pontosRef = doc(db, 'pontos', funcionario.id);
      const horasTrabalhadas = calcularHorasTrabalhadas(pontosEdicao);
      
      const dadosPonto = {
        [`dados.${dataEdicao}`]: {
          entrada: pontosEdicao.entrada || null,
          saidaAlmoco: pontosEdicao.saidaAlmoco || null,
          voltaAlmoco: pontosEdicao.voltaAlmoco || null,
          saida: pontosEdicao.saida || null,
          editadoPor: usuarioLogado.id,
          editadoEm: serverTimestamp(),
          horasTrabalhadas: horasTrabalhadas,
          observacao: "Editado manualmente"
        },
        'metadata.ultimaAtualizacao': serverTimestamp()
      };

      await updateDoc(pontosRef, dadosPonto).catch(async (error) => {
        if (error.code === 'not-found') {
          await setDoc(pontosRef, {
            dados: {
              [dataEdicao]: dadosPonto[`dados.${dataEdicao}`]
            },
            metadata: {
              funcionarioId: funcionario.id,
              nome: funcionario.nome,
              ultimaAtualizacao: serverTimestamp(),
              totalPontosRegistrados: 1
            }
          });
        } else {
          throw error;
        }
      });

      toast.update(toastId, {
        render: '✓ Pontos salvos com sucesso!',
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });

      setMostrarModalEdicao(false);
      setPontosEdicao({
        entrada: '',
        saidaAlmoco: '',
        voltaAlmoco: '',
        saida: ''
      });
      
    } catch (error) {
      console.error('Erro ao salvar pontos:', error);
      toast.update(toastId, {
        render: 'Erro ao salvar pontos. Tente novamente.',
        type: 'error',
        isLoading: false,
        autoClose: 3000
      });
    }
  };
  
  // ... resto do componente
};
```

---

## 🧪 Testes

### 1. Testar Salvamento

```javascript
// No console do navegador:
const testarSalvamento = async () => {
  const dados = {
    entrada: '08:00',
    saidaAlmoco: '12:00',
    voltaAlmoco: '13:00',
    saida: '17:30'
  };
  
  await salvarPontosEditados(dados, '2025-10-08', 'funcionarioId123');
};
```

### 2. Testar Leitura

```javascript
const testarLeitura = async () => {
  const pontos = await buscarPontosFuncionario('funcionarioId123');
  console.log('Pontos:', pontos);
};
```

---

## 📚 Referências

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Timestamps](https://firebase.google.com/docs/reference/js/firestore_.md#servertimestamp)

---

**Última Atualização:** 08/10/2025  
**Versão:** 1.0.0
