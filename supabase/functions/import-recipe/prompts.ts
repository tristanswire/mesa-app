export const FULL_PARSE_PROMPT = `RESPONSE FORMAT: Output ONLY a single JSON object. No prose, no fences, no explanation. Start with { and end with }.

Extract a structured recipe from HTML.

JSON shape:
{
  "title": "string",
  "duration": "30 min" or "1 hr 20 min",
  "servings": number,
  "tag": "Weeknight" | "Quick" | "Dessert" | "Side" | "Breakfast" | "Slow-cooker" | "Vegetarian" | null,
  "category": "breakfast" | "lunch" | "dinner" | "dessert" | "snack" | "drink" | "side" | "appetizer" | "other",
  "imageUrl": "https://..." or null,
  "ingredients": [{ "amount": "2 tbsp", "name": "olive oil", "prep": "minced" or null }],
  "steps": [{ "segments": [...], "ingredients": [...], "timers": [...] }],
  "prepItems": [{ "label": "Preheat oven to 425°F", "duration": "20 min" or null, "defaultChecked": false }],
  "tools": [{ "name": "Cast Iron Skillet", "price": "$45", "partner": "Amazon" }]
}

Step segments concatenate to the full instruction:
- {"type":"text","content":"Heat "}
- {"type":"ingredient","ingredientId":"ing-1"} (reference an item in this step's ingredients array)
- {"type":"text","content":" in a skillet, then bake "}
- {"type":"timer","timerId":"timer-1"} (reference an item in this step's timers array)
- {"type":"text","content":" until fragrant."}

Each step's "ingredients" array: [{"id":"ing-1","display":"2 tbsp olive oil"}]

CHIP DISPLAY RULES (critical):
- Each ingredient chip "display" must be SHORT — max 25 characters
- Format: amount + simple ingredient name only (e.g., "2 tbsp olive oil", "1 cup flour", "5 large eggs")
- DO NOT include detailed descriptions, prep notes, or qualifiers in chip display
- Example: ingredient is "8 (3/4-inch-thick) slices brioche, country-style white bread, preferably stale" → chip display should be "8 slices brioche"
- Example: ingredient is "3/4 cup sweet wine, like Malaga or cream sherry" → chip display should be "3/4 cup sweet wine"

Each step's "timers" array: [{"id":"timer-1","label":"bake 18 min","durationSeconds":1080}]

TIMER LABEL RULES:
- Timer label must be SHORT — max 20 characters
- Format: action + duration (e.g., "bake 18 min", "simmer 30 min", "rest 10 min")

CONSTRAINTS:
- Maximum 8 prep items
- Maximum 3 tools
- Tag must be from the enum above; null if no clean fit
- Category must be exactly one of the lowercase values listed; default to "other" if genuinely ambiguous, never null, never invented
- Each step's text segments should be concise — extract the action, omit narrative

PREP ITEM EXTRACTION:
Prep items are anything the cook can finish BEFORE active stovetop/oven work begins. Include all that apply, deduped:
- Knife work: dice, chop, mince, slice, cut, halve, quarter, crush, smash, grate, shred, zest, peel, trim, core, seed, devein, butterfly, pound, score, cube
- Temperature prep: "Preheat oven/grill/broiler to <temp>", "Bring <ingredient> to room temp", "Soften butter", "Melt butter"
- Measuring / staging: "Measure out <spices>", "Set aside <ingredient>", "Gather <items>"
- Soaking / marinating: "Marinate <protein>", "Soak <ingredient>"
- Pre-cook combining: "Whisk together <X>", "Stir together <X>", "Combine <X>" — ONLY when the combining happens before any heat verb in the recipe; do NOT include mid-cook stirring
Label format: imperative verb + short object phrase ("Dice onion", "Preheat oven to 400°F"). Do not duplicate: if two ingredients share the same prep ("chopped garlic" and "chopped shallot"), emit "Chop garlic" and "Chop shallot" as separate items, not "Chop garlic and shallot".

IMAGE EXTRACTION:
- Look for the primary recipe image. Common locations:
  - <meta property="og:image" content="..."> (most reliable)
  - <meta name="twitter:image" content="...">
  - First large <img> inside the recipe content
- Return the absolute URL as "imageUrl"
- If no clear primary image, return null

If the page has no recipe content (login wall, video-only, no actual recipe), return: {"error":"Could not extract a recipe from this page."}

Output ONLY the JSON object. The first character must be {.`;

