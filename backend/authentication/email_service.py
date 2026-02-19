"""
Email service for sending verification emails.
"""
import logging
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def send_verification_email(user, token):
    """Send email verification code to user."""
    subject = 'ByteForge AI - Verify Your Email'
    
    # Plain text message
    message = f"""
Hello {user.display_name or 'there'},

Welcome to ByteForge AI! Please verify your email address by entering the following code:

    {token.token}

This code will expire in 15 minutes.

If you did not create an account, please ignore this email.

Best regards,
ByteForge AI Team
"""
    
    # HTML message for better formatting
    html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #e2e8f0; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 40px; background-color: #1e293b; border-radius: 16px; }}
        .header {{ text-align: center; margin-bottom: 30px; }}
        .logo {{ font-size: 28px; font-weight: bold; color: #06b6d4; }}
        .code-box {{ background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); color: white; font-size: 36px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px 40px; border-radius: 12px; margin: 30px 0; }}
        .message {{ color: #94a3b8; line-height: 1.6; }}
        .footer {{ margin-top: 40px; text-align: center; color: #64748b; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">⚡ ByteForge AI</div>
        </div>
        <p class="message">Hello {user.display_name or 'there'},</p>
        <p class="message">Welcome to ByteForge AI! Please verify your email address by entering the following code:</p>
        <div class="code-box">{token.token}</div>
        <p class="message">This code will expire in <strong>15 minutes</strong>.</p>
        <p class="message">If you did not create an account, please ignore this email.</p>
        <div class="footer">
            <p>&copy; 2026 ByteForge AI. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@byteforge.ai',
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Verification email sent to {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send verification email to {user.email}: {e}")
        # For development: log the code so testing is possible without email setup
        logger.info(f"[DEV] Verification code for {user.email}: {token.token}")
        return False


def send_welcome_email(user):
    """Send welcome email after successful verification."""
    subject = 'Welcome to ByteForge AI!'
    
    message = f"""
Hello {user.display_name or 'there'},

Your email has been verified successfully! Welcome to ByteForge AI.

You now have full access to:
- Multiple AI models (GPT-4, Claude 3, Gemini)
- Unlimited conversations
- Code generation and analysis
- And much more!

Get started by visiting: {settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else 'http://localhost:3000'}/chat

Best regards,
ByteForge AI Team
"""
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@byteforge.ai',
            recipient_list=[user.email],
            fail_silently=True,
        )
        logger.info(f"Welcome email sent to {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send welcome email to {user.email}: {e}")
        return False
