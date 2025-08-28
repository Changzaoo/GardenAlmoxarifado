import React, { useState } from 'react';
import { HelpCircle, Search, X, Book } from 'lucide-react';

const SupportButton = ({ content }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleModal = () => setIsOpen(!isOpen);

  const filteredContent = !content ? [] : 
    searchTerm
      ? content.filter(item =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.content.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : content;

  return (
    <>
      <button
        onClick={toggleModal}
        className="flex items-center justify-center w-10 h-10 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="Ajuda"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={toggleModal} />

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Ajuda
                </h3>
                <button
                  onClick={toggleModal}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                {/* Barra de pesquisa */}
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Pesquisar ajuda..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Conteúdo */}
                <div className="space-y-4">
                  {filteredContent.map((item, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                    >
                      <div className="p-4 bg-white dark:bg-gray-800">
                        <div className="flex items-center gap-2">
                          <Book className="w-5 h-5 text-blue-500" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {item.title}
                          </span>
                        </div>
                            
                        <div className="mt-4">
                          <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                            {item.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SupportButton;
