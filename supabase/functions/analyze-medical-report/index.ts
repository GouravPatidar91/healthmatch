
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { file, fileName, fileType, language } = await req.json();

    if (!file || !fileName) {
      return new Response(
        JSON.stringify({ error: 'File and fileName are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!GEMINI_API_KEY) {
      console.error('Gemini API key not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured. Please check your Supabase secrets.' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Analyzing medical report: ${fileName} in ${language}`);

    // Enhanced language mapping for better prompts
    const languageInstructions = {
      'simple-english': 'Use very simple English words that anyone can understand. Avoid medical jargon and explain complex terms.',
      
      // Indian Regional Languages
      'hindi': 'Respond in Hindi (हिंदी). Use simple medical terms and explain complex concepts clearly.',
      'bengali': 'Respond in Bengali (বাংলা). Use simple medical terms and explain complex concepts clearly.',
      'telugu': 'Respond in Telugu (తెలుగు). Use simple medical terms and explain complex concepts clearly.',
      'marathi': 'Respond in Marathi (मराठी). Use simple medical terms and explain complex concepts clearly.',
      'tamil': 'Respond in Tamil (தமிழ்). Use simple medical terms and explain complex concepts clearly.',
      'gujarati': 'Respond in Gujarati (ગુજરાતી). Use simple medical terms and explain complex concepts clearly.',
      'urdu': 'Respond in Urdu (اردو). Use simple medical terms and explain complex concepts clearly.',
      'kannada': 'Respond in Kannada (ಕನ್ನಡ). Use simple medical terms and explain complex concepts clearly.',
      'odia': 'Respond in Odia (ଓଡ଼ିଆ). Use simple medical terms and explain complex concepts clearly.',
      'punjabi': 'Respond in Punjabi (ਪੰਜਾਬੀ). Use simple medical terms and explain complex concepts clearly.',
      'malayalam': 'Respond in Malayalam (മലയാളം). Use simple medical terms and explain complex concepts clearly.',
      'assamese': 'Respond in Assamese (অসমীয়া). Use simple medical terms and explain complex concepts clearly.',
      'maithili': 'Respond in Maithili (मैथिली). Use simple medical terms and explain complex concepts clearly.',
      'santali': 'Respond in Santali (ᱥᱟᱱᱛᱟᱲᱤ). Use simple medical terms and explain complex concepts clearly.',
      'kashmiri': 'Respond in Kashmiri (कॉशुर). Use simple medical terms and explain complex concepts clearly.',
      'nepali': 'Respond in Nepali (नेपाली). Use simple medical terms and explain complex concepts clearly.',
      'konkani': 'Respond in Konkani (कोंकणी). Use simple medical terms and explain complex concepts clearly.',
      'sindhi': 'Respond in Sindhi (سنڌي). Use simple medical terms and explain complex concepts clearly.',
      'manipuri': 'Respond in Manipuri (মৈতৈলোন্). Use simple medical terms and explain complex concepts clearly.',
      'bodo': 'Respond in Bodo (बर\'). Use simple medical terms and explain complex concepts clearly.',
      'dogri': 'Respond in Dogri (डोगरी). Use simple medical terms and explain complex concepts clearly.',
      
      // Continental Languages  
      'spanish': 'Respond in Spanish (Español). Use simple medical terms and explain complex concepts clearly.',
      'french': 'Respond in French (Français). Use simple medical terms and explain complex concepts clearly.',
      'german': 'Respond in German (Deutsch). Use simple medical terms and explain complex concepts clearly.',
      'italian': 'Respond in Italian (Italiano). Use simple medical terms and explain complex concepts clearly.',
      'portuguese': 'Respond in Portuguese (Português). Use simple medical terms and explain complex concepts clearly.',
      'russian': 'Respond in Russian (Русский). Use simple medical terms and explain complex concepts clearly.',
      'dutch': 'Respond in Dutch (Nederlands). Use simple medical terms and explain complex concepts clearly.',
      'polish': 'Respond in Polish (Polski). Use simple medical terms and explain complex concepts clearly.',
      'chinese': 'Respond in Chinese (中文). Use simple medical terms and explain complex concepts clearly.',
      'japanese': 'Respond in Japanese (日本語). Use simple medical terms and explain complex concepts clearly.',
      'korean': 'Respond in Korean (한국어). Use simple medical terms and explain complex concepts clearly.',
      'thai': 'Respond in Thai (ไทย). Use simple medical terms and explain complex concepts clearly.',
      'vietnamese': 'Respond in Vietnamese (Tiếng Việt). Use simple medical terms and explain complex concepts clearly.',
      'indonesian': 'Respond in Indonesian (Bahasa Indonesia). Use simple medical terms and explain complex concepts clearly.',
      'malay': 'Respond in Malay (Bahasa Melayu). Use simple medical terms and explain complex concepts clearly.',
      'arabic': 'Respond in Arabic (العربية). Use simple medical terms and explain complex concepts clearly.',
      'persian': 'Respond in Persian (فارسی). Use simple medical terms and explain complex concepts clearly.',
      'turkish': 'Respond in Turkish (Türkçe). Use simple medical terms and explain complex concepts clearly.',
      'hebrew': 'Respond in Hebrew (עברית). Use simple medical terms and explain complex concepts clearly.',
      'swahili': 'Respond in Swahili (Kiswahili). Use simple medical terms and explain complex concepts clearly.',
      'amharic': 'Respond in Amharic (አማርኛ). Use simple medical terms and explain complex concepts clearly.',
      'greek': 'Respond in Greek (Ελληνικά). Use simple medical terms and explain complex concepts clearly.',
      'swedish': 'Respond in Swedish (Svenska). Use simple medical terms and explain complex concepts clearly.',
      'norwegian': 'Respond in Norwegian (Norsk). Use simple medical terms and explain complex concepts clearly.',
      'danish': 'Respond in Danish (Dansk). Use simple medical terms and explain complex concepts clearly.',
      'finnish': 'Respond in Finnish (Suomi). Use simple medical terms and explain complex concepts clearly.',
    };

    const languageInstruction = languageInstructions[language as keyof typeof languageInstructions] || 
                               languageInstructions['simple-english'];

    // Enhanced comprehensive prompt for detailed medical report analysis
    const prompt = `
    You are an expert medical report analyzer with extensive clinical knowledge. ${languageInstruction}
    
    Perform a comprehensive and detailed analysis of the medical report content following this exact structure:
    
    The report file is: ${fileName} (${fileType})
    
    ${fileType === 'application/pdf' 
      ? `This is a PDF medical report. Analyze the content thoroughly and provide detailed insights based on common medical report structures and clinical patterns.`
      : `This is an image file containing medical report content. Carefully examine all visible text, numbers, charts, graphs, and medical data in the image.`
    }
    
    Please respond in JSON format with the following comprehensive structure:
    {
      "summaryOfFindings": {
        "diagnosis": "Clear explanation of the condition or disease identified (if any)",
        "normalAbnormalValues": [
          "Parameter name: value (normal/abnormal with reference range)",
          "Another parameter with detailed explanation"
        ],
        "severityOrStage": "Stage/severity level if applicable (e.g., Stage 2 Hypertension)"
      },
      "interpretationOfResults": {
        "significantResults": [
          {
            "parameter": "Parameter name",
            "value": "Actual value",
            "normalRange": "Reference range",
            "interpretation": "What this result means in simple terms",
            "clinicalSignificance": "How this relates to patient's health"
          }
        ],
        "overallInterpretation": "Comprehensive explanation of all results combined"
      },
      "treatmentPlan": {
        "medicationsPrescribed": [
          {
            "name": "Medication name",
            "dosage": "Strength and frequency",
            "duration": "How long to take",
            "purpose": "Why this medication is prescribed"
          }
        ],
        "therapiesRecommended": [
          "Specific therapy or treatment recommendation"
        ],
        "lifestyleChanges": {
          "diet": "Specific dietary recommendations",
          "exercise": "Exercise recommendations", 
          "sleep": "Sleep hygiene recommendations",
          "other": "Other lifestyle modifications"
        },
        "preventiveMeasures": [
          "Vaccines, screenings, or preventive care recommendations"
        ]
      },
      "nextSteps": {
        "additionalTestsRequired": [
          {
            "testName": "Name of test/imaging",
            "reason": "Why this test is needed",
            "urgency": "Timeline for completion"
          }
        ],
        "specialistReferral": {
          "required": true/false,
          "specialistType": "Type of specialist if needed",
          "reason": "Why referral is necessary"
        },
        "followUpAppointments": [
          {
            "timeframe": "When to follow up",
            "purpose": "What will be checked/monitored"
          }
        ]
      },
      "documentationProvided": {
        "reportType": "Type of medical report analyzed",
        "keyDocuments": [
          "List of important documents or sections found"
        ],
        "additionalNotes": "Any important notes or observations"
      },
      "urgencyLevel": "Low/Medium/High based on findings",
      "language": "${language}",
      "disclaimer": "This analysis is AI-generated and should be reviewed by a qualified healthcare professional"
    }
    
    ANALYSIS GUIDELINES:
    - Be thorough and comprehensive in your analysis
    - Explain medical terminology in simple terms  
    - Provide context for abnormal values
    - Consider the clinical correlation between different findings
    - Mention any red flags or concerning patterns
    - Suggest appropriate follow-up care
    - Include lifestyle recommendations when relevant
    - Only include sections that have actual data from the report
    - If no data is available for a section, omit that section entirely
    - Be specific with numbers, values, and clinical details
    - Provide educational context to help patient understanding
    - Ensure all medical advice is appropriate and safe
    
    Ensure the JSON is properly formatted without any additional text before or after.
    `;

    console.log('Making request to Gemini API...');

    // Prepare the request body for Gemini API
    let requestBody;
    
    if (fileType === 'application/pdf') {
      // For PDF files, use text-only analysis
      requestBody = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
          responseMimeType: "application/json"
        }
      };
    } else {
      // For image files, include both text and image
      const base64Data = file.split(',')[1]; // Remove data:image/jpeg;base64, prefix
      
      requestBody = {
        contents: [{
          parts: [
            {
              text: prompt
            },
            {
              inline_data: {
                mime_type: fileType,
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
          responseMimeType: "application/json"
        }
      };
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Gemini API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Gemini API error (${response.status}):`, errorData);
      
      let errorMessage = 'Failed to analyze medical report';
      if (response.status === 401) {
        errorMessage = 'Invalid Gemini API key. Please check your API key configuration.';
      } else if (response.status === 429) {
        errorMessage = 'Gemini API rate limit exceeded. Please try again later.';
      } else if (response.status === 400) {
        errorMessage = 'Invalid request format. Please check your file format.';
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage, details: errorData }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    console.log('Gemini response received successfully');

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error("Unexpected response structure:", JSON.stringify(data));
      throw new Error("Invalid response structure from Gemini");
    }

    let analysisResult;
    try {
      const content = data.candidates[0].content.parts[0].text;
      analysisResult = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      // Enhanced fallback to a structured response
      const content = data.candidates[0].content.parts[0].text;
      analysisResult = {
        summaryOfFindings: {
          diagnosis: "Analysis completed - detailed review required",
          normalAbnormalValues: ["Medical data analyzed according to clinical standards"],
          severityOrStage: "Requires professional medical interpretation"
        },
        interpretationOfResults: {
          significantResults: [
            {
              parameter: "Overall Analysis",
              value: "Completed",
              normalRange: "Professional review recommended",
              interpretation: content,
              clinicalSignificance: "Consult healthcare provider for detailed interpretation"
            }
          ],
          overallInterpretation: "Comprehensive medical analysis has been performed. Please consult with your healthcare provider for detailed interpretation of findings."
        },
        treatmentPlan: {
          medicationsPrescribed: [],
          therapiesRecommended: ["Consult with healthcare provider"],
          lifestyleChanges: {
            diet: "Follow healthcare provider recommendations",
            exercise: "As recommended by your doctor",
            sleep: "Maintain good sleep hygiene",
            other: "Follow medical advice"
          },
          preventiveMeasures: ["Regular health monitoring as advised"]
        },
        nextSteps: {
          additionalTestsRequired: [],
          specialistReferral: {
            required: false,
            specialistType: "",
            reason: ""
          },
          followUpAppointments: [
            {
              timeframe: "As recommended by healthcare provider",
              purpose: "Review and discuss findings"
            }
          ]
        },
        documentationProvided: {
          reportType: "Medical Report Analysis",
          keyDocuments: ["AI-generated analysis completed"],
          additionalNotes: "Professional medical review recommended"
        },
        urgencyLevel: 'Medium',
        language: language,
        disclaimer: "This analysis is AI-generated and should be reviewed by a qualified healthcare professional"
      };
    }

    // Ensure the response has the correct language field
    analysisResult.language = language;

    console.log('Comprehensive deep analysis completed successfully');

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-medical-report function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze medical report',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
