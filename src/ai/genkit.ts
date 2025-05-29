
import {genkit, GenkitPlugin, GenkitOptions} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const pluginsToUse: GenkitPlugin[] = [];
let googleAiPluginInitialized = false;
let googleAiInitializationError: any = null;

console.log('[Genkit] Attempting to initialize Google AI plugin...');
try {
  // Attempt to initialize the Google AI plugin.
  // This might throw an error if the necessary API key (e.g., GOOGLE_API_KEY or GEMINI_API_KEY)
  // is not found in the environment.
  const googleAiPluginInstance = googleAI();
  pluginsToUse.push(googleAiPluginInstance);
  googleAiPluginInitialized = true;
  console.log('[Genkit] Google AI plugin initialized SUCCESSFULLY.');
} catch (error) {
  googleAiInitializationError = error;
  console.error(
    '[Genkit] CRITICAL ERROR: Failed to initialize Google AI plugin for Genkit.',
    'This is likely due to a missing API key (e.g., GOOGLE_API_KEY or GEMINI_API_KEY) or incorrect configuration in the Cloud Function environment variables.',
    'Error details:', error
  );
  // We let Genkit initialize with an empty plugins array if Google AI fails.
  // The application might still run, but AI features will likely fail at runtime.
}

const genkitConfig: GenkitOptions = {
  plugins: pluginsToUse,
};

if (googleAiPluginInitialized) {
  genkitConfig.model = 'googleai/gemini-2.0-flash'; // Using a more specific model as per new guidance
  console.log('[Genkit] Configured Genkit with Google AI model:', genkitConfig.model);
} else {
  console.warn('[Genkit] Genkit initialized WITHOUT Google AI plugin due to previous errors. AI operations will likely fail as no default model is configured.');
  if (googleAiInitializationError) {
    console.warn('[Genkit] The error during Google AI plugin initialization was:', googleAiInitializationError);
  }
}

export const ai = genkit(genkitConfig);

if (googleAiPluginInitialized) {
    console.log('[Genkit] Final Genkit instance created with Google AI plugin enabled.');
} else {
    console.warn("[Genkit] Final Genkit instance created WITHOUT Google AI plugin. AI operations will likely fail.");
}
