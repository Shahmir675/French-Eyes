import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "../config/index.js";
import { AppError } from "../utils/errors.js";
import * as crypto from "crypto";
import * as path from "path";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
  "text/csv": ".csv",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
};

class S3Service {
  private client: S3Client;
  private bucket: string;
  private region: string;

  constructor() {
    this.region = config.aws.region;
    this.bucket = config.aws.s3Bucket;

    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    });
  }

  async checkBucketExists(): Promise<boolean> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return true;
    } catch {
      return false;
    }
  }

  private generateKey(folder: string, originalName: string, mimeType: string): string {
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(8).toString("hex");
    const ext = MIME_TO_EXT[mimeType] || path.extname(originalName) || "";
    const sanitizedName = path
      .basename(originalName, path.extname(originalName))
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .substring(0, 50);
    return `${folder}/${timestamp}-${randomId}-${sanitizedName}${ext}`;
  }

  private validateFile(buffer: Buffer, mimeType: string): void {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw AppError.validation(`File type ${mimeType} is not allowed`);
    }

    if (buffer.length > MAX_FILE_SIZE) {
      throw AppError.validation(
        `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }
  }

  async uploadFile(
    buffer: Buffer,
    mimeType: string,
    folder: string,
    originalName: string
  ): Promise<{ url: string; key: string }> {
    this.validateFile(buffer, mimeType);

    const key = this.generateKey(folder, originalName, mimeType);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    });

    await this.client.send(command);

    const url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    return { url, key };
  }

  async uploadProductImage(
    buffer: Buffer,
    mimeType: string,
    productId: string,
    originalName: string
  ): Promise<{ url: string; key: string }> {
    return this.uploadFile(buffer, mimeType, `products/${productId}`, originalName);
  }

  async uploadCategoryImage(
    buffer: Buffer,
    mimeType: string,
    categoryId: string,
    originalName: string
  ): Promise<{ url: string; key: string }> {
    return this.uploadFile(buffer, mimeType, `categories/${categoryId}`, originalName);
  }

  async uploadBonusImage(
    buffer: Buffer,
    mimeType: string,
    bonusId: string,
    originalName: string
  ): Promise<{ url: string; key: string }> {
    return this.uploadFile(buffer, mimeType, `bonuses/${bonusId}`, originalName);
  }

  async uploadExport(
    buffer: Buffer,
    mimeType: string,
    exportType: string,
    filename: string
  ): Promise<{ url: string; key: string; signedUrl: string }> {
    const result = await this.uploadFile(buffer, mimeType, `exports/${exportType}`, filename);
    const signedUrl = await this.getSignedUrl(result.key, 3600);
    return { ...result, signedUrl };
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  async deleteFileByUrl(url: string): Promise<void> {
    const key = this.extractKeyFromUrl(url);
    if (key) {
      await this.deleteFile(key);
    }
  }

  private extractKeyFromUrl(url: string): string | null {
    const bucketUrlPattern = new RegExp(
      `https://${this.bucket}\\.s3\\.${this.region}\\.amazonaws\\.com/(.+)`
    );
    const match = url.match(bucketUrlPattern);
    return match && match[1] ? match[1] : null;
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }

  async getSignedUploadUrl(
    folder: string,
    filename: string,
    mimeType: string,
    expiresIn: number = 3600
  ): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw AppError.validation(`File type ${mimeType} is not allowed`);
    }

    const key = this.generateKey(folder, filename, mimeType);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn });
    const publicUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    return { uploadUrl, key, publicUrl };
  }

  async listFiles(prefix: string, maxKeys: number = 100): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const response = await this.client.send(command);
    return response.Contents?.map((item) => item.Key || "").filter(Boolean) || [];
  }

  async deleteFolder(prefix: string): Promise<void> {
    const keys = await this.listFiles(prefix, 1000);

    for (const key of keys) {
      await this.deleteFile(key);
    }
  }

  getPublicUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
}

export const s3Service = new S3Service();
