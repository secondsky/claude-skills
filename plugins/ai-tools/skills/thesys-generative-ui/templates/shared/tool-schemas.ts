/**
 * Common Zod Schemas for Tool Calling
 *
 * Reusable schemas for common tools across any framework.
 * These schemas provide runtime validation and type safety.
 *
 * Usage:
 * import { webSearchTool, createOrderTool } from "./tool-schemas";
 * import zodToJsonSchema from "zod-to-json-schema";
 *
 * const tools = [webSearchTool, createOrderTool];
 *
 * await client.beta.chat.completions.runTools({
 *   model: "c1/openai/gpt-5/v-20250930",
 *   messages: [...],
 *   tools,
 * });
 */

import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

// ============================================================================
// Web Search Tool
// ============================================================================

export const webSearchSchema = z.object({
  query: z.string().min(1).describe("The search query"),
  max_results: z
    .number()
    .int()
    .min(1)
    .max(10)
    .default(5)
    .describe("Maximum number of results to return (1-10)"),
  include_answer: z
    .boolean()
    .default(true)
    .describe("Include AI-generated answer summary"),
});

export type WebSearchArgs = z.infer<typeof webSearchSchema>;

export const webSearchTool = {
  type: "function" as const,
  function: {
    name: "web_search",
    description:
      "Search the web for current information using a search API. Use this for recent events, news, or information that may have changed recently.",
    parameters: zodToJsonSchema(webSearchSchema),
  },
};

// ============================================================================
// Product/Inventory Tools
// ============================================================================

export const productLookupSchema = z.object({
  product_type: z
    .enum(["gloves", "hat", "scarf", "all"])
    .optional()
    .describe("Type of product to lookup, or 'all' for entire inventory"),
  filter: z
    .object({
      min_price: z.number().optional(),
      max_price: z.number().optional(),
      in_stock_only: z.boolean().default(true),
    })
    .optional()
    .describe("Optional filters for product search"),
});

export type ProductLookupArgs = z.infer<typeof productLookupSchema>;

export const productLookupTool = {
  type: "function" as const,
  function: {
    name: "lookup_product",
    description:
      "Look up products in the inventory database. Returns product details including price, availability, and specifications.",
    parameters: zodToJsonSchema(productLookupSchema),
  },
};

// ============================================================================
// Order Creation Tool
// ============================================================================

const orderItemSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("gloves"),
    size: z.enum(["XS", "S", "M", "L", "XL", "XXL"]),
    color: z.string().min(1),
    quantity: z.number().int().min(1).max(100),
  }),
  z.object({
    type: z.literal("hat"),
    style: z.enum(["beanie", "baseball", "fedora", "bucket"]),
    color: z.string().min(1),
    quantity: z.number().int().min(1).max(100),
  }),
  z.object({
    type: z.literal("scarf"),
    length: z.enum(["short", "medium", "long"]),
    material: z.enum(["wool", "cotton", "silk", "cashmere"]),
    quantity: z.number().int().min(1).max(100),
  }),
]);

export const createOrderSchema = z.object({
  customer_email: z
    .string()
    .email()
    .describe("Customer's email address for order confirmation"),
  items: z
    .array(orderItemSchema)
    .min(1)
    .max(20)
    .describe("Array of items to include in the order (max 20)"),
  shipping_address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().length(2), // US state code
    zip: z.string().regex(/^\d{5}(-\d{4})?$/), // ZIP or ZIP+4
    country: z.string().default("US"),
  }),
  notes: z.string().optional().describe("Optional order notes or instructions"),
});

export type CreateOrderArgs = z.infer<typeof createOrderSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;

export const createOrderTool = {
  type: "function" as const,
  function: {
    name: "create_order",
    description:
      "Create a new product order with customer information, items, and shipping address. Returns order ID and confirmation details.",
    parameters: zodToJsonSchema(createOrderSchema),
  },
};

// ============================================================================
// Database Query Tool
// ============================================================================

export const databaseQuerySchema = z.object({
  query_type: z
    .enum(["select", "aggregate", "search"])
    .describe("Type of database query to perform"),
  table: z
    .string()
    .describe("Database table name (e.g., 'users', 'products', 'orders')"),
  filters: z
    .record(z.any())
    .optional()
    .describe("Filter conditions as key-value pairs"),
  limit: z.number().int().min(1).max(100).default(20).describe("Result limit"),
});

export type DatabaseQueryArgs = z.infer<typeof databaseQuerySchema>;

