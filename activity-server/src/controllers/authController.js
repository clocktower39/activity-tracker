const User = require("../models/user");
const Category = require("../models/category");
const { ApiError, asyncHandler } = require("../lib/apiError");
const { createTokens, verifyRefresh } = require("../lib/tokens");

const DEFAULT_CATEGORIES = [
  { category: "Health", order: 0 },
  { category: "Work", order: 1 },
  { category: "Personal", order: 2 },
];

const signup = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password || !firstName || !lastName) {
    throw new ApiError(400, "Email, password, first name and last name are all required");
  }
  if (String(password).length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    throw new ApiError(409, "An account with that email already exists");
  }

  const user = await User.create({
    email: normalizedEmail,
    password,
    firstName,
    lastName,
    themeMode: "dark",
  });

  // Give a new account something to organise goals into.
  await Category.create({ accountId: user._id, categories: DEFAULT_CATEGORIES });

  const tokens = createTokens(user);
  res.status(201).json({ user: user.toPublicJSON(), ...tokens });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, "Email and password are required");

  const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select("+password");

  // One message for both branches so the endpoint cannot be used to enumerate
  // which email addresses have accounts.
  const invalid = new ApiError(401, "Incorrect email or password");
  if (!user) throw invalid;
  if (!(await user.comparePassword(password))) throw invalid;

  const tokens = createTokens(user);
  res.json({ user: user.toPublicJSON(), ...tokens });
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken || typeof refreshToken !== "string") {
    throw new ApiError(400, "A refresh token is required");
  }

  let payload;
  try {
    payload = verifyRefresh(refreshToken);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, "Invalid or expired refresh token");
  if ((user.tokenVersion ?? 0) !== (payload.tokenVersion ?? 0)) {
    throw new ApiError(401, "Session no longer valid, please sign in again");
  }

  // Rotate both tokens. The old implementation minted a new refresh token and
  // then threw it away, leaving one 90-day credential alive forever.
  const tokens = createTokens(user);
  res.json({ user: user.toPublicJSON(), ...tokens });
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(res.locals.user._id);
  if (!user) throw new ApiError(404, "User not found");
  res.json({ user: user.toPublicJSON() });
});

const updateProfile = asyncHandler(async (req, res) => {
  // Explicit allow-list. The previous version spread req.body straight into
  // findByIdAndUpdate, which let a client write `password` in plaintext.
  const allowed = ["firstName", "lastName", "themeMode"];
  const updates = {};
  for (const field of allowed) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  if (Object.keys(updates).length === 0) throw new ApiError(400, "No supported fields to update");

  const user = await User.findByIdAndUpdate(res.locals.user._id, updates, {
    new: true,
    runValidators: true,
  });
  if (!user) throw new ApiError(404, "User not found");

  res.json({ user: user.toPublicJSON() });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current and new password are both required");
  }
  if (String(newPassword).length < 8) {
    throw new ApiError(400, "New password must be at least 8 characters");
  }
  if (currentPassword === newPassword) {
    throw new ApiError(400, "New password must differ from the current one");
  }

  const user = await User.findById(res.locals.user._id).select("+password");
  if (!user) throw new ApiError(404, "User not found");
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, "Current password is incorrect");
  }

  user.password = newPassword;
  // Invalidates every token issued before this moment, including refresh tokens
  // held by other devices.
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();

  // Hand back a fresh pair so the current device stays signed in.
  res.json({ user: user.toPublicJSON(), ...createTokens(user) });
});

module.exports = { signup, login, refresh, me, updateProfile, changePassword };
