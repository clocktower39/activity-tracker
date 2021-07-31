const express = require('express');
const goalController = require('../controllers/goalController');

const router = express.Router();

router.post('/update', goalController.update_goal);

module.exports = router;