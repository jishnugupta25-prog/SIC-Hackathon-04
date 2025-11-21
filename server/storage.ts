import { 
  users, 
  otpCodes, 
  emergencyContacts, 
  sosEvents, 
  crimeData,
  type User, 
  type InsertUser,
  type OtpCode,
  type EmergencyContact,
  type InsertEmergencyContact,
  type SosEvent,
  type InsertSosEvent,
  type CrimeData,
  type InsertCrimeData,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserVerification(id: string, isVerified: boolean): Promise<void>;
  
  // OTP methods
  createOtpCode(userId: string, code: string, expiresAt: Date): Promise<OtpCode>;
  getValidOtpCode(userId: string, code: string): Promise<OtpCode | undefined>;
  deleteOtpCode(id: string): Promise<void>;
  
  // Emergency contacts methods
  getEmergencyContacts(userId: string): Promise<EmergencyContact[]>;
  createEmergencyContact(contact: InsertEmergencyContact & { userId: string }): Promise<EmergencyContact>;
  deleteEmergencyContact(id: string): Promise<void>;
  
  // SOS events methods
  createSosEvent(event: InsertSosEvent & { userId: string }): Promise<SosEvent>;
  getRecentSosEvents(userId: string, limit: number): Promise<SosEvent[]>;
  
  // Crime data methods
  createCrimeData(crime: InsertCrimeData): Promise<CrimeData>;
  getCrimeDataNearLocation(latitude: number, longitude: number, radiusKm: number): Promise<CrimeData[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserVerification(id: string, isVerified: boolean): Promise<void> {
    await db
      .update(users)
      .set({ isVerified })
      .where(eq(users.id, id));
  }

  async createOtpCode(userId: string, code: string, expiresAt: Date): Promise<OtpCode> {
    const [otpCode] = await db
      .insert(otpCodes)
      .values({ userId, code, expiresAt })
      .returning();
    return otpCode;
  }

  async getValidOtpCode(userId: string, code: string): Promise<OtpCode | undefined> {
    const [otpCode] = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.userId, userId),
          eq(otpCodes.code, code),
          sql`${otpCodes.expiresAt} > NOW()`
        )
      );
    return otpCode || undefined;
  }

  async deleteOtpCode(id: string): Promise<void> {
    await db.delete(otpCodes).where(eq(otpCodes.id, id));
  }

  async getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
    return await db
      .select()
      .from(emergencyContacts)
      .where(eq(emergencyContacts.userId, userId));
  }

  async createEmergencyContact(contact: InsertEmergencyContact & { userId: string }): Promise<EmergencyContact> {
    const [emergencyContact] = await db
      .insert(emergencyContacts)
      .values(contact)
      .returning();
    return emergencyContact;
  }

  async deleteEmergencyContact(id: string): Promise<void> {
    await db.delete(emergencyContacts).where(eq(emergencyContacts.id, id));
  }

  async createSosEvent(event: InsertSosEvent & { userId: string }): Promise<SosEvent> {
    const [sosEvent] = await db
      .insert(sosEvents)
      .values(event)
      .returning();
    return sosEvent;
  }

  async getRecentSosEvents(userId: string, limit: number = 10): Promise<SosEvent[]> {
    return await db
      .select()
      .from(sosEvents)
      .where(eq(sosEvents.userId, userId))
      .orderBy(desc(sosEvents.createdAt))
      .limit(limit);
  }

  async createCrimeData(crime: InsertCrimeData): Promise<CrimeData> {
    const [crimeDataEntry] = await db
      .insert(crimeData)
      .values(crime)
      .returning();
    return crimeDataEntry;
  }

  async getCrimeDataNearLocation(latitude: number, longitude: number, radiusKm: number): Promise<CrimeData[]> {
    // Using Haversine formula to calculate distance
    // This is a simplified query - in production you'd use PostGIS
    const crimes = await db
      .select()
      .from(crimeData)
      .where(
        sql`
          (6371 * acos(
            cos(radians(${latitude})) * 
            cos(radians(${crimeData.latitude})) * 
            cos(radians(${crimeData.longitude}) - radians(${longitude})) + 
            sin(radians(${latitude})) * 
            sin(radians(${crimeData.latitude}))
          )) <= ${radiusKm}
        `
      );
    return crimes;
  }
}

export const storage = new DatabaseStorage();
