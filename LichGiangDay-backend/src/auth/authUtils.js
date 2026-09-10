const JWT = require('jsonwebtoken');
const KeyTokenService = require('../services/keyToken.service');

const HEADER = {
  API_KEY: 'x-api-key',
  CLIENT_ID: 'x-client-id',
  AUTHORIZATION: 'authorization',
  REFRESHTOKEN: 'x-rtoken-id'
};

const createTokenPair = async (payload, publicKey, privateKey) => {
  try {
    // accessToken (expires in 2 days)
    const accessToken = await JWT.sign(payload, publicKey, {
      expiresIn: '2 days'
    });

    // refreshToken (expires in 7 days)
    const refreshToken = await JWT.sign(payload, privateKey, {
      expiresIn: '7 days'
    });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error('createTokenPair Error:', error);
    throw error;
  }
};

const authentication = async (req, res, next) => {
  try {
    /*
      1. Check userId in headers (x-client-id)
      2. Get KeyStore by userId
      3. Verify token with publicKey
      4. Attach user to req and call next()
    */
    const userId = req.headers[HEADER.CLIENT_ID]?.toString();
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Invalid Request: Missing Client ID'
      });
    }

    const keyStore = await KeyTokenService.findByUserId(userId);
    if (!keyStore) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Not found KeyStore for user'
      });
    }

    const authHeader = req.headers[HEADER.AUTHORIZATION]?.toString();
    if (!authHeader) {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Invalid Request: Missing Authorization Token'
      });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    try {
      const decodedUser = JWT.verify(token, keyStore.PublicKey);
      if (userId !== decodedUser.userId) {
        return res.status(401).json({
          status: 'error',
          code: 401,
          message: 'Invalid User ID'
        });
      }
      req.keyStore = keyStore;
      req.user = decodedUser;
      return next();
    } catch (err) {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Token expired or invalid: ' + err.message
      });
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Internal Server Error'
    });
  }
};

module.exports = {
  HEADER,
  createTokenPair,
  authentication
};
