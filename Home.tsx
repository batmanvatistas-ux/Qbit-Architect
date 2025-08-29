import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ArrowUp, 
  Download, 
  LoaderCircle, 
  Plus, 
  Sparkles, 
  Trash2, 
  User, 
  X,
  Edit2,
  CornerUpLeft,
  Check,
  View,
  Building,
  Bot,
  ChevronLeft,
  ChevronRight,
  PenSquare,
  Undo2,
  Eraser,
} from 'lucide-react';
import { GoogleGenAI, Modality, Part as GenaiPart } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Helper to merge class names
const cn = (...classes) => classes.filter(Boolean).join(' ');

// Initialize the Gemini AI model
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Custom hook to auto-resize a textarea
const useAutoResizeTextarea = ({minHeight = 24, maxHeight = 200}) => {
  const textareaRef = useRef(null);

  const adjustHeight = useCallback(
    (isReset = false) => {
      if (textareaRef.current) {
        if (isReset) {
          textareaRef.current.style.height = `${minHeight}px`;
          return;
        }
        textareaRef.current.style.height = 'auto';
        const scrollHeight = textareaRef.current.scrollHeight;
        const newHeight = Math.max(
          minHeight,
          Math.min(scrollHeight, maxHeight),
        );
        textareaRef.current.style.height = `${newHeight}px`;
      }
    },
    [minHeight, maxHeight],
  );

  return {textareaRef, adjustHeight};
};

// Type Definitions
type Part = {
  text?: string;
  plans2D?: string[];
  plan3D?: string;
};

type ChatMessage = {
  role: 'user' | 'model';
  parts: Part[];
};

const DEFAULT_CHAT: ChatMessage[] = [
  {
    role: 'model',
    parts: [
      {
        text: "Welcome to Qbit Architect! I can design any building you can imagine. Describe what you'd like to create, or upload an image for inspiration. For example, try 'Design a modern 3-story office building with a rooftop garden.'",
      },
    ],
  },
];

const LOADING_MESSAGES = [
  "Drafting initial concepts...",
  "Consulting architectural principles...",
  "Rendering 2D floor plan...",
  "Constructing 3D model...",
  "Adding final touches...",
];

const SUGGESTIONS = [
    "A minimalist beach house with large windows",
    "A rustic cabin in the woods with a stone fireplace",
    "A futuristic skyscraper with a unique geometric shape",
];

const PlanCarousel = ({ plans2D, plan3D, exportImage, isDesktop }) => {
  const [currentView, setCurrentView] = useState('2D'); // '2D' or '3D'
  const [currentFloor, setCurrentFloor] = useState(0);

  const has2D = plans2D && plans2D.length > 0;
  const has3D = !!plan3D;

  // Effect to set initial state and handle data changes
  useEffect(() => {
    if (has2D) {
      setCurrentView('2D');
      setCurrentFloor(0);
    } else if (has3D) {
      setCurrentView('3D');
    }
  }, [plans2D, plan3D]);

  if (!has2D && !has3D) return null;

  const numFloors = has2D ? plans2D.length : 0;
  
  const currentImage = currentView === '2D' && has2D ? plans2D[currentFloor] : plan3D;
  
  const getFloorLabel = (index) => {
    if (numFloors <= 1) return '2D Floor Plan';
    if (index === 0) return 'Ground Floor';
    return `Floor ${index + 1}`;
  };

  const planLabel = currentView === '2D' ? (has2D ? getFloorLabel(currentFloor) : '2D Floor Plan') : '3D Exterior View';

  return (
    <div className="mt-2 w-full max-w-lg relative group">
      {/* Image Display */}
      <img
        src={currentImage}
        alt={planLabel}
        className="rounded-xl w-full aspect-[4/3] object-cover bg-gray-100"
      />
      
      {/* Label */}
      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1.5">
          {planLabel}
          {currentView === '2D' && numFloors > 1 && (
            <span className="text-gray-300">({currentFloor + 1}/{numFloors})</span>
          )}
      </div>

      {/* Download Button */}
      <button
        onClick={() => exportImage(currentImage, `${planLabel.replace(/\s+/g, '_')}.png`)}
        className={cn(
          "absolute top-2 right-2 bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-700 hover:bg-white transition-all",
          isDesktop ? "opacity-0 group-hover:opacity-100" : "opacity-100"
        )}
        aria-label={`Download ${planLabel}`}
      >
        <Download size={16} />
      </button>

      {/* Floor Navigation Arrows (only for multi-floor 2D view) */}
      {currentView === '2D' && has2D && numFloors > 1 && (
        <>
          <button
            onClick={() => setCurrentFloor((prev) => (prev - 1 + numFloors) % numFloors)}
            className={cn(
              "absolute top-1/2 left-2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-700 hover:bg-white transition-all",
              isDesktop ? "opacity-0 group-hover:opacity-100" : "opacity-100"
            )}
            aria-label="Previous Floor"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setCurrentFloor((prev) => (prev + 1) % numFloors)}
            className={cn(
              "absolute top-1/2 right-2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-700 hover:bg-white transition-all",
              isDesktop ? "opacity-0 group-hover:opacity-100" : "opacity-100"
            )}
            aria-label="Next Floor"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* View Switcher (2D/3D) */}
      {has2D && has3D && (
        <div className={cn("absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm p-1 rounded-full flex items-center gap-1 transition-opacity",
          isDesktop ? "opacity-0 group-hover:opacity-100" : "opacity-100")
        }>
          <button 
            onClick={() => setCurrentView('2D')} 
            className={cn(
              'px-4 py-1.5 text-xs font-semibold rounded-full transition-colors',
              currentView === '2D' ? 'bg-white text-black' : 'text-white hover:bg-white/20'
            )}
          >
            2D Plan
          </button>
          <button 
            onClick={() => setCurrentView('3D')} 
            className={cn(
              'px-4 py-1.5 text-xs font-semibold rounded-full transition-colors',
              currentView === '3D' ? 'bg-white text-black' : 'text-white hover:bg-white/20'
            )}
          >
            3D View
          </button>
        </div>
      )}
    </div>
  );
};

