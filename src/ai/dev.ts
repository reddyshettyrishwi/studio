import { config } from 'dotenv';
config();

import '@/ai/flows/detect-duplicate-influencers.ts';
import '@/ai/flows/alert-on-price-anomalies.ts';