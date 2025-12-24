import React, { useState } from 'react';
import { AlertCircle, FileText, Activity, Stethoscope, Download, Save, History, Plus, X } from 'lucide-react';


export default function VetDDxApp() {
  const [formData, setFormData] = useState({
    species: '',
    age: '',
    sex: '',
    breed: '',
    weight: '',
    problems: [''],
    excluded: ['']
  });
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savedCases, setSavedCases] = useState([]);
  const [activeTab, setActiveTab] = useState('new-case');

  const addProblem = () => {
    setFormData(prev => ({
      ...prev,
      problems: [...prev.problems, '']
    }));
  };

  const removeProblem = (index) => {
    setFormData(prev => ({
      ...prev,
      problems: prev.problems.filter((_, i) => i !== index)
    }));
  };

  const updateProblem = (index, value) => {
    setFormData(prev => ({
      ...prev,
      problems: prev.problems.map((p, i) => i === index ? value : p)
    }));
  };

  const addExclusion = () => {
    setFormData(prev => ({
      ...prev,
      excluded: [...prev.excluded, '']
    }));
  };

  const removeExclusion = (index) => {
    setFormData(prev => ({
      ...prev,
      excluded: prev.excluded.filter((_, i) => i !== index)
    }));
  };

  const updateExclusion = (index, value) => {
    setFormData(prev => ({
      ...prev,
      excluded: prev.excluded.map((e, i) => i === index ? value : e)
    }));
  };

  const generateDifferentials = async () => {
    setLoading(true);
    
    const problemList = formData.problems.filter(p => p.trim()).join(', ');
    const excludedList = formData.excluded.filter(e => e.trim()).join(', ');
    
    const prompt = `You are a veterinary clinical decision support assistant specialized in small animal medicine. You MUST base your differentials ONLY on information from Merck Veterinary Manual and BSAVA (British Small Animal Veterinary Association) Manuals. Do not use any other sources.

Species: ${formData.species}
Age: ${formData.age}
Sex: ${formData.sex}
Weight: ${formData.weight}
${formData.breed ? `Breed: ${formData.breed}` : ''}
Problem list: ${problemList}
${excludedList ? `\nEXCLUDED DIAGNOSES (do NOT include these - already ruled out by diagnostics): ${excludedList}` : ''}

CRITICAL SAFETY INSTRUCTIONS - READ CAREFULLY:
1. Do NOT include any diagnoses mentioned in the "EXCLUDED DIAGNOSES" section
2. If a diagnostic test has ruled something out (e.g., "no obstruction on x-ray"), do NOT include that diagnosis
3. Base all differentials ONLY on Merck Veterinary Manual and BSAVA Manuals
4. Reference these textbooks when explaining your reasoning
5. DOUBLE-CHECK all drug dosages - use the EXACT doses provided above
6. Common dangerous errors to AVOID:
   - Ondansetron is 0.1-0.2 mg/kg, NOT 1 mg/kg
   - Meloxicam in cats: use lower doses and max 3 days
   - NEVER use paracetamol in cats - it is FATAL
   - Dexamethasone: start with lower doses (0.05-0.1 mg/kg) especially in cats
7. Always show your calculation steps clearly

TREATMENT PROTOCOLS - USE THESE DRUGS (commonly available in Egypt):
When recommending treatment, ALWAYS calculate both mg dose AND volume in ml/vials needed:

ANTIBIOTICS (with reconstitution details):
- Amoxicillin + Clavulanic acid: 12.5-25 mg/kg q12h PO (Augmentin®, Curam®)
  • Oral suspension: 156mg/5ml or 312mg/5ml
  
- Cefotaxime (Xorin®, Cefotax®): 20-80 mg/kg q6-8h IV/IM (typical: 50mg/kg q8h)
  • Vial: 500mg → reconstitute with 2ml water = 250mg/ml
  • Vial: 1000mg → reconstitute with 4ml water = 250mg/ml
  • CALCULATE: Total mg needed, then ml volume, then number of vials
  
- Ceftriaxone (Ceftriaxone®, Wintriaxone®): 20-50 mg/kg q12-24h IV/IM (typical: 25mg/kg q24h)
  • Vial: 500mg → reconstitute with 2ml water = 250mg/ml
  • Vial: 1000mg → reconstitute with 3.5ml water = 285mg/ml
  • CALCULATE: Total mg needed, then ml volume, then number of vials
  
- Azithromycin: 5-10 mg/kg q24h PO (Xithrone®) - respiratory cases, check liver function first
  • Oral suspension: 200mg/5ml
  
- Clarithromycin: Dog 7.5-12.5 mg/kg q12h, Cat 7.5-15 mg/kg q12h PO (Klacid®) - respiratory
  • Oral suspension: 125mg/5ml or 250mg/5ml
  
- Cefalexin: 15-30 mg/kg q8-12h PO (Ceporex®) - skin infections
  • Oral suspension: 125mg/5ml or 250mg/5ml
  
- Ciprofloxacin: Dog 5-15 mg/kg q12h, Cat 5-10 mg/kg q24h PO (Ciprofloxacin®) - urinary tract
  • WARNING: Use with caution - can cause cartilage damage in young animals
  • Oral tablets: 500mg or 750mg
  
- Doxycycline: 5-10 mg/kg q12-24h PO (Vibramycin®) - blood parasites, respiratory
  • Oral capsules: 100mg

ANTI-INFLAMMATORY (with reconstitution details):
- Dexamethasone: 0.05-0.2 mg/kg q12-24h IV/IM/SC (use 3-day tapering system)
  • WARNING: Start low, especially for cats (0.05-0.1 mg/kg)
  • Ampoule: 8mg/2ml = 4mg/ml OR 4mg/1ml = 4mg/ml
  • CALCULATE: Total mg needed, then ml volume
  • Example: 5kg cat at 0.1mg/kg = 0.5mg = 0.125ml
  
- Prednisolone: Anti-inflammatory: 0.5-1 mg/kg q12-24h, Immunosuppressive: 1-2 mg/kg PO (Predsol®, Solupred®)
  • Oral tablets: 5mg, 10mg, 20mg
  
- Meloxicam: Initial 0.2 mg/kg SC/PO, maintenance 0.1 mg/kg PO q24h (Mobic®) - joint inflammation
  • Injectable: 5mg/ml (for initial dose ONLY)
  • Oral suspension: 1.5mg/ml (for maintenance)
  • WARNING: Cats - use 0.05 mg/kg after initial dose, max 3 days
  • CALCULATE: ml volume for injection
  
- Ketoprofen (Ketofen®): 1-2 mg/kg SC/IM/IV q24h - fever, pain (max 3-5 days)
  • Ampoule: 100mg/2ml = 50mg/ml
  • CALCULATE: Total mg needed, then ml volume
  
- Paracetamol (Acetaminophen): Dog ONLY 10-15 mg/kg q8-12h PO (NEVER in cats - FATAL)
  • WARNING: ABSOLUTELY CONTRAINDICATED IN CATS - causes fatal methemoglobinemia
  • Oral tablets: 500mg

ANTI-EMETIC (with reconstitution details):
- Metoclopramide (Primperan®): 0.2-0.5 mg/kg q8-12h IV/IM/SC - better for dogs
  • Ampoule: 10mg/2ml = 5mg/ml
  • CALCULATE: Total mg needed, then ml volume
  
- Ondansetron (Zofran®): 0.1-0.2 mg/kg q8-12h IV/IM - better for cats, safe all ages
  • WARNING: Common mistake is 1mg/kg - WRONG! Correct dose is 0.1-0.2 mg/kg
  • Ampoule: 4mg/2ml = 2mg/ml or 8mg/4ml = 2mg/ml
  • CALCULATE: Total mg needed, then ml volume
  • Example: 5kg cat at 0.2mg/kg = 1mg total = 0.5ml
  
- Domperidone (Motilium®): 0.5-1 mg/kg q8-12h PO - avoid in elderly/cardiac cases
  • Oral suspension: 1mg/ml
  • NOT for injectable use

ANTACIDS:
- Ranitidine (Ranitack®): Dog 2 mg/kg q8-12h, Cat 2.5-3.5 mg/kg q12h
  • Injectable: 50mg/2ml = 25mg/ml (for severe cases)
  • Oral tablets: 150mg, 300mg
  • CALCULATE: ml volume for injection if needed
  
- Famotidine (Antodine®): 0.5-1 mg/kg q12-24h
  • Oral tablets: 20mg, 40mg
  
- Omeprazole (Risek®): Dog 0.5-1.5 mg/kg q24h, Cat 0.75-1 mg/kg q24h
  • Oral capsules: 20mg, 40mg

ANTI-DIARRHEAL:
- Metronidazole (Flagyl®): Dog 15-25 mg/kg q12h, Cat 8-10 mg/kg q12h - max 1 week
  • Injectable: 500mg/100ml = 5mg/ml
  • Oral tablets: 250mg, 500mg
  • Oral suspension: 125mg/5ml
  
- Kaolin (Kapect®): 0.5-1 ml/kg q6-8h - mild cases
  • Oral suspension: ready to use
  
- Nifuroxazide (Antinal®): 4.4 mg/kg q8h - bacterial diarrhea with fever
  • Oral suspension: 220mg/5ml

SUPPLEMENTS:
- B-complex vitamins: Safe to use, water-soluble
  • Injectable: various concentrations - use as per product
  
- Calcium injection: 50-150 mg/kg (only if NOT febrile, except eclampsia)
  • Calcium gluconate 10%: 10mg/ml
  • CALCULATE: ml volume based on weight
  
- Mineral sachets: Hydrosafe®, Hydran® - dissolve in water

IMPORTANT CALCULATION INSTRUCTIONS:
- For injectable drugs: ALWAYS calculate the actual volume in ml based on the concentration
- Show calculation steps: Weight → mg needed → ml volume → number of vials
- Example format: "Dog 10kg needs Cefotaxime 40mg/kg = 400mg total. Using 500mg vial reconstituted to 2ml (250mg/ml): 400mg ÷ 250mg/ml = 1.6ml. Need 1 vial."
- For oral medications: Calculate number of tablets/capsules or ml of suspension
- Injectable routes preferred for vomiting/diarrhea cases
- NSAIDs: Use injectable forms to avoid gastric ulcers
- Corticosteroids: Always use 3-day tapering system
- Never use paracetamol in cats (TOXIC)
- Check liver function before azithromycin
- Calcium raises body temperature - avoid in febrile patients

Provide a structured differential diagnosis following this format:
1. Ranked differential diagnoses (most to least likely) - with Merck/BSAVA references
2. Suggested diagnostic steps (based on Merck/BSAVA protocols)
3. Red flags if present
4. Treatment recommendations using the drugs listed above with specific names, doses, and routes

Be concise but thorough. Use clinical reasoning principles from these veterinary textbooks only.`;

    try {
      // Call our secure Netlify function
const response = await fetch('/.netlify/functions/generate-differentials', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ prompt }),
});


