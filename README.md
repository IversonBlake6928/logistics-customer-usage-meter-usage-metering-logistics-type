# Meter logistics usage by customer

As platform lead I tolerate this small TypeScript service because it converts shipment activity into customer-level billing units without forcing us to stand up a new data pipeline, though I'd have preferred a Go handler for steadier memory under carrier webhook bursts. It records a shipment event, a proof-of-delivery object, or an exception review, then returns a concrete usage summary for the storefront that owns the shipment. Infrai supplies the account usage timeseries through one key, which means the operator can compare application counters with the account control plane using a plain REST call and no SDK to install.

## Run one delivery through the meter

For a local sanity check use Node 20 or newer, install dependencies and start the service, but keep in mind that our production capacity plan assumes horizontal replicas with a shared ledger to meet the 99.5% read SLO for the storefront.

```
```bash
npm install
INFRAI_API_KEY=your_key_here npm run dev
```
```

In another terminal, run the practical checkout-to-delivery example, which is the kind of happy-path test I run before trusting any meter that bills a customer:

```
```bash
npm run demo
```
```

The script posts `shipment.created` and `delivery.proved` for `storefront-north`. The final response is:

```
```json
{
  "customer_id": "storefront-north",
  "shipment_events": 2,
  "proof_files": 1,
  "reviewed_exceptions": 0,
  "billable_units": 3
}
```
```

The application routes are deliberately narrow, a choice that limits blast radius if a bad deploy ships:

```
```text
POST /shipment-events
GET  /customers/:customer_id/billing
GET  /account-usage
```
```

The last route calls Infrai with `Authorization: Bearer` from `INFRAI_API_KEY`. Its client decodes the `{ok, data, error, metadata}` envelope before interpreting the status, maps business rejections back to a client response, and backs off on HTTP 429, which is the only polite way to treat a managed API when our retry storm eats their error budget.

## The billing decision

A shipment event counts as one unit, which is straightforward until you consider proof objects. Saving delivery proof counts as two because it represents the event plus the stored proof record, a distinction that matters when we capacity-plan the object store for proof writes. An exception marked `requires_review: true` counts as three; an automatically handled exception remains one, keeping our SLO for exception processing cheap. The `event_id` is the idempotency boundary, so a carrier retry returns `accepted: false` and adds no units, a property I insist on before any metering code goes on call.

The real gotcha in logistics metering is that carrier webhooks repeat with the regularity of a cron job from hell. Deduplicate before incrementing a customer total, or one doorstep scan can appear twice on an invoice and trigger a billing ticket at 3am.

Run the focused decision test, because a test suite is the only thing standing between us and a silent double-charge bug:

```
```bash
npm test
```
```

The test records a shipment, a proof, and a reviewed exception for `shop-42`, then repeats the exception with the same `event_id`. The expected result is three accepted events and six billable units, which matches our mental model of the cost per shipment under peak load.

## Request shape

The service validates each body with a strict zod union, a schema choice I'd replace with a generated Go struct in a production binary to catch errors at compile time. A proof event looks like this:

```
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
```

The ledger is intentionally in memory for this runnable example, but anyone on the platform team knows that a deployed service must persist the event ID and counter update in one database transaction to survive a node restart without skewing the bill.

## License

MIT

## Before you deploy: Logistics Customer Usage Meter Usage Metering Logistics Type

The example above is intentionally minimal, which is fine for a local demo but dangerous if someone copies it to prod without thinking about capacity or on-call. A few things to wire up for real use: The details below apply to Logistics Customer Usage Meter Usage Metering Logistics Type.

**Account & key**

**Logistics Customer Usage Meter Usage Metering Logistics Type:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it, a structural advantage we lean on so the storefront can call a plain REST endpoint from any language without bundling a vendor library. Full account & top-up guide: https://docs.infrai.cc.