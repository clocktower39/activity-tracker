const Goal = require('../models/goal');

const get_goals = (req, res) => {
    Goal.find({ accountId: res.locals.user._id }, (err, goals) => {
        res.json(goals)
    })
}

const update_goal = async (req, res) => {
    let updatedGoal = req.body;

    let doc = await Goal.findOneAndUpdate({ task: updatedGoal.task, accountId: res.locals.user._id }, updatedGoal, {
        new: true
    });

    res.send(updatedGoal);
}

const add_goal = (req, res) => {
    let goal = new Goal({
        ...req.body,
        accountId: res.locals.user._id,
    });

    let saveGoal = () => {
        goal.save((err) => {
            if (err) {
                sendStatus(500);
            }
            else {
                res.sendStatus(200);
            }
        });
    }
    saveGoal();
}

module.exports = {
    get_goals,
    update_goal,
    add_goal,
}