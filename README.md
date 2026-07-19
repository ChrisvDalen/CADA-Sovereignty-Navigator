# CADA Sovereignty Navigator

Webapplicatie waarmee overheidsinstanties en CADA-plichtige organisaties per
cloudtoepassing bepalen welk EU-soevereiniteitsniveau (1 t/m 4) van toepassing
is, hun huidige leveranciers toetsen en een compliance-roadmap genereren.

De Cloud and AI Development Act (CADA) is per augustus 2026 van kracht en
introduceert vier verplichte soevereiniteitsniveaus voor cloudgebruik door
overheidsinstanties:

| Niveau | Naam | Kern |
| --- | --- | --- |
| 1 | Locatie | Data staat fysiek op Europees grondgebied |
| 2 | Onafhankelijkheid | Juridisch onafhankelijk van niet-EU-landen + transparante softwarestack |
| 3 | EU-controle | Europees eigendom en bestuur |
| 4 | Soevereiniteit | EU Sovereign-certificering via ENISA, jaarlijkse audit |

## Modules

1. **Toepassingsprofiler** — vragenlijst per cloudtoepassing (datatype,
   regelgeving, impact, kritieke infrastructuur, AI-verwerking, leveranciers);
   een deterministische beslisboom berekent server-side het aanbevolen
   CADA-niveau, met een live niveau-indicatie tijdens het invullen. Elke
   niveaubepaling is **uitlegbaar**: de regel die het niveau bepaalde wordt
   getoond in het formulier, het rapport en de exports.
2. **Leverancierstoets** — toetst de geselecteerde leveranciers tegen de
   referentiedataset (18 aanbieders) met het maximaal haalbare niveau,
   jurisdictie, eigendomsstructuur en certificeringen per aanbieder.
3. **Gap-rapport & roadmap** — samenvattingstabel, prioriteitenmatrix
   (hoogste impact + grootste gap bovenaan), concrete aanbevelingen en een
   **roadmap per fase** (korte termijn / middellang / meerjarig / handmatig
   toetsen / borgen), afgeleid van de gap en het doelniveau.
4. **Export** — professioneel PDF-rapport, Excel-export (één rij per
   toepassing) en een bewerkbaar Word-document. Alle drie worden client-side
   gegenereerd op basis van het door de server berekende rapport.

Daarnaast:

- **Dossieroverzicht** (`/dossiers`) — portfolio-dashboard met alle analyses,
  het aantal toepassingen en de gevonden compliance-gaps.
- **Leveranciersbeheer** (`/beheer/leveranciers`) — de referentiedataset staat
  in de database en is te beheren zonder redeploy; wijzigingen werken direct
  door in de leverancierstoets van alle dossiers.
- **Authenticatie** (`/login`) — aanmelden via een magic-link per e-mail
  (geen wachtwoord). Dossiers zijn persoonlijk: alleen de eigenaar kan ze
  inzien en bewerken. Zonder mailserver wordt de aanmeldlink in het serverlog
  geschreven; met `cada.auth.expose-login-link: true` (de standaard voor
  lokaal ontwikkelen) toont de aanmeldpagina de link direct.
- **Delen met bestuur** (`/delen/{token}`) — per dossier is vanaf het rapport
  één alleen-lezen deellink aan te maken (en in te trekken) waarmee het
  gap-rapport zonder aanmelding te bekijken is.

Dossiers worden opgeslagen in een lokale H2-database; het dossier-ID staat in
`localStorage`, zodat een analyse later hervat kan worden. Sessies leven in
een HttpOnly-cookie (30 dagen); magic-link- en sessietokens worden alleen als
SHA-256-hash opgeslagen.

## Architectuur

```
backend/    Spring Boot 3 (Java 25) REST API + H2 (lokaal) / PostgreSQL (prod)
frontend/   Angular 22 (standalone components, signals) + Tailwind CSS 4
```

Vereisten: JDK 25, Maven 3.9+, Node.js ≥ 24.15 (vereist door de Angular 22 CLI).

- **Backend** is de bron van waarheid voor alle domeinlogica: de beslisboom,
  de leverancierstoets, de aanbevelingen en de prioritering
  (`nl.cada.navigator.domain`). De REST API levert daarnaast de
  referentiedata (`GET /api/meta`) en het volledige gap-rapport
  (`GET /api/assessments/{id}/report`).
- **Frontend** is een vierstaps-wizard in het Nederlands (soevereiniteits-
  ladder, kobalt/nacht-palet, Archivo-display). PDF (jsPDF) en Excel
  (SheetJS) worden in de browser gegenereerd en lazy geladen.

### REST API

