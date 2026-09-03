type FieldProps = {
  defaultValue?: string | null;
  error?: string[];
  help?: string;
  id: string;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "url";
};

const inputClass =
  "min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 shadow-sm";

export function TextField({
  defaultValue,
  error,
  help,
  id,
  label,
  name,
  placeholder,
  required,
  type = "text",
}: FieldProps) {
  return (
    <FieldFrame error={error} help={help} id={id} label={label}>
      <input
        aria-describedby={describedBy(id, error, help)}
        aria-invalid={Boolean(error?.length)}
        className={inputClass}
        defaultValue={defaultValue ?? ""}
        id={id}
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
    </FieldFrame>
  );
}

export function TextAreaField({
  defaultValue,
  error,
  help,
  id,
  label,
  name,
  placeholder,
  required,
  rows = 4,
}: Omit<FieldProps, "type"> & { rows?: number }) {
  return (
    <FieldFrame error={error} help={help} id={id} label={label}>
      <textarea
        aria-describedby={describedBy(id, error, help)}
        aria-invalid={Boolean(error?.length)}
        className={inputClass}
        defaultValue={defaultValue ?? ""}
        id={id}
        name={name}
        placeholder={placeholder}
        required={required}
        rows={rows}
      />
    </FieldFrame>
  );
}

export function SelectField({
  defaultValue,
  error,
  id,
  label,
  name,
  options,
}: Pick<FieldProps, "defaultValue" | "error" | "id" | "label" | "name"> & {
  options: ReadonlyArray<{ label: string; value: string }>;
}) {
  return (
    <FieldFrame error={error} id={id} label={label}>
      <select
        aria-describedby={error?.length ? `${id}-error` : undefined}
        aria-invalid={Boolean(error?.length)}
        className={inputClass}
        defaultValue={defaultValue ?? options[0]?.value}
        id={id}
        name={name}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldFrame>
  );
}

function FieldFrame({
  children,
  error,
  help,
  id,
  label,
}: {
  children: React.ReactNode;
  error?: string[];
  help?: string;
  id: string;
  label: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold" htmlFor={id}>
        {label}
      </label>
      {children}
      {help ? (
        <p
          className="mt-2 text-xs leading-5 text-[var(--muted)]"
          id={`${id}-help`}
        >
          {help}
        </p>
      ) : null}
      {error?.length ? (
        <p className="mt-2 text-sm text-red-700" id={`${id}-error`}>
          {error[0]}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, error?: string[], help?: string) {
  return (
    [help ? `${id}-help` : null, error?.length ? `${id}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined
  );
}
