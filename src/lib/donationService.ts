import mongoose from "mongoose";
import { FoodDonation } from "@/models/FoodDonation";
import { DonationOffer, OFFER_STATUSES, OfferStatus } from "@/models/DonationOffer";
import { Notification } from "@/models/Notification";
import { AuditEvent } from "@/models/AuditEvent";

export type Action =
  | "ACCEPT"
  | "REJECT"
  | "CANCEL"
  | "SCHEDULE"
  | "CONFIRM_PICKUP"
  | "COMPLETE"
  | "FAIL_DELIVERY";

export type Actor = {
  orgId: string;
  role: "PROVIDER" | "SHELTER" | "ADMIN" | "DELIVERY";
  userId: string;
};

const RULES: Record<
  Action,
  {
    from: string[];
    to: OfferStatus;
    by: "PROVIDER" | "SHELTER" | "ADMIN" | "DELIVERY" | "EITHER";
  }
> = {
  ACCEPT: { from: ["OFFER_PENDING"], to: "ACCEPTED", by: "SHELTER" },
  REJECT: { from: ["OFFER_PENDING"], to: "REJECTED", by: "SHELTER" },
  CANCEL: {
    from: ["OFFER_PENDING", "ACCEPTED", "SCHEDULED"],
    to: "CANCELLED",
    by: "EITHER",
  },
  SCHEDULE: { from: ["ACCEPTED"], to: "SCHEDULED", by: "EITHER" },
  CONFIRM_PICKUP: {
    from: ["ACCEPTED", "SCHEDULED"],
    to: "PICKUP_CONFIRMED",
    by: "PROVIDER",
  },
  COMPLETE: {
    from: ["PICKUP_CONFIRMED", "IN_TRANSIT", "SCHEDULED", "ACCEPTED"],
    to: "COMPLETED",
    by: "SHELTER",
  },
  FAIL_DELIVERY: {
    from: ["SCHEDULED", "PICKUP_CONFIRMED", "IN_TRANSIT"],
    to: "FAILED_DELIVERY",
    by: "EITHER",
  },
};

export class ServiceError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ServiceError";
  }
}

/**
 * Creates an allocation offer from a provider to a recipient shelter.
 * Concurrency safe and idempotency-protected.
 */
export async function createOffer(
  actor: Actor,
  input: {
    donationId: string;
    recipientId: string;
    quantity: number;
    idempotencyKey: string;
    scheduledPickupTime?: Date;
    pickupNotes?: string;
  }
) {
  if (actor.role !== "PROVIDER" && actor.role !== "ADMIN") {
    throw new ServiceError(403, "Only providers or admins can create donation offers");
  }

  const donation = await FoodDonation.findOne({
    _id: input.donationId,
    ...(actor.role === "ADMIN" ? {} : { donor: actor.orgId }),
    status: { $in: ["AVAILABLE", "PARTIALLY_ALLOCATED"] },
    pickupDeadline: { $gt: new Date() },
  });

  if (!donation) {
    throw new ServiceError(404, "Donation listing not found or no longer available for offers");
  }

  if (input.quantity > donation.remainingQuantity) {
    throw new ServiceError(
      409,
      `Requested quantity (${input.quantity}) exceeds remaining available food (${donation.remainingQuantity} ${donation.unit})`
    );
  }

  try {
    const offer = await DonationOffer.create({
      donation: donation._id,
      donor: donation.donor,
      recipient: input.recipientId,
      quantity: input.quantity,
      idempotencyKey: input.idempotencyKey,
      scheduledPickupTime: input.scheduledPickupTime,
      pickupNotes: input.pickupNotes,
      history: [{ status: "OFFER_PENDING", by: actor.userId, note: "Offer created" }],
    });

    // Notify recipient
    await Notification.create({
      recipientOrg: input.recipientId,
      type: "OFFER_RECEIVED",
      title: "New Surplus Food Offer",
      message: `You received an offer for ${input.quantity} ${donation.unit} of "${donation.title}".`,
      link: `/shelter/requests`,
    });

    // Audit log
    await AuditEvent.create({
      actorId: actor.userId,
      actorOrgId: actor.orgId,
      actorRole: actor.role,
      action: "CREATE_OFFER",
      resourceType: "DonationOffer",
      resourceId: String(offer._id),
      details: { donationId: String(donation._id), quantity: input.quantity },
    });

    return offer;
  } catch (e: any) {
    if (e?.code === 11000) {
      return DonationOffer.findOne({ donor: donation.donor, idempotencyKey: input.idempotencyKey });
    }
    throw e;
  }
}

