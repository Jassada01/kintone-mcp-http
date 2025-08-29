import { KintoneRestAPIClient } from "@kintone/rest-api-client";
import {
  PACKAGE_NAME,
  type KintoneClientConfigParseResult,
} from "./config/index.js";
import { HttpsProxyAgent } from "https-proxy-agent";
import { Agent, type AgentOptions } from "https";
import { readFileSync } from "fs";
import { version } from "./version.js";

let client: KintoneRestAPIClient | null = null;

export const getKintoneClient = (
  config: KintoneClientConfigParseResult,
): KintoneRestAPIClient => {
  if (client) {
    return client;
  }

  const {
    KINTONE_BASE_URL,
    KINTONE_USERNAME,
    KINTONE_PASSWORD,
    KINTONE_API_TOKEN,
    KINTONE_BASIC_AUTH_USERNAME,
    KINTONE_BASIC_AUTH_PASSWORD,
    HTTPS_PROXY,
    KINTONE_PFX_FILE_PATH,
    KINTONE_PFX_FILE_PASSWORD,
  } = config.config;

  console.log('Creating Kintone client with config:');
  console.log('- Base URL:', KINTONE_BASE_URL);
  console.log('- Auth type:', config.isApiTokenAuth ? 'API Token' : 'Username/Password');
  console.log('- Username:', KINTONE_USERNAME ? '***' : 'not set');
  console.log('- Password:', KINTONE_PASSWORD ? '***' : 'not set');
  console.log('- API Token:', KINTONE_API_TOKEN ? '***' : 'not set');
  console.log('- Basic Auth:', KINTONE_BASIC_AUTH_USERNAME ? 'enabled' : 'disabled');
  console.log('- Proxy:', HTTPS_PROXY || 'not set');

  const authParams = buildAuthParams({
    username: KINTONE_USERNAME,
    password: KINTONE_PASSWORD,
    apiToken: KINTONE_API_TOKEN,
    isApiTokenAuth: config.isApiTokenAuth,
  });

  try {
    client = new KintoneRestAPIClient({
      baseUrl: KINTONE_BASE_URL,
      ...authParams,
      ...buildBasicAuthParam({
        basicAuthUsername: KINTONE_BASIC_AUTH_USERNAME,
        basicAuthPassword: KINTONE_BASIC_AUTH_PASSWORD,
      }),
      userAgent: `${PACKAGE_NAME}@${version}`,
      httpsAgent: buildHttpsAgent({
        proxy: HTTPS_PROXY,
        pfxFilePath: KINTONE_PFX_FILE_PATH,
        pfxPassword: KINTONE_PFX_FILE_PASSWORD,
      }),
    });
    
    console.log('Kintone client created successfully');
    return client;
  } catch (error) {
    console.error('Failed to create Kintone client:', error);
    throw error;
  }
};

export const resetKintoneClient = (): void => {
  client = null;
};

const buildAuthParams = (option: {
  username?: string;
  password?: string;
  apiToken?: string;
  isApiTokenAuth?: boolean;
}) => {
  return option.isApiTokenAuth
    ? { auth: { apiToken: option.apiToken } }
    : { auth: { username: option.username, password: option.password } };
};

const buildBasicAuthParam = (options: {
  basicAuthUsername?: string;
  basicAuthPassword?: string;
}) => {
  return options.basicAuthUsername && options.basicAuthPassword
    ? {
        basicAuth: {
          username: options.basicAuthUsername,
          password: options.basicAuthPassword,
        },
      }
    : {};
};

const buildHttpsAgent = (options: {
  proxy?: string;
  pfxFilePath?: string;
  pfxPassword?: string;
}): Agent => {
  const agentOptions: AgentOptions = {};

  // Add PFX certificate if provided
  if (options.pfxFilePath && options.pfxPassword) {
    try {
      agentOptions.pfx = readFileSync(options.pfxFilePath);
      agentOptions.passphrase = options.pfxPassword;
    } catch (error) {
      throw new Error(
        `Failed to read PFX file: ${options.pfxFilePath}. ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Use proxy if provided
  if (options.proxy) {
    try {
      return new HttpsProxyAgent(options.proxy, agentOptions);
    } catch (error) {
      throw new Error(
        `Invalid HTTPS proxy URL: ${options.proxy}. ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return new Agent(agentOptions);
};
