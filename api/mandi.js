/* =========================
   MANDI - STATE → DISTRICT → CROP → MARKET
========================= */

const state = document.getElementById("mandiState");
const district = document.getElementById("mandiDistrict");
const commodity = document.getElementById("mandiCommodity");
const mandiStatus = document.getElementById("mandiStatus");
const mandiResult = document.getElementById("mandiResult");

let mandiCache = [];

/* सभी States + UT */
const allStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];

function fillMandiSelect(select, values, firstText) {

  select.innerHTML = "";

  const first = document.createElement("option");
  first.value = "";
  first.textContent = firstText;
  select.appendChild(first);

  [...new Set(values)]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "en"))
    .forEach(value => {

      const option = document.createElement("option");

      option.value = value;
      option.textContent = value;

      select.appendChild(option);
    });
}


/* शुरुआत में सभी State दिखाएं */

fillMandiSelect(
  state,
  allStates,
  "राज्य / केंद्र शासित प्रदेश चुनें"
);

fillMandiSelect(
  district,
  [],
  "जिला चुनें"
);

fillMandiSelect(
  commodity,
  [],
  "फसल चुनें"
);


/* API से मंडी data */

async function getMandiData(filters = {}) {

  const params = new URLSearchParams();

  params.set("limit", "1000");
  params.set("offset", "0");

  if (filters.state) {
    params.set("state", filters.state);
  }

  if (filters.district) {
    params.set("district", filters.district);
  }

  if (filters.commodity) {
    params.set("commodity", filters.commodity);
  }

  const response = await fetch(
    "/api/mandi?" + params.toString(),
    {
      cache: "no-store"
    }
  );

  const data = await response.json();

  if (!response.ok) {

    throw new Error(
      data.error || "Mandi API error"
    );
  }

  return Array.isArray(data.records)
    ? data.records
    : [];
}


/* State चुनने पर District API से */

state.onchange = async () => {

  const selectedState = state.value;

  fillMandiSelect(
    district,
    [],
    "🔄 जिला लोड हो रहा है…"
  );

  fillMandiSelect(
    commodity,
    [],
    "फसल चुनें"
  );

  mandiResult.innerHTML = "";

  if (!selectedState) {

    fillMandiSelect(
      district,
      [],
      "जिला चुनें"
    );

    return;
  }

  mandiStatus.textContent =
    "🔄 " +
    selectedState +
    " के मंडी रिकॉर्ड लोड हो रहे हैं…";

  try {

    const rows = await getMandiData({
      state: selectedState
    });

    mandiCache = rows;

    const districts = rows
      .map(row =>
        String(row.district || "").trim()
      )
      .filter(Boolean);

    fillMandiSelect(
      district,
      districts,
      "जिला चुनें"
    );

    if (districts.length) {

      mandiStatus.textContent =
        "✅ " +
        districts.length +
        " जिले उपलब्ध";

    } else {

      mandiStatus.textContent =
        "⚠️ इस राज्य के जिले API में नहीं मिले";
    }

  } catch (error) {

    fillMandiSelect(
      district,
      [],
      "जिला चुनें"
    );

    mandiStatus.textContent =
      "❌ जिला लोड नहीं हुआ: " +
      error.message;
  }
};


/* District चुनने पर Crop API से */

district.onchange = async () => {

  const selectedState = state.value;
  const selectedDistrict = district.value;

  fillMandiSelect(
    commodity,
    [],
    "🔄 फसल लोड हो रही है…"
  );

  mandiResult.innerHTML = "";

  if (!selectedState || !selectedDistrict) {

    fillMandiSelect(
      commodity,
      [],
      "फसल चुनें"
    );

    return;
  }

  mandiStatus.textContent =
    "🔄 " +
    selectedDistrict +
    " की फसलें लोड हो रही हैं…";

  try {

    const rows = await getMandiData({
      state: selectedState,
      district: selectedDistrict
    });

    mandiCache = rows;

    const commodities = rows
      .map(row =>
        String(row.commodity || "").trim()
      )
      .filter(Boolean);

    fillMandiSelect(
      commodity,
      commodities,
      "फसल चुनें"
    );

    if (commodities.length) {

      mandiStatus.textContent =
        "✅ " +
        commodities.length +
        " फसल/Commodity उपलब्ध";

    } else {

      mandiStatus.textContent =
        "⚠️ इस जिले की फसल का data नहीं मिला";
    }

  } catch (error) {

    mandiStatus.textContent =
      "❌ फसल लोड नहीं हुई: " +
      error.message;
  }
};


