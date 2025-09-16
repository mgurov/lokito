import { z } from "zod";

const datasourceSchema = z.object({
  id: z.string(),
  alias: z.string().optional(),
  url: z.url(),
  headers: z.record(z.string(), z.union([z.string(), z.number(), z.array(z.string())])).optional(),
});

export function validateDatasources(data: unknown) {
  return z.array(datasourceSchema).parse(data);
}

export type ServerDatasource = z.infer<typeof datasourceSchema>;

const datasourceOverWireSchema = datasourceSchema.pick({ id: true, alias: true });

export const datasourcesOverWireSchema = z.array(datasourceOverWireSchema);

export type ClientDatasource = z.infer<typeof datasourceOverWireSchema>;
