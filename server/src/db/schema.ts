import { pgTable, uuid, text, timestamp, jsonb, integer, primaryKey, index } from 'drizzle-orm/pg-core';
import type { Brief, Feedback, FileRef, Inputs, Review } from '@shared/types';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

export const magicLinks = pgTable('magic_links', {
  tokenHash: text('token_hash').primaryKey(),
  email: text('email').notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
});

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  inputs: jsonb('inputs').$type<Inputs>().notNull(),
  brief: jsonb('brief').$type<Brief>().notNull(),
  status: text('status').$type<'active' | 'complete'>().notNull().default('active'),
  xp: integer('xp').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('projects_user_idx').on(t.userId)]);

export const submissions = pgTable('submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  n: integer('n').notNull(), // 1..N, or 0 = final
  note: text('note').notNull(),
  link: text('link'),
  files: jsonb('files').$type<FileRef[]>().notNull().default([]),
  feedback: jsonb('feedback').$type<Feedback | null>(),
  rating: integer('rating'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('submissions_project_idx').on(t.projectId)]);

export const reviews = pgTable('reviews', {
  projectId: uuid('project_id').primaryKey().references(() => projects.id, { onDelete: 'cascade' }),
  review: jsonb('review').$type<Review>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Autosave of unsent uploads
export const drafts = pgTable('drafts', {
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  n: integer('n').notNull(),
  note: text('note').notNull().default(''),
  link: text('link').notNull().default(''),
  files: jsonb('files').$type<FileRef[]>().notNull().default([]),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.projectId, t.n] })]);
