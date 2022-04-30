const Goal = require('../models/goal');

const get_goals = (req, res, next) => {

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
        if (err) return next(err);
        goals.map(goal => {
            // create an existing date list
            let dateList = [];
            goal.history.forEach(day => {
                if (!dateList.includes(day.date)) {
                    dateList.push(day.date);
                }
            })

            // sort the list and establish the first and last date
            dateList.sort((a, b) => new Date(a) < new Date(b));
            let firstDate = dateList[0];
            let lastDate = dateList[dateList.length - 1];

            // Loop through first to last date, 1 day at a time, add new day object to any missing date
            for (let i = 0; addDays(new Date(firstDate), i) <= new Date(lastDate); i++) {
                if (goal.history.every(day => day.date !== dateToISOLikeButLocal(addDays(new Date(firstDate), i)).substr(0, 10))) {
                    goal.history.push({
                        date: dateToISOLikeButLocal(addDays(new Date(firstDate), i)).substr(0, 10),
                        targetPerDuration: goal.defaultTarget,
                        achieved: 0,
                    })
                }
            }
            return goal;
        })
        res.json(goals)
    })
}

const update_goal = async (req, res, next) => {
    let { goalId, goal} = req.body;
    console.log(goalId)
    console.log(goal)

    Goal.findOneAndUpdate(
        { _id: goalId, accountId: res.locals.user._id },
        goal,
        {
            new: true
        },
        (err, doc) => {
            if (err) return next(err);
            res.send(goal);
        });
}

const add_goal = (req, res, next) => {
    let goal = new Goal({
        ...req.body,
        accountId: res.locals.user._id,
    });

    let saveGoal = () => {
        goal.save((err) => {
            if (err) return next(err);
            res.sendStatus(200);
        });
    }
    saveGoal();
}

module.exports = {
    get_goals,
    update_goal,
    add_goal,
}