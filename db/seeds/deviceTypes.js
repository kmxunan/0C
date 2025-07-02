import { db } from '../../src/database.js';
import DeviceType from '../../src/models/DeviceType.js';
import dotenv from 'dotenv';

dotenv.config();

// 添加储能设备类型
async function seedBatteryDeviceType() {
  try {
    // 检查设备类型是否已存在
    const existingType = await DeviceType.findByName('储能电池');
    if (existingType) {
      console.log('储能电池设备类型已存在');
      return;
    }

    // 创建新设备类型
    const batteryType = await DeviceType.create({
      name: '储能电池',
      description: '用于存储电能的储能设备',
      category: '储能',
      manufacturer: '特斯拉',
      data_schema: JSON.stringify({
        soc: 'number',
        power: 'number',
        voltage: 'number',
        temperature: 'number',
        charge_status: 'string'
      })
    });

    console.log('储能电池设备类型添加成功:', batteryType.id);
  } catch (error) {
    console.error('添加储能设备类型失败:', error.message);
  }
}

// 主函数
async function main() {
  await seedBatteryDeviceType();
}

main();