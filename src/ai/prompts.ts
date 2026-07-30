import { env } from "@/lib/env";

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
- Rispondi SOLO con JSON valido conforme allo schema richiesto.
- Versione schema: ${env.knowledgeJsonVersion}`;
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
