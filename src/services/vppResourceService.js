/**
 * VPP资源管理服务
 * 实现资源模板管理、资源实例管理、VPP聚合管理等核心功能
 * 版本: v1.0
 * 创建时间: 2025年1月
 */

import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

class VPPResourceService {
    /**
     * ==================== 资源模板管理 ====================
     */

    /**
     * 获取资源模板列表
     * @param {Object} params - 查询参数
     * @param {string} params.type - 资源类型
     * @param {string} params.category - 资源分类
     * @param {number} params.page - 页码
     * @param {number} params.size - 页大小
     * @returns {Promise<Object>} 模板列表和分页信息
     */
    async getResourceTemplates(params = {}) {
        try {
            const { type, category, page = 1, size = 20 } = params;
            const offset = (page - 1) * size;
            
            let whereClause = 'WHERE status = "ACTIVE"';
            const queryParams = [];
            
            if (type) {
                whereClause += ' AND type = ?';
                queryParams.push(type);
            }
            
            if (category) {
                whereClause += ' AND category = ?';
                queryParams.push(category);
            }
            
            // 获取总数
            const countQuery = `SELECT COUNT(*) as total FROM vpp_resource_templates ${whereClause}`;
            const [countResult] = await db.execute(countQuery, queryParams);
            const total = countResult[0].total;
            
            // 获取数据
            const dataQuery = `
                SELECT id, name, type, category, parameters, control_interface, 
                       version, created_at, updated_at, created_by
                FROM vpp_resource_templates 
                ${whereClause}
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `;
            
            const [templates] = await db.execute(dataQuery, [...queryParams, size, offset]);
            
            return {
                success: true,
                data: {
                    templates: templates.map(template => ({
                        ...template,
                        parameters: typeof template.parameters === 'string' 
                            ? JSON.parse(template.parameters) 
                            : template.parameters,
                        control_interface: typeof template.control_interface === 'string'
                            ? JSON.parse(template.control_interface)
                            : template.control_interface
                    })),
                    pagination: {
                        page,
                        size,
                        total,
                        pages: Math.ceil(total / size)
                    }
                }
            };
        } catch (error) {
            logger.error('获取资源模板列表失败:', error);
            throw new Error(`获取资源模板列表失败: ${error.message}`);
        }
    }

    /**
     * 创建资源模板
     * @param {Object} templateData - 模板数据
     * @returns {Promise<Object>} 创建结果
     */
    async createResourceTemplate(templateData) {
        try {
            const {
                name,
                type,
                category,
                parameters,
                control_interface,
                version = '1.0',
                created_by
            } = templateData;
            
            const templateId = uuidv4();
            
            const query = `
                INSERT INTO vpp_resource_templates 
                (id, name, type, category, parameters, control_interface, version, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            await db.execute(query, [
                templateId,
                name,
                type,
                category,
                JSON.stringify(parameters),
                JSON.stringify(control_interface),
                version,
                created_by
            ]);
            
            logger.info(`资源模板创建成功: ${templateId}`);
            
            return {
                success: true,
                data: {
                    id: templateId,
                    message: '资源模板创建成功'
                }
            };
        } catch (error) {
            logger.error('创建资源模板失败:', error);
            throw new Error(`创建资源模板失败: ${error.message}`);
        }
    }

    /**
     * 更新资源模板
     * @param {string} templateId - 模板ID
     * @param {Object} updateData - 更新数据
     * @returns {Promise<Object>} 更新结果
     */
    async updateResourceTemplate(templateId, updateData) {
        try {
            const { name, parameters, control_interface, version } = updateData;
            
            const updateFields = [];
            const updateValues = [];
            
            if (name) {
                updateFields.push('name = ?');
                updateValues.push(name);
            }
            
            if (parameters) {
                updateFields.push('parameters = ?');
                updateValues.push(JSON.stringify(parameters));
            }
            
            if (control_interface) {
                updateFields.push('control_interface = ?');
                updateValues.push(JSON.stringify(control_interface));
            }
            
            if (version) {
                updateFields.push('version = ?');
                updateValues.push(version);
            }
            
            if (updateFields.length === 0) {
                throw new Error('没有提供更新字段');
            }
            
            updateValues.push(templateId);
            
            const query = `
                UPDATE vpp_resource_templates 
                SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            
            const [result] = await db.execute(query, updateValues);
            
            if (result.affectedRows === 0) {
                throw new Error('模板不存在或更新失败');
            }
            
            logger.info(`资源模板更新成功: ${templateId}`);
            
            return {
                success: true,
                data: {
                    message: '资源模板更新成功'
                }
            };
        } catch (error) {
            logger.error('更新资源模板失败:', error);
            throw new Error(`更新资源模板失败: ${error.message}`);
        }
    }

