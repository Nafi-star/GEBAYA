
export const formatCurrency = (amount: number | undefined, currency: string = 'ETB'): string => {
  
  if (amount === undefined || amount === null || isNaN(amount)) {
    amount = 0;
  }
  
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  
  if (currency === 'ETB') {
    return `${formattedAmount} ብር`;
  }
  
  return `${currency} ${formattedAmount}`;
};