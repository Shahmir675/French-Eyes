import { WebSocketServer, WebSocket, RawData } from "ws";
import type { IncomingMessage, Server } from "http";
import type { Duplex } from "stream";
import { URL } from "url";
import { DeviceService } from "./device.service.js";
import { TokenService } from "./token.service.js";
import { AdminAuthService } from "./admin-auth.service.js";
import { DriverAuthService } from "./driver-auth.service.js";
import type {
  OrderPrintPayload,
  DeviceType,
  CustomerOrderTrackingEvent,
  AdminOrderEvent,
  DriverOrderEvent,
  SupportChatEvent,
  WSClientType,
} from "../types/index.js";

interface ConnectedDevice {
  deviceId: string;
  name: string;
  type: DeviceType;
  ws: WebSocket;
  lastPing: number;
}

interface ConnectedCustomer {
  userId: string;
  orderId: string;
  ws: WebSocket;
  lastPing: number;
}

interface ConnectedAdmin {
  adminId: string;
  ws: WebSocket;
  lastPing: number;
}

interface ConnectedDriver {
  driverId: string;
  ws: WebSocket;
  lastPing: number;
}

interface ConnectedSupportChat {
  ticketId: string;
  participantId: string;
  participantType: "user" | "admin";
  ws: WebSocket;
  lastPing: number;
}

interface ExtendedRequest extends IncomingMessage {
  clientType?: WSClientType;
  deviceId?: string;
  deviceName?: string;
  deviceType?: DeviceType;
  userId?: string;
  orderId?: string;
  adminId?: string;
  driverId?: string;
  ticketId?: string;
  participantId?: string;
  participantType?: "user" | "admin";
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private connectedDevices: Map<string, ConnectedDevice> = new Map();
  private customerTracking: Map<string, ConnectedCustomer> = new Map();
  private adminDashboard: Map<string, ConnectedAdmin> = new Map();
  private driverNotifications: Map<string, ConnectedDriver> = new Map();
  private supportChats: Map<string, ConnectedSupportChat[]> = new Map();
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  initialize(server: Server): void {
    this.wss = new WebSocketServer({ noServer: true });

    server.on("upgrade", (request: IncomingMessage, socket: Duplex, head: Buffer) => {
      this.handleUpgrade(request, socket, head);
    });

    this.wss.on("connection", (ws: WebSocket, request: IncomingMessage) => {
      const req = request as ExtendedRequest;
      this.handleConnection(ws, req);
    });

    this.pingInterval = setInterval(() => {
      this.pingAllClients();
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
      const pathname = url.pathname;
      const token = url.searchParams.get("token");

      if (!token) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.end();
        return;
      }

      const extRequest = request as ExtendedRequest;

      const deviceMatch = pathname.match(/^\/ws\/devices\/([^/]+)\/stream$/);
      if (deviceMatch) {
        const device = await DeviceService.verifyDeviceToken(token);
        if (device.deviceId !== deviceMatch[1]) {
          socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
          socket.end();
          return;
        }
        extRequest.clientType = "device";
        extRequest.deviceId = device.deviceId;
        extRequest.deviceName = device.name;
        extRequest.deviceType = device.type;
        this.completeUpgrade(request, socket, head);
        return;
      }

      const orderTrackMatch = pathname.match(/^\/ws\/orders\/([^/]+)\/track$/);
      if (orderTrackMatch && orderTrackMatch[1]) {
        const payload = await TokenService.verifyAccessToken(token);
        extRequest.clientType = "customer";
        extRequest.userId = payload.userId;
        extRequest.orderId = orderTrackMatch[1];
        this.completeUpgrade(request, socket, head);
        return;
      }

      if (pathname === "/ws/admin/orders") {
        const payload = await AdminAuthService.verifyAccessToken(token);
        extRequest.clientType = "admin";
        extRequest.adminId = payload.adminId;
        this.completeUpgrade(request, socket, head);
        return;
      }

      if (pathname === "/ws/driver/orders") {
        const payload = await DriverAuthService.verifyAccessToken(token);
        extRequest.clientType = "driver";
        extRequest.driverId = payload.driverId;
        this.completeUpgrade(request, socket, head);
        return;
      }

      const supportMatch = pathname.match(/^\/ws\/support\/chat\/([^/]+)$/);
      if (supportMatch && supportMatch[1]) {
        const ticketId = supportMatch[1];
        try {
          const adminPayload = await AdminAuthService.verifyAccessToken(token);
          extRequest.clientType = "support";
          extRequest.ticketId = ticketId;
          extRequest.participantId = adminPayload.adminId;
          extRequest.participantType = "admin";
          this.completeUpgrade(request, socket, head);
          return;
        } catch {
          const userPayload = await TokenService.verifyAccessToken(token);
          extRequest.clientType = "support";
          extRequest.ticketId = ticketId;
          extRequest.participantId = userPayload.userId;
          extRequest.participantType = "user";
          this.completeUpgrade(request, socket, head);
          return;
        }
      }

      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      socket.end();
    } catch (error) {
      console.error("WebSocket upgrade error:", error);
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.end();
    }
  }

