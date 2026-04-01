const STATUS_CLASS_MAP: Record<string, string> = {
  COMPLETED: 'progress-step-done',
  PENDING: 'status-pending',
  REJECTED: 'status-rejected',
  ASSET_CREATION_PROCESSING: 'progress-step-active',
  ASSET_CREATED: 'progress-step-done',
  APPROVED: 'status-approved',
  LEGAL_NOTE_SIGNED: 'progress-step-done',
  TOKENS_MINTED: 'progress-step-done',
};

const DEFAULT_STATUS_CLASS = 'bg-secondary/10 text-secondary border border-secondary/20';

export const getStatusClass = (status: string): string =>
  STATUS_CLASS_MAP[status] ?? DEFAULT_STATUS_CLASS;
