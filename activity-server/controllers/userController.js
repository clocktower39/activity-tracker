const User = require("../models/user");
const jwt = require("jsonwebtoken");
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

const update_user = (req, res, next) => {
  User.findByIdAndUpdate(res.locals.user._id, { ...req.body }, { new: true }, function (err, user) {
    if (err) return next(err);
    if (!user) {
      res.send({
        status: 'error',
        err: err ? err : '',
      })
    }
    else {
      const accessToken = jwt.sign(user._doc, ACCESS_TOKEN_SECRET, {
        expiresIn: "30d", // expires in 30 days
      });
      res.send({ status: 'Successful', accessToken });
    }
  })
}

const signup_user = (req, res, next) => {
  let user = new User(req.body);
  let saveUser = () => {
    user.save((err) => {
      if (err) return next(err);
      res.send({
        status: "success",
        user,
      });
    });
  };
  saveUser();
};

const login_user = (req, res, next) => {
  User.findOne({ email: req.body.email })
  .then((user) => {
    if (!user) {
      res.send({
        authenticated: false,
        error: { email: "Username not found" },
      });
    } else {
      user.comparePassword(req.body.password, function (err, isMatch) {
        if (err) {
          res.send({
            authenticated: false,
          });
        }
        if (isMatch) {
          const accessToken = jwt.sign(user._doc, ACCESS_TOKEN_SECRET, {
            expiresIn: "30d", // expires in 30 days
          });
          res.send({
            accessToken: accessToken,
          });
        } else {
          res.send({
            error: { password: "Incorrect Password" },
          });
        }
      });
    }
  })
  .catch((err) => next(err));
};

const change_password = (req, res, next) => {
  User.findOne({ email: res.locals.user.email })
  .then((user) => {
    if (!user) {
      res.send({
        error: { status: "User not found" },
      });
    } else if (user.email === "DEMO@FAKEACCOUNT.COM") {
      res.send({
        error: { username: "GUEST password can not be changed." }
      })
    } else {
      user.comparePassword(req.body.currentPassword, function (err, isMatch) {
        if (err) {
          res.send({
            error: { status: 'Incorrect Current Password' },
          });
        }
        if (isMatch) {
          user.password = req.body.newPassword;
          user.save().then(savedUser => {
            const accessToken = jwt.sign(savedUser._doc, ACCESS_TOKEN_SECRET, {
              expiresIn: "30d", // expires in 30 days
            });
            res.send({ accessToken });
          })
        } else {
          res.send({
            error: { status: "Password change failed." },
          });
        }
      });
    }
  })
  .catch((err) => next(err));
};

const checkAuthLoginToken = (req, res) => {
  res.send("Authorized");
};

module.exports = {
  update_user,
  signup_user,
  login_user,
  checkAuthLoginToken,
  change_password,
};
