
'use server';

/**
 * @fileOverview An AI agent that alerts managers if a proposed influencer campaign price exceeds previous benchmarks significantly.
 *
 * - alertOnPriceAnomalies - A function that checks if a proposed influencer campaign price exceeds previous benchmarks.
 * - AlertOnPriceAnomaliesInput - The input type for the alertOnPriceAnomalies function.
 * - AlertOnPriceAnomaliesOutput - The return type for the alertOnPriceAnomalies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AlertOnPriceAnomaliesInputSchema = z.object({
  influencerName: z.string().describe('The name of the influencer.'),
  proposedPrice: z.number().describe('The newly proposed price for the influencer campaign.'),
  previousPriceBenchmarks: z
    .array(z.number())
    .describe('An array of previous prices paid for the influencer for similar campaigns.'),
});

export type AlertOnPriceAnomaliesInput = z.infer<typeof AlertOnPriceAnomaliesInputSchema>;

const AlertOnPriceAnomaliesOutputSchema = z.object({
  isPriceTooHigh: z
    .boolean()
    .describe(
      'Whether the proposed price is significantly higher than previous price benchmarks for the influencer.'
    ),
  explanation: z.string().describe('An explanation of why the price is too high, or why it is reasonable.'),
});

export type AlertOnPriceAnomaliesOutput = z.infer<typeof AlertOnPriceAnomaliesOutputSchema>;

export async function alertOnPriceAnomalies(
  input: AlertOnPriceAnomaliesInput
): Promise<AlertOnPriceAnomaliesOutput> {
  return alertOnPriceAnomaliesFlow(input);
}

const alertOnPriceAnomaliesPrompt = ai.definePrompt({
  name: 'alertOnPriceAnomaliesPrompt',
  input: {schema: AlertOnPriceAnomaliesInputSchema},
  output: {schema: AlertOnPriceAnomaliesOutputSchema},
  prompt: `You are an expert marketing campaign price analyst.

You are provided with the influencer's name, the proposed price for the campaign, and a list of previous prices paid for the influencer for similar campaigns.

Determine if the proposed price is significantly higher than the previous price benchmarks. Significant means meaningfully above what would be expected based on prior pricing.

Influencer Name: {{{influencerName}}}
Proposed Price: {{{proposedPrice}}}
Previous Price Benchmarks: {{#each previousPriceBenchmarks}}{{{this}}} {{/each}}

Based on this data, determine if the proposed price is too high, and explain why or why not in a brief sentence.
`,
});

const alertOnPriceAnomaliesFlow = ai.defineFlow(
  {
    name: 'alertOnPriceAnomaliesFlow',
    inputSchema: AlertOnPriceAnomaliesInputSchema,
    outputSchema: AlertOnPriceAnomaliesOutputSchema,
  },
  async input => {
    const {output} = await alertOnPriceAnomaliesPrompt(input);
    return output!;
  }
);
