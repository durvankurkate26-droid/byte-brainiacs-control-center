"use client";

import { useEffect, useRef, useState } from "react";

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  paused: boolean;
}

const SCANNER_ELEMENT_ID = "qr-scanner-region";

export default function QRScanner({ onScan, paused }: QRScannerProps) {
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const stateEnumRef = useRef<typeof import("html5-qrcode").Html5QrcodeScannerState | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const lastScanRef = useRef<{ text: string; time: number }>({
    text: "",
    time: 0,
  });

  useEffect(() => {
    let isMounted = true;

    async function start() {
      try {
        const { Html5Qrcode, Html5QrcodeScannerState } = await import(
          "html5-qrcode"
        );
        if (!isMounted) return;

        stateEnumRef.current = Html5QrcodeScannerState;
        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            // Debounce: ignore identical scans within 3s so one camera
            // frame burst doesn't fire onScan multiple times in a row.
            const now = Date.now();
            if (
              decodedText === lastScanRef.current.text &&
              now - lastScanRef.current.time < 3000
            ) {
              return;
            }
            lastScanRef.current = { text: decodedText, time: now };
            onScan(decodedText.trim());
          },
          () => {
            // Per-frame "no QR found" callback — fires constantly while
            // scanning, intentionally ignored (not an error state).
          }
        );
        if (isMounted) setIsStarting(false);
      } catch (err) {
        if (!isMounted) return;
        const message =
          err instanceof Error
            ? err.message
            : "Could not access camera. Check permissions and try again.";
        setError(message);
        setIsStarting(false);
      }
    }

    start();

    return () => {
      isMounted = false;
      const scanner = scannerRef.current;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {
            // Scanner may already be stopped — safe to ignore on unmount.
          });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pause/resume camera frame processing while a result modal is showing,
  // so it doesn't immediately re-scan the same code.
  useEffect(() => {
    const scanner = scannerRef.current;
    const States = stateEnumRef.current;
    if (!scanner || !States) return;
    try {
      const currentState = scanner.getState();
      if (paused && currentState === States.SCANNING) {
        scanner.pause(true);
      } else if (!paused && currentState === States.PAUSED) {
        scanner.resume();
      }
    } catch {
      // State checks can throw if the scanner hasn't fully initialized yet.
    }
  }, [paused]);

  return (
    <div className="space-y-3">
      <div
        id={SCANNER_ELEMENT_ID}
        className="mx-auto w-full max-w-sm overflow-hidden rounded border border-lilac/30"
      />
      {isStarting && !error && (
        <p className="text-center text-sm text-mist">Starting camera…</p>
      )}
      {error && (
        <div className="rounded border border-magenta/30 bg-magenta/5 p-4 text-sm text-magenta">
          {error}
        </div>
      )}
    </div>
  );
}
