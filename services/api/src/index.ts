import { createDatabase } from "./db/client.js";
import { loadApiConfig } from "./config.js";
import { buildApp } from "./app.js";
import { DrizzleRepository } from "./drizzle-repository.js";
import { HttpKycProviderClient } from "./provider-client.js";

const config = loadApiConfig();
const database = createDatabase(config.databaseUrl);
const app = await buildApp({
  config,
  repository: new DrizzleRepository(database.db),
  providerClient: new HttpKycProviderClient(config.provider)
});

try {
  await app.listen({ host: "0.0.0.0", port: config.port });
} catch (error) {
  app.log.error(error);
  await database.client.end({ timeout: 5 });
  process.exit(1);
}
