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
   deterministische beslisboom berekent server-side het aanbevolen CADA-niveau,
   met een live niveau-indicatie tijdens het invullen.
2. **Leverancierstoets** — toetst de geselecteerde leveranciers tegen een
   referentiedataset met het maximaal haalbare niveau per aanbieder.
3. **Gap-rapport & roadmap** — samenvattingstabel, prioriteitenmatrix
   (hoogste impact + grootste gap bovenaan) en concrete aanbevelingen.
4. **Export** — professioneel PDF-rapport (voorpagina, inhoudsopgave,
   niveau-uitleg, aanbevelingen, disclaimer) en Excel-export (één rij per
   toepassing). Beide worden client-side gegenereerd op basis van het door de
   server berekende rapport.

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
| GET | `/api/assessments/{id}` | Dossier + toepassingen ophalen |
| PATCH | `/api/assessments/{id}` | Organisatienaam wijzigen |
| GET | `/api/assessments/{id}/report` | Gap-rapport (compliance, aanbevelingen, prioriteit) |
| POST | `/api/assessments/{id}/applications` | Toepassing profileren (niveau server-side berekend) |
| PUT | `/api/applications/{id}` | Toepassing bijwerken |
| DELETE | `/api/applications/{id}` | Toepassing verwijderen |
| GET | `/api/meta` | Referentiedata (vragen, leveranciers, niveaus) |
| POST | `/api/level-preview` | Live niveau-indicatie tijdens het invullen |

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
