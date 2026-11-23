require('dotenv').config()
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt')
const mongoose = require('mongoose');
const user = require('./models/user');
const blog = require('./models/blog')
const jwt = require( 'jsonwebtoken' );
const multer = require('multer');
const cloudinary = require('cloudinary').v2

const app = express()
app.use(cors())
app.use(express.json())

// Mongo Connection
mongoose.connect(process.env.MONGODB_URI )
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error(err))

// Cloudinary Connection
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existing = await user.findOne({email});
        if (existing) {
            return res.status(400).json({message: 'User already exists'})
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await user.create({name, email, password: hashedPassword})
        return res.status(201).json({message: 'User account created successfully'})
    } catch (err) {
        return res.status(500).json({message: 'Server failed'})
    }
})

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body
        const existing = await user.findOne({email});
        if  (!existing) {
            return res.status(404).json({message: 'User not found'})
        }

        const isMatch = await bcrypt.compare(password, existing.password);

        if (!isMatch) {
            return res.status(400).json({message: 'Invalid credentials'})
        }

        const token = jwt.sign({id: existing._id}, process.env.JWT_SECRET, {expiresIn: '1d'})
        return res.status(200).json({ message: 'Login successful', token })
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Server failed' });
    }
})

const auth = (req, res, next) => {
    const header = req.headers.authorization

    if(!header) return res.status(404).json({message: 'Token not found'})

    const part = header.split(' ')
    const token = part.length === 2 ? part[1] : part[0]

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET)
        console.log("decoded:", decodedToken);
        req.userId = decodedToken.id
        next()
    } catch(err) {
        return res.status(401).json({message: 'Invalid or expired token'})
    }
}

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')|| file.mimetype.startsWith('video/')) {
            cb(null, true)
        }else {
            cb(new Error('Only images and videos allowed'))
        }
    }
})

app.post('/upload', auth, upload.single('file'), async (req, res) => {
    try {
        if(!req.file) {
            return res.status(400).json({ message: 'No file uploaded' })
        }
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { resource_type: 'auto', folder: 'blogapp' },
                (error, result) => {
                if (error) reject(error)
                else resolve(result)
                }
            )
            stream.end(req.file.buffer)
        })

        res.json({ url: result.secure_url })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Upload failed' })
    }
})

app.post('/blog', auth, async (req, res) => {
    try {
        const { title, category, blocks } = req.body

        if(!title || !blocks || blocks.length === 0){
            return res.status(404).json({message: 'Title and at least one block are required'})
        }

        await blog.create({title, category, blocks, author: req.userId})
        return res.status(201).json({message: 'Blog Created'})
    } catch (err) {
        console.log(err);
        return res.status(500).json({message: 'Server Error'})
    }
});

app.get('/dashboard', auth, async (req, res) => {
    console.log("userId:", req.userId, "| header:", req.headers.authorization);
    try {
        const exisitingUser = await user.findById(req.userId).select('name')
        if (!exisitingUser) {
            return res.status(404).json({message: 'User not found'})
        }

        const blogs = await blog.find({ author: req.userId }).sort({ createdAt: -1 });
        console.log({ name: exisitingUser.name, userBlogs: blogs });

        res.status(200).json({message: 'Blogs fetched successfully', name: exisitingUser?.name, blogs});
    } catch (err) {
        console.log(err)
        return res.status(500).json({message: 'Server failure'})
    }
})

app.get('/blogs', async (req, res) => {
    try {
        const {search, category } = req.query
        const filter = {}

        if (category) {
            filter.category = category
        }

        if (search) {
            const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = { $regex: safe, $options: 'i'}
            const users = await user.find({ name: regex }).select('_id')
            const authorIds = users.map((u) => u._id)

            filter.$or = [
                { title: regex },
                { author: { $in: authorIds } }
            ]
        }
        const blogs = await blog.find(filter)
            .sort({ createdAt: -1 })
            .populate('author', 'name')

        return res.json(blogs)
    } catch (err) {
        return res.status(500).json({message: 'Server failure'})
    }
})