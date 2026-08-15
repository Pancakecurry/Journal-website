import type { ReflectionPeriod } from "@/domain/reflection";

export interface ReflectionQuestion {
  id: string;
  prompt: string;
  placeholder: string;
}

export const REFLECTION_QUESTIONS: Record<ReflectionPeriod, readonly ReflectionQuestion[]> = {
  morning: [
    {
      id: "sleep",
      prompt: "How'd you sleep?",
      placeholder: "Like a rock, barely, somewhere in between…",
    },
    {
      id: "feeling",
      prompt: "How are you doing so far?",
      placeholder: "No need to make it profound.",
    },
    {
      id: "looking-forward",
      prompt: "Anything you're looking forward to?",
      placeholder: "Lunch absolutely counts.",
    },
    {
      id: "make-room",
      prompt: "What would be nice to make room for today?",
      placeholder: "A walk, a nap, finishing that thing…",
    },
  ],
  evening: [
    {
      id: "nicest",
      prompt: "What was actually nice today?",
      placeholder: "Big, tiny, or accidentally funny.",
    },
    { id: "laugh", prompt: "Anything make you laugh?", placeholder: "Yes, dumb memes count." },
    {
      id: "difficult",
      prompt: "Anything kind of hard?",
      placeholder: "Keep this short if you like. Or skip it.",
    },
    {
      id: "remember",
      prompt: "Anything you don't want to forget?",
      placeholder: "A detail, a person, a very good snack…",
    },
    { id: "overall", prompt: "So, what was the vibe?", placeholder: "Messy? Great? Weirdly fine?" },
  ],
};
