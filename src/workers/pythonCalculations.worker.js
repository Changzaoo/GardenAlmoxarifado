/**
 * Web Worker para Cálculos Otimizados com Python (Pyodide)
 * 
 * Este worker roda Python em uma thread separada para não bloquear a UI.
 * Usa Pyodide (Python + WebAssembly) para operações numéricas pesadas.
 */

let pyodide = null;
let isInitialized = false;

// Inicializar Pyodide
async function initPyodide() {
  if (isInitialized) return;
  
  try {
    console.log('🐍 Inicializando Pyodide...');
    
    // Carregar Pyodide do CDN
    importScripts('https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js');
    
    pyodide = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
    });
    
    // Carregar pacotes necessários
    await pyodide.loadPackage(['numpy']);
    
    // Definir funções Python otimizadas
    await pyodide.runPythonAsync(`
import numpy as np
from js import JSON
from datetime import datetime, timedelta

def calcular_valores_setor(inventario_json, danificadas_json, perdidas_json, setor_id, setor_nome):
    """
    Calcula valores financeiros de um setor usando NumPy para performance.
    """
    # Converter JSON para objetos Python
    inventario = JSON.parse(inventario_json)
    danificadas = JSON.parse(danificadas_json)
    perdidas = JSON.parse(perdidas_json)
    
    # Filtrar itens do setor
    itens_setor = [
        item for item in inventario 
        if item.get('setorId') == setor_id or item.get('setorNome') == setor_nome
    ]
    
    if not itens_setor:
        return {
            'valorBruto': 0,
            'valorDanificadas': 0,
            'valorPerdidas': 0,
            'valorLiquido': 0,
            'totalItens': 0,
            'quantidadeTotal': 0
        }
    
    # Usar NumPy para cálculos vetorizados (muito mais rápido)
    valores = np.array([float(item.get('valorUnitario', 0)) for item in itens_setor])
    quantidades = np.array([int(item.get('quantidade', 0)) for item in itens_setor])
    
    # Cálculo vetorizado do valor bruto
    valor_bruto = float(np.sum(valores * quantidades))
    
    # Nomes dos itens para comparação
    nomes_itens = set(item.get('nome', '').lower().strip() for item in itens_setor)
    
    # Calcular valor de danificadas
    valor_danificadas = sum(
        float(d.get('valorEstimado', 0))
        for d in danificadas
        if d.get('nomeItem', '').lower().strip() in nomes_itens
    )
    
    # Calcular valor de perdidas
    valor_perdidas = sum(
        float(p.get('valorEstimado', 0))
        for p in perdidas
        if p.get('nomeItem', '').lower().strip() in nomes_itens
    )
    
    return {
        'valorBruto': valor_bruto,
        'valorDanificadas': valor_danificadas,
        'valorPerdidas': valor_perdidas,
        'valorLiquido': valor_bruto - valor_danificadas - valor_perdidas,
        'totalItens': len(itens_setor),
        'quantidadeTotal': int(np.sum(quantidades))
    }

def calcular_estatisticas_funcionario(
    funcionario_id,
    pontos_json,
    avaliacoes_json,
    tarefas_json,
    registros_json
):
    """
    Calcula estatísticas completas de um funcionário.
    """
    # Converter JSON
    pontos = JSON.parse(pontos_json)
    avaliacoes = JSON.parse(avaliacoes_json)
    tarefas = JSON.parse(tarefas_json)
    registros = JSON.parse(registros_json)
    
    # Filtrar dados do funcionário
    pontos_func = [p for p in pontos if p.get('funcionarioId') == funcionario_id]
    avaliacoes_func = [a for a in avaliacoes if a.get('funcionarioId') == funcionario_id]
    tarefas_func = [t for t in tarefas if t.get('funcionarioId') == funcionario_id]
    registros_func = [r for r in registros if r.get('funcionarioId') == funcionario_id]
    
    # Cálculos com NumPy
    total_pontos = int(np.sum([int(p.get('pontos', 0)) for p in pontos_func]))
    
    if avaliacoes_func:
        notas = np.array([float(a.get('nota', 0)) for a in avaliacoes_func])
        avaliacao_media = float(np.mean(notas))
    else:
        avaliacao_media = 0.0
    
    # Tarefas
    tarefas_pendentes = sum(1 for t in tarefas_func if t.get('status') == 'pendente')
    tarefas_concluidas = sum(1 for t in tarefas_func if t.get('status') == 'concluida')
    
    # Horas trabalhadas
    horas_trabalhadas = sum(
        float(r.get('horasTrabalhadas', 0))
        for r in registros_func
    )
    
    horas_negativas = sum(
        abs(float(r.get('horasNegativas', 0)))
        for r in registros_func
    )
    
    return {
        'pontos': total_pontos,
        'avaliacaoMedia': round(avaliacao_media, 2),
        'tarefasPendentes': tarefas_pendentes,
        'tarefasConcluidas': tarefas_concluidas,
        'tarefasTotal': len(tarefas_func),
        'horasTrabalhadas': round(horas_trabalhadas, 2),
        'horasNegativas': round(horas_negativas, 2),
        'registrosPonto': len(registros_func)
    }

# Função para calcular múltiplos setores em batch
def calcular_valores_setores_batch(setores_json, inventario_json, danificadas_json, perdidas_json):
    """
    Calcula valores para múltiplos setores em batch (muito mais eficiente).
    """
    setores = JSON.parse(setores_json)
    resultados = {}
    
    for setor in setores:
        setor_id = setor.get('id')
        setor_nome = setor.get('nome')
        
        if setor_id:
            resultados[setor_id] = calcular_valores_setor(
                inventario_json,
                danificadas_json,
                perdidas_json,
                setor_id,
                setor_nome
            )
    
    return resultados

# ==================== FUNÇÕES DE CARDS FUNCIONÁRIOS ====================

def calcular_card_funcionario(funcionario_json, pontos_json, avaliacoes_json, tarefas_json, emprestimos_json):
    """
    Calcula todos os dados do card de um funcionário.
    Otimizado com NumPy para performance.
    """
    from datetime import datetime
    
    funcionario = JSON.parse(funcionario_json)
    pontos = JSON.parse(pontos_json) if pontos_json else []
    avaliacoes = JSON.parse(avaliacoes_json) if avaliacoes_json else []
    tarefas = JSON.parse(tarefas_json) if tarefas_json else []
    emprestimos = JSON.parse(emprestimos_json) if emprestimos_json else []
    
    funcionario_id = funcionario.get('id')
    
    # Filtrar dados do funcionário
    pontos_func = [p for p in pontos if p.get('funcionarioId') == funcionario_id]
    avaliacoes_func = [a for a in avaliacoes if a.get('funcionarioId') == funcionario_id or a.get('funcionarioAvaliado') == funcionario_id]
    tarefas_func = [t for t in tarefas if t.get('funcionarioId') == funcionario_id or t.get('responsavel') == funcionario_id]
    emprestimos_func = [e for e in emprestimos if e.get('funcionarioId') == funcionario_id]
    
    # Calcular pontos totais
    total_pontos = int(np.sum([int(p.get('pontos', 0)) for p in pontos_func]))
    
    # Calcular média de avaliações
    if avaliacoes_func:
        notas = np.array([float(a.get('nota', 0)) for a in avaliacoes_func if a.get('nota') is not None])
        avaliacao_media = float(np.mean(notas)) if len(notas) > 0 else 0.0
    else:
        avaliacao_media = 0.0
    
    # Calcular horas negativas do mês atual
    hoje = datetime.now()
    mes_atual = hoje.month
    ano_atual = hoje.year
    
    # Buscar registros de ponto do mês
    # Assumindo que você tem uma forma de buscar isso
    horas_negativas = 0  # Placeholder - será calculado pela função de ponto existente
    
    # Contar tarefas
    tarefas_concluidas = sum(1 for t in tarefas_func if t.get('status') == 'concluida')
    tarefas_total = len(tarefas_func)
    
    # Contar empréstimos ativos
    emprestimos_ativos = sum(1 for e in emprestimos_func if e.get('status') != 'devolvido')
    
    return {
        'pontos': total_pontos,
        'avaliacaoMedia': round(avaliacao_media, 2),
        'horasNegativas': horas_negativas,
        'tarefasConcluidas': tarefas_concluidas,
        'tarefasTotal': tarefas_total,
        'emprestimosAtivos': emprestimos_ativos
    }

def calcular_cards_funcionarios_batch(funcionarios_json, pontos_json, avaliacoes_json, tarefas_json, emprestimos_json):
    """
    Calcula cards de múltiplos funcionários em batch (muito mais rápido).
    """
    funcionarios = JSON.parse(funcionarios_json)
    resultados = {}
    
    for func in funcionarios:
        func_id = func.get('id')
        if func_id:
            resultados[func_id] = calcular_card_funcionario(
                JSON.stringify(func),
                pontos_json,
                avaliacoes_json,
                tarefas_json,
                emprestimos_json
            )
    
    return resultados

# ==================== FUNÇÕES DE PONTO ====================
        if setor_id:
            resultados[setor_id] = calcular_valores_setor(
                inventario_json,
                danificadas_json,
                perdidas_json,
                setor_id,
                setor_nome
            )
    
    return resultados

# ==================== FUNÇÕES DE PONTO ====================

def calcular_horas_trabalhadas(entrada_str, saida_almoco_str, retorno_almoco_str, saida_str):
    """
    Calcula horas trabalhadas considerando entrada, almoço e saída.
    Retorna horas, minutos e segundos trabalhados.
    """
    try:
        # Converter strings ISO para datetime
        entrada = datetime.fromisoformat(entrada_str.replace('Z', '+00:00')) if entrada_str else None
        saida_almoco = datetime.fromisoformat(saida_almoco_str.replace('Z', '+00:00')) if saida_almoco_str else None
        retorno_almoco = datetime.fromisoformat(retorno_almoco_str.replace('Z', '+00:00')) if retorno_almoco_str else None
        saida = datetime.fromisoformat(saida_str.replace('Z', '+00:00')) if saida_str else None
        
        if not entrada:
            return {'horas': 0, 'minutos': 0, 'segundos': 0, 'totalMinutos': 0}
        
        total_segundos = 0
        
        # Cenário 1: Dia completo (com saída)
        if saida and saida_almoco and retorno_almoco:
            # Período manhã
            segundos_manha = (saida_almoco - entrada).total_seconds()
            # Período tarde
            segundos_tarde = (saida - retorno_almoco).total_seconds()
            total_segundos = segundos_manha + segundos_tarde
            
        # Cenário 2: Voltou do almoço mas não saiu
        elif retorno_almoco and saida_almoco:
            segundos_manha = (saida_almoco - entrada).total_seconds()
            segundos_tarde = (datetime.now() - retorno_almoco).total_seconds()
            total_segundos = segundos_manha + segundos_tarde
            
        # Cenário 3: Saiu para almoço mas não voltou
        elif saida_almoco:
            total_segundos = (saida_almoco - entrada).total_seconds()
            
        # Cenário 4: Ainda não saiu para almoço
        else:
            total_segundos = (datetime.now() - entrada).total_seconds()
        
        # Garantir não negativo
        total_segundos = max(0, total_segundos)
        
        horas = int(total_segundos // 3600)
        minutos = int((total_segundos % 3600) // 60)
        segundos = int(total_segundos % 60)
        total_minutos = int(total_segundos // 60)
        
        return {
            'horas': horas,
            'minutos': minutos,
            'segundos': segundos,
            'totalMinutos': total_minutos,
            'totalSegundos': int(total_segundos)
        }
    except Exception as e:
        print(f"Erro ao calcular horas: {e}")
        return {'horas': 0, 'minutos': 0, 'segundos': 0, 'totalMinutos': 0}

def calcular_horas_esperadas(data_str):
    """
    Calcula horas esperadas de trabalho baseado no dia da semana.
    Escala M (padrão):
    - Segunda a Sexta: 8 horas
    - Sábado: 4 horas
    - Domingo: 0 horas (folga)
    
    Retorna horas esperadas em minutos.
    """
    try:
        from datetime import datetime
        
        # Parse da data
        data = datetime.fromisoformat(data_str.replace('Z', '+00:00'))
        
        # weekday(): 0 = Segunda, 1 = Terça, ..., 5 = Sábado, 6 = Domingo
        dia_semana = data.weekday()
        
        # Segunda a Sexta (0-4): 8 horas = 480 minutos
        if dia_semana <= 4:
            return 480
        
        # Sábado (5): 4 horas = 240 minutos
        elif dia_semana == 5:
            return 240
        
        # Domingo (6): 0 horas (folga)
        else:
            return 0
        
        return max(0, total_minutos)
    except Exception as e:
        print(f"Erro ao calcular horas esperadas: {e}")
        return 0

def calcular_saldo_horas(horas_trabalhadas_min, horas_esperadas_min):
    """
    Calcula saldo de horas (positivo ou negativo).
    """
    saldo_minutos = horas_trabalhadas_min - horas_esperadas_min
    
    horas = abs(saldo_minutos) // 60
    minutos = abs(saldo_minutos) % 60
    
    return {
        'saldoMinutos': saldo_minutos,
        'ehPositivo': saldo_minutos >= 0,
        'horas': int(horas),
        'minutos': int(minutos),
        'formatado': f"{'+' if saldo_minutos >= 0 else '-'}{horas:02d}:{minutos:02d}"
    }

def calcular_estatisticas_ponto_mes(registros_ponto_json, funcionario_id, mes, ano):
    """
    Calcula estatísticas de ponto do mês para um funcionário.
    Inclui: total trabalhado, saldo, horas extras, faltas, etc.
    """
    from datetime import datetime
    
    registros = JSON.parse(registros_ponto_json)
    
    # Filtrar registros do funcionário e mês
    registros_func = [
        r for r in registros
        if r.get('funcionarioId') == funcionario_id and
           r.get('mes') == mes and
           r.get('ano') == ano
    ]
    
    if not registros_func:
        return {
            'totalHorasTrabalhadas': 0,
            'totalHorasEsperadas': 0,
            'saldoMes': 0,
            'diasTrabalhados': 0,
            'diasFalta': 0,
            'horasExtras': 0,
            'horasNegativas': 0,
            'mediaHorasDia': 0
        }
    
    total_trabalhado = 0
    total_esperado = 0
    dias_trabalhados = 0
    dias_falta = 0
    
    for reg in registros_func:
        # Horas trabalhadas do registro
        horas_trab = float(reg.get('horasTrabalhadasMinutos', 0))
        total_trabalhado += horas_trab
        
        # Calcular horas esperadas baseado no dia da semana
        data_str = reg.get('data', reg.get('dataFormatada', ''))
        if data_str:
            horas_esp = calcular_horas_esperadas(data_str)
            total_esperado += horas_esp
        
        # Contabilizar dias
        if horas_trab > 0 or reg.get('status') == 'presente':
            dias_trabalhados += 1
        elif reg.get('status') == 'falta':
            dias_falta += 1
            # Somar horas esperadas mesmo em faltas (para calcular saldo negativo)
            if data_str:
                total_esperado += calcular_horas_esperadas(data_str)
    
    saldo = total_trabalhado - total_esperado
    horas_extras = max(0, saldo)
    horas_negativas = abs(min(0, saldo))
    
    media_horas_dia = total_trabalhado / dias_trabalhados if dias_trabalhados > 0 else 0
    
    return {
        'totalHorasTrabalhadas': int(total_trabalhado),
        'totalHorasEsperadas': int(total_esperado),
        'saldoMes': int(saldo),
        'diasTrabalhados': dias_trabalhados,
        'diasFalta': dias_falta,
        'horasExtras': int(horas_extras),
        'horasNegativas': int(horas_negativas),
        'mediaHorasDia': round(media_horas_dia, 1)
    }

def calcular_estatisticas_ponto_batch(registros_ponto_json, funcionarios_ids, mes, ano):
    """
    Calcula estatísticas de ponto para múltiplos funcionários em batch.
    """
    funcionarios = JSON.parse(funcionarios_ids)
    resultados = {}
    
    for func_id in funcionarios:
        resultados[func_id] = calcular_estatisticas_ponto_mes(
            registros_ponto_json,
            func_id,
            mes,
            ano
        )
    
    return resultados

# ==================== FUNÇÕES DE PONTUAÇÃO E RANKING ====================

def calcular_pontuacao_funcionario(pontos_json, avaliacoes_json, tarefas_json, emprestimos_json, funcionario_id):
    """
    Calcula pontuação total de um funcionário considerando todos os fatores.
    """
    pontos = JSON.parse(pontos_json)
    avaliacoes = JSON.parse(avaliacoes_json)
    tarefas = JSON.parse(tarefas_json)
    emprestimos = JSON.parse(emprestimos_json)
    
    # Filtrar dados do funcionário
    pontos_func = [p for p in pontos if p.get('funcionarioId') == funcionario_id]
    avaliacoes_func = [a for a in avaliacoes if a.get('funcionarioId') == funcionario_id]
    tarefas_func = [t for t in tarefas if t.get('funcionarioId') == funcionario_id]
    emprestimos_func = [e for e in emprestimos if e.get('funcionarioId') == funcionario_id]
    
    # Calcular pontos diretos
    pontos_diretos = int(np.sum([int(p.get('pontos', 0)) for p in pontos_func]))
    
    # Bônus por avaliações (média * 10)
    if avaliacoes_func:
        notas = np.array([float(a.get('nota', 0)) for a in avaliacoes_func])
        bonus_avaliacoes = int(np.mean(notas) * 10)
    else:
        bonus_avaliacoes = 0
    
    # Bônus por tarefas concluídas
    tarefas_concluidas = sum(1 for t in tarefas_func if t.get('status') == 'concluida')
    bonus_tarefas = tarefas_concluidas * 5
    
    # Penalidade por empréstimos atrasados
    emprestimos_atrasados = sum(1 for e in emprestimos_func if e.get('status') == 'atrasado')
    penalidade_emprestimos = emprestimos_atrasados * -10
    
    pontuacao_total = pontos_diretos + bonus_avaliacoes + bonus_tarefas + penalidade_emprestimos
    
    return {
        'pontuacaoTotal': max(0, pontuacao_total),
        'pontosDiretos': pontos_diretos,
        'bonusAvaliacoes': bonus_avaliacoes,
        'bonusTarefas': bonus_tarefas,
        'penalidadeEmprestimos': penalidade_emprestimos,
        'avaliacaoMedia': float(np.mean(notas)) if avaliacoes_func else 0.0,
        'tarefasConcluidas': tarefas_concluidas
    }

def calcular_ranking_funcionarios(funcionarios_json, pontos_json, avaliacoes_json, tarefas_json):
    """
    Calcula ranking de funcionários baseado em pontos e performance.
    Retorna lista ordenada por pontuação.
    """
    funcionarios = JSON.parse(funcionarios_json)
    pontos = JSON.parse(pontos_json)
    avaliacoes = JSON.parse(avaliacoes_json)
    tarefas = JSON.parse(tarefas_json)
    
    ranking = []
    
    for func in funcionarios:
        func_id = func.get('id')
        
        # Calcular pontos
        pontos_func = [p for p in pontos if p.get('funcionarioId') == func_id]
        total_pontos = int(np.sum([int(p.get('pontos', 0)) for p in pontos_func]))
        
        # Calcular avaliação média
        avaliacoes_func = [a for a in avaliacoes if a.get('funcionarioId') == func_id]
        if avaliacoes_func:
            notas = np.array([float(a.get('nota', 0)) for a in avaliacoes_func])
            avaliacao_media = float(np.mean(notas))
        else:
            avaliacao_media = 0.0
        
        # Calcular tarefas
        tarefas_func = [t for t in tarefas if t.get('funcionarioId') == func_id]
        tarefas_concluidas = sum(1 for t in tarefas_func if t.get('status') == 'concluida')
        tarefas_total = len(tarefas_func)
        taxa_conclusao = (tarefas_concluidas / tarefas_total * 100) if tarefas_total > 0 else 0
        
        # Pontuação composta
        pontuacao = total_pontos + (avaliacao_media * 10) + (tarefas_concluidas * 5)
        
        ranking.append({
            'funcionarioId': func_id,
            'funcionarioNome': func.get('nome', ''),
            'pontuacao': int(pontuacao),
            'pontos': total_pontos,
            'avaliacaoMedia': round(avaliacao_media, 2),
            'tarefasConcluidas': tarefas_concluidas,
            'tarefasTotal': tarefas_total,
            'taxaConclusao': round(taxa_conclusao, 2)
        })
    
    # Ordenar por pontuação (decrescente)
    ranking.sort(key=lambda x: x['pontuacao'], reverse=True)
    
    # Adicionar posição
    for i, item in enumerate(ranking):
        item['posicao'] = i + 1
    
    return ranking

def calcular_estatisticas_sistema(
    funcionarios_json,
    pontos_json,
    avaliacoes_json,
    tarefas_json,
    emprestimos_json,
    inventario_json
):
    """
    Calcula estatísticas gerais do sistema para dashboard.
    Otimizado com NumPy para grandes volumes de dados.
    """
    funcionarios = JSON.parse(funcionarios_json)
    pontos = JSON.parse(pontos_json)
    avaliacoes = JSON.parse(avaliacoes_json)
    tarefas = JSON.parse(tarefas_json)
    emprestimos = JSON.parse(emprestimos_json)
    inventario = JSON.parse(inventario_json)
    
    # Estatísticas de funcionários
    total_funcionarios = len(funcionarios)
    funcionarios_ativos = sum(1 for f in funcionarios if f.get('status') == 'ativo')
    
    # Estatísticas de pontos
    if pontos:
        pontos_array = np.array([int(p.get('pontos', 0)) for p in pontos])
        total_pontos = int(np.sum(pontos_array))
        media_pontos = float(np.mean(pontos_array))
    else:
        total_pontos = 0
        media_pontos = 0.0
    
    # Estatísticas de avaliações
    if avaliacoes:
        notas_array = np.array([float(a.get('nota', 0)) for a in avaliacoes])
        media_avaliacoes = float(np.mean(notas_array))
        total_avaliacoes = len(avaliacoes)
    else:
        media_avaliacoes = 0.0
        total_avaliacoes = 0
    
    # Estatísticas de tarefas
    tarefas_pendentes = sum(1 for t in tarefas if t.get('status') == 'pendente')
    tarefas_em_andamento = sum(1 for t in tarefas if t.get('status') == 'em_andamento')
    tarefas_concluidas = sum(1 for t in tarefas if t.get('status') == 'concluida')
    total_tarefas = len(tarefas)
    taxa_conclusao_tarefas = (tarefas_concluidas / total_tarefas * 100) if total_tarefas > 0 else 0
    
    # Estatísticas de empréstimos
    emprestimos_ativos = sum(1 for e in emprestimos if e.get('status') == 'ativo')
    emprestimos_atrasados = sum(1 for e in emprestimos if e.get('status') == 'atrasado')
    total_emprestimos = len(emprestimos)
    
    # Estatísticas de inventário
    if inventario:
        valores = np.array([float(i.get('valorUnitario', 0)) * int(i.get('quantidade', 0)) for i in inventario])
        valor_total_inventario = float(np.sum(valores))
        total_itens = len(inventario)
        quantidade_total = int(np.sum([int(i.get('quantidade', 0)) for i in inventario]))
    else:
        valor_total_inventario = 0.0
        total_itens = 0
        quantidade_total = 0
    
    return {
        'funcionarios': {
            'total': total_funcionarios,
            'ativos': funcionarios_ativos,
            'inativos': total_funcionarios - funcionarios_ativos
        },
        'pontos': {
            'total': total_pontos,
            'media': round(media_pontos, 2)
        },
        'avaliacoes': {
            'total': total_avaliacoes,
            'media': round(media_avaliacoes, 2)
        },
        'tarefas': {
            'total': total_tarefas,
            'pendentes': tarefas_pendentes,
            'emAndamento': tarefas_em_andamento,
            'concluidas': tarefas_concluidas,
            'taxaConclusao': round(taxa_conclusao_tarefas, 2)
        },
        'emprestimos': {
            'total': total_emprestimos,
            'ativos': emprestimos_ativos,
            'atrasados': emprestimos_atrasados
        },
        'inventario': {
            'totalItens': total_itens,
            'quantidadeTotal': quantidade_total,
            'valorTotal': round(valor_total_inventario, 2)
        }
    }

def calcular_tendencias_mensal(dados_historicos_json, tipo_calculo):
    """
    Calcula tendências mensais (crescimento, média móvel, etc).
    Tipo: 'pontos', 'tarefas', 'avaliacoes'
    """
    dados = JSON.parse(dados_historicos_json)
    
    if not dados:
        return {
            'tendencia': 'estavel',
            'variacao': 0.0,
            'mediaMensal': 0.0,
            'projecao': 0.0
        }
    
    # Extrair valores baseado no tipo
    if tipo_calculo == 'pontos':
        valores = np.array([float(d.get('pontos', 0)) for d in dados])
    elif tipo_calculo == 'tarefas':
        valores = np.array([float(d.get('quantidade', 0)) for d in dados])
    elif tipo_calculo == 'avaliacoes':
        valores = np.array([float(d.get('nota', 0)) for d in dados])
    else:
        valores = np.array([float(d.get('valor', 0)) for d in dados])
    
    if len(valores) == 0:
        return {
            'tendencia': 'estavel',
            'variacao': 0.0,
            'mediaMensal': 0.0,
            'projecao': 0.0
        }
    
    # Calcular estatísticas
    media = float(np.mean(valores))
    
    # Calcular tendência (comparar primeira e segunda metade)
    meio = len(valores) // 2
    if meio > 0:
        media_primeira_metade = float(np.mean(valores[:meio]))
        media_segunda_metade = float(np.mean(valores[meio:]))
        
        if media_primeira_metade > 0:
            variacao = ((media_segunda_metade - media_primeira_metade) / media_primeira_metade) * 100
        else:
            variacao = 0.0
        
        if variacao > 10:
            tendencia = 'crescente'
        elif variacao < -10:
            tendencia = 'decrescente'
        else:
            tendencia = 'estavel'
    else:
        variacao = 0.0
        tendencia = 'estavel'
    
    # Projeção simples (média dos últimos 3 meses)
    ultimos = valores[-3:] if len(valores) >= 3 else valores
    projecao = float(np.mean(ultimos))
    
    return {
        'tendencia': tendencia,
        'variacao': round(variacao, 2),
        'mediaMensal': round(media, 2),
        'projecao': round(projecao, 2),
        'totalPeriodo': int(np.sum(valores))
    }

def compress_data(data_json, collection_name):
    """
    Comprime dados JSON usando gzip e base64
    Reduz significativamente o tamanho para armazenamento em IndexedDB
    """
    import gzip
    import base64
    
    # Converter string JSON para bytes
    data_bytes = data_json.encode('utf-8')
    
    # Comprimir com gzip (nível 9 = máxima compressão)
    compressed = gzip.compress(data_bytes, compresslevel=9)
    
    # Converter para base64 para armazenamento seguro
    compressed_b64 = base64.b64encode(compressed).decode('utf-8')
    
    # Calcular estatísticas de compressão
    original_size = len(data_bytes)
    compressed_size = len(compressed)
    ratio = round((1 - compressed_size / original_size) * 100, 2)
    
    return {
        'compressed': compressed_b64,
        'originalSize': original_size,
        'compressedSize': compressed_size,
        'compressionRatio': ratio,
        'collection': collection_name
    }

def decompress_data(compressed_b64):
    """
    Descomprime dados comprimidos com compress_data
    """
    import gzip
    import base64
    
    # Decodificar base64
    compressed = base64.b64decode(compressed_b64.encode('utf-8'))
    
    # Descomprimir gzip
    decompressed = gzip.decompress(compressed)
    
    # Converter bytes para string
    data_json = decompressed.decode('utf-8')
    
    return data_json
    `);
    
    isInitialized = true;
    console.log('✅ Pyodide inicializado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar Pyodide:', error);
    throw error;
  }
}

