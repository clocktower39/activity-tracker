const Goal = require('../models/goal');

const get_goals = (req, res) => {

    // add or subtract days from date
    const addDays = (date, days) => {
        var result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    // format a Date object like ISO
    const dateToISOLikeButLocal = (date) => {
      const offsetMs = date.getTimezoneOffset() * 60 * 1000;
      const msLocal = date.getTime() - offsetMs;
      const dateLocal = new Date(msLocal);
      const iso = dateLocal.toISOString();
      const isoLocal = iso.slice(0, 19);
      return isoLocal;
    };

    Goal.find({ accountId: res.locals.user._id }, (err, goals) => {
        if (err) {
            sendStatus(500);
        }
        else {
            goals.map(goal => {
                // create an existing date list
                let dateList = [];
                goal.history.forEach(day => {
                    if (!dateList.includes(day.date)) {
                        dateList.push(day.date);
                    }
                })

                // sort the list and establish the first and last date
                dateList.sort((a,b)=> new Date(a) < new Date(b));
                let firstDate = dateList[0];
                let lastDate = dateList[dateList.length - 1];

                // Loop through first to last date, 1 day at a time, add new day object to any missing date
                for(let i = 0; addDays(new Date(firstDate), i) <= new Date(lastDate); i++){
                    if(goal.history.every(day => day.date !== dateToISOLikeButLocal(addDays(new Date(firstDate), i)).substr(0,10))){
                        goal.history.push({
                            date: dateToISOLikeButLocal(addDays(new Date(firstDate), i)).substr(0,10),
                            targetPerDuration: goal.defaultTarget,
                            achieved: 0,
                        })
                    }
                }
                return goal;
            })
            res.json(goals)
        }
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