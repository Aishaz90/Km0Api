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

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload only images.'), false);
    }
};

// Configure multer upload
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

module.exports = upload; 