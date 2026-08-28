// lib/feedFormulation.ts
// Complete Poultry Feed Formulation Engine with Fixed Recipes and Cost Ranking
// Recipes: "hugos poultry recipes" – includes Maize Germ and Wheat Germ.
// No LP optimization, no default prices. All recipes are fixed.
// Supports: Chick (starter), Grower, Layer, Broiler Starter, Broiler Finisher.
// Nutritional targets are correctly set per breed and stage.
// Added: Weekly feed planning, egg production, revenue, and profit calculations.
// Updated: Wording for weekly plan ("per day", "per week") and currency formatting.
// Added: Vaccination schedule section.
// ADDED: Translation fallback (fr, es, sw, en) – all server-generated text now localised.

export interface Ingredient {
  name: string;
  amountKg: number;
  percent: number;
  cost: number;
  pricePerKg: number;
  available: boolean;
}

export interface NutritionalSummary {
  protein: number;
  calcium: number;
  energy: number;
}

export interface FeedResult {
  feedName: string;
  recipeName: string;
  ingredients: Ingredient[];
  totalCost: number;
  nutritionalSummary: NutritionalSummary;
  mixingInstructions: string;
  warnings: string[];
  structuredList: Array<{ key: string; params: { content: string } }>;
}

// ========== NUTRITIONAL COMPOSITION ==========
const INGREDIENT_NUTRIENTS: Record<string, { protein: number; calcium: number; energy: number }> = {
  'whole maize': { protein: 0.0823, calcium: 0.0005, energy: 3500 },
  'maize bran': { protein: 0.07, calcium: 0.0005, energy: 1500 },
  'wheat pollard': { protein: 0.1078, calcium: 0.0008, energy: 1400 },
  'soya meal': { protein: 0.45, calcium: 0.002, energy: 2400 },
  'sunflower cake': { protein: 0.35, calcium: 0.005, energy: 2000 },
  'cotton seed cake': { protein: 0.15, calcium: 0.0015, energy: 1800 },
  'fish meal / omena': { protein: 0.55, calcium: 0.05, energy: 2000 },
  'lime': { protein: 0, calcium: 0.38, energy: 0 },
  'dcp': { protein: 0, calcium: 0.22, energy: 0 },
  'bone meal': { protein: 0, calcium: 0.24, energy: 0 },
  'salt': { protein: 0, calcium: 0, energy: 0 },
  'chick premix': { protein: 0, calcium: 0, energy: 0 },
  'growers premix': { protein: 0, calcium: 0, energy: 0 },
  'layers premix': { protein: 0, calcium: 0, energy: 0 },
  'lysine': { protein: 0, calcium: 0, energy: 0 },
  'methionine': { protein: 0, calcium: 0, energy: 0 },
  'threonine': { protein: 0, calcium: 0, energy: 0 },
  'tryptophan': { protein: 0, calcium: 0, energy: 0 },
  'toxin binder': { protein: 0, calcium: 0, energy: 0 },
  'coccidiostat': { protein: 0, calcium: 0, energy: 0 },
  'maize germ': { protein: 0.11, calcium: 0.0005, energy: 3600 },
  'wheat germ': { protein: 0.25, calcium: 0.0008, energy: 3400 },
};

// ========== HUGOS POULTRY RECIPES ==========

// ------------------------------------------------
// CHICK (STARTER) – 10 recipes (Sasso)
// ------------------------------------------------
const CHICK_RECIPES = [
  // C1 – Max Pollard
  { name: 'hugos poultry Chick C1', protein: 20.15, calcium: 1.0, energy: 2800,
    amounts: {
      'whole maize': 28.0, 'maize bran': 3.0, 'wheat pollard': 10.0,
      'soya meal': 11.0, 'sunflower cake': 9.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 4.0, 'lime': 1.4, 'bone meal': 1.0,
      'chick premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.07, 'methionine': 0.05, 'threonine': 0.035,
      'tryptophan': 0.015, 'coccidiostat': 0.0
    } },
  // C2 – Max Maize Germ
  { name: 'hugos poultry Chick C2', protein: 20.15, calcium: 1.0, energy: 2800,
    amounts: {
      'whole maize': 25.0, 'maize bran': 3.0, 'wheat pollard': 5.0,
      'maize germ': 8.0,
      'soya meal': 11.0, 'sunflower cake': 9.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 4.0, 'lime': 1.4, 'bone meal': 1.0,
      'chick premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.07, 'methionine': 0.05, 'threonine': 0.035,
      'tryptophan': 0.015, 'coccidiostat': 0.0
    } },
  // C3 – Max Wheat Germ
  { name: 'hugos poultry Chick C3', protein: 20.15, calcium: 1.0, energy: 2800,
    amounts: {
      'whole maize': 25.0, 'maize bran': 3.0, 'wheat pollard': 5.0,
      'wheat germ': 8.0,
      'soya meal': 11.0, 'sunflower cake': 9.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 4.0, 'lime': 1.4, 'bone meal': 1.0,
      'chick premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.07, 'methionine': 0.05, 'threonine': 0.035,
      'tryptophan': 0.015, 'coccidiostat': 0.0
    } },
  // C4 – Mix Pollard + Maize Germ
  { name: 'hugos poultry Chick C4', protein: 20.15, calcium: 1.0, energy: 2800,
    amounts: {
      'whole maize': 27.0, 'maize bran': 3.0, 'wheat pollard': 5.0,
      'maize germ': 4.0,
      'soya meal': 11.0, 'sunflower cake': 9.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 4.0, 'lime': 1.4, 'bone meal': 1.0,
      'chick premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.07, 'methionine': 0.05, 'threonine': 0.035,
      'tryptophan': 0.015, 'coccidiostat': 0.0
    } },
  // C5 – Mix Pollard + Wheat Germ
  { name: 'hugos poultry Chick C5', protein: 20.15, calcium: 1.0, energy: 2800,
    amounts: {
      'whole maize': 27.0, 'maize bran': 3.0, 'wheat pollard': 5.0,
      'wheat germ': 4.0,
      'soya meal': 11.0, 'sunflower cake': 9.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 4.0, 'lime': 1.4, 'bone meal': 1.0,
      'chick premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.07, 'methionine': 0.05, 'threonine': 0.035,
      'tryptophan': 0.015, 'coccidiostat': 0.0
    } },
  // C6 – Mix Maize Germ + Wheat Germ
  { name: 'hugos poultry Chick C6', protein: 20.15, calcium: 1.0, energy: 2800,
    amounts: {
      'whole maize': 27.0, 'maize bran': 3.0, 'wheat pollard': 3.0,
      'maize germ': 4.0, 'wheat germ': 4.0,
      'soya meal': 11.0, 'sunflower cake': 9.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 4.0, 'lime': 1.4, 'bone meal': 1.0,
      'chick premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.07, 'methionine': 0.05, 'threonine': 0.035,
      'tryptophan': 0.015, 'coccidiostat': 0.0
    } },
  // C7 – Balanced all energy sources
  { name: 'hugos poultry Chick C7', protein: 20.15, calcium: 1.0, energy: 2800,
    amounts: {
      'whole maize': 26.0, 'maize bran': 3.0, 'wheat pollard': 4.0,
      'maize germ': 3.0, 'wheat germ': 3.0,
      'soya meal': 11.0, 'sunflower cake': 9.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 4.0, 'lime': 1.4, 'bone meal': 1.0,
      'chick premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.07, 'methionine': 0.05, 'threonine': 0.035,
      'tryptophan': 0.015, 'coccidiostat': 0.0
    } },
  // C8 – High Pollard + some germ
  { name: 'hugos poultry Chick C8', protein: 20.15, calcium: 1.0, energy: 2800,
    amounts: {
      'whole maize': 26.0, 'maize bran': 3.0, 'wheat pollard': 7.0,
      'maize germ': 2.0, 'wheat germ': 2.0,
      'soya meal': 11.0, 'sunflower cake': 9.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 4.0, 'lime': 1.4, 'bone meal': 1.0,
      'chick premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.07, 'methionine': 0.05, 'threonine': 0.035,
      'tryptophan': 0.015, 'coccidiostat': 0.0
    } },
  // C9 – High germ + some pollard
  { name: 'hugos poultry Chick C9', protein: 20.15, calcium: 1.0, energy: 2800,
    amounts: {
      'whole maize': 26.0, 'maize bran': 3.0, 'wheat pollard': 3.0,
      'maize germ': 5.0, 'wheat germ': 3.0,
      'soya meal': 11.0, 'sunflower cake': 9.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 4.0, 'lime': 1.4, 'bone meal': 1.0,
      'chick premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.07, 'methionine': 0.05, 'threonine': 0.035,
      'tryptophan': 0.015, 'coccidiostat': 0.0
    } },
  // C10 – Reference
  { name: 'hugos poultry Chick C10', protein: 20.15, calcium: 1.0, energy: 2800,
    amounts: {
      'whole maize': 27.0, 'maize bran': 3.0, 'wheat pollard': 6.0,
      'maize germ': 2.0, 'wheat germ': 2.0,
      'soya meal': 11.0, 'sunflower cake': 9.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 4.0, 'lime': 1.4, 'bone meal': 1.0,
      'chick premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.07, 'methionine': 0.05, 'threonine': 0.035,
      'tryptophan': 0.015, 'coccidiostat': 0.0
    } },
];

