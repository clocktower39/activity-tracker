const Goal = require('../models/goal');
const Category = require('../models/category');

const get_goals = async (req, res, next) => {

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
    const categories = await Category.findOne({ accountId: res.locals.user._id }, (err, doc) => {
        if (err) return next(err);
        return doc;
    })

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
            let today = dateToISOLikeButLocal(new Date()).substr(0,10);

            // Loop through first to last date, 1 day at a time, add new day object to any missing date
            for (let i = 0; addDays(new Date(firstDate), i) <= new Date(today); i++) {
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
        res.send({goals, categories: categories.categories})
    })
}

const update_goal = async (req, res, next) => {
    let { goalId, goal } = req.body;

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

const update_categories =  async (req, res, next) => {
    let { categories } = req.body;

    Category.findOneAndUpdate(
        { accountId: res.locals.user._id },
        { categories },
        {
            new: true
        },
        (err, doc) => {
            if (err) return next(err);
            // Search through goals and update categories as needed
            res.send(doc);
        });
}

module.exports = {
    get_goals,
    update_goal,
    add_goal,
    update_categories,
}