import { useEffect, useState } from 'react';
import { IMAGES } from '../lib/images';
import { PageHero } from './Sermons';
import { HYMN_VIDEOS, type HymnVideo } from '../lib/videos';
import { usePlayer } from '../player/PlayerContext';

export function Hymns() {
  // Only one thing plays at a time: one video, or the sermon player.
  const [activeId, setActiveId] = useState<string | null>(null);
  const player = usePlayer();

  // Starting a sermon (or music) in the player bar stops the video.
  useEffect(() => {
    if (player.isPlaying) setActiveId(null);
  }, [player.isPlaying]);

  const start = (id: string) => {
    if (player.isPlaying) player.toggle(); // don't talk over a sermon
    setActiveId(id);
  };

  return (
    <>
      <PageHero
        image={IMAGES.coast}
        title="Hymns"
        subtitle="Hymns of the faith — sing along with the words on screen."
      />
      <div className="mx-auto max-w-5xl px-4 pt-10 pb-4 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2">
          {HYMN_VIDEOS.map((v) => (
            <VideoCard
              key={v.id}
              video={v}
              playing={activeId === v.id}
              onPlay={() => start(v.id)}
              onStop={() => setActiveId(null)}
            />
          ))}
        </div>
      </div>
    </>
  );
}

// Shows the thumbnail until tapped, so YouTube only loads for videos people
// actually play — keeps the page quick on phones.
function VideoCard({
  video,
  playing,
  onPlay,
  onStop,
}: {
  video: HymnVideo;
  playing: boolean;
  onPlay: () => void;
  onStop: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="relative aspect-video bg-black">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
            title={video.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 size-full"
          />
        ) : (
          <button
            onClick={onPlay}
            aria-label={`Play ${video.title}`}
            className="group absolute inset-0 size-full"
          >
            <img
              src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
            <span className="absolute inset-0 bg-black/20 transition group-hover:bg-black/10" />
            <span className="absolute top-1/2 left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gold-400 text-forest-900 shadow-lg transition group-hover:scale-105">
              <svg className="size-7 translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 p-4">
        <h3 className="font-display font-semibold text-forest-800">{video.title}</h3>
        {video.style && (
          <span className="shrink-0 rounded-full bg-forest-50 px-2 py-0.5 text-[11px] font-medium text-forest-700">
            {video.style}
          </span>
        )}
        {playing && (
          <button
            onClick={onStop}
            className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full bg-forest-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-forest-600"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="1.5" />
            </svg>
            Stop
          </button>
        )}
      </div>
    </article>
  );
}
