declare module 'security-context' {
  /**
   * Map of security context URLs to their JSON-LD context documents
   */
  export const contexts: Map<string, Record<string, unknown>>;
}
