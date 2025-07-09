// 零碳园区数字孪生能碳管理系统 - TypeScript 类型定义
// 为JavaScript项目提供类型安全和更好的IDE支持

// 基础类型定义
export interface BaseEntity {
  id: string | number;
  createdAt: Date;
  updatedAt: Date;
}

// 用户相关类型
export interface User extends BaseEntity {
  username: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  isActive: boolean;
  lastLoginAt?: Date;
}

export interface UserCreateInput {
  username: string;
  email: string;
  password: string;
  role: User['role'];
}

export interface UserUpdateInput {
  username?: string;
  email?: string;
  role?: User['role'];
  isActive?: boolean;
}

// 设备相关类型
export interface Device extends BaseEntity {
  name: string;
  type: DeviceType;
  location: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  specifications: Record<string, any>;
  lastDataTime?: Date;
}

export interface DeviceType {
  id: string;
  name: string;
  category: 'energy_generation' | 'energy_storage' | 'energy_consumption' | 'monitoring';
  dataFields: DeviceDataField[];
}

export interface DeviceDataField {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'date';
  unit?: string;
  description?: string;
  required: boolean;
}

// 能源数据类型
export interface EnergyData extends BaseEntity {
  deviceId: string;
  timestamp: Date;
  power: number; // 功率 (kW)
  energy: number; // 能量 (kWh)
  voltage?: number; // 电压 (V)
  current?: number; // 电流 (A)
  frequency?: number; // 频率 (Hz)
  powerFactor?: number; // 功率因数
  temperature?: number; // 温度 (°C)
  humidity?: number; // 湿度 (%)
}

export interface EnergyDataCreateInput {
  deviceId: string;
  timestamp: Date;
  power: number;
  energy: number;
  voltage?: number;
  current?: number;
  frequency?: number;
  powerFactor?: number;
  temperature?: number;
  humidity?: number;
}

// 碳排放相关类型
export interface CarbonEmission extends BaseEntity {
  deviceId: string;
  timestamp: Date;
  emissionFactor: number; // 排放因子 (kg CO2/kWh)
  energyConsumption: number; // 能耗 (kWh)
  carbonEmission: number; // 碳排放量 (kg CO2)
  scope: 1 | 2 | 3; // 排放范围
}

export interface CarbonCalculationInput {
  deviceId: string;
  startTime: Date;
  endTime: Date;
  emissionFactor?: number;
}

export interface CarbonCalculationResult {
  totalEmission: number;
  averageEmission: number;
  peakEmission: number;
  emissionTrend: 'increasing' | 'decreasing' | 'stable';
  breakdown: {
    scope1: number;
    scope2: number;
    scope3: number;
  };
}

// 预测相关类型
export interface EnergyPrediction extends BaseEntity {
  deviceId: string;
  predictionTime: Date;
  targetTime: Date;
  predictedPower: number;
  predictedEnergy: number;
  confidence: number; // 置信度 (0-1)
  model: string; // 使用的模型名称
  features: Record<string, number>; // 特征值
}

export interface PredictionRequest {
  deviceId: string;
  targetTime: Date;
  horizon: number; // 预测时长 (小时)
  model?: string;
}

// 告警相关类型
export interface Alert extends BaseEntity {
  deviceId: string;
  type: 'energy_anomaly' | 'device_offline' | 'high_emission' | 'system_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  metadata: Record<string, any>;
}

export interface AlertRule {
  id: string;
  name: string;
  deviceId?: string; // 可选，为空表示全局规则
  condition: string; // 条件表达式
  threshold: number;
  severity: Alert['severity'];
  isActive: boolean;
  cooldownPeriod: number; // 冷却期 (分钟)
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  startTime?: Date;
  endTime?: Date;
  deviceId?: string;
  deviceType?: string;
  status?: string;
}

// 缓存相关类型
export interface CacheOptions {
  ttl?: number; // 生存时间 (秒)
  tags?: string[]; // 缓存标签
  namespace?: string; // 命名空间
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalKeys: number;
  memoryUsage: number;
}

// 性能监控类型
export interface PerformanceMetrics {
  timestamp: Date;
  endpoint: string;
  method: string;
  responseTime: number; // 响应时间 (ms)
  statusCode: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage: number; // CPU使用率 (%)
  activeConnections: number;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number; // 运行时间 (秒)
  version: string;
  environment: string;
  services: {
    database: 'connected' | 'disconnected' | 'error';
    redis: 'connected' | 'disconnected' | 'error';
    mqtt: 'connected' | 'disconnected' | 'error';
  };
  metrics: {
    avgResponseTime: number;
    errorRate: number;
    throughput: number; // 请求/秒
  };
}

// 配置类型
export interface AppConfig {
  server: {
    port: number;
    host: string;
    env: 'development' | 'production' | 'test';
  };
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    ssl: boolean;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  mqtt: {
    host: string;
    port: number;
    username?: string;
    password?: string;
  };
  security: {
    jwtSecret: string;
    jwtExpiration: string;
    bcryptRounds: number;
    rateLimitWindow: number;
    rateLimitMax: number;
  };
  cache: {
    defaultTtl: number;
    maxKeys: number;
    checkPeriod: number;
  };
}

// 中间件类型
export interface RequestWithUser extends Request {
  user?: User;
  requestId?: string;
  startTime?: number;
}

export interface ValidationSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: any[];
    custom?: (value: any) => boolean | string;
  };
}

// 错误类型
export interface AppErrorOptions {
  statusCode?: number;
  isOperational?: boolean;
  context?: Record<string, any>;
}

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  context: Record<string, any>;
  timestamp: Date;

  constructor(message: string, options?: AppErrorOptions);
}

// 服务接口
export interface IEnergyDataService {
  create(data: EnergyDataCreateInput): Promise<EnergyData>;
  findById(id: string): Promise<EnergyData | null>;
  findByDevice(deviceId: string, options?: FilterParams & PaginationParams): Promise<EnergyData[]>;
  calculateConsumption(deviceId: string, startTime: Date, endTime: Date): Promise<number>;
  getStatistics(deviceId: string, period: 'hour' | 'day' | 'week' | 'month'): Promise<any>;
}

export interface ICarbonEmissionService {
  calculate(input: CarbonCalculationInput): Promise<CarbonCalculationResult>;
  getEmissionFactor(deviceType: string, region?: string): Promise<number>;
  getTrend(deviceId: string, period: string): Promise<any>;
}

export interface IAlertService {
  create(alert: Omit<Alert, 'id' | 'createdAt' | 'updatedAt'>): Promise<Alert>;
  acknowledge(id: string, userId: string): Promise<void>;
  resolve(id: string, userId: string): Promise<void>;
  getActive(): Promise<Alert[]>;
  checkRules(): Promise<void>;
}

// 主要类型导出
export {
  BaseEntity,
  User,
  Device,
  EnergyData,
  CarbonEmission,
  Prediction,
  Alert,
  ApiResponse,
  PaginatedResponse,
  FilterOptions,
  CacheConfig,
  PerformanceMetrics,
  SystemHealth,
  AppConfig,
  MiddlewareConfig,
  ValidationSchema,
  ErrorType,
  ServiceInterface,
};
