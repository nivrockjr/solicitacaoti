"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Paperclip } from "lucide-react";

export function PlaceholdersAndVanishInput({
  placeholders,
  onChange,
  onSubmit,
  onAttachmentClick,
}: {
  placeholders: string[];
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onAttachmentClick?: () => void;
}) {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startAnimation = () => {
    intervalRef.current = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, 4000);
  };
  const handleVisibilityChange = () => {
    if (document.visibilityState !== "visible" && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    } else if (document.visibilityState === "visible") {
      startAnimation();
    }
  };
  useEffect(() => {
    intervalRef.current && clearInterval(intervalRef.current);
    intervalRef.current = null;
    startAnimation();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [placeholders]);

  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [animating, setAnimating] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !animating) {
      onSubmit && onSubmit(e as any);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAnimating(true);
    setTimeout(() => setAnimating(false), 400); // Simula animação de sumir
    onSubmit && onSubmit(e);
  };

  return (
    <form
      className={cn(
        "w-full relative max-w-2xl mx-auto bg-background dark:bg-zinc-800 h-12 rounded-full overflow-hidden shadow transition duration-200 border border-border",
        value && "bg-muted"
      )}
      onSubmit={handleSubmit}
    >
      <input
        onChange={(e) => {
          if (!animating) {
            setValue(e.target.value);
            onChange && onChange(e);
          }
        }}
        onKeyDown={handleKeyDown}
        ref={inputRef}
        value={value}
        type="text"
        className={cn(
          "w-full relative text-sm sm:text-base z-50 border-none dark:text-white bg-transparent text-foreground h-full rounded-full focus:outline-none focus:ring-0 pl-4 sm:pl-10 pr-20",
          animating && "text-transparent dark:text-transparent"
        )}
        // placeholder removido para evitar sobreposição
      />
      {/* Botão de anexo */}
      <button
        type="button"
        onClick={onAttachmentClick}
        className="absolute right-10 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary transition"
        tabIndex={-1}
        aria-label="Anexar arquivo"
      >
        <Paperclip className="h-5 w-5" />
      </button>
      {/* Botão de submit */}
      <button
        disabled={!value}
        type="submit"
        className="absolute right-2 top-1/2 z-50 -translate-y-1/2 h-8 w-8 rounded-full disabled:bg-muted bg-primary dark:bg-zinc-900 dark:disabled:bg-zinc-800 transition duration-200 flex items-center justify-center"
        aria-label="Enviar pergunta"
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-300 h-4 w-4"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <motion.path
            d="M5 12l14 0"
            initial={{
              strokeDasharray: "50%",
              strokeDashoffset: "50%",
            }}
            animate={{
              strokeDashoffset: value ? 0 : "50%",
            }}
            transition={{
              duration: 0.3,
              ease: "linear",
            }}
          />
          <path d="M13 18l6 -6" />
          <path d="M13 6l6 6" />
        </motion.svg>
      </button>
      {/* Placeholder animado */}
      <div className="absolute inset-0 w-full h-full flex items-center rounded-full pointer-events-none overflow-hidden">
        <AnimatePresence mode="wait">
          {!value && (
            <motion.p
              key={`current-placeholder-${currentPlaceholder}`}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              transition={{ duration: 0.3, ease: "linear" }}
              className="dark:text-zinc-500 text-xs sm:text-sm font-normal text-muted-foreground text-left w-full pl-8 sm:pl-12 pr-16"
              style={{ lineHeight: '1.5' }}
            >
              {placeholders[currentPlaceholder]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
} 