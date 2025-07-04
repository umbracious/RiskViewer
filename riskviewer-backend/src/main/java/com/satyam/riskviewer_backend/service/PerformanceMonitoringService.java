package com.satyam.riskviewer_backend.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * Performance Monitoring Service for RiskViewer
 * Provides metrics collection and monitoring capabilities
 */
@Service
public class PerformanceMonitoringService {
    
    private static final Logger logger = LoggerFactory.getLogger(PerformanceMonitoringService.class);
    
    private final MeterRegistry meterRegistry;
    private final Counter requestCounter;
    private final Counter errorCounter;
    private final AtomicInteger activeConnections;
    
    public PerformanceMonitoringService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        
        // Initialize counters and timers
        this.requestCounter = Counter.builder("riskviewer.requests.total")
                .description("Total number of requests")
                .tag("application", "riskviewer")
                .register(meterRegistry);
                
        this.errorCounter = Counter.builder("riskviewer.errors.total")
                .description("Total number of errors")
                .tag("application", "riskviewer")
                .register(meterRegistry);
                
        this.activeConnections = meterRegistry.gauge("riskviewer.connections.active", 
                new AtomicInteger(0));
    }
    
    /**
     * Record a successful request
     */
    public void recordRequest(String endpoint) {
        requestCounter.increment();
        logger.debug("Request recorded for endpoint: {}", endpoint);
    }
    
    /**
     * Record an error
     */
    public void recordError(String endpoint, String errorType) {
        errorCounter.increment();
        logger.warn("Error recorded for endpoint: {}, type: {}", endpoint, errorType);
    }
    
    /**
     * Time a request execution
     */
    public Timer.Sample startTimer() {
        return Timer.start(meterRegistry);
    }
    
    /**
     * Stop timing and record the duration
     */
    public void stopTimer(Timer.Sample sample, String operation) {
        sample.stop(Timer.builder("riskviewer.operation.duration")
                .description("Operation execution time")
                .tag("operation", operation)
                .register(meterRegistry));
    }
    
    /**
     * Record active connection count
     */
    public void incrementActiveConnections() {
        activeConnections.incrementAndGet();
    }
    
    /**
     * Decrement active connection count
     */
    public void decrementActiveConnections() {
        activeConnections.decrementAndGet();
    }
    
    /**
     * Record portfolio risk calculation metrics
     */
    public void recordRiskCalculation(String calculationType, long executionTimeMs) {
        Timer.builder("riskviewer.risk.calculation.duration")
                .description("Risk calculation execution time")
                .tag("calculation_type", calculationType)
                .register(meterRegistry)
                .record(executionTimeMs, java.util.concurrent.TimeUnit.MILLISECONDS);
                
        logger.info("Risk calculation completed: {} in {}ms", calculationType, executionTimeMs);
    }
    
    /**
     * Record database operation metrics
     */
    public void recordDatabaseOperation(String operation, long executionTimeMs) {
        Timer.builder("riskviewer.database.operation.duration")
                .description("Database operation execution time")
                .tag("operation", operation)
                .register(meterRegistry)
                .record(executionTimeMs, java.util.concurrent.TimeUnit.MILLISECONDS);
    }
    
    /**
     * Record cache metrics
     */
    public void recordCacheHit(String cacheName) {
        Counter.builder("riskviewer.cache.hits")
                .description("Cache hit count")
                .tag("cache", cacheName)
                .register(meterRegistry)
                .increment();
    }
    
    /**
     * Record cache miss
     */
    public void recordCacheMiss(String cacheName) {
        Counter.builder("riskviewer.cache.misses")
                .description("Cache miss count")
                .tag("cache", cacheName)
                .register(meterRegistry)
                .increment();
    }
    
    /**
     * Get current system metrics
     */
    public SystemMetrics getCurrentMetrics() {
        Runtime runtime = Runtime.getRuntime();
        long maxMemory = runtime.maxMemory();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;
        
        return new SystemMetrics(
                usedMemory,
                maxMemory,
                activeConnections.get(),
                requestCounter.count(),
                errorCounter.count()
        );
    }
    
    /**
     * System metrics data class
     */
    public static class SystemMetrics {
        private final long usedMemory;
        private final long maxMemory;
        private final int activeConnections;
        private final double totalRequests;
        private final double totalErrors;
        
        public SystemMetrics(long usedMemory, long maxMemory, int activeConnections, 
                           double totalRequests, double totalErrors) {
            this.usedMemory = usedMemory;
            this.maxMemory = maxMemory;
            this.activeConnections = activeConnections;
            this.totalRequests = totalRequests;
            this.totalErrors = totalErrors;
        }
        
        // Getters
        public long getUsedMemory() { return usedMemory; }
        public long getMaxMemory() { return maxMemory; }
        public int getActiveConnections() { return activeConnections; }
        public double getTotalRequests() { return totalRequests; }
        public double getTotalErrors() { return totalErrors; }
        public double getMemoryUsagePercentage() { 
            return maxMemory > 0 ? (double) usedMemory / maxMemory * 100 : 0; 
        }
        public double getErrorRate() { 
            return totalRequests > 0 ? totalErrors / totalRequests * 100 : 0; 
        }
    }
}
