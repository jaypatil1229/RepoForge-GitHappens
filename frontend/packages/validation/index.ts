export function validateCredentialPayload(payload: { subjectId?: string }) {
  if (!payload.subjectId) return { valid: false, message: 'Subject ID is required' };
  return { valid: true };
}
