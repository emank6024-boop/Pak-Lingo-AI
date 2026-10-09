<div align="center">

# 🇵🇰 PakLingo AI

**Empowering Every Pakistani Through AI, Language, and Accessibility**

A multilingual AI super-app bringing healthcare guidance, legal help, agricultural advice, government services, education, and more to every corner of Pakistan — in the languages people actually speak.

</div>

---

## ✨ What is PakLingo AI?

PakLingo AI is an all-in-one assistant platform designed for Pakistan's linguistic and digital diversity. Instead of forcing users to navigate separate apps and English-only interfaces, it brings a suite of AI-powered tools together under one roof — accessible in Urdu, Punjabi, Sindhi, Pashto, Balochi, Saraiki, Hindko, Kashmiri, Brahui, and English, with full right-to-left (RTL) support for Urdu.

Whether someone needs to understand a medical report, get guidance on a legal document, ask a farming question, translate a conversation in real time, or navigate a government process — PakLingo AI meets them in their own language.

## 🚀 Features

| Module | What it does |
|---|---|
| 🩺 **Medical Assistant** | Plain-language health guidance and symptom information |
| ⚖️ **Legal Assistant** | Explains legal concepts and documents in accessible terms |
| 🌾 **Farmer Assistant** | Crop, weather, and agricultural advisory support |
| 🏛️ **Government Assistant** | Helps users navigate public services and procedures |
| 🎓 **AI Teacher** | Interactive, subject-based learning support |
| 📄 **OCR & Document Intelligence** | Extracts and explains text from scanned documents and images |
| 🌐 **Live Translator** | Real-time translation across supported languages |
| 🤟 **Sign Language Assistant** | Accessibility-focused sign language support |
| 🎙️ **Voice Assistant** | Hands-free, voice-driven interaction |
| 🕵️ **Fake News Detector** | Helps users assess the credibility of news and claims |
| 💬 **General AI Assistant** | Open-ended conversational help |
| 📊 **Dashboard & History** | Tracks past conversations and activity |

## 🎨 Built for Accessibility

Accessibility isn't bolted on — it's core to the design:

- **High contrast mode** and **simple mode** for low-vision and low-literacy users
- **Adjustable font sizing** across the entire interface
- **Screen reader mode** and **reduced motion** support
- **Voice feedback** with adjustable speech rate
- **Multiple visual themes**, including a flagship emerald theme inspired by Pakistan's national colors
- Full **RTL layout support** for Urdu

## 🌍 Languages Supported

Urdu · English · Roman Urdu · Punjabi · Sindhi · Pashto · Balochi · Saraiki · Hindko · Kashmiri · Brahui

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4
- **Animation:** Motion
- **Icons:** Lucide React
- **Backend:** Express (TypeScript), running via `tsx`
- **AI:** Google Gemini API (`@google/genai`)
- **Auth & Data:** Firebase Authentication & Firestore
- **Markdown Rendering:** react-markdown with GFM support

## 📦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- A Gemini API key ([Google AI for Developers](https://ai.google.dev/))
- A Firebase project (for authentication and data storage)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd paklingo-ai

# Install dependencies
npm install
```

### Environment Setup

Create a `.env.local` file in the project root and add your Gemini API key:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

Make sure your Firebase project configuration is set up correctly for authentication (email/password and Google sign-in) and Firestore access.

### Running Locally

```bash
npm run dev
```

This starts the development server (frontend + backend via `tsx`).

### Building for Production

```bash
npm run build
npm run start
```

## 📁 Project Structure

```
├── server/                 # Backend route handlers & services
│   ├── authRoutes.ts
│   ├── authService.ts
│   ├── adminRoutes.ts
│   └── adminStore.ts
├── src/
│   ├── components/
│   │   ├── pages/           # Feature modules (Medical, Legal, Farmer, etc.)
│   │   ├── auth/             # Login & authentication UI
│   │   └── ...                # Shared UI components
│   ├── context/              # Theme, language, auth, and voice settings providers
│   ├── data/                  # Language definitions & translation strings
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                    # Firebase & telemetry utilities
│   └── utils/                  # Speech, caching, and helper utilities
├── data/                    # Local runtime data
└── server.ts                # Express server entry point
```

## 🗺️ Roadmap

- [ ] Migrate to a unified Firebase-based authentication flow
- [ ] Modularize backend routes by domain
- [ ] Add proper client-side routing with shareable URLs
- [ ] Expand offline-first capabilities for low-connectivity regions
- [ ] Add more regional languages and dialects

## 🤝 Contributing

Contributions, bug reports, and feature suggestions are welcome. Please open an issue or submit a pull request.

## 📄 License

This project is licensed under the Apache-2.0 License.

---

<div align="center">
Made with ❤️ for Pakistan
</div>