import { db } from "@/lib/db";

type UpsertUserInput = {
  clerkId: string;
  email: string;
  name: string;
  avatar?: string;
  role?: "ADMIN" | "EXECUTIVE" | "CLIENT";
};

export async function upsertUser(input: UpsertUserInput) {
  return db.user.upsert({
    where: { clerkId: input.clerkId },
    create: {
      clerkId: input.clerkId,
      email: input.email,
      name: input.name,
      avatar: input.avatar,
      role: input.role ?? "CLIENT",
    },
    update: {
      email: input.email,
      name: input.name,
      avatar: input.avatar,
      lastLoginAt: new Date(),
    },
  });
}

export async function getUserByClerkId(clerkId: string) {
  return db.user.findUnique({
    where: { clerkId },
    include: { company: { select: { id: true, name: true, slug: true } } },
  });
}

export async function deleteUser(clerkId: string) {
  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } });
  if (!user) return;
  await db.user.update({
    where: { id: user.id },
    data: { status: "INACTIVE", clerkId: null },
  });
}
