# Club Tables App

Webowa aplikacja do naliczania czasu gry na 10 stołach:

- 1-3: Pool
- 4-6: Heyball
- 7-10: Snooker

Ceny:

- Tydzień: 40 zł/h
- Weekend: 50 zł/h

Funkcje:

- mapa klubu podobna do przesłanego rzutu,
- kliknięcie stołu,
- start gry,
- blokada stołu podczas aktywnej gry,
- zakończenie gry,
- wybór zniżki,
- wybór tygodnia/weekendu,
- zapis do Supabase,
- historia ostatnich gier,
- dzienny utarg.

## Supabase

W Supabase wejdź w `SQL Editor` → `New query` i uruchom zawartość pliku:

`SUPABASE_SQL.sql`

## Zmienne środowiskowe

Skopiuj `.env.example` jako `.env.local` i wpisz swoje dane z Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```


Update: zniżka członkowska jest teraz checkboxem -5 zł. Można też wpisać ręcznie cenę za godzinę; jeśli pole jest puste, aplikacja liczy 40 zł/h w tygodniu i 50 zł/h w weekend.
