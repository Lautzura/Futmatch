
import { GoogleGenAI } from "@google/genai";
import { Profile, SkillLevel } from '../types';

export const generateTeamBio = async (name: string, style: string, level: SkillLevel): Promise<string> => {
    try {
        // Fix: Initialize GoogleGenAI inside the function to ensure the most up-to-date API key is used
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Escribe una biografía corta, divertida y atractiva para un perfil de una app de fútbol amateur (tipo Tinder).
        Nombre del equipo/jugador: ${name}
        Estilo de juego: ${style}
        Nivel: ${level}
        
        Máximo 25 palabras. Usa emojis de fútbol.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });

        return response.text ? response.text.trim() : "";
    } catch (error) {
        console.error("Error generating bio:", error);
        return "Error generando descripción.";
    }
};

export const generateLogoPrompt = async (name: string, type: string): Promise<string> => {
    try {
        // Fix: Initialize GoogleGenAI inside the function to ensure the most up-to-date API key is used
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Create a short, vivid, English description for a modern, minimalist esports-style football logo for a team named "${name}". 
        Focus on colors, mascot, or symbol that fits the name. 
        Do not include text in the description, just visual elements. 
        Example output: "A fierce blue lion roaring with a soccer ball, neon style vector art".`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });

        return response.text ? response.text.trim() : "soccer ball minimal logo vector";
    } catch (error) {
        console.error("Error generating logo prompt:", error);
        return "soccer ball logo";
    }
};

export const generateTeamLogo = async (description: string): Promise<string | null> => {
    try {
        // Fix: Initialize GoogleGenAI inside the function to ensure the most up-to-date API key is used
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: `A professional vector logo, flat design, white background, for a football team. ${description}` }]
            },
        });
        
        for (const candidate of response.candidates || []) {
             for (const part of candidate.content.parts) {
                 if (part.inlineData) {
                     return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                 }
             }
        }
        return null;
    } catch (e) {
        console.error("Error generating image:", e);
        return null;
    }
};

export const analyzeOpponent = async (myProfile: Profile, opponentProfile: Profile): Promise<string> => {
    try {
        // Fix: Initialize GoogleGenAI inside the function to ensure the most up-to-date API key is used
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Actúa como un comentarista de fútbol experto y sarcástico.
        Compara estos dos perfiles para un posible partido:
        
        MI EQUIPO: ${myProfile.name} (${myProfile.skillLevel}, ${myProfile.description})
        RIVAL: ${opponentProfile.name} (${opponentProfile.skillLevel}, ${opponentProfile.description}, Stats: ${opponentProfile.stats.wins} victorias en ${opponentProfile.stats.matchesPlayed} partidos).

        Dame 3 consejos tácticos breves para ganarles y una predicción graciosa del resultado.
        Formato JSON.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        return response.text || "";
    } catch (error) {
        console.error("Error analyzing opponent:", error);
        return JSON.stringify({ error: "No se pudo analizar al rival." });
    }
};

export interface FieldResult {
    title: string;
    address: string;
    uri: string;
    rating?: string;
    type: 'INDOOR' | 'OUTDOOR'; // New property
}

export const searchFootballFields = async (location: string): Promise<FieldResult[]> => {
    try {
        // Fix: Initialize GoogleGenAI inside the function to ensure the most up-to-date API key is used
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Busca las mejores canchas de fútbol 5, 7 y 11 en ${location}, Buenos Aires. 
        Prioriza lugares populares.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleMaps: {} }],
            },
        });

        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        const fields: FieldResult[] = chunks
            .filter(chunk => chunk.maps) 
            .map(chunk => {
                const title = chunk.maps?.title || "Cancha sin nombre";
                const isIndoor = title.toLowerCase().includes('techada') || 
                                 title.toLowerCase().includes('indoor') || 
                                 title.toLowerCase().includes('cubierta') ||
                                 Math.random() > 0.5;

                return {
                    title: title,
                    address: "Buenos Aires, Argentina", 
                    uri: chunk.maps?.uri || "#",
                    rating: "4.5",
                    type: isIndoor ? 'INDOOR' : 'OUTDOOR'
                };
            });

        const uniqueFields = fields.filter((field, index, self) =>
            index === self.findIndex((t) => (
                t.title === field.title
            ))
        );

        return uniqueFields;

    } catch (error) {
        console.error("Error searching fields:", error);
        return [];
    }
};

export interface TacticalAdvice {
    formation: string;
    explanation: string;
    keyPoints: string[];
}

export const getTacticalAdvice = async (query: string): Promise<TacticalAdvice> => {
    try {
        // Fix: Initialize GoogleGenAI inside the function to ensure the most up-to-date API key is used
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Actúa como un director técnico de fútbol experto.
        El usuario tiene este problema: "${query}".
        
        Responde en formato JSON con la siguiente estructura:
        {
            "formation": "string (ej: 2-2, 1-2-1, 3-1)",
            "explanation": "string (breve explicación de por qué usar esta táctica)",
            "keyPoints": ["string", "string", "string"] (3 claves para ejecutarla)
        }`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
             config: {
                responseMimeType: "application/json"
            }
        });

        const text = response.text || "{}";
        return JSON.parse(text);
    } catch (error) {
        console.error("Error getting tactics:", error);
        return {
            formation: "2-1-2",
            explanation: "Hubo un error al procesar la táctica. Jugaremos con la clásica.",
            keyPoints: ["Mantener el orden", "Divertirse", "Pasar la pelota"]
        };
    }
};

export interface TrainingDrill {
    title: string;
    duration: string;
    explanation: string;
    setup: string;
    elements: { type: 'player' | 'cone' | 'ball'; x: number; y: number; label?: string }[];
}

export const getTrainingDrill = async (query: string): Promise<TrainingDrill> => {
    try {
        // Fix: Initialize GoogleGenAI inside the function to ensure the most up-to-date API key is used
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Actúa como un preparador físico de fútbol.
        El usuario quiere entrenar esto: "${query}".
        
        Diseña un ejercicio de entrenamiento. Devuelve un JSON con:
        {
            "title": "Nombre del ejercicio",
            "duration": "Duración (ej: 15 min)",
            "explanation": "Instrucciones paso a paso",
            "setup": "Materiales necesarios",
            "elements": [
                { "type": "player", "x": 50, "y": 80, "label": "J1" },
                { "type": "cone", "x": 50, "y": 50, "label": "C1" },
                { "type": "ball", "x": 55, "y": 80 }
            ]
        }
        Las coordenadas x, y van de 0 a 100 (x: horizontal, y: vertical). 
        Genera al menos 4-5 elementos para visualizarlo bien en la pizarra.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });
        
        const text = response.text || "{}";
        return JSON.parse(text);
    } catch (error) {
         console.error("Error getting drill:", error);
         return {
            title: "Rondo Básico",
            duration: "10 min",
            explanation: "Hacer un círculo y pasar la pelota sin que el del medio la toque.",
            setup: "4 Conos, 1 Pelota",
            elements: [
                { type: 'cone', x: 30, y: 30 },
                { type: 'cone', x: 70, y: 30 },
                { type: 'cone', x: 30, y: 70 },
                { type: 'cone', x: 70, y: 70 },
                { type: 'player', x: 50, y: 50, label: 'Def' },
                { type: 'ball', x: 35, y: 35 }
            ]
         };
    }
};