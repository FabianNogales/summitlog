import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { getRecordedTripDetailById } from "../services/history.service";
import {
  createJournal,
  getJournalByTripId,
  updateJournal,
} from "../services/journal.service";
import type { Journal, JournalVisibility } from "../types/journal";
import type { RecordedTrip } from "../types/trip";

export function useTripJournalEditor(tripId?: string) {
  const { user } = useAuth();

  const [trip, setTrip] = useState<RecordedTrip | null>(null);
  const [journal, setJournal] = useState<Journal | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<JournalVisibility>("private");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEditorData = useCallback(async () => {
    if (!tripId || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [loadedTrip, loadedJournal] = await Promise.all([
        getRecordedTripDetailById(tripId, user.id),
        getJournalByTripId(tripId, user.id),
      ]);

      setTrip(loadedTrip);
      setJournal(loadedJournal);

      if (loadedJournal) {
        setTitle(loadedJournal.title ?? "");
        setContent(loadedJournal.content ?? "");
        setVisibility(loadedJournal.visibility);
      } else {
        setTitle("");
        setContent("");
        setVisibility("private");
      }
    } catch (err: any) {
      setError(err.message ?? "No se pudo cargar la bitácora");
    } finally {
      setLoading(false);
    }
  }, [tripId, user]);

  useEffect(() => {
    loadEditorData();
  }, [loadEditorData]);

  async function saveJournal() {
    if (!user) {
      throw new Error("Debes iniciar sesión.");
    }

    if (!tripId) {
      throw new Error("No se encontró el recorrido.");
    }

    if (!trip) {
      throw new Error("No se pudo cargar el recorrido.");
    }

    if (trip.status !== "completed") {
      throw new Error(
        "Solo puedes crear una bitácora de un recorrido completado.",
      );
    }

    if (!title.trim()) {
      throw new Error("El título es obligatorio.");
    }

    if (!content.trim()) {
      throw new Error("El contenido es obligatorio.");
    }

    try {
      setSaving(true);

      if (journal) {
        const updatedJournal = await updateJournal({
          journalId: journal.id,
          title: title.trim(),
          content: content.trim(),
          visibility,
        });

        setJournal(updatedJournal);
        return updatedJournal;
      } else {
        const createdJournal = await createJournal({
          userId: user.id,
          recordedTripId: tripId,
          title: title.trim(),
          content: content.trim(),
          visibility,
        });

        setJournal(createdJournal);
        return createdJournal;
      }
    } finally {
      setSaving(false);
    }
  }

  return {
    trip,
    journal,
    title,
    content,
    visibility,
    loading,
    saving,
    error,
    setTitle,
    setContent,
    setVisibility,
    saveJournal,
    refreshEditor: loadEditorData,
  };
}
