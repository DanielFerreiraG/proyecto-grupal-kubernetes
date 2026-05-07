package com.pizzacorrida.api.api.dto.matches;

import com.pizzacorrida.api.api.dto.players.PlayerDTO;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class MatchDTO {
    private UUID id;
    private String name;
    private String status;
    private LocalDateTime createdAt;
    private List<PlayerDTO> players;
}
