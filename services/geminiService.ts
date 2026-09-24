import { CitationStyle, FormattingTask } from "../types";

export const buildPrompt = (text: string, style: CitationStyle, task: FormattingTask): string => {
  switch (task) {
    case FormattingTask.General:
      return `
        Act as an expert academic editor. Your task is to intelligently format and enhance the following research paper text, which contains a mix of English and Telugu.
        
        **Overall Rules:**
        1.  **Language & Tone:** Throughout the entire process, STRICTLY AVOID using the Telugu words "మరియు" and "యొక్క". Rephrase sentences to eliminate them. When generating new text (like subheadings or conclusions), use simple, understandable Telugu while maintaining a professional, formal, academic tone. Avoid using English or other foreign language words in generated Telugu headings.
        2.  **Output Format:** The final output MUST be a single block of clean, semantic HTML. Do not include \`<html>\`, \`<head>\`, or \`<body>\` tags. Do not use Markdown.
        3.  **STRICTLY NO SHORTENING OR SUMMARIZATION:** You MUST preserve and format the COMPLETE, ENTIRE input text from start to finish. DO NOT shorten, condense, compress, truncate, or summarize the input text in any way. Do NOT omit or skip any paragraphs, discussions, examples, or sentences. Keep the input text as it is without unnecessary summarization.

        **Formatting Rules:**
        1.  **Headings & Subheadings:**
            *   Structure headings hierarchically: \`<h1>\` for the main title, \`<h2>\` for major sections, \`<h3>\` for subsections.
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
                ${style === CitationStyle.MLA ? `
                *   **MLA Style Format:** Every single reference item MUST be formatted exactly as follows: \`రచయితపేరు, ఇంటిపేరు. గ్రంథం పేరు, ప్రచురణసంస్థ, ప్రచురణ స్థలం, ప్రచురణ సంవత్సరం.\` (This translates to: Author's Name, Surname. Book Title, Publisher, Place of Publication, Publication Year.).
                *   **Example MLA Entry:** \`<li>కృష్ణదేశికాచార్యులు, తిరుమల. కావ్యనందనం, పాలపిట్ట బుక్స్, హైదరాబాదు, 2013.</li>\`
                ` : `
                *   Format references according to standard APA 7th edition guidelines.
                `}
            *   **Completeness:** You must ensure every in-text citation has a corresponding entry. If a reference is cited in the text but is missing from the bibliography, you must generate the full reference entry based on the available citation information.
            *   **Sorting:** Crucially, sort all reference items alphabetically by the author's last name. Telugu items should be sorted based on the Telugu script order (అ-ఆ, క-ఙ, చ-ఞ, ట-ణ, త-న, ప-మ, య-హ).
        7.  **Spacing & Cleanup:** Remove any extra line breaks, weird spacing, or artifacts from the original text. Ensure a clean, professional layout.
        8.  **Other Special Elements:** Format standard lists using \`<ul>\` or \`<ol>\`, and tables using \`<table>\`.

        **Input Text to Format:**
        ---
        ${text}
        ---
      `;
    case FormattingTask.Abstract:
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
    case FormattingTask.GenerateAbstract:
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
    case FormattingTask.ReferenceAnalysis:
      return `
        You are an expert academic citation formatting and bibliographic system. Your task is to format and sort a list of references according to the specified **${style}** style meant for References / Bibliography (ఉపయుక్త గ్రంథసూచి), arranging the entries strictly into A-Z alphabetical order.

        **MANDATORY WORKFLOW:**

        **Step 1: Format Each Entry According to ${style} Rules**
        Process every single reference from the input list individually to create a fully formatted HTML \`<li>\` element:
        1.  **Author Names (Mandatory Pattern):** Format author names using the pattern: \`[Given Name(s)], [Surname].\` (e.g., "పోణంగి శ్రీరామ అప్పారావు" becomes "శ్రీరామ అప్పారావు, పోణంగి.").
        2.  **Citation Style Format (${style} for References/Bibliography):**
            ${style === CitationStyle.MLA ? `
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

export function splitTextIntoChunks(text: string, maxWordsPerChunk = 700): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length <= maxWordsPerChunk) {
    return [trimmed];
  }

  // Split at paragraph breaks (double newlines)
  const paragraphs = trimmed.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentWordCount = 0;

  for (const para of paragraphs) {
    const paraWords = para.trim().split(/\s+/).filter(Boolean).length;
    if (paraWords === 0) continue;

    if (paraWords > maxWordsPerChunk) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join("\n\n"));
        currentChunk = [];
        currentWordCount = 0;
      }

      // Split large single paragraph by sentence boundaries
      const sentences = para.match(/[^.!?।\n]+[.!?।\n]+/g) || [para];
      let subChunk: string[] = [];
      let subWords = 0;

      for (const sent of sentences) {
        const sentWordCount = sent.trim().split(/\s+/).filter(Boolean).length;
        if (subWords + sentWordCount > maxWordsPerChunk && subChunk.length > 0) {
          chunks.push(subChunk.join(" ").trim());
          subChunk = [sent];
          subWords = sentWordCount;
        } else {
          subChunk.push(sent);
          subWords += sentWordCount;
        }
      }
      if (subChunk.length > 0) {
        chunks.push(subChunk.join(" ").trim());
      }
      continue;
    }

    if (currentWordCount + paraWords > maxWordsPerChunk && currentChunk.length > 0) {
      chunks.push(currentChunk.join("\n\n"));
      currentChunk = [para];
      currentWordCount = paraWords;
    } else {
      currentChunk.push(para);
      currentWordCount += paraWords;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join("\n\n"));
  }

  return chunks.length > 0 ? chunks : [trimmed];
}

