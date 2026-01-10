
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

// Función auxiliar para limpiar la respuesta y asegurar que sea JSON válido
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
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("ERROR: La variable de entorno API_KEY no está configurada en Render.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const geneticsInfo = profile.geneticMarkers.map(m => {
    const marker = GENETIC_MARKERS.find(gm => gm.id === m);
    return `${marker?.label}: ${marker?.desc}`;
  }).join(', ');

  const diseasesWithNotes = profile.diseases.map(d => {
    const note = profile.diseaseNotes?.[d];
    return note ? `${d} (Detalles: ${note})` : d;
  }).join(', ');

  const prompt = `Actúa como un Chef Ejecutivo, Nutricionista Clínico, Farmacéutico y Entrenador de Alto Rendimiento. Genera un plan integral COMPLETAMENTE EN IDIOMA ${profile.language === 'es' ? 'ESPAÑOL' : 'INGLÉS'}.

    PERFIL DEL PACIENTE:
    - Edad: ${profile.age} años | Sexo: ${profile.gender}
    - Peso: ${profile.weight} kg | Talla: ${profile.height} cm | Cintura: ${profile.waist} cm
    - Nivel de Actividad General Declarado: ${profile.activityLevel}
    
    ACTIVIDAD BASAL (NEAT):
    - Pasos diarios promedio: ${profile.basalSteps}
    - Descripción de actividad diaria: ${profile.basalActivityDesc || 'No especificada'}

    EJERCICIO DEPORTIVO:
    - Deporte Principal: ${profile.exerciseType}
    - Frecuencia Actual: ${profile.exerciseFrequency} días/semana
    - Duración Media: ${profile.exerciseDuration} minutos/sesión
    - Descripción de su Ejercicio: ${profile.exerciseDescription || 'No especificada'}

    SALUD Y BIOMÉDICA:
    - Suplementos Actuales: ${profile.supplements.join(', ') || 'Ninguno'}
    - Enfermedades y Observaciones: ${diseasesWithNotes || 'Ninguna'}
    - Tratamientos Médicos: ${profile.treatments.join(', ') || 'Ninguno'}
    - Marcadores Genéticos: ${geneticsInfo || 'No conocidos'}
    - Estilo de Alimentación: ${profile.dietType}

    REGLAS DE ORO:
    1. INSTRUCCIONES PRO: En "instructions", detalla el proceso paso a paso con técnicas profesionales.
    2. NUTRICIÓN DE PRECISIÓN: Ajusta calorías (TDEE) para balance metabólico considerando tanto su actividad basal (${profile.basalSteps} pasos) como su deporte.
    3. PLAN DE MOVIMIENTO: Genera recomendaciones de ejercicio específicas en "exercisePlan".
    4. ESTRATEGIA NEAT: Genera recomendaciones específicas para optimizar su actividad basal diaria (pasos, hábitos diarios) en "basalRecommendations".
    5. GUÍA DE SUPLEMENTACIÓN: En "supplementAdvise", analiza sus suplementos actuales y sugiere otros con sólida evidencia.
    6. EXERCISE NOTE: En cada día (day), añade una nota vinculada al esfuerzo de ese día.
  `;

  const mealSchema = {
    type: Type.OBJECT,
    properties: MEAL_PROPERTIES,
    required: MEAL_REQUIRED
  };

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
                  breakfast: mealSchema,
                  lunch: mealSchema,
                  snack: mealSchema,
                  dinner: mealSchema,
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

    const cleanedText = cleanJSONResponse(response.text || "");
    return JSON.parse(cleanedText) as WeeklyDiet;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const getMealAlternatives = async (originalMeal: Meal, profile: UserProfile): Promise<Meal[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return [];
  
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Como Chef-Nutricionista, genera 2 platos alternativos para esta comida: "${originalMeal.name}".
    RESTRICCIONES CRÍTICAS:
    1. NUTRICIÓN: Aproximadamente ${originalMeal.calories} kcal, ${originalMeal.protein}g proteína, ${originalMeal.carbs}g carbos y ${originalMeal.fats}g grasas (+/- 5%).
    2. ESTILO: Dieta "${profile.dietType}" e idioma ${profile.language === 'es' ? 'Español' : 'Inglés'}.
    3. DETALLE: Instrucciones de cocina profesionales.
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

    const cleanedText = cleanJSONResponse(response.text || "");
    return JSON.parse(cleanedText) as Meal[];
  } catch (error) {
    console.error("Alternatives API Error:", error);
    return [];
  }
};
