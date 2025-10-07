# Sistema de Ponto Eletrônico com Controle de Assiduidade

## 📋 Resumo do Projeto

Sistema completo de controle de ponto eletrônico com:
- ✅ Tolerância de 10 minutos (antes/depois)
- ✅ Cálculo automático de horas trabalhadas
- ✅ Sistema de advertências (máx 3)
- ✅ Controle de assiduidade (prêmio R$ 100)
- ✅ Comprovantes de ponto
- ✅ Exportação para planilha

## ✅ Arquivos Criados

### 1. `/src/utils/pontoUtils.js`
**Funções implementadas:**
- `validarTolerancia()` - Valida se ponto está dentro dos 10 minutos
- `podeBaterPonto()` - Verifica se pode bater ponto agora
- `calcularHorasTrabalhadas()` - Calcula horas do período
- `calcularSaldoDia()` - Calcula saldo completo do dia
- `verificarAssiduidade()` - Verifica se mantém assiduidade
- `gerarResumoMensal()` - Gera resumo mensal completo

**Regras implementadas:**
- Tolerância: ±10 minutos
- Hora positiva: chegou antes (dentro da tolerância)
- Hora negativa: chegou depois (dentro da tolerância)
- Advertência: ultrapassou 10 minutos de atraso
- Máximo: 3 advertências = perde assiduidade
- Falta sem justificativa = perde assiduidade

### 2. `/src/utils/escalaUtils.js`
**Mapeamento de escalas:**
- `HORARIOS_POR_ESCALA` - Define horários para cada tipo de escala
  - M: 07:20-16:20 (semana), 07:20-13:20 (fim de semana)
  - M1: 07:00-15:20 (almoço 12:00-13:00)
  - M4: 06:00-15:40 (almoço 10:30-11:30, 5x2)

**Funções implementadas:**
- `obterHorariosEsperados()` - Retorna horários baseado na escala
- `obterEscalaDoDia()` - Obtém escala do funcionário para o dia
- `deveTrabalharNoDia()` - Verifica se deve trabalhar
- `obterDescricaoJornada()` - Formata descrição da jornada

## 🔧 Próximas Implementações

### 1. Atualizar WorkPontoTab
**Arquivo:** `/src/components/WorkPontoTab.jsx`

**Alterações necessárias:**
```jsx
// Adicionar imports
import { validarTolerancia, podeBaterPonto, calcularSaldoDia } from '../utils/pontoUtils';
import { obterHorariosEsperados, obterEscalaDoDia } from '../utils/escalaUtils';

// Adicionar estados
const [horariosEsperados, setHorariosEsperados] = useState(null);
const [saldoDia, setSaldoDia] = useState(null);
const [advertencias, setAdvertencias] = useState([]);

// Buscar escala do funcionário
useEffect(() => {
  const buscarEscala = async () => {
    // Buscar tipo de escala do funcionário no Firestore
    // Calcular horários esperados
    // Atualizar estado
  };
  buscarEscala();
}, [usuario]);

// Adicionar validação antes de bater ponto
const validarPonto = (tipo) => {
  const horario = horariosEsperados[tipo];
  const { podeBater, motivoBloqueio } = podeBaterPonto(horario);
  
  if (!podeBater) {
    showToast(motivoBloqueio, 'error');
    return false;
  }
  return true;
};

// Modificar função baterPonto
const baterPonto = async (tipo) => {
  if (!validarPonto(tipo)) return;
  
  // ... código existente ...
  
  // Após bater ponto, calcular saldo
  const saldo = calcularSaldoDia(registros, horariosEsperados);
  setSaldoDia(saldo);
  
  // Se houver advertência, salvar no Firestore
  if (saldo.advertencias.length > 0) {
    await salvarAdvertencia(saldo.advertencias[saldo.advertencias.length - 1]);
  }
};
```

