import { WebSocketServer, WebSocket, RawData } from "ws";
import type { IncomingMessage, Server } from "http";
import type { Duplex } from "stream";
import { URL } from "url";
import { DeviceService } from "./device.service.js";
import type { OrderPrintPayload, DeviceType } from "../types/index.js";

interface ConnectedDevice {
  deviceId: string;
  name: string;
  type: DeviceType;
  ws: WebSocket;
  lastPing: number;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private connectedDevices: Map<string, ConnectedDevice> = new Map();
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  initialize(server: Server): void {
    this.wss = new WebSocketServer({ noServer: true });

    server.on("upgrade", (request: IncomingMessage, socket: Duplex, head: Buffer) => {
      this.handleUpgrade(request, socket, head);
    });

    this.wss.on("connection", (ws: WebSocket, request: IncomingMessage) => {
      const extRequest = request as IncomingMessage & {
        deviceId?: string;
        deviceName?: string;
        deviceType?: DeviceType;
      };
      const deviceId = extRequest.deviceId;
      const deviceName = extRequest.deviceName;
      const deviceType = extRequest.deviceType;

      if (!deviceId || !deviceName || !deviceType) {
        ws.close(1008, "Device authentication failed");
        return;
      }

      this.handleConnection(deviceId, deviceName, deviceType, ws);
    });

    this.pingInterval = setInterval(() => {
      this.pingDevices();
    }, 30000);

    console.log("WebSocket server initialized");
  }

  private async handleUpgrade(
    request: IncomingMessage,
    socket: Duplex,
    head: Buffer
  ): Promise<void> {
    try {
      const url = new URL(request.url || "", `http://${request.headers.host}`);
      const pathMatch = url.pathname.match(/^\/ws\/devices\/([^/]+)\/stream$/);

      if (!pathMatch) {
        socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
        socket.end();
        return;
      }

      const deviceId = pathMatch[1];
      const token = url.searchParams.get("token");

      if (!token) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.end();
        return;
      }

      const device = await DeviceService.verifyDeviceToken(token);

      if (device.deviceId !== deviceId) {
        socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
        socket.end();
        return;
      }

      const extRequest = request as IncomingMessage & {
        deviceId: string;
        deviceName: string;
        deviceType: DeviceType;
      };
      extRequest.deviceId = device.deviceId;
      extRequest.deviceName = device.name;
      extRequest.deviceType = device.type;

      this.wss!.handleUpgrade(request, socket, head, (ws) => {
        this.wss!.emit("connection", ws, request);
      });
    } catch (error) {
      console.error("WebSocket upgrade error:", error);
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.end();
    }
  }

  private handleConnection(
    deviceId: string,
    name: string,
    type: DeviceType,
    ws: WebSocket
  ): void {
    const existingDevice = this.connectedDevices.get(deviceId);
    if (existingDevice) {
      existingDevice.ws.close(1000, "New connection established");
    }

    this.connectedDevices.set(deviceId, {
      deviceId,
      name,
      type,
      ws,
      lastPing: Date.now(),
    });

    console.log(`Device connected: ${name} (${deviceId})`);

    ws.send(
      JSON.stringify({
        event: "connected",
        data: { deviceId, name, timestamp: new Date().toISOString() },
      })
    );

    ws.on("message", (data: RawData) => {
      this.handleMessage(deviceId, data);
    });

    ws.on("close", () => {
      this.connectedDevices.delete(deviceId);
      console.log(`Device disconnected: ${name} (${deviceId})`);
    });

    ws.on("error", (error: Error) => {
      console.error(`Device WebSocket error (${deviceId}):`, error);
    });

    ws.on("pong", () => {
      const device = this.connectedDevices.get(deviceId);
      if (device) {
        device.lastPing = Date.now();
      }
    });
  }

  private handleMessage(deviceId: string, data: RawData): void {
    try {
      const message = JSON.parse(data.toString());

      if (message.event === "ping") {
        const device = this.connectedDevices.get(deviceId);
        if (device) {
          device.ws.send(JSON.stringify({ event: "pong", timestamp: Date.now() }));
        }
      }
    } catch (error) {
      console.error(`Invalid message from device ${deviceId}:`, error);
    }
  }

  private pingDevices(): void {
    const now = Date.now();
    const timeout = 60000;

    for (const [deviceId, device] of this.connectedDevices) {
      if (now - device.lastPing > timeout) {
        device.ws.close(1000, "Connection timeout");
        this.connectedDevices.delete(deviceId);
        console.log(`Device timed out: ${device.name} (${deviceId})`);
      } else {
        device.ws.ping();
      }
    }
  }

  broadcastToAllDevices(payload: OrderPrintPayload): void {
    const message = JSON.stringify(payload);

    for (const device of this.connectedDevices.values()) {
      if (device.ws.readyState === WebSocket.OPEN) {
        device.ws.send(message);
      }
    }
  }

  sendToDevice(deviceId: string, payload: OrderPrintPayload): boolean {
    const device = this.connectedDevices.get(deviceId);

    if (!device || device.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    device.ws.send(JSON.stringify(payload));
    return true;
  }

  getConnectedDevices(): Array<{ deviceId: string; name: string; type: DeviceType }> {
    return Array.from(this.connectedDevices.values()).map((d) => ({
      deviceId: d.deviceId,
      name: d.name,
      type: d.type,
    }));
  }

  isDeviceConnected(deviceId: string): boolean {
    const device = this.connectedDevices.get(deviceId);
    return !!device && device.ws.readyState === WebSocket.OPEN;
  }

  shutdown(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    for (const device of this.connectedDevices.values()) {
      device.ws.close(1001, "Server shutting down");
    }

    this.connectedDevices.clear();

    if (this.wss) {
      this.wss.close();
    }
  }
}

export const wsManager = new WebSocketManager();