/**
 * Creates an allocation request initiated by a shelter for available food.
 */
export async function requestDonation(
  actor: Actor,
  input: {
    donationId: string;
    quantity: number;
    notes?: string;
    idempotencyKey: string;
  }
) {
  if (actor.role !== "SHELTER") {
    throw new ServiceError(403, "Only verified shelters can request donations");
  }

  const donation = await FoodDonation.findOne({
    _id: input.donationId,
    status: { $in: ["AVAILABLE", "PARTIALLY_ALLOCATED"] },
    pickupDeadline: { $gt: new Date() },
  });

  if (!donation) {
    throw new ServiceError(404, "Donation not found or deadline has passed");
  }

  if (input.quantity > donation.remainingQuantity) {
    throw new ServiceError(
      409,
      `Quantity requested (${input.quantity}) exceeds remaining available (${donation.remainingQuantity} ${donation.unit})`
    );
  }

  try {
    const offer = await DonationOffer.create({
      donation: donation._id,
      donor: donation.donor,
      recipient: actor.orgId,
      quantity: input.quantity,
      idempotencyKey: input.idempotencyKey,
      deliveryNotes: input.notes,
      history: [{ status: "OFFER_PENDING", by: actor.userId, note: "Requested by shelter" }],
    });

    // Notify donor
    await Notification.create({
      recipientOrg: donation.donor,
      type: "OFFER_RECEIVED",
      title: "New Allocation Request",
      message: `A shelter requested ${input.quantity} ${donation.unit} of "${donation.title}".`,
      link: `/restaurant/donations/${donation._id}`,
    });

    return offer;
  } catch (e: any) {
    if (e?.code === 11000) {
      return DonationOffer.findOne({ recipient: actor.orgId, idempotencyKey: input.idempotencyKey });
    }
    throw e;
  }
}

/**
 * Transitions offer status with atomic reservations and cancellation restorations.
 * Works seamlessly across both Replica Sets and Standalone deployments.
 */
