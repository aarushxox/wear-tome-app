'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    gender: '',
    how_found: '',
    style_pref: '',
    category_pref: '',
  });

  const questions = [
    {
      id: 'gender',
      label: '01 / SELECT YOUR GENDER TARGET',
      desc: 'This helps us default your shop layouts to your primary category preferences.',
      options: ['Male', 'Female', 'Prefer not to say'],
    },
    {
      id: 'how_found',
      label: '02 / HOW DID YOU FIND WEAR TOME?',
      desc: 'We value tracking our traffic sources to optimize editorial spreads.',
      options: ['Pinterest', 'Instagram', 'Ad Campaign', 'Search Engine', 'Other Referral'],
    },
    {
      id: 'style_pref',
      label: '03 / YOUR PRIMARY LUXURY STYLE PREFERENCE',
      desc: 'Our collections range from minimalist structures to heavy drop oversize streetwear.',
      options: ['Minimal Streetwear', 'Oversized Structural', 'Heavy Drop Baggy', 'Everything'],
    },
    {
      id: 'category_pref',
      label: '04 / PREFERRED SHOPPING CATEGORY',
      desc: 'Which category of apparel or accessory do you shop for most frequently?',
      options: ['Apparel', 'Accessories', 'Trending Drops', 'Both'],
    },
  ];

  const currentQuestion = questions[step - 1];

  const handleSelectOption = (option: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }));
  };

  const handleNext = async () => {
    if (step < 4) {
      setStep((s) => s + 1);
    } else {
      // Submit onboarding answers
      try {
        await fetch('/api/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(answers),
        });

        // Trigger order success celebration
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFFFFF', '#D4AF37', '#8A8A8A'],
        });

        onComplete();
      } catch (err) {
        console.error('Error submitting onboarding:', err);
        onComplete();
      }
    }
  };

  const handleSkip = () => {
    if (step < 4) {
      setStep((s) => s + 1);
    } else {
      // Complete anyway
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 backdrop-blur-md">
      <div className="bg-[#0A0A0A] border border-[#262626] rounded-2xl max-w-lg w-full p-8 relative overflow-hidden">

        {/* Progress header */}
        <div className="flex items-center justify-between mb-8">
          <span className="text-xs tracking-widest text-[#8A8A8A]">WEAR TOME ONBOARDING</span>
          <div className="flex space-x-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-white' : i < step ? 'w-2 bg-white/50' : 'w-2 bg-white/20'}`}
              />
            ))}
          </div>
        </div>

        {/* Question wrapper */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col space-y-6"
          >
            <span className="text-xs uppercase tracking-widest text-[#B5B5B5] font-semibold">
              {currentQuestion.label}
            </span>
            <p className="text-sm text-[#8A8A8A] leading-relaxed">
              {currentQuestion.desc}
            </p>

            {/* Options Selection */}
            <div className="flex flex-col space-y-3 pt-2">
              {currentQuestion.options.map((option) => {
                const isSelected = (answers as any)[currentQuestion.id] === option;
                return (
                  <button
                    key={option}
                    onClick={() => handleSelectOption(option)}
                    className={`flex items-center justify-between text-left px-5 py-4 rounded-xl border text-sm transition-all duration-200 ${
                      isSelected
                        ? 'bg-[#F8F6F2] text-black border-white'
                        : 'bg-black border-[#262626] text-white hover:border-[#525252]'
                    }`}
                  >
                    <span>{option}</span>
                    {isSelected && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Buttons Action bar */}
        <div className="flex items-center justify-between mt-10 pt-4 border-t border-[#262626]">
          <button
            onClick={handleSkip}
            className="text-xs uppercase tracking-widest text-[#8A8A8A] hover:text-white transition-colors"
          >
            SKIP QUESTION
          </button>

          <button
            onClick={handleNext}
            disabled={!(answers as any)[currentQuestion.id]}
            className={`flex items-center space-x-2 text-xs uppercase tracking-widest px-6 py-3 rounded-full font-semibold transition-all duration-200 ${
              (answers as any)[currentQuestion.id]
                ? 'bg-[#F8F6F2] text-black hover:bg-white cursor-pointer'
                : 'bg-[#262626] text-[#8A8A8A] cursor-not-allowed'
            }`}
          >
            <span>{step === 4 ? 'COMPLETE SETUP' : 'NEXT STEP'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
