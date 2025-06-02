const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Get the absolute path to the images directory
const getImagesDir = () => {
    // In development, use the project root
    if (process.env.NODE_ENV === 'development') {
        return path.join(process.cwd(), 'images');
    }
    // In production (serverless), use /tmp
    return '/tmp/images';
};

// Create upload directories if they don't exist
const createUploadDirs = () => {
    const baseDir = getImagesDir();
    const dirs = ['menu', 'patisserie', 'events'];

    // Create base images directory if it doesn't exist
    if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
    }

    // Create subdirectories
    dirs.forEach(dir => {
        const fullPath = path.join(baseDir, dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
    });
};

createUploadDirs();

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const baseDir = getImagesDir();
        let uploadPath = baseDir;

        // Determine the upload directory based on the route
        if (req.originalUrl.includes('/menu')) {
            uploadPath = path.join(baseDir, 'menu');
        } else if (req.originalUrl.includes('/patisserie')) {
            uploadPath = path.join(baseDir, 'patisserie');
        } else if (req.originalUrl.includes('/events')) {
            uploadPath = path.join(baseDir, 'events');
        }

        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Create unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

module.exports = upload; 