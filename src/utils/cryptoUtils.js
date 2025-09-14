// Função para ofuscar strings
const encrypt = (text) => {
  const key = process.env.REACT_APP_FIREBASE_API_KEY || '';
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
};

// Função para desofuscar strings
const decrypt = (encoded) => {
  try {
    const key = process.env.REACT_APP_FIREBASE_API_KEY || '';
    const text = atob(encoded);
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch {
    return encoded;
  }
};

// Função para ofuscar objeto
const encryptObject = (obj) => {
  const encrypted = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      encrypted[encrypt(key)] = encrypt(obj[key].toString());
    }
  }
  return encrypted;
};

// Função para desofuscar objeto
const decryptObject = (obj) => {
  const decrypted = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      decrypted[decrypt(key)] = decrypt(obj[key]);
    }
  }
  return decrypted;
};

export { encrypt, decrypt, encryptObject, decryptObject };