
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
  // Add more editable blocks as needed
}

export interface AssinaturaDetalhes {
  assinanteUid?: string; // UID do usuário Firebase que assinou (se aplicável)
  nome?: string; // Nome do assinante (especialmente para cliente/testemunhas sem conta)
  email?: string; // Email do assinante
  ip?: string;
  dataHora?: Timestamp;
  canalAcesso?: 'email' | 'whatsapp' | 'plataforma'; // Como o link de assinatura foi acessado
  userAgent?: string;
  // Outros metadados da assinatura
}

export interface AssinaturasContrato {
  prestador?: AssinaturaDetalhes;
  cliente?: AssinaturaDetalhes;
  testemunha1?: AssinaturaDetalhes;
  testemunha2?: AssinaturaDetalhes;
}

export interface Contrato {
  id?: string;
  createdBy: string; // UID do prestador de serviço
  tipo: 'padrão' | 'emergencial';
  cliente: ClienteContrato;
  testemunhas?: TestemunhaContrato[]; // Array para 0, 1 ou 2 testemunhas
  blocosEditaveis: BlocosEditaveisContrato;
  status: 'rascunho' | 'pendente_assinaturas' | 'parcialmente_assinado' | 'assinado' | 'cancelado';
  assinaturas: AssinaturasContrato;
  pdfUrl?: string; // URL do PDF gerado e salvo no Firebase Storage
  dataCriacao: Timestamp;
  dataUltimaModificacao?: Timestamp;
  dataEnvioAssinaturas?: Timestamp;
  dataFinalizacaoAssinaturas?: Timestamp;
  // Campos da empresa do prestador (podem ser preenchidos no momento da criação)
  empresaPrestador?: {
    nome: string;
    cnpj: string;
    endereco: string;
    responsavelTecnico?: string;
  };
  // Campos adicionais para contrato emergencial
  taxaDeslocamento?: number;
  termosEmergencial?: string; // Cláusulas específicas para emergência
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
