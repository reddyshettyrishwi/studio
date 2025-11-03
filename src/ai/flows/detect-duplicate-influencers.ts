
'use server';

/**
 * @fileOverview Detects duplicate influencer profiles based on mobile number and legal name.
 *
 * - detectDuplicateInfluencers - A function that handles the duplicate detection process.
 * - DetectDuplicateInfluencersInput - The input type for the detectDuplicateInfluencers function.
 * - DetectDuplicateInfluencersOutput - The return type for the detectDuplicateInfluencers function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectDuplicateInfluencersInputSchema = z.object({
  mobileNumber: z
    .string()
    .describe('The mobile phone number of the influencer.'),
  legalName: z.string().describe('The legal name of the influencer.'),
});
export type DetectDuplicateInfluencersInput = z.infer<
  typeof DetectDuplicateInfluencersInputSchema
>;

const DetectDuplicateInfluencersOutputSchema = z.object({
  isDuplicate: z
    .boolean()
    .describe('Whether the influencer profile is a duplicate.'),
  confidence: z
    .number()
    .describe(
      'The confidence score (0-1) of the duplicate detection. Higher values indicate higher confidence.'
    ),
  potentialDuplicates: z
    .array(z.string())
    .describe(
      'An array of IDs of potential duplicate influencers found in the database.'
    ),
});
export type DetectDuplicateInfluencersOutput = z.infer<
  typeof DetectDuplicateInfluencersOutputSchema
>;

export async function detectDuplicateInfluencers(
  input: DetectDuplicateInfluencersInput
): Promise<DetectDuplicateInfluencersOutput> {
  return detectDuplicateInfluencersFlow(input);
}

const detectDuplicateInfluencersPrompt = ai.definePrompt({
  name: 'detectDuplicateInfluencersPrompt',
  input: {schema: DetectDuplicateInfluencersInputSchema},
  output: {schema: DetectDuplicateInfluencersOutputSchema},
  prompt: `You are an expert in detecting duplicate profiles in a database of influencers.

  Given the following information about a new influencer profile, determine if it is a duplicate of an existing profile.

  Mobile Number: {{{mobileNumber}}}
  Legal Name: {{{legalName}}}

  Consider the mobile number and legal name as unique identifiers.  If they match an existing profile, it is highly likely to be a duplicate.

  Return a confidence score (0-1) indicating the likelihood of a duplicate.
  If the profile is determined to be a duplicate, populate the potentialDuplicates field with an array of IDs of potential duplicate influencers found in the database.
  `,
});

const detectDuplicateInfluencersFlow = ai.defineFlow(
  {
    name: 'detectDuplicateInfluencersFlow',
    inputSchema: DetectDuplicateInfluencersInputSchema,
    outputSchema: DetectDuplicateInfluencersOutputSchema,
  },
  async input => {
    const {output} = await detectDuplicateInfluencersPrompt(input);
    return output!;
  }
);
