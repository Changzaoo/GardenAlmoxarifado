import React from 'react';
import LegalRouter from './LegalRouter';

const LegalTab = ({ initialPath = '/', usuario, onClose }) => {
  return <LegalRouter initialPath={initialPath} usuario={usuario} onClose={onClose} />;
};

export default LegalTab;
