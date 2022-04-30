const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    task: {type: String, required: true},
    interval: {type: String, required: true},
    defaultTarget: {type: Number, required: true},
    category: {type: String, required: true},
    history: {
        type: [
            {
                date:{ type: String, required: true },
                targetPerDuration: { type: Number, required: true },
                achieved: { type: Number, required: true }
            }
        ],
        required: true,
    },
    accountId: {type: String, required: true},
})

const Goal = mongoose.model('Goal', goalSchema);
module.exports = Goal;