/**
 * saveFile — mirrors cbonsai's saveToFile / loadFromFile.
 * Only two integers are persisted: the seed and the branch count, written as
 * "<seed> <branchCount>" (space-separated). The tree itself is never stored;
 * it is replayed deterministically from the seed.
 */
import { readFileSync, writeFileSync } from 'node:fs';

export interface SaveData { seed: number; branchCount: number; }

/** Serialize to the on-disk format: "<seed> <branchCount>". */
export function serializeSave(seed: number, branchCount: number): string {
  return `${seed} ${branchCount}`;
}

/** Parse "<seed> <branchCount>" (whitespace-separated). Throws on malformed input. */
export function parseSave(content: string): SaveData {
  const tokens = content.trim().split(/\s+/);
  if (tokens.length < 2) {
    throw new Error('Invalid save file: expected "<seed> <branchCount>"');
  }
  const seed = Number.parseInt(tokens[0], 10);
  const branchCount = Number.parseInt(tokens[1], 10);
  if (!Number.isFinite(seed) || !Number.isFinite(branchCount)) {
    throw new Error('Invalid save file: expected "<seed> <branchCount>"');
  }
  return { seed, branchCount };
}

/** Read + parse a save file from disk. */
export function readSaveFile(path: string): SaveData {
  const content = readFileSync(path, 'utf8');
  return parseSave(content);
}

/** Serialize + write a save file to disk (creating/overwriting). */
export function writeSaveFile(path: string, seed: number, branchCount: number): void {
  writeFileSync(path, serializeSave(seed, branchCount), 'utf8');
}
