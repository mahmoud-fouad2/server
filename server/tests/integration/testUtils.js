function genEmail(prefix = 'test') {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
}

function genName(prefix = 'Test') {
  return `${prefix} ${Date.now()}`;
}

module.exports = { genEmail, genName };
