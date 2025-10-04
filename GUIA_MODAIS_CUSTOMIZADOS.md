# 🎨 Sistema de Modais Customizados

Sistema completo para substituir `alert()`, `confirm()` e `prompt()` nativos do navegador por modais customizados e elegantes.

---

## 📦 Arquivos Criados

### 1. **CustomModal.jsx** - Componente de Modal
```
src/components/common/CustomModal.jsx
```
Componente reutilizável com 5 tipos de modal:
- `alert` - Aviso simples (azul)
- `confirm` - Confirmação com OK/Cancelar (amarelo)
- `success` - Mensagem de sucesso (verde)
- `error` - Mensagem de erro (vermelho)
- `info` - Informação (azul)

### 2. **useModal.jsx** - Hook Customizado
```
src/hooks/useModal.jsx
```
Hook que gerencia o estado dos modais e fornece métodos auxiliares:
- `showAlert(message, title)`
- `showConfirm(message, title, options)`
- `showSuccess(message, title)`
- `showError(message, title)`
- `showInfo(message, title)`

### 3. **CustomModal.css** - Animações
```
src/components/common/CustomModal.css
```
Animações suaves de entrada (fadeIn, slideUp)

---

## 🚀 Como Usar

### **Passo 1: Importar no Componente**

```javascript
import { useModal } from '../../hooks/useModal';
import CustomModal from '../common/CustomModal';
```

### **Passo 2: Inicializar o Hook**

```javascript
const MeuComponente = () => {
  const { 
    modalState, 
    handleConfirm, 
    handleCancel, 
    showAlert,
    showConfirm, 
    showSuccess, 
    showError,
    showInfo
  } = useModal();
  
  // ... resto do código
```

### **Passo 3: Adicionar o Modal no JSX**

No final do `return`, adicione:

```javascript
return (
  <div>
    {/* Seu conteúdo aqui */}
    
    {/* Modal Customizado - SEMPRE no final */}
    <CustomModal
      isOpen={modalState.isOpen}
      type={modalState.type}
      title={modalState.title}
      message={modalState.message}
      confirmText={modalState.confirmText}
      cancelText={modalState.cancelText}
      showCancel={modalState.showCancel}
      onConfirm={handleConfirm}
      onClose={handleCancel}
    />
  </div>
);
```

---

## 💡 Exemplos de Uso

### **1. Substituir `alert()`**

**Antes:**
```javascript
alert('Operação realizada com sucesso!');
```

**Depois:**
```javascript
await showSuccess('Operação realizada com sucesso!');
```

### **2. Substituir `confirm()`**

**Antes:**
```javascript
if (confirm('Deseja realmente excluir?')) {
  // Excluir
}
```

**Depois:**
```javascript
const confirmed = await showConfirm('Deseja realmente excluir?');
if (confirmed) {
  // Excluir
}
```

### **3. Mensagem de Erro**

**Antes:**
```javascript
alert('Erro: ' + error.message);
```

**Depois:**
```javascript
await showError(`Erro: ${error.message}`);
```

### **4. Confirmação com Customização**

```javascript
const confirmed = await showConfirm(
  'Esta ação não pode ser desfeita.',
  'Confirmar Exclusão',
  {
    confirmText: 'Sim, excluir',
    cancelText: 'Não, manter'
  }
);
```

### **5. Mensagem com Múltiplas Linhas**

```javascript
await showInfo(
  'Operação concluída!\n\n' +
  '• 5 itens processados\n' +
  '• 2 avisos encontrados\n' +
  '• 0 erros'
);
```

---

## 🎨 Tipos de Modal

### **Alert (Padrão)**
```javascript
await showAlert('Esta é uma mensagem de aviso');
```
- Cor: Azul
- Botão: "OK"
- Ícone: ℹ️

### **Confirm (Confirmação)**
```javascript
const result = await showConfirm('Deseja continuar?');
// result será true ou false
```
- Cor: Amarelo
- Botões: "OK" e "Cancelar"
- Ícone: ⚠️

### **Success (Sucesso)**
```javascript
await showSuccess('Dados salvos com sucesso!');
```
- Cor: Verde
- Botão: "OK"
- Ícone: ✓

### **Error (Erro)**
```javascript
await showError('Falha ao processar requisição');
```
- Cor: Vermelho
- Botão: "OK"
- Ícone: ✕

