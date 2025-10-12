import React from 'react';
import { useStatePersistence } from '../../hooks/useStatePersistence';

/*
Este é um exemplo de como usar o hook useStatePersistence em qualquer componente.
Para implementar em outros componentes, siga este padrão:

1. Importe o useStatePersistence
2. Defina um ID único para o componente
3. Defina os estados iniciais
4. Use o hook para persistir os estados
5. Use updateState para atualizar valores
6. Use getState para ler valores
7. Use clearStates quando precisar limpar os estados

Exemplo de uso:
*/

const ExemploComponente = () => {
  // 1. Define um ID único para o componente
  const componentId = 'exemplo-componente';

  // 2. Define os estados iniciais
  const defaultStates = {
    filtro: '',
    ordenacao: 'asc',
    pagina: 1,
    itensPorPagina: 10,
    formData: {
      nome: '',
      quantidade: 0,
      categoria: ''
    }
  };

  // 3. Usa o hook para persistir os estados
  const { states, updateState, getState, clearStates } = useStatePersistence(componentId, defaultStates);

  // 4. Exemplo de como atualizar um estado
  const handleFiltroChange = (e) => {
    updateState('filtro', e.target.value);
  };

  // 5. Exemplo de como atualizar um estado aninhado
  const handleFormChange = (field, value) => {
    updateState('formData', {
      ...states.formData,
      [field]: value
    });
  };

  // 6. Exemplo de como limpar os estados
  const handleReset = () => {
    clearStates();
  };

  return (
    <div>
      {/* Exemplo de input que persiste seu valor */}
      <input
        type="text"
        value={states.filtro}
        onChange={handleFiltroChange}
        placeholder="Filtrar..."
      />

      {/* Exemplo de form que persiste seus valores */}
      <form>
        <input
          type="text"
          value={states.formData.nome}
          onChange={(e) => handleFormChange('nome', e.target.value)}
          placeholder="Nome"
        />
        <input
          type="number"
          value={states.formData.quantidade}
          onChange={(e) => handleFormChange('quantidade', e.target.value)}
          placeholder="Quantidade"
        />
        <select
          value={states.formData.categoria}
          onChange={(e) => handleFormChange('categoria', e.target.value)}
        >
          <option value="">Selecione uma categoria...</option>
          <option value="cat1">Categoria 1</option>
          <option value="cat2">Categoria 2</option>
        </select>
      </form>

      {/* Botão para limpar os estados */}
      <button onClick={handleReset}>Limpar Estados</button>
    </div>
  );
};

export default ExemploComponente;

/*
Para usar em outros componentes:

1. Substitua os useState por useStatePersistence:

De:
const [filtro, setFiltro] = useState('');
const [ordenacao, setOrdenacao] = useState('asc');

Para:
const { states, updateState } = useStatePersistence('seu-componente-id', {
  filtro: '',
  ordenacao: 'asc'
});

2. Substitua as chamadas de setState:

De:
setFiltro(e.target.value);

Para:
updateState('filtro', e.target.value);

3. Use os valores dos estados:

De:
value={filtro}

Para:
value={states.filtro}

4. Para estados aninhados (como formData), sempre faça um spread do objeto anterior:

updateState('formData', {
  ...states.formData,
  campo: novoValor
});

5. Não esqueça de limpar os estados quando necessário:

const handleLogout = () => {
  clearStates();
  // ... resto da lógica de logout
};

*/
