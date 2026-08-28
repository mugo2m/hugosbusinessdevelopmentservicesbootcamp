// app/api/vapi/generate/route.ts – Complete Poultry Feed Formulation API
// Now preserves {{CURRENCY}} placeholders for client-side formatting
// ADDED: cache.clear() to force fresh computation + detailed logging
// UPDATED: Accepts 'language' from request body and passes it to formulateFeed for localized content.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase/admin";
import { COUNTRY_CURRENCY_MAP } from "@/lib/config/currency";
import { formulateFeed } from "@/lib/feedFormulation";

console.log("🐔 Poultry Feed Formulation Route Loaded");

// ========== TIMEOUT UTILITY ==========
const withTimeout = <T>(promise: Promise<T>, ms: number, errorMessage: string = "Operation timed out"): Promise<T> => {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

// ========== CACHING ==========
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

function getCacheKey(inputs: any): string {
  const { breed, stage, quantityKg, includeCoccidiostat, country, ingredientPrices, availableIngredients, numberOfBirds, salePricePerBird, pricePerEgg } = inputs;
  const priceString = ingredientPrices ? JSON.stringify(ingredientPrices) : '';
  const availString = availableIngredients ? JSON.stringify(availableIngredients) : '';
  const key = JSON.stringify({ breed, stage, quantityKg, includeCoccidiostat, country, priceString, availString, numberOfBirds, salePricePerBird, pricePerEgg });
  console.log(`🔑 [getCacheKey] Generated key: ${key}`);
  return key;
}

// ========== CURRENCY HELPERS ==========
function getCurrencyForCountry(country: string = 'kenya'): { symbol: string; name: string; code: string } {
  const normalized = country.toLowerCase();
  const currency = COUNTRY_CURRENCY_MAP[normalized] || COUNTRY_CURRENCY_MAP.kenya;
  return {
    symbol: currency.symbol,
    name: currency.name,
    code: currency.code,
  };
}

function formatCurrencyForCountry(amount: number, country: string = 'kenya'): string {
  const normalized = country.toLowerCase();
  const currency = COUNTRY_CURRENCY_MAP[normalized] || COUNTRY_CURRENCY_MAP.kenya;
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: currency.decimalPlaces
  }).format(amount);
}

