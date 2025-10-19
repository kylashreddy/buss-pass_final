import React from 'react';
import { motion } from 'framer-motion';

export default function TrackingPlaceholder() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      style={{
        width: '100%',
        maxWidth: 720,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 16,
      }}
    >
      <motion.div
        whileHover={{ y: -2 }}
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 20,
          boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
          border: '1px solid #eee',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Live Tracking</h2>
          <span style={{ fontSize: 12, color: '#6b7280' }}>Coming soon</span>
        </div>
        <p style={{ color: '#374151', marginBottom: 16 }}>
          We’re building live bus location with ETA and stop-by-stop updates.
        </p>

        <div className="track-card">
          <div className="track-map">
            <div className="track-road" />
            <div className="track-bus" />
            <div className="track-stop" style={{ left: '15%' }} />
            <div className="track-stop" style={{ left: '40%' }} />
            <div className="track-stop" style={{ left: '70%' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: '#6b7280' }}>
            <span>Start</span>
            <span>Destination</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        whileHover={{ y: -2 }}
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 20,
          boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
          border: '1px solid #eee',
        }}
      >
        <h3 style={{ marginTop: 0 }}>What you’ll get</h3>
        <ul style={{ margin: '6px 0 0 18px', color: '#374151' }}>
          <li>Live bus position and route line</li>
          <li>ETA to your stop with delay warnings</li>
          <li>Favourites and recent routes</li>
        </ul>
      </motion.div>
    </motion.div>
  );
}