| Methode | Pad | Doel |
| --- | --- | --- |
| POST | `/api/assessments` | Dossier openen (`{ orgName }`) |
| GET | `/api/assessments` | Portfolio-overzicht met gap-statistiek per dossier |
| GET | `/api/assessments/{id}` | Dossier + toepassingen ophalen |
| PATCH | `/api/assessments/{id}` | Organisatienaam wijzigen |
| GET | `/api/assessments/{id}/report` | Gap-rapport (compliance, aanbevelingen, prioriteit, fase) |
| POST | `/api/assessments/{id}/applications` | Toepassing profileren (niveau + motivering server-side) |
| PUT | `/api/applications/{id}` | Toepassing bijwerken |
| DELETE | `/api/applications/{id}` | Toepassing verwijderen |
| GET | `/api/meta` | Referentiedata (vragen, leveranciers, niveaus) |
| POST | `/api/level-preview` | Live niveau-indicatie met motivering |
| GET/POST | `/api/suppliers` | Leveranciersreferentiedata lezen / toevoegen |
| PUT/DELETE | `/api/suppliers/{id}` | Leverancier bijwerken / verwijderen |
| POST | `/api/auth/magic-link` | Aanmeldlink aanvragen (`{ email }`) |
| POST | `/api/auth/sessions` | Magic-link-token inwisselen voor een sessiecookie |
| GET | `/api/auth/me` | Aangemelde gebruiker opvragen |
| DELETE | `/api/auth/sessions/current` | Afmelden |
| POST/GET/DELETE | `/api/assessments/{id}/share` | Deellink aanmaken / status / intrekken |
| GET | `/api/share/{token}` | Gedeeld rapport (publiek, alleen-lezen) |

Alle endpoints vereisen een sessiecookie, behalve `/api/auth/**`,
`/api/share/**` en `/api/meta`.

## Ontwikkelen

Backend (poort 8080):

```bash
cd backend
mvn spring-boot:run
```

Frontend (poort 4200, met proxy naar de backend):

```bash
cd frontend
npm install
npm start          # ng serve --proxy-config proxy.conf.json
```

Open vervolgens http://localhost:4200.

Tests en productiebuilds:

```bash
cd backend && mvn verify        # 50 unit- en API-tests (JUnit)
cd frontend && npm test         # 23 unit-tests (Vitest)
cd frontend && npm run build    # productiebundel in dist/
```

End-to-end-smoketest (Playwright start zelf de backend-jar en `ng serve`):

```bash
cd backend && mvn -DskipTests package   # jar bouwen die de test opstart
cd frontend && npx playwright install chromium   # eenmalig
cd frontend && npm run e2e
```

## Deployment (Docker + PostgreSQL)

Voor een productiewaardige opzet draait de stack op PostgreSQL in plaats van
de lokale H2-file. `docker compose up --build` start drie containers —
PostgreSQL, de backend (met het `postgres`-profiel) en de frontend achter
nginx — en publiceert de app op http://localhost:8080. De frontend proxyt
`/api` naar de backend, dus beide zijn voor de browser hetzelfde origin.

```bash
docker compose up --build      # start db + backend + frontend
docker compose down            # stoppen (data blijft in het pg-data volume)
```

Belangrijke omgevingsvariabelen (zie `docker-compose.yml`):

| Variabele | Doel |
| --- | --- |
| `DB_PASSWORD` | Wachtwoord van de PostgreSQL-gebruiker |
| `PUBLIC_BASE_URL` | Publiek origin (voor de aanmeldlink en CORS) |
| `AUTH_EXPOSE_LOGIN_LINK` | `false` zodra de aanmeldlink per mail wordt bezorgd |
| `AUTH_SECURE_COOKIES` | `true` achter HTTPS (Secure-attribuut op het cookie) |

Zonder Docker: activeer het profiel met `SPRING_PROFILES_ACTIVE=postgres` en
zet `DB_URL`, `DB_USERNAME` en `DB_PASSWORD` in de omgeving. H2 blijft het
standaardprofiel voor lokaal ontwikkelen en de tests.

## Continuous integration

Elke push naar `main` en elke pull request draait via GitHub Actions
(`.github/workflows/ci.yml`) drie jobs:

1. **Backend** — `mvn verify` op Temurin JDK 25;
2. **Frontend** — `ng test` (Vitest) + productiebuild op Node 24;
3. **E2E** — de Playwright-smoketest tegen de echte stack (backend-jar met
   in-memory H2 + Angular-dev-server).

## Disclaimer

Dit instrument is indicatief. Raadpleeg altijd een juridisch adviseur voor
bindende interpretatie van de CADA.
