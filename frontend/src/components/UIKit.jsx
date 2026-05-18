import { Loader2, AlertCircle, FileText, Info } from 'lucide-react';

/* =========================
   Spinner
========================= */
export function Spinner({ size = 20 }) {
  const s = typeof size === 'number' ? `${size}px` : size;

  return (
    <div className="flex items-center justify-center">
      <Loader2
        className="animate-spin text-emerald-600"
        style={{ width: s, height: s }}
      />
    </div>
  );
}

/* =========================
   Error Box
========================= */
export function ErrorBox({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-800 shadow-sm">
      
      <div className="mt-0.5">
        <AlertCircle className="w-5 h-5 text-red-600" />
      </div>

      <div className="flex-1 font-medium">
        {message}
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-semibold text-red-700 hover:underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/* =========================
   Empty State
========================= */
export function EmptyState({ title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 border border-dashed border-stone-300 rounded-2xl bg-white shadow-sm">

      {/* Icon */}
      <div className="w-14 h-14 flex items-center justify-center rounded-full bg-emerald-50 mb-4">
        <FileText className="w-7 h-7 text-emerald-600" />
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-stone-900 mb-1">
        {title}
      </h3>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-sm text-stone-500 max-w-xs mb-4">
          {subtitle}
        </p>
      )}

      {/* Action */}
      {action}
    </div>
  );
}

/* =========================
   Disclaimer
========================= */
export function Disclaimer({ text }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900 leading-relaxed shadow-sm">

      <div className="mt-0.5">
        <Info className="w-5 h-5 text-amber-600" />
      </div>

      <span className="font-medium">
        {text || 'This is not a medical diagnosis. Always consult a qualified healthcare professional.'}
      </span>
    </div>
  );
}