import multer from "multer";

// Configure multer to handle file uploads in memory
const storage = multer.memoryStorage();

// File filter to only accept PDF files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Middleware to handle single file upload with field name 'cvFile'
export const uploadCV = (req, res, next) => {
  upload.single("cvFile")(req, res, (err) => {
    if (err) {
      // Handle multer errors
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File size too large. Maximum size is 10MB",
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      // Handle other errors (like file type validation)
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    next();
  });
};

// File filter for images only
const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (JPEG, PNG, GIF, WebP)"), false);
  }
};

// Configure multer for images
const uploadImage = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for images
  },
});

// Middleware to handle single image upload with field name 'profileImage'
export const uploadProfileImage = (req, res, next) => {
  uploadImage.single("profileImage")(req, res, (err) => {
    if (err) {
      // Handle multer errors
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File size too large. Maximum size is 5MB",
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      // Handle other errors (like file type validation)
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    next();
  });
};
