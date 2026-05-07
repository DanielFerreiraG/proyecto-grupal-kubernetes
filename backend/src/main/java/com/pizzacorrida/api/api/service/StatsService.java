package com.pizzacorrida.api.api.service;

import com.pizzacorrida.api.api.dao.IMatchDAO;
import com.pizzacorrida.api.api.domain.PlayerDomain;
import com.pizzacorrida.api.api.dto.players.PlayerDTO;
import com.pizzacorrida.api.api.dto.stats.RankingEntryDTO;
import com.pizzacorrida.api.api.dto.stats.StatsDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final IMatchDAO matchDAO;

    public StatsDTO obtener(UUID matchId) {
        var match = matchDAO.findById(matchId).orElseThrow();
        List<PlayerDomain> players = match.getPlayers();

        int total = players.stream().mapToInt(PlayerDomain::getSlices).sum();
        double average = players.isEmpty() ? 0 : (double) total / players.size();

        PlayerDomain leaderDomain = players.stream()
                .max(Comparator.comparingInt(PlayerDomain::getSlices))
                .orElse(null);

        PlayerDTO leader = leaderDomain != null ? toPlayerDTO(leaderDomain) : null;

        List<RankingEntryDTO> ranking = players.stream()
                .sorted(Comparator.comparingInt(PlayerDomain::getSlices).reversed())
                .map(p -> {
                    RankingEntryDTO entry = new RankingEntryDTO();
                    entry.setPlayerId(p.getId());
                    entry.setName(p.getName());
                    entry.setSlices(p.getSlices());
                    entry.setPercentage(total == 0 ? 0 : (int) Math.round((double) p.getSlices() / total * 100));
                    return entry;
                })
                .collect(Collectors.toList());

        StatsDTO stats = new StatsDTO();
        stats.setMatchId(match.getId());
        stats.setTotalSlices(total);
        stats.setAverageSlices(average);
        stats.setLeader(leader);
        stats.setRanking(ranking);
        return stats;
    }

    private PlayerDTO toPlayerDTO(PlayerDomain p) {
        PlayerDTO dto = new PlayerDTO();
        dto.setId(p.getId());
        dto.setName(p.getName());
        dto.setSlices(p.getSlices());
        return dto;
    }
}
