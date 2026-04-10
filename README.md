# Die-cast collector platform demo

Ovo je runnable demo scaffold za model-first kolekcionarsku platformu.

## Šta radi odmah
- Home
- Search by SKU / name
- Browse
- Login / Register preko Supabase Auth
- Auto-create profile nakon auth callback-a
- Role-based admin pristup
- Admin shell
- `/en` i `/sr` struktura
- DB schema foundation u `src/db/schema`

## 1) Environment setup
Napravi `.env.local` u root-u projekta i kopiraj vrednosti iz `.env.example`.

Obavezna polja:
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ili legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`

Opcionalno:
- `ADMIN_EMAILS` → email adrese koje automatski dobijaju `admin` rolu kada im se prvi put kreira profil

## 2) Pokretanje
```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

## 3) Kako da uzmeš ispravne Supabase vrednosti
- `NEXT_PUBLIC_SUPABASE_URL` i publishable key uzimaš iz Supabase `Connect` dijaloga.
- Za `DATABASE_URL` koristi Session pooler connection string kao default.
- Ako ti mreža podržava IPv6 ili imaš IPv4 add-on, možeš koristiti direct connection string.

## 4) Auth / Roles flow
- Korisnik se registruje preko `/[locale]/register`
- Supabase callback razmenjuje `code` za session
- Aplikacija automatski pravi `profiles` zapis ako ne postoji
- Rola se dodeljuje na osnovu `ADMIN_EMAILS`, inače korisnik dobija `user`
- `/[locale]/admin` je zaštićen server-side guardom i admin layout-om

## 5) Korisne komande
```bash
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:seed
npm run role:grant-admin -- someone@example.com
```

## Napomene
- Ne kači `.env.local` na GitHub i ne šalji ga drugima.
- Ne kopiraj `node_modules` i `.next` između računara; uvek radi novi `npm install` na tom računaru.
- `drizzle/` migracije treba da ostanu u repou.
