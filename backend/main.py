import os
import json
import smtplib
import csv
import io

from fastapi.middleware.cors import CORSMiddleware
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import FastAPI, HTTPException, Response
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

GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")

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


# =========================
# FASTAPI
# =========================

app = FastAPI(
    title="AI CRM Agent",
    description="AI-powered lead qualification and communication system",
    version="1.0.0"
)

FRONTEND_URL = os.getenv("FRONTEND_URL", "").rstrip("/")
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "https://frontend-six-rose-93.vercel.app",  # your deployed frontend
]
if FRONTEND_URL and FRONTEND_URL not in allowed_origins:
    allowed_origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app|http://(localhost|127\.0\.0\.1):[0-9]+",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
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

class LeadStatusUpdate(BaseModel):
    contact_status: str

class AdminLoginRequest(BaseModel):
    email: str
    password: str

class BatchStatusUpdate(BaseModel):
    lead_ids: list[str]
    contact_status: str

class BatchDeleteRequest(BaseModel):
    lead_ids: list[str]

class LeadUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    company: str | None = None
    message: str | None = None
    contact_status: str | None = None
    priority: str | None = None
    ai_score: int | None = None
    ai_response: str | None = None
    intent: str | None = None
    is_spam: bool | None = None
    should_contact: bool | None = None

class TestEmailRequest(BaseModel):
    target_email: EmailStr

# =========================
# ADMIN AUTHENTICATION
# =========================

@app.post("/auth/login")
def admin_login(credentials: AdminLoginRequest):
    # 1. Try Supabase Native Auth (supabase.auth.sign_in_with_password)
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        if auth_response and auth_response.user and auth_response.session:
            user = auth_response.user
            session = auth_response.session
            user_name = user.email.split("@")[0].title()
            if user.user_metadata and "name" in user.user_metadata:
                user_name = user.user_metadata["name"]
                
            return {
                "success": True,
                "message": "Supabase Native Auth successful",
                "token": session.access_token,
                "user": {
                    "email": user.email,
                    "role": getattr(user, "role", "admin") or "admin",
                    "name": user_name
                }
            }
    except Exception as e:
        print("Supabase Native Auth check exception:", e)

    # 2. Query Supabase 'admin_users' table
    try:
        response = supabase.table("admin_users").select("*").eq("email", credentials.email).eq("password", credentials.password).execute()
        if response.data and len(response.data) > 0:
            db_user = response.data[0]
            return {
                "success": True,
                "message": "Authentication successful",
                "token": f"admin_session_token_{db_user.get('id', 'crm_2026')}",
                "user": {
                    "email": db_user.get("email"),
                    "role": db_user.get("role", "admin"),
                    "name": db_user.get("name", "Admin User")
                }
            }
    except Exception as e:
        print("Supabase admin_users check error:", e)

    # If credentials are not valid in Supabase Auth or admin_users table:
    raise HTTPException(
        status_code=401,
        detail="Invalid admin email or password"
    )

