export function GoatMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 30c0-3 2-5 5-5h2l-2-6c-.5-1.5 1-3 2.4-2.2L26 19l4-2 4 2 4.6-2.2C40 16 41.5 17.5 41 19l-2 6h2c3 0 5 2 5 5v6c0 6-4 11-10 13l-1 5h-4l-1-3h-4l-1 3h-4l-1-5c-6-2-10-7-10-13v-6z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="26" cy="32" r="1.2" fill="currentColor" />
      <circle cx="38" cy="32" r="1.2" fill="currentColor" />
      <path d="M30 38c1 1 3 1 4 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
