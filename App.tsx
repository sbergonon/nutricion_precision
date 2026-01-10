
import React, { useState, useEffect } from 'react';
import ProfileForm from './components/ProfileForm';
import DietView from './components/DietView';
import Charts from './components/Charts';
import { UserProfile, ProgressEntry, WeeklyDiet, Language } from './types';
import { calculateBMI, calculateCVRiskScore } from './utils/helpers';
import { generateDietPlan } from './services/geminiService';
import { SCIENTIFIC_REFERENCES, MEDICATIONS_IMPACT } from './constants/medicalData';
import { getTranslation } from './i18n';

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<ProgressEntry[]>([]);
  const [diet, setDiet] = useState<WeeklyDiet | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'plan' | 'tracking' | 'profile' | 'refs'>('plan');
  const [error, setError] = useState<{title: string, msg: string, code?: string} | null>(null);
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('nutriplan_lang');
    return (saved as Language) || 'es';
  });

  const t = getTranslation(lang);

  useEffect(() => {
    const savedProfile = localStorage.getItem('nutriplan_profile');
    const savedHistory = localStorage.getItem('nutriplan_history');
    const savedDiet = localStorage.getItem('nutriplan_diet');
    if (savedProfile) setProfile(JSON.parse(savedProfile));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedDiet) setDiet(JSON.parse(savedDiet));
  }, []);

  const handleSaveProfile = async (newProfile: UserProfile) => {
    setLoading(true);
    setError(null);
    try {
      const profileWithLang = { ...newProfile, language: lang };
      const generatedDiet = await generateDietPlan(profileWithLang);
      
      setProfile(profileWithLang);
      setDiet(generatedDiet);
      
      const newEntry: ProgressEntry = {
        date: new Date().toISOString(),
        weight: newProfile.weight,
        waist: newProfile.waist,
        bmi: calculateBMI(newProfile.weight, newProfile.height)
      };
      
      setHistory(prev => {
        const h = [...prev, newEntry];
        localStorage.setItem('nutriplan_history', JSON.stringify(h));
        return h;
      });
      
      localStorage.setItem('nutriplan_profile', JSON.stringify(profileWithLang));
      localStorage.setItem('nutriplan_diet', JSON.stringify(generatedDiet));
      setActiveTab('plan');
    } catch (err: any) {
      console.error("Critical Generation Error:", err);
      const isKeyError = err.message.includes("API_KEY") || err.message.includes("API Key");
      
      setError({
        title: isKeyError ? (lang === 'es' ? 'Error de Inyección de Clave' : 'Key Injection Error') : (lang === 'es' ? 'Error de Generación' : 'Generation Error'),
        msg: isKeyError 
          ? (lang === 'es' 
              ? "Render no está inyectando tu API_KEY en el código del navegador. En Static Sites, las variables solo están disponibles durante el build. Asegúrate de que tu herramienta (Vite/Webpack) esté configurada para reemplazar process.env.API_KEY o usa el prefijo adecuado."
              : "Render is not injecting your API_KEY into the browser code. In Static Sites, variables are only available during build-time. Ensure your build tool is configured to replace process.env.API_KEY.")
          : err.message,
        code: isKeyError ? "ERR_BUILD_VAR_MISSING" : "ERR_GEN_AI_FAILURE"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm(t.reset_confirm)) {
      localStorage.clear();
      setProfile(null);
      setDiet(null);
      setHistory([]);
      setActiveTab('plan');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 lg:pb-8 relative font-sans text-slate-900">
      {loading && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-500">
          <div className="w-20 h-20 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-8 shadow-2xl shadow-emerald-500/20"></div>
          <div className="text-center space-y-3 px-6">
            <p className="text-white font-black text-2xl tracking-tighter uppercase">{t.working}</p>
            <p className="text-emerald-100/80 max-w-xs text-sm font-medium italic">{t.working_desc}</p>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm backdrop-blur-lg bg-white/80">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-emerald-100">N</div>
            <h1 className="text-xl font-black text-slate-800 tracking-tighter">{t.app_title} <span className="text-emerald-600">AI</span></h1>
          </div>
          <div className="flex items-center gap-4">
             <select 
               value={lang} 
               onChange={(e) => setLang(e.target.value as Language)}
               className="bg-slate-100 text-slate-700 text-[10px] font-black py-1.5 px-3 rounded-xl border-none focus:ring-0 outline-none uppercase tracking-widest"
             >
               <option value="es">ES</option>
               <option value="en">EN</option>
             </select>
             {profile && (
               <button onClick={handleReset} className="p-2.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Reset">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
               </button>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        {error && (
          <div className="mb-10 p-6 bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-top-4 duration-500 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <svg className="w-32 h-32 text-rose-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            </div>
            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
              <div className="bg-rose-500/20 p-4 rounded-3xl text-rose-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-black text-white tracking-tight uppercase">{error.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">{error.msg}</p>
                {error.code && <span className="inline-block px-2 py-0.5 bg-slate-800 text-slate-500 text-[10px] font-black rounded uppercase tracking-widest">{error.code}</span>}
              </div>
              <button onClick={() => setError(null)} className="text-slate-500 hover:text-white transition-colors font-black text-2xl">×</button>
            </div>
          </div>
        )}

        {!profile ? (
          <div className="max-w-2xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <span className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-[0.3em] shadow-sm">{t.ai_tag}</span>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">{t.app_subtitle}</h2>
              <p className="text-slate-500 text-lg font-medium max-w-lg mx-auto leading-snug">{t.ai_desc}</p>
            </div>
            <ProfileForm onSave={handleSaveProfile} language={lang} />
          </div>
        ) : (
          <div className="space-y-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: t.card_bmi, val: calculateBMI(profile.weight, profile.height), color: 'text-slate-800' },
                { label: t.card_waist, val: `${profile.waist} cm`, color: 'text-slate-800' },
                { label: t.card_cv_risk, val: calculateCVRiskScore(profile.waist, profile.height), color: calculateCVRiskScore(profile.waist, profile.height) === 'Bajo' ? 'text-emerald-600' : 'text-rose-500' },
                { label: t.card_weight, val: `${profile.weight} kg`, color: 'text-slate-800' }
              ].map((card, i) => (
                <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-slate-200/50">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{card.label}</span>
                  <span className={`text-2xl font-black ${card.color} tracking-tighter`}>{card.val}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 border-b border-slate-200 overflow-x-auto scrollbar-hide pb-2">
              {[
                { id: 'plan', label: t.tab_diet },
                { id: 'tracking', label: t.tab_evolution },
                { id: 'profile', label: t.tab_profile },
                { id: 'refs', label: t.tab_science }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)} 
                  className={`pb-3 px-4 font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'text-emerald-600 border-b-4 border-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {activeTab === 'plan' && diet && <DietView diet={diet} language={lang} onBack={() => setActiveTab('profile')} />}
              {activeTab === 'tracking' && (
                <div className="space-y-10">
                  <Charts data={history} language={lang} />
                </div>
              )}
              {activeTab === 'profile' && <ProfileForm onSave={handleSaveProfile} initialData={profile} language={lang} />}
              {activeTab === 'refs' && (
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-10">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{t.refs_title}</h3>
                  <div className="grid gap-8">
                    {Object.entries(SCIENTIFIC_REFERENCES).map(([key, text]) => (
                      <section key={key} className="space-y-2">
                        <h4 className="font-black text-emerald-700 text-[10px] uppercase tracking-widest flex items-center gap-2">
                           <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                           {key}
                        </h4>
                        <p className="text-slate-600 text-sm font-medium leading-relaxed">{text}</p>
                      </section>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
