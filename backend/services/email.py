"""Email Service — Uses Resend to send free transaction emails."""
import logging
import resend
from core.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.is_configured = bool(settings.RESEND_API_KEY)
        if self.is_configured:
            resend.api_key = settings.RESEND_API_KEY
            self.from_email = "onboarding@resend.dev" # Free testing domain
        else:
            logger.warning("RESEND_API_KEY is not configured. Emails will only be printed to console.")

    def send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """
        Send an email message. Returns True if successful, False otherwise.
        """
        logger.info(f"\n{'='*50}\n[EMAIL SIMULATION] To: {to_email}\nSubject: {subject}\nHTML: {html_content}\n{'='*50}\n")
        
        if not self.is_configured:
            return True
            
        try:
            params: resend.Emails.SendParams = {
                "from": f"PackNow <{self.from_email}>",
                "to": [to_email],
                "subject": subject,
                "html": html_content,
            }
            email_response = resend.Emails.send(params)
            logger.info(f"Resend Email sent successfully. ID: {email_response.get('id')}")
            return True
        except Exception as e:
            logger.error(f"Failed to send Resend Email: {e}")
            return False

email_service = EmailService()
