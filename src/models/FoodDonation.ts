import { Schema, model, models } from "mongoose";

const FoodDonationSchema = new Schema({
  donor: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  title: { type: String, required: true },
  description: String,
  category: { type: String, required: true },
  unit: { type: String, required: true, default: "kg" },
  totalQuantity: { type: Number, required: true, min: 0.01 },
  remainingQuantity: { type: Number, required: true, min: 0 }, // unreserved
  reservedQuantity: { type: Number, default: 0, min: 0 },
  dietary: { type: String, enum: ["VEG", "NON_VEG"], required: true },
  allergens: [String],
  storageRequirements: { type: String, enum: ["AMBIENT", "REFRIGERATED", "FROZEN", "HEATED"], default: "AMBIENT" },
  preparedAt: Date,
  expiryDate: Date,
  pickupDeadline: { type: Date, required: true },
  pickupAddress: String,
  pickupInstructions: String,
  status: {
    type: String,
    enum: ["AVAILABLE", "PARTIALLY_ALLOCATED", "ALLOCATED", "PICKED_UP", "DELIVERED", "EXPIRED", "WITHDRAWN"],
    default: "AVAILABLE",
    index: true,
  },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true },
  },
  isDemo: { type: Boolean, default: false },
}, { timestamps: true });

FoodDonationSchema.index({ status: 1, pickupDeadline: 1 });
FoodDonationSchema.index({ location: "2dsphere" });
FoodDonationSchema.index({ category: 1, dietary: 1 });

export const FoodDonation = models.FoodDonation || model("FoodDonation", FoodDonationSchema);