export const ANNOTATE_PROMPT = `RESPONSE FORMAT: Output ONLY a single JSON object. No prose, no fences, no explanation. Start with { and end with }.

You are given a recipe with a title, structured ingredients, and plain-text steps. Your job is to (a) rewrite the steps with inline ingredient and timer annotations preserving the original instruction text exactly, and (b) classify the recipe into a meal category.

INPUT shape:
{
  "title": "Garlic Butter Roasted Chicken",
  "ingredients": [{"id": "ing-1", "amount": "2 tbsp", "name": "olive oil", "prep": null}],
  "steps": [{"text": "Heat 2 tbsp olive oil over medium and bake for 18 minutes until fragrant."}]
}

OUTPUT shape:
{
  "category": "dinner",
  "steps": [
    {
      "segments": [
        {"type": "text", "content": "Heat "},
        {"type": "ingredient", "ingredientId": "ing-1"},
        {"type": "text", "content": " over medium and "},
        {"type": "timer", "timerId": "timer-1"},
        {"type": "text", "content": " until fragrant."}
      ],
      "ingredients": [{"id": "ing-1", "display": "2 tbsp olive oil"}],
      "timers": [{"id": "timer-1", "label": "bake 18 min", "durationSeconds": 1080}]
    }
  ]
}

CATEGORY SELECTION:
- Pick exactly one value from this list (lowercase, exact spelling):
  "breakfast" | "lunch" | "dinner" | "dessert" | "snack" | "drink" | "side" | "appetizer" | "other"
- Base the choice on the title and ingredients, with meal-type keywords in the recipe taking priority.
- Choose "other" only when genuinely ambiguous (e.g. a sauce, a marinade, a generic dough).
- Never invent a value outside the list; never output null. If unsure, output "other".

ANNOTATION RULES:
1. Concatenating all "text" segments + the spelled-out form of each chip MUST exactly reconstruct the original step text (allowing minor whitespace cleanup).
2. When a step text mentions an ingredient (by name, with or without exact amount match), wrap the ingredient mention as an {type:"ingredient"} segment. Use the matching ingredient's id from the input. The chip "display" should be a short canonical form: amount + simple name, max 25 chars (e.g., "2 tbsp olive oil"). NOT the full original ingredient description.
3. When a step text contains a time-bound action (bake, simmer, marinate, rest, chill, broil, sauté for X, etc.), wrap the action+duration as an {type:"timer"} segment. The timer "label" reads naturally inside the sentence ("bake 18 min", "simmer 30 min"), max 20 chars. Convert to durationSeconds.
4. If a step contains an ingredient that's NOT in the ingredients list (e.g., "salt and pepper to taste" when neither is itemized), leave it as plain text — do not invent ingredient ids.
5. If a single ingredient appears multiple times in a step, give each occurrence its own segment but they may share the same ingredientId.
6. Preserve all narrative and connective text in {type:"text"} segments — do NOT shorten, paraphrase, or omit text from the original step.

OUTPUT ONLY the JSON object. The first character must be {.`;

// ─────────────────────────────────────────────────────────────────────────────
// Photo + text import (round 3b-server)
//
// These two paths produce the SAME shape as FULL_PARSE_PROMPT — including
// pre-annotated step segments — because the full-AI path returns annotated
// steps directly rather than running annotateRecipe() afterwards. The schema
// and chip/timer rules below are shared between the two new prompts.
//
// FULL_PARSE_PROMPT is deliberately NOT refactored to consume this constant:
// the existing URL path is frozen, and composing it from shared pieces would
// change its bytes (and therefore its behavior) for no functional gain.
// ─────────────────────────────────────────────────────────────────────────────

