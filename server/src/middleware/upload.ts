import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
// Resolve relative to project root (same logic as server/src/index.ts)
const projectRoot = path.join(__dirname, '../..');
const uploadsDir = path.resolve(projectRoot, 'uploads');
console.log('📁 Upload directory:', uploadsDir);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
} else {
  console.log('✅ Uploads directory exists');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: type-timestamp.extension
    // Determine type from field name or query parameter
    let type = 'file';
    if (file.fieldname === 'logo') {
      type = 'logo';
    } else if (file.fieldname === 'image') {
      // Check if it's a homepage carousel image from query param
      // Note: req.body is not available yet when multer processes the file
      const imageType = req.query?.type as string;
      if (imageType === 'homepage-image') {
        type = 'homepage-image';
      } else {
        type = 'article-image';
      }
    }
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${type}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

