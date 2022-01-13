const express = require("express");
const { NotFound, BadRequest } = require("http-errors");
const { authenticate } = require("../../middlewares");
const { joiSchema } = require("../../model/contact");
const { Contact } = require("../../model");
const router = express.Router();

router.get("/", authenticate, async (req, res, next) => {
  try {
    console.log(req.query);
    const { page = 1, limit = 20, favorite } = req.query;
    const skip = (page - 1) * limit;
    const { _id } = req.user;
    if (favorite === undefined) {
      const contacts = await Contact.find(
        { owner: _id },
        "-createdAt -updatedAt",
        { skip, limit: +limit }
      );
      res.json(contacts);
    }
    const contacts = await Contact.find(
      { owner: _id, favorite },
      "-createdAt -updatedAt",
      { skip, limit: +limit }
    );
    res.json(contacts);
  } catch (error) {
    next(error);
  }
});

router.get("/:contactId", async (req, res, next) => {
  const { contactId } = req.params;
  try {
    const contacts = await Contact.findById(contactId);
    if (!contacts) {
      throw new NotFound();
    }
    res.json(contacts);
  } catch (error) {
    if (error.message.includes("Cast to ObjectId failed")) {
      error.status = 404;
    }
    next(error);
  }
});

router.post("/", authenticate, async (req, res, next) => {
  console.log(req.user);
  try {
    const { error } = joiSchema.validate(req.body);

    if (error) {
      throw new BadRequest({ message: "missing required name field" });
    }
    const { _id } = req.user;
    const newContact = await Contact.create({ ...req.body, owner: _id });
    res.status(201).json(newContact);
  } catch (error) {
    if (error.message.includes("validation failed")) {
      error.status = 404;
    }
    next(error);
  }
});

router.delete("/:contactId", async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const deleteContact = await Contact.findByIdAndRemove(contactId);
    console.log(deleteContact);
    if (!deleteContact) {
      throw new NotFound();
    }
    res.json({ message: "contact deleted" });
  } catch (error) {
    next(error);
  }
});

router.put("/:contactId", async (req, res, next) => {
  try {
    const { error } = joiSchema.validate(req.body);
    if (error) {
      throw new BadRequest({ message: "missing fields" });
    }
    const { contactId } = req.params;
    const updateByContact = await Contact.findByIdAndUpdate(
      contactId,
      req.body,
      { new: true }
    );
    console.log(updateByContact);
    if (!updateByContact) {
      throw new NotFound();
    }
    res.json(updateByContact);
  } catch (error) {
    if (error.message.includes("validation failed")) {
      error.status = 400;
    }
    next(error);
  }
});

router.patch("/:contactId/favorite", async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const { favorite } = req.body;
    if (favorite === undefined) {
      throw new BadRequest({ message: "missing field favorite" });
    }
    const updateStatusContact = await Contact.findByIdAndUpdate(
      contactId,
      { favorite },
      { new: true }
    );
    console.log(updateStatusContact);
    if (!updateStatusContact) {
      throw new NotFound();
    }
    res.json(updateStatusContact);
  } catch (error) {
    if (error.message.includes("validation failed")) {
      error.status = 400;
    }
    next(error);
  }
});

module.exports = router;
