# AI Security Analyzer

A simple AI-powered tool to analyze websites or code for security issues.

---

## Project Overview

The **AI Security Analyzer** allows a user to input:

- A **website URL** (e.g., `https://example.com`)  
- Or a **code snippet** (HTML, JavaScript, etc.)

The system then:

1. Fetches the page or reads the pasted code  
2. Sends the content to a **Cloudflare AI model** for analysis  
3. Returns a structured security report including:

   - Threat score (0–100)  
   - List of potential security issues  
   - Suggested Cloudflare firewall rule  

All results are stored in a **Durable Object** for persistent state and historical reference.

---

## Access the Project

You can access the live project via: https://cf-ai-security-analyzer.krishgupta497.workers.dev/?input=<YOUR_LINK_OR_CODE>
