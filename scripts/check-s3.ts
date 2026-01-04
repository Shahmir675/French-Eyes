import { s3Service } from "../src/services/s3.service.js";

async function main() {
  console.log("Checking bucket exists...");
  const exists = await s3Service.checkBucketExists();
  console.log("Bucket exists:", exists);
  
  console.log("\nListing files in products folder...");
  const files = await s3Service.listFiles("products/", 10);
  console.log("Files:", files);
}

main().catch(console.error);
