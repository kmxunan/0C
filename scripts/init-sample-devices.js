/* eslint-disable no-console */
/**
 * 初始化示例设备数据
 * 用于演示和测试设备管理功能
 */

import { db } from '../src/database.js';
import { v4 as uuidv4 } from 'uuid';

// 示例设备数据
const sampleDevices = [
  {
    id: uuidv4(),
    building_id: 'default-building',
    name: '主配电柜A',
    type: 'electrical_panel',
    category: 'electrical',
    model: 'MNS-3200',
    manufacturer: 'ABB',
    serial_number: 'ABB2024001',
    location: 'A栋1层配电室',
    coordinates: JSON.stringify({ x: 10, y: 0, z: 5 }),
    install_date: '2024-01-15',
    warranty_date: '2027-01-15',
    rated_power: 3200,
    parameters: JSON.stringify({
      voltage: '380V',
      frequency: '50Hz',
      phases: 3,
    }),
    status: 'online',
    remark: '主要配电设备，负责整栋楼供电',
  },
  {
    id: uuidv4(),
    building_id: 'default-building',
    name: '太阳能板组B1',
    type: 'solar_panel',
    category: 'renewable',
    model: 'JKM-540M',
    manufacturer: '晶科能源',
    serial_number: 'JK2024002',
    location: 'B栋屋顶东侧',
    coordinates: JSON.stringify({ x: 20, y: 15, z: 10 }),
    install_date: '2024-02-01',
    warranty_date: '2034-02-01',
    rated_power: 540,
    parameters: JSON.stringify({
      efficiency: '21.2%',
      temperature_coefficient: '-0.35%/°C',
      max_system_voltage: '1500V',
    }),
    status: 'online',
    remark: '高效单晶硅太阳能电池板',
  },
  {
    id: uuidv4(),
    building_id: 'default-building',
    name: '储能系统C1',
    type: 'battery-storage',
    category: 'storage',
    model: 'BYD-ESS-100',
    manufacturer: '比亚迪',
    serial_number: 'BYD2024003',
    location: 'C栋地下室储能间',
    coordinates: JSON.stringify({ x: 30, y: -5, z: 15 }),
    install_date: '2024-02-15',
    warranty_date: '2034-02-15',
    rated_power: 1000,
    parameters: JSON.stringify({
      capacity: '100kWh',
      voltage: '768V',
      efficiency: '95%',
      cycles: '6000+',
    }),
    status: 'online',
    remark: '磷酸铁锂电池储能系统',
  },
  {
    id: uuidv4(),
    building_id: 'default-building',
    name: '风力发电机D1',
    type: 'wind_turbine',
    category: 'renewable',
    model: 'WT-5000',
    manufacturer: '金风科技',
    serial_number: 'GW2024004',
    location: 'D区空地',
    coordinates: JSON.stringify({ x: 40, y: 20, z: 20 }),
    install_date: '2024-03-01',
    warranty_date: '2029-03-01',
    rated_power: 5000,
    parameters: JSON.stringify({
      rotor_diameter: '130m',
      hub_height: '90m',
      cut_in_speed: '3m/s',
      rated_speed: '11m/s',
    }),
    status: 'online',
    remark: '直驱永磁同步风力发电机',
  },
  {
    id: uuidv4(),
    building_id: 'default-building',
    name: '中央空调系统E1',
    type: 'hvac_system',
    category: 'hvac',
    model: 'CA-200RT',
    manufacturer: '开利',
    serial_number: 'CR2024005',
    location: 'E栋机房',
    coordinates: JSON.stringify({ x: 50, y: 10, z: 25 }),
    install_date: '2024-01-20',
    warranty_date: '2026-01-20',
    rated_power: 200,
    parameters: JSON.stringify({
      cooling_capacity: '200RT',
      refrigerant: 'R134a',
      efficiency: 'COP 3.2',
    }),
    status: 'online',
    remark: '离心式冷水机组',
  },
  {
    id: uuidv4(),
    building_id: 'default-building',
    name: '智能照明系统F1',
    type: 'lighting_system',
    category: 'lighting',
    model: 'LED-Smart-100',
    manufacturer: '飞利浦',
    serial_number: 'PH2024006',
    location: 'F栋办公区',
    coordinates: JSON.stringify({ x: 60, y: 5, z: 30 }),
    install_date: '2024-01-25',
    warranty_date: '2029-01-25',
    rated_power: 100,
    parameters: JSON.stringify({
      luminous_efficacy: '150lm/W',
      color_temperature: '3000K-6500K',
      dimming: '0-100%',
      lifespan: '50000h',
    }),
    status: 'online',
    remark: 'LED智能调光照明系统',
  },
  {
    id: uuidv4(),
    building_id: 'default-building',
    name: '电动汽车充电桩G1',
    type: 'ev_charger',
    category: 'charging',
    model: 'DC-60kW',
    manufacturer: '特来电',
    serial_number: 'TLD2024007',
    location: 'G区停车场',
    coordinates: JSON.stringify({ x: 70, y: 0, z: 35 }),
    install_date: '2024-02-10',
    warranty_date: '2027-02-10',
    rated_power: 60,
    parameters: JSON.stringify({
      output_voltage: '200-750V',
      output_current: '0-125A',
      efficiency: '95%',
      connector: 'GB/T 20234.3',
    }),
    status: 'offline',
    remark: '直流快充充电桩，维护中',
  },
  {
    id: uuidv4(),
    building_id: 'default-building',
    name: '智能电表H1',
    type: 'smart_meter',
    category: 'meter',
    model: 'SM-3P4W',
    manufacturer: '华立科技',
    serial_number: 'HL2024008',
    location: 'H栋计量室',
    coordinates: JSON.stringify({ x: 80, y: 2, z: 40 }),
    install_date: '2024-01-10',
    warranty_date: '2034-01-10',
    rated_power: 0, // 计量设备不消耗功率
    parameters: JSON.stringify({
      accuracy: '0.2S级',
      voltage: '3×220/380V',
      current: '1.5(6)A',
      frequency: '50Hz',
    }),
    status: 'online',
    remark: '三相四线智能电能表',
  },
];

