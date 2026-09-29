import type { Config } from "@netlify/functions";
import { getUser } from "@netlify/identity";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { contents, notificationReads, notifications } from "../../db/schema.js";

const json = (body: unknown, status = 200) => Response.json(body, { status });
const isAdmin = (user: Awaited<ReturnType<typeof getUser>>) =>
  Boolean(user && (user.role === "admin" || user.roles?.includes("admin")));

export default async (req: Request) => {
  const user = await getUser();
  if (!user) return json({ error: "Faça login para continuar." }, 401);

  if (req.method === "GET") {
    const items = await db.select().from(contents)
      .where(eq(contents.published, true)).orderBy(desc(contents.createdAt));
    const alerts = await db.select({
      id: notifications.id, contentId: notifications.contentId, kind: notifications.kind,
      title: notifications.title, message: notifications.message, createdAt: notifications.createdAt,
      readUserId: notificationReads.userId,
    }).from(notifications)
      .leftJoin(notificationReads, and(
        eq(notificationReads.notificationId, notifications.id),
        eq(notificationReads.userId, user.id),
      )).orderBy(desc(notifications.createdAt)).limit(30);
    return json({ items, notifications: alerts.map(({ readUserId, ...alert }) => ({ ...alert, read: Boolean(readUserId) })), admin: isAdmin(user) });
  }

  if (req.method === "POST") {
    if (!isAdmin(user)) return json({ error: "Acesso exclusivo da administração." }, 403);
    const body = await req.json();
    const type = body.type === "live" ? "live" : "lesson";
    if (!body.title?.trim() || !body.videoUrl?.trim()) return json({ error: "Informe título e link do vídeo." }, 400);
    const [item] = await db.insert(contents).values({
      type, title: body.title.trim(), description: body.description?.trim() || "",
      videoUrl: body.videoUrl.trim(), scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      isLive: type === "live" && Boolean(body.isLive),
    }).returning();
    const liveNow = type === "live" && item.isLive;
    await db.insert(notifications).values({
      contentId: item.id,
      kind: liveNow ? "live" : "content",
      title: liveNow ? "A mentoria começou" : type === "live" ? "Nova mentoria agendada" : "Nova aula disponível",
      message: liveNow ? `${item.title} está ao vivo agora.` : `${item.title} acaba de ser adicionada.`,
    });
    return json(item, 201);
  }

  if (req.method === "PATCH") {
    if (!isAdmin(user)) return json({ error: "Acesso exclusivo da administração." }, 403);
    const body = await req.json();
    const id = Number(body.id);
    if (!id) return json({ error: "Conteúdo inválido." }, 400);
    const [item] = await db.update(contents).set({ isLive: Boolean(body.isLive) })
      .where(eq(contents.id, id)).returning();
    if (!item) return json({ error: "Conteúdo não encontrado." }, 404);
    if (item.isLive) await db.insert(notifications).values({
      contentId: item.id, kind: "live", title: "A mentoria começou", message: `${item.title} está ao vivo agora.`,
    });
    return json(item);
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = { path: "/api/content" };
