"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SpeechRecognitionLanguage = "en-IN" | "kn-IN";

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message?: string;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionResult {
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
    isFinal: boolean;
}

interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
    onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
    onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
    onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
}

interface SpeechRecognitionConstructor {
    new (): SpeechRecognitionInstance;
}

interface WindowWithSpeechRecognition {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

export interface UseSpeechRecognitionReturn {
    supported: boolean;
    listening: boolean;
    transcript: string;
    error: "denied" | "failed" | null;
    start(): void;
    stop(): void;
    reset(): void;
}

export function useSpeechRecognition(lang: SpeechRecognitionLanguage): UseSpeechRecognitionReturn {
    const [supported, setSupported] = useState(false);
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [error, setError] = useState<"denied" | "failed" | null>(null);

    const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

    // Feature detection inside useEffect so SSR and first client render match
    useEffect(() => {
        const win = window as unknown as WindowWithSpeechRecognition;
        const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
        if (SpeechRecognitionClass) {
            setSupported(true);
        }
    }, []);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch {
                    // ignore cleanup errors
                }
            }
        };
    }, []);

    const start = useCallback(() => {
        setError(null);
        const win = window as unknown as WindowWithSpeechRecognition;
        const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

        if (!SpeechRecognitionClass) {
            return;
        }

        if (recognitionRef.current) {
            try {
                recognitionRef.current.abort();
            } catch {
                // ignore
            }
        }

        const recognition = new SpeechRecognitionClass();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = lang;

        recognition.onstart = () => {
            setListening(true);
            setError(null);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let text = "";
            for (let i = 0; i < event.results.length; i++) {
                text += event.results[i][0].transcript;
            }
            setTranscript(text);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            if (event.error === "not-allowed" || event.error === "service-not-allowed") {
                setError("denied");
            } else if (event.error !== "aborted") {
                setError("failed");
            }
            setListening(false);
        };

        recognition.onend = () => {
            setListening(false);
        };

        recognitionRef.current = recognition;

        try {
            recognition.start();
        } catch {
            setError("failed");
            setListening(false);
        }
    }, [lang]);

    const stop = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch {
                // ignore
            }
        }
        setListening(false);
    }, []);

    const reset = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.abort();
            } catch {
                // ignore
            }
        }
        setListening(false);
        setTranscript("");
        setError(null);
    }, []);

    return {
        supported,
        listening,
        transcript,
        error,
        start,
        stop,
        reset,
    };
}
