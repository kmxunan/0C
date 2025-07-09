package com.zerocarbon.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.NoHandlerFoundException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 全局异常处理器
 * 统一处理应用程序中的各种异常
 * 
 * @author Zero Carbon Team
 * @version 1.0.0
 * @since 2025
 */
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    /**
     * 处理业务异常
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Map<String, Object>> handleBusinessException(BusinessException e, HttpServletRequest request) {
        logger.warn("业务异常: {}, 请求路径: {}", e.getMessage(), request.getRequestURI());
        
        Map<String, Object> errorResponse = createErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Business Error",
                e.getMessage(),
                request.getRequestURI(),
                e.getCode()
        );
        
        return ResponseEntity.badRequest().body(errorResponse);
    }
    
    /**
     * 处理认证异常
     */
    @ExceptionHandler({AuthenticationException.class, BadCredentialsException.class})
    public ResponseEntity<Map<String, Object>> handleAuthenticationException(AuthenticationException e, HttpServletRequest request) {
        logger.warn("认证异常: {}, 请求路径: {}", e.getMessage(), request.getRequestURI());
        
        Map<String, Object> errorResponse = createErrorResponse(
                HttpStatus.UNAUTHORIZED.value(),
                "Authentication Failed",
                "认证失败，请检查用户名和密码",
                request.getRequestURI(),
                "AUTH_FAILED"
        );
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
    }
    
    /**
     * 处理权限不足异常
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDeniedException(AccessDeniedException e, HttpServletRequest request) {
        logger.warn("权限不足异常: {}, 请求路径: {}", e.getMessage(), request.getRequestURI());
        
        Map<String, Object> errorResponse = createErrorResponse(
                HttpStatus.FORBIDDEN.value(),
                "Access Denied",
                "权限不足，无法访问此资源",
                request.getRequestURI(),
                "ACCESS_DENIED"
        );
        
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
    }
    
    /**
     * 处理参数验证异常
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException e, HttpServletRequest request) {
        logger.warn("参数验证异常: {}, 请求路径: {}", e.getMessage(), request.getRequestURI());
        
        Map<String, String> fieldErrors = new HashMap<>();
        e.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            fieldErrors.put(fieldName, errorMessage);
        });
        
        Map<String, Object> errorResponse = createErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Validation Failed",
                "参数验证失败",
                request.getRequestURI(),
                "VALIDATION_FAILED"
        );
        errorResponse.put("fieldErrors", fieldErrors);
        
        return ResponseEntity.badRequest().body(errorResponse);
    }
    
    /**
     * 处理绑定异常
     */
    @ExceptionHandler(BindException.class)
    public ResponseEntity<Map<String, Object>> handleBindException(BindException e, HttpServletRequest request) {
        logger.warn("绑定异常: {}, 请求路径: {}", e.getMessage(), request.getRequestURI());
        
        Map<String, String> fieldErrors = new HashMap<>();
        e.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            fieldErrors.put(fieldName, errorMessage);
        });
        
        Map<String, Object> errorResponse = createErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Bind Failed",
                "参数绑定失败",
                request.getRequestURI(),
                "BIND_FAILED"
        );
        errorResponse.put("fieldErrors", fieldErrors);
        
        return ResponseEntity.badRequest().body(errorResponse);
    }
    
    /**
     * 处理约束违反异常
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolationException(ConstraintViolationException e, HttpServletRequest request) {
        logger.warn("约束违反异常: {}, 请求路径: {}", e.getMessage(), request.getRequestURI());
        
        Set<ConstraintViolation<?>> violations = e.getConstraintViolations();
        Map<String, String> fieldErrors = violations.stream()
                .collect(Collectors.toMap(
                        violation -> violation.getPropertyPath().toString(),
                        ConstraintViolation::getMessage,
                        (existing, replacement) -> existing
                ));
        
        Map<String, Object> errorResponse = createErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Constraint Violation",
                "约束验证失败",
                request.getRequestURI(),
                "CONSTRAINT_VIOLATION"
        );
        errorResponse.put("fieldErrors", fieldErrors);
        
        return ResponseEntity.badRequest().body(errorResponse);
    }
    
    /**
     * 处理缺少请求参数异常
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, Object>> handleMissingParameterException(MissingServletRequestParameterException e, HttpServletRequest request) {
        logger.warn("缺少请求参数异常: {}, 请求路径: {}", e.getMessage(), request.getRequestURI());
        
        Map<String, Object> errorResponse = createErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Missing Parameter",
                String.format("缺少必需的请求参数: %s", e.getParameterName()),
                request.getRequestURI(),
                "MISSING_PARAMETER"
        );
        errorResponse.put("parameterName", e.getParameterName());
        errorResponse.put("parameterType", e.getParameterType());
        
        return ResponseEntity.badRequest().body(errorResponse);
    }
    
    /**
     * 处理方法参数类型不匹配异常
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatchException(MethodArgumentTypeMismatchException e, HttpServletRequest request) {
        logger.warn("方法参数类型不匹配异常: {}, 请求路径: {}", e.getMessage(), request.getRequestURI());
        
        Map<String, Object> errorResponse = createErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Type Mismatch",
                String.format("参数类型不匹配: %s", e.getName()),
                request.getRequestURI(),
                "TYPE_MISMATCH"
        );
        errorResponse.put("parameterName", e.getName());
        errorResponse.put("expectedType", e.getRequiredType() != null ? e.getRequiredType().getSimpleName() : "unknown");
        errorResponse.put("actualValue", e.getValue());
        
        return ResponseEntity.badRequest().body(errorResponse);
    }
    
    /**
     * 处理HTTP请求方法不支持异常
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleMethodNotSupportedException(HttpRequestMethodNotSupportedException e, HttpServletRequest request) {
        logger.warn("HTTP请求方法不支持异常: {}, 请求路径: {}", e.getMessage(), request.getRequestURI());
        
        Map<String, Object> errorResponse = createErrorResponse(
                HttpStatus.METHOD_NOT_ALLOWED.value(),
                "Method Not Allowed",
                String.format("不支持的HTTP方法: %s", e.getMethod()),
                request.getRequestURI(),
                "METHOD_NOT_ALLOWED"
        );
        errorResponse.put("supportedMethods", e.getSupportedMethods());
        
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(errorResponse);
    }
    
    /**
     * 处理找不到处理器异常
     */
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNoHandlerFoundException(NoHandlerFoundException e, HttpServletRequest request) {
        logger.warn("找不到处理器异常: {}, 请求路径: {}", e.getMessage(), request.getRequestURI());
        
        Map<String, Object> errorResponse = createErrorResponse(
                HttpStatus.NOT_FOUND.value(),
                "Not Found",
                "请求的资源不存在",
                request.getRequestURI(),
                "NOT_FOUND"
        );
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }
    
    /**
     * 处理文件上传大小超限异常
     */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleMaxUploadSizeExceededException(MaxUploadSizeExceededException e, HttpServletRequest request) {
        logger.warn("文件上传大小超限异常: {}, 请求路径: {}", e.getMessage(), request.getRequestURI());
        
        Map<String, Object> errorResponse = createErrorResponse(
                HttpStatus.PAYLOAD_TOO_LARGE.value(),
                "File Too Large",
                "上传文件大小超过限制",
                request.getRequestURI(),
                "FILE_TOO_LARGE"
        );
        errorResponse.put("maxUploadSize", e.getMaxUploadSize());
        
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(errorResponse);
    }
    
    /**
     * 处理数据完整性违反异常
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolationException(DataIntegrityViolationException e, HttpServletRequest request) {
        logger.error("数据完整性违反异常: {}, 请求路径: {}", e.getMessage(), request.getRequestURI());
        
        String message = "数据操作失败";
        String code = "DATA_INTEGRITY_VIOLATION";
        
        // 根据异常信息提供更具体的错误描述
        if (e.getMessage() != null) {
            if (e.getMessage().contains("Duplicate entry")) {
                message = "数据重复，违反唯一性约束";
                code = "DUPLICATE_ENTRY";
            } else if (e.getMessage().contains("foreign key constraint")) {
                message = "外键约束违反，相关数据不存在";
                code = "FOREIGN_KEY_VIOLATION";
            } else if (e.getMessage().contains("cannot be null")) {
                message = "必填字段不能为空";
                code = "NULL_VALUE_NOT_ALLOWED";
            }
        }
        
        Map<String, Object> errorResponse = createErrorResponse(
                HttpStatus.CONFLICT.value(),
                "Data Integrity Violation",
                message,
                request.getRequestURI(),
                code
        );
        
        return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
    }
    
    /**
     * 处理其他未捕获的异常
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception e, HttpServletRequest request) {
        logger.error("未捕获的异常: {}, 请求路径: {}", e.getMessage(), request.getRequestURI(), e);
        
        Map<String, Object> errorResponse = createErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal Server Error",
                "服务器内部错误，请稍后重试",
                request.getRequestURI(),
                "INTERNAL_ERROR"
        );
        
        // 在开发环境下提供详细的错误信息
        String activeProfile = System.getProperty("spring.profiles.active", "dev");
        if ("dev".equals(activeProfile)) {
            errorResponse.put("detailMessage", e.getMessage());
            errorResponse.put("exceptionType", e.getClass().getSimpleName());
        }
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
    
    /**
     * 创建标准错误响应
     */
    private Map<String, Object> createErrorResponse(int status, String error, String message, String path, String code) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        errorResponse.put("status", status);
        errorResponse.put("error", error);
        errorResponse.put("message", message);
        errorResponse.put("path", path);
        errorResponse.put("code", code);
        
        // 添加帮助信息
        Map<String, Object> help = new HashMap<>();
        help.put("documentation", "/swagger-ui/");
        help.put("support", "admin@zerocarbon.com");
        errorResponse.put("help", help);
        
        return errorResponse;
    }
}