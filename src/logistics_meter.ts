import { createServer, type ServerResponse } from "node:http";
import { InfraiError, readAccountUsageTimeseries } from "./infrai_usage.js";
import { ShipmentLedger, shipmentEventSchema } from "./shipment_ledger.js";

const ledger = new ShipmentLedger();
const port = Number(process.env.PORT ?? 3000);

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

    if (request.method === "POST" && url.pathname === "/shipment-events") {
      const parsed = shipmentEventSchema.safeParse(await readJson(request));
      if (!parsed.success) return json(response, 400, { error: "invalid_request", issues: parsed.error.issues });
      return json(response, 202, ledger.record(parsed.data));
    }

    const billingMatch = url.pathname.match(/^\/customers\/([^/]+)\/billing$/);
    if (request.method === "GET" && billingMatch) {
      return json(response, 200, ledger.usageFor(decodeURIComponent(billingMatch[1])));
    }

    if (request.method === "GET" && url.pathname === "/account-usage") {
      const apiKey = process.env.INFRAI_API_KEY;
      if (!apiKey) return json(response, 503, { error: "missing_configuration" });
      return json(response, 200, { usage: await readAccountUsageTimeseries(apiKey) });
    }

    return json(response, 404, { error: "route_not_found" });
  } catch (error) {
    if (error instanceof InfraiError) {
      const status = error.status >= 400 && error.status < 500 ? error.status : 502;
      return json(response, status, { error: error.code, detail: error.detail });
    }
    return json(response, 500, { error: "request_failed" });
  }
});

server.listen(port, () => console.log(`Logistics meter listening on http://localhost:${port}`));

async function readJson(request: AsyncIterable<Uint8Array>): Promise<unknown> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function json(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}
