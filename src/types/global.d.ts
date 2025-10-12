/**
 * Tipos Globais do Sistema WorkFlow Garden Almoxarifado
 * 
 * Este arquivo contém as definições de tipos TypeScript globais
 * que são utilizados em todo o sistema.
 */

import { Timestamp, DocumentReference, FieldValue } from 'firebase/firestore';

// ============================================================================
// TIPOS BÁSICOS
// ============================================================================

export type FirebaseTimestamp = Timestamp | Date | FieldValue;
export type FirebaseDocRef = DocumentReference;

// ============================================================================
// USUARIO
// ============================================================================

export interface Usuario {
  id: string;
  nome: string;
  email?: string;
  senha?: string;
  nivel: NivelPermissao;
  cargo?: string;
  setor?: string;
  setorId?: string;
  empresa?: string;
  empresaId?: string;
  telefone?: string;
  cpf?: string;
  dataAdmissao?: FirebaseTimestamp;
  dataCriacao: FirebaseTimestamp;
  ultimoAcesso?: FirebaseTimestamp;
  ativo: boolean;
  primeiroAcesso?: boolean;
  fotoPerfil?: string;
  pontos?: number;
  pontosPerfeitos?: number;
  avaliacoes?: Avaliacao[];
  tarefasConcluidas?: number;
  emprestimosAtivos?: number;
  horasTrabalhadas?: number;
  biometricEnabled?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  notificationsEnabled?: boolean;
  lgpdConsent?: boolean;
  lgpdConsentDate?: FirebaseTimestamp;
  config?: {
    database?: string;
    autoSync?: boolean;
    offlineMode?: boolean;
  };
}

export type NivelPermissao = 
  | 'admin'
  | 'master'
  | 'gerente'
  | 'supervisor'
  | 'usuario'
  | 'almoxarife'
  | 'funcionario'
  | 'visualizador';

// ============================================================================
// FERRAMENTA / INVENTÁRIO
// ============================================================================

export interface Ferramenta {
  id: string;
  nome: string;
  categoria?: string;
  descricao?: string;
  codigo?: string;
  quantidade: number;
  quantidadeMinima?: number;
  quantidadeMaxima?: number;
  unidade?: string;
  localizacao?: string;
  setor?: string;
  setorId?: string;
  empresa?: string;
  empresaId?: string;
  preco?: number;
  valorTotal?: number;
  fornecedor?: string;
  dataCompra?: FirebaseTimestamp;
  dataCadastro: FirebaseTimestamp;
  ultimaAtualizacao?: FirebaseTimestamp;
  ultimaVerificacao?: FirebaseTimestamp;
  status?: StatusFerramenta;
  imagem?: string;
  observacoes?: string;
  emprestada?: boolean;
  quantidadeEmprestada?: number;
  ultimoEmprestimo?: FirebaseTimestamp;
  historicoVerificacoes?: VerificacaoMensal[];
  danificada?: boolean;
  perdida?: boolean;
  motivoPerda?: string;
  motivoDano?: string;
  dataPerda?: FirebaseTimestamp;
  dataDano?: FirebaseTimestamp;
  responsavelPerda?: string;
  responsavelDano?: string;
}

export type StatusFerramenta =
  | 'disponivel'
  | 'emprestada'
  | 'manutencao'
  | 'danificada'
  | 'perdida'
  | 'baixa'
  | 'reservada';

export interface VerificacaoMensal {
  id: string;
  ferramentaId: string;
  data: FirebaseTimestamp;
  responsavel: string;
  responsavelId: string;
  quantidadeEsperada: number;
  quantidadeEncontrada: number;
  status: 'ok' | 'divergencia' | 'pendente';
  observacoes?: string;
  fotosAntes?: string[];
  fotosDepois?: string[];
}

// ============================================================================
// EMPRÉSTIMO
// ============================================================================

