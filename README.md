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

Sessies worden opgeslagen in een lokale H2-database; het sessie-ID staat in
`localStorage`, zodat een analyse later hervat kan worden.

## Architectuur

```
backend/    Spring Boot 3 (Java 21) REST API + H2-persistentie
frontend/   Angular 21 (standalone components, signals) + Tailwind CSS 4
```

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
cd backend && mvn verify        # unit- en API-tests
cd frontend && npm run build    # productiebundel in dist/
```

## Disclaimer

Dit instrument is indicatief. Raadpleeg altijd een juridisch adviseur voor
bindende interpretatie van de CADA.
