const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    task: String,
    interval: String,
    defaultTarget: Number,
    category: String,
    history: Array,
    accountId: String,
})

const Goal = mongoose.model('Goal', goalSchema);
module.exports = Goal;