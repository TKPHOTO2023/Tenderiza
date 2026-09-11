import { Mail } from "lucide-react";
import { ContactForm } from "./contact-form";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#007A4D]">Contact us</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
            Questions before you start?
          </h1>
          <p className="mt-4 text-slate-500">
            Whether it&apos;s about pricing, a specific tender type, or how the AI drafting actually works —
            send us a message and a real person will get back to you.
          </p>
          <div className="mt-8 flex items-center gap-3 text-sm text-slate-600">
            <Mail className="h-4 w-4 text-[#007A4D]" />
            hello@tenderiza.co.za
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 p-6 shadow-sm sm:p-8">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
