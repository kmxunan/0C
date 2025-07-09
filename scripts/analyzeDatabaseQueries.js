/* eslint-disable no-console, no-magic-numbers */
import sqlite3 from 'sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { format } from 'date-fns';
import { fileURLToPath } from 'url';

// 定义__dirname以适配ES模块
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 配置
const DB_PATH = path.join(__dirname, '../database.sqlite');
const OUTPUT_DIR = path.join(__dirname, '../logs/query_analysis');
const MIN_EXECUTION_TIME = 50; // 记录执行时间超过此值(ms)的查询
const ANALYSIS_DURATION = 3600000; // 分析持续时间(ms)，默认1小时

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 日志文件路径
const logFileName = `query_analysis_${format(new Date(), 'yyyyMMdd_HHmmss')}.log`;
const logFilePath = path.join(OUTPUT_DIR, logFileName);

// 存储查询统计信息
const queryStats = {};

// 连接数据库
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('数据库连接错误:', err.message);
    process.exit(1);
  }
  console.log('成功连接到SQLite数据库');
});

// 启用查询跟踪
console.log(`开始数据库查询分析，持续时间: ${ANALYSIS_DURATION / 1000}秒`);
console.log(`将记录执行时间超过${MIN_EXECUTION_TIME}ms的查询`);
console.log(`分析结果将保存到: ${logFilePath}`);

// 重写数据库查询方法以测量执行时间
const originalAll = db.all;
const originalGet = db.get;
const originalRun = db.run;

// 记录查询执行时间的辅助函数
function logQueryExecution(query, params, executionTime) {
  // 标准化查询（移除多余空格）
  const normalizedQuery = query.replace(/\s+/g, ' ').trim();

  // 更新查询统计
  if (!queryStats[normalizedQuery]) {
    queryStats[normalizedQuery] = {
      count: 0,
      totalTime: 0,
      minTime: Infinity,
      maxTime: 0,
      avgTime: 0,
      lastExecution: new Date(),
      paramsExamples: [],
    };
  }

  const stats = queryStats[normalizedQuery];
  stats.count++;
  stats.totalTime += executionTime;
  stats.minTime = Math.min(stats.minTime, executionTime);
  stats.maxTime = Math.max(stats.maxTime, executionTime);
  stats.avgTime = stats.totalTime / stats.count;
  stats.lastExecution = new Date();

  // 保存参数示例（限制数量）
  if (stats.paramsExamples.length < 5) {
    stats.paramsExamples.push(params);
  }

  // 如果执行时间超过阈值，记录详细信息
  if (executionTime >= MIN_EXECUTION_TIME) {
    const logEntry =
      `[${new Date().toISOString()}] 慢查询: ${executionTime}ms
` +
      `查询: ${normalizedQuery}
` +
      `参数: ${JSON.stringify(params, null, 2)}

`;

    fs.appendFileSync(logFilePath, logEntry);
    console.log(`记录慢查询: ${executionTime}ms`);
  }
}

// 包装查询方法
function wrapQueryMethod(originalMethod) {
  return function (query, params, callback) {
    const startTime = Date.now();

    // 处理参数和回调的不同情况
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }

    // 执行原始查询
    return originalMethod.call(db, query, params, function (...args) {
      const executionTime = Date.now() - startTime;
      logQueryExecution(query, params, executionTime);

      // 调用原始回调
      if (typeof callback === 'function') {
        callback.apply(this, args);
      }
    });
  };
}

// 应用包装后的方法
db.all = wrapQueryMethod(originalAll);
db.get = wrapQueryMethod(originalGet);
db.run = wrapQueryMethod(originalRun);

// 设置分析超时
setTimeout(() => {
  console.log('查询分析时间结束，生成报告...');

  // 生成总结报告
  const summaryReport = [
    `数据库查询性能分析报告 - ${new Date().toISOString()}`,
    `分析持续时间: ${ANALYSIS_DURATION / 1000}秒`,
    `记录阈值: ${MIN_EXECUTION_TIME}ms`,
    `总查询类型: ${Object.keys(queryStats).length}`,
    `
==================== 慢查询统计 ====================
`,
  ];

  // 按平均执行时间排序查询
  const sortedQueries = Object.entries(queryStats).sort(([, a], [, b]) => b.avgTime - a.avgTime);

  // 添加每个查询的统计信息
  sortedQueries.forEach(([query, stats]) => {
    summaryReport.push(`查询: ${query}`);
    summaryReport.push(`执行次数: ${stats.count}`);
    summaryReport.push(`总时间: ${stats.totalTime.toFixed(2)}ms`);
    summaryReport.push(`平均时间: ${stats.avgTime.toFixed(2)}ms`);
    summaryReport.push(`最小时间: ${stats.minTime.toFixed(2)}ms`);
    summaryReport.push(`最大时间: ${stats.maxTime.toFixed(2)}ms`);
    summaryReport.push(`上次执行: ${stats.lastExecution.toISOString()}`);
    summaryReport.push(`参数示例: ${JSON.stringify(stats.paramsExamples[0] || '无', null, 2)}`);
    summaryReport.push(`
----------------------------------------------------
`);
  });

  // 保存总结报告
  const summaryFileName = `query_summary_${format(new Date(), 'yyyyMMdd_HHmmss')}.txt`;
  const summaryFilePath = path.join(OUTPUT_DIR, summaryFileName);
  fs.writeFileSync(summaryFilePath, summaryReport.join('\n'));

  console.log(`分析完成，总结报告已保存到: ${summaryFilePath}`);
  console.log(`慢查询详细日志: ${logFilePath}`);

  // 恢复原始方法
  db.all = originalAll;
  db.get = originalGet;
  db.run = originalRun;

  // 关闭数据库连接
  db.close((err) => {
    if (err) {
      console.error('关闭数据库连接时出错:', err.message);
    } else {
      console.log('数据库连接已关闭');
    }
    process.exit(0);
  });
}, ANALYSIS_DURATION);

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  fs.appendFileSync(logFilePath, `[${new Date().toISOString()}] 分析脚本异常: ${err.stack}\n\n`);
  process.exit(1);
});

// 处理进程退出
process.on('exit', (code) => {
  console.log(`分析脚本退出，代码: ${code}`);
});
