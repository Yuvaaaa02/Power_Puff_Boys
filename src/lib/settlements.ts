import { mkdir, readFile, writeFile, copyFile } from "fs/promises";
import path from "path";
import { SettlementsData } from "./types";
import { existsSync } from "fs";

function resolveDataFilePath(filename: string) {
  if (process.env.VERCEL) {
    return path.join("/tmp", filename);
  }
  return path.join(process.cwd(), "data", filename);
}

async function ensureDataFile(filename: string, defaultData: string) {
  const targetFile = resolveDataFilePath(filename);
  
  if (process.env.VERCEL) {
    if (!existsSync(targetFile)) {
      const sourceFile = path.join(process.cwd(), "data", filename);
      if (existsSync(sourceFile)) {
        await copyFile(sourceFile, targetFile);
      } else {
        await writeFile(targetFile, defaultData, "utf8");
      }
    }
  } else {
    const dataDir = path.dirname(targetFile);
    await mkdir(dataDir, { recursive: true });
    if (!existsSync(targetFile)) {
      await writeFile(targetFile, defaultData, "utf8");
    }
  }
  return targetFile;
}

export async function readSettlements(): Promise<SettlementsData> {
  const file = await ensureDataFile("settlements.json", "[]");
  const raw = await readFile(file, "utf8");
  return JSON.parse(raw);
}

export async function writeSettlements(data: SettlementsData): Promise<void> {
  const file = await ensureDataFile("settlements.json", "[]");
  await writeFile(file, JSON.stringify(data, null, 2), "utf8");
}
