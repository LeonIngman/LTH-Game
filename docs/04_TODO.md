## Projektets Att-Göra Lista (uppdaterad)

---

## Kärnfunktioner (Öppna / Planerade)

- **CF1**: Överlagerkostnader ska beräknas och visas dagligen för nivå 1, och från start för nivå 2 och 3 _(kräver speltestning)_
- **CF3**: Fixa tutorial för nivå 0 (introduktion av koncept, “vad som är nytt”)
- **CF4**: Implementera visuellt säkerhetslager
- **CF5**: Centralisera fler värden (t.ex. nivånamn)
- **CF6**: Implementera quiz (enligt krav – quiz per nivå, synligt efter avslut, admin kan se resultat)
- **CF7**: Spårning av quiz per spelare/lagmedlem
- **CF8**: Implementera fler/alla ikoner från föreslagen UI
- **CF9**: Säkerställa att alla siffror och beräkningar stämmer _(speltest)_
- **CF10**: Export av data (CSV, Excel, JSON) för KPI\:er, leaderboard, quiz och enkäter
- **CF11**: Blockera produktion utanför prognosfas
- **CF12**: Ordrar ska visas direkt i **Current Orders**-widgeten när de läggs
- **CF13**: Visa ETA vid inköp och ETD vid försäljning
- **CF14**: Ändra fabrikslegenden så den visar resursåtgång per hamburgare
- **CF15**: Rerun-funktion för nivåer (återställ state och spela om)
- **CF16**: Dag-/turn-baserat flöde (inte kontinuerlig simulering)
- **CF17**: Möjlighet att gå tillbaka exakt en dag (och blockera mer än så)
- **CF18**: Canvas-inloggning: lag provisionerade i Canvas; login med lagnamn + lösenord (enkel auth)
- **CF19**: Dashboards med KPI\:er, jämförelse mellan lag och leaderboard
- **CF20**: Adminsida: hantera lag och deadlines, se prestanda, quiz- och enkätresultat
- **CF21**: Implementera enkätfunktion (feedback per person/lag) – de-prioriterad men designad
- **CF22**: Visa vad som är nytt i varje nivå (förklarande texter/tooltips)

---

## Testning & Felsökning

- **TD1**: Systematiskt speltest nivå för nivå; kontrollera: inköp, lagersaldo, inventarieflöden, KPI\:er, rollback, quizflöde, export

---

## UI & UX

- **UX4**: Visa mål-popup vid start av nivå
- **UX5**: Låsa omspel av quiz tills lärare godkänt/underkänt
- **UX6**: Visa spelarnamn per quizförsök
- **UX7**: Omedelbar produktion i nivå 0 (verifiera krav)
- **UX8**: Implementera alla önskade prestations-/performance-mått i dashboard
- **UX9**: Toggle för att visa/dölja lösenord vid inloggning
- **UX10**: Huvudskärm utformad enligt prototypens struktur (med viss designfrihet)

---

## Infrastruktur & Städning

- **IC1**: _(Valfritt)_ Migrera till LTH-server
- **IC2**: Rensa oanvänd / föråldrad kod (se tidigare lista)
- **IC3**: Centralisera beräkningar (flytta till gemensamma hooks eller moduler)
- **IC4**: Slå ihop `MaterialOrder` och `SupplierOrder`
- **IC5**: Abstraktionslager för auth så Canvas-integration kan bytas utan ombyggnad

---

## Buggar

### B2. Lärarvy – parameteråtkomst

(Påverkar analys och spårning)

### B3. Slut på ingrediens – krasch

(Fix av unika keys och UX-meddelande)

---

### Avklarade

- Lade till kund- och leverantörsinformation direkt på nivåsidan
- Flyttade **Dagens åtgärder** under kartan; flyttade kund-/leverantörsinfo till vänster om kartan  
  (gjorde informationen i **Dagens beställningar** mindre utrymmeskrävande)
- Lade till transportkostnad och vinst i kostnadssammanfattningswidgeten
- Hanterade "Maximal produktion: 20 måltider" i produktionsfönstret _(kontrollera om hårdkodat)_
- Ändrade beskrivningar, nivånamn, etc.
- Uppdaterade leveransschema för kunder (åtgärdade skillnad mot Excel och förfalloproblemet från dag noll)
- Implementerade prognostisering för nivå 2 och 3
- Lade till prognostiseringsverktyg
- Varnade spelare att inget sparas vid klick på **Avsluta spel**
- Ersatte lagerdiagrammet med stapeldiagram
- Visa alltid transportkostnader i leverantörs-/kundmenyn; justerade visning av totalkostnad/vinst
- Lade till knappen **Återställ dag**
- Lade till alternativ för att lägga beställning/sälja till kunder/leverantörer
- Ersatte **Spelhistorik** med **Dagens åtgärder**
- Implementerade förseningsavgift
- Ersatte widgeten **Marknadsinformation** med lista över väntande beställningar
- Uppdaterade användargränssnittet för förklaring av daglig lagerhållningskostnad
- Uppdaterade daglig kapacitet för leverantörer (total kapacitet över speltiden)
- Tog bort bröd från överlagertröskeln
- Implementerade variabla ledtider för nivå 3
- **Åtgärdade bugg #3**: Krasch vid null-egenskapsåtkomst i spelhistorik - Lade till säker null-hantering för att förhindra krascher vid visning av null-värden, spelframsteg bevaras nu korrekt
- **CF2**: ✅ SLUTFÖRD (2024-12-13) - Integrerade spelarframsteg med databasen för beständig lagring och efteranalys. Implementerade omfattande manuellt sparsystem med tangentbordsgenväg (Cmd/Ctrl+S), visuella indikatorer för sparstatus och tillgängligt användargränssnitt. Tog bort automatisk sparfunktion till förmån för användarstyrda manuella sparningar med tydlig spårning av ändringstillstånd. Spelsessioner lagras unikt per användare och nivå, vilket möjliggör fullständig återställning av framsteg vid uppdatering av webbläsaren och mellan sessioner.
- **UX1**: ✅ Laddningsskärm
- **UX2**: ✅ Justerad padding i “Next day”-rad
- **UX3**: ✅ Sorterbara kolumner i Game History
 - **B1**: ✅ Quiz-sida – parameteråtkomst löst (dynamic params unwrap med React.use(); blockerande status borttagen för CF6, CF7, UX5, UX6)

---

## Frågor till Gustav

Q1: Kan jag ta bort alternativet att producera 0 hamburgare? Nuvarande: 0,10,20,30 → Förslag: 10,20,30 (alternativt 10,20,30,40?). Vad önskas av kunden?
Q2: 
