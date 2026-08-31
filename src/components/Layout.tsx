import { Outlet } from 'react-router-dom';
import { VerseMarquee } from './VerseMarquee';
import { Header } from './Header';
import { Footer } from './Footer';
import { PlayerBar } from './PlayerBar';
import { BackToTop } from './BackToTop';
import { usePlayer } from '../player/PlayerContext';

export function Layout() {
  const { current } = usePlayer();
  return (
    <div className={`flex min-h-screen flex-col ${current ? 'pb-32 sm:pb-28' : ''}`}>
      <VerseMarquee />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <BackToTop />
      <PlayerBar />
    </div>
  );
}