export function splitReferencesIntoChunks(text: string, maxPerChunk = 25): string[] {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length <= maxPerChunk) {
    return [text];
  }

  const chunks: string[] = [];
  for (let i = 0; i < lines.length; i += maxPerChunk) {
    chunks.push(lines.slice(i, i + maxPerChunk).join("\n"));
  }
  return chunks;
}

async function* streamDirectFromGemini(
  promptText: string,
  apiKey: string,
  signal?: AbortSignal
): AsyncGenerator<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        temperature: 0.2,
      },
    }),
    signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error?.message || `Gemini API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("Unable to read streaming response from Gemini API.");
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    if (signal?.aborted) return;
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      const dataPayload = trimmed.slice(6);
      try {
        const parsed = JSON.parse(dataPayload);
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) yield text;
      } catch {}
    }
  }
}

async function* fetchSingleStream(
  payload: any,
  signal?: AbortSignal
): AsyncGenerator<string> {
  if (signal?.aborted) return;

  let response: Response;
  try {
    response = await fetch("/api/gemini/format-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (netErr: any) {
    // If backend is completely unreachable (e.g. static host without server)
    const viteKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (viteKey) {
      const prompt = payload.promptToUse || buildPrompt(payload.rawText, payload.citationStyle, payload.task, {
        chunkIndex: payload.chunkIndex,
        totalChunks: payload.totalChunks,
        sectionOffset: payload.sectionOffset,
      });
      yield* streamDirectFromGemini(prompt, viteKey, signal);
      return;
    }
    throw new Error("Unable to reach backend server. If hosting on static GitHub Pages, set VITE_GEMINI_API_KEY or deploy with a Node.js backend.");
  }

  if (response.status === 404) {
    const viteKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (viteKey) {
      const prompt = payload.promptToUse || buildPrompt(payload.rawText, payload.citationStyle, payload.task, {
        chunkIndex: payload.chunkIndex,
        totalChunks: payload.totalChunks,
        sectionOffset: payload.sectionOffset,
      });
      yield* streamDirectFromGemini(prompt, viteKey, signal);
      return;
    }
    throw new Error(
      "Backend server not found (HTTP 404). Note: GitHub Pages is a static host and cannot run Node.js backend routes. To use the app on GitHub Pages, configure the VITE_GEMINI_API_KEY secret in your repository, or host the app on Cloud Run / Docker."
    );
  }

  if (!response.ok) {
    const errJson = await response.json().catch(() => null);
    throw new Error(errJson?.error || `Formatting failed with status ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Unable to read streaming response from server.");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    if (signal?.aborted) {
      try {
        await reader.cancel();
      } catch {}
      return;
    }

    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      const dataPayload = trimmed.slice(6);
      if (dataPayload === "[DONE]") return;

      try {
        const parsed = JSON.parse(dataPayload);
        if (parsed.error) {
          throw new Error(parsed.error);
        }
        if (parsed.text) {
          yield parsed.text;
        }
      } catch (parseErr: any) {
        if (parseErr.message && !parseErr.message.includes("JSON")) {
          throw parseErr;
        }
      }
    }
  }
}

