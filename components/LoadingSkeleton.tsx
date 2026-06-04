export default function LoadingSkeleton({ className = 'h-4 bg-slate-200/70 rounded' }: { className?: string }) {
  return <div className={className + ' animate-pulse'} />
}
