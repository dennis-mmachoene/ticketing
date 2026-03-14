const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a buffer to Cloudinary.
 * @param {Buffer} buffer
 * @param {object} options  - folder, public_id, resource_type, format
 * @returns {Promise<{url, public_id}>}
 */
const uploadBuffer = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder:        options.folder        || 'ticketvault',
      public_id:     options.public_id     || undefined,
      resource_type: options.resource_type || 'auto',
      format:        options.format        || undefined,
      overwrite:     true,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

/**
 * Upload a poster image buffer.
 */
const uploadPoster = async (buffer, eventSlug) => {
  return uploadBuffer(buffer, {
    folder:    'ticketvault/posters',
    public_id: `poster-${eventSlug}-${Date.now()}`,
    resource_type: 'image',
  });
};

/**
 * Upload a ticket PDF buffer.
 */
const uploadTicketPDF = async (buffer, ticketId) => {
  return uploadBuffer(buffer, {
    folder:        'ticketvault/tickets',
    public_id:     ticketId,
    resource_type: 'raw',
    format:        'pdf',
  });
};

/**
 * Delete a Cloudinary asset by public_id.
 */
const deleteAsset = async (publicId, resourceType = 'image') => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
  }
};

module.exports = { uploadPoster, uploadTicketPDF, deleteAsset };