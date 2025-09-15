import { z } from "zod";

export const datasourceSchema = z.object({
  id: z.string(),
  alias: z.string().optional(),
  url: z.url(),
  xOrgID: z.number().min(18).optional(), // TODO: consider full header list
});

export function validateDatasources(data: unknown) {
  return z.array(datasourceSchema).parse(data);
}

export type Datasource = z.infer<typeof datasourceSchema>;

export async function loadDatasources(fileName: string): Promise<Array<Datasource>> {
  const { default: datasources } = await import(fileName);
  return validateDatasources(datasources);
}
