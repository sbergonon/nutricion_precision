
export const GENETIC_MARKERS = [
  { id: 'FTO', label: 'FTO (rs9939609)', desc: 'Asociado a mayor apetito y preferencia por alimentos densos en energía.' },
  { id: 'MC4R', label: 'MC4R (rs17782313)', desc: 'Relacionado con la regulación de la ingesta y riesgo de obesidad mórbida.' },
  { id: 'PPARG', label: 'PPARG (Pro12Ala)', desc: 'Influye en la sensibilidad a la insulina y el metabolismo de ácidos grasos.' },
  { id: 'APOE', label: 'APOE (ε4)', desc: 'Marcador de riesgo cardiovascular elevado y metabolismo lipídico alterado.' },
  { id: 'ADRB2', label: 'ADRB2 (Gly16Arg)', desc: 'Afecta la movilización de grasas durante el ejercicio físico.' }
];

export const MEDICATIONS_IMPACT = [
  "Corticoides (Prednisona, etc.) - Pueden causar retención de líquidos y aumento de glucemia.",
  "Antidepresivos (ISRS, Tricíclicos) - Algunos pueden alterar el centro del hambre.",
  "Antipsicóticos de 2ª generación - Alto riesgo metabólico.",
  "Betabloqueantes - Pueden reducir ligeramente la tasa metabólica basal.",
  "Insulina o Sulfonilureas - Riesgo de hipoglucemia y ganancia ponderal si no se ajusta la dieta."
];

export const SCIENTIFIC_REFERENCES = {
  diets: "Basado en guías de la OMS, FESNAD (Federación Española de Sociedades de Nutrición, Alimentación y Dietética) y el consenso SEEDO (Sociedad Española para el Estudio de la Obesidad).",
  nutritionalTables: "Tablas de composición de alimentos BEDCA (Base de Datos Española de Composición de Alimentos) y USDA.",
  cvRisk: "Cálculo del Riesgo Cardiovascular mediante el Índice Cintura/Talla (ICT). Un ICT > 0.5 se asocia a mayor riesgo metabólico y CV independientemente del IMC.",
  medications: "Interacciones fármaco-alimento según el Catálogo de Medicamentos (Consejo General de Colegios Oficiales de Farmacéuticos)."
};