export default function Home() {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(DEFAULT_CHAT);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  // States for new features
  const [mode, setMode] = useState<'architect' | 'chat'>('architect');
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<ChatMessage | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [exploreMessage, setExploreMessage] = useState<ChatMessage | null>(null);
  const [editingPlan, setEditingPlan] = useState<ChatMessage | null>(null);


  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const loadingIntervalRef = useRef<number | null>(null);

  const {textareaRef, adjustHeight} = useAutoResizeTextarea({
    minHeight: 24,
    maxHeight: 200,
  });
  
  useEffect(() => {
    const checkDesktop = () => {
        setIsDesktop(window.innerWidth > 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({behavior: 'smooth'});
  }, [chatHistory, isLoading]);

  useEffect(() => {
    if (isLoading) {
      let messageIndex = 0;
      loadingIntervalRef.current = window.setInterval(() => {
        messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
        setLoadingMessage(LOADING_MESSAGES[messageIndex]);
      }, 2500);
    } else if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = null;
      setLoadingMessage(LOADING_MESSAGES[0]);
    }

    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
    };
  }, [isLoading]);

  const exportImage = (dataUrl, filename) => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link); // Required for Firefox
    link.click();
    document.body.removeChild(link);
  };

  const handleClearChat = () => {
    setChatHistory(DEFAULT_CHAT);
    setEditingMessageIndex(null);
    setReplyingToMessage(null);
    setExploreMessage(null);
    setEditingPlan(null);
    setInputValue('');
    setMode('architect');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        setErrorMessage('Image size should be less than 4MB.');
        setShowErrorModal(true);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const dataURLtoBase64 = (dataurl: string) => {
    const arr = dataurl.split(',');
    if (arr.length < 2) { return { mimeType: '', data: '' }; }
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || mimeMatch.length < 2) { return { mimeType: '', data: '' }; }
    return { mimeType: mimeMatch[1], data: arr[1] };
  }

  const handleStartEdit = (messageIndex: number) => {
    const messageToEdit = chatHistory[messageIndex];
    const textToEdit = messageToEdit.parts.find(p => p.text)?.text || '';
    setEditingMessageIndex(messageIndex);
    setInputValue(textToEdit);
    textareaRef.current?.focus();
    adjustHeight();
  };
  
  const handleCancelEdit = () => {
    setEditingMessageIndex(null);
    setInputValue('');
    adjustHeight(true);
  };

  const handleStartReply = (message: ChatMessage) => {
    setReplyingToMessage(message);
    textareaRef.current?.focus();
  };
  
  const handleStartExplore = (message: ChatMessage) => {
    setExploreMessage(message);
  };
  
  const handleStartPlanEdit = (message: ChatMessage) => {
    setEditingPlan(message);
  };
  
  const handleApplyPlanEdits = (newModelParts: Part[]) => {
    setEditingPlan(null); // Close the modal
    if (newModelParts.length > 0) {
        setChatHistory((prev) => [
            ...prev,
            { role: 'model', parts: newModelParts },
        ]);
    }
  };

  const handleSendMessage = async () => {
    const userMessageText = inputValue.trim();
    const isEditing = editingMessageIndex !== null;

    if ((!userMessageText && !uploadedImage && !isEditing) || isLoading) return;

    setIsLoading(true);
    setLoadingMessage(LOADING_MESSAGES[0]);

    let historyForGeneration: ChatMessage[];
    let geminiParts: GenaiPart[] = [];
    
    // Add text part
    if (userMessageText) {
        geminiParts.push({ text: userMessageText });
    }

    if (isEditing) {
        const editIndex = editingMessageIndex!;
        const updatedHistory = [...chatHistory];
        
        // Find the text part and update it, preserve image parts if any
        let textPartFound = false;
        updatedHistory[editIndex].parts = updatedHistory[editIndex].parts.map(p => {
            if(p.text !== undefined) {
                textPartFound = true;
                return { ...p, text: userMessageText };
            }
            return p;
        });
        if(!textPartFound){
             updatedHistory[editIndex].parts.unshift({ text: userMessageText });
        }

        // We only want to regenerate from this point, so we truncate the history
        historyForGeneration = updatedHistory.slice(0, editIndex + 1);
        setChatHistory(historyForGeneration);

    } else {
        // For a new message, add uploaded image
        if (uploadedImage) {
            const { mimeType, data } = dataURLtoBase64(uploadedImage);
            if (mimeType && data) {
                geminiParts.push({ inlineData: { mimeType, data } });
            }
        }
        // For a reply, add the images from the message being replied to
        if (replyingToMessage) {
            for (const part of replyingToMessage.parts) {
                if (part.plans2D) {
                    for (const p2d of part.plans2D) {
                        const { mimeType, data } = dataURLtoBase64(p2d);
                        if (mimeType && data) geminiParts.push({ inlineData: { mimeType, data } });
                    }
                }
                if (part.plan3D) {
                    const { mimeType, data } = dataURLtoBase64(part.plan3D);
                    if (mimeType && data) geminiParts.push({ inlineData: { mimeType, data } });
                }
            }
        }
        
        const userParts: Part[] = [];
        if (userMessageText) userParts.push({ text: userMessageText });
        // Use plans2D for user-uploaded image preview
        if (uploadedImage) userParts.push({ plans2D: [uploadedImage] });

        const currentUserMessage: ChatMessage = { role: 'user', parts: userParts };
        historyForGeneration = [...chatHistory, currentUserMessage];
        setChatHistory(historyForGeneration);
    }
    
    setInputValue('');
    setUploadedImage(null);
    adjustHeight(true);
    setEditingMessageIndex(null);
    setReplyingToMessage(null);

    try {
        const architectSystemInstruction = `You are Qbit Architect, a world-class AI specializing in generating architectural designs. Your primary function is to create and present architectural plans.

**CRITICAL INSTRUCTIONS:** For any user request that involves designing a building, house, structure, or plan, you MUST generate and output a set of images in the following specific formats:

1.  **2D Floor Plan Blueprints.**
    *   For any multi-story building, you MUST generate a separate, top-down 2D floor plan blueprint for EACH floor (e.g., Ground Floor, First Floor, etc.). For single-story structures, generate one 2D floor plan.
    *   **FORMAT:** Each plan MUST be a top-down, 2D architectural blueprint.
    *   **VIEW:** Strictly an orthographic, top-down view. NO 3D perspective, NO isometric views, NO exterior photos.
    *   **CONTENT:** It must clearly detail the internal layout for its respective floor, including all rooms, walls, doors, windows, and furniture.
    *   **STYLE:** Each plan MUST be a professional architectural blueprint with a classic white-on-blue aesthetic. It should be clean, precise, and include essential details like room labels and dimensions. The plan should NOT be a colored, photo-realistic rendering.

2.  **3D Exterior Rendering.**
    *   **FORMAT:** You must generate ONE and only ONE photorealistic 3D rendering of the building's exterior.
    *   **VIEW:** A perspective view that showcases the building's design and materials.
    *   **CONSISTENCY:** This 3D rendering MUST be an accurate, realistic representation of the combined 2D floor plans. The layout, window placements, doors, and overall structure must match exactly.

**OUTPUT ORDER:** You MUST always output all 2D Floor Plan Blueprints first (from the lowest floor to the highest), followed by the single 3D Exterior Rendering as the final image.

Accompany the images with a brief, clear, and well-formatted description of the design using markdown. If a user is just chatting and not requesting a design, you may respond with only text.`;
        const chatSystemInstruction = `You are Qbit, a helpful and creative AI assistant specializing in architectural design. Engage in a friendly, conversational manner. Answer questions and provide ideas about architecture. If the user explicitly asks for a design, floor plan, or rendering, you MUST follow these design generation rules:
1.  **Generate Plans:** Create 2D floor plans and one 3D exterior rendering.
2.  **2D Plans:** For multi-story buildings, provide a separate top-down blueprint for EACH floor. For single-story buildings, provide one. The 2D plans must be professional architectural blueprints (white-on-blue style) showing the internal layout with furniture. No perspective views.
3.  **3D Rendering:** Provide a single, photorealistic exterior view that accurately matches the 2D blueprints.
4.  **Output Order:** Always output all 2D plans first (lowest to highest floor), followed by the 3D rendering.
Always use markdown for clear text formatting.`;

        const systemInstruction = mode === 'architect' ? architectSystemInstruction : chatSystemInstruction;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: geminiParts },
            config: {
                systemInstruction,
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        const modelResponseParts: Part[] = [];
        let textResponse = '';
        const imageResponses: string[] = [];
        
        if (response.candidates && response.candidates.length > 0) {
            for (const part of response.candidates[0].content.parts) {
                if (part.text) {
                    textResponse += part.text;
                } else if (part.inlineData) {
                    const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    imageResponses.push(imageUrl);
                }
            }
        } else {
             throw new Error("Received an empty response from the model.");
        }
        
        if (textResponse) {
            modelResponseParts.push({ text: textResponse });
        }
        
        if (imageResponses.length > 0) {
            if (imageResponses.length === 1) {
                // If only one image, assume it's a 2D plan
                modelResponseParts.push({ plans2D: imageResponses });
            } else {
                // Last image is 3D, all others are 2D floors
                const plan3D = imageResponses.pop(); // remove and get last element
                const plans2D = imageResponses; // all remaining elements
                modelResponseParts.push({ plans2D, plan3D });
            }
        }
        
        if (modelResponseParts.length === 0) {
            modelResponseParts.push({ text: "I apologize, but I couldn't generate a design for that request. Could you please try rephrasing it?" });
        }

      setChatHistory((prev) => [
        ...prev,
        {
          role: 'model',
          parts: modelResponseParts,
        },
      ]);

    } catch (error) {
        console.error('Gemini API call failed:', error);
        setErrorMessage('Sorry, something went wrong while generating the design. Please check the console for details and try again.');
        setShowErrorModal(true);
        // Add a model response indicating failure
        setChatHistory((prev) => [
            ...prev,
            {
              role: 'model',
              parts: [{ text: "I encountered an error and couldn't complete your request. Please try again." }],
            },
        ]);
    } finally {
        setIsLoading(false);
    }
  };
  
  const ChatBubble = ({msg, index, isDesktop}) => {
    const isUser = msg.role === 'user';
    const hasGenerations = msg.parts.some(p => (p.plans2D && p.plans2D.length > 0) || p.plan3D);

    return (
      <div className={cn('flex w-full mb-2', isUser ? 'justify-end' : 'justify-start')}>
        <div className={cn('flex w-full max-w-[80%] gap-3 group', isUser ? 'flex-row-reverse' : 'flex-row')}>
          {/* Avatar */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm mt-1">
            {isUser ? (
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                <User size={16} />
              </div>
            ) : (
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                <Sparkles size={16} />
              </div>
            )}
          </div>
          
          {/* Message Content */}
          <div className={cn('flex flex-col gap-1 w-full', isUser ? 'items-end' : 'items-start')}>
            {msg.parts.map((part, partIndex) => (
              <div key={partIndex} className="w-full">
                {part.text && (
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-3 max-w-none prose',
                      isUser
                        ? 'bg-gray-100 text-gray-900 ml-auto'
                        : 'bg-transparent text-gray-900'
                    )}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{part.text}</ReactMarkdown>
                  </div>
                )}
                
                {/* Images */}
                {(part.plans2D || part.plan3D) && (
                  <PlanCarousel
                    plans2D={part.plans2D}
                    plan3D={part.plan3D}
                    exportImage={exportImage}
                    isDesktop={isDesktop}
                  />
                )}
              </div>
            ))}
             {/* Action Buttons */}
             <div className={cn(
                "flex gap-2 mt-1 transition-opacity",
                isDesktop ? "opacity-0 group-hover:opacity-100" : "opacity-100"
              )}>
                {isUser && !isLoading && (
                    <button onClick={() => handleStartEdit(index)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800" aria-label="Edit message">
                        <Edit2 size={14} />
                    </button>
                )}
                {!isUser && hasGenerations && !isLoading &&(
                    <>
                        <button onClick={() => handleStartReply(msg)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800" aria-label="Refine this design">
                            <CornerUpLeft size={14} />
                        </button>
                        <button onClick={() => handleStartPlanEdit(msg)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800" aria-label="Edit this plan">
                            <PenSquare size={14} />
                        </button>
                        {isDesktop && (
                             <button onClick={() => handleStartExplore(msg)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800" aria-label="Explore in 3D">
                                <View size={14} />
                            </button>
                        )}
                    </>
                )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
const INTERIOR_LOADING_MESSAGES = [
    "Analyzing floor plan...",
    "Determining room type...",
    "Selecting modern furnishings...",
    "Rendering interior view...",
    "Applying lighting and shadows...",
];

const ExploreViewModal = ({ message, onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [interiorLoadingMessage, setInteriorLoadingMessage] = useState(INTERIOR_LOADING_MESSAGES[0]);
    const [interiorImage, setInteriorImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const loadingIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (isLoading) {
            let messageIndex = 0;
            setInteriorLoadingMessage(INTERIOR_LOADING_MESSAGES[0]); // Reset on start
            loadingIntervalRef.current = window.setInterval(() => {
                messageIndex = (messageIndex + 1) % INTERIOR_LOADING_MESSAGES.length;
                setInteriorLoadingMessage(INTERIOR_LOADING_MESSAGES[messageIndex]);
            }, 2000);
        } else if (loadingIntervalRef.current) {
            clearInterval(loadingIntervalRef.current);
            loadingIntervalRef.current = null;
        }

        return () => {
            if (loadingIntervalRef.current) {
                clearInterval(loadingIntervalRef.current);
            }
        };
    }, [isLoading]);
    
    const plan2D = message.parts.find(p => p.plans2D && p.plans2D.length > 0)?.plans2D[0];

    const generateMarkedImage = (originalImageSrc: string, x: number, y: number): Promise<string> => {
        return new Promise((resolve, reject) => {
            const MAX_DIMENSION = 1024;
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (!canvas || !ctx) {
                return reject('Canvas not ready');
            }

            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                let { naturalWidth: width, naturalHeight: height } = img;
                
                if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                    if (width > height) {
                        height = Math.round(height * (MAX_DIMENSION / width));
                        width = MAX_DIMENSION;
                    } else {
                        width = Math.round(width * (MAX_DIMENSION / height));
                        height = MAX_DIMENSION;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;

                ctx.drawImage(img, 0, 0, width, height);

                const scale = width / img.naturalWidth;
                const newX = x * scale;
                const newY = y * scale;

                // Draw a red dot
                ctx.beginPath();
                ctx.arc(newX, newY, Math.max(5, width * 0.015), 0, 2 * Math.PI, false);
                ctx.fillStyle = 'red';
                ctx.fill();
                ctx.lineWidth = Math.max(2, width * 0.005);
                ctx.strokeStyle = 'white';
                ctx.stroke();

                resolve(canvas.toDataURL('image/jpeg', 0.9));
            };
            img.onerror = () => reject(new Error('Image failed to load for canvas processing.'));
            img.src = originalImageSrc;
        });
    };

    const handlePlanClick = async (e: React.MouseEvent<HTMLImageElement>) => {
        if (!plan2D) return;
        setIsLoading(true);
        setInteriorImage(null);
        setError(null);

        const target = e.target as HTMLImageElement;
        const rect = target.getBoundingClientRect();
        const scaleX = target.naturalWidth / rect.width;
        const scaleY = target.naturalHeight / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        try {
            const markedImageBase64 = await generateMarkedImage(plan2D, x, y);
            const { mimeType, data } = dataURLtoBase64(markedImageBase64);

            if (!mimeType || !data) throw new Error("Failed to process marked image.");

            const imagePart = { inlineData: { mimeType, data } };
            const textPart = { text: "As an AI interior designer, generate a single, high-quality, first-person 3D render of the room marked by the red dot on the provided 2D floor plan. Infer the room's function and furnish it in a modern style." };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: { parts: [imagePart, textPart] },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });
            
            const imageResponsePart = response.candidates?.[0]?.content.parts.find(p => p.inlineData);
            if (imageResponsePart?.inlineData) {
                 const imageUrl = `data:${imageResponsePart.inlineData.mimeType};base64,${imageResponsePart.inlineData.data}`;
                 setInteriorImage(imageUrl);
            } else {
                throw new Error("Could not generate an interior view. The model did not return an image.");
            }

        } catch (err) {
            console.error("Interior generation failed:", err);
            setError(err instanceof Error ? err.message : "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    if(!plan2D) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
             <canvas ref={canvasRef} className="hidden"></canvas>
            <div className="bg-white w-full h-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col">
                <header className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">3D Interior Explorer</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
                        <X size={20} />
                    </button>
                </header>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-y-auto">
                    <div className="flex flex-col gap-2 items-center">
                        <h3 className="text-sm text-gray-600">Click on the 2D plan to generate an interior view</h3>
                        <img 
                            src={plan2D} 
                            alt="2D Plan" 
                            className="w-full h-auto object-contain rounded-lg cursor-pointer border"
                            onClick={handlePlanClick}
                        />
                    </div>
                    <div className="flex items-center justify-center bg-gray-50 rounded-lg border">
                        {isLoading && (
                            <div className="flex flex-col items-center gap-2 text-gray-600 text-center px-4">
                                <LoaderCircle size={32} className="animate-spin" />
                                <p>{interiorLoadingMessage}</p>
                            </div>
                        )}
                        {error && (
                             <div className="flex flex-col items-center gap-2 text-red-600 p-4">
                                <p><strong>Generation Failed</strong></p>
                                <p className="text-sm text-center">{error}</p>
                            </div>
                        )}
                        {!isLoading && !error && !interiorImage && (
                            <div className="text-center text-gray-500">
                                <p>3D Interior View will appear here.</p>
                            </div>
                        )}
                        {interiorImage && (
                            <img src={interiorImage} alt="3D Interior View" className="w-full h-full object-contain rounded-lg"/>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
  }
  
  const EditPlanModal = ({ message, onClose, onApplyEdits }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    
    // Canvas state
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(5);
    const [brushColor, setBrushColor] = useState('#EF4444'); // red-500
    const [history, setHistory] = useState<ImageData[]>([]);

    const plan2D = message.parts.find(p => p.plans2D && p.plans2D.length > 0)?.plans2D[0];

    // Initialize canvas with the 2D plan
    useEffect(() => {
        if (!plan2D || !canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if(!ctx) return;
        
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            // Save initial state for undo
            setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
        };
        img.src = plan2D;
        contextRef.current = ctx;

    }, [plan2D]);

    const saveHistory = () => {
        if(!canvasRef.current || !contextRef.current) return;
        const canvas = canvasRef.current;
        const ctx = contextRef.current;
        setHistory(prev => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    };

    const handleUndo = () => {
        if (history.length <= 1) return; // Keep the initial image
        
        const newHistory = history.slice(0, history.length - 1);
        const lastState = newHistory[newHistory.length - 1];
        setHistory(newHistory);

        if(contextRef.current && lastState) {
            contextRef.current.putImageData(lastState, 0, 0);
        }
    };
    
    const handleClear = () => {
        if (history.length === 0) return;
        const firstState = history[0];
        setHistory([firstState]);
        if(contextRef.current && firstState){
            contextRef.current.putImageData(firstState, 0, 0);
        }
    }

    const getCanvasPoint = (nativeEvent) => {
        if (!canvasRef.current) return null;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
    
        return {
            x: nativeEvent.offsetX * scaleX,
            y: nativeEvent.offsetY * scaleY
        };
    };

    const startDrawing = ({ nativeEvent }) => {
        const point = getCanvasPoint(nativeEvent);
        if (!contextRef.current || !point) return;
    
        contextRef.current.beginPath();
        contextRef.current.moveTo(point.x, point.y);
        setIsDrawing(true);
    };

    const finishDrawing = () => {
        if (!contextRef.current) return;
        contextRef.current.closePath();
        setIsDrawing(false);
        saveHistory();
    };

    const draw = ({ nativeEvent }) => {
        if (!isDrawing || !contextRef.current) return;
        const point = getCanvasPoint(nativeEvent);
        if (!point) return;
    
        contextRef.current.lineCap = 'round';
        contextRef.current.strokeStyle = brushColor;
        contextRef.current.lineWidth = brushSize;
        contextRef.current.lineTo(point.x, point.y);
        contextRef.current.stroke();
    };
    
    const handleSubmit = async () => {
        if (!canvasRef.current || !prompt.trim()) {
            setError("Please add a drawing and a description of your changes.");
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            const annotatedImage = canvasRef.current.toDataURL('image/jpeg', 0.9);
            const { mimeType, data } = dataURLtoBase64(annotatedImage);
            if (!mimeType || !data) throw new Error("Failed to process annotated image.");

            const imagePart = { inlineData: { mimeType, data } };
            const textPart = { text: prompt };
            
            const systemInstruction = `You are an AI Architect revising a design. The user has provided a 2D floor plan with hand-drawn annotations and a text prompt explaining the required changes.
**YOUR TASK:**
1.  **Analyze:** Carefully interpret the user's drawings and text description. **Crucially, understand that the user's drawings (e.g., circles, arrows, lines) are annotations to indicate *where* to make a change. DO NOT redraw or "improve" the user's annotations on the final plan. Instead, execute the change described in the text at the location marked by the drawing.**
2.  **Revise:** Create a new, revised version of the architectural plan that incorporates all requested changes. The final plan should be clean and professional, with no user annotations visible.
    **IMPORTANT:** Only implement the specific changes requested by the user. Do not alter, add, or remove any other elements of the floor plan. The rest of the design must remain exactly as it was in the original image. For example, if asked to add a closet, add only the closet and do not change the bed.
3.  **Output:** Generate exactly TWO new images based on the revision:
    *   **IMAGE 1: A revised 2D Floor Plan Blueprint.** This must be a clean, professional, top-down blueprint of the new layout, maintaining a classic white-on-blue blueprint style.
    *   **IMAGE 2: A revised 3D Exterior Rendering.** This must be a photorealistic rendering that accurately matches the new 2D blueprint.
Your output must strictly follow this 2-image format. Accompany the images with a brief text description of the changes you made.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: { parts: [imagePart, textPart] },
                config: {
                    systemInstruction,
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });
            
            const modelResponseParts: Part[] = [];
            let textResponse = '';
            const imageResponses: string[] = [];
            
            if (response.candidates && response.candidates.length > 0) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.text) {
                        textResponse += part.text;
                    } else if (part.inlineData) {
                        const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                        imageResponses.push(imageUrl);
                    }
                }
            } else {
                 throw new Error("Received an empty response from the model.");
            }
            
            if (textResponse) modelResponseParts.push({ text: textResponse });
            
            if (imageResponses.length >= 2) {
                const plan3D = imageResponses.pop();
                modelResponseParts.push({ plans2D: imageResponses, plan3D });
            } else {
                 throw new Error("The model did not return the required 2D and 3D plans.");
            }

            onApplyEdits(modelResponseParts);

        } catch (err) {
            console.error("Plan revision failed:", err);
            setError(err instanceof Error ? err.message : "An unexpected error occurred during revision.");
        } finally {
            setIsLoading(false);
        }
    }

    if(!plan2D) return null;

    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="bg-white w-full h-full max-w-6xl max-h-[95vh] rounded-2xl shadow-2xl flex flex-col">
          <header className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2"><PenSquare size={20} /> Edit Plan</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
                  <X size={20} />
              </button>
          </header>
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 overflow-y-auto">
              <div className="flex flex-col gap-2">
                 <p className="text-sm text-center text-gray-600">Draw on the 2D plan to mark your changes</p>
                 <div className="w-full bg-gray-100 rounded-lg overflow-hidden border flex justify-center items-center">
                    <canvas 
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseUp={finishDrawing}
                        onMouseMove={draw}
                        onMouseLeave={finishDrawing} // Stop drawing if mouse leaves canvas
                        className="cursor-crosshair block max-w-full"
                    />
                 </div>
              </div>
               <div className="flex flex-col gap-4">
                  {/* Drawing Tools */}
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-gray-700">Drawing Tools</h3>
                    <div className="flex items-center gap-4 p-2 bg-gray-100 rounded-lg">
                        <div className="flex items-center gap-2">
                            <label className="text-xs">Color:</label>
                            <div className="flex items-center gap-1.5">
                                <button onClick={() => setBrushColor('#EF4444')} className={cn('w-6 h-6 rounded-full bg-red-500 tool-btn', {'tool-btn-active': brushColor === '#EF4444'})} aria-label="Red brush"></button>
                                <button onClick={() => setBrushColor('#3B82F6')} className={cn('w-6 h-6 rounded-full bg-blue-500 tool-btn', {'tool-btn-active': brushColor === '#3B82F6'})} aria-label="Blue brush"></button>
                                <button onClick={() => setBrushColor('#22C55E')} className={cn('w-6 h-6 rounded-full bg-green-500 tool-btn', {'tool-btn-active': brushColor === '#22C55E'})} aria-label="Green brush"></button>
                            </div>
                        </div>
                         <div className="flex items-center gap-2">
                            <label className="text-xs">Size:</label>
                            <input type="range" min="1" max="20" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-24" />
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                            <button onClick={handleUndo} className="p-2 rounded-md hover:bg-gray-200" aria-label="Undo"><Undo2 size={16}/></button>
                            <button onClick={handleClear} className="p-2 rounded-md hover:bg-gray-200" aria-label="Clear drawing"><Eraser size={16}/></button>
                        </div>
                    </div>
                  </div>

                  {/* Prompt */}
                  <div className="flex flex-col flex-1">
                      <h3 className="text-sm font-medium mb-2 text-gray-700">Describe Your Changes</h3>
                      <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., 'Make this wall a large glass window and add a door to the patio here.'"
                        className="w-full flex-1 p-3 text-sm border rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
                      />
                  </div>

                   {/* Actions */}
                   <div className="flex items-center gap-3">
                       <button 
                         onClick={handleSubmit} 
                         disabled={isLoading || !prompt.trim() || history.length <= 1}
                         className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isLoading ? <LoaderCircle size={18} className="animate-spin" /> : 'Generate Revised Plan'}
                       </button>
                       <button onClick={onClose} className="py-3 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
                   </div>
                   {error && <p className="text-sm text-red-600 text-center">{error}</p>}
               </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen bg-white">
      <main className="flex-1 flex flex-col h-screen">
        {/* Header */}
        <header className="flex items-center justify-between p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <Sparkles className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Qbit Architect</h1>
              <p className="text-sm text-gray-500">
                AI Architectural Design Partner
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-full">
                <button 
                    onClick={() => setMode('architect')} 
                    className={cn(
                        'flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors',
                        mode === 'architect' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:bg-gray-200'
                    )}
                    aria-pressed={mode === 'architect'}
                >
                    <Building size={16} /> Architect
                </button>
                <button 
                    onClick={() => setMode('chat')} 
                    className={cn(
                        'flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors',
                        mode === 'chat' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:bg-gray-200'
                    )}
                    aria-pressed={mode === 'chat'}
                >
                    <Bot size={16} /> Chat
                </button>
            </div>
            <button
              onClick={handleClearChat}
              disabled={chatHistory.length <= 1}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-sm text-gray-600 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Clear chat history"
            >
              <Trash2 size={16} />
              <span>Clear Chat</span>
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-6 pb-32">
          <div className="max-w-4xl mx-auto">
            {/* Welcome Screen */}
            {chatHistory.length === 1 && chatHistory[0].role === 'model' && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                {/* Welcome Message */}
                <div className="mb-12">
                  <h1 className="text-5xl md:text-6xl font-normal text-gray-900 mb-6 leading-tight">
                    What's on your mind today?
                  </h1>
                  <p className="text-lg text-gray-600 max-w-2xl">
                    I'm Qbit Architect, your AI design partner. I can help you create stunning architectural plans and visualizations.
                  </p>
                </div>

                {/* Feature Pills */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl">
                  <div className="flex items-center gap-3 bg-blue-50 text-blue-700 px-4 py-3 rounded-2xl">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                        <path d="M3 21h18"/>
                        <path d="M5 21V7l8-4v18"/>
                        <path d="M19 21V11l-6-4"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium">2D Floor Plans</span>
                  </div>

                  <div className="flex items-center gap-3 bg-green-50 text-green-700 px-4 py-3 rounded-2xl">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                        <path d="M12 2L2 7v10c0 5.55 3.84 10 9 9 5.16 1 9-3.45 9-9V7l-10-5z"/>
                        <path d="M12 22V12"/>
                        <path d="M12 2v10"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium">3D Renderings</span>
                  </div>

                  <div className="flex items-center gap-3 bg-purple-50 text-purple-700 px-4 py-3 rounded-2xl">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M12 1v6m0 6v6"/>
                        <path d="M21 12h-6m-6 0H3"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium">Custom Designs</span>
                  </div>

                  <div className="flex items-center gap-3 bg-orange-50 text-orange-700 px-4 py-3 rounded-2xl">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium">Image Upload</span>
                  </div>
                </div>
              </div>
            )}

            {/* Regular Chat Messages */}
            {chatHistory.map((msg, index) => (
                <ChatBubble key={index} msg={msg} index={index} isDesktop={isDesktop} />
            ))}
            
            {/* Loading Message */}
            {isLoading && (
              <div className="flex w-full mb-6 justify-start">
                <div className="flex max-w-[80%] gap-3">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <div className="bg-transparent text-gray-900 rounded-2xl px-4 py-3 flex items-center gap-3">
                    <LoaderCircle className="animate-spin" size={18} />
                    <span className="text-sm">{loadingMessage}</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef}></div>
          </div>
        </div>

        {/* Input Area */}
        <div className="fixed bottom-0 left-0 right-0 bg-white">
          <div className="max-w-4xl mx-auto p-6">
            {/* Prompt Suggestions Carousel */}
            {chatHistory.length <= 1 && !isLoading && mode === 'architect' && (
              <div className="mb-3">
                <div className="suggestion-carousel flex items-center gap-2 overflow-x-auto pb-2 -mx-6 px-6">
                  {SUGGESTIONS.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setInputValue(suggestion);
                        textareaRef.current?.focus();
                        setTimeout(() => adjustHeight(), 0);
                      }}
                      className="flex-shrink-0 px-4 py-2 bg-gray-50 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Status indicators for editing or replying */}
            {editingMessageIndex !== null && (
                <div className="text-sm text-gray-600 mb-2 px-2 flex items-center gap-2">
                    <Edit2 size={14} /> Editing message...
                </div>
            )}
             {replyingToMessage && (
                <div className="text-sm text-gray-600 mb-2 px-2 flex items-center justify-between bg-gray-100 rounded-full py-1">
                    <span className="flex items-center gap-2 pl-2">
                        <CornerUpLeft size={14} /> Replying to design...
                    </span>
                    <button onClick={() => setReplyingToMessage(null)} className="p-1 rounded-full hover:bg-gray-200 mr-1" aria-label="Cancel reply">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Image Preview */}
            {uploadedImage && (
              <div className="mb-4 w-fit">
                <div className="relative">
                  <img
                    src={uploadedImage}
                    alt="Preview"
                    className="h-16 w-16 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setUploadedImage(null)}
                    className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full p-1 hover:bg-gray-800 transition-colors"
                    aria-label="Remove image"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
            
            {/* Input Container */}
            <div className="relative flex items-center bg-gray-100 rounded-3xl px-4 py-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 p-2 rounded-full hover:bg-gray-200 transition-colors"
                aria-label="Add attachment"
              >
                <Plus size={20} className="text-gray-600" />
              </button>
              
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*"
              />
              
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  adjustHeight();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  mode === 'architect'
                    ? "Describe your vision..."
                    : "Ask about architecture or design ideas..."
                }
                rows={1}
                className="flex-1 mx-3 bg-transparent resize-none outline-none text-gray-900 placeholder-gray-500 text-sm"
                style={{height: '24px'}}
              />
              
               {editingMessageIndex !== null ? (
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isLoading}
                        className="flex-shrink-0 p-2 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                        aria-label="Confirm edit"
                    >
                        <Check size={20} />
                    </button>
                     <button
                        onClick={handleCancelEdit}
                        className="flex-shrink-0 p-2 rounded-full bg-gray-500 hover:bg-gray-600 text-white transition-colors"
                        aria-label="Cancel edit"
                    >
                        <X size={20} />
                    </button>
                </div>
               ) : (
                <button
                    onClick={handleSendMessage}
                    disabled={(!inputValue.trim() && !uploadedImage) || isLoading}
                    className={cn(
                    'flex-shrink-0 p-2 rounded-full transition-all',
                    isLoading
                        ? 'bg-gray-300 cursor-not-allowed'
                        : !inputValue.trim() && !uploadedImage
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-black hover:bg-gray-800 text-white'
                    )}
                    aria-label="Send message"
                >
                    <ArrowUp size={20} className={cn(isLoading || (!inputValue.trim() && !uploadedImage) ? 'text-gray-500' : 'text-white')} />
                </button>
               )}
            </div>
          </div>
        </div>
      </main>

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full">
            <h2 className="text-xl font-semibold text-red-600 mb-4">
              An Error Occurred
            </h2>
            <p className="text-gray-700 mb-6">{errorMessage}</p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full bg-red-500 text-white py-3 rounded-xl hover:bg-red-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Explore View Modal */}
      {exploreMessage && isDesktop && (
        <ExploreViewModal
            message={exploreMessage}
            onClose={() => setExploreMessage(null)}
        />
      )}
      
      {/* Edit Plan Modal */}
      {editingPlan && (
        <EditPlanModal
            message={editingPlan}
            onClose={() => setEditingPlan(null)}
            onApplyEdits={handleApplyPlanEdits}
        />
      )}
    </div>
  );
}