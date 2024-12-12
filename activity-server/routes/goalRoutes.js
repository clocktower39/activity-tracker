const express = require('express');
const goalController = require('../controllers/goalController');
const auth = require("../middleware/auth");

const router = express.Router();

router.post('/', auth, goalController.get_goals);
router.post('/update', auth, goalController.update_goal);
router.post('/updateHistoryItem', auth, goalController.update_history_item);
router.post('/newHistoryItem', auth, goalController.new_history_item);
router.post('/addGoal', auth, goalController.add_goal);
router.post('/deleteGoal', auth, goalController.delete_goal);
router.post('/updateCategories', auth, goalController.update_categories);

module.exports = router;