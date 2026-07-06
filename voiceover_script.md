# 🎙️ EcoBin Demo Video Voiceover Script

Here is the voiceover narration script for your project demo video, formatted to be easily copy-pasted into any AI Voice Generator (like ElevenLabs, Play.ht, or Murf.ai).

---

## Option 1: Continuous Voiceover Script (Direct Copy-Paste for AI Voice Generator)
*Copy and paste the text below directly into your AI Voice Generator.*

> "Welcome to CommunityPulse AI, the EcoBin edition. This is a Decision Intelligence Platform built for smart city waste management, specifically localized for Chandrapur, Maharashtra, India.
> 
> Here on the live operations board, we see our real-time smart bin sensor grid. The map displays active bins color-coded by their current fill rates: green for stable, yellow for warning, and red for critical overflows. 
> 
> To minimize transit distance, we trigger the NVIDIA RAPIDS Route Optimizer. This Euclidean traveling salesperson solver calculates the most efficient route for collection trucks, targeting both full bins and active citizen complaints. By moving telemetry processing to GPU using cuDF, we achieve a massive twenty-nine times speedup compared to standard CPU Pandas.
> 
> Next, let’s look at our AI Forecasting Engine. By selecting a smart bin, the platform fits a linear regression trend and factors in diurnal market patterns to predict fill rates twenty-four hours in advance, recommending proactive collections before an overflow occurs.
> 
> In the Citizen Portal, residents can easily file reports with photos. When a picture is uploaded, the OpenAI Vision API validates the waste, classifies it into categories like recyclable or hazardous, rates its safety risk, and places a live pin on the operations map. 
> 
> Finally, we have the Decision Chatbot. City planners can write natural language queries to analyze operations, draft reports, and plan daily schedules. Empowered by Google Cloud BigQuery telemetry feeds, the AI provides real-time, actionable insights for cleaner and smarter communities. Thank you."

---

## Option 2: Storyboard Guide (Visual Action + Voiceover)
*Use this guide to align the audio voiceover with the visual sections of your video.*

| Step | Visual On-Screen Action | Narration Voiceover Text |
| :--- | :--- | :--- |
| **1** | Open `http://localhost:3000/`. Show the dark-themed dashboard, metrics cards, and leaflet map of Chandrapur. | "Welcome to CommunityPulse AI, the EcoBin edition. This is a Decision Intelligence Platform built for smart city waste management, specifically localized for Chandrapur, Maharashtra, India." |
| **2** | Point to the metrics cards at the top and hover over green/yellow/red circles on the map. | "Here on the live operations board, we see our real-time smart bin sensor grid. The map displays active bins color-coded by their current fill rates: green for stable, yellow for warning, and red for critical overflows." |
| **3** | Click the **"Optimize Collection Route"** button. Watch the path line draw on the map and benchmark stats appear. | "To minimize transit distance, we trigger the NVIDIA RAPIDS Route Optimizer. This Euclidean traveling salesperson solver calculates the most efficient route for collection trucks, targeting both full bins and active citizen complaints. By moving telemetry processing to GPU using cuDF, we achieve a massive twenty-nine times speedup compared to standard CPU Pandas." |
| **4** | Select a smart bin from the dropdown to load the cyan Area Chart prediction. | "Next, let’s look at our AI Forecasting Engine. By selecting a smart bin, the platform fits a linear regression trend and factors in diurnal market patterns to predict fill rates twenty-four hours in advance, recommending proactive collections before an overflow occurs." |
| **5** | Switch to the **Citizen Portal** tab. Fill the description, choose a location, and submit the ticket to see the classification card. | "In the Citizen Portal, residents can easily file reports with photos. When a picture is uploaded, the OpenAI Vision API validates the waste, classifies it into categories like recyclable or hazardous, rates its safety risk, and places a live pin on the operations map." |
| **6** | Switch to the **Decision Chat** tab. Ask a question and display the RAG response, then export the logs. | "Finally, we have the Decision Chatbot. City planners can write natural language queries to analyze operations, draft reports, and plan daily schedules. Empowered by Google Cloud BigQuery telemetry feeds, the AI provides real-time, actionable insights for cleaner and smarter communities. Thank you." |
