const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { verifyRefreshToken } = require("../middleware/auth");
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

const createTokens = (user) => {
  const accessToken = jwt.sign(user._doc, ACCESS_TOKEN_SECRET, {
    expiresIn: "180m", // Set a shorter expiration for access tokens
  });

  const refreshToken = jwt.sign(user._doc, REFRESH_TOKEN_SECRET, {
    expiresIn: "90d", // Set a longer expiration for refresh tokens
  });

  return { accessToken, refreshToken };
};

const update_user = (req, res, next) => {
  User.findByIdAndUpdate(res.locals.user._id, { ...req.body }, { new: true })
    .then((user) => {
      if (!user) {
        res.send({
          status: "error",
          err: err ? err : "",
        });
      } else {
        const accessToken = jwt.sign(user._doc, ACCESS_TOKEN_SECRET, {
          expiresIn: "30d", // expires in 30 days
        });
        res.send({ status: "Successful", accessToken });
      }
    })
    .catch((err) => next(err));
};

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
        user
          .comparePassword(req.body.password)
          .then((isMatch) => {
            if (isMatch) {
              const tokens = createTokens(user);
              res.send({
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
              });
            } else {
              res.send({
                error: { password: "Incorrect Password" },
              });
            }
          })
          .catch(() => res.send({ authenticated: false }));
      }
    })
    .catch((err) => next(err));
};

const refresh_tokens = (req, res, next) => {
  const { refreshToken } = req.body;

  verifyRefreshToken(refreshToken)
    .then((verifiedRefreshToken) => {
      return User.findById(verifiedRefreshToken._id).exec();
    })
    .then((user) => {
      if (!user) {
        return res.status(404).send({ error: "User not found" });
      }

      const tokens = createTokens(user);
      res.send({
        accessToken: tokens.accessToken,
      });
    })
    .catch((err) => res.status(403).send({ error: "Invalid refresh token", err }));
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
          error: { username: "GUEST password can not be changed." },
        });
      } else {
        user.comparePassword(req.body.currentPassword).then((isMatch) => {
          if (isMatch) {
            user.password = req.body.newPassword;
            return user.save().then((savedUser) => {
              const tokens = createTokens(savedUser);
              res.send({
                status: "success",
                user: savedUser,
                accessToken: tokens.accessToken,
              });
            });
          } else {
            res.send({
              name: "Validation Failed",
              message: "Validation Failed",
              statusCode: 400,
              error: "Bad Request",
              details: {
                body: [
                  {
                    message: "Incorrect Current Password.",
                    path: ["currentPassword"],
                    context: {
                      label: "currentPassword",
                      value: "",
                      key: "currentPassword",
                    },
                  },
                ],
                status: "Incorrect Current Password.",
              },
            });
          }
        });
      }
    })
    .catch((err) => next(err));
};

module.exports = {
  update_user,
  signup_user,
  login_user,
  change_password,
  refresh_tokens,
};
