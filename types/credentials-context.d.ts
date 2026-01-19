declare module 'credentials-context' {
  /**
   * Map of credentials context URLs to their JSON-LD context documents
   */
  export const contexts: Map<string, Record<string, unknown>>;

  /**
   * Constants for credentials context
   */
  export const constants: {
    CREDENTIALS_CONTEXT_V1_URL: string;
    [key: string]: string;
  };
}
