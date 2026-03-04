function success(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

function error(res, message, statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    error: message,
  });
}

function created(res, data) {
  return success(res, data, 201);
}

module.exports = {
  success,
  error,
  created,
};
