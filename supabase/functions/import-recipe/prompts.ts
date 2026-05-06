export const FULL_PARSE_PROMPT = `RESPONSE FORMAT: Output ONLY a single JSON object. No prose, no fences, no explanation. Start with { and end with }.

Extract a structured recipe from HTML.

JSON shape:
{
  "title": "string",
  "duration": "30 min" or "1 hr 20 min",
  "servings": number,
  "tag": "Weeknight" | "Quick" | "Dessert" | "Side" | "Breakfast" | "Slow-cooker" | "Vegetarian" | null,
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
- Maximum 4 prep items
- Maximum 3 tools
- Tag must be from the enum above; null if no clean fit
- Each step's text segments should be concise — extract the action, omit narrative

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

You are given a recipe with structured ingredients and plain-text steps. Your job is to rewrite the steps with inline ingredient and timer annotations, preserving the original instruction text exactly. The output is structurally similar to the input, but each step's text becomes a sequence of segments where ingredient mentions and time-bound actions are wrapped as taggable inline elements.

INPUT shape:
{
  "ingredients": [{"id": "ing-1", "amount": "2 tbsp", "name": "olive oil", "prep": null}],
  "steps": [{"text": "Heat 2 tbsp olive oil over medium and bake for 18 minutes until fragrant."}]
}

OUTPUT shape:
{
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

RULES:
1. Concatenating all "text" segments + the spelled-out form of each chip MUST exactly reconstruct the original step text (allowing minor whitespace cleanup).
2. When a step text mentions an ingredient (by name, with or without exact amount match), wrap the ingredient mention as an {type:"ingredient"} segment. Use the matching ingredient's id from the input. The chip "display" should be a short canonical form: amount + simple name, max 25 chars (e.g., "2 tbsp olive oil"). NOT the full original ingredient description.
3. When a step text contains a time-bound action (bake, simmer, marinate, rest, chill, broil, sauté for X, etc.), wrap the action+duration as an {type:"timer"} segment. The timer "label" reads naturally inside the sentence ("bake 18 min", "simmer 30 min"), max 20 chars. Convert to durationSeconds.
4. If a step contains an ingredient that's NOT in the ingredients list (e.g., "salt and pepper to taste" when neither is itemized), leave it as plain text — do not invent ingredient ids.
5. If a single ingredient appears multiple times in a step, give each occurrence its own segment but they may share the same ingredientId.
6. Preserve all narrative and connective text in {type:"text"} segments — do NOT shorten, paraphrase, or omit text from the original step.

OUTPUT ONLY the JSON object. The first character must be {.`;
