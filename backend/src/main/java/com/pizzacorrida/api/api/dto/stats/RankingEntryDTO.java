package com.pizzacorrida.api.api.dto.stats;

import lombok.Data;

import java.util.UUID;

@Data
public class RankingEntryDTO {
    private UUID playerId;
    private String name;
    private int slices;
    private int percentage;
}
