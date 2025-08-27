import { useState, useEffect } from 'react';
import { useEmprestimos } from './useEmprestimos';

export const useFerramentasAnalytics = () => {
  const { emprestimos } = useEmprestimos();
  const [analytics, setAnalytics] = useState({
    funcionariosRanking: [], // Lista de funcionários por frequência de empréstimos
    ferramentasRanking: [], // Lista de ferramentas por frequência de uso
    sugestoesPorFuncionario: {}, // Mapa de sugestões de ferramentas por funcionário
  });

  useEffect(() => {
    if (!emprestimos || emprestimos.length === 0) return;

    const frequenciaFuncionarios = new Map();
    const frequenciaFerramentas = new Map();
    const ferramentasPorFuncionario = new Map();

    // Analisa todos os empréstimos
    emprestimos.forEach(emprestimo => {
      const funcionario = emprestimo.nomeFuncionario || emprestimo.colaborador;
      if (!funcionario) return;

      // Incrementa frequência do funcionário
      frequenciaFuncionarios.set(funcionario, (frequenciaFuncionarios.get(funcionario) || 0) + 1);

      // Analisa ferramentas usadas
      if (Array.isArray(emprestimo.ferramentas)) {
        emprestimo.ferramentas.forEach(ferramenta => {
          const nomeFerramenta = typeof ferramenta === 'string' ? ferramenta : ferramenta.nome;
          if (!nomeFerramenta) return;

          // Incrementa frequência da ferramenta
          frequenciaFerramentas.set(nomeFerramenta, (frequenciaFerramentas.get(nomeFerramenta) || 0) + 1);

          // Registra uso da ferramenta pelo funcionário
          if (!ferramentasPorFuncionario.has(funcionario)) {
            ferramentasPorFuncionario.set(funcionario, new Map());
          }
          const ferramentasDoFuncionario = ferramentasPorFuncionario.get(funcionario);
          ferramentasDoFuncionario.set(nomeFerramenta, (ferramentasDoFuncionario.get(nomeFerramenta) || 0) + 1);
        });
      }
    });

    // Converte Map para arrays ordenados
    const funcionariosRanking = Array.from(frequenciaFuncionarios.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([nome, frequencia]) => ({ nome, frequencia }));

    const ferramentasRanking = Array.from(frequenciaFerramentas.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([nome, frequencia]) => ({ nome, frequencia }));

    // Gera sugestões de ferramentas por funcionário
    const sugestoesPorFuncionario = {};
    ferramentasPorFuncionario.forEach((ferramentasUsadas, funcionario) => {
      // Converte para array e ordena por frequência
      const ferramentasOrdenadas = Array.from(ferramentasUsadas.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([nome, frequencia]) => ({ nome, frequencia }));

      // Pega as 3 ferramentas mais usadas como sugestão
      sugestoesPorFuncionario[funcionario] = ferramentasOrdenadas.slice(0, 3);
    });

    setAnalytics({
      funcionariosRanking,
      ferramentasRanking,
      sugestoesPorFuncionario,
    });
  }, [emprestimos]);

  return analytics;
};
