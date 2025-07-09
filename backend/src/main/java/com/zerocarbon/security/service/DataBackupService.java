package com.zerocarbon.security.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import javax.sql.DataSource;
import java.io.*;
import java.nio.file.*;
import java.sql.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;

/**
 * 数据备份和恢复服务
 * 提供数据库备份、文件备份、增量备份、恢复等功能
 */
@Service
public class DataBackupService {
    
    private static final Logger logger = LoggerFactory.getLogger(DataBackupService.class);
    
    @Autowired
    private DataSource dataSource;
    
    @Autowired
    private DataEncryptionService encryptionService;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Value("${app.backup.path:/var/backups/zerocarbon}")
    private String backupPath;
    
    @Value("${app.backup.retention.days:30}")
    private int retentionDays;
    
    @Value("${app.backup.compression.enabled:true}")
    private boolean compressionEnabled;
    
    @Value("${app.backup.encryption.enabled:true}")
    private boolean encryptionEnabled;
    
    @Value("${app.backup.incremental.enabled:true}")
    private boolean incrementalEnabled;
    
    private static final DateTimeFormatter BACKUP_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");
    
    /**
     * 备份类型枚举
     */
    public enum BackupType {
        FULL,           // 全量备份
        INCREMENTAL,    // 增量备份
        DIFFERENTIAL    // 差异备份
    }
    
    /**
     * 备份状态枚举
     */
    public enum BackupStatus {
        RUNNING,
        COMPLETED,
        FAILED,
        CANCELLED
    }
    
    /**
     * 备份信息类
     */
    public static class BackupInfo {
        private String backupId;
        private BackupType type;
        private BackupStatus status;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private String filePath;
        private long fileSize;
        private String checksum;
        private String errorMessage;
        private Map<String, Object> metadata;
        
        // 构造函数和getter/setter方法
        public BackupInfo() {
            this.metadata = new HashMap<>();
        }
        
        public BackupInfo(String backupId, BackupType type) {
            this();
            this.backupId = backupId;
            this.type = type;
            this.status = BackupStatus.RUNNING;
            this.startTime = LocalDateTime.now();
        }
        
        // Getters and Setters
        public String getBackupId() { return backupId; }
        public void setBackupId(String backupId) { this.backupId = backupId; }
        
        public BackupType getType() { return type; }
        public void setType(BackupType type) { this.type = type; }
        
        public BackupStatus getStatus() { return status; }
        public void setStatus(BackupStatus status) { this.status = status; }
        
        public LocalDateTime getStartTime() { return startTime; }
        public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
        
        public LocalDateTime getEndTime() { return endTime; }
        public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
        
        public String getFilePath() { return filePath; }
        public void setFilePath(String filePath) { this.filePath = filePath; }
        
        public long getFileSize() { return fileSize; }
        public void setFileSize(long fileSize) { this.fileSize = fileSize; }
        
        public String getChecksum() { return checksum; }
        public void setChecksum(String checksum) { this.checksum = checksum; }
        
        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
        
        public Map<String, Object> getMetadata() { return metadata; }
        public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    }
    
    // 备份任务缓存
    private final Map<String, BackupInfo> backupTasks = new HashMap<>();
    
    /**
     * 执行全量备份
     */
    @Async
    public CompletableFuture<BackupInfo> performFullBackup() {
        return performBackup(BackupType.FULL, null);
    }
    
    /**
     * 执行增量备份
     */
    @Async
    public CompletableFuture<BackupInfo> performIncrementalBackup() {
        if (!incrementalEnabled) {
            throw new IllegalStateException("增量备份未启用");
        }
        
        // 查找最近的备份作为基准
        BackupInfo lastBackup = getLastBackup();
        return performBackup(BackupType.INCREMENTAL, lastBackup);
    }
    
