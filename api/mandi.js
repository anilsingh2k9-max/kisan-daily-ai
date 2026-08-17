const RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";

export default async function handler(req, res) {

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "GET only"
    });
  }

  const apiKey = process.env.DATA_GOV_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "DATA_GOV_API_KEY is not configured"
    });
  }

  try {

    const q = req.query || {};

    const state = String(q.state || "").trim();
    const district = String(q.district || "").trim();
    const market = String(q.market || "").trim();
    const commodity = String(q.commodity || "").trim();
    const variety = String(q.variety || "").trim();

    const limit = Math.min(
      Math.max(Number(q.limit) || 1000, 1),
      1000
    );

    const offset = Math.max(
      Number(q.offset) || 0,
      0
    );

    const params = new URLSearchParams({
      "api-key": apiKey,
      format: "json",
      limit: String(limit),
      offset: String(offset)
    });

    if (state) {
      params.set(
        "filters[state]",
        state
      );
    }

    if (district) {
      params.set(
        "filters[district]",
        district
      );
    }

    if (market) {
      params.set(
        "filters[market]",
        market
      );
    }

    if (commodity) {
      params.set(
        "filters[commodity]",
        commodity
      );
    }

    if (variety) {
      params.set(
        "filters[variety]",
        variety
      );
    }

    const response = await fetch(
      `https://api.data.gov.in/resource/${RESOURCE_ID}?${params.toString()}`
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.error ||
          data?.message ||
          "Data.gov.in API error"
      });
    }

    const records = Array.isArray(data.records)
      ? data.records
      : [];

    return res.status(200).json({
      success: true,
      total: Number(data.total || 0),
      count: records.length,
      offset,
      limit,
      state: state || null,
      records
    });

  } catch (error) {

    return res.status(500).json({
      error: "Mandi data fetch failed",
      details: error.message
    });
  }
}
