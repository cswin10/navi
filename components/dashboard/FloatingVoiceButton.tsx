'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';

export default function FloatingVoiceButton() {
  return (
    <Link href="/voice">
      <motion.button
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center text-white hover:shadow-xl hover:shadow-blue-500/40 transition-shadow"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        title="Voice Assistant"
      >
        <Mic className="w-6 h-6" />
        {/* Pulse animation */}
        <motion.span
          className="absolute inset-0 rounded-full bg-blue-500 opacity-25"
          animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0, 0.25] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.button>
    </Link>
  );
}
