import { z } from "zod";
import { createTool } from "../../utils.js";
import { getKintoneClient } from "../../../client.js";
import { parseKintoneClientConfig } from "../../../config/index.js";

const inputSchema = {
  ids: z
    .array(z.string())
    .max(100)
    .optional()
    .describe("Array of app IDs (numeric values as strings, max 100)"),
  codes: z
    .array(z.string().max(64))
    .max(100)
    .optional()
    .describe("Array of app codes (max 64 characters each)"),
  name: z
    .string()
    .max(64)
    .optional()
    .describe("App name for partial match search"),
  spaceIds: z
    .array(z.string())
    .max(100)
    .optional()
    .describe("Array of space IDs (numeric values as strings, max 100)"),
  offset: z
    .number()
    .min(0)
    .optional()
    .default(0)
    .describe("Offset for pagination (default: 0)"),
  limit: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .default(100)
    .describe("Number of apps to retrieve (1-100, default: 100)"),
};

const appSchema = z.object({
  appId: z.string().describe("The app ID"),
  code: z.string().describe("The app code (empty string if not set)"),
  name: z.string().describe("The app name"),
  description: z
    .string()
    .describe("The app description (empty string if not set)"),
  spaceId: z
    .string()
    .nullable()
    .describe("The space ID (null if not in a space)"),
  threadId: z
    .string()
    .nullable()
    .describe("The thread ID (null if not in a space)"),
  createdAt: z.string().describe("The creation date and time"),
  creator: z
    .object({
      code: z.string().describe("The creator's user code"),
      name: z.string().describe("The creator's display name"),
    })
    .describe("The creator information"),
  modifiedAt: z.string().describe("The last modified date and time"),
  modifier: z
    .object({
      code: z.string().describe("The modifier's user code"),
      name: z.string().describe("The modifier's display name"),
    })
    .describe("The modifier information"),
});

const outputSchema = {
  apps: z.array(appSchema).describe("Array of app information"),
};

export const getApps = createTool(
  "kintone-get-apps",
  {
    title: "Get Apps",
    description: "Get multiple app settings from kintone",
    inputSchema,
    outputSchema,
  },
  async ({ ids, codes, name, spaceIds, offset, limit }) => {
    console.log('get-apps tool called with params:', { ids, codes, name, spaceIds, offset, limit });
    
    try {
      const config = parseKintoneClientConfig();
      const client = getKintoneClient(config);

      console.log('Making API call to client.app.getApps...');
      const response = await client.app.getApps({
      ids,
      codes,
      name,
      spaceIds,
      offset,
      limit,
    });

    console.log('Kintone API response received:', {
      appsCount: response.apps.length,
      firstApp: response.apps[0]?.name || 'none'
    });

    const result = {
      apps: response.apps.map((app) => ({
        appId: app.appId,
        code: app.code,
        name: app.name,
        description: app.description,
        spaceId: app.spaceId,
        threadId: app.threadId,
        createdAt: app.createdAt,
        creator: app.creator,
        modifiedAt: app.modifiedAt,
        modifier: app.modifier,
      })),
    };

    console.log('get-apps tool completed successfully');
    return {
      structuredContent: result,
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
    } catch (error) {
      console.error('get-apps tool failed:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        status: (error as any)?.response?.status,
        statusText: (error as any)?.response?.statusText,
        data: (error as any)?.response?.data
      });
      throw error;
    }
  },
);
