const express = require("express");
const { Conflict, BadRequest, Unauthorized } = require("http-errors");
const { User } = require("../../model");
const { joiSchema } = require("../../model/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const { nanoid } = require("nanoid");
const { sendEmail } = require("../../helpers");

const router = express.Router();

const { SECRET_KEY, SITE_NAME } = process.env;

router.post("/signup", async (req, res, next) => {
  try {
    const { error } = joiSchema.validate(req.body);
    if (error) {
      throw new BadRequest(error.message);
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      throw new Conflict("Email in use");
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const verificationToken = nanoid();
    const avatarURL = gravatar.url(email);
    const newUser = await User.create({
      email,
      verificationToken,
      password: hashPassword,
      avatarURL,
    });
    // <a href="${SITE_NAME}/users/verify/${verificationToken}">Подтвердить email</a>
    const data = {
      to: email,
      subject: "Подтверждение email",
      html: `<a target="_blank" href="${SITE_NAME}/api/users/verify/${verificationToken}">Подтвердить email</a>`,
    };

    await sendEmail(data);

    res.status(201).json({
      user: {
        email: newUser.email,
        subscription: "starter",
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { error } = joiSchema.validate(req.body);
    if (error) {
      throw new BadRequest(error.message);
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      throw new Unauthorized("Email or password is wrong");
    }
    if (!user.verify) {
      throw new Unauthorized("Email not verify");
    }
    const passwordCompare = await bcrypt.compare(password, user.password);
    if (!passwordCompare) {
      throw new Unauthorized("Email or password is wrong");
    }
    // if (!user) {
    //   throw new Unauthorized("Email  is wrong");
    // }
    // const passwordCompare = await bcrypt.compare(password, user.password);
    // if (!passwordCompare) {
    //   throw new Unauthorized("Password is wrong");
    // }
    const { _id } = user;
    const payload = {
      id: _id,
    };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1d" });
    await User.findByIdAndUpdate(_id, { token });
    res.json({
      token,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
