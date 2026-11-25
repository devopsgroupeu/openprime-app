// src/components/WizardAssistant.jsx
// Aura in the wizard's right column (xl) or sheet (below xl). WizardPage owns
// the messages and the draft, so the conversation survives closing the sheet
// and the switch between column and sheet. `context` goes to /ai/chat with
// every question.
import AuraConversation, {
  AuraHeader,
} from "./modals/ai-chat/AuraConversation";

const STEP_PROMPTS = {
  basic: [
    "Which region for EU customers?",
    "What is the resource prefix for?",
    "Where is the Terraform state kept?",
  ],
  services: [
    "Do I need one NAT gateway per AZ?",
    "Which EKS node size should I use?",
    "When should I pick Aurora over RDS?",
  ],
  helm: [
    "What does Karpenter do here?",
    "Which ingress controller should I use?",
    "Do I need Loki and Tempo?",
  ],
  review: [
    "Is this setup ready for production?",
    "What gets created in my AWS account?",
    "What happens after I create it?",
  ],
};

const WizardAssistant = ({
  context,
  stepId,
  messages,
  setMessages,
  draft,
  setDraft,
}) => (
  <div className="flex min-h-0 flex-1 flex-col">
    {/* The column or sheet around it already names it "Aura". */}
    <AuraHeader titleAs="p" />
    <AuraConversation
      messages={messages}
      setMessages={setMessages}
      draft={draft}
      setDraft={setDraft}
      context={context}
      prompts={STEP_PROMPTS[stepId] ?? STEP_PROMPTS.basic}
    />
  </div>
);

export default WizardAssistant;