**Adicionar exibição de horários:**
```jsx
{/* Card de Horários Esperados */}
<div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-xl p-4 mb-4">
  <h3 className="font-bold text-indigo-900 dark:text-indigo-100 mb-2">
    📅 Sua Jornada Hoje
  </h3>
  {horariosEsperados ? (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      <div>
        <span className="text-xs text-gray-600 dark:text-gray-400">Entrada</span>
        <div className="font-bold">{horariosEsperados.entrada}</div>
      </div>
      <div>
        <span className="text-xs text-gray-600 dark:text-gray-400">Almoço</span>
        <div className="font-bold">{horariosEsperados.almoco}</div>
      </div>
      <div>
        <span className="text-xs text-gray-600 dark:text-gray-400">Retorno</span>
        <div className="font-bold">{horariosEsperados.retorno}</div>
      </div>
      <div>
        <span className="text-xs text-gray-600 dark:text-gray-400">Saída</span>
        <div className="font-bold">{horariosEsperados.saida}</div>
      </div>
    </div>
  ) : (
    <p className="text-sm text-gray-600">Horário não configurado</p>
  )}
</div>

{/* Card de Saldo do Dia */}
{saldoDia && (
  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-xl p-4 mb-4">
    <h3 className="font-bold text-green-900 dark:text-green-100 mb-2">
      ⏱️ Saldo de Horas Hoje
    </h3>
    <div className="flex items-center justify-between">
      <div>
        <div className="text-2xl font-bold">
          {saldoDia.saldoFormatado}
        </div>
        <div className="text-sm text-gray-600">
          Trabalhado: {saldoDia.totalTrabalhado.formatado}
        </div>
      </div>
      {saldoDia.advertencias.length > 0 && (
        <div className="bg-red-100 dark:bg-red-900 px-3 py-2 rounded-lg">
          <span className="text-red-900 dark:text-red-100 font-bold">
            ⚠️ {saldoDia.advertencias.length} advertência(s)
          </span>
        </div>
      )}
    </div>
  </div>
)}
```

### 2. Criar Cards de Resumo na Página de Funcionários
**Arquivo:** Novo componente `/src/components/Funcionarios/ResumoAssiduidade.jsx`

```jsx
import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle, Trophy, Calendar } from 'lucide-react';
import { gerarResumoMensal, verificarAssiduidade } from '../../utils/pontoUtils';

const ResumoAssiduidade = ({ funcionarioId }) => {
  const [resumo, setResumo] = useState(null);
  
  useEffect(() => {
    // Buscar pontos do mês no Firestore
    // Calcular resumo com gerarResumoMensal()
  }, [funcionarioId]);
  
  if (!resumo) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Card Horas Trabalhadas */}
      <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
            Horas Trabalhadas
          </span>
        </div>
        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
          {resumo.totalHorasTrabalhadas}
        </div>
        <div className="text-xs text-blue-700 dark:text-blue-300">
          {resumo.diasTrabalhados} dias no mês
        </div>
      </div>
      
      {/* Card Horas Extras */}
      <div className="bg-green-50 dark:bg-green-950 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-5 h-5 text-green-600" />
          <span className="text-sm font-semibold text-green-900 dark:text-green-100">
            Horas Extras
          </span>
        </div>
        <div className="text-2xl font-bold text-green-900 dark:text-green-100">
          {resumo.totalHorasExtras}
        </div>
      </div>
      
      {/* Card Advertências */}
      <div className="bg-red-50 dark:bg-red-950 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="text-sm font-semibold text-red-900 dark:text-red-100">
            Advertências
          </span>
        </div>
        <div className="text-2xl font-bold text-red-900 dark:text-red-100">
          {resumo.totalAdvertencias} / 3
        </div>
        <div className="text-xs text-red-700 dark:text-red-300">
          Faltas: {resumo.totalFaltas}
        </div>
      </div>
      
      {/* Card Assiduidade */}
      <div className={`rounded-xl p-4 ${
        resumo.assiduidade.temAssiduidade 
          ? 'bg-yellow-50 dark:bg-yellow-950' 
          : 'bg-gray-50 dark:bg-gray-800'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <Trophy className={`w-5 h-5 ${
            resumo.assiduidade.temAssiduidade ? 'text-yellow-600' : 'text-gray-600'
          }`} />
          <span className="text-sm font-semibold">
            Assiduidade
          </span>
        </div>
        <div className="text-2xl font-bold">
          {resumo.assiduidade.temAssiduidade ? '✅' : '❌'}
        </div>
        <div className="text-xs">
          {resumo.assiduidade.temAssiduidade 
            ? `Prêmio: R$ ${resumo.assiduidade.premioValor},00`
            : 'Prêmio perdido'}
        </div>
      </div>
    </div>
  );
};

export default ResumoAssiduidade;
```

### 3. Criar Comprovante de Ponto
**Arquivo:** `/src/components/Comprovantes/ComprovantePontoVisual.jsx`

Seguir o mesmo padrão do `ComprovanteVisual.jsx`:
- Logo WorkFlow no topo
- Dados do funcionário
- Horários batidos vs esperados
- Saldo de horas
- Advertências (se houver)
- Assinatura digital única
- Botões de download PDF e compartilhar

### 4. Exportação para Planilha
**Arquivo:** `/src/utils/exportarPontos.js`

```javascript
import * as XLSX from 'xlsx';

