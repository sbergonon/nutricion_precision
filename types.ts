
export type Gender = 'Masculino' | 'Femenino' | 'Otro';
export type Language = 'es' | 'en';

export enum ActivityLevel {
  Sedentary = 'Sedentario',
  Light = 'Ligero',
  Moderate = 'Moderado',
  Active = 'Muy Activo',
  Athlete = 'Atleta'
}

export type ExerciseType = 'Ninguno' | 'Running' | 'Fuerza' | 'Yoga' | 'Ciclismo' | 'Natación' | 'Funcional' | 'Otro';

export interface UserProfile {
  age: number;
  gender: Gender;
  weight: number;
  height: number;
  waist: number;
  intolerances: string[];
  diseases: string[];
  diseaseNotes?: Record<string, string>;
  treatments: string[];
  geneticMarkers: string[];
  supplements: string[];
  dietType: string;
  activityLevel: ActivityLevel;
  exerciseType: ExerciseType;
  exerciseDescription: string;
  exerciseFrequency: number;
  exerciseDuration: number;
  basalSteps: number;
  basalActivityDesc: string;
  language: Language;
}

export interface ProgressEntry {
  date: string;
  weight: number;
  waist: number;
  bmi: number;
}

export interface Meal {
  name: string;
  description: string;
  instructions: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  prepTime: string;
  difficulty: string;
  alternatives?: Meal[];
}

export interface DailyDiet {
  day: string;
  breakfast: Meal;
  lunch: Meal;
  snack: Meal;
  dinner: Meal;
  totalCalories: number;
  exerciseNote?: string;
}

export interface WeeklyDiet {
  plan: DailyDiet[];
  recommendations: string;
  exercisePlan: string;
  basalRecommendations: string;
  supplementAdvise: string;
}

export enum DietType {
  Standard = 'Estándar',
  Vegan = 'Vegana',
  Keto = 'Cetogénica',
  Paleo = 'Paleo',
  Mediterranean = 'Mediterránea',
  Intermittent = 'Ayuno Intermitente'
}
