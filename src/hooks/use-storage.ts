import { useEffect, useState } from "react";
import { StorageService } from "@/lib/storage";
import type { Profile, Resume, Job, AnalysisRecord } from "@/types";

export function useLiveStorage() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const h = () => setTick((t) => t + 1);
    window.addEventListener("tm_storage_change", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("tm_storage_change", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return tick;
}

export function useProfile(): [Profile, (p: Profile) => void] {
  useLiveStorage();
  return [StorageService.getProfile(), StorageService.saveProfile];
}

export function useResumes(): Resume[] {
  useLiveStorage();
  return StorageService.getResumes();
}

export function useJobs(): Job[] {
  useLiveStorage();
  return StorageService.getJobs();
}

export function useAnalyses(): AnalysisRecord[] {
  useLiveStorage();
  return StorageService.getAnalyses();
}
