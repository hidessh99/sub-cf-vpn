import { z } from "zod";

export const LoginRequestSchema = z.object({
  username: z.string({ required_error: "Username is required" }).min(1, "Username cannot be empty"),
  password: z.string({ required_error: "Password is required" }).min(1, "Password cannot be empty"),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const ChangePasswordRequestSchema = z.object({
  oldPassword: z.string({ required_error: "Old password is required" }).min(1, "Old password cannot be empty"),
  newPassword: z.string({ required_error: "New password is required" }).min(6, "New password must be at least 6 characters long"),
});

export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;
