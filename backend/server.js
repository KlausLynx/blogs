require('dotenv').config()
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt')
const mongoose = require('mongoose');
const user = require('./models/user');
const jwt = require( 'jsonwebtoken' )

const app = express()
app.use(cors)
app.use(express.json())

// Mongo Connection
mongoose.connect(process.env.MONGODB_URI )
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error(err))

const PORT = process.env.PORT || 3000

app.listen((PORT, () => console.log(`Server is running on port ${PORT}`)))

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

app.post('/login', async () => {
    try {
        const { email, password } = req.body
        const existing = await user.findOne({email});
        if  (!existing) {
            return res.status(404).json({message: 'User not found'})
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            return res.status(400).json({message: 'Invalid credentials'})
        }

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '1d'})
        return res.status(200).json({ message: 'Login successful', token })
    } catch (err) {
        return res.status(500).json({message: 'Server failed'})
    }
})

const auth = (req, res, next) => {
    const header = req.headers.authorization

    if(!header) return res.status(404).json({message: 'Token not found'})

    const part = header.split(' ')
    const token = part.length === 2 ? part[1] : part[0]

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET)
        req.userId = decodedToken.id
        next()
    } catch(err) {
        return res.status(401).json({message: 'Invalid or expired token'})
    }
}

app.post('/login', auth, async () => {

})
