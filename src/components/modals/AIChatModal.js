import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, Bot, User } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const AIChatModal = ({ isOpen, onClose, service, serviceTitle }) => {
  const { isDark } = useTheme();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && service) {
      // Initialize conversation with a welcome message
      const welcomeMessage = {
        id: Date.now(),
        type: 'ai',
        content: `Hi! I'm here to help you with **${serviceTitle}**. I can provide information about:\n\n• Configuration best practices\n• Common use cases and patterns\n• Security recommendations\n• Cost optimization tips\n• Integration with other services\n\nWhat would you like to know?`
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, service, serviceTitle]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

    // Handle submitting a question
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!inputText.trim() || isLoading) return;

  const userMessage = { id: Date.now(), type: 'user', content: inputText.trim() };
  setMessages(prev => [...prev, userMessage]);
  setInputText('');
  setIsLoading(true);

  const aiMessageId = Date.now() + 1;
  let aiMessage = { id: aiMessageId, type: 'ai', content: '' };
  setMessages(prev => [...prev, aiMessage]);

  try {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001/api";
    // POST request to AI chat endpoint
    // Prepare messages with system context
    const payloadMessages = [
      ...messages
        .filter(m => m.content && m.content.trim() !== '')
        .map(m => ({ type: m.type === 'ai' ? 'assistant' : m.type, message: m.content })),
      { type: 'user', message: userMessage.content }
    ];

    const response = await fetch(`${backendUrl}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        messages: payloadMessages,
        topic: serviceTitle
       })
    });

    if (!response.ok || !response.body) throw new Error('Failed to connect to AI service');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      chunk.split('\n').forEach(line => {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.replace(/^data: /, ''));
            if (data.chunk) {
              aiMessage.content += data.chunk;
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === aiMessageId ? { ...msg, content: aiMessage.content } : msg
                )
              );
            }
            if (data.done) setIsLoading(false);
          } catch (err) {
            console.error('Parse error:', err);
          }
        }
      });
    }

    // Ensure loading indicator disappears after stream ends
    setIsLoading(false);

  } catch (err) {
    console.error(err);
    setMessages(prev =>
      prev.map(msg =>
        msg.id === aiMessageId
          ? { ...msg, content: "⚠️ Sorry, I couldn't connect to AI service right now." }
          : msg
      )
    );
    setIsLoading(false);
  }
};

  const handleClose = () => {
    setMessages([]);
    setInputText('');
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden shadow-2xl ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-500/20 rounded-lg">
              <MessageCircle className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Ask AI about {serviceTitle}
              </h2>
              <p className={`text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Get help with configuration and best practices
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'hover:bg-gray-700 text-gray-400'
                : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${
          isDark ? 'bg-gray-900/30' : 'bg-gray-50/30'
        }`}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.type === 'ai' && (
                <div className="p-2 bg-teal-500/20 rounded-lg flex-shrink-0">
                  <Bot className="w-4 h-4 text-teal-400" />
                </div>
              )}

              <div className={`max-w-[80%] p-3 rounded-lg ${
                message.type === 'user'
                  ? isDark
                    ? 'bg-teal-600 text-white'
                    : 'bg-teal-500 text-white'
                  : isDark
                  ? 'bg-gray-700 text-gray-100'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}>
                <div className="prose prose-sm max-w-none">
                  {message.content.split('\n').map((line, index) => {
                    if (line.startsWith('•')) {
                      return <div key={index} className="ml-2">{line}</div>;
                    }
                    if (line.includes('**') && line.includes('**')) {
                      const parts = line.split('**');
                      return (
                        <div key={index}>
                          {parts.map((part, i) =>
                            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                          )}
                        </div>
                      );
                    }
                    return line ? <div key={index}>{line}</div> : <div key={index} className="h-2"></div>;
                  })}
                </div>
              </div>

              {message.type === 'user' && (
                <div className="p-2 bg-gray-500/20 rounded-lg flex-shrink-0">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-teal-500/20 rounded-lg">
                <Bot className="w-4 h-4 text-teal-400" />
              </div>
              <div className={`p-3 rounded-lg ${
                isDark ? 'bg-gray-700' : 'bg-white border border-gray-200'
              }`}>
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={`p-4 border-t ${
          isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'
        }`}>
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Ask about ${serviceTitle}...`}
              disabled={isLoading}
              className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-teal-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-teal-500'
              } focus:outline-none focus:ring-2 focus:ring-teal-500/20`}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className={`px-4 py-2 rounded-lg transition-colors ${
                !inputText.trim() || isLoading
                  ? isDark
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-teal-600 text-white hover:bg-teal-700'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// AI response generator (simplified - in a real app this would call an actual AI service)
/*
const generateAIResponse = (question, service, serviceTitle) => {
  const serviceInfo = {
    vpc: {
      description: "AWS VPC (Virtual Private Cloud) provides isolated network resources in the AWS cloud.",
      bestPractices: [
        "Use private subnets for application and database tiers",
        "Implement proper security group rules",
        "Enable VPC Flow Logs for monitoring",
        "Use NAT Gateways for outbound internet access from private subnets"
      ],
      commonIssues: [
        "Insufficient IP address space planning",
        "Overly permissive security groups",
        "Missing route table configurations"
      ]
    },
    eks: {
      description: "Amazon EKS is a managed Kubernetes service that makes it easy to run Kubernetes on AWS.",
      bestPractices: [
        "Use managed node groups for better maintenance",
        "Implement proper RBAC and pod security policies",
        "Enable cluster logging and monitoring",
        "Use Spot instances for cost optimization"
      ],
      commonIssues: [
        "Insufficient resource limits on pods",
        "Poor cluster autoscaling configuration",
        "Missing network policies"
      ]
    },
    rds: {
      description: "Amazon RDS provides managed relational database services with automated backups, patching, and scaling.",
      bestPractices: [
        "Enable automated backups with appropriate retention",
        "Use Multi-AZ deployments for high availability",
        "Implement encryption at rest and in transit",
        "Monitor performance with CloudWatch and Performance Insights"
      ],
      commonIssues: [
        "Inadequate backup strategy",
        "Poor connection pooling",
        "Insufficient monitoring and alerting"
      ]
    }
  };

  const info = serviceInfo[service] || {
    description: `${serviceTitle} is a cloud service that provides various capabilities for your infrastructure.`,
    bestPractices: ["Follow security best practices", "Monitor resource usage", "Implement proper access controls"],
    commonIssues: ["Configuration complexity", "Cost optimization", "Integration challenges"]
  };

  const lowerQuestion = question.toLowerCase();

  if (lowerQuestion.includes('cost') || lowerQuestion.includes('price') || lowerQuestion.includes('billing')) {
    return `For **${serviceTitle}** cost optimization:\n\n• Use appropriate instance sizes based on actual usage\n• Implement auto-scaling to handle variable workloads\n• Consider Reserved Instances for predictable workloads\n• Monitor usage with AWS Cost Explorer\n• Set up billing alerts and budgets\n\nWould you like specific recommendations for cost optimization?`;
  }

  if (lowerQuestion.includes('security') || lowerQuestion.includes('secure')) {
    return `**Security best practices for ${serviceTitle}:**\n\n• Enable encryption at rest and in transit\n• Implement least-privilege access principles\n• Use VPC security groups and NACLs appropriately\n• Enable logging and monitoring\n• Regular security audits and updates\n\nWhat specific security aspect would you like to know more about?`;
  }

  if (lowerQuestion.includes('best practice') || lowerQuestion.includes('recommend')) {
    return `**Best practices for ${serviceTitle}:**\n\n${info.bestPractices.map(practice => `• ${practice}`).join('\n')}\n\nThese practices will help ensure optimal performance, security, and cost-effectiveness. Need more details on any of these?`;
  }

  if (lowerQuestion.includes('problem') || lowerQuestion.includes('issue') || lowerQuestion.includes('troubleshoot')) {
    return `**Common issues with ${serviceTitle}:**\n\n${info.commonIssues.map(issue => `• ${issue}`).join('\n')}\n\nI can help you troubleshoot specific issues. What problem are you experiencing?`;
  }

  // Default response
  return `**About ${serviceTitle}:**\n\n${info.description}\n\n**Key considerations:**\n${info.bestPractices.slice(0, 3).map(practice => `• ${practice}`).join('\n')}\n\nWhat specific aspect would you like to explore? I can help with configuration, best practices, troubleshooting, or cost optimization.`;
};
*/

export default AIChatModal;
