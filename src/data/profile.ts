import { z } from 'astro/zod';
import raw from './profile.json';

const schema = z.object({
  name: z.string(),
  role: z.string(),
  eyebrow: z.string(),
  headline: z.string(),
  intro: z.string(),
  email: z.union([z.literal(''), z.email()]),
  links: z.array(z.object({ label: z.string(), url: z.url({ protocol: /^https?$/ }) })),
  experience: z.array(z.object({
    period: z.string(),
    company: z.string(),
    role: z.string(),
    description: z.string(),
  })),
});

export const profile = schema.parse(raw);
