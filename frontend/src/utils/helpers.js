export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-IN').format(num || 0);
};

export const PLATFORMS = [
  { value: 'uber', label: 'Uber', color: '#000000' },
  { value: 'indrive', label: 'InDrive', color: '#2DB400' },
  { value: 'yatri_sathi', label: 'Yatri Sathi', color: '#FF6B00' },
  { value: 'rapido', label: 'Rapido', color: '#FFD700' },
  { value: 'offline', label: 'Offline', color: '#6B7280' },
];

export const EXPENSE_TYPES = [
  { value: 'fuel', label: 'Fuel' },
  { value: 'toll', label: 'Toll' },
  { value: 'repair', label: 'Repair' },
  { value: 'parking', label: 'Parking' },
  { value: 'challan', label: 'Challan' },
  { value: 'other', label: 'Other' },
];
