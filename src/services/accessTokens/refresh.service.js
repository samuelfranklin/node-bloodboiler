const { StatusCodes } = require('http-status-codes');
const { jwt, ApplicationError } = require('../../utils');
const { messages } = require('../../helpers');
const usersService = require('../users');
const accessTokensService = require('./create.service');

module.exports = {
  refreshTokens: async (refreshToken) => {
    let userId;
    jwt.verify(refreshToken, (err, decoded) => {
      if (err) {
        throw new ApplicationError(err.message, StatusCodes.UNAUTHORIZED);
      }

      userId = decoded.sub.id;
    });

    const user = await usersService.get(userId);
    const userRefreshToken = user.tokens.find((document) => document.refresh === refreshToken);

    if (!userRefreshToken) {
      throw new ApplicationError(messages.notFound('token'), StatusCodes.NOT_FOUND);
    }

    if (userRefreshToken.expired) {
      throw new ApplicationError(messages.expiredToken, StatusCodes.UNAUTHORIZED);
    }

    const payload = {
      sub: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    };

    user.tokens.id(userRefreshToken._id).expired = true;

    await usersService.update(user._id, user);

    return accessTokensService.create(payload);
  },
};