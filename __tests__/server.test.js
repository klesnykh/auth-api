'use strict';
require('dotenv').config();
const server = require('../src/server');
const { db } = require('../src/models');
const supertest = require('supertest');
const request = supertest(server.server);

beforeAll( async() => {
  await db.sync();
});

afterAll( async() => {
  await db.drop();
});

describe('Testing Routes:', () => {
  
  describe('V1: UnAuthenticated API routes', () => {
    
    test('POST /api/v1/:model adds an item to the DB and returns an object with the added item.', async () => {
      let response = await request.post('/api/v1/food').send({name: 'pork', calories: 12, type: 'protein'});
      expect(response.body.name).toEqual('pork');
    });

    test('GET /api/v1/:model returns a list of :model items.', async () => {
      let response = await request.get('/api/v1/food');
      expect(response.body[0].name).toEqual('pork');
    });

    test('GET /api/v1/:model/ID returns a single item by ID.', async () => {
      let response = await request.get('/api/v1/food/1');
      expect(response.body.name).toEqual('pork');
    });

    test('PUT /api/v1/:model/ID returns a single, updated item by ID.', async () => {
      let response = await request.put('/api/v1/food/1').send({name: 'pork', calories: 13, type: 'protein'});
      expect(response.body.calories).toEqual(13);
    });

    test('DELETE /api/v1/:model/ID returns an empty object. Subsequent GET for the same ID should result in nothing found.', async () => {
      let response = await request.delete('/api/v1/food/1');

      let checkDeleted = await request.get('/api/v1/food/1');

      expect(response.body).toEqual(1);
      expect(checkDeleted.body).not.toBeTruthy();
    });
  });

  describe('V2: Authenticated API routes', () => {
    let testUser = {
      username: 'Kirk',
      password: '9182',
      role: 'admin',
    };
    let token = '';

    test('First, sign in, and get the token', async () => {
      await request.post('/signup').send(testUser);
      let response = await request.post('/signin').auth('Kirk', '9182');
      token = response.body.token;

      expect(response.body.user.username).toEqual('Kirk');
      expect(token).toBeTruthy();
    });

    test('POST /api/v2/:model with a bearer token that has create permissions adds an item to the DB and returns an object with the added item.', async () => {
      let response = await request.post('/api/v2/food').set('Authorization', `Bearer ${token}`).send({name: 'pork', calories: 12, type: 'protein'});
      expect(response.status).toEqual(201);
      expect(response.body.name).toEqual('pork');
    });

    test('GET /api/v2/:model with a bearer token that has read permissions returns a list of :model items.', async () => {
      let response = await request.get('/api/v2/food').set('Authorization', `Bearer ${token}`);
      console.log(response.body);
      expect(response.body[0].name).toEqual('pork');
    });

    test('GET /api/v2/:model/ID with a bearer token that has read permissions returns a single item by ID.', async () => {
      let response = await request.get('/api/v2/food/2').set('Authorization', `Bearer ${token}`);
      expect(response.body.name).toEqual('pork');
    });

    test('PUT /api/v2/:model/ID with a bearer token that has update permissions returns a single, updated item by ID.', async () => {
      let response = await request.put('/api/v2/food/2').set('Authorization', `Bearer ${token}`).send({name: 'pork', calories: 13, type: 'protein'});
      expect(response.body.calories).toEqual(13);
    });

    test('DELETE /api/v2/:model/ID with a bearer token that has delete permissions returns an empty object. Subsequent GET for the same ID should result in nothing found.', async () => {
      let response = await request.delete('/api/v2/food/2').set('Authorization', `Bearer ${token}`);

      let checkDeleted = await request.get('/api/v2/food/2').set('Authorization', `Bearer ${token}`);
      
      expect(response.body).toEqual(1);
      expect(checkDeleted.body).not.toBeTruthy();
    });
  });
});