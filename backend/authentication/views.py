"""
Views for authentication.
"""
from authentication import models
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import authenticate, get_user_model
from django.conf import settings
from django.shortcuts import redirect
from django.db.models import Sum
import logging

from .serializers import (
    UserSerializer, 
    RegisterSerializer, 
    LoginSerializer,
    ChangePasswordSerializer,
    UpdateProfileSerializer
)
from .models import EmailVerificationToken
from .email_service import send_verification_email, send_welcome_email

User = get_user_model()
logger = logging.getLogger(__name__)


def get_tokens_for_user(user):
    """Generate JWT tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class RegisterView(generics.CreateAPIView):
    """User registration endpoint - sends verification email."""
    
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate verification token
        token = EmailVerificationToken.generate_token(user)
        
        # Send verification email
        email_sent = send_verification_email(user, token)
        
        # Log the code for development (useful when email isn't configured)
        logger.info(f"[DEV] Verification code for {user.email}: {token.token}")
        
        return Response({
            'success': True,
            'message': 'Registration successful! Please check your email for verification code.',
            'requires_verification': True,
            'email': user.email,
            'email_sent': email_sent
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """User login endpoint."""
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        user = authenticate(request, email=email, password=password)
        
        if user is None:
            return Response({
                'success':  False,
                'message': 'Invalid email or password'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        if not user.is_active:
            return Response({
                'success': False,
                'message': 'Account is disabled'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check if email is verified (skip for OAuth users)
        if user.provider == 'local' and not user.is_email_verified:
            # Generate new verification token
            token = EmailVerificationToken.generate_token(user)
            send_verification_email(user, token)
            logger.info(f"[DEV] Verification code for {user.email}: {token.token}")
            
            return Response({
                'success': False,
                'message': 'Please verify your email before logging in. A new verification code has been sent.',
                'requires_verification': True,
                'email': user.email
            }, status=status.HTTP_200_OK)
        
        tokens = get_tokens_for_user(user)
        
        return Response({
            'success': True,
            'message': 'Login successful',
            'user': UserSerializer(user).data,
            'tokens': tokens
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """User logout endpoint."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response({
                'success': True,
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)
        except TokenError:
            return Response({
                'success': True,
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)


class VerifyEmailView(APIView):
    """Verify email with 6-digit code."""
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        
        logger.info(f"Verification attempt: Email={email}, Code={code}")
        
        if not email or not code:
            return Response({
                'success': False,
                'message': 'Email and verification code are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if already verified
        if user.is_email_verified:
            tokens = get_tokens_for_user(user)
            return Response({
                'success': True,
                'message': 'Email already verified',
                'user': UserSerializer(user).data,
                'tokens': tokens
            }, status=status.HTTP_200_OK)
        
        # Find valid token
        try:
            token = EmailVerificationToken.objects.get(
                user=user,
                token=code,
                is_used=False
            )
        except EmailVerificationToken.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Invalid verification code'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if expired
        if token.is_expired:
            return Response({
                'success': False,
                'message': 'Verification code has expired. Please request a new one.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Mark token as used and verify user
        token.is_used = True
        token.save()
        
        user.is_email_verified = True
        user.save()
        
        # Send welcome email
        send_welcome_email(user)
        
        # Generate tokens for auto-login
        tokens = get_tokens_for_user(user)
        
        return Response({
            'success': True,
            'message': 'Email verified successfully! Welcome to ByteForge AI.',
            'user': UserSerializer(user).data,
            'tokens': tokens
        }, status=status.HTTP_200_OK)


class ResendVerificationView(APIView):
    """Resend verification code to email."""
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response({
                'success': False,
                'message': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal if user exists
            return Response({
                'success': True,
                'message': 'If an account exists with this email, a verification code will be sent.'
            }, status=status.HTTP_200_OK)
        
        if user.is_email_verified:
            return Response({
                'success': False,
                'message': 'Email is already verified'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate new token
        token = EmailVerificationToken.generate_token(user)
        email_sent = send_verification_email(user, token)
        
        logger.info(f"[DEV] Verification code for {user.email}: {token.token}")
        
        return Response({
            'success': True,
            'message': 'Verification code sent to your email.',
            'email_sent': email_sent
        }, status=status.HTTP_200_OK)


class UserProfileView(APIView):
    """Get and update user profile."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get current user profile."""
        serializer = UserSerializer(request.user)
        return Response({
            'success':  True,
            'user': serializer.data
        }, status=status.HTTP_200_OK)
    
    def put(self, request):
        """Update user profile."""
        serializer = UpdateProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'success': True,
            'message': 'Profile updated successfully',
            'user':  UserSerializer(request.user).data
        }, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    """Change user password."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({
                'success': False,
                'message': 'Current password is incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({
            'success': True,
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)


class AdminStatsView(APIView):
    """Admin statistics endpoint."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        if not user.is_admin and user.email != settings.ADMIN_EMAIL:
            return Response({
                'success': False,
                'message': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        from chat.models import Conversation, Message
        from payments.models import Payment
        
        total_users = User.objects.count()
        total_conversations = Conversation.objects.count()
        total_tokens_used = Conversation.objects.aggregate(
            total=Sum('total_tokens_used')
        )['total'] or 0
        
        latest_payments = Payment.objects.select_related('user', 'conversation').order_by(
            '-created_at'
        )[:10]
        
        from payments.serializers import PaymentSerializer
        
        return Response({
            'success': True,
            'stats': {
                'total_users': total_users,
                'total_conversations':  total_conversations,
                'total_tokens_used': total_tokens_used,
            },
            'latest_payments': PaymentSerializer(latest_payments, many=True).data
        }, status=status.HTTP_200_OK)



class OAuthCallbackView(APIView):
    """Handle OAuth callback and return JWT tokens."""
    
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Handle OAuth callback."""
        token = request.GET.get('token')
        
        if token:
            return Response({
                'success': True,
                'token': token
            }, status=status.HTTP_200_OK)
        
        return Response({
            'success': False,
            'message': 'OAuth authentication failed'
        }, status=status.HTTP_400_BAD_REQUEST)


class SocialAuthSuccessView(APIView):
    """
    Handle social auth success redirect.
    Reads tokens from session (set by pipeline) and redirects to frontend with tokens in URL.
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        access_token = request.session.get('jwt_access_token')
        refresh_token = request.session.get('jwt_refresh_token')
        
        # Clear tokens from session
        if 'jwt_access_token' in request.session:
            del request.session['jwt_access_token']
        if 'jwt_refresh_token' in request.session:
            del request.session['jwt_refresh_token']
            
        base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')

        if access_token and refresh_token:
            return redirect(f"{base_url}/oauth/callback?access_token={access_token}&refresh_token={refresh_token}")
        
        return redirect(f"{base_url}/oauth/callback?error=Authentication Failed")
