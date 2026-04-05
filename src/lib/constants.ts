export const SEVERITY_MAP: Record<string, { label: string; className: string; bgClass: string }> = {
  critical: { label: 'حرجة', className: 'text-danger-700', bgClass: 'bg-danger-100 text-danger-700 border-danger-100' },
  high: { label: 'عالية', className: 'text-warning-700', bgClass: 'bg-warning-100 text-warning-700 border-warning-100' },
  medium: { label: 'متوسطة', className: 'text-yellow-700', bgClass: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
  low: { label: 'منخفضة', className: 'text-success-700', bgClass: 'bg-success-100 text-success-700 border-success-100' },
};

export const STATUS_MAP: Record<string, { label: string; bgClass: string }> = {
  open: { label: 'مفتوحة', bgClass: 'bg-danger-100 text-danger-500' },
  inprogress: { label: 'قيد المعالجة', bgClass: 'bg-warning-100 text-warning-500' },
  accepted: { label: 'مقبولة', bgClass: 'bg-blue-100 text-blue-700' },
  closed: { label: 'مغلقة', bgClass: 'bg-success-100 text-success-700' },
};

export const PRIORITY_MAP: Record<string, { label: string; bgClass: string }> = {
  high: { label: 'أولوية عالية', bgClass: 'bg-danger-100 text-danger-700 border border-red-200' },
  medium: { label: 'أولوية متوسطة', bgClass: 'bg-warning-100 text-warning-700 border border-orange-200' },
  low: { label: 'أولوية عادية', bgClass: 'bg-success-100 text-success-700 border border-green-200' },
};

export const MATURITY_LEVELS: Record<number, { label: string; colorClass: string; barClass: string }> = {
  1: { label: 'مبتدئ', colorClass: 'bg-danger-100 text-danger-700', barClass: 'bg-danger-500' },
  2: { label: 'أساسي', colorClass: 'bg-warning-100 text-warning-700', barClass: 'bg-warning-500' },
  3: { label: 'متوسط', colorClass: 'bg-yellow-50 text-yellow-700', barClass: 'bg-yellow-500' },
  4: { label: 'متقدم', colorClass: 'bg-success-100 text-success-700', barClass: 'bg-success-500' },
  5: { label: 'محسّن', colorClass: 'bg-green-100 text-success-700', barClass: 'bg-success-700' },
};

export const SECURITY_LEVELS = ['ممتاز', 'جيد', 'متوسط', 'ضعيف', 'حرج'];

export const TRENDS = [
  'تحسّن ملحوظ ↑',
  'تحسّن تدريجي ↗',
  'مستقر →',
  'تراجع ↘',
];

export const CLASSIFICATIONS = ['سري للغاية', 'سري', 'داخلي'];

export const HEATMAP_COLORS: Record<string, { bg: string; text: string }> = {
  hm1: { bg: '#e8f5e9', text: '#1b5e20' },
  hm2: { bg: '#fff9c4', text: '#827717' },
  hm3: { bg: '#ffe0b2', text: '#6d4c00' },
  hm4: { bg: '#ffcdd2', text: '#8b0000' },
  hm5: { bg: '#6b0000', text: '#ffffff' },
};

export const PROBABILITY_LABELS = ['', 'نادر', 'غير محتمل', 'محتمل', 'مرجح', 'مؤكد'];
export const IMPACT_LABELS = ['', 'ضئيل', 'منخفض', 'متوسط', 'عالٍ', 'كارثي'];

export const NAV_ITEMS = [
  { icon: '🏢', label: 'معلومات التقرير', key: 0 },
  { icon: '📋', label: 'الملخص التنفيذي', key: 1 },
  { icon: '⚠️', label: 'المخاطر الرئيسية', key: 2 },
  { icon: '🏛️', label: 'حماية الأصول الحيوية', key: 3 },
  { icon: '📊', label: 'المؤشرات والمعايير', key: 4 },
  { icon: '⚡', label: 'مؤشرات الكفاءة التشغيلية', key: 5 },
  { icon: '⏱️', label: 'مقاييس الاستجابة', key: 6 },
  { icon: '✅', label: 'التوصيات والإجراءات', key: 7 },
  { icon: '🧭', label: 'مستوى النضج الأمني', key: 8 },
];

export const CHALLENGE_TYPES: Record<string, { label: string; bgClass: string }> = {
  budget: { label: 'ميزانية', bgClass: 'bg-amber-100 text-amber-800' },
  staff: { label: 'كوادر بشرية', bgClass: 'bg-pink-100 text-pink-800' },
  tech: { label: 'تقنية', bgClass: 'bg-blue-100 text-blue-800' },
  process: { label: 'عمليات', bgClass: 'bg-violet-100 text-violet-800' },
};

export const ISO_27001_DOMAINS = [
  { id: 'A5', name: 'سياسات أمن المعلومات', total: 2 },
  { id: 'A6', name: 'تنظيم أمن المعلومات', total: 8 },
  { id: 'A7', name: 'أمن الموارد البشرية', total: 6 },
  { id: 'A8', name: 'إدارة الأصول', total: 10 },
  { id: 'A9', name: 'التحكم في الوصول', total: 14 },
  { id: 'A10', name: 'التشفير', total: 2 },
  { id: 'A11', name: 'الأمن المادي والبيئي', total: 15 },
  { id: 'A12', name: 'أمن العمليات', total: 14 },
  { id: 'A13', name: 'أمن الاتصالات', total: 7 },
  { id: 'A14', name: 'اقتناء الأنظمة وتطويرها', total: 13 },
  { id: 'A15', name: 'علاقات الموردين', total: 5 },
  { id: 'A16', name: 'إدارة حوادث أمن المعلومات', total: 7 },
  { id: 'A17', name: 'استمرارية الأعمال', total: 4 },
  { id: 'A18', name: 'الامتثال', total: 8 },
];

export const DEFAULT_MATURITY_DOMAINS = [
  'أمن الشبكة',
  'إدارة الهوية والوصول',
  'حماية البيانات',
  'أمن التطبيقات',
  'الاستجابة للحوادث',
  'الوعي الأمني',
  'الامتثال والحوكمة',
  'إدارة الثغرات',
];

export const DEFAULT_EFFICIENCY_KPIS = [
  { title: 'معدل اكتشاف التهديدات', val: 78, target: 90, unit: '%', description: 'نسبة التهديدات المكتشفة من إجمالي التهديدات الفعلية', lowerBetter: false },
  { title: 'متوسط وقت الاكتشاف (MTTD)', val: 4.2, target: 2, unit: 'ساعة', description: 'متوسط الوقت اللازم لاكتشاف الحادثة', lowerBetter: true },
  { title: 'معدل الإغلاق في الوقت المحدد', val: 72, target: 85, unit: '%', description: 'نسبة الحوادث المغلقة ضمن الإطار الزمني المستهدف', lowerBetter: false },
  { title: 'فعالية أدوات الأمن', val: 81, target: 90, unit: '%', description: 'نسبة الأدوات الأمنية العاملة بكفاءة كاملة', lowerBetter: false },
];

export function getRiskScoreClass(score: number): string {
  if (score >= 20) return 'bg-danger-900 text-white';
  if (score >= 15) return 'bg-danger-100 text-danger-700';
  if (score >= 10) return 'bg-warning-100 text-warning-700';
  if (score >= 5) return 'bg-yellow-50 text-yellow-700';
  return 'bg-success-100 text-success-700';
}

export function getHeatmapClass(score: number): string {
  if (score <= 4) return 'hm1';
  if (score <= 9) return 'hm2';
  if (score <= 16) return 'hm3';
  if (score <= 20) return 'hm4';
  return 'hm5';
}

export function getScoreColorClass(score: number): { ring: string; text: string; bg: string } {
  if (score >= 75) return { ring: 'border-success-700', text: 'text-success-700', bg: 'bg-success-100' };
  if (score >= 50) return { ring: 'border-warning-500', text: 'text-warning-500', bg: 'bg-warning-100' };
  return { ring: 'border-danger-500', text: 'text-danger-500', bg: 'bg-danger-100' };
}

export function formatArabicDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function getDeltaInfo(current: number, previous: number, lowerIsBetter: boolean) {
  const delta = current - previous;
  const isGood = lowerIsBetter ? delta < 0 : delta > 0;
  const isEqual = delta === 0;
  return {
    delta,
    arrow: delta < 0 ? '↓' : delta > 0 ? '↑' : '→',
    label: `${delta > 0 ? '+' : ''}${delta}`,
    colorClass: isEqual ? 'bg-gray-100 text-gray-500' : isGood ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-500',
  };
}
