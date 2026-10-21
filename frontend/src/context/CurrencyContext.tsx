'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Currency = 'INR' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  toggleCurrency: (c?: Currency) => void;
  formatPrice: (rateUSD: number, rateINR?: number, unit?: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>('USD');

  const toggleCurrency = (selected?: Currency) => {
    if (selected) {
      setCurrency(selected);
    } else {
      setCurrency(prev => (prev === 'USD' ? 'INR' : 'USD'));
    }
  };

  const formatPrice = (rateUSD: number, rateINR?: number, unit = 'hr') => {
    if (currency === 'INR') {
      let inrAmount: number;
      if (unit === 'hr' || unit === 'hour') {
        // If an explicit hourly INR rate is passed (typically under 10,000), use it; otherwise compute rateUSD * 83
        inrAmount = (rateINR && rateINR < 10000) ? rateINR : Math.round(rateUSD * 83);
      } else {
        inrAmount = rateINR || Math.round(rateUSD * 83 * 160);
      }
      return `₹${inrAmount.toLocaleString('en-IN')}/${unit}`;
    }
    return `$${rateUSD}/${unit}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, toggleCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
