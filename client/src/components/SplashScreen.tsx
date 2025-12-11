import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import bgImage from "@assets/generated_images/modern_university_campus_background_for_login_screen.png";
const logo = "/Unilorinlogo.png";

interface SplashScreenProps {
    onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
    const [step, setStep] = useState(0);

    useEffect(() => {
        // Sequence timing
        // 0: Initial wait (0.5s)
        // 1: Show "We are better by far" (2s)
        // 2: Show "You are better by far" (2s)
        // 3: Show "I am better by far" (2.5s)
        // 4: Complete

        const times = [500, 2500, 4500, 7000];

        const timeouts = times.map((time, index) => {
            return setTimeout(() => {
                if (index === 3) {
                    onComplete();
                } else {
                    setStep(index + 1);
                }
            }, time);
        });

        return () => timeouts.forEach((t) => clearTimeout(t));
    }, [onComplete]);

    const textVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.5 } },
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-900">
            {/* Background with Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src={bgImage}
                    alt="University Campus"
                    className="w-full h-full object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#1a1f6c]/90 to-slate-900/95 backdrop-blur-sm" />
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center">
                {/* Animated Logo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="mb-12"
                >
                    <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 shadow-2xl">
                        <img src={logo} alt="University of Ilorin" className="w-24 h-24 object-contain" />
                    </div>
                </motion.div>

                {/* Text Sequence */}
                {/* Text Sequence */}
                <div className="h-24 flex items-center justify-center gap-2 font-serif text-3xl md:text-5xl font-bold text-white tracking-wide">
                    <div className="text-right min-w-[3.5ch]">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.span
                                    key="we"
                                    variants={textVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="text-yellow-400 inline-block"
                                >
                                    We
                                </motion.span>
                            )}
                            {step === 2 && (
                                <motion.span
                                    key="you"
                                    variants={textVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="text-yellow-400 inline-block"
                                >
                                    You
                                </motion.span>
                            )}
                            {step === 3 && (
                                <motion.span
                                    key="i"
                                    variants={textVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="text-yellow-400 inline-block"
                                >
                                    I
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex gap-2 text-left">
                        <span className="min-w-[1.5ch]">
                            {step === 3 ? "am" : "are"}
                        </span>
                        <span>better by far</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
