import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'pt', name: 'PT' },
    { code: 'es', name: 'ES' },
    { code: 'en', name: 'EN' }
  ];

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
  };

  return (
    <div className="flex items-center space-x-2">
      <Globe className="w-5 h-5 text-gray-500" />
      <div className="flex space-x-1">
        {languages.map((lang, index) => (
          <React.Fragment key={lang.code}>
            {index > 0 && <span className="text-gray-300">|</span>}
            <button
              onClick={() => changeLanguage(lang.code)}
              className={`px-2 py-1 rounded transition-colors ${
                i18n.language === lang.code
                  ? 'text-blue-600 font-medium'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {lang.name}
            </button>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;
