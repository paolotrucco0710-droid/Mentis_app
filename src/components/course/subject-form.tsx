"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { SUBJECT_COLORS, SUBJECT_ICONS } from "./course-utils";

export function SubjectForm({
  onSubmit,
  loading = false,
}: {
  onSubmit: (input: { name: string; color: string; icon: string }) => void;
  loading?: boolean;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(SUBJECT_COLORS[0]);
  const [icon, setIcon] = useState<string>(SUBJECT_ICONS[0]);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!name.trim()) {
          return;
        }
        onSubmit({ name: name.trim(), color, icon });
      }}
    >
      <Input
        label="Nome materia"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Es. Matematica"
        required
      />

      <div className="space-y-2">
        <p className="text-sm font-medium">Colore</p>
        <div className="flex flex-wrap gap-2">
          {SUBJECT_COLORS.map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`Colore ${value}`}
              className={`h-8 w-8 rounded-full border-2 ${
                color === value ? "border-foreground" : "border-transparent"
              }`}
              style={{ backgroundColor: value }}
              onClick={() => setColor(value)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Icona</p>
        <div className="flex flex-wrap gap-2">
          {SUBJECT_ICONS.map((value) => (
            <button
              key={value}
              type="button"
              className={`rounded-xl border px-3 py-2 text-sm capitalize ${
                icon === value
                  ? "border-primary bg-accent"
                  : "border-border hover:bg-accent/50"
              }`}
              onClick={() => setIcon(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={loading || !name.trim()}>
        Crea materia
      </Button>
    </form>
  );
}