    /**
     * 执行备份
     */
    private CompletableFuture<BackupInfo> performBackup(BackupType type, BackupInfo baseBackup) {
        String backupId = generateBackupId(type);
        BackupInfo backupInfo = new BackupInfo(backupId, type);
        backupTasks.put(backupId, backupInfo);
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                logger.info("开始执行{}备份，备份ID: {}", type, backupId);
                
                // 创建备份目录
                Path backupDir = createBackupDirectory(backupId);
                
                // 备份数据库
                String dbBackupFile = backupDatabase(backupDir, type, baseBackup);
                
                // 备份文件
                String fileBackupFile = backupFiles(backupDir, type, baseBackup);
                
                // 创建备份清单
                String manifestFile = createBackupManifest(backupDir, dbBackupFile, fileBackupFile, backupInfo);
                
                // 压缩备份文件
                String finalBackupFile = compressBackup(backupDir, backupId);
                
                // 加密备份文件
                if (encryptionEnabled) {
                    finalBackupFile = encryptBackup(finalBackupFile);
                }
                
                // 计算校验和
                String checksum = calculateChecksum(finalBackupFile);
                
                // 更新备份信息
                backupInfo.setFilePath(finalBackupFile);
                backupInfo.setFileSize(new File(finalBackupFile).length());
                backupInfo.setChecksum(checksum);
                backupInfo.setStatus(BackupStatus.COMPLETED);
                backupInfo.setEndTime(LocalDateTime.now());
                
                // 保存备份信息
                saveBackupInfo(backupInfo);
                
                logger.info("备份完成，备份ID: {}，文件: {}", backupId, finalBackupFile);
                
                return backupInfo;
                
            } catch (Exception e) {
                logger.error("备份失败，备份ID: {}", backupId, e);
                backupInfo.setStatus(BackupStatus.FAILED);
                backupInfo.setErrorMessage(e.getMessage());
                backupInfo.setEndTime(LocalDateTime.now());
                return backupInfo;
            }
        });
    }
    
    /**
     * 恢复数据
     */
    @Transactional
    public boolean restoreFromBackup(String backupId) {
        try {
            logger.info("开始恢复数据，备份ID: {}", backupId);
            
            BackupInfo backupInfo = getBackupInfo(backupId);
            if (backupInfo == null) {
                throw new IllegalArgumentException("备份不存在: " + backupId);
            }
            
            String backupFile = backupInfo.getFilePath();
            
            // 验证备份文件
            if (!verifyBackup(backupFile, backupInfo.getChecksum())) {
                throw new RuntimeException("备份文件校验失败");
            }
            
            // 解密备份文件
            if (encryptionEnabled && backupFile.endsWith(".enc")) {
                backupFile = decryptBackup(backupFile);
            }
            
            // 解压备份文件
            Path extractDir = decompressBackup(backupFile);
            
            // 恢复数据库
            restoreDatabase(extractDir);
            
            // 恢复文件
            restoreFiles(extractDir);
            
            logger.info("数据恢复完成，备份ID: {}", backupId);
            return true;
            
        } catch (Exception e) {
            logger.error("数据恢复失败，备份ID: {}", backupId, e);
            return false;
        }
    }
    
    /**
     * 定时清理过期备份
     */
    @Scheduled(cron = "0 0 2 * * ?") // 每天凌晨2点执行
    public void cleanupExpiredBackups() {
        try {
            logger.info("开始清理过期备份，保留天数: {}", retentionDays);
            
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(retentionDays);
            List<BackupInfo> allBackups = getAllBackups();
            
            int deletedCount = 0;
            for (BackupInfo backup : allBackups) {
                if (backup.getStartTime().isBefore(cutoffDate)) {
                    if (deleteBackup(backup.getBackupId())) {
                        deletedCount++;
                    }
                }
            }
            
            logger.info("清理过期备份完成，删除了 {} 个备份", deletedCount);
            
        } catch (Exception e) {
            logger.error("清理过期备份失败", e);
        }
    }
    
    /**
     * 定时执行增量备份
     */
    @Scheduled(cron = "0 0 1 * * ?") // 每天凌晨1点执行
    public void scheduledIncrementalBackup() {
        if (incrementalEnabled) {
            try {
                performIncrementalBackup();
            } catch (Exception e) {
                logger.error("定时增量备份失败", e);
            }
        }
    }
    
    /**
     * 获取备份列表
     */
    public List<BackupInfo> getAllBackups() {
        try {
            Path backupDir = Paths.get(backupPath);
            if (!Files.exists(backupDir)) {
                return new ArrayList<>();
            }
            
            List<BackupInfo> backups = new ArrayList<>();
            Files.list(backupDir)
                .filter(path -> path.toString().endsWith(".info"))
                .forEach(infoFile -> {
                    try {
                        BackupInfo info = objectMapper.readValue(infoFile.toFile(), BackupInfo.class);
                        backups.add(info);
                    } catch (Exception e) {
                        logger.warn("读取备份信息失败: {}", infoFile, e);
                    }
                });
            
            // 按时间倒序排列
            backups.sort((a, b) -> b.getStartTime().compareTo(a.getStartTime()));
            return backups;
            
        } catch (Exception e) {
            logger.error("获取备份列表失败", e);
            return new ArrayList<>();
        }
    }
    
    /**
     * 获取备份信息
     */
    public BackupInfo getBackupInfo(String backupId) {
        try {
            Path infoFile = Paths.get(backupPath, backupId + ".info");
            if (Files.exists(infoFile)) {
                return objectMapper.readValue(infoFile.toFile(), BackupInfo.class);
            }
        } catch (Exception e) {
            logger.error("读取备份信息失败: {}", backupId, e);
        }
        return null;
    }
    
    /**
     * 删除备份
     */
    public boolean deleteBackup(String backupId) {
        try {
            BackupInfo backupInfo = getBackupInfo(backupId);
            if (backupInfo == null) {
                return false;
            }
            
            // 删除备份文件
            if (StringUtils.hasText(backupInfo.getFilePath())) {
                Files.deleteIfExists(Paths.get(backupInfo.getFilePath()));
            }
            
            // 删除信息文件
            Files.deleteIfExists(Paths.get(backupPath, backupId + ".info"));
            
            // 从缓存中移除
            backupTasks.remove(backupId);
            
            logger.info("删除备份成功: {}", backupId);
            return true;
            
        } catch (Exception e) {
            logger.error("删除备份失败: {}", backupId, e);
            return false;
        }
    }
    
    // 私有辅助方法
    
    private String generateBackupId(BackupType type) {
        return type.name().toLowerCase() + "_" + LocalDateTime.now().format(BACKUP_DATE_FORMAT);
    }
    
    private Path createBackupDirectory(String backupId) throws IOException {
        Path backupDir = Paths.get(backupPath, backupId);
        Files.createDirectories(backupDir);
        return backupDir;
    }
    
    private String backupDatabase(Path backupDir, BackupType type, BackupInfo baseBackup) throws SQLException, IOException {
        String dbBackupFile = backupDir.resolve("database.sql").toString();
        
        try (Connection conn = dataSource.getConnection();
             FileWriter writer = new FileWriter(dbBackupFile)) {
            
            // 获取所有表名
            List<String> tables = getDatabaseTables(conn);
            
            for (String table : tables) {
                // 写入表结构
                writer.write("-- Table: " + table + "\n");
                writer.write(getCreateTableStatement(conn, table));
                writer.write("\n\n");
                
                // 写入表数据
                if (type == BackupType.FULL || shouldBackupTable(table, baseBackup)) {
                    exportTableData(conn, table, writer, type, baseBackup);
                }
            }
        }
        
        return dbBackupFile;
    }
    
    private String backupFiles(Path backupDir, BackupType type, BackupInfo baseBackup) throws IOException {
        String fileBackupDir = backupDir.resolve("files").toString();
        Files.createDirectories(Paths.get(fileBackupDir));
        
        // 这里可以根据需要备份应用程序文件
        // 示例：备份上传文件目录
        Path uploadDir = Paths.get("uploads");
        if (Files.exists(uploadDir)) {
            copyDirectory(uploadDir, Paths.get(fileBackupDir, "uploads"));
        }
        
        return fileBackupDir;
    }
    
    private String createBackupManifest(Path backupDir, String dbBackupFile, String fileBackupFile, BackupInfo backupInfo) throws IOException {
        String manifestFile = backupDir.resolve("manifest.json").toString();
        
        Map<String, Object> manifest = new HashMap<>();
        manifest.put("backupId", backupInfo.getBackupId());
        manifest.put("type", backupInfo.getType());
        manifest.put("timestamp", backupInfo.getStartTime().toString());
        manifest.put("databaseBackup", dbBackupFile);
        manifest.put("fileBackup", fileBackupFile);
        manifest.put("version", "1.0");
        
        objectMapper.writeValue(new File(manifestFile), manifest);
        return manifestFile;
    }
    
    private String compressBackup(Path backupDir, String backupId) throws IOException {
        if (!compressionEnabled) {
            return backupDir.toString();
        }
        
        String compressedFile = Paths.get(backupPath, backupId + ".tar.gz").toString();
        
        try (FileOutputStream fos = new FileOutputStream(compressedFile);
             GZIPOutputStream gzos = new GZIPOutputStream(fos)) {
            
            compressDirectory(backupDir, gzos);
        }
        
        // 删除原始备份目录
        deleteDirectory(backupDir);
        
        return compressedFile;
    }
    
    private String encryptBackup(String backupFile) {
        if (!encryptionEnabled) {
            return backupFile;
        }
        
        try {
            String encryptedFile = backupFile + ".enc";
            String content = Files.readString(Paths.get(backupFile));
            String encryptedContent = encryptionService.encrypt(content);
            Files.writeString(Paths.get(encryptedFile), encryptedContent);
            
            // 删除原始文件
            Files.deleteIfExists(Paths.get(backupFile));
            
            return encryptedFile;
        } catch (Exception e) {
            throw new RuntimeException("备份加密失败", e);
        }
    }
    
    private String calculateChecksum(String filePath) {
        try {
            byte[] fileBytes = Files.readAllBytes(Paths.get(filePath));
            return encryptionService.hash(new String(fileBytes));
        } catch (Exception e) {
            throw new RuntimeException("计算校验和失败", e);
        }
    }
    
    private void saveBackupInfo(BackupInfo backupInfo) throws IOException {
        String infoFile = Paths.get(backupPath, backupInfo.getBackupId() + ".info").toString();
        objectMapper.writeValue(new File(infoFile), backupInfo);
    }
    
    private BackupInfo getLastBackup() {
        List<BackupInfo> backups = getAllBackups();
        return backups.isEmpty() ? null : backups.get(0);
    }
    
    private boolean verifyBackup(String backupFile, String expectedChecksum) {
        try {
            String actualChecksum = calculateChecksum(backupFile);
            return actualChecksum.equals(expectedChecksum);
        } catch (Exception e) {
            logger.error("备份校验失败", e);
            return false;
        }
    }
    
    private String decryptBackup(String encryptedFile) {
        try {
            String decryptedFile = encryptedFile.replace(".enc", "");
            String encryptedContent = Files.readString(Paths.get(encryptedFile));
            String decryptedContent = encryptionService.decrypt(encryptedContent);
            Files.writeString(Paths.get(decryptedFile), decryptedContent);
            return decryptedFile;
        } catch (Exception e) {
            throw new RuntimeException("备份解密失败", e);
        }
    }
    
    private Path decompressBackup(String compressedFile) throws IOException {
        Path extractDir = Paths.get(backupPath, "restore_" + System.currentTimeMillis());
        Files.createDirectories(extractDir);
        
        try (FileInputStream fis = new FileInputStream(compressedFile);
             GZIPInputStream gzis = new GZIPInputStream(fis)) {
            
            decompressToDirectory(gzis, extractDir);
        }
        
        return extractDir;
    }
    
    private void restoreDatabase(Path extractDir) throws SQLException, IOException {
        Path sqlFile = extractDir.resolve("database.sql");
        if (!Files.exists(sqlFile)) {
            return;
        }
        
        String sql = Files.readString(sqlFile);
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            
            // 执行SQL脚本
            String[] statements = sql.split(";\n");
            for (String statement : statements) {
                if (StringUtils.hasText(statement.trim())) {
                    stmt.execute(statement.trim());
                }
            }
        }
    }
    
    private void restoreFiles(Path extractDir) throws IOException {
        Path filesDir = extractDir.resolve("files");
        if (!Files.exists(filesDir)) {
            return;
        }
        
        // 恢复文件到原始位置
        Path uploadsDir = filesDir.resolve("uploads");
        if (Files.exists(uploadsDir)) {
            copyDirectory(uploadsDir, Paths.get("uploads"));
        }
    }
    
    // 数据库相关辅助方法
    private List<String> getDatabaseTables(Connection conn) throws SQLException {
        List<String> tables = new ArrayList<>();
        DatabaseMetaData metaData = conn.getMetaData();
        try (ResultSet rs = metaData.getTables(null, null, "%", new String[]{"TABLE"})) {
            while (rs.next()) {
                tables.add(rs.getString("TABLE_NAME"));
            }
        }
        return tables;
    }
    
    private String getCreateTableStatement(Connection conn, String tableName) throws SQLException {
        // 这里需要根据具体数据库实现
        // 示例返回简单的CREATE TABLE语句
        return "CREATE TABLE IF NOT EXISTS " + tableName + " ();\n";
    }
    
    private void exportTableData(Connection conn, String tableName, FileWriter writer, BackupType type, BackupInfo baseBackup) throws SQLException, IOException {
        String sql = "SELECT * FROM " + tableName;
        
        // 如果是增量备份，添加时间条件
        if (type == BackupType.INCREMENTAL && baseBackup != null) {
            sql += " WHERE updated_at > '" + baseBackup.getStartTime() + "'";
        }
        
        try (PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            
            ResultSetMetaData metaData = rs.getMetaData();
            int columnCount = metaData.getColumnCount();
            
            while (rs.next()) {
                StringBuilder insertSql = new StringBuilder("INSERT INTO " + tableName + " VALUES (");
                for (int i = 1; i <= columnCount; i++) {
                    if (i > 1) insertSql.append(", ");
                    Object value = rs.getObject(i);
                    if (value == null) {
                        insertSql.append("NULL");
                    } else if (value instanceof String) {
                        insertSql.append("'").append(value.toString().replace("'", "''")).append("'");
                    } else {
                        insertSql.append(value.toString());
                    }
                }
                insertSql.append(");\n");
                writer.write(insertSql.toString());
            }
        }
    }
    
    private boolean shouldBackupTable(String tableName, BackupInfo baseBackup) {
        // 根据业务逻辑判断是否需要备份该表
        // 示例：系统表不需要增量备份
        return !tableName.startsWith("sys_");
    }
    
    // 文件操作辅助方法
    private void copyDirectory(Path source, Path target) throws IOException {
        Files.walk(source).forEach(sourcePath -> {
            try {
                Path targetPath = target.resolve(source.relativize(sourcePath));
                if (Files.isDirectory(sourcePath)) {
                    Files.createDirectories(targetPath);
                } else {
                    Files.copy(sourcePath, targetPath, StandardCopyOption.REPLACE_EXISTING);
                }
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });
    }
    
    private void deleteDirectory(Path directory) throws IOException {
        if (Files.exists(directory)) {
            Files.walk(directory)
                .sorted(Comparator.reverseOrder())
                .map(Path::toFile)
                .forEach(File::delete);
        }
    }
    
    private void compressDirectory(Path directory, GZIPOutputStream gzos) throws IOException {
        // 简化实现，实际应该使用tar格式
        Files.walk(directory).forEach(path -> {
            try {
                if (Files.isRegularFile(path)) {
                    byte[] data = Files.readAllBytes(path);
                    gzos.write(data);
                }
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });
    }
    
    private void decompressToDirectory(GZIPInputStream gzis, Path extractDir) throws IOException {
        // 简化实现，实际应该处理tar格式
        byte[] buffer = new byte[1024];
        int len;
        try (FileOutputStream fos = new FileOutputStream(extractDir.resolve("data").toFile())) {
            while ((len = gzis.read(buffer)) != -1) {
                fos.write(buffer, 0, len);
            }
        }
    }
}