    /**
     * ==================== 资源实例管理 ====================
     */

    /**
     * 获取资源实例列表
     * @param {Object} params - 查询参数
     * @returns {Promise<Object>} 实例列表
     */
    async getResourceInstances(params = {}) {
        try {
            const { template_id, status, page = 1, size = 20 } = params;
            const offset = (page - 1) * size;
            
            let whereClause = 'WHERE 1=1';
            const queryParams = [];
            
            if (template_id) {
                whereClause += ' AND ri.template_id = ?';
                queryParams.push(template_id);
            }
            
            if (status) {
                whereClause += ' AND ri.status = ?';
                queryParams.push(status);
            }
            
            // 获取总数
            const countQuery = `
                SELECT COUNT(*) as total 
                FROM vpp_resource_instances ri
                LEFT JOIN vpp_resource_templates rt ON ri.template_id = rt.id
                ${whereClause}
            `;
            const [countResult] = await db.execute(countQuery, queryParams);
            const total = countResult[0].total;
            
            // 获取数据
            const dataQuery = `
                SELECT 
                    ri.id,
                    ri.template_id,
                    ri.resource_id,
                    ri.status,
                    ri.device_ip,
                    ri.device_port,
                    ri.location_info,
                    ri.current_output,
                    ri.available_capacity,
                    ri.efficiency,
                    ri.real_time_data,
                    ri.last_communication,
                    ri.last_heartbeat,
                    ri.created_at,
                    ri.updated_at,
                    rt.name as template_name,
                    rt.type as resource_type,
                    rt.category as resource_category,
                    r.name as resource_name,
                    r.rated_capacity
                FROM vpp_resource_instances ri
                LEFT JOIN vpp_resource_templates rt ON ri.template_id = rt.id
                LEFT JOIN vpp_resources r ON ri.resource_id = r.id
                ${whereClause}
                ORDER BY ri.created_at DESC
                LIMIT ? OFFSET ?
            `;
            
            const [instances] = await db.execute(dataQuery, [...queryParams, size, offset]);
            
            return {
                success: true,
                data: {
                    instances: instances.map(instance => ({
                        ...instance,
                        location_info: typeof instance.location_info === 'string'
                            ? JSON.parse(instance.location_info || '{}')
                            : instance.location_info,
                        real_time_data: typeof instance.real_time_data === 'string'
                            ? JSON.parse(instance.real_time_data || '{}')
                            : instance.real_time_data
                    })),
                    pagination: {
                        page,
                        size,
                        total,
                        pages: Math.ceil(total / size)
                    }
                }
            };
        } catch (error) {
            logger.error('获取资源实例列表失败:', error);
            throw new Error(`获取资源实例列表失败: ${error.message}`);
        }
    }

    /**
     * 创建资源实例
     * @param {Object} instanceData - 实例数据
     * @returns {Promise<Object>} 创建结果
     */
    async createResourceInstance(instanceData) {
        try {
            const {
                template_id,
                resource_id,
                device_ip,
                device_port,
                location_info,
                capacity
            } = instanceData;
            
            // 验证模板是否存在
            const [templateCheck] = await db.execute(
                'SELECT id FROM vpp_resource_templates WHERE id = ? AND status = "ACTIVE"',
                [template_id]
            );
            
            if (templateCheck.length === 0) {
                throw new Error('指定的资源模板不存在或已禁用');
            }
            
            // 更新资源实例表
            const updateQuery = `
                UPDATE vpp_resource_instances 
                SET template_id = ?, device_ip = ?, device_port = ?, 
                    location_info = ?, available_capacity = ?, updated_at = CURRENT_TIMESTAMP
                WHERE resource_id = ?
            `;
            
            const [result] = await db.execute(updateQuery, [
                template_id,
                device_ip,
                device_port,
                JSON.stringify(location_info || {}),
                capacity,
                resource_id
            ]);
            
            if (result.affectedRows === 0) {
                throw new Error('资源实例不存在或更新失败');
            }
            
            logger.info(`资源实例创建成功: ${resource_id}`);
            
            return {
                success: true,
                data: {
                    resource_id,
                    message: '资源实例创建成功'
                }
            };
        } catch (error) {
            logger.error('创建资源实例失败:', error);
            throw new Error(`创建资源实例失败: ${error.message}`);
        }
    }

