const express = require('express');
const goalController = require('../controllers/goalController');
const { verifyAccessToken, verifyRefreshToken } = require("../middleware/auth");

const router = express.Router();

router.post('/', verifyAccessToken, goalController.get_goals);
router.post('/update', verifyAccessToken, goalController.update_goal);
router.post('/updateHistoryItem', verifyAccessToken, goalController.update_history_item);
router.post('/newHistoryItem', verifyAccessToken, goalController.new_history_item);
router.post('/addGoal', verifyAccessToken, goalController.add_goal);
router.post('/deleteGoal', verifyAccessToken, goalController.delete_goal);
router.post('/updateCategories', verifyAccessToken, goalController.update_categories);

module.exports = router;