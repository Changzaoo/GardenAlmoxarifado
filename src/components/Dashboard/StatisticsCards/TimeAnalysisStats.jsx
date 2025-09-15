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

    return Object.values(dayStats)
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
    
    // Create an array of week ranges for the current month
    const weekRanges = [];
    let currentWeekStart = new Date(firstDayOfMonth);
    
    while (currentWeekStart.getMonth() === currentMonth) {
      const weekStart = new Date(currentWeekStart);
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      weekRanges.push({
        start: weekStart,
        end: weekEnd,
        emprestimos: [],
        count: 0
      });
      
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }

    // Assign loans to the appropriate week
    emprestimos.forEach(emp => {
      if (!emp?.dataEmprestimo) return;
      
      const loanDate = new Date(emp.dataEmprestimo);
      if (isNaN(loanDate.getTime())) return;
      
      // Only process loans from the current month
      if (loanDate.getMonth() !== currentMonth || loanDate.getFullYear() !== currentYear) {
        return;
      }
      
      // Find the week this loan belongs to
      const weekIndex = weekRanges.findIndex(week => {
        const loanTime = loanDate.getTime();
        return loanTime >= week.start.getTime() && loanTime <= week.end.getTime();
      });
      
      if (weekIndex !== -1) {
        weekRanges[weekIndex].emprestimos.push(emp);
        weekRanges[weekIndex].count++;
      }
    });

    // Return only weeks that have loans
    return weekRanges
      .filter(week => week.count > 0)
      .map(week => ({
        ...week,
        dateRange: `${week.start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${week.end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`
      }))
      .slice(0, 4); // Limit to 4 weeks
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

        {/* Semanas */}
        {weeklyStats.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[#8899A6] text-sm font-medium">Semanas mais ativas</h4>
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
