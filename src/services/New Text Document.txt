// هذا الملف تستخدمه داخل ملفات React الخاصة بك بدلاً من استدعاء جوجل مباشرة

export const generateDiagnosis = async (promptText) => {
  try {
    // نطلب من "الوسيط" الخاص بنا بدلاً من جوجل
    // Netlify يضع الدوال تلقائياً في هذا المسار
    const response = await fetch('/.netlify/functions/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: promptText }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Network response was not ok');
    }

    const data = await response.json();
    return data.result; // النص الناتج من الذكاء الاصطناعي

  } catch (error) {
    console.error("Error calling backend function:", error);
    throw error;
  }
};

/*
    طريقة الاستخدام داخل أي مكون React:
    
    import { generateDiagnosis } from './services/geminiApi';

    const handleSearch = async () => {
        try {
            const result = await generateDiagnosis("الأعراض هي كذا وكذا...");
            console.log(result);
        } catch (err) {
            console.error(err);
        }
    }
*/