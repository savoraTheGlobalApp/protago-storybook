import { useState, useEffect } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface FaceSwapPreviewProps {
  storySlug: string;
  photoUrl: string;       // public URL to the uploaded child photo
  childName?: string;
}

type JobStatus = 'idle' | 'pending' | 'processing' | 'done' | 'failed';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const POLL_INTERVAL_MS = 5000;

export function FaceSwapPreview({ storySlug, photoUrl, childName }: FaceSwapPreviewProps) {
  const [jobId, setJobId]       = useState<string | null>(null);
  const [status, setStatus]     = useState<JobStatus>('idle');
  const [scenes, setScenes]     = useState<[string?, string?]>([]);
  const [error, setError]       = useState<string | null>(null);

  // Trigger the preview job on mount
  useEffect(() => {
    if (!storySlug || !photoUrl) return;

    setStatus('pending');
    fetch(`${API_BASE}/api/preview/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ story_slug: storySlug, photo_url: photoUrl, child_name: childName }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setJobId(data.job_id);
        setStatus('processing');
      })
      .catch(err => {
        setError(err.message);
        setStatus('failed');
      });
  }, [storySlug, photoUrl]);

  // Poll for status
  useEffect(() => {
    if (!jobId || status === 'done' || status === 'failed') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/preview/status/${jobId}`);
        const data = await res.json();

        if (data.status === 'done') {
          setScenes([data.result_scene_1, data.result_scene_2]);
          setStatus('done');
          clearInterval(interval);
        } else if (data.status === 'failed') {
          setError(data.error_message || 'Preview generation failed');
          setStatus('failed');
          clearInterval(interval);
        }
      } catch {
        // network hiccup — keep polling
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [jobId, status]);

  if (status === 'idle') return null;

  if (status === 'pending' || status === 'processing') {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <p className="text-lg font-semibold text-gray-700">
          Creating {childName ? `${childName}'s` : 'your'} personalised preview…
        </p>
        <p className="text-sm text-gray-500">This takes about 2–3 minutes. You can wait or come back!</p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="text-center py-6 text-red-500">
        <p>Preview failed: {error}</p>
      </div>
    );
  }

  // done
  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="flex items-center gap-2 text-amber-600 font-semibold text-lg">
        <Sparkles className="w-5 h-5" />
        {childName ? `${childName}'s` : 'Your'} personalised preview is ready!
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {scenes.filter(Boolean).map((url, i) => (
          <div key={i} className="rounded-xl overflow-hidden shadow-md">
            <img
              src={url}
              alt={`Preview scene ${i + 1}`}
              className="w-full object-cover"
            />
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-500 text-center max-w-md">
        These are 4 pages from your book. The full story has 26 beautifully illustrated pages.
      </p>
    </div>
  );
}
