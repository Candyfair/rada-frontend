import { useEffect, useState } from "react";

// Export function useAssets
export function useAssets() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    async function fetchAssets() {
      try {
        const response = await fetch("/api/assets");
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        const data = await response.json();
        setAssets(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAssets();

    // Refresh every 5 minutes
    const interval = setInterval(fetchAssets, 5 * 60 * 1000);

    // Clear the interval when the component unmounts
    return () => clearInterval(interval);
  }, []);

  return {assets, loading, error}    
}