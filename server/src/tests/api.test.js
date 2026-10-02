const assert = require('assert');
const { registerSchema, loginSchema, jobSchema } = require('../validators/schemas');

function parse(schema, payload) {
  return schema.parse(payload);
}

parse(registerSchema, {
  body: { email: 'a@b.com', password: 'password1', full_name: 'Test User', role: 'STUDENT' }
});
parse(loginSchema, { body: { email: 'a@b.com', password: 'x' } });
parse(jobSchema, {
  body: {
    title: 'Software Engineer',
    company: 'SIES',
    description: 'A detailed job description that is long enough.',
    job_type: 'FULL_TIME'
  }
});

assert.throws(() => parse(loginSchema, { body: { email: 'bad', password: 'x' } }));
console.log('Validator tests passed');
