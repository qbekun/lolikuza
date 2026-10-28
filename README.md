# lolikuza / Tosho

React 19 + Vite. Zachowano oryginalny wygląd: stronę główną z wideo, widżetem Discord i kafelkami oraz Tosho z szarymi panelami, tabelą, trzema kolumnami, sezonowym tłem i odtwarzaczem. Strona główna oraz Tosho są aplikacją React. Dodatkowa strona `srtmz.html` pozostaje w dotychczasowej wersji.

## Uruchomienie

```sh
npm ci
npm run dev
```

Otwórz adres pokazany w terminalu, następnie `/tosho/`.

```sh
npm run sync:vndb
npm run build
npm run preview
```

Gotowa strona trafia do `dist`. Budowanie wymaga Node.js 22.12+ i Pythona 3.10+. Synchronizacja wymaga dostępu do internetu; zwykłe budowanie korzysta z zapisanego pliku danych.

## Katalog i VNDB

Wpisy edytujesz w `tosho/data.json`; zachowano istniejące opisy i adresy pobierania. Dodaj opcjonalne pole `"vndbId": "v123"`, aby powiązać wpis z VNDB. Linki `https://vndb.org/v123` są rozpoznawane automatycznie. Nie dopasowujemy gier automatycznie według tytułu.

`scripts/sync-vndb.mjs` pobiera publiczne dane API Kana bez tokena: 60 wysoko ocenianych VN z wydaniem angielskim oraz metadane jawnie powiązanych pozycji. Sekcja „Odkrywaj VN” przeszukuje ten wybór, nie całą bazę VNDB. Dane są w `src/data/vndb.json`, wraz z datą aktualizacji. Przy awarii API zachowywany jest poprzedni plik; brak jakiejkolwiek zapisanej kopii powoduje błąd synchronizacji. Okładki VNDB z oznaczeniem treści seksualnej lub przemocy zastępuje neutralna plansza. Lokalne okładki pozostają bez zmian.

API: https://api.vndb.org/kana — uwzględnij aktualne warunki użycia oraz licencję danych VNDB przed zmianą sposobu wykorzystania.

Odtwarzacz korzysta z `tosho/music.json`. Stare linki `/tosho/uwu.html?id=slug` i RSS nadal działają. Szczegóły nadal używają adresów `uwu.html?id=slug`.

## GitHub Pages

Workflow `.github/workflows/pages.yml` instaluje zależności, aktualizuje dane VNDB, buduje React oraz RSS i publikuje katalog `dist` po pushu do `main`. W repozytorium wybierz **Settings → Pages → Source → GitHub Actions**. Plik `CNAME` zachowuje domenę `lolikuza.ovh`; przy przejściu na adres github.io usuń go. Względne ścieżki zasobów React działają także pod ścieżką repozytorium. Dodatkowa stara strona `srtmz.html` może wymagać dostosowania własnych linków przy zmianie domeny.

Publikacja nastąpi dopiero po wysłaniu zmian do repozytorium. Samo uruchomienie lokalne niczego nie publikuje.
