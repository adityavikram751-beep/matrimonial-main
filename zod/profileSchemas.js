import { z } from "zod";

export const basicInfoSchema = z.object({
  fullName: z.string().min(2, "Full Name is required"),
  role: z.string().min(2, "Role is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  region: z.string().optional(),
});

export const securitySchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  twoFactor: z.boolean(),
  alertSuspicious: z.boolean(),
});

export const preferenceSchema = z.object({
  language: z.string(),
  landingPage: z.string(),
  theme: z.enum(["light", "dark"]),
  notifications: z.boolean(),
});
