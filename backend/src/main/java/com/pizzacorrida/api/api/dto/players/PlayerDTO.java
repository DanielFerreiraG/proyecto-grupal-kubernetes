package com.pizzacorrida.api.api.dto.players;

import lombok.Data;

import java.util.UUID;

@Data
public class PlayerDTO {
    private UUID id;
    private String name;
    private int slices;
}
