import db from '../../infrastructure/database/index.js';
import logger from '../../shared/utils/logger.js';

/**
 * 碳排放因子实体类
 * 处理碳排放因子相关的数据操作
 */
class CarbonFactor {
  constructor(data) {
    this.id = data.id;
    this.energy_type = data.energy_type; // 能源类型
    this.region = data.region; // 地区
    this.factor_value = data.factor_value; // 因子值 (kg CO2/kWh)
    this.unit = data.unit || 'kg CO2/kWh';
    this.source = data.source; // 数据来源
    this.year = data.year; // 适用年份
    this.description = data.description; // 描述
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.created_by = data.created_by;
    this.updated_by = data.updated_by;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * 根据ID查找碳排放因子
   */
  static async findById(id) {
    try {
      const query = 'SELECT * FROM carbon_factors WHERE id = ? LIMIT 1';
      const result = await db.get(query, [id]);
      return result ? new CarbonFactor(result) : null;
    } catch (error) {
      logger.error('根据ID查找碳排放因子失败', { error: error.message, id });
      throw error;
    }
  }

  /**
   * 分页查找碳排放因子
   */
  static async findWithPagination(options = {}) {
    try {
      const { conditions = {}, pagination = {} } = options;
      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      const params = [];

      // 构建查询条件
      if (conditions.energy_type) {
        whereClause += ' AND energy_type = ?';
        params.push(conditions.energy_type);
      }

      if (conditions.region) {
        whereClause += ' AND region = ?';
        params.push(conditions.region);
      }

      if (conditions.is_active !== undefined) {
        whereClause += ' AND is_active = ?';
        params.push(conditions.is_active);
      }

      if (conditions.year) {
        whereClause += ' AND year = ?';
        params.push(conditions.year);
      }

      // 获取总数
      const countQuery = `SELECT COUNT(*) as total FROM carbon_factors ${whereClause}`;
      const countResult = await db.get(countQuery, params);
      const total = countResult.total;

      // 获取数据
      const dataQuery = `
        SELECT * FROM carbon_factors 
        ${whereClause} 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      const dataParams = [...params, limit, offset];
      const results = await db.all(dataQuery, dataParams);

      const items = results.map(row => new CarbonFactor(row));

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('分页查找碳排放因子失败', { error: error.message, options });
      throw error;
    }
  }

  /**
   * 根据能源类型和地区查找碳排放因子
   */
  static async findByEnergyTypeAndRegion(energyType, region, year = null) {
    try {
      let query = 'SELECT * FROM carbon_factors WHERE energy_type = ? AND region = ? AND is_active = 1';
      const params = [energyType, region];

      if (year) {
        query += ' AND year = ?';
        params.push(year);
      }

      query += ' ORDER BY year DESC LIMIT 1';

      const result = await db.get(query, params);
      return result ? new CarbonFactor(result) : null;
    } catch (error) {
      logger.error('根据能源类型和地区查找碳排放因子失败', { 
        error: error.message, 
        energyType, 
        region, 
        year 
      });
      throw error;
    }
  }

  /**
   * 创建新的碳排放因子
   */
  static async create(factorData) {
    try {
      const query = `
        INSERT INTO carbon_factors (
          energy_type, region, factor_value, unit, source, year, 
          description, is_active, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const now = new Date().toISOString();

      const result = await db.run(query, [
        factorData.energy_type,
        factorData.region,
        factorData.factor_value,
        factorData.unit || 'kg CO2/kWh',
        factorData.source,
        factorData.year,
        factorData.description,
        factorData.is_active !== undefined ? factorData.is_active : true,
        factorData.created_by,
        factorData.created_at || now,
        now
      ]);

      const newFactor = await CarbonFactor.findById(result.lastID);
      logger.info('碳排放因子创建成功', { 
        factorId: result.lastID, 
        energyType: factorData.energy_type,
        region: factorData.region
      });
      return newFactor;
    } catch (error) {
      logger.error('创建碳排放因子失败', { error: error.message, factorData });
      throw error;
    }
  }

  /**
   * 更新碳排放因子
   */
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];

      Object.keys(updateData).forEach(key => {
        if (key !== 'id') {
          fields.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      });

      if (fields.length === 0) {
        throw new Error('没有要更新的字段');
      }

      fields.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);

      const query = `UPDATE carbon_factors SET ${fields.join(', ')} WHERE id = ?`;
      await db.run(query, values);

      const updatedFactor = await CarbonFactor.findById(id);
      logger.info('碳排放因子更新成功', { factorId: id, updateData });
      return updatedFactor;
    } catch (error) {
      logger.error('更新碳排放因子失败', { error: error.message, id, updateData });
      throw error;
    }
  }

  /**
   * 删除碳排放因子
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM carbon_factors WHERE id = ?';
      const result = await db.run(query, [id]);
      logger.info('碳排放因子删除成功', { factorId: id });
      return result.changes > 0;
    } catch (error) {
      logger.error('删除碳排放因子失败', { error: error.message, id });
      throw error;
    }
  }

  /**
   * 软删除碳排放因子（设置为非活跃状态）
   */
  static async softDelete(id, userId) {
    try {
      const updateData = {
        is_active: false,
        updated_by: userId
      };
      
      const updatedFactor = await CarbonFactor.update(id, updateData);
      logger.info('碳排放因子软删除成功', { factorId: id, userId });
      return updatedFactor;
    } catch (error) {
      logger.error('软删除碳排放因子失败', { error: error.message, id, userId });
      throw error;
    }
  }

  /**
   * 获取所有能源类型
   */
  static async getEnergyTypes() {
    try {
      const query = 'SELECT DISTINCT energy_type FROM carbon_factors WHERE is_active = 1 ORDER BY energy_type';
      const results = await db.all(query);
      return results.map(row => row.energy_type);
    } catch (error) {
      logger.error('获取能源类型列表失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取所有地区
   */
  static async getRegions() {
    try {
      const query = 'SELECT DISTINCT region FROM carbon_factors WHERE is_active = 1 ORDER BY region';
      const results = await db.all(query);
      return results.map(row => row.region);
    } catch (error) {
      logger.error('获取地区列表失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 批量创建碳排放因子
   */
  static async createBatch(factorsData) {
    try {
      const results = [];
      
      for (const factorData of factorsData) {
        const newFactor = await CarbonFactor.create(factorData);
        results.push(newFactor);
      }
      
      logger.info('批量创建碳排放因子成功', { count: results.length });
      return results;
    } catch (error) {
      logger.error('批量创建碳排放因子失败', { error: error.message, factorsData });
      throw error;
    }
  }
}

export default CarbonFactor;