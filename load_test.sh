#!/bin/bash

# 压力测试脚本
set -e

echo "🚀 开始压力测试..."

# 检查ab工具是否存在
if ! command -v ab &> /dev/null
then
    echo "❌ 错误：未找到ab压力测试工具"
    echo "💡 提示：可以使用brew install httpd安装"
    exit 1
fi

# 获取当前时间戳（兼容MacOS）
function get_timestamp() {
    date +"%s"
}

# 获取当前日期时间（兼容MacOS）
function get_datetime() {
    date +"%Y-%m-%d %T"
}

# 创建测试结果目录
test_dir="performance_results_$(get_datetime | sed 's/ //;s/://g')"
mkdir -p "$test_dir"

# 测试参数
test_duration=300  # 测试持续时间（秒）
concurrent_users=100  # 并发用户数
requests_per_second=50  # 每秒请求数

# 获取测试目标URL
if [ -z "$1" ]; then
  start_time=$(get_datetime)
  end_time=$(date -j -v +1H +"%Y-%m-%d %T")
  test_url="http://localhost/api/energy/data?start_time=${start_time}:00Z&end_time=${end_time}:00Z"
  echo "⚠️  使用默认测试URL: $test_url"
else
  test_url="$1"
fi

# 计算测试参数
start_timestamp=$(get_timestamp)
end_timestamp=$((start_timestamp + test_duration))
total_requests=$((requests_per_second * test_duration))

# 显示测试配置
echo ""
echo "==============================="
echo "压力测试配置"
echo "==============================="
echo "测试URL: $test_url"
echo "测试持续时间: $test_duration 秒"
echo "并发用户数: $concurrent_users"
echo "每秒请求数: $requests_per_second"
echo "总请求数: $total_requests"
echo "测试结果将保存到: $(pwd)/$test_dir"
echo "==============================="
echo ""
echo "⏳ 测试将在后台运行，可通过以下命令查看实时日志："
echo "tail -f ./$test_dir/load_test.log"
echo ""
echo "🛑 要停止测试，请按 Ctrl+C 或执行: kill -9 %1"
echo "==============================="
echo ""
echo "🧪 测试预计结束时间: $(date -j -f "%s" "$end_timestamp" "+%Y-%m-%d %T")"
echo ""

# 启动压力测试
ab -n $total_requests -c $concurrent_users -t $test_duration -v 2 -l -k -H "Authorization: Bearer dummy_token" $test_url > ./test-results/load_test.log 2>&1 &

# 获取后台进程ID
load_test_pid=$!
echo "mPid=$load_test_pid" >> ./test-results/load_test.pid

# 监控脚本
echo "📈 启动性能监控..."
while [ $SECONDS -lt $end_time ]; do
  # 获取当前时间戳
  timestamp=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
  
  # 获取CPU和内存使用情况
  if command -v top >/dev/null 2>&1; then
    cpu_usage=$(top -b -n 1 | grep "Cpu(s)" | awk '{print $2 + $4}')
    mem_usage=$(free | grep Mem | awk '{print $3/$2 * 100.0}')
  else
    cpu_usage="N/A"
    mem_usage="N/A"
  fi
  
  # 获取网络连接数
  connection_count=$(ss -t | grep ESTAB | wc -l)
  
  # 获取API平均延迟
  if [ -f ./test-results/load_test.log ]; then
    current_requests=$(grep "Requests per second" ./test-results/load_test.log | tail -n 1 | awk '{print $4}')
    avg_latency=$(grep "Time per request" ./test-results/load_test.log | tail -n 1 | awk '{print $4}')
  else
    current_requests="N/A"
    avg_latency="N/A"
  fi
  
  # 记录监控数据
  echo "$timestamp, $cpu_usage, $mem_usage, $connection_count, $current_requests, $avg_latency" >> ./test-results/performance_monitor.csv
  
  # 每5秒记录一次
  sleep 5
done

# 测试完成后生成报告
echo ""
echo "✅ 压力测试完成，生成报告..."

# 检查测试结果
grep "failed requests" ./test-results/load_test.log | awk '{if ($4 > 0) print "❌ 发现失败请求: "$4; exit 1}' || true

# 提取关键指标
requests_per_second=$(grep "Requests per second" ./test-results/load_test.log | awk '{print $4}')
avg_response_time=$(grep "Time per request" ./test-results/load_test.log | awk '{print $4}')
failed_requests=$(grep "failed requests" ./test-results/load_test.log | awk '{print $3}')

# 生成摘要报告
echo ""
echo "==============================="
echo "压力测试摘要"
echo "==============================="
echo "总请求数: $total_requests"
echo "并发用户数: $concurrent_users"
echo "每秒请求数: $requests_per_second"
echo "平均响应时间: $avg_response_time ms"
echo "失败请求数: ${failed_requests:-0}"
echo "最大CPU使用率: $(awk 'BEGIN{max=0} {if ($2+0 > max) max=$2} END{print max}' ./test-results/performance_monitor.csv)%"
echo "最大内存使用率: $(awk 'BEGIN{max=0} {if ($3+0 > max) max=$3} END{print max}' ./test-results/performance_monitor.csv)%"
echo "==============================="

echo "📊 完整报告请查看: $(pwd)/test-results/"

echo ""
echo "🎉 压力测试完成！"