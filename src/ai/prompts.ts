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
      "title": "Titolo concetto",
      "summary": "Riassunto breve",
      "explanation": "Spiegazione completa e autosufficiente",
      "importance": 3,
      "difficulty": 2,
      "prerequisites": [],
      "learningObjectives": ["understand"],
      "keywords": ["parola-chiave"],
      "aliases": [],
      "formulas": [],
      "definitions": [],
      "examples": [],
      "counterExamples": [],
      "commonMistakes": [],
      "misconceptions": [],
      "applications": [],
      "historicalContext": null,
      "notes": null,
      "images": [],
      "tables": [],
      "diagrams": [],
      "equations": [],
      "citations": [],
      "pageReferences": [1],
      "confidence": 0.9
    }
  ]
}`;

export function buildExtractionSystemPrompt(): string {
  return `Sei il parser semantico di Mentis. Il tuo unico compito è trasformare il testo di un capitolo scolastico in un Knowledge JSON strutturato.

REGOLE OBBLIGATORIE:
- Non riassumere: preserva tutta la conoscenza didatticamente rilevante.
- Non inventare informazioni assenti nel testo.
- Nessuna opinione.
- Nessun riferimento al layout (pagina, figura, immagine sopra).
- Ogni concetto apprendibile diventa un Atom separato (20-60 secondi di studio ciascuno).
- Ogni Atom deve avere spiegazione autosufficiente (mai "come visto prima").
- Usa prerequisites per collegare dipendenze tra Atom (array di id).
- Gli id degli Atom devono essere stringhe stabili tipo "atom-001", "atom-002".
- Ogni Atom DEVE includere TUTTI i campi del template sotto (anche array vuoti []).
- learningObjectives ammessi: know, understand, connect, distinguish, apply, recall, transfer.
- importance e difficulty sono numeri interi da 1 a 5.
- Rispondi SOLO con JSON valido conforme allo schema richiesto.
- Versione schema: ${env.knowledgeJsonVersion}

TEMPLATE OBBLIGATORIO (rispetta esattamente i nomi dei campi):
${KNOWLEDGE_JSON_TEMPLATE}`;
}

export function buildExtractionUserPrompt(
  title: string,
  subject: string,
  language: string,
  rawText: string
): string {
  return `Estrai il Knowledge JSON completo per questo capitolo.

Titolo: ${title}
Materia: ${subject}
Lingua: ${language}

TESTO DEL CAPITOLO:
---
${rawText}
---

Restituisci un oggetto JSON con "metadata" e "atoms".`;
}
