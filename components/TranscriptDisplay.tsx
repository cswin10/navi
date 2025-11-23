'use client';

import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

interface TranscriptDisplayProps {
  text: string;
}

export default function TranscriptDisplay({ text }: TranscriptDisplayProps) {
  if (!text) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
        <div className="flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-1">You said:</p>
            <p className="text-white text-lg">{text}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
