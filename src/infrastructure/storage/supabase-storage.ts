import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import ws from 'ws';
import { env } from '../../config/env.js';
import { ValidationError, InternalError } from '../../shared/errors/index.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const ALLOWED_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export class SupabaseStorage {
  private client;

  constructor() {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
      this.client = null;
      return;
    }
    this.client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      realtime: { transport: ws as any },
    });
  }

  async uploadProfilePhoto(
    userId: string,
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    if (!this.client) {
      throw new InternalError('Supabase storage is not configured');
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType as typeof ALLOWED_MIME_TYPES[number])) {
      throw new ValidationError('Invalid file type. Allowed: JPEG, PNG, WebP');
    }

    if (fileBuffer.length > env.MAX_PHOTO_SIZE_BYTES) {
      throw new ValidationError(
        `File size exceeds ${env.MAX_PHOTO_SIZE_BYTES / 1024 / 1024}MB limit`,
      );
    }

    const extension = ALLOWED_EXTENSIONS[mimeType] ?? '.jpg';
    const fileName = `${userId}/${randomUUID()}${extension}`;

    const { error } = await this.client.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .upload(fileName, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw new InternalError(`Failed to upload photo: ${error.message}`);
    }

    const { data: urlData } = this.client.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  async deletePhoto(fileUrl: string): Promise<void> {
    if (!this.client) {
      return;
    }

    const bucket = env.SUPABASE_STORAGE_BUCKET;
    const baseUrl = `${env.SUPABASE_URL}/storage/v1/object/public/${bucket}/`;
    if (!fileUrl.startsWith(baseUrl)) {
      return;
    }

    const filePath = fileUrl.slice(baseUrl.length);

    const { error } = await this.client.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      throw new InternalError(`Failed to delete photo: ${error.message}`);
    }
  }
}
