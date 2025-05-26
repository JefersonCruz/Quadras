
import {genkit, GenkitPlugin} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const pluginsToUse: GenkitPlugin[] = [];
let googleAiPluginInitialized = false;

try {
  // Attempt to initialize the Google AI plugin.
  // This might throw an error if the necessary API key (e.g., GOOGLE_API_KEY or GEMINI_API_KEY)
  // is not found in the environment.
  const googleAiPluginInstance = googleAI();
  pluginsToUse.push(googleAiPluginInstance);
  googleAiPluginInitialized = true;
  console.log('Google AI plugin initialized successfully for Genkit.');
} catch (error) {
  console.error(
    'CRITICAL ERROR: Failed to initialize Google AI plugin for Genkit. AI-dependent features will not work.',
    'This is likely due to a missing API key (e.g., GOOGLE_API_KEY or GEMINI_API_KEY) or incorrect configuration in the Cloud Function environment variables.',
    'Error details:', error
  );
  // We let Genkit initialize with an empty plugins array if Google AI fails.
  // The application might still run, but AI features will likely fail at runtime.
}

export const ai = genkit({
  plugins: pluginsToUse,
  // If googleAiPlugin failed, this model might not be available.
  // Genkit might handle an unavailable model gracefully or error at runtime when an AI feature is used.
  model: googleAiPluginInitialized ? 'googleai/gemini-2.0-flash' : undefined,
});

if (!googleAiPluginInitialized) {
    console.warn("Genkit initialized without Google AI plugin. Default model will be undefined. AI operations will likely fail.");
}
