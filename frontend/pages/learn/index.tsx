import Link from 'next/link';
import { modules } from '../../content/education/modules';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

interface ProgressMap {
  [lesson: string]: boolean;
}

export default function BootcampDashboard() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ProgressMap>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data } = await axios.get(`/api/education/user/${user.uid}/lessons`);
        setProgress(data.reduce((acc: ProgressMap, l: any) => {
          acc[l.lesson_slug] = true;
          return acc;
        }, {}));
      } catch (e) {
        console.error('Failed to fetch lesson progress', e);
      }
    })();
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Investor Bootcamp</h1>
      {modules.map((mod) => (
        <div key={mod.id} className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{mod.title}</h2>
          <ul className="space-y-2">
            {mod.lessons.map((lesson) => {
              const done = progress[lesson.slug];
              return (
                <li key={lesson.slug} className="flex items-center justify-between bg-white rounded shadow p-3">
                  <span>{lesson.title}</span>
                  <Link
                    href={`/learn/lesson/${lesson.slug}`}
                    className={`px-3 py-1 rounded text-sm ${done ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white'}`}
                  >
                    {done ? 'Completed' : 'Start'}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
