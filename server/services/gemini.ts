import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface SafetyInsight {
  riskScore: number;
  safetyLevel: string;
  suggestions: string[];
  areaAnalysis: string;
}

export async function analyzeSafety(
  latitude: number,
  longitude: number,
  crimeCount: number,
  averageSeverity: number
): Promise<SafetyInsight> {
  // Check if Gemini API key is configured
  if (!process.env.GEMINI_API_KEY) {
    console.warn("Gemini API key not configured, using fallback");
    return generateFallbackInsight(crimeCount, averageSeverity);
  }

  const prompt = `You are a safety analysis expert. Analyze the following location and provide safety insights:

Location: ${latitude}, ${longitude}
Nearby crimes reported: ${crimeCount}
Average crime severity: ${averageSeverity}/5

Provide a JSON response with:
1. riskScore (1-10, where 1 is safest and 10 is most dangerous)
2. safetyLevel (one of: "Safe", "Moderate", "Risky")
3. suggestions (array of 3-5 practical safety tips for this area)
4. areaAnalysis (2-3 sentence summary of the area's safety profile)

Consider factors like crime density, severity, and general urban safety principles.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            riskScore: { type: "number" },
            safetyLevel: { type: "string" },
            suggestions: {
              type: "array",
              items: { type: "string" },
            },
            areaAnalysis: { type: "string" },
          },
          required: ["riskScore", "safetyLevel", "suggestions", "areaAnalysis"],
        },
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (rawJson) {
      try {
        const data: SafetyInsight = JSON.parse(rawJson);
        // Validate response has required fields
        if (data.riskScore && data.safetyLevel && data.suggestions && data.areaAnalysis) {
          return data;
        }
      } catch (parseError) {
        console.error("Failed to parse Gemini response:", parseError);
      }
    }
  } catch (error) {
    console.error("Gemini AI error:", error);
  }

  // Fallback response
  return generateFallbackInsight(crimeCount, averageSeverity);
}

function generateFallbackInsight(crimeCount: number, averageSeverity: number): SafetyInsight {
  const riskScore = Math.min(10, Math.round((crimeCount / 5) + averageSeverity));
  const safetyLevel = riskScore >= 7 ? "Risky" : riskScore >= 4 ? "Moderate" : "Safe";
  
  return {
    riskScore,
    safetyLevel,
    suggestions: [
      "Stay aware of your surroundings at all times",
      "Travel in groups when possible, especially at night",
      "Keep emergency contacts readily accessible",
      "Trust your instincts and avoid situations that feel unsafe",
      "Use well-lit and populated routes",
    ],
    areaAnalysis: `Based on ${crimeCount} reported incidents with average severity of ${averageSeverity.toFixed(1)}/5, this area shows ${safetyLevel.toLowerCase()} crime activity. ${safetyLevel === "Risky" ? "Exercise extra caution and consider alternative routes." : safetyLevel === "Moderate" ? "Stay vigilant and follow basic safety precautions." : "Area appears relatively safe, but always maintain situational awareness."}`,
  };
}
