import { useState } from "react";
import { BACKEND_URL } from "@/constants/Config";

type Message = { 
  role: string; 
  content: string; 
  showGoToRoutes?: boolean;
  actionRequired?: any;
};

type AIResponse = {
  reply: string;
  intent?: any;
  suggestions?: string[];
  actionRequired?: {
    type: 'confirm_itinerary' | 'confirm_route' | 'check_active_route' | 'confirm_weather';
    data?: any;
  };
};

export function useAIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<any>(null);

  // Generate a sessionId (could be user id or random)
  const sessionId = "default-session"; // Replace with real session/user id if available

  const sendMessage = async (content: string, metadata?: { userID?: string; hasActiveRoute?: boolean }) => {
    setLoading(true);
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content }]);
    
    try {
      const response = await fetch(`${BACKEND_URL}/ai-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sessionId, 
          message: content,
          userID: metadata?.userID,
          hasActiveRoute: metadata?.hasActiveRoute
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }
      
      const data: AIResponse = await response.json();
      
      const assistantMessage: Message = { 
        role: "assistant", 
        content: data.reply,
        showGoToRoutes: data.actionRequired?.type === 'check_active_route',
        actionRequired: data.actionRequired
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      
      // Handle suggestions
      if (data.suggestions) {
        setSuggestions(data.suggestions);
      }
      
      // Handle pending actions
      if (data.actionRequired) {
        setPendingAction(data.actionRequired);
      }
      
    } catch (err: any) {
      // Add error as Tara's message instead of setting error state
      const errorMessage: Message = {
        role: "assistant",
        content: "It seems like there's something wrong with the connection. Please try again later."
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
    setLoading(false);
  };

  const resetChat = () => {
    setMessages([]);
    setSuggestions([]);
    setPendingAction(null);
  };

  return { 
    messages, 
    loading, 
    error, 
    sendMessage, 
    resetChat,
    suggestions,
    pendingAction,
    setPendingAction
  };
}