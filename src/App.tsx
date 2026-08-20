import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PlayerProvider } from './player/PlayerContext';
import { CatalogProvider } from './lib/CatalogProvider';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Sermons } from './pages/Sermons';
import { SeriesDetail } from './pages/SeriesDetail';
import { SermonPage } from './pages/SermonPage';
import { PastorDetail } from './pages/PastorDetail';
import { Devotional } from './pages/Devotional';
import { Bible } from './pages/Bible';
import { Music } from './pages/Music';
import { Give } from './pages/Give';
import { AdminPage } from './pages/admin/AdminPage';

// The reach map carries ~100KB of world geometry — loaded only when visited.
const Reach = lazy(() => import('./pages/Reach'));

export default function App() {
  return (
    <BrowserRouter>
      <PlayerProvider>
        <CatalogProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="sermons" element={<Sermons />} />
              <Route path="series/:id" element={<SeriesDetail />} />
              <Route path="sermon/:id" element={<SermonPage />} />
              <Route path="pastor/:id" element={<PastorDetail />} />
              <Route path="devotional" element={<Devotional />} />
              <Route path="bible" element={<Bible />} />
              <Route path="music" element={<Music />} />
              <Route path="support" element={<Give />} />
              <Route
                path="reach"
                element={
                  <Suspense fallback={<p className="py-24 text-center text-stone-400">Loading map…</p>}>
                    <Reach />
                  </Suspense>
                }
              />
              <Route path="give" element={<Navigate to="/support" replace />} />
              <Route path="admin" element={<AdminPage />} />
              <Route
                path="*"
                element={
                  <div className="py-24 text-center text-stone-500">Page not found.</div>
                }
              />
            </Route>
          </Routes>
        </CatalogProvider>
      </PlayerProvider>
    </BrowserRouter>
  );
}