/**
 * 初始化示例设备数据
 */
export async function initSampleDevices() {
  try {
    console.log('开始初始化示例设备数据...');

    // 检查是否已有设备数据
    const existingDevices = await new Promise((resolve, reject) => {
      db.all('SELECT COUNT(*) as count FROM devices', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    if (existingDevices[0].count > 0) {
      console.log(`数据库中已有 ${existingDevices[0].count} 个设备，跳过初始化`);
      return;
    }

    // 插入示例设备
    const insertSql = `
      INSERT INTO devices (
        id, building_id, name, type, category, model, manufacturer,
        serial_number, location, coordinates, install_date, warranty_date,
        rated_power, parameters, status, remark, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    for (const device of sampleDevices) {
      await new Promise((resolve, reject) => {
        db.run(
          insertSql,
          [
            device.id,
            device.building_id,
            device.name,
            device.type,
            device.category,
            device.model,
            device.manufacturer,
            device.serial_number,
            device.location,
            device.coordinates,
            device.install_date,
            device.warranty_date,
            device.rated_power,
            device.parameters,
            device.status,
            device.remark,
          ],
          function (err) {
            if (err) {
              reject(err);
            } else {
              resolve(this.lastID);
            }
          }
        );
      });

      console.log(`✅ 已创建设备: ${device.name}`);
    }

    console.log(`🎉 成功初始化 ${sampleDevices.length} 个示例设备`);
  } catch (error) {
    console.error('初始化示例设备失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  initSampleDevices()
    .then(() => {
      console.log('示例设备初始化完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('示例设备初始化失败:', error);
      process.exit(1);
    });
}
