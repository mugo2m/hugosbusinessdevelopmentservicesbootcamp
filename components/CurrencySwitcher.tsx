// components/CurrencySwitcher.tsx
"use client";

import { useCurrency } from '@/lib/context/CurrencyContext';
import { COUNTRY_CURRENCY_MAP } from '@/lib/config/currency';

export function CurrencySwitcher() {
  const { country, setCountry, currency } = useCurrency();

  // Build sorted list of countries from the map
  const countries = Object.keys(COUNTRY_CURRENCY_MAP)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => ({
      key,
      symbol: COUNTRY_CURRENCY_MAP[key].symbol,
      name: COUNTRY_CURRENCY_MAP[key].name,
      code: COUNTRY_CURRENCY_MAP[key].code,
    }));

  return (
    <select
      value={country}
      onChange={(e) => setCountry(e.target.value)}
      className="px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
    >
      {countries.map((c) => (
        <option key={c.key} value={c.key} className="text-gray-900">
          {c.symbol} - {c.name} ({c.key})
        </option>
      ))}
    </select>
  );
}