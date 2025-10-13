import React, { useState, useEffect } from 'react';
import { useFuncionarioPerfil } from '../../contexts/FuncionarioPerfilContext';
import { useAuth } from '../../hooks/useAuth';
import { User, Building2, Briefcase, Phone, MessageCircle, Mail, Calendar, Shield, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Componente de Configuração do Perfil do Funcionário
 * Permite editar informações completas do perfil
 */
const PerfilConfigurador = ({ onClose }) => {
  const { perfil, empresas, setores, funcoes, atualizarPerfil, carregarSetores, perfilCompleto } = useFuncionarioPerfil();
  const { usuario } = useAuth();
  
  const [formData, setFormData] = useState({
    // Prioridades
    empresa: '',
    setor: '',
    funcao: '',
    
    // Contato
    telefone: '',
    whatsapp: '',
    email: '',
    
    // Pessoais
    nome: '',
    cpf: '',
    dataNascimento: '',
    
    // Extras
    observacoes: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  // Preencher formulário com dados do perfil
  useEffect(() => {
    if (perfil) {
      setFormData({
        empresa: perfil.empresa || '',
        setor: perfil.setor || '',
        funcao: perfil.funcao || '',
        telefone: perfil.telefone || '',
        whatsapp: perfil.whatsapp || '',
        email: perfil.email || '',
        nome: perfil.nome || '',
        cpf: perfil.cpf || '',
        dataNascimento: perfil.dataNascimento || '',
        observacoes: perfil.observacoes || ''
      });
    }
  }, [perfil]);

  // Carregar setores quando empresa mudar
  useEffect(() => {
    if (formData.empresa) {
      carregarSetores(formData.empresa);
    }
  }, [formData.empresa]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpar erro do campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validarFormulario = () => {
    const newErrors = {};

    // Campos obrigatórios
    if (!formData.empresa) newErrors.empresa = 'Empresa é obrigatória';
    if (!formData.setor) newErrors.setor = 'Setor é obrigatório';
    if (!formData.funcao) newErrors.funcao = 'Função é obrigatória';
    if (!formData.nome) newErrors.nome = 'Nome é obrigatório';

    // Validação de telefone
    if (formData.telefone && !/^\d{10,11}$/.test(formData.telefone.replace(/\D/g, ''))) {
      newErrors.telefone = 'Telefone inválido';
    }

    // Validação de email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Validação de CPF
    if (formData.cpf && !/^\d{11}$/.test(formData.cpf.replace(/\D/g, ''))) {
      newErrors.cpf = 'CPF inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    setSaving(true);
    setSuccess(false);

    try {
      // Se é primeira configuração, atualizar status
      const dadosParaSalvar = { ...formData };
      
      if (!perfilCompleto()) {
        dadosParaSalvar.status = 'ativo';
      }

      const sucesso = await atualizarPerfil(dadosParaSalvar);

      if (sucesso) {
        setSuccess(true);
        setTimeout(() => {
          if (onClose) onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      setErrors({ geral: 'Erro ao salvar perfil. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  const formatarTelefone = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const formatarCPF = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const isPerfilIncompleto = !perfilCompleto();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {isPerfilIncompleto ? 'Complete seu Perfil' : 'Editar Perfil'}
              </h2>
              <p className="text-blue-100">
                {isPerfilIncompleto 
                  ? 'Precisamos de algumas informações para continuar'
                  : 'Mantenha suas informações atualizadas'
                }
              </p>
            </div>
            {!isPerfilIncompleto && (
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white text-3xl leading-none"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Alerts */}
        {isPerfilIncompleto && (
          <div className="mx-6 mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Perfil Incompleto
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Por favor, preencha os campos obrigatórios (Empresa, Setor e Função) para usar o sistema.
              </p>
            </div>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
            <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              Perfil atualizado com sucesso!
            </p>
          </div>
        )}

        {errors.geral && (
          <div className="mx-6 mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{errors.geral}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Seção: Informações Principais (OBRIGATÓRIAS) */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 size={20} className="text-blue-600" />
              Informações Principais *
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Empresa *
                </label>
                <select
                  name="empresa"
                  value={formData.empresa}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.empresa 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500`}
                  required
                >
                  <option value="">Selecione...</option>
                  {empresas.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.nome}</option>
                  ))}
                </select>
                {errors.empresa && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.empresa}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Setor *
                </label>
                <select
                  name="setor"
                  value={formData.setor}
                  onChange={handleChange}
                  disabled={!formData.empresa}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.setor 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50`}
                  required
                >
                  <option value="">Selecione...</option>
                  {setores.map(set => (
                    <option key={set.id} value={set.id}>{set.nome}</option>
                  ))}
                </select>
                {errors.setor && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.setor}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Função/Cargo *
                </label>
                <select
                  name="funcao"
                  value={formData.funcao}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.funcao 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500`}
                  required
                >
                  <option value="">Selecione...</option>
                  {funcoes.map(func => (
                    <option key={func.id} value={func.id}>{func.nome}</option>
                  ))}
                </select>
                {errors.funcao && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.funcao}</p>
                )}
              </div>
            </div>
          </div>

          {/* Seção: Informações Pessoais */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User size={20} className="text-purple-600" />
              Informações Pessoais
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.nome 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500`}
                  required
                />
                {errors.nome && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.nome}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CPF
                </label>
                <input
                  type="text"
                  name="cpf"
                  value={formatarCPF(formData.cpf)}
                  onChange={(e) => handleChange({ target: { name: 'cpf', value: e.target.value.replace(/\D/g, '') }})}
                  maxLength={14}
                  placeholder="000.000.000-00"
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.cpf 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500`}
                />
                {errors.cpf && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.cpf}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  name="dataNascimento"
                  value={formData.dataNascimento}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Seção: Contato */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Phone size={20} className="text-green-600" />
              Informações de Contato
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  name="telefone"
                  value={formatarTelefone(formData.telefone)}
                  onChange={(e) => handleChange({ target: { name: 'telefone', value: e.target.value.replace(/\D/g, '') }})}
                  maxLength={15}
                  placeholder="(00) 00000-0000"
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.telefone 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500`}
                />
                {errors.telefone && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.telefone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <MessageCircle size={16} />
                  WhatsApp
                </label>
                <input
                  type="tel"
                  name="whatsapp"
                  value={formatarTelefone(formData.whatsapp)}
                  onChange={(e) => handleChange({ target: { name: 'whatsapp', value: e.target.value.replace(/\D/g, '') }})}
                  maxLength={15}
                  placeholder="(00) 00000-0000"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Mail size={16} />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@exemplo.com"
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.email 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500`}
                />
                {errors.email && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Seção: Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Observações
            </label>
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              rows={3}
              placeholder="Informações adicionais..."
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            {!isPerfilIncompleto && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  {isPerfilIncompleto ? 'Completar Perfil' : 'Salvar Alterações'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PerfilConfigurador;
