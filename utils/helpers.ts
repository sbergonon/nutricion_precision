
export const calculateBMI = (weight: number, heightCm: number) => {
  const heightM = heightCm / 100;
  return Number((weight / (heightM * heightM)).toFixed(1));
};

export const getBMICategory = (bmi: number) => {
  if (bmi < 18.5) return 'Bajo peso';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Sobrepeso';
  return 'Obesidad';
};

/**
 * Basic approximation of CV risk reduction based on WHR (Waist-to-Height Ratio)
 * and BMI improvements. This is a simplified proxy for educational purposes.
 */
export const calculateCVRiskScore = (waist: number, height: number) => {
  const ratio = waist / height;
  if (ratio <= 0.5) return 'Bajo';
  if (ratio <= 0.6) return 'Moderado';
  return 'Alto';
};

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short'
  });
};
