const fs = require('fs');
const path = require('path');

// Create images directory and its subdirectories
const directories = [
    'images',
    'images/menu',
    'images/patisserie',
    'images/events'
];

directories.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

console.log('Directory setup completed'); 