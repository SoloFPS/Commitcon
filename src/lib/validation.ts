import { z } from "zod";

const coords = {
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
};

const base = z.object({
  orgName: z.string().min(2).max(120),
  contactName: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  password: z.string().min(8).max(72),
  confirmPassword: z.string(),
  category: z.string().min(2),
  address: z.string().min(5),
  city: z.string().min(2),
  postalCode: z.string().min(3),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) }),
  ...coords,
});

export const registerSchema = z
  .discriminatedUnion("role", [
    base.extend({
      role: z.literal("PROVIDER"),
      foodCategories: z.array(z.string()).default([]),
    }),
    base.extend({
      role: z.literal("SHELTER"),
      peopleServed: z.coerce.number().int().positive(),
      foodCategories: z.array(z.string()).default([]),
      dietaryRestrictions: z.array(z.string()).default([]),
    }),
  ])
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const donationSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  category: z.string().min(2),
  unit: z.string().min(1).default("kg"),
  totalQuantity: z.coerce.number().positive(),
  dietary: z.enum(["VEG", "NON_VEG"]),
  allergens: z.array(z.string()).default([]),
  storageRequirements: z.enum(["AMBIENT", "REFRIGERATED", "FROZEN", "HEATED"]).default("AMBIENT"),
  preparedAt: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  pickupDeadline: z.coerce.date().refine((d) => d.getTime() > Date.now(), "Pickup deadline must be in the future"),
  pickupAddress: z.string().min(3).optional(),
  pickupInstructions: z.string().max(500).optional(),
});

export const donationUpdateSchema = donationSchema.partial();

export const offerSchema = z.object({
  donationId: z.string().length(24),
  recipientId: z.string().length(24),
  quantity: z.coerce.number().positive(),
  idempotencyKey: z.string().min(8).max(80),
  scheduledPickupTime: z.coerce.date().optional(),
  pickupNotes: z.string().max(500).optional(),
});

export const requestFoodSchema = z.object({
  donationId: z.string().length(24),
  quantity: z.coerce.number().positive(),
  notes: z.string().max(500).optional(),
  idempotencyKey: z.string().min(8).max(80),
});

export const offerActionSchema = z.object({
  action: z.enum([
    "ACCEPT",
    "REJECT",
    "CANCEL",
    "SCHEDULE",
    "CONFIRM_PICKUP",
    "COMPLETE",
    "FAIL_DELIVERY",
  ]),
  reason: z.string().max(500).optional(),
  scheduledPickupTime: z.coerce.date().optional(),
  proofOfDeliveryCode: z.string().optional(),
  deliveryNotes: z.string().max(500).optional(),
});

export const shelterProfileSchema = z.object({
  peopleServed: z.coerce.number().int().min(1).optional(),
  capacityKg: z.coerce.number().min(0).optional(),
  foodCategories: z.array(z.string()).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  storageTypes: z.array(z.string()).optional(),
  operatingHours: z
    .object({
      open: z.string().min(4).max(5),
      close: z.string().min(4).max(5),
    })
    .optional(),
  contactName: z.string().min(2).optional(),
  phone: z.string().min(7).optional(),
});

export const adminVerifyOrgSchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED"]),
  notes: z.string().max(500).optional(),
});
