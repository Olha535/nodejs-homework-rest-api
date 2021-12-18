const fs = require("fs/promises");
const path = require("path");
const { v4 } = require("uuid");
const contactsPath = path.join(__dirname, "contacts.json");

const listContacts = async () => {
  try {
    const list = await fs.readFile(contactsPath);
    const contactsList = JSON.parse(list);
    return contactsList;
  } catch (error) {
    throw error.message;
  }
};

const getContactById = async (contactId) => {
  const contacts = await listContacts();
  const result = contacts.find((item) => item.id === contactId);
  if (!result) {
    return null;
  }
  return result;
};

const removeContact = async (contactId) => {
  const contactsList = await listContacts();
  const idx = await contactsList.findIndex((item) => item.id === contactId);
  if (idx === -1) {
    return null;
  }
  const removeByContact = await contactsList.splice(idx, 1);
  await fs.writeFile(contactsPath, JSON.stringify(contactsList, null, 2));
  return removeByContact;
};

const addContact = async (body) => {
  const contactsList = await listContacts();
  const newContact = { ...body, id: v4() };
  contactsList.push(newContact);
  await fs.writeFile(contactsPath, JSON.stringify(contactsList, null, 2));
  return newContact;
};

const updateContact = async (contactId, body) => {
  const contactsList = await listContacts();
  const idx = contactsList.findIndex((item) => item.id === contactId);
  if (idx === -1) {
    return null;
  }
  contactsList[idx] = { id: contactId, ...body };
  await fs.writeFile(contactsPath, JSON.stringify(contactsList, null, 2));
  return contactsList[idx];
};

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
};
