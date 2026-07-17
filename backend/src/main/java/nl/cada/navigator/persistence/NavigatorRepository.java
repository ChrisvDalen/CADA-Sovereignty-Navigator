package nl.cada.navigator.persistence;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import nl.cada.navigator.api.ApiDtos.ApplicationDto;
import nl.cada.navigator.api.ApiDtos.AssessmentDto;
import nl.cada.navigator.api.ApplicationValidator.ValidatedApplication;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

/**
 * Opslag van analyses en toepassingen in SQLite. Lijstvelden (datatypes,
 * regelgeving, leveranciers) worden — net als voorheen — als JSON-tekst
 * opgeslagen.
 */
@Repository
@Transactional
public class NavigatorRepository {

    private static final TypeReference<List<String>> STRING_LIST = new TypeReference<>() {
    };

    private final JdbcClient jdbc;
    private final ObjectMapper json;

    public NavigatorRepository(JdbcClient jdbc, ObjectMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    public AssessmentDto createAssessment(String orgName) {
        var id = UUID.randomUUID().toString();
        var now = Instant.now().toString();
        jdbc.sql("INSERT INTO assessment (id, org_name, created_at, updated_at) VALUES (?, ?, ?, ?)")
                .params(id, orgName, now, now)
                .update();
        return new AssessmentDto(id, orgName, now, List.of());
    }

    public Optional<AssessmentDto> findAssessment(String id) {
        var assessment = jdbc.sql("SELECT id, org_name, created_at FROM assessment WHERE id = ?")
                .param(id)
                .query((rs, rowNum) -> new AssessmentDto(
                        rs.getString("id"),
                        rs.getString("org_name"),
                        rs.getString("created_at"),
                        List.of()))
                .optional();
        return assessment.map(a -> new AssessmentDto(a.id(), a.orgName(), a.createdAt(), findApplications(a.id())));
    }

    public boolean updateAssessment(String id, String orgName) {
        var updated = jdbc.sql("UPDATE assessment SET org_name = ?, updated_at = ? WHERE id = ?")
                .params(orgName, Instant.now().toString(), id)
                .update();
        return updated > 0;
    }

    public boolean assessmentExists(String id) {
        return jdbc.sql("SELECT COUNT(*) FROM assessment WHERE id = ?")
                .param(id)
                .query(Integer.class)
                .single() > 0;
    }

    public ApplicationDto createApplication(String assessmentId, ValidatedApplication app) {
        var id = UUID.randomUUID().toString();
        jdbc.sql("""
                INSERT INTO application (id, assessment_id, name, data_types, regulations, impact_level,
                                         critical_infra, suppliers, supplier_other, recommended_level, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """)
                .params(
                        id,
                        assessmentId,
                        app.name(),
                        toJson(app.dataTypes()),
                        toJson(app.regulations()),
                        app.impactLevel(),
                        app.criticalInfra(),
                        toJson(app.suppliers()),
                        app.supplierOther(),
                        app.recommendedLevel(),
                        Instant.now().toString())
                .update();
        touchAssessment(assessmentId);
        return toDto(id, app);
    }

    public Optional<ApplicationDto> updateApplication(String id, ValidatedApplication app) {
        var updated = jdbc.sql("""
                UPDATE application
                SET name = ?, data_types = ?, regulations = ?, impact_level = ?,
                    critical_infra = ?, suppliers = ?, supplier_other = ?, recommended_level = ?
                WHERE id = ?
                """)
                .params(
                        app.name(),
                        toJson(app.dataTypes()),
                        toJson(app.regulations()),
                        app.impactLevel(),
                        app.criticalInfra(),
                        toJson(app.suppliers()),
                        app.supplierOther(),
                        app.recommendedLevel(),
                        id)
                .update();
        return updated > 0 ? Optional.of(toDto(id, app)) : Optional.empty();
    }

    public boolean deleteApplication(String id) {
        return jdbc.sql("DELETE FROM application WHERE id = ?").param(id).update() > 0;
    }

    private List<ApplicationDto> findApplications(String assessmentId) {
        return jdbc.sql("""
                SELECT id, name, data_types, regulations, impact_level, critical_infra,
                       suppliers, supplier_other, recommended_level
                FROM application
                WHERE assessment_id = ?
                ORDER BY created_at, rowid
                """)
                .param(assessmentId)
                .query(this::mapApplication)
                .list();
    }

    private ApplicationDto mapApplication(ResultSet rs, int rowNum) throws SQLException {
        return new ApplicationDto(
                rs.getString("id"),
                rs.getString("name"),
                fromJson(rs.getString("data_types")),
                fromJson(rs.getString("regulations")),
                rs.getString("impact_level"),
                rs.getBoolean("critical_infra"),
                fromJson(rs.getString("suppliers")),
                rs.getString("supplier_other"),
                rs.getInt("recommended_level"));
    }

    private void touchAssessment(String id) {
        jdbc.sql("UPDATE assessment SET updated_at = ? WHERE id = ?")
                .params(Instant.now().toString(), id)
                .update();
    }

    private static ApplicationDto toDto(String id, ValidatedApplication app) {
        return new ApplicationDto(
                id,
                app.name(),
                app.dataTypes(),
                app.regulations(),
                app.impactLevel(),
                app.criticalInfra(),
                app.suppliers(),
                app.supplierOther(),
                app.recommendedLevel());
    }

    private String toJson(List<String> values) {
        return json.writeValueAsString(values);
    }

    private List<String> fromJson(String value) {
        try {
            return json.readValue(value, STRING_LIST);
        } catch (RuntimeException e) {
            return List.of();
        }
    }
}
