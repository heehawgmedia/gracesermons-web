import { useState } from 'react';
import { AdminGate } from './AdminGate';
import { SermonsAdmin } from './SermonsAdmin';
import { PastorsAdmin } from './PastorsAdmin';
import { SeriesAdmin } from './SeriesAdmin';
import { FilesAdmin } from './FilesAdmin';

type Tab = 'sermons' | 'pastors' | 'series' | 'files';

const TABS: [Tab, string][] = [
  ['sermons', 'Sermons'],
  ['series', 'Series'],
  ['pastors', 'Preachers'],
  ['files', 'Files'],
];

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('sermons');

  return (
    <AdminGate>
      <div className="mx-auto max-w-4xl px-4 pt-6 pb-16 sm:px-6">
        <h1 className="font-display text-3xl font-semibold text-forest-800">Admin</h1>
        <p className="mt-1 text-sm text-stone-500">
          Manage the sermon library. Changes go live immediately.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                tab === key
                  ? 'bg-forest-700 text-white'
                  : 'border border-stone-300 text-stone-600 hover:bg-forest-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === 'sermons' && <SermonsAdmin />}
          {tab === 'series' && <SeriesAdmin />}
          {tab === 'pastors' && <PastorsAdmin />}
          {tab === 'files' && <FilesAdmin />}
        </div>
      </div>
    </AdminGate>
  );
}
