import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDocumentSchema, insertChatMessageSchema } from "@shared/schema";
import OpenAI from "openai";
import multer from "multer";
import mammoth from "mammoth";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ error: "Failed to fetch document" });
    }
  });

  app.post("/api/documents", async (req, res) => {
    try {
      const validatedData = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(validatedData);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(400).json({ error: "Failed to create document" });
    }
  });

  app.patch("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const document = await storage.updateDocument(id, updates);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(400).json({ error: "Failed to update document" });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDocument(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  app.get("/api/documents/:id/messages", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const messages = await storage.getChatMessages(documentId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/documents/:id/chat", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const { content, documentContent, format } = req.body;

      if (!content) {
        return res.status(400).json({ error: "Message content is required" });
      }

      await storage.createChatMessage({
        documentId,
        role: "user",
        content,
      });

      const systemPrompt = `You are DocCraft AI, an intelligent document creation assistant. You help users write, edit, and improve their documents.

Current document format: ${format.toUpperCase()}
Current document content:
---
${documentContent}
---

Guidelines:
- Provide helpful, concise responses
- When suggesting edits, be specific about what to change
- If asked to generate content, format it appropriately for the ${format} format
- For HTML, use proper semantic tags
- For LaTeX, use proper LaTeX syntax with commands like \\section{}, \\textbf{}, etc.
- For RTF, use RTF control words like \\b for bold, \\i for italic
- Keep responses focused and actionable`;

      const existingMessages = await storage.getChatMessages(documentId);
      const chatHistory = existingMessages.slice(-10).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: systemPrompt },
          ...chatHistory,
        ],
        stream: true,
        max_completion_tokens: 2048,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        if (text) {
          fullResponse += text;
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
      }

      await storage.createChatMessage({
        documentId,
        role: "assistant",
        content: fullResponse,
      });

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error processing chat:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to process message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to process message" });
      }
    }
  });

  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const { originalname, buffer, mimetype } = req.file;
      let content = "";

      if (
        mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        originalname.endsWith(".docx")
      ) {
        const result = await mammoth.extractRawText({ buffer });
        content = result.value;
      } else if (mimetype === "application/msword" || originalname.endsWith(".doc")) {
        content = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
      } else if (
        mimetype === "text/plain" ||
        mimetype === "text/html" ||
        mimetype === "application/x-latex" ||
        mimetype === "application/rtf" ||
        originalname.endsWith(".txt") ||
        originalname.endsWith(".html") ||
        originalname.endsWith(".tex") ||
        originalname.endsWith(".rtf")
      ) {
        content = buffer.toString("utf-8");
      } else {
        return res.status(400).json({ error: "Unsupported file format" });
      }

      res.json({ content, filename: originalname });
    } catch (error) {
      console.error("Error processing file:", error);
      res.status(500).json({ error: "Failed to process file" });
    }
  });

  app.post("/api/export", async (req, res) => {
    try {
      const { content, format, filename } = req.body;

      const extension = format === "latex" ? "tex" : format;
      const mimeType =
        format === "html"
          ? "text/html"
          : format === "latex"
          ? "application/x-latex"
          : "application/rtf";

      res.setHeader("Content-Type", mimeType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename || "document"}.${extension}"`
      );
      res.send(content);
    } catch (error) {
      console.error("Error exporting document:", error);
      res.status(500).json({ error: "Failed to export document" });
    }
  });

  return httpServer;
}

async function seedDatabase() {
  try {
    const existingDocs = await storage.getAllDocuments();
    if (existingDocs.length > 0) {
      console.log("Database already has documents, skipping seed");
      return;
    }

    console.log("Seeding database with sample documents...");

    await storage.createDocument({
      title: "Welcome to DocCraft AI",
      content: `<!DOCTYPE html>
<html>
<head>
  <title>Welcome to DocCraft AI</title>
</head>
<body>
  <h1>Welcome to DocCraft AI</h1>
  <p>This is your intelligent document creation platform. Start editing here or ask the AI assistant for help!</p>
  
  <h2>Features</h2>
  <ul>
    <li>Real-time preview of your documents</li>
    <li>AI-powered editing assistance</li>
    <li>Support for HTML, LaTeX, and RTF formats</li>
    <li>Easy export to multiple formats</li>
  </ul>
  
  <h2>Getting Started</h2>
  <p>Try asking the AI to:</p>
  <ol>
    <li>Add a new section about your topic</li>
    <li>Improve the writing style</li>
    <li>Convert between formats</li>
  </ol>
  
  <blockquote>
    "The best way to predict the future is to create it." - Peter Drucker
  </blockquote>
</body>
</html>`,
      format: "html",
    });

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seedDatabase();
