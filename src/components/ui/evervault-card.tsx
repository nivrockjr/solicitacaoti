"use client";
import { useMotionValue } from "framer-motion";
import type { MotionValue } from "framer-motion";
import React, { useState, useEffect } from "react";
import { useMotionTemplate, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const EvervaultCard = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const [randomString, setRandomString] = useState("");

  useEffect(() => {
    const str = generateRandomString(1500);
    setRandomString(str);
  }, []);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const { currentTarget, clientX, clientY } = e;
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);

    const str = generateRandomString(1500);
    setRandomString(str);
  }

  return (
    <div
      className={cn(
        "p-0.5 bg-transparent aspect-square flex items-center justify-center w-full h-full relative",
        className
      )}
    >
      <div
        onMouseMove={onMouseMove}
        className="group/card rounded-3xl w-full relative overflow-hidden bg-transparent flex items-center justify-center h-full"
      >
        <CardPattern
          mouseX={mouseX}
          mouseY={mouseY}
          randomString={randomString}
        />
        <div className="relative z-10 flex items-center justify-center w-full h-full p-8">
          {children || <LoginForm />}
        </div>
      </div>
    </div>
  );
};

function LoginForm() {
  return (
    <div className="w-full max-w-xs">
      <form className="space-y-6">
        <div className="space-y-4">
          <div className="relative">
            <input
              type="email"
              placeholder="Email"
              className="w-full max-w-[200px] mx-auto block px-4 py-3 bg-white/5 dark:bg-black/5 backdrop-blur-md border border-white/10 dark:border-white/10 rounded-xl text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all duration-300 text-sm"
            />
          </div>
          
          <div className="relative">
            <input
              type="password"
              placeholder="Senha"
              className="w-full max-w-[200px] mx-auto block px-4 py-3 bg-white/5 dark:bg-black/5 backdrop-blur-md border border-white/10 dark:border-white/10 rounded-xl text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all duration-300 text-sm"
            />
          </div>
        </div>
        
        <div className="flex justify-center">
          <motion.button
            type="submit"
            className="w-32 py-3 bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20 dark:border-white/20 rounded-xl text-black dark:text-white font-medium hover:bg-white/20 dark:hover:bg-black/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300 text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Entrar
          </motion.button>
        </div>
      </form>
    </div>
  );
}

export function CardPattern({
  mouseX,
  mouseY,
  randomString,
}: {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  randomString: string;
}) {
  const maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage };

  return (
    <div className="pointer-events-none">
      <div className="absolute inset-0 rounded-2xl [mask-image:linear-gradient(white,transparent)] group-hover/card:opacity-50"></div>
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 opacity-0 group-hover/card:opacity-100 backdrop-blur-xl transition duration-500"
        style={style}
      />
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 mix-blend-overlay group-hover/card:opacity-100"
        style={style}
      >
        <p className="absolute inset-x-0 text-xs h-full break-words whitespace-pre-wrap text-white font-mono font-bold transition duration-500">
          {randomString}
        </p>
      </motion.div>
    </div>
  );
}

const characters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export const generateRandomString = (length: number) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const Icon = ({
  className,
  ...rest
}: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={className}
      {...rest}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  );
}; 