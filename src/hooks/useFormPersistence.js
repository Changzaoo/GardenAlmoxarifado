import { useEffect } from 'react';
import { usePersistentState } from './usePersistentState';

export function useFormPersistence(formId) {
  const [formData, setFormData] = usePersistentState(`form_${formId}`, {});

  useEffect(() => {
    // When component mounts, restore form data
    const form = document.getElementById(formId);
    if (form) {
      // Restore input values
      Object.entries(formData).forEach(([name, value]) => {
        const input = form.querySelector(`[name="${name}"]`);
        if (input) {
          if (input.type === 'checkbox') {
            input.checked = value;
          } else {
            input.value = value;
          }
        }
      });

      // Listen for input changes
      const handleChange = (e) => {
        const { name, type, value, checked } = e.target;
        setFormData(prev => ({
          ...prev,
          [name]: type === 'checkbox' ? checked : value
        }));
      };

      // Add listeners to all form inputs
      form.querySelectorAll('input, textarea, select').forEach(input => {
        input.addEventListener('input', handleChange);
        input.addEventListener('change', handleChange);
      });

      // Cleanup listeners when component unmounts
      return () => {
        form.querySelectorAll('input, textarea, select').forEach(input => {
          input.removeEventListener('input', handleChange);
          input.removeEventListener('change', handleChange);
        });
      };
    }
  }, [formId, setFormData]);

  // Function to clear form data from storage
  const clearForm = () => {
    setFormData({});
  };

  return { formData, setFormData, clearForm };
}
