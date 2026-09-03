"use client";

import { useActionState, useEffect, useRef } from "react";

import type { BrandActionState } from "@/modules/brands/action-state";
import { initialBrandActionState } from "@/modules/brands/action-state";
import {
  createBrandAction,
  createPersonaAction,
  createProductAction,
  createProofPointAction,
  createRestrictionAction,
  deleteBrandAction,
  deletePersonaAction,
  deleteProductAction,
  deleteProofPointAction,
  deleteRestrictionAction,
  updateBrandAction,
  updatePersonaAction,
  updateProductAction,
  updateProofPointAction,
  updateRestrictionAction,
} from "@/modules/brands/actions";
import {
  SelectField,
  TextAreaField,
  TextField,
} from "@/modules/brands/form-controls";
import { restrictionOptions } from "@/modules/brands/onboarding-form";
import type {
  BrandBrain,
  Persona,
  Product,
  ProofPoint,
  Restriction,
} from "@/modules/brands/repository";
import {
  readJsonDescription,
  readJsonSummary,
  readStringList,
} from "@/modules/brands/repository";

type Action = (
  state: BrandActionState,
  formData: FormData,
) => Promise<BrandActionState>;

export function CreateBrandForm() {
  return (
    <ManagedForm action={createBrandAction} submitLabel="Create brand">
      {(errors) => <BrandFields errors={errors} prefix="create-brand" />}
    </ManagedForm>
  );
}

