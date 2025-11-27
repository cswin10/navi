'use client';

import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus } from 'lucide-react';
import { Button } from './Button';

interface CollapsibleSectionProps {
  icon: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  onAdd?: () => void;
  addLabel?: string;
  isEmpty?: boolean;
  emptyMessage?: string;
  defaultOpen?: boolean;
  itemCount?: number;
}

export function CollapsibleSection({
  icon,
  title,
  subtitle,
  children,
  onAdd,
  addLabel = 'Add',
  isEmpty = false,
  emptyMessage = 'Nothing added yet',
  defaultOpen = false,
  itemCount = 0,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen || itemCount > 0);

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden">
      {/* Header - clickable to toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 sm:p-4 bg-slate-800/50 hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">{title}</span>
              {itemCount > 0 && (
                <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                  {itemCount}
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500">{subtitle}</span>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-3 sm:p-4 border-t border-slate-700 space-y-3">
              {isEmpty ? (
                <div className="flex flex-col items-center py-4 text-center">
                  <p className="text-sm text-slate-500 mb-3">{emptyMessage}</p>
                  {onAdd && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAdd();
                      }}
                      className="text-purple-400 hover:text-purple-300"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {addLabel}
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {children}
                  {onAdd && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAdd();
                      }}
                      className="text-purple-400 hover:text-purple-300 w-full justify-center border border-dashed border-slate-600 hover:border-purple-500/50"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {addLabel}
                    </Button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
