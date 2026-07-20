import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { requestBooking } from "../lib/api/forms.functions";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services: Agent Garage" },
      {
        name: "description",
        content:
          "Bring your build in: diagnostic calls, focused build sprints, and ongoing support for your agents and automations.",
      },
    ],
    links: [{ rel: "canonical", href: "https://agent-garage.higgsfield.app/services" }],
  }),
  component: ServicesPage,
});

const services = [
  {
    id: "diagnostic-call",
    name: "Diagnostic call",
    duration: "30 MIN",
    price: "$0",
    icon: "/assets/icons/icon-calendar.png",
    body: "A video call about the thing that is not working: an agent that hallucinates, an automation that silently dies, a self-hosted box that will not behave. You leave with a diagnosis and a plan, whether or not we work together after.",
  },
  {
    id: "build-sprint",
    name: "Build sprint",
    duration: "5 DAYS",
    price: "$2,500",
    icon: "/assets/icons/icon-wrench.png",
    body: "One focused week on your project. We scope it on Monday, build through the week, and hand over working code, documentation, and a session walking through every piece.",
  },
  {
    id: "ongoing-support",
    name: "Ongoing support",
    duration: "MONTHLY",
    price: "$900/mo",
    icon: "/assets/icons/icon-terminal.png",
    body: "Your systems stay serviced. Updates when dependencies move, fixes when something breaks, and a small improvement shipped every month. Cancel whenever.",
  },
] as const;

function ServicesPage() {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState("busy");
    try {
      const res = await requestBooking({
        data: {
          name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          service: String(fd.get("service") ?? "diagnostic-call") as
            | "diagnostic-call"
            | "build-sprint"
            | "ongoing-support",
          notes: String(fd.get("notes") ?? ""),
        },
      });
      if (res.ok) setState("done");
      else {
        setError(res.error);
        setState("error");
      }
    } catch {
      setError("Something went wrong. Try again.");
      setState("error");
    }
  }

  return (
    <main className="px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-5xl">
        <h1 className="max-w-lg text-4xl font-bold tracking-tighter text-ink md:ml-16 md:text-6xl">
          Bring your build in.
        </h1>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-ink/70 md:ml-16">
          Sometimes you want a tutorial. Sometimes you want a second pair of hands on the bench.
        </p>

        <div className="mt-12 border-t border-ink/25">
          {services.map((s) => (
            <div
              key={s.id}
              className="grid gap-4 border-b border-ink/25 py-8 md:grid-cols-[48px_1fr_auto]"
            >
              <img src={s.icon} alt="" className="h-9 w-9 mix-blend-multiply" />
              <div>
                <div className="flex flex-wrap items-baseline gap-4">
                  <h2 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">
                    {s.name}
                  </h2>
                  <span className="font-plex text-xs text-steel">{s.duration}</span>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/70">{s.body}</p>
              </div>
              <span className="text-xl font-semibold text-cobalt md:text-2xl">{s.price}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 font-plex text-xs text-steel">No retainers. No surprises. Pricing in USD.</p>

        <div className="mt-20 grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <img
              src="/assets/services-hands.png"
              alt="Hands at a workshop keyboard surrounded by precision tools"
              className="w-full object-cover"
            />
          </div>
          <div className="md:col-span-7">
            <h2 className="text-3xl font-bold tracking-tighter text-ink md:text-4xl">
              Book a session
            </h2>
            {state === "done" ? (
              <div className="mt-8 border border-ink/25 bg-paper-deep p-8">
                <p className="text-lg font-semibold text-ink">Request received.</p>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">
                  You will get a reply within two working days with times and next steps.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-8 space-y-5">
                <Field label="Your name" name="name" type="text" required />
                <Field label="Email" name="email" type="email" required />
                <div>
                  <label
                    htmlFor="svc"
                    className="block font-plex text-xs uppercase tracking-wide text-ink/70"
                  >
                    Session
                  </label>
                  <select
                    id="svc"
                    name="service"
                    className="mt-2 w-full border border-ink/30 bg-paper px-4 py-3 font-plex text-sm text-ink focus:border-cobalt focus:outline-none"
                  >
                    <option value="diagnostic-call">Diagnostic call (30 min, $0)</option>
                    <option value="build-sprint">Build sprint (5 days, $2,500)</option>
                    <option value="ongoing-support">Ongoing support ($900/mo)</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="notes"
                    className="block font-plex text-xs uppercase tracking-wide text-ink/70"
                  >
                    What are we looking at?
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    className="mt-2 w-full border border-ink/30 bg-paper px-4 py-3 text-sm text-ink focus:border-cobalt focus:outline-none"
                  />
                </div>
                {state === "error" ? (
                  <p className="font-plex text-xs text-cobalt">{error}</p>
                ) : null}
                {/* Split/slide garment: the label slides up, its twin arrives from below. */}
                <button
                  type="submit"
                  disabled={state === "busy"}
                  className="group relative h-12 w-full overflow-hidden bg-ink font-plex text-sm font-medium text-paper disabled:opacity-60"
                >
                  <span className="absolute inset-0 flex items-center justify-center transition-transform duration-300 group-hover:-translate-y-full motion-reduce:transition-none">
                    {state === "busy" ? "Sending" : "Request the session"}
                  </span>
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 flex translate-y-full items-center justify-center bg-cobalt transition-transform duration-300 group-hover:translate-y-0 motion-reduce:transition-none"
                  >
                    {state === "busy" ? "Sending" : "Request the session"}
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  type,
  required,
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={`f-${name}`}
        className="block font-plex text-xs uppercase tracking-wide text-ink/70"
      >
        {label}
      </label>
      <input
        id={`f-${name}`}
        name={name}
        type={type}
        required={required}
        className="mt-2 w-full border border-ink/30 bg-paper px-4 py-3 text-sm text-ink focus:border-cobalt focus:outline-none"
      />
    </div>
  );
}
