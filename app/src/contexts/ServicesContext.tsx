"use client";

import { createContext, useContext, ReactNode } from "react";
import {
  LearningProgressService,
  CourseService,
  EnrollmentService,
  XPTokenService,
} from "@/types";
import {
  learningService,
  courseService,
  enrollmentService,
  xpService,
} from "@/services/learning";

interface ServicesContextType {
  learningService: LearningProgressService;
  courseService: CourseService;
  enrollmentService: EnrollmentService;
  xpService: XPTokenService;
}

const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

export function ServicesProvider({ children }: { children: ReactNode }) {
  return (
    <ServicesContext.Provider
      value={{
        learningService,
        courseService,
        enrollmentService,
        xpService,
      }}
    >
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices() {
  const context = useContext(ServicesContext);
  if (context === undefined) {
    throw new Error("useServices must be used within a ServicesProvider");
  }
  return context;
}

// Convenience hooks
export function useLearningService() {
  return useServices().learningService;
}

export function useCourseService() {
  return useServices().courseService;
}

export function useEnrollmentService() {
  return useServices().enrollmentService;
}

export function useXPService() {
  return useServices().xpService;
}
