CREATE TABLE IF NOT EXISTS assessment (
    id         TEXT PRIMARY KEY,
    org_name   TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS application (
    id                TEXT PRIMARY KEY,
    assessment_id     TEXT NOT NULL REFERENCES assessment (id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    data_types        TEXT NOT NULL,
    regulations       TEXT NOT NULL,
    impact_level      TEXT NOT NULL,
    critical_infra    INTEGER NOT NULL,
    suppliers         TEXT NOT NULL,
    supplier_other    TEXT NOT NULL DEFAULT '',
    recommended_level INTEGER NOT NULL,
    created_at        TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_application_assessment ON application (assessment_id);
