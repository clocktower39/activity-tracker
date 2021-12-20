const Goal = require('../models/goal');

const get_goals = (req, res) => {

    const addDays = (date, days) => {
        var result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
      }
      
    Goal.find({accountId: res.locals.user._id}, (err, goal)=>{
        // add missing dates to history to complete recharts data
        let dateList = [];

        // add all currently used dates to an array for all goals
        goal.forEach(g => {
            g.history.forEach(day => {
                if(!dateList.includes(day.date)){
                    dateList.push(day.date);
                }
            })
        })

        // sort the date array to set the earliest and end dates
        let sortedByDate = dateList.sort((a,b) => new Date(a) - new Date(b))
        let earliestDate = sortedByDate[0];
        let endDate = sortedByDate[sortedByDate.length - 1];

            //loop through to each goal
        goal.map(g => {
            //loop through each date from earliestDate to endDate
            for(let i = 1; addDays(new Date(earliestDate), i) < new Date(endDate); i++){
                let currentDateIteration = addDays(new Date(earliestDate), i);
                // check each objects date value for current date, add if missing
                if(!g.history.some(d => new Date(d.date) === currentDateIteration)){
                    g.history.push({
                        date: currentDateIteration.toISOString().substr(0,10),
                        targetPerDuration: g.defaultTarget,
                        achieved: 0,
                    })
                }
            }
            g.history = g.history.sort((a,b) => new Date(a.date) - new Date(b.date));
            return g;
        })

        res.json(goal)
    })
}

const update_goal = async (req, res) => {
    let updatedGoal = req.body;

    let doc = await Goal.findOneAndUpdate({task: updatedGoal.task, accountId: res.locals.user._id }, updatedGoal, {
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