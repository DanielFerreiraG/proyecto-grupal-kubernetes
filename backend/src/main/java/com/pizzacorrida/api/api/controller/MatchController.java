package com.pizzacorrida.api.api.controller;

import com.pizzacorrida.api.api.dto.matches.CreateMatchDTO;
import com.pizzacorrida.api.api.dto.matches.MatchDTO;
import com.pizzacorrida.api.api.dto.players.AddPlayerDTO;
import com.pizzacorrida.api.api.dto.players.PlayerDTO;
import com.pizzacorrida.api.api.dto.stats.StatsDTO;
import com.pizzacorrida.api.api.service.MatchService;
import com.pizzacorrida.api.api.service.PlayerService;
import com.pizzacorrida.api.api.service.StatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/matches")
@RequiredArgsConstructor
@Tag(name = "Pizza Corrida", description = "Partidas, jugadores y estadísticas")
public class MatchController {

    private final MatchService matchService;
    private final PlayerService playerService;
    private final StatsService statsService;

    @Operation(summary = "Listar partidas")
    @GetMapping
    public ResponseEntity<List<MatchDTO>> listar() {
        return ResponseEntity.ok(matchService.listar());
    }

    @Operation(summary = "Crear partida")
    @PostMapping
    public ResponseEntity<MatchDTO> crear(@RequestBody CreateMatchDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(matchService.crear(dto));
    }

    @Operation(summary = "Obtener partida con jugadores")
    @GetMapping("/{matchId}")
    public ResponseEntity<MatchDTO> obtener(@PathVariable UUID matchId) {
        return ResponseEntity.ok(matchService.obtener(matchId));
    }

    @Operation(summary = "Finalizar partida")
    @PostMapping("/{matchId}/finish")
    public ResponseEntity<MatchDTO> finalizar(@PathVariable UUID matchId) {
        return ResponseEntity.ok(matchService.finalizar(matchId));
    }

    @Operation(summary = "Agregar jugador a la partida")
    @PostMapping("/{matchId}/players")
    public ResponseEntity<PlayerDTO> agregarJugador(
            @PathVariable UUID matchId,
            @RequestBody AddPlayerDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(playerService.agregar(matchId, dto));
    }

    @Operation(summary = "Sumar una porción al jugador")
    @PostMapping("/{matchId}/players/{playerId}/slices")
    public ResponseEntity<PlayerDTO> sumarPorcion(
            @PathVariable UUID matchId,
            @PathVariable UUID playerId) {
        return ResponseEntity.ok(playerService.sumarPorcion(matchId, playerId));
    }

    @Operation(summary = "Restar una porción al jugador")
    @DeleteMapping("/{matchId}/players/{playerId}/slices")
    public ResponseEntity<PlayerDTO> restarPorcion(
            @PathVariable UUID matchId,
            @PathVariable UUID playerId) {
        return ResponseEntity.ok(playerService.restarPorcion(matchId, playerId));
    }

    @Operation(summary = "Estadísticas de la partida")
    @GetMapping("/{matchId}/stats")
    public ResponseEntity<StatsDTO> stats(@PathVariable UUID matchId) {
        return ResponseEntity.ok(statsService.obtener(matchId));
    }
}
