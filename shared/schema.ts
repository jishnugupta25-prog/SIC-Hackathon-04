import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table with email verification
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// OTP verification codes
export const otpCodes = pgTable("otp_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Emergency contacts for each user
export const emergencyContacts = pgTable("emergency_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// SOS events log
export const sosEvents = pgTable("sos_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  address: text("address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Crime data (simulated for MVP)
export const crimeData = pgTable("crime_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  crimeType: text("crime_type").notNull(),
  severity: integer("severity").notNull(), // 1-5 scale
  description: text("description"),
  reportedAt: timestamp("reported_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  emergencyContacts: many(emergencyContacts),
  sosEvents: many(sosEvents),
  otpCodes: many(otpCodes),
}));

export const emergencyContactsRelations = relations(emergencyContacts, ({ one }) => ({
  user: one(users, {
    fields: [emergencyContacts.userId],
    references: [users.id],
  }),
}));

export const sosEventsRelations = relations(sosEvents, ({ one }) => ({
  user: one(users, {
    fields: [sosEvents.userId],
    references: [users.id],
  }),
}));

export const otpCodesRelations = relations(otpCodes, ({ one }) => ({
  user: one(users, {
    fields: [otpCodes.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  isVerified: true,
}).extend({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "OTP must be 6 digits"),
});

export const insertEmergencyContactSchema = createInsertSchema(emergencyContacts).omit({
  id: true,
  userId: true,
  createdAt: true,
}).extend({
  name: z.string().min(1, "Name is required"),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"),
});

export const insertSosEventSchema = createInsertSchema(sosEvents).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertCrimeDataSchema = createInsertSchema(crimeData).omit({
  id: true,
  reportedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginUser = z.infer<typeof loginSchema>;
export type VerifyOtp = z.infer<typeof verifyOtpSchema>;

export type InsertEmergencyContact = z.infer<typeof insertEmergencyContactSchema>;
export type EmergencyContact = typeof emergencyContacts.$inferSelect;

export type InsertSosEvent = z.infer<typeof insertSosEventSchema>;
export type SosEvent = typeof sosEvents.$inferSelect;

export type InsertCrimeData = z.infer<typeof insertCrimeDataSchema>;
export type CrimeData = typeof crimeData.$inferSelect;

export type OtpCode = typeof otpCodes.$inferSelect;
