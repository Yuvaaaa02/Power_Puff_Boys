import { mkdir, readFile, writeFile, copyFile } from "fs/promises";
import path from "path";
import { SettlementsData } from "./types";
import { existsSync } from "fs";
import crypto from "crypto";

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
  const data = JSON.parse(raw) as SettlementsData;
  
  let modified = false;
  const upgraded = data.map(s => {
    if (!s.id) {
      s.id = crypto.randomUUID();
      modified = true;
    }
    return s;
  });
  
  if (modified) {
    await writeFile(file, JSON.stringify(upgraded, null, 2), "utf8");
  }
  
  return upgraded;
}

export async function writeSettlements(data: SettlementsData): Promise<void> {
  const file = await ensureDataFile("settlements.json", "[]");
  await writeFile(file, JSON.stringify(data, null, 2), "utf8");
}
