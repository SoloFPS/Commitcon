const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set. Please ensure .env.local exists.");
    process.exit(1);
  }

  console.log("Connecting to MongoDB for seeding...");
  await mongoose.connect(uri);

  const { Schema, model, models } = mongoose;

  // Clear existing demo records safely
  const OrgModel = models.Organization || model("Organization", new Schema({}, { strict: false }));
  const UserModel = models.User || model("User", new Schema({}, { strict: false }));
  const FoodModel = models.FoodDonation || model("FoodDonation", new Schema({}, { strict: false }));
  const OfferModel = models.DonationOffer || model("DonationOffer", new Schema({}, { strict: false }));
  const NotifModel = models.Notification || model("Notification", new Schema({}, { strict: false }));

  console.log("Cleaning up prior demo data...");
  await Promise.all([
    UserModel.deleteMany({ email: { $in: ["admin@foodbridge.org", "bistro@foodbridge.org", "hotel@foodbridge.org", "hope@foodbridge.org", "haven@foodbridge.org"] } }),
    OrgModel.deleteMany({ isDemo: true }),
    FoodModel.deleteMany({ isDemo: true }),
    OfferModel.deleteMany({ isDemo: true }),
    NotifModel.deleteMany({ forAdmin: true }),
  ]);

  const passwordHash = await bcrypt.hash("Provider@123456", 12);
  const adminPasswordHash = await bcrypt.hash("Admin@123456", 12);
  const shelterPasswordHash = await bcrypt.hash("Shelter@123456", 12);

  // 1. Create Organizations
  console.log("Creating Organizations...");
  const adminOrg = await OrgModel.create({
    name: "FoodBridge Headquarters",
    kind: "ADMIN",
    category: "Platform Administration",
    contactName: "Admin Operations",
    phone: "+1 800-555-0100",
    email: "admin@foodbridge.org",
    address: "100 Broadway",
    city: "New York",
    postalCode: "10005",
    location: { type: "Point", coordinates: [-74.0113, 40.7075] },
    verificationStatus: "VERIFIED",
    isDemo: true,
  });

  const bistroOrg = await OrgModel.create({
    name: "Green Leaf Bistro",
    kind: "PROVIDER",
    category: "Restaurant & Bakery",
    contactName: "Marco Rossi",
    phone: "+1 212-555-0145",
    email: "bistro@foodbridge.org",
    address: "350 5th Avenue",
    city: "New York",
    postalCode: "10118",
    location: { type: "Point", coordinates: [-73.9851, 40.7484] },
    verificationStatus: "VERIFIED",
    isDemo: true,
  });

  const hotelOrg = await OrgModel.create({
    name: "Grand Plaza Hotel & Banquets",
    kind: "PROVIDER",
    category: "Hotel & Catering",
    contactName: "Elena Vance",
    phone: "+1 212-555-0199",
    email: "hotel@foodbridge.org",
    address: "109 E 42nd St",
    city: "New York",
    postalCode: "10017",
    location: { type: "Point", coordinates: [-73.9772, 40.7527] },
    verificationStatus: "PENDING",
    isDemo: true,
  });

  const hopeOrg = await OrgModel.create({
    name: "Hope Community Kitchen",
    kind: "SHELTER",
    category: "Community Kitchen & Food Bank",
    contactName: "Sarah Jenkins",
    phone: "+1 212-555-0177",
    email: "hope@foodbridge.org",
    address: "240 W 23rd St",
    city: "New York",
    postalCode: "10011",
    location: { type: "Point", coordinates: [-73.9912, 40.741] },
    verificationStatus: "VERIFIED",
    peopleServed: 120,
    capacityKg: 100,
    foodCategories: ["Cooked Meals", "Bakery & Bread", "Fresh Produce & Fruit"],
    dietaryRestrictions: ["Vegetarian", "Nut-free"],
    operatingHours: { open: "08:00", close: "20:00" },
    isDemo: true,
  });

  const havenOrg = await OrgModel.create({
    name: "Safe Haven Youth Shelter",
    kind: "SHELTER",
    category: "Youth Shelter",
    contactName: "Marcus Brody",
    phone: "+1 212-555-0133",
    email: "haven@foodbridge.org",
    address: "415 E 64th St",
    city: "New York",
    postalCode: "10065",
    location: { type: "Point", coordinates: [-73.968, 40.76] },
    verificationStatus: "PENDING",
    peopleServed: 45,
    capacityKg: 40,
    foodCategories: ["Cooked Meals", "Dairy & Refrigerated"],
    dietaryRestrictions: [],
    operatingHours: { open: "09:00", close: "21:00" },
    isDemo: true,
  });

  // 2. Create Users
  console.log("Creating Users...");
  await UserModel.create([
    {
      name: "Platform Administrator",
      email: "admin@foodbridge.org",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      organization: adminOrg._id,
      status: "ACTIVE",
    },
    {
      name: "Marco Rossi (Chef)",
      email: "bistro@foodbridge.org",
      passwordHash,
      role: "PROVIDER",
      organization: bistroOrg._id,
      status: "ACTIVE",
    },
    {
      name: "Elena Vance (Manager)",
      email: "hotel@foodbridge.org",
      passwordHash,
      role: "PROVIDER",
      organization: hotelOrg._id,
      status: "ACTIVE",
    },
    {
      name: "Sarah Jenkins (Director)",
      email: "hope@foodbridge.org",
      passwordHash: shelterPasswordHash,
      role: "SHELTER",
      organization: hopeOrg._id,
      status: "ACTIVE",
    },
    {
      name: "Marcus Brody (Coordinator)",
      email: "haven@foodbridge.org",
      passwordHash: shelterPasswordHash,
      role: "SHELTER",
      organization: havenOrg._id,
      status: "ACTIVE",
    },
  ]);

  // 3. Create Food Donations
  console.log("Creating Food Donations...");
  const now = Date.now();

  const d1 = await FoodModel.create({
    donor: bistroOrg._id,
    title: "Fresh Artisan Sourdough & Croissants",
    description: "Daily surplus from afternoon bake, packed in food-grade bakery bags.",
    category: "Bakery & Bread",
    unit: "kg",
    totalQuantity: 24,
    remainingQuantity: 24,
    reservedQuantity: 0,
    dietary: "VEG",
    allergens: ["Gluten / Wheat"],
    storageRequirements: "AMBIENT",
    pickupDeadline: new Date(now + 14 * 3600 * 1000), // 14 hours ahead
    pickupAddress: "350 5th Avenue (Rear kitchen delivery entrance), New York",
    pickupInstructions: "Buzz bakery dispatch; ask for Marco.",
    status: "AVAILABLE",
    location: bistroOrg.location,
    isDemo: true,
  });

  const d2 = await FoodModel.create({
    donor: bistroOrg._id,
    title: "Vegetable Medley Pasta & Tomato Basil Sauce",
    description: "Cooked buffet surplus held at 65°C in catering thermal chafers.",
    category: "Cooked Meals",
    unit: "kg",
    totalQuantity: 30,
    remainingQuantity: 15,
    reservedQuantity: 15,
    dietary: "VEG",
    allergens: ["Gluten / Wheat"],
    storageRequirements: "HEATED",
    pickupDeadline: new Date(now + 6 * 3600 * 1000), // 6 hours ahead
    pickupAddress: "350 5th Avenue, New York",
    status: "PARTIALLY_ALLOCATED",
    location: bistroOrg.location,
    isDemo: true,
  });

  const d3 = await FoodModel.create({
    donor: bistroOrg._id,
    title: "Citrus Grilled Salmon Bowls & Brown Rice",
    description: "Chilled prepared salmon portions with steam greens.",
    category: "Cooked Meals",
    unit: "meals",
    totalQuantity: 25,
    remainingQuantity: 25,
    reservedQuantity: 0,
    dietary: "NON_VEG",
    allergens: ["Fish"],
    storageRequirements: "REFRIGERATED",
    pickupDeadline: new Date(now + 8 * 3600 * 1000), // 8 hours ahead
    pickupAddress: "350 5th Avenue, New York",
    status: "AVAILABLE",
    location: bistroOrg.location,
    isDemo: true,
  });

  // 4. Create Active Allocation Offer
  console.log("Creating Sample Active Allocation Offer...");
  await OfferModel.create({
    donation: d2._id,
    donor: bistroOrg._id,
    recipient: hopeOrg._id,
    quantity: 15,
    status: "ACCEPTED",
    idempotencyKey: "demo_offer_seed_001",
    proofOfDeliveryCode: "742189",
    history: [
      { status: "OFFER_PENDING", at: new Date(now - 3600 * 1000), note: "Offer created by Green Leaf Bistro" },
      { status: "ACCEPTED", at: new Date(now - 1800 * 1000), note: "Accepted by Hope Community Kitchen" },
    ],
    isDemo: true,
  });

  // 5. Create Initial Admin Notification
  await NotifModel.create({
    forAdmin: true,
    type: "ORGANIZATION_REGISTERED",
    title: "New Organization Registration",
    message: "Grand Plaza Hotel & Banquets registered and awaits verification.",
    link: "/admin/organizations",
  });

  console.log("\n==================================================");
  console.log("✅ FoodBridge Demo Database Seeded Successfully!");
  console.log("==================================================");
  console.log("Credentials for local evaluation:");
  console.log("  • Superadmin: admin@foodbridge.org    | Password: Admin@123456");
  console.log("  • Provider:   bistro@foodbridge.org   | Password: Provider@123456  (Verified)");
  console.log("  • Provider:   hotel@foodbridge.org    | Password: Provider@123456  (Pending)");
  console.log("  • Shelter:    hope@foodbridge.org     | Password: Shelter@123456   (Verified)");
  console.log("  • Shelter:    haven@foodbridge.org    | Password: Shelter@123456   (Pending)");
  console.log("==================================================\n");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
