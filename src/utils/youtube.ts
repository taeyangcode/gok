import type { AudioSourceId } from "#/db/schema/audios";

export function youtubeUrlFromId(id: AudioSourceId): string {
  return `https://www.youtube.com/watch?v=${id}`;
}