export const exportarPontosParaExcel = (pontos, funcionario, formato = 'xlsx') => {
  // Preparar dados
  const dados = pontos.map(ponto => ({
    Data: formatarData(ponto.data),
    Entrada: formatarHora(ponto.entrada),
    Almoço: formatarHora(ponto.almoco),
    Retorno: formatarHora(ponto.retorno),
    Saída: formatarHora(ponto.saida),
    'Horas Trab.': ponto.horasTrabalhadas,
    Saldo: ponto.saldo,
    Obs: ponto.observacao || ''
  }));
  
  // Criar workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(dados);
  
  // Adicionar logo e título (merge cells)
  // ...
  
  XLSX.utils.book_append_sheet(wb, ws, 'Pontos');
  XLSX.writeFile(wb, `Pontos_${funcionario.nome}_${new Date().toISOString().split('T')[0]}.${formato}`);
};
```

## 🔄 Fluxo de Uso

1. **Funcionário entra na aba WorkPonto**
   - Sistema busca sua escala no Firestore
   - Exibe horários esperados do dia
   - Mostra janela de tolerância (±10 min)

2. **Funcionário tenta bater ponto**
   - Sistema valida se está dentro da janela
   - Se não, bloqueia e exibe mensagem
   - Se sim, registra e calcula diferença

3. **Após cada ponto**
   - Calcula saldo parcial do dia
   - Se atraso > 10min, gera advertência
   - Atualiza contador de advertências

4. **Final do dia**
   - Calcula total de horas trabalhadas
   - Calcula horas extras
   - Atualiza saldo mensal

5. **Final do mês**
   - Verifica total de advertências
   - Verifica faltas não justificadas
   - Define se mantém assiduidade (prêmio R$ 100)

## 📊 Estrutura de Dados no Firestore

### Collection: `pontos`
```javascript
{
  funcionarioId: string,
  funcionarioNome: string,
  tipo: 'entrada' | 'saida_almoco' | 'retorno_almoco' | 'saida',
  data: timestamp,
  horarioEsperado: string, // "HH:mm"
  diferencaMinutos: number, // positivo = atrasado, negativo = adiantado
  dentroTolerancia: boolean,
  tipoRegistro: 'pontual' | 'hora_positiva' | 'hora_negativa' | 'atrasado',
  observacao: string
}
```

### Collection: `advertencias`
```javascript
{
  funcionarioId: string,
  data: timestamp,
  tipoPonto: string,
  minutosAtraso: number,
  justificativa: string,
  comprovante: string (URL),
  resolvida: boolean
}
```

### Collection: `assiduidade_mensal`
```javascript
{
  funcionarioId: string,
  mes: string, // "2025-10"
  diasTrabalhados: number,
  totalHoras: number,
  totalHorasExtras: number,
  totalAdvertencias: number,
  totalFaltas: number,
  temAssiduidade: boolean,
  premioValor: number
}
```

## ⚠️ Advertências e Regras

### Geração de Advertência
- Atraso > 10 minutos em qualquer ponto
- Registrado automaticamente no Firestore
- Notificação enviada ao funcionário
- Supervisor recebe alerta

### 3ª Advertência
- Modal de alerta ao funcionário
- Perde direito à assiduidade do mês
- Perde prêmio de R$ 100
- Precisa apresentar justificativa

### Justificativa de Atraso
- Upload de comprovante (foto/PDF)
- Aprovação por supervisor
- Se aprovada, advertência é cancelada

### Falta Não Justificada
- Ausência sem registro de ponto
- Sem atestado = perde assiduidade
- Com atestado = mantém assiduidade

## 🎯 Melhorias Futuras

1. **Notificações Push**
   - Lembrete 15min antes do horário
   - Alerta de advertência
   - Confirmação de assiduidade

2. **Relatórios Avançados**
   - Gráficos de pontualidade
   - Comparativo mensal
   - Ranking de assiduidade

3. **Integração com RH**
   - Exportação para folha de pagamento
   - Cálculo automático de horas extras
   - Relatório de assiduidade para bônus

4. **Ponto por Geolocalização**
   - Validar se está no local de trabalho
   - Ponto remoto controlado
   - Mapa de check-ins

5. **Reconhecimento Facial**
   - Validação biométrica
   - Prevenção de fraudes
   - Maior segurança
