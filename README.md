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

Bare e-poster som står i tabellen `allowed_emails` kommer inn. Andre kan be om en innloggingslenke,
men ser bare «Ingen tilgang ennå» og får verken lese eller skrive noe.

## 1. Supabase (ca. 10 min)

1. Lag et gratis prosjekt på supabase.com. Velg region **Stockholm (eu-north-1)** eller Frankfurt.
2. **SQL Editor → New query**: lim inn `supabase/schema.sql`. Bytt ut e-postene nederst med gjengens ekte adresser, og trykk **Run**.
3. Kjør `supabase/seed-gdansk.sql` på samme måte for å legge inn Gdańsk-turen.
4. **Authentication → Sign In / Providers → Email**: la «Email» være på. Skru gjerne av **Allow new users to sign up**
   etter at alle har logget inn én gang. Det er uansett `allowed_emails` som bestemmer tilgangen.
5. **Project Settings → API**: kopier *Project URL* og *anon public key* inn i `src/config.js`.

## 2. Vercel

1. Push repoet til GitHub (se under), og velg **Add New → Project** i Vercel og importer repoet.
2. Framework preset: **Other**. Ingen build command, output directory er roten. Trykk **Deploy**.
3. Kopier adressen du får (f.eks. `https://yaffle.vercel.app`).
4. Tilbake i Supabase: **Authentication → URL Configuration**
   - Site URL: `https://yaffle.vercel.app`
   - Redirect URLs: `https://yaffle.vercel.app/**` (og `http://localhost:3000/**` hvis du tester lokalt)

## 3. Kvitteringene

PDF-ene fra Claude-versjonen er ikke med i repoet, fordi de inneholder kortnummer-sifre og telefonnummer.
Last dem opp igjen i appen med «Legg ved kvittering» på hver booking. De lagres i en privat bøtte som bare gjengen når.

## Legge til en ny venninne

```sql
insert into public.allowed_emails (email) values ('ny@eksempel.no');
```

## Teste lokalt

```
npx serve .
```

## Greit å vite

- Supabase sin innebygde e-posttjeneste sender bare noen få innloggingslenker i timen. Det holder for tre personer.
  Trenger dere mer, legg inn egen SMTP under Authentication → Emails.
- Anon-nøkkelen i `src/config.js` er laget for å være offentlig. Sikkerheten ligger i reglene i `schema.sql`.
  Bruk aldri `service_role`-nøkkelen i frontend.
