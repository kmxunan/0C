#!/bin/bash

# 零碳园区数字孪生系统 - 监控系统健康检查脚本
# 版本: 2.0
# 作者: 零碳园区开发团队
# 日期: 2025-06-15

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
LOG_FILE="logs/monitoring/health-check.log"
ALERT_WEBHOOK="http://localhost:3001/api/alerts/health-check"
CHECK_INTERVAL=60  # 检查间隔（秒）
MAX_RETRIES=3      # 最大重试次数

# 服务配置
declare -A SERVICES=(
    ["prometheus"]="9090:/metrics"
    ["grafana"]="3000:/api/health"
    ["alertmanager"]="9093:/api/v1/status"
    ["node-exporter"]="9100:/metrics"
    ["redis-exporter"]="9121:/metrics"
    ["redis"]="6379:"
    ["energy-system"]="3001:/api/health"
    ["mqtt-broker"]="1883:"
)

# 日志函数
log_with_timestamp() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
    log_with_timestamp "INFO" "$1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    log_with_timestamp "SUCCESS" "$1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    log_with_timestamp "WARNING" "$1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    log_with_timestamp "ERROR" "$1"
}

# 初始化
init_health_check() {
    mkdir -p "$(dirname "$LOG_FILE")"
    log_info "健康检查系统初始化完成"
}

# 检查HTTP服务
check_http_service() {
    local service_name=$1
    local port=$2
    local endpoint=$3
    local retries=0
    
    while [ $retries -lt $MAX_RETRIES ]; do
        if curl -f -s --max-time 10 "http://localhost:$port$endpoint" > /dev/null 2>&1; then
            return 0
        fi
        ((retries++))
        sleep 2
    done
    
    return 1
}

# 检查TCP端口
check_tcp_port() {
    local service_name=$1
    local port=$2
    local retries=0
    
    while [ $retries -lt $MAX_RETRIES ]; do
        if nc -z localhost "$port" 2>/dev/null; then
            return 0
        fi
        ((retries++))
        sleep 2
    done
    
    return 1
}

# 检查Docker容器状态
check_container_status() {
    local service_name=$1
    local container_status
    
    container_status=$(docker-compose ps -q "$service_name" 2>/dev/null | xargs docker inspect --format='{{.State.Status}}' 2>/dev/null)
    
    if [ "$container_status" = "running" ]; then
        return 0
    else
        return 1
    fi
}

# 检查服务资源使用情况
check_service_resources() {
    local service_name=$1
    local container_id
    
    container_id=$(docker-compose ps -q "$service_name" 2>/dev/null)
    
    if [ -n "$container_id" ]; then
        local stats
        stats=$(docker stats --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}" "$container_id" 2>/dev/null | tail -n 1)
        
        if [ -n "$stats" ]; then
            local cpu_usage=$(echo "$stats" | awk '{print $1}' | sed 's/%//')
            local mem_usage=$(echo "$stats" | awk '{print $2}')
            
            # 检查CPU使用率是否过高（>80%）
            if (( $(echo "$cpu_usage > 80" | bc -l) )); then
                log_warning "$service_name CPU使用率过高: $cpu_usage%"
                send_alert "high_cpu" "$service_name" "CPU使用率: $cpu_usage%"
            fi
            
            log_info "$service_name 资源使用: CPU $cpu_usage%, 内存 $mem_usage"
        fi
    fi
}

# 检查磁盘空间
check_disk_space() {
    local usage
    usage=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -gt 85 ]; then
        log_warning "磁盘空间使用率过高: $usage%"
        send_alert "high_disk_usage" "system" "磁盘使用率: $usage%"
    elif [ "$usage" -gt 95 ]; then
        log_error "磁盘空间严重不足: $usage%"
        send_alert "critical_disk_usage" "system" "磁盘使用率: $usage%"
    fi
}

# 检查Prometheus指标
check_prometheus_metrics() {
    local metrics_endpoint="http://localhost:9090/api/v1/query"
    
    # 检查Prometheus是否能查询指标
    if curl -f -s "$metrics_endpoint?query=up" > /dev/null 2>&1; then
        log_success "Prometheus指标查询正常"
        
        # 检查关键指标
        local up_targets
        up_targets=$(curl -s "$metrics_endpoint?query=up" | jq -r '.data.result | length' 2>/dev/null || echo "0")
        log_info "Prometheus监控目标数量: $up_targets"
        
        # 检查告警规则
        local alerts
        alerts=$(curl -s "http://localhost:9090/api/v1/alerts" | jq -r '.data.alerts | length' 2>/dev/null || echo "0")
        log_info "当前活跃告警数量: $alerts"
        
        if [ "$alerts" -gt 0 ]; then
            log_warning "检测到 $alerts 个活跃告警"
        fi
    else
        log_error "Prometheus指标查询失败"
        return 1
    fi
}

