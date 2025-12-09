import { useEffect, useState } from 'react';
import { X, ExternalLink, Loader } from 'lucide-react';

interface WikipediaModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
}

interface WikiPage {
  title: string;
  content: string;
  url: string;
  image?: string;
}

export function WikipediaModal({ isOpen, title, onClose }: WikipediaModalProps) {
  const [page, setPage] = useState<WikiPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && title) {
      fetchWikipediaContent(title);
    }
  }, [isOpen, title]);

  function cleanPlaceName(rawTitle: string): string {
    let cleaned = rawTitle;

    const actionPrefixes = [
      'visit ',
      'explore ',
      'tour ',
      'see ',
      'check out ',
      'discover ',
      'experience ',
      'walk through ',
      'walk to ',
      'walk ',
      'stroll through ',
      'stroll to ',
      'stroll ',
    ];

    const lowerTitle = cleaned.toLowerCase();
    for (const prefix of actionPrefixes) {
      if (lowerTitle.startsWith(prefix)) {
        cleaned = cleaned.substring(prefix.length);
        break;
      }
    }

    cleaned = cleaned.replace(/^the\s+/i, '');

    const actionSuffixes = [
      ' visit',
      ' tour',
      ' exploration',
      ' experience',
    ];

    const lowerCleaned = cleaned.toLowerCase();
    for (const suffix of actionSuffixes) {
      if (lowerCleaned.endsWith(suffix)) {
        cleaned = cleaned.substring(0, cleaned.length - suffix.length);
        break;
      }
    }

    cleaned = cleaned.replace(/\s+of\s+.*$/i, '');

    const locationDescriptors = [
      "'s streets",
      "'s street",
      " streets",
      " street",
      " area",
      " district",
      " neighborhood",
      " neighbourhood",
      " quarter",
      " lane",
      " road",
      " avenue",
      " boulevard",
      " square",
      " plaza",
      " gardens",
      " garden",
      " park",
      " trail",
      " path",
      " walk",
    ];

    const lowerFinal = cleaned.toLowerCase();
    for (const descriptor of locationDescriptors) {
      if (lowerFinal.endsWith(descriptor)) {
        cleaned = cleaned.substring(0, cleaned.length - descriptor.length);
        break;
      }
    }

    return cleaned.trim();
  }

  async function searchWikipedia(query: string): Promise<string | null> {
    const searchParams = new URLSearchParams({
      action: 'opensearch',
      format: 'json',
      search: query,
      limit: '1',
      origin: '*',
    });

    const response = await fetch(
      `https://en.wikipedia.org/w/api.php?${searchParams.toString()}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data && data[1] && data[1].length > 0) {
      return data[1][0];
    }

    return null;
  }

  async function fetchWikipediaContent(searchTitle: string) {
    setLoading(true);
    setError(null);
    setPage(null);

    const cleanedTitle = cleanPlaceName(searchTitle);

    try {
      const bestMatch = await searchWikipedia(cleanedTitle);

      if (!bestMatch) {
        setError(`No Wikipedia page found for "${cleanedTitle}"`);
        return;
      }

      const searchParams = new URLSearchParams({
        action: 'query',
        format: 'json',
        titles: bestMatch,
        prop: 'extracts|pageimages|info',
        exintro: 'true',
        explaintext: 'true',
        inprop: 'url',
        piprop: 'original',
        origin: '*',
      });

      const response = await fetch(
        `https://en.wikipedia.org/w/api.php?${searchParams.toString()}`
      );

      if (!response.ok) throw new Error('Failed to fetch Wikipedia');

      const data = await response.json();
      const pages = data.query?.pages || {};
      const pageKey = Object.keys(pages)[0];

      if (!pageKey || pageKey === '-1') {
        setError(`No Wikipedia page found for "${cleanedTitle}"`);
        return;
      }

      const pageData = pages[pageKey];
      const wikiUrl = pageData.canonicalurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(bestMatch)}`;

      setPage({
        title: pageData.title,
        content: pageData.extract || 'No content available',
        url: wikiUrl,
        image: pageData.original?.source,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Wikipedia content');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 flex-1">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-sky-600 animate-spin" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
              {error}
            </div>
          )}

          {page && (
            <>
              {page.image && (
                <div className="mb-6">
                  <img
                    src={page.image}
                    alt={page.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="prose prose-sm max-w-none mb-6">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {page.content}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={page.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium"
                >
                  Read Full Article
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
