
import {genkit, GenkitPlugin, GenkitOptions} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const pluginsToUse: GenkitPlugin[] = [];
let googleAiPluginInitialized = false;
let googleAiInitializationError: any = null;
let apiKeyFound: string | undefined = undefined;

// Attempt to read API key from common environment variables
const googleApiKeyFromEnv = process.env.GOOGLE_API_KEY;
const geminiApiKeyFromEnv = process.env.GEMINI_API_KEY;

if (googleApiKeyFromEnv) {
  apiKeyFound = googleApiKeyFromEnv;
  console.log('[Genkit] Found GOOGLE_API_KEY in environment variables.');
} else if (geminiApiKeyFromEnv) {
  apiKeyFound = geminiApiKeyFromEnv;
  console.log('[Genkit] Found GEMINI_API_KEY in environment variables.');
} else {
  console.warn('[Genkit] Neither GOOGLE_API_KEY nor GEMINI_API_KEY found in environment variables.');
}

console.log('[Genkit] Attempting to initialize Google AI plugin...');
try {
  if (apiKeyFound) {
    console.log('[Genkit] Initializing Google AI plugin WITH explicit API key.');
    const googleAiPluginInstance = googleAI({ apiKey: apiKeyFound });
    pluginsToUse.push(googleAiPluginInstance);
    googleAiPluginInitialized = true;
    console.log('[Genkit] Google AI plugin initialized SUCCESSFULLY with explicit API key.');
  } else {
    // Attempt to initialize without an explicit key, relying on Genkit's default detection
    // This might still fail if the default detection also fails or if no key is present
    console.log('[Genkit] No API key explicitly found, attempting to initialize Google AI plugin with default detection.');
    const googleAiPluginInstance = googleAI();
    pluginsToUse.push(googleAiPluginInstance);
    googleAiPluginInitialized = true;
    console.log('[Genkit] Google AI plugin initialized SUCCESSFULLY with default detection (this might still fail at runtime if no key is truly available).');
  }
} catch (error) {
  googleAiInitializationError = error;
  console.error(
    '[Genkit] CRITICAL ERROR: Failed to initialize Google AI plugin for Genkit.',
    'This is likely due to a missing or invalid API key (e.g., GOOGLE_API_KEY or GEMINI_API_KEY) or incorrect configuration.',
    'Ensure the API key is correctly set in the Cloud Function environment variables.',
    'Error details:', error
  );
}

const genkitConfig: GenkitOptions = {
  plugins: pluginsToUse,
};

if (googleAiPluginInitialized) {
  // It's generally better to let Genkit pick the model if not specified, 
  // or if you want a specific one, ensure it's compatible with your key/plugin version.
  // genkitConfig.model = 'googleai/gemini-1.5-flash-latest'; // Example, adjust if needed
  console.log('[Genkit] Configured Genkit with Google AI plugin enabled.');
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
