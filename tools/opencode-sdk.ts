import type {
  OpencodeClient,
  ProviderListResponse,
  Session,
  SessionMessagesResponse,
} from "@opencode-ai/sdk/v2";

type SdkResult<Value> = {
  data?: Value;
  error?: unknown;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : JSON.stringify(error);
}

export function dataOrThrow<Value>(result: SdkResult<Value>, action: string) {
  if (result.error !== undefined) {
    throw new Error(`${action} failed: ${errorMessage(result.error)}`);
  }
  if (result.data === undefined) {
    throw new Error(`${action} failed: no response data`);
  }
  return result.data;
}

export async function listProviders(
  client: OpencodeClient,
  directory: string,
): Promise<ProviderListResponse> {
  return dataOrThrow(
    await client.provider.list({ directory }),
    "list providers",
  );
}

export async function createSession(
  client: OpencodeClient,
  directory: string,
  title: string,
): Promise<Session> {
  return dataOrThrow(
    await client.session.create({ directory, title }),
    "create session",
  );
}

export async function listSessionMessages(
  client: OpencodeClient,
  directory: string,
  sessionID: string,
  limit = 5000,
): Promise<SessionMessagesResponse> {
  return dataOrThrow(
    await client.session.messages({ sessionID, directory, limit }),
    "list session messages",
  );
}
