const { onRequest } = require('firebase-functions/v2/https');

exports.testSimple = onRequest((req, res) => {
  res.json({ status: 'ok', message: 'Test function works' });
});
