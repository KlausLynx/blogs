const mongoose = require('mongoose')

const blockSchema = new mongoose.Schema({
    type: {type: String, enum:['text', 'image', 'video'], required: true},
    value: {type: String, required: true}
},{_id: false})

const CATEGORIES = [
    // Economics
    'Macroeconomics', 'Monetary Policy', 'Fiscal Policy', 'Inflation & Prices',
    'Markets & Investing', 'Development Economics', 'Africa & Nigeria',
    // Geoeconomics
    'Trade & Tariffs', 'Energy & Commodities', 'Sanctions & Export Controls',
    'Supply Chains', 'Currencies & Reserves', 'Debt & Global Finance',
    // Geopolitics
    'Conflict & Security', 'Great Power Rivalry', 'Middle East',
    'Elections & Politics', 'Regional Blocs & Alliances',
    // Fallback
    'Other'
];

const blogSchema = new mongoose.Schema({
    title:{ type: String, required: true},
    category: { type: String, enum: CATEGORIES, default: 'Other' },
    blocks: [blockSchema],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {timestamps: true})

module.exports = mongoose.model('Blog', blogSchema)