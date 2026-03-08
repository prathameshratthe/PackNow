"""OTP Service — Generates and logs OTPs server-side (completely free, no third-party services)."""
import logging

logger = logging.getLogger(__name__)


class OTPNotificationService:
    """
    Free OTP notification service.
    OTPs are generated server-side and delivered to users via the API response / in-app display.
    No SMS charges — all OTP delivery happens within the application itself.
    """

    def notify(self, to_phone: str, message: str) -> bool:
        """
        Log the OTP notification (for server-side audit trail).
        The actual OTP is delivered to the user via the API response, not SMS.
        """
        logger.info(f"\n{'='*50}\n[OTP NOTIFICATION] To: {to_phone}\nMessage: {message}\n{'='*50}\n")
        print(f"📱 [OTP] To: {to_phone} | {message}")
        return True


# Singleton instance
otp_service = OTPNotificationService()
