import { z } from "zod";

// Define the schema for a single log record
const LogRecord = z.record(z.string(), z.string());

const DataTupleSchema = z.tuple([
  z.array(LogRecord), // Array of log records
  z.array(z.number()), // Array of timestamps
  z.array(z.string()), // Array of log messages
], z.unknown());

export type DataTuple = z.infer<typeof DataTupleSchema>;

// Define the schema for the `data.values` structure
const DataValuesSchema = z.object({
  values: DataTupleSchema.refine(
    (values) => {
      const [records, timestamps, messages] = values;
      return records.length === timestamps.length && records.length === messages.length;
    },
    { message: "The number of records, timestamps, and messages must match." },
  ),
});

// Define the schema for the entire frame
const FrameSchema = z.object({
  data: DataValuesSchema,
});

// Define the schema for the entire response
export const LokiGrafanaResponseSchema = z.object({
  results: z.record(
    z.string(),
    z.object({
      status: z.number(),
      frames: z.array(FrameSchema),
    }),
  ),
});

// Type inference for TypeScript
export type LokiGrafanaResponse = z.infer<typeof LokiGrafanaResponseSchema>;
