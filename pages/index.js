import { useState } from "react";
import Head from "next/head";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    if (!url.trim()) {
      setError("Instagram link paste karein.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Kuch galat ho gaya.");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Instagram Video Downloader</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="Paste an Instagram post/reel link and download the video."
        />
      </Head>
      <main className="wrap">
        <div className="card">
          <h1>📥 Instagram Video Downloader</h1>
          <p className="sub">
            Link paste karein aur video download karein — Reels, Posts, IGTV.
          </p>

          <form onSubmit={handleSubmit} className="form">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.instagram.com/reel/..."
              className="input"
            />
            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Loading..." : "Download"}
            </button>
          </form>

          {error && <div className="error">⚠️ {error}</div>}

          {result && (
            <div className="result">
              {result.thumbnail && (
                <img src={result.thumbnail} alt="preview" className="thumb" />
              )}
              <video
                src={result.videoUrl}
                controls
                className="video"
                poster={result.thumbnail || undefined}
              />
              <a href={result.downloadUrl} className="btn download">
                ⬇️ Save Video (MP4)
              </a>
              <a
                href={result.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="link"
              >
                Direct video link kholein
              </a>
            </div>
          )}

          <footer className="footer">
            Sirf public posts ke liye. Copyright material download na karein.
          </footer>
        </div>
      </main>

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: linear-gradient(135deg, #f58529, #dd2a7b, #8134af, #515bd4);
        }
        .card {
          background: #fff;
          border-radius: 18px;
          padding: 32px 28px;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
        }
        h1 {
          margin: 0 0 6px;
          font-size: 22px;
          text-align: center;
          color: #1a1a1a;
        }
        .sub {
          margin: 0 0 22px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
        .form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .input {
          padding: 14px 16px;
          border: 2px solid #eee;
          border-radius: 12px;
          font-size: 15px;
          outline: none;
        }
        .input:focus {
          border-color: #dd2a7b;
        }
        .btn {
          padding: 14px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #dd2a7b, #8134af);
          color: #fff;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          text-align: center;
          text-decoration: none;
          display: block;
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .error {
          margin-top: 16px;
          padding: 12px;
          background: #fff2f2;
          color: #c0392b;
          border-radius: 10px;
          font-size: 14px;
        }
        .result {
          margin-top: 22px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .video {
          width: 100%;
          border-radius: 12px;
          background: #000;
          max-height: 420px;
        }
        .thumb {
          display: none;
        }
        .download {
          background: linear-gradient(135deg, #11998e, #38ef7d);
        }
        .link {
          text-align: center;
          color: #8134af;
          font-size: 13px;
          text-decoration: underline;
        }
        .footer {
          margin-top: 22px;
          text-align: center;
          font-size: 12px;
          color: #999;
        }
      `}</style>
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            sans-serif;
        }
      `}</style>
    </>
  );
}
