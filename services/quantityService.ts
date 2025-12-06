

export interface Quantity {
  val: number;
  unit: string;
}

// Normalize units to standard codes
export const normalizeUnit = (u: string): string => {
  const unit = u.toLowerCase().replace('.', '').trim();
  if (['g', 'gram', 'grams', 'gms'].includes(unit)) return 'g';
  if (['kg', 'kilo', 'kilogram', 'kilograms'].includes(unit)) return 'kg';
  if (['ml', 'milliliter', 'milliliters'].includes(unit)) return 'ml';
  if (['l', 'liter', 'liters'].includes(unit)) return 'l';
  if (['lb', 'lbs', 'pound', 'pounds'].includes(unit)) return 'lb';
  if (['oz', 'ounce', 'ounces'].includes(unit)) return 'oz';
  if (['cup', 'cups'].includes(unit)) return 'cups';
  if (['tbsp', 'tablespoon', 'tablespoons'].includes(unit)) return 'tbsp';
  if (['tsp', 'teaspoon', 'teaspoons'].includes(unit)) return 'tsp';
  if (['pcs', 'pc', 'piece', 'pieces', 'whole'].includes(unit)) return 'pcs';
  return unit;
};

export const parseQuantity = (input: string): Quantity => {
  // Matches "200g", "200 g", "1.5 kg", "1/2 cup"
  const fractionMatch = input.match(/^(\d+)\/(\d+)\s*([a-zA-Z]+)?/);
  if (fractionMatch) {
    return {
      val: parseInt(fractionMatch[1]) / parseInt(fractionMatch[2]),
      unit: normalizeUnit(fractionMatch[3] || 'pcs')
    };
  }

  const match = input.match(/^([\d.]+)\s*([a-zA-Z%]+)?/);
  if (match) {
    return {
      val: parseFloat(match[1]),
      unit: normalizeUnit(match[2] || 'pcs')
    };
  }
  
  return { val: 1, unit: 'pcs' }; // Fallback
};

// Average weight per piece for common produce (in grams)
const AVG_PIECE_WEIGHT_G = 150; // ~150g is average for potato, onion, tomato, apple, etc.

// Format quantity nicely for display
const formatQuantity = (val: number): string => {
  if (Number.isInteger(val)) return val.toString();
  // Round to 1 decimal place and remove trailing .0
  return val.toFixed(1).replace(/\.0$/, '');
};

// Convert quantity to target unit (exported for merging)
export const convert = (q: Quantity, targetUnit: string): number | null => {
  const base = normalizeUnit(q.unit);
  const target = normalizeUnit(targetUnit);

  if (base === target) return q.val;

  // Mass conversions (base g)
  const massFactors: Record<string, number> = { g: 1, kg: 1000, oz: 28.3495, lb: 453.592 };
  if (massFactors[base] && massFactors[target]) {
    return (q.val * massFactors[base]) / massFactors[target];
  }

  // Volume conversions (base ml)
  const volFactors: Record<string, number> = { ml: 1, l: 1000, cups: 236.588, tbsp: 14.7868, tsp: 4.9289 };
  if (volFactors[base] && volFactors[target]) {
    return (q.val * volFactors[base]) / volFactors[target];
  }

  // Cross-type estimation: pcs <-> mass (useful when AI uses different units than pantry)
  // Convert pcs to grams first, then to target mass unit
  if (base === 'pcs' && massFactors[target]) {
    const gramsEquivalent = q.val * AVG_PIECE_WEIGHT_G;
    return gramsEquivalent / massFactors[target];
  }
  
  // Convert mass to pcs (estimate how many pieces the mass represents)
  if (massFactors[base] && target === 'pcs') {
    const gramsUsed = q.val * massFactors[base];
    return gramsUsed / AVG_PIECE_WEIGHT_G;
  }

  return null; // Incompatible (e.g., volume vs mass, or unknown units)
};

