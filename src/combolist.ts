import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMBO_FILE = path.join(__dirname, "data", "combolist.txt");

export function readAccounts(): string[] {
  if (!fs.existsSync(COMBO_FILE)) {
    fs.writeFileSync(COMBO_FILE, "", "utf8");
    return [];
  }
  const content = fs.readFileSync(COMBO_FILE, "utf8");
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function writeAccounts(accounts: string[]): void {
  fs.writeFileSync(COMBO_FILE, accounts.join("\n") + (accounts.length > 0 ? "\n" : ""), "utf8");
}

export function getRandomAccount(): string | null {
  const accounts = readAccounts();
  if (accounts.length === 0) return null;
  const index = Math.floor(Math.random() * accounts.length);
  return accounts[index] ?? null;
}

export function removeAccount(account: string): boolean {
  const accounts = readAccounts();
  const newAccounts = accounts.filter((a) => a !== account);
  if (newAccounts.length === accounts.length) return false;
  writeAccounts(newAccounts);
  return true;
}

export function addAccounts(lines: string[]): number {
  const existing = new Set(readAccounts());
  const toAdd = lines.map((l) => l.trim()).filter((l) => l.length > 0 && !existing.has(l));
  const merged = [...existing, ...toAdd];
  writeAccounts(merged);
  return toAdd.length;
}

export function accountCount(): number {
  return readAccounts().length;
}
