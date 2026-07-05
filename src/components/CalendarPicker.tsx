import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { de } from "date-fns/locale";
import { format, isBefore, startOfDay } from "date-fns";
import { motion } from "framer-motion";
import "react-day-picker/style.css";

interface CalendarPickerProps {
  onConfirm: (date: Date, note: string) => void;
}

export function CalendarPicker({ onConfirm }: CalendarPickerProps) {
  const [selected, setSelected] = useState<Date | undefined>();
  const [note, setNote] = useState("");
  const today = startOfDay(new Date());
  const minDate = startOfDay(new Date(2026, 6, 6)); // 6. Juli 2026

  const disabledDays = (date: Date) =>
    isBefore(startOfDay(date), minDate) || isBefore(startOfDay(date), today);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="calendar-picker"
      style={{ textAlign: "center" }}
    >
      <p
        style={{
          fontFamily: "var(--font-marker)",
          color: "var(--scam-yellow)",
          fontSize: "clamp(0.95rem, 2.5vw, 1.15rem)",
          marginBottom: "1rem",
        }}
      >
        🐨 Wann passt es dir, Vonnilein?
      </p>

      <div
        style={{
          display: "inline-block",
          background: "rgba(0,0,0,0.4)",
          padding: "1rem",
          borderRadius: "8px",
          border: "2px dashed var(--scam-pink)",
        }}
      >
        <DayPicker
          mode="single"
          selected={selected}
          onSelect={setSelected}
          locale={de}
          disabled={disabledDays}
          defaultMonth={minDate}
          weekStartsOn={1}
        />
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Falls du magst: Wünsche, No-Gos, Snack-Träume… 🦙"
        rows={3}
        style={{
          width: "100%",
          maxWidth: 360,
          marginTop: "1rem",
          padding: "0.75rem",
          borderRadius: 6,
          border: "2px solid var(--scam-purple)",
          background: "rgba(0,0,0,0.5)",
          color: "#fff",
          fontFamily: "var(--font-body)",
          fontSize: "0.95rem",
          resize: "vertical",
        }}
      />

      <button
        type="button"
        className="scam-btn scam-btn--confirm"
        disabled={!selected}
        onClick={() => selected && onConfirm(selected, note)}
        style={{
          marginTop: "1.25rem",
          opacity: selected ? 1 : 0.5,
          cursor: selected ? "pointer" : "not-allowed",
        }}
      >
        📅 Termin vorschlagen
      </button>

      {selected && (
        <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "#ccc" }}>
          Gewünschter Termin:{" "}
          <strong style={{ color: "var(--scam-green)" }}>
            {format(selected, "EEEE, d. MMMM yyyy", { locale: de })}
          </strong>
        </p>
      )}
    </motion.div>
  );
}
