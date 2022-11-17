import { marked } from "marked";
import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";
import pako from "pako";
import fetch from "node-fetch";

const KROKI_SERVICE_URL = "https://kroki.io";
const KROKI_DIAGRAM_LANGUAGE = "plantuml"
const KROKI_DIAGRAMM_INFOSTRING = "diagramm-plantuml";
const KROKI_OUTPUT_FORMAT = "svg";

const w = new JSDOM("").window as unknown as Window;
const purify = DOMPurify(w);


const purifyConfig = { // Alowed Tags and Attributes inside markdown
    ADD_TAGS: ["iframe"],
    ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling"],
};

const walkTokens = async (token: any) => {
    if (token.type === "code" && token.lang === KROKI_DIAGRAMM_INFOSTRING) {
        const inputText = token.text;
        const data = Buffer.from(inputText, "utf8");
        const compressed = pako.deflate(data, { level: 9 });
        const res = Buffer.from(compressed)
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");
        const svg = await fetch(`${KROKI_SERVICE_URL}/${KROKI_DIAGRAM_LANGUAGE}/${KROKI_OUTPUT_FORMAT}/${res}`);
        const txt = await svg.text();
        token.text = txt;
    }
};

const renderer = {
    code(code: any, infostring: any) {
        if (infostring === KROKI_DIAGRAMM_INFOSTRING) {
            return code
        }
        return false;
    }
};

marked.use({ walkTokens, async: true });
marked.use({ renderer });

export async function sanitizeHtml(dirty: string): Promise<string> {
    const rawHtml = await marked.parse(dirty);
    return purify.sanitize(rawHtml, purifyConfig);
}