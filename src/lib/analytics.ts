import { FoodDonation } from "../models/FoodDonation";
import { DonationOffer } from "../models/DonationOffer";
import { Organization } from "../models/Organization";
import mongoose from "mongoose";

/**
 * Real database-driven analytics service.
 * Environmental factor: ~2.5 kg CO2e emissions avoided per 1 kg edible food waste rescued (FAO / WRI benchmark).
 * Meals factor: 1 meal ~= 0.42 kg (standard Global FoodBanking Network metric).
 */

export interface SystemAnalytics {
  totalFoodDonatedKg: number;
  totalFoodDeliveredKg: number;
  totalAllocationsCount: number;
  successfulDeliveriesCount: number;
  deliverySuccessRate: number;
  activeProvidersCount: number;
  activeSheltersCount: number;
  totalMealsRescued: number;
  estimatedCo2AvoidedKg: number;
  categoryBreakdown: { category: string; donated: number; delivered: number }[];
  statusBreakdown: { status: string; count: number }[];
  environmentalDisclaimer: string;
}

export interface ProviderAnalytics {
  totalDonationsCount: number;
  totalQuantityDonated: number;
  currentlyAvailableQuantity: number;
  currentlyReservedQuantity: number;
  completedQuantityDelivered: number;
  cancelledCount: number;
  completedCount: number;
  mealsProvided: number;
  estimatedCo2OffsetKg: number;
  categoryBreakdown: { category: string; quantity: number }[];
}

export interface ShelterAnalytics {
  totalAllocationsReceived: number;
  totalQuantityReceivedKg: number;
  activePendingRequests: number;
  completedDeliveries: number;
  peopleImpactedEstimate: number;
  fulfillmentRate: number;
  categoryBreakdown: { category: string; quantity: number }[];
}

export async function getSystemAnalytics(): Promise<SystemAnalytics> {
  const [
    donationsAgg,
    completedOffersAgg,
    allOffersAgg,
    orgCounts,
    categoryAgg,
    statusAgg,
  ] = await Promise.all([
    FoodDonation.aggregate([
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: "$totalQuantity" },
          totalCount: { $sum: 1 },
        },
      },
    ]),

    DonationOffer.aggregate([
      { $match: { status: "COMPLETED" } },
      {
        $group: {
          _id: null,
          totalDelivered: { $sum: "$quantity" },
          completedCount: { $sum: 1 },
        },
      },
    ]),

    DonationOffer.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),

    Promise.all([
      Organization.countDocuments({ kind: "PROVIDER", verificationStatus: "VERIFIED" }),
      Organization.countDocuments({ kind: "SHELTER", verificationStatus: "VERIFIED" }),
    ]),

    FoodDonation.aggregate([
      {
        $group: {
          _id: "$category",
          totalDonated: { $sum: "$totalQuantity" },
        },
      },
      { $sort: { totalDonated: -1 } },
      { $limit: 10 },
    ]),

    FoodDonation.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const totalDonated = donationsAgg[0]?.totalQuantity || 0;
  const totalDelivered = completedOffersAgg[0]?.totalDelivered || 0;
  const completedCount = completedOffersAgg[0]?.completedCount || 0;

  const totalOffersCount = allOffersAgg.reduce((acc, curr) => acc + curr.count, 0);
  const deliverySuccessRate =
    totalOffersCount > 0 ? Math.round((completedCount / totalOffersCount) * 100) : 100;

  const estimatedCo2AvoidedKg = Math.round(totalDelivered * 2.5 * 10) / 10;
  const totalMealsRescued = Math.round(totalDelivered / 0.42);

  return {
    totalFoodDonatedKg: Math.round(totalDonated * 10) / 10,
    totalFoodDeliveredKg: Math.round(totalDelivered * 10) / 10,
    totalAllocationsCount: totalOffersCount,
    successfulDeliveriesCount: completedCount,
    deliverySuccessRate,
    activeProvidersCount: orgCounts[0],
    activeSheltersCount: orgCounts[1],
    totalMealsRescued,
    estimatedCo2AvoidedKg,
    categoryBreakdown: categoryAgg.map((c) => ({
      category: c._id || "Other",
      donated: Math.round(c.totalDonated * 10) / 10,
      delivered: 0,
    })),
    statusBreakdown: statusAgg.map((s) => ({
      status: s._id,
      count: s.count,
    })),
    environmentalDisclaimer:
      "Calculated using FAO waste reduction factors (~2.5 kg CO2e per kg food waste avoided; 1 meal ~= 0.42 kg edible surplus).",
  };
}

