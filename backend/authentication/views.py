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

from .serializers import (
    UserSerializer, 
    RegisterSerializer, 
    LoginSerializer,
    ChangePasswordSerializer,
    UpdateProfileSerializer
)

User = get_user_model()


def get_tokens_for_user(user):
    """Generate JWT tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class RegisterView(generics.CreateAPIView):
    """User registration endpoint."""
    
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        tokens = get_tokens_for_user(user)
        
        return Response({
            'success': True,
            'message': 'Registration successful',
            'user': UserSerializer(user).data,
            'tokens':  tokens
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
            
        frontend_url = settings.SOCIAL_AUTH_LOGIN_REDIRECT_URL.split('/oauth/callback')[0]
        # Or just use the env variable directly if we trust it, but settings is safer if consistent.
        # Actually in settings.py: SOCIAL_AUTH_LOGIN_REDIRECT_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000') + '/oauth/callback'
        # So we can construct the base URL.
        
        base_url = 'http://localhost:3000' # Fallback
        if hasattr(settings, 'SOCIAL_AUTH_LOGIN_REDIRECT_URL'):
             # Try to extract base if possible, or just use localhost:3000
             # Better: use os.getenv('FRONTEND_URL', 'http://localhost:3000')
             import os
             base_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')

        if access_token and refresh_token:
            return redirect(f"{base_url}/oauth/callback?access_token={access_token}&refresh_token={refresh_token}")
        
        return redirect(f"{base_url}/oauth/callback?error=Authentication Failed")
