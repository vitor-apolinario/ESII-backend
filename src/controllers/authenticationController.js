const jwt = require('jsonwebtoken');
const axios = require('axios');
const { User } = require('../models');
const { status, sendError } = require('../status');

const secret = 'testsecret'; // must be changed to process.env.SECRET later

module.exports = {
  async authenticate(request, response) {
    const fbToken = request.headers.fbtoken;

    if (fbToken) {
      let data;
      try {
        const res = await axios.get('https://graph.facebook.com/v5.0/me', {
          params: {
            access_token: fbToken,
            fields: 'name,email',
          },
        });
        data = res.data;
      } catch (e) {
        return sendError(response, status.BAD_REQUEST);
      }

      let user;
      try {
        user = await User.findOne({ where: { email: data.email } });
        if (user === null) {
          user = await User.create({
            name: data.name,
            email: data.email,
            password: '123',
            // password está hardcoded pois não consegui remover a coluna nas migrations
          });
        }
      } catch (e) {
        return sendError(response, status.SERVER_ERROR);
      }

      const token = jwt.sign({ id: user.id }, secret);

      return response.json({ token });
    }

    return sendError(response, status.WRONG_PASSWORD);
  },
};