const RECIPE_JSON_CONTRACT = `JSON shape:
{
  "title": "string",
  "duration": "30 min" or "1 hr 20 min",
  "servings": number,
  "tag": "Weeknight" | "Quick" | "Dessert" | "Side" | "Breakfast" | "Slow-cooker" | "Vegetarian" | null,
  "category": "breakfast" | "lunch" | "dinner" | "dessert" | "snack" | "drink" | "side" | "appetizer" | "other",
  "imageUrl": null,
  "ingredients": [{ "amount": "2 tbsp", "name": "olive oil", "prep": "minced" or null }],
  "steps": [{ "segments": [...], "ingredients": [...], "timers": [...] }],
  "prepItems": [{ "label": "Preheat oven to 425°F", "duration": "20 min" or null, "defaultChecked": false }],
  "tools": [{ "name": "Cast Iron Skillet", "price": "$45", "partner": "Amazon" }]
}

"imageUrl" must always be null — there is no source image URL for this input.

Step segments concatenate to the full instruction:
- {"type":"text","content":"Heat "}
- {"type":"ingredient","ingredientId":"ing-1"} (reference an item in this step's ingredients array)
- {"type":"text","content":" in a skillet, then bake "}
- {"type":"timer","timerId":"timer-1"} (reference an item in this step's timers array)
- {"type":"text","content":" until fragrant."}

Each step's "ingredients" array: [{"id":"ing-1","display":"2 tbsp olive oil"}]

CHIP DISPLAY RULES (critical):
- Each ingredient chip "display" must be SHORT — max 25 characters
- Format: amount + simple ingredient name only (e.g., "2 tbsp olive oil", "1 cup flour", "5 large eggs")
- DO NOT include detailed descriptions, prep notes, or qualifiers in chip display
- Example: ingredient is "8 (3/4-inch-thick) slices brioche, country-style white bread, preferably stale" → chip display should be "8 slices brioche"

Each step's "timers" array: [{"id":"timer-1","label":"bake 18 min","durationSeconds":1080}]

TIMER LABEL RULES:
- Timer label must be SHORT — max 20 characters
- Format: action + duration (e.g., "bake 18 min", "simmer 30 min", "rest 10 min")

CONSTRAINTS:
- Maximum 8 prep items
- Maximum 3 tools
- Tag must be from the enum above; null if no clean fit
- Category must be exactly one of the lowercase values listed; default to "other" if genuinely ambiguous, never null, never invented
- Each step's text segments should be concise — extract the action, omit narrative
- Never invent ingredients, quantities, or steps that are not present in the source. If a quantity is unreadable or absent, use a best-effort amount from context or an empty string — do not guess a specific number.

PREP ITEM EXTRACTION:
Prep items are anything the cook can finish BEFORE active stovetop/oven work begins. Include all that apply, deduped:
- Knife work: dice, chop, mince, slice, cut, halve, quarter, crush, smash, grate, shred, zest, peel, trim, core, seed, devein, butterfly, pound, score, cube
- Temperature prep: "Preheat oven/grill/broiler to <temp>", "Bring <ingredient> to room temp", "Soften butter", "Melt butter"
- Measuring / staging: "Measure out <spices>", "Set aside <ingredient>", "Gather <items>"
- Soaking / marinating: "Marinate <protein>", "Soak <ingredient>"
- Pre-cook combining: "Whisk together <X>", "Stir together <X>", "Combine <X>" — ONLY when the combining happens before any heat verb in the recipe; do NOT include mid-cook stirring
Label format: imperative verb + short object phrase ("Dice onion", "Preheat oven to 400°F"). Do not duplicate: if two ingredients share the same prep ("chopped garlic" and "chopped shallot"), emit "Chop garlic" and "Chop shallot" as separate items, not "Chop garlic and shallot".`;

export const PHOTO_PARSE_PROMPT = `RESPONSE FORMAT: Output ONLY a single JSON object. No prose, no fences, no explanation. Start with { and end with }.

Extract a structured recipe from the attached photo. The photo is typically a cookbook page, a recipe card, a handwritten note, or a screenshot.

Read all visible text in the image, including text in columns, sidebars, and headers. Ingredient lists and instructions are often in separate visual blocks — associate them correctly. If the page shows more than one recipe, extract the single most prominent one.

${RECIPE_JSON_CONTRACT}

If the image contains no readable recipe (a photo of finished food with no text, an unrelated page, a blurry or illegible shot), return: {"error":"We couldn't find a recipe in that photo. Try a clearer shot."}

Output ONLY the JSON object. The first character must be {.`;

export const TEXT_PARSE_PROMPT = `RESPONSE FORMAT: Output ONLY a single JSON object. No prose, no fences, no explanation. Start with { and end with }.

Extract a structured recipe from the recipe text below. The text is typed or pasted by the user and may be loosely formatted — inconsistent line breaks, no headings, or ingredients and steps run together.

Infer structure from the content rather than relying on formatting. A title may be absent; derive a short descriptive one from the dish if so.

${RECIPE_JSON_CONTRACT}

If the text is not a recipe (a shopping list, a link with no content, prose about food, or gibberish), return: {"error":"That doesn't look like a recipe. Check the text and try again."}

Output ONLY the JSON object. The first character must be {.`;
