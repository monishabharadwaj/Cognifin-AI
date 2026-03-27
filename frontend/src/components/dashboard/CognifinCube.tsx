import { motion } from 'framer-motion';

/**
 * CognifinCube — pure CSS / Framer Motion animated visual.
 * Replaces the previous Three.js implementation to avoid
 * heavy WebGL dependencies.
 */
export function CognifinCube() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-30">
      {/* Outer ring */}
      <motion.div
        className="absolute rounded-full border border-primary/40"
        style={{ width: 220, height: 220 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />
      {/* Middle ring */}
      <motion.div
        className="absolute rounded-full border border-purple-400/30"
        style={{ width: 150, height: 150 }}
        animate={{ rotate: -360 }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      />
      {/* Inner pulsing orb */}
      <motion.div
        className="absolute rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 blur-md"
        style={{ width: 80, height: 80 }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Diagonal accent line */}
      <motion.div
        className="absolute rounded-full border border-pink-400/20"
        style={{ width: 180, height: 180, borderStyle: 'dashed' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}