if (!response.ok) {
  const errorText = await response.text();
  console.error('API Error:', errorText);
  throw new Error('Failed to generate differentials');
}

      const data = await response.json();
      const resultText = data.text;

if (!resultText) {
  throw new Error("Empty response from server");
}

      
      setResult({
        ...formData,
        analysis: resultText,
        timestamp: new Date().toISOString(),
        problemList,
        excludedList
      });
      
      setActiveTab('results');
    } catch (error) {
      alert('Error generating differentials. Please check your internet connection and try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveCase = () => {
    if (result) {
      const caseData = {
        id: Date.now(),
        ...result
      };
      setSavedCases(prev => [caseData, ...prev]);
      alert('Case saved successfully!');
    }
  };

  const loadCase = (savedCase) => {
    setResult(savedCase);
    setActiveTab('results');
  };

  const exportPDF = () => {
    alert('PDF export functionality would integrate with a PDF generation library in production.');
  };

  const resetForm = () => {
    setFormData({
      species: '',
      age: '',
      sex: '',
      breed: '',
      weight: '',
      problems: [''],
      excluded: ['']
    });
    setResult(null);
    setActiveTab('new-case');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Stethoscope className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">VetDDx</h1>
                <p className="text-sm text-gray-500">Veterinary Clinical Decision Support</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('new-case')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === 'new-case'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                New Case
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center space-x-2 ${
                  activeTab === 'history'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <History className="w-4 h-4" />
                <span>History ({savedCases.length})</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'new-case' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-2 mb-6">
              <FileText className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">Patient Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Species *
                </label>
                <select
                  value={formData.species}
                  onChange={(e) => setFormData({...formData, species: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="">Select species</option>
                  <option value="Cat">Cat (Feline)</option>
                  <option value="Dog">Dog (Canine)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight * (in kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  placeholder="e.g., 5.5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age *
                </label>
                <input
                  type="text"
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  placeholder="e.g., 10 years, 6 months"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sex *
                </label>
                <select
                  value={formData.sex}
                  onChange={(e) => setFormData({...formData, sex: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="">Select sex</option>
                  <option value="Male neutered">Male Neutered</option>
                  <option value="Male intact">Male Intact</option>
                  <option value="Female spayed">Female Spayed</option>
                  <option value="Female intact">Female Intact</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Breed (Optional)
                </label>
                <input
                  type="text"
                  value={formData.breed}
                  onChange={(e) => setFormData({...formData, breed: e.target.value})}
                  placeholder="e.g., Domestic Shorthair, Labrador"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Problem List *
                </label>
                <button
                  onClick={addProblem}
                  className="flex items-center space-x-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Problem</span>
                </button>
              </div>
              
              {formData.problems.map((problem, index) => (
                <div key={index} className="flex items-center space-x-2 mb-3">
                  <input
                    type="text"
                    value={problem}
                    onChange={(e) => updateProblem(index, e.target.value)}
                    placeholder={`Problem ${index + 1} (e.g., Vomiting, Weight loss)`}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {formData.problems.length > 1 && (
                    <button
                      onClick={() => removeProblem(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Excluded Diagnoses (Already Ruled Out)
                </label>
                <button
                  onClick={addExclusion}
                  className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Exclusion</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                List diagnoses that have been ruled out by diagnostics
              </p>
              
              {formData.excluded.map((exclusion, index) => (
                <div key={index} className="flex items-center space-x-2 mb-3">
                  <input
                    type="text"
                    value={exclusion}
                    onChange={(e) => updateExclusion(index, e.target.value)}
                    placeholder={`Exclusion ${index + 1}`}
                    className="flex-1 px-4 py-2 border border-red-200 bg-red-50 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  {formData.excluded.length > 1 && (
                    <button
                      onClick={() => removeExclusion(index)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <strong>Clinical Decision Support Tool:</strong> This application provides 
                  differential diagnosis suggestions based on Merck Veterinary Manual and BSAVA Manuals only. 
                  It is NOT a replacement for professional veterinary judgment.
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={generateDifferentials}
                disabled={loading || !formData.species || !formData.weight || !formData.age || !formData.sex || !formData.problems.some(p => p.trim())}
                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Activity className="w-5 h-5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-5 h-5" />
                    <span>Generate Differentials</span>
                  </>
                )}
              </button>
              
              <button
                onClick={resetForm}
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {activeTab === 'results' && result && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Case Summary</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={saveCase}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Case</span>
                  </button>
                  <button
                    onClick={exportPDF}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export PDF</span>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <span className="text-sm text-gray-500">Species</span>
                  <p className="font-medium text-gray-900">{result.species}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Weight</span>
                  <p className="font-medium text-gray-900">{result.weight} kg</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Age</span>
                  <p className="font-medium text-gray-900">{result.age}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Sex</span>
                  <p className="font-medium text-gray-900">{result.sex}</p>
                </div>
                {result.breed && (
                  <div>
                    <span className="text-sm text-gray-500">Breed</span>
                    <p className="font-medium text-gray-900">{result.breed}</p>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <span className="text-sm text-gray-500">Problem List</span>
                <p className="font-medium text-gray-900">{result.problemList}</p>
              </div>

              {result.excludedList && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <span className="text-sm font-medium text-red-700">Excluded Diagnoses:</span>
                  <p className="text-sm text-red-600 mt-1">{result.excludedList}</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Clinical Analysis</h2>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {result.analysis}
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('new-case')}
              className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              New Case
            </button>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Case History</h2>
            
            {savedCases.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No saved cases yet</p>
                <button
                  onClick={() => setActiveTab('new-case')}
                  className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Create New Case
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {savedCases.map((savedCase) => (
                  <div
                    key={savedCase.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition cursor-pointer"
                    onClick={() => loadCase(savedCase)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-4">
                        <span className="font-medium text-gray-900">
                          {savedCase.species} - {savedCase.weight}kg - {savedCase.age} - {savedCase.sex}
                        </span>
                        {savedCase.breed && (
                          <span className="text-sm text-gray-500">({savedCase.breed})</span>
                        )}
                      </div>
                      <span className="text-sm text-gray-400">
                        {new Date(savedCase.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Problems: {savedCase.problemList}
                      {savedCase.excludedList && (
                        <span className="block mt-1 text-red-600">
                          Excluded: {savedCase.excludedList}
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2025 VetDDx - Based on Merck Veterinary Manual & BSAVA Manuals. 
            For decision support only.
          </p>
        </div>
      </footer>
    </div>
  );
}