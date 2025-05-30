import { flow } from '@genkit-ai/core';
import { generate } from '@genkit-ai/ai';

export const hello = flow('hello', async (input: { prompt: string }) => {
  const result = await generate({
    model: 'gemini-pro',
    prompt: input.prompt,
  });

  return result.text();
});
