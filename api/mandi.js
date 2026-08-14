
const RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";

export default async function handler(req, res) {
if (req.method !== "GET") {
return res.status(405).json({ error: "GET only" });
}

const apiKey = process.env.DATA_GOV_API_KEY;

if (!apiKey) {
return res.status(500).json({
error: "DATA_GOV_API_KEY is not configured"
});
}

try {
const q = req.query || {};

const params = new URLSearchParams({
"api-key": apiKey,
format: "json",
limit: String(Math.min(Number(q.limit) || 50, 100)),
offset: String(Number(q.offset) || 0)
});

for (const field of [
"state",
"district",
"market",
"commodity",
"variety"
]) {
const value = String(q[field] || "").trim();

if (value) {
params.set(`filters[${field}]`, value);
}
}

const response = await fetch(
`https://api.data.gov.in/resource/${RESOURCE_ID}?${params}`
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

return res.status(200).json({
success: true,
total: data.total || 0,
records: data.records || []
});

} catch (error) {
return res.status(500).json({
error: "Mandi data fetch failed",
details: error.message
});
}
}
