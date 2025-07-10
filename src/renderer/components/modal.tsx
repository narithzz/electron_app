import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  fullScreenOnMobile?: boolean;
};

export function Modal({ 
  isOpen, 
  onClose, 
  children, 
  maxWidth = '3xl',
  fullScreenOnMobile = false 
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
    } else {
      // Only reset overflow if no other modals are open
      const modals = document.querySelectorAll('.fixed.inset-0.z-50');
      if (modals.length <= 1) {
        document.body.style.overflow = 'auto';
      }
      document.removeEventListener('keydown', handleEscape);
    }

    // Clean up
    return () => {
      document.removeEventListener('keydown', handleEscape);
      const modals = document.querySelectorAll('.fixed.inset-0.z-50');
      if (modals.length <= 1) {
        document.body.style.overflow = 'auto';
      }
    };
  }, [isOpen, onClose]);

  // Handle click outside
  const handleClickOutside = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClickOutside}
        >
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
          <motion.div
            ref={modalRef}
            className={`relative w-full ${maxWidthClasses[maxWidth]} mx-auto bg-white rounded-lg shadow-xl overflow-hidden max-h-[95vh] ${
              fullScreenOnMobile ? 'h-full md:h-auto' : ''
            }`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-y-auto h-full"> {/* Changed max-h to h-full, combined with parent max-h */}
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}