export interface Emprestimo {
  id: string;
  ferramentaId: string;
  ferramentaNome: string;
  funcionarioId: string;
  funcionarioNome: string;
  quantidade: number;
  dataEmprestimo: FirebaseTimestamp;
  dataPrevistaDevolucao?: FirebaseTimestamp;
  dataDevolucao?: FirebaseTimestamp;
  status: StatusEmprestimo;
  observacoes?: string;
  observacoesDevolucao?: string;
  responsavelEmprestimo: string;
  responsavelEmprestimoId: string;
  responsavelDevolucao?: string;
  responsavelDevolucaoId?: string;
  setor?: string;
  setorId?: string;
  empresa?: string;
  empresaId?: string;
  tipo?: TipoEmprestimo;
  comprovante?: string;
  assinaturaEmprestimo?: string;
  assinaturaDevolucao?: string;
  atrasado?: boolean;
  diasAtraso?: number;
  valorMulta?: number;
  historicoTransferencias?: TransferenciaEmprestimo[];
}

export type StatusEmprestimo =
  | 'ativo'
  | 'devolvido'
  | 'parcial'
  | 'atrasado'
  | 'perdido'
  | 'danificado'
  | 'transferido';

export type TipoEmprestimo =
  | 'interno'
  | 'externo'
  | 'temporario'
  | 'permanente';

export interface TransferenciaEmprestimo {
  id: string;
  emprestimoId: string;
  de: string;
  deId: string;
  para: string;
  paraId: string;
  data: FirebaseTimestamp;
  quantidade: number;
  observacoes?: string;
  status: 'pendente' | 'aceita' | 'recusada';
}

// ============================================================================
// TAREFA
// ============================================================================

export interface Tarefa {
  id: string;
  titulo: string;
  descricao?: string;
  tipo?: TipoTarefa;
  prioridade?: PrioridadeTarefa;
  status: StatusTarefa;
  dataCriacao: FirebaseTimestamp;
  dataInicio?: FirebaseTimestamp;
  dataConclusao?: FirebaseTimestamp;
  dataPrevista?: FirebaseTimestamp;
  responsavel: string;
  responsavelId: string;
  criadoPor: string;
  criadoPorId: string;
  setor?: string;
  setorId?: string;
  empresa?: string;
  empresaId?: string;
  observacoes?: string;
  avaliacao?: AvaliacaoTarefa;
  checkList?: CheckListItem[];
  anexos?: string[];
  ferramentasNecessarias?: string[];
  tempoEstimado?: number;
  tempoGasto?: number;
  recorrente?: boolean;
  frequencia?: FrequenciaTarefa;
  cronograma?: CronogramaSemanal;
}

export type TipoTarefa =
  | 'manutencao'
  | 'limpeza'
  | 'instalacao'
  | 'verificacao'
  | 'reparo'
  | 'outros';

export type PrioridadeTarefa =
  | 'baixa'
  | 'media'
  | 'alta'
  | 'urgente';

export type StatusTarefa =
  | 'pendente'
  | 'em_andamento'
  | 'concluida'
  | 'cancelada'
  | 'atrasada';

export type FrequenciaTarefa =
  | 'diaria'
  | 'semanal'
  | 'quinzenal'
  | 'mensal'
  | 'trimestral'
  | 'semestral'
  | 'anual';

export interface CheckListItem {
  id: string;
  texto: string;
  concluido: boolean;
  responsavel?: string;
  data?: FirebaseTimestamp;
}

export interface AvaliacaoTarefa {
  nota: number;
  comentario?: string;
  avaliador: string;
  avaliadorId: string;
  data: FirebaseTimestamp;
}

export interface CronogramaSemanal {
  id: string;
  nome: string;
  descricao?: string;
  diasSemana: DiaSemana[];
  horaInicio?: string;
  horaFim?: string;
  ativo: boolean;
}

export type DiaSemana =
  | 'domingo'
  | 'segunda'
  | 'terca'
  | 'quarta'
  | 'quinta'
  | 'sexta'
  | 'sabado';

// ============================================================================
// PONTO / PRESENÇA
// ============================================================================

export interface RegistroPonto {
  id: string;
  funcionarioId: string;
  funcionarioNome: string;
  data: FirebaseTimestamp;
  entrada?: FirebaseTimestamp;
  saidaAlmoco?: FirebaseTimestamp;
  voltaAlmoco?: FirebaseTimestamp;
  saida?: FirebaseTimestamp;
  horasTrabalhadas?: number;
  horasExtras?: number;
  status: StatusPonto;
  observacoes?: string;
  localizacao?: Coordenadas;
  comprovante?: string;
  ajustado?: boolean;
  ajustadoPor?: string;
  ajustadoPorId?: string;
  dataAjuste?: FirebaseTimestamp;
  motivoAjuste?: string;
}

export type StatusPonto =
  | 'completo'
  | 'incompleto'
  | 'falta'
  | 'atestado'
  | 'ferias'
  | 'folga';

export interface Coordenadas {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: FirebaseTimestamp;
}

// ============================================================================
// MENSAGENS / CHAT
// ============================================================================

export interface Mensagem {
  id: string;
  conversaId: string;
  remetente: string;
  remetenteId: string;
  conteudo: string;
  data: FirebaseTimestamp;
  lida: boolean;
  dataLeitura?: FirebaseTimestamp;
  tipo: TipoMensagem;
  anexos?: Anexo[];
  editada?: boolean;
  dataEdicao?: FirebaseTimestamp;
  deletada?: boolean;
  dataDeletacao?: FirebaseTimestamp;
  respostaA?: string;
}

export type TipoMensagem =
  | 'texto'
  | 'imagem'
  | 'arquivo'
  | 'audio'
  | 'video'
  | 'localizacao'
  | 'sistema';

export interface Anexo {
  id: string;
  nome: string;
  tipo: string;
  url: string;
  tamanho: number;
  dataUpload: FirebaseTimestamp;
}

export interface Conversa {
  id: string;
  tipo: TipoConversa;
  participantes: string[];
  participantesInfo: {
    id: string;
    nome: string;
    fotoPerfil?: string;
    ultimaVez?: FirebaseTimestamp;
    online?: boolean;
  }[];
  nome?: string;
  descricao?: string;
  icone?: string;
  ultimaMensagem?: string;
  dataUltimaMensagem?: FirebaseTimestamp;
  criadoPor: string;
  criadoPorId: string;
  dataCriacao: FirebaseTimestamp;
  ativa: boolean;
  mensagensNaoLidas?: { [userId: string]: number };
}

export type TipoConversa =
  | 'individual'
  | 'grupo'
  | 'canal';

// ============================================================================
// NOTIFICAÇÕES
// ============================================================================

export interface Notificacao {
  id: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  destinatario: string;
  destinatarioId: string;
  remetente?: string;
  remetenteId?: string;
  data: FirebaseTimestamp;
  lida: boolean;
  dataLeitura?: FirebaseTimestamp;
  link?: string;
  acao?: AcaoNotificacao;
  icone?: string;
  prioridade?: PrioridadeNotificacao;
  expiracao?: FirebaseTimestamp;
}

export type TipoNotificacao =
  | 'emprestimo'
  | 'devolucao'
  | 'tarefa'
  | 'mensagem'
  | 'avaliacao'
  | 'ponto'
  | 'sistema'
  | 'alerta'
  | 'transferencia';

export type PrioridadeNotificacao =
  | 'baixa'
  | 'normal'
  | 'alta'
  | 'urgente';

export interface AcaoNotificacao {
  tipo: string;
  label: string;
  url?: string;
  callback?: string;
}

// ============================================================================
// AVALIAÇÕES
// ============================================================================

