/**
 * FoodBridge Smart Matching Engine
 *
 * Implements deterministic eligibility filtering, multi-factor ranking,
 * safe delivery feasibility checks, and human-explainable match justifications.
 */

export interface DonorCandidate {
  id: string;
  name: string;
  location: { coordinates: [number, number] }; // [lng, lat]
  verificationStatus: string;
}

export interface FoodCandidate {
  id: string;
  title: string;
  category: string;
  unit: string;
  remainingQuantity: number;
  totalQuantity: number;
  dietary: "VEG" | "NON_VEG";
  allergens: string[];
  storageRequirements?: string;
  pickupDeadline: Date;
  location: { coordinates: [number, number] };
  donorId: string;
  donorName?: string;
}

export interface ShelterCandidate {
  id: string;
  name: string;
  location: { coordinates: [number, number] };
  verificationStatus: string;
  peopleServed?: number;
  capacityKg?: number;
  foodCategories: string[];
  dietaryRestrictions: string[];
  storageTypes?: string[];
  operatingHours?: { open: string; close: string };
}

export interface MatchScoreResult {
  eligible: boolean;
  score: number; // 0 - 100
  reason?: string;
  factors: {
    categoryFit: number; // 0 - 25
    expiryUrgency: number; // 0 - 25
    quantityFit: number; // 0 - 20
    distanceScore: number; // 0 - 20
    handlingScore: number; // 0 - 10
  };
  metrics: {
    distanceKm: number;
    hoursLeft: number;
    estimatedTransitMins: number;
    quantityRequestedOrAvailable: number;
  };
  explanations: string[];
  tradeoffs: string[];
}

// Configurable weights totaling 100
export const MATCH_WEIGHTS = {
  category: 25,
  urgency: 25,
  quantity: 20,
  proximity: 20,
  handling: 10,
} as const;

/**
 * Calculate Haversine straight-line distance in kilometers between two [lng, lat] coordinates.
 */
