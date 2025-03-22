const express = require("express");
const userController = require("../controllers/userController");
const { verifyAccessToken, verifyRefreshToken } = require("../middleware/auth");
const { validate, Joi } = require("express-validation");
const router = express.Router();

const loginValidate = {
  body: Joi.object({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }),
};

router.post("/login", validate(loginValidate, {}, {}), userController.login_user);
router.post("/updateUser", verifyAccessToken, userController.update_user);
router.post("/signup", userController.signup_user);
router.post("/changePassword", verifyAccessToken, userController.change_password);
router.post("/refresh-tokens", userController.refresh_tokens);

module.exports = router;
