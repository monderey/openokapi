import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { getConfigDir } from "../config/paths.js";

const BACKUPS_DIR_NAME = "backups";
const MANIFEST_FILE_NAME = "manifest.json";

export interface BackupEntry {
  relativePath: string;
  size: number;
  sha256: string;
  mtimeMs: number;
}

export interface BackupManifest {
  id: string;
  createdAt: string;
  sourceDir: string;
  entries: BackupEntry[];
}

export interface BackupSummary {
  id: string;
  createdAt: string;
  entries: number;
  path: string;
}

export interface VerifyBackupResult {
  id: string;
  ok: boolean;
  checkedEntries: number;
  missing: string[];
  mismatched: string[];
}

function getBackupsDir(): string {
  return path.join(getConfigDir(), BACKUPS_DIR_NAME);
}

function computeSha256(filePath: string): string {
  const hash = createHash("sha256");
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest("hex");
}

function listSnapshotFiles(rootDir: string): string[] {
  const result: string[] = [];

  function walk(currentDir: string): void {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(currentDir, entry.name);
      const relative = path.relative(rootDir, absolute);

      if (!relative) {
        continue;
      }

      if (relative.startsWith(`${BACKUPS_DIR_NAME}${path.sep}`)) {
        continue;
      }

      if (entry.isDirectory()) {
        walk(absolute);
        continue;
      }

      if (entry.isFile()) {
        result.push(relative);
      }
    }
  }

  walk(rootDir);
  return result.sort((a, b) => a.localeCompare(b));
}

function readManifest(backupId: string): BackupManifest {
  const filePath = path.join(getBackupsDir(), backupId, MANIFEST_FILE_NAME);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as BackupManifest;
}

export function createBackupSnapshot(): BackupSummary {
  const sourceDir = getConfigDir();
  fs.mkdirSync(sourceDir, { recursive: true });
  fs.mkdirSync(getBackupsDir(), { recursive: true });

  const createdAt = new Date().toISOString();
  const id = `${createdAt.replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
  const backupDir = path.join(getBackupsDir(), id);
  fs.mkdirSync(backupDir, { recursive: true });

  const files = listSnapshotFiles(sourceDir);
  const entries: BackupEntry[] = [];

  for (const relativePath of files) {
    const from = path.join(sourceDir, relativePath);
    const to = path.join(backupDir, relativePath);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);

    const stats = fs.statSync(from);
    entries.push({
      relativePath,
      size: stats.size,
      sha256: computeSha256(from),
      mtimeMs: stats.mtimeMs,
    });
  }

  const manifest: BackupManifest = {
    id,
    createdAt,
    sourceDir,
    entries,
  };
  fs.writeFileSync(
    path.join(backupDir, MANIFEST_FILE_NAME),
    JSON.stringify(manifest, null, 2),
    "utf-8",
  );

  return {
    id,
    createdAt,
    entries: entries.length,
    path: backupDir,
  };
}

export function listBackupSnapshots(limit = 20): BackupSummary[] {
  const root = getBackupsDir();
  if (!fs.existsSync(root)) {
    return [];
  }

  const dirNames = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => b.localeCompare(a));

  const summaries: BackupSummary[] = [];
  for (const id of dirNames) {
    try {
      const manifest = readManifest(id);
      summaries.push({
        id: manifest.id,
        createdAt: manifest.createdAt,
        entries: manifest.entries.length,
        path: path.join(root, id),
      });
    } catch {
      // Skip malformed backup directories.
    }
  }

  const safeLimit = Number.isFinite(limit)
    ? Math.max(1, Math.floor(limit))
    : 20;
  return summaries.slice(0, safeLimit);
}

export function verifyBackupSnapshot(backupId: string): VerifyBackupResult {
  const id = backupId.trim();
  if (!id) {
    throw new Error("Missing backup id");
  }

  const manifest = readManifest(id);
  const backupDir = path.join(getBackupsDir(), id);

  const missing: string[] = [];
  const mismatched: string[] = [];

  for (const entry of manifest.entries) {
    const filePath = path.join(backupDir, entry.relativePath);
    if (!fs.existsSync(filePath)) {
      missing.push(entry.relativePath);
      continue;
    }

    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      mismatched.push(entry.relativePath);
      continue;
    }

    const hash = computeSha256(filePath);
    if (hash !== entry.sha256 || stats.size !== entry.size) {
      mismatched.push(entry.relativePath);
    }
  }

  return {
    id,
    ok: missing.length === 0 && mismatched.length === 0,
    checkedEntries: manifest.entries.length,
    missing,
    mismatched,
  };
}
