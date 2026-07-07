import { Mail } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | TherapistCEU.com",
  description: "Get in touch with the TherapistCEU team.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-32">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Contact Us
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Have a question or need help? We'd love to hear from you.
        </p>
      </div>

      <div className="mt-16 rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-12">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">Email us</h3>
            <p className="mt-2 text-muted-foreground">
              For support, feedback, or any other inquiries, please reach out to us at:
            </p>
            <a
              href="mailto:support@therapistceu.com"
              className="mt-4 inline-block text-lg font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
            >
              support@therapistceu.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
