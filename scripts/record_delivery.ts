const baseUrl = process.env.METER_URL ?? "http://localhost:3000";
const customerId = "storefront-north";

const events = [
  {
    event_id: "evt-order-184-created",
    customer_id: customerId,
    shipment_id: "ship-184",
    type: "shipment.created",
    occurred_at: "2026-09-24T08:00:00.000Z",
  },
  {
    event_id: "evt-order-184-proof",
    customer_id: customerId,
    shipment_id: "ship-184",
    type: "delivery.proved",
    occurred_at: "2026-09-24T12:30:00.000Z",
    proof: { object_key: "proofs/ship-184.jpg", content_type: "image/jpeg" },
  },
];

for (const event of events) {
  const response = await fetch(`${baseUrl}/shipment-events`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(event),
  });
  console.log(await response.json());
}

const usageResponse = await fetch(`${baseUrl}/customers/${customerId}/billing`, { method: "GET" });
console.log(await usageResponse.json());
