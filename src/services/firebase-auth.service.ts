import admin from "firebase-admin";
import { isFirebaseInitialized } from "./notification.service.js";
import { AppError } from "../utils/errors.js";

export interface FirebaseUserInfo {
  uid: string;
  email: string | undefined;
  name: string | undefined;
  picture: string | undefined;
  provider: "google" | "facebook" | "email";
}

export async function verifyFirebaseIdToken(
  idToken: string
): Promise<FirebaseUserInfo> {
  if (!isFirebaseInitialized()) {
    throw AppError.socialAuthFailed("Firebase not initialized");
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    let provider: "google" | "facebook" | "email" = "email";
    const signInProvider = decodedToken.firebase?.sign_in_provider;

    if (signInProvider === "google.com") {
      provider = "google";
    } else if (signInProvider === "facebook.com") {
      provider = "facebook";
    }

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken["name"],
      picture: decodedToken["picture"],
      provider,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("expired")) {
        throw AppError.socialAuthFailed("Token has expired");
      }
      if (error.message.includes("invalid")) {
        throw AppError.socialAuthFailed("Invalid token");
      }
    }
    throw AppError.socialAuthFailed("Failed to verify token");
  }
}