// Handler de mensagens
self.onmessage = async function(e) {
  const { type, data, id } = e.data;
  
  try {
    // CORREÇÃO 4: Verificar se Pyodide está pronto antes de processar
    if (!isInitialized) {
      console.log('⏳ Aguardando inicialização do Pyodide...');
      await initPyodide();
    }

    if (!pyodide) {
      throw new Error('Pyodide não foi inicializado corretamente');
    }
    
    let result;
    
    switch (type) {
      case 'CALCULAR_VALORES_SETOR':
        const { inventario, danificadas, perdidas, setorId, setorNome } = data;
        
        result = pyodide.runPython(`
calcular_valores_setor(
  '${JSON.stringify(inventario)}',
  '${JSON.stringify(danificadas)}',
  '${JSON.stringify(perdidas)}',
  '${setorId}',
  '${setorNome}'
)
        `).toJs();
        
        // Converter Map para Object
        result = Object.fromEntries(result);
        break;
        
      case 'CALCULAR_VALORES_SETORES_BATCH':
        const { setores, inventarioBatch, danificadasBatch, perdidasBatch } = data;
        
        result = pyodide.runPython(`
calcular_valores_setores_batch(
  '${JSON.stringify(setores)}',
  '${JSON.stringify(inventarioBatch)}',
  '${JSON.stringify(danificadasBatch)}',
  '${JSON.stringify(perdidasBatch)}'
)
        `).toJs();
        
        // Converter Map aninhado para Object
        const resultObj = {};
        for (const [key, value] of result) {
          resultObj[key] = Object.fromEntries(value);
        }
        result = resultObj;
        break;
        
      case 'CALCULAR_ESTATISTICAS_FUNCIONARIO':
        const { funcionarioId, pontos, avaliacoes, tarefas, registros } = data;
        
        result = pyodide.runPython(`
calcular_estatisticas_funcionario(
  '${funcionarioId}',
  '${JSON.stringify(pontos)}',
  '${JSON.stringify(avaliacoes)}',
  '${JSON.stringify(tarefas)}',
  '${JSON.stringify(registros)}'
)
        `).toJs();
        
        result = Object.fromEntries(result);
        break;
        
      case 'CALCULAR_CARD_FUNCIONARIO':
        const { funcionario, pontosFuncionario, avaliacoesFuncionario, tarefasFuncionario, emprestimosFuncionario } = data;
        
        result = pyodide.runPython(`
calcular_card_funcionario(
  '${JSON.stringify(funcionario)}',
  '${JSON.stringify(pontosFuncionario || [])}',
  '${JSON.stringify(avaliacoesFuncionario || [])}',
  '${JSON.stringify(tarefasFuncionario || [])}',
  '${JSON.stringify(emprestimosFuncionario || [])}'
)
        `).toJs();
        
        result = Object.fromEntries(result);
        break;
        
      case 'CALCULAR_CARDS_FUNCIONARIOS_BATCH':
        const { funcionarios: funcionariosList, pontosAll, avaliacoesAll, tarefasAll, emprestimosAll } = data;
        
        result = pyodide.runPython(`
calcular_cards_funcionarios_batch(
  '${JSON.stringify(funcionariosList)}',
  '${JSON.stringify(pontosAll || [])}',
  '${JSON.stringify(avaliacoesAll || [])}',
  '${JSON.stringify(tarefasAll || [])}',
  '${JSON.stringify(emprestimosAll || [])}'
)
        `).toJs();
        
        // Converter Map aninhado para Object
        const resultObjFunc = {};
        for (const [key, value] of result) {
          resultObjFunc[key] = Object.fromEntries(value);
        }
        result = resultObjFunc;
        break;
        
      case 'CALCULAR_HORAS_TRABALHADAS':
        const { entrada, saidaAlmoco, retornoAlmoco, saida } = data;
        
        result = pyodide.runPython(`
calcular_horas_trabalhadas(
  '${entrada || ''}',
  '${saidaAlmoco || ''}',
  '${retornoAlmoco || ''}',
  '${saida || ''}'
)
        `).toJs();
        
        result = Object.fromEntries(result);
        break;
        
      case 'CALCULAR_HORAS_ESPERADAS':
        const { data: dataCalc } = data;
        
        result = pyodide.runPython(`
calcular_horas_esperadas('${dataCalc || ''}')
        `);
        
        result = Number(result);
        break;
        
      case 'CALCULAR_SALDO_HORAS':
        const { horasTrabalhadasMin, horasEsperadasMin } = data;
        
        result = pyodide.runPython(`
calcular_saldo_horas(
  ${horasTrabalhadasMin},
  ${horasEsperadasMin}
)
        `).toJs();
        
        result = Object.fromEntries(result);
        break;
        
      case 'CALCULAR_ESTATISTICAS_PONTO_MES':
        const { registrosPonto, funcionarioIdPonto, mes, ano } = data;
        
        result = pyodide.runPython(`
calcular_estatisticas_ponto_mes(
  '${JSON.stringify(registrosPonto)}',
  '${funcionarioIdPonto}',
  ${mes},
  ${ano}
)
        `).toJs();
        
        result = Object.fromEntries(result);
        break;
        
      case 'CALCULAR_ESTATISTICAS_PONTO_BATCH':
        const { registrosPontoBatch, funcionariosIds, mesBatch, anoBatch } = data;
        
        result = pyodide.runPython(`
calcular_estatisticas_ponto_batch(
  '${JSON.stringify(registrosPontoBatch)}',
  '${JSON.stringify(funcionariosIds)}',
  ${mesBatch},
  ${anoBatch}
)
        `).toJs();
        
        // Converter Map aninhado para Object
        const resultObjPonto = {};
        for (const [key, value] of result) {
          resultObjPonto[key] = Object.fromEntries(value);
        }
        result = resultObjPonto;
        break;
      
      case 'CALCULAR_PONTUACAO_FUNCIONARIO':
        const { 
          pontosFunc, 
          avaliacoesFunc, 
          tarefasFunc, 
          emprestimosFunc, 
          funcionarioIdPont 
        } = data;
        
        result = pyodide.runPython(`
calcular_pontuacao_funcionario(
  '${JSON.stringify(pontosFunc)}',
  '${JSON.stringify(avaliacoesFunc)}',
  '${JSON.stringify(tarefasFunc)}',
  '${JSON.stringify(emprestimosFunc)}',
  '${funcionarioIdPont}'
)
        `).toJs();
        
        result = Object.fromEntries(result);
        break;
      
      case 'CALCULAR_RANKING_FUNCIONARIOS':
        const { funcionariosRank, pontosRank, avaliacoesRank, tarefasRank } = data;
        
        result = pyodide.runPython(`
calcular_ranking_funcionarios(
  '${JSON.stringify(funcionariosRank)}',
  '${JSON.stringify(pontosRank)}',
  '${JSON.stringify(avaliacoesRank)}',
  '${JSON.stringify(tarefasRank)}'
)
        `).toJs();
        
        // Converter array de Maps para array de Objects
        result = result.toJs({dict_converter: Object.fromEntries});
        break;
      
      case 'CALCULAR_ESTATISTICAS_SISTEMA':
        const { 
          funcionariosSist,
          pontosSist,
          avaliacoesSist,
          tarefasSist,
          emprestimosSist,
          inventarioSist
        } = data;
        
        result = pyodide.runPython(`
calcular_estatisticas_sistema(
  '${JSON.stringify(funcionariosSist)}',
  '${JSON.stringify(pontosSist)}',
  '${JSON.stringify(avaliacoesSist)}',
  '${JSON.stringify(tarefasSist)}',
  '${JSON.stringify(emprestimosSist)}',
  '${JSON.stringify(inventarioSist)}'
)
        `).toJs();
        
        // Converter Map aninhado para Object
        const sistStats = {};
        for (const [key, value] of result) {
          if (value instanceof Map) {
            sistStats[key] = Object.fromEntries(value);
          } else {
            sistStats[key] = value;
          }
        }
        result = sistStats;
        break;
      
      case 'CALCULAR_TENDENCIAS_MENSAL':
        const { dadosHistoricos, tipoCalculo } = data;
        
        result = pyodide.runPython(`
calcular_tendencias_mensal(
  '${JSON.stringify(dadosHistoricos)}',
  '${tipoCalculo}'
)
        `).toJs();
        
        result = Object.fromEntries(result);
        break;
      
      case 'COMPRESS_DATA':
        const { data: dataToCompress, collectionName } = data.payload;
        
        // CORREÇÃO 3: Escape correto e seguro para Python
        // Usar btoa para base64 e evitar problemas com caracteres especiais
        const dataB64 = btoa(unescape(encodeURIComponent(dataToCompress)));
        
        result = pyodide.runPython(`
import base64
data_json = base64.b64decode('${dataB64}').decode('utf-8')
result = compress_data(data_json, '${collectionName}')
result
        `).toJs();
        
        result = Object.fromEntries(result);
        break;
      
      case 'DECOMPRESS_DATA':
        const { compressedData } = data.payload;
        
        // CORREÇÃO 3: Passar dados diretamente sem escape
        result = pyodide.runPython(`
result = decompress_data('${compressedData}')
result
        `);
        
        break;
      
      default:
        throw new Error(`Tipo de operação desconhecido: ${type}`);
    }
    
    // Enviar resultado
    self.postMessage({
      type: 'SUCCESS',
      id,
      result
    });
    
  } catch (error) {
    console.error('Erro no worker Python:', error);
    self.postMessage({
      type: 'ERROR',
      id,
      error: error.message
    });
  }
};

// Inicializar automaticamente em background
initPyodide().catch(err => {
  console.error('Falha ao inicializar Pyodide:', err);
});