    /**
     * 更新资源实例状态
     * @param {number} instanceId - 实例ID
     * @param {Object} statusData - 状态数据
     * @returns {Promise<Object>} 更新结果
     */
    async updateResourceInstanceStatus(instanceId, statusData) {
        try {
            const { status, reason } = statusData;
            
            const query = `
                UPDATE vpp_resource_instances 
                SET status = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP,
                    last_heartbeat = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            
            const [result] = await db.execute(query, [status, reason || null, instanceId]);
            
            if (result.affectedRows === 0) {
                throw new Error('资源实例不存在');
            }
            
            logger.info(`资源实例状态更新成功: ${instanceId} -> ${status}`);
            
            return {
                success: true,
                data: {
                    message: '资源实例状态更新成功'
                }
            };
        } catch (error) {
            logger.error('更新资源实例状态失败:', error);
            throw new Error(`更新资源实例状态失败: ${error.message}`);
        }
    }

    /**
     * 获取资源实时数据
     * @param {number} instanceId - 实例ID
     * @returns {Promise<Object>} 实时数据
     */
    async getResourceRealtimeData(instanceId) {
        try {
            const query = `
                SELECT 
                    ri.id,
                    ri.current_output as power,
                    ri.available_capacity as energy,
                    JSON_EXTRACT(ri.real_time_data, '$.soc') as soc,
                    JSON_EXTRACT(ri.real_time_data, '$.temperature') as temperature,
                    JSON_EXTRACT(ri.real_time_data, '$.voltage') as voltage,
                    JSON_EXTRACT(ri.real_time_data, '$.current') as current,
                    ri.last_communication as timestamp,
                    ri.status
                FROM vpp_resource_instances ri
                WHERE ri.id = ?
            `;
            
            const [result] = await db.execute(query, [instanceId]);
            
            if (result.length === 0) {
                throw new Error('资源实例不存在');
            }
            
            const data = result[0];
            
            return {
                success: true,
                data: {
                    power: parseFloat(data.power) || 0,
                    energy: parseFloat(data.energy) || 0,
                    soc: parseFloat(data.soc) || null,
                    temperature: parseFloat(data.temperature) || null,
                    voltage: parseFloat(data.voltage) || null,
                    current: parseFloat(data.current) || null,
                    timestamp: data.timestamp,
                    status: data.status
                }
            };
        } catch (error) {
            logger.error('获取资源实时数据失败:', error);
            throw new Error(`获取资源实时数据失败: ${error.message}`);
        }
    }

    /**
     * ==================== VPP聚合管理 ====================
     */

    /**
     * 获取VPP聚合参数
     * @param {number} vppId - VPP ID
     * @returns {Promise<Object>} 聚合参数
     */
    async getVPPAggregatedParams(vppId) {
        try {
            const query = `
                SELECT 
                    v.id,
                    v.name,
                    v.total_capacity,
                    v.available_capacity,
                    COUNT(a.resource_id) as resource_count,
                    SUM(CASE WHEN ri.status = 'online' THEN r.rated_capacity * a.allocation_ratio / 100 ELSE 0 END) as available_up_capacity,
                    SUM(CASE WHEN ri.status = 'online' AND r.type = 'battery' THEN r.rated_capacity * a.allocation_ratio / 100 ELSE 0 END) as available_down_capacity,
                    AVG(CASE WHEN ri.status = 'online' THEN ri.efficiency ELSE NULL END) as avg_efficiency,
                    MIN(CASE WHEN ri.status = 'online' THEN JSON_EXTRACT(r.technical_specs, '$.response_time') ELSE NULL END) as response_time
                FROM vpp_definitions v
                LEFT JOIN vpp_resource_associations a ON v.id = a.vpp_id AND a.status = 'active'
                LEFT JOIN vpp_resources r ON a.resource_id = r.id
                LEFT JOIN vpp_resource_instances ri ON r.id = ri.resource_id
                WHERE v.id = ?
                GROUP BY v.id, v.name, v.total_capacity, v.available_capacity
            `;
            
            const [result] = await db.execute(query, [vppId]);
            
            if (result.length === 0) {
                throw new Error('VPP不存在');
            }
            
            const data = result[0];
            
            return {
                success: true,
                data: {
                    total_capacity: parseFloat(data.total_capacity) || 0,
                    available_up_capacity: parseFloat(data.available_up_capacity) || 0,
                    available_down_capacity: parseFloat(data.available_down_capacity) || 0,
                    response_time: parseInt(data.response_time) || 300,
                    efficiency: parseFloat(data.avg_efficiency) || 0,
                    resource_count: parseInt(data.resource_count) || 0
                }
            };
        } catch (error) {
            logger.error('获取VPP聚合参数失败:', error);
            throw new Error(`获取VPP聚合参数失败: ${error.message}`);
        }
    }

    /**
     * 更新VPP资源配置
     * @param {number} vppId - VPP ID
     * @param {Object} resourceConfig - 资源配置
     * @returns {Promise<Object>} 更新结果
     */
    async updateVPPResources(vppId, resourceConfig) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            const { add_resources = [], remove_resources = [], update_resources = [] } = resourceConfig;
            
            // 添加资源
            for (const resource of add_resources) {
                const { resource_id, allocation_ratio = 100, priority = 1 } = resource;
                
                await connection.execute(
                    `INSERT INTO vpp_resource_associations 
                     (vpp_id, resource_id, allocation_ratio, priority) 
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE 
                     allocation_ratio = VALUES(allocation_ratio), 
                     priority = VALUES(priority),
                     status = 'active'`,
                    [vppId, resource_id, allocation_ratio, priority]
                );
            }
            
            // 移除资源
            if (remove_resources.length > 0) {
                const placeholders = remove_resources.map(() => '?').join(',');
                await connection.execute(
                    `UPDATE vpp_resource_associations 
                     SET status = 'inactive' 
                     WHERE vpp_id = ? AND resource_id IN (${placeholders})`,
                    [vppId, ...remove_resources]
                );
            }
            
            // 更新资源配置
            for (const resource of update_resources) {
                const { resource_id, allocation_ratio, priority } = resource;
                
                const updateFields = [];
                const updateValues = [];
                
                if (allocation_ratio !== undefined) {
                    updateFields.push('allocation_ratio = ?');
                    updateValues.push(allocation_ratio);
                }
                
                if (priority !== undefined) {
                    updateFields.push('priority = ?');
                    updateValues.push(priority);
                }
                
                if (updateFields.length > 0) {
                    updateValues.push(vppId, resource_id);
                    
                    await connection.execute(
                        `UPDATE vpp_resource_associations 
                         SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
                         WHERE vpp_id = ? AND resource_id = ?`,
                        updateValues
                    );
                }
            }
            
            // 更新VPP总容量
            await connection.execute(
                `UPDATE vpp_definitions v
                 SET total_capacity = (
                     SELECT COALESCE(SUM(r.rated_capacity * a.allocation_ratio / 100), 0)
                     FROM vpp_resource_associations a
                     JOIN vpp_resources r ON a.resource_id = r.id
                     WHERE a.vpp_id = v.id AND a.status = 'active'
                 ),
                 available_capacity = (
                     SELECT COALESCE(SUM(r.rated_capacity * a.allocation_ratio / 100), 0)
                     FROM vpp_resource_associations a
                     JOIN vpp_resources r ON a.resource_id = r.id
                     WHERE a.vpp_id = v.id AND a.status = 'active'
                 ),
                 updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [vppId]
            );
            
            await connection.commit();
            
            logger.info(`VPP资源配置更新成功: ${vppId}`);
            
            return {
                success: true,
                data: {
                    message: 'VPP资源配置更新成功'
                }
            };
        } catch (error) {
            await connection.rollback();
            logger.error('更新VPP资源配置失败:', error);
            throw new Error(`更新VPP资源配置失败: ${error.message}`);
        } finally {
            connection.release();
        }
    }
}

export default new VPPResourceService();