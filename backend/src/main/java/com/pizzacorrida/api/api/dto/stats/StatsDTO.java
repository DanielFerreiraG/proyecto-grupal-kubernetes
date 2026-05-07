package com.pizzacorrida.api.api.dto.stats;

import com.pizzacorrida.api.api.dto.players.PlayerDTO;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class StatsDTO {
    private UUID matchId;
    private int totalSlices;
    private double averageSlices;
    private PlayerDTO leader;
    private List<RankingEntryDTO> ranking;
}
