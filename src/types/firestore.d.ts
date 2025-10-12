/**
 * Declarações de tipo globais para evitar erros de compilação
 * durante a migração TypeScript
 */

// Permite qualquer propriedade em objetos Firestore
declare module 'firebase/firestore' {
  interface DocumentData {
    [key: string]: any;
  }
}

// Extensão global para objetos com propriedades dinâmicas
declare global {
  interface Object {
    [key: string]: any;
  }
}

export {};
