package com.pizzacorrida.api.api.service;

import com.pizzacorrida.api.api.dao.IMatchDAO;
import com.pizzacorrida.api.api.dao.IPlayerDAO;
import com.pizzacorrida.api.api.domain.MatchDomain;
import com.pizzacorrida.api.api.domain.MatchStatus;
import com.pizzacorrida.api.api.domain.PlayerDomain;
import com.pizzacorrida.api.api.dto.matches.CreateMatchDTO;
import com.pizzacorrida.api.api.dto.matches.MatchDTO;
import com.pizzacorrida.api.api.dto.players.PlayerDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatchService {

    private final IMatchDAO matchDAO;
    private final IPlayerDAO playerDAO;

    public List<MatchDTO> listar() {
        return matchDAO.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public MatchDTO crear(CreateMatchDTO dto) {
        MatchDomain match = new MatchDomain();
        match.setName(dto.getName());
        match = matchDAO.save(match);

        if (dto.getPlayers() != null) {
            for (String name : dto.getPlayers()) {
                PlayerDomain player = new PlayerDomain();
                player.setName(name);
                player.setMatch(match);
                playerDAO.save(player);
            }
        }

        return toDTO(matchDAO.findById(match.getId()).orElseThrow());
    }

    public MatchDTO obtener(UUID matchId) {
        return toDTO(matchDAO.findById(matchId).orElseThrow());
    }

    public MatchDTO finalizar(UUID matchId) {
        MatchDomain match = matchDAO.findById(matchId).orElseThrow();
        match.setStatus(MatchStatus.FINISHED);
        return toDTO(matchDAO.save(match));
    }

    public MatchDTO toDTO(MatchDomain match) {
        MatchDTO dto = new MatchDTO();
        dto.setId(match.getId());
        dto.setName(match.getName());
        dto.setStatus(match.getStatus().name().toLowerCase());
        dto.setCreatedAt(match.getCreatedAt());
        dto.setPlayers(match.getPlayers().stream()
                .map(this::toPlayerDTO)
                .collect(Collectors.toList()));
        return dto;
    }

    private PlayerDTO toPlayerDTO(PlayerDomain p) {
        PlayerDTO dto = new PlayerDTO();
        dto.setId(p.getId());
        dto.setName(p.getName());
        dto.setSlices(p.getSlices());
        return dto;
    }
}
