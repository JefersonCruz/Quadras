
import {genkit, GenkitPlugin, GenkitOptions} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const pluginsToUse: GenkitPlugin[] = [];
let googleAiPluginInitialized = false;
let googleAiInitializationError: any = null;
let apiKeyFound: string | undefined = undefined;
let apiKeyNameUsed: string | undefined = undefined;

// Attempt to read API key from common environment variables
const googleApiKeyFromEnv = process.env.GOOGLE_API_KEY;
const geminiApiKeyFromEnv = process.env.GEMINI_API_KEY;

if (googleApiKeyFromEnv) {
  apiKeyFound = googleApiKeyFromEnv;
  apiKeyNameUsed = 'GOOGLE_API_KEY';
  console.log(`[Genkit] Found ${apiKeyNameUsed} in environment variables.`);
} else if (geminiApiKeyFromEnv) {
  apiKeyFound = geminiApiKeyFromEnv;
  apiKeyNameUsed = 'GEMINI_API_KEY';
  console.log(`[Genkit] Found ${apiKeyNameUsed} in environment variables.`);
} else {
  console.warn('[Genkit] Neither GOOGLE_API_KEY nor GEMINI_API_KEY found in environment variables. Google AI features will likely fail.');
}

console.log('[Genkit] Attempting to initialize Google AI plugin...');
try {
  if (apiKeyFound) {
    console.log(`[Genkit] Initializing Google AI plugin WITH explicit API key from ${apiKeyNameUsed}.`);
    const googleAiPluginInstance = googleAI({ apiKey: apiKeyFound });
    pluginsToUse.push(googleAiPluginInstance);
    googleAiPluginInitialized = true;
    console.log(`[Genkit] Google AI plugin initialized SUCCESSFULLY with explicit API key from ${apiKeyNameUsed}.`);
  } else {
    // Attempt to initialize without an explicit key, relying on Genkit's default detection
    // This might still fail if the default detection also fails or if no key is present
    // For server-side Cloud Functions, an explicit key from env vars is highly recommended.
    console.warn('[Genkit] No API key explicitly found in GOOGLE_API_KEY or GEMINI_API_KEY. Attempting to initialize Google AI plugin with default detection (this will likely fail in a Cloud Function environment if no key is available through other means).');
    const googleAiPluginInstance = googleAI(); // This will throw an error if no key is found by the plugin itself.
    pluginsToUse.push(googleAiPluginInstance);
    googleAiPluginInitialized = true; // If googleAI() doesn't throw, it found a key.
    console.log('[Genkit] Google AI plugin initialized with default detection (this might still fail at runtime if no key is truly available or if the found key is invalid).');
  }
} catch (error) {
  googleAiInitializationError = error;
  console.error(
    '[Genkit] CRITICAL ERROR: Failed to initialize Google AI plugin for Genkit.',
    'This is likely due to a missing or invalid API key (ensure GOOGLE_API_KEY or GEMINI_API_KEY is correctly set in the Cloud Function environment variables with a valid Google AI Studio API key) or incorrect configuration.',
    'Error details:', error
  );
}

const genkitConfig: GenkitOptions = {
  plugins: pluginsToUse,
  // Do not set a default model here if the plugin might not initialize.
  // Let individual flows/prompts specify their models.
};

if (googleAiPluginInitialized) {
  console.log('[Genkit] Configured Genkit with Google AI plugin enabled.');
} else {
  console.warn('[Genkit] Genkit initialized WITHOUT Google AI plugin due to previous errors. AI operations requiring this plugin will fail.');
  if (googleAiInitializationError) {
    console.warn('[Genkit] The error during Google AI plugin initialization was:', googleAiInitializationError);
  }
}

export const ai = genkit(genkitConfig);

if (googleAiPluginInitialized) {
    console.log('[Genkit] Final Genkit instance created with Google AI plugin enabled.');
} else {
    console.warn("[Genkit] Final Genkit instance created WITHOUT Google AI plugin. AI operations requiring this plugin will likely fail.");
}
