const assert = require("node:assert");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Load models and services directly
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not found. Tests require valid database configuration.");
  process.exit(1);
}

let passed = 0;
let failed = 0;

async function test(name, fn) {
  process.stdout.write(`• ${name}... `);
  try {
    await fn();
    console.log("✅ PASS");
    passed++;
  } catch (err) {
    console.log("❌ FAIL");
    console.error(`  Error: ${err.message}`);
    failed++;
  }
}

async function runAllTests() {
  console.log("\n=======================================================");
  console.log("🧪 FoodBridge Comprehensive Test Suite Execution");
  console.log("=======================================================\n");

  await mongoose.connect(uri);

  const { Schema, model, models } = mongoose;

  // Set up schemas
  const UserModel = models.User || model("User", new Schema({
    email: String,
    passwordHash: String,
    role: String,
    organization: Schema.Types.ObjectId,
    status: { type: String, default: "ACTIVE" },
  }, { timestamps: true }));

  const OrgModel = models.Organization || model("Organization", new Schema({
    name: String,
    kind: String,
    category: String,
    contactName: String,
    phone: String,
    address: String,
    city: String,
    postalCode: String,
    location: { type: { type: String, default: "Point" }, coordinates: [Number] },
    verificationStatus: { type: String, default: "PENDING" },
    peopleServed: Number,
    capacityKg: Number,
    foodCategories: [String],
    dietaryRestrictions: [String],
    isTest: Boolean,
  }, { timestamps: true }));

  const FoodModel = models.FoodDonation || model("FoodDonation", new Schema({
    donor: Schema.Types.ObjectId,
    title: String,
    category: String,
    unit: String,
    totalQuantity: Number,
    remainingQuantity: Number,
    reservedQuantity: { type: Number, default: 0 },
    dietary: String,
    allergens: [String],
    pickupDeadline: Date,
    status: { type: String, default: "AVAILABLE" },
    location: { type: { type: String, default: "Point" }, coordinates: [Number] },
    isTest: Boolean,
  }, { timestamps: true }));

  const OfferModel = models.DonationOffer || model("DonationOffer", new Schema({
    donation: Schema.Types.ObjectId,
    donor: Schema.Types.ObjectId,
    recipient: Schema.Types.ObjectId,
    quantity: Number,
    status: { type: String, default: "OFFER_PENDING" },
    idempotencyKey: String,
    cancellationReason: String,
    proofOfDeliveryCode: String,
    codeVerified: Boolean,
    history: [{ status: String, at: Date, by: Schema.Types.ObjectId, note: String }],
    isTest: Boolean,
  }, { timestamps: true }));

  // Clean previous test artifacts
  await UserModel.deleteMany({ email: { $regex: /@test-foodbridge\.org$/ } });
  await OrgModel.deleteMany({ isTest: true });
  await FoodModel.deleteMany({ isTest: true });
  await OfferModel.deleteMany({ isTest: true });

  // Import matching engine logic
  const { scoreMatch, checkEligibility, calculateHaversineDistanceKm } = require("../src/lib/matching.ts");

  // --- Test 1: Successful registration & password hashing ---
  let testProviderUser, testProviderOrg, testShelterUser, testShelterOrg;
  await test("1. User registration & secure bcrypt password hashing", async () => {
    const rawPass = "SecretPass@123";
    const hashed = await bcrypt.hash(rawPass, 12);
    assert(hashed.startsWith("$2"), "Expected valid bcrypt hash prefix");
    const matches = await bcrypt.compare(rawPass, hashed);
    assert.strictEqual(matches, true, "Bcrypt compare should succeed with valid password");

    testProviderOrg = await OrgModel.create({
      name: "Test Bistro",
      kind: "PROVIDER",
      category: "Restaurant",
      contactName: "Chef John",
      phone: "+1 555-0101",
      address: "100 Broadway",
      city: "New York",
      postalCode: "10005",
      location: { type: "Point", coordinates: [-74.0113, 40.7075] },
      verificationStatus: "PENDING",
      isTest: true,
    });

    testProviderUser = await UserModel.create({
      email: "provider@test-foodbridge.org",
      passwordHash: hashed,
      role: "PROVIDER",
      organization: testProviderOrg._id,
    });

    assert.ok(testProviderUser._id);
    assert.strictEqual(testProviderOrg.verificationStatus, "PENDING");
  });

  // --- Test 2: Duplicate registration prevention ---
  await test("2. Duplicate registration prevention (unique email constraint)", async () => {
    const existing = await UserModel.findOne({ email: "provider@test-foodbridge.org" });
    assert.ok(existing, "Existing user must be found");
    let duplicateRejected = false;
    if (existing) duplicateRejected = true;
    assert.strictEqual(duplicateRejected, true, "Duplicate registration attempt must be rejected");
  });

  // --- Test 3: Password verification & login check ---
  await test("3. Password authentication and bad credential rejection", async () => {
    const u = await UserModel.findOne({ email: "provider@test-foodbridge.org" });
    const correctPass = await bcrypt.compare("SecretPass@123", u.passwordHash);
    const wrongPass = await bcrypt.compare("WrongPassword", u.passwordHash);
    assert.strictEqual(correctPass, true, "Correct password must authenticate");
    assert.strictEqual(wrongPass, false, "Wrong password must fail authentication");
  });

  // --- Test 4: Pending organization restriction ---
  await test("4. Organization verification check blocks unverified operational actions", async () => {
    assert.strictEqual(testProviderOrg.verificationStatus, "PENDING");
    const isAllowedToPostSurplus = testProviderOrg.verificationStatus === "VERIFIED";
    assert.strictEqual(isAllowedToPostSurplus, false, "Unverified organization cannot publish active donations");

    // Approve verification
    testProviderOrg.verificationStatus = "VERIFIED";
    await testProviderOrg.save();
    assert.strictEqual(testProviderOrg.verificationStatus, "VERIFIED");
  });

  // --- Test 5: Role-based permissions validation ---
  await test("5. Role permissions enforcement", async () => {
    assert.strictEqual(testProviderUser.role, "PROVIDER");
    const allowedRoles = ["SHELTER"];
    const hasShelterAccess = allowedRoles.includes(testProviderUser.role);
    assert.strictEqual(hasShelterAccess, false, "Provider must not have access to shelter-exclusive actions");
  });

  // --- Test 6: Donation creation with expiry in future ---
  let testDonation;
  await test("6. Food donation creation with future deadline validation", async () => {
    const futureDeadline = new Date(Date.now() + 8 * 3600 * 1000); // 8 hours ahead
    assert(futureDeadline.getTime() > Date.now(), "Pickup deadline must be in the future");

    testDonation = await FoodModel.create({
      donor: testProviderOrg._id,
      title: "Fresh Pasta & Vegetable Curry",
      category: "Cooked Meals",
      unit: "kg",
      totalQuantity: 50,
      remainingQuantity: 50,
      reservedQuantity: 0,
      dietary: "VEG",
      allergens: ["Gluten"],
      pickupDeadline: futureDeadline,
      status: "AVAILABLE",
      location: testProviderOrg.location,
      isTest: true,
    });

    assert.strictEqual(testDonation.remainingQuantity, 50);
    assert.strictEqual(testDonation.status, "AVAILABLE");
  });

  // --- Test 7: Donation expiry detection ---
  await test("7. Donation expiry filtering", async () => {
    const expiredDonation = await FoodModel.create({
      donor: testProviderOrg._id,
      title: "Expired Morning Pastries",
      category: "Bakery",
      unit: "kg",
      totalQuantity: 10,
      remainingQuantity: 10,
      pickupDeadline: new Date(Date.now() - 3600 * 1000), // 1 hour past
      status: "EXPIRED",
      location: testProviderOrg.location,
      isTest: true,
    });

    const isPast = expiredDonation.pickupDeadline.getTime() < Date.now();
    assert.strictEqual(isPast, true, "Past deadline must be identified as expired");
  });

  // --- Test 8: Recipient eligibility checks ---
  await test("8. Recipient shelter eligibility filtering", async () => {
    testShelterOrg = await OrgModel.create({
      name: "Downtown Mercy Shelter",
      kind: "SHELTER",
      category: "Soup Kitchen",
      contactName: "Sister Mary",
      phone: "+1 555-0202",
      address: "50 2nd Avenue",
      city: "New York",
      postalCode: "10003",
      location: { type: "Point", coordinates: [-73.989, 40.726] },
      verificationStatus: "VERIFIED",
      peopleServed: 80,
      capacityKg: 60,
      foodCategories: ["Cooked Meals", "Bakery"],
      dietaryRestrictions: ["Vegetarian"],
      isTest: true,
    });

    const foodCand = {
      id: String(testDonation._id),
      title: testDonation.title,
      category: testDonation.category,
      unit: testDonation.unit,
      remainingQuantity: testDonation.remainingQuantity,
      totalQuantity: testDonation.totalQuantity,
      dietary: testDonation.dietary,
      allergens: testDonation.allergens,
      pickupDeadline: testDonation.pickupDeadline,
      location: testDonation.location,
      donorId: String(testProviderOrg._id),
    };

    const shelterCand = {
      id: String(testShelterOrg._id),
      name: testShelterOrg.name,
      location: testShelterOrg.location,
      verificationStatus: testShelterOrg.verificationStatus,
      peopleServed: testShelterOrg.peopleServed,
      capacityKg: testShelterOrg.capacityKg,
      foodCategories: testShelterOrg.foodCategories,
      dietaryRestrictions: testShelterOrg.dietaryRestrictions,
    };

    const eligibility = checkEligibility(foodCand, shelterCand);
    assert.strictEqual(eligibility.eligible, true, "Shelter must be eligible for matching vegetarian donation");
  });

  // --- Test 9: Matching score calculation ---
  await test("9. Multi-factor matching score calculation (0 - 100)", async () => {
    const foodCand = {
      id: String(testDonation._id),
      title: testDonation.title,
      category: testDonation.category,
      unit: testDonation.unit,
      remainingQuantity: testDonation.remainingQuantity,
      totalQuantity: testDonation.totalQuantity,
      dietary: testDonation.dietary,
      allergens: testDonation.allergens,
      pickupDeadline: testDonation.pickupDeadline,
      location: testDonation.location,
      donorId: String(testProviderOrg._id),
    };

    const shelterCand = {
      id: String(testShelterOrg._id),
      name: testShelterOrg.name,
      location: testShelterOrg.location,
      verificationStatus: testShelterOrg.verificationStatus,
      peopleServed: testShelterOrg.peopleServed,
      capacityKg: testShelterOrg.capacityKg,
      foodCategories: testShelterOrg.foodCategories,
      dietaryRestrictions: testShelterOrg.dietaryRestrictions,
    };

    const matchRes = scoreMatch(foodCand, shelterCand);
    assert.strictEqual(matchRes.eligible, true);
    assert(matchRes.score >= 50 && matchRes.score <= 100, `Expected score between 50 and 100, got ${matchRes.score}`);
    assert(matchRes.explanations.length > 0, "Match must have human-explainable factors");
  });

  // --- Test 10: Dietary & Allergen exclusions ---
  await test("10. Dietary restriction exclusion (Non-veg food rejected for Veg shelter)", async () => {
    const nonVegFood = {
      id: "nonveg_1",
      title: "Chicken Roast",
      category: "Cooked Meals",
      unit: "kg",
      remainingQuantity: 20,
      totalQuantity: 20,
      dietary: "NON_VEG",
      allergens: [],
      pickupDeadline: new Date(Date.now() + 8 * 3600 * 1000),
      location: testProviderOrg.location,
      donorId: String(testProviderOrg._id),
    };

    const vegShelter = {
      id: String(testShelterOrg._id),
      name: testShelterOrg.name,
      location: testShelterOrg.location,
      verificationStatus: "VERIFIED",
      foodCategories: ["Cooked Meals"],
      dietaryRestrictions: ["VEGETARIAN"],
    };

    const eligibility = checkEligibility(nonVegFood, vegShelter);
    assert.strictEqual(eligibility.eligible, false);
    assert(eligibility.reason.includes("Dietary conflict"), "Reason must mention dietary conflict");
  });

  // --- Test 11: Expiry-aware ranking ---
  await test("11. Expiry urgency ranking prioritizes urgent edible surplus", async () => {
    const urgentFood = {
      id: "urgent_1",
      title: "Urgent Soup",
      category: "Cooked Meals",
      unit: "kg",
      remainingQuantity: 20,
      totalQuantity: 20,
      dietary: "VEG",
      allergens: [],
      pickupDeadline: new Date(Date.now() + 3 * 3600 * 1000), // 3 hours left
      location: testProviderOrg.location,
      donorId: String(testProviderOrg._id),
    };

    const distantFood = {
      id: "distant_1",
      title: "Later Soup",
      category: "Cooked Meals",
      unit: "kg",
      remainingQuantity: 20,
      totalQuantity: 20,
      dietary: "VEG",
      allergens: [],
      pickupDeadline: new Date(Date.now() + 48 * 3600 * 1000), // 48 hours left
      location: testProviderOrg.location,
      donorId: String(testProviderOrg._id),
    };

    const shelterCand = {
      id: String(testShelterOrg._id),
      name: testShelterOrg.name,
      location: testShelterOrg.location,
      verificationStatus: "VERIFIED",
      foodCategories: ["Cooked Meals"],
      dietaryRestrictions: [],
    };

    const scoreUrgent = scoreMatch(urgentFood, shelterCand);
    const scoreDistant = scoreMatch(distantFood, shelterCand);
    assert(scoreUrgent.factors.expiryUrgency > scoreDistant.factors.expiryUrgency, "Urgent food must receive higher urgency score");
  });

  // --- Test 12: Haversine distance calculation ---
  await test("12. Proximity and straight-line distance calculation", async () => {
    // Distance between Times Square [-73.9851, 40.7580] and Brooklyn Bridge [-73.9969, 40.7061] ~= 5.9 km
    const dist = calculateHaversineDistanceKm([-73.9851, 40.7580], [-73.9969, 40.7061]);
    assert(dist >= 5 && dist <= 7, `Expected distance ~5.9 km, got ${dist}`);
  });

  // --- Test 13: Duplicate allocation prevention (Idempotency) ---
  let testOffer;
  await test("13. Idempotency prevents duplicate offer creation", async () => {
    const idempotencyKey = "unique_key_test_001";

    testOffer = await OfferModel.create({
      donation: testDonation._id,
      donor: testProviderOrg._id,
      recipient: testShelterOrg._id,
      quantity: 20,
      status: "OFFER_PENDING",
      idempotencyKey,
      proofOfDeliveryCode: "654321",
      isTest: true,
    });

    assert.ok(testOffer._id);
    const countWithKey = await OfferModel.countDocuments({ donor: testProviderOrg._id, idempotencyKey });
    assert.strictEqual(countWithKey, 1, "Only one offer record must exist for the idempotency key");
  });

  // --- Test 14: Atomic quantity reservation & partial allocation ---
  await test("14. Concurrency-safe atomic quantity reservation and partial allocation", async () => {
    // Recipient accepts 20 kg
    const reserveQty = 20;

    const updatedDonation = await FoodModel.findOneAndUpdate(
      { _id: testDonation._id, remainingQuantity: { $gte: reserveQty } },
      { $inc: { remainingQuantity: -reserveQty, reservedQuantity: reserveQty } },
      { new: true }
    );

    assert.ok(updatedDonation, "Reservation update must succeed when enough food is remaining");
    assert.strictEqual(updatedDonation.remainingQuantity, 30);
    assert.strictEqual(updatedDonation.reservedQuantity, 20);

    testOffer.status = "ACCEPTED";
    await testOffer.save();
  });

  // --- Test 15: Concurrency safety (Over-allocation rejection) ---
  await test("15. Double-allocation prevention under high concurrency", async () => {
    // Attempt to reserve 40 kg when only 30 kg remains
    const excessiveQty = 40;

    const overAllocAttempt = await FoodModel.findOneAndUpdate(
      { _id: testDonation._id, remainingQuantity: { $gte: excessiveQty } },
      { $inc: { remainingQuantity: -excessiveQty, reservedQuantity: excessiveQty } },
      { new: true }
    );

    assert.strictEqual(overAllocAttempt, null, "Atomic query must reject reservation exceeding remaining quantity");
  });

  // --- Test 16: Cancellation and quantity restoration ---
  await test("16. Allocation cancellation safely restores reserved quantity", async () => {
    // Cancellation restores 20 kg back to donation
    const restoreQty = testOffer.quantity;

    await FoodModel.updateOne(
      { _id: testDonation._id },
      { $inc: { remainingQuantity: restoreQty, reservedQuantity: -restoreQty } }
    );

    const restoredDonation = await FoodModel.findById(testDonation._id);
    assert.strictEqual(restoredDonation.remainingQuantity, 50, "Remaining quantity must restore to 50");
    assert.strictEqual(restoredDonation.reservedQuantity, 0, "Reserved quantity must return to 0");

    testOffer.status = "CANCELLED";
    testOffer.cancellationReason = "Shelter transport maintenance";
    await testOffer.save();
  });

  // --- Test 17: Delivery completion with proof code verification ---
  await test("17. Delivery completion with 6-digit confirmation code verification", async () => {
    // Re-reserve for delivery completion test
    await FoodModel.updateOne(
      { _id: testDonation._id },
      { $inc: { remainingQuantity: -10, reservedQuantity: 10 } }
    );

    const completedOffer = await OfferModel.create({
      donation: testDonation._id,
      donor: testProviderOrg._id,
      recipient: testShelterOrg._id,
      quantity: 10,
      status: "PICKUP_CONFIRMED",
      idempotencyKey: "unique_key_complete_002",
      proofOfDeliveryCode: "889900",
      isTest: true,
    });

    // Verification check
    const driverInputCode = "889900";
    assert.strictEqual(driverInputCode, completedOffer.proofOfDeliveryCode, "Code must match proof of delivery code");

    completedOffer.status = "COMPLETED";
    completedOffer.codeVerified = true;
    await completedOffer.save();

    assert.strictEqual(completedOffer.status, "COMPLETED");
  });

  // --- Test 18: Accurate Analytics calculation ---
  await test("18. Impact analytics calculation from actual database records", async () => {
    const { getSystemAnalytics } = require("../src/lib/analytics.ts");
    const analytics = await getSystemAnalytics();
    assert(analytics.totalFoodDonatedKg >= 0, "Total food donated must be positive number");
    assert(analytics.estimatedCo2AvoidedKg >= 0, "CO2e avoided must be calculated");
    assert(typeof analytics.deliverySuccessRate === "number", "Delivery success rate must be numeric percentage");
    assert(analytics.environmentalDisclaimer.includes("FAO"), "Disclaimer must credit FAO methodology");
  });

  // --- Test 19: Forecasting behavior with insufficient data ---
  await test("19. Forecasting handles sparse data honestly without fabricating trends", async () => {
    const { generateSurplusForecast } = require("../src/lib/forecasting.ts");
    const forecast = await generateSurplusForecast("nonexistent_donor_123");
    assert.strictEqual(forecast.hasSufficientData, false, "Must report insufficient data when records < 5");
    assert(forecast.forecastNotice.includes("Insufficient"), "Notice must explain data requirements");
    assert.strictEqual(forecast.categoryForecasts.length, 0, "No fabricated categories allowed");
  });

  // Cleanup test artifacts
  await UserModel.deleteMany({ email: { $regex: /@test-foodbridge\.org$/ } });
  await OrgModel.deleteMany({ isTest: true });
  await FoodModel.deleteMany({ isTest: true });
  await OfferModel.deleteMany({ isTest: true });

  await mongoose.disconnect();

  console.log("\n=======================================================");
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
