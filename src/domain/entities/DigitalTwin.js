import db from '../../infrastructure/database/index.js';
import logger from '../../shared/utils/logger.js';

/**
 * 数字孪生实体类
 * 处理数字孪生相关的数据操作
 */
class DigitalTwin {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.type = data.type; // 'device', 'system', 'process', 'building', 'area'
    this.physicalEntityId = data.physicalEntityId; // 对应的物理实体ID
    this.modelData = data.modelData; // 3D模型数据
    this.configuration = data.configuration; // 配置信息
    this.properties = data.properties; // 属性信息
    this.relationships = data.relationships; // 关联关系
    this.behaviors = data.behaviors; // 行为模型
    this.status = data.status || 'active'; // 'active', 'inactive', 'maintenance'
    this.version = data.version || '1.0.0';
    this.tags = data.tags || [];
    this.metadata = data.metadata;
    this.createdBy = data.createdBy;
    this.updatedBy = data.updatedBy;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * 根据ID查找数字孪生
   */
  static async findById(id) {
    try {
      const query = 'SELECT * FROM digital_twins WHERE id = ? LIMIT 1';
      const result = await db.get(query, [id]);
      return result ? new DigitalTwin(result) : null;
    } catch (error) {
      logger.error('根据ID查找数字孪生失败', { error: error.message, id });
      throw error;
    }
  }

  /**
   * 根据名称查找数字孪生
   */
  static async findByName(name) {
    try {
      const query = 'SELECT * FROM digital_twins WHERE name = ? LIMIT 1';
      const result = await db.get(query, [name]);
      return result ? new DigitalTwin(result) : null;
    } catch (error) {
      logger.error('根据名称查找数字孪生失败', { error: error.message, name });
      throw error;
    }
  }

  /**
   * 根据物理实体ID查找数字孪生
   */
  static async findByPhysicalEntityId(physicalEntityId) {
    try {
      const query = 'SELECT * FROM digital_twins WHERE physicalEntityId = ?';
      const results = await db.all(query, [physicalEntityId]);
      return results.map(row => new DigitalTwin(row));
    } catch (error) {
      logger.error('根据物理实体ID查找数字孪生失败', { error: error.message, physicalEntityId });
      throw error;
    }
  }

