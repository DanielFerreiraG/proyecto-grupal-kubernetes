package com.pizzacorrida.api.api.dto.matches;

import lombok.Data;

import java.util.List;

@Data
public class CreateMatchDTO {
    private String name;
    private List<String> players;
}
