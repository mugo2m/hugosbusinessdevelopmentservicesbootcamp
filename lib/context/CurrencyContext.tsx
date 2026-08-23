// lib/context/CurrencyContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { COUNTRY_CURRENCY_MAP, DEFAULT_COUNTRY, CountryCurrency, getDefaultCurrencyForLanguage } from '@/lib/config/currency';

interface CurrencyContextType {
  country: string;
  currency: CountryCurrency;
  setCountry: (country: string) => void;
  setDisplayCurrency: (currencyCode: string) => void; // Manual override
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

/**
 * Normalize a display country name (e.g., from dropdown) to the key used in COUNTRY_CURRENCY_MAP.
 * Handles accents, parentheses, "and", "&", and special cases.
 */
function normalizeCountryName(displayName: string): string {
  // Special case mapping for names that don't follow simple transformations
  const specialMappings: Record<string, string> = {
    'côte d\'ivoire': 'ivorycoast',
    'cote d\'ivoire': 'ivorycoast',
    'congo (brazzaville)': 'congobrazzaville',
    'congo (kinshasa)': 'congokinshasa',
    'dominican republic': 'dominicanrepublic',
    'el salvador': 'elsalvador',
    'equatorial guinea': 'equatorialguinea',
    'saint kitts and nevis': 'saintkittsandnevis',
    'saint lucia': 'saintlucia',
    'saint vincent and the grenadines': 'saintvincentandthegrenadines',
    'sierra leone': 'sierraleone',
    'south africa': 'southafrica',
    'south sudan': 'southsudan',
    'trinidad and tobago': 'trinidadandtobago',
    'united kingdom': 'unitedkingdom',
    'united states': 'unitedstates',
    'usa/canada': 'unitedstates', // from phone codes, but not in dropdown
    'usa': 'unitedstates',
    'uk': 'unitedkingdom',
  };

  let normalized = displayName.trim().toLowerCase();

  // Check special mapping first
  if (specialMappings[normalized]) {
    return specialMappings[normalized];
  }

  // Remove accents (diacritics)
  normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Remove parentheses and their content (e.g., "(Brazzaville)")
  normalized = normalized.replace(/\([^)]*\)/g, '');

  // Replace " & " with "and"
  normalized = normalized.replace(/\s*&\s*/g, 'and');

  // Replace " and " with "and"
  normalized = normalized.replace(/\s+and\s+/g, 'and');

  // Remove all other non-alphanumeric characters (keep only letters and numbers)
  normalized = normalized.replace(/[^a-z0-9]/g, '');

  return normalized;
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const [country, setCountryState] = useState<string>(DEFAULT_COUNTRY);
  const [currency, setCurrencyState] = useState<CountryCurrency>(COUNTRY_CURRENCY_MAP[DEFAULT_COUNTRY]);
  const [userSelectedCurrency, setUserSelectedCurrency] = useState<boolean>(false);

  // Load saved country and manual override flag on mount
  useEffect(() => {
    const savedCountry = localStorage.getItem('selected-country');
    if (savedCountry) {
      const normalizedSaved = savedCountry.toLowerCase(); // Assume saved is already normalized
      if (COUNTRY_CURRENCY_MAP[normalizedSaved]) {
        setCountryState(normalizedSaved);
        setCurrencyState(COUNTRY_CURRENCY_MAP[normalizedSaved]);
      }
    } else {
      // If no saved country, use language default (if available)
      const langDefault = getDefaultCurrencyForLanguage(i18n.language);
      const matchingCountry = Object.keys(COUNTRY_CURRENCY_MAP).find(
        c => COUNTRY_CURRENCY_MAP[c].code === langDefault
      );
      if (matchingCountry) {
        setCurrencyState(COUNTRY_CURRENCY_MAP[matchingCountry]);
      }
    }

    const manualFlag = localStorage.getItem('userSelectedCurrency');
    if (manualFlag === 'true') {
      setUserSelectedCurrency(true);
    }
  }, [i18n.language]);

  // Listen to language changes – only override if no manual selection
  useEffect(() => {
    if (!userSelectedCurrency) {
      const lang = i18n.language;
      const targetCurrencyCode = getDefaultCurrencyForLanguage(lang);
      // Find any country that uses this currency (take the first match)
      const matchingCountry = Object.keys(COUNTRY_CURRENCY_MAP).find(
        c => COUNTRY_CURRENCY_MAP[c].code === targetCurrencyCode
      );
      if (matchingCountry) {
        setCurrencyState(COUNTRY_CURRENCY_MAP[matchingCountry]);
      } else {
        // Fallback: keep current currency, or default to KES
        if (!currency.code) {
          setCurrencyState(COUNTRY_CURRENCY_MAP[DEFAULT_COUNTRY]);
        }
      }
    }
  }, [i18n.language, userSelectedCurrency]);

  // Called from interview when user selects country – NORMALIZE the input
  const handleSetCountry = (newCountry: string) => {
    const normalized = normalizeCountryName(newCountry);
    if (COUNTRY_CURRENCY_MAP[normalized]) {
      setCountryState(normalized);
      // ✅ ALWAYS update the currency to match the selected country
      setCurrencyState(COUNTRY_CURRENCY_MAP[normalized]);
      // ✅ Reset manual override so that future language changes can work
      setUserSelectedCurrency(false);
      localStorage.setItem('selected-country', normalized);
      localStorage.removeItem('userSelectedCurrency');
    } else {
      // Fallback: try lowercasing directly (some may already be correct)
      const fallback = newCountry.toLowerCase();
      if (COUNTRY_CURRENCY_MAP[fallback]) {
        setCountryState(fallback);
        // ✅ Also update currency here
        setCurrencyState(COUNTRY_CURRENCY_MAP[fallback]);
        setUserSelectedCurrency(false);
        localStorage.setItem('selected-country', fallback);
        localStorage.removeItem('userSelectedCurrency');
      } else {
        console.warn(`Currency: No mapping found for country "${newCountry}" (normalized: "${normalized}")`);
      }
    }
  };

  // Manual override from currency switcher (kept for backward compatibility, but now also resets country? We'll leave as is)
  const setDisplayCurrency = (currencyCode: string) => {
    // Find the first country that uses this currency
    const matchingCountry = Object.keys(COUNTRY_CURRENCY_MAP).find(
      c => COUNTRY_CURRENCY_MAP[c].code === currencyCode
    );
    if (matchingCountry) {
      setCurrencyState(COUNTRY_CURRENCY_MAP[matchingCountry]);
      setUserSelectedCurrency(true);
      localStorage.setItem('userSelectedCurrency', 'true');
    } else if (currencyCode === 'EUR') {
      // Direct fallback for Euro (if not present in map)
      setCurrencyState({
        code: 'EUR',
        symbol: '€',
        name: 'Euros',
        locale: 'de-DE',
        position: 'after',
        decimalPlaces: 2
      });
      setUserSelectedCurrency(true);
      localStorage.setItem('userSelectedCurrency', 'true');
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        country,
        currency,
        setCountry: handleSetCountry,
        setDisplayCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within CurrencyProvider');
  return context;
}