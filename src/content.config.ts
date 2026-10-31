import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
const common = z.object({ title: z.string(), description: z.string(), date: z.coerce.date(), draft: z.boolean().default(false), sample: z.boolean().default(false) });
const projects = defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/projects' }), schema: common.extend({ category: z.string(), role: z.string(), order: z.number(), video: z.string().optional() }) });
const blog = defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/blog' }), schema: common.extend({ topic: z.string() }) });
export const collections = { projects, blog };
