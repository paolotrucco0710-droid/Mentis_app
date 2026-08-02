import { env } from "@/lib/env";

const KNOWLEDGE_JSON_TEMPLATE = `{
  "metadata": {
    "documentId": "doc-001",
    "title": "Titolo capitolo",
    "subject": "Materia",
    "language": "it",
    "estimatedReadingTimeMinutes": 10,
    "estimatedStudyTimeMinutes": 20,
    "chapterNumber": 1,
    "sourcePages": 2,
    "generatedAt": "2026-01-01T00:00:00.000Z",
    "version": "${env.knowledgeJsonVersion}"
  },
  "atoms": [
    {
      "id": "atom-001",
      "title": "Reconquista",
      "summary": "La Reconquista è il graduale arretramento musulmano dalla Penisola Iberica tra XI e XII secolo.",
      "explanation": "Processo lungo e non coordinato. I regni cristiani del nord avanzarono gradualmente. Non fu una singola campagna militare pianificata.",
      "importance": 4,
      "difficulty": 2,
      "prerequisites": [],
      "learningObjectives": ["understand", "recall"],
      "keywords": ["Reconquista", "Penisola Iberica"],
      "aliases": [],
      "formulas": [],
      "definitions": [
        "La Reconquista è il graduale arretramento del dominio musulmano nella Penisola Iberica."
      ],
      "examples": [],
      "counterExamples": [],
      "commonMistakes": [
        "Pensare che la Reconquista fosse un'unica campagna militare coordinata fin dall'inizio."
      ],
      "misconceptions": [
        "La Reconquista fu pianificata come crociata unica contro i musulmani."
      ],
      "applications": [],
      "historicalContext": null,
      "notes": null,
      "images": [],
      "tables": [],
      "diagrams": [],
      "equations": [],
      "citations": [],
      "pageReferences": [1],
      "confidence": 0.9,
      "quizDistractors": [
        "La Reconquista fu una singola campagna militare pianificata fin dall'inizio.",
        "Il termine Reconquista fu usato già nel IX secolo dai regni cristiani.",
        "La Reconquista riguardò solo la Catalogna e non altre regioni della penisola."
      ]
    }
  ]
}`;

export function buildExtractionSystemPrompt(): string {
  return `Sei il parser semantico di Mentis. Trasformi il testo di un capitolo scolastico in un Knowledge JSON per un feed di studio stile flashcard (una card = un concetto, testo breve).

OBIETTIVO
- Ogni Atom è la più piccola unità indipendente di conoscenza: UNA sola idea.
- Mai due idee nello stesso Atom. Mai un paragrafo intero. Mai un argomento del capitolo.
- Se un concetto si può dividere in due fatti distinti, crea due Atom separati.

GRANULARITÀ (CRITICO)
- Un Atom deve essere spiegabile in 20-60 secondi (circa 1-3 frasi nell'explanation).
- Per 2 pagine di testo scolastico, punta a 8-15 Atom, non 3-6 macro-blocchi.
- NON creare Atom con titoli meta o da manuale, ad esempio VIETATI:
  "Contesto di...", "Ruolo di...", "Origine e propaganda del...", "Formazione dei...",
  "Prima fase di...", "Introduzione a...", "Aspetti della...".
- Il titolo del capitolo (es. "La Reconquista") NON è un Atom: scomponilo in fatti atomici.

TITOLO (title)
- Massimo 6 parole. Nome del concetto, non una frase.
- Esempi BUONI: "Reconquista", "Nome Castiglia", "Regni cristiani del nord", "Guerra santa in Spagna".
- Esempi CATTIVI: "Contesto della Reconquista", "Ruolo della propaganda nella Reconquista".

SUMMARY
- Esattamente 1 frase breve (max 120 caratteri). È il testo principale della Learn Card.
- DEVE nominare il concetto (usa il title o un suo alias chiaro nella frase).
- Esempio BUONO: "La Reconquista è il graduale arretramento musulmano dalla Penisola Iberica."
- Esempio CATTIVO: "Processo di arretramento musulmano dalla Penisola Iberica tra XI e XII secolo." (manca il nome del concetto)

EXPLANATION
- Massimo 3 frasi brevi. Espande la definizione con contesto essenziale.
- Autosufficiente: mai "come visto prima" o "come detto sopra".
- NON ripetere nelle explanation ciò che va in definitions, examples o historicalContext.

DEFINITIONS (OBBLIGATORIO: almeno 1)
- Una definizione chiara e semplice del concetto (max 25 parole).
- Usata per quiz e verifica: deve essere una risposta corretta autonoma.

EXAMPLES
- Almeno 1 esempio concreto quando il testo ne contiene (data, evento, caso, luogo).
- Frasi brevi, non paragrafi.

COMMONMISTAKES e MISCONCEPTIONS
- 1-2 errori reali che uno studente potrebbe fare, formulati come credenza falsa.
- Devono essere DISTINTI tra Atom diversi: non copiare la stessa frase su più Atom.
- commonMistakes: errore tipico in forma diretta ("Pensare che...", "Confondere X con Y") — NON usarli come opzioni quiz.
- misconceptions: falsa credenza da correggere (usata per vero/falso).

QUIZDISTRACTORS (OBBLIGATORIO: esattamente 3)
- Tre affermazioni FALSE ma plausibili sullo stesso concetto.
- Devono essere frasi dichiarative complete, non meta-frasi ("Pensare che...", "Affermazione non corretta...").
- Devono essere diverse dal summary e tra loro.
- Servono per le opzioni sbagliate del quiz a scelta multipla.

KEYWORDS
- 2-5 termini rilevanti per questo Atom specifico.

PREREQUISITI
- Collega dipendenze logiche: il concetto base prima, quello derivato dopo.
- Gli id sono "atom-001", "atom-002", ... in ordine di apprendimento.

NON RIDONDANZA
- Ogni fatto del capitolo appartiene a UN solo Atom.
- Se due Atom parlano della propaganda del XVI secolo, hai sbagliato granularità: uniscili o separa i fatti.

ALTRI CAMPI
- historicalContext: solo contesto storico secondario, non duplicare explanation.
- images/tables/diagrams: lascia [] (le immagini vengono collegate separatamente).
- Non inventare informazioni assenti nel testo. Nessuna opinione.
- Ogni Atom DEVE includere TUTTI i campi del template (array vuoti [] se non applicabile).
- learningObjectives: 1-2 tra know, understand, connect, distinguish, apply, recall, transfer.
- importance e difficulty: interi 1-5.
- Rispondi SOLO con JSON valido.
- Versione schema: ${env.knowledgeJsonVersion}

ESEMPIO DI ATOM CORRETTO (segui questo stile):
${KNOWLEDGE_JSON_TEMPLATE}`;
}

export function buildExtractionUserPrompt(
  title: string,
  subject: string,
  language: string,
  rawText: string
): string {
  return `Estrai il Knowledge JSON per questo capitolo.

Titolo capitolo: ${title}
Materia: ${subject}
Lingua: ${language}

ISTRUZIONI FINALI:
1. Scomponi il capitolo in Atom piccoli (una idea ciascuno), non in sezioni del libro.
2. Ogni Atom: title corto, summary 1 frase, explanation max 3 frasi, definitions con almeno 1 voce.
3. Compila examples, quizDistractors (3 opzioni false) e commonMistakes/misconceptions.
4. Evita titoli "Contesto di..." o "Ruolo di...".

TESTO DEL CAPITOLO:
---
${rawText}
---

Restituisci un oggetto JSON con "metadata" e "atoms".`;
}
