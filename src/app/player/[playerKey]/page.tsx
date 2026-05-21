import { notFound } from "next/navigation";
import { getPlayerScreen, getActivePlaylist } from "@/services/player.service";
import { DoohPlayer } from "./_player";

/* ──────────────────────────────────────────────────────────────────────
 * /player/[playerKey] — DOOH playback surface.
 *
 * Public route — no Clerk session needed. The playerKey in the URL is
 * the device credential (auto-generated cuid on screen creation).
 *
 * Server component loads the initial playlist and delegates all
 * real-time behaviour (heartbeat, polling, media transitions) to the
 * client player.
 * ────────────────────────────────────────────────────────────────────── */

interface Props {
  params: Promise<{ playerKey: string }>;
}

export default async function PlayerPage({ params }: Props) {
  const { playerKey } = await params;

  const screen = await getPlayerScreen(playerKey);
  if (!screen) notFound();

  const initialPlaylist = await getActivePlaylist(screen.id);

  return (
    <DoohPlayer
      playerKey={playerKey}
      screen={screen}
      initialPlaylist={initialPlaylist}
    />
  );
}
