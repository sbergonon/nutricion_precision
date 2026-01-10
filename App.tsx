
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
  const [error, setError] = useState<string | null>(null);
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

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('nutriplan_lang', newLang);
  };

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
      
      const newHistory = [...history, newEntry];
      setHistory(newHistory);
      
      localStorage.setItem('nutriplan_profile', JSON.stringify(profileWithLang));
      localStorage.setItem('nutriplan_history', JSON.stringify(newHistory));
      localStorage.setItem('nutriplan_diet', JSON.stringify(generatedDiet));
      setActiveTab('plan');
    } catch (err: any) {
      console.error("Critical Generation Error:", err);
      // Mostramos el error real para diagnóstico
      setError(`${lang === 'es' ? 'Error detectado' : 'Error detected'}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDietManual = (dietToSave: WeeklyDiet) => {
    localStorage.setItem('nutriplan_diet', JSON.stringify(dietToSave));
    setDiet(dietToSave);
  };

  const handleReset = () => {
    if (confirm(t.reset_confirm)) {
      localStorage.removeItem('nutriplan_profile');
      localStorage.removeItem('nutriplan_history');
      localStorage.removeItem('nutriplan_diet');
      setProfile(null);
      setDiet(null);
      setHistory([]);
      setActiveTab('plan');
    }
  };

  const logDailyProgress = (weight: number, waist: number) => {
    if (!profile) return;
    const newEntry: ProgressEntry = {
      date: new Date().toISOString(),
      weight,
      waist,
      bmi: calculateBMI(weight, profile.height)
    };
    const newHistory = [...history, newEntry];
    setHistory(newHistory);
    localStorage.setItem('nutriplan_history', JSON.stringify(newHistory));
    
    const updatedProfile = { ...profile, weight, waist };
    setProfile(updatedProfile);
    localStorage.setItem('nutriplan_profile', JSON.stringify(updatedProfile));
  };

  const exportHistoryToPDF = () => {
    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(51, 65, 85);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(t.report_evo_title, 15, 25);
    doc.setFontSize(10);
    doc.text(`${t.report_generated}: ${new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US')}`, 15, 33);

    const tableData = history.map(entry => [
      new Date(entry.date).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US'),
      `${entry.weight} kg`,
      `${entry.waist} cm`,
      entry.bmi.toString()
    ]);

    (doc as any).autoTable({
      startY: 50,
      head: [[lang === 'es' ? 'Fecha' : 'Date', lang === 'es' ? 'Peso' : 'Weight', lang === 'es' ? 'Cintura' : 'Waist', 'IMC']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    });

    doc.save(`Evolucion_NutriPlan_${new Date().getTime()}.pdf`);
  };

  const exportHistoryToCSV = () => {
    const headers = lang === 'es' ? "Fecha,Peso(kg),Cintura(cm),IMC\n" : "Date,Weight(kg),Waist(cm),BMI\n";
    const rows = history.map(e => `${new Date(e.date).toLocaleDateString()},${e.weight},${e.waist},${e.bmi}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mi-evolucion-nutriplan.csv';
    a.click();
  };

  const shareHistoryViaEmail = () => {
    if (history.length === 0) return;
    const lastEntry = history[history.length - 1];
    const subject = encodeURIComponent(lang === 'es' ? "Mi Evolución Nutricional - NutriPlan AI" : "My Nutritional Progress - NutriPlan AI");
    const body = encodeURIComponent(lang === 'es' 
      ? `Hola,\n\nTe comparto mi evolución nutricional registrada en NutriPlan AI.\n\nÚltimo registro:\n- Peso: ${lastEntry.weight} kg\n- Cintura: ${lastEntry.waist} cm\n- IMC: ${lastEntry.bmi}\n\nGenerado con Inteligencia Artificial.`
      : `Hi,\n\nSharing my nutritional progress logged in NutriPlan AI.\n\nLatest log:\n- Weight: ${lastEntry.weight} kg\n- Waist: ${lastEntry.waist} cm\n- BMI: ${lastEntry.bmi}\n\nGenerated with AI.`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 lg:pb-8 relative">
      {loading && (
        <div className="fixed inset-0 z-[100] bg-slate-50/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-6"></div>
          <div className="text-center space-y-2">
            <p className="text-slate-900 font-bold text-lg">{t.working}</p>
            <p className="text-slate-500 max-w-xs text-sm italic">{t.working_desc}</p>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black shadow-sm">N</div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">{t.app_title} <span className="text-emerald-600">AI</span></h1>
          </div>
          <div className="flex items-center gap-3">
             <select 
               value={lang} 
               onChange={(e) => handleLanguageChange(e.target.value as Language)}
               className="bg-slate-100 text-slate-700 text-xs font-bold py-1 px-2 rounded border-none focus:ring-0 outline-none"
             >
               <option value="es">ES</option>
               <option value="en">EN</option>
             </select>
             <button onClick={() => setActiveTab('refs')} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </button>
             {profile && (
               <button onClick={handleReset} className="p-2 text-rose-400 hover:text-rose-600 transition-colors" title="Reset">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
               </button>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium flex justify-between items-center shadow-sm animate-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              <div>
                <p className="font-bold">{lang === 'es' ? 'Error de Ejecución' : 'Execution Error'}</p>
                <p className="text-xs opacity-80">{error}</p>
              </div>
            </div>
            <button onClick={() => setError(null)} className="text-rose-900 font-bold px-3 py-1 hover:bg-rose-100 rounded-lg">×</button>
          </div>
        )}

        {!profile ? (
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-10">
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full mb-3 uppercase tracking-widest">{t.ai_tag}</span>
              <h2 className="text-3xl font-black text-slate-900 mb-4">{t.app_subtitle}</h2>
              <p className="text-slate-600">{t.ai_desc}</p>
            </div>
            <ProfileForm onSave={handleSaveProfile} language={lang} />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center">
                <span className="text-xs font-bold text-slate-400 uppercase block mb-1">{t.card_bmi}</span>
                <span className="text-xl font-bold text-slate-800">{calculateBMI(profile.weight, profile.height)}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center">
                <span className="text-xs font-bold text-slate-400 uppercase block mb-1">{t.card_waist}</span>
                <span className="text-xl font-bold text-slate-800">{profile.waist} <small className="text-xs">cm</small></span>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center">
                <span className="text-xs font-bold text-slate-400 uppercase block mb-1">{t.card_cv_risk}</span>
                <span className={`text-xl font-bold ${calculateCVRiskScore(profile.waist, profile.height) === 'Bajo' ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {calculateCVRiskScore(profile.waist, profile.height)}
                </span>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center">
                <span className="text-xs font-bold text-slate-400 uppercase block mb-1">{t.card_weight}</span>
                <span className="text-xl font-bold text-slate-800">{profile.weight} <small className="text-xs">kg</small></span>
              </div>
            </div>

            <div className="flex gap-4 border-b border-slate-200 overflow-x-auto">
              <button onClick={() => setActiveTab('plan')} className={`pb-3 px-2 font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'plan' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400'}`}>{t.tab_diet}</button>
              <button onClick={() => setActiveTab('tracking')} className={`pb-3 px-2 font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'tracking' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400'}`}>{t.tab_evolution}</button>
              <button onClick={() => setActiveTab('profile')} className={`pb-3 px-2 font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'profile' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400'}`}>{t.tab_profile}</button>
              <button onClick={() => setActiveTab('refs')} className={`pb-3 px-2 font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'refs' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400'}`}>{t.tab_science}</button>
            </div>

            {activeTab === 'plan' && diet && (
              <DietView diet={diet} onSave={handleSaveDietManual} onBack={handleReset} language={lang} />
            )}
            
            {activeTab === 'tracking' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-lg font-bold text-slate-800">{t.tracking_title}</h3>
                  <div className="flex gap-2">
                    <button onClick={exportHistoryToPDF} className="px-3 py-1.5 text-xs font-bold bg-slate-800 text-white rounded-lg flex items-center gap-2 hover:bg-slate-900 transition-colors">
                      {t.btn_pdf}
                    </button>
                    <button onClick={exportHistoryToCSV} className="px-3 py-1.5 text-xs font-bold bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      {t.btn_csv}
                    </button>
                    <button onClick={shareHistoryViaEmail} className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      {t.btn_share}
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <input type="number" step="0.1" placeholder={t.tracking_weight} id="w-in" className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                    <input type="number" placeholder={t.tracking_waist} id="wa-in" className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                    <button 
                      onClick={() => {
                        const w = (document.getElementById('w-in') as HTMLInputElement).value;
                        const wa = (document.getElementById('wa-in') as HTMLInputElement).value;
                        if(w && wa) {
                          logDailyProgress(Number(w), Number(wa));
                          (document.getElementById('w-in') as HTMLInputElement).value = '';
                          (document.getElementById('wa-in') as HTMLInputElement).value = '';
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg transition-colors shadow-sm"
                    >
                      {t.tracking_btn}
                    </button>
                  </div>
                </div>
                <Charts data={history} language={lang} />
              </div>
            )}
            
            {activeTab === 'profile' && <ProfileForm onSave={handleSaveProfile} initialData={profile} language={lang} />}
            
            {activeTab === 'refs' && (
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                  <h3 className="text-xl font-bold text-slate-900 border-b pb-2">{t.refs_title}</h3>
                  <section className="space-y-2">
                    <h4 className="font-bold text-emerald-700 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9 4.804A7.993 7.993 0 002 12a7.993 7.993 0 007 7.196V4.804zM11 4.804v14.392A7.993 7.993 0 0018 12a7.993 7.993 0 00-7-7.196z" /></svg>
                      {t.refs_methodology}
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{SCIENTIFIC_REFERENCES.diets}</p>
                  </section>
                  <section className="space-y-2">
                    <h4 className="font-bold text-emerald-700 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM5 9a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" /></svg>
                      {t.refs_tables}
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{SCIENTIFIC_REFERENCES.nutritionalTables}</p>
                  </section>
                  <section className="space-y-2">
                    <h4 className="font-bold text-emerald-700 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>
                      {t.refs_cv_risk}
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{SCIENTIFIC_REFERENCES.cvRisk}</p>
                  </section>
                  <section className="space-y-3">
                    <h4 className="font-bold text-rose-700 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                      {t.refs_meds}
                    </h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {MEDICATIONS_IMPACT.map((med, i) => (
                        <li key={i} className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">{med}</li>
                      ))}
                    </ul>
                  </section>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
