"use client";

import { useState } from "react";
import { deleteTimelineEvent } from "@/app/actions/admin-content";
import { TimelineEventForm, type TimelineEventRecord } from "./TimelineEventForm";

export function TimelineManager({
  caseId,
  events,
}: {
  caseId: string;
  events: TimelineEventRecord[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-3">
      {events.map((event) =>
        editingId === event.id ? (
          <div
            key={event.id}
            className="rounded-lg border border-accent bg-navy-900/60 p-4"
          >
            <TimelineEventForm
              caseId={caseId}
              event={event}
              onDone={() => setEditingId(null)}
            />
          </div>
        ) : (
          <div
            key={event.id}
            className="flex items-start justify-between gap-3 rounded-lg border border-line bg-navy-900/60 p-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-accent">
                  {event.timeLabel}
                </span>
                <span className="font-medium">{event.title}</span>
              </div>
              {event.locationLabel && (
                <p className="mt-1 text-sm text-ink-faint">
                  {event.locationLabel}
                </p>
              )}
              {event.involvedLabel && (
                <p className="mt-1 text-sm text-ink-faint">
                  Zúčastnění: {event.involvedLabel}
                </p>
              )}
              {event.description && (
                <p className="mt-1 text-sm text-ink-muted">
                  {event.description}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setEditingId(event.id)}
                aria-label={`Upravit ${event.title}`}
                className="text-ink-muted hover:text-white"
              >
                Upravit
              </button>
              <form action={deleteTimelineEvent.bind(null, caseId, event.id)}>
                <button
                  type="submit"
                  aria-label={`Smazat ${event.title}`}
                  className="text-danger hover:text-danger/80"
                >
                  Smazat
                </button>
              </form>
            </div>
          </div>
        ),
      )}

      {adding ? (
        <div className="rounded-lg border border-accent bg-navy-900/60 p-4">
          <TimelineEventForm caseId={caseId} onDone={() => setAdding(false)} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded border border-dashed border-line px-3 py-2 text-sm text-ink-muted hover:border-accent hover:text-accent"
        >
          + Přidat událost
        </button>
      )}
    </div>
  );
}
