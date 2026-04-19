import { ZodError } from "zod";

export function zodErrorResponse(error: ZodError) {
  return new Response(
    JSON.stringify({
      message: "Invalid request data",
      errors: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    }),
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    },
  );
}
