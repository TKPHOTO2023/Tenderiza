import { Mail, MapPin, Clock } from "lucide-react";
import { FlagRule } from "@/components/marketing/flag";
import { ContactForm } from "./contact-form";

export default function ContactPage() {
  return (
    <>
      <section className="bg-[var(--field)]">
        <div className="mx-auto max-w-[1240px] px-5 py-14">
          <p className="field-label text-[var(--gold)]">Contact us</p>
          <h1 className="display mt-4 max-w-[16ch] text-[clamp(2.4rem,5.2vw,3.6rem)] uppercase text-white">
            Talk to a person
          </h1>
          <p className="mt-4 max-w-[56ch] text-[17px] leading-relaxed text-white/65">
            Questions about pricing, a specific tender type, or how the drafting actually works — send it
            through and we&apos;ll come back to you.
          </p>
        </div>
        <FlagRule />
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-16">
        <div className="grid gap-px border border-[var(--rule)] bg-[var(--rule)] lg:grid-cols-[1fr_1.4fr]">
          <div className="bg-[var(--paper-2)] p-8">
            <p className="field-label text-[var(--green)]">Details</p>
            <dl className="mt-6 grid gap-6">
              {[
                { icon: Mail, label: "Email", value: "hello@tenderiza.co.za" },
                { icon: MapPin, label: "Based in", value: "South Africa" },
                { icon: Clock, label: "Response time", value: "1 business day" },
              ].map((item) => (
                <div key={item.label} className="flex gap-3">
                  <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--field)]" />
                  <div>
                    <dt className="field-label text-[var(--ink-2)]">{item.label}</dt>
                    <dd className="mt-1 text-[15px] font-medium text-[var(--ink)]">{item.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          <div className="bg-white p-8">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