export function calculateHaversineDistanceKm(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Evaluates hard eligibility constraints for a food donation and a recipient shelter.
 * Hard constraints are evaluated BEFORE scoring. A high score never overrides an eligibility failure.
 */
export function checkEligibility(
  food: FoodCandidate,
  shelter: ShelterCandidate,
  now: Date = new Date()
): { eligible: boolean; reason?: string; distanceKm: number; hoursLeft: number } {
  const distanceKm = calculateHaversineDistanceKm(
    food.location.coordinates,
    shelter.location.coordinates
  );

  const hoursLeft = (new Date(food.pickupDeadline).getTime() - now.getTime()) / (1000 * 60 * 60);

  // 1. Verification requirement
  if (shelter.verificationStatus !== "VERIFIED") {
    return {
      eligible: false,
      reason: "Shelter registration is pending verification",
      distanceKm,
      hoursLeft,
    };
  }

  // 2. Deadline and expiry
  if (hoursLeft <= 0) {
    return {
      eligible: false,
      reason: "Donation pickup deadline has already passed",
      distanceKm,
      hoursLeft,
    };
  }

  // Minimum operational window: assume 25 km/h urban transit + 30 mins pickup/handover
  const transitHours = distanceKm / 25;
  const requiredOperationalWindow = transitHours + 0.5; // travel + 30 min buffer
  if (hoursLeft < requiredOperationalWindow) {
    return {
      eligible: false,
      reason: `Pickup deadline (${hoursLeft.toFixed(1)}h) too soon for safe transit (${transitHours.toFixed(1)}h travel + 30m prep required)`,
      distanceKm,
      hoursLeft,
    };
  }

  // 3. Availability check
  if (food.remainingQuantity <= 0) {
    return {
      eligible: false,
      reason: "No quantity remaining for this donation",
      distanceKm,
      hoursLeft,
    };
  }

  // 4. Dietary restrictions check
  const shelterDietary = (shelter.dietaryRestrictions || []).map((d) => d.toUpperCase());
  if (
    food.dietary === "NON_VEG" &&
    shelterDietary.some((r) => ["VEG", "VEGETARIAN", "JAIN", "PURE_VEG"].includes(r))
  ) {
    return {
      eligible: false,
      reason: `Dietary conflict: donation is non-vegetarian while shelter requires vegetarian`,
      distanceKm,
      hoursLeft,
    };
  }

  // 5. Allergens check
  const shelterAllergens = (shelter.dietaryRestrictions || [])
    .map((d) => d.toLowerCase().replace("no ", "").replace("free", "").trim());
  const allergenConflict = (food.allergens || []).find((a) =>
    shelterAllergens.includes(a.toLowerCase().trim())
  );
  if (allergenConflict) {
    return {
      eligible: false,
      reason: `Allergen conflict: donation contains ${allergenConflict}`,
      distanceKm,
      hoursLeft,
    };
  }

  return { eligible: true, distanceKm, hoursLeft };
}

/**
 * Computes an explainable ranking score between 0 and 100 for an eligible pair.
 */
export function scoreMatch(
  food: FoodCandidate,
  shelter: ShelterCandidate,
  now: Date = new Date()
): MatchScoreResult {
  const eligibility = checkEligibility(food, shelter, now);

  const explanations: string[] = [];
  const tradeoffs: string[] = [];

  const distanceKm = eligibility.distanceKm;
  const hoursLeft = eligibility.hoursLeft;
  const estimatedTransitMins = Math.round((distanceKm / 25) * 60);

  if (!eligibility.eligible) {
    return {
      eligible: false,
      score: 0,
      reason: eligibility.reason,
      factors: {
        categoryFit: 0,
        expiryUrgency: 0,
        quantityFit: 0,
        distanceScore: 0,
        handlingScore: 0,
      },
      metrics: {
        distanceKm,
        hoursLeft,
        estimatedTransitMins,
        quantityRequestedOrAvailable: food.remainingQuantity,
      },
      explanations: [],
      tradeoffs: [eligibility.reason || "Ineligible match"],
    };
  }

  // --- Factor 1: Category Match (Max 25) ---
  const acceptedCategories = (shelter.foodCategories || []).map((c) => c.toLowerCase());
  let categoryScore = 0;
  if (acceptedCategories.length === 0 || acceptedCategories.includes(food.category.toLowerCase())) {
    categoryScore = MATCH_WEIGHTS.category;
    explanations.push(`Direct food category match: ${food.category}`);
  } else {
    // Partial category match
    categoryScore = MATCH_WEIGHTS.category * 0.4;
    tradeoffs.push(`Category ${food.category} is not in shelter's primary preference list`);
  }

  // --- Factor 2: Expiry Urgency (Max 25) ---
  // Urgency curves: closer to deadline (between 2h and 24h) gets higher priority to prevent waste
  let urgencyScore = 0;
  if (hoursLeft <= 4) {
    urgencyScore = MATCH_WEIGHTS.urgency;
    explanations.push(`Critical expiry urgency: only ${hoursLeft.toFixed(1)}h remaining`);
  } else if (hoursLeft <= 12) {
    urgencyScore = MATCH_WEIGHTS.urgency * 0.85;
    explanations.push(`High urgency: expires within ${hoursLeft.toFixed(1)}h`);
  } else if (hoursLeft <= 24) {
    urgencyScore = MATCH_WEIGHTS.urgency * 0.65;
    explanations.push(`Standard window: ${hoursLeft.toFixed(1)}h to pickup`);
  } else {
    urgencyScore = MATCH_WEIGHTS.urgency * 0.45;
    tradeoffs.push(`Ample time until deadline (${hoursLeft.toFixed(0)}h); lower immediate urgency`);
  }

  // --- Factor 3: Quantity Fit (Max 20) ---
  // Ideal is when available quantity closely satisfies shelter needs or capacity
  let quantityScore = MATCH_WEIGHTS.quantity;
  const shelterCapacity = shelter.capacityKg || (shelter.peopleServed ? shelter.peopleServed * 0.5 : 50);
  const ratio = food.remainingQuantity / shelterCapacity;

  if (ratio >= 0.5 && ratio <= 1.5) {
    quantityScore = MATCH_WEIGHTS.quantity;
    explanations.push(`Optimal quantity fit: ${food.remainingQuantity} ${food.unit} matches shelter capacity (${shelterCapacity} kg)`);
  } else if (ratio < 0.5) {
    quantityScore = MATCH_WEIGHTS.quantity * 0.7;
    tradeoffs.push(`Partial portion: satisfies ~${Math.round(ratio * 100)}% of typical demand`);
  } else {
    quantityScore = MATCH_WEIGHTS.quantity * 0.8;
    explanations.push(`Surplus quantity: satisfies full demand with leftover`);
  }

  // --- Factor 4: Distance & Transit Feasibility (Max 20) ---
  // Closer is better. 0-5 km: 100%, 5-15 km: 80%, 15-30 km: 50%, >30 km: 25%
  let distanceScore = 0;
  if (distanceKm <= 5) {
    distanceScore = MATCH_WEIGHTS.proximity;
    explanations.push(`Close proximity: ~${distanceKm} km straight-line (est. ${estimatedTransitMins} mins)`);
  } else if (distanceKm <= 15) {
    distanceScore = MATCH_WEIGHTS.proximity * 0.8;
    explanations.push(`Feasible distance: ~${distanceKm} km straight-line`);
  } else if (distanceKm <= 30) {
    distanceScore = MATCH_WEIGHTS.proximity * 0.5;
    tradeoffs.push(`Moderate distance: ~${distanceKm} km straight-line transport required`);
  } else {
    distanceScore = Math.max(0, MATCH_WEIGHTS.proximity * (1 - distanceKm / 60));
    tradeoffs.push(`Long transport route: ~${distanceKm} km`);
  }

  // --- Factor 5: Handling & Storage (Max 10) ---
  let handlingScore = MATCH_WEIGHTS.handling;
  const requiredStorage = food.storageRequirements || "AMBIENT";
  const shelterStorage = (shelter.storageTypes || ["AMBIENT"]).map((s) => s.toUpperCase());

  if (shelterStorage.includes(requiredStorage.toUpperCase()) || requiredStorage === "AMBIENT") {
    handlingScore = MATCH_WEIGHTS.handling;
    explanations.push(`Compatible storage facilities (${requiredStorage})`);
  } else {
    handlingScore = MATCH_WEIGHTS.handling * 0.4;
    tradeoffs.push(`Shelter may lack specialized ${requiredStorage.toLowerCase()} storage`);
  }

  const totalScore = Math.round(
    categoryScore + urgencyScore + quantityScore + distanceScore + handlingScore
  );

  return {
    eligible: true,
    score: Math.min(100, Math.max(0, totalScore)),
    factors: {
      categoryFit: Math.round(categoryScore),
      expiryUrgency: Math.round(urgencyScore),
      quantityFit: Math.round(quantityScore),
      distanceScore: Math.round(distanceScore),
      handlingScore: Math.round(handlingScore),
    },
    metrics: {
      distanceKm,
      hoursLeft: Math.round(hoursLeft * 10) / 10,
      estimatedTransitMins,
      quantityRequestedOrAvailable: food.remainingQuantity,
    },
    explanations,
    tradeoffs,
  };
}
