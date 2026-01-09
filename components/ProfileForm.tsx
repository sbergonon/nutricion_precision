
import React, { useState, useMemo } from 'react';
import { UserProfile, DietType, Language, ActivityLevel, ExerciseType } from '../types';
import DynamicListInput from './DynamicListInput';
import { GENETIC_MARKERS } from '../constants/medicalData';
import { getTranslation } from '../i18n';

interface Props {
  onSave: (profile: UserProfile) => void;
  initialData?: UserProfile;
  language: Language;
}

const VALID_RANGES = {
  age: { min: 12, max: 100 },
  weight: { min: 35, max: 250 },
  height: { min: 100, max: 230 },
  waist: { min: 40, max: 180 },
  exerciseFrequency: { min: 0, max: 7 },
  exerciseDuration: { min: 0, max: 240 },
  basalSteps: { min: 0, max: 50000 }
};

const ProfileForm: React.FC<Props> = ({ onSave, initialData, language }) => {
  const t = getTranslation(language);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const [showNoteFor, setShowNoteFor] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserProfile>(initialData || {
    age: 30,
    gender: 'Masculino',
    weight: 70,
    height: 170,
    waist: 85,
    intolerances: [],
    diseases: [],
    diseaseNotes: {},
    treatments: [],
    geneticMarkers: [],
    supplements: [],
    dietType: DietType.Standard,
    activityLevel: ActivityLevel.Sedentary,
    exerciseType: 'Ninguno',
    exerciseDescription: '',
    exerciseFrequency: 3,
    exerciseDuration: 45,
    basalSteps: 5000,
    basalActivityDesc: '',
    language: language
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const errors = useMemo(() => {
    const errs: Record<string, string> = {};
    
    if (!formData.age) errs.age = t.error_required;
    else if (formData.age < VALID_RANGES.age.min || formData.age > VALID_RANGES.age.max) errs.age = t.error_invalid_range;

    if (!formData.weight) errs.weight = t.error_required;
    else if (formData.weight < VALID_RANGES.weight.min || formData.weight > VALID_RANGES.weight.max) errs.weight = t.error_invalid_range;

    if (!formData.height) errs.height = t.error_required;
    else if (formData.height < VALID_RANGES.height.min || formData.height > VALID_RANGES.height.max) errs.height = t.error_invalid_range;

    if (!formData.waist) errs.waist = t.error_required;
    else if (formData.waist < VALID_RANGES.waist.min || formData.waist > VALID_RANGES.waist.max) errs.waist = t.error_invalid_range;

    if (formData.exerciseFrequency < VALID_RANGES.exerciseFrequency.min || formData.exerciseFrequency > VALID_RANGES.exerciseFrequency.max) errs.exerciseFrequency = t.error_invalid_range;

    if (formData.exerciseDuration < VALID_RANGES.exerciseDuration.min || formData.exerciseDuration > VALID_RANGES.exerciseDuration.max) errs.exerciseDuration = t.error_invalid_range;
    
    if (formData.basalSteps < VALID_RANGES.basalSteps.min || formData.basalSteps > VALID_RANGES.basalSteps.max) errs.basalSteps = t.error_invalid_range;

    return errs;
  }, [formData, t]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (['age', 'weight', 'height', 'waist', 'exerciseFrequency', 'exerciseDuration', 'basalSteps'].includes(name)) ? Number(value) : value
    }));
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleListUpdate = (key: keyof UserProfile, items: string[]) => {
    setFormData(prev => {
      const updated = { ...prev, [key]: items };
      if (key === 'diseases' && prev.diseaseNotes) {
        const newNotes = { ...prev.diseaseNotes };
        Object.keys(newNotes).forEach(disease => {
          if (!items.includes(disease)) delete newNotes[disease];
        });
        updated.diseaseNotes = newNotes;
      }
      return updated;
    });
  };

  const updateDiseaseNote = (disease: string, note: string) => {
    setFormData(prev => ({
      ...prev,
      diseaseNotes: {
        ...(prev.diseaseNotes || {}),
        [disease]: note
      }
    }));
  };

  const toggleGeneticMarker = (markerId: string) => {
    setFormData(prev => ({
      ...prev,
      geneticMarkers: prev.geneticMarkers.includes(markerId)
        ? prev.geneticMarkers.filter(id => id !== markerId)
        : [...prev.geneticMarkers, markerId]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(errors).length > 0) {
      alert(t.error_fix_form);
      const allTouched = Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {});
      setTouched(allTouched);
      return;
    }
    onSave(formData);
  };

  const exerciseOptions: ExerciseType[] = ['Ninguno', 'Running', 'Fuerza', 'Yoga', 'Ciclismo', 'Natación', 'Funcional', 'Otro'];

  const inputClass = (name: string) => `w-full px-4 py-2 rounded-lg border focus:ring-2 outline-none transition-all ${
    touched[name] && errors[name] 
      ? 'border-rose-500 focus:ring-rose-200' 
      : 'border-slate-200 focus:ring-emerald-500'
  }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-bold text-slate-800">{t.biomed_profile}</h2>
        <p className="text-sm text-slate-500 mt-1">{t.biomed_desc}</p>
      </div>

      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 items-start">
        <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <p className="text-xs text-blue-800 leading-relaxed font-medium">
          {t.ai_medical_disclaimer}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.label_age}</label>
          <input type="number" name="age" value={formData.age} onChange={handleChange} onBlur={() => handleBlur('age')} className={inputClass('age')} required />
          {touched.age && errors.age && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors.age}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.label_gender}</label>
          <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass('gender')}>
            <option value="Masculino">{language === 'es' ? 'Masculino' : 'Male'}</option>
            <option value="Femenino">{language === 'es' ? 'Femenino' : 'Female'}</option>
            <option value="Otro">{language === 'es' ? 'Otro' : 'Other'}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.label_weight}</label>
          <input type="number" step="0.1" name="weight" value={formData.weight} onChange={handleChange} onBlur={() => handleBlur('weight')} className={inputClass('weight')} required />
          {touched.weight && errors.weight && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors.weight}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.label_height}</label>
          <input type="number" name="height" value={formData.height} onChange={handleChange} onBlur={() => handleBlur('height')} className={inputClass('height')} required />
          {touched.height && errors.height && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors.height}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.label_waist}</label>
          <input type="number" name="waist" value={formData.waist} onChange={handleChange} onBlur={() => handleBlur('waist')} className={inputClass('waist')} required />
          {touched.waist && errors.waist && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors.waist}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.label_diet_type}</label>
          <select name="dietType" value={formData.dietType} onChange={handleChange} className={inputClass('dietType')}>
            {Object.values(DietType).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 text-sm text-emerald-800">
        <strong className="block mb-1 underline">{formData.dietType}:</strong> {t.diet_desc[formData.dietType as DietType]}
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-bold text-slate-700 uppercase tracking-tight">{t.label_activity_level}</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.values(ActivityLevel).map(level => (
            <button
              key={level}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, activityLevel: level }))}
              className={`p-3 text-left rounded-xl border transition-all ${
                formData.activityLevel === level
                  ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
              }`}
            >
              <div className="font-bold text-sm mb-1">{level}</div>
              <div className={`text-[10px] leading-tight ${formData.activityLevel === level ? 'text-slate-300' : 'text-slate-400'}`}>
                {t.activity_desc[level]}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Basal Exercise / NEAT Section */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6">
        <div className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          Actividad Basal (Día a Día)
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.label_basal_steps}</label>
            <input 
              type="number" 
              name="basalSteps" 
              value={formData.basalSteps} 
              onChange={handleChange} 
              onBlur={() => handleBlur('basalSteps')}
              className={inputClass('basalSteps')}
            />
            {touched.basalSteps && errors.basalSteps && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors.basalSteps}</p>}
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">{t.label_basal_activity}</label>
             <input 
               type="text"
               name="basalActivityDesc" 
               value={formData.basalActivityDesc} 
               onChange={handleChange} 
               placeholder={t.placeholder_basal_activity}
               className={inputClass('basalActivityDesc')}
             />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6">
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Detalles de Ejercicio Físico (Deporte)
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.label_exercise_type}</label>
              <select 
                name="exerciseType" 
                value={formData.exerciseType} 
                onChange={handleChange} 
                className={inputClass('exerciseType')}
              >
                {exerciseOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">{t.label_exercise_desc}</label>
               <input 
                 type="text"
                 name="exerciseDescription" 
                 value={formData.exerciseDescription} 
                 onChange={handleChange} 
                 placeholder={t.placeholder_exercise_desc}
                 className={inputClass('exerciseDescription')}
               />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.label_exercise_frequency}</label>
              <input 
                type="number" 
                name="exerciseFrequency" 
                value={formData.exerciseFrequency} 
                onChange={handleChange}
                onBlur={() => handleBlur('exerciseFrequency')}
                className={inputClass('exerciseFrequency')}
              />
              {touched.exerciseFrequency && errors.exerciseFrequency && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors.exerciseFrequency}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.label_exercise_duration}</label>
              <input 
                type="number" 
                name="exerciseDuration" 
                value={formData.exerciseDuration} 
                onChange={handleChange}
                onBlur={() => handleBlur('exerciseDuration')}
                className={inputClass('exerciseDuration')}
              />
              {touched.exerciseDuration && errors.exerciseDuration && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors.exerciseDuration}</p>}
            </div>
          </div>
        </div>

        <DynamicListInput
          label={t.label_diseases}
          items={formData.diseases}
          placeholder={t.placeholder_diseases}
          onUpdate={(items) => handleListUpdate('diseases', items)}
          language={language}
          renderExtra={(disease) => (
            <div className="flex flex-col gap-2 w-full mt-2">
              <button 
                type="button" 
                onClick={() => setShowNoteFor(showNoteFor === disease ? null : disease)}
                className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg border transition-all self-start ${
                  showNoteFor === disease || (formData.diseaseNotes && formData.diseaseNotes[disease])
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                }`}
              >
                {t.btn_notes} {formData.diseaseNotes && formData.diseaseNotes[disease] ? '✓' : ''}
              </button>
              {(showNoteFor === disease) && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <textarea
                    placeholder={t.placeholder_disease_notes}
                    value={formData.diseaseNotes ? formData.diseaseNotes[disease] || '' : ''}
                    onChange={(e) => updateDiseaseNote(disease, e.target.value)}
                    className="w-full mt-1 p-2 text-xs rounded-lg border border-blue-200 focus:ring-1 focus:ring-blue-500 outline-none bg-blue-50/30 min-h-[60px]"
                  />
                </div>
              )}
            </div>
          )}
        />

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-violet-600 bg-violet-50 px-3 py-2 rounded-xl border border-violet-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.675.337a4 4 0 01-2.58.345l-2.699-.54a2 2 0 00-1.597.468l-4.592 4.592a2 2 0 01-2.828 0 2 2 0 010-2.828l4.592-4.592a2 2 0 00.468-1.597l-.54-2.699a4 4 0 01.345-2.58l.337-.675a6 6 0 00.517-3.86l-.477-2.387a2 2 0 00-.547-1.022L15.428 1.572a2 2 0 012.828 0l3.172 3.172a2 2 0 010 2.828l-2.001 2.001z" /></svg>
            <span className="text-[10px] font-black uppercase tracking-widest">
              {language === 'es' ? 'La IA analizará tus suplementos para optimizar tu plan.' : 'AI will analyze your supplements to optimize your plan.'}
            </span>
          </div>
          <DynamicListInput
            label={t.label_supplements}
            items={formData.supplements}
            placeholder={t.placeholder_supplements}
            onUpdate={(items) => handleListUpdate('supplements', items)}
            language={language}
          />
        </div>

        <DynamicListInput
          label={t.label_treatments}
          items={formData.treatments}
          placeholder={t.placeholder_treatments}
          onUpdate={(items) => handleListUpdate('treatments', items)}
          language={language}
        />
        <DynamicListInput
          label={t.label_intolerances}
          items={formData.intolerances}
          placeholder={t.placeholder_intolerances}
          onUpdate={(items) => handleListUpdate('intolerances', items)}
          language={language}
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-bold text-slate-700 uppercase tracking-tight">{t.label_genetics}</label>
          <span className="text-[10px] text-slate-400 font-medium">{language === 'es' ? 'Explora tus marcadores' : 'Explore your markers'}</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {GENETIC_MARKERS.map(marker => (
            <button
              key={marker.id}
              type="button"
              onMouseEnter={() => setHoveredMarkerId(marker.id)}
              onMouseLeave={() => setHoveredMarkerId(null)}
              onClick={() => toggleGeneticMarker(marker.id)}
              className={`relative text-left p-4 rounded-2xl border transition-all ${
                formData.geneticMarkers.includes(marker.id)
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg ring-2 ring-emerald-500 ring-offset-2'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${formData.geneticMarkers.includes(marker.id) ? 'bg-white' : 'bg-emerald-500'}`} />
                <div className="font-black text-sm tracking-tight">{marker.label.split(' ')[0]}</div>
              </div>
              <div className={`text-[11px] font-bold ${formData.geneticMarkers.includes(marker.id) ? 'text-emerald-100' : 'text-slate-400'}`}>
                {marker.label.split(' ').slice(1).join(' ')}
              </div>
            </button>
          ))}
        </div>
      </div>

      <button 
        type="submit" 
        className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg text-lg uppercase tracking-wide ${
          Object.keys(errors).length > 0 && Object.keys(touched).length > 0
            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
        }`}
      >
        {t.btn_generate}
      </button>
    </form>
  );
};

export default ProfileForm;