export function BrandBrainEditor({
  brain,
  canWrite,
}: {
  brain: BrandBrain;
  canWrite: boolean;
}) {
  if (!canWrite) return <ReadOnlyBrandBrain brain={brain} />;

  const { brand } = brain;
  return (
    <div className="space-y-10">
      <EditorSection
        description="Core identity and voice used by later composition workflows."
        title="Brand"
      >
        <ManagedForm
          action={updateBrandAction.bind(null, brand.id)}
          submitLabel="Save brand"
        >
          {(errors) => (
            <BrandFields
              brand={brand}
              errors={errors}
              prefix={`brand-${brand.id}`}
            />
          )}
        </ManagedForm>
      </EditorSection>

      <EntitySection
        addForm={
          <ManagedForm
            action={createProductAction.bind(null, brand.id)}
            resetOnSuccess
            submitLabel="Add product"
          >
            {(errors) => <ProductFields errors={errors} prefix="new-product" />}
          </ManagedForm>
        }
        description="Products, prices, and offers available to future concepts."
        empty="No products yet. Add the first product below."
        title="Products"
      >
        {brain.products.map((product) => (
          <EntityCard key={product.id} title={product.name}>
            <ManagedForm
              action={updateProductAction.bind(null, product.id, brand.id)}
              submitLabel="Update product"
            >
              {(errors) => (
                <ProductFields
                  errors={errors}
                  prefix={`product-${product.id}`}
                  product={product}
                />
              )}
            </ManagedForm>
            <DeleteForm
              action={deleteProductAction.bind(null, product.id, brand.id)}
              label={`Delete ${product.name}`}
            />
          </EntityCard>
        ))}
      </EntitySection>

      <EntitySection
        addForm={
          <ManagedForm
            action={createPersonaAction.bind(null, brand.id)}
            resetOnSuccess
            submitLabel="Add persona"
          >
            {(errors) => <PersonaFields errors={errors} prefix="new-persona" />}
          </ManagedForm>
        }
        description="Audience pains, desires, objections, and awareness."
        empty="No personas yet. Add the first audience profile below."
        title="Personas"
      >
        {brain.personas.map((persona) => (
          <EntityCard key={persona.id} title={persona.name}>
            <ManagedForm
              action={updatePersonaAction.bind(null, persona.id, brand.id)}
              submitLabel="Update persona"
            >
              {(errors) => (
                <PersonaFields
                  errors={errors}
                  persona={persona}
                  prefix={`persona-${persona.id}`}
                />
              )}
            </ManagedForm>
            <DeleteForm
              action={deletePersonaAction.bind(null, persona.id, brand.id)}
              label={`Delete ${persona.name}`}
            />
          </EntityCard>
        ))}
      </EntitySection>

      <EntitySection
        addForm={
          <ManagedForm
            action={createProofPointAction.bind(null, brand.id)}
            resetOnSuccess
            submitLabel="Add proof point"
          >
            {(errors) => <ProofFields errors={errors} prefix="new-proof" />}
          </ManagedForm>
        }
        description="Substantiated evidence that may support product claims."
        empty="No proof points yet. Add evidence future concepts may use."
        title="Proof points"
      >
        {brain.proofPoints.map((proof) => (
          <EntityCard key={proof.id} title={proof.label}>
            <ManagedForm
              action={updateProofPointAction.bind(null, proof.id, brand.id)}
              submitLabel="Update proof"
            >
              {(errors) => (
                <ProofFields
                  errors={errors}
                  prefix={`proof-${proof.id}`}
                  proof={proof}
                />
              )}
            </ManagedForm>
            <DeleteForm
              action={deleteProofPointAction.bind(null, proof.id, brand.id)}
              label={`Delete ${proof.label}`}
            />
          </EntityCard>
        ))}
      </EntitySection>

      <EntitySection
        addForm={
          <ManagedForm
            action={createRestrictionAction.bind(null, brand.id)}
            resetOnSuccess
            submitLabel="Add restriction"
          >
            {(errors) => (
              <RestrictionFields errors={errors} prefix="new-restriction" />
            )}
          </ManagedForm>
        }
        description="Hard guardrails that must reach the future composition context."
        empty="No restrictions yet. Add prohibited claims or required language."
        title="Restrictions"
      >
        {brain.restrictions.map((restriction) => (
          <EntityCard
            key={restriction.id}
            title={formatRestrictionType(restriction.restriction_type)}
          >
            <ManagedForm
              action={updateRestrictionAction.bind(
                null,
                restriction.id,
                brand.id,
              )}
              submitLabel="Update restriction"
            >
              {(errors) => (
                <RestrictionFields
                  errors={errors}
                  prefix={`restriction-${restriction.id}`}
                  restriction={restriction}
                />
              )}
            </ManagedForm>
            <DeleteForm
              action={deleteRestrictionAction.bind(
                null,
                restriction.id,
                brand.id,
              )}
              label="Delete restriction"
            />
          </EntityCard>
        ))}
      </EntitySection>

      <section className="rounded-3xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-xl font-semibold">Delete brand</h2>
        <p className="mt-2 text-sm leading-6 text-red-900">
          This permanently deletes the brand and its products, personas, proof,
          and restrictions.
        </p>
        <DeleteForm
          action={deleteBrandAction.bind(null, brand.id)}
          label={`Delete ${brand.name}`}
        />
      </section>
    </div>
  );
}

