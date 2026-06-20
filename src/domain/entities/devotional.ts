import { ValidationError } from '../../shared/errors/index.js';

export interface DevotionalParams {
  id: string;
  title: string;
  scriptureReference: string;
  scriptureText: string;
  reflection: string;
  closingPrayer: string;
  publishedDate: Date;
  author: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Devotional {
  public readonly id: string;
  public readonly title: string;
  public readonly scriptureReference: string;
  public readonly scriptureText: string;
  public readonly reflection: string;
  public readonly closingPrayer: string;
  public readonly publishedDate: Date;
  public readonly author: string;
  public readonly isPublished: boolean;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(params: DevotionalParams) {
    this.validateId(params.id);
    this.validateTitle(params.title);
    this.validateScriptureReference(params.scriptureReference);
    this.validateScriptureText(params.scriptureText);
    this.validateReflection(params.reflection);
    this.validateClosingPrayer(params.closingPrayer);
    this.validatePublishedDate(params.publishedDate);
    this.validateAuthor(params.author);

    this.id = params.id.trim();
    this.title = params.title.trim();
    this.scriptureReference = params.scriptureReference.trim();
    this.scriptureText = params.scriptureText.trim();
    this.reflection = params.reflection.trim();
    this.closingPrayer = params.closingPrayer.trim();
    this.publishedDate = params.publishedDate;
    this.author = params.author.trim();
    this.isPublished = params.isPublished;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }

  static create(params: Omit<DevotionalParams, 'createdAt' | 'updatedAt'>): Devotional {
    const now = new Date();
    return new Devotional({
      ...params,
      createdAt: now,
      updatedAt: now,
    });
  }

  update(params: Partial<Omit<DevotionalParams, 'id' | 'createdAt' | 'updatedAt'>>): Devotional {
    return new Devotional({
      ...this.toParams(),
      ...params,
      updatedAt: new Date(),
    });
  }

  toParams(): DevotionalParams {
    return {
      id: this.id,
      title: this.title,
      scriptureReference: this.scriptureReference,
      scriptureText: this.scriptureText,
      reflection: this.reflection,
      closingPrayer: this.closingPrayer,
      publishedDate: this.publishedDate,
      author: this.author,
      isPublished: this.isPublished,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  private validateId(id: string): void {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Devotional ID is required');
    }
  }

  private validateTitle(title: string): void {
    if (!title || typeof title !== 'string') {
      throw new ValidationError('Title is required');
    }
    const trimmed = title.trim();
    if (trimmed.length < 1 || trimmed.length > 255) {
      throw new ValidationError('Title must be between 1 and 255 characters');
    }
  }

  private validateScriptureReference(reference: string): void {
    if (!reference || typeof reference !== 'string') {
      throw new ValidationError('Scripture reference is required');
    }
    const trimmed = reference.trim();
    if (trimmed.length < 1 || trimmed.length > 255) {
      throw new ValidationError('Scripture reference must be between 1 and 255 characters');
    }
  }

  private validateScriptureText(text: string): void {
    if (!text || typeof text !== 'string') {
      throw new ValidationError('Scripture text is required');
    }
    if (text.trim().length < 1) {
      throw new ValidationError('Scripture text must not be empty');
    }
  }

  private validateReflection(reflection: string): void {
    if (!reflection || typeof reflection !== 'string') {
      throw new ValidationError('Reflection is required');
    }
    if (reflection.trim().length < 1) {
      throw new ValidationError('Reflection must not be empty');
    }
  }

  private validateClosingPrayer(prayer: string): void {
    if (!prayer || typeof prayer !== 'string') {
      throw new ValidationError('Closing prayer is required');
    }
    if (prayer.trim().length < 1) {
      throw new ValidationError('Closing prayer must not be empty');
    }
  }

  private validatePublishedDate(date: Date): void {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      throw new ValidationError('Published date must be a valid date');
    }
  }

  private validateAuthor(author: string): void {
    if (!author || typeof author !== 'string') {
      throw new ValidationError('Author is required');
    }
    if (author.trim().length < 1 || author.trim().length > 255) {
      throw new ValidationError('Author must be between 1 and 255 characters');
    }
  }
}
