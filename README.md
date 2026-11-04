# Yaffle

Delt reiseplan for venninnegjengen: reiseplan dag for dag, idétavle med hjerter og kvitteringer på hver booking.
Statisk side (ingen byggesteg) på Vercel, med Supabase for innlogging, database og filer.

## Slik er det satt opp

```
index.html            Stiler og app-skall
src/app.js            Selve appen (plan, idétavle, papirer)
src/runtime.js        Innlogging + kobling mot Supabase
src/config.js         Supabase-URL og anon-nøkkel  ← fyll inn
supabase/schema.sql   Tabeller, tilgangsregler og fillagring
supabase/seed-*.sql   Turdata (ligger IKKE i git, se .gitignore)
vercel.json           Sikkerhetshoder, skjuler siden fra Google
```

Innlogging er e-post + passord. Du lager brukerne selv i Supabase, så det sendes ingen e-post.
I tillegg må e-posten stå i tabellen `allowed_emails`, ellers ser personen bare «Ingen tilgang ennå».

## 1. Supabase (ca. 10 min)

1. Lag et gratis prosjekt på supabase.com. Velg region **Stockholm (eu-north-1)** eller Frankfurt.
2. **SQL Editor → New query**: lim inn `supabase/schema.sql`. Bytt ut e-postene nederst med gjengens ekte adresser, og trykk **Run**.
3. Kjør `supabase/seed-gdansk.sql` på samme måte for å legge inn Gdańsk-turen.
4. **Authentication → Sign In / Providers → Email**: la «Email» være på, og skru av **Allow new users to sign up**.
5. **Authentication → Users → Add user → Create new user** for hver person: e-post, et midlertidig passord,
   og huk av for **Auto Confirm User**. Hver kan bytte passord selv i appen («Bytt passord» øverst).
5. **Project Settings → API**: kopier *Project URL* og *anon public key* inn i `src/config.js`.

## 2. Vercel

1. Push repoet til GitHub (se under), og velg **Add New → Project** i Vercel og importer repoet.
2. Framework preset: **Other**. Ingen build command, output directory er roten. Trykk **Deploy**.
3. Kopier adressen du får (f.eks. `https://yaffle.vercel.app`).
4. Tilbake i Supabase: **Authentication → URL Configuration**
   - Site URL: `https://yaffle.vercel.app`
   (Trengs bare hvis dere senere slår på e-postlenker eller Google-innlogging.)

## 3. Kvitteringene

PDF-ene fra Claude-versjonen er ikke med i repoet, fordi de inneholder kortnummer-sifre og telefonnummer.
Last dem opp igjen i appen med «Legg ved kvittering» på hver booking. De lagres i en privat bøtte som bare gjengen når.

## Legge til en ny venninne

1. Authentication → Users → Add user → Create new user (huk av for Auto Confirm User).
2. SQL Editor:
```sql
insert into public.allowed_emails (email) values ('ny@eksempel.no');
```

## Teste lokalt

```
npx serve .
```

## Greit å vite

- Glemt passord: gå til Authentication → Users, velg personen → «Update password» (eller slett og lag på nytt).
- Anon-nøkkelen i `src/config.js` er laget for å være offentlig. Sikkerheten ligger i reglene i `schema.sql`.
  Bruk aldri `service_role`-nøkkelen i frontend.


## Flere turer og invitasjoner

Yaffle har en forside med alle turene dine. Alle kan lage konto, men ser bare turer de er invitert til.

Oppsett (én gang):

1. Kjør `supabase/migrate-flere-turer.sql` i SQL Editor. Gdańsk-turen flyttes inn som `gdansk-2026`.
2. Authentication → Sign In / Providers → Email: slå **på** «Allow new users to sign up» og slå **av** «Confirm email».
   Ellers må nye folk bekrefte e-post, og da treffer dere fort grensen for e-poster.

Inviter: åpne en tur → trykk på bildestabelen → «Inviter flere» → del lenken.
Lenken kan byttes ut med «Lag ny lenke», da slutter den gamle å virke.

`allowed_emails` brukes ikke lenger.