// ------------------------------------------------
// GROWER – 10 recipes (Sasso)
// ------------------------------------------------
const GROWER_RECIPES = [
  { name: 'hugos poultry Grower G1', protein: 16.70, calcium: 0.90, energy: 2700,
    amounts: {
      'whole maize': 24.0, 'maize bran': 5.0, 'wheat pollard': 14.0,
      'soya meal': 5.0, 'sunflower cake': 10.0, 'cotton seed cake': 3.0,
      'fish meal / omena': 2.5, 'lime': 1.0, 'bone meal': 1.0,
      'growers premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.07, 'methionine': 0.05, 'threonine': 0.035,
      'tryptophan': 0.015, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Grower G2', protein: 16.70, calcium: 0.90, energy: 2700,
    amounts: {
      'whole maize': 22.0, 'maize bran': 5.0, 'wheat pollard': 5.0,
      'maize germ': 8.0,
      'soya meal': 5.0, 'sunflower cake': 10.0, 'cotton seed cake': 3.0,
      'fish meal / omena': 2.5, 'lime': 1.0, 'bone meal': 1.0,
      'growers premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.07, 'methionine': 0.05, 'threonine': 0.035,
      'tryptophan': 0.015, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Grower G3', protein: 16.70, calcium: 0.90, energy: 2700,
    amounts: {
      'whole maize': 22.0, 'maize bran': 5.0, 'wheat pollard': 5.0,
      'wheat germ': 8.0,
      'soya meal': 5.0, 'sunflower cake': 10.0, 'cotton seed cake': 3.0,
      'fish meal / omena': 2.5, 'lime': 1.0, 'bone meal': 1.0,
      'growers premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.07, 'methionine': 0.05, 'threonine': 0.035,
      'tryptophan': 0.015, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Grower G4', protein: 16.70, calcium: 0.90, energy: 2700,
    amounts: {
      'whole maize': 23.0, 'maize bran': 5.0, 'wheat pollard': 5.0,
      'maize germ': 4.0,
      'soya meal': 5.0, 'sunflower cake': 10.0, 'cotton seed cake': 3.0,
      'fish meal / omena': 2.5, 'lime': 1.0, 'bone meal': 1.0,
      'growers premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.07, 'methionine': 0.05, 'threonine': 0.035,
      'tryptophan': 0.015, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Grower G5', protein: 16.70, calcium: 0.90, energy: 2700,
    amounts: {
      'whole maize': 23.0, 'maize bran': 5.0, 'wheat pollard': 5.0,
      'wheat germ': 4.0,
      'soya meal': 5.0, 'sunflower cake': 10.0, 'cotton seed cake': 3.0,
      'fish meal / omena': 2.5, 'lime': 1.0, 'bone meal': 1.0,
      'growers premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.07, 'methionine': 0.05, 'threonine': 0.035,
      'tryptophan': 0.015, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Grower G6', protein: 16.70, calcium: 0.90, energy: 2700,
    amounts: {
      'whole maize': 23.0, 'maize bran': 5.0, 'wheat pollard': 3.0,
      'maize germ': 4.0, 'wheat germ': 4.0,
      'soya meal': 5.0, 'sunflower cake': 10.0, 'cotton seed cake': 3.0,
      'fish meal / omena': 2.5, 'lime': 1.0, 'bone meal': 1.0,
      'growers premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.07, 'methionine': 0.05, 'threonine': 0.035,
      'tryptophan': 0.015, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Grower G7', protein: 16.70, calcium: 0.90, energy: 2700,
    amounts: {
      'whole maize': 22.0, 'maize bran': 5.0, 'wheat pollard': 4.0,
      'maize germ': 3.0, 'wheat germ': 3.0,
      'soya meal': 5.0, 'sunflower cake': 10.0, 'cotton seed cake': 3.0,
      'fish meal / omena': 2.5, 'lime': 1.0, 'bone meal': 1.0,
      'growers premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.07, 'methionine': 0.05, 'threonine': 0.035,
      'tryptophan': 0.015, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Grower G8', protein: 16.70, calcium: 0.90, energy: 2700,
    amounts: {
      'whole maize': 22.0, 'maize bran': 5.0, 'wheat pollard': 7.0,
      'maize germ': 2.0, 'wheat germ': 2.0,
      'soya meal': 5.0, 'sunflower cake': 10.0, 'cotton seed cake': 3.0,
      'fish meal / omena': 2.5, 'lime': 1.0, 'bone meal': 1.0,
      'growers premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.07, 'methionine': 0.05, 'threonine': 0.035,
      'tryptophan': 0.015, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Grower G9', protein: 16.70, calcium: 0.90, energy: 2700,
    amounts: {
      'whole maize': 22.0, 'maize bran': 5.0, 'wheat pollard': 3.0,
      'maize germ': 5.0, 'wheat germ': 3.0,
      'soya meal': 5.0, 'sunflower cake': 10.0, 'cotton seed cake': 3.0,
      'fish meal / omena': 2.5, 'lime': 1.0, 'bone meal': 1.0,
      'growers premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.07, 'methionine': 0.05, 'threonine': 0.035,
      'tryptophan': 0.015, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Grower G10', protein: 16.70, calcium: 0.90, energy: 2700,
    amounts: {
      'whole maize': 23.0, 'maize bran': 5.0, 'wheat pollard': 6.0,
      'maize germ': 2.0, 'wheat germ': 2.0,
      'soya meal': 5.0, 'sunflower cake': 10.0, 'cotton seed cake': 3.0,
      'fish meal / omena': 2.5, 'lime': 1.0, 'bone meal': 1.0,
      'growers premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.07, 'methionine': 0.05, 'threonine': 0.035,
      'tryptophan': 0.015, 'coccidiostat': 0.0
    } },
];

// ------------------------------------------------
// LAYER – 10 recipes (Sasso)
// ------------------------------------------------
const LAYER_RECIPES = [
  { name: 'hugos poultry Layer L1', protein: 17.04, calcium: 3.70, energy: 2750,
    amounts: {
      'whole maize': 27.0, 'maize bran': 4.0, 'wheat pollard': 9.0,
      'soya meal': 8.0, 'sunflower cake': 8.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 3.0, 'lime': 6.5, 'bone meal': 0.7,
      'layers premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.07, 'methionine': 0.05, 'threonine': 0.035,
      'tryptophan': 0.015, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Layer L2', protein: 17.04, calcium: 3.70, energy: 2750,
    amounts: {
      'whole maize': 24.0, 'maize bran': 4.0, 'wheat pollard': 5.0,
      'maize germ': 8.0,
      'soya meal': 8.0, 'sunflower cake': 8.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 3.0, 'lime': 6.5, 'bone meal': 0.7,
      'layers premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.07, 'methionine': 0.05, 'threonine': 0.035,
      'tryptophan': 0.015, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Layer L3', protein: 17.04, calcium: 3.70, energy: 2750,
    amounts: {
      'whole maize': 24.0, 'maize bran': 4.0, 'wheat pollard': 5.0,
      'wheat germ': 8.0,
      'soya meal': 8.0, 'sunflower cake': 8.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 3.0, 'lime': 6.5, 'bone meal': 0.7,
      'layers premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.07, 'methionine': 0.05, 'threonine': 0.035,
      'tryptophan': 0.015, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Layer L4', protein: 17.04, calcium: 3.70, energy: 2750,
    amounts: {
      'whole maize': 25.0, 'maize bran': 4.0, 'wheat pollard': 5.0,
      'maize germ': 4.0,
      'soya meal': 8.0, 'sunflower cake': 8.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 3.0, 'lime': 6.5, 'bone meal': 0.7,
      'layers premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.07, 'methionine': 0.05, 'threonine': 0.035,
      'tryptophan': 0.015, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Layer L5', protein: 17.04, calcium: 3.70, energy: 2750,
    amounts: {
      'whole maize': 25.0, 'maize bran': 4.0, 'wheat pollard': 5.0,
      'wheat germ': 4.0,
      'soya meal': 8.0, 'sunflower cake': 8.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 3.0, 'lime': 6.5, 'bone meal': 0.7,
      'layers premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.07, 'methionine': 0.05, 'threonine': 0.035,
      'tryptophan': 0.015, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Layer L6', protein: 17.04, calcium: 3.70, energy: 2750,
    amounts: {
      'whole maize': 25.0, 'maize bran': 4.0, 'wheat pollard': 3.0,
      'maize germ': 4.0, 'wheat germ': 4.0,
      'soya meal': 8.0, 'sunflower cake': 8.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 3.0, 'lime': 6.5, 'bone meal': 0.7,
      'layers premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.07, 'methionine': 0.05, 'threonine': 0.035,
      'tryptophan': 0.015, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Layer L7', protein: 17.04, calcium: 3.70, energy: 2750,
    amounts: {
      'whole maize': 24.0, 'maize bran': 4.0, 'wheat pollard': 4.0,
      'maize germ': 3.0, 'wheat germ': 3.0,
      'soya meal': 8.0, 'sunflower cake': 8.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 3.0, 'lime': 6.5, 'bone meal': 0.7,
      'layers premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.07, 'methionine': 0.05, 'threonine': 0.035,
      'tryptophan': 0.015, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Layer L8', protein: 17.04, calcium: 3.70, energy: 2750,
    amounts: {
      'whole maize': 24.0, 'maize bran': 4.0, 'wheat pollard': 7.0,
      'maize germ': 2.0, 'wheat germ': 2.0,
      'soya meal': 8.0, 'sunflower cake': 8.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 3.0, 'lime': 6.5, 'bone meal': 0.7,
      'layers premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.07, 'methionine': 0.05, 'threonine': 0.035,
      'tryptophan': 0.015, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Layer L9', protein: 17.04, calcium: 3.70, energy: 2750,
    amounts: {
      'whole maize': 24.0, 'maize bran': 4.0, 'wheat pollard': 3.0,
      'maize germ': 5.0, 'wheat germ': 3.0,
      'soya meal': 8.0, 'sunflower cake': 8.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 3.0, 'lime': 6.5, 'bone meal': 0.7,
      'layers premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.07, 'methionine': 0.05, 'threonine': 0.035,
      'tryptophan': 0.015, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Layer L10', protein: 17.04, calcium: 3.70, energy: 2750,
    amounts: {
      'whole maize': 25.0, 'maize bran': 4.0, 'wheat pollard': 6.0,
      'maize germ': 2.0, 'wheat germ': 2.0,
      'soya meal': 8.0, 'sunflower cake': 8.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 3.0, 'lime': 6.5, 'bone meal': 0.7,
      'layers premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.07, 'methionine': 0.05, 'threonine': 0.035,
      'tryptophan': 0.015, 'coccidiostat': 0.0
    } },
];

// ------------------------------------------------
// BROILER STARTER – 10 recipes
// ------------------------------------------------
const BROILER_STARTER_RECIPES = [
  { name: 'hugos poultry Broiler Starter B1', protein: 22.0, calcium: 0.9, energy: 2900,
    amounts: {
      'whole maize': 31.0, 'maize bran': 4.0, 'wheat pollard': 6.0,
      'soya meal': 16.0, 'sunflower cake': 6.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 4.0, 'lime': 1.0, 'bone meal': 0.5,
      'chick premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.10, 'methionine': 0.08, 'threonine': 0.05,
      'tryptophan': 0.02, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Broiler Starter B2', protein: 22.0, calcium: 0.9, energy: 2900,
    amounts: {
      'whole maize': 28.0, 'maize bran': 4.0, 'wheat pollard': 3.0,
      'maize germ': 8.0,
      'soya meal': 16.0, 'sunflower cake': 6.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 4.0, 'lime': 1.0, 'bone meal': 0.5,
      'chick premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.10, 'methionine': 0.08, 'threonine': 0.05,
      'tryptophan': 0.02, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Broiler Starter B3', protein: 22.0, calcium: 0.9, energy: 2900,
    amounts: {
      'whole maize': 28.0, 'maize bran': 4.0, 'wheat pollard': 3.0,
      'wheat germ': 8.0,
      'soya meal': 16.0, 'sunflower cake': 6.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 4.0, 'lime': 1.0, 'bone meal': 0.5,
      'chick premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.10, 'methionine': 0.08, 'threonine': 0.05,
      'tryptophan': 0.02, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Broiler Starter B4', protein: 22.0, calcium: 0.9, energy: 2900,
    amounts: {
      'whole maize': 29.0, 'maize bran': 4.0, 'wheat pollard': 4.0,
      'maize germ': 4.0,
      'soya meal': 16.0, 'sunflower cake': 6.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 4.0, 'lime': 1.0, 'bone meal': 0.5,
      'chick premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.10, 'methionine': 0.08, 'threonine': 0.05,
      'tryptophan': 0.02, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Broiler Starter B5', protein: 22.0, calcium: 0.9, energy: 2900,
    amounts: {
      'whole maize': 29.0, 'maize bran': 4.0, 'wheat pollard': 4.0,
      'wheat germ': 4.0,
      'soya meal': 16.0, 'sunflower cake': 6.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 4.0, 'lime': 1.0, 'bone meal': 0.5,
      'chick premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.10, 'methionine': 0.08, 'threonine': 0.05,
      'tryptophan': 0.02, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Broiler Starter B6', protein: 22.0, calcium: 0.9, energy: 2900,
    amounts: {
      'whole maize': 29.0, 'maize bran': 4.0, 'wheat pollard': 2.0,
      'maize germ': 4.0, 'wheat germ': 4.0,
      'soya meal': 16.0, 'sunflower cake': 6.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 4.0, 'lime': 1.0, 'bone meal': 0.5,
      'chick premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.10, 'methionine': 0.08, 'threonine': 0.05,
      'tryptophan': 0.02, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Broiler Starter B7', protein: 22.0, calcium: 0.9, energy: 2900,
    amounts: {
      'whole maize': 28.0, 'maize bran': 4.0, 'wheat pollard': 3.0,
      'maize germ': 3.0, 'wheat germ': 3.0,
      'soya meal': 16.0, 'sunflower cake': 6.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 4.0, 'lime': 1.0, 'bone meal': 0.5,
      'chick premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.10, 'methionine': 0.08, 'threonine': 0.05,
      'tryptophan': 0.02, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Broiler Starter B8', protein: 22.0, calcium: 0.9, energy: 2900,
    amounts: {
      'whole maize': 28.0, 'maize bran': 4.0, 'wheat pollard': 6.0,
      'maize germ': 2.0, 'wheat germ': 2.0,
      'soya meal': 16.0, 'sunflower cake': 6.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 4.0, 'lime': 1.0, 'bone meal': 0.5,
      'chick premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.10, 'methionine': 0.08, 'threonine': 0.05,
      'tryptophan': 0.02, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Broiler Starter B9', protein: 22.0, calcium: 0.9, energy: 2900,
    amounts: {
      'whole maize': 28.0, 'maize bran': 4.0, 'wheat pollard': 2.0,
      'maize germ': 5.0, 'wheat germ': 3.0,
      'soya meal': 16.0, 'sunflower cake': 6.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 4.0, 'lime': 1.0, 'bone meal': 0.5,
      'chick premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.10, 'methionine': 0.08, 'threonine': 0.05,
      'tryptophan': 0.02, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Broiler Starter B10', protein: 22.0, calcium: 0.9, energy: 2900,
    amounts: {
      'whole maize': 29.0, 'maize bran': 4.0, 'wheat pollard': 5.0,
      'maize germ': 2.0, 'wheat germ': 2.0,
      'soya meal': 16.0, 'sunflower cake': 6.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 4.0, 'lime': 1.0, 'bone meal': 0.5,
      'chick premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.10, 'methionine': 0.08, 'threonine': 0.05,
      'tryptophan': 0.02, 'coccidiostat': 0.0
    } },
];

// ------------------------------------------------
// BROILER FINISHER – 10 recipes
// ------------------------------------------------
const BROILER_FINISHER_RECIPES = [
  { name: 'hugos poultry Broiler Finisher F1', protein: 20.0, calcium: 0.8, energy: 2950,
    amounts: {
      'whole maize': 35.0, 'maize bran': 5.0, 'wheat pollard': 7.0,
      'soya meal': 13.0, 'sunflower cake': 5.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 2.5, 'lime': 1.0, 'bone meal': 0.5,
      'growers premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.08, 'methionine': 0.06, 'threonine': 0.04,
      'tryptophan': 0.02, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Broiler Finisher F2', protein: 20.0, calcium: 0.8, energy: 2950,
    amounts: {
      'whole maize': 32.0, 'maize bran': 5.0, 'wheat pollard': 3.0,
      'maize germ': 8.0,
      'soya meal': 13.0, 'sunflower cake': 5.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 2.5, 'lime': 1.0, 'bone meal': 0.5,
      'growers premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.08, 'methionine': 0.06, 'threonine': 0.04,
      'tryptophan': 0.02, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Broiler Finisher F3', protein: 20.0, calcium: 0.8, energy: 2950,
    amounts: {
      'whole maize': 32.0, 'maize bran': 5.0, 'wheat pollard': 3.0,
      'wheat germ': 8.0,
      'soya meal': 13.0, 'sunflower cake': 5.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 2.5, 'lime': 1.0, 'bone meal': 0.5,
      'growers premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.08, 'methionine': 0.06, 'threonine': 0.04,
      'tryptophan': 0.02, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Broiler Finisher F4', protein: 20.0, calcium: 0.8, energy: 2950,
    amounts: {
      'whole maize': 33.0, 'maize bran': 5.0, 'wheat pollard': 4.0,
      'maize germ': 4.0,
      'soya meal': 13.0, 'sunflower cake': 5.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 2.5, 'lime': 1.0, 'bone meal': 0.5,
      'growers premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.08, 'methionine': 0.06, 'threonine': 0.04,
      'tryptophan': 0.02, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Broiler Finisher F5', protein: 20.0, calcium: 0.8, energy: 2950,
    amounts: {
      'whole maize': 33.0, 'maize bran': 5.0, 'wheat pollard': 4.0,
      'wheat germ': 4.0,
      'soya meal': 13.0, 'sunflower cake': 5.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 2.5, 'lime': 1.0, 'bone meal': 0.5,
      'growers premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.08, 'methionine': 0.06, 'threonine': 0.04,
      'tryptophan': 0.02, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Broiler Finisher F6', protein: 20.0, calcium: 0.8, energy: 2950,
    amounts: {
      'whole maize': 33.0, 'maize bran': 5.0, 'wheat pollard': 2.0,
      'maize germ': 4.0, 'wheat germ': 4.0,
      'soya meal': 13.0, 'sunflower cake': 5.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 2.5, 'lime': 1.0, 'bone meal': 0.5,
      'growers premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.08, 'methionine': 0.06, 'threonine': 0.04,
      'tryptophan': 0.02, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Broiler Finisher F7', protein: 20.0, calcium: 0.8, energy: 2950,
    amounts: {
      'whole maize': 32.0, 'maize bran': 5.0, 'wheat pollard': 3.0,
      'maize germ': 3.0, 'wheat germ': 3.0,
      'soya meal': 13.0, 'sunflower cake': 5.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 2.5, 'lime': 1.0, 'bone meal': 0.5,
      'growers premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.08, 'methionine': 0.06, 'threonine': 0.04,
      'tryptophan': 0.02, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Broiler Finisher F8', protein: 20.0, calcium: 0.8, energy: 2950,
    amounts: {
      'whole maize': 32.0, 'maize bran': 5.0, 'wheat pollard': 6.0,
      'maize germ': 2.0, 'wheat germ': 2.0,
      'soya meal': 13.0, 'sunflower cake': 5.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 2.5, 'lime': 1.0, 'bone meal': 0.5,
      'growers premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.08, 'methionine': 0.06, 'threonine': 0.04,
      'tryptophan': 0.02, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Broiler Finisher F9', protein: 20.0, calcium: 0.8, energy: 2950,
    amounts: {
      'whole maize': 32.0, 'maize bran': 5.0, 'wheat pollard': 2.0,
      'maize germ': 5.0, 'wheat germ': 3.0,
      'soya meal': 13.0, 'sunflower cake': 5.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 2.5, 'lime': 1.0, 'bone meal': 0.5,
      'growers premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.08, 'methionine': 0.06, 'threonine': 0.04,
      'tryptophan': 0.02, 'coccidiostat': 0.0
    } },
  { name: 'hugos poultry Broiler Finisher F10', protein: 20.0, calcium: 0.8, energy: 2950,
    amounts: {
      'whole maize': 33.0, 'maize bran': 5.0, 'wheat pollard': 5.0,
      'maize germ': 2.0, 'wheat germ': 2.0,
      'soya meal': 13.0, 'sunflower cake': 5.0, 'cotton seed cake': 2.0,
      'fish meal / omena': 2.5, 'lime': 1.0, 'bone meal': 0.5,
      'growers premix': 0.35, 'salt': 0.15, 'toxin binder': 0.10,
      'lysine': 0.08, 'methionine': 0.06, 'threonine': 0.04,
      'tryptophan': 0.02, 'coccidiostat': 0.0
    } },
];

// ========== WEEKLY FEED GUIDES ==========

// SASSO weekly guide (0–20 weeks)
const SASSO_WEEKLY_GUIDE: Record<number, { dailyIntake: number; weeklyIntake: number; recipe: string }> = {
  1: { dailyIntake: 15, weeklyIntake: 0.105, recipe: 'hugos poultry Chick' },
  2: { dailyIntake: 25, weeklyIntake: 0.175, recipe: 'hugos poultry Chick' },
  3: { dailyIntake: 35, weeklyIntake: 0.245, recipe: 'hugos poultry Chick' },
  4: { dailyIntake: 35, weeklyIntake: 0.245, recipe: 'hugos poultry Chick' },
  5: { dailyIntake: 45, weeklyIntake: 0.315, recipe: 'hugos poultry Grower' },
  6: { dailyIntake: 45, weeklyIntake: 0.315, recipe: 'hugos poultry Grower' },
  7: { dailyIntake: 55, weeklyIntake: 0.385, recipe: 'hugos poultry Grower' },
  8: { dailyIntake: 55, weeklyIntake: 0.385, recipe: 'hugos poultry Grower' },
  9: { dailyIntake: 65, weeklyIntake: 0.455, recipe: 'hugos poultry Grower' },
  10: { dailyIntake: 65, weeklyIntake: 0.455, recipe: 'hugos poultry Grower' },
  11: { dailyIntake: 85, weeklyIntake: 0.595, recipe: 'hugos poultry Grower' },
  12: { dailyIntake: 85, weeklyIntake: 0.595, recipe: 'hugos poultry Grower' },
  13: { dailyIntake: 95, weeklyIntake: 0.665, recipe: 'hugos poultry Grower' },
  14: { dailyIntake: 95, weeklyIntake: 0.665, recipe: 'hugos poultry Grower' },
  15: { dailyIntake: 110, weeklyIntake: 0.770, recipe: 'hugos poultry Grower' },
  16: { dailyIntake: 110, weeklyIntake: 0.770, recipe: 'hugos poultry Grower' },
  17: { dailyIntake: 120, weeklyIntake: 0.840, recipe: 'hugos poultry Grower' },
  18: { dailyIntake: 120, weeklyIntake: 0.840, recipe: 'hugos poultry Grower' },
  19: { dailyIntake: 130, weeklyIntake: 0.910, recipe: 'hugos poultry Layer' },
  20: { dailyIntake: 130, weeklyIntake: 0.910, recipe: 'hugos poultry Layer' },
};

// LAYER PHASES (for weeks 19-100)
const LAYER_PHASES = [
  { startWeek: 19, endWeek: 36, dailyIntake: 120, productionPercent: 80 },
  { startWeek: 37, endWeek: 52, dailyIntake: 130, productionPercent: 90 },
  { startWeek: 53, endWeek: 100, dailyIntake: 120, productionPercent: 80 },
];

// BROILER STARTER (weeks 1-4) and FINISHER (weeks 5-8)
const BROILER_STARTER_WEEKS: Record<number, { dailyIntake: number; weeklyIntake: number }> = {
  1: { dailyIntake: 25, weeklyIntake: 0.175 },
  2: { dailyIntake: 35, weeklyIntake: 0.245 },
  3: { dailyIntake: 50, weeklyIntake: 0.350 },
  4: { dailyIntake: 65, weeklyIntake: 0.455 },
};
const BROILER_FINISHER_WEEKS: Record<number, { dailyIntake: number; weeklyIntake: number }> = {
  5: { dailyIntake: 85, weeklyIntake: 0.595 },
  6: { dailyIntake: 110, weeklyIntake: 0.770 },
  7: { dailyIntake: 125, weeklyIntake: 0.875 },
  8: { dailyIntake: 135, weeklyIntake: 0.945 },
};

// ========== HELPER: Generate Weekly Plan ==========
function generateWeeklyPlan(params: {
  breed: string;
  stage: string;
  numberOfBirds: number;
  costPerKg: number;
  pricePerEgg?: number;
  salePricePerBird?: number;
}): { weeklyEntries: any[]; totalFeed: number; totalCost: number; totalEggs: number; eggRevenue: number; birdRevenue: number; netProfit: number } {
  console.log("📊 [generateWeeklyPlan] Called with params:", params);
  const { breed, stage, numberOfBirds, costPerKg, pricePerEgg, salePricePerBird } = params;
  const entries: any[] = [];
  let totalFeed = 0;
  let totalCost = 0;
  let totalEggs = 0;

  console.log(`📊 [generateWeeklyPlan] Breed: ${breed}, Stage: ${stage}, Birds: ${numberOfBirds}, Cost/kg: ${costPerKg}`);

  if (breed.toLowerCase() === 'broiler') {
    console.log("📊 [generateWeeklyPlan] Branch: Broiler");
    // Broiler: starter or finisher
    let weeksData = stage.includes('starter') ? BROILER_STARTER_WEEKS : BROILER_FINISHER_WEEKS;
    const weeks = Object.keys(weeksData).map(Number);
    for (const week of weeks) {
      const data = weeksData[week];
      const weeklyFeed = data.weeklyIntake * numberOfBirds;
      const weeklyCost = weeklyFeed * costPerKg;
      entries.push({
        week,
        dailyIntake: data.dailyIntake,
        weeklyFeed,
        weeklyCost,
        eggs: 0,
        eggRevenue: 0,
      });
      totalFeed += weeklyFeed;
      totalCost += weeklyCost;
    }
  } else if (stage.includes('Layer')) {
    console.log("📊 [generateWeeklyPlan] Branch: Layer");
    // Sasso Layer: use phases
    for (const phase of LAYER_PHASES) {
      const { startWeek, endWeek, dailyIntake, productionPercent } = phase;
      const duration = endWeek - startWeek + 1;
      const weeklyFeed = (dailyIntake / 1000) * numberOfBirds * 7; // kg per week
      const weeklyCost = weeklyFeed * costPerKg;
      const eggsPerWeek = numberOfBirds * (productionPercent / 100) * 7;
      const eggRevenuePerWeek = eggsPerWeek * (pricePerEgg || 0);
      entries.push({
        startWeek,
        endWeek,
        dailyIntake,
        productionPercent,
        weeklyFeed,
        weeklyCost,
        eggsPerWeek,
        eggRevenuePerWeek,
      });
      const totalWeeks = duration;
      totalFeed += weeklyFeed * totalWeeks;
      totalCost += weeklyCost * totalWeeks;
      totalEggs += eggsPerWeek * totalWeeks;
    }
  } else {
    console.log("📊 [generateWeeklyPlan] Branch: Sasso Chick/Grower");
    // Sasso Chick or Grower: use SASSO_WEEKLY_GUIDE for weeks 1-4 or 5-18
    let startWeek = 1, endWeek = 4;
    if (stage.includes('Grower')) {
      startWeek = 5;
      endWeek = 18;
    } else if (stage.includes('Starter')) {
      startWeek = 1;
      endWeek = 4;
    }
    for (let week = startWeek; week <= endWeek; week++) {
      const data = SASSO_WEEKLY_GUIDE[week];
      if (!data) continue;
      const weeklyFeed = data.weeklyIntake * numberOfBirds;
      const weeklyCost = weeklyFeed * costPerKg;
      entries.push({
        week,
        dailyIntake: data.dailyIntake,
        weeklyFeed,
        weeklyCost,
      });
      totalFeed += weeklyFeed;
      totalCost += weeklyCost;
    }
  }

  // Calculate revenues
  const eggRevenue = totalEggs * (pricePerEgg || 0);
  const birdRevenue = (salePricePerBird || 0) * numberOfBirds;
  const netProfit = eggRevenue + birdRevenue - totalCost;

  console.log("📊 [generateWeeklyPlan] Final totals:", { totalFeed, totalCost, totalEggs, eggRevenue, birdRevenue, netProfit });

  return { weeklyEntries: entries, totalFeed, totalCost, totalEggs, eggRevenue, birdRevenue, netProfit };
}

// ========== RECIPE SELECTOR ==========
function findCheapestRecipe(
  recipes: any[],
  prices: Record<string, number>,
  quantityKg: number
): { recipe: any; ingredients: Ingredient[]; totalCost: number } {
  let bestRecipe = null;
  let bestCost = Infinity;
  let bestIngredients: Ingredient[] = [];

  for (const recipe of recipes) {
    const { ingredients, totalCost } = calculateCost(recipe.amounts, prices, quantityKg);
    if (totalCost < bestCost) {
      bestCost = totalCost;
      bestRecipe = recipe;
      bestIngredients = ingredients;
    }
  }

  return { recipe: bestRecipe, ingredients: bestIngredients, totalCost: bestCost };
}

function calculateCost(
  amounts: Record<string, number>,
  prices: Record<string, number>,
  quantityKg: number
): { ingredients: Ingredient[]; totalCost: number } {
  const ingredients: Ingredient[] = [];
  let totalKg = 0;
  let totalCost = 0;

  for (const [name, amount] of Object.entries(amounts)) {
    if (amount > 0) {
      const pricePerKg = prices[name] || 0;
      const cost = amount * pricePerKg;
      totalKg += amount;
      totalCost += cost;
      ingredients.push({
        name,
        amountKg: amount,
        percent: (amount / quantityKg) * 100,
        cost: cost,
        pricePerKg: pricePerKg,
        available: true,
      });
    }
  }

  // Scale to exactly match quantityKg
  const scaleFactor = quantityKg / totalKg;
  const scaledIngredients = ingredients.map(ing => {
    const scaledAmount = ing.amountKg * scaleFactor;
    const scaledCost = scaledAmount * ing.pricePerKg;
    return {
      ...ing,
      amountKg: parseFloat(scaledAmount.toFixed(3)),
      percent: parseFloat((scaledAmount / quantityKg * 100).toFixed(2)),
      cost: parseFloat(scaledCost.toFixed(2)),
    };
  });

  const totalScaledCost = scaledIngredients.reduce((sum, ing) => sum + ing.cost, 0);

  return { ingredients: scaledIngredients, totalCost: totalScaledCost };
}

// ========== FALLBACK TRANSLATION MAPS ==========
const fallbackFr: Record<string, string> = {
  'feed_summary_content': 'Formule alimentaire pour {{breed}} {{stage}} – lot de {{quantity}} kg',
  'optimization_status_content': '✅ Recette la moins chère ({{recipe}}) sélectionnée parmi 10 recettes fixes basées sur vos prix fournis.',
  'total_cost_content': 'Coût total : {{currency}} {{amount}}',
  'nutritional_info_content': 'Résumé nutritionnel : Protéines ~{{protein}}%, Calcium ~{{calcium}}%, Énergie ~{{energy}} kcal/kg',
  'ingredient_list_content': 'Ingrédients :\n{{lines}}',
  'ingredient_list_line': '{{name}} : {{amount}} kg ({{cost}}){{avail}}',
  'ingredient_available': ' (vous en avez)',
  'mixing_instructions_base': 'Pour de meilleurs résultats, pré‑mélangez d\'abord tous les minéraux et micro‑ingrédients (chaux, DCP, sel, prémix, méthionine, lysine, thréonine, tryptophane et liant de toxines) avec environ 3 kg de son de maïs, de son de blé ou un autre support approprié. Mélangez soigneusement pour assurer une répartition uniforme. Combinez ensuite ce prémix avec les ingrédients restants. Broyez le maïs et les ingrédients protéiques de manière appropriée avant le mélange final.',
  'mixing_instructions_starter_chick': 'L\'aliment de démarrage doit être finement moulu, écrasé ou émietté de manière appropriée pour les jeunes poussins.',
  'mixing_instructions_grower': 'L\'aliment de croissance doit être mélangé uniformément et distribué en fonction de l\'âge, du poids corporel et de l\'objectif de production des oiseaux.',
  'mixing_instructions_layer': 'Pour les pondeuses, assurez-vous que le calcium est réparti uniformément dans tout l\'aliment pour soutenir la qualité de la coquille.',
  'mixing_instructions_broiler_starter': 'L\'aliment de démarrage des poulets de chair doit être finement moulu et distribué à volonté pour une croissance rapide.',
  'mixing_instructions_broiler_finisher': 'L\'aliment de finition des poulets de chair doit être distribué à volonté jusqu\'à l\'abattage.',
  'mixing_instructions_store': 'Conservez l\'aliment fini dans un endroit sec et frais et utilisez-le rapidement. Conçu par Mugo pour aider les agriculteurs du monde entier.',
  'warning_coccidiostat_layer': '⚠️ Le coccidiostat n\'est PAS autorisé pour les poules pondeuses – il a été retiré.',
  'warning_withdraw_coccidiostat': '⚠️ Retirez le coccidiostat 5 à 7 jours avant l\'abattage.',
  'info_coccidiostat_broiler_starter': 'ℹ️ Le coccidiostat est inclus dans l\'aliment de démarrage des poulets de chair comme recommandé.',
  'vaccination_schedule_text': '• Jour 1 : Maladie de Marek – Sous‑cutané / Nuque\n• Jour 1 : Maladie de Newcastle – Goutte oculaire ou nasale\n• Jour 7–9 : Gumboro (IBD) – Eau de boisson\n• Jour 10–14 : Newcastle (Lasota) + IB – Eau de boisson\n• Jour 16–18 : Gumboro (IBD) – Eau de boisson\n• Semaine 6 : Newcastle (Lasota) + IB – Eau de boisson\n• Semaine 6–8 : Typhose aviaire + Coryza – Injection\n• Semaine 8–9 : Vermifugation – Toutes les 8 semaines\n• Semaine 8–10 : Variole aviaire – Piqûre à l\'aile\n• Semaine 12–14 : Typhose aviaire – Injection\n• Semaine 16–18 : Newcastle – Injection / Eau de boisson\n• Tous les 3 mois : Newcastle – Rappel',
  'safety_warnings_heading': 'Avertissements :',
  'weekly_feed_plan_cost_per_kg': '**Coût par kg :** {{currency}} {{amount}}',
  'weekly_feed_plan_week_entry': '• {{label}} : {{daily}}g d\'aliment par oiseau par jour, aliment total {{feed}} kg par semaine, @ {{currency}} {{cost}} par kg d\'aliment coûtera {{currency}} {{weeklyCost}}',
  'weekly_feed_plan_total_stage_summary': '**Résumé total de l\'étape {{stage}}**',
  'weekly_feed_plan_total_feed_line': '• Aliment total : {{total}} kg',
  'weekly_feed_plan_total_cost_line': '• Coût total de l\'aliment : {{currency}} {{total}}',
  'weekly_feed_plan_total_eggs_line': '• Œufs produits : {{total}}',
  'weekly_feed_plan_total_egg_revenue_line': '• Revenus des œufs : {{currency}} {{total}}',
  'weekly_feed_plan_spent_hen_revenue_line': '• Revenus des poules réformées : {{currency}} {{total}}',
  'weekly_feed_plan_total_income_line': '• Revenus totaux : {{currency}} {{total}}',
  'weekly_feed_plan_net_profit_line': '• Bénéfice net : {{currency}} {{total}}',
  'weekly_feed_plan_profit_per_bird_line': '• Bénéfice par oiseau : {{currency}} {{profit}}',
  'weekly_feed_plan_cost_per_bird_line': '• Coût par oiseau : {{currency}} {{cost}}',
  'weekly_feed_plan_bird_revenue_line': '• Revenus des oiseaux (@ {{currency}} {{price}}/oiseau) : {{currency}} {{total}}',
};

const fallbackEs: Record<string, string> = {
  'feed_summary_content': 'Fórmula alimenticia para {{breed}} {{stage}} – lote de {{quantity}} kg',
  'optimization_status_content': '✅ Receta más barata ({{recipe}}) seleccionada entre 10 recetas fijas basadas en sus precios proporcionados.',
  'total_cost_content': 'Costo total : {{currency}} {{amount}}',
  'nutritional_info_content': 'Resumen nutricional : Proteínas ~{{protein}}%, Calcio ~{{calcium}}%, Energía ~{{energy}} kcal/kg',
  'ingredient_list_content': 'Ingredientes :\n{{lines}}',
  'ingredient_list_line': '{{name}} : {{amount}} kg ({{cost}}){{avail}}',
  'ingredient_available': ' (usted tiene)',
  'mixing_instructions_base': 'Para mejores resultados, pre‑mezcle primero todos los minerales y micro‑ingredientes (cal, DCP, sal, premezcla, metionina, lisina, treonina, triptófano y aglutinante de toxinas) con aproximadamente 3 kg de salvado de maíz, salvado de trigo u otro vehículo adecuado. Mezcle bien para asegurar una distribución uniforme. Luego combine esta premezcla con los ingredientes restantes. Muela el maíz y los ingredientes proteicos adecuadamente antes de la mezcla final.',
  'mixing_instructions_starter_chick': 'El alimento de inicio debe ser finamente molido, triturado o desmenuzado adecuadamente para los pollitos jóvenes.',
  'mixing_instructions_grower': 'El alimento de crecimiento debe mezclarse uniformemente y suministrarse según la edad, el peso corporal y el objetivo de producción de las aves.',
  'mixing_instructions_layer': 'Para ponedoras, asegúrese de que el calcio esté distribuido uniformemente en todo el alimento para mantener la calidad de la cáscara.',
  'mixing_instructions_broiler_starter': 'El alimento de inicio para pollos de engorde debe ser finamente molido y administrado a voluntad para un crecimiento rápido.',
  'mixing_instructions_broiler_finisher': 'El alimento de finalización para pollos de engorde debe administrarse a voluntad hasta el sacrificio.',
  'mixing_instructions_store': 'Almacene el alimento terminado en un lugar seco y fresco y utilícelo rápidamente. Diseñado por Mugo para ayudar a los agricultores de todo el mundo.',
  'warning_coccidiostat_layer': '⚠️ El coccidiostato NO está permitido para gallinas ponedoras – ha sido retirado.',
  'warning_withdraw_coccidiostat': '⚠️ Retire el coccidiostato 5 a 7 días antes del sacrificio.',
  'info_coccidiostat_broiler_starter': 'ℹ️ El coccidiostato está incluido en el alimento de inicio para pollos de engorde según recomendación.',
  'vaccination_schedule_text': '• Día 1 : Enfermedad de Marek – Subcutáneo / Cuello\n• Día 1 : Enfermedad de Newcastle – Gota ocular o nasal\n• Día 7–9 : Gumboro (IBD) – Agua de bebida\n• Día 10–14 : Newcastle (Lasota) + IB – Agua de bebida\n• Día 16–18 : Gumboro (IBD) – Agua de bebida\n• Semana 6 : Newcastle (Lasota) + IB – Agua de bebida\n• Semana 6–8 : Tifosis aviar + Coryza – Inyección\n• Semana 8–9 : Desparasitación – Cada 8 semanas\n• Semana 8–10 : Viruela aviar – Punción en el ala\n• Semana 12–14 : Tifosis aviar – Inyección\n• Semana 16–18 : Newcastle – Inyección / Agua de bebida\n• Cada 3 meses : Newcastle – Refuerzo',
  'safety_warnings_heading': 'Advertencias :',
  'weekly_feed_plan_cost_per_kg': '**Costo por kg :** {{currency}} {{amount}}',
  'weekly_feed_plan_week_entry': '• {{label}} : {{daily}}g de alimento por ave por día, total de alimento {{feed}} kg por semana, @ {{currency}} {{cost}} por kg de alimento costará {{currency}} {{weeklyCost}}',
  'weekly_feed_plan_total_stage_summary': '**Resumen total de la etapa {{stage}}**',
  'weekly_feed_plan_total_feed_line': '• Alimento total : {{total}} kg',
  'weekly_feed_plan_total_cost_line': '• Costo total del alimento : {{currency}} {{total}}',
  'weekly_feed_plan_total_eggs_line': '• Huevos producidos : {{total}}',
  'weekly_feed_plan_total_egg_revenue_line': '• Ingresos por huevos : {{currency}} {{total}}',
  'weekly_feed_plan_spent_hen_revenue_line': '• Ingresos por gallinas de descarte : {{currency}} {{total}}',
  'weekly_feed_plan_total_income_line': '• Ingresos totales : {{currency}} {{total}}',
  'weekly_feed_plan_net_profit_line': '• Beneficio neto : {{currency}} {{total}}',
  'weekly_feed_plan_profit_per_bird_line': '• Beneficio por ave : {{currency}} {{profit}}',
  'weekly_feed_plan_cost_per_bird_line': '• Costo por ave : {{currency}} {{cost}}',
  'weekly_feed_plan_bird_revenue_line': '• Ingresos por aves (@ {{currency}} {{price}}/ave) : {{currency}} {{total}}',
};

const fallbackSw: Record<string, string> = {
  'feed_summary_content': 'Mchanganyiko wa chakula kwa {{breed}} {{stage}} – kiasi cha {{quantity}} kg',
  'optimization_status_content': '✅ Kichocheo cha bei nafuu ({{recipe}}) kilichochaguliwa kati ya mapishi 10 yasiyobadilika kulingana na bei ulizotoa.',
  'total_cost_content': 'Gharama jumla : {{currency}} {{amount}}',
  'nutritional_info_content': 'Muhtasari wa lishe : Protini ~{{protein}}%, Kalisi ~{{calcium}}%, Nishati ~{{energy}} kcal/kg',
  'ingredient_list_content': 'Viungo :\n{{lines}}',
  'ingredient_list_line': '{{name}} : {{amount}} kg ({{cost}}){{avail}}',
  'ingredient_available': ' (unayo)',
  'mixing_instructions_base': 'Kwa matokeo bora, kwanza changanya madini na viungo vidogo (chokaa, DCP, chumvi, mchanganyiko wa viungo, methionine, lysine, threonine, tryptophan na kifunga sumu) na takriban kg 3 za pumba za mahindi, pumba za ngano au kifaa kingine kinachofaa. Changanya vizuri ili kuhakikisha usambazaji sawa. Kisha changanya hii na viungo vilivyobaki. Saga mahindi na viungo vya protini ipasavyo kabla ya mchanganyiko wa mwisho.',
  'mixing_instructions_starter_chick': 'Chakula cha kuanzia kinapaswa kusagwa vizuri, kusagwa au kuvunjwa ipasavyo kwa vifaranga wachanga.',
  'mixing_instructions_grower': 'Chakula cha ukuaji kinapaswa kuchanganywa sawasawa na kutolewa kulingana na umri, uzito wa mwili na lengo la uzalishaji la ndege.',
  'mixing_instructions_layer': 'Kwa kuku wa mayai, hakikisha kalisi inasambazwa sawasawa katika chakula chote ili kusaidia ubora wa ganda.',
  'mixing_instructions_broiler_starter': 'Chakula cha kuanzia cha kuku wa nyama kinapaswa kusagwa vizuri na kutolewa kwa hiari kwa ukuaji wa haraka.',
  'mixing_instructions_broiler_finisher': 'Chakula cha kumalizia cha kuku wa nyama kinapaswa kutolewa kwa hiari hadi wakati wa kuchinjwa.',
  'mixing_instructions_store': 'Hifadhi chakula kilichomalizika mahali pakavu na baridi na kitumie haraka. Iliyoundwa na Mugo kusaidia wakulima duniani kote.',
  'warning_coccidiostat_layer': '⚠️ Coccidiostat hairuhusiwi kwa kuku wa mayai – imeondolewa.',
  'warning_withdraw_coccidiostat': '⚠️ Ondoa coccidiostat siku 5 hadi 7 kabla ya kuchinjwa.',
  'info_coccidiostat_broiler_starter': 'ℹ️ Coccidiostat imejumuishwa katika chakula cha kuanzia cha kuku wa nyama kama ilivyopendekezwa.',
  'vaccination_schedule_text': '• Siku 1 : Marek – Chini ya ngozi / Shingo\n• Siku 1 : Newcastle – Tone la jicho au pua\n• Siku 7–9 : Gumboro (IBD) – Maji ya kunywa\n• Siku 10–14 : Newcastle (Lasota) + IB – Maji ya kunywa\n• Siku 16–18 : Gumboro (IBD) – Maji ya kunywa\n• Wiki 6 : Newcastle (Lasota) + IB – Maji ya kunywa\n• Wiki 6–8 : Typhoid ya kuku + Coryza – Sindano\n• Wiki 8–9 : Kuondoa minyoo – Kila wiki 8\n• Wiki 8–10 : Tetekuwanga – Kidole kwa bawa\n• Wiki 12–14 : Typhoid ya kuku – Sindano\n• Wiki 16–18 : Newcastle – Sindano / Maji ya kunywa\n• Kila miezi 3 : Newcastle – Nyongeza',
  'safety_warnings_heading': 'Maonyo :',
  'weekly_feed_plan_cost_per_kg': '**Gharama kwa kg :** {{currency}} {{amount}}',
  'weekly_feed_plan_week_entry': '• {{label}} : {{daily}}g ya chakula kwa ndege kwa siku, jumla ya chakula {{feed}} kg kwa wiki, @ {{currency}} {{cost}} kwa kg ya chakula itagharimu {{currency}} {{weeklyCost}}',
  'weekly_feed_plan_total_stage_summary': '**Muhtasari wa jumla wa hatua ya {{stage}}**',
  'weekly_feed_plan_total_feed_line': '• Chakula jumla : {{total}} kg',
  'weekly_feed_plan_total_cost_line': '• Gharama jumla ya chakula : {{currency}} {{total}}',
  'weekly_feed_plan_total_eggs_line': '• Mayai yaliyotolewa : {{total}}',
  'weekly_feed_plan_total_egg_revenue_line': '• Mapato ya mayai : {{currency}} {{total}}',
  'weekly_feed_plan_spent_hen_revenue_line': '• Mapato ya kuku waliokomaa : {{currency}} {{total}}',
  'weekly_feed_plan_total_income_line': '• Mapato jumla : {{currency}} {{total}}',
  'weekly_feed_plan_net_profit_line': '• Faida halisi : {{currency}} {{total}}',
  'weekly_feed_plan_profit_per_bird_line': '• Faida kwa ndege : {{currency}} {{profit}}',
  'weekly_feed_plan_cost_per_bird_line': '• Gharama kwa ndege : {{currency}} {{cost}}',
  'weekly_feed_plan_bird_revenue_line': '• Mapato ya ndege (@ {{currency}} {{price}}/ndege) : {{currency}} {{total}}',
};

const fallbackEn: Record<string, string> = {
  'feed_summary_content': 'Feed formula for {{breed}} {{stage}} – {{quantity}} kg batch',
  'optimization_status_content': '✅ Cheapest recipe ({{recipe}}) selected from 10 fixed recipes based on your provided prices.',
  'total_cost_content': 'Total Cost: {{currency}} {{amount}}',
  'nutritional_info_content': 'Nutritional Summary: Protein ~{{protein}}%, Calcium ~{{calcium}}%, Energy ~{{energy}} kcal/kg',
  'ingredient_list_content': 'Ingredients:\n{{lines}}',
  'ingredient_list_line': '{{name}}: {{amount}} kg ({{cost}}){{avail}}',
  'ingredient_available': ' (you have some)',
  'mixing_instructions_base': 'For best results, first pre‑mix all minerals and micro‑ingredients (lime, DCP, salt, premix, methionine, lysine, threonine, tryptophan, and toxin binder) with approximately 3 kg of maize bran, wheat bran, or another suitable carrier. Mix thoroughly to ensure even distribution. Then combine this premix with the remaining ingredients. Grind maize and protein ingredients appropriately before final mixing.',
  'mixing_instructions_starter_chick': 'Starter feed should be finely ground, mashed, or appropriately crumbled for young chicks.',
  'mixing_instructions_grower': 'Grower feed should be mixed uniformly and supplied according to the birds\' age, body weight, and production objective.',
  'mixing_instructions_layer': 'For layers, ensure calcium is evenly distributed throughout the feed to support shell quality.',
  'mixing_instructions_broiler_starter': 'Broiler starter feed should be finely ground and fed ad libitum for rapid growth.',
  'mixing_instructions_broiler_finisher': 'Broiler finisher feed should be fed ad libitum until slaughter.',
  'mixing_instructions_store': 'Store finished feed in a dry, cool place and use promptly. Designed by Mugo to assist farmers globally.',
  'warning_coccidiostat_layer': '⚠️ Coccidiostat is NOT allowed for laying hens – it has been removed.',
  'warning_withdraw_coccidiostat': '⚠️ Withdraw coccidiostat 5–7 days before slaughter.',
  'info_coccidiostat_broiler_starter': 'ℹ️ Coccidiostat is included in broiler starter as per recommendation.',
  'vaccination_schedule_text': '• Day 1: Marek\'s – Subcutaneous / Neck\n• Day 1: Newcastle Disease – Eye or Nasal Drop\n• Day 7–9: Gumboro (IBD) – Drinking Water\n• Day 10–14: Newcastle (Lasota) + IB – Drinking Water\n• Day 16–18: Gumboro (IBD) – Drinking Water\n• Week 6: Newcastle (Lasota) + IB – Drinking Water\n• Week 6–8: Fowl Typhoid + Coryza – Injection\n• Week 8–9: Deworming – Every 8 Weeks\n• Week 8–10: Fowl Pox – Wing Stab\n• Week 12–14: Fowl Typhoid – Injection\n• Week 16–18: Newcastle – Injection / Drinking Water\n• Every 3 Months: Newcastle – Booster',
  'safety_warnings_heading': 'Warnings:',
  'weekly_feed_plan_cost_per_kg': '**Cost per kg:** {{currency}} {{amount}}',
  'weekly_feed_plan_week_entry': '• {{label}}: {{daily}}g feed per bird per day, total feed {{feed}} kg per week, @ {{currency}} {{cost}} per kg feed will cost {{currency}} {{weeklyCost}}',
  'weekly_feed_plan_total_stage_summary': '**Total {{stage}} Stage Summary**',
  'weekly_feed_plan_total_feed_line': '• Total feed: {{total}} kg',
  'weekly_feed_plan_total_cost_line': '• Total feed cost: {{currency}} {{total}}',
  'weekly_feed_plan_total_eggs_line': '• Eggs produced: {{total}}',
  'weekly_feed_plan_total_egg_revenue_line': '• Egg revenue: {{currency}} {{total}}',
  'weekly_feed_plan_spent_hen_revenue_line': '• Spent hen revenue: {{currency}} {{total}}',
  'weekly_feed_plan_total_income_line': '• Total income: {{currency}} {{total}}',
  'weekly_feed_plan_net_profit_line': '• Net profit: {{currency}} {{total}}',
  'weekly_feed_plan_profit_per_bird_line': '• Profit per bird: {{currency}} {{profit}}',
  'weekly_feed_plan_cost_per_bird_line': '• Cost per bird: {{currency}} {{cost}}',
  'weekly_feed_plan_bird_revenue_line': '• Bird revenue (@ {{currency}} {{price}}/bird): {{currency}} {{total}}',
};

const getFallbackMap = (language: string): Record<string, string> => {
  if (language.startsWith('fr')) return fallbackFr;
  if (language.startsWith('es')) return fallbackEs;
  if (language.startsWith('sw')) return fallbackSw;
  if (language.startsWith('en')) return fallbackEn;
  return {};
};

// ========== MAIN EXPORT FUNCTION ==========
export async function formulateFeed(params: {
  breed: string;
  stage: string;
  quantityKg: number;
  includeCoccidiostat: boolean;
  availableIngredients?: string[];
  country?: string;
  ingredientPrices?: Record<string, number>;
  numberOfBirds?: number;
  salePricePerBird?: number;
  pricePerEgg?: number;
  language?: string;   // NEW: translation language (fr, es, sw, en)
}): Promise<FeedResult> {
  console.log("📊 [formulateFeed] Called with params:", params);

  const {
    breed,
    stage,
    quantityKg,
    includeCoccidiostat,
    availableIngredients = [],
    ingredientPrices = {},
    numberOfBirds = 0,
    salePricePerBird = 0,
    pricePerEgg = 0,
    language = 'en', // default to English
  } = params;

  console.log(`📊 [formulateFeed] numberOfBirds: ${numberOfBirds}, salePricePerBird: ${salePricePerBird}, pricePerEgg: ${pricePerEgg}`);
  console.log(`📊 [formulateFeed] language: ${language}`);

  const breedKey = breed.toLowerCase().trim();
  const stageKey = stage.toLowerCase().includes('starter') ? 'starter' :
                   stage.toLowerCase().includes('grower') ? 'grower' :
                   stage.toLowerCase().includes('layer') ? 'layer' :
                   stage.toLowerCase().includes('finisher') ? 'finisher' : 'starter';

  let recipes: any[] = [];
  let targetNutrition = { protein: 0, calcium: 0, energy: 0 };
  let mixingStage = '';

  // Select recipe list and nutritional targets based on breed and stage
  if (breedKey === 'broiler') {
    if (stageKey === 'starter') {
      recipes = BROILER_STARTER_RECIPES;
      targetNutrition = { protein: 22.0, calcium: 0.9, energy: 2900 };
      mixingStage = 'broiler starter';
    } else if (stageKey === 'finisher') {
      recipes = BROILER_FINISHER_RECIPES;
      targetNutrition = { protein: 20.0, calcium: 0.8, energy: 2950 };
      mixingStage = 'broiler finisher';
    } else {
      recipes = BROILER_FINISHER_RECIPES;
      targetNutrition = { protein: 20.0, calcium: 0.8, energy: 2950 };
      mixingStage = 'broiler finisher';
    }
  } else {
    // Dual-purpose breeds (Sasso, layers, etc.)
    if (stageKey === 'starter') {
      recipes = CHICK_RECIPES;
      targetNutrition = { protein: 20.15, calcium: 1.0, energy: 2800 };
      mixingStage = 'chick starter';
    } else if (stageKey === 'grower') {
      recipes = GROWER_RECIPES;
      targetNutrition = { protein: 16.70, calcium: 0.9, energy: 2700 };
      mixingStage = 'grower';
    } else if (stageKey === 'layer') {
      recipes = LAYER_RECIPES;
      targetNutrition = { protein: 17.04, calcium: 3.8, energy: 2750 };
      mixingStage = 'layer';
    } else {
      recipes = GROWER_RECIPES;
      targetNutrition = { protein: 16.70, calcium: 0.9, energy: 2700 };
      mixingStage = 'grower';
    }
  }

  // Find cheapest recipe
  const { recipe: selectedRecipe, ingredients: finalIngredients, totalCost } =
    findCheapestRecipe(recipes, ingredientPrices, quantityKg);

  console.log("📊 [formulateFeed] Selected recipe:", selectedRecipe?.name);

  // Human-friendly name used by the archive/history cards.
  const feedName =
    breedKey === 'broiler' && stageKey === 'starter'
      ? 'Broiler Starter Mash'
      : breedKey === 'broiler' && stageKey === 'finisher'
        ? 'Broiler Finisher Mash'
        : stageKey === 'starter'
          ? 'Chick Mash'
          : stageKey === 'grower'
            ? 'Growers Mash'
            : stageKey === 'layer'
              ? 'Layers Mash'
              : `${stage} Feed`;

  // Compute cost per kg
  const costPerKg = totalCost / quantityKg;
  console.log(`📊 [formulateFeed] costPerKg: ${costPerKg}`);

  // Generate weekly plan
  console.log("📊 [formulateFeed] Calling generateWeeklyPlan with numberOfBirds:", numberOfBirds);
  const weeklyPlan = generateWeeklyPlan({
    breed,
    stage,
    numberOfBirds,
    costPerKg,
    pricePerEgg,
    salePricePerBird,
  });
  console.log("📊 [formulateFeed] weeklyPlan generated:", weeklyPlan);

  // ----- Translation helper -----
  const fallbackMap = getFallbackMap(language);
  const safeT = (key: string, paramsObj?: any): string => {
    const template = fallbackMap[key];
    if (template) {
      let result = template;
      if (paramsObj) {
        for (const [k, v] of Object.entries(paramsObj)) {
          result = result.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
        }
      }
      return result;
    }
    return key; // fallback to key itself if not found
  };

  // ----- Build structured list with translations -----
  const structuredList = [];

  // 1. Feed summary
  structuredList.push({
    key: "feed_summary",
    params: {
      content: safeT('feed_summary_content', {
        breed,
        stage,
        quantity: quantityKg,
      })
    }
  });

  // 2. Optimization status
  structuredList.push({
    key: "optimization_status",
    params: {
      content: safeT('optimization_status_content', { recipe: selectedRecipe?.name || '' })
    }
  });

  // 3. Ingredient list
  const ingredientLines = finalIngredients.map(ing => {
    const avail = availableIngredients.some(a => a.toLowerCase().includes(ing.name.toLowerCase()))
      ? safeT('ingredient_available')
      : '';
    return safeT('ingredient_list_line', {
      name: ing.name,
      amount: ing.amountKg.toFixed(2),
      cost: ing.cost.toFixed(2),
      avail,
    });
  });
  structuredList.push({
    key: "ingredient_list",
    params: {
      content: safeT('ingredient_list_content', { lines: ingredientLines.join('\n') })
    }
  });

  // 4. Nutritional info
  structuredList.push({
    key: "nutritional_info",
    params: {
      content: safeT('nutritional_info_content', {
        protein: targetNutrition.protein,
        calcium: targetNutrition.calcium,
        energy: targetNutrition.energy,
      })
    }
  });

  // 5. Total cost – keep {{CURRENCY}} placeholder
  structuredList.push({
    key: "total_cost",
    params: {
      content: safeT('total_cost_content', {
        currency: '{{CURRENCY}}',
        amount: totalCost.toFixed(2),
      })
    }
  });

  // 6. Mixing instructions – compose using safeT keys
  let mixingTranslated = safeT('mixing_instructions_base');
  if (stageKey === 'starter' && breedKey !== 'broiler') {
    mixingTranslated += ' ' + safeT('mixing_instructions_starter_chick');
  } else if (stageKey === 'grower') {
    mixingTranslated += ' ' + safeT('mixing_instructions_grower');
  } else if (stageKey === 'layer') {
    mixingTranslated += ' ' + safeT('mixing_instructions_layer');
  } else if (breedKey === 'broiler' && stageKey === 'starter') {
    mixingTranslated += ' ' + safeT('mixing_instructions_broiler_starter');
  } else if (breedKey === 'broiler' && stageKey === 'finisher') {
    mixingTranslated += ' ' + safeT('mixing_instructions_broiler_finisher');
  }
  mixingTranslated += ' ' + safeT('mixing_instructions_store');

  structuredList.push({
    key: "mixing_instructions",
    params: { content: mixingTranslated }
  });

  // 7. Weekly feed plan (only if numberOfBirds > 0)
  if (numberOfBirds > 0) {
    // Use the weeklyPlan we already have – we just need to format it using safeT keys
    // We'll re-use the existing logic but replace hardcoded English with safeT
    let weeklyContent = safeT('weekly_feed_plan_cost_per_kg', {
      currency: '{{CURRENCY}}',
      amount: costPerKg.toFixed(2),
    }) + '\n\n';

    const entries = weeklyPlan.weeklyEntries;

    if (stageKey === 'layer') {
      for (const entry of entries) {
        const phaseLabel = `Weeks ${entry.startWeek}–${entry.endWeek} (${entry.endWeek - entry.startWeek + 1} weeks) – ${entry.dailyIntake}g feed per bird, ${entry.productionPercent}% egg production`;
        weeklyContent += phaseLabel + '\n';
        weeklyContent += safeT('weekly_feed_plan_week_entry', {
          label: `Week ${entry.startWeek}–${entry.endWeek}`,
          daily: entry.dailyIntake,
          feed: entry.weeklyFeed.toFixed(1),
          currency: '{{CURRENCY}}',
          cost: costPerKg.toFixed(2),
          weeklyCost: entry.weeklyCost.toFixed(2),
        }) + '\n';
        // Additional lines can be added with safeT if needed, but we'll keep them as is for brevity.
      }
      // Total summary
      weeklyContent += `**${safeT('weekly_feed_plan_total_stage_summary', { stage: 'Layer' })}**\n`;
      weeklyContent += safeT('weekly_feed_plan_total_feed_line', { total: weeklyPlan.totalFeed.toFixed(1) }) + '\n';
      weeklyContent += safeT('weekly_feed_plan_total_cost_line', { currency: '{{CURRENCY}}', total: weeklyPlan.totalCost.toFixed(2) }) + '\n';
      weeklyContent += safeT('weekly_feed_plan_total_eggs_line', { total: weeklyPlan.totalEggs.toFixed(0) }) + '\n';
      weeklyContent += safeT('weekly_feed_plan_total_egg_revenue_line', { currency: '{{CURRENCY}}', total: weeklyPlan.eggRevenue.toFixed(2) }) + '\n';
      if (salePricePerBird > 0) {
        weeklyContent += safeT('weekly_feed_plan_spent_hen_revenue_line', { currency: '{{CURRENCY}}', total: weeklyPlan.birdRevenue.toFixed(2) }) + '\n';
      }
      weeklyContent += safeT('weekly_feed_plan_total_income_line', { currency: '{{CURRENCY}}', total: (weeklyPlan.eggRevenue + weeklyPlan.birdRevenue).toFixed(2) }) + '\n';
      weeklyContent += safeT('weekly_feed_plan_net_profit_line', { currency: '{{CURRENCY}}', total: weeklyPlan.netProfit.toFixed(2) }) + '\n';
      weeklyContent += safeT('weekly_feed_plan_profit_per_bird_line', { currency: '{{CURRENCY}}', profit: (weeklyPlan.netProfit / numberOfBirds).toFixed(2) }) + '\n';
    } else {
      // Chick, Grower, Broiler
      for (const entry of entries) {
        const weekLabel = entry.week ? `Week ${entry.week}` : `Week ${entry.startWeek}–${entry.endWeek}`;
        weeklyContent += safeT('weekly_feed_plan_week_entry', {
          label: weekLabel,
          daily: entry.dailyIntake,
          feed: entry.weeklyFeed.toFixed(1),
          currency: '{{CURRENCY}}',
          cost: costPerKg.toFixed(2),
          weeklyCost: entry.weeklyCost.toFixed(2),
        }) + '\n';
      }
      weeklyContent += `\n**${safeT('weekly_feed_plan_total_stage_summary', { stage: stage })}**\n`;
      weeklyContent += safeT('weekly_feed_plan_total_feed_line', { total: weeklyPlan.totalFeed.toFixed(1) }) + '\n';
      weeklyContent += safeT('weekly_feed_plan_total_cost_line', { currency: '{{CURRENCY}}', total: weeklyPlan.totalCost.toFixed(2) }) + '\n';
      if (salePricePerBird > 0) {
        weeklyContent += safeT('weekly_feed_plan_bird_revenue_line', { currency: '{{CURRENCY}}', price: salePricePerBird, total: weeklyPlan.birdRevenue.toFixed(2) }) + '\n';
        weeklyContent += safeT('weekly_feed_plan_net_profit_line', { currency: '{{CURRENCY}}', total: weeklyPlan.netProfit.toFixed(2) }) + '\n';
        weeklyContent += safeT('weekly_feed_plan_profit_per_bird_line', { currency: '{{CURRENCY}}', profit: (weeklyPlan.netProfit / numberOfBirds).toFixed(2) }) + '\n';
      } else {
        weeklyContent += safeT('weekly_feed_plan_cost_per_bird_line', { currency: '{{CURRENCY}}', cost: (weeklyPlan.totalCost / numberOfBirds).toFixed(2) }) + '\n';
      }
    }

    structuredList.push({
      key: "weekly_feed_plan",
      params: { content: weeklyContent }
    });
  } else {
    console.log("📊 [formulateFeed] numberOfBirds is 0 – skipping weekly plan");
  }

  // 8. Vaccination schedule
  structuredList.push({
    key: "vaccination_schedule",
    params: {
      content: safeT('vaccination_schedule_text')
    }
  });

  // 9. Safety warnings
  const warningTranslations: string[] = [];
  if (stageKey === 'layer' && includeCoccidiostat) {
    warningTranslations.push(safeT('warning_coccidiostat_layer'));
  }
  if (stageKey === 'finisher' && includeCoccidiostat) {
    warningTranslations.push(safeT('warning_withdraw_coccidiostat'));
  }
  if (breedKey === 'broiler' && stageKey === 'starter' && includeCoccidiostat) {
    warningTranslations.push(safeT('info_coccidiostat_broiler_starter'));
  }

  if (warningTranslations.length > 0) {
    structuredList.push({
      key: "safety_warnings",
      params: {
        content: safeT('safety_warnings_heading') + '\n' + warningTranslations.join('\n')
      }
    });
  }

  console.log("📊 [formulateFeed] Final structuredList keys:", structuredList.map(item => item.key));

  return {
    feedName,
    recipeName: selectedRecipe?.name || '',
    ingredients: finalIngredients,
    totalCost,
    nutritionalSummary: targetNutrition,
    mixingInstructions: mixingTranslated,
    warnings: warningTranslations,
    structuredList,
  };
}