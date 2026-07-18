package nl.cada.navigator.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CloudApplicationRepository extends JpaRepository<CloudApplicationEntity, String> {
}
