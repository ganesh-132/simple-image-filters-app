'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a description of image edits made using filters.
 *
 * @function generateEditDescription - The main function to generate the edit description.
 * @interface GenerateEditDescriptionInput - Defines the input schema for the function.
 * @interface GenerateEditDescriptionOutput - Defines the output schema for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEditDescriptionInputSchema = z.object({
  filtersApplied: z
    .array(z.string())
    .describe('An array of strings, each representing a filter applied to the image.'),
});
export type GenerateEditDescriptionInput = z.infer<typeof GenerateEditDescriptionInputSchema>;

const GenerateEditDescriptionOutputSchema = z.object({
  description: z
    .string()
    .describe('A short text prompt describing the sequence of edits/filters applied to the image.'),
});
export type GenerateEditDescriptionOutput = z.infer<typeof GenerateEditDescriptionOutputSchema>;

export async function generateEditDescription(input: GenerateEditDescriptionInput): Promise<GenerateEditDescriptionOutput> {
  return generateEditDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEditDescriptionPrompt',
  input: {schema: GenerateEditDescriptionInputSchema},
  output: {schema: GenerateEditDescriptionOutputSchema},
  prompt: `You are an AI assistant that generates a concise description of image edits based on the filters applied.  The description should be a single sentence, suitable for use as a prompt for image generation or editing tools.

The following filters have been applied: {{#each filtersApplied}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Generate a short, descriptive text prompt that summarizes these edits.`,
});

const generateEditDescriptionFlow = ai.defineFlow(
  {
    name: 'generateEditDescriptionFlow',
    inputSchema: GenerateEditDescriptionInputSchema,
    outputSchema: GenerateEditDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
