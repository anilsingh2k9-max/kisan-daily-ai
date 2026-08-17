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

    /*
      अगर State चुना गया है:
      ज्यादा records लेने के लिए pagination करेंगे।
    */

    const requestedLimit = Math.min(
      Math.max(Number(q.limit) || 1000, 1),
      5000
    );

    /*
      बिना state के सिर्फ एक page।
      State के साथ multiple pages।
    */

    const pageSize = 1000;

    let allRecords = [];
    let offset = 0;
    let total = 0;

    const maxPages = state ? 10 : 1;

    for (let page = 0; page < maxPages; page++) {

      const params = new URLSearchParams({
        "api-key": apiKey,
        format: "json",
        limit: String(pageSize),
        offset: String(offset)
      });


      /* State filter */

      if (state) {
        params.set(
          "filters[state]",
          state
        );
      }


      /* District filter */

      if (district) {
        params.set(
          "filters[district]",
          district
        );
      }


      /* Market filter */

      if (market) {
        params.set(
          "filters[market]",
          market
        );
      }


      /* Commodity filter */

      if (commodity) {
        params.set(
          "filters[commodity]",
          commodity
        );
      }


      /* Variety filter */

      if (variety) {
        params.set(
          "filters[variety]",
          variety
        );
      }


      const response = await fetch(
        `https://api.data.gov.in/resource/${RESOURCE_ID}?${params.toString()}`,
        {
          cache: "no-store"
        }
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


      const pageRecords =
        Array.isArray(data.records)
          ? data.records
          : [];


      total =
        Number(data.total || 0);


      allRecords.push(
        ...pageRecords
      );


      /*
        अगर इस page में कम records आए
        तो आगे page की जरूरत नहीं।
      */

      if (
        pageRecords.length < pageSize
      ) {
        break;
      }


      /*
        अगर requested limit पूरी हो गई
      */

      if (
        allRecords.length >= requestedLimit
      ) {
        break;
      }


      offset += pageSize;
    }


    /*
      Requested limit के अनुसार काटें
    */

    allRecords =
      allRecords.slice(
        0,
        requestedLimit
      );


    return res.status(200).json({

      success: true,

      total: total,

      count: allRecords.length,

      offset: 0,

      limit: requestedLimit,

      state: state || null,

      records: allRecords
    });


  } catch (error) {

    console.error(
      "Mandi API error:",
      error
    );

    return res.status(500).json({

      error:
        "Mandi data fetch failed",

      details:
        error.message
    });
  }
}
