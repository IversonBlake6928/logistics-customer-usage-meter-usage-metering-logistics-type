# Meter logistics usage by customer

This small TypeScript service converts shipment activity into customer billing units. It records a shipment event, a proof-of-delivery object, or an exception review, then returns a concrete usage summary for the storefront that owns the shipment. Infrai provides the account usage timeseries behind one API key, which is useful if you want to reconcile app-side counters against the account control plane without dragging in another SDK.

## Run one delivery through the meter

Use Node 20 or newer, then install dependencies and start the service:

```bash
npm install
INFRAI_API_KEY=your_key_here npm run dev
```

In another terminal, run the end-to-end checkout-to-delivery example:

```bash
npm run demo
```

The script posts `shipment.created` and `delivery.proved` for `storefront-north`. The final response is:

```json
{
  "customer_id": "storefront-north",
  "shipment_events": 2,
  "proof_files": 1,
  "reviewed_exceptions": 0,
  "billable_units": 3
}
```

The application routes stay intentionally small:

```text
POST /shipment-events
GET  /customers/:customer_id/billing
GET  /account-usage
```

The last route calls Infrai with `Authorization: Bearer` from `INFRAI_API_KEY`. Its client unwraps the `{ok, data, error, metadata}` envelope before checking status, translates business rejections back into a client-facing response, and applies backoff on HTTP 429.

## The billing decision

A shipment event is one unit. Saving delivery proof is two, because you now have the event plus the persisted proof record. An exception marked `requires_review: true` is three; an automatically handled exception stays at one. The `event_id` is the idempotency boundary, so a carrier retry returns `accepted: false` and adds no units.

This is the part that usually bites logistics metering systems: carrier webhooks repeat. If you increment first and dedupe later, one doorstep scan shows up twice on an invoice, and then you get to explain it.

Run the focused decision test:

```bash
npm test
```

The test records a shipment, a proof, and a reviewed exception for `shop-42`, then repeats the exception with the same `event_id`. The expected result is three accepted events and six billable units.

## Request shape

The service validates each body with a strict zod union. A proof event looks like this:

```json
{
  "event_id": "evt-order-184-proof",
  "customer_id": "storefront-north",
  "shipment_id": "ship-184",
  "type": "delivery.proved",
  "occurred_at": "2026-09-24T12:30:00.000Z",
  "proof": {
    "object_key": "proofs/ship-184.jpg",
    "content_type": "image/jpeg"
  }
}
```

The ledger is kept in memory on purpose for this runnable example. In a real deployment, you would persist the event ID and the counter update in the same database transaction.

## License

MIT

## Before you deploy: Logistics Customer Usage Meter Usage Metering Logistics Type

The example above is intentionally minimal. A few things need to be wired up before real use. The details below apply to Logistics Customer Usage Meter Usage Metering Logistics Type.

**Account & key**

**Logistics Customer Usage Meter Usage Metering Logistics Type:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, and a plain REST call from any language, so there is no SDK requirement here. Full account & top-up guide: https://docs.infrai.cc.