export const calculateNewInventory = (
  pantryQtyStr: string, 
  pantryUnit: string, 
  usedAmountStr: string
): { newQuantity: string, shouldRemove: boolean } => {
  
  const current = parseFloat(pantryQtyStr);
  const currentUnit = normalizeUnit(pantryUnit || 'pcs');
  
  const used = parseQuantity(usedAmountStr);
  
  // Try to convert used amount to pantry unit
  const usedValConverted = convert(used, currentUnit);

  let remaining: number;

  if (usedValConverted === null) {
    // Units truly incompatible (e.g., volume vs mass like "200 ml" vs "500 g")
    // Fallback: deduct 1 unit from pantry instead of removing entirely
    // This prevents accidental complete removal due to unit mismatch
    remaining = current - 1;
  } else {
    remaining = current - usedValConverted;
  }

  if (remaining <= 0 || remaining <= 0.05 * current) { 
    // If depleted or less than 5% remains, assume used up (margin of error)
    return { newQuantity: '0', shouldRemove: true };
  }

  // Format nicely
  const displayQty = Number.isInteger(remaining) ? remaining.toString() : remaining.toFixed(1).replace(/\.0$/, '');
  
  return { newQuantity: displayQty, shouldRemove: false };
};

// --- ROBUST LOW STOCK LOGIC ---
export const isLowStock = (quantity: string, unit: string, category: string): boolean => {
  const qty = parseFloat(quantity);
  if (isNaN(qty)) return false;
  const u = normalizeUnit(unit || 'pcs');

  // 1. Spices & Seasonings (Small quantities are normal)
  if (category === 'Spices') {
      if (['g', 'ml'].includes(u)) return qty <= 10; // Less than 10g is low
      if (['oz'].includes(u)) return qty <= 0.5;
      if (['tbsp'].includes(u)) return qty <= 1;
      return false; // Generally don't flag spices unless very specific
  }

  // 2. High Volume Items (Milk, Juice, Flour) - Beverages, Dairy, Grains
  if (['Dairy', 'Beverages', 'Grains'].includes(category)) {
      if (['ml', 'g'].includes(u)) return qty <= 250; // Less than a cup
      if (['l', 'kg'].includes(u)) return qty <= 0.25;
  }

  // 3. General Unit Thresholds
  if (['g', 'ml'].includes(u)) return qty <= 150; // Approx 1 small serving
  if (['kg', 'l'].includes(u)) return qty <= 0.2; // 200g/ml
  if (['lb'].includes(u)) return qty <= 0.5; // Half pound
  if (['oz'].includes(u)) return qty <= 6; 
  if (['cups', 'cup'].includes(u)) return qty <= 0.5;
  if (['tbsp'].includes(u)) return qty <= 2;
  if (['tsp'].includes(u)) return qty <= 5;
  
  // 4. Countable Items (pcs, cans, bottles)
  // 2 or fewer is generally "low" for staples like eggs, onions, cans
  return qty <= 2; 
};

// --- MERGE QUANTITIES FOR DUPLICATE DETECTION ---
/**
 * Merge two quantities, converting units if compatible.
 * Returns the merged quantity string in the first item's unit, or null if incompatible.
 */
export const mergeQuantities = (
  qty1: string, 
  unit1: string | undefined,
  qty2: string, 
  unit2: string | undefined
): string | null => {
  const u1 = normalizeUnit(unit1 || 'pcs');
  const u2 = normalizeUnit(unit2 || 'pcs');
  const val1 = parseFloat(qty1) || 0;
  const val2 = parseFloat(qty2) || 0;
  
  // Same unit - simple addition
  if (u1 === u2) {
    const sum = val1 + val2;
    return formatQuantity(sum);
  }
  
  // Try to convert qty2 to unit1
  const q2: Quantity = { val: val2, unit: u2 };
  const converted = convert(q2, u1);
  
  if (converted !== null) {
    const sum = val1 + converted;
    return formatQuantity(sum);
  }
  
  return null; // Incompatible units (e.g., volume vs mass)
};
