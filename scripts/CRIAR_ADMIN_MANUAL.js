/**
 * INSTRUÇÕES PARA CRIAR O ADMIN NO FIREBASE CONSOLE
 * 
 * 1. Abra o Firebase Console: https://console.firebase.google.com/
 * 2. Selecione o projeto "workflowbr1"
 * 3. Vá em "Firestore Database" no menu lateral
 * 4. Clique em "+ Iniciar coleção"
 * 5. Nome da coleção: usuarios
 * 6. Clique em "Adicionar documento"
 * 7. ID do documento: (deixe automático)
 * 8. Adicione os seguintes campos:
 */

// ========================================
// COPIE E COLE NO CONSOLE DO NAVEGADOR
// ========================================

// Abra o Console do navegador (F12) na página do Firebase Console
// Cole este código e pressione Enter:

const CryptoJS = window.CryptoJS || require('crypto-js');

const APP_SECRET = 'W0rkFl0w@2024!S3cur3#K3y$2024*P@ssw0rd!H@sh';

const generateSecureSalt = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let salt = '';
  for (let i = 0; i < 32; i++) {
    salt += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return salt;
};

const salt = generateSecureSalt();
const hash = CryptoJS.SHA512('1533' + salt + APP_SECRET).toString();

console.log('========================================');
console.log('DADOS DO ADMIN PARA WORKFLOWBR1');
console.log('========================================');
console.log('');
console.log('COPIE OS CAMPOS ABAIXO:');
console.log('');
console.log('nome (string): Administrador');
console.log('email (string): admin');
console.log('senha (string):', hash);
console.log('salt (string):', salt);
console.log('version (string): v2');
console.log('algorithm (string): SHA-512');
console.log('nivel (number): 0');
console.log('ativo (boolean): true');
console.log('criadoEm (string):', new Date().toISOString());
console.log('bancoDeDados (string): workflowbr1');
console.log('');
console.log('========================================');
console.log('Login: admin');
console.log('Senha: 1533');
console.log('========================================');

// ========================================
// OU USE ESTE JSON DIRETO NO FIRESTORE
// ========================================

const adminData = {
  nome: 'Administrador',
  email: 'admin',
  senha: hash,
  salt: salt,
  version: 'v2',
  algorithm: 'SHA-512',
  nivel: 0,
  ativo: true,
  criadoEm: new Date().toISOString(),
  bancoDeDados: 'workflowbr1'
};

console.log('');
console.log('JSON COMPLETO (copie e cole no modo JSON do Firestore):');
console.log(JSON.stringify(adminData, null, 2));