  private completeUpgrade(
    request: IncomingMessage,
    socket: Duplex,
    head: Buffer
  ): void {
    this.wss!.handleUpgrade(request, socket, head, (ws) => {
      this.wss!.emit("connection", ws, request);
    });
  }

  private handleConnection(ws: WebSocket, req: ExtendedRequest): void {
    switch (req.clientType) {
      case "device":
        this.handleDeviceConnection(ws, req);
        break;
      case "customer":
        this.handleCustomerConnection(ws, req);
        break;
      case "admin":
        this.handleAdminConnection(ws, req);
        break;
      case "driver":
        this.handleDriverConnection(ws, req);
        break;
      case "support":
        this.handleSupportConnection(ws, req);
        break;
      default:
        ws.close(1008, "Unknown client type");
    }
  }

  private handleDeviceConnection(ws: WebSocket, req: ExtendedRequest): void {
    const { deviceId, deviceName, deviceType } = req;
    if (!deviceId || !deviceName || !deviceType) {
      ws.close(1008, "Device authentication failed");
      return;
    }

    const existing = this.connectedDevices.get(deviceId);
    if (existing) {
      existing.ws.close(1000, "New connection established");
    }

    this.connectedDevices.set(deviceId, {
      deviceId,
      name: deviceName,
      type: deviceType,
      ws,
      lastPing: Date.now(),
    });

    ws.send(JSON.stringify({ event: "connected", data: { deviceId, name: deviceName } }));

    ws.on("message", (data: RawData) => this.handleDeviceMessage(deviceId, data));
    ws.on("close", () => this.connectedDevices.delete(deviceId));
    ws.on("pong", () => {
      const d = this.connectedDevices.get(deviceId);
      if (d) d.lastPing = Date.now();
    });
  }

  private handleCustomerConnection(ws: WebSocket, req: ExtendedRequest): void {
    const { userId, orderId } = req;
    if (!userId || !orderId) {
      ws.close(1008, "Authentication failed");
      return;
    }

    const key = `${userId}:${orderId}`;
    const existing = this.customerTracking.get(key);
    if (existing) {
      existing.ws.close(1000, "New connection established");
    }

    this.customerTracking.set(key, { userId, orderId, ws, lastPing: Date.now() });

    ws.send(JSON.stringify({ event: "connected", data: { orderId } }));

    ws.on("close", () => this.customerTracking.delete(key));
    ws.on("pong", () => {
      const c = this.customerTracking.get(key);
      if (c) c.lastPing = Date.now();
    });
  }

  private handleAdminConnection(ws: WebSocket, req: ExtendedRequest): void {
    const { adminId } = req;
    if (!adminId) {
      ws.close(1008, "Authentication failed");
      return;
    }

    const existing = this.adminDashboard.get(adminId);
    if (existing) {
      existing.ws.close(1000, "New connection established");
    }

    this.adminDashboard.set(adminId, { adminId, ws, lastPing: Date.now() });

    ws.send(JSON.stringify({ event: "connected", data: { adminId } }));

    ws.on("close", () => this.adminDashboard.delete(adminId));
    ws.on("pong", () => {
      const a = this.adminDashboard.get(adminId);
      if (a) a.lastPing = Date.now();
    });
  }

  private handleDriverConnection(ws: WebSocket, req: ExtendedRequest): void {
    const { driverId } = req;
    if (!driverId) {
      ws.close(1008, "Authentication failed");
      return;
    }

    const existing = this.driverNotifications.get(driverId);
    if (existing) {
      existing.ws.close(1000, "New connection established");
    }

    this.driverNotifications.set(driverId, { driverId, ws, lastPing: Date.now() });

    ws.send(JSON.stringify({ event: "connected", data: { driverId } }));

    ws.on("close", () => this.driverNotifications.delete(driverId));
    ws.on("pong", () => {
      const d = this.driverNotifications.get(driverId);
      if (d) d.lastPing = Date.now();
    });
  }

  private handleSupportConnection(ws: WebSocket, req: ExtendedRequest): void {
    const { ticketId, participantId, participantType } = req;
    if (!ticketId || !participantId || !participantType) {
      ws.close(1008, "Authentication failed");
      return;
    }

    const chatParticipant: ConnectedSupportChat = {
      ticketId,
      participantId,
      participantType,
      ws,
      lastPing: Date.now(),
    };

    const existing = this.supportChats.get(ticketId) || [];
    this.supportChats.set(ticketId, [...existing, chatParticipant]);

    ws.send(JSON.stringify({ event: "connected", data: { ticketId, participantType } }));

    ws.on("message", (data: RawData) => this.handleSupportMessage(ticketId, participantId, participantType, data));
    ws.on("close", () => {
      const chats = this.supportChats.get(ticketId) || [];
      this.supportChats.set(ticketId, chats.filter((c) => c.participantId !== participantId));
    });
    ws.on("pong", () => {
      const chats = this.supportChats.get(ticketId) || [];
      const chat = chats.find((c) => c.participantId === participantId);
      if (chat) chat.lastPing = Date.now();
    });
  }

