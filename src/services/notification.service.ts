import admin from "firebase-admin";
import { config } from "../config";
import path from "path";

let firebaseInitialized = false;

function initializeFirebase(): boolean {
  if (firebaseInitialized) {
    return true;
  }

  try {
    const serviceAccountPath = path.resolve(config.firebase.serviceAccountPath);
    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    firebaseInitialized = true;
    console.log("Firebase Admin SDK initialized successfully");
    return true;
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
    return false;
  }
}

initializeFirebase();

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendPushNotification(
  deviceToken: string,
  payload: PushNotificationPayload
): Promise<NotificationResult> {
  if (!firebaseInitialized) {
    return { success: false, error: "Firebase not initialized" };
  }

  const message: admin.messaging.Message = {
    token: deviceToken,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    android: {
      priority: "high",
      notification: {
        channelId: "default",
        priority: "high",
        defaultSound: true,
      },
    },
    apns: {
      payload: {
        aps: {
          alert: {
            title: payload.title,
            body: payload.body,
          },
          sound: "default",
          badge: 1,
        },
      },
    },
  };

  if (payload.data) {
    message.data = payload.data;
  }

  if (payload.imageUrl) {
    message.notification!.imageUrl = payload.imageUrl;
    message.android!.notification!.imageUrl = payload.imageUrl;
    message.apns!.fcmOptions = { imageUrl: payload.imageUrl };
  }

  try {
    const response = await admin.messaging().send(message);
    return { success: true, messageId: response };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to send push notification:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function sendMulticastNotification(
  deviceTokens: string[],
  payload: PushNotificationPayload
): Promise<{ successCount: number; failureCount: number; results: NotificationResult[] }> {
  if (!firebaseInitialized) {
    return {
      successCount: 0,
      failureCount: deviceTokens.length,
      results: deviceTokens.map(() => ({ success: false, error: "Firebase not initialized" })),
    };
  }

  if (deviceTokens.length === 0) {
    return { successCount: 0, failureCount: 0, results: [] };
  }

  const message: admin.messaging.MulticastMessage = {
    tokens: deviceTokens,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    android: {
      priority: "high",
      notification: {
        channelId: "default",
        priority: "high",
        defaultSound: true,
      },
    },
    apns: {
      payload: {
        aps: {
          alert: {
            title: payload.title,
            body: payload.body,
          },
          sound: "default",
          badge: 1,
        },
      },
    },
  };

  if (payload.data) {
    message.data = payload.data;
  }

  if (payload.imageUrl) {
    message.notification!.imageUrl = payload.imageUrl;
    message.android!.notification!.imageUrl = payload.imageUrl;
    message.apns!.fcmOptions = { imageUrl: payload.imageUrl };
  }

  try {
    const response = await admin.messaging().sendEachForMulticast(message);

    const results: NotificationResult[] = response.responses.map((res) => {
      if (res.success && res.messageId) {
        return { success: true, messageId: res.messageId };
      }
      if (res.success) {
        return { success: true };
      }
      return { success: false, error: res.error?.message || "Unknown error" };
    });

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      results,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to send multicast notification:", errorMessage);
    return {
      successCount: 0,
      failureCount: deviceTokens.length,
      results: deviceTokens.map(() => ({ success: false, error: errorMessage })),
    };
  }
}

export async function sendTopicNotification(
  topic: string,
  payload: PushNotificationPayload
): Promise<NotificationResult> {
  if (!firebaseInitialized) {
    return { success: false, error: "Firebase not initialized" };
  }

  const message: admin.messaging.Message = {
    topic,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    android: {
      priority: "high",
      notification: {
        channelId: "default",
        priority: "high",
        defaultSound: true,
      },
    },
    apns: {
      payload: {
        aps: {
          alert: {
            title: payload.title,
            body: payload.body,
          },
          sound: "default",
        },
      },
    },
  };

  if (payload.data) {
    message.data = payload.data;
  }

  if (payload.imageUrl) {
    message.notification!.imageUrl = payload.imageUrl;
    message.android!.notification!.imageUrl = payload.imageUrl;
    message.apns!.fcmOptions = { imageUrl: payload.imageUrl };
  }

  try {
    const response = await admin.messaging().send(message);
    return { success: true, messageId: response };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to send topic notification:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function subscribeToTopic(
  deviceTokens: string[],
  topic: string
): Promise<{ successCount: number; failureCount: number }> {
  if (!firebaseInitialized) {
    return { successCount: 0, failureCount: deviceTokens.length };
  }

  try {
    const response = await admin.messaging().subscribeToTopic(deviceTokens, topic);
    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error("Failed to subscribe to topic:", error);
    return { successCount: 0, failureCount: deviceTokens.length };
  }
}

export async function unsubscribeFromTopic(
  deviceTokens: string[],
  topic: string
): Promise<{ successCount: number; failureCount: number }> {
  if (!firebaseInitialized) {
    return { successCount: 0, failureCount: deviceTokens.length };
  }

  try {
    const response = await admin.messaging().unsubscribeFromTopic(deviceTokens, topic);
    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error("Failed to unsubscribe from topic:", error);
    return { successCount: 0, failureCount: deviceTokens.length };
  }
}

export function isFirebaseInitialized(): boolean {
  return firebaseInitialized;
}
