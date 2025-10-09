/**
 * GUIA DE USO: useCachedData Hook
 * 
 * Este hook permite buscar dados do Firebase priorizando o cache local (IndexedDB)
 * para melhorar a performance e permitir uso offline.
 * 
 * ================================================================================
 * 
 * IMPORTAÇÃO:
 * 
 * import { useCachedData, useAllCached, useCachedDocument } from '../hooks/useCachedData';
 * 
 * ================================================================================
 * 
 * EXEMPLO 1: Buscar todos os documentos de uma coleção (cache first)
 * 
 * const MeuComponente = () => {
 *   const { data: funcionarios, loading, error, isFromCache } = useCachedData('funcionarios');
 *   
 *   if (loading) return <div>Carregando...</div>;
 *   if (error) return <div>Erro: {error}</div>;
 *   
 *   return (
 *     <div>
 *       {isFromCache && <span>📦 Dados do cache</span>}
 *       {funcionarios.map(func => (
 *         <div key={func.id}>{func.nome}</div>
 *       ))}
 *     </div>
 *   );
 * };
 * 
 * ================================================================================
 * 
 * EXEMPLO 2: Buscar com filtros
 * 
 * const MinhasFerramentas = ({ funcionarioId }) => {
 *   const { data: emprestimos, loading } = useCachedData('emprestimos', {
 *     filters: [
 *       { field: 'funcionarioId', operator: '==', value: funcionarioId },
 *       { field: 'status', operator: '==', value: 'ativo' }
 *     ]
 *   });
 *   
 *   return (
 *     <div>
 *       {emprestimos.map(emp => (
 *         <div key={emp.id}>{emp.ferramenta}</div>
 *       ))}
 *     </div>
 *   );
 * };
 * 
 * ================================================================================
 * 
 * EXEMPLO 3: Tempo real (mantém listener no Firebase)
 * 
 * const ChatMensagens = () => {
 *   const { data: mensagens, loading } = useCachedData('mensagens', {
 *     realTime: true,  // ✅ Mantém sincronizado em tempo real
 *     filters: [
 *       { field: 'conversaId', operator: '==', value: 'conv123' }
 *     ]
 *   });
 *   
 *   return (
 *     <div>
 *       {mensagens.map(msg => (
 *         <div key={msg.id}>{msg.texto}</div>
 *       ))}
 *     </div>
 *   );
 * };
 * 
 * ================================================================================
 * 
 * EXEMPLO 4: Forçar busca no Firebase (ignorar cache)
 * 
 * const DadosCriticos = () => {
 *   const { data, loading, refresh } = useCachedData('pontos', {
 *     forceFirebase: true  // ⚡ Sempre busca dados atualizados do Firebase
 *   });
 *   
 *   return (
 *     <div>
 *       <button onClick={refresh}>🔄 Atualizar</button>
 *       {data.map(item => (
 *         <div key={item.id}>{item.data}</div>
 *       ))}
 *     </div>
 *   );
 * };
 * 
 * ================================================================================
 * 
 * EXEMPLO 5: Hook simplificado (todos os dados do cache)
 * 
 * const ListaSimples = () => {
 *   const { data: inventario, loading } = useAllCached('inventario');
 *   
 *   if (loading) return <div>Carregando...</div>;
 *   
 *   return (
 *     <div>
 *       {inventario.map(item => (
 *         <div key={item.id}>{item.nome}</div>
 *       ))}
 *     </div>
 *   );
 * };
 * 
 * ================================================================================
 * 
 * EXEMPLO 6: Buscar um único documento
 * 
 * const DetalhesFuncionario = ({ funcionarioId }) => {
 *   const { data: funcionario, loading } = useCachedDocument('funcionarios', funcionarioId);
 *   
 *   if (loading) return <div>Carregando...</div>;
 *   if (!funcionario) return <div>Funcionário não encontrado</div>;
 *   
 *   return (
 *     <div>
 *       <h2>{funcionario.nome}</h2>
 *       <p>{funcionario.cargo}</p>
 *     </div>
 *   );
 * };
 * 
 * ================================================================================
 * 
 * EXEMPLO 7: Combinando cache + refresh manual
 * 
 * const Ranking = () => {
 *   const { 
 *     data: pontos, 
 *     loading, 
 *     refresh, 
 *     isFromCache 
 *   } = useCachedData('pontos', {
 *     filters: [
 *       { field: 'data', operator: '>=', value: inicioDoMes }
 *     ]
 *   });
 *   
 *   return (
 *     <div>
 *       {isFromCache && (
 *         <div className="alert">
 *           📦 Dados do cache. 
 *           <button onClick={refresh}>Atualizar</button>
 *         </div>
 *       )}
 *       
 *       {pontos.map(ponto => (
 *         <div key={ponto.id}>{ponto.funcionario}</div>
 *       ))}
 *     </div>
 *   );
 * };
 * 
 * ================================================================================
 * 
 * OPERADORES DISPONÍVEIS PARA FILTROS:
 * 
 * - '==' : Igual
 * - '!=' : Diferente
 * - '<'  : Menor que
 * - '<=' : Menor ou igual
 * - '>'  : Maior que
 * - '>=' : Maior ou igual
 * - 'in' : Está em (array)
 * - 'array-contains' : Array contém valor
 * 
 * ================================================================================
 * 
 * RETORNO DO HOOK:
 * 
 * {
 *   data: [],          // Array de documentos
 *   loading: false,    // Estado de carregamento
 *   error: null,       // Mensagem de erro (se houver)
 *   refresh: fn,       // Função para recarregar do Firebase
 *   isFromCache: true  // Se os dados vieram do cache local
 * }
 * 
 * ================================================================================
 * 
 * FLUXO DE BUSCA:
 * 
 * 1. Tenta buscar do cache local (IndexedDB) - INSTANTÂNEO ⚡
 * 2. Se cache vazio ou forceFirebase=true, busca do Firebase
 * 3. Se realTime=true, mantém listener ativo para atualizações
 * 4. Função refresh() força nova busca do Firebase a qualquer momento
 * 
 * ================================================================================
 * 
 * BENEFÍCIOS:
 * 
 * ✅ Carregamento instantâneo (dados do cache)
 * ✅ Funciona offline
 * ✅ Reduz uso de Firebase (economia de custos)
 * ✅ Melhor experiência do usuário
 * ✅ Dados sempre disponíveis
 * 
 * ================================================================================
 */

// Este arquivo é apenas documentação - não precisa ser importado
