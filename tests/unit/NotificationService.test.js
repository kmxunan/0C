/**
 * NotificationService 单元测试
 */

import { jest } from '@jest/globals';
import NotificationService from '../../src/core/services/NotificationService.js';

describe('NotificationService', () => {
  let notificationService;
  
  beforeEach(() => {
    notificationService = new NotificationService();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      expect(notificationService).toBeDefined();
      expect(notificationService.transporters).toBeDefined();
      expect(notificationService.preferences).toBeDefined();
    });
  });
  
  describe('saveUserPreferences', () => {
    it('should save user notification preferences', async () => {
      const userId = 'test-user-123';
      const preferences = {
        email: true,
        sms: false,
        push: true,
        discord: false
      };
      
      // Mock database operations
      const mockQuery = jest.fn().mockResolvedValue({ rows: [] });
      notificationService.db = { query: mockQuery };
      
      await notificationService.saveUserPreferences(userId, preferences);
      
      expect(mockQuery).toHaveBeenCalled();
    });
  });
  
  describe('sendAlert', () => {
    it('should send alert notification', async () => {
      const alertData = {
        type: 'energy_threshold',
        message: 'Energy consumption exceeded threshold',
        severity: 'high',
        userId: 'test-user-123'
      };
      
      // Mock methods
      const mockGetUserPreferences = jest.fn().mockResolvedValue({
        email: true,
        sms: false,
        push: true
      });
      const mockSendEmail = jest.fn().mockResolvedValue(true);
      const mockSendPush = jest.fn().mockResolvedValue(true);
      
      notificationService.getUserPreferences = mockGetUserPreferences;
      notificationService.sendEmail = mockSendEmail;
      notificationService.sendPushNotification = mockSendPush;
      
      await notificationService.sendAlert(alertData);
      
      expect(mockGetUserPreferences).toHaveBeenCalledWith(alertData.userId);
    });
  });
  
  describe('formatAlertMessage', () => {
    it('should format alert message correctly', () => {
      const alertData = {
        type: 'energy_threshold',
        message: 'Energy consumption exceeded',
        severity: 'high',
        timestamp: new Date().toISOString()
      };
      
      const formatted = notificationService.formatAlertMessage(alertData);
      
      expect(formatted).toContain(alertData.message);
      expect(formatted).toContain(alertData.severity);
    });
  });
  
  describe('validatePreferences', () => {
    it('should validate notification preferences', () => {
      const validPreferences = {
        email: true,
        sms: false,
        push: true,
        discord: false
      };
      
      const result = notificationService.validatePreferences(validPreferences);
      expect(result.isValid).toBe(true);
    });
    
    it('should reject invalid preferences', () => {
      const invalidPreferences = {
        email: 'invalid',
        sms: null
      };
      
      const result = notificationService.validatePreferences(invalidPreferences);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
});