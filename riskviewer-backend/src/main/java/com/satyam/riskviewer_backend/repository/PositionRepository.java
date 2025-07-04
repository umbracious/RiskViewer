package com.satyam.riskviewer_backend.repository;

import com.satyam.riskviewer_backend.model.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PositionRepository extends JpaRepository<Position, Long> {

    List<Position> findBySymbol(String symbol); // Find positions by symbol

    List<Position> findByPortfolioId(Long portfolioId); // Find positions by portfolio ID

    List<Position> findByType(String type); // Find positions by type (e.g., Equity, Bond)

    List<Position> findBySymbolAndType(String symbol, String type);

}
