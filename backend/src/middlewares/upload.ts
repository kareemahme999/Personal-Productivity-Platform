import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

const MAX_FILE_SIZE = env.MAX_FILE_SIZE_MB * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  // images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
  // documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
  'text/plain', 'text/markdown', 'text/csv',
  'application/json',
  'application/zip',
  'application/rtf',
  // audio/video
  'audio/mpeg', 'audio/wav', 'audio/mp4', 'video/mp4', 'video/webm',
]);

const BLOCKED_EXTENSIONS = new Set(['.html', '.htm', '.svg', '.svgz', '.js', '.mjs', '.cjs', '.xml']);

export function sanitizeFilename(originalName: string): string {
  const base = path.basename(originalName).replace(/[^\w.\- ]/g, '_').trim();
  return base.replace(/\s+/g, '_').slice(0, 180) || 'file';
}

/**
 * Multer disk storage configured to write uploads into the given subfolder
 * with unique, safe filenames.
 */
export function createUploader(subfolder: string, opts?: { fileFilter?: (file: Express.Multer.File) => boolean }) {
  const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR, subfolder);
  fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().slice(0, 12);
      cb(null, `${Date.now()}-${randomUUID()}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE, files: 1 },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();

      if (opts?.fileFilter && !opts.fileFilter(file)) {
        return cb(ApiError.badRequest('This file type is not allowed'));
      }
      if (BLOCKED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
        return cb(ApiError.badRequest(`File type "${file.mimetype}" is not allowed`));
      }
      cb(null, true);
    },
  });
}
