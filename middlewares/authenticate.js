const jwt = require("jsonwebtoken");
const { User } = require("../model");
const { SECRET_KEY } = process.env;
const { Unauthorized } = require("http-errors");

const authenticate = async (req, res, next) => {
  try {
    // Считываем заголовок authorization с заголовка
    const { authorization } = req.headers;
    if (!authorization) {
      throw new Unauthorized("Not authorized");
    }
    // Разделяем заголовок на два слова
    const [bearer, token] = authorization.split(" ");

    // Проверяем, равно ли первое слово "Bearer"
    if (bearer !== "Bearer") {
      throw new Unauthorized("Not authorized");
    }
    // Проверяем токен на валидность
    jwt.verify(token, SECRET_KEY);

    // Находим в коллекции users пользователя с таким токеном
    const user = await User.findOne({ token });
    if (!user) {
      throw new Unauthorized("Not authorized");
    }
    // Прикрепляем к объекту запроса (req) найденного пользователя:
    req.user = user;
    next();
  } catch (error) {
    if (!error.status) {
      error.status = 401;
      error.message = "Not authorized";
    }
    next(error);
  }
};

module.exports = authenticate;
