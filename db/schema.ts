import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const members=sqliteTable('members',{email:text('email').primaryKey(),role:text('role').notNull(),status:text('status').notNull(),created:integer('created').notNull()});
export const sessions=sqliteTable('sessions',{hash:text('hash').primaryKey(),email:text('email').notNull(),expires:integer('expires').notNull()},t=>[index('session_email').on(t.email),index('session_expiry').on(t.expires)]);
export const tokens=sqliteTable('tokens',{hash:text('hash').primaryKey(),email:text('email').notNull(),expires:integer('expires').notNull()},t=>[index('token_expiry').on(t.expires)]);
export const rates=sqliteTable('rates',{key:text('key').primaryKey(),count:integer('count').notNull(),expires:integer('expires').notNull()});
export const audit=sqliteTable('audit',{id:text('id').primaryKey(),actor:text('actor').notNull(),action:text('action').notNull(),target:text('target').notNull(),before:text('before_json').notNull(),after:text('after_json').notNull(),status:text('status').notNull(),created:integer('created').notNull(),payloadHash:text('payload_hash').notNull()},t=>[index('audit_time').on(t.created)]);
export const gate=sqliteTable('gate',{key:text('key').primaryKey(),value:text('value').notNull()});