function ManagedForm({
  action,
  children,
  resetOnSuccess = false,
  submitLabel,
}: {
  action: Action;
  children: (
    errors: Record<string, string[] | undefined> | undefined,
  ) => React.ReactNode;
  resetOnSuccess?: boolean;
  submitLabel: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    action,
    initialBrandActionState,
  );

  useEffect(() => {
    if (resetOnSuccess && state.status === "success") formRef.current?.reset();
  }, [resetOnSuccess, state.status]);

  return (
    <form action={formAction} className="space-y-5" ref={formRef}>
      {children(state.fieldErrors)}
      {state.message ? (
        <p
          aria-live="polite"
          className={`text-sm ${state.status === "error" ? "text-red-700" : "text-[var(--accent)]"}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
      <button
        className="min-h-11 rounded-full bg-[var(--accent)] px-5 py-2 font-semibold text-white disabled:cursor-wait disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

function BrandFields({
  brand,
  errors,
  prefix,
}: {
  brand?: BrandBrain["brand"];
  errors?: Record<string, string[] | undefined>;
  prefix: string;
}) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          defaultValue={brand?.name}
          error={errors?.name}
          id={`${prefix}-name`}
          label="Brand name"
          name="name"
          required
        />
        <TextField
          defaultValue={brand?.website_url}
          error={errors?.websiteUrl}
          id={`${prefix}-website`}
          label="Website"
          name="website_url"
          type="url"
        />
        <TextField
          defaultValue={brand?.category}
          error={errors?.category}
          id={`${prefix}-category`}
          label="Category"
          name="category"
        />
      </div>
      <TextAreaField
        defaultValue={brand?.description}
        error={errors?.description}
        id={`${prefix}-description`}
        label="Description"
        name="description"
      />
      <TextAreaField
        defaultValue={brand ? readJsonDescription(brand.brand_voice) : ""}
        error={errors?.voice}
        id={`${prefix}-voice`}
        label="Brand voice"
        name="voice"
      />
    </>
  );
}

function ProductFields({
  errors,
  prefix,
  product,
}: {
  errors?: Record<string, string[] | undefined>;
  prefix: string;
  product?: Product;
}) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          defaultValue={product?.name}
          error={errors?.name}
          id={`${prefix}-name`}
          label="Product name"
          name="name"
          required
        />
        <TextField
          defaultValue={product?.price_description}
          error={errors?.priceDescription}
          id={`${prefix}-price`}
          label="Price description"
          name="price_description"
        />
      </div>
      <TextAreaField
        defaultValue={product?.description}
        error={errors?.description}
        id={`${prefix}-description`}
        label="Description"
        name="description"
      />
      <TextAreaField
        defaultValue={product ? readJsonSummary(product.offer_details) : ""}
        error={errors?.offer}
        id={`${prefix}-offer`}
        label="Offer details"
        name="offer"
      />
    </>
  );
}

function PersonaFields({
  errors,
  persona,
  prefix,
}: {
  errors?: Record<string, string[] | undefined>;
  persona?: Persona;
  prefix: string;
}) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          defaultValue={persona?.name}
          error={errors?.name}
          id={`${prefix}-name`}
          label="Persona name"
          name="name"
          required
        />
        <TextField
          defaultValue={persona?.awareness_stage}
          error={errors?.awarenessStage}
          id={`${prefix}-awareness`}
          label="Awareness stage"
          name="awareness_stage"
        />
      </div>
      <TextAreaField
        defaultValue={persona?.description}
        error={errors?.description}
        id={`${prefix}-description`}
        label="Description"
        name="description"
      />
      <div className="grid gap-5 sm:grid-cols-3">
        <TextAreaField
          defaultValue={persona ? readStringList(persona.pains).join("\n") : ""}
          error={errors?.pains}
          help="One item per line."
          id={`${prefix}-pains`}
          label="Pains"
          name="pains"
        />
        <TextAreaField
          defaultValue={
            persona ? readStringList(persona.desires).join("\n") : ""
          }
          error={errors?.desires}
          help="One item per line."
          id={`${prefix}-desires`}
          label="Desires"
          name="desires"
        />
        <TextAreaField
          defaultValue={
            persona ? readStringList(persona.objections).join("\n") : ""
          }
          error={errors?.objections}
          help="One item per line."
          id={`${prefix}-objections`}
          label="Objections"
          name="objections"
        />
      </div>
    </>
  );
}

function ProofFields({
  errors,
  prefix,
  proof,
}: {
  errors?: Record<string, string[] | undefined>;
  prefix: string;
  proof?: ProofPoint;
}) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          defaultValue={proof?.label}
          error={errors?.label}
          id={`${prefix}-label`}
          label="Proof label"
          name="label"
          required
        />
        <TextField
          defaultValue={proof?.source_note}
          error={errors?.sourceNote}
          id={`${prefix}-source`}
          label="Source note"
          name="source_note"
        />
      </div>
      <TextAreaField
        defaultValue={proof?.detail}
        error={errors?.detail}
        id={`${prefix}-detail`}
        label="Proof detail"
        name="detail"
        required
      />
    </>
  );
}

function RestrictionFields({
  errors,
  prefix,
  restriction,
}: {
  errors?: Record<string, string[] | undefined>;
  prefix: string;
  restriction?: Restriction;
}) {
  return (
    <>
      <SelectField
        defaultValue={restriction?.restriction_type ?? "PROHIBITED_CLAIM"}
        error={errors?.restrictionType}
        id={`${prefix}-type`}
        label="Restriction type"
        name="restriction_type"
        options={restrictionOptions}
      />
      <TextAreaField
        defaultValue={restriction?.value}
        error={errors?.value}
        id={`${prefix}-value`}
        label="Restriction"
        name="value"
        required
      />
      <TextAreaField
        defaultValue={restriction?.notes}
        error={errors?.notes}
        id={`${prefix}-notes`}
        label="Internal notes"
        name="notes"
        rows={3}
      />
    </>
  );
}

function EditorSection({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 mb-6 leading-7 text-[var(--muted)]">{description}</p>
      {children}
    </section>
  );
}

function EntitySection({
  addForm,
  children,
  description,
  empty,
  title,
}: {
  addForm: React.ReactNode;
  children: React.ReactNode[];
  description: string;
  empty: string;
  title: string;
}) {
  return (
    <EditorSection description={description} title={title}>
      <div className="space-y-4">
        {children.length ? (
          children
        ) : (
          <p className="rounded-2xl bg-[var(--background)] p-4 text-sm text-[var(--muted)]">
            {empty}
          </p>
        )}
      </div>
      <details className="mt-6 rounded-2xl border border-dashed border-[var(--line)] p-5">
        <summary className="cursor-pointer font-semibold">Add another</summary>
        <div className="mt-5">{addForm}</div>
      </details>
    </EditorSection>
  );
}

function EntityCard({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <details className="rounded-2xl border border-[var(--line)] p-5">
      <summary className="cursor-pointer font-semibold">{title}</summary>
      <div className="mt-5 space-y-5">{children}</div>
    </details>
  );
}

function DeleteForm({
  action,
  label,
}: {
  action: (formData: FormData) => Promise<void>;
  label: string;
}) {
  return (
    <form action={action}>
      <button
        className="min-h-11 rounded-full border border-red-300 px-5 py-2 text-sm font-semibold text-red-800"
        type="submit"
      >
        {label}
      </button>
    </form>
  );
}

function ReadOnlyBrandBrain({ brain }: { brain: BrandBrain }) {
  return (
    <div className="space-y-8">
      <p className="rounded-2xl border border-[var(--line)] bg-white p-5 text-sm">
        Your VIEWER role can inspect Brand Brain data but cannot change it.
      </p>
      <ReadOnlySection title="Brand">
        <ReadOnlyItem label="Category" value={brain.brand.category} />
        <ReadOnlyItem label="Description" value={brain.brand.description} />
        <ReadOnlyItem
          label="Voice"
          value={readJsonDescription(brain.brand.brand_voice)}
        />
      </ReadOnlySection>
      <ReadOnlySection title="Products">
        {brain.products.map((product) => (
          <ReadOnlyItem
            key={product.id}
            label={product.name}
            value={product.description}
          />
        ))}
      </ReadOnlySection>
      <ReadOnlySection title="Personas">
        {brain.personas.map((persona) => (
          <ReadOnlyItem
            key={persona.id}
            label={persona.name}
            value={persona.description}
          />
        ))}
      </ReadOnlySection>
      <ReadOnlySection title="Proof points">
        {brain.proofPoints.map((proof) => (
          <ReadOnlyItem
            key={proof.id}
            label={proof.label}
            value={proof.detail}
          />
        ))}
      </ReadOnlySection>
      <ReadOnlySection title="Restrictions">
        {brain.restrictions.map((restriction) => (
          <ReadOnlyItem
            key={restriction.id}
            label={formatRestrictionType(restriction.restriction_type)}
            value={restriction.value}
          />
        ))}
      </ReadOnlySection>
    </div>
  );
}

function ReadOnlySection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-3xl border border-[var(--line)] bg-white p-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <dl className="mt-4 space-y-4">{children}</dl>
    </section>
  );
}

function ReadOnlyItem({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <dt className="font-semibold">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-[var(--muted)]">
        {value || "Not provided"}
      </dd>
    </div>
  );
}

function formatRestrictionType(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}
