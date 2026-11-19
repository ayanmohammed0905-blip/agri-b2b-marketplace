"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useSpeechRecognition, type SpeechRecognitionLanguage } from "@/lib/voice/useSpeechRecognition";
import { parseListing, type ParsedListing } from "@/lib/voice/parseListing";
import { cn } from "@/lib/utils";

export interface VoiceListingPanelProps {
    onParsed(fields: ParsedListing): void;
}

export function VoiceListingPanel({ onParsed }: VoiceListingPanelProps) {
    const { language, t } = useLanguage();
    const speechLang: SpeechRecognitionLanguage = language === "kn" ? "kn-IN" : "en-IN";

    const {
        supported,
        listening,
        transcript,
        error,
        start,
        stop,
    } = useSpeechRecognition(speechLang);

    const [typedText, setTypedText] = useState("");
    const [lastFound, setLastFound] = useState<ParsedListing | null>(null);

    const prevListeningRef = useRef(listening);

    const executeParse = (textToParse: string) => {
        const fields = parseListing(textToParse);
        const hasField =
            fields.crop !== undefined ||
            fields.quantity !== undefined ||
            fields.unit !== undefined ||
            fields.askingPrice !== undefined;

        if (!hasField) {
            toast.error(t("voiceNothing"));
        } else {
            setLastFound(fields);
            onParsed(fields);
            toast.success(t("voiceFilled"));
        }
    };

    // When speech ends and a transcript exists, parse it automatically
    useEffect(() => {
        if (prevListeningRef.current && !listening) {
            if (transcript.trim()) {
                executeParse(transcript);
            }
        }
        prevListeningRef.current = listening;
    }, [listening, transcript]);

    // Toast errors if mic fails
    useEffect(() => {
        if (error === "denied") {
            toast.error(t("micDenied"));
        } else if (error === "failed") {
            toast.error(t("voiceError"));
        }
    }, [error, t]);

    const handleTypedSubmit = () => {
        if (typedText.trim()) {
            executeParse(typedText);
        }
    };

    return (
        <Card className="border-primary/20 bg-primary/5 p-6">
            <CardHeader className="p-0 pb-4">
                <CardTitle className="text-xl font-bold text-foreground">
                    {t("voiceTitle")}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                    {t("voiceHint")}
                </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-5 p-0">
                {/* Voice button or unsupported notice */}
                {supported ? (
                    <div className="flex flex-col items-center gap-3 py-2">
                        <Button
                            type="button"
                            size="lg"
                            variant={listening ? "destructive" : "default"}
                            onClick={listening ? stop : start}
                            className={cn(
                                "min-h-16 w-full sm:w-auto px-8 text-lg font-bold gap-3 rounded-xl transition-all shadow-md",
                                listening && "animate-pulse"
                            )}
                        >
                            {listening ? (
                                <MicOff className="size-6 shrink-0" />
                            ) : (
                                <Mic className="size-6 shrink-0" />
                            )}
                            <span>{listening ? t("stopListening") : t("startListening")}</span>
                        </Button>

                        {listening && (
                            <div className="flex items-center gap-2 text-sm font-semibold text-primary animate-pulse">
                                <span className="size-2.5 rounded-full bg-primary" />
                                <span>{t("listening")}</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="rounded-lg border border-border bg-muted/60 p-4 text-base text-muted-foreground">
                        {t("voiceUnsupported")}
                    </div>
                )}

                {/* Error notice */}
                {error === "denied" && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                        {t("micDenied")}
                    </div>
                )}
                {error === "failed" && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                        {t("voiceError")}
                    </div>
                )}

                {/* Always show the transcript under heardText */}
                <div className="flex flex-col gap-1.5">
                    <Label className="text-sm font-medium text-muted-foreground">
                        {t("heardText")}
                    </Label>
                    <div className="min-h-12 w-full rounded-lg border border-border bg-background p-3 text-base">
                        {transcript ? (
                            <p className="text-foreground">{transcript}</p>
                        ) : (
                            <p className="text-muted-foreground italic">—</p>
                        )}
                    </div>
                </div>

                {/* Textarea typed route */}
                <div className="flex flex-col gap-2 pt-2">
                    <Label htmlFor="typeInstead" className="text-base font-medium">
                        {t("typeInstead")}
                    </Label>
                    <Textarea
                        id="typeInstead"
                        value={typedText}
                        onChange={(e) => setTypedText(e.target.value)}
                        placeholder={t("voiceHint")}
                        className="min-h-20 text-base bg-background"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={handleTypedSubmit}
                        disabled={!typedText.trim()}
                        className="min-h-12 w-full sm:w-auto self-start text-base font-semibold"
                    >
                        {t("fillForm")}
                    </Button>
                </div>

                {/* Found fields badges */}
                {lastFound && (
                    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                        <span className="text-sm font-medium text-muted-foreground">
                            {t("voiceFound")}:
                        </span>
                        {lastFound.crop && (
                            <Badge variant="secondary" className="px-2.5 py-1 text-sm font-semibold">
                                {lastFound.crop}
                            </Badge>
                        )}
                        {lastFound.quantity !== undefined && (
                            <Badge variant="secondary" className="px-2.5 py-1 text-sm font-semibold">
                                {lastFound.quantity} {lastFound.unit ?? "kg"}
                            </Badge>
                        )}
                        {lastFound.askingPrice !== undefined && (
                            <Badge variant="secondary" className="px-2.5 py-1 text-sm font-semibold">
                                ₹{lastFound.askingPrice}
                            </Badge>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
