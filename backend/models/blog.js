const mongoose = require('mongoose')

const blockSchema = new mongoose.Schema({
    type: {type: String, enum:['text', 'image', 'video'], required: true},
    value: {type: String, required: true}
},{_id: false})

const blogSchema = new mongoose.Schema({
    title:{ type: String, required: true},
    category:{ type: String, enum:['Technology', 'Travel', 'Lifestyle', 'Education', 'Other'], default: true },
    block: [blockSchema],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {timestamps: true})