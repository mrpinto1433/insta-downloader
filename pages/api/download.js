// API route: extracts the direct video URL from an Instagram post/reel/IGTV link.
//
// Instagram has locked down public scraping heavily. The RELIABLE method needs a
// logged-in session cookie set as the env var IG_SESSIONID (see README).
// Without it, we still try best-effort no-auth fallbacks (works for some public posts).

const AB = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const APP_ID = "936619743392459";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function parseUrl(url) {
  if (!url) return { shortcode: null, username: null };
  const sc = url.match(
    /instagram\.com\/(?:[^/]+\/)?(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/
  );
  const un = url.match(/instagram\.com\/([A-Za-z0-9._]+)\/(?:p|reel|reels|tv)\//);
  return { shortcode: sc ? sc[1] : null, username: un ? un[1] : null };
}

function shortcodeToId(sc) {
  let n = 0n;
  for (const ch of sc) {
    const i = AB.indexOf(ch);
    if (i < 0) return null;
    n = n * 64n + BigInt(i);
  }
  return n.toString();
}

function pickVideo(media, shortcode) {
  const isVideo =
    media.is_video || media.media_type === 2 || !!media.video_url || !!media.video_versions;
  let videoUrl = media.video_url || media.video_versions?.[0]?.url || null;
  let thumbnail =
    media.display_url ||
    media.thumbnail_url ||
    media.image_versions2?.candidates?.[0]?.url ||
    null;

  if (!videoUrl) {
    const kids =
      media.edge_sidecar_to_children?.edges?.map((e) => e.node) ||
      media.carousel_media ||
      [];
    for (const k of kids) {
      if (k.is_video || k.video_url || k.media_type === 2) {
        videoUrl = k.video_url || k.video_versions?.[0]?.url;
        thumbnail =
          thumbnail ||
          k.display_url ||
          k.image_versions2?.candidates?.[0]?.url ||
          null;
        break;
      }
    }
  }
  return { videoUrl, thumbnail, isVideo, shortcode };
}

// Method A: authenticated media info (RELIABLE) — needs IG_SESSIONID
async function viaSession(shortcode) {
  const sessionid = process.env.IG_SESSIONID;
  if (!sessionid) throw new Error("no IG_SESSIONID configured");
  const mediaId = shortcodeToId(shortcode);
  const res = await fetch(`https://i.instagram.com/api/v1/media/${mediaId}/info/`, {
    headers: {
      "User-Agent": UA,
      "X-IG-App-ID": APP_ID,
      Cookie: `sessionid=${sessionid}`,
    },
  });
  if (!res.ok) throw new Error("session info status " + res.status);
  const data = await res.json();
  const item = data?.items?.[0];
  if (!item) throw new Error("no item in session info");
  return pickVideo(item, shortcode);
}

// Method B: public profile media listing (no auth) — needs username in URL
async function viaProfile(shortcode, username) {
  if (!username) throw new Error("no username in URL");
  const res = await fetch(
    `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(
      username
    )}`,
    { headers: { "User-Agent": UA, "X-IG-App-ID": APP_ID } }
  );
  if (!res.ok) throw new Error("profile status " + res.status);
  const data = await res.json();
  const edges = data?.data?.user?.edge_owner_to_timeline_media?.edges || [];
  const match = edges.map((e) => e.node).find((n) => n.shortcode === shortcode);
  if (!match) throw new Error("post not in recent profile media");
  return pickVideo(match, shortcode);
}

// Method C: embed page scrape (best effort — often login-walled now)
async function viaEmbed(shortcode) {
  const res = await fetch(
    `https://www.instagram.com/p/${shortcode}/embed/captioned/`,
    { headers: { "User-Agent": UA } }
  );
  if (!res.ok) throw new Error("embed status " + res.status);
  const html = await res.text();
  let m = html.match(/"video_url":"([^"]+)"/);
  if (m) return { videoUrl: JSON.parse('"' + m[1] + '"'), thumbnail: null, isVideo: true, shortcode };
  m = html.match(/property="og:video"\s+content="([^"]+)"/);
  if (m)
    return {
      videoUrl: m[1].replace(/&amp;/g, "&"),
      thumbnail: null,
      isVideo: true,
      shortcode,
    };
  throw new Error("no video in embed page");
}

export default async function handler(req, res) {
  const url = (req.method === "POST" ? req.body?.url : req.query?.url) || "";
  const { shortcode, username } = parseUrl(url);

  if (!shortcode) {
    return res
      .status(400)
      .json({ error: "Invalid Instagram URL. Post/Reel/IGTV link paste karein." });
  }

  const methods = [
    () => viaSession(shortcode),
    () => viaProfile(shortcode, username),
    () => viaEmbed(shortcode),
  ];
  const errors = [];

  for (const fn of methods) {
    try {
      const r = await fn();
      if (r?.videoUrl) {
        return res.status(200).json({
          success: true,
          videoUrl: r.videoUrl,
          thumbnail: r.thumbnail,
          shortcode,
          downloadUrl: `/api/file?u=${encodeURIComponent(
            r.videoUrl
          )}&name=${shortcode}.mp4`,
        });
      }
      if (r && r.isVideo === false) {
        return res
          .status(422)
          .json({ error: "Ye post video nahi hai (image post ho sakta hai)." });
      }
      errors.push("no videoUrl");
    } catch (e) {
      errors.push(e.message);
    }
  }

  return res.status(502).json({
    error: process.env.IG_SESSIONID
      ? "Video nahi mil paya. Post private/deleted ho sakta hai."
      : "Video nahi mil paya. Reliable results ke liye IG_SESSIONID env var set karein (README dekhein).",
    details: errors,
  });
}
