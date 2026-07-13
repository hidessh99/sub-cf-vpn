import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const createValidator = (schema: z.ZodSchema, defaultErrorMessage = "Validation failed") => 
  zValidator("json", schema, (result, c) => {
    if (!result.success) {
      const errors = (result as any).error.errors.map((e: any) => {
        const field = e.path.length > 0 ? e.path.join(".") : "input";
        return `${field}: ${e.message}`;
      });
      return c.json({
        success: false,
        message: defaultErrorMessage,
        errors,
        error: null
      }, 400);
    }
  });

export const validateJson = (schema: z.ZodSchema) => createValidator(schema, "Validation failed");
export const validateProxyJson = (schema: z.ZodSchema) => createValidator(schema, "Validation failed");
export const validateProxyImportJson = (schema: z.ZodSchema) => createValidator(schema, "Invalid import format");

export const validateArrayOfStringsJson = () =>
  zValidator("json", z.array(z.string().min(1)), (result, c) => {
    if (!result.success) {
      return c.json({
        success: false,
        message: "Import data must be a JSON array of non-empty strings",
        errors: ["input: Import data must be a JSON array of non-empty strings"],
        error: null
      }, 400);
    }
  });
