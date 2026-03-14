const generateAITicketDesign = async (event) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return getDefaultDesign(event);
    }

    const prompt = `You are a professional event ticket designer. Based on the following event details, generate a ticket color scheme and design metadata.

Event Name: ${event.name}
Category: ${event.category}
Description: ${event.description?.substring(0, 300)}
Has Poster: ${event.poster ? 'Yes' : 'No'}

Respond ONLY with a valid JSON object (no markdown, no code blocks) in this exact format:
{
  "colorPalette": ["#hexcolor1", "#hexcolor2", "#hexcolor3"],
  "fontStyle": "description of font style",
  "layoutHint": "brief layout recommendation",
  "mood": "description of event mood"
}

Choose colors appropriate for the event category. For music events use vibrant colors, for business/tech use professional colors, for arts use creative colors.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 256 },
        }),
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) return getDefaultDesign(event);

    const cleaned = text.replace(/```json|```/g, '').trim();
    const design = JSON.parse(cleaned);

    return {
      colorPalette: design.colorPalette || getDefaultPalette(event.category),
      fontStyle: design.fontStyle || 'Bold sans-serif',
      layoutHint: design.layoutHint || 'Standard horizontal layout',
      generatedAt: new Date(),
    };
  } catch (error) {
    console.error('AI design generation failed:', error.message);
    return getDefaultDesign(event);
  }
};

const getDefaultPalette = (category) => {
  const palettes = {
    music: ['#1A0533', '#9333EA', '#EC4899'],
    sports: ['#0C1445', '#1D4ED8', '#60A5FA'],
    arts: ['#1A0A00', '#B45309', '#FCD34D'],
    technology: ['#0A1628', '#0EA5E9', '#38BDF8'],
    business: ['#0F1923', '#374151', '#6B7280'],
    food: ['#1A0500', '#DC2626', '#FCA5A5'],
    comedy: ['#1A1500', '#D97706', '#FDE68A'],
    theatre: ['#0F0A1A', '#7C3AED', '#C4B5FD'],
    conference: ['#071525', '#0369A1', '#38BDF8'],
    other: ['#0F172A', '#F59E0B', '#FCD34D'],
  };
  return palettes[category] || palettes.other;
};

const getDefaultDesign = (event) => ({
  colorPalette: getDefaultPalette(event.category),
  fontStyle: 'Clean bold sans-serif',
  layoutHint: 'Standard horizontal layout with QR stub',
  generatedAt: new Date(),
});

module.exports = { generateAITicketDesign };
