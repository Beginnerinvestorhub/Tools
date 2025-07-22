"""
Shared logging configuration for all Python services.
Provides standardized logging setup with JSON formatting and structured output.
"""

import sys
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from loguru import logger
from pathlib import Path


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging."""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "service": getattr(record, 'service', 'unknown'),
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields
        for key, value in record.__dict__.items():
            if key not in ['name', 'msg', 'args', 'levelname', 'levelno', 'pathname', 
                          'filename', 'module', 'lineno', 'funcName', 'created', 
                          'msecs', 'relativeCreated', 'thread', 'threadName', 
                          'processName', 'process', 'exc_info', 'exc_text', 'stack_info']:
                log_entry[key] = value
        
        return json.dumps(log_entry, default=str)


class TextFormatter(logging.Formatter):
    """Enhanced text formatter with colors and structured output."""
    
    COLORS = {
        'DEBUG': '\033[36m',     # Cyan
        'INFO': '\033[32m',      # Green
        'WARNING': '\033[33m',   # Yellow
        'ERROR': '\033[31m',     # Red
        'CRITICAL': '\033[35m',  # Magenta
        'RESET': '\033[0m'       # Reset
    }
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record with colors and structure."""
        color = self.COLORS.get(record.levelname, '')
        reset = self.COLORS['RESET']
        
        timestamp = datetime.fromtimestamp(record.created).strftime('%Y-%m-%d %H:%M:%S')
        service = getattr(record, 'service', 'unknown')
        
        formatted = (
            f"{color}[{timestamp}] {record.levelname:8} "
            f"[{service}] {record.module}:{record.lineno} - "
            f"{record.getMessage()}{reset}"
        )
        
        if record.exc_info:
            formatted += f"\n{self.formatException(record.exc_info)}"
        
        return formatted


def setup_logging(
    service_name: str,
    log_level: str = "INFO",
    log_format: str = "json",
    log_file: Optional[str] = None,
    enable_console: bool = True
) -> None:
    """
    Setup standardized logging configuration for a service.
    
    Args:
        service_name: Name of the service for log identification
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_format: Format type ('json' or 'text')
        log_file: Optional file path for log output
        enable_console: Whether to enable console logging
    """
    
    # Remove default loguru handler
    logger.remove()
    
    # Configure loguru with custom format
    if log_format.lower() == "json":
        log_format_str = (
            "{"
            '"timestamp": "{time:YYYY-MM-DDTHH:mm:ss.SSSZ}", '
            '"level": "{level}", '
            '"service": "' + service_name + '", '
            '"message": "{message}", '
            '"module": "{module}", '
            '"function": "{function}", '
            '"line": {line}'
            "}"
        )
    else:
        log_format_str = (
            "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
            "<level>{level: <8}</level> | "
            f"<cyan>{service_name}</cyan> | "
            "<cyan>{module}</cyan>:<cyan>{line}</cyan> - "
            "<level>{message}</level>"
        )
    
    # Add console handler if enabled
    if enable_console:
        logger.add(
            sys.stdout,
            format=log_format_str,
            level=log_level.upper(),
            colorize=(log_format.lower() == "text"),
            serialize=(log_format.lower() == "json")
        )
    
    # Add file handler if specified
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        
        logger.add(
            log_file,
            format=log_format_str,
            level=log_level.upper(),
            rotation="100 MB",
            retention="30 days",
            compression="gz",
            serialize=(log_format.lower() == "json")
        )
    
    # Configure standard library logging to use loguru
    class InterceptHandler(logging.Handler):
        def emit(self, record):
            # Get corresponding Loguru level if it exists
            try:
                level = logger.level(record.levelname).name
            except ValueError:
                level = record.levelno
            
            # Find caller from where originated the logged message
            frame, depth = logging.currentframe(), 2
            while frame.f_code.co_filename == logging.__file__:
                frame = frame.f_back
                depth += 1
            
            logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())
    
    # Replace standard logging handlers
    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)
    
    # Set specific loggers
    for logger_name in ["uvicorn", "uvicorn.error", "uvicorn.access", "fastapi"]:
        logging.getLogger(logger_name).handlers = [InterceptHandler()]