/* Crop चुनने पर भाव दिखाने की तैयारी */

commodity.onchange = () => {

  mandiResult.innerHTML = "";

  if (
    !state.value ||
    !district.value ||
    !commodity.value
  ) {
    return;
  }

  const rows = mandiCache.filter(row => {

    return (
      String(row.state || "").trim() === state.value &&
      String(row.district || "").trim() === district.value &&
      String(row.commodity || "").trim() === commodity.value
    );
  });

  showMandiResults(rows);
};


/* मंडी भाव दिखाएं */

document.getElementById("mandiBtn").onclick = async () => {

  const selectedState = state.value;
  const selectedDistrict = district.value;
  const selectedCommodity = commodity.value;

  if (!selectedState) {

    mandiResult.innerHTML =
      '<div class="result">पहले राज्य चुनें।</div>';

    return;
  }

  if (!selectedDistrict) {

    mandiResult.innerHTML =
      '<div class="result">पहले जिला चुनें।</div>';

    return;
  }

  if (!selectedCommodity) {

    mandiResult.innerHTML =
      '<div class="result">पहले फसल चुनें।</div>';

    return;
  }

  mandiStatus.textContent =
    "🔄 आज का मंडी भाव लोड हो रहा है…";

  try {

    const rows = await getMandiData({
      state: selectedState,
      district: selectedDistrict,
      commodity: selectedCommodity
    });

    mandiCache = rows;

    showMandiResults(rows);

    mandiStatus.textContent =
      rows.length
        ? "✅ " + rows.length + " रिकॉर्ड मिले"
        : "⚠️ इस चयन का मंडी भाव नहीं मिला";

  } catch (error) {

    mandiResult.innerHTML =
      '<div class="result">❌ ' +
      esc(error.message) +
      '</div>';

    mandiStatus.textContent = "";
  }
};


/* Results */

function showMandiResults(rows) {

  if (!rows.length) {

    mandiResult.innerHTML =
      '<div class="result">' +
      '❌ इस चयन के लिए मंडी रिकॉर्ड नहीं मिला।' +
      '<br><br>' +
      'दूसरी फसल या जिला चुनकर देखें।' +
      '</div>';

    return;
  }

  mandiResult.innerHTML = rows
    .slice(0, 50)
    .map(row => {

      const market =
        row.market ||
        row.market_name ||
        "मंडी";

      const min =
        row.min_price ??
        row.min ??
        "--";

      const max =
        row.max_price ??
        row.max ??
        "--";

      const modal =
        row.modal_price ??
        row.modal ??
        "--";

      return `
        <div class="mandi-row">

          <div class="mandi-title">
            🏪 ${esc(market)}
          </div>

          <div class="muted">
            ${esc(row.district || "")}
            •
            ${esc(row.state || "")}
            •
            ${esc(row.commodity || "")}
          </div>

          <div class="mandi-price">

            <div>
              न्यूनतम
              <b>₹${esc(min)}</b>
            </div>

            <div>
              अधिकतम
              <b>₹${esc(max)}</b>
            </div>

            <div>
              Modal
              <b>₹${esc(modal)}</b>
            </div>

          </div>

        </div>
      `;

    })
    .join("");
};


/* API connection check */

(async function checkMandi() {

  try {

    mandiStatus.textContent =
      "🔄 मंडी सेवा तैयार हो रही है…";

    const rows = await getMandiData();

    mandiCache = rows;

    mandiStatus.textContent =
      "✅ मंडी सेवा तैयार है — राज्य चुनें";

  } catch (error) {

    mandiStatus.textContent =
      "❌ मंडी सेवा में समस्या: " +
      error.message;
  }

})();
