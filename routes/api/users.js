const express = require("express");
const { User } = require("../../model");
const { NotFound } = require("http-errors");
const { authenticate } = require("../../middlewares");
const router = express.Router();

router.get("/logout", authenticate, async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: null });
  res.status(204).send();
});

router.get("/current", authenticate, async (req, res) => {
  const { email } = req.user;
  res.json({
    user: {
      email,
    },
  });
});

router.patch("/", authenticate, async (req, res, next) => {
  try {
    const { _id } = req.user;
    const { subscription } = req.body;
    const updateUser = await User.findByIdAndUpdate(
      _id,
      { subscription },
      { new: true }
    );
    if (!updateUser) {
      throw new NotFound();
    }
    res.json(updateUser);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
