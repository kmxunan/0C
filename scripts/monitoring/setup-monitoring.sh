#!/bin/bash

# 零碳园区数字孪生系统 - 监控系统部署脚本
# 版本: 2.0
# 作者: 零碳园区开发团队
# 日期: 2025-06-15

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    # 检查端口占用
    local ports=("3000" "9090" "9093" "9100" "9121" "6379")
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_warning "端口 $port 已被占用，可能会导致服务启动失败"
        fi
    done
    
    log_success "依赖检查完成"
}

# 创建必要的目录
create_directories() {
    log_info "创建监控配置目录..."
    
    local dirs=(
        "config/prometheus"
        "config/grafana/dashboards"
        "config/grafana/datasources"
        "config/alertmanager"
        "data/prometheus"
        "data/grafana"
        "data/alertmanager"
        "logs/monitoring"
    )
    
    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
        log_info "创建目录: $dir"
    done
    
    log_success "目录创建完成"
}

# 设置权限
set_permissions() {
    log_info "设置目录权限..."
    
    # Grafana需要特定的用户权限
    sudo chown -R 472:472 data/grafana 2>/dev/null || true
    
    # Prometheus数据目录权限
    sudo chown -R 65534:65534 data/prometheus 2>/dev/null || true
    
    # AlertManager数据目录权限
    sudo chown -R 65534:65534 data/alertmanager 2>/dev/null || true
    
    log_success "权限设置完成"
}

# 验证配置文件
validate_configs() {
    log_info "验证配置文件..."
    
    # 检查Prometheus配置
    if [ -f "config/prometheus/prometheus.yml" ]; then
        docker run --rm -v "$(pwd)/config/prometheus:/etc/prometheus" \
            prom/prometheus:latest \
            promtool check config /etc/prometheus/prometheus.yml
        log_success "Prometheus配置验证通过"
    else
        log_error "Prometheus配置文件不存在"
        exit 1
    fi
    
    # 检查AlertManager配置
    if [ -f "config/alertmanager/alertmanager.yml" ]; then
        docker run --rm -v "$(pwd)/config/alertmanager:/etc/alertmanager" \
            prom/alertmanager:latest \
            amtool check-config /etc/alertmanager/alertmanager.yml
        log_success "AlertManager配置验证通过"
    else
        log_error "AlertManager配置文件不存在"
        exit 1
    fi
}

# 启动监控服务
start_monitoring() {
    log_info "启动监控服务..."
    
    # 拉取最新镜像
    log_info "拉取Docker镜像..."
    docker-compose pull prometheus grafana node-exporter alertmanager redis redis-exporter
    
    # 启动服务
    log_info "启动监控容器..."
    docker-compose up -d prometheus grafana node-exporter alertmanager redis redis-exporter
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    # 检查服务状态
    check_services
}

# 检查服务状态
check_services() {
    log_info "检查服务状态..."
    
    local services=("prometheus:9090" "grafana:3000" "alertmanager:9093" "node-exporter:9100" "redis-exporter:9121")
    
    for service in "${services[@]}"; do
        local name=$(echo $service | cut -d':' -f1)
        local port=$(echo $service | cut -d':' -f2)
        
        if curl -f -s "http://localhost:$port" > /dev/null 2>&1; then
            log_success "$name 服务运行正常 (端口: $port)"
        else
            log_error "$name 服务启动失败 (端口: $port)"
        fi
    done
}

# 配置Grafana
setup_grafana() {
    log_info "配置Grafana..."
    
    # 等待Grafana完全启动
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "http://localhost:3000/api/health" > /dev/null 2>&1; then
            log_success "Grafana已启动"
            break
        fi
        
        log_info "等待Grafana启动... (尝试 $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        log_error "Grafana启动超时"
        return 1
    fi
    
    # 导入仪表板
    log_info "导入Grafana仪表板..."
    
    # 这里可以添加自动导入仪表板的逻辑
    # curl -X POST -H "Content-Type: application/json" \
    #      -d @config/grafana/dashboards/zero-carbon-system-overview.json \
    #      http://admin:admin123@localhost:3000/api/dashboards/db
    
    log_success "Grafana配置完成"
}

# 显示访问信息
show_access_info() {
    log_success "监控系统部署完成！"
    echo
    echo "=== 访问信息 ==="
    echo "Grafana:      http://localhost:3000 (admin/admin123)"
    echo "Prometheus:   http://localhost:9090"
    echo "AlertManager: http://localhost:9093"
    echo "Node Exporter: http://localhost:9100"
    echo "Redis Exporter: http://localhost:9121"
    echo
    echo "=== 数据目录 ==="
    echo "Prometheus数据: $(pwd)/data/prometheus"
    echo "Grafana数据:    $(pwd)/data/grafana"
    echo "AlertManager数据: $(pwd)/data/alertmanager"
    echo
    echo "=== 日志查看 ==="
    echo "查看所有服务日志: docker-compose logs -f"
    echo "查看特定服务日志: docker-compose logs -f <service_name>"
    echo
    echo "=== 管理命令 ==="
    echo "停止监控服务: docker-compose stop"
    echo "重启监控服务: docker-compose restart"
    echo "删除监控服务: docker-compose down"
    echo "删除数据卷:   docker-compose down -v"
}

# 主函数
main() {
    log_info "开始部署零碳园区数字孪生系统监控组件..."
    
    check_dependencies
    create_directories
    set_permissions
    validate_configs
    start_monitoring
    setup_grafana
    show_access_info
    
    log_success "监控系统部署完成！"
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi