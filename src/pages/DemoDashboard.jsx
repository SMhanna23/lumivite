import { useState } from "react"
import { motion } from "framer-motion"

const COUPLE = { groom: "Christopher", bride: "Joelle" }
const WEDDING_DATE = "2027-03-15"

const GUESTS = [
  { name: "Maya Abboud", attending: false, persons: 1, wishes: "Gutted to miss it — celebrating with you in spirit!" },
  { name: "Karim Baz", attending: true, persons: 1, wishes: "" },
  { name: "Sarah Nassif", attending: true, persons: 1, wishes: "We are beyond excited to be there!" },
  { name: "Tony Mansour", attending: true, persons: 1, wishes: "" },
  { name: "Lara Khalife", attending: true, persons: 1, wishes: "Love you both so much, can't wait to dance all night!" },
  { name: "Michel Nassar", attending: true, persons: 1, wishes: "" },
  { name: "Nour Akiki", attending: true, persons: 1, wishes: "So excited to witness your love story!" },
  { name: "Elie Younes", attending: true, persons: 1, wishes: "" },
  { name: "Nadine Rizk", attending: true, persons: 1, wishes: "Can't wait to celebrate with you both! ❤️" },
  { name: "Rami Saliba", attending: true, persons: 2, wishes: "" },
  { name: "Dana Rahme", attending: true, persons: 2, wishes: "So happy for you two, this is going to be magical!" },
  { name: "Fadi Abboud", attending: false, persons: 1, wishes: "" },
  { name: "Christelle Baz", attending: true, persons: 2, wishes: "This invitation is stunning, can't wait!" },
  { name: "Joe Zard", attending: true, persons: 2, wishes: "" },
  { name: "Mira Boutros", attending: true, persons: 2, wishes: "We're counting down the days!" },
  { name: "Charbel Azar", attending: true, persons: 2, wishes: "" },
  { name: "Yasmine Nassar", attending: true, persons: 3, wishes: "Here's to forever, see you there!" },
  { name: "Marc Bitar", attending: false, persons: 1, wishes: "" },
  { name: "Celine Yazbek", attending: true, persons: 3, wishes: "So much love to the both of you!" },
  { name: "Tarek Nehme", attending: true, persons: 4, wishes: "" },
  { name: "Rita Saliba", attending: true, persons: 1, wishes: "Can't believe the day is finally here!" },
  { name: "Wissam Rahme", attending: true, persons: 1, wishes: "" },
  { name: "Layla Geahchan", attending: false, persons: 1, wishes: "" },
  { name: "Georges Abdallah", attending: true, persons: 1, wishes: "" },
  { name: "Nathalie Zard", attending: true, persons: 1, wishes: "الله يفرحكن دايماً" },
  { name: "Antoine Boutros", attending: true, persons: 1, wishes: "" },
  { name: "Sandra Haddad", attending: true, persons: 1, wishes: "Congratulations! See you on the big day!" },
  { name: "Pierre Chalhoub", attending: true, persons: 1, wishes: "" },
  { name: "Maria Bitar", attending: true, persons: 1, wishes: "Wouldn't miss it for the world!" },
  { name: "Jad Yazbek", attending: true, persons: 2, wishes: "" },
  { name: "Diana Chamoun", attending: true, persons: 2, wishes: "Sending all our love and best wishes!" },
  { name: "Hadi Hanna", attending: true, persons: 2, wishes: "" },
  { name: "Christine Semaan", attending: true, persons: 2, wishes: "What a beautiful way to be invited, see you soon!" },
  { name: "Walid Geahchan", attending: false, persons: 1, wishes: "Wish we could be there, congratulations to you both!" },
  { name: "Carla Fares", attending: false, persons: 1, wishes: "" },
  { name: "Nabil Karam", attending: true, persons: 2, wishes: "" },
  { name: "Pascale Tabet", attending: true, persons: 3, wishes: "We are beyond excited to be there!" },
  { name: "Ziad Haddad", attending: true, persons: 3, wishes: "" },
  { name: "Roy Chalhoub", attending: true, persons: 3, wishes: "Love you both so much, can't wait to dance all night!" },
  { name: "Stephanie Chidiac", attending: true, persons: 4, wishes: "" },
  { name: "Joseph Daou", attending: true, persons: 1, wishes: "So excited to witness your love story!" },
  { name: "Myriam Chamoun", attending: true, persons: 1, wishes: "" },
  { name: "Elias Hanna", attending: true, persons: 1, wishes: "Can't wait to celebrate with you both! ❤️" },
  { name: "Natasha Choucair", attending: true, persons: 1, wishes: "" },
  { name: "Chady Matar", attending: false, persons: 1, wishes: "" },
  { name: "Vanessa Fares", attending: true, persons: 1, wishes: "" },
  { name: "Ramy Karam", attending: true, persons: 1, wishes: "This invitation is stunning, can't wait!" },
  { name: "Jessica Khoury", attending: true, persons: 1, wishes: "" },
  { name: "Toni Nakhle", attending: true, persons: 1, wishes: "We're counting down the days!" },
  { name: "Grace Hage", attending: true, persons: 2, wishes: "" },
  { name: "Maroun Chidiac", attending: true, persons: 2, wishes: "Here's to forever, see you there!" },
  { name: "Celina Maalouf", attending: false, persons: 1, wishes: "Gutted to miss it — celebrating with you in spirit!" },
  { name: "Bassam Saad", attending: true, persons: 2, wishes: "So much love to the both of you!" },
  { name: "Lea Nader", attending: true, persons: 2, wishes: "" },
  { name: "Khalil Choucair", attending: true, persons: 2, wishes: "Can't believe the day is finally here!" },
  { name: "Daniella Matar", attending: false, persons: 1, wishes: "" },
  { name: "Fouad Sfeir", attending: true, persons: 3, wishes: "مبروك! بانتظار يومكم الكبير ❤️" },
  { name: "Catherine Gerges", attending: true, persons: 3, wishes: "" },
  { name: "Hassan Khoury", attending: true, persons: 3, wishes: "الله يفرحكن دايماً" },
  { name: "Leila Nakhle", attending: true, persons: 4, wishes: "" },
  { name: "Omar Mansour", attending: true, persons: 1, wishes: "Congratulations! See you on the big day!" },
  { name: "Nadia Khalife", attending: true, persons: 1, wishes: "" },
  { name: "Samer Maalouf", attending: true, persons: 1, wishes: "Wouldn't miss it for the world!" },
  { name: "Christina Saad", attending: true, persons: 1, wishes: "" },
  { name: "Patrick Younes", attending: true, persons: 1, wishes: "Sending all our love and best wishes!" },
  { name: "Yara Rizk", attending: true, persons: 1, wishes: "" },
  { name: "Kevin Aoun", attending: false, persons: 1, wishes: "Unfortunately traveling that week, but wishing you all the best!" },
  { name: "Rania Sfeir", attending: true, persons: 1, wishes: "" },
  { name: "Anthony Abboud", attending: false, persons: 1, wishes: "" },
  { name: "Sabine Baz", attending: true, persons: 2, wishes: "" },
  { name: "Rabih Nassif", attending: true, persons: 2, wishes: "We are beyond excited to be there!" },
  { name: "Melissa Mansour", attending: true, persons: 2, wishes: "" },
  { name: "Jean Khalife", attending: true, persons: 2, wishes: "Love you both so much, can't wait to dance all night!" },
  { name: "Carine Nassar", attending: true, persons: 2, wishes: "" },
  { name: "Edmond Akiki", attending: true, persons: 2, wishes: "So excited to witness your love story!" },
  { name: "Julia Younes", attending: true, persons: 2, wishes: "" },
  { name: "Bachir Rizk", attending: true, persons: 3, wishes: "Can't wait to celebrate with you both! ❤️" },
  { name: "Mona Saliba", attending: false, persons: 1, wishes: "" },
  { name: "Samir Rahme", attending: true, persons: 3, wishes: "So happy for you two, this is going to be magical!" },
  { name: "Valerie Abboud", attending: true, persons: 4, wishes: "" },
  { name: "Fares Baz", attending: true, persons: 1, wishes: "This invitation is stunning, can't wait!" },
  { name: "Clara Zard", attending: true, persons: 1, wishes: "" },
  { name: "Nicolas Boutros", attending: true, persons: 1, wishes: "We're counting down the days!" },
  { name: "Dalia Azar", attending: true, persons: 1, wishes: "" },
  { name: "Richard Nassar", attending: true, persons: 1, wishes: "Here's to forever, see you there!" },
  { name: "Zeina Bitar", attending: false, persons: 1, wishes: "" },
  { name: "Marwan Yazbek", attending: true, persons: 1, wishes: "Already picked out my dancing shoes!" },
  { name: "Nelly Nehme", attending: true, persons: 1, wishes: "" },
  { name: "Alain Saliba", attending: false, persons: 1, wishes: "" },
  { name: "Rouba Semaan", attending: true, persons: 2, wishes: "" },
  { name: "Rony Geahchan", attending: true, persons: 2, wishes: "مبروك! بانتظار يومكم الكبير ❤️" },
  { name: "Mireille Abdallah", attending: true, persons: 2, wishes: "" },
  { name: "Toufic Zard", attending: true, persons: 2, wishes: "الله يفرحكن دايماً" },
  { name: "Nancy Boutros", attending: true, persons: 2, wishes: "" },
  { name: "Johnny Haddad", attending: true, persons: 2, wishes: "Congratulations! See you on the big day!" },
  { name: "Hanine Chalhoub", attending: true, persons: 2, wishes: "" },
  { name: "Paul Bitar", attending: true, persons: 3, wishes: "Wouldn't miss it for the world!" },
  { name: "Dina Yazbek", attending: true, persons: 3, wishes: "" },
  { name: "Elio Chamoun", attending: true, persons: 3, wishes: "Sending all our love and best wishes!" },
  { name: "Rachelle Hanna", attending: false, persons: 1, wishes: "Gutted to miss it — celebrating with you in spirit!" },
].map((g, i) => ({ id: `demo-${i}`, ...g }))

export default function DemoDashboard() {
  const [filter, setFilter] = useState("all")

  const attending = GUESTS.filter(r => r.attending)
  const declined = GUESTS.filter(r => !r.attending)
  const totalPersons = attending.reduce((sum, r) => sum + (r.persons || 1), 0)
  const responseRate = Math.round((attending.length / GUESTS.length) * 100)
  const daysLeft = Math.ceil((new Date(WEDDING_DATE) - new Date()) / (1000 * 60 * 60 * 24))
  const filteredRsvps = filter === "all" ? GUESTS : filter === "attending" ? attending : declined

  return (
    <div className="min-h-screen bg-[#0a0806] text-white"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #1a0f07 0%, #0a0806 70%)" }}>

      {/* Demo banner */}
      <div className="sticky top-0 z-20 text-center py-2.5 px-4 text-xs font-medium"
        style={{ background: "rgba(201,169,110,0.15)", borderBottom: "1px solid rgba(201,169,110,0.25)", color: "#c9a96e", backdropFilter: "blur(8px)" }}>
        🎭 Demo Dashboard — sample data showing what you and your guests will see.{" "}
        <a href="/order" className="underline hover:opacity-80 transition">Get yours →</a>
      </div>

      {/* Header */}
      <div className="text-center pt-14 pb-8 px-6">
        <p className="text-[#c9a96e] text-xs tracking-[0.3em] uppercase mb-2">Wedding RSVP Dashboard</p>
        <h1 className="font-serif text-4xl font-light text-white mb-1">
          {COUPLE.groom} & {COUPLE.bride}
        </h1>
        <p className="text-white/40 text-sm mt-2">
          {new Date(WEDDING_DATE).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
        {daysLeft > 0 && (
          <div className="inline-block mt-3 px-4 py-1.5 rounded-full text-xs font-medium"
            style={{ background: "rgba(201,169,110,0.15)", color: "#c9a96e", border: "1px solid rgba(201,169,110,0.3)" }}>
            {daysLeft} days to go
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-20">

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Attending", value: attending.length, icon: "✅", color: "#4ade80", sub: `${totalPersons} persons` },
            { label: "Declined", value: declined.length, icon: "❌", color: "#f87171", sub: "can't make it" },
            { label: "Response Rate", value: `${responseRate}%`, icon: "💌", color: "#c9a96e", sub: `${GUESTS.length} total` },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white/3 border border-white/8 rounded-2xl p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-light mb-0.5" style={{ color: s.color }}>{s.value}</div>
              <p className="text-white/50 text-xs font-medium">{s.label}</p>
              <p className="text-white/20 text-xs mt-0.5">{s.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5 mb-8">
          <div className="flex justify-between text-xs mb-3">
            <span className="text-[#4ade80]">{attending.length} attending</span>
            <span className="text-white/30">{totalPersons} total guests coming</span>
            <span className="text-red-400">{declined.length} declined</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div className="h-full rounded-full"
              initial={{ width: 0 }} animate={{ width: `${responseRate}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{ background: "linear-gradient(to right, #4ade80, #c9a96e)" }} />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-5">
          {[
            { id: "all", label: `All (${GUESTS.length})` },
            { id: "attending", label: `✅ Attending (${attending.length})` },
            { id: "declined", label: `❌ Declined (${declined.length})` },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className="px-4 py-2 rounded-xl text-xs font-medium transition"
              style={{ background: filter === f.id ? "#c9a96e" : "rgba(255,255,255,0.05)", color: filter === f.id ? "black" : "rgba(255,255,255,0.5)" }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* RSVP List */}
        <div className="grid gap-3">
          {filteredRsvps.map((rsvp, i) => (
            <motion.div key={rsvp.id} layout
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.5) }}
              className="bg-white/3 border border-white/8 rounded-xl p-4 flex items-center gap-4">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${rsvp.attending ? "bg-[#4ade80]" : "bg-red-400"}`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white">{rsvp.name}</p>
                {rsvp.wishes && (
                  <p className="text-white/40 text-xs mt-0.5 italic">"{rsvp.wishes}"</p>
                )}
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${rsvp.attending ? "bg-[#4ade80]/15 text-[#4ade80]" : "bg-red-400/15 text-red-400"}`}>
                {rsvp.attending ? `✓ ${rsvp.persons || 1} person${(rsvp.persons || 1) > 1 ? "s" : ""}` : "Declined"}
              </span>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-white/15 text-xs mt-10">
          Powered by <span className="text-[#c9a96e]/40">Lumivite</span>
        </p>
      </div>
    </div>
  )
}
