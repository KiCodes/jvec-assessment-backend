const crypto = require("crypto");

let secretKey;

const generateSecretKey = () => {
  if (!secretKey) {
    // Generate a new secret key
    secretKey = crypto.randomBytes(64).toString("hex");
  }
  return secretKey;
};

module.exports = generateSecretKey;
