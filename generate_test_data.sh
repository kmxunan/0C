#!/bin/bash

# 测试数据生成脚本
set -e

echo "📊 开始生成测试数据..."

# 创建测试数据目录
mkdir -p ./test-data

# 生成能源消耗数据
function generate_energy_data() {
  echo "🔋 生成能源消耗数据..."
  
  # 基础能源消耗（kWh）
  base_energy=1000
  
  # 生成过去24小时的数据（每小时1个点）
  end_time=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
  start_time=$(date -u -v '-24H' +'%Y-%m-%dT%H:%M:%SZ')
  
  # 创建CSV文件
  echo "timestamp,value" > ./test-data/energy_data.csv
  
  # 生成模拟数据
  current_time=$(date -u -j -f "%Y-%m-%dT%H:%M:%SZ" "$start_time" +%s)
  end_time_seconds=$(date -u -j -f "%Y-%m-%dT%H:%M:%SZ" "$end_time" +%s)
  
  while [ $current_time -le $end_time_seconds ]; do
    # 添加随机波动（±20%）
    random_factor=$(echo "scale=2; 0.8 + (0.4 * $RANDOM / 32767)" | bc)
    value=$(echo "$base_energy * $random_factor" | bc)
    
    # 写入数据
    echo "$(date -u -j -f "%s" "$current_time" +'%Y-%m-%dT%H:%M:%SZ'),$value" >> ./test-data/energy_data.csv
    
    # 下一小时
    current_time=$((current_time + 3600))
  done
  
  echo "✅ 能源数据已生成，共24个数据点"
}

# 生成碳排放数据
function generate_carbon_data() {
  echo "🌍 生成碳排放数据..."
  
  # 电力碳因子（kgCO2/kWh）
  electricity_factor=0.62
  
  # 柴油发电机碳因子（kgCO2/L）
  diesel_factor=2.68
  
  # 天然气碳因子（kgCO2/m³）
  gas_factor=1.88
  
  # 光伏减排因子（kgCO2/kWh）
  solar_factor=0.62
  
  # 生成过去24小时的数据
  echo "timestamp,electricity,diesel,gas,solar,total" > ./test-data/carbon_data.csv
  
  # 使用相同的日期范围
  current_time=$(date -u -j -f "%Y-%m-%dT%H:%M:%SZ" "$start_time" +%s)
  end_time_seconds=$(date -u -j -f "%Y-%m-%dT%H:%M:%SZ" "$end_time" +%s)
  
  while [ $current_time -le $end_time_seconds ]; do
    # 生成随机能源使用数据
    electricity=$(echo "$base_energy * $random_factor" | bc)
    diesel=$(echo "scale=2; 50 + (100 * $RANDOM / 32767)" | bc)
    gas=$(echo "scale=2; 10 + (30 * $RANDOM / 32767)" | bc)
    solar=$(echo "scale=2; 100 + (200 * $RANDOM / 32767)" | bc)
    
    # 计算总碳排放
    total=$(echo "scale=2; ($electricity * $electricity_factor) + ($diesel * $diesel_factor) + ($gas * $gas_factor) - ($solar * $solar_factor)" | bc)
    
    # 写入数据
    echo "$(date -u -j -f "%s" "$current_time" +'%Y-%m-%dT%H:%M:%SZ'),$electricity,$diesel,$gas,$solar,$total" >> ./test-data/carbon_data.csv
    
    # 下一小时
    current_time=$((current_time + 3600))
  done
  
  echo "✅ 碳排放数据已生成，共24个数据点"
}

