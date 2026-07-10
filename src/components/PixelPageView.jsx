import { useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"

export default function PixelPageView() {
  const location = useLocation()
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (typeof window.fbq === "function") {
      window.fbq("track", "PageView")
    }
  }, [location.pathname, location.search])

  return null
}
