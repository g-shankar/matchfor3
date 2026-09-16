import { useEffect, useRef, useState, useCallback } from "react";
import { connectCloud, withTimeout } from "./cloud.js";
import { mergeProgress } from "./progress-sync.js";
export function useCloudProgress(progress, setProgress) {
  const [status, setStatus] = useState("connecting"),
    [retry, setRetry] = useState(0),
    [ready, setReady] = useState(false);
  const connection = useRef(null),
    latest = useRef(progress),
    active = useRef(true),
    revision = useRef(0),
    queue = useRef(Promise.resolve());
  latest.current = progress;
  useEffect(() => {
    active.current = true;
    let cancelled = false;
    setReady(false);
    setStatus("connecting");
    connection.current = null;
    withTimeout(connectCloud())
      .then((cloud) => {
        if (cancelled) return;
        connection.current = cloud;
        setProgress((p) => mergeProgress(cloud.progress, p));
        setReady(true);
        setStatus("saving");
      })
      .catch(() => {
        if (!cancelled) {
          setReady(true);
          setStatus("local");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [retry, setProgress]);
  useEffect(() => {
    if (!ready || !connection.current) return;
    const rev = ++revision.current;
    setStatus("saving");
    const timer = setTimeout(() => {
      const cloud = connection.current;
      queue.current = queue.current
        .catch(() => {})
        .then(async () => {
          if (!active.current || rev !== revision.current) return;
          try {
            await withTimeout(cloud.save(latest.current), 15000);
            if (active.current && rev === revision.current) setStatus("saved");
          } catch {
            if (active.current) setStatus("local");
          }
        });
    }, 1000);
    return () => clearTimeout(timer);
  }, [progress, ready, retry]);
  const retryCloud = useCallback(() => setRetry((n) => n + 1), []);
  useEffect(() => {
    window.addEventListener("online", retryCloud);
    return () => window.removeEventListener("online", retryCloud);
  }, [retryCloud]);
  useEffect(
    () => () => {
      active.current = false;
    },
    [],
  );
  return { status, retryCloud };
}
