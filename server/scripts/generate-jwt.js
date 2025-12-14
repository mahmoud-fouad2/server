#!/usr/bin/env node
const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET;
if (!secret) {
  console.error('JWT_SECRET is not set. Set it in your environment before running this script.');
  process.exit(1);
}

const args = process.argv.slice(2);
const userId = args[0] || 'test-user-id';
const email = args[1] || 'test@example.com';
const payload = { userId, email };

const token = jwt.sign(payload, secret, { expiresIn: '1d' });
console.log(token);
