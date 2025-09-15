import { z } from "zod";

export const datasourceSchema = z.object({
  id: z.string(),
  alias: z.string().optional(),
  url: z.url(),
  headers: z.record(z.string(), z.union([z.string(), z.number(), z.array(z.string())])).optional(),
});

export function validateDatasources(data: unknown) {
  return z.array(datasourceSchema).parse(data);
}

export type Datasource = z.infer<typeof datasourceSchema>;
