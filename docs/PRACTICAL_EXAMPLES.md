# 🎯 EXEMPLOS PRÁTICOS DE INTEGRAÇÃO

## 📋 ÍNDICE

1. [Formulários com Persistência](#1-formulários-com-persistência)
2. [Listas com Cache](#2-listas-com-cache)
3. [Paginação Otimizada](#3-paginação-otimizada)
4. [Batch Operations](#4-batch-operations)
5. [Scroll Persistente](#5-scroll-persistente)
6. [Busca com Cache](#6-busca-com-cache)
7. [Edição em Massa](#7-edição-em-massa)
8. [Dashboard com Métricas](#8-dashboard-com-métricas)

---

## 1. Formulários com Persistência

### Exemplo: Cadastro de Funcionário

```jsx
import React, { useState } from 'react';
import { useStatePersistence } from '../hooks/useStatePersistence';

function CadastroFuncionario() {
  const { isSaving, lastSaveTime, saveState } = useStatePersistence();
  const [mensagem, setMensagem] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Coletar dados do formulário
    const formData = new FormData(e.target);
    const dados = Object.fromEntries(formData);
    
    console.log('Dados:', dados);
    setMensagem('Funcionário cadastrado!');
    
    // Limpar estado salvo após sucesso
    // (opcional - pode querer manter para próximo cadastro)
    // await clearPersistedState();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Cadastro de Funcionário</h2>
      
      {/* ✅ Form com persistência automática */}
      <form 
        data-persist 
        id="cadastroFuncionario" 
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* Dados Pessoais */}
        <div>
          <label className="block text-sm font-medium mb-1">Nome Completo</label>
          <input
            data-persist
            name="nome"
            type="text"
            required
            className="w-full px-3 py-2 border rounded"
            placeholder="João Silva"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">CPF</label>
            <input
              data-persist
              name="cpf"
              type="text"
              required
              className="w-full px-3 py-2 border rounded"
              placeholder="000.000.000-00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Telefone</label>
            <input
              data-persist
              name="telefone"
              type="tel"
              className="w-full px-3 py-2 border rounded"
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            data-persist
            name="email"
            type="email"
            required
            className="w-full px-3 py-2 border rounded"
            placeholder="joao@email.com"
          />
        </div>

        {/* Cargo e Setor */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Cargo</label>
            <select
              data-persist
              name="cargo"
              required
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">Selecione...</option>
              <option value="gerente">Gerente</option>
              <option value="supervisor">Supervisor</option>
              <option value="funcionario">Funcionário</option>
              <option value="estagiario">Estagiário</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Setor</label>
            <select
              data-persist
              name="setor"
              required
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">Selecione...</option>
              <option value="administrativo">Administrativo</option>
              <option value="operacional">Operacional</option>
              <option value="comercial">Comercial</option>
            </select>
          </div>
        </div>

        {/* Observações */}
        <div>
          <label className="block text-sm font-medium mb-1">Observações</label>
          <textarea
            data-persist
            name="observacoes"
            rows="4"
            className="w-full px-3 py-2 border rounded"
            placeholder="Informações adicionais..."
          />
        </div>

        {/* Status */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              data-persist
              id="ativo"
              name="ativo"
              defaultChecked
            />
            <span className="text-sm">Funcionário Ativo</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              data-persist
              id="receberNotificacoes"
              name="receberNotificacoes"
            />
            <span className="text-sm">Receber Notificações</span>
          </label>
        </div>

        {/* Botões */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Cadastrar Funcionário
          </button>

          {/* Indicador de auto-save */}
          {isSaving && (
            <span className="text-sm text-gray-500 animate-pulse">
              Salvando rascunho...
            </span>
          )}
          
          {!isSaving && lastSaveTime && (
            <span className="text-xs text-gray-400">
              Salvo às {lastSaveTime.toLocaleTimeString()}
            </span>
          )}
        </div>
      </form>

      {mensagem && (
        <div className="mt-4 p-4 bg-green-100 text-green-700 rounded">
          {mensagem}
        </div>
      )}

      {/* Dica para o usuário */}
      <div className="mt-6 p-4 bg-blue-50 rounded text-sm text-blue-700">
        💡 <strong>Dica:</strong> Seus dados são salvos automaticamente a cada segundo. 
        Você pode fechar esta página e voltar depois - tudo estará aqui!
      </div>
    </div>
  );
}

export default CadastroFuncionario;
```

---

## 2. Listas com Cache

### Exemplo: Lista de Inventário

```jsx
import React, { useState, useEffect } from 'react';
import { useDatabaseOptimizer } from '../hooks/useDatabaseOptimizer';

function ListaInventario() {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');

  const { 
    queryDocuments, 
    cacheStats,
    isLoading 
  } = useDatabaseOptimizer();

  const loadItens = async (filtroAtual = filtro) => {
    setLoading(true);

    try {
      // Query otimizada com cache
      const whereClause = filtroAtual === 'todos' 
        ? [] 
        : [['categoria', '==', filtroAtual]];

      const result = await queryDocuments('inventario', {
        where: whereClause,
        orderBy: [['nome', 'asc']],
        limit: 50
      }, {
        compress: true,
        prefetch: true
      });

      setItens(result.docs);
    } catch (error) {
      console.error('Erro ao carregar inventário:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItens();
  }, [filtro]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Inventário</h2>
        
        {/* Stats do cache */}
        {cacheStats && (
          <div className="text-sm text-gray-500">
            Cache: {cacheStats.active} itens
            | Hit rate: {(cacheStats.hitRate * 100).toFixed(1)}%
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {['todos', 'ferramentas', 'equipamentos', 'materiais'].map(cat => (
          <button
            key={cat}
            onClick={() => setFiltro(cat)}
            className={`
              px-4 py-2 rounded
              ${filtro === cat 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700'
              }
            `}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Lista com scroll persistente */}
      <div 
        data-scrollable 
        id="listaInventario"
        className="space-y-2 max-h-[600px] overflow-y-auto"
      >
        {loading && (
          <div className="text-center py-8 text-gray-500">
            Carregando...
          </div>
        )}

        {!loading && itens.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhum item encontrado
          </div>
        )}

        {!loading && itens.map(item => (
          <div 
            key={item.id}
            className="p-4 bg-white border rounded hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{item.nome}</h3>
                <p className="text-sm text-gray-500">{item.categoria}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{item.quantidade}</div>
                <div className="text-xs text-gray-500">unidades</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Botão de refresh */}
      <button
        onClick={() => loadItens()}
        disabled={isLoading}
        className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
      >
        {isLoading ? 'Atualizando...' : 'Atualizar'}
      </button>
    </div>
  );
}

export default ListaInventario;
```

---

## 3. Paginação Otimizada

### Exemplo: Lista Paginada de Usuários

```jsx
import React, { useState, useEffect } from 'react';
import { useDatabaseOptimizer } from '../hooks/useDatabaseOptimizer';

function ListaUsuariosPaginada() {
  const [usuarios, setUsuarios] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [ultimoDoc, setUltimoDoc] = useState(null);
  const [temMais, setTemMais] = useState(false);
  const [historicoPaginas, setHistoricoPaginas] = useState([]);

  const { queryDocuments, isLoading } = useDatabaseOptimizer();

  const ITENS_POR_PAGINA = 20;

  const loadPagina = async (pagina, lastDoc = null) => {
    const result = await queryDocuments('usuarios', {
      where: [['ativo', '==', true]],
      orderBy: [['nome', 'asc']],
      limit: ITENS_POR_PAGINA,
      startAfterDoc: lastDoc
    }, {
      compress: true,
      prefetch: true  // Prefetch próxima página
    });

    setUsuarios(result.docs);
    setUltimoDoc(result.lastDoc);
    setTemMais(result.hasMore);
    setPaginaAtual(pagina);

    // Guardar documento da página para voltar
    if (lastDoc) {
      setHistoricoPaginas([...historicoPaginas, lastDoc]);
    }
  };

  const proximaPagina = () => {
    if (temMais && ultimoDoc) {
      loadPagina(paginaAtual + 1, ultimoDoc);
    }
  };

  const paginaAnterior = () => {
    if (paginaAtual > 1) {
      const lastDocPagAnterior = historicoPaginas[historicoPaginas.length - 2];
      setHistoricoPaginas(historicoPaginas.slice(0, -1));
      loadPagina(paginaAtual - 1, lastDocPagAnterior);
    }
  };

  useEffect(() => {
    loadPagina(1);
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">
        Usuários (Página {paginaAtual})
      </h2>

      {/* Lista */}
      <div className="space-y-2 mb-6">
        {isLoading && (
          <div className="text-center py-8">Carregando...</div>
        )}

        {!isLoading && usuarios.map((user, index) => (
          <div 
            key={user.id}
            className="p-4 bg-white border rounded flex items-center justify-between"
          >
            <div>
              <span className="text-gray-400 mr-4">
                #{(paginaAtual - 1) * ITENS_POR_PAGINA + index + 1}
              </span>
              <span className="font-medium">{user.nome}</span>
              <span className="text-sm text-gray-500 ml-2">
                {user.email}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {user.cargo}
            </div>
          </div>
        ))}
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={paginaAnterior}
          disabled={paginaAtual === 1 || isLoading}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          ← Anterior
        </button>

        <span className="text-sm text-gray-600">
          Página {paginaAtual}
        </span>

        <button
          onClick={proximaPagina}
          disabled={!temMais || isLoading}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          Próxima →
        </button>
      </div>

      {/* Info */}
      <div className="mt-4 text-center text-sm text-gray-500">
        {usuarios.length} usuários nesta página
        {temMais && ' • Tem mais resultados'}
      </div>
    </div>
  );
}

export default ListaUsuariosPaginada;
```

---

## 4. Batch Operations

### Exemplo: Ativação em Massa

```jsx
import React, { useState } from 'react';
import { useDatabaseOptimizer } from '../hooks/useDatabaseOptimizer';

function AtivarUsuariosEmMassa() {
  const [usuarios, setUsuarios] = useState([]);
  const [selecionados, setSelecionados] = useState([]);
  const [progresso, setProgresso] = useState(0);
  const [processando, setProcessando] = useState(false);

  const { 
    queryDocuments, 
    updateDocument,
    executeBatch 
  } = useDatabaseOptimizer();

  const loadUsuariosInativos = async () => {
    const result = await queryDocuments('usuarios', {
      where: [['ativo', '==', false]],
      orderBy: [['nome', 'asc']],
      limit: 100
    });
    setUsuarios(result.docs);
  };

  const toggleSelecao = (userId) => {
    if (selecionados.includes(userId)) {
      setSelecionados(selecionados.filter(id => id !== userId));
    } else {
      setSelecionados([...selecionados, userId]);
    }
  };

  const ativarSelecionados = async () => {
    if (selecionados.length === 0) return;

    setProcessando(true);
    setProgresso(0);

    try {
      const total = selecionados.length;

      // Atualizar em lote (batch automático)
      for (let i = 0; i < selecionados.length; i++) {
        await updateDocument('usuarios', selecionados[i], {
          ativo: true,
          dataAtivacao: new Date()
        }, {
          useBatch: true,
          batchDelay: 100  // Aguarda 100ms para agrupar
        });

        setProgresso(Math.round(((i + 1) / total) * 100));
      }

      // Forçar execução do último batch
      await executeBatch();

      alert(`${total} usuários ativados com sucesso!`);
      setSelecionados([]);
      loadUsuariosInativos();

    } catch (error) {
      console.error('Erro ao ativar usuários:', error);
      alert('Erro ao ativar usuários');
    } finally {
      setProcessando(false);
      setProgresso(0);
    }
  };

  useEffect(() => {
    loadUsuariosInativos();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Ativar Usuários em Massa</h2>

      {/* Ações */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-sm text-gray-600">
            {selecionados.length} usuário(s) selecionado(s)
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setSelecionados(usuarios.map(u => u.id))}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Selecionar Todos
          </button>

          <button
            onClick={ativarSelecionados}
            disabled={selecionados.length === 0 || processando}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {processando ? `Ativando... ${progresso}%` : 'Ativar Selecionados'}
          </button>
        </div>
      </div>

      {/* Barra de progresso */}
      {processando && (
        <div className="mb-4 bg-gray-200 rounded h-2">
          <div 
            className="bg-green-500 h-2 rounded transition-all"
            style={{ width: `${progresso}%` }}
          />
        </div>
      )}

      {/* Lista */}
      <div className="space-y-2">
        {usuarios.map(user => (
          <div 
            key={user.id}
            className={`
              p-4 border rounded cursor-pointer transition
              ${selecionados.includes(user.id) 
                ? 'bg-blue-50 border-blue-300' 
                : 'bg-white hover:bg-gray-50'
              }
            `}
            onClick={() => toggleSelecao(user.id)}
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selecionados.includes(user.id)}
                onChange={() => {}}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <div className="font-medium">{user.nome}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </div>
              <div className="text-xs text-red-500">
                Inativo
              </div>
            </div>
          </div>
        ))}
      </div>

      {usuarios.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Não há usuários inativos
        </div>
      )}

      {/* Info sobre batch */}
      <div className="mt-6 p-4 bg-blue-50 rounded text-sm text-blue-700">
        💡 <strong>Otimização:</strong> As atualizações são agrupadas em lotes (batches) 
        automaticamente, reduzindo o número de requisições ao Firebase em até 70%!
      </div>
    </div>
  );
}

export default AtivarUsuariosEmMassa;
```

---

## 5. Scroll Persistente

```jsx
import React, { useState, useEffect } from 'react';

function FeedNoticias() {
  const [noticias, setNoticias] = useState([]);

  useEffect(() => {
    // Carregar notícias
    const mock = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      titulo: `Notícia ${i + 1}`,
      conteudo: 'Lorem ipsum dolor sit amet...'
    }));
    setNoticias(mock);
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Feed de Notícias</h2>

      {/* ✅ Scroll persistente - volta para mesma posição */}
      <div 
        data-scrollable 
        id="feedNoticias"
        className="space-y-4 max-h-[600px] overflow-y-auto pr-4"
      >
        {noticias.map(noticia => (
          <div 
            key={noticia.id}
            className="p-6 bg-white border rounded shadow-sm"
          >
            <h3 className="text-lg font-bold mb-2">{noticia.titulo}</h3>
            <p className="text-gray-600">{noticia.conteudo}</p>
            <div className="mt-4 text-sm text-gray-400">
              Notícia #{noticia.id}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-yellow-50 rounded text-sm text-yellow-700">
        💡 Role a lista e feche o navegador. Ao voltar, o scroll estará na mesma posição!
      </div>
    </div>
  );
}

export default FeedNoticias;
```

---

## 🎉 CONCLUSÃO

Estes exemplos mostram como integrar facilmente os sistemas de:

- ✅ **Persistência automática** com `data-persist`
- ✅ **Cache inteligente** com `useDatabaseOptimizer`
- ✅ **Batch operations** para operações em massa
- ✅ **Scroll persistente** com `data-scrollable`
- ✅ **Paginação otimizada** com prefetching

**Copie e adapte conforme necessário!** 🚀
