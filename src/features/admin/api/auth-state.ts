export type SignInState =
  | { status: "idle" }
  | { status: "error"; error: "invalid" | "not_admin" | "generic" };

export const initialSignInState: SignInState = { status: "idle" };
