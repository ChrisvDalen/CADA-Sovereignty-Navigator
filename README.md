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

- Next.js (App Router) + TypeScript + Tailwind CSS
- Next.js API-routes (geen aparte server)
- SQLite via Prisma
- jsPDF + jspdf-autotable (PDF), SheetJS/xlsx (Excel)
- UI volledig in het Nederlands, responsive op 1280 px en 768 px

## Ontwikkelen

```bash
npm install
cp .env.example .env        # DATABASE_URL="file:./dev.db"
npx prisma db push          # maakt prisma/dev.db aan
npm run dev                 # http://localhost:3000
```

Productie:

```bash
npm run build
npm run start
```

## Structuur

```
app/          pagina's (App Router) en API-routes
components/   herbruikbare UI-componenten
lib/          beslisboom, leveranciersdata, rapportage- en exportlogica
prisma/       schema en lokale SQLite-database
```

## Disclaimer

Dit instrument is indicatief. Raadpleeg altijd een juridisch adviseur voor
bindende interpretatie van de CADA.