# 生成储能优化数据
function generate_battery_data() {
  echo "🔋 生成储能优化数据..."
  
  # 初始SOC（State of Charge）
  soc=75
  
  # 生成过去24小时的数据（每5分钟一个点）
  echo "timestamp,soc,strategy,description" > ./test-data/battery_data.csv
  
  current_time=$(date -u -j -f "%Y-%m-%dT%H:%M:%SZ" "$start_time" +%s)
  end_time_seconds=$(date -u -j -f "%Y-%m-%dT%H:%M:%SZ" "$end_time" +%s)
  
  while [ $current_time -le $end_time_seconds ]; do
    # 随机生成充放电策略
    strategy="hold"
    description="正常运行"
    
    if (( $(echo "$soc < 60" | bc -l) )); then
      strategy="charge"
      description="电池电量低于阈值，建议充电"
      soc=$(echo "$soc + 5" | bc)
    elif (( $(echo "$soc > 80" | bc -l) )); then
      strategy="discharge"
      description="电池电量高于阈值，建议放电"
      soc=$(echo "$soc - 5" | bc)
    else
      # 随机变化
      change=$(echo "scale=2; 1 + (2 * $RANDOM / 32767)" | bc)
      if (( $(echo "$RANDOM % 2 == 0" | bc) )); then
        soc=$(echo "$soc + $change" | bc)
      else
        soc=$(echo "$soc - $change" | bc)
      fi
    fi
    
    # 确保SOC在合理范围内
    soc=$(echo "$soc" | awk '{printf "%.2f", ($1 < 0 ? 0 : ($1 > 100 ? 100 : $1))}')
    
    # 写入数据
    echo "$(date -u -j -f "%s" "$current_time" +'%Y-%m-%dT%H:%M:%SZ'),$soc,$strategy,$description" >> ./test-data/battery_data.csv
    
    # 下一个时间点（5分钟间隔）
    current_time=$((current_time + 300))
  done
  
  echo "✅ 储能数据已生成，共288个数据点"
}

# 生成系统性能数据
function generate_performance_data() {
  echo "📈 生成系统性能数据..."
  
  # 生成过去24小时的性能数据
  echo "timestamp,cpu,memory,connections,rps" > ./test-data/performance_data.csv
  
  current_time=$(date -u -j -f "%Y-%m-%dT%H:%M:%SZ" "$start_time" +%s)
  end_time_seconds=$(date -u -j -f "%Y-%m-%dT%H:%M:%SZ" "$end_time" +%s)
  
  while [ $current_time -le $end_time_seconds ]; do
    # 生成随机性能数据
    cpu=$(echo "scale=2; 20 + (60 * $RANDOM / 32767)" | bc)
    memory=$(echo "scale=2; 30 + (50 * $RANDOM / 32767)" | bc)
    connections=$(echo "scale=0; 100 + (900 * $RANDOM / 32767)" | bc)
    rps=$(echo "scale=2; 10 + (90 * $RANDOM / 32767)" | bc)
    
    # 写入数据
    echo "$(date -u -j -f "%s" "$current_time" +'%Y-%m-%dT%H:%M:%SZ'),$cpu,$memory,$connections,$rps" >> ./test-data/performance_data.csv
    
    # 下一个时间点（1分钟间隔）
    current_time=$((current_time + 60))
  done
  
  echo "✅ 性能数据已生成，共1440个数据点"
}

# 执行数据生成
start_time=$(date -u -v '-24H' +'%Y-%m-%dT%H:%M:%SZ')
end_time=$(date -u +'%Y-%m-%dT%H:%M:%SZ')

echo "📅 测试数据生成时间范围: $start_time 至 $end_time"

generate_energy_data
generate_carbon_data
generate_battery_data
generate_performance_data

# 显示示例数据
echo ""
echo "📄 数据样本预览："
echo ""
echo "能源数据样本："
head -n 5 ./test-data/energy_data.csv | column -t -s","
echo ""
echo "碳排放数据样本："
head -n 5 ./test-data/carbon_data.csv | column -t -s","
echo ""
echo "储能数据样本："
head -n 5 ./test-data/battery_data.csv | column -t -s","
echo ""
echo "性能数据样本："
head -n 5 ./test-data/performance_data.csv | column -t -s","
echo ""
echo "✅ 测试数据生成完成！"
echo "📁 数据文件已保存到: $(pwd)/test-data/"
echo ""
echo "==============================="
echo "数据生成完成时间: $(date)"
echo "==============================="