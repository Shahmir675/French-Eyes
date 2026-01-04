import { s3Service } from "../src/services/s3.service.js";

async function main() {
  const key = "products/69510fe4c042c3c04bd8fe70/1767522291075-e3dfef78fadf6fc8-test.png";
  const signedUrl = await s3Service.getSignedUrl(key, 3600);
  console.log("Signed URL (valid for 1 hour):");
  console.log(signedUrl);
}

main().catch(console.error);
