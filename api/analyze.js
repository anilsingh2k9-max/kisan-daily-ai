export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Only POST requests are allowed"
    });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is not configured in Vercel"
      });
    }

    const body = req.body || {};

    // Accept common image field names
    const image =
      body.image ||
      body.imageData ||
      body.imageUrl ||
      body.photo;

    const crop = body.crop || body.cropName || "फसल";

    if (!image) {
      return res.status(400).json({
        error: "Crop image is missing"
      });
    }

    const prompt = `
आप कृषि विशेषज्ञ हैं।
इस ${crop} की फोटो का निरीक्षण करें।

हिन्दी में सरल भाषा में बताएं:
1. फसल की स्थिति
2. दिखाई देने वाले संभावित कीट/रोग
3. प्रमुख लक्षण
4. किसान को अभी क्या करना चाहिए
5. कब कृषि विशेषज्ञ से संपर्क करना चाहिए

यदि फोटो से निश्चित पहचान संभव नहीं है तो साफ बताएं कि यह केवल प्रारंभिक अनुमान है।
किसी दवा की मात्रा बिना पर्याप्त जानकारी के निश्चित रूप से न बताएं।
`;

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: prompt
                },
                {
                  type: "input_image",
                  image_url: image
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "OpenAI API error"
      });
    }

    const result =
      data.output_text ||
      data.output
        ?.flatMap(item => item.content || [])
        ?.map(item => item.text)
        ?.filter(Boolean)
        ?.join("\n") ||
      "AI ने कोई परिणाम नहीं दिया।";

    return res.status(200).json({
      success: true,
      result
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "AI analysis failed",
      details: error.message
    });
  }
}
