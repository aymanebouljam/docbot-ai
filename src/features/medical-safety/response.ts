export const URGENT_MEDICAL_RESPONSE =
  "This could be urgent. Seek immediate medical care now or contact your local emergency services right away, especially if symptoms are severe, worsening, or include trouble breathing, chest pain, confusion, severe bleeding, or loss of consciousness.";

export const SELF_HARM_CRISIS_RESPONSE =
  "I'm really sorry you're going through this. This sounds like a mental health crisis, and you deserve immediate support. If you might act on these thoughts or feel unsafe, call emergency services now. If you're in the U.S. or Canada, call or text 988 right now for immediate crisis support. If you're elsewhere, contact your local crisis hotline or emergency services, and if possible tell someone you trust to stay with you.";

export function buildUrgentMedicalResponse(
  category: "general_urgent" | "self_harm_crisis" = "general_urgent"
) {
  if (category === "self_harm_crisis") {
    return SELF_HARM_CRISIS_RESPONSE;
  }

  return URGENT_MEDICAL_RESPONSE;
}
