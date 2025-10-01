import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Radar, Route as RouteIcon, Ticket, BellRing } from 'lucide-react';

export default function Home() {
  return (
    <div className="home-hero">
      {/* Decorative glows */}
      <div className="hero-glow glow-a" />
      <div className="hero-glow glow-b" />

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="hero-content"
      >
        <div className="hero-badge">Jain University • Kanakapura Road Campus</div>
        <h1 className="hero-title">
          Smarter Transport for a Smoother Campus Journey
        </h1>
        <p className="hero-subtitle">
          Plan your ride, track buses live, and manage your E‑Pass — all in one place.
          Reliable routes, safer commutes, and time saved every day.
        </p>
        <div className="hero-ctas">
          <Link to="/apply" className="btn btn-primary">Apply for E‑Pass</Link>
          <Link to="/tracking" className="btn btn-secondary">Track Buses</Link>
        </div>
      </motion.section>

      <motion.section
        className="features-grid"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={{
          hidden: { opacity: 0, y: 12 },
          visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
        }}
      >
        {[
          { title: 'Live Tracking', desc: 'See real‑time bus positions and ETAs for your stops.', Icon: Radar, cls: 'icon-tracking', delay: 0.0 },
          { title: 'Reliable Routes', desc: 'Curated routes connecting major areas to the campus.', Icon: RouteIcon, cls: 'icon-routes', delay: 0.05 },
          { title: 'Digital E‑Pass', desc: 'Apply, renew, and carry your pass securely on your phone.', Icon: Ticket, cls: 'icon-epass', delay: 0.1 },
          { title: 'Smart Alerts', desc: 'Get delay notifications and route change updates.', Icon: BellRing, cls: 'icon-alerts', delay: 0.15 },
        ].map((f, i) => (
          <motion.div key={i} className="feature-card" variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }} whileHover={{ y: -4 }}>
            <motion.span
              className={`feature-icon-badge ${f.cls}`}
              animate={{ y: [0, -1.5, 0] }}
              transition={{ duration: 2 + i * 0.2, repeat: Infinity, ease: 'easeInOut', delay: f.delay }}
            >
              <f.Icon size={22} strokeWidth={2.4} />
            </motion.span>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </motion.div>
        ))}
      </motion.section>

      <motion.section
        className="route-demo"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5 }}
      >
        <div className="route-card">
          <div className="route-head">
            <h2>Route Preview</h2>
            <span>Sample animation</span>
          </div>
          <div className="route-map">
            <div className="route-line" />
            <div className="route-bus" />
            <div className="route-stop" style={{ left: '10%' }} />
            <div className="route-stop" style={{ left: '35%' }} />
            <div className="route-stop" style={{ left: '60%' }} />
            <div className="route-stop" style={{ left: '85%' }} />
          </div>
          <div className="route-legend">
            <span>City</span>
            <span>Campus</span>
          </div>
        </div>
        <div className="route-copy">
          <h3>From city to campus, on time.</h3>
          <p>
            Our Kanakapura Road campus services connect key neighbourhoods to the university with
            predictable timings and clear stops. Use tracking to plan your day and never miss a class.
          </p>
          <div className="hero-ctas" style={{ marginTop: 12 }}>
            <Link to="/contact" className="btn btn-outline">Contact Transport Office</Link>
          </div>
        </div>
      </motion.section>
    </div>
  );
}