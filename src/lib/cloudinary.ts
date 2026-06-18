import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadMedia(
  file: Buffer | string,
  options: {
    folder: string;
    resource_type?: 'image' | 'video' | 'raw' | 'auto';
    public_id?: string;
  }
) {
  return new Promise<{ url: string; public_id: string; resource_type: string }>(
    (resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `hypex/${options.folder}`,
          resource_type: options.resource_type || 'auto',
          public_id: options.public_id,
        },
        (error, result) => {
          if (error || !result) reject(error);
          else
            resolve({
              url: result.secure_url,
              public_id: result.public_id,
              resource_type: result.resource_type,
            });
        }
      );

      if (typeof file === 'string') {
        const base64Data = file.replace(/^data:\w+\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        uploadStream.end(buffer);
      } else {
        uploadStream.end(file);
      }
    }
  );
}

export async function deleteMedia(publicId: string) {
  return cloudinary.uploader.destroy(publicId);
}

export { cloudinary };
