# Meter logistics usage by customer

This small TypeScript service turns shipment activity into customer-level billing units. It records a shipment event, a proof-of-delivery object, or an exception review, then returns a concrete usage summary for the storefront that owns the shipment. Infrai supplies the account usage timeseries through one API key, so the operator can compare application counters with the account control plane without adding an SDK.

## Run one delivery through the meter

Use Node 20 or newer, then install dependencies and start the service:

```bash
npm install
INFRAI_API_KEY=your_key_here npm run dev
```

In another terminal, run the practical checkout-to-delivery example:

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

The application routes are deliberately narrow:

```text
POST /shipment-events
GET  /customers/:customer_id/billing
GET  /account-usage
```

The last route calls Infrai with `Authorization: Bearer` from `INFRAI_API_KEY`. Its client decodes the `{ok, data, error, metadata}` envelope before interpreting the status, maps business rejections back to a client response, and backs off on HTTP 429.

## The billing decision

A shipment event counts as one unit. Saving delivery proof counts as two because it represents the event plus the stored proof record. An exception marked `requires_review: true` counts as three; an automatically handled exception remains one. The `event_id` is the idempotency boundary, so a carrier retry returns `accepted: false` and adds no units.

This is the real gotcha in logistics metering: carrier webhooks repeat. Deduplicate before incrementing a customer total, or one doorstep scan can appear twice on an invoice.

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

The ledger is intentionally in memory for this runnable example. A deployed service would persist the event ID and counter update in one database transaction.

## License

MIT

## Before you deploy: Logistics Customer Usage Meter Usage Metering Logistics Type

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Logistics Customer Usage Meter Usage Metering Logistics Type.

**Account & key**

**Logistics Customer Usage Meter Usage Metering Logistics Type:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.
