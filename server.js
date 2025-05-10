const express = require('express');
const multer = require('multer');
const cors = require('cors');
const admin = require('firebase-admin');
const fs = require('fs').promises;
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use('/track/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json'); // Add this file (see Step 3)
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'YOUR_STORAGE_BUCKET.appspot.com' // Replace with your bucket
});
const db = admin.firestore();
const bucket = admin.storage().bucket();

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
(async () => {
    try {
        await fs.access(uploadsDir);
    } catch {
        await fs.mkdir(uploadsDir);
    }
})();

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'audio/mpeg' || file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only MP3 and image files are allowed'), false);
        }
    }
}).fields([{ name: 'audioFile', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]);

// Upload to Firebase Storage and save to Firestore
app.post('/api/upload', upload, async (req, res) => {
    const { title, artist, genre, type, userEmail } = req.body;
    if (!title || !artist || !req.files.audioFile || !req.files.coverImage) {
        return res.status(400).json({ error: 'All fields (title, artist, audio, cover) are required' });
    }

    const user = await admin.auth().getUserByEmail(userEmail);
    if (!user) {
        return res.status(400).json({ error: 'Invalid user' });
    }

    const audioFile = req.files.audioFile[0];
    const coverFile = req.files.coverImage[0];
    const audioPath = `audio/${Date.now()}_${audioFile.originalname}`;
    const coverPath = `covers/${Date.now()}_${coverFile.originalname}`;

    await bucket.upload(path.join(uploadsDir, audioFile.filename), { destination: audioPath });
    await bucket.upload(path.join(uploadsDir, coverFile.filename), { destination: coverPath });

    const audioUrl = `https://storage.googleapis.com/${bucket.name}/${audioPath}`;
    const coverUrl = `https://storage.googleapis.com/${bucket.name}/${coverPath}`;

    const newTrack = {
        title,
        artist,
        genre,
        type,
        audioUrl,
        coverUrl,
        userEmail,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    await db.collection('music').add(newTrack);

    res.json({ message: 'Upload successful', trackId: newTrack.id });
});

// Fetch music
app.get('/api/music', async (req, res) => {
    const snapshot = await db.collection('music').orderBy('timestamp', 'desc').get();
    const music = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(music);
});

module.exports = app;