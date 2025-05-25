// src/ai/flows/smart-template-suggestions.ts
'use server';
/**
 * @fileOverview An AI agent that suggests relevant label and technical sheet templates based on the project type and client data.
 *
 * - suggestTemplates - A function that suggests label and technical sheet templates.
 * - SuggestTemplatesInput - The input type for the suggestTemplates function.
 * - SuggestTemplatesOutput - The return type for the suggestTemplates function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTemplatesInputSchema = z.object({
  projectType: z.string().describe('The type of the project (e.g., residential, commercial, industrial).'),
  clientData: z.string().describe('Relevant data about the client, such as their industry and specific needs.'),
});
export type SuggestTemplatesInput = z.infer<typeof SuggestTemplatesInputSchema>;

const SuggestTemplatesOutputSchema = z.object({
  labelTemplateSuggestions: z.array(z.string()).describe('A list of suggested label templates.'),
  technicalSheetTemplateSuggestions: z.array(z.string()).describe('A list of suggested technical sheet templates.'),
});
export type SuggestTemplatesOutput = z.infer<typeof SuggestTemplatesOutputSchema>;

export async function suggestTemplates(input: SuggestTemplatesInput): Promise<SuggestTemplatesOutput> {
  return suggestTemplatesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTemplatesPrompt',
  input: {schema: SuggestTemplatesInputSchema},
  output: {schema: SuggestTemplatesOutputSchema},
  prompt: `You are an expert in suggesting label and technical sheet templates for technical projects.

  Based on the project type and client data provided, suggest relevant templates that would streamline the documentation process.

  Project Type: {{{projectType}}}
  Client Data: {{{clientData}}}

  Provide a list of suggested label templates and a list of suggested technical sheet templates.
  The output should be a JSON object with "labelTemplateSuggestions" and "technicalSheetTemplateSuggestions" keys, each containing an array of strings.
  `,
});

const suggestTemplatesFlow = ai.defineFlow(
  {
    name: 'suggestTemplatesFlow',
    inputSchema: SuggestTemplatesInputSchema,
    outputSchema: SuggestTemplatesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
