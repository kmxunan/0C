import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Descriptions,
  Alert,
  Statistic,
  Row,
  Col,
  Tabs,
  Progress,
  Tooltip,
  message,
  Spin
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { standardsApi } from '../../services/api';
import './StandardsManagement.less';

const { Option } = Select;
const { TabPane } = Tabs;
const { Search } = Input;

/**
 * 标准管理页面
 */
const StandardsManagement = () => {
  const [loading, setLoading] = useState(false);
  const [standards, setStandards] = useState([]);
  const [emissionFactors, setEmissionFactors] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [selectedStandard, setSelectedStandard] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [complianceModalVisible, setComplianceModalVisible] = useState(false);
  const [complianceResult, setComplianceResult] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('');
  const [activeTab, setActiveTab] = useState('standards');

  // 加载数据
  useEffect(() => {
    loadStandards();
    loadStatistics();
  }, [filterType, filterIndustry]);

  // 加载标准列表
  const loadStandards = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterType) params.type = filterType;
      if (filterIndustry) params.industry = filterIndustry;
      
      const response = await standardsApi.getStandards(params);
      if (response.success) {
        setStandards(response.data);
      } else {
        message.error(response.message || '加载标准列表失败');
      }
    } catch (error) {
      message.error('加载标准列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载统计信息
  const loadStatistics = async () => {
    try {
      const response = await standardsApi.getStatistics();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('加载统计信息失败:', error);
    }
  };

  // 加载排放因子
  const loadEmissionFactors = async (standardCode) => {
    try {
      const response = await standardsApi.getEmissionFactors(standardCode);
      if (response.success) {
        setEmissionFactors(response.data);
      }
    } catch (error) {
      message.error('加载排放因子失败');
    }
  };

  // 搜索标准
  const handleSearch = async (value) => {
    if (!value.trim()) {
      loadStandards();
      return;
    }
    
    setLoading(true);
    try {
      const response = await standardsApi.searchStandards(value);
      if (response.success) {
        setStandards(response.data);
      } else {
        message.error(response.message || '搜索失败');
      }
    } catch (error) {
      message.error('搜索失败');
    } finally {
      setLoading(false);
    }
  };

  // 查看标准详情
  const handleViewDetails = async (record) => {
    try {
      const response = await standardsApi.getStandardDetails(record.code);
      if (response.success) {
        setSelectedStandard(response.data);
        setDetailModalVisible(true);
        loadEmissionFactors(record.code);
      } else {
        message.error(response.message || '获取标准详情失败');
      }
    } catch (error) {
      message.error('获取标准详情失败');
    }
  };

  // 验证合规性
  const handleValidateCompliance = async (standardCode, data = {}) => {
    try {
      const response = await standardsApi.validateCompliance(standardCode, data);
      if (response.success) {
        setComplianceResult(response.data);
        setComplianceModalVisible(true);
      } else {
        message.error(response.message || '验证失败');
      }
    } catch (error) {
      message.error('验证失败');
    }
  };

  // 检查更新
  const handleCheckUpdates = async () => {
    setLoading(true);
    try {
      const response = await standardsApi.checkUpdates();
      if (response.success) {
        message.success('标准更新检查已启动');
        setTimeout(() => {
          loadStandards();
          loadStatistics();
        }, 2000);
      } else {
        message.error(response.message || '检查更新失败');
      }
    } catch (error) {
      message.error('检查更新失败');
    } finally {
      setLoading(false);
    }
  };

  // 标准表格列定义
  const standardColumns = [
    {
      title: '标准代码',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      fixed: 'left'
    },
    {
      title: '标准名称',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      ellipsis: true
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => {
        const colorMap = {
          'national': 'blue',
          'industry': 'green',
          'international': 'orange'
        };
        const textMap = {
          'national': '国家标准',
          'industry': '行业标准',
          'international': '国际标准'
        };
        return <Tag color={colorMap[type]}>{textMap[type] || type}</Tag>;
      }
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 100
    },
    {
      title: '发布日期',
      dataIndex: 'publishDate',
      key: 'publishDate',
      width: 120,
      render: (date) => date ? new Date(date).toLocaleDateString() : '-'
    },
    {
      title: '适用行业',
      dataIndex: 'applicableIndustries',
      key: 'applicableIndustries',
      width: 150,
      render: (industries) => {
        if (!industries || industries.length === 0) return '-';
        return industries.slice(0, 2).map(industry => (
          <Tag key={industry} size="small">{industry}</Tag>
        ));
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusMap = {
          'active': { color: 'success', text: '有效' },
          'deprecated': { color: 'warning', text: '已废弃' },
          'draft': { color: 'processing', text: '草案' }
        };
        const config = statusMap[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<InfoCircleOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            详情
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<CheckCircleOutlined />}
            onClick={() => handleValidateCompliance(record.code)}
          >
            验证
          </Button>
        </Space>
      )
    }
  ];

  // 排放因子表格列定义
  const emissionFactorColumns = [
    {
      title: '因子代码',
      dataIndex: 'factorCode',
      key: 'factorCode',
      width: 150
    },
    {
      title: '因子名称',
      dataIndex: 'factorName',
      key: 'factorName',
      width: 200
    },
    {
      title: '能源类型',
      dataIndex: 'energyType',
      key: 'energyType',
      width: 120
    },
    {
      title: '因子值',
      dataIndex: 'factorValue',
      key: 'factorValue',
      width: 120,
      render: (value) => value?.toFixed(4) || '-'
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 100
    },
    {
      title: '温室气体类型',
      dataIndex: 'ghgType',
      key: 'ghgType',
      width: 120
    },
    {
      title: '生效日期',
      dataIndex: 'effectiveDate',
      key: 'effectiveDate',
      width: 120,
      render: (date) => date ? new Date(date).toLocaleDateString() : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusMap = {
          'active': { color: 'success', text: '有效' },
          'expired': { color: 'error', text: '已过期' },
          'pending': { color: 'processing', text: '待生效' }
        };
        const config = statusMap[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    }
  ];

  return (
    <div className="standards-management">
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总标准数"
              value={statistics.totalStandards || 0}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="国家标准"
              value={statistics.nationalStandards || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="行业标准"
              value={statistics.industryStandards || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="国际标准"
              value={statistics.internationalStandards || 0}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 主要内容 */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="标准管理" key="standards">
            {/* 工具栏 */}
            <div className="toolbar" style={{ marginBottom: 16 }}>
              <Row gutter={16} align="middle">
                <Col flex="auto">
                  <Space>
                    <Search
                      placeholder="搜索标准代码或名称"
                      allowClear
                      style={{ width: 300 }}
                      onSearch={handleSearch}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                    />
                    <Select
                      placeholder="标准类型"
                      allowClear
                      style={{ width: 120 }}
                      value={filterType}
                      onChange={setFilterType}
                    >
                      <Option value="national">国家标准</Option>
                      <Option value="industry">行业标准</Option>
                      <Option value="international">国际标准</Option>
                    </Select>
                    <Select
                      placeholder="适用行业"
                      allowClear
                      style={{ width: 150 }}
                      value={filterIndustry}
                      onChange={setFilterIndustry}
                    >
                      <Option value="manufacturing">制造业</Option>
                      <Option value="energy">能源</Option>
                      <Option value="transportation">交通运输</Option>
                      <Option value="construction">建筑</Option>
                    </Select>
                  </Space>
                </Col>
                <Col>
                  <Space>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={loadStandards}
                      loading={loading}
                    >
                      刷新
                    </Button>
                    <Button
                      type="primary"
                      icon={<SyncOutlined />}
                      onClick={handleCheckUpdates}
                      loading={loading}
                    >
                      检查更新
                    </Button>
                  </Space>
                </Col>
              </Row>
            </div>

            {/* 标准表格 */}
            <Table
              columns={standardColumns}
              dataSource={standards}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1200 }}
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 标准详情模态框 */}
      <Modal
        title="标准详情"
        visible={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedStandard && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="标准代码" span={2}>
                {selectedStandard.code}
              </Descriptions.Item>
              <Descriptions.Item label="标准名称" span={2}>
                {selectedStandard.name}
              </Descriptions.Item>
              <Descriptions.Item label="标准类型">
                <Tag color={selectedStandard.type === 'national' ? 'blue' : 
                           selectedStandard.type === 'industry' ? 'green' : 'orange'}>
                  {selectedStandard.type === 'national' ? '国家标准' :
                   selectedStandard.type === 'industry' ? '行业标准' : '国际标准'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="版本">
                {selectedStandard.version}
              </Descriptions.Item>
              <Descriptions.Item label="发布日期">
                {selectedStandard.publishDate ? 
                  new Date(selectedStandard.publishDate).toLocaleDateString() : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="实施日期">
                {selectedStandard.implementDate ? 
                  new Date(selectedStandard.implementDate).toLocaleDateString() : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="发布机构" span={2}>
                {selectedStandard.publishingOrganization || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="适用行业" span={2}>
                {selectedStandard.applicableIndustries?.map(industry => (
                  <Tag key={industry}>{industry}</Tag>
                )) || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                {selectedStandard.description || '-'}
              </Descriptions.Item>
            </Descriptions>

            {/* 关联排放因子 */}
            {emissionFactors.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4>关联排放因子</h4>
                <Table
                  columns={emissionFactorColumns}
                  dataSource={emissionFactors}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  scroll={{ x: 800 }}
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 合规性验证结果模态框 */}
      <Modal
        title="合规性验证结果"
        visible={complianceModalVisible}
        onCancel={() => setComplianceModalVisible(false)}
        footer={null}
        width={600}
      >
        {complianceResult && (
          <div>
            <Alert
              message={complianceResult.compliant ? '验证通过' : '验证失败'}
              type={complianceResult.compliant ? 'success' : 'error'}
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Descriptions bordered>
              <Descriptions.Item label="标准代码">
                {complianceResult.standardCode}
              </Descriptions.Item>
              <Descriptions.Item label="标准名称">
                {complianceResult.standardName}
              </Descriptions.Item>
              <Descriptions.Item label="合规性评分">
                <Progress 
                  percent={complianceResult.complianceScore} 
                  status={complianceResult.compliant ? 'success' : 'exception'}
                />
              </Descriptions.Item>
              <Descriptions.Item label="验证时间">
                {new Date(complianceResult.validationTime).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            {complianceResult.validationErrors?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4>验证错误</h4>
                {complianceResult.validationErrors.map((error, index) => (
                  <Alert key={index} message={error} type="error" style={{ marginBottom: 8 }} />
                ))}
              </div>
            )}

            {complianceResult.validationWarnings?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4>验证警告</h4>
                {complianceResult.validationWarnings.map((warning, index) => (
                  <Alert key={index} message={warning} type="warning" style={{ marginBottom: 8 }} />
                ))}
              </div>
            )}

            {complianceResult.improvementSuggestions?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4>改进建议</h4>
                <ul>
                  {complianceResult.improvementSuggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StandardsManagement;