export interface Avaliacao {
  id: string;
  tipo: TipoAvaliacao;
  nota: number;
  comentario?: string;
  avaliador: string;
  avaliadorId: string;
  avaliado: string;
  avaliadoId: string;
  data: FirebaseTimestamp;
  criterios?: CriterioAvaliacao[];
  aprovada?: boolean;
  resposta?: string;
  dataResposta?: FirebaseTimestamp;
}

export type TipoAvaliacao =
  | 'desempenho'
  | 'tarefa'
  | 'atendimento'
  | 'comportamento'
  | 'habilidade';

export interface CriterioAvaliacao {
  nome: string;
  nota: number;
  peso?: number;
  observacao?: string;
}

// ============================================================================
// EMPRESA / SETOR
// ============================================================================

export interface Empresa {
  id: string;
  nome: string;
  cnpj?: string;
  endereco?: Endereco;
  telefone?: string;
  email?: string;
  responsavel?: string;
  responsavelId?: string;
  dataCadastro: FirebaseTimestamp;
  ativa: boolean;
  observacoes?: string;
  setores?: string[];
}

export interface Setor {
  id: string;
  nome: string;
  descricao?: string;
  empresa?: string;
  empresaId?: string;
  responsavel?: string;
  responsavelId?: string;
  dataCadastro: FirebaseTimestamp;
  ativo: boolean;
  funcionarios?: string[];
  observacoes?: string;
}

export interface Endereco {
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  pais?: string;
}

// ============================================================================
// SISTEMA / AUDITORIA
// ============================================================================

export interface LogAuditoria {
  id: string;
  tipo: TipoAuditoria;
  acao: string;
  usuario: string;
  usuarioId: string;
  data: FirebaseTimestamp;
  descricao?: string;
  dadosAntes?: any;
  dadosDepois?: any;
  ip?: string;
  dispositivo?: string;
  navegador?: string;
  localizacao?: Coordenadas;
}

export type TipoAuditoria =
  | 'login'
  | 'logout'
  | 'criacao'
  | 'edicao'
  | 'exclusao'
  | 'acesso'
  | 'exportacao'
  | 'importacao'
  | 'configuracao'
  | 'erro'
  | 'seguranca';

// ============================================================================
// TIPOS DE CONTEXTO E PROVIDERS
// ============================================================================

export interface AuthContextType {
  usuario: Usuario | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  atualizarUsuario: (dados: Partial<Usuario>) => Promise<void>;
}

export interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export interface NotificationContextType {
  notificacoes: Notificacao[];
  naoLidas: number;
  marcarComoLida: (id: string) => Promise<void>;
  marcarTodasComoLidas: () => Promise<void>;
  removerNotificacao: (id: string) => Promise<void>;
}

// ============================================================================
// TIPOS DE FILTROS E ORDENAÇÃO
// ============================================================================

export interface FiltroEmprestimos {
  status?: StatusEmprestimo[];
  dataInicio?: Date;
  dataFim?: Date;
  funcionario?: string;
  ferramenta?: string;
  setor?: string;
  empresa?: string;
  atrasados?: boolean;
}

export interface FiltroInventario {
  categoria?: string[];
  status?: StatusFerramenta[];
  setor?: string;
  empresa?: string;
  estoqueBaixo?: boolean;
  emprestada?: boolean;
  busca?: string;
}

export type OrdenacaoInventario =
  | 'nome-asc'
  | 'nome-desc'
  | 'quantidade-asc'
  | 'quantidade-desc'
  | 'data-asc'
  | 'data-desc';

// ============================================================================
// TIPOS DE EXPORTAÇÃO
// ============================================================================

export interface DadosExportacao {
  tipo: TipoExportacao;
  dados: any[];
  formato: FormatoExportacao;
  filtros?: any;
  dataGeracao: Date;
  usuario: string;
}

export type TipoExportacao =
  | 'emprestimos'
  | 'inventario'
  | 'funcionarios'
  | 'tarefas'
  | 'pontos'
  | 'relatorio';

export type FormatoExportacao =
  | 'json'
  | 'csv'
  | 'excel'
  | 'pdf';
