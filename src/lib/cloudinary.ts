import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads an image file to Cloudinary and returns the secure URL.
 * @param file - The file to upload, received from FormData.
 * @returns The secure URL of the uploaded image.
 */
export async function uploadImage(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = buffer.toString('base64');
  const dataUri = `data:${file.type};base64,${base64}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    resource_type: 'image',
  });
  return result.secure_url;
}