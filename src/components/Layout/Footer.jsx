import React, { useState } from 'react';
import './Footer.css';

const Footer = () => {
  const [showLinks, setShowLinks] = useState(false);

  const primaryLinks = [
    { href: "/about", text: "Sobre" },
    { href: "/press", text: "Imprensa" },
    { href: "/copyright", text: "Direitos autorais" },
    { href: "/contact", text: "Entre em contato" },
    { href: "/creators", text: "Criadores de conteúdo" },
    { href: "/ads", text: "Publicidade" },
    { href: "/developers", text: "Desenvolvedores" }
  ];

  const secondaryLinks = [
    { href: "/terms", text: "Termos" },
    { href: "/privacy", text: "Privacidade" },
    { href: "/policies", text: "Política e segurança" },
    { href: "/how-it-works", text: "Como funciona o sistema" },
    { href: "/new-features", text: "Testar os novos recursos" }
  ];

  return (
    <div className="app-footer">
      <button 
        className="footer-toggle-button"
        onClick={() => setShowLinks(!showLinks)}
      >
        Informações e Links
      </button>

      {showLinks && (
        <div className="footer-content">
          <div className="guide-links-primary">
            {primaryLinks.map((link, index) => (
              <a 
                key={index} 
                href={link.href}
                className="footer-link"
              >
                {link.text}
              </a>
            ))}
          </div>

          <div className="guide-links-secondary">
            {secondaryLinks.map((link, index) => (
              <a 
                key={index} 
                href={link.href}
                className="footer-link"
              >
                {link.text}
              </a>
            ))}
          </div>

          <div className="copyright">
            <div dir="ltr">© {new Date().getFullYear()} Garden Almoxarifado</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Footer;
