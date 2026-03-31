import React, { useState, useRef, useEffect } from 'react';
import { 
  Sprout, 
  Leaf, 
  CloudSun, 
  MessageSquare, 
  Camera, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Loader2,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

type DiagnosisResult = {
  status: 'healthy' | 'diseased' | 'pest' | 'unknown';
  label: string;
  confidence: number;
  description: string;
  recommendations: string[];
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'diagnose' | 'advice' | 'weather'>('diagnose');
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: "Hello! I'm your AgriGuard assistant. Ask me anything about your crops, soil, or sustainable farming practices." }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        handleAnalyze(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] as string[] },
    multiple: false
  });

  const handleAnalyze = async (base64Image: string) => {
    setIsAnalyzing(true);
    setDiagnosis(null);
    try {
      const base64Data = base64Image.split(',')[1];
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: "Analyze this plant leaf image. Identify if it's healthy or has a disease/pest. Provide a JSON response with status (healthy, diseased, pest, unknown), label (name of disease or 'Healthy'), confidence (0-1), description, and a list of recommendations." },
              { inlineData: { mimeType: "image/jpeg", data: base64Data } }
            ]
          }
        ],
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || '{}');
      setDiagnosis(result);
    } catch (error) {
      console.error("Diagnosis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isChatting) return;

    const userMsg = inputMessage;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputMessage('');
    setIsChatting(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are an expert agricultural advisor. Answer the following question concisely and practically: ${userMsg}`,
      });

      setChatMessages(prev => [...prev, { role: 'ai', text: response.text || "I'm sorry, I couldn't process that." }]);
    } catch (error) {
      console.error("Chat failed:", error);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-sage/10">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-sage rounded-full flex items-center justify-center text-white">
              <Sprout size={24} />
            </div>
            <h1 className="text-2xl font-bold serif tracking-tight text-sage">AgriGuard AI</h1>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => setActiveTab('diagnose')}
              className={cn("text-sm font-medium transition-colors", activeTab === 'diagnose' ? "text-sage underline underline-offset-8" : "text-gray-500 hover:text-sage")}
            >
              Diagnose
            </button>
            <button 
              onClick={() => setActiveTab('advice')}
              className={cn("text-sm font-medium transition-colors", activeTab === 'advice' ? "text-sage underline underline-offset-8" : "text-gray-500 hover:text-sage")}
            >
              Expert Advice
            </button>
            <button 
              onClick={() => setActiveTab('weather')}
              className={cn("text-sm font-medium transition-colors", activeTab === 'weather' ? "text-sage underline underline-offset-8" : "text-gray-500 hover:text-sage")}
            >
              Weather
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        <AnimatePresence mode="wait">
          {activeTab === 'diagnose' && (
            <motion.div 
              key="diagnose"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <h2 className="text-5xl font-light serif text-sage leading-tight">
                  Heal your crops with <br /> <span className="italic">visual intelligence</span>
                </h2>
                <p className="text-gray-500 max-w-xl mx-auto">
                  Upload a photo of your plant's leaves to detect diseases and pests instantly using advanced AI.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-12 items-start">
                {/* Upload Section */}
                <div className="space-y-6">
                  <div 
                    {...getRootProps()} 
                    className={cn(
                      "aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-8 transition-all cursor-pointer",
                      isDragActive ? "border-sage bg-sage/5" : "border-sage/20 bg-white hover:border-sage/40"
                    )}
                  >
                    <input {...getInputProps()} />
                    {image ? (
                      <img src={image} alt="Preview" className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center mx-auto text-sage">
                          <Camera size={32} />
                        </div>
                        <div>
                          <p className="font-medium text-sage">Click or drag photo here</p>
                          <p className="text-xs text-gray-400">Supports JPG, PNG up to 10MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {image && (
                    <button 
                      onClick={() => { setImage(null); setDiagnosis(null); }}
                      className="w-full py-4 text-sm font-medium text-sage border border-sage/20 rounded-2xl hover:bg-sage/5 transition-colors"
                    >
                      Reset Image
                    </button>
                  )}
                </div>

                {/* Results Section */}
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-sage/10 min-h-[400px] flex flex-col">
                  {isAnalyzing ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                      <Loader2 className="animate-spin text-sage" size={40} />
                      <p className="text-sage font-medium italic serif text-xl">Analyzing leaf health...</p>
                    </div>
                  ) : diagnosis ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest",
                          diagnosis.status === 'healthy' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                          {diagnosis.status}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          Confidence: {(diagnosis.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      
                      <h3 className="text-3xl font-bold serif text-sage">{diagnosis.label}</h3>
                      <p className="text-gray-600 leading-relaxed">{diagnosis.description}</p>
                      
                      <div className="space-y-4 pt-4 border-t border-sage/10">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-sage flex items-center gap-2">
                          <CheckCircle2 size={16} />
                          Recommendations
                        </h4>
                        <ul className="space-y-3">
                          {diagnosis.recommendations.map((rec, i) => (
                            <li key={i} className="flex gap-3 text-sm text-gray-600">
                              <span className="text-sage font-bold">0{i+1}</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                      <Info size={48} className="text-sage" />
                      <p className="serif text-xl italic">Upload an image to see <br /> AI diagnosis results</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'advice' && (
            <motion.div 
              key="advice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto h-[70vh] flex flex-col bg-white rounded-[32px] shadow-sm border border-sage/10 overflow-hidden"
            >
              <div className="p-6 border-b border-sage/10 bg-sage/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sage rounded-full flex items-center justify-center text-white">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold serif text-sage">AgriGuard Expert Chat</h3>
                    <p className="text-[10px] text-sage/60 uppercase tracking-widest font-bold">Always Online</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
                      msg.role === 'user' ? "bg-sage text-white rounded-tr-none" : "bg-cream text-sage rounded-tl-none"
                    )}>
                      {msg.role === 'ai' ? (
                        <div className="markdown-body">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      ) : (
                        msg.text
                      )}
                    </div>
                  </div>
                ))}
                {isChatting && (
                  <div className="flex justify-start">
                    <div className="bg-cream p-4 rounded-2xl rounded-tl-none flex gap-1">
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-sage rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-sage rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-sage rounded-full" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-6 border-t border-sage/10">
                <div className="relative">
                  <input 
                    type="text" 
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask about crops, soil, or pests..."
                    className="w-full py-4 pl-6 pr-16 bg-cream rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sage/20"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={isChatting || !inputMessage.trim()}
                    className="absolute right-2 top-2 bottom-2 w-12 bg-sage text-white rounded-xl flex items-center justify-center hover:bg-sage/90 transition-colors disabled:opacity-50"
                  >
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'weather' && (
            <motion.div 
              key="weather"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <h2 className="text-5xl font-light serif text-sage leading-tight">
                  Farming by the <span className="italic">elements</span>
                </h2>
                <p className="text-gray-500 max-w-xl mx-auto">
                  Real-time weather data combined with AI insights to optimize your planting and harvesting schedule.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-[32px] border border-sage/10 space-y-6">
                  <div className="flex items-center justify-between">
                    <CloudSun size={32} className="text-sage" />
                    <span className="text-4xl font-light serif">24°C</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sage">Partly Cloudy</h3>
                    <p className="text-xs text-gray-400">Nairobi, Kenya</p>
                  </div>
                  <div className="pt-4 border-t border-sage/10">
                    <p className="text-sm text-gray-600 italic">"Perfect conditions for applying organic fertilizers today."</p>
                  </div>
                </div>

                <div className="md:col-span-2 bg-sage text-white p-8 rounded-[32px] flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold serif">Weekly Outlook</h3>
                    <p className="text-sage-100 text-sm opacity-80">Expect moderate rainfall starting Thursday.</p>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-4 pt-8">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
                      <div key={day} className="text-center space-y-2">
                        <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">{day}</p>
                        <div className="h-20 bg-white/10 rounded-2xl flex flex-col items-center justify-center">
                          <CloudSun size={16} />
                          <p className="text-xs font-bold mt-1">{22 + i}°</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[32px] border border-sage/10">
                <h3 className="text-xl font-bold serif text-sage mb-6">AI Planting Recommendations</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { crop: 'Maize', action: 'Wait', reason: 'Soil moisture is currently too low for optimal germination.' },
                    { crop: 'Beans', action: 'Plant Now', reason: 'Upcoming rainfall will provide perfect initial hydration.' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-cream">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0",
                        item.action === 'Wait' ? "bg-amber-500" : "bg-green-500"
                      )}>
                        {item.action === 'Wait' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-sage">{item.crop}: {item.action}</h4>
                        <p className="text-xs text-gray-600 mt-1">{item.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-sage/10 bg-white">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Sprout size={20} className="text-sage" />
            <span className="font-bold serif text-sage">AgriGuard AI</span>
          </div>
          <p className="text-xs text-gray-400">© 2026 AgriGuard AI. Empowering sustainable farming.</p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-gray-400 hover:text-sage transition-colors">Privacy</a>
            <a href="#" className="text-xs text-gray-400 hover:text-sage transition-colors">Terms</a>
            <a href="#" className="text-xs text-gray-400 hover:text-sage transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