### **Info (Informação)**
```javascript
await showInfo('O sistema será atualizado em breve');
```
- Cor: Azul
- Botão: "OK"
- Ícone: ℹ️

---

## 🔧 Componentes que Precisam de Atualização

Busque e substitua em todos os arquivos:

### **Buscar por:**
```javascript
alert(
confirm(
window.alert(
window.confirm(
```

### **Locais Comuns:**
- `src/components/usuarios/UsuariosTab.jsx`
- `src/components/Inventario/InventarioTab.jsx`
- `src/components/Emprestimos/EmprestimosTab.jsx`
- `src/components/Tarefas/TarefasTab.jsx`
- `src/components/Funcionarios/FuncionariosTab.jsx`
- `src/components/Admin/SistemaResumo.jsx` ✅ **JÁ FEITO**
- E todos os outros componentes

---

## ✅ Checklist de Implementação

Para cada componente:

- [ ] Importar `useModal` e `CustomModal`
- [ ] Inicializar o hook no início do componente
- [ ] Adicionar `<CustomModal />` no final do JSX
- [ ] Substituir todos os `alert()` por `showAlert()` ou `showSuccess()` ou `showError()`
- [ ] Substituir todos os `confirm()` por `showConfirm()`
- [ ] Adicionar `await` antes das chamadas
- [ ] Testar todas as funcionalidades

---

## 🎯 Exemplo Completo

```javascript
import React, { useState } from 'react';
import { useModal } from '../../hooks/useModal';
import CustomModal from '../common/CustomModal';

const MeuComponente = () => {
  const { 
    modalState, 
    handleConfirm, 
    handleCancel, 
    showConfirm, 
    showSuccess, 
    showError 
  } = useModal();
  
  const [loading, setLoading] = useState(false);

  const handleDelete = async (id) => {
    const confirmed = await showConfirm(
      'Tem certeza que deseja excluir este item?',
      'Confirmar Exclusão'
    );
    
    if (!confirmed) return;
    
    setLoading(true);
    try {
      // Lógica de exclusão
      await deleteItem(id);
      await showSuccess('Item excluído com sucesso!');
    } catch (error) {
      await showError(`Erro ao excluir: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => handleDelete('123')}>
        Excluir
      </button>

      {/* Modal Customizado */}
      <CustomModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        showCancel={modalState.showCancel}
        onConfirm={handleConfirm}
        onClose={handleCancel}
      />
    </div>
  );
};

export default MeuComponente;
```

---

## 🚨 Importante

1. **Sempre use `await`** antes de `showConfirm()`, `showAlert()`, etc.
2. **Adicione o `<CustomModal />`** no final do JSX de cada componente
3. **Não misture** modais nativos com customizados no mesmo componente
4. **Teste todas as funcionalidades** após a substituição

---

## 🎨 Personalização

Para customizar cores, edite o objeto `configs` em `CustomModal.jsx`:

```javascript
const configs = {
  alert: {
    iconColor: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    buttonColor: 'from-blue-500 to-blue-600 ...'
  },
  // ...
};
```

---

## 📝 Status de Implementação

- ✅ **SistemaResumo.jsx** - Implementado
- ⏳ **UsuariosTab.jsx** - Pendente
- ⏳ **InventarioTab.jsx** - Pendente
- ⏳ **EmprestimosTab.jsx** - Pendente
- ⏳ **TarefasTab.jsx** - Pendente
- ⏳ **FuncionariosTab.jsx** - Pendente
- ⏳ **Outros componentes** - Pendente

---

## 🐛 Troubleshooting

**Problema:** Modal não aparece
- ✅ Verifique se `<CustomModal />` está no JSX
- ✅ Verifique se o hook foi inicializado corretamente

**Problema:** Botões não funcionam
- ✅ Verifique se `handleConfirm` e `handleCancel` estão passados corretamente
- ✅ Verifique se está usando `await` antes das chamadas

**Problema:** Animações não funcionam
- ✅ Verifique se `CustomModal.css` foi importado
- ✅ Verifique se as classes `animate-fadeIn` e `animate-slideUp` estão aplicadas

---

Desenvolvido com ❤️ para o Workflow Sistema de Gestão
