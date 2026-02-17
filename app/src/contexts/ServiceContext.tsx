"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  type IEnrollmentService,
  type ILessonCompletionService,
} from "@/services/interfaces";

interface ServiceContextType {
  enrollmentService: IEnrollmentService;
  lessonCompletionService: ILessonCompletionService;
}

const ServiceContext = createContext<ServiceContextType | null>(null);

import { LocalEnrollmentService } from "@/services/local/enrollmentService";
import { LocalLessonCompletionService } from "@/services/local/lessonCompletionService";

export function ServiceProvider({ children }: { children: ReactNode }) {
  const services = useMemo(
    () => ({
      enrollmentService: new LocalEnrollmentService(),
      lessonCompletionService: new LocalLessonCompletionService(),
    }),
    []
  );

  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  );
}

export function useServices() {
  const ctx = useContext(ServiceContext);
  if (!ctx) throw new Error("useServices must be within ServiceProvider");
  return ctx;
}
