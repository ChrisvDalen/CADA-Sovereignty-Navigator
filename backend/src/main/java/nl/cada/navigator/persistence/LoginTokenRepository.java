package nl.cada.navigator.persistence;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LoginTokenRepository extends JpaRepository<LoginTokenEntity, String> {

    Optional<LoginTokenEntity> findByTokenHash(String tokenHash);
}
