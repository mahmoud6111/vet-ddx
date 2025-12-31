import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AlertCircle, FileText, Activity, Stethoscope, Download, Save, History, Plus, X, Sparkles, Brain, RefreshCw, Search, FlaskConical, AlertTriangle, Pill, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';

// Model configurations
const MODELS = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini 2.5 Flash',
    description: 'Fast, accurate general-purpose AI',
    icon: '✨',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-gradient-to-r from-blue-50 to-cyan-50',
    borderColor: 'border-blue-200'
  },
  mimo: {
    id: 'mimo',
    name: 'Xiaomi MiMo-V2-Flash',
    description: 'Advanced reasoning & medical AI',
    icon: '🧠',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-gradient-to-r from-purple-50 to-pink-50',
    borderColor: 'border-purple-200'
  },
  both: {
    id: 'both',
    name: 'Dual Analysis',
    description: 'Compare both models side-by-side',
    icon: '⚡',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-gradient-to-r from-amber-50 to-orange-50',
    borderColor: 'border-amber-200'
  }
};

// Section configurations for the analysis display
const SECTION_CONFIG = {
  differentials: {
    title: 'Ranked Differential Diagnoses',
    icon: Search,
    gradient: 'from-blue-500 to-indigo-600',
    bgGradient: 'from-blue-50 to-indigo-50',
    borderColor: 'border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600'
  },
  diagnostics: {
    title: 'Suggested Diagnostic Steps',
    icon: FlaskConical,
    gradient: 'from-emerald-500 to-teal-600',
    bgGradient: 'from-emerald-50 to-teal-50',
    borderColor: 'border-emerald-200',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600'
  },
  redFlags: {
    title: 'Red Flags & Warnings',
    icon: AlertTriangle,
    gradient: 'from-red-500 to-rose-600',
    bgGradient: 'from-red-50 to-rose-50',
    borderColor: 'border-red-200',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600'
  },
  treatment: {
    title: 'Treatment Recommendations',
    icon: Pill,
    gradient: 'from-purple-500 to-violet-600',
    bgGradient: 'from-purple-50 to-violet-50',
    borderColor: 'border-purple-200',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600'
  }
};

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

  const [selectedModel, setSelectedModel] = useState('gemini');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSecondOpinion, setLoadingSecondOpinion] = useState(false);
  const [savedCases, setSavedCases] = useState([]);
  const [activeTab, setActiveTab] = useState('new-case');
  const [expandedSections, setExpandedSections] = useState({
    differentials: true,
    diagnostics: true,
    redFlags: true,
    treatment: true
  });

  // Loading messages that cycle during analysis
  const loadingMessages = [
    { text: "Analyzing clinical signs...", icon: "🔬" },
    { text: "Searching differential diagnoses...", icon: "🔍" },
    { text: "Consulting Merck Veterinary Manual...", icon: "📚" },
    { text: "Evaluating treatment protocols...", icon: "💊" },
    { text: "Checking for red flags...", icon: "⚠️" },
    { text: "Calculating drug dosages...", icon: "💉" },
    { text: "Reviewing BSAVA guidelines...", icon: "📖" },
    { text: "Generating recommendations...", icon: "✨" },
  ];

  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  // Cycle through loading messages while loading
  useEffect(() => {
    if (!loading) {
      setLoadingMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length);
    }, 2500); // Change message every 2.5 seconds

    return () => clearInterval(interval);
  }, [loading, loadingMessages.length]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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

  const buildPrompt = () => {
    const problemList = formData.problems.filter(p => p.trim()).join(', ');
    const excludedList = formData.excluded.filter(e => e.trim()).join(', ');

    return `You are a veterinary clinical decision support assistant specialized in small animal medicine. You MUST base your differentials ONLY on information from Merck Veterinary Manual and BSAVA (British Small Animal Veterinary Association) Manuals.

Species: ${formData.species}
Age: ${formData.age}
Sex: ${formData.sex}
Weight: ${formData.weight} kg
${formData.breed ? `Breed: ${formData.breed}` : ''}
Problem list: ${problemList}
${excludedList ? `\nEXCLUDED DIAGNOSES (do NOT include these - already ruled out by diagnostics): ${excludedList}` : ''}

CRITICAL SAFETY INSTRUCTIONS:
1. Do NOT include any diagnoses mentioned in the "EXCLUDED DIAGNOSES" section
2. Base all differentials on Merck Veterinary Manual and BSAVA Manuals
3. DOUBLE-CHECK all drug dosages
4. Common dangerous errors to AVOID:
   - Ondansetron is 0.1-0.2 mg/kg, NOT 1 mg/kg
   - Meloxicam in cats: use lower doses and max 3 days
   - NEVER use paracetamol in cats - it is FATAL
   - Dexamethasone: start with lower doses (0.05-0.1 mg/kg) especially in cats

=== PRIMARY TREATMENT PROTOCOLS (Egypt-available drugs) ===
PRIORITIZE these drugs when recommending treatment. Calculate both mg dose AND volume in ml:

ANTIBIOTICS:
- Amoxicillin + Clavulanic acid: 12.5-25 mg/kg q12h PO (Augmentin®, Curam®)
- Cefotaxime (Xorin®, Cefotax®): 20-80 mg/kg q6-8h IV/IM (typical: 50mg/kg q8h)
- Ceftriaxone (Ceftriaxone®, Wintriaxone®): 20-50 mg/kg q12-24h IV/IM
- Azithromycin (Xithrone®): 5-10 mg/kg q24h PO
- Clarithromycin (Klacid®): Dog 7.5-12.5 mg/kg q12h, Cat 7.5-15 mg/kg q12h PO
- Cefalexin (Ceporex®): 15-30 mg/kg q8-12h PO
- Ciprofloxacin: Dog 5-15 mg/kg q12h, Cat 5-10 mg/kg q24h PO
- Doxycycline (Vibramycin®): 5-10 mg/kg q12-24h PO

ANTI-INFLAMMATORY:
- Dexamethasone: 0.05-0.2 mg/kg q12-24h IV/IM/SC (8mg/2ml ampoule)
- Prednisolone (Predsol®, Solupred®): 0.5-1 mg/kg q12-24h PO
- Meloxicam (Mobic®): Initial 0.2 mg/kg, maintenance 0.1 mg/kg PO q24h
- Ketoprofen (Ketofen®): 1-2 mg/kg SC/IM/IV q24h

ANTI-EMETIC:
- Metoclopramide (Primperan®): 0.2-0.5 mg/kg q8-12h IV/IM/SC
- Ondansetron (Zofran®): 0.1-0.2 mg/kg q8-12h IV/IM (NOT 1mg/kg!)
- Domperidone (Motilium®): 0.5-1 mg/kg q8-12h PO

ANTACIDS:
- Ranitidine (Ranitack®): Dog 2 mg/kg q8-12h, Cat 2.5-3.5 mg/kg q12h
- Famotidine (Antodine®): 0.5-1 mg/kg q12-24h
- Omeprazole (Risek®): Dog 0.5-1.5 mg/kg q24h, Cat 0.75-1 mg/kg q24h

ANTI-DIARRHEAL:
- Metronidazole (Flagyl®): Dog 15-25 mg/kg q12h, Cat 8-10 mg/kg q12h
- Kaolin (Kapect®): 0.5-1 ml/kg q6-8h
- Nifuroxazide (Antinal®): 4.4 mg/kg q8h

=== SMART TREATMENT SELECTION ===
IMPORTANT: Before recommending ANY drug, you MUST evaluate if it's appropriate for THIS specific case.

⚠️ CONTRAINDICATION CHECK (DO THIS FOR EVERY DRUG):
1. **Species-specific**: Is this drug safe for ${formData.species}? (e.g., NEVER paracetamol in cats)
2. **Age-related**: Is this safe for a ${formData.age} animal? (e.g., NSAIDs caution in very young/old)
3. **Condition-related**: Does the presenting problem contraindicate this drug?
   - Vomiting → Oral medications may not be absorbed (prefer IV/SC)
   - Kidney disease suspected → Avoid nephrotoxic drugs, adjust doses
   - Liver disease suspected → Avoid hepatotoxic drugs, adjust doses
   - Dehydration → NSAIDs may worsen renal perfusion
   - GI bleeding suspected → Avoid NSAIDs
4. **Drug interactions**: Are there conflicts with other recommended drugs?

IF a PRIMARY drug is NOT suitable:
- ❌ State clearly: "PRIMARY [Drug] NOT RECOMMENDED because: [reason]"
- 🔄 Then suggest: "ALTERNATIVE: [Drug] - [why this is better for this case]"

=== WHEN TO SUGGEST ALTERNATIVES ===
You SHOULD suggest alternative medications when:
1. The presenting condition contraindicates a primary drug
2. Species/age makes a primary drug unsafe
3. A more effective drug exists for this specific diagnosis
4. Drug interactions would occur

⚠️ ALTERNATIVE DRUG PRIORITY ORDER:
1. **FIRST**: Choose another drug from the Egypt-available PRIMARY list above
   - Example: If Meloxicam is contraindicated, use Ketoprofen instead (both in Egypt list)
   - Example: If Ondansetron unavailable, use Metoclopramide (both in Egypt list)
   
2. **SECOND**: Only if NO suitable Egypt-available alternative exists:
   - MUST source from **BSAVA Small Animals Formulary** ONLY
   - Mark clearly: "⚠️ NOT IN EGYPT LIST - Ref: BSAVA Formulary"
   - Include BSAVA page/section reference if possible
   - Use EXACT dosing from BSAVA Formulary
   - Explain why no Egypt-available option works for this case
   - Note: "May require import or special ordering from veterinary supplier"

When suggesting alternatives:
- Mark with: "🔄 ALTERNATIVE (instead of [Primary Drug]):"
- Explain: "Reason: [why primary is not suitable]"
- State: "Availability: ✅ Egypt-available" OR "⚠️ BSAVA Formulary - Special order"
- Reference: Include "(BSAVA Formulary)" for non-Egypt drugs
- Provide full dosing with calculation

=== REQUIRED OUTPUT FORMAT ===
Structure your response with these EXACT section headers:

## 🔍 DIFFERENTIAL DIAGNOSES
IMPORTANT: For each differential, use this EXACT format (one per line):
[PERCENTAGE]% | [SPECIFIC DIAGNOSIS NAME] | [Complete clinical reasoning with Merck/BSAVA reference]

⚠️ CRITICAL REQUIREMENTS FOR DIAGNOSIS NAMES:
- Use SPECIFIC pathogen/etiology names, NOT generic terms
- BAD: "Viral Gastroenteritis" or "Bacterial Infection"
- GOOD: "Feline Panleukopenia Virus (Feline Parvovirus)" or "Campylobacter jejuni Enteritis"
- BAD: "Parasitic Disease"
- GOOD: "Toxoplasma gondii" or "Giardia duodenalis" or "Isospora felis Coccidiosis"
- Include the EXACT pathogen, virus, bacteria, or specific condition name
- For metabolic diseases: specify the exact condition (e.g., "Hepatic Lipidosis" not "Liver Disease")

⚠️ CRITICAL REQUIREMENTS FOR DESCRIPTIONS:
- Provide COMPLETE clinical reasoning - do NOT truncate or abbreviate
- Explain WHY this diagnosis fits the presenting signs
- Include relevant epidemiology (age, breed predisposition)
- Reference pathognomonic signs if present
- Include mortality/prognosis concerns if relevant
- Minimum 2-3 sentences per differential

CRITICAL FORMATTING RULES:
- Percentages represent RELATIVE clinical likelihood given the presenting signs
- Use a WIDE range from 5% to 95% (most likely diagnosis should be 60-90%)
- Do NOT use 0% unless truly impossible
- Format EXACTLY as: NUMBER% | NAME | DESCRIPTION

Example format (note specificity and detail):
85% | Feline Panleukopenia Virus (Feline Parvovirus) | Classic presentation in young unvaccinated cats with profound vomiting, anorexia, and depression. Causes severe leukopenia and intestinal crypt necrosis. High mortality without aggressive supportive care. Check vaccination history and WBC count urgently. (Merck VM, BSAVA Manual)
70% | Salmonella enterica Enteritis | Bacterial gastroenteritis causing acute vomiting and potential bloody diarrhea. More common in immunocompromised or stressed cats. Fecal culture recommended for confirmation. Zoonotic potential - warn owner. (Merck VM)
45% | Acute Hepatic Lipidosis | Consider in overweight cats with sudden anorexia >3 days. Liver cannot mobilize fat stores leading to hepatocyte dysfunction. Check bilirubin and liver enzymes. Force-feeding critical for recovery. (BSAVA Manual)
25% | Foreign Body Obstruction (Linear or Pyloric) | Possible if acute onset with unproductive vomiting, especially in young cats that play with string or thread. Check under tongue for linear foreign body anchor. Abdominal radiographs essential. (Merck VM)

List 5-7 differentials, ranked by likelihood percentage (highest first).

## 🧪 DIAGNOSTIC STEPS  
[List recommended tests in order of priority]

## ⚠️ RED FLAGS
[List any urgent warning signs to monitor - if none, state "No immediate red flags identified"]


## 💊 TREATMENT RECOMMENDATIONS
IMPORTANT: Use this EXACT format with CATEGORY markers for each treatment type:

CATEGORY: Fluid Therapy
[All fluid therapy drugs and details here]

CATEGORY: Anti-emetic
[All anti-emetic drugs and details here]

CATEGORY: Gastroprotectant
[All GI protection drugs and details here]

CATEGORY: Antibiotic (if needed)
[All antibiotic drugs and details here - only if indicated]

CATEGORY: Monitoring
[Monitoring parameters and frequency]

For each drug include:
- Drug name (Brand®) - PRIMARY or 🔄 ALTERNATIVE
- Dose: X mg/kg route frequency
- Calculation: dose × ${formData.weight}kg = X mg
- Volume: X ml (of concentration)
- Availability: ✅ Egypt-available or ⚠️ BSAVA Formulary

Be thorough but organized. Each section must be clearly separated.`;
  };

  // Parse the AI response into sections
  const parseAnalysis = (text) => {
    const sections = {
      differentials: '',
      diagnostics: '',
      redFlags: '',
      treatment: '',
      other: ''
    };

    // Define section markers
    const sectionMarkers = [
      { key: 'differentials', patterns: ['## 🔍 DIFFERENTIAL', '## DIFFERENTIAL', '**DIFFERENTIAL', '### Differential', '1. Ranked differential', '## Ranked Differential'] },
      { key: 'diagnostics', patterns: ['## 🧪 DIAGNOSTIC', '## DIAGNOSTIC', '**DIAGNOSTIC', '### Diagnostic', '2. Suggested diagnostic', '## Suggested Diagnostic'] },
      { key: 'redFlags', patterns: ['## ⚠️ RED FLAG', '## RED FLAG', '**RED FLAG', '### Red Flag', '3. Red flags', '## Red Flags'] },
      { key: 'treatment', patterns: ['## 💊 TREATMENT', '## TREATMENT', '**TREATMENT', '### Treatment', '4. Treatment', '## Treatment Recommendation'] }
    ];

    // Find all section positions
    const positions = [];
    sectionMarkers.forEach(marker => {
      marker.patterns.forEach(pattern => {
        const index = text.toLowerCase().indexOf(pattern.toLowerCase());
        if (index !== -1) {
          positions.push({ key: marker.key, index, pattern });
        }
      });
    });

    // Sort by position
    positions.sort((a, b) => a.index - b.index);

    // Remove duplicates (keep first occurrence of each section)
    const uniquePositions = [];
    const seenKeys = new Set();
    positions.forEach(pos => {
      if (!seenKeys.has(pos.key)) {
        seenKeys.add(pos.key);
        uniquePositions.push(pos);
      }
    });

    // Extract sections
    if (uniquePositions.length > 0) {
      uniquePositions.forEach((pos, idx) => {
        const start = pos.index;
        const end = idx < uniquePositions.length - 1 ? uniquePositions[idx + 1].index : text.length;
        let content = text.substring(start, end).trim();
        // Remove the header pattern from content
        content = content.replace(/^(##\s*[🔍🧪⚠️💊]?\s*)?(DIFFERENTIAL|DIAGNOSTIC|RED FLAG|TREATMENT)[^\n]*/i, '').trim();
        sections[pos.key] = content;
      });
    } else {
      // Fallback: return everything as other
      sections.other = text;
    }

    return sections;
  };

  // Parse differential diagnoses into structured data with percentages
  const parseDifferentials = (text) => {
    const diagnoses = [];
    const lines = text.split('\n');

    for (const line of lines) {
      // Skip empty lines and headers
      if (!line.trim() || line.startsWith('#') || line.includes('DIFFERENTIAL')) continue;

      // Pattern 1: "85% | Pancreatitis | Description..."
      const pipeMatch = line.match(/^[\d.\s]*\**\s*(\d+)\s*%?\s*\|\s*([^|]+)\s*\|\s*(.+)/);
      if (pipeMatch) {
        diagnoses.push({
          percentage: parseInt(pipeMatch[1], 10),
          name: pipeMatch[2].trim().replace(/\*\*/g, ''),
          description: pipeMatch[3].trim()
        });
        continue;
      }

      // Pattern 2: "1. **Pancreatitis** (85%): Description" or "1. Pancreatitis (85%) - Description"
      const numberedMatch = line.match(/^\d+\.\s*\**([^(\d*]+?)\**\s*[\(:–-]?\s*(\d+)\s*%\)?[:\-–]?\s*(.*)/);
      if (numberedMatch) {
        diagnoses.push({
          percentage: parseInt(numberedMatch[2], 10),
          name: numberedMatch[1].trim().replace(/\*\*/g, ''),
          description: numberedMatch[3]?.trim() || ''
        });
        continue;
      }

      // Pattern 3: "**Pancreatitis (85% likely)**: Description" 
      const boldMatch = line.match(/^[\s-]*\**([^(\d]+?)\**\s*\(?(\d+)\s*%[^)]*\)?:?\s*(.*)/);
      if (boldMatch && boldMatch[2]) {
        diagnoses.push({
          percentage: parseInt(boldMatch[2], 10),
          name: boldMatch[1].trim().replace(/\*\*/g, '').replace(/^[\d.\s-]+/, ''),
          description: boldMatch[3]?.trim() || ''
        });
        continue;
      }

      // Pattern 4: "- Pancreatitis – 85%" 
      const dashMatch = line.match(/^[\s*-]+\s*\**([^–\-\d%]+?)\**\s*[–\-:]\s*(\d+)\s*%[:\s]*(.*)/);
      if (dashMatch) {
        diagnoses.push({
          percentage: parseInt(dashMatch[2], 10),
          name: dashMatch[1].trim().replace(/\*\*/g, ''),
          description: dashMatch[3]?.trim() || ''
        });
      }
    }

    // Sort by percentage descending
    const sorted = diagnoses.sort((a, b) => b.percentage - a.percentage);

    // Normalize percentages if the AI returned unrealistically low values
    // If the max percentage is below 30%, scale all values up proportionally
    if (sorted.length > 0) {
      const maxPercentage = sorted[0].percentage;
      if (maxPercentage < 30 && maxPercentage > 0) {
        // Scale so that the top diagnosis gets ~75%
        const scaleFactor = 75 / maxPercentage;
        sorted.forEach((d, i) => {
          // Apply scaling with diminishing returns for lower-ranked diagnoses
          const scaled = Math.round(d.percentage * scaleFactor * (1 - i * 0.05));
          // Ensure percentages stay within reasonable bounds
          d.percentage = Math.min(95, Math.max(5, scaled));
        });
      } else if (maxPercentage === 0) {
        // If all percentages are 0, assign decreasing values based on rank
        sorted.forEach((d, i) => {
          d.percentage = Math.max(10, 80 - (i * 15));
        });
      }
    }

    return sorted;
  };

  // Get color based on probability percentage
  const getProbabilityColor = (percentage) => {
    if (percentage >= 70) return { bg: 'bg-red-500', light: 'bg-red-100', text: 'text-red-700', label: 'High' };
    if (percentage >= 50) return { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-700', label: 'Moderate' };
    if (percentage >= 30) return { bg: 'bg-yellow-500', light: 'bg-yellow-100', text: 'text-yellow-700', label: 'Possible' };
    return { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-700', label: 'Less Likely' };
  };

  // Diagnosis Card Component with Probability Bar
  const DiagnosisCard = ({ diagnosis, index }) => {
    const colors = getProbabilityColor(diagnosis.percentage);

    return (
      <div
        className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-300 animate-fadeIn"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg ${colors.light} flex items-center justify-center`}>
              <span className={`font-bold text-sm ${colors.text}`}>{index + 1}</span>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-lg">{diagnosis.name}</h4>
              <span className={`text-xs font-medium ${colors.text} ${colors.light} px-2 py-0.5 rounded-full`}>
                {colors.label}
              </span>
            </div>
          </div>
          <div className={`text-2xl font-bold ${colors.text}`}>
            {diagnosis.percentage}%
          </div>
        </div>

        {/* Probability Bar */}
        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full ${colors.bg} rounded-full`}
            style={{
              width: `${Math.min(diagnosis.percentage, 100)}%`,
              transition: 'width 1s ease-out'
            }}
          />
        </div>

        {/* Description */}
        {diagnosis.description && (
          <p className="text-sm text-gray-600 leading-relaxed">
            {diagnosis.description}
          </p>
        )}
      </div>
    );
  };

  // Differentials Section with Cards
  const DifferentialsSection = ({ content }) => {
    const diagnoses = useMemo(() => parseDifferentials(content), [content]);
    const config = SECTION_CONFIG.differentials;
    const Icon = config.icon;
    const isExpanded = expandedSections.differentials;

    if (!content || content.trim().length === 0) return null;

    return (
      <div className={`rounded-2xl border-2 ${config.borderColor} overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl`}>
        {/* Section Header */}
        <button
          onClick={() => toggleSection('differentials')}
          className={`w-full bg-gradient-to-r ${config.gradient} px-5 py-4 flex items-center justify-between cursor-pointer`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-white text-lg">{config.title}</h3>
            {diagnoses.length > 0 && (
              <span className="bg-white/25 text-white text-sm px-2 py-0.5 rounded-full">
                {diagnoses.length} diagnoses
              </span>
            )}
          </div>
          <div className="p-1 rounded-full bg-white/20">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-white" />
            ) : (
              <ChevronDown className="w-5 h-5 text-white" />
            )}
          </div>
        </button>

        {/* Section Content */}
        {isExpanded && (
          <div className={`bg-gradient-to-br ${config.bgGradient} p-5`}>
            {diagnoses.length > 0 ? (
              <div className="grid gap-4">
                {diagnoses.map((diagnosis, index) => (
                  <DiagnosisCard key={index} diagnosis={diagnosis} index={index} />
                ))}
              </div>
            ) : (
              /* Fallback to markdown if no structured diagnoses found */
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 shadow-inner">
                <div className="prose prose-slate max-w-none prose-headings:text-gray-800 prose-p:text-gray-700 prose-strong:text-gray-900 prose-li:text-gray-700 prose-ul:my-2 prose-li:my-1">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Treatment Section with Accordion - parses CATEGORY: markers
  const TreatmentSection = ({ content }) => {
    const config = SECTION_CONFIG.treatment;
    const Icon = config.icon;
    const isExpanded = expandedSections.treatment;
    const [openCategories, setOpenCategories] = useState({});

    // Parse treatment using CATEGORY: markers
    const categories = useMemo(() => {
      const result = [];
      // Split by "CATEGORY:" marker
      const parts = content.split(/CATEGORY:\s*/i);

      for (let i = 1; i < parts.length; i++) {
        const part = parts[i].trim();
        if (!part) continue;

        // First line is the category title
        const lines = part.split('\n');
        const title = lines[0].trim();
        const contentText = lines.slice(1).join('\n').trim();

        if (title && contentText) {
          result.push({ title, content: contentText });
        }
      }
      return result;
    }, [content]);

    // Initialize all categories as open
    useEffect(() => {
      if (categories.length > 0 && Object.keys(openCategories).length === 0) {
        const init = {};
        categories.forEach((_, i) => { init[i] = true; });
        setOpenCategories(init);
      }
    }, [categories]);

    const getIcon = (title) => {
      const t = title.toLowerCase();
      if (t.includes('fluid')) return '💧';
      if (t.includes('emetic')) return '🛡️';
      if (t.includes('gastro') || t.includes('protect')) return '💊';
      if (t.includes('antibiotic') || t.includes('antimicrobial')) return '💉';
      if (t.includes('pain') || t.includes('analgesic')) return '🩹';
      if (t.includes('monitor')) return '📊';
      if (t.includes('diet') || t.includes('nutrition')) return '🍽️';
      return '💊';
    };

    const getColor = (title) => {
      const t = title.toLowerCase();
      if (t.includes('fluid')) return 'border-blue-200 bg-blue-50';
      if (t.includes('emetic')) return 'border-green-200 bg-green-50';
      if (t.includes('gastro') || t.includes('protect')) return 'border-purple-200 bg-purple-50';
      if (t.includes('antibiotic')) return 'border-red-200 bg-red-50';
      if (t.includes('pain')) return 'border-orange-200 bg-orange-50';
      if (t.includes('monitor')) return 'border-cyan-200 bg-cyan-50';
      return 'border-gray-200 bg-gray-50';
    };

    if (!content?.trim()) return null;

    return (
      <div className={`rounded-2xl border-2 ${config.borderColor} overflow-hidden shadow-lg`}>
        <button
          onClick={() => toggleSection('treatment')}
          className={`w-full bg-gradient-to-r ${config.gradient} px-5 py-4 flex items-center justify-between`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/20">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-white text-lg">{config.title}</h3>
            {categories.length > 0 && (
              <span className="bg-white/25 text-white text-sm px-2 py-0.5 rounded-full">
                {categories.length} categories
              </span>
            )}
          </div>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
        </button>

        {isExpanded && (
          <div className={`bg-gradient-to-br ${config.bgGradient} p-4`}>
            {categories.length > 0 ? (
              <div className="space-y-3">
                {categories.map((cat, i) => (
                  <div key={i} className={`rounded-xl border-2 ${getColor(cat.title)} overflow-hidden`}>
                    <button
                      onClick={() => setOpenCategories(prev => ({ ...prev, [i]: !prev[i] }))}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getIcon(cat.title)}</span>
                        <span className="font-semibold text-gray-800">{cat.title}</span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${openCategories[i] ? 'rotate-180' : ''}`} />
                    </button>
                    {openCategories[i] && (
                      <div className="px-4 pb-4 bg-white/70">
                        <div className="prose prose-sm max-w-none prose-strong:text-gray-900">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{cat.content}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* Fallback to simple markdown if no CATEGORY: markers found */
              <div className="bg-white/70 rounded-xl p-5">
                <div className="prose prose-slate max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const generateDifferentials = async () => {
    setLoading(true);

    const prompt = buildPrompt();
    const problemList = formData.problems.filter(p => p.trim()).join(', ');
    const excludedList = formData.excluded.filter(e => e.trim()).join(', ');

    try {
      const response = await fetch('/api/generate-differentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, model: selectedModel }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error('Failed to generate differentials');
      }

      const data = await response.json();

      if (data.multiModel) {
        setResult({
          ...formData,
          analyses: data.content,
          multiModel: true,
          timestamp: new Date().toISOString(),
          problemList,
          excludedList
        });
      } else {
        const resultText = data.content?.[0]?.text;
        if (!resultText) {
          throw new Error("Empty response from server");
        }

        setResult({
          ...formData,
          analysis: resultText,
          model: data.content[0].model,
          modelName: data.content[0].modelName,
          multiModel: false,
          timestamp: new Date().toISOString(),
          problemList,
          excludedList
        });
      }

      setActiveTab('results');
    } catch (error) {
      alert('Error generating differentials. Please check your internet connection and try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getSecondOpinion = async () => {
    if (!result || result.multiModel) return;

    setLoadingSecondOpinion(true);
    const otherModel = result.model === 'gemini' ? 'mimo' : 'gemini';
    const prompt = buildPrompt();

    try {
      const response = await fetch('/api/generate-differentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, model: otherModel }),
      });

      if (!response.ok) {
        throw new Error('Failed to get second opinion');
      }

      const data = await response.json();
      const secondOpinionText = data.content?.[0]?.text;

      if (secondOpinionText) {
        setResult(prev => ({
          ...prev,
          analyses: [
            {
              type: 'text',
              text: prev.analysis,
              model: prev.model,
              modelName: prev.modelName
            },
            {
              type: 'text',
              text: secondOpinionText,
              model: data.content[0].model,
              modelName: data.content[0].modelName
            }
          ],
          multiModel: true
        }));
      }
    } catch (error) {
      alert('Error getting second opinion. Please try again.');
      console.error(error);
    } finally {
      setLoadingSecondOpinion(false);
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

  const [exportingPDF, setExportingPDF] = useState(false);

  const exportPDF = async () => {
    if (!result) return;

    setExportingPDF(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = margin;

      // Helper function to add new page if needed
      const checkPageBreak = (neededHeight = 20) => {
        if (yPos + neededHeight > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
          return true;
        }
        return false;
      };

      // Helper to wrap text
      const addWrappedText = (text, x, y, maxWidth, lineHeight = 5) => {
        const lines = pdf.splitTextToSize(text, maxWidth);
        lines.forEach((line, index) => {
          checkPageBreak(lineHeight);
          pdf.text(line, x, yPos);
          yPos += lineHeight;
        });
        return yPos;
      };

      // === HEADER ===
      // Purple gradient header bar
      pdf.setFillColor(99, 102, 241); // Indigo
      pdf.rect(0, 0, pageWidth, 35, 'F');

      // Logo and Title
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('VetDDx', margin, 15);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('AI-Powered Veterinary Clinical Decision Support', margin, 22);

      // Date
      pdf.setFontSize(9);
      const dateStr = new Date(result.timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      pdf.text(dateStr, pageWidth - margin - pdf.getTextWidth(dateStr), 15);

      yPos = 45;

      // === PATIENT INFORMATION BOX ===
      pdf.setFillColor(248, 250, 252); // Light gray
      pdf.roundedRect(margin, yPos, contentWidth, 40, 3, 3, 'F');

      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Patient Information', margin + 5, yPos + 8);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      yPos += 15;

      // Patient details in two columns
      const col1X = margin + 5;
      const col2X = margin + contentWidth / 2;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Species:', col1X, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(result.species || 'N/A', col1X + 25, yPos);

      pdf.setFont('helvetica', 'bold');
      pdf.text('Weight:', col2X, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${result.weight || 'N/A'} kg`, col2X + 22, yPos);

      yPos += 7;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Age:', col1X, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(result.age || 'N/A', col1X + 25, yPos);

      pdf.setFont('helvetica', 'bold');
      pdf.text('Sex:', col2X, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(result.sex || 'N/A', col2X + 22, yPos);

      yPos += 7;

      if (result.breed) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Breed:', col1X, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(result.breed, col1X + 25, yPos);
      }

      yPos += 15;

      // Problem List
      pdf.setFillColor(238, 242, 255); // Light indigo
      pdf.roundedRect(margin, yPos, contentWidth, 15, 2, 2, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(67, 56, 202); // Indigo
      pdf.text('Problem List:', margin + 5, yPos + 6);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(30, 41, 59);
      const problemText = result.problemList || 'None specified';
      pdf.text(problemText.substring(0, 80) + (problemText.length > 80 ? '...' : ''), margin + 35, yPos + 6);

      yPos += 20;

      // Excluded Diagnoses (if any)
      if (result.excludedList && result.excludedList.trim()) {
        pdf.setFillColor(254, 242, 242); // Light red
        pdf.roundedRect(margin, yPos, contentWidth, 12, 2, 2, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(185, 28, 28); // Red
        pdf.text('Excluded:', margin + 5, yPos + 6);
        pdf.setFont('helvetica', 'normal');
        pdf.text(result.excludedList.substring(0, 70) + (result.excludedList.length > 70 ? '...' : ''), margin + 30, yPos + 6);
        yPos += 17;
      }

      yPos += 5;

      // === ANALYSIS SECTIONS ===
      const analyses = result.multiModel ? result.analyses : [{ text: result.analysis, modelName: result.modelName }];

      for (const analysisItem of analyses) {
        checkPageBreak(30);

        // Model header
        pdf.setFillColor(139, 92, 246); // Purple
        pdf.roundedRect(margin, yPos, contentWidth, 10, 2, 2, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Analysis by ${analysisItem.modelName || 'AI Model'}`, margin + 5, yPos + 7);
        yPos += 15;

        // Parse the analysis into sections
        const sections = parseAnalysis(analysisItem.text);

        // Section colors
        const sectionStyles = {
          differentials: { r: 59, g: 130, b: 246, title: '🔍 Differential Diagnoses' },
          diagnostics: { r: 16, g: 185, b: 129, title: '🧪 Diagnostic Steps' },
          redFlags: { r: 239, g: 68, b: 68, title: '⚠️ Red Flags' },
          treatment: { r: 139, g: 92, b: 246, title: '💊 Treatment Recommendations' }
        };

        for (const [key, style] of Object.entries(sectionStyles)) {
          const content = sections[key];
          if (!content || content.trim().length < 10) continue;

          checkPageBreak(25);

          // Section header
          pdf.setFillColor(style.r, style.g, style.b);
          pdf.roundedRect(margin, yPos, contentWidth, 8, 1, 1, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text(style.title, margin + 3, yPos + 5.5);
          yPos += 12;

          // Section content
          pdf.setTextColor(55, 65, 81);
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');

          // Clean up markdown and format for PDF
          const cleanContent = content
            .replace(/#{1,6}\s*/g, '')
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/\*([^*]+)\*/g, '$1')
            .replace(/`([^`]+)`/g, '$1')
            .replace(/^\s*[-•]\s*/gm, '• ')
            .replace(/^\s*\d+\.\s*/gm, (match) => match.trim() + ' ')
            .trim();

          addWrappedText(cleanContent, margin + 2, yPos, contentWidth - 4, 4.5);
          yPos += 8;
        }

        yPos += 10;
      }

      // === FOOTER ===
      const footerY = pageHeight - 10;
      pdf.setFontSize(8);
      pdf.setTextColor(156, 163, 175);
      pdf.text('Generated by VetDDx - Based on Merck Veterinary Manual & BSAVA Manuals', margin, footerY);
      pdf.text('Developed by Mahmoud Abdelnasser', pageWidth - margin - 55, footerY);
      pdf.text('For clinical decision support only', pageWidth / 2 - 20, footerY);

      // Save the PDF
      const fileName = `VetDDx_${result.species}_${result.weight}kg_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setExportingPDF(false);
    }
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

  // Model Selection Card Component
  const ModelCard = ({ modelKey }) => {
    const model = MODELS[modelKey];
    const isSelected = selectedModel === modelKey;

    return (
      <button
        onClick={() => setSelectedModel(modelKey)}
        className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-left w-full
          ${isSelected
            ? `${model.borderColor} ${model.bgColor} shadow-lg scale-[1.02]`
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
          }`}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">{model.icon}</span>
          <div className="flex-1">
            <h3 className={`font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
              {model.name}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{model.description}</p>
          </div>
          {isSelected && (
            <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${model.color} flex items-center justify-center`}>
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </button>
    );
  };

  // Section Card Component
  const SectionCard = ({ sectionKey, content }) => {
    const config = SECTION_CONFIG[sectionKey];
    const Icon = config.icon;
    const isExpanded = expandedSections[sectionKey];

    if (!content || content.trim().length === 0) return null;

    return (
      <div className={`rounded-2xl border-2 ${config.borderColor} overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl`}>
        {/* Section Header */}
        <button
          onClick={() => toggleSection(sectionKey)}
          className={`w-full bg-gradient-to-r ${config.gradient} px-5 py-4 flex items-center justify-between cursor-pointer`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white/20 backdrop-blur-sm`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-white text-lg">{config.title}</h3>
          </div>
          <div className="p-1 rounded-full bg-white/20">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-white" />
            ) : (
              <ChevronDown className="w-5 h-5 text-white" />
            )}
          </div>
        </button>

        {/* Section Content */}
        {isExpanded && (
          <div className={`bg-gradient-to-br ${config.bgGradient} p-5`}>
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 shadow-inner">
              <div className="prose prose-slate max-w-none prose-headings:text-gray-800 prose-p:text-gray-700 prose-strong:text-gray-900 prose-li:text-gray-700 prose-ul:my-2 prose-li:my-1">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Enhanced Analysis Display Component
  const AnalysisDisplay = ({ analysis, modelInfo }) => {
    const model = MODELS[modelInfo.model] || MODELS.gemini;
    const sections = useMemo(() => parseAnalysis(analysis), [analysis]);

    return (
      <div className="space-y-4">
        {/* Model Header */}
        <div className={`rounded-xl bg-gradient-to-r ${model.color} p-4 flex items-center gap-3 shadow-lg`}>
          <span className="text-2xl">{model.icon}</span>
          <div>
            <h3 className="font-bold text-white text-lg">{modelInfo.modelName}</h3>
            <p className="text-white/80 text-sm">Analysis Results</p>
          </div>
        </div>

        {/* Parsed Sections */}
        {sections.differentials && (
          <DifferentialsSection content={sections.differentials} />
        )}
        {sections.diagnostics && (
          <SectionCard sectionKey="diagnostics" content={sections.diagnostics} />
        )}
        {sections.redFlags && (
          <SectionCard sectionKey="redFlags" content={sections.redFlags} />
        )}
        {sections.treatment && (
          <TreatmentSection content={sections.treatment} />
        )}

        {/* Fallback for unparsed content */}
        {sections.other && sections.other.trim().length > 50 && !sections.differentials && !sections.treatment && (
          <div className="rounded-2xl border-2 border-gray-200 overflow-hidden shadow-lg">
            <div className="bg-gradient-to-r from-gray-500 to-gray-600 px-5 py-4 flex items-center gap-3">
              <FileText className="w-5 h-5 text-white" />
              <h3 className="font-bold text-white text-lg">Full Analysis</h3>
            </div>
            <div className="bg-white p-5">
              <div className="prose prose-slate max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {sections.other}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <Stethoscope className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  VetDDx
                </h1>
                <p className="text-sm text-gray-500">AI-Powered Veterinary Decision Support</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('new-case')}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ${activeTab === 'new-case'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                New Case
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 ${activeTab === 'history'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
          <div className="space-y-6">
            {/* Patient Information Card */}
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 border border-gray-100">
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
                    onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
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
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="e.g., 5.5"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
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
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="e.g., 10 years, 6 months"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sex *
                  </label>
                  <select
                    value={formData.sex}
                    onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
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
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    placeholder="e.g., Domestic Shorthair, Labrador"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Problem List */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Problem List *
                  </label>
                  <button
                    onClick={addProblem}
                    className="flex items-center space-x-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
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
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                    />
                    {formData.problems.length > 1 && (
                      <button
                        onClick={() => removeProblem(index)}
                        className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Excluded Diagnoses */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Excluded Diagnoses (Already Ruled Out)
                  </label>
                  <button
                    onClick={addExclusion}
                    className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
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
                      className="flex-1 px-4 py-3 border border-red-200 bg-red-50/50 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all focus:bg-white"
                    />
                    {formData.excluded.length > 1 && (
                      <button
                        onClick={() => removeExclusion(index)}
                        className="p-2.5 text-red-500 hover:bg-red-100 rounded-xl transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* AI Model Selection Card */}
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 border border-gray-100">
              <div className="flex items-center space-x-2 mb-6">
                <Brain className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">Select AI Model</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ModelCard modelKey="gemini" />
                <ModelCard modelKey="mimo" />
                <ModelCard modelKey="both" />
              </div>
            </div>

            {/* Warning Notice */}
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-5">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <strong className="font-semibold">Clinical Decision Support Tool:</strong> This application provides
                  differential diagnosis suggestions based on Merck Veterinary Manual and BSAVA Manuals.
                  It is NOT a replacement for professional veterinary judgment.
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={generateDifferentials}
                disabled={loading || !formData.species || !formData.weight || !formData.age || !formData.sex || !formData.problems.some(p => p.trim())}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg shadow-indigo-200 disabled:shadow-none"
              >
                {loading ? (
                  <div className="flex items-center space-x-3">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="flex items-center space-x-2 transition-all duration-500">
                      <span className="text-lg">{loadingMessages[loadingMessageIndex].icon}</span>
                      <span>{loadingMessages[loadingMessageIndex].text}</span>
                    </span>
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate Differentials</span>
                  </>
                )}
              </button>

              <button
                onClick={resetForm}
                className="px-6 py-4 border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 text-gray-700"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {activeTab === 'results' && result && (
          <div className="space-y-6">
            {/* Case Summary Card */}
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Case Summary</h2>
                <div className="flex space-x-2">
                  {!result.multiModel && (
                    <button
                      onClick={getSecondOpinion}
                      disabled={loadingSecondOpinion}
                      className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-200 disabled:opacity-70"
                    >
                      {loadingSecondOpinion ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Getting...</span>
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4" />
                          <span>Get Second Opinion</span>
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={saveCase}
                    className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-200"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Case</span>
                  </button>
                  <button
                    onClick={exportPDF}
                    disabled={exportingPDF}
                    className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-70"
                  >
                    {exportingPDF ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Exporting...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Export PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Patient Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Species</span>
                  <p className="font-semibold text-gray-900 mt-1">{result.species}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</span>
                  <p className="font-semibold text-gray-900 mt-1">{result.weight} kg</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Age</span>
                  <p className="font-semibold text-gray-900 mt-1">{result.age}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sex</span>
                  <p className="font-semibold text-gray-900 mt-1">{result.sex}</p>
                </div>
                {result.breed && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Breed</span>
                    <p className="font-semibold text-gray-900 mt-1">{result.breed}</p>
                  </div>
                )}
              </div>

              <div className="bg-indigo-50 rounded-xl p-4 mb-4">
                <span className="text-xs font-medium text-indigo-600 uppercase tracking-wider">Problem List</span>
                <p className="font-medium text-gray-900 mt-1">{result.problemList}</p>
              </div>

              {result.excludedList && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <span className="text-xs font-medium text-red-600 uppercase tracking-wider">Excluded Diagnoses</span>
                  <p className="text-red-700 mt-1 font-medium">{result.excludedList}</p>
                </div>
              )}
            </div>

            {/* Analysis Results */}
            {result.multiModel ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {result.analyses.map((analysis, index) => (
                  <AnalysisDisplay
                    key={index}
                    analysis={analysis.text}
                    modelInfo={{ model: analysis.model, modelName: analysis.modelName }}
                  />
                ))}
              </div>
            ) : (
              <AnalysisDisplay
                analysis={result.analysis}
                modelInfo={{ model: result.model, modelName: result.modelName }}
              />
            )}

            <button
              onClick={() => setActiveTab('new-case')}
              className="w-full bg-gray-100 text-gray-700 px-6 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300"
            >
              New Case
            </button>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Case History</h2>

            {savedCases.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <History className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-4">No saved cases yet</p>
                <button
                  onClick={() => setActiveTab('new-case')}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200 font-medium"
                >
                  Create New Case
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {savedCases.map((savedCase) => (
                  <div
                    key={savedCase.id}
                    className="border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => loadCase(savedCase)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-4">
                        <span className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {savedCase.species} - {savedCase.weight}kg - {savedCase.age} - {savedCase.sex}
                        </span>
                        {savedCase.breed && (
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">({savedCase.breed})</span>
                        )}
                        {savedCase.multiModel && (
                          <span className="text-xs bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                            Dual Analysis
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-400">
                        {new Date(savedCase.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Problems:</span> {savedCase.problemList}
                      {savedCase.excludedList && (
                        <span className="block mt-1 text-red-600">
                          <span className="font-medium">Excluded:</span> {savedCase.excludedList}
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

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-gray-100 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2025 VetDDx - Based on Merck Veterinary Manual & BSAVA Manuals.
            For decision support only. | Developed by <span className="font-medium text-indigo-600">Mahmoud Abdelnasser</span>
          </p>
        </div>
      </footer>
    </div>
  );
}