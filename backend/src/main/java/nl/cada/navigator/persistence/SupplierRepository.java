package nl.cada.navigator.persistence;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierRepository extends JpaRepository<SupplierEntity, String> {

    List<SupplierEntity> findAllByOrderByPositionAsc();

    Optional<SupplierEntity> findByName(String name);
}
