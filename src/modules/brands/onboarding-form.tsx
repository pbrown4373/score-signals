"use client";

import { useActionState, useState } from "react";

import { bootstrapBrandBrainAction } from "@/modules/brands/actions";
import { initialBrandActionState } from "@/modules/brands/action-state";
import {
  SelectField,
  TextAreaField,
  TextField,
} from "@/modules/brands/form-controls";

const steps = [
  "Brand",
  "Product",
  "Persona",
  "Voice & proof",
  "Restrictions",
] as const;

export function OnboardingForm() {
  const [step, setStep] = useState(0);
  const [state, action, pending] = useActionState(
    bootstrapBrandBrainAction,
    initialBrandActionState,
  );

  return (
    <form action={action} className="mt-8">
      <ol
        aria-label="Brand Brain setup progress"
        className="grid gap-2 sm:grid-cols-5"
      >
        {steps.map((label, index) => (
          <li
            className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
              index === step
                ? "border-[var(--accent)] bg-white text-[var(--accent)]"
                : "border-[var(--line)] text-[var(--muted)]"
            }`}
            key={label}
          >
            <button
              aria-current={index === step ? "step" : undefined}
              className="w-full text-left"
              onClick={() => setStep(index)}
              type="button"
            >
              <span className="block text-xs font-normal">
                Step {index + 1}
              </span>
              {label}
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-3xl border border-[var(--line)] bg-white p-6 shadow-sm sm:p-8">
        <WizardStep
          description="Start with enough context to make later creative work brand-specific."
          hidden={step !== 0}
          title="Tell us about the brand"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              error={state.fieldErrors?.brandName}
              id="onboarding-brand-name"
              label="Brand name"
              name="brand_name"
            />
            <TextField
              error={state.fieldErrors?.websiteUrl}
              id="onboarding-website"
              label="Website (optional)"
              name="website_url"
              placeholder="https://example.com"
              type="url"
            />
            <TextField
              error={state.fieldErrors?.category}
              id="onboarding-category"
              label="Category"
              name="category"
            />
          </div>
          <TextAreaField
            error={state.fieldErrors?.description}
            id="onboarding-description"
            label="Brand description"
            name="description"
            placeholder="What does the brand sell, for whom, and why does it matter?"
          />
        </WizardStep>

        <WizardStep
          description="Add a starting product and offer, or continue and add these later."
          hidden={step !== 1}
          title="Define the first product"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              error={state.fieldErrors?.productName}
              id="onboarding-product-name"
              label="Product name (optional)"
              name="product_name"
            />
            <TextField
              error={state.fieldErrors?.priceDescription}
              id="onboarding-price"
              label="Price description"
              name="price_description"
              placeholder="$49, from $20/month, or similar"
            />
          </div>
          <TextAreaField
            error={state.fieldErrors?.productDescription}
            id="onboarding-product-description"
            label="Product description"
            name="product_description"
          />
          <TextAreaField
            error={state.fieldErrors?.offer}
            id="onboarding-offer"
            label="Offer details"
            name="offer"
          />
        </WizardStep>

        <WizardStep
          description="Capture the pains, desires, and objections that should shape future concepts."
          hidden={step !== 2}
          title="Describe the first persona"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              error={state.fieldErrors?.personaName}
              id="onboarding-persona-name"
              label="Persona name (optional)"
              name="persona_name"
            />
            <TextField
              error={state.fieldErrors?.awarenessStage}
              id="onboarding-awareness"
              label="Awareness stage"
              name="awareness_stage"
              placeholder="Problem aware"
            />
          </div>
          <TextAreaField
            error={state.fieldErrors?.personaDescription}
            id="onboarding-persona-description"
            label="Persona description"
            name="persona_description"
          />
          <div className="grid gap-5 sm:grid-cols-3">
            <TextAreaField
              error={state.fieldErrors?.personaPains}
              help="One item per line."
              id="onboarding-pains"
              label="Pains"
              name="persona_pains"
            />
            <TextAreaField
              error={state.fieldErrors?.personaDesires}
              help="One item per line."
              id="onboarding-desires"
              label="Desires"
              name="persona_desires"
            />
            <TextAreaField
              error={state.fieldErrors?.personaObjections}
              help="One item per line."
              id="onboarding-objections"
              label="Objections"
              name="persona_objections"
            />
          </div>
        </WizardStep>

        <WizardStep
          description="Ground future creative in the brand's voice and substantiated proof."
          hidden={step !== 3}
          title="Set voice and proof"
        >
          <TextAreaField
            error={state.fieldErrors?.voice}
            id="onboarding-voice"
            label="Brand voice (optional)"
            name="voice"
            placeholder="Clear, warm, skeptical of hype…"
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              error={state.fieldErrors?.proofLabel}
              id="onboarding-proof-label"
              label="Proof label (optional)"
              name="proof_label"
              placeholder="Customer survey"
            />
            <TextField
              error={state.fieldErrors?.proofSource}
              id="onboarding-proof-source"
              label="Source note"
              name="proof_source"
            />
          </div>
          <TextAreaField
            error={state.fieldErrors?.proofDetail}
            id="onboarding-proof-detail"
            label="Proof detail"
            name="proof_detail"
          />
        </WizardStep>

        <WizardStep
          description="Record claims, language, and compliance rules that future composition must obey."
          hidden={step !== 4}
          title="Add a restriction"
        >
          <SelectField
            defaultValue="PROHIBITED_CLAIM"
            error={state.fieldErrors?.restrictionType}
            id="onboarding-restriction-type"
            label="Restriction type"
            name="restriction_type"
            options={restrictionOptions}
          />
          <TextAreaField
            error={state.fieldErrors?.restrictionValue}
            id="onboarding-restriction-value"
            label="Restriction (optional)"
            name="restriction_value"
            placeholder="Do not promise guaranteed results."
          />
          <TextAreaField
            error={state.fieldErrors?.restrictionNotes}
            id="onboarding-restriction-notes"
            label="Internal notes"
            name="restriction_notes"
            rows={3}
          />
        </WizardStep>

        {state.message ? (
          <p
            aria-live="polite"
            className={`mt-6 text-sm ${state.status === "error" ? "text-red-700" : "text-[var(--accent)]"}`}
            role={state.status === "error" ? "alert" : "status"}
          >
            {state.message}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-[var(--line)] pt-6">
          <button
            className="min-h-11 rounded-full border border-[var(--line)] px-5 py-2 font-semibold disabled:opacity-40"
            disabled={step === 0 || pending}
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            type="button"
          >
            Back
          </button>
          {step < steps.length - 1 ? (
            <button
              className="min-h-11 rounded-full bg-[var(--accent)] px-6 py-2 font-semibold text-white"
              key="continue"
              onClick={() =>
                setStep((current) => Math.min(steps.length - 1, current + 1))
              }
              type="button"
            >
              Continue
            </button>
          ) : (
            <button
              className="min-h-11 rounded-full bg-[var(--accent)] px-6 py-2 font-semibold text-white disabled:cursor-wait disabled:opacity-60"
              disabled={pending}
              key="complete"
              type="submit"
            >
              {pending ? "Saving Brand Brain…" : "Complete Brand Brain"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function WizardStep({
  children,
  description,
  hidden,
  title,
}: {
  children: React.ReactNode;
  description: string;
  hidden: boolean;
  title: string;
}) {
  return (
    <section className="space-y-5" hidden={hidden}>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 leading-7 text-[var(--muted)]">{description}</p>
      </div>
      {children}
    </section>
  );
}

export const restrictionOptions = [
  { label: "Prohibited claim", value: "PROHIBITED_CLAIM" },
  { label: "Required disclaimer", value: "REQUIRED_DISCLAIMER" },
  { label: "Tone or language", value: "TONE" },
  { label: "Competitor boundary", value: "COMPETITOR" },
  { label: "Other", value: "OTHER" },
] as const;
