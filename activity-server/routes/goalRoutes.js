const express = require('express');
const goalController = require('../controllers/goalController');

const router = express.Router();

router.get('/', goalController.get_goals);
router.post('/update', goalController.update_goal);
router.post('/addGoal', goalController.add_goal);

module.exports = router;