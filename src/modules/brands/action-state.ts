export type BrandActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialBrandActionState: BrandActionState = { status: "idle" };
