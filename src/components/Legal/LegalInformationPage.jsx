import React from 'react';

const LegalInformationPage = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Informações Legais
      </h1>

      <div className="space-y-8">
        {/* LGPD */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Lei Geral de Proteção de Dados (LGPD)
          </h2>
          <div className="prose dark:prose-invert">
            <p className="text-gray-600 dark:text-gray-300">
              Em conformidade com a Lei nº 13.709/2018 (LGPD), informamos que:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>Seus dados pessoais são coletados e tratados apenas para fins específicos de gerenciamento do almoxarifado</li>
              <li>Mantemos seus dados seguros e protegidos</li>
              <li>Você tem direito de acessar, corrigir e solicitar a exclusão dos seus dados</li>
              <li>Não compartilhamos seus dados com terceiros sem seu consentimento</li>
            </ul>
          </div>
        </section>

        {/* Termos de Uso */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Termos de Uso
          </h2>
          <div className="prose dark:prose-invert">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Ao utilizar este sistema, você concorda com os seguintes termos:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>O sistema deve ser usado apenas para fins profissionais</li>
              <li>As informações inseridas devem ser verdadeiras e precisas</li>
              <li>Você é responsável pela segurança de suas credenciais de acesso</li>
              <li>O uso indevido do sistema pode resultar em suspensão do acesso</li>
            </ul>
          </div>
        </section>

        {/* Responsabilidades */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Responsabilidades
          </h2>
          <div className="prose dark:prose-invert">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Responsabilidades dos usuários do sistema:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>Manter a confidencialidade das informações acessadas</li>
              <li>Reportar imediatamente qualquer atividade suspeita</li>
              <li>Seguir as normas de segurança e procedimentos estabelecidos</li>
              <li>Zelar pelo patrimônio e equipamentos sob sua responsabilidade</li>
            </ul>
          </div>
        </section>

        {/* NR-12 */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Conformidade com NR-12
          </h2>
          <div className="prose dark:prose-invert">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Este sistema segue as diretrizes da Norma Regulamentadora 12 (NR-12):
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>Controle de uso e manutenção de máquinas e equipamentos</li>
              <li>Registro de treinamentos e capacitações</li>
              <li>Documentação de procedimentos de segurança</li>
              <li>Gestão de manutenção preventiva e corretiva</li>
            </ul>
          </div>
        </section>

        {/* Contato */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Contato para Assuntos Legais
          </h2>
          <div className="prose dark:prose-invert">
            <p className="text-gray-600 dark:text-gray-300">
              Para questões legais ou relacionadas à privacidade, entre em contato através do email: legal@empresa.com.br
            </p>
          </div>
        </section>

        {/* Última atualização */}
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Última atualização: 30 de Agosto de 2025
        </p>
      </div>
    </div>
  );
};

export default LegalInformationPage;
