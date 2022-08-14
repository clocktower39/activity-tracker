const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    account: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
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