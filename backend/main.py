import os
import json
import resend

from fastapi import FastAPI
from google import genai
from dotenv import load_dotenv
from supabase import create_client, Client
from pydantic import BaseModel, EmailStr


# =========================
# LOAD ENVIRONMENT VARIABLES
# =========================

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

RESEND_API_KEY = os.getenv("RESEND_API_KEY")


# =========================
# CLIENT SETUP
# =========================

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)

client = genai.Client(
    api_key=GEMINI_API_KEY
)

resend.api_key = RESEND_API_KEY


# =========================
# FASTAPI
# =========================

app = FastAPI(
    title="AI CRM Agent",
    description="AI-powered lead qualification and communication system",
    version="1.0.0"
)


# =========================
# REQUEST MODEL
# =========================

class LeadCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    company: str | None = None
    message: str


# =========================
# AI LEAD QUALIFICATION
# =========================

def qualify_lead(lead):

    prompt = f"""
You are an AI sales lead qualification assistant.

Analyze this lead:

Name: {lead["name"]}
Email: {lead["email"]}
Phone: {lead.get("phone")}
Company: {lead.get("company")}
Message: {lead["message"]}

Your job is to determine whether this is a genuine business lead
and whether the company should contact the person.

Determine:

1. Whether the lead is legitimate or spam.
2. Lead score from 0 to 100.
3. Priority: low, medium, or high.
4. A short explanation for the score.
5. The main reason the person contacted the company.
6. Whether the company should contact this lead.
7. If the lead is genuine and relevant, write a short helpful
   professional response.
8. If the lead is spam, do not write a sales response.
9. If the lead is genuine but too vague or irrelevant, do not
   recommend contacting them.
10. Do not invent pricing, features, timelines, guarantees,
    company information, or other facts that were not provided.

Rules for should_contact:

- true = genuine and relevant potential customer
- false = spam, suspicious, irrelevant, or too vague

Rules for priority:

- high = strong buying intent or clear business requirement
- medium = genuine potential customer but less immediate intent
- low = weak, vague, or low-value inquiry

Return ONLY valid JSON.

The JSON must have exactly these fields:

{{
    "is_spam": false,
    "score": 0,
    "priority": "low",
    "reason": "short explanation",
    "intent": "main reason for contacting",
    "should_contact": false,
    "response": "short professional response"
}}

If should_contact is false, the response should say:

"No response should be sent."
"""

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt
    )

    raw_result = response.text.strip()

    # Remove markdown code fences if Gemini returns them
    if raw_result.startswith("```"):
        raw_result = raw_result.replace("```json", "")
        raw_result = raw_result.replace("```", "")
        raw_result = raw_result.strip()

    return json.loads(raw_result)


# =========================
# SEND EMAIL
# =========================

def send_lead_response(email, name, message):

    try:

        resend.Emails.send({
            "from": "AI CRM <onboarding@resend.dev>",
            "to": [email],
            "subject": "Thank you for contacting us",
            "html": f"""
            <html>
                <body>

                    <p>Hi {name},</p>

                    <p>{message}</p>

                    <p>
                        Best regards,<br>
                        AI CRM Team
                    </p>

                </body>
            </html>
            """
        })

        return True

    except Exception as e:

        print("Email sending failed:", e)

        return False


# =========================
# PROCESS LEAD
# =========================

def process_lead(lead):

    try:

        # -------------------------
        # 1. AI qualification
        # -------------------------

        result = qualify_lead(lead)

        # -------------------------
        # 2. Prepare AI data
        # -------------------------

        update_data = {
            "ai_score": result["score"],
            "priority": result["priority"],
            "is_spam": result["is_spam"],
            "should_contact": result["should_contact"],
            "intent": result["intent"],
            "ai_response": result["response"],
            "ai_analysis": result,
            "contact_status": (
                "qualified"
                if result["should_contact"]
                else "rejected"
            )
        }

        # -------------------------
        # 3. Update Supabase
        # -------------------------

        supabase.table("leads").update(
            update_data
        ).eq(
            "id",
            lead["id"]
        ).execute()

        # -------------------------
        # 4. Send email
        # -------------------------

        email_sent = lead.get("email_sent", False)

        if result["should_contact"] and not email_sent:

            email_sent = send_lead_response(
                lead["email"],
                lead["name"],
                result["response"]
            )

        # -------------------------
        # 5. Save email status
        # -------------------------

        supabase.table("leads").update({
            "email_sent": email_sent
        }).eq(
            "id",
            lead["id"]
        ).execute()

        # -------------------------
        # 6. Update contact status
        # -------------------------

        if result["should_contact"]:

            if email_sent:

                supabase.table("leads").update({
                    "contact_status": "contacted"
                }).eq(
                    "id",
                    lead["id"]
                ).execute()

            else:

                supabase.table("leads").update({
                    "contact_status": "qualified"
                }).eq(
                    "id",
                    lead["id"]
                ).execute()

        # -------------------------
        # 7. Return result
        # -------------------------

        return {
            "success": True,
            "lead_id": lead["id"],
            "ai_result": result,
            "email_sent": email_sent
        }

    except Exception as e:

        print("Lead processing failed:", e)

        return {
            "success": False,
            "lead_id": lead.get("id"),
            "error": str(e)
        }


# =========================
# ROOT
# =========================

@app.get("/")
def root():

    return {
        "message": "AI CRM Backend is running"
    }


# =========================
# CREATE LEAD
# =========================

@app.post("/leads")
def create_lead(lead: LeadCreate):

    data = {
        "name": lead.name,
        "email": str(lead.email),
        "phone": lead.phone,
        "company": lead.company,
        "message": lead.message
    }

    # Save lead
    response = supabase.table(
        "leads"
    ).insert(data).execute()

    created_lead = response.data[0]

    return {
        "message": "Lead created successfully",
        "lead_id": created_lead["id"]
    }


# =========================
# GET ALL LEADS
# =========================

@app.get("/leads")
def get_leads():

    response = supabase.table(
        "leads"
    ).select("*").order(
        "created_at",
        desc=True
    ).execute()

    return {
        "count": len(response.data),
        "leads": response.data
    }


# =========================
# MANUALLY QUALIFY LEAD
# =========================

@app.post("/leads/{lead_id}/qualify")
def qualify_lead_endpoint(lead_id: str):

    response = supabase.table(
        "leads"
    ).select("*").eq(
        "id",
        lead_id
    ).single().execute()

    lead = response.data

    if not lead:

        return {
            "error": "Lead not found"
        }

    result = process_lead(
        lead
    )

    return {
        "message": "Lead qualified successfully",
        **result
    }


# =========================
# SUPABASE WEBHOOK
# =========================

@app.post("/webhooks/lead-created")
def lead_created_webhook(data: dict):

    lead = data.get("record")

    if not lead:
        return {
            "success": False,
            "message": "No lead data received"
        }

    # Process the new lead with AI
    result = process_lead(lead)

    return {
        "success": True,
        "message": "Lead processed successfully",
        **result
    }


# =========================
# LIST GEMINI MODELS
# =========================

@app.get("/models")
def list_models():

    models = client.models.list()

    return {
        "models": [
            model.name
            for model in models
            if "generateContent"
            in (model.supported_actions or [])
        ]
    }