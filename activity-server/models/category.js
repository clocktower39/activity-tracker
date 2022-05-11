const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    accountId: {type: String, required: true},
    categories: {
        type: [
            {
                category:{ type: String, required: true },
                order: { type: Number, required: true }
            }
        ],
        required: true,
    },
})

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;