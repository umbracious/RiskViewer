package com.satyam.riskviewer_backend.controller;

import com.satyam.riskviewer_backend.service.PerformanceMonitoringService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Performance Monitoring Controller
 * Provides endpoints for monitoring application performance and health
 */
@RestController
@RequestMapping("/api/monitoring")
public class PerformanceMonitoringController {
    
    @Autowired
    private PerformanceMonitoringService performanceMonitoringService;
    
    /**
     * Get current system metrics
     */
    @GetMapping("/metrics")
    public ResponseEntity<PerformanceMonitoringService.SystemMetrics> getSystemMetrics() {
        performanceMonitoringService.recordRequest("metrics");
        
        try {
            PerformanceMonitoringService.SystemMetrics metrics = 
                performanceMonitoringService.getCurrentMetrics();
            return ResponseEntity.ok(metrics);
        } catch (Exception e) {
            performanceMonitoringService.recordError("metrics", "SystemMetricsError");
            throw e;
        }
    }
    
    /**
     * Get application health status
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getHealthStatus() {
        performanceMonitoringService.recordRequest("health");
        
        try {
            Map<String, Object> health = new HashMap<>();
            PerformanceMonitoringService.SystemMetrics metrics = 
                performanceMonitoringService.getCurrentMetrics();
            
            health.put("status", "UP");
            health.put("timestamp", System.currentTimeMillis());
            health.put("memoryUsage", metrics.getMemoryUsagePercentage());
            health.put("activeConnections", metrics.getActiveConnections());
            health.put("errorRate", metrics.getErrorRate());
            
            // Determine overall health
            String overallHealth = "HEALTHY";
            if (metrics.getMemoryUsagePercentage() > 90) {
                overallHealth = "WARNING";
            }
            if (metrics.getErrorRate() > 5) {
                overallHealth = "CRITICAL";
            }
            
            health.put("overallHealth", overallHealth);
            
            return ResponseEntity.ok(health);
        } catch (Exception e) {
            performanceMonitoringService.recordError("health", "HealthCheckError");
            
            Map<String, Object> errorHealth = new HashMap<>();
            errorHealth.put("status", "DOWN");
            errorHealth.put("error", e.getMessage());
            return ResponseEntity.status(503).body(errorHealth);
        }
    }
    
    /**
     * Get performance dashboard data
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getPerformanceDashboard() {
        performanceMonitoringService.recordRequest("dashboard");
        
        try {
            Map<String, Object> dashboard = new HashMap<>();
            PerformanceMonitoringService.SystemMetrics metrics = 
                performanceMonitoringService.getCurrentMetrics();
            
            // System information
            Runtime runtime = Runtime.getRuntime();
            int availableProcessors = runtime.availableProcessors();
            
            dashboard.put("systemInfo", Map.of(
                "availableProcessors", availableProcessors,
                "maxMemoryMB", metrics.getMaxMemory() / (1024 * 1024),
                "usedMemoryMB", metrics.getUsedMemory() / (1024 * 1024),
                "memoryUsagePercent", Math.round(metrics.getMemoryUsagePercentage() * 100.0) / 100.0
            ));
            
            // Application metrics
            dashboard.put("applicationMetrics", Map.of(
                "totalRequests", metrics.getTotalRequests(),
                "totalErrors", metrics.getTotalErrors(),
                "errorRate", Math.round(metrics.getErrorRate() * 100.0) / 100.0,
                "activeConnections", metrics.getActiveConnections()
            ));
            
            // Risk calculation performance (simulated)
            dashboard.put("riskMetrics", Map.of(
                "avgVaRCalculationTime", "45ms",
                "avgMonteCarloTime", "230ms",
                "avgStressTestTime", "180ms",
                "calculationsPerHour", 1247
            ));
            
            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            performanceMonitoringService.recordError("dashboard", "DashboardError");
            throw e;
        }
    }
}
