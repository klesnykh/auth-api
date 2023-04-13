'use strict';
require('dotenv').config();
const server = require('../src/server');
const { users } = require('../src/models');
const supertest = require('supertest');
const request = supertest(server.server);

beforeAll( async() => {
  await users.model.sync();
});

afterAll( async() => {
  await users.model.drop();
});

describe('Testing Auth: sign in / sign up', () => {
  let testUser = {};
  let token = '';

  test('Able to sign up a user', async () => {
    testUser = {
      username: 'Kirk',
      password: '9182'
    }

    let response = await request.post('/signup').send(testUser);
    expect(response.body.user.username).toEqual('Kirk');
  });

  test('Able to sign in with a proper login and recieve a token', async () => {
    let response = await request.post('/signin').auth('Kirk', '9182');
    token = response.body.token;

    expect(response.body.user.username).toEqual('Kirk');
    expect(token).toBeTruthy();
  });
});
