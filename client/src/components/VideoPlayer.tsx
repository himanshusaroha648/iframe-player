import { MediaPlayer, MediaProvider } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import { useRef } from 'react';
import type { MediaPlayerInstance } from '@vidstack/react';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

interface VideoPlayerProps {
  src: string;
  title: string;
}

export default function VideoPlayer({ src, title }: VideoPlayerProps) {
  const player = useRef<MediaPlayerInstance>(null);

  return (
    <div className="w-full h-full bg-black flex items-center justify-center overflow-hidden">
      <MediaPlayer
        ref={player}
        title={title}
        src={src}
        aspectRatio="16/9"
        load="visible"
        autoplay={true}
        playsInline
        crossOrigin
        className="w-full h-full"
        onCanPlay={() => {
          if (player.current) {
            player.current.play().catch(() => {
              // Silently handle autoplay block
            });
          }
        }}
      >
        <MediaProvider />
        <DefaultVideoLayout 
          icons={defaultLayoutIcons}
          seekStep={10}
        />
      </MediaPlayer>
    </div>
  );
}