export async function transitionOffer(
  actor: Actor,
  offerId: string,
  action: Action,
  extra?: {
    reason?: string;
    scheduledPickupTime?: Date;
    proofOfDeliveryCode?: string;
    deliveryNotes?: string;
  }
) {
  const rule = RULES[action];
  if (!rule) throw new ServiceError(400, `Unknown action ${action}`);

  if (
    rule.by !== "EITHER" &&
    rule.by !== actor.role &&
    actor.role !== "ADMIN"
  ) {
    throw new ServiceError(403, `Action ${action} is not permitted for your role (${actor.role})`);
  }

  const offer = await DonationOffer.findById(offerId);
  if (!offer) throw new ServiceError(404, "Allocation record not found");

  const isDonor = String(offer.donor) === actor.orgId;
  const isRecipient = String(offer.recipient) === actor.orgId;
  const isAdmin = actor.role === "ADMIN";

  if (!isDonor && !isRecipient && !isAdmin && actor.role !== "DELIVERY") {
    throw new ServiceError(404, "Allocation record not found");
  }

  if (["ACCEPT", "REJECT"].includes(action) && !isRecipient && !isAdmin) {
    throw new ServiceError(403, "Only the recipient organization can accept or reject this offer");
  }

  if (action === "CONFIRM_PICKUP" && !isDonor && !isAdmin && actor.role !== "DELIVERY") {
    throw new ServiceError(403, "Only the donor organization can confirm handover/pickup");
  }

  // Check state transition validity
  if (!rule.from.includes(offer.status)) {
    throw new ServiceError(
      409,
      `Cannot execute ${action} on an allocation currently in status ${offer.status}`
    );
  }

  // Proof of delivery verification if completing
  if (action === "COMPLETE" && extra?.proofOfDeliveryCode) {
    if (extra.proofOfDeliveryCode.trim() !== offer.proofOfDeliveryCode) {
      throw new ServiceError(400, "Invalid proof-of-delivery confirmation code");
    }
  }

  // Concurrency-safe execution: try session transaction first, fallback to atomic operations if standalone
  let useTransactions = true;
  let session: mongoose.ClientSession | null = null;

  try {
    session = await mongoose.startSession();
  } catch {
    useTransactions = false;
  }

  try {
    const execute = async (sess: mongoose.ClientSession | null) => {
      const opts = sess ? { session: sess, new: true } : { new: true };

      // 1. Guarded update on Offer status
      const updatedOffer = await DonationOffer.findOneAndUpdate(
        { _id: offerId, status: { $in: rule.from } },
        {
          $set: {
            status: rule.to,
            ...(action === "CANCEL" ? { cancellationReason: extra?.reason } : {}),
            ...(action === "FAIL_DELIVERY" ? { failureReason: extra?.reason } : {}),
            ...(action === "SCHEDULE" && extra?.scheduledPickupTime
              ? { scheduledPickupTime: extra.scheduledPickupTime }
              : {}),
            ...(action === "COMPLETE"
              ? { codeVerified: true, deliveryNotes: extra?.deliveryNotes }
              : {}),
          },
          $push: {
            history: {
              status: rule.to,
              by: actor.userId,
              note: extra?.reason || extra?.deliveryNotes || `Transitioned to ${rule.to}`,
            },
          },
        },
        opts
      );

      if (!updatedOffer) {
        throw new ServiceError(
          409,
          `Cannot ${action} allocation; state has changed concurrently (currently ${offer.status})`
        );
      }

      // 2. Quantity reservation on ACCEPT
      if (action === "ACCEPT") {
        const donationDoc = await FoodDonation.findOneAndUpdate(
          {
            _id: offer.donation,
            status: { $in: ["AVAILABLE", "PARTIALLY_ALLOCATED"] },
            pickupDeadline: { $gt: new Date() },
            remainingQuantity: { $gte: offer.quantity },
          },
          {
            $inc: { remainingQuantity: -offer.quantity, reservedQuantity: offer.quantity },
          },
          opts
        );

        if (!donationDoc) {
          throw new ServiceError(
            409,
            "Insufficient food remaining or donation deadline expired while accepting."
          );
        }

        // Update donation status if fully exhausted
        const updatedRemaining = donationDoc.remainingQuantity - offer.quantity;
        const newDonationStatus =
          updatedRemaining <= 0 ? "ALLOCATED" : "PARTIALLY_ALLOCATED";
        await FoodDonation.updateOne(
          { _id: donationDoc._id },
          { $set: { status: newDonationStatus } },
          sess ? { session: sess } : {}
        );
      }

      // 3. Quantity restoration on CANCEL (only if quantity was previously reserved)
      if (action === "CANCEL" && ["ACCEPTED", "SCHEDULED"].includes(offer.status)) {
        await FoodDonation.updateOne(
          { _id: offer.donation },
          {
            $inc: { remainingQuantity: offer.quantity, reservedQuantity: -offer.quantity },
            $set: { status: "AVAILABLE" },
          },
          sess ? { session: sess } : {}
        );
      }

      // 4. Marking donation delivered if completed
      if (action === "COMPLETE") {
        const remainingOffers = await DonationOffer.countDocuments({
          donation: offer.donation,
          status: { $nin: ["COMPLETED", "CANCELLED", "REJECTED"] },
        });
        if (remainingOffers === 0) {
          await FoodDonation.updateOne(
            { _id: offer.donation, remainingQuantity: 0 },
            { $set: { status: "DELIVERED" } },
            sess ? { session: sess } : {}
          );
        }
      }

      return updatedOffer;
    };

    let result: any;
    if (useTransactions && session) {
      try {
        await session.withTransaction(async () => {
          result = await execute(session);
        });
      } catch (err: any) {
        // Fallback if replica set error
        if (err?.message?.includes("does not support transactions") || err?.code === 20) {
          result = await execute(null);
        } else {
          throw err;
        }
      }
    } else {
      result = await execute(null);
    }

    // Notifications on state changes
    const notifyTarget = isDonor ? offer.recipient : offer.donor;
    const actionTitles: Record<string, string> = {
      ACCEPT: "Allocation Accepted!",
      REJECT: "Offer Declined",
      CANCEL: "Allocation Cancelled",
      CONFIRM_PICKUP: "Food Picked Up!",
      COMPLETE: "Delivery Completed Successfully 🎉",
      FAIL_DELIVERY: "Delivery Exception Reported",
    };

    if (actionTitles[action]) {
      await Notification.create({
        recipientOrg: notifyTarget,
        type: action === "CANCEL" ? "ALLOCATION_CANCELLED" : "SYSTEM",
        title: actionTitles[action],
        message: `Allocation #${offerId.slice(-6)} has been updated to ${rule.to}. ${extra?.reason ? `Note: ${extra.reason}` : ""}`,
        link: `/allocations/${offerId}`,
      });
    }

    // Audit log
    await AuditEvent.create({
      actorId: actor.userId,
      actorOrgId: actor.orgId,
      actorRole: actor.role,
      action: `OFFER_${action}`,
      resourceType: "DonationOffer",
      resourceId: offerId,
      details: { from: offer.status, to: rule.to, reason: extra?.reason },
    });

    return result;
  } finally {
    if (session) await session.endSession();
  }
}
