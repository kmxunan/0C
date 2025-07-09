/**
 * 数据库表结构类型定义
 * 确保前后端类型一致性
 */

// 基础实体接口
export interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
}

// 用户相关类型
export interface User extends BaseEntity {
  username: string;
  password_hash: string;
  role: 'admin' | 'user' | 'viewer';
  last_login?: Date;
}

export interface UserCreateInput {
  username: string;
  password: string;
  role: 'admin' | 'user' | 'viewer';
}

export interface UserUpdateInput {
  username?: string;
  password?: string;
  role?: 'admin' | 'user' | 'viewer';
}

// 设备相关类型
export interface Device extends BaseEntity {
  name: string;
  type: string;
  model?: string;
  manufacturer?: string;
  metadata?: Record<string, any>;
  is_active: boolean;
}

export interface DeviceType {
  id: number;
  name: string;
  code: string;
  description?: string;
  category?: string;
  manufacturer?: string;
  is_active: boolean;
  data_schema?: string;
  created_at: Date;
  updated_at: Date;
}

// 能源数据类型
export interface EnergyData extends BaseEntity {
  device_id: string;
  timestamp: Date;
  power: number;
  energy: number;
  voltage?: number;
  current?: number;
  frequency?: number;
  power_factor?: number;
  metadata?: Record<string, any>;
}

// 碳排放数据类型
export interface CarbonData extends BaseEntity {
  device_id: string;
  timestamp: Date;
  carbon_emission: number;
  emission_factor: number;
  energy_consumption: number;
  calculation_method: string;
  metadata?: Record<string, any>;
}

// 零碳园区数字孪生系统 - 能-碳-产-资源四要素数据模型

// 能源活动数据 (符合国家标准)
export interface EnergyActivityData extends BaseEntity {
  enterprise_id: string;
  activity_type: 'fossil_fuel' | 'electricity' | 'heat' | 'renewable';
  energy_type: string; // 原煤、洗精煤、焦炭、汽油、柴油、天然气等
  consumption_amount: number;
  consumption_unit: string; // 万吨、吨、立方米、kWh、GJ等
  data_source: 'ems' | 'dcs' | 'erp' | 'meter' | 'invoice';
  collection_frequency: 'realtime' | 'hourly' | 'daily' | 'monthly';
  is_green_energy: boolean; // 是否为绿色能源
  green_certificate_id?: string; // 绿证ID
  timestamp: Date;
  metadata?: Record<string, any>;
}

// 工业过程数据
export interface IndustrialProcessData extends BaseEntity {
  enterprise_id: string;
  product_type: string; // 水泥熟料、石灰、合成氨、甲醇、电解铝、粗钢等
  production_amount: number;
  production_unit: string; // 吨
  process_emission_factor: number;
  data_source: 'mes' | 'erp';
  collection_frequency: 'daily' | 'monthly';
  timestamp: Date;
  metadata?: Record<string, any>;
}

// 资源循环数据
export interface ResourceCirculationData extends BaseEntity {
  enterprise_id: string;
  resource_type: 'solid_waste' | 'water' | 'waste_heat' | 'waste_pressure';
  resource_category: string;
  generation_amount: number;
  utilization_amount: number;
  storage_amount: number;
  disposal_amount: number;
  unit: string; // 吨、立方米、GJ等
  data_source: 'environmental_ledger' | 'waste_management_system' | 'monitoring_device';
  collection_frequency: 'realtime' | 'hourly' | 'daily' | 'monthly';
  timestamp: Date;
  metadata?: Record<string, any>;
}

// 企业基础信息数据
export interface EnterpriseBasicData extends BaseEntity {
  enterprise_name: string;
  industry_code: string;
  main_products: string[];
  land_area: number; // 占地面积
  employee_count: number;
  industrial_output_value: number; // 工业总产值(万元)
  added_value: number; // 增加值(万元)
  data_source: 'park_management' | 'enterprise_erp';
  update_frequency: 'monthly' | 'yearly';
  is_active: boolean;
  metadata?: Record<string, any>;
}

// 储能设备类型
export interface StorageDevice extends BaseEntity {
  device_id: string;
  capacity: number;
  efficiency: number;
  min_soc: number;
  max_soc: number;
  charge_rate?: number;
  discharge_rate?: number;
  battery_type?: string;
  warranty_years?: number;
  installation_date?: Date;
}

// 告警相关类型
export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  data_type: string;
  device_id?: string;
  conditions: string; // JSON格式
  actions: string; // JSON格式
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  rule_id: string;
  device_id?: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  triggered_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  metadata?: string; // JSON格式
}

// 推荐系统类型
export interface RecommendationRule extends BaseEntity {
  name: string;
  description?: string;
  rule_type: string;
  conditions: Record<string, any>;
  actions: Record<string, any>;
  priority: number;
  is_active: boolean;
  effectiveness_score?: number;
}

export interface Recommendation extends BaseEntity {
  rule_id: string;
  device_id?: string;
  title: string;
  description: string;
  recommendation_type: string;
  priority: number;
  status: 'pending' | 'accepted' | 'rejected' | 'implemented';
  estimated_savings?: number;
  implementation_cost?: number;
  payback_period?: number;
  metadata?: Record<string, any>;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 分页查询参数
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 查询过滤器
export interface QueryFilters {
  startDate?: string;
  endDate?: string;
  deviceId?: string;
  deviceType?: string;
  status?: string;
  [key: string]: any;
}

// WebSocket消息类型
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: Date;
  clientId?: string;
}

// 系统配置类型
export interface SystemConfig {
  key: string;
  value: string;
  description?: string;
  category: string;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

// 日志类型
export interface SystemLog {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  service: string;
  module?: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// 性能指标类型
export interface PerformanceMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  unit: string;
  device_id?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// 数据导出类型
export interface ExportRequest {
  format: 'csv' | 'xlsx' | 'json';
  dataType: 'energy' | 'carbon' | 'devices' | 'alerts';
  filters: QueryFilters;
  columns?: string[];
}

export interface ExportResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  download_url?: string;
  file_size?: number;
  created_at: Date;
  expires_at: Date;
}
