import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 10, fieldSize: 10000 },
  fileFilter(req, file, callback) {
    const allowed = file.fieldname === 'resume'
      ? file.mimetype === 'application/pdf' && /\.pdf$/i.test(file.originalname)
      : ['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype);
    callback(allowed ? null : Object.assign(new Error('Use a PDF resume or a PNG, JPEG or WebP logo (maximum 5 MB)'), { status: 400 }), allowed);
  },
});

export default upload;
