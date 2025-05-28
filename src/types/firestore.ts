
import type { Timestamp } from "firebase/firestore";

export interface Empresa {
  id?: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  site?: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  logotipo?: string; // URL
  bannerUrl?: string; // URL for banner image
  owner: string; // UID
}

export interface Cliente {
  id?: string;
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  owner: string; // UID
}

export interface CircuitoFicha {
  nome: string;
  disjuntor: string;
  caboMM: string;
  observacoes?: string;
}

export interface FichaTecnica {
  id?: string;
  owner: string;
  clienteId: string;
  projetoId: string;

  logotipoEmpresaUrl?: string;
  nomeEmpresa?: string;
  tituloFicha: string;
  identificacaoLocal: string;
  dataInstalacao: Timestamp;
  responsavelTecnico: string;
  versaoFicha: string;

  circuitos: CircuitoFicha[];

  observacaoNBR?: string;
  observacaoDR?: boolean;
  descricaoDROpcional?: string;

  qrCodeUrl?: string;
  textoAcessoOnline?: string;
  linkFichaPublica?: string;

  nomeEletricista: string;
  assinaturaEletricistaUrl?: string;
  contatoEletricista: string;
  ramalPortaria?: string;

  dataCriacao: Timestamp;
  pdfUrl?: string;
}


export interface Etiqueta {
  id?: string;
  createdBy: string;
  clienteId: string;
  projetoId: string;
  tipo: string;
  qrCode?: string;
  circuito: string;
  posicao: string;
}

export interface Projeto {
  id?: string;
  nome: string;
  descricao?: string;
  clienteId: string;
  owner: string;
  status: 'Planejamento' | 'Em Andamento' | 'Concluído' | 'Cancelado';
  dataCriacao: Timestamp;
}

export interface Usuario {
  id?: string;
  email: string;
  nome?: string;
  role?: 'user' | 'admin';
  tipoPlano?: "gratuito" | "premium";
}

// --- Contrato Digital Types ---
export interface ClienteContrato {
  nome: string;
  email: string;
  cpfCnpj?: string; // CPF ou CNPJ
}

export interface TestemunhaContrato {
  nome: string;
  email: string;
}

export interface BlocosEditaveisContrato {
  objetoDoContrato: string;
  prazoDeExecucao: string;
  condicoesDePagamento: string;
  fornecimentoDeMateriais: string;
  multasPenalidades: string;
  cancelamento: string;
  foro?: string; // Optional: foro para dirimir conflitos
}

export interface AssinaturaDetalhes {
  assinanteUid?: string;
  nome?: string;
  email?: string;
  ip?: string;
  dataHora?: Timestamp;
  canalAcesso?: 'email' | 'whatsapp' | 'plataforma';
  userAgent?: string;
}

export interface AssinaturasContrato {
  prestador?: AssinaturaDetalhes;
  cliente?: AssinaturaDetalhes;
  testemunha1?: AssinaturaDetalhes;
  testemunha2?: AssinaturaDetalhes;
}

export interface EmpresaPrestadorContrato {
    nome: string;
    cnpj?: string;
    endereco?: string;
    responsavelTecnico?: string;
    email?: string; // Added email for provider for signature context
}

export interface Contrato {
  id?: string;
  createdBy: string;
  tipo: 'padrão' | 'emergencial';
  cliente: ClienteContrato;
  testemunhas?: TestemunhaContrato[];
  blocosEditaveis: BlocosEditaveisContrato;
  status: 'rascunho' | 'pendente_assinaturas' | 'parcialmente_assinado' | 'assinado' | 'cancelado';
  assinaturas: AssinaturasContrato;
  pdfUrl?: string;
  dataCriacao: Timestamp;
  dataUltimaModificacao?: Timestamp;
  dataEnvioAssinaturas?: Timestamp;
  dataFinalizacaoAssinaturas?: Timestamp;
  empresaPrestador: EmpresaPrestadorContrato;
  taxaDeslocamento?: number;
  termosEmergencial?: string;
}


// For fichasPublicas and relatorios, if they have specific structures:
export interface FichaPublica extends FichaTecnica {
  // FichasPublicas might be a subset or denormalized version of FichaTecnica
  // Ensure it has clientID if the collection is fichasPublicas/{clienteId}
}

export interface Relatorio {
  id?: string;
  owner: string;
  projetoId?: string;
  clienteId?: string;
  tipo: string;
  dataGeracao: Timestamp;
  conteudo: any;
  pdfUrl?: string;
}

// --- Global Templates ---
export interface GlobalLabelTemplate {
  id?: string;
  name: string;
  description: string;
  createdBy?: string; // Admin UID
  createdAt?: Timestamp;
  updatedBy?: string; // Admin UID
  updatedAt?: Timestamp;
}

// --- Orçamentos (Quotes/Estimates) Types ---
export interface OrcamentoItem {
  id?: string; // Could be useful if items are stored separately later
  descricao: string;
  quantidade: number;
  unidadeMedida: string; // Ex: 'un', 'm²', 'h'
  precoUnitario: number;
  precoTotal: number; // quantidade * precoUnitario
}

export interface Orcamento {
  id?: string;
  createdBy: string; // UID of the user who created it
  clienteId: string;
  projetoId?: string; // Optional link to an existing project
  numeroOrcamento: string; // E.g., "ORC-2024-001" - User input for now
  dataCriacao: Timestamp;
  dataValidade: Timestamp;
  descricaoServicos: string; // General description of services/scope
  // itens?: OrcamentoItem[]; // For detailed line items - future enhancement
  valorTotalEstimado: number;
  status: 'rascunho' | 'enviado' | 'aprovado' | 'rejeitado' | 'convertido_os';
  observacoes?: string; // Optional notes
  // Campos da empresa que emitiu o orçamento (para o PDF)
  empresaNome?: string;
  empresaCnpj?: string;
  empresaEndereco?: string;
  empresaTelefone?: string;
  empresaEmail?: string;
  empresaLogotipoUrl?: string;
}