export async function getProviderAnalytics(orgId: string): Promise<ProviderAnalytics> {
  const orgObjectId = new mongoose.Types.ObjectId(orgId);

  const [donationAgg, offerAgg, categoryAgg] = await Promise.all([
    FoodDonation.aggregate([
      { $match: { donor: orgObjectId } },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: "$totalQuantity" },
          remainingQuantity: { $sum: "$remainingQuantity" },
          reservedQuantity: { $sum: "$reservedQuantity" },
          count: { $sum: 1 },
        },
      },
    ]),

    DonationOffer.aggregate([
      { $match: { donor: orgObjectId } },
      {
        $group: {
          _id: "$status",
          totalQuantity: { $sum: "$quantity" },
          count: { $sum: 1 },
        },
      },
    ]),

    FoodDonation.aggregate([
      { $match: { donor: orgObjectId } },
      {
        $group: {
          _id: "$category",
          quantity: { $sum: "$totalQuantity" },
        },
      },
      { $sort: { quantity: -1 } },
    ]),
  ]);

  const d = donationAgg[0] || { totalQuantity: 0, remainingQuantity: 0, reservedQuantity: 0, count: 0 };
  const completedOffer = offerAgg.find((o) => o._id === "COMPLETED");
  const cancelledOffer = offerAgg.find((o) => o._id === "CANCELLED");

  const completedDelivered = completedOffer?.totalQuantity || 0;
  const completedCount = completedOffer?.count || 0;
  const cancelledCount = cancelledOffer?.count || 0;

  return {
    totalDonationsCount: d.count,
    totalQuantityDonated: Math.round(d.totalQuantity * 10) / 10,
    currentlyAvailableQuantity: Math.round(d.remainingQuantity * 10) / 10,
    currentlyReservedQuantity: Math.round(d.reservedQuantity * 10) / 10,
    completedQuantityDelivered: Math.round(completedDelivered * 10) / 10,
    cancelledCount,
    completedCount,
    mealsProvided: Math.round(completedDelivered / 0.42),
    estimatedCo2OffsetKg: Math.round(completedDelivered * 2.5 * 10) / 10,
    categoryBreakdown: categoryAgg.map((c) => ({
      category: c._id || "Other",
      quantity: Math.round(c.quantity * 10) / 10,
    })),
  };
}

export async function getShelterAnalytics(orgId: string): Promise<ShelterAnalytics> {
  const orgObjectId = new mongoose.Types.ObjectId(orgId);

  const [offerAgg, categoryAgg] = await Promise.all([
    DonationOffer.aggregate([
      { $match: { recipient: orgObjectId } },
      {
        $group: {
          _id: "$status",
          totalQuantity: { $sum: "$quantity" },
          count: { $sum: 1 },
        },
      },
    ]),

    DonationOffer.aggregate([
      { $match: { recipient: orgObjectId, status: "COMPLETED" } },
      {
        $lookup: {
          from: "fooddonations",
          localField: "donation",
          foreignField: "_id",
          as: "donationDoc",
        },
      },
      { $unwind: "$donationDoc" },
      {
        $group: {
          _id: "$donationDoc.category",
          quantity: { $sum: "$quantity" },
        },
      },
      { $sort: { quantity: -1 } },
    ]),
  ]);

  const completed = offerAgg.find((o) => o._id === "COMPLETED");
  const pending = offerAgg.find((o) => o._id === "OFFER_PENDING");

  const totalAllocations = offerAgg.reduce((acc, curr) => acc + curr.count, 0);
  const totalReceivedKg = completed?.totalQuantity || 0;
  const completedCount = completed?.count || 0;
  const pendingCount = pending?.count || 0;

  const fulfillmentRate =
    totalAllocations > 0 ? Math.round((completedCount / totalAllocations) * 100) : 100;

  return {
    totalAllocationsReceived: totalAllocations,
    totalQuantityReceivedKg: Math.round(totalReceivedKg * 10) / 10,
    activePendingRequests: pendingCount,
    completedDeliveries: completedCount,
    peopleImpactedEstimate: Math.round(totalReceivedKg / 0.42),
    fulfillmentRate,
    categoryBreakdown: categoryAgg.map((c) => ({
      category: c._id || "Other",
      quantity: Math.round(c.quantity * 10) / 10,
    })),
  };
}
