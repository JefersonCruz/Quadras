import { defineConfig, enableFlow } from '@genkit-ai/core';
import { google } from '@genkit-ai/ai/providers/google';

// Importa seus flows personalizados
// (Você pode criar em src/ai/flows e importar aqui conforme for adicionando)
import { hello } from './src/ai/flows/hello'; // exemplo opcional

// Ativa o provedor Google Gemini
const googleProvider = google({
  apiKey: process.env.GOOGLE_API_KEY || '',
  model: 'gemini-pro', // Você pode usar gemini-pro-vision se for com imagem
});

// Configuração do Genkit
export default defineConfig({
  plugins: [googleProvider],
  flows: [
    enableFlow(hello), // Adicione aqui todos os flows que quiser habilitar
  ],
  entrypoint: './src/ai/flows',
});
