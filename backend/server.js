require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "20kb" }));

app.get("/", (req, res) => {
  res.json({
    app: "PIYHU AI 2.0",
    status: "Backend is running"
  });
});

app.post("/api/chat", async (req, res) => {
  const message = req.body?.message?.trim();

  if (!message) {
    return res.status(400).json({
      error: "Message is required"
    });
  }

  if (message.length > 2000) {
    return res.status(413).json({
      error: "Message is too long"
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";

  if (!apiKey) {
    return res.status(500).json({
      error: "Gemini API key missing"
    });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{
              text: "You are Piyhu AI, a friendly and helpful Hindi and Hinglish assistant. Reply naturally in the user's language. Be respectful and non-romantic."
            }]
          },
          contents: [{
            parts: [{ text: message }]
          }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return res.status(response.status).json({
        error: data.error?.message || "Gemini request failed"
      });
    }

    const reply = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    res.json({
      reply: reply || "Piyhu ko jawab nahi mila."
    });

  } catch (error) {
    console.error("Server error:", error.message);
    res.status(500).json({
      error: "Connection failed. Check internet."
    });
  }
});

app.listen(3000, "0.0.0.0", () => {
  console.log("Piyhu Gemini server running on port 3000");
});
