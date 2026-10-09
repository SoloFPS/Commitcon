import { Schema, model, models } from "mongoose";

export const OFFER_STATUSES = [
  "OFFER_PENDING",
  "ACCEPTED",
  "SCHEDULED",
  "PICKUP_CONFIRMED",
  "IN_TRANSIT",
  "DELIVERED",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
  "FAILED_DELIVERY",
] as const;

export type OfferStatus = typeof OFFER_STATUSES[number];

const OfferSchema = new Schema({
  donation: { type: Schema.Types.ObjectId, ref: "FoodDonation", required: true, index: true },
  donor: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  recipient: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  quantity: { type: Number, required: true, min: 0.01 },
  status: { type: String, enum: OFFER_STATUSES, default: "OFFER_PENDING", index: true },
  idempotencyKey: { type: String, required: true },
  cancellationReason: String,
  failureReason: String,
  pickupNotes: String,
  deliveryNotes: String,
  scheduledPickupTime: Date,
  proofOfDeliveryCode: { type: String, default: () => Math.floor(100000 + Math.random() * 900000).toString() },
  codeVerified: { type: Boolean, default: false },
  history: [{
    status: String,
    at: { type: Date, default: Date.now },
    by: Schema.Types.ObjectId,
    note: String,
  }],
  isDemo: { type: Boolean, default: false },
}, { timestamps: true });

OfferSchema.index({ donor: 1, idempotencyKey: 1 }, { unique: true });
OfferSchema.index({ recipient: 1, status: 1 });
OfferSchema.index({ donation: 1, status: 1 });

export const DonationOffer = models.DonationOffer || model("DonationOffer", OfferSchema);
