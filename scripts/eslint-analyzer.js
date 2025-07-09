#!/usr/bin/env node
/* eslint-disable no-console, no-magic-numbers */

import { execSync } from 'child_process';
import fs from 'fs';

// 运行ESLint并获取JSON格式结果
try {
  console.log('正在分析ESLint问题...');
  
  const eslintOutput = execSync('npx eslint . --format json', { 
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024 // 10MB buffer
  });
  
  const results = JSON.parse(eslintOutput);
  
  // 统计问题类型
  const problemStats = {};
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalFiles = 0;
  
  results.forEach(file => {
    if (file.messages.length > 0) {
      totalFiles++;
    }
    
    file.messages.forEach(message => {
      const ruleId = message.ruleId || 'unknown';
      
      if (!problemStats[ruleId]) {
        problemStats[ruleId] = {
          count: 0,
          severity: message.severity,
          files: new Set()
        };
      }
      
      problemStats[ruleId].count++;
      problemStats[ruleId].files.add(file.filePath);
      
      if (message.severity === 2) {
        totalErrors++;
      } else {
        totalWarnings++;
      }
    });
  });
  
  // 生成报告
  console.log('\n=== ESLint 问题分析报告 ===');
  console.log(`总文件数: ${results.length}`);
  console.log(`有问题的文件数: ${totalFiles}`);
  console.log(`总错误数: ${totalErrors}`);
  console.log(`总警告数: ${totalWarnings}`);
  console.log(`总问题数: ${totalErrors + totalWarnings}`);
  
  console.log('\n=== 问题类型统计 (按数量排序) ===');
  
  const sortedProblems = Object.entries(problemStats)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 20); // 显示前20个最常见的问题
  
  sortedProblems.forEach(([ruleId, stats]) => {
    const severity = stats.severity === 2 ? 'ERROR' : 'WARN';
    console.log(`${ruleId}: ${stats.count} (${severity}) - 影响${stats.files.size}个文件`);
  });
  
  // 保存详细报告到文件
  const reportData = {
    summary: {
      totalFiles: results.length,
      filesWithProblems: totalFiles,
      totalErrors,
      totalWarnings,
      totalProblems: totalErrors + totalWarnings
    },
    problemStats: Object.fromEntries(
      Object.entries(problemStats).map(([ruleId, stats]) => [
        ruleId,
        {
          count: stats.count,
          severity: stats.severity,
          fileCount: stats.files.size,
          files: Array.from(stats.files)
        }
      ])
    )
  };
  
  fs.writeFileSync('eslint-analysis-report.json', JSON.stringify(reportData, null, 2));
  console.log('\n详细报告已保存到: eslint-analysis-report.json');
  
} catch (error) {
  if (error.status === 1 && error.stdout) {
    // ESLint found problems, but that's expected
    console.log('ESLint发现了问题，正在分析...');
    
    try {
      const results = JSON.parse(error.stdout);
      
      // 统计问题类型
      const problemStats = {};
      let totalErrors = 0;
      let totalWarnings = 0;
      let totalFiles = 0;
      
      results.forEach(file => {
        if (file.messages.length > 0) {
          totalFiles++;
        }
        
        file.messages.forEach(message => {
          const ruleId = message.ruleId || 'unknown';
          
          if (!problemStats[ruleId]) {
            problemStats[ruleId] = {
              count: 0,
              severity: message.severity,
              files: new Set()
            };
          }
          
          problemStats[ruleId].count++;
          problemStats[ruleId].files.add(file.filePath);
          
          if (message.severity === 2) {
            totalErrors++;
          } else {
            totalWarnings++;
          }
        });
      });
      
      // 生成报告
      console.log('\n=== ESLint 问题分析报告 ===');
      console.log(`总文件数: ${results.length}`);
      console.log(`有问题的文件数: ${totalFiles}`);
      console.log(`总错误数: ${totalErrors}`);
      console.log(`总警告数: ${totalWarnings}`);
      console.log(`总问题数: ${totalErrors + totalWarnings}`);
      
      console.log('\n=== 问题类型统计 (按数量排序) ===');
      
      const sortedProblems = Object.entries(problemStats)
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, 20); // 显示前20个最常见的问题
      
      sortedProblems.forEach(([ruleId, stats]) => {
        const severity = stats.severity === 2 ? 'ERROR' : 'WARN';
        console.log(`${ruleId}: ${stats.count} (${severity}) - 影响${stats.files.size}个文件`);
      });
      
      // 保存详细报告到文件
      const reportData = {
        summary: {
          totalFiles: results.length,
          filesWithProblems: totalFiles,
          totalErrors,
          totalWarnings,
          totalProblems: totalErrors + totalWarnings
        },
        problemStats: Object.fromEntries(
          Object.entries(problemStats).map(([ruleId, stats]) => [
            ruleId,
            {
              count: stats.count,
              severity: stats.severity,
              fileCount: stats.files.size,
              files: Array.from(stats.files)
            }
          ])
        )
      };
      
      fs.writeFileSync('eslint-analysis-report.json', JSON.stringify(reportData, null, 2));
      console.log('\n详细报告已保存到: eslint-analysis-report.json');
      
    } catch (parseError) {
      console.error('解析ESLint输出失败:', parseError.message);
      console.log('输出长度:', error.stdout.length);
    }
  } else {
    console.error('运行ESLint失败:', error.message);
  }
}