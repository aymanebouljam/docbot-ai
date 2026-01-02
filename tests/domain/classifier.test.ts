import { classifyDomain, type DomainClassification } from "@/features/domain/classifier";

type ClassifierTestCase = {
  input: string;
  expected: DomainClassification;
};

const classifierCases: ClassifierTestCase[] = [
  {
    input: "What are the symptoms of anemia?",
    expected: "medical",
  },
  {
    input: "How do I center a div?",
    expected: "non_medical",
  },
  {
    input: "Who won the game yesterday?",
    expected: "non_medical",
  },
  {
    input: "My blood pressure is 150/95, is that bad?",
    expected: "medical",
  },
  {
    input: "Can you help me?",
    expected: "uncertain",
  },
  {
    input: "Write a SQL query",
    expected: "non_medical",
  },
  {
    input: "What does an elevated ALT mean?",
    expected: "medical",
  },
  {
    input: "What are common side effects of metformin?",
    expected: "medical",
  },
  {
    input: "Best laptop for programming?",
    expected: "non_medical",
  },
  {
    input: "I have chest pain and shortness of breath",
    expected: "medical",
  },
  {
    input: "Plan a vacation to Spain",
    expected: "non_medical",
  },
  {
    input: "Can dehydration cause dizziness?",
    expected: "medical",
  },
  {
    input: "What is the capital of Japan?",
    expected: "uncertain",
  },
  {
    input: "Explain this JavaScript function",
    expected: "non_medical",
  },
  {
    input: "Is a fever after vaccination normal?",
    expected: "medical",
  },
  {
    input: "How much protein should I eat for muscle gain?",
    expected: "uncertain",
  },
  {
    input: "What does high cholesterol do to your body?",
    expected: "medical",
  },
  {
    input: "My child has a rash and fever",
    expected: "medical",
  },
  {
    input: "What movie should I watch tonight?",
    expected: "non_medical",
  },
  {
    input: "What is a biopsy?",
    expected: "medical",
  },
  {
    input: "Should I worry about glucose of 220?",
    expected: "medical",
  },
  {
    input: "How can I debug this React component?",
    expected: "non_medical",
  },
  {
    input: "What does my CBC lab result mean?",
    expected: "medical",
  },
  {
    input: "Can stress affect blood pressure?",
    expected: "medical",
  },
  {
    input: "How do taxes work for freelancers?",
    expected: "non_medical",
  },
];

describe("classifyDomain", () => {
  it.each(classifierCases)(
    'classifies "$input" as $expected',
    ({ input, expected }) => {
      expect(classifyDomain(input)).toBe(expected);
    }
  );
});
