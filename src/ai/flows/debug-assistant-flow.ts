
// src/ai/flows/debug-assistant-flow.ts
'use server';
/**
 * @fileOverview Um assistente de IA para ajudar na depuração de código.
 *
 * - debugCode - Uma função que analisa uma mensagem de erro e um trecho de código para sugerir correções.
 * - DebugInput - O tipo de entrada para a função debugCode.
 * - DebugOutput - O tipo de retorno para a função debugCode.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DebugInputSchema = z.object({
  errorMessage: z.string().describe("A mensagem de erro completa observada."),
  codeContext: z.string().optional().describe("Trecho de código relevante onde o erro pode estar ocorrendo. Forneça algumas linhas antes e depois do local suspeito, se possível."),
  language: z.string().optional().default("TypeScript").describe("A linguagem de programação do trecho de código (ex: TypeScript, JavaScript, Python)."),
});
export type DebugInput = z.infer<typeof DebugInputSchema>;

const DebugOutputSchema = z.object({
  possibleCauses: z.array(z.string()).describe("Uma lista de possíveis causas para o erro, baseada na análise."),
  suggestedSolutions: z.array(z.string()).describe("Uma lista de soluções sugeridas ou próximos passos para depuração."),
  explanation: z.string().optional().describe("Uma breve explicação do erro, se for um erro comum e identificável."),
});
export type DebugOutput = z.infer<typeof DebugOutputSchema>;

export async function debugCode(input: DebugInput): Promise<DebugOutput> {
  return debugAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'debugAssistantPrompt',
  input: {schema: DebugInputSchema},
  output: {schema: DebugOutputSchema},
  prompt: `Você é um assistente de programação especialista em depuração de código.
Sua tarefa é analisar a mensagem de erro e o contexto de código fornecidos para a linguagem de programação especificada.

Com base na sua análise, identifique:
1. Possíveis causas para o erro.
2. Sugestões de soluções ou próximos passos que o desenvolvedor pode tomar para corrigir o problema.
3. Se for um erro comum, forneça uma breve explicação sobre ele.

Se o trecho de código não for fornecido, baseie sua análise principalmente na mensagem de erro.

Linguagem de Programação: {{{language}}}
Mensagem de Erro:
{{{errorMessage}}}

Trecho de Código (Contexto):
{{{codeContext}}}

Responda no formato JSON especificado pelo schema de saída.
`,
});

const debugAssistantFlow = ai.defineFlow(
  {
    name: 'debugAssistantFlow',
    inputSchema: DebugInputSchema,
    outputSchema: DebugOutputSchema,
  },
  async (input: DebugInput) => {
    // Validar se a mensagem de erro não está vazia
    if (!input.errorMessage || input.errorMessage.trim() === "") {
      throw new Error("A mensagem de erro não pode estar vazia.");
    }

    // Adicionar uma verificação simples para o tamanho do input para evitar sobrecarga, opcional
    if (input.codeContext && input.codeContext.length > 5000) {
        input.codeContext = input.codeContext.substring(0, 5000) + "\n... (código truncado)";
    }
    if (input.errorMessage.length > 2000) {
        input.errorMessage = input.errorMessage.substring(0, 2000) + "\n... (mensagem de erro truncada)";
    }

    const {output} = await prompt(input);

    if (!output) {
        // Tentar fornecer uma resposta genérica se a IA não retornar nada estruturado
        return {
            possibleCauses: ["Não foi possível determinar causas específicas com base na entrada fornecida."],
            suggestedSolutions: ["Verifique a mensagem de erro cuidadosamente.", "Consulte a documentação da linguagem ou bibliotecas utilizadas.", "Tente isolar o problema em um trecho menor de código."],
            explanation: "A IA não conseguiu fornecer uma análise detalhada. Isso pode ocorrer devido à complexidade do erro ou à falta de contexto suficiente."
        };
    }
    return output;
  }
);
