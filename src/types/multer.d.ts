/* eslint-disable @typescript-eslint/no-namespace */
import type { Request, Response } from 'express';

declare module 'multer' {
  interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination?: string;
    filename?: string;
    path?: string;
    buffer: Buffer;
  }

  interface Options {
    dest?: string;
    storage?: StorageEngine;
    limits?: {
      fieldSize?: number;
      fileSize?: number;
      files?: number;
      fields?: number;
      parts?: number;
      headerPairs?: number;
    };
    fileFilter?(
      req: Request,
      file: MulterFile,
      callback: (error: Error | null, acceptFile?: boolean) => void,
    ): void;
  }

  interface StorageEngine {
    _handleFile(
      req: Request,
      file: MulterFile,
      callback: (error?: Error | null, info?: Partial<MulterFile>) => void,
    ): void;
    _removeFile(
      req: Request,
      file: MulterFile,
      callback: (error: Error | null) => void,
    ): void;
  }

  interface Multer {
    single(fieldName: string): (req: Request, res: Response, next: (error?: Error) => void) => void;
    array(fieldName: string, maxCount?: number): (req: Request, res: Response, next: (error?: Error) => void) => void;
    fields(fields: Array<{ name: string; maxCount?: number }>): (req: Request, res: Response, next: (error?: Error) => void) => void;
    none(): (req: Request, res: Response, next: (error?: Error) => void) => void;
    any(): (req: Request, res: Response, next: (error?: Error) => void) => void;
  }

  interface MulterInstance extends Multer {
    memoryStorage(): StorageEngine;
    diskStorage(options: {
      destination?: string | ((req: Request, file: MulterFile, cb: (error: Error | null, destination: string) => void) => void);
      filename?: (req: Request, file: MulterFile, cb: (error: Error | null, filename: string) => void) => void;
    }): StorageEngine;
  }

  function multer(options?: Options): MulterInstance & Multer;
  namespace multer {
    function memoryStorage(): StorageEngine;
    function diskStorage(options: {
      destination?: string | ((req: Request, file: MulterFile, cb: (error: Error | null, destination: string) => void) => void);
      filename?: (req: Request, file: MulterFile, cb: (error: Error | null, filename: string) => void) => void;
    }): StorageEngine;
  }

  export { MulterFile, Options, StorageEngine, Multer, MulterInstance };
  export default multer;
}

declare global {
  namespace Express {
    interface Request {
      file?: MulterFile;
      files?: MulterFile[] | { [fieldname: string]: MulterFile[] };
    }
  }
}
