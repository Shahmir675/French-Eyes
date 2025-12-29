import { createServer } from "http";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { config } from "./config/index.js";
import { isFirebaseInitialized } from "./services/notification.service.js";
import { wsManager } from "./services/websocket.service.js";

async function main(): Promise<void> {
  await connectDatabase();

  if (isFirebaseInitialized()) {
    console.log("Firebase Admin SDK ready");
  }

  const app = createApp();
  const server = createServer(app);

  wsManager.initialize(server);

  server.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`API URL: ${config.apiUrl}`);
    console.log(`WebSocket endpoint: ws://localhost:${config.port}/ws/devices/:id/stream`);
  });

  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down...");
    wsManager.shutdown();
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  });
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
