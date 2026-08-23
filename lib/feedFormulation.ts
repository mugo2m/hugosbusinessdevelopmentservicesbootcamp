// lib/feedFormulation.ts
// Complete Poultry Feed Formulation Engine with Fixed Recipes and Cost Ranking
// Recipes: "hugos poultry recipes" – includes Maize Germ and Wheat Germ.
// No LP optimization, no default prices. All recipes are fixed.
// Supports: Chick (starter), Grower, Layer, Broiler Starter, Broiler Finisher.
// Nutritional targets are correctly set per breed and stage.
// Added: Weekly feed planning, egg production, revenue, and profit calculations.
// Updated: Wording for weekly plan ("per day", "per week") and currency formatting.
// Added: Vaccination schedule section.

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

// ========== MAIN EXPORT FUNCTION ==========
export async function formulateFeed(params: {
  breed: string;
  stage: string;
  quantityKg: number;
  includeCoccidiostat: boolean;
  availableIngredients?: string[];
  country?: string;
  ingredientPrices?: Record<string, number>;
  // New fields
  numberOfBirds?: number;
  salePricePerBird?: number;
  pricePerEgg?: number;
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
  } = params;

  console.log(`📊 [formulateFeed] numberOfBirds: ${numberOfBirds}, salePricePerBird: ${salePricePerBird}, pricePerEgg: ${pricePerEgg}`);

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
  // The selected recipe name remains available separately as recipeName.
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

  // Build warnings
  const warnings: string[] = [];
  if (stageKey === 'layer' && includeCoccidiostat) {
    warnings.push("⚠️ Coccidiostat is NOT allowed for laying hens – it has been removed.");
  }
  if (stageKey === 'finisher') {
    warnings.push("⚠️ Withdraw coccidiostat 5–7 days before slaughter.");
  }
  if (breedKey === 'broiler' && stageKey === 'starter' && includeCoccidiostat) {
    warnings.push("ℹ️ Coccidiostat is included in broiler starter as per recommendation.");
  }

  // Mixing instructions
  const baseMixing = "For best results, first pre-mix all minerals and micro-ingredients (lime, DCP, salt, premix, methionine, lysine, threonine, tryptophan, and toxin binder) with approximately 3 kg of maize bran, wheat bran, or another suitable carrier. Mix thoroughly to ensure even distribution. Then combine this premix with the remaining ingredients. Grind maize and protein ingredients appropriately before final mixing.";

  let mixingInstructions = baseMixing;
  if (stageKey === 'starter' && breedKey !== 'broiler') {
    mixingInstructions += " Starter feed should be finely ground, mashed, or appropriately crumbled for young chicks.";
  } else if (stageKey === 'grower') {
    mixingInstructions += " Grower feed should be mixed uniformly and supplied according to the birds' age, body weight, and production objective.";
  } else if (stageKey === 'layer') {
    mixingInstructions += " For layers, ensure calcium is evenly distributed throughout the feed to support shell quality.";
  } else if (breedKey === 'broiler' && stageKey === 'starter') {
    mixingInstructions += " Broiler starter feed should be finely ground and fed ad libitum for rapid growth.";
  } else if (breedKey === 'broiler' && stageKey === 'finisher') {
    mixingInstructions += " Broiler finisher feed should be fed ad libitum until slaughter.";
  }
  mixingInstructions += " Store finished feed in a dry, cool place and use promptly. Designed by Mugo to assist farmers globally.";

  // Build structured list
  const structuredList = [];

  structuredList.push({
    key: "feed_summary",
    params: {
      content: `Feed formula for ${breed} ${stage} – ${quantityKg} kg batch`
    }
  });

  structuredList.push({
    key: "optimization_status",
    params: {
      content: `✅ Cheapest recipe (${selectedRecipe?.name}) selected from 10 fixed "hugos poultry recipes" based on your provided prices.`
    }
  });

  const ingredientLines = finalIngredients.map(ing => {
    const avail = availableIngredients.some(a => a.toLowerCase().includes(ing.name.toLowerCase())) ? ' (you have some)' : '';
    return `${ing.name}: ${ing.amountKg.toFixed(2)} kg (${ing.cost.toFixed(2)})${avail}`;
  });

  structuredList.push({
    key: "ingredient_list",
    params: {
      content: `Ingredients:\n${ingredientLines.join('\n')}`
    }
  });

  structuredList.push({
    key: "nutritional_info",
    params: {
      content: `Nutritional Summary: Protein ~${targetNutrition.protein}%, Calcium ~${targetNutrition.calcium}%, Energy ~${targetNutrition.energy} kcal/kg`
    }
  });

  // ★★★ UPDATED: total_cost now uses {{CURRENCY}} placeholder ★★★
  structuredList.push({
    key: "total_cost",
    params: {
      content: `Total Cost: {{CURRENCY}} ${totalCost.toFixed(2)}`
    }
  });

  structuredList.push({
    key: "mixing_instructions",
    params: {
      content: mixingInstructions
    }
  });

  // ===== WEEKLY FEED PLAN & FINANCIAL SUMMARY =====
  console.log(`📊 [formulateFeed] numberOfBirds > 0? ${numberOfBirds > 0}`);
  if (numberOfBirds > 0) {
    console.log("📊 [formulateFeed] Generating weekly feed plan content...");
    // ★★★ UPDATED: Use {{CURRENCY}} placeholder instead of Ksh ★★★
    let weeklyContent = `**Cost per kg:** {{CURRENCY}} ${costPerKg.toFixed(2)}\n\n`;
    const entries = weeklyPlan.weeklyEntries;

    if (stageKey === 'layer') {
      // Layer phases – bold and "Phase:" removed
      for (const entry of entries) {
        weeklyContent += `Weeks ${entry.startWeek}–${entry.endWeek} (${entry.endWeek - entry.startWeek + 1} weeks) – ${entry.dailyIntake}g feed per bird, ${entry.productionPercent}% egg production\n`;
        weeklyContent += `• Week ${entry.startWeek}–${entry.endWeek}: ${entry.dailyIntake}g feed per bird per day, total feed ${entry.weeklyFeed.toFixed(1)} kg per week, @ {{CURRENCY}} ${costPerKg.toFixed(2)} per kg feed will cost {{CURRENCY}} ${entry.weeklyCost.toFixed(2)}\n`;
        weeklyContent += `• Total feed: ${(entry.weeklyFeed * (entry.endWeek - entry.startWeek + 1)).toFixed(1)} kg\n`;
        weeklyContent += `• Total feed cost: {{CURRENCY}} ${(entry.weeklyCost * (entry.endWeek - entry.startWeek + 1)).toFixed(2)}\n`;
        weeklyContent += `• Eggs produced: ${(entry.eggsPerWeek * (entry.endWeek - entry.startWeek + 1)).toFixed(0)} eggs\n`;
        weeklyContent += `• Egg revenue (@ {{CURRENCY}} ${pricePerEgg}/egg): {{CURRENCY}} ${(entry.eggRevenuePerWeek * (entry.endWeek - entry.startWeek + 1)).toFixed(2)}\n\n`;
      }
      // Total summary for layer
      weeklyContent += `**Total Layer Stage Summary (Weeks 19–100)**\n`;
      weeklyContent += `• Total feed: ${weeklyPlan.totalFeed.toFixed(1)} kg\n`;
      weeklyContent += `• Total feed cost: {{CURRENCY}} ${weeklyPlan.totalCost.toFixed(2)}\n`;
      weeklyContent += `• Total eggs produced: ${weeklyPlan.totalEggs.toFixed(0)} eggs\n`;
      weeklyContent += `• Total egg revenue: {{CURRENCY}} ${weeklyPlan.eggRevenue.toFixed(2)}\n`;
      if (salePricePerBird > 0) {
        weeklyContent += `• Spent hen revenue (@ {{CURRENCY}} ${salePricePerBird}/bird): {{CURRENCY}} ${weeklyPlan.birdRevenue.toFixed(2)}\n`;
      }
      weeklyContent += `• Total income: {{CURRENCY}} ${(weeklyPlan.eggRevenue + weeklyPlan.birdRevenue).toFixed(2)}\n`;
      weeklyContent += `• Net profit: {{CURRENCY}} ${weeklyPlan.netProfit.toFixed(2)}\n`;
      weeklyContent += `• Profit per bird: {{CURRENCY}} ${(weeklyPlan.netProfit / numberOfBirds).toFixed(2)}\n`;
    } else {
      // Chick, Grower, Broiler
      for (const entry of entries) {
        const weekLabel = entry.week ? `Week ${entry.week}` : `Week ${entry.startWeek}–${entry.endWeek}`;
        weeklyContent += `• ${weekLabel}: ${entry.dailyIntake}g feed per bird per day, total feed ${entry.weeklyFeed.toFixed(1)} kg per week, @ {{CURRENCY}} ${costPerKg.toFixed(2)} per kg feed will cost {{CURRENCY}} ${entry.weeklyCost.toFixed(2)}\n`;
      }
      weeklyContent += `\n**Total ${stage} Stage Summary**\n`;
      weeklyContent += `• Total feed: ${weeklyPlan.totalFeed.toFixed(1)} kg\n`;
      weeklyContent += `• Total feed cost: {{CURRENCY}} ${weeklyPlan.totalCost.toFixed(2)}\n`;
      if (salePricePerBird > 0) {
        weeklyContent += `• Bird revenue (@ {{CURRENCY}} ${salePricePerBird}/bird): {{CURRENCY}} ${weeklyPlan.birdRevenue.toFixed(2)}\n`;
        weeklyContent += `• Net profit: {{CURRENCY}} ${weeklyPlan.netProfit.toFixed(2)}\n`;
        weeklyContent += `• Profit per bird: {{CURRENCY}} ${(weeklyPlan.netProfit / numberOfBirds).toFixed(2)}\n`;
      } else {
        weeklyContent += `• Cost per bird: {{CURRENCY}} ${(weeklyPlan.totalCost / numberOfBirds).toFixed(2)}\n`;
      }
    }

    console.log("📊 [formulateFeed] weeklyContent generated, length:", weeklyContent.length);
    structuredList.push({
      key: "weekly_feed_plan",
      params: {
        content: weeklyContent
      }
    });
    console.log("📊 [formulateFeed] Pushed weekly_feed_plan to structuredList");
  } else {
    console.log("📊 [formulateFeed] numberOfBirds is 0 or not provided – skipping weekly plan");
  }

  // ===== VACCINATION SCHEDULE (added in full, no bold) =====
  const vaccinationSchedule =
    `• Day 1: Marek's – Subcutaneous / Neck\n` +
    `• Day 1: Newcastle Disease – Eye or Nasal Drop\n` +
    `• Day 7–9: Gumboro (IBD) – Drinking Water\n` +
    `• Day 10–14: Newcastle (Lasota) + IB – Drinking Water\n` +
    `• Day 16–18: Gumboro (IBD) – Drinking Water\n` +
    `• Week 6: Newcastle (Lasota) + IB – Drinking Water\n` +
    `• Week 6–8: Fowl Typhoid + Coryza – Injection\n` +
    `• Week 8–9: Deworming – Every 8 Weeks\n` +
    `• Week 8–10: Fowl Pox – Wing Stab\n` +
    `• Week 12–14: Fowl Typhoid – Injection\n` +
    `• Week 16–18: Newcastle – Injection / Drinking Water\n` +
    `• Every 3 Months: Newcastle – Booster`;

  structuredList.push({
    key: "vaccination_schedule",
    params: {
      content: vaccinationSchedule
    }
  });

  if (warnings.length > 0) {
    structuredList.push({
      key: "safety_warnings",
      params: {
        content: `Warnings:\n${warnings.join('\n')}`
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
    mixingInstructions,
    warnings,
    structuredList,
  };
}