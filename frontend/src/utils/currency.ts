export const formatCurrency = (amount: number, currency: string = 'ETB'): string => {
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  
  if (currency === 'ETB') {
    return `${formattedAmount} ብር`;
  }
  
  return `${currency} ${formattedAmount}`;
};