  /**
   * 创建新的数字孪生
   */
  static async create(twinData) {
    try {
      const query = `
        INSERT INTO digital_twins (
          name, description, type, physicalEntityId, modelData, configuration,
          properties, relationships, behaviors, status, version, tags, metadata,
          createdBy, updatedBy, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const now = new Date().toISOString();
      const modelData = JSON.stringify(twinData.modelData || {});
      const configuration = JSON.stringify(twinData.configuration || {});
      const properties = JSON.stringify(twinData.properties || {});
      const relationships = JSON.stringify(twinData.relationships || []);
      const behaviors = JSON.stringify(twinData.behaviors || {});
      const tags = JSON.stringify(twinData.tags || []);
      const metadata = JSON.stringify(twinData.metadata || {});
      
      const result = await db.run(query, [
        twinData.name,
        twinData.description,
        twinData.type,
        twinData.physicalEntityId,
        modelData,
        configuration,
        properties,
        relationships,
        behaviors,
        twinData.status || 'active',
        twinData.version || '1.0.0',
        tags,
        metadata,
        twinData.createdBy,
        twinData.updatedBy || twinData.createdBy,
        now,
        now
      ]);

      const newTwin = await DigitalTwin.findById(result.lastID);
      logger.info('数字孪生创建成功', { twinId: result.lastID, name: twinData.name });
      return newTwin;
    } catch (error) {
      logger.error('创建数字孪生失败', { error: error.message, twinData });
      throw error;
    }
  }

  /**
   * 更新数字孪生
   */
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];
      
      Object.keys(updateData).forEach(key => {
        if (key !== 'id') {
          fields.push(`${key} = ?`);
          if (['modelData', 'configuration', 'properties', 'relationships', 'behaviors', 'tags', 'metadata'].includes(key)) {
            values.push(JSON.stringify(updateData[key]));
          } else {
            values.push(updateData[key]);
          }
        }
      });
      
      if (fields.length === 0) {
        throw new Error('没有要更新的字段');
      }
      
      fields.push('updatedAt = ?');
      values.push(new Date().toISOString());
      values.push(id);
      
      const query = `UPDATE digital_twins SET ${fields.join(', ')} WHERE id = ?`;
      await db.run(query, values);
      
      const updatedTwin = await DigitalTwin.findById(id);
      logger.info('数字孪生更新成功', { twinId: id, updateData });
      return updatedTwin;
    } catch (error) {
      logger.error('更新数字孪生失败', { error: error.message, id, updateData });
      throw error;
    }
  }

  /**
   * 删除数字孪生
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM digital_twins WHERE id = ?';
      const result = await db.run(query, [id]);
      logger.info('数字孪生删除成功', { twinId: id });
      return result.changes > 0;
    } catch (error) {
      logger.error('删除数字孪生失败', { error: error.message, id });
      throw error;
    }
  }

  /**
   * 获取所有数字孪生
   */
  static async findAll(options = {}) {
    try {
      const { limit = 50, offset = 0, type, status, createdBy } = options;
      let query = 'SELECT * FROM digital_twins';
      const params = [];
      const conditions = [];
      
      if (type) {
        conditions.push('type = ?');
        params.push(type);
      }
      
      if (status) {
        conditions.push('status = ?');
        params.push(status);
      }
      
      if (createdBy) {
        conditions.push('createdBy = ?');
        params.push(createdBy);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      const results = await db.all(query, params);
      return results.map(row => new DigitalTwin(row));
    } catch (error) {
      logger.error('获取数字孪生列表失败', { error: error.message, options });
      throw error;
    }
  }

  /**
   * 根据类型统计数字孪生数量
   */
  static async countByType() {
    try {
      const query = `
        SELECT type, COUNT(*) as count 
        FROM digital_twins 
        GROUP BY type 
        ORDER BY count DESC
      `;
      const results = await db.all(query);
      return results;
    } catch (error) {
      logger.error('统计数字孪生数量失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 搜索数字孪生
   */
  static async search(searchTerm, options = {}) {
    try {
      const { limit = 20, offset = 0, type } = options;
      let query = `
        SELECT * FROM digital_twins 
        WHERE (name LIKE ? OR description LIKE ?)
      `;
      const params = [`%${searchTerm}%`, `%${searchTerm}%`];
      
      if (type) {
        query += ' AND type = ?';
        params.push(type);
      }
      
      query += ' ORDER BY name LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      const results = await db.all(query, params);
      return results.map(row => new DigitalTwin(row));
    } catch (error) {
      logger.error('搜索数字孪生失败', { error: error.message, searchTerm, options });
      throw error;
    }
  }

  /**
   * 获取数字孪生的关联关系
   */
  static async getRelationships(id) {
    try {
      const twin = await DigitalTwin.findById(id);
      if (!twin) {
        throw new Error('数字孪生不存在');
      }
      
      const relationships = JSON.parse(twin.relationships || '[]');
      
      // 获取关联的数字孪生详细信息
      const relatedTwins = [];
      for (const rel of relationships) {
        if (rel.targetId) {
          const relatedTwin = await DigitalTwin.findById(rel.targetId);
          if (relatedTwin) {
            relatedTwins.push({
              relationship: rel,
              twin: relatedTwin
            });
          }
        }
      }
      
      return relatedTwins;
    } catch (error) {
      logger.error('获取数字孪生关联关系失败', { error: error.message, id });
      throw error;
    }
  }

  /**
   * 更新数字孪生状态
   */
  static async updateStatus(id, status, updatedBy) {
    try {
      const query = 'UPDATE digital_twins SET status = ?, updatedBy = ?, updatedAt = ? WHERE id = ?';
      const now = new Date().toISOString();
      await db.run(query, [status, updatedBy, now, id]);
      
      const updatedTwin = await DigitalTwin.findById(id);
      logger.info('数字孪生状态更新成功', { twinId: id, status, updatedBy });
      return updatedTwin;
    } catch (error) {
      logger.error('更新数字孪生状态失败', { error: error.message, id, status });
      throw error;
    }
  }

  /**
   * 获取数字孪生的实时数据
   */
  static async getRealTimeData(id) {
    try {
      const twin = await DigitalTwin.findById(id);
      if (!twin) {
        throw new Error('数字孪生不存在');
      }
      
      // 这里可以集成实时数据获取逻辑
      // 例如从IoT设备、传感器等获取实时数据
      const realTimeData = {
        twinId: id,
        timestamp: new Date().toISOString(),
        status: twin.status,
        properties: JSON.parse(twin.properties || '{}'),
        // 可以添加更多实时数据字段
      };
      
      return realTimeData;
    } catch (error) {
      logger.error('获取数字孪生实时数据失败', { error: error.message, id });
      throw error;
    }
  }

  /**
   * 克隆数字孪生
   */
  static async clone(id, newName, createdBy) {
    try {
      const originalTwin = await DigitalTwin.findById(id);
      if (!originalTwin) {
        throw new Error('原始数字孪生不存在');
      }
      
      const cloneData = {
        name: newName,
        description: `${originalTwin.description} (克隆)`,
        type: originalTwin.type,
        physicalEntityId: originalTwin.physicalEntityId,
        modelData: JSON.parse(originalTwin.modelData || '{}'),
        configuration: JSON.parse(originalTwin.configuration || '{}'),
        properties: JSON.parse(originalTwin.properties || '{}'),
        relationships: JSON.parse(originalTwin.relationships || '[]'),
        behaviors: JSON.parse(originalTwin.behaviors || '{}'),
        status: 'inactive', // 克隆的数字孪生默认为非活跃状态
        version: '1.0.0',
        tags: JSON.parse(originalTwin.tags || '[]'),
        metadata: JSON.parse(originalTwin.metadata || '{}'),
        createdBy
      };
      
      const clonedTwin = await DigitalTwin.create(cloneData);
      logger.info('数字孪生克隆成功', { originalId: id, clonedId: clonedTwin.id, newName });
      return clonedTwin;
    } catch (error) {
      logger.error('克隆数字孪生失败', { error: error.message, id, newName });
      throw error;
    }
  }
}

export default DigitalTwin;