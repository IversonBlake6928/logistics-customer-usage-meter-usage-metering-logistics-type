import { z } from "zod";

export const shipmentEventSchema = z.discriminatedUnion("type", [
  z.object({
    event_id: z.string().min(1),
    customer_id: z.string().min(1),
    shipment_id: z.string().min(1),
    type: z.literal("shipment.created"),
    occurred_at: z.string().datetime(),
  }).strict(),
  z.object({
    event_id: z.string().min(1),
    customer_id: z.string().min(1),
    shipment_id: z.string().min(1),
    type: z.literal("delivery.proved"),
    occurred_at: z.string().datetime(),
    proof: z.object({ object_key: z.string().min(1), content_type: z.string().min(1) }).strict(),
  }).strict(),
  z.object({
    event_id: z.string().min(1),
    customer_id: z.string().min(1),
    shipment_id: z.string().min(1),
    type: z.literal("shipment.exception"),
    occurred_at: z.string().datetime(),
    exception: z.object({ code: z.string().min(1), requires_review: z.boolean() }).strict(),
  }).strict(),
]);

export type ShipmentEvent = z.infer<typeof shipmentEventSchema>;

export type BillingUsage = {
  customer_id: string;
  shipment_events: number;
  proof_files: number;
  reviewed_exceptions: number;
  billable_units: number;
};

export class ShipmentLedger {
  private readonly events = new Map<string, ShipmentEvent>();

  record(event: ShipmentEvent): { accepted: boolean; billable_units: number } {
    if (this.events.has(event.event_id)) {
      return { accepted: false, billable_units: 0 };
    }
    this.events.set(event.event_id, event);
    return { accepted: true, billable_units: unitsFor(event) };
  }

  usageFor(customerId: string): BillingUsage {
    const usage: BillingUsage = {
      customer_id: customerId,
      shipment_events: 0,
      proof_files: 0,
      reviewed_exceptions: 0,
      billable_units: 0,
    };

    for (const event of this.events.values()) {
      if (event.customer_id !== customerId) continue;
      usage.shipment_events += 1;
      if (event.type === "delivery.proved") usage.proof_files += 1;
      if (event.type === "shipment.exception" && event.exception.requires_review) {
        usage.reviewed_exceptions += 1;
      }
      usage.billable_units += unitsFor(event);
    }
    return usage;
  }
}

function unitsFor(event: ShipmentEvent): number {
  if (event.type === "delivery.proved") return 2;
  if (event.type === "shipment.exception" && event.exception.requires_review) return 3;
  return 1;
}
