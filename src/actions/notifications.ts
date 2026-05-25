"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";

export type NotificationPrefs = {
  approvals: boolean;
  campaigns: boolean;
  screens: boolean;
  weekly: boolean;
  realtime: boolean;
};

export async function saveNotificationPrefs(prefs: NotificationPrefs) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");

  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(userId, {
    unsafeMetadata: {
      notificationPrefs: prefs,
    },
  });
}

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const saved = user.unsafeMetadata?.notificationPrefs as NotificationPrefs | undefined;

  return saved ?? {
    approvals: true,
    campaigns: true,
    screens: false,
    weekly: true,
    realtime: false,
  };
}
