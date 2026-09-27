import { getDb } from "./db";

export type Subscriber = { id: number; email: string; created_at: string };

export function addSubscriber(email: string) {
  getDb().prepare("INSERT OR IGNORE INTO subscribers (email) VALUES (?)").run(email);
}
export function removeSubscriber(id: number) {
  getDb().prepare("DELETE FROM subscribers WHERE id = ?").run(id);
}
export function listSubscribers(): Subscriber[] {
  return getDb().prepare("SELECT * FROM subscribers ORDER BY created_at DESC").all() as Subscriber[];
}
export function countSubscribers(): number {
  return (getDb().prepare("SELECT COUNT(*) c FROM subscribers").get() as { c: number }).c;
}
