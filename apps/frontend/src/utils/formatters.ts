export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) {
    return "";
  }

  const formatter = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  });

  return formatter.format(amount);
};
