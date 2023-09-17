const aws = require("aws-sdk");
const fs = require("fs").promises;
const path = require("path");

const initializeS3 = () => {
  const spacesEndpoint = new aws.Endpoint(process.env.S3_ENDPOINT);
  return new aws.S3({
    endpoint: spacesEndpoint,
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  });
};

const uploadToS3 = async (s3, fileName, fileContent, destination = null) => {
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: destination ? destination : path.join(process.env.S3_PREFIX || "", fileName),
    Body: fileContent,
  };

  if (process.env.S3_ACL) {
    params.ACL = process.env.S3_ACL;
  }

  try {
    const { Location } = await s3.upload(params).promise();
    console.log(`File uploaded successfully. ${Location}`);
  } catch (err) {
    throw new Error(`File upload failed: ${err.message}`);
  }
};

const uploadFile = async (s3, filePath) => {
  try {
    const stat = await fs.lstat(filePath);

    if (stat.isDirectory()) {
      const files = await fs.readdir(filePath);
      await Promise.all(files.map(file => uploadFile(s3, path.join(filePath, file))));
    } else {
      const fileContent = await fs.readFile(filePath);
      const destination = process.env.S3_DESTINATION  || path.join(process.env.S3_PREFIX || "", filePath);
      await uploadToS3(s3, path.normalize(filePath), fileContent, destination);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}: ${err.message}`);
  }
};

const main = async () => {
  const s3 = initializeS3();
  const filePath = process.env.FILE;

  if (!filePath) {
    console.error("FILE environment variable not set. Exiting.");
    return;
  }

  await uploadFile(s3, filePath);
};

main().catch(err => console.error(`Error: ${err.message}`));
