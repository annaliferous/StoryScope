import { createContext } from "react";
import * as d3 from "d3";

const CHARACTER_COLORS: string[] = ["#51e9eb", "#ed6e52", "#672bea", "#e2cd26", "#29e19e", "#4254fb", "#fa83b4", "#fa4f58"]

let CHARACTER_COUNTER: number = 0;
const CHARACTER_COLOR_MAP: Record<string, string> = {};

/**
 * Associates a predetermined color to any name.
 * @param name Name of the character
 * @returns The associated color of the character or a new color if character doesn't have a color yet.
 */
export function getCharacterColor(name: string): string {
    if (CHARACTER_COLOR_MAP[name])
        return CHARACTER_COLOR_MAP[name];

    CHARACTER_COLOR_MAP[name] = CHARACTER_COLORS[(CHARACTER_COUNTER++) % CHARACTER_COLORS.length];
    return CHARACTER_COLOR_MAP[name];
}

export function setCharacterColor(name: string, value: string) {
    CHARACTER_COLOR_MAP[name] = value;
}

/**
 * D3 color interpolator for sentiment: red (negative) → white (neutral) → green (positive)
 * Use like: interpolateRedGreenWhite(0.5) for a value between 0 and 1
 * @param t Value between 0 (red) and 1 (green), 0.5 is white (neutral)
 * @returns HEX color string
 */
export function interpolateRedGreenWhite(t: number): string {
    const scale = d3.scaleLinear<string>()
        .domain([0, 0.5, 1])
        .range(["#d73027", "#ffffff", "#1a9850"]);
    
    return scale(t);
}
