import dotenv from "dotenv";

dotenv.config();

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

function getEnvVarAsNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue === undefined) {
      throw new Error(`Missing environment variable: ${key}`);
    }
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid number for environment variable: ${key}`);
  }
  return parsed;
}

export const config = {
  port: getEnvVarAsNumber("PORT", 3000),
  nodeEnv: getEnvVar("NODE_ENV", "development"),
  apiUrl: getEnvVar("API_URL", "http://localhost:3000"),

  mongodb: {
    uri: getEnvVar("MONGODB_URI"),
  },

  jwt: {
    secret: getEnvVar("JWT_SECRET"),
    expiresIn: getEnvVar("JWT_EXPIRES_IN", "15m"),
    refreshSecret: getEnvVar("REFRESH_TOKEN_SECRET"),
    refreshExpiresIn: getEnvVar("REFRESH_TOKEN_EXPIRES_IN", "7d"),
  },

  cors: {
    origin: getEnvVar("CORS_ORIGIN", "http://localhost:3000").split(","),
  },

  aws: {
    accessKeyId: getEnvVar("AWS_ACCESS_KEY_ID", ""),
    secretAccessKey: getEnvVar("AWS_SECRET_ACCESS_KEY", ""),
    region: getEnvVar("AWS_REGION", "eu-central-1"),
    s3Bucket: getEnvVar("AWS_S3_BUCKET", ""),
  },

  stripe: {
    publishableKey: getEnvVar("STRIPE_PUBLISHABLE_KEY", ""),
    secretKey: getEnvVar("STRIPE_SECRET_KEY", ""),
    webhookSecret: getEnvVar("STRIPE_WEBHOOK_SECRET", ""),
  },

  paypal: {
    clientId: getEnvVar("PAYPAL_CLIENT_ID", ""),
    clientSecret: getEnvVar("PAYPAL_CLIENT_SECRET", ""),
    webhookId: getEnvVar("PAYPAL_WEBHOOK_ID", ""),
  },

  oauth: {
    google: {
      clientId: getEnvVar("GOOGLE_CLIENT_ID", ""),
      clientSecret: getEnvVar("GOOGLE_CLIENT_SECRET", ""),
    },
    facebook: {
      appId: getEnvVar("FACEBOOK_APP_ID", ""),
      appSecret: getEnvVar("FACEBOOK_APP_SECRET", ""),
    },
  },

  firebase: {
    serviceAccountPath: getEnvVar("FIREBASE_SERVICE_ACCOUNT_PATH", "./firebase-service-account.json"),
  },

  rateLimit: {
    windowMs: 60 * 1000,
    max: 100,
  },
} as const;

export type Config = typeof config;
