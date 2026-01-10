
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, WeeklyDiet, Meal } from "../types";
import { GENETIC_MARKERS } from "../constants/medicalData";

const MEAL_PROPERTIES = {
  name: { type: Type.STRING },
  description: { type: Type.STRING },
  instructions: { type: Type.STRING, description: "Detailed step-by-step professional cooking instructions." },
  prepTime: { type: Type.STRING, description: "e.g. 15 min, 45 min" },
  difficulty: { type: Type.STRING, description: "Fácil, Media o Alta" },
  calories: { type: Type.NUMBER },
  protein: { type: Type.NUMBER },
  carbs: { type: Type.NUMBER },
  fats: { type: Type.NUMBER }
};

const MEAL_REQUIRED = ["name", "description", "instructions", "prepTime", "difficulty", "calories", "protein", "carbs", "fats"];

const cleanJSONResponse = (text: string): string => {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```/, "").replace(/```$/, "");
  }
  return cleaned.trim();
};

export const generateDietPlan = async (profile: UserProfile): Promise<WeeklyDiet> => {
  // Validación de seguridad para confirmar la inyección del build
  if (!process.env.API_KEY) {
    throw new Error("API_KEY_MISSING: La variable no se inyectó correctamente en el build. Revisa vite.config.ts.");
  }

  // Inicialización directa según directrices
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const geneticsInfo = profile.geneticMarkers.map(m => {
    const marker = GENETIC_MARKERS.find(gm => gm.id === m);
    return `${marker?.label}: ${marker?.desc}`;
  }).join(', ');

  const diseasesWithNotes = profile.diseases.map(d => {
    const note = profile.diseaseNotes?.[d];
    return note ? `${d} (Detalles: ${note})` : d;
  }).join(', ');

  const prompt = `Actúa como un Chef Ejecutivo y Nutricionista Clínico. Genera un plan nutricional de 7 días COMPLETAMENTE EN ${profile.language === 'es' ? 'ESPAÑOL' : 'INGLÉS'}.
    PACIENTE: Edad ${profile.age}, ${profile.gender}, ${profile.weight}kg, Talla ${profile.height}cm.
    Dieta: ${profile.dietType}. Salud: ${diseasesWithNotes || 'Ninguna'}. Genética: ${geneticsInfo || 'No conocida'}.
    REQUISITOS: Ajuste calórico para adelgazamiento y recetas profesionales paso a paso.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            plan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING },
                  breakfast: { type: Type.OBJECT, properties: MEAL_PROPERTIES, required: MEAL_REQUIRED },
                  lunch: { type: Type.OBJECT, properties: MEAL_PROPERTIES, required: MEAL_REQUIRED },
                  snack: { type: Type.OBJECT, properties: MEAL_PROPERTIES, required: MEAL_REQUIRED },
                  dinner: { type: Type.OBJECT, properties: MEAL_PROPERTIES, required: MEAL_REQUIRED },
                  totalCalories: { type: Type.NUMBER },
                  exerciseNote: { type: Type.STRING }
                },
                required: ["day", "breakfast", "lunch", "snack", "dinner", "totalCalories"]
              }
            },
            recommendations: { type: Type.STRING },
            exercisePlan: { type: Type.STRING },
            basalRecommendations: { type: Type.STRING },
            supplementAdvise: { type: Type.STRING }
          },
          required: ["plan", "recommendations", "exercisePlan", "basalRecommendations", "supplementAdvise"]
        }
      }
    });

    return JSON.parse(cleanJSONResponse(response.text || "")) as WeeklyDiet;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const getMealAlternatives = async (originalMeal: Meal, profile: UserProfile): Promise<Meal[]> => {
  if (!process.env.API_KEY) return [];
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Genera 2 alternativas saludables para: "${originalMeal.name}" (${originalMeal.calories} kcal).
    Estilo de dieta: ${profile.dietType}. Idioma: ${profile.language === 'es' ? 'Español' : 'Inglés'}.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.OBJECT, properties: MEAL_PROPERTIES, required: MEAL_REQUIRED }
        }
      }
    });
    return JSON.parse(cleanJSONResponse(response.text || "[]")) as Meal[];
  } catch (error) {
    return [];
  }
};
