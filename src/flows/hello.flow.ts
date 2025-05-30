// 📁 src/flows/hello.flow.ts
import { defineFlow } from '@genkit-ai/flow';

export const helloFlow = defineFlow({
  name: 'hello',
  inputSchema: {
    nome: 'string',
  },
  steps: async ({ nome }) => {
    return `Olá, ${nome}! Seja bem-vindo ao Genkit.`;
  },
});
