import logging
from twilio.rest import Client
from core.config import settings

logger = logging.getLogger(__name__)

class SMSService:
    def __init__(self):
        self.is_configured = bool(
            settings.TWILIO_ACCOUNT_SID and 
            settings.TWILIO_AUTH_TOKEN and 
            settings.TWILIO_PHONE_NUMBER
        )
        
        if self.is_configured:
            self.client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            self.from_number = settings.TWILIO_PHONE_NUMBER
        else:
            logger.warning("Twilio is not configured. SMS will be simulated via console logs.")

    def send_sms(self, to_phone: str, message: str) -> bool:
        """
        Send an SMS message to a specific phone number.
        Returns True if sent successfully (or simulated), False otherwise.
        """
        # Always simulate in log for debugging
        logger.info(f"\n{'='*50}\n[SMS SIMULATION] To: {to_phone}\nMessage: {message}\n{'='*50}\n")
        
        if not self.is_configured:
            return True
            
        try:
            # Ensure number is in E.164 format (dumb check, usually client handles formatting)
            if not to_phone.startswith('+'):
                to_phone = f"+{to_phone}"
                
            msg = self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=to_phone
            )
            logger.info(f"Twilio SMS sent successfully. SID: {msg.sid}")
            return True
        except Exception as e:
            logger.error(f"Failed to send Twilio SMS: {e}")
            return False

sms_service = SMSService()