  private handleDeviceMessage(deviceId: string, data: RawData): void {
    try {
      const message = JSON.parse(data.toString());
      if (message.event === "ping") {
        const device = this.connectedDevices.get(deviceId);
        if (device) {
          device.ws.send(JSON.stringify({ event: "pong", timestamp: Date.now() }));
        }
      }
    } catch {
      console.error(`Invalid message from device ${deviceId}`);
    }
  }

  private handleSupportMessage(
    ticketId: string,
    senderId: string,
    senderType: "user" | "admin",
    data: RawData
  ): void {
    try {
      const message = JSON.parse(data.toString());
      if (message.event === "message" || message.event === "typing") {
        const event: SupportChatEvent = {
          event: message.event,
          data: {
            ticketId,
            sender: senderType === "admin" ? "support" : "user",
            senderId,
            message: message.data?.message,
            timestamp: new Date().toISOString(),
          },
        };
        this.broadcastToSupportChat(ticketId, event, senderId);
      }
    } catch {
      console.error(`Invalid support message for ticket ${ticketId}`);
    }
  }

  private pingAllClients(): void {
    const timeout = 60000;
    const now = Date.now();

    for (const [id, device] of this.connectedDevices) {
      if (now - device.lastPing > timeout) {
        device.ws.close(1000, "Timeout");
        this.connectedDevices.delete(id);
      } else {
        device.ws.ping();
      }
    }

    for (const [key, customer] of this.customerTracking) {
      if (now - customer.lastPing > timeout) {
        customer.ws.close(1000, "Timeout");
        this.customerTracking.delete(key);
      } else {
        customer.ws.ping();
      }
    }

    for (const [id, admin] of this.adminDashboard) {
      if (now - admin.lastPing > timeout) {
        admin.ws.close(1000, "Timeout");
        this.adminDashboard.delete(id);
      } else {
        admin.ws.ping();
      }
    }

    for (const [id, driver] of this.driverNotifications) {
      if (now - driver.lastPing > timeout) {
        driver.ws.close(1000, "Timeout");
        this.driverNotifications.delete(id);
      } else {
        driver.ws.ping();
      }
    }

    for (const [ticketId, chats] of this.supportChats) {
      const validChats = chats.filter((chat) => {
        if (now - chat.lastPing > timeout) {
          chat.ws.close(1000, "Timeout");
          return false;
        }
        chat.ws.ping();
        return true;
      });
      if (validChats.length === 0) {
        this.supportChats.delete(ticketId);
      } else {
        this.supportChats.set(ticketId, validChats);
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
    if (!device || device.ws.readyState !== WebSocket.OPEN) return false;
    device.ws.send(JSON.stringify(payload));
    return true;
  }

  sendToCustomerOrder(orderId: string, payload: CustomerOrderTrackingEvent): void {
    const message = JSON.stringify(payload);
    for (const customer of this.customerTracking.values()) {
      if (customer.orderId === orderId && customer.ws.readyState === WebSocket.OPEN) {
        customer.ws.send(message);
      }
    }
  }

  broadcastToAdmins(payload: AdminOrderEvent): void {
    const message = JSON.stringify(payload);
    for (const admin of this.adminDashboard.values()) {
      if (admin.ws.readyState === WebSocket.OPEN) {
        admin.ws.send(message);
      }
    }
  }

  sendToDriver(driverId: string, payload: DriverOrderEvent): boolean {
    const driver = this.driverNotifications.get(driverId);
    if (!driver || driver.ws.readyState !== WebSocket.OPEN) return false;
    driver.ws.send(JSON.stringify(payload));
    return true;
  }

  broadcastToSupportChat(ticketId: string, payload: SupportChatEvent, excludeId?: string): void {
    const chats = this.supportChats.get(ticketId) || [];
    const message = JSON.stringify(payload);
    for (const chat of chats) {
      if (chat.participantId !== excludeId && chat.ws.readyState === WebSocket.OPEN) {
        chat.ws.send(message);
      }
    }
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

  isDriverConnected(driverId: string): boolean {
    const driver = this.driverNotifications.get(driverId);
    return !!driver && driver.ws.readyState === WebSocket.OPEN;
  }

  getConnectedAdminsCount(): number {
    return this.adminDashboard.size;
  }

  getConnectedDriversCount(): number {
    return this.driverNotifications.size;
  }

  shutdown(): void {
    if (this.pingInterval) clearInterval(this.pingInterval);

    for (const device of this.connectedDevices.values()) device.ws.close(1001, "Shutdown");
    for (const customer of this.customerTracking.values()) customer.ws.close(1001, "Shutdown");
    for (const admin of this.adminDashboard.values()) admin.ws.close(1001, "Shutdown");
    for (const driver of this.driverNotifications.values()) driver.ws.close(1001, "Shutdown");
    for (const chats of this.supportChats.values()) {
      for (const chat of chats) chat.ws.close(1001, "Shutdown");
    }

    this.connectedDevices.clear();
    this.customerTracking.clear();
    this.adminDashboard.clear();
    this.driverNotifications.clear();
    this.supportChats.clear();

    if (this.wss) this.wss.close();
  }
}

export const wsManager = new WebSocketManager();
