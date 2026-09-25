import assert from "node:assert/strict";
import test from "node:test";
import { ShipmentLedger } from "../src/shipment_ledger.js";

test("proof files and reviewed exceptions receive their billing weights", () => {
  const ledger = new ShipmentLedger();
  const common = { customer_id: "shop-42", shipment_id: "ship-9", occurred_at: "2026-09-24T08:00:00.000Z" };

  ledger.record({ ...common, event_id: "evt-1", type: "shipment.created" });
  ledger.record({ ...common, event_id: "evt-2", type: "delivery.proved", proof: { object_key: "proofs/9.jpg", content_type: "image/jpeg" } });
  ledger.record({ ...common, event_id: "evt-3", type: "shipment.exception", exception: { code: "ADDRESS_CHECK", requires_review: true } });
  ledger.record({ ...common, event_id: "evt-3", type: "shipment.exception", exception: { code: "ADDRESS_CHECK", requires_review: true } });

  assert.deepEqual(ledger.usageFor("shop-42"), {
    customer_id: "shop-42",
    shipment_events: 3,
    proof_files: 1,
    reviewed_exceptions: 1,
    billable_units: 6,
  });
});
