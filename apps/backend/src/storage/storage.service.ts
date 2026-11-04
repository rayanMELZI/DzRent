import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHash, randomUUID } from 'crypto';
import { Readable } from 'stream';

export type BucketKind = 'kyc' | 'vehicles' | 'contracts';

/**
 * StorageService — S3-compatible object storage (MinIO locally, R2/S3 in prod).
 * Clients NEVER receive raw object paths: uploads use short-lived presigned
 * PUT URLs; reads use short-lived presigned GET URLs (KYC: 5 min).
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly buckets: Record<BucketKind, string>;

  constructor(private readonly config: ConfigService) {
    this.s3 = new S3Client({
      endpoint: config.get<string>('S3_ENDPOINT'),
      region: config.get<string>('S3_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: config.get<string>('S3_ACCESS_KEY')!,
        secretAccessKey: config.get<string>('S3_SECRET_KEY')!,
      },
      forcePathStyle: true, // required for MinIO
    });
    this.buckets = {
      kyc: config.get<string>('S3_BUCKET_KYC', 'dzrent-kyc'),
      vehicles: config.get<string>('S3_BUCKET_VEHICLES', 'dzrent-vehicles'),
      contracts: config.get<string>('S3_BUCKET_CONTRACTS', 'dzrent-contracts'),
    };
  }

  /** Collision-free object key: <prefix>/<uuid>.<ext> */
  buildKey(prefix: string, mimeType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'application/pdf': 'pdf',
    };
    const ext = map[mimeType] ?? 'bin';
    return `${prefix}/${randomUUID()}.${ext}`;
  }

  /** Presigned PUT — client uploads directly to storage (5 min validity). */
  async presignUpload(bucket: BucketKind, key: string, mimeType: string): Promise<string> {
    const cmd = new PutObjectCommand({
      Bucket: this.buckets[bucket],
      Key: key,
      ContentType: mimeType,
      ServerSideEncryption: 'AES256',
    });
    return getSignedUrl(this.s3, cmd, { expiresIn: 300 });
  }

  /** Presigned GET — short-lived read link (default 5 min). */
  async presignDownload(bucket: BucketKind, key: string, expiresIn = 300): Promise<string> {
    const cmd = new GetObjectCommand({ Bucket: this.buckets[bucket], Key: key });
    return getSignedUrl(this.s3, cmd, { expiresIn });
  }

  /** Verifies the object exists post-upload; returns size + mime. */
  async verifyObject(
    bucket: BucketKind,
    key: string,
    maxBytes: number,
  ): Promise<{ sizeBytes: number; mimeType: string }> {
    try {
      const head = await this.s3.send(
        new HeadObjectCommand({ Bucket: this.buckets[bucket], Key: key }),
      );
      const sizeBytes = head.ContentLength ?? 0;
      if (sizeBytes === 0) throw new BadRequestException('Uploaded file is empty.');
      if (sizeBytes > maxBytes) {
        await this.delete(bucket, key);
        throw new BadRequestException(
          `File exceeds the ${Math.floor(maxBytes / 1_048_576)} MB limit.`,
        );
      }
      return { sizeBytes, mimeType: head.ContentType ?? 'application/octet-stream' };
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException('Upload not found. Complete the upload before submitting.');
    }
  }

  /** Streams the object and returns its SHA-256 hex digest (integrity field). */
  async sha256Of(bucket: BucketKind, key: string): Promise<string> {
    const res = await this.s3.send(
      new GetObjectCommand({ Bucket: this.buckets[bucket], Key: key }),
    );
    const hash = createHash('sha256');
    for await (const chunk of res.Body as Readable) hash.update(chunk as Buffer);
    return hash.digest('hex');
  }

  /** Uploads a server-generated buffer (contract PDFs). */
  async putBuffer(bucket: BucketKind, key: string, body: Buffer, mimeType: string): Promise<void> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.buckets[bucket],
        Key: key,
        Body: body,
        ContentType: mimeType,
        ServerSideEncryption: 'AES256',
      }),
    );
  }

  async delete(bucket: BucketKind, key: string): Promise<void> {
    try {
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.buckets[bucket], Key: key }));
    } catch (e) {
      this.logger.warn(`Delete failed for ${bucket}/${key}: ${(e as Error).message}`);
    }
  }
}
