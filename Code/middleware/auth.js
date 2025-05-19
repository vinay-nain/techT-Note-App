const jwt = require("jsonwebtoken");
const asyncWrap = require("../utils/asyncWrap.js");
const User = require("../models/user.js");
const ExpressError = require("../utils/expressError");

module.exports = asyncWrap(async function protectRoute(req, res, next) {
    const token = req.cookies.jwt;
    if (!token) throw new ExpressError(400, "unauthorized - no token provided");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded)
        throw new ExpressError(400, "unauthorized - no token provided");

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) throw new ExpressError(400, "unauthorized - user not found");

    req.user = user;

    next();
});
