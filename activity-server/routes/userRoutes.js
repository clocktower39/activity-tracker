const express = require('express');
const userController = require('../controllers/userController');
const auth = require("../middleware/auth");
const { validate, Joi } = require('express-validation');
const router = express.Router();

const loginValidate = {
    body: Joi.object({
        email: Joi.string()
            .required().email(),
        password: Joi.string()
            .required(),
    }),
}

router.get('/checkAuthToken', auth, userController.checkAuthLoginToken);
router.post('/login', validate(loginValidate, {}, {}), userController.login_user);
router.post('/signup', userController.signup_user);
router.post('/changePassword', auth, userController.change_password);

module.exports = router;