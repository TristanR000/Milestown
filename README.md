# Milestown

Een pixelstad die groeit met je echte prestaties. Elke prestatie levert een nieuwe inwoner op; taken die je klaarzet, wachten rustig als toekomstige inwoners.

- **App:** https://tristanr000.github.io/Milestown/ (zodra GitHub Pages aan staat)
- Installeerbaar als app op je telefoon, werkt ook offline
- Inloggen met e-mail en wachtwoord, je stad staat in je account (Supabase)
- Eén rustige melding als een taak drie dagen wacht

## Hoe het in elkaar zit

| Onderdeel | Waar |
|---|---|
| De app (alles in één bestand) | `index.html` |
| Openbare instellingen (Supabase-adres, publieke sleutels) | `config.js` |
| Offline werken en meldingen tonen | `sw.js`, `manifest.webmanifest`, `icons/` |
| Database en beveiliging | `supabase/schema.sql` |
| Dagelijkse herinneringen versturen | `supabase/functions/send-reminders/index.ts` |
| Elke dag de herinneringen aanroepen | `.github/workflows/reminders.yml` |

## Eenmalig instellen

### 1. Database (Supabase → SQL Editor)
Plak de inhoud van `supabase/schema.sql` in **SQL Editor → New query** en klik op **Run**.

### 2. Inloggen met e-mail en wachtwoord (Supabase → Authentication)
- **Authentication → Sign In / Providers → Email**: zet **Confirm email** uit. Zo zijn er geen e-mails nodig om een account te maken.
- **Authentication → URL Configuration → Site URL**: `https://tristanr000.github.io/Milestown/` (voor de mail bij "Wachtwoord vergeten").

### 3. De herinneringsfunctie (Supabase → Edge Functions)
1. **Deploy a new function → Via Editor**, naam `send-reminders`.
2. Plak de inhoud van `supabase/functions/send-reminders/index.ts` en klik op **Deploy**.
3. Zet bij de functie **Verify JWT** (JWT-controle) **uit**: de functie controleert zelf een geheime sleutel.
4. **Edge Functions → Secrets**: voeg `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` en `CRON_SECRET` toe.

### 4. GitHub
- **Settings → Pages**: Source **Deploy from a branch**, branch `main`, map `/ (root)`.
- **Settings → Secrets and variables → Actions → New repository secret**: `CRON_SECRET` (dezelfde waarde als in Supabase).
- Test de herinneringen via **Actions → Dagelijkse herinneringen → Run workflow**.

## Gratis grenzen
Alles draait op gratis plannen (GitHub Pages en Actions, Supabase Free). Gratis Supabase-projecten worden na een week zonder activiteit gepauzeerd; de dagelijkse herinneringstaak gebruikt de database elke dag, zodat dat niet gebeurt.
