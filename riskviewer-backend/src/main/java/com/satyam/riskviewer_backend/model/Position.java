package com.satyam.riskviewer_backend.model;

import java.math.BigDecimal;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "positions")
public class Position {

    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Long id;

    @Column(name = "symbol")
    private String symbol;

    @Column(name = "type")
    private String type;

    @Column(name = "quantity")
    private BigDecimal quantity;

    @Column(name = "purchase_price")
    private BigDecimal purchasePrice; 
    
    @Column(name = "portfolio_id", updatable = false)
    private Long portfolioId;

    @Column(name = "created_at", updatable = false)
    @org.hibernate.annotations.CreationTimestamp
    private java.time.LocalDateTime createdAt;

    public Position(String symbol, String type, BigDecimal quantity, BigDecimal purchasePrice, Long portfolioId) {
        this.symbol = symbol;
        this.type = type;
        this.quantity = quantity;
        this.purchasePrice = purchasePrice;
        this.portfolioId = portfolioId;
    }

    public Position() {
        // Default constructor for JPA
    }

    public Long getId() {
        return id;
    }

    public String getSymbol() {
        return symbol;
    }

    public String getType() {
        return type;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getPurchasePrice() {
        return purchasePrice;
    }

    public void setPurchasePrice(BigDecimal purchasePrice) {
        this.purchasePrice = purchasePrice;
    }

    public Long getPortfolioId() {
        return portfolioId;
    }

    public java.time.LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
