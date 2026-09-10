const db = require('../../config/db');

const HEADER = {
  API_KEY: 'x-api-key',
  AUTHORIZATION: 'authorization'
};

const apiKey = async (req, res, next) => {
  try {
    const key = req.headers[HEADER.API_KEY]?.toString();
    if (!key) {
      return res.status(403).json({
        status: 'error',
        code: 403,
        message: 'Forbidden Error: ApiKey Missing'
      });
    }

    // Check key in Database
    const [rows] = await db.query('SELECT * FROM ApiKeys WHERE `Key` = ? AND Status = 1 LIMIT 1', [key]);
    const objKey = rows[0];

    if (!objKey) {
      return res.status(403).json({
        status: 'error',
        code: 403,
        message: 'Forbidden Error: Invalid ApiKey'
      });
    }

    req.objKey = objKey;
    return next();
  } catch (error) {
    console.error('ApiKey Middleware Error:', error);
    return res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Internal Server Error'
    });
  }
};

const permission = (permissionStr) => {
  return (req, res, next) => {
    if (!req.objKey.Permissions) {
      return res.status(403).json({
        status: 'error',
        code: 403,
        message: 'Permission Denied'
      });
    }
    const valid = req.objKey.Permissions.includes(permissionStr);
    if (!valid) {
      return res.status(403).json({
        status: 'error',
        code: 403,
        message: 'Permission Denied'
      });
    }
    return next();
  };
};

module.exports = {
  apiKey,
  permission
};
