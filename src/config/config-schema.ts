import { z } from "zod";

const datasourceSchema = z.object({
  id: z.string(),
  alias: z.string().optional(),
  url: z.url(),
  headers: z.record(z.string(), z.union([z.string(), z.number(), z.array(z.string())])).optional(),
});

const configSchema = z.object({
  datasources: z.array(datasourceSchema),
  features: z.record(z.string(), z.boolean()).optional(),
});

export function validateConfig(data: unknown) {
  const parsedConfig = configSchema.parse(data);
  return parsedConfig;
}

export type ServerDatasource = z.infer<typeof datasourceSchema>;
export type Config = z.infer<typeof configSchema>;

const datasourceOverWireSchema = datasourceSchema.pick({ id: true, alias: true });

export const datasourcesOverWireSchema = z.array(datasourceOverWireSchema);

export type ClientDatasource = z.infer<typeof datasourceOverWireSchema>;

export type ClientConfig = Pick<Config, "features"> & { datasources: ClientDatasource[] };

export const configUrl = "/config";

export const FeatureToggles = {
  persistentAcks: "persistentAcks",
};
