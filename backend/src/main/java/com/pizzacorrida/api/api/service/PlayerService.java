package com.pizzacorrida.api.api.service;

import com.pizzacorrida.api.api.dao.IMatchDAO;
import com.pizzacorrida.api.api.dao.IPlayerDAO;
import com.pizzacorrida.api.api.domain.PlayerDomain;
import com.pizzacorrida.api.api.dto.players.AddPlayerDTO;
import com.pizzacorrida.api.api.dto.players.PlayerDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PlayerService {

    private final IMatchDAO matchDAO;
    private final IPlayerDAO playerDAO;

    public PlayerDTO agregar(UUID matchId, AddPlayerDTO dto) {
        var match = matchDAO.findById(matchId).orElseThrow();
        PlayerDomain player = new PlayerDomain();
        player.setName(dto.getName());
        player.setMatch(match);
        return toDTO(playerDAO.save(player));
    }

    public PlayerDTO sumarPorcion(UUID matchId, UUID playerId) {
        PlayerDomain player = playerDAO.findById(playerId).orElseThrow();
        player.setSlices(player.getSlices() + 1);
        return toDTO(playerDAO.save(player));
    }

    public PlayerDTO restarPorcion(UUID matchId, UUID playerId) {
        PlayerDomain player = playerDAO.findById(playerId).orElseThrow();
        player.setSlices(Math.max(0, player.getSlices() - 1));
        return toDTO(playerDAO.save(player));
    }

    private PlayerDTO toDTO(PlayerDomain p) {
        PlayerDTO dto = new PlayerDTO();
        dto.setId(p.getId());
        dto.setName(p.getName());
        dto.setSlices(p.getSlices());
        return dto;
    }
}
