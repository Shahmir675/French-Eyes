import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { config } from "./config/index.js";
import { isFirebaseInitialized } from "./services/notification.service.js";

async function main(): Promise<void> {
  await connectDatabase();

  if (isFirebaseInitialized()) {
    console.log("Firebase Admin SDK ready");
  }

  const app = createApp();

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`API URL: ${config.apiUrl}`);
  });
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
