import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { backgroundCorrectionService } from '../services/backgroundCorrectionService';

/**
 * Badge que mostra o número de tarefas em execução em segundo plano
 * Para ser usado em menus ou barras de navegação
 */
const BackgroundJobsBadge = () => {
  const [activeJobsCount, setActiveJobsCount] = useState(0);

  useEffect(() => {
    // Atualizar a cada 2 segundos
    const updateCount = () => {
      const jobs = backgroundCorrectionService.getAllActiveJobs();
      const runningJobs = jobs.filter(j => j.status === 'running');
      setActiveJobsCount(runningJobs.length);
    };

    updateCount();
    const interval = setInterval(updateCount, 2000);

    return () => clearInterval(interval);
  }, []);

  if (activeJobsCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        className="absolute -top-1 -right-1 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-gray-800"
      >
        <motion.span
          key={activeJobsCount}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {activeJobsCount}
        </motion.span>
      </motion.div>
    </AnimatePresence>
  );
};

export default BackgroundJobsBadge;