export interface StreamOptions {
  signal?: AbortSignal;
  onProgress?: (info: {
    currentChunk: number;
    totalChunks: number;
    percent: number;
    statusText: string;
  }) => void;
  promptToUse?: string;
}

export async function* formatTextStream(
  rawText: string,
  citationStyle: CitationStyle,
  task: FormattingTask,
  options?: StreamOptions
): AsyncGenerator<string> {
  const signal = options?.signal;
  const onProgress = options?.onProgress;
  const promptToUse = options?.promptToUse;

  if (signal?.aborted) return;

  try {
    // If a custom prompt is provided, pass directly
    if (promptToUse) {
      yield* fetchSingleStream({ promptToUse }, signal);
      return;
    }

    // Chunking for Reference Analysis with many items
    if (task === FormattingTask.ReferenceAnalysis) {
      const refChunks = splitReferencesIntoChunks(rawText, 25);
      if (refChunks.length > 1) {
        let accumulatedLis = "";
        for (let i = 0; i < refChunks.length; i++) {
          if (signal?.aborted) return;
          onProgress?.({
            currentChunk: i + 1,
            totalChunks: refChunks.length,
            percent: Math.round((i / refChunks.length) * 100),
            statusText: `Formatting bibliography batch ${i + 1} of ${refChunks.length}...`,
          });

          for await (const chunk of fetchSingleStream(
            {
              rawText: refChunks[i],
              citationStyle,
              task,
              chunkIndex: i,
              totalChunks: refChunks.length,
            },
            signal
          )) {
            accumulatedLis += chunk;
          }
        }

        // Extract individual <li> items and sort them alphabetically
        const liMatches = accumulatedLis.match(/<li[\s\S]*?<\/li>/gi) || [];
        const cleanLis = liMatches.map(li => li.trim());
        cleanLis.sort((a, b) => {
          const textA = a.replace(/<[^>]+>/g, "").trim();
          const textB = b.replace(/<[^>]+>/g, "").trim();
          return textA.localeCompare(textB, "te");
        });

        const combinedOutput = `<h2>ఉపయుక్త గ్రంథసూచి</h2>\n<ol>\n  ${cleanLis.join("\n  ")}\n</ol>`;
        yield combinedOutput;
        return;
      }
    }

    // Chunking for General Formatting when input text exceeds words limit / pages
    if (task === FormattingTask.General) {
      const textChunks = splitTextIntoChunks(rawText, 700);
      if (textChunks.length > 1) {
        for (let i = 0; i < textChunks.length; i++) {
          if (signal?.aborted) return;
          onProgress?.({
            currentChunk: i + 1,
            totalChunks: textChunks.length,
            percent: Math.round((i / textChunks.length) * 100),
            statusText: `Formatting Part ${i + 1} of ${textChunks.length}...`,
          });

          if (i > 0) {
            yield "\n\n";
          }

          yield* fetchSingleStream(
            {
              rawText: textChunks[i],
              citationStyle,
              task,
              chunkIndex: i,
              totalChunks: textChunks.length,
              sectionOffset: (i * 2) + 1,
            },
            signal
          );
        }
        return;
      }
    }

    // Default single-pass stream
    yield* fetchSingleStream(
      { rawText, citationStyle, task },
      signal
    );
  } catch (error: any) {
    if (signal?.aborted || error?.name === "AbortError" || error?.message?.includes("aborted")) {
      return;
    }
    console.error("Error in formatTextStream:", error);
    if (error instanceof Error) {
      throw new Error(`An error occurred while formatting: ${error.message}`);
    }
    throw new Error("An unknown error occurred while formatting text.");
  }
}
