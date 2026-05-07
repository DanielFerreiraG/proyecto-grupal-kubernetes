package com.pizzacorrida.api.api.dao;

import com.pizzacorrida.api.api.domain.MatchDomain;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface IMatchDAO extends JpaRepository<MatchDomain, UUID> {
}
