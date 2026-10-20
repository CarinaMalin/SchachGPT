# SchachGPT

Eine kostenlose Schach-Web-App für Handy und PC. Du spielst Weiß gegen Stockfish, bekommst vorbereitete Lernhilfen und kannst Stellung, Zugverlauf und eine eigene Frage für einen separaten Chat kopieren.

## Kostenlos und ohne KI-API

Keine API-Schlüssel, kein kostenpflichtiger Server, kein Abonnement in der App. Die Engine rechnet im Browser. Es gibt **keinen eingebauten KI-Chat**. Die Lerntexte sind regelbasiert; Zughinweise kommen von Stockfish. Hinweise sind keine vollständige Partieanalyse.

Die aktuelle Partie wird lokal im Browser gespeichert. Keine automatische Synchronisierung zwischen Geräten. PGN-Export und -Import ermöglichen den Wechsel.

## GitHub Pages einschalten

Im Repository **Settings → Pages → Build and deployment → Deploy from a branch** auswählen, dann **main** und **/(root)** speichern. GitHub Pages ist für dieses öffentliche Repository im kostenlosen GitHub-Tarif verfügbar. Nach der Bereitstellung lautet die Adresse:

https://carinamalin.github.io/SchachGPT/

Die Adresse funktioniert erst, wenn Pages aktiviert und die Bereitstellung erfolgreich abgeschlossen ist.

## Nutzung

- Figur antippen, dann ein markiertes Zielfeld auswählen.
- Spielstärke: Locker, Übung oder Knifflig (keine zugesicherte Elo-Zahl).
- Zurücknehmen nimmt deinen letzten Zug samt gegnerischer Antwort zurück.
- Bei Bauernumwandlung kann die neue Figur gewählt werden.
- „Stellung für den Chat kopieren“ kopiert FEN, PGN und deine Frage. Anschließend in einen vorhandenen Chat einfügen.
- Neue Partie und Import fragen vor dem Ersetzen einer laufenden Partie nach.

## Abhängigkeiten und Datenschutz

Beim Öffnen benötigt die App Internet für unverändert geladene, fest versionierte Bibliotheken von jsDelivr:

- [chess.js 1.4.0](https://github.com/jhlywa/chess.js/tree/v1.4.0), BSD-2-Clause, für legale Züge, Rochade, en passant, Umwandlung und Spielende.
- [Stockfish.js 10.0.2](https://www.npmjs.com/package/stockfish/v/10.0.2), GPL-3.0; ältere, kompakte asm.js-Version für statisches Hosting. [Quellcode und Build-Anleitung](https://github.com/nmrugg/stockfish.js), [Lizenztext](https://cdn.jsdelivr.net/npm/stockfish@10.0.2/Copying.txt).
- Schriftarten von Google Fonts, mit lokalen Ersatzschriften.

Die jeweiligen Anbieter erhalten übliche Verbindungsdaten beim Laden. Züge und Fragen werden von der App nicht an einen KI-Dienst geschickt. Kopieren erfolgt erst auf Knopfdruck. Dies ist keine vollständig offline verfügbare App.

## Lokal starten

Den Ordner über einen beliebigen lokalen statischen HTTP-Server öffnen (nicht per `file://`). Es ist kein Build erforderlich. GitHub Pages stellt HTML, CSS und JavaScript direkt bereit.

## Grenzen der ersten Version

Du spielst Weiß. Kein Login, kein Sprachchat, kein automatisches Review und keine automatische Gerätesynchronisierung. Die drei Lernhilfe-Schaltflächen bieten vorbereitete Texte; sie führen kein freies Gespräch. Ein Engine-Ladefehler wird angezeigt und kann durch Neuladen nach Wiederherstellung der Verbindung behoben werden.
