'use server';

/**
 * @fileOverview This file defines a Genkit flow for validating spoken audio against a given text phrase.
 *
 * - validateAudio - A function that compares audio to text and returns if it matches.
 * - ValidateAudioInput - The input type for the validateAudio function.
 * - ValidateAudioOutput - The return type for the validateAudio function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "Audio data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  textToMatch: z.string().describe('The text phrase to validate the audio against.'),
});
export type ValidateAudioInput = z.infer<typeof ValidateAudioInputSchema>;

const ValidateAudioOutputSchema = z.object({
  matches: z.boolean().describe('Whether the transcribed audio perfectly matches the text.'),
  transcribedText: z.string().describe('The transcribed text from the audio.'),
});
export type ValidateAudioOutput = z.infer<typeof ValidateAudioOutputSchema>;

export async function validateAudio(input: ValidateAudioInput): Promise<ValidateAudioOutput> {
  return validateAudioFlow(input);
}

const prompt = ai.definePrompt({
  name: 'validateAudioPrompt',
  input: {schema: ValidateAudioInputSchema},
  output: {schema: ValidateAudioOutputSchema},
  prompt: `You are an expert audio validation agent. Your task is to transcribe the provided audio and determine if the transcription matches the provided text.

IMPORTANT MATCHING RULES:
- The target text is a single word (animal name) in lowercase
- The match should be case-insensitive (ignore capitalization completely)
- "Cat", "cat", "CAT", "CaT" should all be considered identical to "cat"
- Punctuation should be ignored for matching purposes
- Extra words should be ignored - focus only on whether the target word was spoken
- Even if the user says "this is a cat" or "I see a cat", it should match "cat"
- Variations like "kitty" for "cat" should NOT match - only exact word matches

TRANSCRIPTION FORMAT:
- ALWAYS return the transcribed text in lowercase only
- Convert all uppercase letters to lowercase in the transcribedText field
- If multiple words are spoken, transcribe all of them in lowercase
- Example: if you hear "CAT" or "Cat" or "This is a cat", return the full transcription in lowercase

MATCHING LOGIC:
- Check if the target word appears anywhere in the transcribed text
- Word boundaries matter: "cat" should match "cat" but not "caterpillar"
- Return true if the exact target word is found (case-insensitive)

Target word to match: "{{textToMatch}}"
Audio to transcribe and compare: {{media url=audioDataUri}}`,
});


const validateAudioFlow = ai.defineFlow(
  {
    name: 'validateAudioFlow',
    inputSchema: ValidateAudioInputSchema,
    outputSchema: ValidateAudioOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
