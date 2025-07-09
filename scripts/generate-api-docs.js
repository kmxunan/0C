#!/usr/bin/env node
/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * API文档生成器
 * 自动扫描路由文件并生成API文档
 */
class ApiDocGenerator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.routesDir = path.join(this.projectRoot, 'src/interfaces/http');
    this.outputDir = path.join(this.projectRoot, 'docs/api');
    this.apiEndpoints = [];
  }

  /**
   * 生成API文档
   */
  async generate() {
    console.log('🚀 开始生成API文档...');

    try {
      // 确保输出目录存在
      await this.ensureOutputDir();

      // 扫描路由文件
      await this.scanRoutes();

      // 生成文档
      await this.generateMarkdownDocs();
      await this.generateOpenApiSpec();
      await this.generatePostmanCollection();

      console.log('✅ API文档生成完成!');
      console.log(`📁 文档位置: ${this.outputDir}`);
    } catch (error) {
      console.error('❌ API文档生成失败:', error);
      throw error;
    }
  }

  /**
   * 确保输出目录存在
   */
  async ensureOutputDir() {
    try {
      await fs.promises.access(this.outputDir);
    } catch {
      await fs.promises.mkdir(this.outputDir, { recursive: true });
    }
  }

  /**
   * 扫描路由文件
   */
  async scanRoutes() {
    console.log('🔍 扫描路由文件...');

    const routeFiles = await this.findRouteFiles(this.routesDir);

    for (const file of routeFiles) {
      await this.parseRouteFile(file);
    }

    console.log(`📋 发现 ${this.apiEndpoints.length} 个API端点`);
  }

  /**
   * 查找路由文件
   */
  async findRouteFiles(dir) {
    const files = [];

    try {
      await fs.promises.access(dir);
    } catch {
      return files;
    }

    const items = await fs.promises.readdir(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.promises.stat(fullPath);

      if (stat.isDirectory()) {
        files.push(...(await this.findRouteFiles(fullPath)));
      } else if (item.endsWith('.js') && (item.includes('route') || item.includes('controller'))) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * 解析路由文件
   */
  async parseRouteFile(filePath) {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      const relativePath = path.relative(this.projectRoot, filePath);

      // 解析路由定义
      const routes = this.extractRoutes(content, relativePath);
      this.apiEndpoints.push(...routes);
    } catch (error) {
      console.warn(`⚠️  解析文件失败: ${filePath}`, error.message);
    }
  }

  /**
   * 提取路由信息
   */
  extractRoutes(content, filePath) {
    const routes = [];
    const lines = content.split('\n');

    // 匹配路由定义的正则表达式
    const routePatterns = [
      /(?:router|app)\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"` ]+)['"`]/g,
      /\.route\s*\(\s*['"`]([^'"` ]+)['"`]\s*\)\s*\.(get|post|put|delete|patch)/g,
    ];

    let currentComment = '';

    for (let i = 0, len = lines.length; i < len; i++) {
      const line = lines[i].trim();

      // 收集注释
      if (line.startsWith('//') || line.startsWith('*')) {
        currentComment += `${line.replace(/^\/\/\s*|^\*\s*/, '')} `;
        continue;
      }

      // 匹配路由定义
      for (const pattern of routePatterns) {
        pattern.lastIndex = 0; // 重置正则表达式
        const match = pattern.exec(line);

        if (match) {
          const method = (match[1] || match[2]).toUpperCase();
          const path = match[2] || match[1];

          routes.push({
            method,
            path,
            description: currentComment.trim() || `${method} ${path}`,
            file: filePath,
            line: i + 1,
            tags: this.extractTags(filePath),
            parameters: this.extractParameters(path),
            responses: this.getDefaultResponses(),
          });

          currentComment = '';
        }
      }

      // 重置注释（如果不是注释行）
      if (!line.startsWith('//') && !line.startsWith('*') && line !== '') {
        currentComment = '';
      }
    }

    return routes;
  }

  /**
   * 提取标签
   */

  // TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 25 行)

  extractTags(filePath) {
    const tags = [];

    if (filePath.includes('user')) {
      tags.push('用户管理');
    }
    if (filePath.includes('device')) {
      tags.push('设备管理');
    }
    if (filePath.includes('energy')) {
      tags.push('能源数据');
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (filePath.includes('carbon')) {
      tags.push('碳排放');
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (filePath.includes('alert')) {
      tags.push('告警管理');
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (filePath.includes('auth')) {
      tags.push('认证授权');
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (filePath.includes('prediction')) {
      tags.push('预测分析');
    }

    return tags.length > 0 ? tags : ['其他'];
  }

  /**
   * 提取路径参数
   */
  extractParameters(path) {
    const parameters = [];
    const paramMatches = path.match(/:([a-zA-Z_][a-zA-Z0-9_]*)/g);

    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (paramMatches) {
      for (const param of paramMatches) {
        const name = param.substring(1);
        parameters.push({
          name,
          in: 'path',
          required: true,
          type: 'string',
          description: `${name}参数`,
        });
      }
    }

    return parameters;
  }

  /**
   * 获取默认响应
   */

  // TODO: 考虑将此函数拆分为更小的函数 (当前 37 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 37 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 37 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 37 行)

  getDefaultResponses() {
    return {
      200: {
        description: '请求成功',
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string' },
          },
        },
      },
      400: {
        description: '请求参数错误',
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
      401: {
        description: '未授权访问',
      },
      500: {
        description: '服务器内部错误',
      },
    };
  }

  /**
   * 生成Markdown文档
   */
  async generateMarkdownDocs() {
    console.log('📝 生成Markdown文档...');

    const groupedEndpoints = this.groupEndpointsByTag();
    let markdown = this.generateMarkdownHeader();

    for (const [tag, endpoints] of Object.entries(groupedEndpoints)) {
      markdown += this.generateTagSection(tag, endpoints);
    }

    const outputPath = path.join(this.outputDir, 'README.md');
    await fs.promises.writeFile(outputPath, markdown, 'utf8');

    console.log(`✅ Markdown文档已生成: ${outputPath}`);
  }

  /**
   * 按标签分组端点
   */
  groupEndpointsByTag() {
    const grouped = {};

    for (const endpoint of this.apiEndpoints) {
      for (const tag of endpoint.tags) {
        if (!grouped[tag]) {
          grouped[tag] = [];
        }
        grouped[tag].push(endpoint);
      }
    }

    return grouped;
  }

  // TODO: 考虑将此函数拆分为更小的函数 (当前 58 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 58 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 58 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 58 行)

  /**
   * 生成Markdown头部
   */
  generateMarkdownHeader() {
    return `# 零碳园区数字孪生能碳管理系统 API 文档

> 自动生成于: ${new Date().toLocaleString('zh-CN')}

## 概述

本文档描述了零碳园区数字孪生能碳管理系统的所有API接口。

### 基础信息

- **Base URL**: \`http://localhost:3000/api\`
- **认证方式**: Bearer Token (JWT)
- **数据格式**: JSON
- **字符编码**: UTF-8

### 通用响应格式

成功响应:
\`\`\`json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
\`\`\`

错误响应:
\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}
\`\`\`

### 分页响应格式

\`\`\`json
{
  "success": true,
  "data": [],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "hasNext": true,
    "hasPrev": false
  }
}
\`\`\`

---

`;
  }

  /**
   * 生成标签章节
   */
  generateTagSection(tag, endpoints) {
    let section = `## ${tag}\n\n`;

    for (const endpoint of endpoints) {
      section += this.generateEndpointDoc(endpoint);
    }

    return section;
  }

  /**
   * 生成端点文档
   */
  generateEndpointDoc(endpoint) {
    let doc = `### ${endpoint.method} ${endpoint.path}\n\n`;
    doc += `**描述**: ${endpoint.description}\n\n`;

    // 路径参数
    if (endpoint.parameters.length > 0) {
      doc += '**路径参数**:\n\n';
      doc += '| 参数名 | 类型 | 必填 | 描述 |\n';
      doc += '|--------|------|------|------|\n';

      for (const param of endpoint.parameters) {
        doc += `| ${param.name} | ${param.type} | ${param.required ? '是' : '否'} | ${param.description} |\n`;
      }
      doc += '\n';
    }

    // 请求示例
    doc += '**请求示例**:\n\n';
    doc += '```bash\n';
    doc += `curl -X ${endpoint.method} \\\n`;
    doc += `  "http://localhost:3000/api${endpoint.path}" \\\n`;
    doc += '  -H "Authorization: Bearer YOUR_TOKEN" \\\n';
    doc += '  -H "Content-Type: application/json"\n';
    doc += '```\n\n';

    // 响应示例
    doc += '**响应示例**:\n\n';
    doc += '```json\n';
    doc += JSON.stringify(endpoint.responses['200'].schema, null, 2);
    doc += '\n```\n\n';

    doc += '---\n\n';

    return doc;
  }

  /**
   * 生成OpenAPI规范
   */
  async generateOpenApiSpec() {
    console.log('📋 生成OpenAPI规范...');

    const spec = {
      openapi: '3.0.0',
      info: {
        title: '零碳园区数字孪生能碳管理系统 API',
        version: '1.0.0',
        description: '零碳园区数字孪生能碳管理系统的API接口文档',
        contact: {
          name: 'API Support',
          email: 'support@example.com',
        },
      },
      servers: [
        {
          url: 'http://localhost:3000/api',
          description: '开发环境',
        },
        {
          url: 'https://api.example.com',
          description: '生产环境',
        },
      ],
      paths: {},
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
        schemas: this.generateSchemas(),
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    };

    // 生成路径
    for (const endpoint of this.apiEndpoints) {
      const path = endpoint.path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, '{$1}');

      if (!spec.paths[path]) {
        spec.paths[path] = {};
      }

      spec.paths[path][endpoint.method.toLowerCase()] = {
        tags: endpoint.tags,
        summary: endpoint.description,
        parameters: endpoint.parameters.map((param) => ({
          ...param,
          schema: { type: param.type },
        })),
        responses: endpoint.responses,
      };
    }

    const outputPath = path.join(this.outputDir, 'openapi.json');
    await fs.promises.writeFile(outputPath, JSON.stringify(spec, null, 2), 'utf8');

    // TODO: 考虑将此函数拆分为更小的函数 (当前 56 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 56 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 56 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 56 行)

    console.log(`✅ OpenAPI规范已生成: ${outputPath}`);
  }

  /**
   * 生成数据模型
   */
  generateSchemas() {
    return {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          username: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['admin', 'operator', 'viewer'] },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Device: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string' },
          location: { type: 'string' },
          status: { type: 'string', enum: ['online', 'offline', 'maintenance', 'error'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      EnergyData: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          deviceId: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
          power: { type: 'number' },
          energy: { type: 'number' },
          voltage: { type: 'number' },
          current: { type: 'number' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'object' },
          message: { type: 'string' },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    };
  }

  /**
   * 生成Postman集合
   */
  async generatePostmanCollection() {
    console.log('📮 生成Postman集合...');

    const collection = {
      info: {
        name: '零碳园区数字孪生能碳管理系统 API',
        description: 'API接口测试集合',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      auth: {
        type: 'bearer',
        bearer: [
          {
            key: process.env.API_KEY || 'default',
            value: '{{access_token}}',
            type: 'string',
          },
        ],
      },
      variable: [
        {
          key: process.env.API_KEY || 'default',
          value: 'http://localhost:3000/api',
          type: 'string',
        },
        {
          key: process.env.API_KEY || 'default',
          value: '',
          type: 'string',
        },
      ],
      item: [],
    };

    // TODO: 考虑将此函数拆分为更小的函数 (当前 30 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 30 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 30 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 30 行)

    const groupedEndpoints = this.groupEndpointsByTag();

    for (const [tag, endpoints] of Object.entries(groupedEndpoints)) {
      const folder = {
        name: tag,
        item: [],
      };

      for (const endpoint of endpoints) {
        const request = {
          name: `${endpoint.method} ${endpoint.path}`,
          request: {
            method: endpoint.method,
            header: [
              {
                key: process.env.API_KEY || 'default',
                value: 'application/json',
              },
            ],
            url: {
              raw: `{{base_url}}${endpoint.path}`,
              host: ['{{base_url}}'],
              path: endpoint.path.split('/').filter((p) => p),
            },
            description: endpoint.description,
          },
        };

        // 添加请求体示例（POST/PUT请求）
        if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
          request.request.body = {
            mode: 'raw',
            raw: JSON.stringify(this.getExampleRequestBody(endpoint), null, 2),
          };
        }

        folder.item.push(request);
      }

      // TODO: 考虑将此函数拆分为更小的函数 (当前 35 行)

      // TODO: 考虑将此函数拆分为更小的函数 (当前 35 行)

      // TODO: 考虑将此函数拆分为更小的函数 (当前 35 行)

      // TODO: 考虑将此函数拆分为更小的函数 (当前 35 行)

      collection.item.push(folder);
    }

    const outputPath = path.join(this.outputDir, 'postman-collection.json');
    await fs.promises.writeFile(outputPath, JSON.stringify(collection, null, 2), 'utf8');

    console.log(`✅ Postman集合已生成: ${outputPath}`);
  }

  /**
   * 获取示例请求体
   */
  getExampleRequestBody(endpoint) {
    const examples = {
      '/users': {
        username: 'testuser',
        email: 'test@example.com',
        password: process.env.DB_PASSWORD || 'default',
        role: 'operator',
      },
      '/devices': {
        name: '测试设备',
        type: 'solar_panel',
        location: '建筑A-1F',
        specifications: {
          capacity: 100,
          efficiency: 0.85,
        },
      },
      '/energy-data': {
        deviceId: 'device-123',
        timestamp: new Date().toISOString(),
        power: 85.5,
        energy: 120.3,
        voltage: 220,
        current: 15.2,
      },
    };

    for (const [path, example] of Object.entries(examples)) {
      if (endpoint.path.includes(path)) {
        return example;
      }
    }

    return {};
  }
}

// 执行文档生成
const generator = new ApiDocGenerator();
generator.generate().catch((error) => {
  console.error('文档生成失败:', error);
  process.exit(1);
});

export default ApiDocGenerator;
