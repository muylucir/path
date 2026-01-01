"use client";

import { Lightbulb, Bot, Wrench, FileCheck } from "lucide-react";

const steps = [
  { icon: Lightbulb, label: "Problem", description: "문제 정의" },
  { icon: Bot, label: "Agent", description: "패턴 분석" },
  { icon: Wrench, label: "Technical", description: "기술 검증" },
  { icon: FileCheck, label: "Handoff", description: "명세서 생성" },
];

export function HeroSection() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-background border border-primary/20 mb-8">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

      <div className="relative px-8 py-12 md:py-16">
        {/* Main Title */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              P.A.T.H
            </span>
            <span className="text-foreground"> Agent Designer</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            AI Agent 아이디어를 <span className="text-primary font-semibold">구조화</span>하고{" "}
            <span className="text-accent font-semibold">검증</span>하여{" "}
            <span className="text-primary font-semibold">명세서</span>를 자동 생성합니다
          </p>
        </div>

        {/* P.A.T.H Steps */}
        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-2">
          {steps.map((step, index) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center group">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:border-primary/50 transition-all duration-300">
                  <step.icon className="w-7 h-7 md:w-8 md:h-8 text-primary" />
                </div>
                <span className="text-sm font-bold text-primary">{step.label}</span>
                <span className="text-xs text-muted-foreground">{step.description}</span>
              </div>

              {index < steps.length - 1 && (
                <div className="hidden md:flex items-center mx-4">
                  <div className="w-8 h-0.5 bg-gradient-to-r from-primary/50 to-accent/50" />
                  <div className="w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-4 border-l-primary/50" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
