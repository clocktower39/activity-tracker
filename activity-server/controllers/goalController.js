const Goal = require('../models/goal');

const get_goals = (req, res) => {
    Goal.find({}, (err, goal)=>{
        res.json(goal)
        console.log(req.socket.remoteAddress);
    })
}

const update_goal = async (req, res) => {
    let updatedGoal = req.body;

    let doc = await Goal.findOneAndUpdate({task: updatedGoal.task }, updatedGoal, {
        new: true
    });

    res.send(updatedGoal);
}

const add_goal = (req, res) => {
    let goal = new Goal(req.body);

    let saveGoal = () => {
        goal.save((err)=>{
            if(err){
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