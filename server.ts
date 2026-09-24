import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";

const PORT = 3000;
const app = express();

app.use(express.json({ limit: "20mb" }));

// Lazy Initialize Gemini Client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const AVAILABLE_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.6-flash",
  "gemini-flash-latest",
];

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

function extractResponseText(response: any): string {
  if (!response) return "";
  if (typeof response.text === "string" && response.text.trim()) {
    return response.text.trim();
  }
  const parts = response.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    const textParts = parts
      .filter((p: any) => p && typeof p.text === "string" && p.text.trim())
      .map((p: any) => p.text);
    if (textParts.length > 0) {
      return textParts.join("\n").trim();
    }
  }
  return "";
}

function parseJsonFromText<T>(text: string, fallback: T): T {
  if (!text) return fallback;
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        return JSON.parse(objMatch[0]) as T;
      } catch {}
    }
    const arrMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrMatch) {
      try {
        return JSON.parse(arrMatch[0]) as T;
      } catch {}
    }
    return fallback;
  }
}

async function callWithFallback<T>(fn: (model: string) => Promise<T>): Promise<T> {
  let lastError: any = null;
  for (const model of AVAILABLE_MODELS) {
    try {
      return await fn(model);
    } catch (err: any) {
      lastError = err;
      console.warn(`Model (${model}) failed, trying next:`, err?.message || err);
    }
  }
  throw lastError;
}

