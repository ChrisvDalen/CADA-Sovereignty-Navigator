package nl.cada.navigator.api;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.TreeSet;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import nl.cada.navigator.api.dto.ReportResponse;
import nl.cada.navigator.api.dto.ReportResponse.ReportRow;
import nl.cada.navigator.persistence.SnapshotEntity;

/** Bouwt momentopnames en berekent de diff tussen twee momentopnames. */
@Service
public class SnapshotService {

    private final ObjectMapper objectMapper;

    public SnapshotService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /** Compacte, serialiseerbare samenvatting van een gap-rapport. */
    public record SnapshotData(
            int applicationCount,
            int gapCount,
            Map<Integer, Integer> recommendedLevels,
            Map<Integer, Integer> achievableLevels,
            Map<String, Integer> supplierUsage,
            List<AppSnapshot> applications) {
    }

    public record AppSnapshot(String name, int recommendedLevel, Integer achievableLevel, String status) {
    }

    public SnapshotData summarise(ReportResponse report) {
        Map<Integer, Integer> recommended = new TreeMap<>();
        Map<Integer, Integer> achievable = new TreeMap<>();
        Map<String, Integer> suppliers = new TreeMap<>();
        List<AppSnapshot> apps = new ArrayList<>();
        int gaps = 0;

        for (ReportRow row : report.rows()) {
            recommended.merge(row.app().recommendedLevel(), 1, Integer::sum);
            if (row.compliance().achievableLevel() != null) {
                achievable.merge(row.compliance().achievableLevel(), 1, Integer::sum);
            }
            for (String supplier : row.supplierNames()) {
                suppliers.merge(supplier, 1, Integer::sum);
            }
            if ("GAP".equals(row.statusLabel())) {
                gaps++;
            }
            apps.add(new AppSnapshot(row.app().name(), row.app().recommendedLevel(),
                    row.compliance().achievableLevel(), row.statusLabel()));
        }
        return new SnapshotData(report.rows().size(), gaps, recommended, achievable, suppliers, apps);
    }

    public String toJson(SnapshotData data) {
        try {
            return objectMapper.writeValueAsString(data);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Momentopname kon niet worden opgeslagen.", e);
        }
    }

    public SnapshotData fromJson(String json) {
        try {
            return objectMapper.readValue(json, SnapshotData.class);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Momentopname kon niet worden gelezen.", e);
        }
    }

    // — Diff —

    public record CountChange(int from, int to, int delta) {
        static CountChange of(int from, int to) {
            return new CountChange(from, to, to - from);
        }
    }

    public record KeyedChange(String key, int from, int to, int delta) {
    }

    public record AppLevelChange(String name, int fromLevel, int toLevel) {
    }

    public record SnapshotDiff(
            String fromLabel,
            String toLabel,
            CountChange applicationCount,
            CountChange gapCount,
            List<KeyedChange> recommendedLevels,
            List<KeyedChange> supplierUsage,
            List<String> addedApplications,
            List<String> removedApplications,
            List<AppLevelChange> levelChanges) {
    }

    public SnapshotDiff diff(String fromLabel, SnapshotData from, String toLabel, SnapshotData to) {
        Map<String, AppSnapshot> fromApps = new LinkedHashMap<>();
        from.applications().forEach(a -> fromApps.put(a.name(), a));
        Map<String, AppSnapshot> toApps = new LinkedHashMap<>();
        to.applications().forEach(a -> toApps.put(a.name(), a));

        List<String> added = new ArrayList<>();
        List<AppLevelChange> levelChanges = new ArrayList<>();
        for (AppSnapshot app : to.applications()) {
            AppSnapshot before = fromApps.get(app.name());
            if (before == null) {
                added.add(app.name());
            } else if (before.recommendedLevel() != app.recommendedLevel()) {
                levelChanges.add(new AppLevelChange(app.name(), before.recommendedLevel(), app.recommendedLevel()));
            }
        }
        List<String> removed = new ArrayList<>();
        for (String name : fromApps.keySet()) {
            if (!toApps.containsKey(name)) {
                removed.add(name);
            }
        }

        return new SnapshotDiff(
                fromLabel,
                toLabel,
                CountChange.of(from.applicationCount(), to.applicationCount()),
                CountChange.of(from.gapCount(), to.gapCount()),
                levelKeyedChanges(from.recommendedLevels(), to.recommendedLevels()),
                supplierKeyedChanges(from.supplierUsage(), to.supplierUsage()),
                added,
                removed,
                levelChanges);
    }

    private List<KeyedChange> levelKeyedChanges(Map<Integer, Integer> from, Map<Integer, Integer> to) {
        List<KeyedChange> changes = new ArrayList<>();
        for (int level = 1; level <= 4; level++) {
            int a = from.getOrDefault(level, 0);
            int b = to.getOrDefault(level, 0);
            if (a != 0 || b != 0) {
                changes.add(new KeyedChange("Niveau " + level, a, b, b - a));
            }
        }
        return changes;
    }

    private List<KeyedChange> supplierKeyedChanges(Map<String, Integer> from, Map<String, Integer> to) {
        List<KeyedChange> changes = new ArrayList<>();
        for (String supplier : new TreeSet<>(union(from.keySet(), to.keySet()))) {
            int a = from.getOrDefault(supplier, 0);
            int b = to.getOrDefault(supplier, 0);
            changes.add(new KeyedChange(supplier, a, b, b - a));
        }
        return changes;
    }

    private static TreeSet<String> union(java.util.Set<String> a, java.util.Set<String> b) {
        TreeSet<String> all = new TreeSet<>(a);
        all.addAll(b);
        return all;
    }
}
