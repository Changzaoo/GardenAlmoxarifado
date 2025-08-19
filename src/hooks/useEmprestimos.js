import { ref, set, onValue } from 'firebase/database';
import { db } from '../firebaseConfig';
import { encryptData, decryptData } from '../services/encryptionService';

export const useEmprestimos = () => {
  const [emprestimos, setEmprestimos] = useState([]);
  
  // Carregar dados ao inicializar
  useEffect(() => {
    const emprestimosRef = ref(db, 'emprestimos');
    onValue(emprestimosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setEmprestimos(decryptData(data));
      } else {
        setEmprestimos(historicoInicial);
      }
    });
  }, []);

  const adicionarEmprestimo = (novoEmprestimo, atualizarInventario) => {
    // ... lógica existente ...
    
    // Atualizar Firebase
    const encryptedData = encryptData([...emprestimos, emprestimo]);
    set(ref(db, 'emprestimos'), encryptedData);
    
    return emprestimo;
  };

  // Implementar similarmente para outras funções
};