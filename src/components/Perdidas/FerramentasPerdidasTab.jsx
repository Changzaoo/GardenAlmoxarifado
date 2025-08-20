import React, { useState } from 'react';
import { useTheme } from '../AlmoxarifadoJardim';
import { useAuth } from '../../hooks/useAuth';
import { Search, Plus, Calendar, User, AlertTriangle, FileText } from 'lucide-react';

const FerramentasPerdidasTab = ({
  ferramentasPerdidas = [],
  inventario,
  adicionarFerramentaPerdida,
  atualizarFerramentaPerdida,
  removerFerramentaPerdida,
  readonly
}) => {
  const { classes } = useTheme();
  const { usuario } = useAuth();
  const isFuncionario = usuario?.nivel === 'funcionario';

  const [novaFerramenta, setNovaFerramenta] = useState({
    nomeItem: '',
    categoria: '',
    responsavel: '',
    dataOcorrencia: new Date().toISOString().split('T')[0],
    motivoPerda: '',
    observacoes: ''
  });
  const [filtro, setFiltro] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [idParaExcluir, setIdParaExcluir] = useState(null);

  const ferramentasFiltradas = ferramentasPerdidas.filter(item => {
    const matchFiltro =
      item.nomeItem.toLowerCase().includes(filtro.toLowerCase()) ||
      (item.motivoPerda || '').toLowerCase().includes(filtro.toLowerCase()) ||
      (item.responsavel || '').toLowerCase().includes(filtro.toLowerCase());
    return matchFiltro;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!novaFerramenta.nomeItem || !novaFerramenta.motivoPerda) {
      alert('Preencha o nome da ferramenta e o motivo da perda!');
      return;
    }
    const sucesso = await adicionarFerramentaPerdida(novaFerramenta);
    if (sucesso) {
      setNovaFerramenta({
        nomeItem: '',
        categoria: '',
        responsavel: '',
        dataOcorrencia: new Date().toISOString().split('T')[0],
        motivoPerda: '',
        observacoes: ''
      });
      setModalAberto(false);
      alert('Ferramenta perdida registrada com sucesso!');
    } else {
      alert('Erro ao registrar ferramenta perdida. Tente novamente.');
    }
  };

  return (
    <div className={`space-y-6 ${classes.backgroundPrimary}`}>
      <div className={classes.sectionHeader}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className={`${classes.sectionTitle} flex items-center gap-2`}>
              <AlertTriangle className="w-6 h-6" style={{ color: '#bd9967' }} />
              Ferramentas Perdidas
            </h2>
            <p className={classes.sectionSubtitle}>Controle e rastreamento de ferramentas perdidas</p>
          </div>
          {!isFuncionario && !readonly && (
            <button
              onClick={() => setModalAberto(true)}
              className={`${classes.buttonPrimary} px-4 py-2 flex items-center gap-2`}
              style={{ backgroundColor: '#bd9967' }}
            >
              <Plus className="w-4 h-4" />
              Registrar Perda
            </button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className={`w-4 h-4 absolute left-3 top-3 ${classes.textLight}`} />
            <input
              type="text"
              placeholder="Buscar por ferramenta, motivo ou responsável..."
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
              className={`pl-10 w-full px-3 py-2 ${classes.input} focus:ring-2 focus:border-transparent`}
              style={{ '--tw-ring-color': '#bd9967' }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {ferramentasFiltradas.map(item => (
          <div key={item.id} className={`${classes.card} p-6 border-l-4`} style={{ borderLeftColor: '#bd9967' }}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className={`font-bold text-lg ${classes.textPrimary} flex items-center gap-2`}>
                  <AlertTriangle className="w-5 h-5" style={{ color: '#bd9967' }} />
                  {item.nomeItem}
                </h3>
                {item.categoria && (
                  <p className={`text-sm ${classes.textMuted}`}>{item.categoria}</p>
                )}
              </div>
              <div className="flex flex-col gap-2 items-end">
                <span className={`px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300`}>
                  Perdida
                </span>
                {!readonly && (
                  <button
                    className={`p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200 mt-2`}
                    title="Excluir ferramenta perdida"
                    onClick={() => setIdParaExcluir(item.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m2 0v14a2 2 0 01-2 2H8a2 2 0 01-2-2V6m5 10v-6" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className={`${classes.alertWarning} p-3 rounded-lg`}>
                <div className="flex items-center gap-2 font-medium mb-1">
                  <FileText className="w-4 h-4" />
                  Descrição
                </div>
                <p className={classes.textPrimary}>{item.motivoPerda}</p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className={`flex items-center gap-2 ${classes.textSecondary}`}>
                  <User className="w-4 h-4" />
                  <span><strong>Responsável:</strong> {item.responsavel}</span>
                </div>
                <div className={`flex items-center gap-2 ${classes.textSecondary}`}>
                  <Calendar className="w-4 h-4" />
                  <span><strong>Data da Ocorrência:</strong> {new Date(item.dataOcorrencia).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              {item.observacoes && (
                <div className={`${classes.containerSecondary} p-2 rounded`}>
                  <strong className={classes.textPrimary}>Observações:</strong>
                  <p className={`${classes.textSecondary} mt-1`}>{item.observacoes}</p>
                </div>
              )}
              <div className={`text-xs ${classes.textMuted} border-t pt-2`}>
                Ocorrido há {Math.floor((new Date() - new Date(item.dataOcorrencia)) / (1000 * 60 * 60 * 24))} dias
              </div>
            </div>
          </div>
        ))}
      </div>

      {ferramentasFiltradas.length === 0 && (
        <div className={`${classes.card} p-8 text-center`}>
          <Search className="w-16 h-16 mx-auto mb-4" style={{ color: '#bd9967' }} />
          <p className={`text-lg ${classes.textSecondary}`}>
            {filtro
              ? 'Nenhuma ferramenta perdida encontrada'
              : 'Nenhuma ferramenta perdida registrada'
            }
          </p>
          <p className={`text-sm ${classes.textMuted} mt-2`}>
            {filtro
              ? 'Tente alterar os filtros de busca'
              : 'Clique em "Registrar Perda" para adicionar uma ocorrência'
            }
          </p>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {idParaExcluir && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${classes.modal} max-w-md w-full p-6`}>
            <h3 className={`text-lg font-bold ${classes.textPrimary} mb-4 flex items-center gap-2`}>
              <AlertTriangle className="w-5 h-5" style={{ color: '#bd9967' }} />
              Confirmar exclusão
            </h3>
            <p className={`mb-4 ${classes.textSecondary}`}>Tem certeza que deseja excluir este registro de ferramenta perdida? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                className={`flex-1 ${classes.buttonDanger} py-2 px-4`}
                onClick={async () => {
                  await removerFerramentaPerdida(idParaExcluir);
                  setIdParaExcluir(null);
                }}
              >
                Excluir
              </button>
              <button
                className={`flex-1 ${classes.buttonSecondary} py-2 px-4`}
                onClick={() => setIdParaExcluir(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nova Ferramenta Perdida */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${classes.modal} max-w-3xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-lg font-bold ${classes.textPrimary} flex items-center gap-2`}>
                  <AlertTriangle className="w-5 h-5" style={{ color: '#bd9967' }} />
                  Registrar Ferramenta Perdida
                </h3>
                <button
                  onClick={() => setModalAberto(false)}
                  className={`${classes.textLight} hover:${classes.textSecondary}`}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={classes.formLabel}>Nome da Ferramenta *</label>
                    <input
                      type="text"
                      value={novaFerramenta.nomeItem}
                      onChange={e => setNovaFerramenta({ ...novaFerramenta, nomeItem: e.target.value })}
                      className={`w-full ${classes.input} px-3 py-2 focus:ring-2 focus:border-transparent`}
                      style={{ '--tw-ring-color': '#bd9967' }}
                      required
                    />
                  </div>
                  <div>
                    <label className={classes.formLabel}>Categoria</label>
                    <input
                      type="text"
                      value={novaFerramenta.categoria}
                      onChange={e => setNovaFerramenta({ ...novaFerramenta, categoria: e.target.value })}
                      className={`w-full ${classes.input} px-3 py-2 focus:ring-2 focus:border-transparent`}
                      style={{ '--tw-ring-color': '#bd9967' }}
                    />
                  </div>
                </div>
                <div>
                  <label className={classes.formLabel}>Detalhes *</label>
                  <textarea
                    value={novaFerramenta.motivoPerda}
                    onChange={e => setNovaFerramenta({ ...novaFerramenta, motivoPerda: e.target.value })}
                    className={`w-full ${classes.formTextarea} focus:ring-2 focus:border-transparent`}
                    style={{ '--tw-ring-color': '#bd9967' }}
                    rows={3}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={classes.formLabel}>Responsável</label>
                    <input
                      type="text"
                      value={novaFerramenta.responsavel}
                      onChange={e => setNovaFerramenta({ ...novaFerramenta, responsavel: e.target.value })}
                      className={`w-full ${classes.input} px-3 py-2 focus:ring-2 focus:border-transparent`}
                      style={{ '--tw-ring-color': '#bd9967' }}
                    />
                  </div>
                  <div>
                    <label className={classes.formLabel}>Data da Ocorrência</label>
                    <input
                      type="date"
                      value={novaFerramenta.dataOcorrencia}
                      onChange={e => setNovaFerramenta({ ...novaFerramenta, dataOcorrencia: e.target.value })}
                      className={`w-full ${classes.input} px-3 py-2 focus:ring-2 focus:border-transparent`}
                      style={{ '--tw-ring-color': '#bd9967' }}
                    />
                  </div>
                </div>
                <div>
                  <label className={classes.formLabel}>Observações</label>
                  <textarea
                    value={novaFerramenta.observacoes}
                    onChange={e => setNovaFerramenta({ ...novaFerramenta, observacoes: e.target.value })}
                    className={`w-full ${classes.formTextarea} focus:ring-2 focus:border-transparent`}
                    style={{ '--tw-ring-color': '#bd9967' }}
                    rows={2}
                  />
                </div>
                <div className={`p-4 rounded-lg ${classes.alertInfo}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">Dicas para registro:</span>
                  </div>
                  <ul className="text-sm space-y-1">
                    <li>• Descreva com detalhes o motivo da perda</li>
                    <li>• Informe o responsável e a data da ocorrência</li>
                    <li>• Adicione observações relevantes</li>
                  </ul>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className={`flex-1 ${classes.buttonPrimary} py-2 px-4`}
                    style={{ backgroundColor: '#bd9967' }}
                  >
                    Registrar Ferramenta Perdida
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalAberto(false)}
                    className={`flex-1 ${classes.buttonSecondary} py-2 px-4`}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FerramentasPerdidasTab;