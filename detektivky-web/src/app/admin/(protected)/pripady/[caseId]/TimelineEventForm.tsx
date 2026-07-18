"use client";

import { useActionState, useEffect } from "react";
import {
  createTimelineEvent,
  updateTimelineEvent,
  type ContentFormState,
} from "@/app/actions/admin-content";

export type TimelineEventRecord = {
  id: string;
  timeLabel: string;
  title: string;
  description: string | null;
  locationLabel: string | null;
  involvedLabel: string | null;
};

export function TimelineEventForm({
  caseId,
  event,
  onDone,
}: {
  caseId: string;
  event?: TimelineEventRecord;
  onDone?: () => void;
}) {
  const action = event ? updateTimelineEvent : createTimelineEvent;
  const [state, formAction, pending] = useActionState<
    ContentFormState,
    FormData
  >(action, undefined);

  useEffect(() => {
    if (state?.ok) onDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="caseId" value={caseId} />
      {event && (
        <input type="hidden" name="timelineEventId" value={event.id} />
      )}

      <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-muted">Čas</label>
          <input
            name="timeLabel"
            required
            placeholder="22:00"
            defaultValue={event?.timeLabel}
            className="rounded border border-line bg-navy-900 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-muted">Událost</label>
          <input
            name="title"
            required
            defaultValue={event?.title}
            className="rounded border border-line bg-navy-900 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-muted">
            Místo (nepovinné)
          </label>
          <input
            name="locationLabel"
            defaultValue={event?.locationLabel ?? ""}
            className="rounded border border-line bg-navy-900 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-muted">
            Zúčastněné osoby (nepovinné)
          </label>
          <input
            name="involvedLabel"
            defaultValue={event?.involvedLabel ?? ""}
            className="rounded border border-line bg-navy-900 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-muted">Popis (nepovinné)</label>
        <textarea
          name="description"
          rows={2}
          defaultValue={event?.description ?? ""}
          className="rounded border border-line bg-navy-900 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
        />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-accent px-3 py-1.5 text-sm font-semibold text-navy-950 hover:bg-accent/90 disabled:opacity-60"
        >
          {pending ? "Ukládám…" : event ? "Uložit změny" : "Přidat událost"}
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="rounded border border-line px-3 py-1.5 text-sm hover:border-ink-faint"
          >
            Zrušit
          </button>
        )}
      </div>
    </form>
  );
}
