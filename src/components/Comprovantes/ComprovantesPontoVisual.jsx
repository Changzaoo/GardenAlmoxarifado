import React from 'react';
import { Building2, User, Briefcase, Grid3x3, Calendar, Clock, TrendingUp, FileText, Shield, Award } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ComprovantesPontoVisual = ({ dados }) => {
  const {
    funcionarioNome,
    empresa,
    setor,
    cargo,
    cpf,
    data,
    pontos = {},
    horasEsperadas,
    horasTrabalhadas,
    saldo,
    advertencias = [],
    codigoAssinatura,
    observacoes
  } = dados;

  // Formatar data
  const dataFormatada = data ? format(new Date(data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '';
  const dataHora = data ? format(new Date(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '';

  // Formatar horários
  const formatarHorario = (horario) => {
    if (!horario) return '--:--';
    if (typeof horario === 'string') return horario;
    const date = new Date(horario);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Determinar cor do saldo
  const saldoMinutos = saldo?.saldoMinutos || 0;
  const saldoCor = saldoMinutos >= 0 ? 'text-green-600' : 'text-red-600';
  const saldoBgCor = saldoMinutos >= 0 ? 'bg-green-50' : 'bg-red-50';

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-2xl mx-auto">
      {/* Cabeçalho com Logo e Título */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">WorkFlow</h1>
              <p className="text-green-100 text-sm">Sistema de Ponto Eletrônico</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-green-100 mb-1">Comprovante</div>
            <div className="text-lg font-bold font-mono">#PONTO</div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-semibold">Data do Registro</span>
          </div>
          <div className="text-2xl font-bold">{dataFormatada}</div>
        </div>
      </div>

      {/* Informações do Funcionário */}
      <div className="p-8 bg-gray-50">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-green-600" />
          FUNCIONÁRIO
        </h2>
        
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">Nome Completo</div>
              <div className="font-bold text-gray-900 text-lg">{funcionarioNome || 'N/A'}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">Empresa</div>
                <div className="font-semibold text-gray-900">{empresa || 'N/A'}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Grid3x3 className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">Setor</div>
                <div className="font-semibold text-gray-900">{setor || 'N/A'}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">Cargo</div>
                <div className="font-semibold text-gray-900">{cargo || 'N/A'}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">CPF</div>
                <div className="font-semibold text-gray-900 font-mono">{cpf || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registros de Ponto */}
      <div className="px-8 pb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-green-600" />
          REGISTROS DE PONTO
        </h2>
        
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Horário Registrado</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Horário Esperado</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 font-semibold text-gray-900">Entrada</td>
                <td className="px-4 py-3 text-center font-mono text-lg font-bold text-gray-900">
                  {formatarHorario(pontos.entrada)}
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-600">
                  {horasEsperadas?.entrada || '--:--'}
                </td>
                <td className="px-4 py-3 text-center">
                  {pontos.entrada ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      ✓ Registrado
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">Não batido</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-gray-900">Saída p/ Almoço</td>
                <td className="px-4 py-3 text-center font-mono text-lg font-bold text-gray-900">
                  {formatarHorario(pontos.saida_almoco)}
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-600">
                  {horasEsperadas?.almoco || '--:--'}
                </td>
                <td className="px-4 py-3 text-center">
                  {pontos.saida_almoco ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      ✓ Registrado
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">Não batido</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-gray-900">Retorno</td>
                <td className="px-4 py-3 text-center font-mono text-lg font-bold text-gray-900">
                  {formatarHorario(pontos.retorno_almoco)}
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-600">
                  {horasEsperadas?.retorno || '--:--'}
                </td>
                <td className="px-4 py-3 text-center">
                  {pontos.retorno_almoco ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      ✓ Registrado
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">Não batido</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-gray-900">Saída</td>
                <td className="px-4 py-3 text-center font-mono text-lg font-bold text-gray-900">
                  {formatarHorario(pontos.saida)}
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-600">
                  {horasEsperadas?.saida || '--:--'}
                </td>
                <td className="px-4 py-3 text-center">
                  {pontos.saida ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      ✓ Registrado
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">Não batido</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumo de Horas */}
      <div className="px-8 pb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          RESUMO DE HORAS
        </h2>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-200">
            <div className="text-xs text-blue-600 font-semibold mb-2">Horas Esperadas</div>
            <div className="text-2xl font-bold text-blue-900 font-mono">
              {horasEsperadas?.total || horasTrabalhadas?.esperadasFormatado || '--:--'}
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-200">
            <div className="text-xs text-purple-600 font-semibold mb-2">Horas Trabalhadas</div>
            <div className="text-2xl font-bold text-purple-900 font-mono">
              {horasTrabalhadas?.formatado || '--:--'}
            </div>
          </div>
          
          <div className={`${saldoBgCor} rounded-xl p-4 text-center border ${saldoMinutos >= 0 ? 'border-green-200' : 'border-red-200'}`}>
            <div className={`text-xs font-semibold mb-2 ${saldoMinutos >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Saldo
            </div>
            <div className={`text-2xl font-bold font-mono ${saldoCor}`}>
              {saldo?.saldoFormatado || '--:--'}
            </div>
          </div>
        </div>
      </div>

      {/* Advertências */}
      {advertencias && advertencias.length > 0 && (
        <div className="px-8 pb-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <h3 className="font-bold text-red-900 mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              ADVERTÊNCIAS ({advertencias.length})
            </h3>
            <ul className="space-y-2">
              {advertencias.map((adv, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-red-800">
                  <span className="text-red-500">•</span>
                  <span>{adv}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Observações */}
      {observacoes && (
        <div className="px-8 pb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h3 className="font-bold text-yellow-900 mb-2 text-sm">Observações</h3>
            <p className="text-sm text-yellow-800">{observacoes}</p>
          </div>
        </div>
      )}

      {/* Rodapé com Assinatura Digital */}
      <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Shield className="w-4 h-4" />
            <span className="text-xs font-semibold">Assinatura Digital</span>
          </div>
          <div className="text-xs text-gray-500">Emitido em {dataHora}</div>
        </div>
        
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4">
          <div className="font-mono text-center text-sm text-gray-700 break-all">
            {codigoAssinatura || 'COMPROVANTE-PONTO-' + Date.now()}
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">
          <p>Este é um documento digital válido emitido pelo sistema WorkFlow</p>
          <p className="mt-1">Verifique a autenticidade através do código de assinatura</p>
        </div>
      </div>

      {/* Badge WorkFlow */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 py-3">
        <div className="text-center text-white text-xs font-semibold">
          WorkFlow © {new Date().getFullYear()} - Sistema de Gestão Empresarial
        </div>
      </div>
    </div>
  );
};

export default ComprovantesPontoVisual;
