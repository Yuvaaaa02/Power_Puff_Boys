import { mkdir, readFile, writeFile, copyFile } from "fs/promises";
import path from "path";
import { UsersData, ExpensesData } from "./types";
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
    // In Vercel, we need to copy from process.cwd()/data to /tmp if it doesn't exist
    if (!existsSync(targetFile)) {
      const sourceFile = path.join(process.cwd(), "data", filename);
      if (existsSync(sourceFile)) {
        await copyFile(sourceFile, targetFile);
      } else {
        await writeFile(targetFile, defaultData, "utf8");
      }
    }
  } else {
    // Locally, ensure the directory and file exist
    const dataDir = path.dirname(targetFile);
    await mkdir(dataDir, { recursive: true });
    if (!existsSync(targetFile)) {
      await writeFile(targetFile, defaultData, "utf8");
    }
  }
  return targetFile;
}

export async function readUsers(): Promise<UsersData> {
  const file = await ensureDataFile("users.json", "{}");
  const raw = await readFile(file, "utf8");
  return JSON.parse(raw);
}

export async function writeUsers(data: UsersData): Promise<void> {
  const file = await ensureDataFile("users.json", "{}");
  await writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

export async function readExpenses(): Promise<ExpensesData> {
  const file = await ensureDataFile("expenses.json", "[]");
  const raw = await readFile(file, "utf8");
  const data = JSON.parse(raw) as ExpensesData;
  
  let modified = false;
  const upgraded = data.map(exp => {
    if (!exp.id) {
      exp.id = crypto.randomUUID();
      modified = true;
    }
    return exp;
  });
  
  if (modified) {
    // Avoid circular import issues by writing inline
    await writeFile(file, JSON.stringify(upgraded, null, 2), "utf8");
  }
  
  return upgraded;
}

export async function writeExpenses(data: ExpensesData): Promise<void> {
  const file = await ensureDataFile("expenses.json", "[]");
  await writeFile(file, JSON.stringify(data, null, 2), "utf8");
}
