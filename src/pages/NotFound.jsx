import { motion } from "framer-motion"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0806] flex items-center justify-center text-center px-6"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #1a0f07 0%, #0a0806 60%)" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-6xl mb-6">🔍</div>
        <h1 className="font-serif text-4xl font-light text-white mb-3">Page Not Found</h1>
        <p className="text-white/40 text-sm mb-10 max-w-xs mx-auto">
          The page you're looking for doesn't exist or the link may have changed.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/"
            className="px-8 py-3 rounded-full font-semibold text-black text-sm tracking-wider transition"
            style={{ background: "#c9a96e" }}>
            Go to Homepage
          </a>
          <a href={`https://wa.me/96171444328?text=${encodeURIComponent("Hi! I need help with my Lumivite invitation.")}`}
            target="_blank" rel="noopener noreferrer"
            className="px-8 py-3 rounded-full text-sm tracking-wider border border-white/20 text-white hover:border-[#c9a96e] hover:text-[#c9a96e] transition">
            Contact Support
          </a>
        </div>
        <p className="text-white/20 text-xs mt-10">
          <span className="text-[#c9a96e] font-serif">Lumivite</span> · Digital Wedding Invitations
        </p>
      </motion.div>
    </div>
  )
}
