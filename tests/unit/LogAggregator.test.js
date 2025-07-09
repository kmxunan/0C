/**
 * LogAggregator 单元测试
 */

import { jest } from '@jest/globals';
import { LogAggregator } from '../../src/shared/utils/LogAggregator.js';
import fs from 'fs';
import path from 'path';

// Mock fs module
jest.mock('fs');
jest.mock('path');

describe('LogAggregator', () => {
  let logAggregator;
  
  beforeEach(() => {
    logAggregator = new LogAggregator({
      logDir: '/tmp/test-logs',
      maxFiles: 5,
      rotateInterval: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    if (logAggregator.rotationTimer) {
      clearInterval(logAggregator.rotationTimer);
    }
    if (logAggregator.analysisTimer) {
      clearInterval(logAggregator.analysisTimer);
    }
  });
  
  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultAggregator = new LogAggregator();
      expect(defaultAggregator.options).toBeDefined();
      expect(defaultAggregator.logBuffer).toEqual([]);
      expect(defaultAggregator.logStats).toBeDefined();
    });
    
    it('should initialize with custom options', () => {
      expect(logAggregator.options.logDir).toBe('/tmp/test-logs');
      expect(logAggregator.options.maxFiles).toBe(5);
    });
  });
  
  describe('log', () => {
    it('should log message with correct format', () => {
      const message = 'Test log message';
      const metadata = { userId: '123', action: 'test' };
      
      logAggregator.log('info', message, metadata);
      
      expect(logAggregator.logBuffer).toHaveLength(1);
      const logEntry = logAggregator.logBuffer[0];
      
      expect(logEntry.level).toBe('INFO');
      expect(logEntry.message).toBe(message);
      expect(logEntry.metadata).toEqual(metadata);
      expect(logEntry.timestamp).toBeDefined();
    });
    
    it('should update statistics correctly', () => {
      logAggregator.log('error', 'Error message');
      logAggregator.log('warn', 'Warning message');
      logAggregator.log('info', 'Info message');
      
      expect(logAggregator.logStats.totalLogs).toBe(3);
      expect(logAggregator.logStats.errorCount).toBe(1);
      expect(logAggregator.logStats.warnCount).toBe(1);
      expect(logAggregator.logStats.infoCount).toBe(1);
    });
  });
  
  describe('setupLogRotation', () => {
    it('should setup rotation timer', () => {
      logAggregator.setupLogRotation();
      
      expect(logAggregator.rotationTimer).toBeDefined();
      expect(typeof logAggregator.rotationTimer).toBe('object');
    });
  });
  
  describe('startAnalysisTask', () => {
    it('should setup analysis timer', () => {
      logAggregator.startAnalysisTask();
      
      expect(logAggregator.analysisTimer).toBeDefined();
      expect(typeof logAggregator.analysisTimer).toBe('object');
    });
  });
  
  describe('close', () => {
    it('should clear all timers and close streams', () => {
      // Setup timers
      logAggregator.setupLogRotation();
      logAggregator.startAnalysisTask();
      
      const rotationTimer = logAggregator.rotationTimer;
      const analysisTimer = logAggregator.analysisTimer;
      
      // Mock stream
      const mockStream = { end: jest.fn() };
      logAggregator.logStreams.set('test.log', mockStream);
      
      logAggregator.close();
      
      expect(logAggregator.rotationTimer).toBeNull();
      expect(logAggregator.analysisTimer).toBeNull();
      expect(mockStream.end).toHaveBeenCalled();
      expect(logAggregator.logStreams.size).toBe(0);
    });
  });
  
  describe('cleanupOldLogs', () => {
    it('should delete old log files when exceeding maxFiles', () => {
      // Mock fs.readdirSync
      const mockFiles = ['log1.log', 'log2.log', 'log3.log', 'log4.log', 'log5.log', 'log6.log'];
      fs.readdirSync.mockReturnValue(mockFiles);
      
      // Mock fs.statSync
      fs.statSync.mockImplementation((filePath) => ({
        mtime: new Date(Date.now() - Math.random() * 1000000)
      }));
      
      // Mock fs.unlinkSync
      fs.unlinkSync.mockImplementation(() => {});
      
      logAggregator.cleanupOldLogs();
      
      expect(fs.unlinkSync).toHaveBeenCalled();
    });
  });
  
  describe('addAlertRule', () => {
    it('should add alert rule correctly', () => {
      const ruleName = 'test_rule';
      const rule = {
        condition: () => true,
        message: 'Test alert',
        cooldown: 60000
      };
      
      logAggregator.addAlertRule(ruleName, rule);
      
      expect(logAggregator.alertRules.has(ruleName)).toBe(true);
      const addedRule = logAggregator.alertRules.get(ruleName);
      expect(addedRule.message).toBe(rule.message);
      expect(addedRule.lastTriggered).toBe(0);
    });
  });
  
  describe('getStats', () => {
    it('should return current statistics', () => {
      logAggregator.log('info', 'Test message');
      
      const stats = logAggregator.getStats();
      
      expect(stats.totalLogs).toBe(1);
      expect(stats.infoCount).toBe(1);
      expect(stats.startTime).toBeDefined();
    });
  });
});