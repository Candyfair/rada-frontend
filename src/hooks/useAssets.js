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
          throw new Error(`Erreur HTTP : ${response.status}`)
        }
        const data = await response.json()
        setAssets(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchAssets()
  }, [])

  return {assets, loading, error}    
}