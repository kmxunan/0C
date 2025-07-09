/* eslint-disable no-magic-numbers */
/**
 * 通用常量定义
 * 用于替换代码中的魔法数字
 */

module.exports = {
    // 时间相关常量 (毫秒)
    TIME: {
        SECOND: 1000,
        MINUTE: 60 * 1000,
        HOUR: 60 * 60 * 1000,
        DAY: 24 * 60 * 60 * 1000,
        WEEK: 7 * 24 * 60 * 60 * 1000
    },
    
    // HTTP状态码
    HTTP_STATUS: {
        OK: 200,
        CREATED: 201,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        INTERNAL_ERROR: 500
    },
    
    // 数据库相关
    DATABASE: {
        DEFAULT_LIMIT: 10,
        MAX_LIMIT: 100,
        DEFAULT_OFFSET: 0
    },
    
    // 缓存相关
    CACHE: {
        DEFAULT_TTL: 300, // 5分钟
        SHORT_TTL: 60,    // 1分钟
        LONG_TTL: 3600    // 1小时
    },
    
    // 性能相关
    PERFORMANCE: {
        SLOW_QUERY_THRESHOLD: 1000, // 1秒
        MAX_RETRIES: 3,
        RETRY_DELAY: 1000
    }
};
