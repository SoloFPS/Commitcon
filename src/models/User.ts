import { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  name: { type: String, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["PROVIDER", "SHELTER", "ADMIN", "DELIVERY"], required: true },
  organization: { type: Schema.Types.ObjectId, ref: "Organization" },
  status: { type: String, enum: ["ACTIVE", "SUSPENDED"], default: "ACTIVE" },
}, { timestamps: true });

export const User = models.User || model("User", UserSchema);
