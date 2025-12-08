import { CheckCircle, X } from 'lucide-react';

interface UndoToastProps {
  tripCount: number;
  remainingSeconds: number;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoToast({
  tripCount,
  remainingSeconds,
  onUndo,
  onDismiss,
}: UndoToastProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-green-600 text-white rounded-lg shadow-2xl px-6 py-4 flex items-center space-x-4 min-w-[320px]">
        <CheckCircle className="w-5 h-5 flex-shrink-0" />

        <div className="flex-1">
          <p className="font-medium">
            {tripCount === 1 ? 'Trip deleted' : `${tripCount} trips deleted`}
          </p>
        </div>

        <button
          onClick={onUndo}
          className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          Undo ({remainingSeconds}s)
        </button>

        <button
          onClick={onDismiss}
          className="p-1 hover:bg-white/20 rounded transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