export const buildPrompt = (
  text: string,
  style: string,
  task: string,
  chunkOptions?: {
    chunkIndex?: number;
    totalChunks?: number;
    sectionOffset?: number;
  }
): string => {
  const { chunkIndex = 0, totalChunks = 1, sectionOffset = 1 } = chunkOptions || {};
  const isMultiChunk = totalChunks > 1;
  const isFirstChunk = !isMultiChunk || chunkIndex === 0;
  const isLastChunk = !isMultiChunk || chunkIndex === totalChunks - 1;
  const isMiddleChunk = isMultiChunk && !isFirstChunk && !isLastChunk;
  const currentPartNumber = chunkIndex + 1;

  switch (task) {
    case "General Formatting": {
      let multiChunkDirective = "";
      if (isMultiChunk) {
        if (isFirstChunk) {
          multiChunkDirective = `
            **MULTI-PART PROCESSING INSTRUCTIONS (PART 1 OF ${totalChunks}):**
            - This is PART 1 of an extensive academic paper.
            - Provide the main paper title in \`<h1>\`.
            - Number sections starting at 1. (e.g., 1., 1.1, 2.).
            - Wrap body paragraphs in \`<p>\` and all cited quotes/dialogues in \`<blockquote>\`.
            - DO NOT output a Conclusion (ఉపసంహారం) or Works Cited (ఉపయుక్త గ్రంథసూచి) section in Part 1, as subsequent parts follow.
          `;
        } else if (isMiddleChunk) {
          multiChunkDirective = `
            **MULTI-PART PROCESSING INSTRUCTIONS (PART ${currentPartNumber} OF ${totalChunks}):**
            - This is PART ${currentPartNumber} of an extensive academic paper.
            - DO NOT repeat the main paper \`<h1>\` title.
            - Continue hierarchical section numbering starting around section ${sectionOffset}. (e.g., ${sectionOffset}., ${sectionOffset}.1).
            - Wrap all body paragraphs in \`<p>\` and all cited quotes/dialogues in \`<blockquote>\`.
            - DO NOT output a Conclusion or Works Cited section in this part.
            - Preserve all sentences and paragraphs in full without omission.
          `;
        } else if (isLastChunk) {
          multiChunkDirective = `
            **MULTI-PART PROCESSING INSTRUCTIONS (FINAL PART ${totalChunks} OF ${totalChunks}):**
            - This is the FINAL PART of the extensive academic paper.
            - DO NOT repeat the main paper \`<h1>\` title.
            - Continue hierarchical section numbering starting around section ${sectionOffset}.
            - Wrap body paragraphs in \`<p>\` and all cited quotes/dialogues in \`<blockquote>\`.
            - Mandatory Conclusion Section: Append \`<h2>ఉపసంహారం</h2>\` formatted as an unordered list (bullet points) using \`<ul>\` and \`<li>\` tags.
            - Mandatory Works Cited Section: Append \`<h2>ఉపయుక్త గ్రంథసూచి</h2>\` formatted as a numbered list \`<ol><li>...</li></ol>\` sorted A-Z according to **${style}** style.
          `;
        }
      }

      return `
        Act as an expert academic editor. Your task is to intelligently format and enhance the following research paper text, which contains a mix of English and Telugu.
        ${multiChunkDirective}
        
        **Overall Rules:**
        1.  **Language & Tone:** Throughout the entire process, STRICTLY AVOID using the Telugu words "మరియు" and "యొక్క". Rephrase sentences to eliminate them. When generating new text (like subheadings or conclusions), use simple, understandable Telugu while maintaining a professional, formal, academic tone. Avoid using English or other foreign language words in generated Telugu headings.
        2.  **Output Format:** The final output MUST be a single block of clean, semantic HTML. Do not include \`<html>\`, \`<head>\`, or \`<body>\` tags. Do not use Markdown.
        3.  **STRICTLY NO SHORTENING OR SUMMARIZATION:** You MUST preserve and format the COMPLETE, ENTIRE input text from start to finish. DO NOT shorten, condense, compress, truncate, or summarize the input text in any way. Do NOT omit or skip any paragraphs, discussions, examples, or sentences. Keep the input text as it is without unnecessary summarization.

        **Formatting Rules:**
        1.  **Headings & Subheadings:**
            *   Structure headings hierarchically: \`<h1>\` for the main title (Part 1 only), \`<h2>\` for major sections, \`<h3>\` for subsections.
            *   Apply hierarchical numbering to all headings except the main title (e.g., 1., 1.1, 1.1.1, 2., 2.1). The numbering MUST be part of the heading text itself.
            *   **Crucially, if the input text lacks clear subheadings, you must analyze the content and add suitable, numbered subheadings to improve the paper's structure and readability. These generated subheadings must follow the Language & Tone rules mentioned above.**
        2.  **Paragraphs & Full Content Preservation:**
            *   Wrap all body text in \`<p>\` tags. Ensure paragraphs are well-formed.
            *   **MANDATORY:** Every single paragraph and sentence from the author's input must be present in full. Do not omit any sections or replace them with summaries. Rephrasing is ONLY permitted to remove "మరియు" and "యొక్క" while keeping all other text, ideas, and length completely intact.
        3.  **Citations & Quoted Passages in Blockquotes (CRITICAL MANDATE - MUST BE IN BLOCKQUOTES):**
            *   **Identify ALL textual citations, quoted passages, dialogues, poetry lines, and literature extracts:** Any time the text contains a quotation, dialogue, or cited extract—especially text enclosed in quotation marks like “...” or "..." accompanied by an in-text citation such as \`(రచయిత పుట / Author Page)\`, e.g., \`“(పెన్నేపల్లి 535)”\`, \`“(శర్మ 12)”\`, or any citation with quotation marks—it MUST NOT be left as a running paragraph.
            *   **Extract and format as <blockquote>:** Every single one of these citations and quoted passages MUST be enclosed in a semantic \`<blockquote><p>“...” (In-text Citation)</p></blockquote>\`.
            *   **Concrete Example:**
                If input text contains:
                *“రాముడి ఆజ్ఞ యేలా వుంటే, ఆలా జరుగు గాక. వైష్ణవుడు, శైవుడు కావాలని కోరితే, అడ్డి యేమి కార్యం? కాక కాశీలో మృతి పొందిన వారికి శివుడేకదా, తారక మంత్రోపదేశం చేస్తాడు. గనక యీ జన్మంలో పరమ శైవుడైన వాడికి, వచ్చే జన్మలో తారక మంత్రోపదేశం చేసి, ముక్తి యివ్వకపోతాడా? యే మతవైనా ప్రపత్తి వున్నవాడికి తోవ వుంది. అది లేకుంటే వైష్ణవుడైనా, కార్యం లేదు” (పెన్నేపల్లి 535) అని రంగాచార్యులను అన్న మాటలు గురజాడ అంతరంగాన్ని తెలియజేశాయి.*
                
                You MUST format the cited quote as a blockquote, and place the following or preceding commentary in its own paragraph:
                \`<blockquote><p>“రాముడి ఆజ్ఞ యేలా వుంటే, ఆలా జరుగు గాక. వైష్ణవుడు, శైవుడు కావాలని కోరితే, అడ్డి యేమి కార్యం? కాక కాశీలో మృతి పొందిన వారికి శివుడేకదా, తారక మంత్రోపదేశం చేస్తాడు. గనక యీ జన్మంలో పరమ శైవుడైన వాడికి, వచ్చే జన్మలో తారక మంత్రోపదేశం చేసి, ముక్తి యివ్వకపోతాడా? యే మతవైనా ప్రపత్తి వున్నవాడికి తోవ వుంది. అది లేకుంటే వైష్ణవుడైనా, కార్యం లేదు” (పెన్నేపల్లి 535)</p></blockquote>\`
                \`<p>అని రంగాచార్యులను అన్న మాటలు గురజాడ అంతరంగాన్ని తెలియజేశాయి.</p>\`
            *   **DO NOT MISS ANY CITATION:** Scan the entire paper meticulously. Every single quotation or in-text cited statement must be kept in \`<blockquote>\` tags without missing any.
            *   Text inside \`<blockquote>\` should be wrapped in \`<p>\` tags. Ensure in-text citation details inside the blockquote are preserved according to the **${style}** style.
            *   Do NOT add inline bold/italic tags inside \`<blockquote>\`; visual styling is managed by the application CSS.
        ${!isMultiChunk || isLastChunk ? `
        5.  **Conclusion Section (ఉపసంహారం):**
            *   A conclusion section is mandatory. It must be placed before the 'Works Cited' section.
            *   The content of the conclusion MUST be formatted as an unordered list (bullet points) using \`<ul>\` and \`<li>\` tags.
            *   If a conclusion already exists (e.g., 'Conclusion', 'ఉపసంహారం', 'ముగింపు'), you MUST **keep the existing text as-is** and then **append** your newly generated bullet-point summary after it, all under the single \`<h2>ఉపసంహారం</h2>\` heading.
            *   If no conclusion exists, generate a new one from scratch as a bulleted list.
            *   The section heading must always be \`<h2>ఉపసంహారం</h2>\`.
        6.  **Works Cited Section (ఉపయుక్త గ్రంథసూచి):** This section is critical.
            *   The section heading MUST be \`<h2>ఉపయుక్త గ్రంథసూచి</h2>\`. Do NOT use English headings like "References" or "Works Cited".
            *   All reference items must be in a numbered list using \`<ol>\` and \`<li>\` tags. Do not add any other symbols like asterisks (*) to the list items.
            *   Format each reference item according to the specified **${style}** style, with the following strict rules:
                ${style === "MLA" ? `
                *   **MLA Style Format:** Every single reference item MUST be formatted exactly as follows: \`రచయితపేరు, ఇంటిపేరు. గ్రంథం పేరు, ప్రచురణసంస్థ, ప్రచురణ స్థలం, ప్రచురణ సంవత్సరం.\` (This translates to: Author's Name, Surname. Book Title, Publisher, Place of Publication, Publication Year.).
                *   **Example MLA Entry:** \`<li>కృష్ణదేశికాచార్యులు, తిరుమల. కావ్యనందనం, పాలపిట్ట బుక్స్, హైదరాబాదు, 2013.</li>\`
                ` : `
                *   Format references according to standard APA 7th edition guidelines.
                `}
            *   **Completeness:** You must ensure every in-text citation has a corresponding entry. If a reference is cited in the text but is missing from the bibliography, you must generate the full reference entry based on the available citation information.
            *   **Sorting:** Crucially, sort all reference items alphabetically by the author's last name. Telugu items should be sorted based on the Telugu script order (అ-ఆ, క-ఙ, చ-ఞ, ట-ణ, త-న, ప-మ, య-హ).
        ` : ""}
        7.  **Spacing & Cleanup:** Remove any extra line breaks, weird spacing, or artifacts from the original text. Ensure a clean, professional layout.
        8.  **Other Special Elements:** Format standard lists using \`<ul>\` or \`<ol>\`, and tables using \`<table>\`.

        **Input Text to Format:**
        ---
        ${text}
        ---
      `;
    }
    case "Abstract Analysis":
      return `
        Act as an expert academic editor specializing in Telugu research papers.
        Your task is to analyze and rewrite the provided Telugu abstract and keywords for an academic journal.

        **Instructions:**
        1.  **Rewrite the Abstract:** Improve its clarity, conciseness, flow, and academic tone. Ensure it effectively summarizes the paper's purpose, methods, key findings, and conclusions. The tone should be formal and scholarly.
        2.  **Refine Keywords:** Review the provided keywords and suggest improved or more relevant ones if necessary.
        3.  **Language:** The entire output must be in Telugu.
        4.  **Output Format:** Provide only the rewritten plain text abstract. Do not add any headings like "Abstract" or "Keywords". Do not use any HTML or Markdown.
        
        **Input Abstract and Keywords:**
        ---
        ${text}
        ---
      `;
    case "Generate Abstract & Keywords":
      return `
        Act as an expert AI research assistant specializing in Telugu academic writing. Your task is to read the provided research paper and generate a formal abstract (వ్యాససంగ్రహం) and keywords (కీలకపదాలు).

        **Strict Instructions:**

        1.  **Output Format:** The output MUST be clean HTML. It should start with the abstract heading, followed by the abstract paragraph, then the keywords heading, and finally the keywords paragraph.
            *   Abstract Heading: \`<h2>వ్యాససంగ్రహం</h2>\`
            *   Abstract Body: A single \`<p>\` tag containing the full abstract.
            *   Keywords Heading: \`<h2>Keywords / కీలకపదాలు</h2>\`
            *   Keywords Body: A single \`<p>\` tag containing 5 to 10 comma-separated keywords.

        2.  **Abstract (వ్యాససంగ్రహం) Content:**
            *   The abstract must be written as a **single, concise paragraph** (approximately one page in length).
            *   It must be strictly formal and research-oriented. Do not include unnecessary introductions or preambles.
            *   It MUST cover ONLY the following points, synthesized into a coherent paragraph:
                - పరిశోధనాంశ పరిచయం, పరిశోధన ముఖ్యోద్దేశం, పరిశోధన ఆవశ్యకత, శీర్షిక సమర్థన (Introduction to the research topic, main objective, necessity, and title justification).
                - పూర్వపరిశోధనలు (Previous research: critiques, articles, etc.).
                - విషయసేకరణ వివరాలు (Data collection details: primary and secondary sources).
                - పరిశోధనపద్ధతి, వ్యాసరచన ప్రణాళిక (Research methodology and writing plan/chapter structure).
                - ప్రస్తుత పరిశోధన పరిమితులు, ఫలితాల ప్రకటన, పరిశోధనలో సాధకబాధకాలు, భవిష్యత్తు పరిశోధనలకు సూచనలు (Limitations, results, challenges, and suggestions for future research).
                - For papers on folklore, linguistics, history, or epigraphy, include: క్షేత్రపర్యటన, విషయదాతలు, సందర్శనల చిత్రాలు, ప్రశ్నావళి వివరాలు (Details of field trips, informants, questionnaires, etc.).

        3.  **Keywords (కీలకపదాలు):**
            *   Provide 5 to 10 highly relevant keywords related to the paper.
            *   Example keywords: సాహిత్యం, కవిత్వం, నవల, సామాజికత, ప్రాచీనసాహిత్యం, పద్యం, నాటకం.

        4.  **Language Rules:**
            *   The entire output must be in Telugu.
            *   **Crucially, AVOID using the words "మరియు" and "యొక్క".** Rephrase sentences to eliminate them.

        **Input Research Paper:**
        ---
        ${text}
        ---
      `;
    case "Reference Analysis":
      return `
        You are an expert academic citation formatting and bibliographic system. Your task is to format and sort a list of references according to the specified **${style}** style meant for References / Bibliography (ఉపయుక్త గ్రంథసూచి), arranging the entries strictly into A-Z alphabetical order.

        **MANDATORY WORKFLOW:**

        **Step 1: Format Each Entry According to ${style} Rules**
        Process every single reference from the input list individually to create a fully formatted HTML \`<li>\` element:
        1.  **Author Names (Mandatory Pattern):** Format author names using the pattern: \`[Given Name(s)], [Surname].\` (e.g., "పోణంగి శ్రీరామ అప్పారావు" becomes "శ్రీరామ అప్పారావు, పోణంగి.").
        2.  **Citation Style Format (${style} for References/Bibliography):**
            ${style === "MLA" ? `
            *   **MLA Format:** Follow standard MLA citation style for References / Works Cited:
                - Structure: \`[రచయితపేరు, ఇంటిపేరు]. <em>[గ్రంథం పేరు / Title in Italics]</em>, [ప్రచురణసంస్థ / Publisher], [ప్రచురణ స్థలం / Place], [ప్రచురణ సంవత్సరం / Year].\`
                - Book/Journal titles MUST be enclosed in \`<em>\` tags (e.g., \`<em>కావ్యనందనం</em>\`).
                - Example: \`<li>శ్రీరామ అప్పారావు, పోణంగి. <em>తెలుగు నాటక వికాసము</em>, పొట్టి శ్రీరాములు తెలుగు విశ్వవిద్యాలయం, హైదరాబాదు, 2012.</li>\`
            ` : `
            *   **APA Format:** Follow standard APA (7th edition) citation style for References / Bibliography:
                - Structure: \`[రచయితపేరు, ఇంటిపేరు]. ([ప్రచురణ సంవత్సరం / Year in parentheses]). <em>[గ్రంథం పేరు / Title in Italics]</em>. [ప్రచురణసంస్థ / Publisher], [ప్రచురణ స్థలం / Place].\`
                - Publication year MUST appear in parentheses right after the author name (e.g., \`(2012).\`).
                - Book/Journal titles MUST be enclosed in \`<em>\` tags (e.g., \`<em>తెలుగు నాటక వికాసము</em>\`).
                - Example: \`<li>శ్రీరామ అప్పారావు, పోణంగి. (2012). <em>తెలుగు నాటక వికాసము</em>. పొట్టి శ్రీరాములు తెలుగు విశ్వవిద్యాలయం, హైదరాబాదు.</li>\`
            `}
        3.  **Content Completeness & Cleanup:**
            - Preserve all original bibliographic information (author names, book/article titles, publisher, city, year, page numbers). Do not drop any references from the input.
            - Ensure the HTML for each list item is clean without asterisks (*), bullets, or stray markdown characters.

        **Step 2: Arrange the Entire List into Strict A-Z Order**
        After formatting each entry into a \`<li>\` element, you MUST sort the complete list into strict **A-Z alphabetical order** based on the first word of each citation entry (the author's name):
        - **Telugu Entries (అ-హ Order):** Sort according to the standard Telugu alphabetical order (వర్ణమాల: అ, ఆ, ఇ, ఈ, ఉ, ఊ, ఋ, ఎ, ఏ, ఐ, ఒ, ఓ, ఔ, అం, క, ఖ, గ, ఘ, చ, ఛ, జ, ఝ, ట, ఠ, డ, ఢ, ణ, త, థ, ద, ధ, న, ప, ఫ, బ, భ, మ, య, ర, ల, వ, శ, ష, స, హ, ళ, క్ష, ఱ).
        - **English Entries (A-Z Order):** Sort in standard alphabetical order from A to Z.
        - **Combined Sorting:** Ensure all entries are strictly in alphabetical (A-Z / అ-హ) order throughout the list. Every input item MUST be included in the sorted output.

        **Final Output Format:**
        Your entire output MUST be clean semantic HTML:
        \`<h2>ఉపయుక్త గ్రంథసూచి</h2>\`
        \`<ol>\`
          \`<li>...</li>\`
          \`<li>...</li>\`
        \`</ol>\`
        Do NOT wrap the output in markdown code blocks (\`\`\`), and do not include explanations or preambles. Output raw HTML only.

        **Input List to Process:**
        ---
        ${text}
        ---
      `;
    default:
      return text;
  }
};

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Format Stream API (Server-Sent Events)
app.post("/api/gemini/format-stream", async (req, res) => {
  const { rawText, citationStyle, task, promptToUse, chunkIndex, totalChunks, sectionOffset } = req.body;
  if (!rawText && !promptToUse) {
    res.status(400).json({ error: "Input text is required" });
    return;
  }

  const prompt = promptToUse || buildPrompt(rawText, citationStyle, task, { chunkIndex, totalChunks, sectionOffset });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  let hasYielded = false;

  const isDisconnected = () => {
    return req.socket.destroyed || res.writableEnded;
  };

  for (const modelName of AVAILABLE_MODELS) {
    if (isDisconnected()) break;

    try {
      console.log(`[FormatStream] Starting stream with model: ${modelName}`);
      const stream = await getAI().models.generateContentStream({
        model: modelName,
        contents: prompt,
        config: {
          safetySettings,
          maxOutputTokens: 65536,
          temperature: 0.1,
        },
      });

      for await (const chunk of stream) {
        if (isDisconnected()) {
          console.log(`[FormatStream] Client disconnected during stream for ${modelName}`);
          break;
        }

        let chunkText = chunk.text;
        if (!chunkText && chunk.candidates?.[0]?.content?.parts) {
          chunkText = chunk.candidates[0].content.parts.map((p: any) => p?.text || "").join("");
        }
        if (chunkText) {
          hasYielded = true;
          res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        }
      }

      if (hasYielded) {
        console.log(`[FormatStream] Stream successfully completed with ${modelName}`);
        break;
      }
    } catch (e: any) {
      if (isDisconnected()) {
        break;
      }
      console.warn(`[FormatStream] Streaming model ${modelName} error:`, e?.message || e);
    }
  }

  if (!res.writableEnded) {
    if (!hasYielded) {
      res.write(`data: ${JSON.stringify({ error: "The AI returned an empty response. Please try simplifying your input." })}\n\n`);
    } else {
      res.write("data: [DONE]\n\n");
    }
    res.end();
  }
});

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
