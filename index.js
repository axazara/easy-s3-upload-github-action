const {
  S3Client,
  PutObjectCommand
} = require("@aws-sdk/client-s3");
const fs = require("fs").promises;
const path = require("path");

const {
  S3_REGION,
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  S3_BUCKET,
  S3_PREFIX,
  S3_ACL,
  FILE,
  S3_ENDPOINT
} = process.env;

const initializeS3 = () => {
  return new S3Client({
    endpoint: S3_ENDPOINT || undefined,
    region: S3_REGION || "us-east-1",
    forcePathStyle: true,
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_SECRET_ACCESS_KEY,
    }
  })
};

const uploadToS3 = async (s3, fileName, fileContent) => {
  const params = {
    Bucket: S3_BUCKET,
    Key: path.join(S3_PREFIX || "", fileName),
    Body: fileContent,
  };

  if (S3_ACL) {
    params.ACL = S3_ACL;
  }

  await s3.send(new PutObjectCommand(params));
  console.log(`File uploaded successfully.!`);
};

const uploadFile = async (s3, filePath) => {
  try {
    const stat = await fs.lstat(filePath);

    if (stat.isDirectory()) {
      const files = await fs.readdir(filePath);
      await Promise.all(files.map(file => uploadFile(s3, path.join(filePath, file))));
    } else {
      const fileContent = await fs.readFile(filePath);
      await uploadToS3(s3, path.basename(filePath), fileContent);
    }
  } catch (err) {
    throw Error(`Error processing ${filePath}: ${err.message}`);
  }
};

const main = async () => {
  console.log("Uploading files to S3...");

  const s3 = initializeS3();
  const filePath = FILE;

  if (!filePath) {
    throw Error("FILE environment variable not set. Exiting. Provided : " + filePath);
  }

  await uploadFile(s3, filePath);
};

main().then(r => console.log(r));
