"use client";

// Small client leaf so the QR generate page can stay a server component while
// still offering a browser-only "Print All" action.

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded border border-lilac/30 px-4 py-2 text-xs uppercase tracking-wider text-lilac hover:bg-lilac/10 print:hidden"
    >
      Print All
    </button>
  );
}
