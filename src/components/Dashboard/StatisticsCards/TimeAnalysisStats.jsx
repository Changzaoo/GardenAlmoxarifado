import React, { useState, useMemo } from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import DetailsModal from './DetailsModal';

const TimeAnalysisStats = ({ emprestimos = [] }) => {
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const weekdays = useMemo(() => {
    if (!Array.isArray(emprestimos)) return [];

    const days = { 0: 'domingo', 1: 'segunda-feira', 2: 'terça-feira', 3: 'quarta-feira', 4: 'quinta-feira', 5: 'sexta-feira', 6: 'sábado' };
    const dayStats = Object.keys(days).reduce((acc, dayNum) => {
      acc[dayNum] = {
        name: days[dayNum],
        count: 0,
        lastDate: null,
        emprestimos: []
      };
      return acc;
    }, {});

    emprestimos.forEach(emp => {
      if (!emp?.dataEmprestimo) return;

      const date = new Date(emp.dataEmprestimo);
      if (isNaN(date.getTime())) return;

      const dayNum = date.getDay().toString();
      if (dayStats[dayNum]) {
        dayStats[dayNum].count++;
        dayStats[dayNum].emprestimos.push(emp);
        dayStats[dayNum].date = date;
        
        if (!dayStats[dayNum].lastDate || new Date(emp.dataEmprestimo) > new Date(dayStats[dayNum].lastDate)) {
          dayStats[dayNum].lastDate = emp.dataEmprestimo;
        }
      }
    });

    // Filtrar apenas os dias que têm empréstimos
    return Object.values(dayStats)
      .filter(day => day.count > 0)
      .map(day => ({
        ...day,
        lastDateFormatted: day.lastDate ? new Date(day.lastDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'N/A',
        displayName: day.lastDate 
          ? `${day.name} (${new Date(day.lastDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })})`
          : day.name
      }))
      .sort((a, b) => b.count - a.count);
  }, [emprestimos]);

  const weeklyStats = useMemo(() => {
    if (!Array.isArray(emprestimos)) return [];

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Get the first day of the current month
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    
    // Create an array to hold all weeks of the month
    const weeks = [];
    
    // Initialize the first week
    let currentWeekStart = new Date(firstDayOfMonth);
    
    // Adjust to previous Sunday if month doesn't start on Sunday
    if (currentWeekStart.getDay() !== 0) {
      currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
    }
    
    // Create all weeks for the month
    while (weeks.length < 4) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekStats = {
        start: new Date(currentWeekStart),
        end: new Date(weekEnd),
        count: 0,
        emprestimos: []
      };

      // Count empréstimos for this week
      emprestimos.forEach(emp => {
        if (!emp?.dataEmprestimo) return;
        
        const empDate = new Date(emp.dataEmprestimo);
        if (isNaN(empDate.getTime())) return;

        if (empDate >= weekStats.start && empDate <= weekEnd) {
          weekStats.count++;
          weekStats.emprestimos.push(emp);
        }
      });

      // Só adiciona a semana se houver empréstimos
      if (weekStats.count > 0) {
        weeks.push({
          ...weekStats,
          dateRange: `${weekStats.start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${weekStats.end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`
        });
      }

      // Move to next week
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }

    return weeks;
  }, [emprestimos]);

  const handleItemClick = (data, type, title) => {
    if (!data) return;

    let dateRange = '';
    if (type === 'day') {
      dateRange = data.lastDateFormatted;
    } else if (type === 'week') {
      dateRange = data.dateRange;
    }

    setSelectedDetails({
      title: `${title} (${data.count} empréstimos)`,
      dateRange,
      emprestimos: data.emprestimos || []
    });
    setIsModalOpen(true);
  };

  const renderStatItem = ({ name, count, onClick }) => (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-3 bg-[#253341] rounded-lg cursor-pointer hover:bg-[#2C3E50] transition-colors"
    >
      <div className="space-y-1">
        <h4 className="text-white capitalize">{name}</h4>
        <p className="text-sm text-[#8899A6]">{count} empréstimos</p>
      </div>
      <ChevronRight className="w-5 h-5 text-[#8899A6]" />
    </div>
  );

  if (!Array.isArray(emprestimos)) {
    return (
      <div className="bg-[#192734] p-4 rounded-xl border border-[#38444D]">
        <div className="text-[#8899A6] text-center py-4">
          Dados de empréstimos indisponíveis
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#192734] p-4 rounded-xl border border-[#38444D]">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Calendar className="w-5 h-5 text-[#1DA1F2]" />
        </div>
        <h3 className="text-lg font-semibold text-white">Análise Temporal</h3>
      </div>

      <div className="space-y-4">
        {/* Dias da Semana */}
        {weekdays.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[#8899A6] text-sm font-medium">Dias mais ativos</h4>
            <div className="space-y-2">
              {weekdays.map((day) => (
                <div key={day.name}>
                  {renderStatItem({
                    name: day.displayName,
                    count: day.count,
                    onClick: () => handleItemClick(day, 'day', day.name)
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Semanas */}
        {weeklyStats.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[#8899A6] text-sm font-medium">Semanas do mês</h4>
            <div className="space-y-2">
              {weeklyStats.map((week, index) => (
                <div key={week.start.toISOString()}>
                  {renderStatItem({
                    name: `${index + 1}ª Semana (${week.dateRange})`,
                    count: week.count,
                    onClick: () => handleItemClick(week, 'week', `${index + 1}ª Semana`)
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <DetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        details={selectedDetails?.emprestimos || []}
        title={selectedDetails?.title}
        dateRange={selectedDetails?.dateRange}
      />
    </div>
  );
};

export default TimeAnalysisStats;