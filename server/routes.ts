import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { 
  insertUserSchema, 
  loginSchema, 
  verifyOtpSchema,
  insertEmergencyContactSchema,
  insertSosEventSchema,
} from "@shared/schema";
import { sendOtpEmail } from "./services/email";
import { sendBulkSosAlerts } from "./services/sms";
import { analyzeSafety } from "./services/gemini";

// Simple session storage (in production, use Redis or similar)
const sessions = new Map<string, string>();

// Middleware to check authentication
function requireAuth(req: any, res: any, next: any) {
  const sessionId = req.headers['x-session-id'];
  const userId = sessionId ? sessions.get(sessionId) : null;
  
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  req.userId = userId;
  next();
}

// Generate OTP code
function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      // Create user
      const user = await storage.createUser({
        email: data.email,
        password: hashedPassword,
      });
      
      // Generate and send OTP
      const otpCode = generateOtpCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await storage.createOtpCode(user.id, otpCode, expiresAt);
      
      // Send OTP email (gracefully handle errors)
      try {
        await sendOtpEmail(user.email, otpCode);
      } catch (emailError) {
        console.error("Failed to send OTP email:", emailError);
        // Continue anyway - user can request new OTP
      }
      
      res.json({ 
        success: true,
        message: "Registration successful. Please check your email for verification code." 
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ error: error.message || "Registration failed" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const data = verifyOtpSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const otpCode = await storage.getValidOtpCode(user.id, data.code);
      if (!otpCode) {
        return res.status(400).json({ error: "Invalid or expired verification code" });
      }
      
      // Verify user
      await storage.updateUserVerification(user.id, true);
      await storage.deleteOtpCode(otpCode.id);
      
      res.json({ 
        success: true,
        message: "Email verified successfully" 
      });
    } catch (error: any) {
      console.error("OTP verification error:", error);
      res.status(400).json({ error: error.message || "Verification failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      if (!user.isVerified) {
        return res.status(403).json({ error: "Please verify your email before logging in" });
      }
      
      const validPassword = await bcrypt.compare(data.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      // Create session
      const sessionId = Math.random().toString(36).substring(2);
      sessions.set(sessionId, user.id);
      
      // Don't send password in response
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({ 
        user: userWithoutPassword,
        sessionId,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(400).json({ error: error.message || "Login failed" });
    }
  });

  // Emergency Contacts Routes
  app.get("/api/contacts", requireAuth, async (req, res) => {
    try {
      const contacts = await storage.getEmergencyContacts(req.userId);
      res.json(contacts);
    } catch (error: any) {
      console.error("Get contacts error:", error);
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  app.post("/api/contacts", requireAuth, async (req, res) => {
    try {
      const data = insertEmergencyContactSchema.parse(req.body);
      const contact = await storage.createEmergencyContact({
        ...data,
        userId: req.userId,
      });
      res.json(contact);
    } catch (error: any) {
      console.error("Create contact error:", error);
      res.status(400).json({ error: error.message || "Failed to create contact" });
    }
  });

  app.delete("/api/contacts/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteEmergencyContact(req.params.id);
      res.json({ success: true, message: "Contact deleted successfully" });
    } catch (error: any) {
      console.error("Delete contact error:", error);
      res.status(500).json({ error: "Failed to delete contact" });
    }
  });

  // SOS Routes
  app.post("/api/sos/trigger", requireAuth, async (req, res) => {
    try {
      const data = insertSosEventSchema.parse(req.body);
      
      // Get user info
      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Get emergency contacts
      const contacts = await storage.getEmergencyContacts(req.userId);
      if (contacts.length === 0) {
        return res.status(400).json({ error: "No emergency contacts configured. Please add emergency contacts first." });
      }
      
      // Create SOS event
      const sosEvent = await storage.createSosEvent({
        ...data,
        userId: req.userId,
      });
      
      // Send SMS alerts to all contacts (gracefully handle errors)
      let contactsNotified = 0;
      try {
        await sendBulkSosAlerts(
          contacts,
          user.email,
          data.latitude,
          data.longitude,
          data.address
        );
        contactsNotified = contacts.length;
      } catch (smsError: any) {
        console.error("Failed to send SMS alerts:", smsError);
        // Continue - SOS event is logged even if SMS fails
      }
      
      res.json({ 
        success: true,
        message: contactsNotified > 0 
          ? "SOS alerts sent successfully" 
          : "SOS event logged but SMS alerts could not be sent. Please check Twilio configuration.",
        event: sosEvent,
        contactsNotified,
      });
    } catch (error: any) {
      console.error("SOS trigger error:", error);
      res.status(500).json({ error: error.message || "Failed to send SOS alert" });
    }
  });

  app.get("/api/sos/recent", requireAuth, async (req, res) => {
    try {
      const events = await storage.getRecentSosEvents(req.userId, 10);
      res.json(events);
    } catch (error: any) {
      console.error("Get recent SOS error:", error);
      res.status(500).json({ error: "Failed to fetch SOS events" });
    }
  });

  // Safe Places Route (using Google Places API)
  app.get("/api/safe-places", requireAuth, async (req, res) => {
    try {
      const { latitude, longitude } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }

      if (!process.env.GOOGLE_MAPS_API_KEY) {
        return res.status(500).json({ 
          error: "Google Maps API key not configured",
          places: []
        });
      }
      
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      
      // Search for nearby safe places using Google Places API
      const types = ['police', 'hospital', 'fire_station'];
      const radius = 5000; // 5km
      
      const allPlaces: any[] = [];
      
      for (const type of types) {
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${process.env.GOOGLE_MAPS_API_KEY}`
          );
          const data = await response.json();
          
          if (data.results) {
            const places = data.results.slice(0, 5).map((place: any) => ({
              id: place.place_id,
              name: place.name,
              type: type,
              address: place.vicinity,
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
              distance: calculateDistance(
                lat,
                lng,
                place.geometry.location.lat,
                place.geometry.location.lng
              ),
            }));
            allPlaces.push(...places);
          }
        } catch (error) {
          console.error(`Error fetching ${type}:`, error);
        }
      }
      
      // Sort by distance
      allPlaces.sort((a, b) => a.distance - b.distance);
      
      res.json({ places: allPlaces.slice(0, 15) });
    } catch (error: any) {
      console.error("Safe places error:", error);
      res.status(500).json({ error: "Failed to fetch safe places", places: [] });
    }
  });

  // Crime Data Routes
  app.get("/api/crime/stats", requireAuth, async (req, res) => {
    try {
      const { latitude, longitude } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }
      
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      
      // Get crime data within 5km radius
      const crimes = await storage.getCrimeDataNearLocation(lat, lng, 5);
      
      const totalCrimes = crimes.length;
      const averageSeverity = totalCrimes > 0
        ? crimes.reduce((sum, crime) => sum + crime.severity, 0) / totalCrimes
        : 0;
      
      const crimesByType = crimes.reduce((acc: any, crime) => {
        acc[crime.crimeType] = (acc[crime.crimeType] || 0) + 1;
        return acc;
      }, {});
      
      const crimesByTypeArray = Object.entries(crimesByType).map(([type, count]) => ({
        type,
        count: count as number,
      }));
      
      const safetyLevel = totalCrimes > 15 ? "Risky" : totalCrimes > 8 ? "Moderate" : "Safe";
      const trend = "Stable";
      
      res.json({
        totalCrimes,
        severity: Math.round(averageSeverity * 10) / 10,
        safetyLevel,
        trend,
        crimesByType: crimesByTypeArray,
      });
    } catch (error: any) {
      console.error("Crime stats error:", error);
      res.status(500).json({ error: "Failed to fetch crime statistics" });
    }
  });

  // AI Insights Route
  app.get("/api/ai/insights", requireAuth, async (req, res) => {
    try {
      const { latitude, longitude } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }
      
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      
      // Get crime data
      const crimes = await storage.getCrimeDataNearLocation(lat, lng, 5);
      const totalCrimes = crimes.length;
      const averageSeverity = totalCrimes > 0
        ? crimes.reduce((sum, crime) => sum + crime.severity, 0) / totalCrimes
        : 0;
      
      // Get AI insights
      const insights = await analyzeSafety(lat, lng, totalCrimes, averageSeverity);
      
      res.json(insights);
    } catch (error: any) {
      console.error("AI insights error:", error);
      res.status(500).json({ error: "Failed to generate AI insights" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
