
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
  // Inicialización obligatoria según directrices técnicas
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

    PACIENTE:
    - Edad: ${profile.age} | Sexo: ${profile.gender}
    - Peso: ${profile.weight}kg | Talla: ${profile.height}cm | Cintura: ${profile.waist}cm
    - Actividad: ${profile.activityLevel} | Pasos: ${profile.basalSteps}
    - Deporte: ${profile.exerciseType} (${profile.exerciseFrequency} días/semana)
    - Salud: ${diseasesWithNotes || 'Ninguna'} | Medicación: ${profile.treatments.join(', ') || 'Ninguna'}
    - Genética: ${geneticsInfo || 'No conocida'}
    - Dieta preferida: ${profile.dietType}

    REQUISITOS:
    1. Ajuste calórico para adelgazamiento progresivo y saludable.
    2. Instrucciones de cocina detalladas y profesionales.
    3. Recomendaciones específicas de NEAT (actividad diaria) y suplementación.
  `;

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

    const text = response.text;
    if (!text) throw new Error("La IA devolvió una respuesta vacía.");
    
    return JSON.parse(cleanJSONResponse(text)) as WeeklyDiet;
  } catch (error: any) {
    console.error("Error en generateDietPlan:", error);
    throw error;
  }
};

export const getMealAlternatives = async (originalMeal: Meal, profile: UserProfile): Promise<Meal[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Genera 2 alternativas saludables para: "${originalMeal.name}" (${originalMeal.calories} kcal).
    Estilo de dieta: ${profile.dietType}. Idioma: ${profile.language === 'es' ? 'Español' : 'Inglés'}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: MEAL_PROPERTIES,
            required: MEAL_REQUIRED
          }
        }
      }
    });

    return JSON.parse(cleanJSONResponse(response.text || "[]")) as Meal[];
  } catch (error) {
    return [];
  }
};
