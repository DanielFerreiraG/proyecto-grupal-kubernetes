package com.pizzacorrida.api.api.dao;

import com.pizzacorrida.api.api.domain.PlayerDomain;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface IPlayerDAO extends JpaRepository<PlayerDomain, UUID> {
}
