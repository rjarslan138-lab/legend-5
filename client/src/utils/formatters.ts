export const formatPKR = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) return 'PKR 0';
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount).replace('PKR', 'Rs.');
};

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
};

export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

export const formatWeight = (kg: number | null | undefined): string => {
  if (kg === null || kg === undefined) return '0 kg';
  return `${Number(kg).toLocaleString('en-PK')} kg`;
};

export const formatLength = (meters: number | null | undefined): string => {
  if (meters === null || meters === undefined) return '-';
  return `${Number(meters).toLocaleString('en-PK')} m`;
};
