package com.satyam.riskviewer_backend.repository;

import com.satyam.riskviewer_backend.model.StructuredProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StructuredProductRepository extends JpaRepository<StructuredProduct, Long> {
    
    // Find by portfolio
    List<StructuredProduct> findByPortfolioId(Long portfolioId);
    
    // Find by product type
    List<StructuredProduct> findByProductType(String productType);
    
    // Find by underlying asset
    List<StructuredProduct> findByUnderlyingAsset(String underlyingAsset);
    
    // Find by risk status
    List<StructuredProduct> findByRiskStatus(String riskStatus);
    
    // Find products near maturity (within days)
    @Query("SELECT sp FROM StructuredProduct sp WHERE sp.maturityDate <= CURRENT_TIMESTAMP + :days DAY")
    List<StructuredProduct> findProductsNearMaturity(@Param("days") int days);
    
    // Find products with high gamma (> threshold)
    @Query("SELECT sp FROM StructuredProduct sp WHERE ABS(sp.gamma) > :threshold")
    List<StructuredProduct> findHighGammaProducts(@Param("threshold") double threshold);
    
    // Find products near barrier
    @Query("SELECT sp FROM StructuredProduct sp WHERE sp.barrierLevel IS NOT NULL AND " +
           "(sp.currentPrice / sp.barrierLevel) < :proximity")
    List<StructuredProduct> findProductsNearBarrier(@Param("proximity") double proximity);
    
    // Get portfolio structured product exposure
    @Query("SELECT SUM(sp.notionalAmount) FROM StructuredProduct sp WHERE sp.portfolioId = :portfolioId")
    Double getTotalNotionalByPortfolio(@Param("portfolioId") Long portfolioId);
}
