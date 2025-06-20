const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    task: { type: String, required: true },
    interval: { type: String, required: true },
    defaultTarget: { type: Number, required: true },
    category: { type: String, required: true },
    order: { type: Number, required: true },
    history: {
        type: [
            {
                date: { type: Date, required: true },
                targetPerDuration: { type: Number, required: true },
                achieved: { type: Number, required: true },
                note: { type: String, required: false }
            }
        ],
        required: true,
    },
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    hidden: { type: Boolean, default: false, },
})

const Goal = mongoose.model('Goal', goalSchema);
module.exports = Goal;