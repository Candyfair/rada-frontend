import { useState, useEffect } from "react";

export function useFleetSummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch("/api/summary");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setSummary(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();

    // Refresh every 5 minutes
    const interval = setInterval(fetchSummary, 5 * 60 * 1000);

    // Clear the interval when the component unmounts
    return () => clearInterval(interval);
  }, []);

  return { summary, loading, error };
}