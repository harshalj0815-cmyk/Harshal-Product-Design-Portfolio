/** Swap `status` to "live" when a piece is ready to show. */
export const caseStudies = [
  {
    id: "cs-1",
    status: "live",
    tag: "Concept case study",
    title: "Referral at the moment it matters.",
    summary:
      "Situation-based slide-ups that turn peak play into tracked Matiks invites.",
    href: "https://matiks-concept-project.vercel.app/",
    stageLabel: "Open case study",
    image: "/images/matiks-referral-thumbnail.jpg",
    imageAlt: "Matiks: Referral growth inside the play flow",
  },
  {
    id: "cs-2",
    status: "progress",
    tag: "In progress",
    title: "New work is on the bench.",
    summary: "Writing now — full walkthrough soon.",
    href: "#",
  },
];

export const aiExperiments = [
  {
    id: "ai-1",
    size: "wide",
    href: "#",
    image: "",
    imageAlt: "AI experiment thumbnail",
  },
  {
    id: "ai-2",
    size: "tall",
    href: "#",
    image: "",
    imageAlt: "AI experiment thumbnail",
  },
  {
    id: "ai-3",
    size: "square",
    href: "#",
    image: "",
    imageAlt: "AI experiment thumbnail",
  },
  {
    id: "ai-4",
    size: "wide",
    href: "#",
    image: "",
    imageAlt: "AI experiment thumbnail",
  },
];

export const askAiLinks = [
  {
    id: "chatgpt",
    label: "Ask ChatGPT",
    url: "https://chatgpt.com/",
    logo: "/logos/chatgpt.svg",
    tone: "#19a831",
    invertLogo: true,
  },
  {
    id: "claude",
    label: "Ask Claude",
    url: "https://claude.ai/new",
    logo: "/logos/claude.svg",
    tone: "#ff4532",
    invertLogo: true,
  },
  {
    id: "gemini",
    label: "Ask Gemini",
    url: "https://www.google.com/search?udm=50",
    logo: "/logos/gemini.svg",
    tone: "#2f80ed",
    invertLogo: true,
  },
];

export const portfolioUrl = "https://harshal.design"; // dummy link for now

export const askAiPrompt = `I want your take on this product design portfolio as if you're briefing a hiring manager who already likes ambitious interactive work:

${portfolioUrl}

Please make the case for it. Cover:
1. Why this reads as a strong product design portfolio — point to specific craft, interaction, and storytelling choices that make it feel intentional.
2. Why a team should hire Harshal — frame it as the reasons you'd put in a short referral: taste, product thinking, and the kind of problems he'd elevate.

Write it as an enthusiastic recommendation grounded in concrete details from the site. Lead with what's working and what makes the work memorable.`;

export const socials = [
  { id: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/harshaljadhav15/" },
  { id: "x", label: "X", href: "https://x.com/" },
  {
    id: "email",
    label: "Email",
    href: "https://mail.google.com/mail/?view=cm&fs=1&to=harshalj0815@gmail.com",
  },
];
