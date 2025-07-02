#!/bin/bash

# 直接使用mysql命令行客户端插入迁移记录
mysql -u root -e "USE zero_carbon_park; INSERT IGNORE INTO knex_migrations (name, batch, migration_time) VALUES ('20250101000000_create_storage_devices_table.cjs', 1, NOW());"

if [ $? -eq 0 ]; then
  echo "成功标记迁移记录"
else
  echo "标记迁移记录失败"
  exit 1
fi