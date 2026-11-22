# Lahori Nashta: Androon Dastarkhwan

An interactive 2D **Androon Lahore** cooking and chai-brewing web game built for the **DevFest Online Conference** using **Google AI Studio** and the **Google Gemini API**. Designed with cultural warmth and playful tactile mechanics for kids and teen girls, it swaps sterile generic cooking templates for real Sunday morning *nashta* energy, authentic Roman Urdu culinary cues, comic-book family reactions, and a Pakistani cultural sticker scrapbook.

> **Live Demo:** `https://lahori-nashta-androon-dastarkhwan.ai.studio`  

---

## Why This Project?

Most cooking games feel generic, disconnected, and repetitive. **Lahori Nashta: Androon Dastarkhwan** brings a real **Androon Lahore** morning table to life—where cooking isn't just clicking ingredients, it's managing *aanch* (heat) on the tawa, counting *chamach* (spoons) of *patti* and *cheeni*, saving the pot from boiling over during *phainti*, and seeing how the family reacts around the dastarkhwan.

---

## Key Features

* **Separate Lahori Nashta Classics:** Cook distinct traditional dishes—including *Anda Half-Fry + Lachha Paratha*, *Anda Full-Fry + Paratha*, *Masala Pyaz Omelette + Tandoori Naan*, *Lahori Channay + Kulcha / Naan*, *Halwa Poori*, and *Bong Paye + Roghni Naan*—with *Nani Ka Secret Garnish* finishing touches.
* **Dedicated Chai Corner (4 Distinct Brews):** Prepare *Doodh Patti*, *Karak Chai*, *Ilaichi Chai*, or *Kashmiri Chai* with explicit *chamach* scoops for *patti* and *cheeni*, heat/boil-over management, and ladle *phainti*.
* **Comic-Book Dastarkhwan Verdicts:** Once plated on the dastarkhwan, the family tastes the meal and reacts in comic-book panels with Roman Urdu dialogue powered by Gemini (`gemini-2.5-flash` and `gemini-2.5-flash-image`), complete with local fallbacks and caching.
* **Pakistani Die-Cut Sticker Scrapbook:** Unlock traditional Pakistani cultural stickers—such as Multani blue pottery, Ajrak & Khaddar textiles, hammered brass *degchis*, Lahori truck-art motifs, and *khussas*—as you cook and complete rounds.
* **Accessible Controls & Resilient State:** Supports both click/tap and drag-and-drop interactions, starts dishes and chai brews with zero pre-filled ingredients or sugar, and includes fallbacks so gameplay stays smooth even under rate limits or offline conditions.

---

## Tech Stack

* **Frontend:** React, TypeScript, Tailwind CSS
* **Rendering & Audio:** HTML5 Canvas (60fps gameplay/effects), Web Audio API sound effects
* **AI & Tooling:** Google AI Studio, `@google/genai` (`gemini-2.5-flash`, `gemini-2.5-flash-image`)

---

## Getting Started Locally

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/YOUR_USERNAME/lahori-nashta.git](https://github.com/YOUR_USERNAME/lahori-nashta.git)
   cd lahori-nashta
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set your Gemini API key:**
   Create a `.env.local` file in the project root (do **not** commit this file to GitHub):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

---

## Credits 

* Built for the **DevFest Online Conference** using Google AI Studio and Gemini credits.
