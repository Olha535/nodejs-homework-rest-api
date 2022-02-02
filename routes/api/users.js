const express = require("express");
const { User } = require("../../model");
const { NotFound, BadRequest } = require("http-errors");
const { authenticate, upload } = require("../../middlewares");
const router = express.Router();
const path = require("path");
const fs = require("fs/promises");
const Jimp = require("jimp");
const { sendEmail } = require("../../helpers");
const avatarDir = path.join(__dirname, "../../", "public", "avatars");

const { SITE_NAME } = process.env;

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

router.patch(
  "/avatars",
  authenticate,
  upload.single("avatar"),
  async (req, res) => {
    const { path: tempUpload, filename } = req.file;
    const [extension] = filename.split(".").reverse();
    const newFileName = `${req.user._id}.${extension}`;
    const fileUpload = path.join(avatarDir, newFileName);
    // await fs.rename(tempUpload, fileUpload);
    const avatarURL = path.join("avatars", newFileName);
    await Jimp.read(tempUpload)
      .then((avatar) => {
        return avatar.resize(250, 250).write(tempUpload);
      })
      .catch((error) => {
        throw error;
      });
    await fs.rename(tempUpload, fileUpload);

    await User.findByIdAndUpdate(req.user._id, { avatarURL }, { new: true });
    res.json({ avatarURL });
  }
);

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

//   Добавление повторной отправки email пользователю с ссылкой для верификации

router.post("/verify", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new BadRequest("Missing required field email");
    }
    const user = await User.findOne({ email });
    if (!user) {
      throw new NotFound("User not found");
    }
    if (user.verify) {
      throw new BadRequest("Verification has already been passed");
    }
    const { verificationToken } = user;
    const data = {
      to: email,
      subject: "Подтверждение email",
      html: `<a target="_blank" href="${SITE_NAME}/users/verify/${verificationToken}">Подтвердить email</a>`,
    };

    await sendEmail(data);
    res.json({ message: "Verification email sent" });
  } catch (error) {
    next(error);
  }
});

//   Добавление отправки email пользователю с ссылкой для верификации

router.get("/verify/:verificationToken", async (req, res, next) => {
  try {
    const { verificationToken } = req.params;
    const user = await User.findOne({ verificationToken });
    if (!user) {
      throw new NotFound("User not found");
    }
    await User.findByIdAndUpdate(user._id, {
      verificationToken: null,
      verify: true,
    });
    res.json({
      message: "Verification successful",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
