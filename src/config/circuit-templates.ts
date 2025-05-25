
// src/config/circuit-templates.ts

export interface TemplateCircuito {
  numero: number;
  nome: string;
  disjuntor: string;
  cabo: string; // Will be mapped to caboMM
  observacao?: string; // Will be mapped to observacoes
}

export interface CircuitTemplates {
  [key: string]: TemplateCircuito[];
}

export const modelosCircuitos: { modelos: CircuitTemplates } = {
  modelos: {
    "6": [
      { numero: 1, nome: "Iluminação Social", disjuntor: "10A / Bip.", cabo: "1,5 mm²", observacao: "Distribuir em mais de um circuito, se necessário" },
      { numero: 2, nome: "Tomadas Uso Geral (TUG) - Quartos", disjuntor: "15A / Bip.", cabo: "2,5 mm²", observacao: "Máx. 10 pontos por circuito" },
      { numero: 3, nome: "Tomadas Uso Geral (TUG) - Sala", disjuntor: "15A / Bip.", cabo: "2,5 mm²", observacao: "Máx. 10 pontos por circuito" },
      { numero: 4, nome: "Chuveiro Elétrico Suíte", disjuntor: "32A / Bip.", cabo: "6 mm²", observacao: "Verificar potência do chuveiro" },
      { numero: 5, nome: "Tomadas Uso Específico (TUE) - Cozinha (Bancada)", disjuntor: "20A / Bip.", cabo: "2,5 mm²", observacao: "Para equipamentos de maior potência" },
      { numero: 6, nome: "Geladeira / Freezer", disjuntor: "15A / Bip.", cabo: "2,5 mm²", observacao: "Circuito dedicado" }
    ],
    "8": [
      { numero: 7, nome: "Máquina de Lavar Roupa", disjuntor: "20A / Bip.", cabo: "2,5 mm²", observacao: "Circuito dedicado" },
      { numero: 8, nome: "Micro-ondas", disjuntor: "20A / Bip.", cabo: "2,5 mm²", observacao: "Circuito dedicado" }
    ],
    "12": [
      { numero: 9, nome: "Ar-condicionado Split Quarto 1", disjuntor: "15A / Bip.", cabo: "2,5 mm²", observacao: "Verificar potência do equipamento" },
      { numero: 10, nome: "Ar-condicionado Split Sala", disjuntor: "20A / Bip.", cabo: "2,5 mm²", observacao: "Verificar potência do equipamento" },
      { numero: 11, nome: "Forno Elétrico Embutido", disjuntor: "25A / Bip.", cabo: "4 mm²", observacao: "Circuito dedicado" },
      { numero: 12, nome: "Lava-louças", disjuntor: "20A / Bip.", cabo: "2,5 mm²", observacao: "Circuito dedicado" }
    ],
    "18": [
      { numero: 13, nome: "Secadora de Roupas", disjuntor: "20A / Bip.", cabo: "2,5 mm²", observacao: "Circuito dedicado" },
      { numero: 14, nome: "Tomadas Uso Geral (TUG) - Cozinha", disjuntor: "20A / Bip.", cabo: "2,5 mm²" },
      { numero: 15, nome: "Tomadas Área de Serviço", disjuntor: "20A / Bip.", cabo: "2,5 mm²" },
      { numero: 16, nome: "Chuveiro Elétrico Social", disjuntor: "32A / Bip.", cabo: "6 mm²", observacao: "Verificar potência" },
      { numero: 17, nome: "Iluminação Serviço / Externa", disjuntor: "10A / Bip.", cabo: "1,5 mm²" },
      { numero: 18, nome: "Portão Eletrônico / Interfone", disjuntor: "10A / Bip.", cabo: "1,5 mm²" }
    ],
    "24": [
      { numero: 19, nome: "Ar-condicionado Split Quarto 2", disjuntor: "15A / Bip.", cabo: "2,5 mm²", observacao: "Verificar potência" },
      { numero: 20, nome: "Bomba de Piscina / Hidro", disjuntor: "20A / Bip.", cabo: "2,5 mm²", observacao: "Com proteção DR" },
      { numero: 21, nome: "Iluminação Jardim / Piscina", disjuntor: "10A / Bip.", cabo: "1,5 mm²", observacao: "Com proteção DR" },
      { numero: 22, nome: "Tomadas Varanda / Gourmet", disjuntor: "20A / Bip.", cabo: "2,5 mm²" },
      { numero: 23, nome: "Automação Residencial", disjuntor: "10A / Bip.", cabo: "1,5 mm²" },
      { numero: 24, nome: "Tomadas Escritório / Home Office", disjuntor: "15A / Bip.", cabo: "2,5 mm²" }
    ],
    "32": [
      { numero: 25, nome: "Aquecedor Central / Boiler", disjuntor: "32A / Bip.", cabo: "6 mm²", observacao: "Verificar potência" },
      { numero: 26, nome: "Painel Solar Inversor", disjuntor: "25A / Bip.", cabo: "4 mm²", observacao: "Conforme projeto fotovoltaico" },
      { numero: 27, nome: "Sistema de Segurança (CFTV/Alarme)", disjuntor: "10A / Bip.", cabo: "1,5 mm²" },
      { numero: 28, nome: "Reservado Técnico 1", disjuntor: "20A", cabo: "2,5 mm²", observacao: "" },
      { numero: 29, nome: "Reservado Técnico 2", disjuntor: "20A", cabo: "2,5 mm²", observacao: "" },
      { numero: 30, nome: "Tomadas Banheiros (exceto chuveiro)", disjuntor: "15A / Bip.", cabo: "2,5 mm²" },
      { numero: 31, nome: "Iluminação Corredores / Hall", disjuntor: "10A / Bip.", cabo: "1,5 mm²" },
      { numero: 32, nome: "Painel de Rede / Internet", disjuntor: "10A / Bip.", cabo: "1,5 mm²" }
    ],
    "44": [ // Assuming 44 based on example, NBR doesn't prescribe exact numbers this high for "standard"
      { numero: 33, nome: "Spa / Jacuzzi", disjuntor: "32A / Trip.", cabo: "6 mm²", observacao: "Com proteção DR dedicada" },
      { numero: 34, nome: "Carregador Veículo Elétrico", disjuntor: "32A / Bip.", cabo: "6 mm²", observacao: "Verificar demanda" },
      { numero: 35, nome: "Adega Climatizada", disjuntor: "10A / Bip.", cabo: "1,5 mm²" },
      { numero: 36, nome: "Quarto 1 - Tomadas Adicionais", disjuntor: "15A / Bip.", cabo: "2,5 mm²" },
      { numero: 37, nome: "Quarto 2 - Tomadas Adicionais", disjuntor: "15A / Bip.", cabo: "2,5 mm²" },
      { numero: 38, nome: "Quarto 3 / Suíte Master - Tomadas", disjuntor: "20A / Bip.", cabo: "2,5 mm²" },
      { numero: 39, nome: "Home Theater / Som Ambiente", disjuntor: "15A / Bip.", cabo: "2,5 mm²" },
      { numero: 40, nome: "Banheiro Social - Tomadas", disjuntor: "15A / Bip.", cabo: "2,5 mm²" },
      { numero: 41, nome: "Iluminação Garagem / Depósito", disjuntor: "10A / Bip.", cabo: "1,5 mm²" },
      { numero: 42, nome: "Tomadas Garagem / Oficina", disjuntor: "20A / Bip.", cabo: "2,5 mm²" },
      { numero: 43, nome: "Reservado Técnico 3", disjuntor: "20A", cabo: "2,5 mm²", observacao: "" },
      { numero: 44, nome: "Reservado Técnico 4", disjuntor: "20A", cabo: "2,5 mm²", observacao: "" }
    ]
  }
};
