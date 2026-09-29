import type { Config } from "@netlify/functions";
import { getUser } from "@netlify/identity";
import { db } from "../../db/index.js";
import { notificationReads } from "../../db/schema.js";

export default async (req: Request) => {
  const user = await getUser();
  if (!user) return Response.json({ error: "Não autorizado." }, { status: 401 });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const { ids } = await req.json();
  const cleanIds = Array.isArray(ids) ? ids.map(Number).filter(Boolean) : [];
  if (cleanIds.length) await db.insert(notificationReads).values(
    cleanIds.map((notificationId) => ({ notificationId, userId: user.id })),
  ).onConflictDoNothing();
  return Response.json({ ok: true });
};

export const config: Config = { path: "/api/notifications/read" };
