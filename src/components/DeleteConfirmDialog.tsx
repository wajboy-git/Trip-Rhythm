import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  tripCount: number;
  tripNames: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({
  isOpen,
  tripCount,
  tripNames,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter') {
        onConfirm();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  const displayNames = tripNames.slice(0, 3);
  const remainingCount = tripCount - displayNames.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>

          <div className="flex-1 pt-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {tripCount === 1 ? 'Delete trip?' : `Delete ${tripCount} trips?`}
            </h2>

            {displayNames.length > 0 && (
              <div className="mb-3">
                <ul className="text-sm text-gray-600 space-y-1">
                  {displayNames.map((name, index) => (
                    <li key={index} className="truncate">• {name}</li>
                  ))}
                  {remainingCount > 0 && (
                    <li className="text-gray-500 italic">and {remainingCount} more...</li>
                  )}
                </ul>
              </div>
            )}

            <p className="text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
              This action cannot be undone after 10 seconds.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
