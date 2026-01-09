
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { WeeklyDiet, DailyDiet, UserProfile, Language, Meal } from '../types';
import { calculateBMI, calculateCVRiskScore } from '../utils/helpers';
import { getTranslation } from '../i18n';
import { getMealAlternatives } from '../services/geminiService';

interface Props {
  diet: WeeklyDiet;
  onSave?: (diet: WeeklyDiet) => void;
  onBack?: () => void;
  language: Language;
}

const MealCard: React.FC<{ 
  label: string; 
  meal: Meal; 
  profile: UserProfile | null; 
  language: Language; 
  t: any; 
  renderMealChart: (m: Meal) => React.ReactElement;
  onMealChange: (newMeal: Meal) => void;
}> = ({ label, meal, profile, language, t, renderMealChart, onMealChange }) => {
  const [showRecipe, setShowRecipe] = useState(false);
  const [alternatives, setAlternatives] = useState<Meal[]>([]);
  const [loadingAlts, setLoadingAlts] = useState(false);
  const [showAlts, setShowAlts] = useState(false);

  const handleFetchAlternatives = async () => {
    if (alternatives.length > 0) {
      setShowAlts(!showAlts);
      return;
    }
    if (!profile) return;
    
    setLoadingAlts(true);
    try {
      const alts = await getMealAlternatives(meal, profile);
      setAlternatives(alts);
      setShowAlts(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAlts(false);
    }
  };

  const selectAlternative = (alt: Meal) => {
    onMealChange(alt);
    setShowAlts(false);
  };

  return (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-100/40 transition-all duration-500 flex flex-col group relative overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <span className="inline-block px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-700 bg-emerald-100/50 rounded-full border border-emerald-200/50">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleFetchAlternatives}
            disabled={loadingAlts}
            className={`p-2 rounded-xl border transition-all duration-300 ${
              showAlts 
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200' 
                : 'bg-white text-emerald-600 border-slate-100 hover:border-emerald-300 hover:bg-emerald-50'
            }`}
            title={language === 'es' ? 'Ver alternativas' : 'View alternatives'}
          >
            {loadingAlts ? (
              <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            )}
          </button>
          <div className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-tighter">{meal.calories} {t.diet_meal_total}</span>
          </div>
        </div>
      </div>
      
      {showAlts && alternatives.length > 0 && (
        <div className="mb-6 p-4 bg-emerald-50/50 rounded-3xl border border-emerald-100 space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <h5 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest px-1">
            {language === 'es' ? 'Alternativas Inteligentes' : 'Smart Alternatives'}
          </h5>
          <div className="grid grid-cols-1 gap-2">
            {alternatives.map((alt, idx) => (
              <button
                key={idx}
                onClick={() => selectAlternative(alt)}
                className="w-full text-left p-3 rounded-2xl bg-white border border-emerald-200 hover:border-emerald-500 hover:shadow-md transition-all group/alt"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-black text-slate-800 line-clamp-1">{alt.name}</span>
                  <span className="text-[10px] font-bold text-emerald-600">{alt.calories} kcal</span>
                </div>
                <div className="flex gap-2 text-[9px] font-bold text-slate-400">
                  <span className="bg-blue-50 px-1.5 py-0.5 rounded text-blue-600">P: {alt.protein}g</span>
                  <span className="bg-amber-50 px-1.5 py-0.5 rounded text-amber-600">C: {alt.carbs}g</span>
                  <span className="bg-rose-50 px-1.5 py-0.5 rounded text-rose-600">G: {alt.fats}g</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-5">
        <h4 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors tracking-tight mb-2">
          {meal.name}
        </h4>
        <div className="pl-3 border-l-2 border-emerald-400/30 bg-emerald-50/20 py-2 pr-2 rounded-r-2xl">
          <p className="text-slate-600 text-[13px] italic leading-relaxed font-medium">
            {meal.description}
          </p>
        </div>
      </div>
      
      {/* Ultra Prominent High-Visibility Stats */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 flex flex-col items-center justify-center p-5 bg-gradient-to-br from-indigo-50 to-white rounded-[2rem] border-2 border-indigo-100 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-indigo-100 hover:-translate-y-1">
          <div className="bg-indigo-600 text-white p-2 rounded-xl mb-2 shadow-lg shadow-indigo-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <span className="text-[15px] font-black text-indigo-900 uppercase tracking-tight">{meal.prepTime}</span>
          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] mt-0.5">{language === 'es' ? 'TIEMPO PREP' : 'PREP TIME'}</span>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-5 bg-gradient-to-br from-amber-50 to-white rounded-[2rem] border-2 border-amber-100 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-amber-100 hover:-translate-y-1">
          <div className="bg-amber-500 text-white p-2 rounded-xl mb-2 shadow-lg shadow-amber-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          </div>
          <span className="text-[15px] font-black text-amber-900 uppercase tracking-tight">{meal.difficulty}</span>
          <span className="text-[9px] font-black text-amber-400 uppercase tracking-[0.2em] mt-0.5">{language === 'es' ? 'DIFICULTAD' : 'LEVEL'}</span>
        </div>
      </div>

      <button 
        onClick={() => setShowRecipe(!showRecipe)}
        className="text-[11px] font-black text-emerald-600 hover:bg-emerald-600 hover:text-white px-4 py-3 rounded-2xl border-2 border-emerald-600/20 hover:border-emerald-600 transition-all duration-300 flex items-center justify-center gap-3 mb-6 w-full uppercase tracking-widest shadow-sm"
      >
        <svg className={`w-4 h-4 transition-transform duration-300 ${showRecipe ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
        {showRecipe ? (language === 'es' ? 'Ocultar Pasos' : 'Hide Steps') : (language === 'es' ? 'Ver Preparación' : 'View Preparation')}
      </button>

      {showRecipe && (
        <div className="mb-6 p-6 bg-slate-900 text-slate-100 rounded-[2.5rem] border border-slate-800 animate-in fade-in zoom-in-95 duration-300 shadow-2xl">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800/50">
            <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 0-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              {language === 'es' ? 'RECETA PROFESIONAL' : 'PROFESSIONAL RECIPE'}
            </h5>
            <div className="flex gap-4">
               <div className="text-right">
                  <div className="text-[8px] font-bold text-slate-500 uppercase">{language === 'es' ? 'TIEMPO' : 'TIME'}</div>
                  <div className="text-xs font-black text-indigo-400">{meal.prepTime}</div>
               </div>
               <div className="text-right">
                  <div className="text-[8px] font-bold text-slate-500 uppercase">{language === 'es' ? 'NIVEL' : 'LEVEL'}</div>
                  <div className="text-xs font-black text-amber-400">{meal.difficulty}</div>
               </div>
            </div>
          </div>
          <div className="text-[13px] text-slate-300 leading-relaxed whitespace-pre-line font-medium">{meal.instructions}</div>
        </div>
      )}
      
      <div className="mt-auto pt-4 border-t border-slate-100">
         <div className="flex justify-between items-center mb-2">
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{language === 'es' ? 'BALANCE NUTRICIONAL' : 'NUTRITIONAL BALANCE'}</span>
           <div className="flex gap-2 text-[11px] font-black">
             <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">P:{meal.protein}g</span>
             <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">C:{meal.carbs}g</span>
             <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg">G:{meal.fats}g</span>
           </div>
         </div>
         {renderMealChart(meal)}
      </div>
    </div>
  );
};

const DietView: React.FC<Props> = ({ diet, onSave, onBack, language }) => {
  const t = getTranslation(language);
  const [selectedDay, setSelectedDay] = useState(0);
  const [localDiet, setLocalDiet] = useState<WeeklyDiet>(diet);
  const [showExerciseModal, setShowExerciseModal] = useState(false);

  useEffect(() => {
    setLocalDiet(diet);
  }, [diet]);

  const day = localDiet.plan[selectedDay];
  const savedProfile = localStorage.getItem('nutriplan_profile');
  const profile: UserProfile | null = savedProfile ? JSON.parse(savedProfile) : null;

  const handleMealChange = (mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner', newMeal: Meal) => {
    const updatedPlan = [...localDiet.plan];
    const currentDay = { ...updatedPlan[selectedDay] };
    currentDay[mealType] = newMeal;
    currentDay.totalCalories = currentDay.breakfast.calories + currentDay.lunch.calories + currentDay.snack.calories + currentDay.dinner.calories;
    updatedPlan[selectedDay] = currentDay;
    setLocalDiet({ ...localDiet, plan: updatedPlan });
  };

  const renderMealChart = (meal: Meal) => {
    const data = [
      { name: language === 'es' ? 'Proteína' : 'Protein', value: meal.protein, color: '#3b82f6' },
      { name: language === 'es' ? 'Carbos' : 'Carbs', value: meal.carbs, color: '#f59e0b' },
      { name: language === 'es' ? 'Grasas' : 'Fats', value: meal.fats, color: '#e11d48' },
    ];
    return (
      <div className="h-16 w-full mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data} margin={{ left: -30, top: 0, bottom: 0, right: 10 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" hide />
            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ fontSize: '9px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={8}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const dailyMacros = {
    protein: day.breakfast.protein + day.lunch.protein + day.snack.protein + day.dinner.protein,
    carbs: day.breakfast.carbs + day.lunch.carbs + day.snack.carbs + day.dinner.carbs,
    fats: day.breakfast.fats + day.lunch.fats + day.snack.fats + day.dinner.fats,
  };

  const summaryData = [
    { name: language === 'es' ? 'Proteína' : 'Protein', value: dailyMacros.protein, color: '#3b82f6' },
    { name: language === 'es' ? 'Carbos' : 'Carbs', value: dailyMacros.carbs, color: '#f59e0b' },
    { name: language === 'es' ? 'Grasas' : 'Fats', value: dailyMacros.fats, color: '#e11d48' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{language === 'es' ? 'Tu Plan Nutricional' : 'Your Nutrition Plan'}</h2>
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          {onBack && (
            <button onClick={onBack} className="px-4 py-2 text-sm font-bold bg-white text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              {getTranslation(language).btn_back}
            </button>
          )}
          <button 
            onClick={() => setShowExerciseModal(true)}
            className="px-4 py-2 text-sm font-black bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            {t.btn_view_coach}
          </button>
          <button onClick={() => onSave?.(localDiet)} className={`px-6 py-2 text-sm font-black rounded-xl transition-all bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200`}>
             {getTranslation(language).btn_save}
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {localDiet.plan.map((d, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedDay(idx)}
            className={`px-5 py-2 rounded-full whitespace-nowrap text-xs font-black transition-all ${selectedDay === idx ? 'bg-emerald-600 text-white shadow-md scale-105' : 'bg-white text-slate-500 border border-slate-200 hover:border-emerald-300'}`}
          >
            {d.day.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <div className="bg-amber-200 p-2 rounded-xl text-amber-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest">{language === 'es' ? 'Reto de Movimiento del Día' : 'Daily Movement Challenge'}</h4>
          </div>
          <p className="text-amber-800 text-sm font-medium relative z-10">{day.exerciseNote || (language === 'es' ? 'Mantente activo con una caminata ligera.' : 'Stay active with a light walk.')}</p>
        </div>

        <div className="bg-sky-50 p-6 rounded-[2rem] border border-sky-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <div className="bg-sky-200 p-2 rounded-xl text-sky-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h4 className="text-sm font-black text-sky-900 uppercase tracking-widest">{t.basal_recs_title}</h4>
          </div>
          <p className="text-sky-800 text-sm font-medium relative z-10 italic">"{localDiet.basalRecommendations}"</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MealCard label={language === 'es' ? 'Desayuno' : 'Breakfast'} meal={day.breakfast} profile={profile} language={language} t={t} renderMealChart={renderMealChart} onMealChange={(m) => handleMealChange('breakfast', m)} />
        <MealCard label={language === 'es' ? 'Almuerzo' : 'Lunch'} meal={day.lunch} profile={profile} language={language} t={t} renderMealChart={renderMealChart} onMealChange={(m) => handleMealChange('lunch', m)} />
        <MealCard label={language === 'es' ? 'Merienda' : 'Snack'} meal={day.snack} profile={profile} language={language} t={t} renderMealChart={renderMealChart} onMealChange={(m) => handleMealChange('snack', m)} />
        <MealCard label={language === 'es' ? 'Cena' : 'Dinner'} meal={day.dinner} profile={profile} language={language} t={t} renderMealChart={renderMealChart} onMealChange={(m) => handleMealChange('dinner', m)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden flex flex-col justify-between border border-slate-800">
            <h4 className="font-black flex items-center gap-2 text-emerald-400 uppercase tracking-widest text-sm mb-6">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              {t.diet_recs}
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed italic font-medium">"{localDiet.recommendations}"</p>
            <div className="mt-10 pt-6 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{t.diet_total}</span>
              <div className="text-right">
                <span className="text-3xl font-black text-emerald-400">{day.totalCalories}</span>
                <span className="text-xs font-black text-emerald-600 ml-1">KCAL</span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden border border-indigo-800">
             <div className="flex justify-between items-start mb-6">
                <h4 className="font-black flex items-center gap-2 text-indigo-400 uppercase tracking-widest text-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                  {t.exercise_plan_title}
                </h4>
             </div>
             <p className="text-indigo-100 text-sm leading-relaxed font-medium line-clamp-3 italic">"{localDiet.exercisePlan}"</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between h-fit lg:sticky lg:top-24">
           <div>
             <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-2">{language === 'es' ? 'BALANCE NUTRICIONAL' : 'NUTRITIONAL BALANCE'}</h4>
             <div className="h-40 w-full mb-6">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summaryData} margin={{ top: 0, bottom: 0, left: -20 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'black', fontSize: '10px' }} />
                    <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={32}>
                      {summaryData.map((entry, index) => (
                        <Cell key={`cell-sum-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
               </ResponsiveContainer>
             </div>
           </div>
           
           <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-2xl border border-blue-100">
                <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">{language === 'es' ? 'Proteínas' : 'Protein'}</span>
                <span className="text-sm font-black text-blue-800">{dailyMacros.protein}g</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-amber-50 rounded-2xl border border-amber-100">
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">{language === 'es' ? 'Carbohidratos' : 'Carbs'}</span>
                <span className="text-sm font-black text-amber-800">{dailyMacros.carbs}g</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-rose-50 rounded-2xl border border-rose-100">
                <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest">{language === 'es' ? 'Grasas' : 'Fats'}</span>
                <span className="text-sm font-black text-rose-800">{dailyMacros.fats}g</span>
              </div>
           </div>
        </div>
      </div>

      {/* Modal del Coach Deportivo */}
      {showExerciseModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 text-white w-full max-w-2xl rounded-[3rem] border border-slate-800 shadow-2xl shadow-indigo-900/40 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
             <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-indigo-900/20">
                <div className="flex items-center gap-4">
                   <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/20">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                   </div>
                   <div>
                      <h3 className="text-2xl font-black tracking-tight">{t.btn_view_coach}</h3>
                      <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">{language === 'es' ? 'Plan de Entrenamiento IA' : 'AI Training Plan'}</p>
                   </div>
                </div>
                <button 
                  onClick={() => setShowExerciseModal(false)}
                  className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors text-slate-400"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </div>
             
             <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                <div className="p-6 bg-slate-800/50 rounded-[2.5rem] border border-slate-700/50">
                   <h4 className="text-indigo-400 font-black text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     {language === 'es' ? 'Análisis del Preparador' : 'Coach Analysis'}
                   </h4>
                   <p className="text-slate-200 text-sm leading-relaxed font-medium whitespace-pre-line italic">
                     "{localDiet.exercisePlan}"
                   </p>
                </div>
                
                <div className="p-6 bg-sky-800/20 rounded-[2.5rem] border border-sky-700/50">
                   <h4 className="text-sky-400 font-black text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                     {language === 'es' ? 'Optimización NEAT' : 'NEAT Optimization'}
                   </h4>
                   <p className="text-slate-200 text-sm leading-relaxed font-medium whitespace-pre-line italic">
                     "{localDiet.basalRecommendations}"
                   </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="p-5 bg-blue-900/20 rounded-3xl border border-blue-500/20">
                      <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">{language === 'es' ? 'Sincronía con Dieta' : 'Diet Sync'}</h5>
                      <p className="text-[12px] text-blue-100 font-medium">{language === 'es' ? 'Macros ajustados para optimizar la recuperación muscular tras el ejercicio.' : 'Macros adjusted to optimize muscle recovery after exercise.'}</p>
                   </div>
                   <div className="p-5 bg-amber-900/20 rounded-3xl border border-amber-500/20">
                      <h5 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">{language === 'es' ? 'Frecuencia IA' : 'AI Frequency'}</h5>
                      <p className="text-[12px] text-amber-100 font-medium">{language === 'es' ? 'Distribución estratégica de cargas para evitar el sobreentrenamiento.' : 'Strategic load distribution to prevent overtraining.'}</p>
                   </div>
                </div>
             </div>

             <div className="p-8 bg-slate-800/30 border-t border-slate-800">
                <button 
                  onClick={() => setShowExerciseModal(false)}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/20"
                >
                  {t.btn_close}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DietView;
