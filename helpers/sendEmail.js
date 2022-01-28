const sgMail = require("@sendgrid/mail");
require("dotenv").config();

const { SENDGRID_API_KEY, EMAIL_KEY } = process.env;

sgMail.setApiKey(SENDGRID_API_KEY);

// data = {
//   to: "xalino9984@get2israel.com",
//   subject: "Новая заявка с сайта",
//   html: "<p>Ваша заявка принята</p>",
// };

const sendEmail = async (data) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const email = { ...data, from: `${EMAIL_KEY}` };
    await sgMail.send(email);

    return true;
  } catch (error) {
    throw error;
  }
};

module.exports = sendEmail;
