const jwt = require("jsonwebtoken");
const {
  accessTokenSecret,
  refreshTokenSecret,
  accessTokenTtl,
  refreshTokenTtl,
} = require("../config/env");

/**
 * Token payloads carry identifiers only.
 *
 * The previous implementation signed `user._doc`, which put the bcrypt password
 * hash inside every token handed to a browser. JWTs are base64, not encrypted.
 * Never widen this payload to a whole document.
 */
const buildPayload = (user, type) => ({
  sub: String(user._id),
  email: user.email,
  tokenVersion: user.tokenVersion ?? 0,
  type,
});

const signAccessToken = (user) =>
  jwt.sign(buildPayload(user, "access"), accessTokenSecret, { expiresIn: accessTokenTtl });

const signRefreshToken = (user) =>
  jwt.sign(buildPayload(user, "refresh"), refreshTokenSecret, { expiresIn: refreshTokenTtl });

const createTokens = (user) => ({
  accessToken: signAccessToken(user),
  refreshToken: signRefreshToken(user),
});

const verifyAccess = (token) => {
  const payload = jwt.verify(token, accessTokenSecret);
  if (payload.type !== "access") throw new Error("Wrong token type");
  return payload;
};

const verifyRefresh = (token) => {
  const payload = jwt.verify(token, refreshTokenSecret);
  if (payload.type !== "refresh") throw new Error("Wrong token type");
  return payload;
};

module.exports = { createTokens, signAccessToken, signRefreshToken, verifyAccess, verifyRefresh };