export const databaseQueryTool = {
  type: "function" as const,
  function: {
    name: "query_database",
    description:
      "Query the database for information. Supports select, aggregate, and search operations on various tables.",
    parameters: zodToJsonSchema(databaseQuerySchema),
  },
};

// ============================================================================
// Data Visualization Tool
// ============================================================================

export const createVisualizationSchema = z.object({
  chart_type: z
    .enum(["bar", "line", "pie", "scatter", "area"])
    .describe("Type of chart to create"),
  data: z
    .array(
      z.object({
        label: z.string(),
        value: z.number(),
      })
    )
    .min(1)
    .describe("Data points for the visualization"),
  title: z.string().min(1).describe("Chart title"),
  x_label: z.string().optional().describe("X-axis label"),
  y_label: z.string().optional().describe("Y-axis label"),
});

export type CreateVisualizationArgs = z.infer<typeof createVisualizationSchema>;

export const createVisualizationTool = {
  type: "function" as const,
  function: {
    name: "create_visualization",
    description:
      "Create a data visualization chart. Returns chart configuration that will be rendered in the UI.",
    parameters: zodToJsonSchema(createVisualizationSchema),
  },
};

// ============================================================================
// Email Tool
// ============================================================================

export const sendEmailSchema = z.object({
  to: z.string().email().describe("Recipient email address"),
  subject: z.string().min(1).max(200).describe("Email subject line"),
  body: z.string().min(1).describe("Email body content (supports HTML)"),
  cc: z.array(z.string().email()).optional().describe("CC recipients"),
  bcc: z.array(z.string().email()).optional().describe("BCC recipients"),
});

export type SendEmailArgs = z.infer<typeof sendEmailSchema>;

export const sendEmailTool = {
  type: "function" as const,
  function: {
    name: "send_email",
    description:
      "Send an email to one or more recipients. Use this to send notifications, confirmations, or responses to customers.",
    parameters: zodToJsonSchema(sendEmailSchema),
  },
};

// ============================================================================
// Calendar/Scheduling Tool
// ============================================================================

export const scheduleEventSchema = z.object({
  title: z.string().min(1).describe("Event title"),
  start_time: z.string().datetime().describe("Event start time (ISO 8601)"),
  end_time: z.string().datetime().describe("Event end time (ISO 8601)"),
  description: z.string().optional().describe("Event description"),
  attendees: z
    .array(z.string().email())
    .optional()
    .describe("List of attendee email addresses"),
  location: z.string().optional().describe("Event location or meeting link"),
  reminder_minutes: z
    .number()
    .int()
    .min(0)
    .default(15)
    .describe("Minutes before event to send reminder"),
});

export type ScheduleEventArgs = z.infer<typeof scheduleEventSchema>;

export const scheduleEventTool = {
  type: "function" as const,
  function: {
    name: "schedule_event",
    description:
      "Schedule a calendar event with attendees, location, and reminders.",
    parameters: zodToJsonSchema(scheduleEventSchema),
  },
};

// ============================================================================
// File Upload Tool
// ============================================================================

export const uploadFileSchema = z.object({
  file_name: z.string().min(1).describe("Name of the file"),
  file_type: z
    .string()
    .describe("MIME type (e.g., 'image/png', 'application/pdf')"),
  file_size: z.number().int().min(1).describe("File size in bytes"),
  description: z.string().optional().describe("File description or metadata"),
});

export type UploadFileArgs = z.infer<typeof uploadFileSchema>;

export const uploadFileTool = {
  type: "function" as const,
  function: {
    name: "upload_file",
    description:
      "Upload a file to cloud storage. Returns storage URL and file metadata.",
    parameters: zodToJsonSchema(uploadFileSchema),
  },
};

// ============================================================================
// Export All Tools
// ============================================================================

export const allTools = [
  webSearchTool,
  productLookupTool,
  createOrderTool,
  databaseQueryTool,
  createVisualizationTool,
  sendEmailTool,
  scheduleEventTool,
  uploadFileTool,
];

/**
 * Helper to get tools by category
 */
export function getToolsByCategory(category: "ecommerce" | "data" | "communication" | "all") {
  const categories = {
    ecommerce: [productLookupTool, createOrderTool],
    data: [databaseQueryTool, createVisualizationTool],
    communication: [sendEmailTool, scheduleEventTool],
    all: allTools,
  };

  return categories[category];
}

/**
 * Validation helper
 */
export function validateToolArgs<T extends z.ZodType>(
  schema: T,
  args: unknown
): z.infer<T> {
  return schema.parse(args);
}
