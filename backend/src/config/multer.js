const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists (anchored to backend root, not process CWD,
// so it stays consistent under Phusion Passenger / different launch dirs).
const uploadsDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/svg+xml"
];

// Allowed extensions
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".svg"];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let dest = uploadsDir;
    if (file.fieldname === 'categoryImage') {
      dest = path.join(uploadsDir, 'categories');
    } else if (file.fieldname === 'productImage') {
      dest = path.join(uploadsDir, 'products');
    }

    // Ensure the directory exists
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    // Sanitize filename: remove spaces, special chars
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .toLowerCase();
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e6);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = function (req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeOk = ALLOWED_MIME_TYPES.includes(file.mimetype);
  const extOk = ALLOWED_EXTENSIONS.includes(ext);

  if (mimeOk && extOk) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Allowed formats: JPG, JPEG, PNG, WEBP, SVG. Got: ${file.originalname}`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

module.exports = upload;