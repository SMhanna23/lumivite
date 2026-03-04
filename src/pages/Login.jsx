import { useState } from "react"
import { motion } from "framer-motion"
import { getAuth, signInWithEmailAndPassword } from "firebase/auth"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    setError("")
    try {
      const auth = getAuth()
      await signInWithEmailAndPassword(auth, email, password)
    } catch (e) {
      setError("Invalid email or password")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0a08] flex items-center justify-center px-6"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #1a1208 0%, #0d0a08 70%)" }}>
      <motion.div className="w-full max-w-sm"
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>

        <div className="text-center mb-10">
          <p className="text-[#c9a96e] tracking-[0.4em] text-xs uppercase mb-3">Lumivite</p>
          <h1 className="font-serif text-4xl font-light text-white">Admin Portal</h1>
        </div>

        <div className="space-y-4">
          <input value={email} onChange={e => setEmail(e.target.value)}
            type="email" placeholder="Email"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:border-[#c9a96e] transition" />
          <input value={password} onChange={e => setPassword(e.target.value)}
            type="password" placeholder="Password"
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:border-[#c9a96e] transition" />

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button onClick={handleLogin} disabled={loading}
            className="w-full py-4 bg-[#c9a96e] text-black font-semibold rounded-lg hover:bg-[#b8965d] transition tracking-wider disabled:opacity-50">
            {loading ? "Signing in..." : "SIGN IN"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}