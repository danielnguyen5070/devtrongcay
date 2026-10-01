export type ReviewField = "name" | "rating" | "comment";

export type ReviewError = "invalid" | "rate_limited" | "not_found" | "generic";

export type SubmitReviewState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; error: ReviewError; fields?: ReviewField[] };

export const initialSubmitReviewState: SubmitReviewState = { status: "idle" };

export const REVIEW_NAME_MAX = 80;
export const REVIEW_COMMENT_MAX = 2000;
