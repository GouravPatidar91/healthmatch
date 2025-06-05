
import { User, Doctor, Disease, SymptomCategory } from "../types";

export const mockUsers: User[] = [
  {
    id: "user1",
    name: "John Doe",
    email: "john@example.com",
    age: 32,
    address: "123 Main St, Anytown",
    region: "North",
    phone: "555-123-4567"
  },
];

export const mockDoctors: Doctor[] = [
  {
    id: "doc1",
    name: "Dr. Sarah Johnson",
    specialization: "General Practitioner",
    hospital: "City Medical Center",
    region: "North",
    address: "456 Health Ave, Anytown",
    availability: [
      { day: "Monday", slots: ["09:00", "10:00", "11:00", "14:00", "15:00"] },
      { day: "Tuesday", slots: ["09:00", "10:00", "11:00", "14:00", "15:00"] },
      { day: "Wednesday", slots: ["09:00", "10:00", "11:00", "14:00", "15:00"] },
      { day: "Thursday", slots: ["09:00", "10:00", "11:00", "14:00", "15:00"] },
      { day: "Friday", slots: ["09:00", "10:00", "11:00"] }
    ],
    rating: 4.8
  },
  {
    id: "doc2",
    name: "Dr. Michael Chen",
    specialization: "Cardiologist",
    hospital: "Heart Institute",
    region: "South",
    address: "789 Cardiac Rd, Anytown",
    availability: [
      { day: "Monday", slots: ["08:00", "09:00", "13:00", "14:00"] },
      { day: "Wednesday", slots: ["08:00", "09:00", "13:00", "14:00"] },
      { day: "Friday", slots: ["08:00", "09:00", "13:00", "14:00"] }
    ],
    rating: 4.9
  },
  {
    id: "doc3",
    name: "Dr. Emily Rodriguez",
    specialization: "Pediatrician",
    hospital: "Children's Hospital",
    region: "East",
    address: "101 Kid's Plaza, Anytown",
    availability: [
      { day: "Monday", slots: ["10:00", "11:00", "14:00", "15:00", "16:00"] },
      { day: "Tuesday", slots: ["10:00", "11:00", "14:00", "15:00", "16:00"] },
      { day: "Thursday", slots: ["10:00", "11:00", "14:00", "15:00", "16:00"] }
    ],
    rating: 4.7
  },
  {
    id: "doc4",
    name: "Dr. James Wilson",
    specialization: "Neurologist",
    hospital: "Neuro Care Center",
    region: "West",
    address: "202 Brain St, Anytown",
    availability: [
      { day: "Tuesday", slots: ["09:00", "10:00", "11:00", "13:00", "14:00"] },
      { day: "Thursday", slots: ["09:00", "10:00", "11:00", "13:00", "14:00"] },
      { day: "Friday", slots: ["09:00", "10:00", "11:00", "13:00", "14:00"] }
    ],
    rating: 4.6
  },
  {
    id: "doc5",
    name: "Dr. Lisa Brown",
    specialization: "Dermatologist",
    hospital: "Skin Health Clinic",
    region: "North",
    address: "303 Derma Ave, Anytown",
    availability: [
      { day: "Monday", slots: ["08:30", "09:30", "10:30", "13:30", "14:30"] },
      { day: "Wednesday", slots: ["08:30", "09:30", "10:30", "13:30", "14:30"] },
      { day: "Friday", slots: ["08:30", "09:30", "10:30"] }
    ],
    rating: 4.5
  }
];

export const mockDiseases: Disease[] = [
  {
    id: "dis1",
    name: "Common Cold",
    relatedSymptoms: ["runny nose", "cough", "sore throat", "sneezing", "headache", "mild fever"],
    description: "A viral infection of the upper respiratory tract that is usually harmless.",
    recommendedActions: ["Rest", "Stay hydrated", "Over-the-counter cold medications"]
  },
  {
    id: "dis2",
    name: "Influenza",
    relatedSymptoms: ["fever", "chills", "muscle aches", "cough", "fatigue", "headache", "sore throat"],
    description: "A contagious respiratory illness caused by influenza viruses.",
    recommendedActions: ["Rest", "Stay hydrated", "Antiviral medications", "Consult a doctor"]
  },
  {
    id: "dis3",
    name: "Allergic Rhinitis",
    relatedSymptoms: ["sneezing", "runny nose", "itchy eyes", "nasal congestion", "postnasal drip"],
    description: "Inflammation of the nasal passages caused by allergies.",
    recommendedActions: ["Avoid allergens", "Antihistamines", "Nasal sprays", "Consult an allergist"]
  },
  {
    id: "dis4",
    name: "Gastroenteritis",
    relatedSymptoms: ["nausea", "vomiting", "diarrhea", "abdominal pain", "fever", "headache"],
    description: "Inflammation of the stomach and intestines, usually caused by a viral or bacterial infection.",
    recommendedActions: ["Stay hydrated", "Bland diet", "Rest", "ORS", "Consult a doctor if severe"]
  },
  {
    id: "dis5",
    name: "Migraine",
    relatedSymptoms: ["throbbing headache", "sensitivity to light", "nausea", "vomiting", "visual disturbances"],
    description: "A primary headache disorder characterized by recurrent headaches.",
    recommendedActions: ["Rest in dark room", "Pain relievers", "Stay hydrated", "Consult a neurologist"]
  },
];

export const symptomCategories: SymptomCategory[] = [
  {
    category: "Head & Neurological",
    symptoms: ["headache", "dizziness", "migraine", "confusion", "memory problems", "fainting", "seizures"]
  },
  {
    category: "Eyes",
    symptoms: ["blurred vision", "eye pain", "red eyes", "itchy eyes", "eye discharge", "double vision"]
  },
  {
    category: "Ears, Nose & Throat",
    symptoms: ["earache", "hearing loss", "ringing in ears", "runny nose", "sore throat", "sneezing", "nasal congestion", "postnasal drip"]
  },
  {
    category: "Respiratory",
    symptoms: ["cough", "shortness of breath", "wheezing", "chest pain", "rapid breathing", "coughing up blood"]
  },
  {
    category: "Cardiovascular",
    symptoms: ["chest pain", "palpitations", "rapid heartbeat", "irregular heartbeat", "high blood pressure", "swelling of legs"]
  },
  {
    category: "Gastrointestinal",
    symptoms: ["nausea", "vomiting", "diarrhea", "constipation", "abdominal pain", "bloating", "heartburn", "black stool", "blood in stool"]
  },
  {
    category: "Urinary",
    symptoms: ["pain urinating", "frequent urination", "urgent urination", "blood in urine", "incontinence", "decreased urination"]
  },
  {
    category: "Skin",
    symptoms: ["rash", "itching", "hives", "bruising", "dry skin", "excessive sweating", "yellowing of skin"]
  },
  {
    category: "Musculoskeletal",
    symptoms: ["joint pain", "muscle pain", "back pain", "stiffness", "swelling of joints", "muscle weakness", "muscle cramps"]
  },
  {
    category: "General",
    symptoms: ["fever", "chills", "fatigue", "weight loss", "weight gain", "night sweats", "loss of appetite", "malaise"]
  }
];

export const regions = ["North", "South", "East", "West", "Central"];