@app.post("/auth/verify")
def verify_token(data: dict):
    token = data.get("token")
    if token and (token.startswith("admin_session_token") or len(token) > 20):
        return {
            "valid": True,
            "user": {
                "role": "admin"
            }
        }
    return {
        "valid": False
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
        msg = MIMEMultipart("alternative")

        msg["Subject"] = "Thank you for contacting us"
        msg["From"] = GMAIL_ADDRESS
        msg["To"] = email

        html = f"""
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

        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(
                GMAIL_ADDRESS,
                GMAIL_APP_PASSWORD
            )
            server.sendmail(
                GMAIL_ADDRESS,
                email,
                msg.as_string()
            )

        print("Email sent successfully to:", email)

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
    try:
        data = {
            "name": lead.name,
            "email": str(lead.email),
            "phone": lead.phone,
            "company": lead.company,
            "message": lead.message
        }

        # Save lead
        response = supabase.table("leads").insert(data).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to insert lead into Supabase")

        created_lead = response.data[0]

        # Process immediately
        result = process_lead(created_lead)

        return {
            "message": "Lead created successfully",
            **result
        }
    except Exception as e:
        error_msg = str(e)
        if "row-level security" in error_msg.lower() or "42501" in error_msg:
            raise HTTPException(
                status_code=403,
                detail="Supabase RLS policy blocked lead insertion. Disable RLS or use service_role key."
            )
        raise HTTPException(status_code=500, detail=error_msg)


# =========================
# GET ALL LEADS
# =========================

@app.get("/leads")
def get_leads():
    try:
        response = supabase.table("leads").select("*").order("created_at", desc=True).execute()
        leads_list = response.data or []
        return {
            "count": len(leads_list),
            "leads": leads_list
        }
    except Exception as e:
        import traceback
        print("Error fetching leads from Supabase:", e)
        traceback.print_exc()
        return {
            "count": 0,
            "leads": [],
            "error_detail": str(e)
        }


# =========================
# EXPORT LEADS TO CSV
# =========================

@app.get("/leads/export")
def export_leads_csv():
    response = supabase.table("leads").select("*").order("created_at", desc=True).execute()
    leads = response.data or []

    output = io.StringIO()
    writer = csv.writer(output)

    # Header row
    writer.writerow([
        "ID", "Name", "Email", "Phone", "Company", "Contact Status",
        "AI Score", "Priority", "Is Spam", "Should Contact", "Intent",
        "Created At"
    ])

    for lead in leads:
        writer.writerow([
            lead.get("id", ""),
            lead.get("name", ""),
            lead.get("email", ""),
            lead.get("phone", ""),
            lead.get("company", ""),
            lead.get("contact_status", ""),
            lead.get("ai_score", ""),
            lead.get("priority", ""),
            lead.get("is_spam", ""),
            lead.get("should_contact", ""),
            lead.get("intent", ""),
            lead.get("created_at", "")
        ])

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=leads_export.csv"
        }
    )


# =========================
# GET SINGLE LEAD
# =========================

@app.get("/leads/{lead_id}")
def get_lead_by_id(lead_id: str):
    response = supabase.table("leads").select("*").eq("id", lead_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"lead": response.data[0]}


# =========================
# UPDATE / EDIT LEAD
# =========================

@app.put("/leads/{lead_id}")
def update_lead(lead_id: str, data: LeadUpdate):
    update_fields = {k: v for k, v in data.model_dump().items() if v is not None}
    if "email" in update_fields:
        update_fields["email"] = str(update_fields["email"])
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    response = supabase.table("leads").update(update_fields).eq("id", lead_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Lead not found or update failed")

    return {
        "success": True,
        "message": "Lead updated successfully",
        "lead": response.data[0]
    }


# =========================
# DELETE LEAD
# =========================

@app.delete("/leads/{lead_id}")
def delete_lead(lead_id: str):
    response = supabase.table("leads").delete().eq("id", lead_id).execute()
    return {
        "success": True,
        "message": "Lead deleted successfully",
        "deleted_id": lead_id
    }


# =========================
# BATCH DELETE LEADS
# =========================

@app.post("/leads/batch-delete")
def batch_delete_leads(data: BatchDeleteRequest):
    if not data.lead_ids:
        return {"success": True, "deleted_count": 0}

    response = supabase.table("leads").delete().in_("id", data.lead_ids).execute()
    return {
        "success": True,
        "message": f"Deleted {len(response.data or [])} leads",
        "deleted_count": len(response.data or [])
    }



# =========================
# MANUALLY QUALIFY LEAD
# =========================

@app.post("/leads/{lead_id}/qualify")
def qualify_lead_endpoint(lead_id: str):
    response = supabase.table("leads").select("*").eq("id", lead_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead = response.data[0]
    result = process_lead(lead)

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


@app.patch("/leads/{lead_id}/status")
def update_lead_status(
    lead_id: str,
    status: LeadStatusUpdate
):

    allowed_statuses = [
        "pending",
        "qualified",
        "contacted",
        "rejected"
    ]

    if status.contact_status not in allowed_statuses:
        return {
            "success": False,
            "message": "Invalid contact status"
        }

    response = supabase.table(
        "leads"
    ).update({
        "contact_status": status.contact_status
    }).eq(
        "id",
        lead_id
    ).execute()

    if not response.data:
        return {
            "success": False,
            "message": "Lead not found"
        }

    return {
        "success": True,
        "message": "Lead status updated",
        "lead": response.data[0]
    }


# =========================
# BATCH UPDATE LEAD STATUS
# =========================

@app.post("/leads/batch-status")
def batch_update_lead_status(data: BatchStatusUpdate):
    allowed_statuses = ["pending", "qualified", "contacted", "rejected"]
    if data.contact_status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Invalid contact status")
    
    if not data.lead_ids:
        return {"success": True, "updated_count": 0}

    response = supabase.table("leads").update({
        "contact_status": data.contact_status
    }).in_("id", data.lead_ids).execute()

    return {
        "success": True,
        "message": f"Updated {len(response.data or [])} leads",
        "updated_count": len(response.data or [])
    }


# (Export route moved above /leads/{lead_id} to fix FastAPI routing conflict)


# =========================
# TEST EMAIL SMTP
# =========================

@app.post("/admin/test-email")
def test_email_smtp(req: TestEmailRequest):
    if not GMAIL_ADDRESS or not GMAIL_APP_PASSWORD:
        return {
            "success": False,
            "message": "Gmail credentials not configured in backend environment."
        }
    
    sent = send_lead_response(
        email=req.target_email,
        name="Admin Test",
        message="This is a test email sent from your AI CRM Agent to verify SMTP configuration."
    )

    if sent:
        return {"success": True, "message": f"Test email sent successfully to {req.target_email}"}
    else:
        return {"success": False, "message": "Failed to send test email. Check server logs."}