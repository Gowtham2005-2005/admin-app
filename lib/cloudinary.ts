import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Generates a QR code URL using Cloudinary
 * @param participantId - The participant ID to encode in the QR code
 * @returns Promise<string> - The secure URL of the generated QR code
 */
export async function generateQRCodeUrl(participantId: string): Promise<string> {
  try {
    // Upload text as a QR code to Cloudinary
    const result = await cloudinary.uploader.upload(
      `https://api.qrserver.com/v1/create-qr-code/?data=${participantId}&size=520x520`,
      {
        public_id: `qr_${participantId}`,
        folder: 'tedx_qrcodes',
        overwrite: true // Update if QR code already exists
      }
    );

    return result.secure_url;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}
