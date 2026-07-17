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
   regelgeving, impact, kritieke infrastructuur, leveranciers); een
   deterministische beslisboom berekent het aanbevolen CADA-niveau.
2. **Leverancierstoets** — toetst de geselecteerde leveranciers tegen een
   referentiedataset met het maximaal haalbare niveau per aanbieder.
3. **Gap-rapport & roadmap** — samenvattingstabel, prioriteitenmatrix
   (hoogste impact + grootste gap bovenaan) en concrete aanbevelingen.
4. **Export** — professioneel PDF-rapport (voorpagina, inhoudsopgave,
   niveau-uitleg, aanbevelingen, disclaimer) en Excel-export (één rij per
   toepassing). Beide worden client-side gegenereerd.

Sessies worden opgeslagen in een lokale SQLite-database; het sessie-ID staat
in `localStorage`, zodat een analyse later hervat kan worden.

## Techniek

- **Frontend** (`frontend/`): Angular 22 — standalone components, signals,
  zoneless change detection, nieuwe `@if`/`@for`-controlflow en de
  `resource()`-API — met TypeScript en Tailwind CSS 4.
- **Backend** (`backend/`): Java 25 (LTS) met Spring Boot; REST-API met
  server-side beslisboom en validatie.
- SQLite via Spring JDBC (`JdbcClient`).
- jsPDF + jspdf-autotable (PDF), SheetJS/xlsx (Excel) — client-side.
- UI volledig in het Nederlands, responsive op 1280 px en 768 px.

## Ontwikkelen

Vereisten: JDK 25, Maven 3.9+, Node.js 24+.

Backend (poort 8080; maakt `backend/cada.db` aan bij de eerste start):

```bash
cd backend
mvn spring-boot:run
```

Frontend (poort 4200; proxyt `/api` naar de backend):

```bash
cd frontend
npm install
npm start                   # http://localhost:4200
```

Tests en productie-builds:

```bash
cd backend && mvn verify           # compileert + draait unit tests
cd frontend && npm run build       # productie-build in dist/
```

Voor een productie-deployment serveer je de inhoud van
`frontend/dist/frontend/browser` via een webserver die `/api` doorstuurt
naar de Spring Boot-applicatie (`mvn package` → `target/*.jar`).

## Structuur

```
frontend/     Angular 22-app (pagina's, componenten, export- en domeinlogica)
backend/      Spring Boot REST-API (Java 25) + SQLite-persistentie
```

## API

| Methode | Pad | Doel |
| --- | --- | --- |
| POST | `/api/assessments` | Nieuwe analyse starten |
| GET | `/api/assessments/{id}` | Analyse incl. toepassingen ophalen |
| PATCH | `/api/assessments/{id}` | Organisatienaam wijzigen |
| POST | `/api/assessments/{id}/applications` | Toepassing toevoegen (niveau wordt server-side berekend) |
| PUT | `/api/applications/{id}` | Toepassing bijwerken |
| DELETE | `/api/applications/{id}` | Toepassing verwijderen |

## Disclaimer

Dit instrument is indicatief. Raadpleeg altijd een juridisch adviseur voor
bindende interpretatie van de CADA.
