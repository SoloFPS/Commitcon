import { Schema, model, models } from "mongoose";

const OrganizationSchema = new Schema({
  name: { type: String, required: true, trim: true },
  kind: { type: String, enum: ["PROVIDER", "SHELTER", "ADMIN"], required: true },
  category: { type: String, required: true },
  contactName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, lowercase: true, trim: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  verificationStatus: { type: String, enum: ["PENDING", "VERIFIED", "REJECTED"], default: "PENDING" },
  verifiedAt: Date,
  verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
  verificationNotes: String,
  peopleServed: Number,
  foodCategories: [String],
  dietaryRestrictions: [String],
  operatingHours: {
    open: { type: String, default: "08:00" },
    close: { type: String, default: "20:00" },
  },
  capacityKg: Number,
  storageTypes: [String],
  isDemo: { type: Boolean, default: false },
}, { timestamps: true });

OrganizationSchema.index({ location: "2dsphere" });
OrganizationSchema.index({ kind: 1, verificationStatus: 1 });

export const Organization = models.Organization || model("Organization", OrganizationSchema);