# 检查Grafana仪表板
check_grafana_dashboards() {
    local dashboards_api="http://admin:admin123@localhost:3000/api/search"
    
    if curl -f -s "$dashboards_api" > /dev/null 2>&1; then
        local dashboard_count
        dashboard_count=$(curl -s "$dashboards_api" | jq '. | length' 2>/dev/null || echo "0")
        log_info "Grafana仪表板数量: $dashboard_count"
        
        if [ "$dashboard_count" -eq 0 ]; then
            log_warning "未发现Grafana仪表板"
        fi
    else
        log_error "Grafana仪表板检查失败"
        return 1
    fi
}

# 发送告警
send_alert() {
    local alert_type=$1
    local service=$2
    local message=$3
    
    local alert_payload=$(cat <<EOF
{
    "alert_type": "$alert_type",
    "service": "$service",
    "message": "$message",
    "timestamp": "$(date -Iseconds)",
    "severity": "warning"
}
EOF
)
    
    if curl -f -s -X POST -H "Content-Type: application/json" \
        -d "$alert_payload" "$ALERT_WEBHOOK" > /dev/null 2>&1; then
        log_info "告警已发送: $alert_type - $service"
    else
        log_warning "告警发送失败: $alert_type - $service"
    fi
}

# 执行单次健康检查
run_health_check() {
    local failed_services=()
    local total_services=${#SERVICES[@]}
    local healthy_services=0
    
    log_info "开始健康检查 (共 $total_services 个服务)"
    
    # 检查各个服务
    for service_name in "${!SERVICES[@]}"; do
        local service_config="${SERVICES[$service_name]}"
        local port=$(echo "$service_config" | cut -d':' -f1)
        local endpoint=$(echo "$service_config" | cut -d':' -f2)
        
        log_info "检查服务: $service_name (端口: $port)"
        
        # 检查容器状态
        if ! check_container_status "$service_name"; then
            log_error "$service_name 容器未运行"
            failed_services+=("$service_name")
            send_alert "service_down" "$service_name" "容器未运行"
            continue
        fi
        
        # 检查服务可用性
        local service_healthy=false
        
        if [ -n "$endpoint" ]; then
            # HTTP服务检查
            if check_http_service "$service_name" "$port" "$endpoint"; then
                service_healthy=true
            fi
        else
            # TCP端口检查
            if check_tcp_port "$service_name" "$port"; then
                service_healthy=true
            fi
        fi
        
        if $service_healthy; then
            log_success "$service_name 服务健康"
            ((healthy_services++))
            
            # 检查资源使用情况
            check_service_resources "$service_name"
        else
            log_error "$service_name 服务不可用"
            failed_services+=("$service_name")
            send_alert "service_unhealthy" "$service_name" "服务不可用"
        fi
    done
    
    # 系统级检查
    check_disk_space
    
    # 特殊检查
    if [[ " ${failed_services[@]} " != *" prometheus "* ]]; then
        check_prometheus_metrics
    fi
    
    if [[ " ${failed_services[@]} " != *" grafana "* ]]; then
        check_grafana_dashboards
    fi
    
    # 生成健康报告
    local health_percentage=$((healthy_services * 100 / total_services))
    
    log_info "健康检查完成: $healthy_services/$total_services 服务正常 ($health_percentage%)"
    
    if [ ${#failed_services[@]} -gt 0 ]; then
        log_warning "失败的服务: ${failed_services[*]}"
        return 1
    else
        log_success "所有服务运行正常"
        return 0
    fi
}

# 持续监控模式
continuous_monitoring() {
    log_info "启动持续监控模式 (检查间隔: ${CHECK_INTERVAL}秒)"
    
    while true; do
        run_health_check
        log_info "等待 $CHECK_INTERVAL 秒后进行下次检查..."
        sleep "$CHECK_INTERVAL"
    done
}

# 显示帮助信息
show_help() {
    echo "零碳园区数字孪生系统 - 监控健康检查工具"
    echo
    echo "用法: $0 [选项]"
    echo
    echo "选项:"
    echo "  -c, --continuous    持续监控模式"
    echo "  -o, --once         单次检查模式 (默认)"
    echo "  -i, --interval N   设置检查间隔 (秒，默认60)"
    echo "  -h, --help         显示帮助信息"
    echo
    echo "示例:"
    echo "  $0                 # 执行单次健康检查"
    echo "  $0 -c              # 启动持续监控"
    echo "  $0 -c -i 30        # 30秒间隔持续监控"
}

# 主函数
main() {
    local continuous_mode=false
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -c|--continuous)
                continuous_mode=true
                shift
                ;;
            -o|--once)
                continuous_mode=false
                shift
                ;;
            -i|--interval)
                CHECK_INTERVAL="$2"
                shift 2
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                echo "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    init_health_check
    
    if $continuous_mode; then
        continuous_monitoring
    else
        run_health_check
    fi
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi