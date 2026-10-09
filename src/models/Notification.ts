import { Schema, model, models } from "mongoose";

const NotificationSchema = new Schema({
  recipientOrg: { type: Schema.Types.ObjectId, ref: "Organization", index: true },
  recipientUser: { type: Schema.Types.ObjectId, ref: "User", index: true },
  forAdmin: { type: Boolean, default: false, index: true },
  type: {
    type: String,
    enum: [
      "ORGANIZATION_REGISTERED",
      "ORGANIZATION_VERIFIED",
      "ORGANIZATION_REJECTED",
      "NEW_MATCH",
      "OFFER_RECEIVED",
      "OFFER_ACCEPTED",
      "OFFER_REJECTED",
      "PICKUP_CONFIRMED",
      "DELIVERY_COMPLETED",
      "ALLOCATION_CANCELLED",
      "DELIVERY_FAILED",
      "EXPIRY_WARNING",
      "SYSTEM",
    ],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: String,
  read: { type: Boolean, default: false, index: true },
}, { timestamps: true });

NotificationSchema.index({ createdAt: -1 });

export const Notification = models.Notification || model("Notification", NotificationSchema);
