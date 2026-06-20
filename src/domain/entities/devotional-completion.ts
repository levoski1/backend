export interface DevotionalCompletionParams {
  id: string;
  userId: string;
  devotionalId: string;
  completedAt: Date;
}

export class DevotionalCompletion {
  public readonly id: string;
  public readonly userId: string;
  public readonly devotionalId: string;
  public readonly completedAt: Date;

  constructor(params: DevotionalCompletionParams) {
    this.id = params.id;
    this.userId = params.userId;
    this.devotionalId = params.devotionalId;
    this.completedAt = params.completedAt;
  }

  static create(params: Omit<DevotionalCompletionParams, 'completedAt'>): DevotionalCompletion {
    return new DevotionalCompletion({
      ...params,
      completedAt: new Date(),
    });
  }
}
