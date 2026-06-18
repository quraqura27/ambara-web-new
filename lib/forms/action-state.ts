export type FieldErrors = Record<string, string>;

export type PortalActionState<TValues extends Record<string, string> = Record<string, string>> = {
  fieldErrors?: FieldErrors;
  formError?: string;
  values?: TValues;
};

export function formValues(formData: FormData) {
  const values: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      values[key] = value;
    }
  }

  return values;
}
