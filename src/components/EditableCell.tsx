import { useState, useRef, useEffect } from "react";

interface EditableCellProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  type?: "text" | "textarea";
  placeholder?: string;
  displayClass?: string;
}

export function EditableCell({ value, onSave, type = "text", placeholder, displayClass }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  function cancel() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDraft(value);
    setEditing(false);
  }

  async function save(val: string) {
    if (val === value) return;
    setSaving(true);
    try {
      await onSave(val);
    } catch {
      setDraft(value);
    } finally {
      setSaving(false);
    }
  }

  function handleDraftChange(newDraft: string) {
    setDraft(newDraft);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (newDraft !== value) {
      timerRef.current = setTimeout(() => save(newDraft), 500);
    }
  }

  function handleBlur() {
    if (timerRef.current) clearTimeout(timerRef.current);
    save(draft).finally(() => setEditing(false));
  }

  if (!editing) {
    return (
      <span
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        className={`cursor-pointer rounded px-1 -mx-1 transition-colors hover:bg-accent/50 ${displayClass || ""}`}
        title="Clique para editar"
      >
        {value || placeholder || "-"}
        {saving && <span className="ml-1.5 text-[10px] italic text-muted-foreground/60">salvando...</span>}
      </span>
    );
  }

  const baseClass =
    "w-full rounded border border-primary/40 bg-background px-2 py-1 text-xs outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20";

  if (type === "textarea") {
    return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={draft}
        onChange={(e) => handleDraftChange(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => { if (e.key === "Escape") cancel(); e.stopPropagation(); }}
        rows={2}
        className={baseClass}
        placeholder={placeholder}
        disabled={saving}
      />
    );
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type="text"
      value={draft}
      onChange={(e) => handleDraftChange(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === "Escape") cancel();
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        e.stopPropagation();
      }}
      className={baseClass}
      placeholder={placeholder}
      disabled={saving}
    />
  );
}