// ========== POST HANDLER ==========
export async function POST(request: NextRequest) {
  // 🔥 FORCE CACHE CLEAR – REMOVE THIS LINE AFTER TESTING
  cache.clear();
  console.log("🧹 Cache cleared (forced)");

  try {
    console.log("🐔 Poultry Feed Formulation API called");
    const body = await request.json();
    console.log("📥 [POST] Request body received:", JSON.stringify(body, null, 2));

    const cookieLanguage = request.cookies.get('preferred-language')?.value;
    const bodyLanguage = body.language;
    const userLanguage = bodyLanguage || cookieLanguage || 'en';
    console.log(`🌐 Generating feed formulation in language: ${userLanguage}`);

    const {
      breed,
      stage,
      quantityKg,
      includeCoccidiostat,
      county,
      subCounty,
      ward,
      village,
      country,
      userid,
      farmerName,
      ingredientPrices,
      availableIngredients = [],
      numberOfBirds = 0,
      salePricePerBird = 0,
      pricePerEgg = 0,
      language, // <-- NEW: extract the language
    } = body;

    console.log(`🔢 [POST] Extracted numberOfBirds: ${numberOfBirds} (type: ${typeof numberOfBirds})`);
    console.log(`🔢 [POST] Extracted salePricePerBird: ${salePricePerBird}`);
    console.log(`🔢 [POST] Extracted pricePerEgg: ${pricePerEgg}`);
    console.log(`🔢 [POST] Extracted language: ${language}`);

    if (!breed || !stage || !quantityKg || !country || !userid) {
      console.error("Missing required fields:", { breed, stage, quantityKg, country, userid });
      return NextResponse.json({
        error: "Missing required fields: breed, stage, quantityKg, country, and userid are required"
      }, { status: 400 });
    }

    const normalizedCountry = country.toLowerCase();

    const cacheKey = getCacheKey({
      breed,
      stage,
      quantityKg,
      includeCoccidiostat,
      country: normalizedCountry,
      ingredientPrices,
      availableIngredients,
      numberOfBirds,
      salePricePerBird,
      pricePerEgg,
    });

    let feedResult: any = null;
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        console.log("✅ Using cached feed formulation");
        feedResult = cached.data;
      } else {
        console.log("⏰ Cache expired, deleting...");
        cache.delete(cacheKey);
      }
    }

    if (!feedResult) {
      console.log("📋 Calculating fresh feed formulation...");
      try {
        const formulateParams = {
          breed,
          stage,
          quantityKg: parseFloat(quantityKg),
          includeCoccidiostat: includeCoccidiostat === "Yes" || includeCoccidiostat === true,
          country: normalizedCountry,
          ingredientPrices: ingredientPrices || {},
          availableIngredients: availableIngredients || [],
          numberOfBirds: parseFloat(numberOfBirds) || 0,
          salePricePerBird: parseFloat(salePricePerBird) || 0,
          pricePerEgg: parseFloat(pricePerEgg) || 0,
          language: language || 'en-US', // <-- NEW: pass the language to formulateFeed
        };
        console.log("📤 [POST] Calling formulateFeed with params:", JSON.stringify(formulateParams, null, 2));

        feedResult = await withTimeout(
          (async () => {
            const result = await formulateFeed(formulateParams);
            console.log("✅ [POST] formulateFeed returned result. structuredList keys:", result.structuredList.map(item => item.key));
            // 🔍 Log the actual content of total_cost and weekly_feed_plan
            const totalCostItem = result.structuredList.find((item: any) => item.key === 'total_cost');
            const weeklyPlanItem = result.structuredList.find((item: any) => item.key === 'weekly_feed_plan');
            console.log("🔍 [POST] total_cost content:", totalCostItem?.params?.content);
            console.log("🔍 [POST] weekly_feed_plan content (first 200 chars):", weeklyPlanItem?.params?.content?.substring(0, 200));
            return result;
          })(),
          30000,
          "Feed formulation timed out after 30 seconds"
        );
        cache.set(cacheKey, { data: feedResult, timestamp: Date.now() });
        console.log("✅ Feed formulation completed and cached");
      } catch (error: any) {
        console.error("❌ Error formulating feed:", error);
        throw new Error(`Formulation error: ${error.message}`);
      }
    }

    // ========== BUILD INGREDIENT TABLE ==========
    const ingredients = feedResult.ingredients || [];
    const totalCost = feedResult.totalCost || 0;
    const nutrition = feedResult.nutritionalSummary || { protein: 0, calcium: 0, energy: 0 };

    console.log(`📊 [POST] Building ingredient table with ${ingredients.length} ingredients`);

    const tableRows = ingredients.map((ing: any) => {
      const qty = ing.amountKg.toFixed(2);
      const pricePerKg = formatCurrencyForCountry(ing.pricePerKg, normalizedCountry);
      const total = formatCurrencyForCountry(ing.cost, normalizedCountry);
      return `<tr>
        <td>${ing.name}</td>
        <td>${qty}</td>
        <td>${pricePerKg}</td>
        <td>${total}</td>
      </tr>`;
    });

    const totalFormatted = formatCurrencyForCountry(totalCost, normalizedCountry);

    const tableHTML = `
<style>
.ingredient-table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 14px; background: #ffffff; border-radius: 8px; overflow: hidden; }
.ingredient-table th { background: #2563eb; color: #ffffff; padding: 10px 12px; text-align: left; font-weight: 600; }
.ingredient-table td { background: #ffffff; color: #1e293b; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
.ingredient-table .total-row { background: #f8fafc; font-weight: bold; }
.ingredient-table .total-row td { border-top: 2px solid #2563eb; background: #f8fafc; }
.ingredient-table tr:last-child td { border-bottom: none; }
.ingredient-table .total-row td:first-child { font-weight: bold; }
.ingredient-table .total-row td:last-child { font-weight: bold; }
</style>
<table class="ingredient-table">
  <thead>
    <tr>
      <th>Ingredient</th>
      <th>Quantity (kg)</th>
      <th>Price per kg</th>
      <th>Total Cost</th>
    </tr>
  </thead>
  <tbody>
    ${tableRows.join('')}
    <tr class="total-row">
      <td><strong>TOTAL</strong></td>
      <td></td>
      <td></td>
      <td><strong>${totalFormatted}</strong></td>
    </tr>
  </tbody>
</table>
`;

    // ========== BUILD NEW STRUCTURED LIST ==========
    // ✅ Keep all items from feedResult.structuredList except ingredient_list.
    // We replace ingredient_list with ingredient_table (HTML).
    // We DO NOT modify total_cost or weekly_feed_plan – they keep {{CURRENCY}} placeholders.
    console.log("🔄 [POST] Building new structured list from feedResult.structuredList");
    const newStructuredList: any[] = [];
    for (const item of feedResult.structuredList) {
      if (item.key === 'ingredient_list') {
        // Replace with HTML table
        newStructuredList.push({
          key: 'ingredient_table',
          params: { content: tableHTML }
        });
        console.log(`🔄 [POST] Replaced ingredient_list with ingredient_table`);
      } else {
        // Keep everything else as-is (including total_cost and weekly_feed_plan with {{CURRENCY}})
        newStructuredList.push(item);
        console.log(`🔄 [POST] Kept item with key: ${item.key}`);
      }
    }

    feedResult.structuredList = newStructuredList;

    console.log("📋 [POST] Final structuredList keys:", newStructuredList.map(item => item.key));
    const hasWeeklyPlan = newStructuredList.some(item => item.key === 'weekly_feed_plan');
    console.log(`📋 [POST] weekly_feed_plan exists in final list? ${hasWeeklyPlan}`);

    // 🔍 Log final content of total_cost and weekly_feed_plan after transformation
    const finalTotalCost = newStructuredList.find((item: any) => item.key === 'total_cost');
    const finalWeeklyPlan = newStructuredList.find((item: any) => item.key === 'weekly_feed_plan');
    console.log("🔍 [POST] FINAL total_cost content:", finalTotalCost?.params?.content);
    console.log("🔍 [POST] FINAL weekly_feed_plan content (first 200 chars):", finalWeeklyPlan?.params?.content?.substring(0, 200));

    // ========== CREATE SESSION ==========
    const sessionRef = db.collection("farmer_sessions").doc();
    const sessionId = sessionRef.id;

    const farmerSession = {
      id: sessionId,
      userId: userid,
      language: userLanguage,
      farmerName: farmerName || 'Farmer',
      breed,
      stage,
      quantityKg: parseFloat(quantityKg),
      includeCoccidiostat: includeCoccidiostat === "Yes" || includeCoccidiostat === true,
      ingredientPrices: ingredientPrices || {},
      availableIngredients: availableIngredients || [],
      county: county || '',
      subCounty: subCounty || '',
      ward: ward || '',
      village: village || '',
      country: normalizedCountry,
      numberOfBirds: parseFloat(numberOfBirds) || 0,
      salePricePerBird: parseFloat(salePricePerBird) || 0,
      pricePerEgg: parseFloat(pricePerEgg) || 0,
      feedName: feedResult.feedName || '',
      recipeName: feedResult.recipeName || '',
      feedResult: {
        ingredients: feedResult.ingredients,
        totalCost: feedResult.totalCost,
        nutritionalSummary: feedResult.nutritionalSummary,
        mixingInstructions: feedResult.mixingInstructions,
        warnings: feedResult.warnings,
      },
      structuredList: feedResult.structuredList,
      metadata: {
        createdAt: new Date().toISOString(),
        source: "poultry-feed-formulation",
        version: "2.5"
      }
    };

    await sessionRef.set(farmerSession);
    console.log(`✅ Saved poultry session ${sessionId} for ${breed} ${stage}`);

    return NextResponse.json({
      success: true,
      sessionId: sessionId,
      feedName: feedResult.feedName || '',
      recipeName: feedResult.recipeName || '',
      structuredList: feedResult.structuredList,
      feedResult: {
        ingredients: feedResult.ingredients,
        totalCost: feedResult.totalCost,
        nutritionalSummary: feedResult.nutritionalSummary,
        mixingInstructions: feedResult.mixingInstructions,
        warnings: feedResult.warnings,
      },
      welcomeMessage: `Welcome ${farmerName || "Farmer"}! I've prepared your ${breed} ${stage} feed formula for ${quantityKg} kg.`
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ API Route Error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error occurred"
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "operational",
    message: "Poultry Feed Formulation API - v2.5 (LP optimization, 17 ingredients, table, enhanced mixing)",
    version: "2.5"
  });
}