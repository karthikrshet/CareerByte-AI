import { z } from "zod";

export const uploadResumeSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  resumeId: z.string().cuid().optional(),
});

export type UploadResumeInput = z.infer<typeof uploadResumeSchema>;
