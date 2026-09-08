/* global process */

import { setTimeout as delay } from "node:timers/promises";
import { Autumn, HTTPClient } from "autumn-js";

/** @type {unknown[]} */
const rejections = [];
process.on("unhandledRejection", (reason) => rejections.push(reason));

const sdk = new Autumn({
  secretKey: "test-secret-key",
  serverURL: "https://example.test",
  failOpen: false,
  retryConfig: { strategy: "none" },
  debugLogger: { group() {}, groupEnd() {}, log() {} },
  httpClient: new HTTPClient({
    fetcher: async () => {
      throw new Error("fetch must not run");
    },
  }),
});

const callerError = await sdk
  .track(
    {
      customerId: "customer-1",
      featureId: "messages",
      properties: { amount: 1n },
    },
    { retries: { strategy: "none" } }
  )
  .catch((error) => error);

await delay(20);
const result = {
  callerRejected: callerError instanceof Error,
  callerName: callerError?.name,
  unhandledCount: rejections.length,
  unhandledName:
    rejections[0] instanceof Error ? rejections[0].name : typeof rejections[0],
};
process.stdout.write(JSON.stringify(result));
process.exitCode = result.callerRejected && result.unhandledCount === 1 ? 0 : 1;
