# SchachGPT

Eine kostenlose Schach-Web-App für Handy und PC. Du spielst Weiß gegen Stockfish, bekommst vorbereitete Lernhilfen und kannst Stellung, Zugverlauf und eine eigene Frage für einen separaten Chat kopieren.

## Kostenlos und ohne KI-API

Keine API-Schlüssel, kein kostenpflichtiger Server, kein Abonnement in der App. Die Engine rechnet im Browser. Es gibt **keinen eingebauten KI-Chat**. Die Lerntexte sind regelbasiert; Zughinweise kommen von Stockfish. Hinweise sind keine vollständige Partieanalyse.

Die aktuelle Partie wird lokal im Browser gespeichert. Keine automatische Synchronisierung zwischen Geräten. PGN-Export und -Import ermöglichen den Wechsel.

## GitHub Pages einschalten

Im Repository **Settings → Pages → Build and deployment → Deploy from a branch** auswählen, dann **main** und **/(root)** speichern. GitHub Pages ist für dieses öffentliche Repository im kostenlosen GitHub-Tarif verfügbar. Nach der Bereitstellung lautet die Adresse:

https://carinamalin.github.io/SchachGPT/

Die Adresse funktioniert erst, wenn Pages aktiviert und die Bereitstellung erfolgreich abgeschlossen ist.

## Lernhilfen jederzeit ein- und ausschalten

Der Schalter **Lernhilfen** über dem Brett funktioniert mitten in der Partie. Ausgeschaltet verschwinden Angriffspfeile, Trainings- und Eröffnungserklärungen, Zugtipps und Warnungen. Eine offene Beispielvariante wird geschlossen; ein noch nicht bestätigter Zug wird verworfen. Die echte Partie und Gegnerstärke bleiben unverändert. Normale Regeln (legale Zielfelder und Schachanzeige) bleiben sichtbar. Die Einstellung bleibt auf dem Gerät gespeichert. Beim Einschalten gilt wieder der gewählte Trainingsmodus.

## Trainingsmodus

- **Begleitet:** Erklärt den letzten gegnerischen Zug, markiert neue Angriffe und zeigt vor deinem Zug eine Vorschau, wenn Schwarz anschließend eine Figur (Springer, Läufer, Turm oder Dame) legal schlagen könnte. Du kannst zurück zur Stellung oder das mögliche Opfer bewusst spielen.
- **Selbst üben:** Erklärungen und Angriffe auf Knopfdruck, keine automatische Zugwarnung.
- **Herausforderung:** Keine automatischen Erklärungen oder Warnungen. Hilfen bleiben bewusst abrufbar.

Die **Gegnerstärke ist unabhängig** davon: Reduziert (Stockfish Skill 0), Mittel (5), Sehr stark (20). Auch reduziert ist die Engine nicht unbedingt ein leichter Gegner. Keine zugesicherte Elo-Zahl.

**Drohungen zeigen** markiert bis zu drei Angriffe auf weiße Figuren. Rot bedeutet Angriff, Blau den betrachteten Zug. Angriffspfeile zeigen geometrische Kontrolle (auch durch gefesselte Figuren), keine garantierten Gewinne. Die Warnung vor einem Zug prüft dagegen tatsächlich legale gegnerische Schlagzüge; sie berechnet keine vollständige Tauschfolge und kann deshalb auch bei guten Opfern erscheinen.

**Letzten Zug erklären** beschreibt überprüfbare Brettmerkmale: Schlagen, Schach, Matt, neue Angriffe, Gabeln, Entwicklung und Rochade. Ist kein klares Motiv erkennbar, sagt die App das. Sie behauptet nicht, Gedanken oder langfristige Absichten der Engine zu kennen.

**Beispielvariante berechnen** lässt Stockfish eine mögliche Folge mit Gegenwehr berechnen (bis zu sechs Halbzüge). Mit Weiter/Zurück wird diese auf dem Brett abgespielt und erklärt. Die echte Partie bleibt unverändert; „Zur Partie“ beendet die Ansicht. Während der Vorschau sind Züge und der Partie-Export gesperrt, damit Vorschau und echte Stellung nicht verwechselt werden.

## Nutzung

- Figur antippen, dann ein markiertes Zielfeld auswählen.
- Trainingsmodus und Gegnerstärke getrennt einstellen.
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

## Grenzen

Du spielst Weiß. Kein Login, kein Sprachchat, kein vollständiges automatisches Partie-Review und keine automatische Gerätesynchronisierung. Die Erklärungen sind regelbasiert, kein freies Gespräch. Es gibt keine Garantie, dass alle taktischen Drohungen erkannt werden; eine Beispielvariante ist keine Vorhersage. Ein Engine-Ladefehler wird angezeigt und kann durch Neuladen nach Wiederherstellung der Verbindung behoben werden.

## Darkmode

Oben rechts wechselt die Schaltfläche „Dunkel“/„Hell“ das Erscheinungsbild sofort, auch während einer Partie. Hintergrund, Karten, Eingaben und Hinweise passen sich an; die bewährten Brett- und Figurenfarben bleiben gut unterscheidbar. Ohne gespeicherte Auswahl gilt die Systemeinstellung. Deine Auswahl wird getrennt von der Partie lokal gespeichert.