def get_logger(name: str = None) -> Any:
    """
    Get a logger instance with optional name binding.
    
    Args:
        name: Optional name to bind to the logger
        
    Returns:
        Configured logger instance
    """
    if name:
        return logger.bind(module=name)
    return logger


def log_request(
    method: str,
    url: str,
    status_code: int,
    duration_ms: float,
    user_id: Optional[str] = None,
    **extra_fields
) -> None:
    """
    Log HTTP request with standardized format.
    
    Args:
        method: HTTP method
        url: Request URL
        status_code: HTTP status code
        duration_ms: Request duration in milliseconds
        user_id: Optional user ID
        **extra_fields: Additional fields to log
    """
    logger.info(
        "HTTP Request",
        method=method,
        url=url,
        status_code=status_code,
        duration_ms=round(duration_ms, 2),
        user_id=user_id,
        **extra_fields
    )


def log_error(
    error: Exception,
    context: str,
    user_id: Optional[str] = None,
    **extra_fields
) -> None:
    """
    Log error with standardized format and context.
    
    Args:
        error: Exception that occurred
        context: Context where error occurred
        user_id: Optional user ID
        **extra_fields: Additional fields to log
    """
    logger.error(
        f"Error in {context}: {str(error)}",
        error_type=type(error).__name__,
        error_message=str(error),
        context=context,
        user_id=user_id,
        **extra_fields
    )


def log_performance(
    operation: str,
    duration_ms: float,
    success: bool = True,
    **extra_fields
) -> None:
    """
    Log performance metrics for operations.
    
    Args:
        operation: Name of the operation
        duration_ms: Duration in milliseconds
        success: Whether operation was successful
        **extra_fields: Additional fields to log
    """
    level = "info" if success else "warning"
    getattr(logger, level)(
        f"Performance: {operation}",
        operation=operation,
        duration_ms=round(duration_ms, 2),
        success=success,
        **extra_fields
    )


def log_business_event(
    event_type: str,
    event_data: Dict[str, Any],
    user_id: Optional[str] = None
) -> None:
    """
    Log business events for analytics and monitoring.
    
    Args:
        event_type: Type of business event
        event_data: Event data dictionary
        user_id: Optional user ID
    """
    logger.info(
        f"Business Event: {event_type}",
        event_type=event_type,
        event_data=event_data,
        user_id=user_id,
        category="business_event"
    )


# ==============================================================================
# MIDDLEWARE FOR FASTAPI REQUEST LOGGING
# ==============================================================================

import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class LoggingMiddleware(BaseHTTPMiddleware):
    """FastAPI middleware for automatic request/response logging."""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Log request
        logger.info(
            "Request started",
            method=request.method,
            url=str(request.url),
            client_ip=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
        
        # Process request
        try:
            response = await call_next(request)
            duration_ms = (time.time() - start_time) * 1000
            
            # Log response
            log_request(
                method=request.method,
                url=str(request.url),
                status_code=response.status_code,
                duration_ms=duration_ms,
                client_ip=request.client.host if request.client else None,
            )
            
            return response
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            
            # Log error
            log_error(
                error=e,
                context="request_processing",
                method=request.method,
                url=str(request.url),
                duration_ms=duration_ms,
            )
            raise


# ==============================================================================
# USAGE EXAMPLES
# ==============================================================================

if __name__ == "__main__":
    # Example usage
    setup_logging(
        service_name="example-service",
        log_level="INFO",
        log_format="json",
        log_file="logs/service.log"
    )
    
    logger = get_logger("example_module")
    
    logger.info("Service started successfully")
    logger.warning("This is a warning message")
    
    try:
        raise ValueError("Example error")
    except Exception as e:
        log_error(e, "example_operation", user_id="user123")
    
    log_performance("database_query", 45.2, success=True, query_type="SELECT")
    log_business_event("user_registration", {"email": "user@example.com"}, user_id="user123")
