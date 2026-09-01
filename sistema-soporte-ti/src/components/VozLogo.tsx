export default function VozLogo({ withTagline = true }: { withTagline?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-700 shadow-inner">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75a3 3 0 0 0 3-3v-6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 10.5v1.5a6.75 6.75 0 0 1-13.5 0v-1.5M12 19.5v2.25" />
        </svg>
      </span>
      <div className="leading-tight">
        <p className="font-display text-lg font-extrabold tracking-tight text-white">VOZ360</p>
        {withTagline && <p className="text-[11px] font-medium text-brand-200">Conecta con Soluciones</p>}
      </div>
    </div>
  );
}
