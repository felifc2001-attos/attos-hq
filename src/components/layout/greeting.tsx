"use client";

import { useSyncExternalStore } from "react";

const TIME_ZONE = "America/Argentina/Buenos_Aires";

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 60_000);
  return () => clearInterval(id);
}

function getHour() {
  const hour = new Intl.DateTimeFormat("es-AR", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone: TIME_ZONE,
  }).format(new Date());
  return Number(hour);
}

function getDateLabel() {
  const label = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TIME_ZONE,
  }).format(new Date());
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function greetingFor(hour: number) {
  if (hour < 0) return "Hola";
  if (hour < 12) return "Buenos días";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

export function Greeting({ name }: { name: string }) {
  const hour = useSyncExternalStore(subscribe, getHour, () => -1);
  const dateLabel = useSyncExternalStore(subscribe, getDateLabel, () => "");

  return (
    <div className="mb-8">
      <p className="h-5 text-sm font-semibold uppercase tracking-widest text-bordo-mid">
        {dateLabel}
      </p>
      <h1 className="mt-1 font-display text-4xl font-semibold text-ink sm:text-5xl">
        {greetingFor(hour)}, {name} <span aria-hidden>👋</span>
      </h1>
    </div>
  );
}
