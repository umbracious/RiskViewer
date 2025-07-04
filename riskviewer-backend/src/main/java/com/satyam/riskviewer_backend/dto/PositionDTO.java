package com.satyam.riskviewer_backend.dto;

public record PositionDTO(String symbol, String type, Float quantity, Float market_value) {}