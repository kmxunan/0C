#!/usr/bin/env node

import vppDatabase from '../backend/database/vppDatabase.js';

/**
 * 检查 VPP 表状态脚本
 */
async function checkVPPTables() {
  try {
    console.log('🔍 检查 VPP 数据库表状态...');
    
    // 初始化数据库连接
    await vppDatabase.initialize();
    console.log('✅ 数据库连接初始化成功');

    // 所有 VPP 表列表
    const allVppTables = [
      'vpp_strategy_ab_tests',
      'vpp_strategy_executions', 
      'vpp_strategy_rules',
      'vpp_trading_strategies',
      'vpp_strategy_templates',
      'vpp_strategy_components',
      'vpp_strategy_validations',
      'vpp_executions',
      'vpp_orders',
      'vpp_risk_monitoring',
      'vpp_execution_config',
      'vpp_market_configs',
      'vpp_market_data',
      'vpp_market_connections',
      'vpp_market_trades',
      'vpp_settlements',
      'vpp_financial_analysis',
      'vpp_reports',
      'vpp_compliance_monitoring',
      'vpp_account_balances',
      'vpp_aggregations',
      'vpp_aggregation_resources',
      'vpp_aggregation_conflicts',
      'vpp_aggregation_realtime',
      'vpp_resources',
      'vpp_resource_instances',
      'vpp_definitions',
      'vpp_resource_templates',
      'vpp_template_versions',
      'vpp_resource_associations',
      'vpp_operation_logs'
    ];

    console.log('\n📊 表状态检查结果:');
    console.log('=' .repeat(50));
    
    let existingTables = [];
    let missingTables = [];
    
    for (const table of allVppTables) {
      try {
        const exists = await vppDatabase.tableExists(table);
        if (exists) {
          console.log(`✅ ${table}`);
          existingTables.push(table);
        } else {
          console.log(`❌ ${table}`);
          missingTables.push(table);
        }
      } catch (error) {
        console.log(`⚠️  ${table} - 检查失败: ${error.message}`);
        missingTables.push(table);
      }
    }

    console.log('\n📈 统计结果:');
    console.log('=' .repeat(50));
    console.log(`✅ 存在的表: ${existingTables.length}`);
    console.log(`❌ 缺失的表: ${missingTables.length}`);
    console.log(`📊 总计: ${allVppTables.length}`);
    
    if (missingTables.length > 0) {
      console.log('\n❌ 缺失的表列表:');
      missingTables.forEach(table => console.log(`   - ${table}`));
      console.log('\n💡 建议运行: npm run db:create-vpp-tables:reset');
    } else {
      console.log('\n🎉 所有 VPP 表都已创建成功！');
    }
    
    // 额外检查：显示数据库中所有 VPP 表
    console.log('\n🔍 数据库中实际的 VPP 表:');
    console.log('=' .repeat(50));
    
    const actualTables = await vppDatabase.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name LIKE 'vpp_%'
      ORDER BY table_name
    `, [vppDatabase.connectionConfig.database]);
    
    if (actualTables.length > 0) {
      actualTables.forEach(row => {
        console.log(`📋 ${row.TABLE_NAME || row.table_name}`);
      });
    } else {
      console.log('❌ 数据库中没有找到任何 VPP 表');
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    process.exit(1);
  } finally {
    await vppDatabase.close();
  }
}

checkVPPTables();