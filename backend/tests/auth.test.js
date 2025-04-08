/**
 * Authentication tests
 * Tests for authentication-related functionality
 */

const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');
const { app } = require('../server');
const User = require('../models/userModel');
const mongoose = require('mongoose');

describe('Authentication API', () => {
  // Clear users collection before tests
  before(async () => {
    try {
      await User.deleteMany({});
    } catch (error) {
      console.error('Error clearing users collection:', error);
    }
  });

  // Test user data
  const testUser = {
    email: 'test@example.com',
    password: 'Test@123456'
  };

  // Test signup
  describe('POST /api/auth/signup', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send(testUser);
      
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('token');
      expect(res.body.data.user).to.have.property('email', testUser.email);
    });

    it('should not register a user with the same email', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send(testUser);
      
      expect(res.status).to.equal(409);
      expect(res.body).to.have.property('success', false);
    });

    it('should not register a user with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'Test@123456'
        });
      
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('success', false);
    });

    it('should not register a user with weak password', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'another@example.com',
          password: 'weak'
        });
      
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('success', false);
    });
  });

  // Test login
  describe('POST /api/auth/login', () => {
    it('should login a user with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send(testUser);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('token');
      expect(res.body.data.user).to.have.property('email', testUser.email);
    });

    it('should not login a user with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password
        });
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('success', false);
    });

    it('should not login a user with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('success', false);
    });
  });

  // Test get current user
  describe('GET /api/auth/me', () => {
    let token;

    // Login and get token before tests
    before(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send(testUser);
      
      token = res.body.data.token;
    });

    it('should get current user with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('email', testUser.email);
    });

    it('should not get current user without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('success', false);
    });

    it('should not get current user with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('success', false);
    });
  });

  // Test update preferences
  describe('PUT /api/auth/preferences', () => {
    let token;

    // Login and get token before tests
    before(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send(testUser);
      
      token = res.body.data.token;
    });

    it('should update user preferences with valid token', async () => {
      const preferences = {
        captureEnabled: false,
        retentionDays: 60,
        showBreadcrumbs: false
      };

      const res = await request(app)
        .put('/api/auth/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({ preferences });
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data.preferences).to.deep.include(preferences);
    });

    it('should not update user preferences without token', async () => {
      const preferences = {
        captureEnabled: true,
        retentionDays: 30,
        showBreadcrumbs: true
      };

      const res = await request(app)
        .put('/api/auth/preferences')
        .send({ preferences });
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('success', false);
    });

    it('should not update user preferences with invalid retention days', async () => {
      const preferences = {
        retentionDays: 0
      };

      const res = await request(app)
        .put('/api/auth/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({ preferences });
      
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('success', false);
    });
  });

  // Clean up after tests
  after(async () => {
    try {
      await User.deleteMany({});
    } catch (error) {
      console.error('Error cleaning up users collection:', error);
    }
  });
});
