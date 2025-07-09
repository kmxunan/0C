/**
 * API路由集成测试
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import router from '../../src/interfaces/http/routes.js';

// Mock authentication middleware
jest.mock('../../src/interfaces/http/middleware/authMiddleware.js', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 'test-user-123', username: 'testuser' };
    next();
  }
}));

// Mock子路由
jest.mock('../../src/interfaces/http/routes/auth.js', () => {
  const express = require('express');
  const router = express.Router();
  router.post('/login', (req, res) => {
    res.json({ success: true, token: 'mock-token' });
  });
  return router;
});

jest.mock('../../src/interfaces/http/routes/devices.js', () => {
  const express = require('express');
  const router = express.Router();
  router.get('/', (req, res) => {
    res.json({ success: true, data: [] });
  });
  return router;
});

jest.mock('../../src/interfaces/http/routes/energy.js', () => {
  const express = require('express');
  const router = express.Router();
  router.get('/', (req, res) => {
    res.json({ success: true, data: { consumption: 100 } });
  });
  return router;
});

jest.mock('../../src/interfaces/http/routes/carbon.js', () => {
  const express = require('express');
  const router = express.Router();
  router.get('/', (req, res) => {
    res.json({ success: true, data: { emissions: 50 } });
  });
  return router;
});

jest.mock('../../src/interfaces/http/routes/maintenance.js', () => {
  const express = require('express');
  const router = express.Router();
  router.get('/', (req, res) => {
    res.json({ success: true, data: [] });
  });
  return router;
});

jest.mock('../../src/interfaces/http/routes/digital-twin.js', () => {
  const express = require('express');
  const router = express.Router();
  router.get('/', (req, res) => {
    res.json({ success: true, data: { status: 'active' } });
  });
  return router;
});

describe('API Routes Integration Tests', () => {
  let app;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', router);
  });
  
  describe('Root endpoints', () => {
    it('should return API information on GET /', async () => {
      const response = await request(app)
        .get('/api/')
        .expect(200);
      
      expect(response.body.message).toContain('零碳园区数字孪生能碳管理系统');
      expect(response.body.version).toBe('2.0.0');
      expect(response.body.endpoints).toBeDefined();
    });
    
    it('should return health status on GET /health', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(response.body.status).toBe('healthy');
      expect(response.body.uptime).toBeDefined();
      expect(response.body.memory).toBeDefined();
    });
    
    it('should return version information on GET /version', async () => {
      const response = await request(app)
        .get('/api/version')
        .expect(200);
      
      expect(response.body.version).toBe('2.0.0');
      expect(response.body.features).toBeInstanceOf(Array);
    });
  });
  
  describe('Authentication routes', () => {
    it('should handle login request', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test', password: 'password' })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
    });
  });
  
  describe('Protected routes', () => {
    it('should access devices endpoint with authentication', async () => {
      const response = await request(app)
        .get('/api/devices')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
    
    it('should access energy endpoint with authentication', async () => {
      const response = await request(app)
        .get('/api/energy')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.consumption).toBeDefined();
    });
    
    it('should access carbon endpoint with authentication', async () => {
      const response = await request(app)
        .get('/api/carbon')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.emissions).toBeDefined();
    });
    
    it('should access maintenance endpoint with authentication', async () => {
      const response = await request(app)
        .get('/api/maintenance')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
    
    it('should access digital-twin endpoint with authentication', async () => {
      const response = await request(app)
        .get('/api/digital-twin')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBeDefined();
    });
  });
  
  describe('Error handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/non-existent')
        .expect(404);
      
      expect(response.body.message).toContain('API端点不存在');
      expect(response.body.requestedPath).toBe('/api/non-existent');
    });
    
    it('should handle different HTTP methods for 404', async () => {
      await request(app)
        .post('/api/non-existent')
        .expect(404);
      
      await request(app)
        .put('/api/non-existent')
        .expect(404);
      
      await request(app)
        .delete('/api/non-existent')
        .expect(404);
    });
  });
});