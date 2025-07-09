package com.zerocarbon.security.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 数据加密服务
 * 提供敏感数据的加密、解密、哈希等功能
 */
@Service
public class DataEncryptionService {
    
    private static final String AES_ALGORITHM = "AES";
    private static final String AES_TRANSFORMATION = "AES/GCM/NoPadding";
    private static final String HASH_ALGORITHM = "SHA-256";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 16;
    
    @Value("${app.security.encryption.key:defaultEncryptionKey123456}")
    private String encryptionKey;
    
    @Value("${app.security.encryption.salt:defaultSalt}")
    private String encryptionSalt;
    
    // 缓存加密密钥
    private final Map<String, SecretKey> keyCache = new ConcurrentHashMap<>();
    
    // 安全随机数生成器
    private final SecureRandom secureRandom = new SecureRandom();
    
    /**
     * 加密字符串
     */
    public String encrypt(String plainText) {
        return encrypt(plainText, null);
    }
    
    /**
     * 使用指定密钥加密字符串
     */
    public String encrypt(String plainText, String keyId) {
        if (!StringUtils.hasText(plainText)) {
            return plainText;
        }
        
        try {
            SecretKey secretKey = getSecretKey(keyId);
            Cipher cipher = Cipher.getInstance(AES_TRANSFORMATION);
            
            // 生成随机IV
            byte[] iv = new byte[GCM_IV_LENGTH];
            secureRandom.nextBytes(iv);
            
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, gcmSpec);
            
            byte[] encryptedData = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            
            // 将IV和加密数据组合
            byte[] encryptedWithIv = new byte[GCM_IV_LENGTH + encryptedData.length];
            System.arraycopy(iv, 0, encryptedWithIv, 0, GCM_IV_LENGTH);
            System.arraycopy(encryptedData, 0, encryptedWithIv, GCM_IV_LENGTH, encryptedData.length);
            
            return Base64.getEncoder().encodeToString(encryptedWithIv);
        } catch (Exception e) {
            throw new RuntimeException("数据加密失败", e);
        }
    }
    
    /**
     * 解密字符串
     */
    public String decrypt(String encryptedText) {
        return decrypt(encryptedText, null);
    }
    
    /**
     * 使用指定密钥解密字符串
     */
    public String decrypt(String encryptedText, String keyId) {
        if (!StringUtils.hasText(encryptedText)) {
            return encryptedText;
        }
        
        try {
            SecretKey secretKey = getSecretKey(keyId);
            byte[] encryptedWithIv = Base64.getDecoder().decode(encryptedText);
            
            // 提取IV和加密数据
            byte[] iv = new byte[GCM_IV_LENGTH];
            byte[] encryptedData = new byte[encryptedWithIv.length - GCM_IV_LENGTH];
            
            System.arraycopy(encryptedWithIv, 0, iv, 0, GCM_IV_LENGTH);
            System.arraycopy(encryptedWithIv, GCM_IV_LENGTH, encryptedData, 0, encryptedData.length);
            
            Cipher cipher = Cipher.getInstance(AES_TRANSFORMATION);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, gcmSpec);
            
            byte[] decryptedData = cipher.doFinal(encryptedData);
            return new String(decryptedData, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("数据解密失败", e);
        }
    }
    
    /**
     * 计算字符串的哈希值
     */
    public String hash(String input) {
        return hash(input, encryptionSalt);
    }
    
    /**
     * 使用指定盐值计算字符串的哈希值
     */
    public String hash(String input, String salt) {
        if (!StringUtils.hasText(input)) {
            return input;
        }
        
        try {
            MessageDigest digest = MessageDigest.getInstance(HASH_ALGORITHM);
            String saltedInput = input + (salt != null ? salt : "");
            byte[] hashBytes = digest.digest(saltedInput.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hashBytes);
        } catch (Exception e) {
            throw new RuntimeException("数据哈希失败", e);
        }
    }
    
    /**
     * 验证哈希值
     */
    public boolean verifyHash(String input, String hashedValue) {
        return verifyHash(input, hashedValue, encryptionSalt);
    }
    
    /**
     * 使用指定盐值验证哈希值
     */
    public boolean verifyHash(String input, String hashedValue, String salt) {
        if (!StringUtils.hasText(input) || !StringUtils.hasText(hashedValue)) {
            return false;
        }
        
        try {
            String computedHash = hash(input, salt);
            return computedHash.equals(hashedValue);
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * 生成随机密钥
     */
    public String generateKey() {
        try {
            KeyGenerator keyGenerator = KeyGenerator.getInstance(AES_ALGORITHM);
            keyGenerator.init(256);
            SecretKey secretKey = keyGenerator.generateKey();
            return Base64.getEncoder().encodeToString(secretKey.getEncoded());
        } catch (Exception e) {
            throw new RuntimeException("密钥生成失败", e);
        }
    }
    
    /**
     * 生成随机盐值
     */
    public String generateSalt() {
        byte[] salt = new byte[32];
        secureRandom.nextBytes(salt);
        return Base64.getEncoder().encodeToString(salt);
    }
    
    /**
     * 批量加密
     */
    public Map<String, String> encryptBatch(Map<String, String> data) {
        return encryptBatch(data, null);
    }
    
    /**
     * 使用指定密钥批量加密
     */
    public Map<String, String> encryptBatch(Map<String, String> data, String keyId) {
        if (data == null || data.isEmpty()) {
            return new HashMap<>();
        }
        
        Map<String, String> encryptedData = new HashMap<>();
        for (Map.Entry<String, String> entry : data.entrySet()) {
            encryptedData.put(entry.getKey(), encrypt(entry.getValue(), keyId));
        }
        return encryptedData;
    }
    
    /**
     * 批量解密
     */
    public Map<String, String> decryptBatch(Map<String, String> encryptedData) {
        return decryptBatch(encryptedData, null);
    }
    
    /**
     * 使用指定密钥批量解密
     */
    public Map<String, String> decryptBatch(Map<String, String> encryptedData, String keyId) {
        if (encryptedData == null || encryptedData.isEmpty()) {
            return new HashMap<>();
        }
        
        Map<String, String> decryptedData = new HashMap<>();
        for (Map.Entry<String, String> entry : encryptedData.entrySet()) {
            decryptedData.put(entry.getKey(), decrypt(entry.getValue(), keyId));
        }
        return decryptedData;
    }
    
    /**
     * 检查字符串是否已加密
     */
    public boolean isEncrypted(String text) {
        if (!StringUtils.hasText(text)) {
            return false;
        }
        
        try {
            // 尝试Base64解码，如果成功且长度合理，可能是加密数据
            byte[] decoded = Base64.getDecoder().decode(text);
            return decoded.length > GCM_IV_LENGTH;
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * 安全清除敏感字符串
     */
    public void clearSensitiveData(StringBuilder sensitiveData) {
        if (sensitiveData != null) {
            for (int i = 0; i < sensitiveData.length(); i++) {
                sensitiveData.setCharAt(i, '\0');
            }
            sensitiveData.setLength(0);
        }
    }
    
    /**
     * 获取或创建密钥
     */
    private SecretKey getSecretKey(String keyId) {
        String actualKeyId = keyId != null ? keyId : "default";
        
        return keyCache.computeIfAbsent(actualKeyId, id -> {
            try {
                String keyString = keyId != null ? keyId : encryptionKey;
                
                // 如果密钥长度不足，使用哈希扩展
                if (keyString.length() < 32) {
                    MessageDigest digest = MessageDigest.getInstance(HASH_ALGORITHM);
                    byte[] keyBytes = digest.digest(keyString.getBytes(StandardCharsets.UTF_8));
                    return new SecretKeySpec(keyBytes, AES_ALGORITHM);
                } else {
                    // 截取前32字节作为密钥
                    byte[] keyBytes = keyString.substring(0, 32).getBytes(StandardCharsets.UTF_8);
                    return new SecretKeySpec(keyBytes, AES_ALGORITHM);
                }
            } catch (Exception e) {
                throw new RuntimeException("密钥创建失败", e);
            }
        });
    }
    
    /**
     * 清除密钥缓存
     */
    public void clearKeyCache() {
        keyCache.clear();
    }
    
    /**
     * 获取加密算法信息
     */
    public Map<String, String> getEncryptionInfo() {
        Map<String, String> info = new HashMap<>();
        info.put("algorithm", AES_ALGORITHM);
        info.put("transformation", AES_TRANSFORMATION);
        info.put("hashAlgorithm", HASH_ALGORITHM);
        info.put("keyLength", "256");
        info.put("ivLength", String.valueOf(GCM_IV_LENGTH));
        info.put("tagLength", String.valueOf(GCM_TAG_LENGTH));
        return info;
    }
}