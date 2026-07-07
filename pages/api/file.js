// Proxies the Instagram CDN video through our server and forces a file download.
export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  const u = req.query.u;
  const name = (req.query.name || "instagram-video.mp4").replace(/[^\w.-]/g, "_");

  if (!u) {
    return res.status(400).json({ error: "Missing url" });
  }

  try {
    const upstream = await fetch(u, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!upstream.ok || !upstream.body) {
      return res.status(502).json({ error: "Video fetch failed: " + upstream.status });
    }

    res.setHeader("Content-Type", upstream.headers.get("content-type") || "video/mp4");
    res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
    const len = upstream.headers.get("content-length");
    if (len) res.setHeader("Content-Length", len);

    // Stream the body to the client
    const reader = upstream.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
