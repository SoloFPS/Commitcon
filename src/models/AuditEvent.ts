import { Schema, model, models } from "mongoose";

const AuditEventSchema = new Schema({
  actorId: { type: Schema.Types.ObjectId, ref: "User" },
  actorOrgId: { type: Schema.Types.ObjectId, ref: "Organization" },
  actorRole: String,
  action: { type: String, required: true },
  resourceType: { type: String, required: true },
  resourceId: String,
  details: Schema.Types.Mixed,
}, { timestamps: true });

AuditEventSchema.index({ resourceType: 1, resourceId: 1 });
AuditEventSchema.index({ createdAt: -1 });

export const AuditEvent = models.AuditEvent || model("AuditEvent", AuditEventSchema);
