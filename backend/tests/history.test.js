/**
 * History tests
 * Tests for history-related functionality
 */

const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');
const { app } = require('../server');
const User = require('../models/userModel');
const History = require('../models/historyModel');
const mongoose = require('mongoose');

describe('History API', () => {
  let token;
  let userId;

  // Test user data
  const testUser = {
    email: 'history-test@example.com',
    password: 'Test@123456'
  };

  // Sample base64 image (1x1 transparent pixel)
  const sampleBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  // Sample history item
  const sampleHistoryItem = {
    imageBase64: sampleBase64,
    url: 'https://example.com',
    title: 'Example Domain',
    favicon: 'https://example.com/favicon.ico'
  };

  // Set up test user and get token before tests
  before(async () => {
    try {
      // Clear collections
      await User.deleteMany({});
      await History.deleteMany({});

      // Register test user
      const res = await request(app)
        .post('/api/auth/signup')
        .send(testUser);
      
      token = res.body.data.token;
      userId = res.body.data.user.id;
    } catch (error) {
      console.error('Error setting up test user:', error);
    }
  });

  // Test upload screenshot
  describe('POST /api/history/screenshot', () => {
    it('should upload a screenshot with valid data', async () => {
      const res = await request(app)
        .post('/api/history/screenshot')
        .set('Authorization', `Bearer ${token}`)
        .send(sampleHistoryItem);
      
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('url', sampleHistoryItem.url);
      expect(res.body.data).to.have.property('title', sampleHistoryItem.title);
      expect(res.body.data).to.have.property('imageUrl');
    });

    it('should not upload a screenshot without authentication', async () => {
      const res = await request(app)
        .post('/api/history/screenshot')
        .send(sampleHistoryItem);
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('success', false);
    });

    it('should not upload a screenshot with missing data', async () => {
      const res = await request(app)
        .post('/api/history/screenshot')
        .set('Authorization', `Bearer ${token}`)
        .send({
          imageBase64: sampleBase64,
          // Missing url and title
        });
      
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('success', false);
    });
  });

  // Test get user history
  describe('GET /api/history', () => {
    // Add more history items before tests
    before(async () => {
      // Add a few more history items
      for (let i = 1; i <= 3; i++) {
        await request(app)
          .post('/api/history/screenshot')
          .set('Authorization', `Bearer ${token}`)
          .send({
            imageBase64: sampleBase64,
            url: `https://example.com/page${i}`,
            title: `Example Page ${i}`,
            favicon: `https://example.com/favicon${i}.ico`
          });
      }
    });

    it('should get user history with valid token', async () => {
      const res = await request(app)
        .get('/api/history')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('items').that.is.an('array');
      expect(res.body.data.items).to.have.length.at.least(1);
      expect(res.body.data).to.have.property('pagination');
    });

    it('should get user history with pagination', async () => {
      const res = await request(app)
        .get('/api/history?limit=2&page=1')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data.items).to.have.length.at.most(2);
      expect(res.body.data.pagination).to.have.property('limit', 2);
      expect(res.body.data.pagination).to.have.property('page', 1);
    });

    it('should get user history filtered by domain', async () => {
      const res = await request(app)
        .get('/api/history?domain=example.com')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data.items).to.have.length.at.least(1);
      
      // All items should have the same domain
      res.body.data.items.forEach(item => {
        expect(item.domain).to.equal('example.com');
      });
    });

    it('should get user history filtered by search term', async () => {
      const res = await request(app)
        .get('/api/history?search=Example')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data.items).to.have.length.at.least(1);
      
      // All items should match the search term
      res.body.data.items.forEach(item => {
        const matchesTitle = item.title.includes('Example');
        const matchesUrl = item.url.includes('example');
        expect(matchesTitle || matchesUrl).to.be.true;
      });
    });

    it('should not get user history without authentication', async () => {
      const res = await request(app)
        .get('/api/history');
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('success', false);
    });
  });

  // Test get user domains
  describe('GET /api/history/domains', () => {
    it('should get user domains with valid token', async () => {
      const res = await request(app)
        .get('/api/history/domains')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.be.an('array');
      expect(res.body.data).to.have.length.at.least(1);
      
      // Each domain should have a domain and count property
      res.body.data.forEach(domain => {
        expect(domain).to.have.property('domain');
        expect(domain).to.have.property('count');
      });
    });

    it('should not get user domains without authentication', async () => {
      const res = await request(app)
        .get('/api/history/domains');
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('success', false);
    });
  });

  // Test delete history item
  describe('DELETE /api/history/:id', () => {
    let historyItemId;

    // Get a history item ID before tests
    before(async () => {
      const res = await request(app)
        .get('/api/history')
        .set('Authorization', `Bearer ${token}`);
      
      historyItemId = res.body.data.items[0]._id;
    });

    it('should delete a history item with valid ID', async () => {
      const res = await request(app)
        .delete(`/api/history/${historyItemId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('message').that.includes('deleted');
    });

    it('should not delete a history item with invalid ID', async () => {
      const res = await request(app)
        .delete('/api/history/invalidid')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('success', false);
    });

    it('should not delete a history item without authentication', async () => {
      const res = await request(app)
        .delete(`/api/history/${historyItemId}`);
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('success', false);
    });
  });

  // Test clear user history
  describe('DELETE /api/history', () => {
    it('should clear user history', async () => {
      const res = await request(app)
        .delete('/api/history')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('message').that.includes('deleted');
    });

    it('should not clear user history without authentication', async () => {
      const res = await request(app)
        .delete('/api/history');
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('success', false);
    });
  });

  // Clean up after tests
  after(async () => {
    try {
      await User.deleteMany({});
      await History.deleteMany({});
    } catch (error) {
      console.error('Error cleaning up collections:', error);
    }
  });
});
